import assert from 'node:assert/strict'

import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_READY_STATUS,
  assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult,
  buildQwen25VlExternalBetaProductWorkflowRouteIntegration,
  type Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput,
} from '../services/qwen2-5-vl-external-beta-product-workflow-route-integration'

const env = {
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope,
}

function buildReadyInput(
  overrides: Partial<Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput> = {},
): Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput {
  return {
    env,
    routeId: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID,
    requestId: 'request_qwen_route_integration_validation_1',
    authenticatedUserRef: 'user_qwen_route_integration_validation_1',
    workspaceMembershipRef: 'workspace_membership_qwen_route_integration_validation_1',
    routeIdempotencyKey: 'route_idempotency_qwen_route_integration_validation_1',
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
    approvedSnapshotReadbackRef: 'readback_approved_snapshot_qwen_product_workflow_validation_1',
    creditReservationReadbackRef: 'readback_credit_reservation_qwen_product_workflow_validation_1',
    queueLeaseReadbackRef: 'readback_queue_lease_qwen_product_workflow_validation_1',
    privateInputManifestReadbackRef: 'readback_private_input_manifest_qwen_product_workflow_validation_1',
    privateArtifactManifestReadbackRef: 'readback_private_artifact_manifest_qwen_product_workflow_validation_1',
    privateArtifactChecksumReadbackRef: 'readback_sha256:qwen-product-workflow-validation-checksum-ref',
    sourceSequenceMapReadbackRef: 'readback_source_sequence_map_qwen_product_workflow_validation_1',
    compiledIntentReadbackRef: 'readback_compiled_intent_qwen_product_workflow_validation_1',
    modelRoutingPolicyReadbackRef: 'readback_model_routing_policy_qwen_product_workflow_validation_1',
    qaPolicyReadbackRef: 'readback_qa_policy_qwen_product_workflow_validation_1',
    workflowStatus: 'external_beta_guarded_binding',
    ...overrides,
  }
}

const disabled = buildQwen25VlExternalBetaProductWorkflowRouteIntegration()
assert.equal(disabled.ok, false)
assert.equal(disabled.status, 'blocked_pending_product_workflow_binding_readiness')
assert.equal(disabled.safety.qwenRuntimeExecutedInThisPhase, false)
assert.equal(disabled.safety.routeExecution, false)
assert.equal(disabled.safety.routeHandlerRegistered, false)
assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(disabled)

const missingAuth = buildQwen25VlExternalBetaProductWorkflowRouteIntegration(
  buildReadyInput({ authenticatedUserRef: undefined }),
)
assert.equal(missingAuth.ok, false)
assert.equal(missingAuth.status, 'blocked_missing_authenticated_backend_route_reference')
assert.match(missingAuth.blockers.join(','), /authenticated_user_reference_required/)
assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(missingAuth)

const missingReadback = buildQwen25VlExternalBetaProductWorkflowRouteIntegration(
  buildReadyInput({ approvedSnapshotReadbackRef: undefined }),
)
assert.equal(missingReadback.ok, false)
assert.equal(missingReadback.status, 'blocked_missing_service_role_safe_readback_reference')
assert.match(missingReadback.blockers.join(','), /approved_snapshot_readback_reference_required/)
assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(missingReadback)

const ready = buildQwen25VlExternalBetaProductWorkflowRouteIntegration(buildReadyInput())
assert.equal(ready.ok, true)
assert.equal(ready.status, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_READY_STATUS)
assert.equal(ready.productWorkflowBinding.ok, true)
assert.equal(ready.sourceEvidence.productWorkflowBindingPr, 1333)
assert.equal(ready.sourceEvidence.productWorkflowBindingMergeSha, 'e0cae42a25f1b7d390654fcc8b610f30b86c8358')
assert.equal(ready.sourceEvidence.confirmedRunId, 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d')
assert.equal(ready.routeContract.routeId, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID)
assert.equal(ready.routeContract.path, '/api/providers/qwen2-5-vl/structured-visual-metadata')
assert.equal(ready.routeContract.securityLevel, 'workspace_editor')
assert.equal(ready.routeContract.runtimeMode, 'backend_required')
assert.equal(ready.routeContract.requiresSupabase, true)
assert.equal(ready.routeContract.requiresServiceRole, true)
assert.equal(ready.routeContract.requiresProviderSecret, true)
assert.equal(ready.routeContract.routeContractRegistered, true)
assert.equal(ready.routeContract.routeHandlerRegisteredNow, false)
assert.equal(ready.allowedRouteUse.structuredVisualMetadataPlanningRouteContract, true)
assert.equal(ready.allowedRouteUse.sourceSequenceMapSupportRouteContract, true)
assert.equal(ready.allowedRouteUse.routeExecutionAllowedNow, false)
assert.equal(ready.allowedRouteUse.remoteRuntimeAllowedNow, false)
assert.equal(ready.allowedRouteUse.providerModelCallAllowedNow, false)
assert.equal(ready.allowedRouteUse.signedUrlCreationAllowedNow, false)
assert.equal(ready.allowedRouteUse.finalRenderExportAllowedNow, false)
assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(ready)

const unsafeRouteExecution = buildQwen25VlExternalBetaProductWorkflowRouteIntegration(
  buildReadyInput({ routeExecutionRequested: true }),
)
assert.equal(unsafeRouteExecution.ok, false)
assert.equal(unsafeRouteExecution.status, 'blocked_route_integration_unsafe_runtime_request')
assert.match(
  unsafeRouteExecution.blockers.join(','),
  /qwen_product_workflow_route_runtime_execution_not_allowed_in_this_phase/,
)
assert.equal(unsafeRouteExecution.safety.routeExecution, false)
assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(unsafeRouteExecution)

const unsafeFrontendProviderCall = buildQwen25VlExternalBetaProductWorkflowRouteIntegration(
  buildReadyInput({ frontendProviderModelCallRequested: true }),
)
assert.equal(unsafeFrontendProviderCall.ok, false)
assert.equal(unsafeFrontendProviderCall.status, 'blocked_route_integration_unsafe_runtime_request')
assert.equal(unsafeFrontendProviderCall.safety.frontendProviderModelCall, false)
assert.equal(unsafeFrontendProviderCall.safety.providerCall, false)
assert.equal(unsafeFrontendProviderCall.safety.modelCall, false)
assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(unsafeFrontendProviderCall)

console.log('qwen2-5-vl-external-beta-product-workflow-route-integration-1-smoke passed')
