import assert from 'node:assert/strict'

import { createInternalBetaSupabaseCredentialContextContract } from '../config/internal-beta-supabase-credential-context-contract'
import { createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation } from '../services/internal-beta-approved-snapshot-service-role-persistence-implementation'
import type { ApprovedPlanSnapshotPayload } from '../../src/backend/cloud/approved-plan-snapshot-contracts'

const ids = {
  workspaceId: '11111111-1111-4111-8111-111111111111',
  projectId: '22222222-2222-4222-8222-222222222222',
  chatSessionId: '33333333-3333-4333-8333-333333333333',
  editPlanId: '44444444-4444-4444-8444-444444444444',
  editPlanVersionId: '55555555-5555-4555-8555-555555555555',
  creditEstimateId: '66666666-6666-4666-8666-666666666666',
  creditApprovalId: '77777777-7777-4777-8777-777777777777',
  creditReservationId: '88888888-8888-4888-8888-888888888888',
  approvedByUserId: '99999999-9999-4999-8999-999999999999',
}

function buildPayload(): ApprovedPlanSnapshotPayload {
  return {
    compiledIntent: { intentId: 'compiled_intent_impl_smoke' },
    confirmedSettings: { aspectRatio: '16:9', aspectRatioConfirmed: true },
    sourceOrder: [{ mediaAssetId: 'media_asset_impl_001', order: 1 }],
    professionalEditingDirective: { qualityFloor: 'professional_basic' },
    segmentOperations: [{ segmentId: 'segment_impl_001', operationId: 'operation_impl_001' }],
    visualAssetPlan: { items: [] },
    rendererPlan: { renderer: 'remotion_future_worker', execution: 'not_run' },
    qaPlan: { checks: ['intent_match', 'approval_snapshot_integrity'] },
    providerRouting: { realCalls: false },
    modelTierPolicy: { basicProVeoAllowed: false, premiumVeoFinalFallbackOnly: true },
    fallbackPolicy: { requiresUserReviewForMeaningChange: true },
    creditEstimate: { creditEstimateId: ids.creditEstimateId, credits: 4 },
    approvalRecord: { approvedByUserId: ids.approvedByUserId, approvedAt: '2026-06-26T00:00:00.000Z' },
    renderPolicy: { finalExport: false, previewOnlyUntilWorkerGate: true },
  }
}

const credentialContext = createInternalBetaSupabaseCredentialContextContract({
  SUPABASE_ACCESS_TOKEN: 'present-for-presence-only',
  REEDITPRO_STAGING_SUPABASE_DB_URL: 'present-for-presence-only',
})

const baseInput = {
  ...ids,
  approvedAt: '2026-06-26T00:00:00.000Z',
  idempotencyKey: 'approved-snapshot-service-role-impl-smoke-001',
  snapshotPayload: buildPayload(),
  supabaseCredentialContext: credentialContext,
  confirmedSupabaseTargetValidation: true,
  serviceRolePersistenceRuntimeApproved: true,
  remotePersistenceConfirmation: true,
  metadata: {
    sourcePacket: 'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1',
    fixture: 'local-smoke-no-remote-write',
  },
}

function assertNoExecution(
  result: ReturnType<typeof createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation>,
) {
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
  assert.equal(result.externalBetaUnlock, false)
  assert.equal(result.productionUnlock, false)
}

const result = createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation(baseInput)
assert.equal(result.ok, true)
assert.equal(result.status, 'completed_service_role_persistence_envelope_validated_no_remote_write')
assert.equal(result.envelopeValidated, true)
assert.equal(result.backendOnly, true)
assert.equal(result.localOnly, true)
assertNoExecution(result)

assert(result.envelope, 'expected persistence envelope')
assert.equal(result.envelope.approvedPlanSnapshotTable, 'approved_plan_snapshots')
assert.equal(result.envelope.approvalRecordTable, 'approval_records')
assert.equal(result.envelope.apiIdempotencyKeyTable, 'api_idempotency_keys')
assert.equal(result.envelope.auditEventTable, 'audit_events')
assert.match(result.envelope.approvedSnapshotUuid, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/)
assert.equal(result.envelope.approvedPlanSnapshotInsert.workspace_id, ids.workspaceId)
assert.equal(result.envelope.approvedPlanSnapshotInsert.project_id, ids.projectId)
assert.equal(result.envelope.approvedPlanSnapshotInsert.snapshot_status, 'approved')
assert.equal(result.envelope.approvedPlanSnapshotInsert.status, 'approved')
assert.equal(result.envelope.approvedPlanSnapshotInsert.immutable, true)
assert.equal(result.envelope.approvalRecordPatch.approved_snapshot_id, result.envelope.approvedSnapshotUuid)
assert.equal(result.envelope.apiIdempotencyKeyInsert.request_method, 'POST')
assert.equal(result.envelope.apiIdempotencyKeyInsert.response_record_table, 'approved_plan_snapshots')
assert.equal(result.envelope.auditEventInsert.event_type, 'approved_snapshot.service_role_persistence_envelope_validated')
assert.equal((result.envelope.auditEventInsert.event_json as Record<string, unknown>).persistedToSupabase, false)

const repeated = createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation(baseInput)
assert.equal(repeated.envelope?.approvedSnapshotUuid, result.envelope.approvedSnapshotUuid)
assert.equal(repeated.envelope?.requestHash, result.envelope.requestHash)
assertNoExecution(repeated)

const blocked = createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation({
  ...baseInput,
  remotePersistenceConfirmation: false,
})
assert.equal(blocked.ok, false)
assert.equal(blocked.status, 'blocked_pending_service_role_persistence_runtime_approval')
assert.equal(blocked.envelope, undefined)
assertNoExecution(blocked)

const forbidden = createInternalBetaApprovedSnapshotServiceRolePersistenceImplementation({
  ...baseInput,
  snapshotPayload: {
    ...buildPayload(),
    compiledIntent: { rawPrompt: 'must be rejected before envelope creation' },
  },
})
assert.equal(forbidden.ok, false)
assert.equal(forbidden.status, 'blocked_invalid_approved_snapshot_persistence_input')
assert.equal(forbidden.envelope, undefined)
assertNoExecution(forbidden)

console.log('internal-beta-approved-snapshot-service-role-persistence-implementation-smoke passed')
