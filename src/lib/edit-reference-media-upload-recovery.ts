const RECOVERY_SCHEMA_VERSION = 'edit-reference-media-upload-recovery-v1' as const
const RECOVERY_STORAGE_PREFIX = 'reeditpro.editReferenceUploadRecovery.v1'
const RECOVERY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000
const FILE_SAMPLE_BYTES = 64 * 1_024

export type EditReferenceMediaUploadRecoveryStage =
  | 'preparing'
  | 'intent_created'
  | 'uploading'
  | 'finalizing'
  | 'finalized'

export interface EditReferenceMediaUploadRecoveryDescriptor {
  schemaVersion: typeof RECOVERY_SCHEMA_VERSION
  scopeDigestSha256: string
  fileFingerprintSha256: string
  idempotencyKey: string
  uploadIntentId?: string
  storageObjectRecordId?: string
  mediaAssetId?: string
  acceptedBytes: number
  totalBytes: number
  stage: EditReferenceMediaUploadRecoveryStage
  updatedAt: string
}

export interface EditReferenceMediaUploadRecoverySummary {
  available: boolean
  persistedInSession: boolean
  recovered: boolean
  acceptedBytes: number
  totalBytes: number
  stage: EditReferenceMediaUploadRecoveryStage
  updatedAt: string
}

export type EditReferenceMediaUploadRecoveryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

interface RecoveryScope {
  workspaceId: string
  editReferenceId: string
  studySessionId: string
}

interface RecoverySession {
  descriptor: EditReferenceMediaUploadRecoveryDescriptor
  recovered: boolean
  persistedInSession: boolean
  update: (patch: Partial<Pick<
    EditReferenceMediaUploadRecoveryDescriptor,
    'acceptedBytes' | 'mediaAssetId' | 'stage' | 'storageObjectRecordId' | 'uploadIntentId'
  >>) => EditReferenceMediaUploadRecoveryDescriptor
  summary: () => EditReferenceMediaUploadRecoverySummary
  clear: () => void
}

export async function openEditReferenceMediaUploadRecovery(input: RecoveryScope & {
  file: File
  storage?: EditReferenceMediaUploadRecoveryStorage
  now?: () => Date
}): Promise<RecoverySession> {
  const now = input.now ?? (() => new Date())
  const scopeDigestSha256 = await digestText(stableScopeText(input))
  const fileFingerprintSha256 = await fingerprintFile(input.file)
  const storage = input.storage ?? browserSessionStorage()
  const storageKey = recoveryStorageKey(scopeDigestSha256)
  const stored = readDescriptor(storage, storageKey)
  const reusable = stored
    && descriptorIsCurrent(stored, now())
    && stored.scopeDigestSha256 === scopeDigestSha256
    && stored.fileFingerprintSha256 === fileFingerprintSha256
    && stored.totalBytes === input.file.size
  if (stored && !reusable) safeRemove(storage, storageKey)

  let descriptor: EditReferenceMediaUploadRecoveryDescriptor = reusable
    ? stored
    : {
      schemaVersion: RECOVERY_SCHEMA_VERSION,
      scopeDigestSha256,
      fileFingerprintSha256,
      idempotencyKey: `reference-upload-intent-${crypto.randomUUID()}`,
      acceptedBytes: 0,
      totalBytes: input.file.size,
      stage: 'preparing',
      updatedAt: now().toISOString(),
    }
  let persistedInSession = safeWrite(storage, storageKey, descriptor)

  return {
    get descriptor() {
      return descriptor
    },
    recovered: Boolean(reusable),
    get persistedInSession() {
      return persistedInSession
    },
    update(patch) {
      descriptor = {
        ...descriptor,
        ...patch,
        acceptedBytes: normalizeAcceptedBytes(
          patch.acceptedBytes ?? descriptor.acceptedBytes,
          descriptor.totalBytes,
        ),
        updatedAt: now().toISOString(),
      }
      persistedInSession = safeWrite(storage, storageKey, descriptor)
      return descriptor
    },
    summary() {
      return {
        available: true,
        persistedInSession,
        recovered: Boolean(reusable),
        acceptedBytes: descriptor.acceptedBytes,
        totalBytes: descriptor.totalBytes,
        stage: descriptor.stage,
        updatedAt: descriptor.updatedAt,
      }
    },
    clear() {
      safeRemove(storage, storageKey)
    },
  }
}

export async function readPendingEditReferenceMediaUploadRecovery(input: RecoveryScope & {
  storage?: EditReferenceMediaUploadRecoveryStorage
  now?: () => Date
}): Promise<EditReferenceMediaUploadRecoverySummary | undefined> {
  const now = input.now ?? (() => new Date())
  const scopeDigestSha256 = await digestText(stableScopeText(input))
  const storage = input.storage ?? browserSessionStorage()
  const storageKey = recoveryStorageKey(scopeDigestSha256)
  const descriptor = readDescriptor(storage, storageKey)
  if (!descriptor || descriptor.scopeDigestSha256 !== scopeDigestSha256 || !descriptorIsCurrent(descriptor, now())) {
    if (descriptor) safeRemove(storage, storageKey)
    return undefined
  }
  return {
    available: true,
    persistedInSession: true,
    recovered: true,
    acceptedBytes: descriptor.acceptedBytes,
    totalBytes: descriptor.totalBytes,
    stage: descriptor.stage,
    updatedAt: descriptor.updatedAt,
  }
}

