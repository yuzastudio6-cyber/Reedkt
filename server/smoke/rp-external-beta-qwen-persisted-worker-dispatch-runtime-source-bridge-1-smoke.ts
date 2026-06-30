import assert from 'node:assert/strict'

import {
  RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_APPROVED_FIXTURE,
  RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_READY_STATUS,
  assertQwenPersistedWorkerDispatchRuntimeSourceBridgeResult,
  buildQwenPersistedWorkerDispatchRuntimeSourceBridge,
  type QwenPersistedWorkerDispatchRuntimeSourceBridgeInput,
} from '../services/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge'

function buildInput(
  overrides: Partial<QwenPersistedWorkerDispatchRuntimeSourceBridgeInput> = {},
): QwenPersistedWorkerDispatchRuntimeSourceBridgeInput {
  return {
    workspaceId: 'workspace_qwen_persisted_bridge_smoke',
    projectId: 'project_qwen_persisted_bridge_smoke',
    editSessionId: 'edit_session_qwen_persisted_bridge_smoke',
    editPlanVersionId: 'edit_plan_version_qwen_persisted_bridge_smoke',
    approvedSnapshotRef: 'approved_snapshot_qwen_persisted_bridge_smoke',
    approvalRecordRef: 'approval_record_qwen_persisted_bridge_smoke',
    creditEstimateRef: 'credit_estimate_qwen_persisted_bridge_smoke',
    creditReservationRef: 'credit_reservation_qwen_persisted_bridge_smoke',
    jobBatchRef: 'job_batch_qwen_persisted_bridge_smoke',
    jobRef: 'job_qwen_persisted_bridge_smoke',
    workerLeaseRef: 'worker_lease_qwen_persisted_bridge_smoke',
    routeIdempotencyKey: 'idempotency_qwen_persisted_bridge_smoke',
    providerRequestId: 'provider_request_qwen_persisted_bridge_smoke',
    privateInputManifestRef: 'private_input_manifest_qwen_persisted_bridge_smoke',
    privateArtifactManifestRef: 'private_artifact_manifest_qwen_persisted_bridge_smoke',
    privateArtifactChecksumRef: 'sha256:qwen-persisted-bridge-smoke',
    sourceSequenceMapRef: 'source_sequence_map_qwen_persisted_bridge_smoke',
    compiledIntentRef: 'compiled_intent_qwen_persisted_bridge_smoke',
    modelRoutingPolicyRef: 'model_routing_policy_qwen_persisted_bridge_smoke',
    qaPolicyRef: 'qa_policy_qwen_persisted_bridge_smoke',
    qwenRuntimeReadinessRollupRef: 'rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1',
    qwenProductRouteRuntimeRunId: 'qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T07-37-03-448Z-a3702726',
    approvedFixtureRef: RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_APPROVED_FIXTURE,
    approvedTesterAccount: 'aiediting@reeditpro.com',
    googleCloudProjectId: 'reeditpro',
    region: 'us-central1',
    supabaseTargetRef: 'wmyyttnynmteqgcdishd',
    timeoutCostCeilingRef: 'single_request_timeout_and_cost_ceiling_required',
    failClosedRestorePolicyRef: 'restore_qwen_inference_disabled_after_attempt_or_on_failure',
    approvedSnapshotStatus: 'approved',
    creditReservationStatus: 'reserved',
    jobStatus: 'queued',
    workerLeaseStatus: 'claimed',
    privateInputManifestStatus: 'approved_fixture_reference',
    privateOutputManifestChecksumPolicy: 'required',
    timeoutCostCeilingStatus: 'satisfied',
    failClosedRestorePolicyStatus: 'required',
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof buildQwenPersistedWorkerDispatchRuntimeSourceBridge>) {
  assert.equal(result.allowedExecution.routeInvocationAllowedNow, false)
  assert.equal(result.allowedExecution.providerModelCallAllowedNow, false)
  assert.equal(result.allowedExecution.workerDispatchAllowedNow, false)
  assert.equal(result.allowedExecution.workerExecutionAllowedNow, false)
  assert.equal(result.allowedExecution.cloudRunJobExecutionAllowedNow, false)
  assert.equal(result.allowedExecution.cloudRunServiceUpdateAllowedNow, false)
  assert.equal(result.allowedExecution.supabaseMutationAllowedNow, false)
  assert.equal(result.allowedExecution.sqlExecutionAllowedNow, false)
  assert.equal(result.allowedExecution.secretPayloadAccessAllowedNow, false)
  assert.equal(result.allowedExecution.creditMutationAllowedNow, false)
  assert.equal(result.allowedExecution.signedUrlCreationAllowedNow, false)
  assert.equal(result.allowedExecution.publicArtifactAllowedNow, false)
  assert.equal(result.allowedExecution.mediaProcessingAllowedNow, false)
  assert.equal(result.allowedExecution.finalRenderExportAllowedNow, false)
  assert.equal(result.allowedExecution.broadExternalBetaUnlockAllowedNow, false)
  assert.equal(result.allowedExecution.productionUnlockAllowedNow, false)
  assert.equal(result.safety.providerCall, false)
  assert.equal(result.safety.modelCall, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.cloudRunJobExecution, false)
  assert.equal(result.safety.cloudRunServiceUpdate, false)
  assert.equal(result.safety.supabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.secretPayloadAccess, false)
  assert.equal(result.safety.creditMutation, false)
  assert.equal(result.safety.persistentCreditMutation, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.mediaProcessing, false)
  assert.equal(result.safety.finalRenderExport, false)
  assert.equal(result.safety.broadExternalBetaUnlockAppliedToEnvironment, false)
  assert.equal(result.safety.productionUnlock, false)
}

const ready = buildQwenPersistedWorkerDispatchRuntimeSourceBridge(buildInput())
assert.equal(ready.ok, true)
assert.equal(ready.status, RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_READY_STATUS)
assert.equal(ready.persistedDispatchBridge.workerDispatchSourceBridgePrepared, true)
assert.equal(ready.persistedDispatchBridge.confirmationEnv, 'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE')
assert.equal(ready.persistedDispatchBridge.queue.workerLeaseRef, 'worker_lease_qwen_persisted_bridge_smoke')
assert.equal(ready.persistedDispatchBridge.credit.policy, 'credit_no_spend_no_persistent_credit_mutation')
assert.equal(ready.persistedDispatchBridge.manifests.publicArtifactPolicy, 'blocked')
assert.equal(ready.persistedDispatchBridge.legacyAdapterPathPolicy.directAdapterShortcutAllowed, false)
assert.equal(ready.persistedDispatchBridge.legacyAdapterPathPolicy.existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge, true)
assert.equal(ready.nextMilestone, RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_NEXT_MILESTONE)
assertSafety(ready)
assertQwenPersistedWorkerDispatchRuntimeSourceBridgeResult(ready)

const missingLease = buildQwenPersistedWorkerDispatchRuntimeSourceBridge(buildInput({ workerLeaseRef: '' }))
assert.equal(missingLease.ok, false)
assert.equal(missingLease.status, 'blocked_missing_persisted_worker_dispatch_bridge_reference')
assert.ok(missingLease.blockers.includes('worker_lease_reference_required'))
assert.equal(missingLease.persistedDispatchBridge.workerDispatchSourceBridgePrepared, false)
assertSafety(missingLease)
assertQwenPersistedWorkerDispatchRuntimeSourceBridgeResult(missingLease)

const invalidFixture = buildQwenPersistedWorkerDispatchRuntimeSourceBridge(buildInput({ approvedFixtureRef: 'wrong-fixture' }))
assert.equal(invalidFixture.ok, false)
assert.equal(invalidFixture.status, 'blocked_invalid_persisted_worker_dispatch_bridge_state')
assert.ok(invalidFixture.blockers.includes('approved_fixture_ref_mismatch'))
assertSafety(invalidFixture)
assertQwenPersistedWorkerDispatchRuntimeSourceBridgeResult(invalidFixture)

const unsafe = buildQwenPersistedWorkerDispatchRuntimeSourceBridge(buildInput({ workerDispatchRequestedNow: true }))
assert.equal(unsafe.ok, false)
assert.equal(unsafe.status, 'blocked_unsafe_persisted_worker_dispatch_bridge_request')
assert.ok(unsafe.blockers.includes('persisted_worker_dispatch_runtime_source_bridge_rejects_unsafe_runtime_request_flags'))
assertSafety(unsafe)
assertQwenPersistedWorkerDispatchRuntimeSourceBridgeResult(unsafe)

console.log('rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-smoke passed')
