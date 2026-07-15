import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { Readable } from 'node:stream'

import {
  CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES,
  inspectCanonicalPrivateAudioArtifact,
  persistCanonicalPrivateAudioArtifactStream,
  readCanonicalPrivateAudioArtifact,
} from '../services/canonical-private-audio-artifact-storage'

const localStorageRoot =
  `/tmp/reeditpro-canonical-private-audio-streaming-output-${process.pid}`
const dataByteLength = 9 * 1024 * 1024
const byteLength = 44 + dataByteLength
const identity = sha256Text('canonical-private-large-pcm-wave-stream-v1')
const rejectedIdentity = sha256Text('canonical-private-rejected-pcm-wave-stream-v1')

await rm(localStorageRoot, { recursive: true, force: true })
try {
  assert.equal(dataByteLength % 4, 0)
  assert.ok(byteLength > 8 * 1024 * 1024)
  assert.ok(byteLength <= CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES)
  const commitment = waveCommitment(dataByteLength, 17)
  const alternateCommitment = waveCommitment(dataByteLength, 29)

  const created = await persistCanonicalPrivateAudioArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: identity,
    stream: waveStream(dataByteLength, 17),
    expectedByteLength: commitment.byteLength,
    expectedSha256: commitment.sha256,
  })
  assert.deepEqual(created, {
    byteLength,
    sha256: commitment.sha256,
    replayed: false,
  })

  await assert.rejects(readCanonicalPrivateAudioArtifact({
    localStorageRoot,
    privateObjectIdentityHash: identity,
  }), /require the streaming reader/)
  const inspected = await inspectCanonicalPrivateAudioArtifact({
    localStorageRoot,
    privateObjectIdentityHash: identity,
  })
  assert.ok(inspected)
  assert.equal(inspected.byteLength, byteLength)
  assert.equal(inspected.sha256, commitment.sha256)
  assert.equal(inspected.sampleRate, 48_000)
  assert.equal(inspected.channels, 2)
  assert.equal(inspected.bitsPerSample, 16)
  assert.equal(inspected.sampleFrameCount, dataByteLength / 4)
  assert.equal(inspected.durationSeconds, dataByteLength / 4 / 48_000)
  assert.deepEqual(await hashStream(await inspected.openStream()), commitment)

  const replayed = await persistCanonicalPrivateAudioArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: identity,
    stream: waveStream(dataByteLength, 17),
    expectedByteLength: commitment.byteLength,
    expectedSha256: commitment.sha256,
  })
  assert.deepEqual(replayed, {
    byteLength,
    sha256: commitment.sha256,
    replayed: true,
  })

  await assert.rejects(persistCanonicalPrivateAudioArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: identity,
    stream: waveStream(dataByteLength, 29),
    expectedByteLength: alternateCommitment.byteLength,
    expectedSha256: alternateCommitment.sha256,
  }), /collides with a different immutable artifact/)
  assert.equal((await inspectCanonicalPrivateAudioArtifact({
    localStorageRoot,
    privateObjectIdentityHash: identity,
  }))?.sha256, commitment.sha256)

  await assert.rejects(persistCanonicalPrivateAudioArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: rejectedIdentity,
    stream: waveStream(dataByteLength, 17),
    expectedByteLength: alternateCommitment.byteLength,
    expectedSha256: alternateCommitment.sha256,
  }), /failed its exact PCM WAV commitment/)
  assert.equal(await inspectCanonicalPrivateAudioArtifact({
    localStorageRoot,
    privateObjectIdentityHash: rejectedIdentity,
  }), undefined)

  console.log(JSON.stringify({
    smoke: 'canonical_private_audio_streaming_output',
    status: 'passed',
    byteLength,
    sha256: commitment.sha256,
    durationSeconds: dataByteLength / 4 / 48_000,
    formerBufferedStorageCeilingBytes: 8 * 1024 * 1024,
    formerFinalCompositionVoiceCeilingBytes: 2 * 1024 * 1024,
    streamingCeilingBytes: CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES,
    checks: [
      'over_8mib_pcm_wave_stream_committed_create_only',
      'large_buffered_reader_failed_closed',
      'no_follow_stream_reopen_hash_header_and_sample_count_verified',
      'exact_stream_replay_verified_without_replacement',
      'immutable_identity_collision_rejected',
      'checksum_mismatch_left_no_poisoned_target',
    ],
  }))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

function waveCommitment(
  payloadByteLength: number,
  variant: number,
): { byteLength: number; sha256: string } {
  const checksum = createHash('sha256')
  let observed = 0
  for (const chunk of waveChunks(payloadByteLength, variant)) {
    observed += chunk.byteLength
    checksum.update(chunk)
  }
  return { byteLength: observed, sha256: checksum.digest('hex') }
}

function waveStream(payloadByteLength: number, variant: number): Readable {
  return Readable.from(waveChunks(payloadByteLength, variant))
}

function* waveChunks(payloadByteLength: number, variant: number): Generator<Buffer> {
  yield waveHeader(payloadByteLength)
  const maximumChunkBytes = 1024 * 1024
  let offset = 0
  let index = 0
  while (offset < payloadByteLength) {
    const chunk = Buffer.alloc(
      Math.min(maximumChunkBytes, payloadByteLength - offset),
      (variant + index * 13) % 256,
    )
    yield chunk
    offset += chunk.byteLength
    index += 1
  }
}

function waveHeader(payloadByteLength: number): Buffer {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(payloadByteLength + 36, 4)
  header.write('WAVE', 8, 'ascii')
  header.write('fmt ', 12, 'ascii')
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(2, 22)
  header.writeUInt32LE(48_000, 24)
  header.writeUInt32LE(48_000 * 4, 28)
  header.writeUInt16LE(4, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36, 'ascii')
  header.writeUInt32LE(payloadByteLength, 40)
  return header
}

async function hashStream(stream: Readable): Promise<{ byteLength: number; sha256: string }> {
  const checksum = createHash('sha256')
  let observed = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    observed += bytes.byteLength
    checksum.update(bytes)
  }
  return { byteLength: observed, sha256: checksum.digest('hex') }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
