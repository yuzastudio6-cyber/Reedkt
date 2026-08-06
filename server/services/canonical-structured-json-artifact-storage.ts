import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MAXIMUM_STRUCTURED_JSON_BYTES = 16 * 1024 * 1024

export function canonicalStructuredJsonArtifactRelativePath(identityHash: string): string {
  if (!SHA256_PATTERN.test(identityHash)) throw invalidArtifact('Structured JSON object identity is invalid.')
  return ['canonical-structured-python-results', 'private-v1', identityHash.slice(0, 2), `${identityHash}.json`].join('/')
}

export async function persistCanonicalStructuredJsonArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  bytes: Buffer
  expectedSha256: string
}): Promise<{ created: boolean; byteLength: number; sha256: string }> {
  if (
    input.bytes.byteLength <= 1 || input.bytes.byteLength > MAXIMUM_STRUCTURED_JSON_BYTES ||
    !SHA256_PATTERN.test(input.expectedSha256) || sha256Bytes(input.bytes) !== input.expectedSha256
  ) throw invalidArtifact('Structured JSON bytes failed their bounded content commitment.')
  parseJson(input.bytes)
  const write = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: canonicalStructuredJsonArtifactRelativePath(input.privateObjectIdentityHash),
    content: input.bytes,
  })
  const stored = await readCanonicalStructuredJsonArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (
    !stored || stored.byteLength !== input.bytes.byteLength || stored.sha256 !== input.expectedSha256 ||
    !stored.bytes.equals(input.bytes)
  ) throw invalidArtifact('Structured JSON bytes changed during create-only persistence.')
  return { created: write.created, byteLength: stored.byteLength, sha256: stored.sha256 }
}

export async function readCanonicalStructuredJsonArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<{ bytes: Buffer; document: Record<string, unknown>; byteLength: number; sha256: string } | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: canonicalStructuredJsonArtifactRelativePath(input.privateObjectIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength <= 1 || bytes.byteLength > MAXIMUM_STRUCTURED_JSON_BYTES) {
    throw invalidArtifact('Structured JSON object exceeded its byte ceiling.')
  }
  return { bytes, document: parseJson(bytes), byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) }
}

function parseJson(bytes: Buffer): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(bytes.toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    return parsed as Record<string, unknown>
  } catch {
    throw invalidArtifact('Structured JSON artifact is not a JSON object.')
  }
}
function sha256Bytes(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalidArtifact(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_structured_json_artifact_integrity',
  })
}
