import assert from 'node:assert/strict'

import { createInternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'
import { evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard } from '../services/internal-beta-approved-snapshot-service-role-persistence-guard'
import type { ApprovedPlanSnapshotPayload } from '../../src/backend/cloud/approved-plan-snapshot-contracts'

function buildPayload(): ApprovedPlanSnapshotPayload {
  return {
    compiledIntent: { intentId: 'compiled_intent_guard_smoke' },
    confirmedSettings: { aspectRatio: '16:9', aspectRatioConfirmed: true },
    sourceOrder: [{ mediaAssetId: 'media_asset_guard_001', order: 1 }],
    professionalEditingDirective: { qualityFloor: 'professional_basic' },
    segmentOperations: [{ segmentId: 'segment_guard_001', operationId: 'operation_guard_001' }],
    visualAssetPlan: { items: [] },
    rendererPlan: { renderer: 'remotion_future_worker', execution: 'not_run' },
    qaPlan: { checks: ['intent_match'] },
    providerRouting: { realCalls: false },
    modelTierPolicy: { basicProVeoAllowed: false },
    fallbackPolicy: { requiresUserReviewForMeaningChange: true },
    creditEstimate: { creditEstimateId: 'credit_estimate_guard_001', credits: 4 },
    approvalRecord: { approvedByUserId: 'user_guard_001', approvedAt: '2026-06-26T00:00:00.000Z' },
  }
}

const baseInput = {
  workspaceId: 'workspace_guard_001',
  projectId: 'project_guard_001',
  chatSessionId: 'chat_session_guard_001',
  editPlanId: 'edit_plan_guard_001',
  editPlanVersionId: 'edit_plan_version_guard_001',
  creditEstimateId: 'credit_estimate_guard_001',
  creditApprovalId: 'credit_approval_guard_001',
  creditReservationId: 'credit_reservation_guard_001',
  approvedByUserId: 'user_guard_001',
  approvedAt: '2026-06-26T00:00:00.000Z',
  idempotencyKey: 'idempotency_guard_001',
  snapshotPayload: buildPayload(),
}

function assertNoExecution(result: ReturnType<typeof evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard>) {
  assert.equal(result.persistedToSupabase, false)
  assert.equal(result.routeExecution, false)
  assert.equal(result.serviceRoleRouteExecution, false)
  assert.equal(result.remoteSupabaseMutation, false)
  assert.equal(result.sqlExecution, false)
  assert.equal(result.migrationApply, false)
  assert.equal(result.creditMutation, false)
  assert.equal(result.jobEnqueue, false)
  assert.equal(result.workerExecution, false)
  assert.equal(result.workerDispatch, false)
  assert.equal(result.signedUrlCreation, false)
  assert.equal(result.publicArtifactCreation, false)
  assert.equal(result.internalBetaUnlock, false)
}

const missingCredential = evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard(baseInput)
assert.equal(missingCredential.ok, false)
assert.equal(missingCredential.status, 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias')
assert.equal(missingCredential.localSnapshotRuntime.ok, true)
assertNoExecution(missingCredential)

const credentialContext = createInternalBetaSupabaseCredentialContextContract({
  SUPABASE_ACCESS_TOKEN: 'present-for-presence-only',
  REEDITPRO_SUPABASE_READONLY_DB_URL: 'present-for-presence-only',
})

const missingTargetValidation = evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard({
  ...baseInput,
  supabaseCredentialContext: credentialContext,
})
assert.equal(missingTargetValidation.ok, false)
assert.equal(missingTargetValidation.status, 'blocked_pending_confirmed_supabase_target_rls_storage_validation')
assertNoExecution(missingTargetValidation)

const missingServiceRoleApproval = evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard({
  ...baseInput,
  supabaseCredentialContext: credentialContext,
  confirmedSupabaseTargetValidation: true,
})
assert.equal(missingServiceRoleApproval.ok, false)
assert.equal(missingServiceRoleApproval.status, 'blocked_pending_service_role_persistence_runtime_approval')
assertNoExecution(missingServiceRoleApproval)

const readyForSeparateImplementation = evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard({
  ...baseInput,
  supabaseCredentialContext: credentialContext,
  confirmedSupabaseTargetValidation: true,
  serviceRolePersistenceRuntimeApproved: true,
  remotePersistenceConfirmation: true,
})
assert.equal(readyForSeparateImplementation.ok, true)
assert.equal(
  readyForSeparateImplementation.status,
  'ready_for_separate_service_role_persistence_implementation_no_supabase_write',
)
assert.equal(readyForSeparateImplementation.readyForSeparatePersistenceImplementation, true)
assertNoExecution(readyForSeparateImplementation)

console.log('internal-beta-approved-snapshot-service-role-persistence-guard-smoke passed')
