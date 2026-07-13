import { createHash, randomUUID } from 'node:crypto'
import {
  AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
  createEditPreferenceScopeFingerprint,
  type EditPreferenceApiRecord,
  type EditableEditPreferenceValues,
} from '../../src/lib/edit-preference-repository'
import type { LocalEditPreferenceDefaults } from '../../src/lib/edit-preferences'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import { getRequiredAuthUserId, nowIso } from './service-helpers'
import { editableEditPreferenceValuesSchema } from '../validation/edit-preference-schemas'

const RECORD_VERSION = 'authenticated-private-internal-edit-preferences-v1' as const
const RECORD_SOURCE = 'authenticated_private_internal_backend_file' as const
const EDITOR_ROLES = new Set(['owner', 'admin', 'editor'])
const preferenceWriteLocks = new Map<string, Promise<void>>()

type PreferenceWriteEvidence = {
  idempotencyKey: string
  requestHash: string
}

type StoredPrivateInternalEditPreferenceRecord = {
  recordVersion: typeof RECORD_VERSION
  source: typeof RECORD_SOURCE
  userId: string
  workspaceId: string
  scopeFingerprint: string
  preferences: LocalEditPreferenceDefaults
  createdAt: string
  updatedAt: string
  lastWrite: PreferenceWriteEvidence
  mockOnly: true
  recordChecksumSha256: string
}

export type UpsertPrivateInternalEditPreferenceInput = {
  workspaceId: string
  expectedSnapshotId?: string
  preferences: EditableEditPreferenceValues
  idempotencyKey: string
}

export function createEditPreferenceService(context: ServiceContext) {
  return {
    async getCurrent(workspaceIdInput: string) {
      const { userId, workspaceId } = await authorizePrivateInternalPreferenceAccess(
        context,
        workspaceIdInput,
        'read',
      )
      const stored = await readStoredPreference(context.env.localStorageRoot, userId, workspaceId)

      return {
        persistenceCapability: AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
        preferenceRecord: stored ? toApiRecord(stored) : undefined,
        warnings: [
          'Edit preferences are stored in private single-host internal-test storage only.',
          'No Supabase preference row, RLS policy, staging persistence, cross-device sync, or production account store was used.',
        ],
        mockOnly: true as const,
      }
    },

    async upsertCurrent(input: UpsertPrivateInternalEditPreferenceInput) {
      const { userId, workspaceId } = await authorizePrivateInternalPreferenceAccess(
        context,
        input.workspaceId,
        'write',
      )
      const idempotency = normalizeWriteEvidence(
        input.idempotencyKey,
        hashPreferenceWriteRequest({
          workspaceId,
          expectedSnapshotId: input.expectedSnapshotId,
          preferences: input.preferences,
        }),
      )
      return withPreferenceWriteLock(`${userId}\u0000${workspaceId}`, async () => {
        const existing = await readStoredPreference(context.env.localStorageRoot, userId, workspaceId)

        if (existing?.lastWrite.idempotencyKey === idempotency.idempotencyKey) {
          if (existing.lastWrite.requestHash !== idempotency.requestHash) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'Idempotency-Key was reused with a different preference payload.',
              409,
            )
          }

          return {
            persistenceCapability: AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
            preferenceRecord: toApiRecord(existing),
            warnings: [
              'Idempotent preference replay returned the existing private-internal record without another write.',
              'No Supabase preference row or production account mutation occurred.',
            ],
            mockOnly: true as const,
          }
        }

        assertExpectedSnapshot(existing, input.expectedSnapshotId)

        const updatedAt = nowIso()
        const scopeFingerprint = createEditPreferenceScopeFingerprint({
          authMode: 'supabase',
          userId,
          workspaceId,
        })
        const preferences = createPrivateStoredPreferences(
          input.preferences,
          createServerSnapshotId(scopeFingerprint, input.preferences, updatedAt),
          updatedAt,
        )
        const recordWithoutChecksum = {
          recordVersion: RECORD_VERSION,
          source: RECORD_SOURCE,
          userId,
          workspaceId,
          scopeFingerprint,
          preferences,
          createdAt: existing?.createdAt ?? updatedAt,
          updatedAt,
          lastWrite: idempotency,
          mockOnly: true as const,
        }
        const record: StoredPrivateInternalEditPreferenceRecord = {
          ...recordWithoutChecksum,
          recordChecksumSha256: checksumStoredRecord(recordWithoutChecksum),
        }

        await writeStoredPreferenceAtomically(context.env.localStorageRoot, record)

        return {
          persistenceCapability: AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
          preferenceRecord: toApiRecord(record),
          warnings: [
            'Preferences were saved to private single-host internal-test storage.',
            'This is not Supabase, RLS-tested, staging, cross-device, external-beta, or production persistence.',
          ],
          mockOnly: true as const,
        }
      })
    },
  }
}

