import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MAXIMUM_STRUCTURED_SVG_BYTES = 16 * 1024 * 1024

export function canonicalStructuredSvgArtifactRelativePath(identityHash: string): string {
  if (!SHA256_PATTERN.test(identityHash)) {
    throw invalidArtifact('Private structured SVG object identity is invalid.')
  }
  return [
    'canonical-structured-tool-results',
    'private-v1',
    identityHash.slice(0, 2),
    `${identityHash}.svg`,
  ].join('/')
}

export async function persistCanonicalStructuredSvgArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<{ created: boolean; byteLength: number; sha256: string }> {
  if (
    input.bytes.byteLength <= 0 ||
    input.bytes.byteLength > MAXIMUM_STRUCTURED_SVG_BYTES ||
    !SHA256_PATTERN.test(input.expectedSha256) ||
    sha256Bytes(input.bytes) !== input.expectedSha256
  ) {
    throw invalidArtifact('Private structured SVG bytes failed their bounded content commitment.')
  }
  const relativePath = canonicalStructuredSvgArtifactRelativePath(input.privateObjectIdentityHash)
  const write = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
    content: input.bytes,
  })
  const persisted = await readCanonicalStructuredSvgArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (
    !persisted ||
    persisted.byteLength !== input.bytes.byteLength ||
    persisted.sha256 !== input.expectedSha256 ||
    !persisted.bytes.equals(input.bytes)
  ) {
    throw invalidArtifact('Private structured SVG bytes changed during create-only persistence.')
  }
  return { created: write.created, byteLength: persisted.byteLength, sha256: persisted.sha256 }
}

export async function readCanonicalStructuredSvgArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<{ bytes: Buffer; byteLength: number; sha256: string } | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: canonicalStructuredSvgArtifactRelativePath(input.privateObjectIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength <= 0 || bytes.byteLength > MAXIMUM_STRUCTURED_SVG_BYTES) {
    throw invalidArtifact('Private structured SVG object exceeded its byte ceiling.')
  }
  return { bytes, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) }
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function invalidArtifact(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_structured_svg_artifact_integrity',
  })
}
