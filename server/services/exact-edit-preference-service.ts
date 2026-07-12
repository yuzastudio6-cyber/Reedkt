import { createHash, randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  exactEditPreferenceFieldKeys,
  exactEditPreferenceScopeIdSchema,
  exactEditPreferenceValuesSchema,
  initializeExactEditPreferencesSchema,
  invalidateExactEditOutputFrameSchema,
  lockExactEditPreferencesSchema,
  setExactEditPlanningEvidenceSchema,
  updateExactEditPreferencesSchema,
  type ExactEditLifecycleLockPhase,
  type ExactEditPreferenceFieldKey,
  type ExactEditPreferencePatch,
  type ExactEditPreferenceValues,
  type SetExactEditPlanningEvidenceBody,
} from '../validation/exact-edit-preference-schemas'
import { createEditPreferenceService } from './edit-preference-service'
import {
  deriveExactEditPreferenceOverrideKeys,
  exactEditPreferenceFingerprint,
  MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS,
  MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS,
  mutatePrivateExactEditPreferenceRecord,
  PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION,
  readPrivateExactEditPreferenceRecord,
  type ExactEditFrameConfirmationState,
  type ExactEditPlanningInputKey,
  type ExactEditPlanningInvalidation,
  type ExactEditPreferenceBaseline,
  type ExactEditPreferenceLifecycleState,
  type ExactEditPreferencePlanningState,
  type ExactEditPreferenceStoreScope,
  type ExactEditSourcePreparationState,
  type PrivateExactEditPreferenceRecord,
} from './private-exact-edit-preference-store'
import { readPrivateEditAuthorityAggregate } from './private-edit-authority-store'
import { createProjectService } from './project-service'
import { nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const SERVER_DEFAULT_EXACT_EDIT_PREFERENCES: ExactEditPreferenceValues = {
  editLevel: 'pro',
  workflowType: 'custom_let_ai_decide',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'custom',
}

export interface InitializeExactEditPreferencesInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  idempotencyKey: string
}

export interface UpdateExactEditPreferencesInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  expectedRevision: number
  patch: ExactEditPreferencePatch
  idempotencyKey: string
}

export interface SetExactEditPlanningEvidenceInput extends SetExactEditPlanningEvidenceBody {
  projectId: string
  editSessionId: string
  idempotencyKey: string
}

export interface InvalidateExactEditOutputFrameInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  expectedRevision: number
  idempotencyKey: string
}

export interface LockExactEditPreferencesInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  expectedRevision: number
  phase: ExactEditLifecycleLockPhase
  authorityReferenceId: string
  idempotencyKey: string
}

export interface ExactEditPreferenceView {
  schemaVersion: typeof PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION
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
  auditSummary: {
    eventCount: number
    latestEventAt: string
  }
  createdAt: string
  updatedAt: string
  privateInternalOnly: true
}

type EffectiveLifecycleLock = ExactEditPreferenceLifecycleState
type ExactEditMutationOperation = PrivateExactEditPreferenceRecord['idempotencyRecords'][number]['operation']