async function authorizePrivateInternalPreferenceAccess(
  context: ServiceContext,
  workspaceIdInput: string,
  operation: 'read' | 'write',
): Promise<{ userId: string; workspaceId: string }> {
  assertPrivateInternalPreferenceRuntime(context)
  const userId = normalizeScopeId(getRequiredAuthUserId(context), 'authenticated user id')
  const workspaceId = normalizeScopeId(workspaceIdInput, 'workspace id')

  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError(
      'AUTH_INVALID',
      'Private-internal backend preference persistence requires a verified bearer-authenticated user.',
      401,
    )
  }

  const adminClient = context.clients.admin
  if (!adminClient) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Workspace membership could not be verified for private-internal preference persistence.',
      403,
    )
  }

  const { data, error } = await adminClient
    .from('workspace_members')
    .select('workspace_id, user_id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'The authenticated user is not a verified member of this workspace.',
      403,
    )
  }

  const membership = data as { workspace_id?: unknown; user_id?: unknown; role?: unknown }
  const role = typeof membership.role === 'string' ? membership.role : ''
  if (membership.workspace_id !== workspaceId || membership.user_id !== userId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace membership evidence did not match the request scope.', 403)
  }
  if (operation === 'write' && !EDITOR_ROLES.has(role)) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Workspace editor access is required to save edit preferences.', 403)
  }

  return { userId, workspaceId }
}

function assertPrivateInternalPreferenceRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production'
    || context.env.mode !== 'local'
    || context.env.storageMode !== 'local'
    || !context.env.allowInternalTestExecutionWithSupabase
  ) {
    throw new ApiError(
      'MOCK_ONLY',
      'Authenticated private-internal preference persistence is available only in the explicit local Supabase-auth test runtime.',
      409,
    )
  }
}

function normalizeScopeId(value: string, label: string): string {
  const normalized = value.trim()
  if (
    !normalized
    || normalized.length > 160
    || normalized.includes('..')
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized)
  ) {
    throw new ApiError('VALIDATION_FAILED', `A safe ${label} is required.`, 400)
  }
  return normalized
}

function normalizeWriteEvidence(idempotencyKeyInput: string, requestHashInput: string): PreferenceWriteEvidence {
  const idempotencyKey = idempotencyKeyInput.trim()
  const requestHash = requestHashInput.trim().toLowerCase()
  if (!idempotencyKey || idempotencyKey.length > 240 || containsControlCharacter(idempotencyKey)) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A safe Idempotency-Key is required.', 400)
  }
  if (!/^[a-f0-9]{64}$/.test(requestHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Preference write request hash is invalid.', 400)
  }
  return { idempotencyKey, requestHash }
}

function containsControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code <= 31 || code === 127) return true
  }
  return false
}

function hashPreferenceWriteRequest(input: {
  workspaceId: string
  expectedSnapshotId?: string
  preferences: EditableEditPreferenceValues
}): string {
  return createHash('sha256')
    .update(JSON.stringify({
      workspaceId: input.workspaceId,
      expectedSnapshotId: input.expectedSnapshotId ?? null,
      preferences: input.preferences,
    }))
    .digest('hex')
}

