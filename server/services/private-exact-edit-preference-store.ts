import { createHash } from 'node:crypto'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import { withPlanningDomainMutationLock } from './planning-domain-mutation-lock'
import {
  exactEditLifecycleLockPhaseSchema,
  exactEditPreferenceFieldKeySchema,
  exactEditPreferenceFieldKeys,
  exactEditPreferenceValuesSchema,
  type ExactEditLifecycleLockPhase,
  type ExactEditPreferenceFieldKey,
  type ExactEditPreferenceValues,
} from '../validation/exact-edit-preference-schemas'

export const PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION = 'private-exact-edit-preferences-v1' as const

const PRIVATE_EXACT_EDIT_PREFERENCE_SOURCE = 'private_exact_edit_preference_store' as const
const MAX_RECORD_BYTES = 2 * 1024 * 1024
export const MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS = 1_000
export const MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS = 256

export type ExactEditPreferenceStoreScope = {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

export interface ExactEditPreferenceBaseline {
  values: ExactEditPreferenceValues
  preferenceSnapshotId: string
  capturedAt: string
  persistenceSource: 'authenticated_private_internal_backend' | 'server_defaults'
  provenance: 'saved_edit_preferences' | 'server_default_preferences'
}

export interface ExactEditDraftPlanEvidence {
  id: string
  hash: string
  version: number
  recordedAt: string
}

export interface ExactEditDraftEstimateEvidence {
  id: string
  hash: string
  version: number
  recordedAt: string
}

export type ExactEditSourcePreparationState =
  | { status: 'not_started'; updatedAt: string }
  | { status: 'requires_repreparation'; updatedAt: string }
  | { status: 'ready'; evidenceHash: string; updatedAt: string }

export type ExactEditFrameConfirmationState =
  | { status: 'unconfirmed'; updatedAt: string }
  | { status: 'requires_reconfirmation'; updatedAt: string }
  | {
    status: 'confirmed'
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3'
    confirmationId: string
    updatedAt: string
  }

export type ExactEditPlanningInputKey = ExactEditPreferenceFieldKey | 'outputFrame'

export interface ExactEditPlanningInvalidation {
  cause: 'preference_change' | 'output_frame_changed'
  changedInputs: ExactEditPlanningInputKey[]
  draftPlanCleared: boolean
  draftEstimateCleared: boolean
  sourcePreparationReset: boolean
  frameConfirmationReset: boolean
  invalidatedAt: string
}

export interface ExactEditPreferencePlanningState {
  planningInputRevision: number
  preferenceFingerprintSha256: string
  replanRequired: boolean
  reestimateRequired: boolean
  draftPlan?: ExactEditDraftPlanEvidence
  draftEstimate?: ExactEditDraftEstimateEvidence
  sourcePreparation: ExactEditSourcePreparationState
  frameConfirmation: ExactEditFrameConfirmationState
  lastInvalidation?: ExactEditPlanningInvalidation
}

export interface ExactEditPreferenceLifecycleState {
  phase: 'planning' | ExactEditLifecycleLockPhase
  locked: boolean
  authorityReferenceId?: string
  lockedAt?: string
}

export interface ExactEditPreferenceAuditEvent {
  id: string
  eventType:
    | 'exact_edit_preferences_initialized'
    | 'exact_edit_preferences_changed'
    | 'planning_evidence_recorded'
    | 'output_frame_change_invalidated_planning'
    | 'exact_edit_preferences_lifecycle_locked'
  actorType: 'user' | 'internal_service'
  actorUserId: string
  recordRevision: number
  preferenceRevision: number
  changedInputs: ExactEditPlanningInputKey[]
  invalidation?: ExactEditPlanningInvalidation
  authorityReferenceId?: string
  createdAt: string
}

export interface ExactEditPreferenceIdempotencyRecord {
  operation:
    | 'initialize'
    | 'update_preferences'
    | 'record_planning_evidence'
    | 'invalidate_output_frame'
    | 'lock_lifecycle'
  idempotencyKey: string
  requestHash: string
  responseSnapshot?: unknown
  committedRecordRevision: number
  completedAt: string
}

export interface PrivateExactEditPreferenceRecord {
  schemaVersion: typeof PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  baseline: ExactEditPreferenceBaseline
  values: ExactEditPreferenceValues
  overrideKeys: ExactEditPreferenceFieldKey[]
  recordRevision: number
  preferenceRevision: number
  preferenceUpdatedAt: string
  planning: ExactEditPreferencePlanningState
  lifecycle: ExactEditPreferenceLifecycleState
  auditEvents: ExactEditPreferenceAuditEvent[]
  idempotencyRecords: ExactEditPreferenceIdempotencyRecord[]
  createdAt: string
  updatedAt: string
  privateInternalOnly: true
}

interface PersistedPrivateExactEditPreferenceRecord {
  recordVersion: typeof PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION
  source: typeof PRIVATE_EXACT_EDIT_PREFERENCE_SOURCE
  record: PrivateExactEditPreferenceRecord
  checksumSha256: string
}

type StoreMutationResult<T> = {
  result: T
  changed: boolean
  record?: PrivateExactEditPreferenceRecord
}

const scopeLocks = new Map<string, Promise<void>>()

const isoTimestampSchema = z.string().datetime({ offset: true })
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const planningInputKeySchema = z.union([exactEditPreferenceFieldKeySchema, z.literal('outputFrame')])

const sourcePreparationStateSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('not_started'),
    updatedAt: isoTimestampSchema,
  }).strict(),
  z.object({
    status: z.literal('requires_repreparation'),
    updatedAt: isoTimestampSchema,
  }).strict(),
  z.object({
    status: z.literal('ready'),
    evidenceHash: sha256Schema,
    updatedAt: isoTimestampSchema,
  }).strict(),
])

const frameConfirmationStateSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('unconfirmed'),
    updatedAt: isoTimestampSchema,
  }).strict(),
  z.object({
    status: z.literal('requires_reconfirmation'),
    updatedAt: isoTimestampSchema,
  }).strict(),
  z.object({
    status: z.literal('confirmed'),
    aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5', '4:3']),
    confirmationId: z.string().min(1).max(160),
    updatedAt: isoTimestampSchema,
  }).strict(),
])

const planningInvalidationSchema = z.object({
  cause: z.enum(['preference_change', 'output_frame_changed']),
  changedInputs: z.array(planningInputKeySchema).max(exactEditPreferenceFieldKeys.length + 1),
  draftPlanCleared: z.boolean(),
  draftEstimateCleared: z.boolean(),
  sourcePreparationReset: z.boolean(),
  frameConfirmationReset: z.boolean(),
  invalidatedAt: isoTimestampSchema,
}).strict()

const auditEventSchema = z.object({
  id: z.string().min(1).max(160),
  eventType: z.enum([
    'exact_edit_preferences_initialized',
    'exact_edit_preferences_changed',
    'planning_evidence_recorded',
    'output_frame_change_invalidated_planning',
    'exact_edit_preferences_lifecycle_locked',
  ]),
  actorType: z.enum(['user', 'internal_service']),
  actorUserId: z.string().min(1).max(160),
  recordRevision: z.number().int().nonnegative(),
  preferenceRevision: z.number().int().nonnegative(),
  changedInputs: z.array(planningInputKeySchema).max(exactEditPreferenceFieldKeys.length + 1),
  invalidation: planningInvalidationSchema.optional(),
  authorityReferenceId: z.string().min(1).max(160).optional(),
  createdAt: isoTimestampSchema,
}).strict()