export function createExactEditPreferenceService(context: ServiceContext) {
  return {
    async getCurrent(workspaceIdInput: string, projectIdInput: string, editSessionIdInput: string) {
      const scope = await authorizeExactEditPreferenceScope(
        context,
        workspaceIdInput,
        projectIdInput,
        editSessionIdInput,
        'read',
      )
      const record = await readPrivateExactEditPreferenceRecord(scope)
      if (!record) {
        return {
          preferenceRecord: undefined,
          warnings: exactEditPreferenceWarnings('No exact-edit preference record has been initialized for this edit.'),
        }
      }
      const canonicalLock = await resolveCanonicalLifecycleLock(scope)
      return {
        preferenceRecord: toExactEditPreferenceView(record, canonicalLock),
        warnings: exactEditPreferenceWarnings(),
      }
    },

    async initialize(input: InitializeExactEditPreferencesInput) {
      const validated = initializeExactEditPreferencesSchema.safeParse({ workspaceId: input.workspaceId })
      if (!validated.success) throw requestValidationError(validated.error.flatten())
      const scope = await authorizeExactEditPreferenceScope(
        context,
        validated.data.workspaceId,
        input.projectId,
        input.editSessionId,
        'write',
      )
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const canonicalLock = await resolveCanonicalLifecycleLock(scope)
      const baseline = await resolveCreationBaseline(context, scope.workspaceId)
      const requestHash = hashMutationRequest('initialize', scope, validated.data)
      const timestamp = nowIso()

      const result = await mutatePrivateExactEditPreferenceRecord({
        scope,
        mutation: (current) => {
          if (current) {
            const replay = inspectIdempotencyReplay(current, 'initialize', idempotencyKey, requestHash)
            if (replay === 'exact') {
              return {
                changed: false,
                result: { preferenceRecord: toExactEditPreferenceView(current, canonicalLock), created: false, replayed: true },
              }
            }
            return {
              changed: false,
              result: { preferenceRecord: toExactEditPreferenceView(current, canonicalLock), created: false, replayed: false },
            }
          }
          if (canonicalLock.locked) throw approvedEditPreferenceLockError(canonicalLock)

          const record: PrivateExactEditPreferenceRecord = {
            schemaVersion: PRIVATE_EXACT_EDIT_PREFERENCE_RECORD_VERSION,
            ownerUserId: scope.ownerUserId,
            workspaceId: scope.workspaceId,
            projectId: scope.projectId,
            editSessionId: scope.editSessionId,
            baseline,
            values: cloneJson(baseline.values),
            overrideKeys: [],
            recordRevision: 0,
            preferenceRevision: 0,
            preferenceUpdatedAt: timestamp,
            planning: {
              planningInputRevision: 0,
              preferenceFingerprintSha256: exactEditPreferenceFingerprint(baseline.values),
              replanRequired: true,
              reestimateRequired: true,
              sourcePreparation: { status: 'not_started', updatedAt: timestamp },
              frameConfirmation: { status: 'unconfirmed', updatedAt: timestamp },
            },
            lifecycle: { phase: 'planning', locked: false },
            auditEvents: [{
              id: `exact_edit_preference_audit_${randomUUID()}`,
              eventType: 'exact_edit_preferences_initialized',
              actorType: 'internal_service',
              actorUserId: scope.ownerUserId,
              recordRevision: 0,
              preferenceRevision: 0,
              changedInputs: [...exactEditPreferenceFieldKeys],
              createdAt: timestamp,
            }],
            idempotencyRecords: [{
              operation: 'initialize',
              idempotencyKey,
              requestHash,
              committedRecordRevision: 0,
              completedAt: timestamp,
            }],
            createdAt: timestamp,
            updatedAt: timestamp,
            privateInternalOnly: true,
          }
          return {
            changed: true,
            record,
            result: { preferenceRecord: toExactEditPreferenceView(record), created: true, replayed: false },
          }
        },
      })

      return {
        ...result,
        warnings: exactEditPreferenceWarnings(
          'The immutable creation baseline was copied server-side from saved preferences or deterministic server defaults.',
        ),
      }
    },

    async updateCurrent(input: UpdateExactEditPreferencesInput) {
      const validated = updateExactEditPreferencesSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedRevision: input.expectedRevision,
        patch: input.patch,
      })
      if (!validated.success) throw requestValidationError(validated.error.flatten())
      const scope = await authorizeExactEditPreferenceScope(
        context,
        validated.data.workspaceId,
        input.projectId,
        input.editSessionId,
        'write',
      )
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const canonicalLock = await resolveCanonicalLifecycleLock(scope)
      const requestHash = hashMutationRequest('update_preferences', scope, validated.data)
      const timestamp = nowIso()

      const result = await mutatePrivateExactEditPreferenceRecord({
        scope,
        mutation: (current) => {
          const record = requireInitializedRecord(current)
          const replay = inspectIdempotencyReplay(record, 'update_preferences', idempotencyKey, requestHash)
          if (replay === 'exact') {
            const responseSnapshot = exactEditReplaySnapshot<{
              preferenceRecord: ExactEditPreferenceView
              changedFields: ExactEditPreferenceFieldKey[]
              invalidation?: ExactEditPlanningInvalidation
              replayed: boolean
            }>(record, 'update_preferences', idempotencyKey)
            if (responseSnapshot) return { changed: false, result: responseSnapshot }
            const replayAudit = record.auditEvents.find((event) =>
              event.recordRevision === record.recordRevision
              && event.eventType === 'exact_edit_preferences_changed'
            )
            return {
              changed: false,
              result: {
                preferenceRecord: toExactEditPreferenceView(record, canonicalLock),
                changedFields: (replayAudit?.changedInputs ?? []).filter(
                  (field): field is ExactEditPreferenceFieldKey => field !== 'outputFrame',
                ),
                invalidation: replayAudit?.invalidation,
                replayed: true,
              },
            }
          }
          assertExactEditPreferencesMutable(record, canonicalLock)
          assertExpectedRecordRevision(record, validated.data.expectedRevision)

          const nextValues = exactEditPreferenceValuesSchema.parse({
            ...record.values,
            ...validated.data.patch,
          })
          const changedFields = changedPreferenceFields(record.values, nextValues)
          if (changedFields.length === 0) {
            return {
              changed: false,
              result: {
                preferenceRecord: toExactEditPreferenceView(record, canonicalLock),
                changedFields,
                invalidation: undefined,
                replayed: false,
              },
            }
          }

          assertMutationCapacity(record)
          const invalidation = deriveExactEditPlanningInvalidation(
            record.planning,
            'preference_change',
            changedFields,
            timestamp,
          )
          const nextRecordRevision = record.recordRevision + 1
          const nextPreferenceRevision = record.preferenceRevision + 1
          const nextRecord: PrivateExactEditPreferenceRecord = {
            ...record,
            values: nextValues,
            overrideKeys: deriveExactEditPreferenceOverrideKeys(record.baseline.values, nextValues),
            recordRevision: nextRecordRevision,
            preferenceRevision: nextPreferenceRevision,
            preferenceUpdatedAt: timestamp,
            planning: applyPlanningInvalidation(record.planning, invalidation, nextValues),
            auditEvents: [...record.auditEvents, {
              id: `exact_edit_preference_audit_${randomUUID()}`,
              eventType: 'exact_edit_preferences_changed',
              actorType: 'user',
              actorUserId: scope.ownerUserId,
              recordRevision: nextRecordRevision,
              preferenceRevision: nextPreferenceRevision,
              changedInputs: changedFields,
              invalidation,
              createdAt: timestamp,
            }],
            idempotencyRecords: [...record.idempotencyRecords, {
              operation: 'update_preferences',
              idempotencyKey,
              requestHash,
              committedRecordRevision: nextRecordRevision,
              completedAt: timestamp,
            }],
            updatedAt: timestamp,
          }
          const result = {
            preferenceRecord: toExactEditPreferenceView(nextRecord),
            changedFields,
            invalidation,
            replayed: false,
          }
          nextRecord.idempotencyRecords.at(-1)!.responseSnapshot = cloneJson(result)
          return {
            changed: true,
            record: nextRecord,
            result,
          }
        },
      })

      return {
        ...result,
        warnings: exactEditPreferenceWarnings(
          'Preference changes only invalidate planning state; they do not approve, reserve credits, or start execution.',
        ),
      }
    },

    async recordPlanningEvidence(input: SetExactEditPlanningEvidenceInput) {
      const validated = setExactEditPlanningEvidenceSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedRevision: input.expectedRevision,
        draftPlan: input.draftPlan,
        draftEstimate: input.draftEstimate,
        sourcePreparation: input.sourcePreparation,
        frameConfirmation: input.frameConfirmation,
      })
      if (!validated.success) throw requestValidationError(validated.error.flatten())
      const scope = await authorizeExactEditPreferenceScope(
        context,
        validated.data.workspaceId,
        input.projectId,
        input.editSessionId,
        'write',
      )
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const canonicalLock = await resolveCanonicalLifecycleLock(scope)
      const requestHash = hashMutationRequest('record_planning_evidence', scope, validated.data)
      const timestamp = nowIso()

      const result = await mutatePrivateExactEditPreferenceRecord({
        scope,
        mutation: (current) => {
          const record = requireInitializedRecord(current)
          const replay = inspectIdempotencyReplay(record, 'record_planning_evidence', idempotencyKey, requestHash)
          if (replay === 'exact') {
            const responseSnapshot = exactEditReplaySnapshot<{
              preferenceRecord: ExactEditPreferenceView
              replayed: boolean
            }>(record, 'record_planning_evidence', idempotencyKey)
            if (responseSnapshot) return { changed: false, result: responseSnapshot }
            return { changed: false, result: { preferenceRecord: toExactEditPreferenceView(record, canonicalLock), replayed: true } }
          }
          assertExactEditPreferencesMutable(record, canonicalLock)
          assertExpectedRecordRevision(record, validated.data.expectedRevision)
          if (!planningEvidenceChanges(record.planning, validated.data)) {
            return { changed: false, result: { preferenceRecord: toExactEditPreferenceView(record), replayed: false } }
          }

          assertMutationCapacity(record)
          const nextRecordRevision = record.recordRevision + 1
          const nextRecord: PrivateExactEditPreferenceRecord = {
            ...record,
            recordRevision: nextRecordRevision,
            planning: mergePlanningEvidence(record.planning, validated.data, timestamp),
            auditEvents: [...record.auditEvents, {
              id: `exact_edit_preference_audit_${randomUUID()}`,
              eventType: 'planning_evidence_recorded',
              actorType: 'internal_service',
              actorUserId: scope.ownerUserId,
              recordRevision: nextRecordRevision,
              preferenceRevision: record.preferenceRevision,
              changedInputs: [],
              createdAt: timestamp,
            }],
            idempotencyRecords: [...record.idempotencyRecords, {
              operation: 'record_planning_evidence',
              idempotencyKey,
              requestHash,
              committedRecordRevision: nextRecordRevision,
              completedAt: timestamp,
            }],
            updatedAt: timestamp,
          }
          const result = { preferenceRecord: toExactEditPreferenceView(nextRecord), replayed: false }
          nextRecord.idempotencyRecords.at(-1)!.responseSnapshot = cloneJson(result)
          return {
            changed: true,
            record: nextRecord,
            result,
          }
        },
      })

      return { ...result, warnings: exactEditPreferenceWarnings('Planning evidence was recorded by the backend control plane.') }
    },

    async invalidateForOutputFrameChange(input: InvalidateExactEditOutputFrameInput) {
      const validated = invalidateExactEditOutputFrameSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedRevision: input.expectedRevision,
      })
      if (!validated.success) throw requestValidationError(validated.error.flatten())
      const scope = await authorizeExactEditPreferenceScope(
        context,
        validated.data.workspaceId,
        input.projectId,
        input.editSessionId,
        'write',
      )
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const canonicalLock = await resolveCanonicalLifecycleLock(scope)
      const requestHash = hashMutationRequest('invalidate_output_frame', scope, validated.data)
      const timestamp = nowIso()

      const result = await mutatePrivateExactEditPreferenceRecord({
        scope,
        mutation: (current) => {
          const record = requireInitializedRecord(current)
          const replay = inspectIdempotencyReplay(record, 'invalidate_output_frame', idempotencyKey, requestHash)
          if (replay === 'exact') {
            const responseSnapshot = exactEditReplaySnapshot<{
              preferenceRecord: ExactEditPreferenceView
              invalidation?: ExactEditPlanningInvalidation
              replayed: boolean
            }>(record, 'invalidate_output_frame', idempotencyKey)
            if (responseSnapshot) return { changed: false, result: responseSnapshot }
            return {
              changed: false,
              result: {
                preferenceRecord: toExactEditPreferenceView(record, canonicalLock),
                invalidation: record.planning.lastInvalidation,
                replayed: true,
              },
            }
          }
          assertExactEditPreferencesMutable(record, canonicalLock)
          assertExpectedRecordRevision(record, validated.data.expectedRevision)
          assertMutationCapacity(record)

          const invalidation = deriveExactEditPlanningInvalidation(
            record.planning,
            'output_frame_changed',
            ['outputFrame'],
            timestamp,
          )
          const nextRecordRevision = record.recordRevision + 1
          const nextRecord: PrivateExactEditPreferenceRecord = {
            ...record,
            recordRevision: nextRecordRevision,
            planning: applyPlanningInvalidation(record.planning, invalidation, record.values),
            auditEvents: [...record.auditEvents, {
              id: `exact_edit_preference_audit_${randomUUID()}`,
              eventType: 'output_frame_change_invalidated_planning',
              actorType: 'internal_service',
              actorUserId: scope.ownerUserId,
              recordRevision: nextRecordRevision,
              preferenceRevision: record.preferenceRevision,
              changedInputs: ['outputFrame'],
              invalidation,
              createdAt: timestamp,
            }],
            idempotencyRecords: [...record.idempotencyRecords, {
              operation: 'invalidate_output_frame',
              idempotencyKey,
              requestHash,
              committedRecordRevision: nextRecordRevision,
              completedAt: timestamp,
            }],
            updatedAt: timestamp,
          }
          const result = { preferenceRecord: toExactEditPreferenceView(nextRecord), invalidation, replayed: false }
          nextRecord.idempotencyRecords.at(-1)!.responseSnapshot = cloneJson(result)
          return {
            changed: true,
            record: nextRecord,
            result,
          }
        },
      })

      return { ...result, warnings: exactEditPreferenceWarnings('Output-frame changes require a fresh confirmation, plan, and estimate.') }
    },

    async lockForLifecycle(input: LockExactEditPreferencesInput) {
      const validated = lockExactEditPreferencesSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedRevision: input.expectedRevision,
        phase: input.phase,
        authorityReferenceId: input.authorityReferenceId,
      })
      if (!validated.success) throw requestValidationError(validated.error.flatten())
      const scope = await authorizeExactEditPreferenceScope(
        context,
        validated.data.workspaceId,
        input.projectId,
        input.editSessionId,
        'write',
      )
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const requestHash = hashMutationRequest('lock_lifecycle', scope, validated.data)
      const timestamp = nowIso()

      const result = await mutatePrivateExactEditPreferenceRecord({
        scope,
        mutation: (current) => {
          const record = requireInitializedRecord(current)
          const replay = inspectIdempotencyReplay(record, 'lock_lifecycle', idempotencyKey, requestHash)
          if (replay === 'exact') {
            const responseSnapshot = exactEditReplaySnapshot<{
              preferenceRecord: ExactEditPreferenceView
              replayed: boolean
            }>(record, 'lock_lifecycle', idempotencyKey)
            if (responseSnapshot) return { changed: false, result: responseSnapshot }
            return { changed: false, result: { preferenceRecord: toExactEditPreferenceView(record), replayed: true } }
          }
          assertExpectedRecordRevision(record, validated.data.expectedRevision)
          assertLifecycleTransition(record.lifecycle, validated.data.phase, validated.data.authorityReferenceId)
          if (
            record.lifecycle.phase === validated.data.phase
            && record.lifecycle.authorityReferenceId === validated.data.authorityReferenceId
          ) {
            return { changed: false, result: { preferenceRecord: toExactEditPreferenceView(record), replayed: false } }
          }

          assertMutationCapacity(record)
          const nextRecordRevision = record.recordRevision + 1
          const nextRecord: PrivateExactEditPreferenceRecord = {
            ...record,
            recordRevision: nextRecordRevision,
            lifecycle: {
              phase: validated.data.phase,
              locked: true,
              authorityReferenceId: validated.data.authorityReferenceId,
              lockedAt: timestamp,
            },
            auditEvents: [...record.auditEvents, {
              id: `exact_edit_preference_audit_${randomUUID()}`,
              eventType: 'exact_edit_preferences_lifecycle_locked',
              actorType: 'internal_service',
              actorUserId: scope.ownerUserId,
              recordRevision: nextRecordRevision,
              preferenceRevision: record.preferenceRevision,
              changedInputs: [],
              authorityReferenceId: validated.data.authorityReferenceId,
              createdAt: timestamp,
            }],
            idempotencyRecords: [...record.idempotencyRecords, {
              operation: 'lock_lifecycle',
              idempotencyKey,
              requestHash,
              committedRecordRevision: nextRecordRevision,
              completedAt: timestamp,
            }],
            updatedAt: timestamp,
          }
          const result = { preferenceRecord: toExactEditPreferenceView(nextRecord), replayed: false }
          nextRecord.idempotencyRecords.at(-1)!.responseSnapshot = cloneJson(result)
          return {
            changed: true,
            record: nextRecord,
            result,
          }
        },
      })

      return {
        ...result,
        warnings: exactEditPreferenceWarnings(
          'Approved or active work is immutable here; preference changes must enter the Chat-led revision and replanning flow.',
        ),
      }
    },
  }
}

