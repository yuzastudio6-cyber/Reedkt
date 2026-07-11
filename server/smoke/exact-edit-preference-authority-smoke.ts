import assert from 'node:assert/strict'
import { readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createEditPreferenceService } from '../services/edit-preference-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import {
  clearPrivateExactEditPreferenceProcessStateForSmoke,
  readPrivateExactEditPreferenceRecord,
} from '../services/private-exact-edit-preference-store'
import { clearLocalProjectMemoryForSmoke, createProjectService } from '../services/project-service'
import type { ServiceContext } from '../types'
import { exactEditPreferenceValuesSchema } from '../validation/exact-edit-preference-schemas'

const localStorageRoot = '/tmp/reeditpro-exact-edit-preference-authority-smoke'
const workspaceId = 'workspace-exact-edit-preference-smoke'
const userId = 'user-exact-edit-preference-smoke'
const editSessionId = 'edit-session-exact-edit-preference-smoke'
await rm(localStorageRoot, { recursive: true, force: true })
clearLocalProjectMemoryForSmoke()
clearPrivateExactEditPreferenceProcessStateForSmoke()

const memberships = [
  { workspaceId, userId, role: 'owner' },
  { workspaceId, userId: 'other-exact-edit-user', role: 'editor' },
]
const admin = createMembershipAdminClient(memberships)
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://exact-edit-preference-smoke.supabase.co',
  SUPABASE_ANON_KEY: 'exact-edit-preference-smoke-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'exact-edit-preference-smoke-service-role',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})
const context: ServiceContext = {
  env,
  clients: { admin, public: null },
  requestId: 'exact-edit-preference-authority-smoke',
  auth: {
    userId,
    accessToken: 'verified-exact-edit-preference-smoke-token',
    isMockUser: false,
  },
}

assert.equal(exactEditPreferenceValuesSchema.safeParse({
  editLevel: 'premium',
  workflowType: 'real_estate_property_tour',
  cleanupPreference: 'custom',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'corporate',
  creditPreference: 'balanced',
  targetPlatform: 'youtube',
}).success, true, 'Exact-edit schema must cover the complete planning enum surface.')

const project = (await createProjectService(context).createProject({
  workspaceId,
  name: 'Exact edit preference authority smoke',
})).project

const savedPreferenceService = createEditPreferenceService(context)
const firstSavedPreferences = await savedPreferenceService.upsertCurrent({
  workspaceId,
  idempotencyKey: 'saved-preferences-for-exact-edit-v1',
  preferences: {
    applyConfirmedDefaults: true,
    cleanupPreference: 'aggressive_cleanup',
    creditPreference: 'premium_best_result',
    editLevel: 'premium',
    moodStyle: 'cinematic',
    targetPlatform: 'youtube',
    visualPreference: 'more_graphic_design',
    workflowType: 'marketing_ad',
  },
})

const service = createExactEditPreferenceService(context)
const initialized = await service.initialize({
  workspaceId,
  projectId: project.id,
  editSessionId,
  idempotencyKey: 'initialize-exact-edit-preferences',
})
assert.equal(initialized.created, true)
assert.equal(initialized.replayed, false)
assert.equal(initialized.preferenceRecord.recordRevision, 0)
assert.equal(initialized.preferenceRecord.preferenceRevision, 0)
assert.equal(initialized.preferenceRecord.values.workflowType, 'marketing_ad')
assert.equal(initialized.preferenceRecord.values.cleanupPreference, 'aggressive_cleanup')
assert.equal(initialized.preferenceRecord.baseline.provenance, 'saved_edit_preferences')
assert.equal(initialized.preferenceRecord.baseline.persistenceSource, 'authenticated_private_internal_backend')
assert.equal(initialized.preferenceRecord.overrideKeys.length, 0)
assert.equal(initialized.preferenceRecord.planning.frameConfirmation.status, 'unconfirmed')

const initializedReplay = await service.initialize({
  workspaceId,
  projectId: project.id,
  editSessionId,
  idempotencyKey: 'initialize-exact-edit-preferences',
})
assert.equal(initializedReplay.created, false)
assert.equal(initializedReplay.replayed, true)
assert.deepEqual(initializedReplay.preferenceRecord.baseline, initialized.preferenceRecord.baseline)

