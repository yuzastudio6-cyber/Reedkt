import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import {
  createPrivateReadStreamWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution'

const SHA256 = /^[a-f0-9]{64}$/u
const FLAC_SIGNATURE = Buffer.from('fLaC', 'ascii')

export const CANONICAL_PRIVATE_PROGRAM_AUDIO_MAXIMUM_BYTES =
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES

export interface CanonicalPrivateProgramAudioArtifactInspection {
  mediaFormat: 'flac'
  contentType: 'audio/flac'
  byteLength: number
  sha256: string
  openStream(): Promise<Readable>
}

export async function persistCanonicalPrivateProgramAudioArtifactStream(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}): Promise<{ byteLength: number; sha256: string; replayed: boolean }> {
  assertCommitment(input)
  const existing = await inspectCanonicalPrivateProgramAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (existing) {
    if (
      existing.byteLength !== input.expectedByteLength ||
      existing.sha256 !== input.expectedSha256
    ) throw invalid(
      'Private program-audio identity collides with a different immutable FLAC.',
    )
    await verifyIncomingStream(input)
    return {
      byteLength: existing.byteLength,
      sha256: existing.sha256,
      replayed: true,
    }
  }

  const checksum = createHash('sha256')
  const signatureChunks: Buffer[] = []
  let signatureBytes = 0
  let observedBytes = 0
  const verifiedStream = Readable.from((async function* () {
    for await (const chunk of input.stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      observedBytes += bytes.byteLength
      if (observedBytes > input.expectedByteLength) {
        throw invalid('Private program-audio stream exceeded its byte commitment.')
      }
      checksum.update(bytes)
      if (signatureBytes < FLAC_SIGNATURE.byteLength) {
        const part = bytes.subarray(
          0,
          Math.min(bytes.byteLength, FLAC_SIGNATURE.byteLength - signatureBytes),
        )
        signatureChunks.push(Buffer.from(part))
        signatureBytes += part.byteLength
      }
      yield bytes
    }
    if (
      observedBytes !== input.expectedByteLength ||
      checksum.digest('hex') !== input.expectedSha256 ||
      !Buffer.concat(signatureChunks, signatureBytes).equals(FLAC_SIGNATURE)
    ) throw invalid(
      'Private program-audio stream failed its exact FLAC commitment.',
    )
  })())
  const written = await writePrivateStreamCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    stream: verifiedStream,
    maximumBytes: CANONICAL_PRIVATE_PROGRAM_AUDIO_MAXIMUM_BYTES,
  })
  if (
    written.byteLength !== input.expectedByteLength ||
    written.checksumSha256 !== input.expectedSha256
  ) throw invalid('Private program-audio persistence changed its commitment.')

  const stored = await inspectCanonicalPrivateProgramAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (
    !stored || stored.byteLength !== input.expectedByteLength ||
    stored.sha256 !== input.expectedSha256
  ) throw invalid('Private program-audio changed after create-only persistence.')
  return {
    byteLength: stored.byteLength,
    sha256: stored.sha256,
    replayed: false,
  }
}

export async function inspectCanonicalPrivateProgramAudioArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<CanonicalPrivateProgramAudioArtifactInspection | undefined> {
  if (!SHA256.test(input.privateObjectIdentityHash)) {
    throw invalid('Private program-audio object identity is invalid.')
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
  const commitment = await inspectFlacStream(stream)
  return {
    mediaFormat: 'flac',
    contentType: 'audio/flac',
    ...commitment,
    async openStream() {
      return createPrivateReadStreamWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(input.privateObjectIdentityHash),
      })
    },
  }
}

export function canonicalPrivateProgramAudioArtifactRelativePath(
  privateObjectIdentityHash: string,
): string {
  if (!SHA256.test(privateObjectIdentityHash)) {
    throw invalid('Private program-audio object identity is invalid.')
  }
  return relativePath(privateObjectIdentityHash)
}

function relativePath(identity: string): string {
  return `canonical-program-audio/private-v1/${identity.slice(0, 2)}/${identity}.flac`
}

function assertCommitment(input: {
  privateObjectIdentityHash: string
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}): void {
  if (
    !SHA256.test(input.privateObjectIdentityHash) ||
    !SHA256.test(input.expectedSha256) ||
    !Number.isSafeInteger(input.expectedByteLength) ||
    input.expectedByteLength < 1_024 ||
    input.expectedByteLength > CANONICAL_PRIVATE_PROGRAM_AUDIO_MAXIMUM_BYTES ||
    !input.stream || typeof input.stream.pipe !== 'function'
  ) throw invalid('Private program-audio streaming commitment is invalid.')
}

async function verifyIncomingStream(input: {
  stream: Readable
  expectedByteLength: number
  expectedSha256: string
}): Promise<void> {
  const commitment = await inspectFlacStream(input.stream)
  if (
    commitment.byteLength !== input.expectedByteLength ||
    commitment.sha256 !== input.expectedSha256
  ) throw invalid('Replayed private program-audio stream changed its commitment.')
}

async function inspectFlacStream(
  stream: Readable,
): Promise<{ byteLength: number; sha256: string }> {
  const checksum = createHash('sha256')
  const signatureChunks: Buffer[] = []
  let signatureBytes = 0
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > CANONICAL_PRIVATE_PROGRAM_AUDIO_MAXIMUM_BYTES) {
      throw invalid('Stored private program-audio exceeds its byte ceiling.')
    }
    checksum.update(bytes)
    if (signatureBytes < FLAC_SIGNATURE.byteLength) {
      const part = bytes.subarray(
        0,
        Math.min(bytes.byteLength, FLAC_SIGNATURE.byteLength - signatureBytes),
      )
      signatureChunks.push(Buffer.from(part))
      signatureBytes += part.byteLength
    }
  }
  if (
    byteLength < 1_024 ||
    !Buffer.concat(signatureChunks, signatureBytes).equals(FLAC_SIGNATURE)
  ) throw invalid('Stored private program-audio failed FLAC verification.')
  return { byteLength, sha256: checksum.digest('hex') }
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_program_audio_artifact_integrity',
  })
}
