import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import {
  createPrivateReadStreamWithinRoot,
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  OFFLINE_MEDIA_BINARY_LEGACY_OUTPUT_BUFFER_MAXIMUM_BYTES,
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution/offline-media-binary-types'
import {
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution/offline-media-binary-object-mezzanine-chunk-protocol'

const LEGACY_BUFFER_MAXIMUM_BYTES =
  OFFLINE_MEDIA_BINARY_LEGACY_OUTPUT_BUFFER_MAXIMUM_BYTES
export const CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES =
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES
export const CANONICAL_PRIVATE_OBJECT_CHUNK_STREAMING_MAXIMUM_BYTES =
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES
const SHA = /^[a-f0-9]{64}$/

export interface CanonicalPrivateMediaArtifactInspection {
  mediaFormat: 'nut' | 'mkv'
  byteLength: number
  sha256: string
  openStream(): Promise<Readable>
}

export async function persistCanonicalPrivateMediaArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  const mediaFormat = privateMediaFormat(input.bytes)
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    input.bytes.byteLength < 64 ||
    input.bytes.byteLength > LEGACY_BUFFER_MAXIMUM_BYTES ||
    sha256(input.bytes) !== input.expectedSha256 || !mediaFormat
  ) throw invalid('Private media intermediate failed its fixed content commitment.')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash, mediaFormat),
    content: input.bytes,
  })
  const stored = await readCanonicalPrivateMediaArtifact(input)
  if (!stored || !stored.bytes.equals(input.bytes) || stored.sha256 !== input.expectedSha256) {
    throw invalid('Private media intermediate changed during create-only persistence.')
  }
}

export async function readCanonicalPrivateMediaArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<{ bytes: Buffer; byteLength: number; sha256: string } | undefined> {
  const inspected = await inspectCanonicalPrivateMediaArtifact(input)
  if (!inspected) return undefined
  if (inspected.byteLength > LEGACY_BUFFER_MAXIMUM_BYTES) {
    throw invalid('Large private media intermediates require the streaming reader.')
  }
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash, inspected.mediaFormat),
  })
  if (
    !bytes || bytes.byteLength !== inspected.byteLength ||
    sha256(bytes) !== inspected.sha256 || privateMediaFormat(bytes) !== inspected.mediaFormat
  ) throw invalid('Stored private media intermediate changed during buffered read.')
  return { bytes, byteLength: inspected.byteLength, sha256: inspected.sha256 }
}

interface CanonicalPrivateMediaArtifactStreamInput {
  localStorageRoot: string
  privateObjectIdentityHash: string
  mediaFormat: 'nut' | 'mkv'
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}

export async function persistCanonicalPrivateMediaArtifactStream(
  input: CanonicalPrivateMediaArtifactStreamInput,
): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  return persistCanonicalPrivateMediaArtifactStreamWithinCeiling(
    input,
    CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
  )
}

export async function persistCanonicalPrivateObjectChunkMediaArtifactStream(
  input: CanonicalPrivateMediaArtifactStreamInput & { mediaFormat: 'mkv' },
): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  return persistCanonicalPrivateMediaArtifactStreamWithinCeiling(
    input,
    CANONICAL_PRIVATE_OBJECT_CHUNK_STREAMING_MAXIMUM_BYTES,
  )
}

async function persistCanonicalPrivateMediaArtifactStreamWithinCeiling(
  input: CanonicalPrivateMediaArtifactStreamInput,
  maximumBytes: number,
): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  assertStreamingCommitment(input, maximumBytes)
  const existing = await inspectCanonicalPrivateMediaArtifactWithinCeiling({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  }, maximumBytes)
  if (existing) {
    if (
      existing.mediaFormat !== input.mediaFormat ||
      existing.byteLength !== input.expectedByteLength ||
      existing.sha256 !== input.expectedSha256
    ) throw invalid('Private media stream collides with a different immutable artifact.')
    await verifyCommittedMediaStream(input, maximumBytes)
    return { byteLength: existing.byteLength, sha256: existing.sha256, replayed: true }
  }

  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  const verifiedStream = Readable.from((async function* () {
    let observedByteLength = 0
    const observedChecksum = createHash('sha256')
    for await (const chunk of input.stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      observedByteLength += bytes.byteLength
      if (observedByteLength > input.expectedByteLength) {
        throw invalid('Private media stream exceeded its exact byte commitment.')
      }
      observedChecksum.update(bytes)
      if (signatureByteLength < 25) {
        const part = bytes.subarray(0, Math.min(bytes.byteLength, 25 - signatureByteLength))
        signatureChunks.push(Buffer.from(part))
        signatureByteLength += part.byteLength
      }
      yield bytes
    }
    const signature = Buffer.concat(signatureChunks, signatureByteLength)
    if (
      observedByteLength !== input.expectedByteLength ||
      observedChecksum.digest('hex') !== input.expectedSha256 ||
      privateMediaFormat(signature) !== input.mediaFormat
    ) throw invalid('Private media stream failed its exact content commitment.')
  })())
  const written = await writePrivateStreamCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash, input.mediaFormat),
    stream: verifiedStream,
    maximumBytes,
  })
  if (
    written.byteLength !== input.expectedByteLength ||
    written.checksumSha256 !== input.expectedSha256 ||
    privateMediaFormat(Buffer.concat(signatureChunks, signatureByteLength)) !== input.mediaFormat
  ) throw invalid('Private media stream failed its persisted content commitment.')
  const stored = await inspectCanonicalPrivateMediaArtifactWithinCeiling({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  }, maximumBytes)
  if (
    !stored || stored.mediaFormat !== input.mediaFormat ||
    stored.byteLength !== input.expectedByteLength || stored.sha256 !== input.expectedSha256
  ) throw invalid('Private media stream changed during create-only persistence.')
  return { byteLength: stored.byteLength, sha256: stored.sha256, replayed: false }
}

export async function inspectCanonicalPrivateMediaArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<CanonicalPrivateMediaArtifactInspection | undefined> {
  return inspectCanonicalPrivateMediaArtifactWithinCeiling(
    input,
    CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
  )
}

export async function inspectCanonicalPrivateObjectChunkMediaArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<CanonicalPrivateMediaArtifactInspection | undefined> {
  const artifact = await inspectCanonicalPrivateMediaArtifactWithinCeiling(
    input,
    CANONICAL_PRIVATE_OBJECT_CHUNK_STREAMING_MAXIMUM_BYTES,
  )
  if (artifact && artifact.mediaFormat !== 'mkv') {
    throw invalid('Private object-chunk identity resolved to a non-Matroska object.')
  }
  return artifact
}

async function inspectCanonicalPrivateMediaArtifactWithinCeiling(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}, maximumBytes: number): Promise<CanonicalPrivateMediaArtifactInspection | undefined> {
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private media identity is invalid.')
  const candidates: Array<{
    mediaFormat: 'nut' | 'mkv'
    stream: Readable
  }> = []
  for (const mediaFormat of ['nut', 'mkv'] as const) {
    try {
      candidates.push({
        mediaFormat,
        stream: await createPrivateReadStreamWithinRoot({
          rootPath: input.localStorageRoot,
          relativePath: relativePath(input.privateObjectIdentityHash, mediaFormat),
        }),
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) continue
      throw error
    }
  }
  if (candidates.length === 0) return undefined
  if (candidates.length !== 1) {
    await Promise.all(candidates.map(async (candidate) => candidate.stream.destroy()))
    throw invalid('Private media identity resolved to more than one immutable object.')
  }
  const candidate = candidates[0]!
  const commitment = await inspectPrivateMediaStream(
    candidate.stream,
    candidate.mediaFormat,
    maximumBytes,
  )
  return {
    mediaFormat: candidate.mediaFormat,
    ...commitment,
    async openStream() {
      return createPrivateReadStreamWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(input.privateObjectIdentityHash, candidate.mediaFormat),
      })
    },
  }
}

function relativePath(identity: string, mediaFormat: 'nut' | 'mkv'): string {
  return `canonical-media-binary-results/private-v1/${identity.slice(0, 2)}/${identity}.${mediaFormat}`
}
function privateMediaFormat(bytes: Buffer): 'nut' | 'mkv' | undefined {
  if (bytes.subarray(0, 25).toString('ascii').includes('nut/multimedia')) return 'nut'
  if (
    bytes.byteLength >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 &&
    bytes[2] === 0xdf && bytes[3] === 0xa3
  ) return 'mkv'
  return undefined
}
function assertStreamingCommitment(input: {
  privateObjectIdentityHash: string
  mediaFormat: 'nut' | 'mkv'
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}, maximumBytes: number): void {
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    !Number.isSafeInteger(input.expectedByteLength) || input.expectedByteLength < 64 ||
    input.expectedByteLength > maximumBytes ||
    !input.stream || typeof input.stream.pipe !== 'function'
  ) throw invalid('Private media streaming commitment is invalid.')
}
async function verifyCommittedMediaStream(input: {
  mediaFormat: 'nut' | 'mkv'
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}, maximumBytes: number): Promise<void> {
  const commitment = await inspectPrivateMediaStream(
    input.stream,
    input.mediaFormat,
    maximumBytes,
  )
  if (
    commitment.byteLength !== input.expectedByteLength ||
    commitment.sha256 !== input.expectedSha256
  ) throw invalid('Replayed private media stream changed its exact commitment.')
}
async function inspectPrivateMediaStream(
  stream: Readable,
  expectedFormat: 'nut' | 'mkv',
  maximumBytes: number,
): Promise<{ byteLength: number; sha256: string }> {
  const checksum = createHash('sha256')
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > maximumBytes) {
      throw invalid('Stored private media intermediate exceeds its streaming ceiling.')
    }
    checksum.update(bytes)
    if (signatureByteLength < 25) {
      const part = bytes.subarray(0, Math.min(bytes.byteLength, 25 - signatureByteLength))
      signatureChunks.push(Buffer.from(part))
      signatureByteLength += part.byteLength
    }
  }
  const signature = Buffer.concat(signatureChunks, signatureByteLength)
  if (byteLength < 64 || privateMediaFormat(signature) !== expectedFormat) {
    throw invalid('Stored private media intermediate failed streaming format verification.')
  }
  return { byteLength, sha256: checksum.digest('hex') }
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_media_artifact_integrity',
  })
}