export function deriveExactEditPlanningInvalidation(
  planning: ExactEditPreferencePlanningState,
  cause: ExactEditPlanningInvalidation['cause'],
  changedInputs: ExactEditPlanningInputKey[],
  invalidatedAt: string,
): ExactEditPlanningInvalidation {
  const sourcePreparationReset = changedInputs.includes('cleanupPreference')
  const frameConfirmationReset = changedInputs.includes('targetPlatform') || changedInputs.includes('outputFrame')
  return {
    cause,
    changedInputs: [...changedInputs],
    draftPlanCleared: Boolean(planning.draftPlan),
    draftEstimateCleared: Boolean(planning.draftEstimate),
    sourcePreparationReset,
    frameConfirmationReset,
    invalidatedAt,
  }
}

async function authorizeExactEditPreferenceScope(
  context: ServiceContext,
  workspaceIdInput: string,
  projectIdInput: string,
  editSessionIdInput: string,
  operation: 'read' | 'write',
): Promise<ExactEditPreferenceStoreScope> {
  requirePrivateExactEditPreferenceRuntime(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError(
      'AUTH_INVALID',
      'Exact-edit preference authority requires a verified bearer-authenticated user.',
      401,
    )
  }
  const workspaceId = parseScopeId(workspaceIdInput, 'workspace')
  const projectId = parseScopeId(projectIdInput, 'project')
  const editSessionId = parseScopeId(editSessionIdInput, 'edit session')
  const access = await authorizeWorkspaceAccess(context, workspaceId, operation)
  const project = (await createProjectService(context).getProject(projectId, access.workspaceId)).project
  if (project.id !== projectId || project.workspaceId !== access.workspaceId) {
    throw new ApiError('PROJECT_NOT_FOUND', 'Project tenancy evidence did not match the exact edit.', 404)
  }
  return {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: access.userId,
    workspaceId: access.workspaceId,
    projectId,
    editSessionId,
  }
}

function requirePrivateExactEditPreferenceRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv !== 'production'
    && context.env.mode === 'local'
    && context.env.storageMode === 'local'
    && context.env.allowInternalTestExecutionWithSupabase
    && context.clients.admin
  ) return

  throw new ApiError(
    'TOOL_NOT_READY',
    'Exact-edit preference writes are blocked until the tenant-bound transactional database authority is deployed.',
    503,
    {
      requiredGates: [
        'canonical_exact_edit_preference_table',
        'atomic_compare_and_swap_rpc',
        'two_user_two_workspace_rls_evidence',
        'approval_lock_transaction_coupling',
      ],
    },
  )
}

async function resolveCreationBaseline(
  context: ServiceContext,
  workspaceId: string,
): Promise<ExactEditPreferenceBaseline> {
  const savedResult = await createEditPreferenceService(context).getCurrent(workspaceId)
  const saved = savedResult.preferenceRecord?.preferences
  const capturedAt = nowIso()
  if (!saved) {
    return {
      values: cloneJson(SERVER_DEFAULT_EXACT_EDIT_PREFERENCES),
      preferenceSnapshotId: 'server-default-exact-edit-preferences-v1',
      capturedAt,
      persistenceSource: 'server_defaults',
      provenance: 'server_default_preferences',
    }
  }
  const values = exactEditPreferenceValuesSchema.safeParse({
    editLevel: saved.editLevel,
    workflowType: saved.workflowType,
    cleanupPreference: saved.cleanupPreference,
    visualPreference: saved.visualPreference,
    moodStyle: saved.moodStyle,
    creditPreference: saved.creditPreference,
    targetPlatform: saved.targetPlatform,
  })
  if (!values.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Saved Edit Preferences could not be copied into a typed exact-edit baseline.',
      409,
      values.error.flatten(),
    )
  }
  return {
    values: values.data,
    preferenceSnapshotId: parseScopeId(saved.snapshotId, 'saved preference snapshot'),
    capturedAt,
    persistenceSource: 'authenticated_private_internal_backend',
    provenance: 'saved_edit_preferences',
  }
}