const privateExactEditPreferenceRecordSchema = z.object({
  schemaVersion: z.literal(PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION),
  ownerUserId: z.string().min(1).max(160),
  workspaceId: z.string().min(1).max(160),
  projectId: z.string().min(1).max(160),
  editSessionId: z.string().min(1).max(160),
  baseline: z.object({
    values: exactEditPreferenceValuesSchema,
    preferenceSnapshotId: z.string().min(1).max(160),
    capturedAt: isoTimestampSchema,
    persistenceSource: z.enum(['authenticated_private_internal_backend', 'server_defaults']),
    provenance: z.enum(['saved_edit_preferences', 'server_default_preferences']),
  }).strict(),
  values: exactEditPreferenceValuesSchema,
  overrideKeys: z.array(exactEditPreferenceFieldKeySchema).max(exactEditPreferenceFieldKeys.length),
  recordRevision: z.number().int().nonnegative(),
  preferenceRevision: z.number().int().nonnegative(),
  preferenceUpdatedAt: isoTimestampSchema,
  planning: z.object({
    planningInputRevision: z.number().int().nonnegative(),
    preferenceFingerprintSha256: sha256Schema,
    replanRequired: z.boolean(),
    reestimateRequired: z.boolean(),
    draftPlan: z.object({
      id: z.string().min(1).max(160),
      hash: sha256Schema,
      version: z.number().int().positive(),
      recordedAt: isoTimestampSchema,
    }).strict().optional(),
    draftEstimate: z.object({
      id: z.string().min(1).max(160),
      hash: sha256Schema,
      version: z.number().int().positive(),
      recordedAt: isoTimestampSchema,
    }).strict().optional(),
    sourcePreparation: sourcePreparationStateSchema,
    frameConfirmation: frameConfirmationStateSchema,
    lastInvalidation: planningInvalidationSchema.optional(),
  }).strict(),
  lifecycle: z.object({
    phase: z.union([z.literal('planning'), exactEditLifecycleLockPhaseSchema]),
    locked: z.boolean(),
    authorityReferenceId: z.string().min(1).max(160).optional(),
    lockedAt: isoTimestampSchema.optional(),
  }).strict(),
  auditEvents: z.array(auditEventSchema).max(MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS),
  idempotencyRecords: z.array(z.object({
    operation: z.enum([
      'initialize',
      'update_preferences',
      'record_planning_evidence',
      'invalidate_output_frame',
      'lock_lifecycle',
    ]),
    idempotencyKey: z.string().min(1).max(240),
    requestHash: sha256Schema,
    responseSnapshot: z.unknown().optional(),
    committedRecordRevision: z.number().int().nonnegative(),
    completedAt: isoTimestampSchema,
  }).strict()).max(MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  privateInternalOnly: z.literal(true),
}).strict()

export function clearPrivateExactEditPreferenceProcessStateForSmoke(): void {
  scopeLocks.clear()
}

export async function readPrivateExactEditPreferenceRecord(
  scope: ExactEditPreferenceStoreScope,
): Promise<PrivateExactEditPreferenceRecord | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: exactEditPreferenceRecordPath(scope),
  })
  if (!content) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw invalidStoredRecord('Private exact-edit preference record is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw invalidStoredRecord('Private exact-edit preference record is not an object.')
  }

  const persisted = parsed as Partial<PersistedPrivateExactEditPreferenceRecord>
  if (
    persisted.recordVersion !== PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION
    || persisted.source !== PRIVATE_EXACT_EDIT_PREFERENCE_SOURCE
    || !persisted.record
    || typeof persisted.checksumSha256 !== 'string'
  ) {
    throw invalidStoredRecord('Private exact-edit preference record has an unsupported envelope.')
  }
  const parsedRecord = privateExactEditPreferenceRecordSchema.safeParse(persisted.record)
  if (!parsedRecord.success) {
    throw invalidStoredRecord('Private exact-edit preference record shape is invalid.', parsedRecord.error.flatten())
  }
  const record = parsedRecord.data as PrivateExactEditPreferenceRecord
  if (persisted.checksumSha256 !== exactEditPreferenceChecksum(record)) {
    throw invalidStoredRecord('Private exact-edit preference record checksum is invalid.')
  }
  assertPrivateExactEditPreferenceRecord(record, scope)
  return record
}

export async function mutatePrivateExactEditPreferenceRecord<T>(input: {
  scope: ExactEditPreferenceStoreScope
  mutation: (
    current: PrivateExactEditPreferenceRecord | undefined,
  ) => Promise<StoreMutationResult<T>> | StoreMutationResult<T>
}): Promise<T> {
  const lockKey = exactEditPreferenceScopeHash(input.scope)
  return withPlanningDomainMutationLock(input.scope, async () => {
    return withProcessLock(lockKey, async () => {
      const current = await readPrivateExactEditPreferenceRecord(input.scope)
      const mutation = await input.mutation(current)
      if (!mutation.changed) return mutation.result
      if (!mutation.record) {
        throw new ApiError('INTERNAL_ERROR', 'Changed exact-edit preference mutation did not provide a record.', 500)
      }

      assertPrivateExactEditPreferenceRecord(mutation.record, input.scope)
      const persisted: PersistedPrivateExactEditPreferenceRecord = {
        recordVersion: PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION,
        source: PRIVATE_EXACT_EDIT_PREFERENCE_SOURCE,
        record: mutation.record,
        checksumSha256: exactEditPreferenceChecksum(mutation.record),
      }
      const content = `${JSON.stringify(persisted)}\n`
      const byteLength = Buffer.byteLength(content, 'utf8')
      if (byteLength > MAX_RECORD_BYTES) {
        throw new ApiError(
          'IDEMPOTENCY_CAPACITY_EXCEEDED',
          'Private exact-edit preference record reached its safe capacity.',
          503,
          { byteLength, maxBytes: MAX_RECORD_BYTES },
        )
      }
      await writePrivateTextFileAtomicWithinRoot({
        rootPath: input.scope.localStorageRoot,
        relativePath: exactEditPreferenceRecordPath(input.scope),
        content,
      })
      return mutation.result
    })
  })
}