const savedSnapshotId = firstSavedPreferences.preferenceRecord.preferences.snapshotId
const updatedSavedPreferences = await savedPreferenceService.upsertCurrent({
  workspaceId,
  expectedSnapshotId: savedSnapshotId,
  idempotencyKey: 'saved-preferences-after-exact-edit-v2',
  preferences: {
    applyConfirmedDefaults: true,
    cleanupPreference: 'custom',
    creditPreference: 'low_credit_cost',
    editLevel: 'basic',
    moodStyle: 'clean',
    targetPlatform: 'custom',
    visualPreference: 'no_extra_visuals',
    workflowType: 'simple_clean_edit',
  },
})
assert.equal(updatedSavedPreferences.preferenceRecord.preferences.cleanupPreference, 'custom')
const initializedAfterSavedDefaultChange = await service.initialize({
  workspaceId,
  projectId: project.id,
  editSessionId,
  idempotencyKey: 'initialize-exact-edit-preferences-after-saved-change',
})
assert.equal(initializedAfterSavedDefaultChange.created, false)
assert.equal(
  initializedAfterSavedDefaultChange.preferenceRecord.baseline.values.workflowType,
  'marketing_ad',
  'Later saved-default changes must not move the exact edit creation baseline.',
)

const planningReady = await service.recordPlanningEvidence({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 0,
  idempotencyKey: 'record-initial-planning-evidence',
  draftPlan: { id: 'draft-plan-v1', hash: 'a'.repeat(64), version: 1 },
  draftEstimate: { id: 'draft-estimate-v1', hash: 'b'.repeat(64), version: 1 },
  sourcePreparation: { status: 'ready', evidenceHash: 'c'.repeat(64) },
  frameConfirmation: { status: 'confirmed', aspectRatio: '16:9', confirmationId: 'frame-confirmation-v1' },
})
assert.equal(planningReady.preferenceRecord.recordRevision, 1)
assert.equal(planningReady.preferenceRecord.planning.replanRequired, false)
assert.equal(planningReady.preferenceRecord.planning.reestimateRequired, false)

const visualChangeInput = {
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 1,
  idempotencyKey: 'update-exact-edit-visual-preference',
  patch: { visualPreference: 'no_extra_visuals' as const },
}
const visualChange = await service.updateCurrent(visualChangeInput)
assert.deepEqual(visualChange.changedFields, ['visualPreference'])
assert.equal(visualChange.preferenceRecord.recordRevision, 2)
assert.equal(visualChange.preferenceRecord.preferenceRevision, 1)
assert.equal(visualChange.preferenceRecord.planning.draftPlan, undefined)
assert.equal(visualChange.preferenceRecord.planning.draftEstimate, undefined)
assert.equal(visualChange.preferenceRecord.planning.replanRequired, true)
assert.equal(visualChange.preferenceRecord.planning.reestimateRequired, true)
assert.equal(visualChange.invalidation?.draftPlanCleared, true)
assert.equal(visualChange.invalidation?.draftEstimateCleared, true)
assert.equal(visualChange.invalidation?.sourcePreparationReset, false)
assert.equal(visualChange.invalidation?.frameConfirmationReset, false)
assert.equal(visualChange.preferenceRecord.planning.sourcePreparation.status, 'ready')
assert.equal(visualChange.preferenceRecord.planning.frameConfirmation.status, 'confirmed')
assert.deepEqual(visualChange.preferenceRecord.overrideKeys, ['visualPreference'])

const visualChangeReplay = await service.updateCurrent(visualChangeInput)
assert.deepEqual(visualChangeReplay, visualChange, 'Exact retry must return the bounded persisted response snapshot.')
await expectApiError(
  () => service.updateCurrent({
    ...visualChangeInput,
    patch: { visualPreference: 'keep_visuals_minimal' },
  }),
  'IDEMPOTENCY_CONFLICT',
  'Changed payload must conflict when an exact-edit idempotency key is reused.',
)

const noOp = await service.updateCurrent({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 2,
  idempotencyKey: 'no-op-exact-edit-preference',
  patch: { visualPreference: 'no_extra_visuals' },
})
assert.deepEqual(noOp.changedFields, [])
assert.equal(noOp.preferenceRecord.recordRevision, 2, 'A no-op apply must not create a record revision.')
assert.equal(noOp.preferenceRecord.preferenceRevision, 1, 'A no-op apply must not create a preference revision.')

const planningReadyAgain = await service.recordPlanningEvidence({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 2,
  idempotencyKey: 'record-second-planning-evidence',
  draftPlan: { id: 'draft-plan-v2', hash: 'd'.repeat(64), version: 2 },
  draftEstimate: { id: 'draft-estimate-v2', hash: 'e'.repeat(64), version: 2 },
})
assert.equal(planningReadyAgain.preferenceRecord.recordRevision, 3)