async function resolveCanonicalLifecycleLock(
  scope: ExactEditPreferenceStoreScope,
): Promise<EffectiveLifecycleLock> {
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot: scope.localStorageRoot,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
  })
  if (!aggregate) return { phase: 'planning', locked: false }

  const matchingApprovedPlan = aggregate.plans.find((plan) =>
    plan.projectId === scope.projectId
    && plan.editSessionId === scope.editSessionId
    && plan.status === 'approved'
  )
  if (!matchingApprovedPlan) return { phase: 'planning', locked: false }
  const matchingSnapshot = aggregate.snapshots.find((snapshot) =>
    snapshot.planId === matchingApprovedPlan.id
  )
  const matchingReservation = aggregate.reservations.find((reservation) =>
    reservation.planId === matchingApprovedPlan.id
    && ['reserved', 'partially_spent', 'spent'].includes(reservation.status)
  )
  if (matchingReservation) {
    return {
      phase: 'credit_reserved',
      locked: true,
      authorityReferenceId: matchingReservation.id,
      lockedAt: matchingReservation.reservedAt,
    }
  }
  if (matchingSnapshot) {
    return {
      phase: 'approved_snapshot',
      locked: true,
      authorityReferenceId: matchingSnapshot.snapshotId,
      lockedAt: matchingSnapshot.approvedAt,
    }
  }
  return {
    phase: 'approved_snapshot',
    locked: true,
    authorityReferenceId: matchingApprovedPlan.id,
    lockedAt: matchingApprovedPlan.approvedAt ?? matchingApprovedPlan.createdAt,
  }
}

