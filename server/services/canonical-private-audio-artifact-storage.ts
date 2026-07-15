import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import { inspectPcmWavePrefix, PCM_WAVE_MAXIMUM_HEADER_BYTES } from '../media/pcm-wave'
import {
  createPrivateReadStreamWithinRoot,
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
} from '../security/private-local-persistence'

const SHA = /^[a-f0-9]{64}$/
const LEGACY_BUFFER_MAXIMUM_BYTES = 8 * 1024 * 1024
export const CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES = 64 * 1024 * 1024

export interface CanonicalPrivateAudioArtifactInspection {
  byteLength: number
  sha256: string
  sampleRate: number
  channels: number
  bitsPerSample: number
  sampleFrameCount: number
  durationSeconds: number
  openStream(): Promise<Readable>
}

export async function persistCanonicalPrivateAudioArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    input.bytes.byteLength < 44 || input.bytes.byteLength > LEGACY_BUFFER_MAXIMUM_BYTES ||
    sha256(input.bytes) !== input.expectedSha256 ||
    !inspectPcmWavePrefix(input.bytes.subarray(0, PCM_WAVE_MAXIMUM_HEADER_BYTES), input.bytes.byteLength)
  ) throw invalid('Private audio failed its fixed PCM WAV commitment.')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    content: input.bytes,
  })
  const stored = await readCanonicalPrivateAudioArtifact(input)
  if (!stored || !stored.bytes.equals(input.bytes) || stored.sha256 !== input.expectedSha256) {
    throw invalid('Private audio changed during create-only persistence.')
  }
}

export async function readCanonicalPrivateAudioArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}) {
  const inspected = await inspectCanonicalPrivateAudioArtifact(input)
  if (!inspected) return undefined
  if (inspected.byteLength > LEGACY_BUFFER_MAXIMUM_BYTES) {
    throw invalid('Large private audio artifacts require the streaming reader.')
  }
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
  })
  if (
    !bytes || bytes.byteLength !== inspected.byteLength ||
    sha256(bytes) !== inspected.sha256 ||
    !inspectPcmWavePrefix(bytes.subarray(0, PCM_WAVE_MAXIMUM_HEADER_BYTES), bytes.byteLength)
  ) {
    throw invalid('Stored private audio is invalid.')
  }
  return { bytes, byteLength: inspected.byteLength, sha256: inspected.sha256, contentType: 'audio/wav' as const }
}

export async function persistCanonicalPrivateAudioArtifactStream(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  assertStreamingCommitment(input)
  const existing = await inspectCanonicalPrivateAudioArtifact(input)
  if (existing) {
    if (
      existing.byteLength !== input.expectedByteLength ||
      existing.sha256 !== input.expectedSha256
    ) throw invalid('Private audio stream collides with a different immutable artifact.')
    await verifyCommittedAudioStream(input.stream, input.expectedByteLength, input.expectedSha256)
    return { byteLength: existing.byteLength, sha256: existing.sha256, replayed: true }
  }

  const prefixChunks: Buffer[] = []
  let prefixByteLength = 0
  const verifiedStream = Readable.from((async function* () {
    let observedByteLength = 0
    const observedChecksum = createHash('sha256')
    for await (const chunk of input.stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      observedByteLength += bytes.byteLength
      if (observedByteLength > input.expectedByteLength) {
        throw invalid('Private audio stream exceeded its exact byte commitment.')
      }
      observedChecksum.update(bytes)
      if (prefixByteLength < PCM_WAVE_MAXIMUM_HEADER_BYTES) {
        const part = bytes.subarray(
          0,
          Math.min(bytes.byteLength, PCM_WAVE_MAXIMUM_HEADER_BYTES - prefixByteLength),
        )
        prefixChunks.push(Buffer.from(part))
        prefixByteLength += part.byteLength
      }
      yield bytes
    }
    const prefix = Buffer.concat(prefixChunks, prefixByteLength)
    if (
      observedByteLength !== input.expectedByteLength ||
      observedChecksum.digest('hex') !== input.expectedSha256 ||
      !inspectPcmWavePrefix(prefix, observedByteLength)
    ) throw invalid('Private audio stream failed its exact PCM WAV commitment.')
  })())
  const written = await writePrivateStreamCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    stream: verifiedStream,
    maximumBytes: CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES,
  })
  if (
    written.byteLength !== input.expectedByteLength ||
    written.checksumSha256 !== input.expectedSha256 ||
    !inspectPcmWavePrefix(Buffer.concat(prefixChunks, prefixByteLength), written.byteLength)
  ) throw invalid('Private audio stream failed its persisted PCM WAV commitment.')
  const stored = await inspectCanonicalPrivateAudioArtifact(input)
  if (
    !stored || stored.byteLength !== input.expectedByteLength ||
    stored.sha256 !== input.expectedSha256
  ) throw invalid('Private audio stream changed during create-only persistence.')
  return { byteLength: stored.byteLength, sha256: stored.sha256, replayed: false }
}

export async function inspectCanonicalPrivateAudioArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<CanonicalPrivateAudioArtifactInspection | undefined> {
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private audio identity is invalid.')
  let stream: Readable
  try {
    stream = await createPrivateReadStreamWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: relativePath(input.privateObjectIdentityHash),
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
  const commitment = await inspectPrivateAudioStream(stream)
  return {
    ...commitment,
    async openStream() {
      return createPrivateReadStreamWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(input.privateObjectIdentityHash),
      })
    },
  }
}

function relativePath(identity: string): string {
  return `canonical-audio-tool-results/private-v1/${identity.slice(0, 2)}/${identity}.wav`
}
function assertStreamingCommitment(input: {
  privateObjectIdentityHash: string
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}): void {
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    !Number.isSafeInteger(input.expectedByteLength) || input.expectedByteLength < 44 ||
    input.expectedByteLength > CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES ||
    !input.stream || typeof input.stream.pipe !== 'function'
  ) throw invalid('Private audio streaming commitment is invalid.')
}
async function verifyCommittedAudioStream(
  stream: Readable,
  expectedByteLength: number,
  expectedSha256: string,
): Promise<void> {
  const actual = await inspectPrivateAudioStream(stream)
  if (actual.byteLength !== expectedByteLength || actual.sha256 !== expectedSha256) {
    throw invalid('Replayed private audio stream changed its exact commitment.')
  }
}
async function inspectPrivateAudioStream(stream: Readable): Promise<{
  byteLength: number
  sha256: string
  sampleRate: number
  channels: number
  bitsPerSample: number
  sampleFrameCount: number
  durationSeconds: number
}> {
  const checksum = createHash('sha256')
  const prefixChunks: Buffer[] = []
  let prefixByteLength = 0
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES) {
      throw invalid('Stored private audio exceeds its streaming ceiling.')
    }
    checksum.update(bytes)
    if (prefixByteLength < PCM_WAVE_MAXIMUM_HEADER_BYTES) {
      const part = bytes.subarray(
        0,
        Math.min(bytes.byteLength, PCM_WAVE_MAXIMUM_HEADER_BYTES - prefixByteLength),
      )
      prefixChunks.push(Buffer.from(part))
      prefixByteLength += part.byteLength
    }
  }
  const details = inspectPcmWavePrefix(Buffer.concat(prefixChunks, prefixByteLength), byteLength)
  if (!details) throw invalid('Stored private audio failed streaming PCM WAV verification.')
  return {
    byteLength,
    sha256: checksum.digest('hex'),
    sampleRate: details.sampleRate,
    channels: details.channels,
    bitsPerSample: details.bitsPerSample,
    sampleFrameCount: details.sampleFrameCount,
    durationSeconds: details.durationSeconds,
  }
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_audio_artifact_integrity',
  })
}
