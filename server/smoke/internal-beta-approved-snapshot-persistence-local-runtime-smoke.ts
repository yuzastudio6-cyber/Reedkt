import assert from 'node:assert/strict'

import {
  createInternalBetaApprovedSnapshotLocalRuntime,
  type InternalBetaApprovedSnapshotPersistenceInput,
} from '../services/internal-beta-approved-snapshot-persistence-local-runtime'
import type { ApprovedPlanSnapshotPayload } from '../../src/backend/cloud/approved-plan-snapshot-contracts'

function buildPayload(overrides: Partial<ApprovedPlanSnapshotPayload> = {}): ApprovedPlanSnapshotPayload {
  return {
    compiledIntent: { intentId: 'compiled_intent_internal_beta_smoke', source: 'structured_intent' },
    confirmedSettings: { aspectRatio: '16:9', aspectRatioConfirmed: true, editLevel: 'basic' },
    sourceOrder: [{ mediaAssetId: 'media_asset_smoke_001', order: 1 }],
    professionalEditingDirective: { pacing: 'clean', qualityFloor: 'professional_basic' },
    segmentOperations: [{ segmentId: 'segment_001', operationId: 'operation_001', operation: 'trim_cleanly' }],
    visualAssetPlan: { items: [], policy: 'no_generation_without_approval' },
    rendererPlan: { renderer: 'remotion_future_worker', execution: 'not_run' },
    qaPlan: { checks: ['intent_match', 'professional_quality'], execution: 'future_worker' },
    providerRouting: { providers: [], realCalls: false },
    modelTierPolicy: { basicProVeoAllowed: false, premiumVeoFinalFallbackOnly: true },
    fallbackPolicy: { requiresUserReviewForMeaningChange: true },
    creditEstimate: { creditEstimateId: 'credit_estimate_smoke_001', credits: 4 },
    approvalRecord: { approvedByUserId: 'user_smoke_001', approvedAt: '2026-06-26T00:00:00.000Z' },
    ...overrides,
  }
}

function buildInput(overrides: Partial<InternalBetaApprovedSnapshotPersistenceInput> = {}): InternalBetaApprovedSnapshotPersistenceInput {
  return {
    workspaceId: 'workspace_smoke_001',
    projectId: 'project_smoke_001',
    chatSessionId: 'chat_session_smoke_001',
    editPlanId: 'edit_plan_smoke_001',
    editPlanVersionId: 'edit_plan_version_smoke_001',
    creditEstimateId: 'credit_estimate_smoke_001',
    creditApprovalId: 'credit_approval_smoke_001',
    creditReservationId: 'credit_reservation_smoke_001',
    approvedByUserId: 'user_smoke_001',
    approvedAt: '2026-06-26T00:00:00.000Z',
    idempotencyKey: 'idempotency_internal_beta_approved_snapshot_smoke_001',
    snapshotPayload: buildPayload(),
    metadata: { source: 'internal_beta_approved_snapshot_persistence_smoke' },
    ...overrides,
  }
}

function assertSafeBoundary(result: ReturnType<typeof createInternalBetaApprovedSnapshotLocalRuntime>) {
  assert.equal(result.localOnly, true, 'runtime must stay local only')
  assert.equal(result.persistedToSupabase, false, 'runtime must not persist to Supabase')
  assert.equal(result.safety.routeExecution, false, 'runtime must not execute routes')
  assert.equal(result.safety.remoteSupabaseMutation, false, 'runtime must not mutate Supabase')
  assert.equal(result.safety.sqlExecution, false, 'runtime must not execute SQL')
  assert.equal(result.safety.serviceRoleRouteExecution, false, 'runtime must not execute service-role routes')
  assert.equal(result.safety.serviceRoleSecretPayloadAccess, false, 'runtime must not access service-role secret payloads')
  assert.equal(result.safety.creditMutation, false, 'runtime must not mutate credits')
  assert.equal(result.safety.creditReservationCreation, false, 'runtime must not create reservations')
  assert.equal(result.safety.jobEnqueue, false, 'runtime must not enqueue jobs')
  assert.equal(result.safety.workerExecution, false, 'runtime must not execute workers')
  assert.equal(result.safety.workerDispatch, false, 'runtime must not dispatch workers')
  assert.equal(result.safety.providerModelCall, false, 'runtime must not call providers/models')
  assert.equal(result.safety.rawPromptExecution, false, 'runtime must not execute raw prompts')
  assert.equal(result.safety.renderExportExecution, false, 'runtime must not render/export')
  assert.equal(result.safety.signedUrlCreation, false, 'runtime must not create signed URLs')
  assert.equal(result.safety.publicArtifactCreation, false, 'runtime must not create public artifacts')
  assert.equal(result.safety.internalBetaUnlock, false, 'runtime must not unlock internal beta')
}

const valid = createInternalBetaApprovedSnapshotLocalRuntime(buildInput())
assert.equal(valid.ok, true, 'valid snapshot runtime should pass local validation')
assert.equal(valid.status, 'local_snapshot_persistence_validated_no_supabase_write')
assert.equal(valid.immutableSnapshotRecordCreated, true)
assert.equal(valid.snapshot?.snapshotStatus, 'execution_ready')
assert.equal(valid.snapshot?.creditReservationId, 'credit_reservation_smoke_001')
assert.match(valid.snapshotHash ?? '', /^[a-f0-9]{64}$/)
assert.equal(valid.snapshot?.snapshotHash, valid.snapshotHash)
assert.equal(valid.snapshot?.metadata?.localRuntime, true)
assert.equal(valid.snapshot?.metadata?.persistenceMode, 'local_validation_only_no_supabase_write')
assertSafeBoundary(valid)

const repeated = createInternalBetaApprovedSnapshotLocalRuntime(buildInput())
assert.equal(repeated.snapshotHash, valid.snapshotHash, 'same approved snapshot basis should hash deterministically')
assertSafeBoundary(repeated)

const missingReservation = createInternalBetaApprovedSnapshotLocalRuntime(buildInput({ creditReservationId: undefined }))
assert.equal(missingReservation.ok, false)
assert.equal(missingReservation.status, 'blocked_invalid_approved_snapshot_persistence_input')
assert.ok(
  missingReservation.validation.errors.some((error) => error.includes('creditReservationId')),
  'missing credit reservation must block local snapshot readiness',
)
assertSafeBoundary(missingReservation)

const rawChat = createInternalBetaApprovedSnapshotLocalRuntime(
  buildInput({
    snapshotPayload: buildPayload({
      approvalRecord: { approvedByUserId: 'user_smoke_001', rawChat: 'make it viral without plan approval' },
    }),
  }),
)
assert.equal(rawChat.ok, false)
assert.ok(
  rawChat.validation.errors.some((error) => error.includes('raw chat')),
  'raw chat fields must be rejected',
)
assertSafeBoundary(rawChat)

const signedUrl = createInternalBetaApprovedSnapshotLocalRuntime(
  buildInput({
    snapshotPayload: buildPayload({
      rendererPlan: { signedUrl: 'https://example.test/render.mp4?x-goog-signature=abc123' },
    }),
  }),
)
assert.equal(signedUrl.ok, false)
assert.ok(
  signedUrl.validation.errors.some((error) => error.includes('signed URL') || error.includes('signedUrl')),
  'signed URL fields must be rejected',
)
assertSafeBoundary(signedUrl)

console.log('internal-beta-approved-snapshot-persistence-local-runtime-smoke passed')