function applyPlanningInvalidation(
  planning: ExactEditPreferencePlanningState,
  invalidation: ExactEditPlanningInvalidation,
  values: ExactEditPreferenceValues,
): ExactEditPreferencePlanningState {
  return {
    ...planning,
    planningInputRevision: planning.planningInputRevision + 1,
    preferenceFingerprintSha256: exactEditPreferenceFingerprint(values),
    replanRequired: true,
    reestimateRequired: true,
    draftPlan: undefined,
    draftEstimate: undefined,
    sourcePreparation: invalidation.sourcePreparationReset
      ? { status: 'requires_repreparation', updatedAt: invalidation.invalidatedAt }
      : planning.sourcePreparation,
    frameConfirmation: invalidation.frameConfirmationReset
      ? { status: 'requires_reconfirmation', updatedAt: invalidation.invalidatedAt }
      : planning.frameConfirmation,
    lastInvalidation: invalidation,
  }
}

function mergePlanningEvidence(
  planning: ExactEditPreferencePlanningState,
  input: SetExactEditPlanningEvidenceBody,
  timestamp: string,
): ExactEditPreferencePlanningState {
  const draftPlan = input.draftPlan === undefined
    ? planning.draftPlan
    : input.draftPlan === null
      ? undefined
      : { ...input.draftPlan, recordedAt: timestamp }
  const draftEstimate = input.draftEstimate === undefined
    ? planning.draftEstimate
    : input.draftEstimate === null
      ? undefined
      : { ...input.draftEstimate, recordedAt: timestamp }
  const sourcePreparation = input.sourcePreparation === undefined
    ? planning.sourcePreparation
    : toSourcePreparationState(input.sourcePreparation, timestamp)
  const frameConfirmation = input.frameConfirmation === undefined
    ? planning.frameConfirmation
    : toFrameConfirmationState(input.frameConfirmation, timestamp)

  return {
    ...planning,
    draftPlan,
    draftEstimate,
    sourcePreparation,
    frameConfirmation,
    replanRequired: input.draftPlan === undefined ? planning.replanRequired : input.draftPlan === null,
    reestimateRequired: input.draftEstimate === undefined ? planning.reestimateRequired : input.draftEstimate === null,
  }
}