function assertExpectedSnapshot(
  existing: StoredPrivateInternalEditPreferenceRecord | undefined,
  expectedSnapshotId: string | undefined,
): void {
  if (!existing) {
    if (expectedSnapshotId) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'No preference record exists for the supplied expected snapshot.', 409)
    }
    return
  }

  if (!expectedSnapshotId || expectedSnapshotId !== existing.preferences.snapshotId) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Edit preferences changed after they were loaded. Reload before saving again.',
      409,
    )
  }
}

async function readStoredPreference(
  localStorageRoot: string,
  userId: string,
  workspaceId: string,
): Promise<StoredPrivateInternalEditPreferenceRecord | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: editPreferenceRecordRelativePath(userId, workspaceId),
  })
  if (!content) return undefined
  return parseStoredPreference(content, userId, workspaceId)
}

async function writeStoredPreferenceAtomically(
  localStorageRoot: string,
  record: StoredPrivateInternalEditPreferenceRecord,
): Promise<void> {
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath: editPreferenceRecordRelativePath(record.userId, record.workspaceId),
    content: `${JSON.stringify(record, null, 2)}\n`,
  })
}

function parseStoredPreference(
  content: string,
  expectedUserId: string,
  expectedWorkspaceId: string,
): StoredPrivateInternalEditPreferenceRecord {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference record is not valid JSON.', 400)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference record is not an object.', 400)
  }

  const candidate = parsed as Partial<StoredPrivateInternalEditPreferenceRecord>
  if (
    candidate.recordVersion !== RECORD_VERSION
    || candidate.source !== RECORD_SOURCE
    || candidate.userId !== expectedUserId
    || candidate.workspaceId !== expectedWorkspaceId
    || candidate.mockOnly !== true
    || typeof candidate.scopeFingerprint !== 'string'
    || typeof candidate.createdAt !== 'string'
    || typeof candidate.updatedAt !== 'string'
    || typeof candidate.lastWrite?.idempotencyKey !== 'string'
    || typeof candidate.lastWrite?.requestHash !== 'string'
    || typeof candidate.recordChecksumSha256 !== 'string'
    || !candidate.preferences
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference record scope or metadata is invalid.', 400)
  }

  const expectedScopeFingerprint = createEditPreferenceScopeFingerprint({
    authMode: 'supabase',
    userId: expectedUserId,
    workspaceId: expectedWorkspaceId,
  })
  if (candidate.scopeFingerprint !== expectedScopeFingerprint) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference scope fingerprint is invalid.', 400)
  }

  const createdAtMs = Date.parse(candidate.createdAt)
  const updatedAtMs = Date.parse(candidate.updatedAt)
  if (
    !Number.isFinite(createdAtMs)
    || !Number.isFinite(updatedAtMs)
    || createdAtMs > updatedAtMs
    || candidate.preferences.updatedAt !== candidate.updatedAt
    || !/^private-internal-pref-[a-f0-9]{40}$/.test(candidate.preferences.snapshotId)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference snapshot metadata is invalid.', 400)
  }

  const normalizedLastWrite = normalizeWriteEvidence(
    candidate.lastWrite.idempotencyKey,
    candidate.lastWrite.requestHash,
  )
  if (
    normalizedLastWrite.idempotencyKey !== candidate.lastWrite.idempotencyKey
    || normalizedLastWrite.requestHash !== candidate.lastWrite.requestHash
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference write evidence is invalid.', 400)
  }

  const normalizedPreferences = parsePrivateStoredPreferences(candidate.preferences)
  if (
    candidate.preferences.persistence !== AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY
    || JSON.stringify(candidate.preferences) !== JSON.stringify(normalizedPreferences)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference values are invalid.', 400)
  }

  const recordWithoutChecksum = {
    recordVersion: candidate.recordVersion,
    source: candidate.source,
    userId: candidate.userId,
    workspaceId: candidate.workspaceId,
    scopeFingerprint: candidate.scopeFingerprint,
    preferences: normalizedPreferences,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    lastWrite: candidate.lastWrite,
    mockOnly: true as const,
  }
  if (candidate.recordChecksumSha256 !== checksumStoredRecord(recordWithoutChecksum)) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference record integrity check failed.', 400)
  }

  return {
    ...recordWithoutChecksum,
    recordChecksumSha256: candidate.recordChecksumSha256,
  }
}

