import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'

const MAXIMUM_BYTES = 32 * 1024 * 1024
const SHA = /^[a-f0-9]{64}$/

export async function persistCanonicalPrivateMediaArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  const mediaFormat = privateMediaFormat(input.bytes)
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    input.bytes.byteLength < 64 || input.bytes.byteLength > MAXIMUM_BYTES ||
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
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private media identity is invalid.')
  const candidates = await Promise.all((['nut', 'mkv'] as const).map(async (mediaFormat) => ({
    mediaFormat,
    bytes: await readPrivateFileIfExistsWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath: relativePath(input.privateObjectIdentityHash, mediaFormat),
    }),
  })))
  const stored = candidates.filter((candidate) => candidate.bytes !== undefined)
  if (stored.length === 0) return undefined
  if (stored.length !== 1) {
    throw invalid('Private media identity resolved to more than one immutable object.')
  }
  const bytes = stored[0]!.bytes!
  if (
    bytes.byteLength < 64 || bytes.byteLength > MAXIMUM_BYTES ||
    privateMediaFormat(bytes) !== stored[0]!.mediaFormat
  ) throw invalid('Stored private media intermediate is invalid.')
  return { bytes, byteLength: bytes.byteLength, sha256: sha256(bytes) }
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
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_media_artifact_integrity',
  })
}
