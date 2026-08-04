import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { readPrivateFileIfExistsWithinRoot, writePrivateFileCreateOnlyWithinRoot } from '../security/private-local-persistence'

const SHA = /^[a-f0-9]{64}$/
const MAXIMUM_BYTES = 1024 * 1024

export async function persistCanonicalPrivateLayeredCutout(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<void> {
  assertPng(input.privateObjectIdentityHash, input.expectedSha256, input.bytes)
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
    content: input.bytes,
  })
  const stored = await readCanonicalPrivateLayeredCutout(input)
  if (!stored || !stored.bytes.equals(input.bytes) || stored.sha256 !== input.expectedSha256) {
    throw invalid('Private layered cutout changed during create-only persistence.')
  }
}

export async function readCanonicalPrivateLayeredCutout(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<{ bytes: Buffer; byteLength: number; sha256: string } | undefined> {
  if (!SHA.test(input.privateObjectIdentityHash)) throw invalid('Private layered cutout object identity is invalid.')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(input.privateObjectIdentityHash),
  })
  if (!bytes) return undefined
  const digest = sha256(bytes)
  assertPng(input.privateObjectIdentityHash, digest, bytes)
  return { bytes, byteLength: bytes.byteLength, sha256: digest }
}

function assertPng(identity: string, expectedSha256: string, bytes: Buffer): void {
  if (
    !SHA.test(identity) || !SHA.test(expectedSha256) || bytes.byteLength < 100 ||
    bytes.byteLength > MAXIMUM_BYTES || sha256(bytes) !== expectedSha256 ||
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(16) !== 128 ||
    bytes.readUInt32BE(20) !== 128 || bytes[24] !== 8 || bytes[25] !== 6 ||
    !bytes.includes(Buffer.from('IEND'))
  ) throw invalid('Private layered cutout failed its committed RGBA PNG contract.')
}

function relativePath(identity: string): string {
  return `canonical-layered-assets/private-v1/${identity.slice(0, 2)}/${identity}.png`
}
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_layered_cutout_integrity',
  })
}
