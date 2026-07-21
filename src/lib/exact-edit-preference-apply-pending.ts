import type {
  EditReferenceProductionExactEditApplyOperation,
} from '../types/edit-reference-production-exact-edit-apply-api'
import {
  buildProjectPersistenceScopeStorageKey,
  type ProjectPersistenceScope,
} from './project-persistence-scope'
import { isExactEditPreferenceApplyOperation } from './exact-edit-preference-apply-client'

export const EXACT_EDIT_PREFERENCE_PENDING_APPLY_VERSION =
  'exact-edit-preference-pending-apply-v1' as const

const STORAGE_PREFIX = 'reeditpro.exactEditPreferencePendingApply.v1'

export interface ExactEditPreferencePendingApply {
  readonly schemaVersion: typeof EXACT_EDIT_PREFERENCE_PENDING_APPLY_VERSION
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly operation: EditReferenceProductionExactEditApplyOperation
  readonly idempotencyKey: string
  readonly createdAt: string
}

export type ExactEditPreferencePendingApplyWriteResult =
  | { readonly ok: true; readonly pending: ExactEditPreferencePendingApply }
  | { readonly ok: false; readonly message: string }

export function createExactEditPreferencePendingApply(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
  readonly operation: EditReferenceProductionExactEditApplyOperation
  readonly idempotencyKey: string
  readonly createdAt?: string
}): ExactEditPreferencePendingApply {
  assertScope(input.scope, input.projectId, input.editSessionId, input.operation)
  if (!isSafeKey(input.idempotencyKey)) throw new Error('pending_exact_edit_apply_key_invalid')
  const createdAt = input.createdAt ?? new Date().toISOString()
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('pending_exact_edit_apply_time_invalid')
  return Object.freeze({
    schemaVersion: EXACT_EDIT_PREFERENCE_PENDING_APPLY_VERSION,
    workspaceId: input.scope.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    operation: structuredClone(input.operation),
    idempotencyKey: input.idempotencyKey,
    createdAt,
  })
}

/**
 * Persists the replay identity before the network mutation. If this write is
 * unavailable, the caller must not begin the transaction because a committed
 * response could not be safely recovered after reload.
 */
export function saveExactEditPreferencePendingApply(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
  readonly operation: EditReferenceProductionExactEditApplyOperation
  readonly idempotencyKey: string
}): ExactEditPreferencePendingApplyWriteResult {
  try {
    const pending = createExactEditPreferencePendingApply(input)
    const storage = getStorage()
    if (!storage) {
      return {
        ok: false,
        message: 'Retry protection is unavailable in this browser. No Edit Preference change was sent.',
      }
    }
    storage.setItem(storageKey(input.scope, input.projectId, input.editSessionId), JSON.stringify(pending))
    const verified = readExactEditPreferencePendingApply(input)
    if (
      !verified
      || verified.idempotencyKey !== pending.idempotencyKey
      || JSON.stringify(verified) !== JSON.stringify(pending)
    ) {
      return {
        ok: false,
        message: 'Retry protection could not be verified. No Edit Preference change was sent.',
      }
    }
    return { ok: true, pending: verified }
  } catch {
    return {
      ok: false,
      message: 'Retry protection could not be saved. No Edit Preference change was sent.',
    }
  }
}

export function readExactEditPreferencePendingApply(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
}): ExactEditPreferencePendingApply | undefined {
  try {
    const raw = getStorage()?.getItem(storageKey(input.scope, input.projectId, input.editSessionId))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as unknown
    if (!isPending(parsed)) return undefined
    assertScope(input.scope, input.projectId, input.editSessionId, parsed.operation)
    if (
      parsed.workspaceId !== input.scope.workspaceId
      || parsed.projectId !== input.projectId
      || parsed.editSessionId !== input.editSessionId
    ) return undefined
    return structuredClone(parsed)
  } catch {
    return undefined
  }
}

export function clearExactEditPreferencePendingApply(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
  readonly expectedIdempotencyKey: string
}): boolean {
  const current = readExactEditPreferencePendingApply(input)
  if (!current) return true
  if (current.idempotencyKey !== input.expectedIdempotencyKey) return false
  try {
    getStorage()?.removeItem(storageKey(input.scope, input.projectId, input.editSessionId))
    return !readExactEditPreferencePendingApply(input)
  } catch {
    return false
  }
}

function isPending(value: unknown): value is ExactEditPreferencePendingApply {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  const expected = [
    'createdAt', 'editSessionId', 'idempotencyKey', 'operation', 'projectId',
    'schemaVersion', 'workspaceId',
  ].sort()
  return keys.length === expected.length
    && keys.every((key, index) => key === expected[index])
    && record.schemaVersion === EXACT_EDIT_PREFERENCE_PENDING_APPLY_VERSION
    && isSafeId(record.workspaceId)
    && isSafeId(record.projectId)
    && isSafeId(record.editSessionId)
    && isExactEditPreferenceApplyOperation(record.operation)
    && isSafeKey(record.idempotencyKey)
    && typeof record.createdAt === 'string'
    && Number.isFinite(Date.parse(record.createdAt))
}

function assertScope(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
  operation: EditReferenceProductionExactEditApplyOperation,
): void {
  if (
    !isSafeId(scope.workspaceId)
    || !isSafeId(projectId)
    || !isSafeId(editSessionId)
    || !isExactEditPreferenceApplyOperation(operation)
    || operation.authority.workspaceId !== scope.workspaceId
    || operation.authority.projectId !== projectId
    || operation.authority.editSessionId !== editSessionId
  ) throw new Error('pending_exact_edit_apply_scope_invalid')
}

function storageKey(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): string {
  return `${buildProjectPersistenceScopeStorageKey(STORAGE_PREFIX, scope)}.${encodeURIComponent(projectId)}.${encodeURIComponent(editSessionId)}`
}

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)
    && !value.includes('..')
}

function isSafeKey(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 16
    && value.length <= 200
    && /^[A-Za-z0-9._:-]+$/.test(value)
}