function toSourcePreparationState(
  input: NonNullable<SetExactEditPlanningEvidenceBody['sourcePreparation']>,
  timestamp: string,
): ExactEditSourcePreparationState {
  if (input.status === 'ready') return { ...input, updatedAt: timestamp }
  return { status: input.status, updatedAt: timestamp }
}

function toFrameConfirmationState(
  input: NonNullable<SetExactEditPlanningEvidenceBody['frameConfirmation']>,
  timestamp: string,
): ExactEditFrameConfirmationState {
  if (input.status === 'confirmed') return { ...input, updatedAt: timestamp }
  return { status: input.status, updatedAt: timestamp }
}

function planningEvidenceChanges(
  planning: ExactEditPreferencePlanningState,
  input: SetExactEditPlanningEvidenceBody,
): boolean {
  if (input.draftPlan !== undefined && stableHash(input.draftPlan) !== stableHash(stripRecordedAt(planning.draftPlan))) return true
  if (input.draftEstimate !== undefined && stableHash(input.draftEstimate) !== stableHash(stripRecordedAt(planning.draftEstimate))) return true
  if (
    input.sourcePreparation !== undefined
    && stableHash(input.sourcePreparation) !== stableHash(stripUpdatedAt(planning.sourcePreparation))
  ) return true
  if (
    input.frameConfirmation !== undefined
    && stableHash(input.frameConfirmation) !== stableHash(stripUpdatedAt(planning.frameConfirmation))
  ) return true
  return false
}

function inspectIdempotencyReplay(
  record: PrivateExactEditPreferenceRecord,
  operation: ExactEditMutationOperation,
  idempotencyKey: string,
  requestHash: string,
): 'none' | 'exact' {
  const existing = record.idempotencyRecords.find((entry) =>
    entry.operation === operation && entry.idempotencyKey === idempotencyKey
  )
  if (!existing) return 'none'
  if (existing.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with another exact-edit preference request.', 409)
  }
  if (existing.responseSnapshot === undefined && existing.committedRecordRevision !== record.recordRevision) {
    throw new ApiError(
      'IDEMPOTENCY_REPLAY_UNAVAILABLE',
      'The original exact-edit preference response was superseded; the mutation will not run again.',
      503,
    )
  }
  return 'exact'
}

function exactEditReplaySnapshot<T>(
  record: PrivateExactEditPreferenceRecord,
  operation: ExactEditMutationOperation,
  idempotencyKey: string,
): T | undefined {
  const responseSnapshot = record.idempotencyRecords.find((entry) =>
    entry.operation === operation && entry.idempotencyKey === idempotencyKey
  )?.responseSnapshot
  return responseSnapshot === undefined ? undefined : cloneJson(responseSnapshot) as T
}

function assertMutationCapacity(record: PrivateExactEditPreferenceRecord): void {
  if (record.auditEvents.length >= MAX_EXACT_EDIT_PREFERENCE_AUDIT_EVENTS) {
    throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', 'Exact-edit preference audit capacity was reached.', 503)
  }
  if (record.idempotencyRecords.length >= MAX_EXACT_EDIT_PREFERENCE_IDEMPOTENCY_RECORDS) {
    throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', 'Exact-edit preference idempotency capacity was reached.', 503)
  }
}

function assertExactEditPreferencesMutable(
  record: PrivateExactEditPreferenceRecord,
  canonicalLock: EffectiveLifecycleLock,
): void {
  if (record.lifecycle.locked) throw approvedEditPreferenceLockError(record.lifecycle)
  if (canonicalLock.locked) throw approvedEditPreferenceLockError(canonicalLock)
}