export async function clearEditReferenceMediaUploadRecovery(input: RecoveryScope & {
  storage?: EditReferenceMediaUploadRecoveryStorage
}): Promise<void> {
  const scopeDigestSha256 = await digestText(stableScopeText(input))
  safeRemove(input.storage ?? browserSessionStorage(), recoveryStorageKey(scopeDigestSha256))
}

function stableScopeText(scope: RecoveryScope): string {
  return JSON.stringify({
    workspaceId: scope.workspaceId.trim(),
    editReferenceId: scope.editReferenceId.trim(),
    studySessionId: scope.studySessionId.trim(),
  })
}

async function fingerprintFile(file: File): Promise<string> {
  const head = file.slice(0, Math.min(file.size, FILE_SAMPLE_BYTES))
  const tailStart = Math.max(0, file.size - FILE_SAMPLE_BYTES)
  const tail = file.slice(tailStart, file.size)
  const [headDigest, tailDigest] = await Promise.all([
    digestBytes(await head.arrayBuffer()),
    digestBytes(await tail.arrayBuffer()),
  ])
  return digestText(JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    headDigest,
    tailDigest,
  }))
}

async function digestText(value: string): Promise<string> {
  return digestBytes(new TextEncoder().encode(value))
}

async function digestBytes(value: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', value)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function recoveryStorageKey(scopeDigestSha256: string): string {
  return `${RECOVERY_STORAGE_PREFIX}.${scopeDigestSha256}`
}

function browserSessionStorage(): EditReferenceMediaUploadRecoveryStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage
  } catch {
    return undefined
  }
}

function readDescriptor(
  storage: EditReferenceMediaUploadRecoveryStorage | undefined,
  storageKey: string,
): EditReferenceMediaUploadRecoveryDescriptor | undefined {
  if (!storage) return undefined
  try {
    const parsed = JSON.parse(storage.getItem(storageKey) ?? 'null') as unknown
    return isRecoveryDescriptor(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function safeWrite(
  storage: EditReferenceMediaUploadRecoveryStorage | undefined,
  storageKey: string,
  descriptor: EditReferenceMediaUploadRecoveryDescriptor,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(storageKey, JSON.stringify(descriptor))
    return true
  } catch {
    return false
  }
}

function safeRemove(
  storage: EditReferenceMediaUploadRecoveryStorage | undefined,
  storageKey: string,
): void {
  try {
    storage?.removeItem(storageKey)
  } catch {
    // Upload recovery remains best effort when browser storage is unavailable.
  }
}

function descriptorIsCurrent(
  descriptor: EditReferenceMediaUploadRecoveryDescriptor,
  now: Date,
): boolean {
  const updatedAt = Date.parse(descriptor.updatedAt)
  return Number.isFinite(updatedAt)
    && updatedAt <= now.getTime() + 60_000
    && now.getTime() - updatedAt <= RECOVERY_MAX_AGE_MS
}

function isRecoveryDescriptor(value: unknown): value is EditReferenceMediaUploadRecoveryDescriptor {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<EditReferenceMediaUploadRecoveryDescriptor>
  return candidate.schemaVersion === RECOVERY_SCHEMA_VERSION
    && isSha256(candidate.scopeDigestSha256)
    && isSha256(candidate.fileFingerprintSha256)
    && typeof candidate.idempotencyKey === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(candidate.idempotencyKey)
    && Number.isSafeInteger(candidate.acceptedBytes)
    && (candidate.acceptedBytes ?? -1) >= 0
    && Number.isSafeInteger(candidate.totalBytes)
    && (candidate.totalBytes ?? -1) >= 0
    && (candidate.acceptedBytes ?? 1) <= (candidate.totalBytes ?? 0)
    && isRecoveryStage(candidate.stage)
    && typeof candidate.updatedAt === 'string'
    && optionalSafeId(candidate.uploadIntentId)
    && optionalSafeId(candidate.storageObjectRecordId)
    && optionalSafeId(candidate.mediaAssetId)
    && (candidate.stage !== 'finalized'
      || Boolean(candidate.storageObjectRecordId && candidate.mediaAssetId))
}

function isRecoveryStage(value: unknown): value is EditReferenceMediaUploadRecoveryStage {
  return value === 'preparing'
    || value === 'intent_created'
    || value === 'uploading'
    || value === 'finalizing'
    || value === 'finalized'
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function optionalSafeId(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value))
}

function normalizeAcceptedBytes(value: number, totalBytes: number): number {
  if (!Number.isSafeInteger(value)) return 0
  return Math.max(0, Math.min(totalBytes, value))
}
