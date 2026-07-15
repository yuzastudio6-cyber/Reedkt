import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { Readable } from 'node:stream'

import {
  CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
  inspectCanonicalPrivateMediaArtifact,
  persistCanonicalPrivateMediaArtifactStream,
  readCanonicalPrivateMediaArtifact,
} from '../services/canonical-private-media-artifact-storage'

const localStorageRoot =
  `/tmp/reeditpro-canonical-private-media-streaming-output-${process.pid}`
const byteLength = 33 * 1024 * 1024 + 137
const identity = sha256Text('canonical-private-large-matroska-stream-v1')
const rejectedIdentity = sha256Text('canonical-private-rejected-matroska-stream-v1')

await rm(localStorageRoot, { recursive: true, force: true })
try {
  assert.ok(byteLength > 32 * 1024 * 1024)
  assert.ok(byteLength <= CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES)
  const commitment = mediaCommitment(byteLength, 17)
  const alternateCommitment = mediaCommitment(byteLength, 29)

  const created = await persistCanonicalPrivateMediaArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: identity,
    mediaFormat: 'mkv',
    stream: mediaStream(byteLength, 17),
    expectedByteLength: commitment.byteLength,
    expectedSha256: commitment.sha256,
  })
  assert.deepEqual(created, {
    byteLength,
    sha256: commitment.sha256,
    replayed: false,
  })

  await assert.rejects(readCanonicalPrivateMediaArtifact({
    localStorageRoot,
    privateObjectIdentityHash: identity,
  }), /require the streaming reader/)
  const inspected = await inspectCanonicalPrivateMediaArtifact({
    localStorageRoot,
    privateObjectIdentityHash: identity,
  })
  assert.ok(inspected)
  assert.equal(inspected.mediaFormat, 'mkv')
  assert.equal(inspected.byteLength, byteLength)
  assert.equal(inspected.sha256, commitment.sha256)
  const reopened = await hashStream(await inspected.openStream())
  assert.deepEqual(reopened, commitment)

  const replayed = await persistCanonicalPrivateMediaArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: identity,
    mediaFormat: 'mkv',
    stream: mediaStream(byteLength, 17),
    expectedByteLength: commitment.byteLength,
    expectedSha256: commitment.sha256,
  })
  assert.deepEqual(replayed, {
    byteLength,
    sha256: commitment.sha256,
    replayed: true,
  })

  await assert.rejects(persistCanonicalPrivateMediaArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: identity,
    mediaFormat: 'mkv',
    stream: mediaStream(byteLength, 29),
    expectedByteLength: alternateCommitment.byteLength,
    expectedSha256: alternateCommitment.sha256,
  }), /collides with a different immutable artifact/)
  const unchanged = await inspectCanonicalPrivateMediaArtifact({
    localStorageRoot,
    privateObjectIdentityHash: identity,
  })
  assert.equal(unchanged?.sha256, commitment.sha256)

  await assert.rejects(persistCanonicalPrivateMediaArtifactStream({
    localStorageRoot,
    privateObjectIdentityHash: rejectedIdentity,
    mediaFormat: 'mkv',
    stream: mediaStream(byteLength, 17),
    expectedByteLength: alternateCommitment.byteLength,
    expectedSha256: alternateCommitment.sha256,
  }), /failed its exact content commitment/)
  assert.equal(await inspectCanonicalPrivateMediaArtifact({
    localStorageRoot,
    privateObjectIdentityHash: rejectedIdentity,
  }), undefined)

  console.log(JSON.stringify({
    smoke: 'canonical_private_media_streaming_output',
    status: 'passed',
    byteLength,
    sha256: commitment.sha256,
    formerOutputBufferCeilingBytes: 32 * 1024 * 1024,
    streamingCeilingBytes: CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
    checks: [
      'over_32mib_matroska_stream_committed_create_only',
      'large_buffered_reader_failed_closed',
      'no_follow_stream_reopen_hash_and_signature_verified',
      'exact_stream_replay_verified_without_replacement',
      'immutable_identity_collision_rejected',
      'checksum_mismatch_left_no_poisoned_target',
    ],
  }))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

function mediaCommitment(
  totalByteLength: number,
  variant: number,
): { byteLength: number; sha256: string } {
  const checksum = createHash('sha256')
  let observed = 0
  for (const chunk of mediaChunks(totalByteLength, variant)) {
    observed += chunk.byteLength
    checksum.update(chunk)
  }
  return { byteLength: observed, sha256: checksum.digest('hex') }
}

function mediaStream(totalByteLength: number, variant: number): Readable {
  return Readable.from(mediaChunks(totalByteLength, variant))
}

function* mediaChunks(totalByteLength: number, variant: number): Generator<Buffer> {
  const maximumChunkBytes = 1024 * 1024
  let offset = 0
  let index = 0
  while (offset < totalByteLength) {
    const chunk = Buffer.alloc(
      Math.min(maximumChunkBytes, totalByteLength - offset),
      (variant + index * 13) % 256,
    )
    if (offset === 0) {
      chunk[0] = 0x1a
      chunk[1] = 0x45
      chunk[2] = 0xdf
      chunk[3] = 0xa3
    }
    yield chunk
    offset += chunk.byteLength
    index += 1
  }
}

async function hashStream(stream: Readable): Promise<{ byteLength: number; sha256: string }> {
  const checksum = createHash('sha256')
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    checksum.update(bytes)
  }
  return { byteLength, sha256: checksum.digest('hex') }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