const cleanupAndPlatformChange = await service.updateCurrent({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 3,
  idempotencyKey: 'update-cleanup-and-platform',
  patch: {
    cleanupPreference: 'custom',
    targetPlatform: 'tiktok_reels_shorts',
  },
})
assert.deepEqual(cleanupAndPlatformChange.changedFields, ['cleanupPreference', 'targetPlatform'])
assert.equal(cleanupAndPlatformChange.preferenceRecord.recordRevision, 4)
assert.equal(cleanupAndPlatformChange.preferenceRecord.preferenceRevision, 2)
assert.equal(cleanupAndPlatformChange.invalidation?.sourcePreparationReset, true)
assert.equal(cleanupAndPlatformChange.invalidation?.frameConfirmationReset, true)
assert.equal(cleanupAndPlatformChange.preferenceRecord.planning.sourcePreparation.status, 'requires_repreparation')
assert.equal(cleanupAndPlatformChange.preferenceRecord.planning.frameConfirmation.status, 'requires_reconfirmation')

const concurrent = await Promise.allSettled([
  service.updateCurrent({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 4,
    idempotencyKey: 'concurrent-exact-edit-one',
    patch: { editLevel: 'basic' },
  }),
  service.updateCurrent({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 4,
    idempotencyKey: 'concurrent-exact-edit-two',
    patch: { moodStyle: 'energetic' },
  }),
])
assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1)
assert.equal(concurrent.filter((result) => result.status === 'rejected').length, 1)
const rejectedConcurrent = concurrent.find((result): result is PromiseRejectedResult => result.status === 'rejected')
assert.ok(rejectedConcurrent?.reason instanceof ApiError)
assert.equal(rejectedConcurrent.reason.code, 'IDEMPOTENCY_CONFLICT')

const afterConcurrent = await service.getCurrent(workspaceId, project.id, editSessionId)
assert.ok(afterConcurrent.preferenceRecord)
assert.equal(afterConcurrent.preferenceRecord.recordRevision, 5)
assert.equal(afterConcurrent.preferenceRecord.preferenceRevision, 3)

const planningBeforeFrameChange = await service.recordPlanningEvidence({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 5,
  idempotencyKey: 'planning-before-output-frame-change',
  draftPlan: { id: 'draft-plan-v3', hash: 'f'.repeat(64), version: 3 },
  draftEstimate: { id: 'draft-estimate-v3', hash: '1'.repeat(64), version: 3 },
  sourcePreparation: { status: 'ready', evidenceHash: '2'.repeat(64) },
  frameConfirmation: { status: 'confirmed', aspectRatio: '9:16', confirmationId: 'frame-confirmation-v2' },
})
assert.equal(planningBeforeFrameChange.preferenceRecord.recordRevision, 6)

const frameChange = await service.invalidateForOutputFrameChange({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 6,
  idempotencyKey: 'invalidate-output-frame-change',
})
assert.equal(frameChange.preferenceRecord.recordRevision, 7)
assert.equal(frameChange.preferenceRecord.preferenceRevision, 3)
assert.ok(frameChange.invalidation)
const frameInvalidation = frameChange.invalidation
assert.deepEqual(frameInvalidation.changedInputs, ['outputFrame'])
assert.equal(frameInvalidation.draftPlanCleared, true)
assert.equal(frameInvalidation.draftEstimateCleared, true)
assert.equal(frameInvalidation.frameConfirmationReset, true)
assert.equal(frameInvalidation.sourcePreparationReset, false)
assert.equal(frameChange.preferenceRecord.planning.frameConfirmation.status, 'requires_reconfirmation')
assert.equal(frameChange.preferenceRecord.planning.sourcePreparation.status, 'ready')

const locked = await service.lockForLifecycle({
  workspaceId,
  projectId: project.id,
  editSessionId,
  expectedRevision: 7,
  phase: 'approved_snapshot',
  authorityReferenceId: 'approved-snapshot-exact-edit-v1',
  idempotencyKey: 'lock-exact-edit-after-approval',
})
assert.equal(locked.preferenceRecord.recordRevision, 8)
assert.equal(locked.preferenceRecord.lifecycle.locked, true)
assert.equal(locked.preferenceRecord.lifecycle.phase, 'approved_snapshot')

const visualChangeReplayAfterLaterMutations = await service.updateCurrent(visualChangeInput)
assert.deepEqual(
  visualChangeReplayAfterLaterMutations,
  visualChange,
  'Exact retry must remain replayable after later record revisions without rerunning the mutation.',
)

