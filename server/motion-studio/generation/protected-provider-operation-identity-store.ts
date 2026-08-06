import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { sha256CanonicalJson } from '../commands/canonical-json'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_OPERATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SAFE_ADAPTER_ID = /^[a-z][a-z0-9._:-]{0,159}$/
const LEGACY_SCHEMA_VERSION = 'motion-studio-protected-provider-operation-identity-v1' as const
const SCHEMA_VERSION = 'motion-studio-protected-provider-operation-identity-v2' as const

interface ProtectedProviderOperationIdentityRecord {
  schemaVersion: typeof SCHEMA_VERSION
  operationId: string
  operationIdHash: string
  providerAdapterId: string
  externalOperationId: string
  externalOperationIdHash: string
  persistedAt: string
  recordDigest: string
}

interface LegacyProtectedProviderOperationIdentityRecord {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION
  operationId: string
  operationIdHash: string
  externalOperationId: string
  externalOperationIdHash: string
  persistedAt: string
  recordDigest: string
}

export interface MotionStudioProtectedProviderOperationIdentityStore {
  persist(input: {
    operationId: string
    providerAdapterId: string
    externalOperationId: string
    externalOperationIdHash: string
    persistedAt: string
  }): Promise<{ storageIdentityHash: string; created: boolean }>
  read(input: {
    operationId: string
    providerAdapterId: string
    expectedExternalOperationIdHash: string
  }): Promise<{ externalOperationId: string; externalOperationIdHash: string; persistedAt: string }>
}

/**
 * Backend-only create-once storage for opaque asynchronous provider task IDs.
 * The database and browser retain only the SHA-256 identity. The raw value is
 * mode-0600 private state required to resume status queries after a process or
 * worker lease handoff; it must never be logged or returned by an API route.
 */
export function createProtectedProviderOperationIdentityStore(input: {
  localStorageRoot: string
}): MotionStudioProtectedProviderOperationIdentityStore {
  const store: MotionStudioProtectedProviderOperationIdentityStore = {
    async persist(value) {
      const base = validateBase(value)
      const record: ProtectedProviderOperationIdentityRecord = {
        ...base,
        recordDigest: sha256CanonicalJson(base),
      }
      const bytes = Buffer.from(`${JSON.stringify(record)}\n`, 'utf8')
      const result = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: currentRelativePath(base.operationIdHash),
        content: bytes,
      })
      const readback = await readCurrentRecord(input.localStorageRoot, base.operationIdHash)
      assertExactRecord(readback, record)
      return { storageIdentityHash: base.operationIdHash, created: result.created }
    },

    async read(value) {
      const operationIdHash = validateOperation(value.operationId)
      validateAdapter(value.providerAdapterId)
      validateHash(value.expectedExternalOperationIdHash, 'expected external operation ID hash')
      let record = await readCurrentRecordIfExists(input.localStorageRoot, operationIdHash)
      if (!record) {
        const legacy = await readLegacyRecordIfExists(input.localStorageRoot, operationIdHash)
        if (!legacy) throw invalid('Protected provider operation identity is missing.')
        if (
          legacy.operationId !== value.operationId ||
          legacy.operationIdHash !== operationIdHash ||
          legacy.externalOperationIdHash !== value.expectedExternalOperationIdHash
        ) {
          throw invalid('Protected provider operation identity does not match the exact persisted operation authority.')
        }
        await store.persist({
          operationId: legacy.operationId,
          providerAdapterId: value.providerAdapterId,
          externalOperationId: legacy.externalOperationId,
          externalOperationIdHash: legacy.externalOperationIdHash,
          persistedAt: legacy.persistedAt,
        })
        record = await readCurrentRecord(input.localStorageRoot, operationIdHash)
      }
      if (
        record.operationId !== value.operationId ||
        record.operationIdHash !== operationIdHash ||
        record.providerAdapterId !== value.providerAdapterId ||
        record.externalOperationIdHash !== value.expectedExternalOperationIdHash
      ) {
        throw invalid('Protected provider operation identity does not match the exact persisted operation authority.')
      }
      validateRecord(record)
      return {
        externalOperationId: record.externalOperationId,
        externalOperationIdHash: record.externalOperationIdHash,
        persistedAt: record.persistedAt,
      }
    },
  }
  return store
}

function validateBase(input: {
  operationId: string
  providerAdapterId: string
  externalOperationId: string
  externalOperationIdHash: string
  persistedAt: string
}): Omit<ProtectedProviderOperationIdentityRecord, 'recordDigest'> {
  const operationIdHash = validateOperation(input.operationId)
  validateAdapter(input.providerAdapterId)
  validateOpaqueIdentifier(input.externalOperationId)
  validateHash(input.externalOperationIdHash, 'external operation ID hash')
  if (sha256Text(input.externalOperationId) !== input.externalOperationIdHash) {
    throw invalid('Protected provider operation ID does not match its public SHA-256 identity.')
  }
  if (!Number.isFinite(Date.parse(input.persistedAt))) {
    throw invalid('Protected provider operation identity requires a valid persistence timestamp.')
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    operationId: input.operationId,
    operationIdHash,
    providerAdapterId: input.providerAdapterId,
    externalOperationId: input.externalOperationId,
    externalOperationIdHash: input.externalOperationIdHash,
    persistedAt: input.persistedAt,
  }
}

