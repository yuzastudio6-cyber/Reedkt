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
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/remotion-render-execution/offline-remotion-delivery-h264-chunk-protocol'

const LEGACY_BUFFER_MAXIMUM_BYTES = 16 * 1024 * 1024
export const CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES = 256 * 1024 * 1024
export const CANONICAL_PRIVATE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_BYTES =
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES
const SHA = /^[a-f0-9]{64}$/

export interface CanonicalPrivateRemotionArtifactInspection {
  byteLength: number
  sha256: string
  openStream(range?: { start: number; end: number }): Promise<Readable>
}

export async function persistCanonicalPrivateRemotionArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  assertMp4(input.privateObjectIdentityHash, input.expectedSha256, input.bytes)
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    content: input.bytes,
  })
  const stored = await readCanonicalPrivateRemotionArtifact(input)
  if (!stored || !stored.bytes.equals(input.bytes) || stored.sha256 !== input.expectedSha256) {
    throw invalid('Private Remotion MP4 changed during create-only persistence.')
  }
}

export async function readCanonicalPrivateRemotionArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<{ bytes: Buffer; byteLength: number; sha256: string } | undefined> {
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private Remotion object identity is invalid.')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength > LEGACY_BUFFER_MAXIMUM_BYTES) {
    throw invalid('Large private Remotion artifacts require the streaming reader.')
  }
  assertMp4(input.privateObjectIdentityHash, sha256(bytes), bytes)
  return { bytes, byteLength: bytes.byteLength, sha256: sha256(bytes) }
}

export async function persistCanonicalPrivateRemotionArtifactStream(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  return persistCanonicalPrivateRemotionArtifactStreamWithinCeiling(
    input,
    CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES,
  )
}

export async function persistCanonicalPrivateRemotionDeliveryH264ChunkArtifactStream(
  input: {
    localStorageRoot: string
    privateObjectIdentityHash: string
    stream: Readable
    expectedByteLength: number
    expectedSha256: string
  },
): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  return persistCanonicalPrivateRemotionArtifactStreamWithinCeiling(
    input,
    CANONICAL_PRIVATE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_BYTES,
  )
}

async function persistCanonicalPrivateRemotionArtifactStreamWithinCeiling(
  input: {
    localStorageRoot: string
    privateObjectIdentityHash: string
    stream: Readable
    expectedByteLength: number
    expectedSha256: string
  },
  maximumBytes: number,
): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  assertIdentityAndStreamingCommitment(input, maximumBytes)
  const existing = await inspectCanonicalPrivateRemotionArtifactWithinCeiling({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  }, maximumBytes)
  if (existing) {
    if (
      existing.byteLength !== input.expectedByteLength ||
      existing.sha256 !== input.expectedSha256
    ) throw invalid('Private Remotion stream collides with a different immutable artifact.')
    await verifyCommittedMp4Stream({
      stream: input.stream,
      expectedByteLength: input.expectedByteLength,
      expectedSha256: input.expectedSha256,
    }, maximumBytes)
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
        throw invalid('Private Remotion stream exceeded its exact byte commitment.')
      }
      observedChecksum.update(bytes)
      if (signatureByteLength < 8) {
        const part = bytes.subarray(0, Math.min(bytes.byteLength, 8 - signatureByteLength))
        signatureChunks.push(Buffer.from(part))
        signatureByteLength += part.byteLength
      }
      yield bytes
    }
    const signature = Buffer.concat(signatureChunks, signatureByteLength)
    if (
      observedByteLength !== input.expectedByteLength ||
      observedChecksum.digest('hex') !== input.expectedSha256 ||
      signature.byteLength < 8 || signature.subarray(4, 8).toString('ascii') !== 'ftyp'
    ) throw invalid('Private Remotion stream failed its exact MP4 commitment.')
  })())
  const written = await writePrivateStreamCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    stream: verifiedStream,
    maximumBytes,
  })
  const signature = Buffer.concat(signatureChunks, signatureByteLength)
  if (
    written.byteLength !== input.expectedByteLength ||
    written.checksumSha256 !== input.expectedSha256 ||
    signature.byteLength < 8 || signature.subarray(4, 8).toString('ascii') !== 'ftyp'
  ) throw invalid('Private Remotion stream failed its MP4 content commitment.')
  const stored = await inspectCanonicalPrivateRemotionArtifactWithinCeiling({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  }, maximumBytes)
  if (
    !stored || stored.byteLength !== input.expectedByteLength ||
    stored.sha256 !== input.expectedSha256
  ) throw invalid('Private Remotion stream changed during create-only persistence.')
  return { byteLength: stored.byteLength, sha256: stored.sha256, replayed: false }
}

export async function inspectCanonicalPrivateRemotionArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<CanonicalPrivateRemotionArtifactInspection | undefined> {
  return inspectCanonicalPrivateRemotionArtifactWithinCeiling(
    input,
    CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES,
  )
}

export async function inspectCanonicalPrivateRemotionDeliveryH264ChunkArtifact(
  input: {
    localStorageRoot: string
    privateObjectIdentityHash: string
  },
): Promise<CanonicalPrivateRemotionArtifactInspection | undefined> {
  return inspectCanonicalPrivateRemotionArtifactWithinCeiling(
    input,
    CANONICAL_PRIVATE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_BYTES,
  )
}

async function inspectCanonicalPrivateRemotionArtifactWithinCeiling(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}, maximumBytes: number): Promise<
  CanonicalPrivateRemotionArtifactInspection | undefined
> {
  if (!SHA.test(input.privateObjectIdentityHash)) {
    throw invalid('Private Remotion object identity is invalid.')
  }
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
  const commitment = await inspectMp4Stream(stream, maximumBytes)
  return {
    ...commitment,
    async openStream(range?: { start: number; end: number }) {
      if (range && (
        !Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) ||
        range.start < 0 || range.end < range.start || range.end >= commitment.byteLength
      )) throw invalid('Private Remotion byte range is invalid.')
      return createPrivateReadStreamWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(input.privateObjectIdentityHash),
        ...(range ? range : {}),
      })
    },
  }
}

function assertMp4(identity: string, expectedSha256: string, bytes: Buffer): void {
  if (
    !SHA.test(identity) || !SHA.test(expectedSha256) || bytes.byteLength < 1024 ||
    bytes.byteLength > LEGACY_BUFFER_MAXIMUM_BYTES || sha256(bytes) !== expectedSha256 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp'
  ) throw invalid('Private Remotion artifact failed its MP4 content commitment.')
}
function relativePath(identity: string): string {
  return `canonical-remotion-results/private-v1/${identity.slice(0, 2)}/${identity}.mp4`
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }

function assertIdentityAndStreamingCommitment(input: {
  privateObjectIdentityHash: string
  expectedByteLength: number
  expectedSha256: string
  stream: Readable
}, maximumBytes: number): void {
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    !Number.isSafeInteger(input.expectedByteLength) || input.expectedByteLength < 1_024 ||
    input.expectedByteLength > maximumBytes ||
    !input.stream || typeof input.stream.pipe !== 'function'
  ) throw invalid('Private Remotion streaming commitment is invalid.')
}

async function inspectMp4Stream(
  stream: Readable,
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
      throw invalid('Stored private Remotion artifact exceeds its streaming ceiling.')
    }
    checksum.update(bytes)
    if (signatureByteLength < 8) {
      const part = bytes.subarray(0, Math.min(bytes.byteLength, 8 - signatureByteLength))
      signatureChunks.push(Buffer.from(part))
      signatureByteLength += part.byteLength
    }
  }
  const signature = Buffer.concat(signatureChunks, signatureByteLength)
  if (
    byteLength < 1_024 || signature.byteLength < 8 ||
    signature.subarray(4, 8).toString('ascii') !== 'ftyp'
  ) throw invalid('Stored private Remotion artifact failed MP4 verification.')
  return { byteLength, sha256: checksum.digest('hex') }
}

async function verifyCommittedMp4Stream(input: {
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}, maximumBytes: number): Promise<void> {
  const actual = await inspectMp4Stream(input.stream, maximumBytes)
  if (
    actual.byteLength !== input.expectedByteLength ||
    actual.sha256 !== input.expectedSha256
  ) throw invalid('Replayed private Remotion stream changed its exact commitment.')
}
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_remotion_artifact_integrity',
  })
}
