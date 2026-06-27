import assert from 'node:assert/strict'
import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import {
  QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_READY_STATUS,
  assertQwen25VlExternalBetaBackendRuntimeAdapterResult,
  buildQwen25VlExternalBetaBackendRuntimeAdapterContract,
} from '../services/qwen2-5-vl-external-beta-backend-runtime-adapter'

const disabled = buildQwen25VlExternalBetaBackendRuntimeAdapterContract()
assert.equal(disabled.ok, false)
assert.equal(disabled.status, 'disabled_pending_explicit_qwen_runtime_gate')
assert.equal(disabled.adapter.backendOnly, true)
assert.equal(disabled.adapter.executeNow, false)
assert.equal(disabled.safety.qwenRuntimeExecuted, false)
assert.equal(disabled.safety.cloudRunJobExecuted, false)
assertQwen25VlExternalBetaBackendRuntimeAdapterResult(disabled)

const env = {
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope,
}

const missingCredit = buildQwen25VlExternalBetaBackendRuntimeAdapterContract({
  env,
  approvedSnapshotRef: 'approved_snapshot_external_beta_qwen_validation_ref',
})
assert.equal(missingCredit.ok, false)
assert.equal(missingCredit.status, 'blocked_missing_credit_reservation_reference')
assert.match(missingCredit.blockers.join(','), /credit_reservation_reference_required/)
assertQwen25VlExternalBetaBackendRuntimeAdapterResult(missingCredit)

const ready = buildQwen25VlExternalBetaBackendRuntimeAdapterContract({
  env,
  adapterRequestId: 'qwen_backend_adapter_validation_request',
  approvedSnapshotRef: 'approved_snapshot_external_beta_qwen_validation_ref',
  creditReservationRef: 'credit_reservation_external_beta_qwen_validation_ref',
  queueLeaseRef: 'queue_lease_external_beta_qwen_validation_ref',
  idempotencyKey: 'qwen_backend_adapter_validation_idempotency_key',
  privateArtifactManifestRef: 'private_artifact_manifest_external_beta_qwen_validation_ref',
  privateArtifactChecksumRef: 'sha256:qwen-adapter-validation-checksum-ref',
  privateInputManifestRef: 'private_input_manifest_external_beta_qwen_validation_ref',
})
assert.equal(ready.ok, true)
assert.equal(ready.status, QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_READY_STATUS)
assert.equal(ready.adapter.adapterReadiness, 'ready_for_confirmed_adapter_runtime_fixture')
assert.equal(ready.adapter.executeNow, false)
assert.equal(ready.invocationEnvelope.approvedSnapshotTaskClass, 'structured_metadata_only')
assert.equal(ready.cloudRunPlan.gpuService, 'reeditpro-qwen2-5-vl-l4-worker')
assert.equal(ready.cloudRunPlan.cpuCallerJob, 'reeditpro-qwen2-5-vl-private-caller')
assert.equal(ready.cloudRunPlan.jobExecutionAllowedInThisPhase, false)
assert.equal(ready.cloudRunPlan.identityTokenFetchAllowedInThisPhase, false)
assert.equal(ready.artifactPolicy.privateArtifactsOnly, true)
assert.equal(ready.artifactPolicy.publicArtifactsAllowed, false)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_MAX_MODEL_LEN, 2048)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_MAX_NUM_BATCHED_TOKENS, 1024)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_MAX_NUM_SEQS, 1)
assert.equal(ready.requiredL4VllmConfig.QWEN_VLLM_GPU_MEMORY_UTILIZATION, 0.92)
assertQwen25VlExternalBetaBackendRuntimeAdapterResult(ready)

const unsafeRawPrompt = buildQwen25VlExternalBetaBackendRuntimeAdapterContract({
  env,
  adapterRequestId: 'qwen_backend_adapter_validation_request',
  approvedSnapshotRef: 'approved_snapshot_external_beta_qwen_validation_ref',
  creditReservationRef: 'credit_reservation_external_beta_qwen_validation_ref',
  queueLeaseRef: 'queue_lease_external_beta_qwen_validation_ref',
  idempotencyKey: 'qwen_backend_adapter_validation_idempotency_key',
  privateArtifactManifestRef: 'private_artifact_manifest_external_beta_qwen_validation_ref',
  privateArtifactChecksumRef: 'sha256:qwen-adapter-validation-checksum-ref',
  rawPromptRequested: true,
})
assert.equal(unsafeRawPrompt.ok, false)
assert.equal(unsafeRawPrompt.status, 'blocked_raw_prompt_or_arbitrary_media_request')
assertQwen25VlExternalBetaBackendRuntimeAdapterResult(unsafeRawPrompt)

const unsafeFinalExport = buildQwen25VlExternalBetaBackendRuntimeAdapterContract({
  env,
  adapterRequestId: 'qwen_backend_adapter_validation_request',
  approvedSnapshotRef: 'approved_snapshot_external_beta_qwen_validation_ref',
  creditReservationRef: 'credit_reservation_external_beta_qwen_validation_ref',
  queueLeaseRef: 'queue_lease_external_beta_qwen_validation_ref',
  idempotencyKey: 'qwen_backend_adapter_validation_idempotency_key',
  privateArtifactManifestRef: 'private_artifact_manifest_external_beta_qwen_validation_ref',
  privateArtifactChecksumRef: 'sha256:qwen-adapter-validation-checksum-ref',
  finalRenderExportRequested: true,
})
assert.equal(unsafeFinalExport.ok, false)
assert.equal(unsafeFinalExport.status, 'blocked_final_render_export_request')
assertQwen25VlExternalBetaBackendRuntimeAdapterResult(unsafeFinalExport)

console.log('qwen2-5-vl-external-beta-backend-runtime-adapter-1-smoke passed')