async function readCurrentRecord(
  localStorageRoot: string,
  operationIdHash: string,
): Promise<ProtectedProviderOperationIdentityRecord> {
  const record = await readCurrentRecordIfExists(localStorageRoot, operationIdHash)
  if (!record) throw invalid('Protected provider operation identity is missing.')
  return record
}

async function readCurrentRecordIfExists(
  localStorageRoot: string,
  operationIdHash: string,
): Promise<ProtectedProviderOperationIdentityRecord | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: currentRelativePath(operationIdHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 100 || bytes.byteLength > 8_192) {
    throw invalid('Protected provider operation identity has an invalid byte length.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Protected provider operation identity is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw invalid('Protected provider operation identity has an invalid record shape.')
  }
  const record = parsed as ProtectedProviderOperationIdentityRecord
  validateRecord(record)
  return record
}

async function readLegacyRecordIfExists(
  localStorageRoot: string,
  operationIdHash: string,
): Promise<LegacyProtectedProviderOperationIdentityRecord | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: legacyRelativePath(operationIdHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 100 || bytes.byteLength > 8_192) {
    throw invalid('Legacy protected provider operation identity has an invalid byte length.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Legacy protected provider operation identity is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw invalid('Legacy protected provider operation identity has an invalid record shape.')
  }
  const record = parsed as LegacyProtectedProviderOperationIdentityRecord
  validateLegacyRecord(record)
  return record
}

function validateRecord(record: ProtectedProviderOperationIdentityRecord): void {
  if (record.schemaVersion !== SCHEMA_VERSION) throw invalid('Protected provider identity schema is unsupported.')
  const base = validateBase(record)
  validateHash(record.recordDigest, 'protected provider record digest')
  if (record.recordDigest !== sha256CanonicalJson(base)) {
    throw invalid('Protected provider operation identity failed its integrity digest.')
  }
}

function validateLegacyRecord(record: LegacyProtectedProviderOperationIdentityRecord): void {
  if (record.schemaVersion !== LEGACY_SCHEMA_VERSION) {
    throw invalid('Legacy protected provider identity schema is unsupported.')
  }
  const operationIdHash = validateOperation(record.operationId)
  if (record.operationIdHash !== operationIdHash) {
    throw invalid('Legacy protected provider operation identity has an invalid operation hash.')
  }
  validateOpaqueIdentifier(record.externalOperationId)
  validateHash(record.externalOperationIdHash, 'legacy external operation ID hash')
  if (sha256Text(record.externalOperationId) !== record.externalOperationIdHash) {
    throw invalid('Legacy protected provider operation ID does not match its public SHA-256 identity.')
  }
  if (!Number.isFinite(Date.parse(record.persistedAt))) {
    throw invalid('Legacy protected provider operation identity requires a valid persistence timestamp.')
  }
  const base = {
    schemaVersion: LEGACY_SCHEMA_VERSION,
    operationId: record.operationId,
    operationIdHash: record.operationIdHash,
    externalOperationId: record.externalOperationId,
    externalOperationIdHash: record.externalOperationIdHash,
    persistedAt: record.persistedAt,
  }
  validateHash(record.recordDigest, 'legacy protected provider record digest')
  if (record.recordDigest !== sha256CanonicalJson(base)) {
    throw invalid('Legacy protected provider operation identity failed its integrity digest.')
  }
}

function assertExactRecord(
  actual: ProtectedProviderOperationIdentityRecord,
  expected: ProtectedProviderOperationIdentityRecord,
): void {
  if (sha256CanonicalJson(actual) !== sha256CanonicalJson(expected)) {
    throw invalid('Protected provider operation identity changed during create-only persistence.')
  }
}

function validateOperation(value: string): string {
  if (!SAFE_OPERATION_ID.test(value)) throw invalid('Protected provider operation ID is invalid.')
  return sha256Text(value)
}

function validateAdapter(value: string): void {
  if (!SAFE_ADAPTER_ID.test(value)) throw invalid('Protected provider adapter ID is invalid.')
}

function validateOpaqueIdentifier(value: string): void {
  const containsControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 31 || codePoint === 127
  })
  if (!value || value.length > 512 || containsControlCharacter) {
    throw invalid('Protected provider operation identifier is invalid.')
  }
}

function validateHash(value: string, label: string): void {
  if (!SHA256.test(value)) throw invalid(`${label} is invalid.`)
}

function currentRelativePath(operationIdHash: string): string {
  return `provider-operation-identities/private-v2/${operationIdHash.slice(0, 2)}/${operationIdHash}.json`
}

function legacyRelativePath(operationIdHash: string): string {
  return `provider-operation-identities/private-v1/${operationIdHash.slice(0, 2)}/${operationIdHash}.json`
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'protected_provider_operation_identity',
  })
}
