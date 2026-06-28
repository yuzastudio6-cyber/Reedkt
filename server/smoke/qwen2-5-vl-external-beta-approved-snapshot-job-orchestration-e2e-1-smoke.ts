import assert from 'node:assert/strict'

import {
  RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_READY_STATUS,
  assertQwen25VlApprovedSnapshotJobOrchestrationE2EResult,
  buildQwen25VlApprovedSnapshotJobOrchestrationE2E,
  type Qwen25VlApprovedSnapshotJobOrchestrationInput,
} from '../services/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e'

function buildInput(
  overrides: Partial<Qwen25VlApprovedSnapshotJobOrchestrationInput> = {},
): Qwen25VlApprovedSnapshotJobOrchestrationInput {
  return {
    workspaceId: 'workspace_qwen_approved_snapshot_orchestration_smoke',
    projectId: 'project_qwen_approved_snapshot_orchestration_smoke',
    editSessionId: 'edit_session_qwen_approved_snapshot_orchestration_smoke',
    editPlanVersionId: 'edit_plan_version_qwen_approved_snapshot_orchestration_smoke',
    approvedSnapshotRef: 'approved_snapshot_qwen_approved_snapshot_orchestration_smoke',
    approvalRecordRef: 'approval_record_qwen_approved_snapshot_orchestration_smoke',
    creditEstimateRef: 'credit_estimate_qwen_approved_snapshot_orchestration_smoke',
    creditReservationRef: 'credit_reservation_qwen_approved_snapshot_orchestration_smoke',
    jobBatchRef: 'job_batch_qwen_approved_snapshot_orchestration_smoke',
    jobRef: 'job_qwen_approved_snapshot_orchestration_smoke',
    workerLeaseRef: 'worker_lease_qwen_approved_snapshot_orchestration_smoke',
    routeIdempotencyKey: 'idempotency_qwen_approved_snapshot_orchestration_smoke',
    providerRequestId: 'provider_request_qwen_approved_snapshot_orchestration_smoke',
    privateInputManifestRef: 'private_input_manifest_qwen_approved_snapshot_orchestration_smoke',
    privateArtifactManifestRef: 'private_artifact_manifest_qwen_approved_snapshot_orchestration_smoke',
    privateArtifactChecksumRef: 'sha256:qwen-approved-snapshot-orchestration-smoke',
    sourceSequenceMapRef: 'source_sequence_map_qwen_approved_snapshot_orchestration_smoke',
    compiledIntentRef: 'compiled_intent_qwen_approved_snapshot_orchestration_smoke',
    modelRoutingPolicyRef: 'model_routing_policy_qwen_approved_snapshot_orchestration_smoke',
    qaPolicyRef: 'qa_policy_qwen_approved_snapshot_orchestration_smoke',
    qwenRuntimeReadinessRollupRef: 'rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1',
    qwenProductRouteRuntimeRunId: 'qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T04-59-27-133Z-37e1aba2',
    approvedSnapshotStatus: 'approved',
    creditReservationStatus: 'reserved',
    jobStatus: 'queued',
    workerLeaseStatus: 'claimed',
    qwenProductRouteRuntimeHttpStatus: 200,
    qwenStructuredMetadataAccepted: true,
    qwenFailClosedRestorePassed: true,
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof buildQwen25VlApprovedSnapshotJobOrchestrationE2E>) {
  assert.equal(result.safety.providerCall, false)
  assert.equal(result.safety.modelCall, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.cloudRunJobExecution, false)
  assert.equal(result.safety.supabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.creditMutation, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.mediaProcessing, false)
  assert.equal(result.safety.finalRenderExport, false)
  assert.equal(result.safety.externalBetaUnlockAppliedToEnvironment, false)
  assert.equal(result.safety.packageLockMutation, false)
  assert.equal(result.allowedExecution.providerModelCallAllowedNow, false)
  assert.equal(result.allowedExecution.workerDispatchAllowedNow, false)
  assert.equal(result.allowedExecution.cloudRunJobExecutionAllowedNow, false)
  assert.equal(result.allowedExecution.externalBetaUnlockAllowedNow, false)
}

const ready = buildQwen25VlApprovedSnapshotJobOrchestrationE2E(buildInput())
assert.equal(ready.ok, true)
assert.equal(ready.status, RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_READY_STATUS)
assert.equal(ready.orchestrationEnvelope.envelopePrepared, true)
assert.equal(ready.orchestrationEnvelope.backendOnly, true)
assert.equal(ready.orchestrationEnvelope.privateManifestReferencesOnly, true)
assert.equal(ready.orchestrationEnvelope.routeId, 'providers.qwen25Vl.structuredVisualMetadataPlan')
assert.equal(ready.requiredState.approvedSnapshotStatus, 'approved')
assert.equal(ready.requiredState.creditReservationStatus, 'reserved')
assert.equal(ready.requiredState.qwenProductRouteRuntimeHttpStatus, 200)
assert.equal(ready.requiredState.qwenStructuredMetadataAccepted, true)
assert.equal(ready.sourceEvidence.qwenProductRouteRuntimeReadinessRollupPr, 1407)
assert.equal(ready.sourceEvidence.qwenProductRouteRuntimeReadinessRollupMergeSha, '71fe816d96135674bb634389ae08e2358806c33f')
assert.equal(ready.nextMilestone, RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_NEXT_MILESTONE)
assertSafety(ready)
assertQwen25VlApprovedSnapshotJobOrchestrationE2EResult(ready)

const missingSnapshot = buildQwen25VlApprovedSnapshotJobOrchestrationE2E(buildInput({ approvedSnapshotRef: '' }))
assert.equal(missingSnapshot.ok, false)
assert.equal(missingSnapshot.status, 'blocked_missing_approved_snapshot_job_orchestration_dependency')
assert.match(missingSnapshot.blockers.join(','), /approved_snapshot_reference_required/)
assert.equal(missingSnapshot.orchestrationEnvelope.envelopePrepared, false)
assertSafety(missingSnapshot)
assertQwen25VlApprovedSnapshotJobOrchestrationE2EResult(missingSnapshot)

const invalidQwenEvidence = buildQwen25VlApprovedSnapshotJobOrchestrationE2E(
  buildInput({ qwenProductRouteRuntimeHttpStatus: 502 }),
)
assert.equal(invalidQwenEvidence.ok, false)
assert.equal(invalidQwenEvidence.status, 'blocked_invalid_approved_snapshot_job_orchestration_state')
assert.match(invalidQwenEvidence.blockers.join(','), /qwen_product_route_runtime_http_status_must_be_200/)
assertSafety(invalidQwenEvidence)
assertQwen25VlApprovedSnapshotJobOrchestrationE2EResult(invalidQwenEvidence)

const unsafe = buildQwen25VlApprovedSnapshotJobOrchestrationE2E(buildInput({ providerModelCallRequestedNow: true }))
assert.equal(unsafe.ok, false)
assert.equal(unsafe.status, 'blocked_unsafe_approved_snapshot_job_orchestration_request')
assert.match(unsafe.blockers.join(','), /rejects_runtime_execution_request_flags/)
assertSafety(unsafe)
assertQwen25VlApprovedSnapshotJobOrchestrationE2EResult(unsafe)

console.log('qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1-smoke passed')