function approvedEditPreferenceLockError(lock: EffectiveLifecycleLock): ApiError {
  return new ApiError(
    'PLAN_NOT_APPROVED',
    'Approved or active edit preferences are immutable. Request a Chat-led revision and create a new plan version.',
    409,
    {
      lifecyclePhase: lock.phase,
      requiredFlow: 'chat_led_revision_replanning_and_new_approval',
    },
  )
}

function assertExpectedRecordRevision(record: PrivateExactEditPreferenceRecord, expectedRevision: number): void {
  if (record.recordRevision !== expectedRevision) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Exact-edit preferences changed after they were loaded. Reload before applying this edit.',
      409,
      { expectedRevision, currentRevision: record.recordRevision },
    )
  }
}

function assertLifecycleTransition(
  lifecycle: ExactEditPreferenceLifecycleState,
  nextPhase: ExactEditLifecycleLockPhase,
  nextReferenceId: string,
): void {
  if (!lifecycle.locked) return
  if (lifecycle.phase === nextPhase && lifecycle.authorityReferenceId === nextReferenceId) return
  const currentRank = lifecyclePhaseRank(lifecycle.phase)
  const nextRank = lifecyclePhaseRank(nextPhase)
  if (nextRank < currentRank) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Exact-edit lifecycle lock cannot move backward.', 409)
  }
}

function lifecyclePhaseRank(phase: ExactEditPreferenceLifecycleState['phase']): number {
  return {
    planning: 0,
    approved_snapshot: 1,
    credit_reserved: 2,
    executing: 3,
    private_review: 4,
    completed_internal: 5,
    revision_handoff: 6,
  }[phase]
}

function changedPreferenceFields(
  current: ExactEditPreferenceValues,
  next: ExactEditPreferenceValues,
): ExactEditPreferenceFieldKey[] {
  return exactEditPreferenceFieldKeys.filter((field) => current[field] !== next[field])
}

function requireInitializedRecord(
  record: PrivateExactEditPreferenceRecord | undefined,
): PrivateExactEditPreferenceRecord {
  if (record) return record
  throw new ApiError(
    'VALIDATION_FAILED',
    'Exact-edit preferences must be initialized by the edit-creation backend before they can be changed.',
    409,
  )
}

function toExactEditPreferenceView(
  record: PrivateExactEditPreferenceRecord,
  canonicalLock: EffectiveLifecycleLock = { phase: 'planning', locked: false },
): ExactEditPreferenceView {
  const effectiveLifecycle = record.lifecycle.locked ? record.lifecycle : canonicalLock
  return cloneJson({
    schemaVersion: record.schemaVersion,
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    baseline: record.baseline,
    values: record.values,
    overrideKeys: record.overrideKeys,
    recordRevision: record.recordRevision,
    preferenceRevision: record.preferenceRevision,
    preferenceUpdatedAt: record.preferenceUpdatedAt,
    planning: record.planning,
    lifecycle: effectiveLifecycle,
    auditSummary: {
      eventCount: record.auditEvents.length,
      latestEventAt: record.auditEvents.at(-1)?.createdAt ?? record.createdAt,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    privateInternalOnly: true as const,
  })
}

function parseScopeId(value: string, label: string): string {
  const parsed = exactEditPreferenceScopeIdSchema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', `A safe ${label} id is required.`, 400)
  return parsed.data
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (!normalized) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required for exact-edit preference mutations.', 400)
  if (normalized.length > 240 || containsControlCharacter(normalized)) {
    throw new ApiError('VALIDATION_FAILED', 'Exact-edit preference Idempotency-Key is invalid.', 400)
  }
  return normalized
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function hashMutationRequest(
  operation: ExactEditMutationOperation,
  scope: ExactEditPreferenceStoreScope,
  value: unknown,
): string {
  return stableHash({
    operation,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    value,
  })
}

function stableHash(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value))
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, stableValue(entryValue)]),
  )
}

function stripRecordedAt<T extends { recordedAt?: string } | undefined>(value: T): Omit<NonNullable<T>, 'recordedAt'> | null {
  if (!value) return null
  const { recordedAt, ...rest } = value
  void recordedAt
  return rest
}

function stripUpdatedAt<T extends { updatedAt: string }>(value: T): Omit<T, 'updatedAt'> {
  const { updatedAt, ...rest } = value
  void updatedAt
  return rest
}

function requestValidationError(details: unknown): ApiError {
  return new ApiError('VALIDATION_FAILED', 'Exact-edit preference request validation failed.', 400, details)
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function exactEditPreferenceWarnings(...extra: string[]): string[] {
  return [
    ...extra,
    'Exact-edit preferences use private single-host internal-test persistence only.',
    'Production Supabase durability, RLS, distributed CAS, and approval-transaction coupling are not claimed.',
    'No provider, worker, render, export, billing, wallet, reservation, or credit side effect occurs here.',
  ]
}
