import assert from 'node:assert/strict'
import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
  assertQwen25VlExternalBetaRuntimeGateResult,
  evaluateQwen25VlExternalBetaRuntimeGate,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'

const disabled = evaluateQwen25VlExternalBetaRuntimeGate()
assert.equal(disabled.ok, false)
assert.equal(disabled.status, 'disabled_pending_explicit_qwen_runtime_gate')
assert.equal(disabled.safety.qwenRuntimeExecuted, false)
assert.equal(disabled.safety.externalBetaUnlockAppliedToEnvironment, false)
assertQwen25VlExternalBetaRuntimeGateResult(disabled)

const env = {
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope,
}

const missingSnapshot = evaluateQwen25VlExternalBetaRuntimeGate({
  env,
  sourceDecision: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
})
assert.equal(missingSnapshot.ok, false)
assert.equal(missingSnapshot.status, 'blocked_missing_approved_snapshot_reference')
assert.match(missingSnapshot.blockers.join(','), /approved_snapshot_reference_required/)
assertQwen25VlExternalBetaRuntimeGateResult(missingSnapshot)

const ready = evaluateQwen25VlExternalBetaRuntimeGate({
  env,
  sourceDecision: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
  approvedSnapshotRef: 'approved_snapshot_validation_ref',
  creditReservationRef: 'credit_reservation_validation_ref',
  queueLeaseRef: 'queue_lease_validation_ref',
  idempotencyKey: 'qwen_runtime_gate_validation_idempotency_key',
  privateArtifactManifestRef: 'private_artifact_manifest_validation_ref',
  privateArtifactChecksumRef: 'sha256:validation-checksum-ref',
})
assert.equal(ready.ok, true)
assert.equal(ready.status, 'ready_backend_only_qwen_structured_metadata_runtime_gate')
assert.equal(ready.runtimeGate.backendOnlyAdapterRequired, true)
assert.equal(ready.runtimeGate.structuredMetadataOnly, true)
assert.equal(ready.runtimeGate.publicArtifactsAllowed, false)
assert.equal(ready.runtimeGate.finalRenderExportAllowed, false)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_MAX_MODEL_LEN, 2048)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_MAX_NUM_BATCHED_TOKENS, 1024)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_MAX_NUM_SEQS, 1)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_GPU_MEMORY_UTILIZATION, 0.92)
assertQwen25VlExternalBetaRuntimeGateResult(ready)

const badTarget = evaluateQwen25VlExternalBetaRuntimeGate({
  env: {
    ...env,
    [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]: 'fajinbvwhcjnutkaumkm',
  },
  sourceDecision: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
  approvedSnapshotRef: 'approved_snapshot_validation_ref',
  creditReservationRef: 'credit_reservation_validation_ref',
  queueLeaseRef: 'queue_lease_validation_ref',
  idempotencyKey: 'qwen_runtime_gate_validation_idempotency_key',
  privateArtifactManifestRef: 'private_artifact_manifest_validation_ref',
  privateArtifactChecksumRef: 'sha256:validation-checksum-ref',
})
assert.equal(badTarget.ok, false)
assert.equal(badTarget.status, 'blocked_target_ref_mismatch')
assertQwen25VlExternalBetaRuntimeGateResult(badTarget)

const unsafeFrontendCall = evaluateQwen25VlExternalBetaRuntimeGate({
  env,
  sourceDecision: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
  approvedSnapshotRef: 'approved_snapshot_validation_ref',
  creditReservationRef: 'credit_reservation_validation_ref',
  queueLeaseRef: 'queue_lease_validation_ref',
  idempotencyKey: 'qwen_runtime_gate_validation_idempotency_key',
  privateArtifactManifestRef: 'private_artifact_manifest_validation_ref',
  privateArtifactChecksumRef: 'sha256:validation-checksum-ref',
  frontendProviderCallAttempted: true,
})
assert.equal(unsafeFrontendCall.ok, false)
assert.equal(unsafeFrontendCall.status, 'blocked_frontend_provider_or_model_call_attempt')
assertQwen25VlExternalBetaRuntimeGateResult(unsafeFrontendCall)

const unsafeArtifact = evaluateQwen25VlExternalBetaRuntimeGate({
  env,
  sourceDecision: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_SOURCE_DECISION,
  approvedSnapshotRef: 'approved_snapshot_validation_ref',
  creditReservationRef: 'credit_reservation_validation_ref',
  queueLeaseRef: 'queue_lease_validation_ref',
  idempotencyKey: 'qwen_runtime_gate_validation_idempotency_key',
  privateArtifactManifestRef: 'private_artifact_manifest_validation_ref',
  privateArtifactChecksumRef: 'sha256:validation-checksum-ref',
  publicArtifactRequested: true,
})
assert.equal(unsafeArtifact.ok, false)
assert.equal(unsafeArtifact.status, 'blocked_public_or_signed_artifact_request')
assertQwen25VlExternalBetaRuntimeGateResult(unsafeArtifact)

console.log('qwen2-5-vl-external-beta-runtime-gate-integration-1-smoke passed')
