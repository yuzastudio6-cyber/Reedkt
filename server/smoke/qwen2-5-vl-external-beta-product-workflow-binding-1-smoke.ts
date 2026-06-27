import assert from 'node:assert/strict'

import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS,
  assertQwen25VlExternalBetaProductWorkflowBindingResult,
  buildQwen25VlExternalBetaProductWorkflowBinding,
  type Qwen25VlExternalBetaProductWorkflowBindingInput,
} from '../services/qwen2-5-vl-external-beta-product-workflow-binding'

const env = {
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope,
}

function buildReadyInput(
  overrides: Partial<Qwen25VlExternalBetaProductWorkflowBindingInput> = {},
): Qwen25VlExternalBetaProductWorkflowBindingInput {
  return {
    env,
    workflowBindingId: 'qwen_product_workflow_binding_validation_1',
    workspaceId: 'workspace_qwen_product_workflow_validation_1',
    projectId: 'project_qwen_product_workflow_validation_1',
    editSessionId: 'edit_session_qwen_product_workflow_validation_1',
    adapterRequestId: 'qwen_product_workflow_adapter_validation_request_1',
    sourceSequenceMapRef: 'source_sequence_map_qwen_product_workflow_validation_1',
    compiledIntentSnapshotRef: 'compiled_intent_qwen_product_workflow_validation_1',
    editPlanVersionRef: 'edit_plan_version_qwen_product_workflow_validation_1',
    approvedSnapshotRef: 'approved_snapshot_qwen_product_workflow_validation_1',
    creditReservationRef: 'credit_reservation_qwen_product_workflow_validation_1',
    queueLeaseRef: 'queue_lease_qwen_product_workflow_validation_1',
    idempotencyKey: 'idempotency_qwen_product_workflow_validation_1',
    privateInputManifestRef: 'private_input_manifest_qwen_product_workflow_validation_1',
    privateArtifactManifestRef: 'private_artifact_manifest_qwen_product_workflow_validation_1',
    privateArtifactChecksumRef: 'sha256:qwen-product-workflow-validation-checksum-ref',
    modelRoutingPolicyRef: 'model_routing_policy_qwen_product_workflow_validation_1',
    qaPolicyRef: 'qa_policy_qwen_product_workflow_validation_1',
    workflowStatus: 'external_beta_guarded_binding',
    ...overrides,
  }
}

const disabled = buildQwen25VlExternalBetaProductWorkflowBinding()
assert.equal(disabled.ok, false)
assert.equal(disabled.status, 'blocked_pending_backend_runtime_adapter_readiness')
assert.equal(disabled.safety.qwenRuntimeExecutedInThisPhase, false)
assert.equal(disabled.allowedProductUse.productRouteExecutionAllowedNow, false)
assertQwen25VlExternalBetaProductWorkflowBindingResult(disabled)

const missingWorkflowRef = buildQwen25VlExternalBetaProductWorkflowBinding(
  buildReadyInput({ sourceSequenceMapRef: undefined }),
)
assert.equal(missingWorkflowRef.ok, false)
assert.equal(missingWorkflowRef.status, 'blocked_missing_product_workflow_reference')
assert.match(missingWorkflowRef.blockers.join(','), /source_sequence_map_reference_required/)
assertQwen25VlExternalBetaProductWorkflowBindingResult(missingWorkflowRef)

const ready = buildQwen25VlExternalBetaProductWorkflowBinding(buildReadyInput())
assert.equal(ready.ok, true)
assert.equal(ready.status, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS)
assert.equal(ready.backendAdapter.ok, true)
assert.equal(ready.sourceEvidence.confirmedAdapterRuntimeFixturePr, 1328)
assert.equal(ready.sourceEvidence.confirmedAdapterRuntimeFixtureMergeSha, '012f436a38b6a525246c673923105b14ae36c727')
assert.equal(ready.sourceEvidence.confirmedRunId, 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d')
assert.equal(ready.sourceEvidence.serviceReason, 'qwen_fixture_inference_smoke_completed')
assert.equal(ready.sourceEvidence.parsedJson, true)
assert.equal(ready.sourceEvidence.schemaValid, true)
assert.equal(ready.sourceEvidence.structuredMetadataOutputAccepted, true)
assert.equal(ready.sourceEvidence.rawOutputStoredInRepo, false)
assert.equal(ready.sourceEvidence.failClosedRestorePassed, true)
assert.equal(ready.productWorkflow.approvedSnapshotRef, 'approved_snapshot_qwen_product_workflow_validation_1')
assert.equal(ready.productWorkflow.creditReservationRef, 'credit_reservation_qwen_product_workflow_validation_1')
assert.equal(ready.productWorkflow.queueLeaseRef, 'queue_lease_qwen_product_workflow_validation_1')
assert.equal(ready.productWorkflow.privateArtifactManifestRef, 'private_artifact_manifest_qwen_product_workflow_validation_1')
assert.equal(ready.productWorkflow.privateArtifactChecksumRef, 'sha256:qwen-product-workflow-validation-checksum-ref')
assert.equal(ready.allowedProductUse.structuredVisualMetadataForPlanning, true)
assert.equal(ready.allowedProductUse.sourceSequenceMapSupport, true)
assert.equal(ready.allowedProductUse.approvedSnapshotOnly, true)
assert.equal(ready.allowedProductUse.privateArtifactReferencesOnly, true)
assert.equal(ready.allowedProductUse.productRouteExecutionAllowedNow, false)
assert.equal(ready.allowedProductUse.workerDispatchAllowedNow, false)
assert.equal(ready.allowedProductUse.providerModelCallAllowedNow, false)
assert.equal(ready.allowedProductUse.finalRenderExportAllowedNow, false)
assert.equal(ready.allowedProductUse.broadExternalBetaUnlockAllowedNow, false)
assertQwen25VlExternalBetaProductWorkflowBindingResult(ready)

const unsafeRoute = buildQwen25VlExternalBetaProductWorkflowBinding(
  buildReadyInput({ productRouteExecutionRequested: true }),
)
assert.equal(unsafeRoute.ok, false)
assert.equal(unsafeRoute.status, 'blocked_product_workflow_unsafe_runtime_request')
assert.match(unsafeRoute.blockers.join(','), /product_workflow_binding_runtime_execution_not_allowed_in_this_phase/)
assert.equal(unsafeRoute.safety.routeExecution, false)
assertQwen25VlExternalBetaProductWorkflowBindingResult(unsafeRoute)

const unsafeProvider = buildQwen25VlExternalBetaProductWorkflowBinding(
  buildReadyInput({ providerModelCallRequested: true }),
)
assert.equal(unsafeProvider.ok, false)
assert.equal(unsafeProvider.status, 'blocked_product_workflow_unsafe_runtime_request')
assert.equal(unsafeProvider.safety.providerCall, false)
assert.equal(unsafeProvider.safety.modelCall, false)
assertQwen25VlExternalBetaProductWorkflowBindingResult(unsafeProvider)

console.log('qwen2-5-vl-external-beta-product-workflow-binding-1-smoke passed')
