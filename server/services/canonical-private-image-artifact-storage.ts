import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { readPrivateFileIfExistsWithinRoot, writePrivateFileCreateOnlyWithinRoot } from '../security/private-local-persistence'

const SHA = /^[a-f0-9]{64}$/
const MAXIMUM_BYTES = 16 * 1024 * 1024

export async function persistCanonicalPrivateImageArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  contentType: 'image/png' | 'image/jpeg' | 'image/webp'
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  if (
    !SHA.test(input.privateObjectIdentityHash) || !SHA.test(input.expectedSha256) ||
    input.bytes.byteLength < 32 || input.bytes.byteLength > MAXIMUM_BYTES ||
    sha256(input.bytes) !== input.expectedSha256 || !signatureMatches(input.bytes, input.contentType)
  ) throw invalid('Private image failed its fixed content commitment.')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash, input.contentType),
    content: input.bytes,
  })
  const stored = await readCanonicalPrivateImageArtifact(input)
  if (!stored || !stored.bytes.equals(input.bytes) || stored.sha256 !== input.expectedSha256) {
    throw invalid('Private image changed during create-only persistence.')
  }
}

export async function readCanonicalPrivateImageArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  contentType: 'image/png' | 'image/jpeg' | 'image/webp'
}) {
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private image identity is invalid.')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash, input.contentType),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 32 || bytes.byteLength > MAXIMUM_BYTES || !signatureMatches(bytes, input.contentType)) {
    throw invalid('Stored private image is invalid.')
  }
  return { bytes, byteLength: bytes.byteLength, sha256: sha256(bytes), contentType: input.contentType }
}

function relativePath(identity: string, contentType: string): string {
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/jpeg' ? 'jpg' : 'webp'
  return `canonical-image-tool-results/private-v1/${identity.slice(0, 2)}/${identity}.${extension}`
}
function signatureMatches(bytes: Buffer, contentType: string): boolean {
  if (contentType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
  if (contentType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9
  return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_image_artifact_integrity',
  })
}
