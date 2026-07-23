import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { readPrivateFileIfExistsWithinRoot, writePrivateFileCreateOnlyWithinRoot } from '../security/private-local-persistence'

const SHA = /^[a-f0-9]{64}$/
const MAXIMUM_BYTES = 100 * 1024 * 1024
export type CanonicalGeneratedMediaMimeType = 'image/png' | 'video/mp4'

export async function persistCanonicalPrivateGeneratedMedia(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  mimeType: CanonicalGeneratedMediaMimeType
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  assertMedia(input.privateObjectIdentityHash, input.mimeType, input.expectedSha256, input.bytes)
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash, input.mimeType),
    content: input.bytes,
  })
  const stored = await readCanonicalPrivateGeneratedMedia(input)
  if (!stored || !stored.bytes.equals(input.bytes) || stored.sha256 !== input.expectedSha256) {
    throw invalid('Private generated-media bytes changed during create-only persistence.')
  }
}

export async function readCanonicalPrivateGeneratedMedia(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  mimeType: CanonicalGeneratedMediaMimeType
}): Promise<{ bytes: Buffer; byteLength: number; sha256: string } | undefined> {
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private generated-media object identity is invalid.')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash, input.mimeType),
  })
  if (!bytes) return undefined
  const digest = sha256(bytes)
  assertMedia(input.privateObjectIdentityHash, input.mimeType, digest, bytes)
  return { bytes, byteLength: bytes.byteLength, sha256: digest }
}

function assertMedia(identity: string, mimeType: CanonicalGeneratedMediaMimeType, expectedSha256: string, bytes: Buffer): void {
  const hasPngSignature = bytes.byteLength >= 24 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.includes(Buffer.from('IEND'))
  const hasMp4Signature = bytes.byteLength >= 32 && bytes.subarray(4, 8).toString('ascii') === 'ftyp'
  if (
    !SHA.test(identity) || !SHA.test(expectedSha256) ||
    bytes.byteLength < 67 || bytes.byteLength > MAXIMUM_BYTES || sha256(bytes) !== expectedSha256 ||
    (mimeType === 'image/png' ? !hasPngSignature : !hasMp4Signature)
  ) throw invalid('Private generated media failed its committed PNG/MP4 contract.')
}

function relativePath(identity: string, mimeType: CanonicalGeneratedMediaMimeType): string {
  const extension = mimeType === 'image/png' ? 'png' : 'mp4'
  return `canonical-generated-media/private-v1/${identity.slice(0, 2)}/${identity}.${extension}`
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_generated_media_integrity',
  })
}