export function exactEditPreferenceFingerprint(values: ExactEditPreferenceValues): string {
  return sha256(stableStringify(values))
}

export function deriveExactEditPreferenceOverrideKeys(
  baseline: ExactEditPreferenceValues,
  values: ExactEditPreferenceValues,
): ExactEditPreferenceFieldKey[] {
  return exactEditPreferenceFieldKeys.filter((field) => baseline[field] !== values[field])
}

function assertPrivateExactEditPreferenceRecord(
  record: PrivateExactEditPreferenceRecord,
  scope: ExactEditPreferenceStoreScope,
): void {
  if (
    record.schemaVersion !== PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION
    || record.ownerUserId !== scope.ownerUserId
    || record.workspaceId !== scope.workspaceId
    || record.projectId !== scope.projectId
    || record.editSessionId !== scope.editSessionId
    || record.privateInternalOnly !== true
  ) {
    throw invalidStoredRecord('Private exact-edit preference tenancy scope is invalid.')
  }
  if (record.preferenceRevision > record.recordRevision) {
    throw invalidStoredRecord('Private exact-edit preference revision lineage is invalid.')
  }
  const expectedOverrideKeys = deriveExactEditPreferenceOverrideKeys(record.baseline.values, record.values)
  if (stableStringify(record.overrideKeys) !== stableStringify(expectedOverrideKeys)) {
    throw invalidStoredRecord('Private exact-edit preference override metadata is invalid.')
  }
  if (record.planning.preferenceFingerprintSha256 !== exactEditPreferenceFingerprint(record.values)) {
    throw invalidStoredRecord('Private exact-edit preference planning fingerprint is invalid.')
  }
  if (record.lifecycle.locked !== (record.lifecycle.phase !== 'planning')) {
    throw invalidStoredRecord('Private exact-edit preference lifecycle lock state is invalid.')
  }
  if (
    record.lifecycle.locked
    && (!record.lifecycle.authorityReferenceId || !record.lifecycle.lockedAt)
  ) {
    throw invalidStoredRecord('Private exact-edit preference lifecycle lock evidence is incomplete.')
  }
  if (
    !record.lifecycle.locked
    && (record.lifecycle.authorityReferenceId || record.lifecycle.lockedAt)
  ) {
    throw invalidStoredRecord('Planning-stage exact-edit preferences contain unexpected lock evidence.')
  }
  if (record.auditEvents.length === 0 || record.auditEvents[0]?.eventType !== 'exact_edit_preferences_initialized') {
    throw invalidStoredRecord('Private exact-edit preference initialization audit evidence is missing.')
  }
  if (record.auditEvents.some((event) => event.recordRevision > record.recordRevision)) {
    throw invalidStoredRecord('Private exact-edit preference audit revision is ahead of the record.')
  }
  const auditIds = new Set(record.auditEvents.map((event) => event.id))
  if (auditIds.size !== record.auditEvents.length) {
    throw invalidStoredRecord('Private exact-edit preference audit event IDs are not unique.')
  }
  const idempotencyKeys = new Set(record.idempotencyRecords.map((entry) => `${entry.operation}\u0000${entry.idempotencyKey}`))
  if (idempotencyKeys.size !== record.idempotencyRecords.length) {
    throw invalidStoredRecord('Private exact-edit preference idempotency keys are not unique per operation.')
  }
  if (record.idempotencyRecords.some((entry) => entry.committedRecordRevision > record.recordRevision)) {
    throw invalidStoredRecord('Private exact-edit preference idempotency revision is ahead of the record.')
  }
}

function exactEditPreferenceRecordPath(scope: ExactEditPreferenceStoreScope): string {
  return [
    'exact-edit-preferences',
    'private-internal-v1',
    `scope-${exactEditPreferenceScopeHash(scope)}.json`,
  ].join('/')
}

function exactEditPreferenceScopeHash(scope: Omit<ExactEditPreferenceStoreScope, 'localStorageRoot'>): string {
  return sha256([
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
  ].join('\u0000'))
}

function exactEditPreferenceChecksum(record: PrivateExactEditPreferenceRecord): string {
  return sha256(stableStringify(record))
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, stableJsonValue(entryValue)]),
  )
}

async function withProcessLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = scopeLocks.get(key) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queued = previous.catch(() => undefined).then(() => current)
  scopeLocks.set(key, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (scopeLocks.get(key) === queued) scopeLocks.delete(key)
  }
}

function invalidStoredRecord(message: string, details?: unknown): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}
