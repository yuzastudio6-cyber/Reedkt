import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { readPrivateFileIfExistsWithinRoot, writePrivateFileCreateOnlyWithinRoot } from '../security/private-local-persistence'

const MAXIMUM_BYTES = 16 * 1024 * 1024
const SHA = /^[a-f0-9]{64}$/

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
  assertMp4(input.privateObjectIdentityHash, sha256(bytes), bytes)
  return { bytes, byteLength: bytes.byteLength, sha256: sha256(bytes) }
}

function assertMp4(identity: string, expectedSha256: string, bytes: Buffer): void {
  if (
    !SHA.test(identity) || !SHA.test(expectedSha256) || bytes.byteLength < 1024 ||
    bytes.byteLength > MAXIMUM_BYTES || sha256(bytes) !== expectedSha256 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp'
  ) throw invalid('Private Remotion artifact failed its MP4 content commitment.')
}
function relativePath(identity: string): string {
  return `canonical-remotion-results/private-v1/${identity.slice(0, 2)}/${identity}.mp4`
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_remotion_artifact_integrity',
  })
}