function createPrivateStoredPreferences(
  valuesInput: EditableEditPreferenceValues,
  snapshotIdInput: string,
  updatedAtInput: string,
): LocalEditPreferenceDefaults {
  const parsed = editableEditPreferenceValuesSchema.safeParse(valuesInput)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference values are invalid.', 400, parsed.error.flatten())
  }
  const snapshotId = snapshotIdInput.trim()
  const updatedAt = updatedAtInput.trim()
  if (!snapshotId || snapshotId.length > 120 || !updatedAt || updatedAt.length > 80) {
    throw new ApiError('VALIDATION_FAILED', 'Private-internal preference snapshot metadata is invalid.', 400)
  }
  return {
    editLevel: parsed.data.editLevel,
    workflowType: parsed.data.workflowType,
    cleanupPreference: parsed.data.cleanupPreference,
    visualPreference: parsed.data.visualPreference,
    moodStyle: parsed.data.moodStyle,
    creditPreference: parsed.data.creditPreference,
    targetPlatform: parsed.data.targetPlatform,
    applyConfirmedDefaults: parsed.data.applyConfirmedDefaults,
    snapshotId,
    updatedAt,
    persistence: AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
  }
}

function parsePrivateStoredPreferences(value: LocalEditPreferenceDefaults): LocalEditPreferenceDefaults {
  return createPrivateStoredPreferences(
    {
      applyConfirmedDefaults: value.applyConfirmedDefaults,
      cleanupPreference: value.cleanupPreference,
      creditPreference: value.creditPreference,
      editLevel: value.editLevel,
      moodStyle: value.moodStyle,
      targetPlatform: value.targetPlatform,
      visualPreference: value.visualPreference,
      workflowType: value.workflowType,
    },
    value.snapshotId,
    value.updatedAt,
  )
}

export function editPreferenceRecordRelativePath(userId: string, workspaceId: string): string {
  return [
    'preferences',
    'private-internal-authenticated',
    `workspace-${sha256(workspaceId)}`,
    `user-${sha256(userId)}.json`,
  ].join('/')
}

function createServerSnapshotId(
  scopeFingerprint: string,
  preferences: EditableEditPreferenceValues,
  updatedAt: string,
): string {
  return `private-internal-pref-${sha256(JSON.stringify({
    scopeFingerprint,
    preferences,
    updatedAt,
    nonce: randomUUID(),
  })).slice(0, 40)}`
}

async function withPreferenceWriteLock<T>(scopeKey: string, action: () => Promise<T>): Promise<T> {
  const previous = preferenceWriteLocks.get(scopeKey) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  preferenceWriteLocks.set(scopeKey, current)

  await previous
  try {
    return await action()
  } finally {
    release()
    if (preferenceWriteLocks.get(scopeKey) === current) preferenceWriteLocks.delete(scopeKey)
  }
}

function checksumStoredRecord(record: Omit<StoredPrivateInternalEditPreferenceRecord, 'recordChecksumSha256'>): string {
  return sha256(JSON.stringify(record))
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function toApiRecord(record: StoredPrivateInternalEditPreferenceRecord): EditPreferenceApiRecord {
  return {
    recordVersion: 1,
    userId: record.userId,
    workspaceId: record.workspaceId,
    scopeFingerprint: record.scopeFingerprint,
    preferences: record.preferences,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}