await expectApiError(
  () => service.updateCurrent({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 8,
    idempotencyKey: 'forbidden-post-approval-preference-change',
    patch: { creditPreference: 'low_credit_cost' },
  }),
  'PLAN_NOT_APPROVED',
  'Approved work must reject in-place preference mutation and require revision flow.',
)
await expectApiError(
  () => service.recordPlanningEvidence({
    workspaceId,
    projectId: project.id,
    editSessionId,
    expectedRevision: 8,
    idempotencyKey: 'forbidden-post-approval-planning-evidence',
    draftPlan: { id: 'forbidden-plan', hash: '3'.repeat(64), version: 4 },
  }),
  'PLAN_NOT_APPROVED',
  'Approved work must reject mutable planning evidence.',
)

clearPrivateExactEditPreferenceProcessStateForSmoke()
clearLocalProjectMemoryForSmoke()
const restarted = await createExactEditPreferenceService(context).getCurrent(workspaceId, project.id, editSessionId)
assert.ok(restarted.preferenceRecord)
assert.equal(restarted.preferenceRecord.recordRevision, 8)
assert.equal(restarted.preferenceRecord.lifecycle.locked, true)
assert.deepEqual(restarted.preferenceRecord.baseline, initialized.preferenceRecord.baseline)

const stored = await readPrivateExactEditPreferenceRecord({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
  projectId: project.id,
  editSessionId,
})
assert.ok(stored)
assert.equal(stored.auditEvents.length, 9)
assert.equal(stored.auditEvents.at(-1)?.eventType, 'exact_edit_preferences_lifecycle_locked')
assert.ok(stored.auditEvents.every((event) => Number.isFinite(Date.parse(event.createdAt))))
assert.equal(stored.overrideKeys.includes('cleanupPreference'), true)
assert.equal(stored.baseline.values.cleanupPreference, 'aggressive_cleanup')

const exactEditDirectory = join(localStorageRoot, 'exact-edit-preferences', 'private-internal-v1')
const exactEditDirectoryMode = (await stat(exactEditDirectory)).mode & 0o777
assert.equal(exactEditDirectoryMode, 0o700)
const recordFiles = (await readdir(exactEditDirectory)).filter((file) => file.endsWith('.json'))
assert.equal(recordFiles.length, 1)
assert.equal((await stat(join(exactEditDirectory, recordFiles[0]!))).mode & 0o777, 0o600)

const otherUserContext: ServiceContext = {
  ...context,
  requestId: 'exact-edit-preference-other-user',
  auth: {
    userId: 'other-exact-edit-user',
    accessToken: 'verified-other-user-token',
    isMockUser: false,
  },
}
await expectApiError(
  () => createExactEditPreferenceService(otherUserContext).getCurrent(workspaceId, project.id, editSessionId),
  'PROJECT_NOT_FOUND',
  'Another workspace member must not read an exact edit owned by another user in the local private scope.',
)

const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'disabled',
  STORAGE_MODE: 'gcs_disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://exact-edit-production-block.supabase.co',
  SUPABASE_ANON_KEY: 'production-block-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'production-block-service-role',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'production-block-internal-token',
})
await expectApiError(
  () => createExactEditPreferenceService({ ...context, env: productionEnv }).getCurrent(
    workspaceId,
    project.id,
    editSessionId,
  ),
  'TOOL_NOT_READY',
  'Production must fail closed until distributed exact-edit preference authority evidence exists.',
)

console.log('Exact-edit preference authority smoke passed.')
console.log(JSON.stringify({
  immutableCreationBaseline: true,
  exactEditTenantScope: true,
  completePreferenceEnums: true,
  compareAndSwapRevision: true,
  noOpApplyDoesNotRevise: true,
  draftPlanAndEstimateInvalidation: true,
  cleanupResetsSourcePreparation: true,
  targetPlatformAndFrameResetConfirmation: true,
  approvalLifecycleLock: true,
  serverAuditEvidence: true,
  sharedSymlinkSafePrivatePersistence: true,
  restartRecovery: true,
  productionFailClosed: true,
  productionClaims: false,
}, null, 2))

async function expectApiError(
  operation: () => Promise<unknown>,
  code: ApiError['code'],
  message: string,
): Promise<void> {
  try {
    await operation()
    assert.fail(message)
  } catch (error) {
    assert.ok(error instanceof ApiError, message)
    assert.equal(error.code, code, message)
  }
}

function createMembershipAdminClient(
  workspaceMemberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected exact-edit preference smoke table: ${tableName}`)
      }
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() {
          return query
        },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = workspaceMemberships.find((candidate) =>
            candidate.workspaceId === selectedWorkspaceId && candidate.userId === selectedUserId
          )
          return {
            data: membership
              ? {
                workspace_id: membership.workspaceId,
                user_id: membership.userId,
                role: membership.role,
              }
              : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}
