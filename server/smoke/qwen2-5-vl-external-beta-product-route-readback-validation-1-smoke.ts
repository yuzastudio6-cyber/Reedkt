import assert from 'node:assert/strict'

import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID,
} from '../services/qwen2-5-vl-external-beta-product-workflow-route-integration'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS,
  assertQwen25VlExternalBetaProductRouteReadbackValidationResult,
  buildQwen25VlExternalBetaProductRouteReadbackValidation,
  type Qwen25VlExternalBetaProductRouteReadbackValidationInput,
} from '../services/qwen2-5-vl-external-beta-product-route-readback-validation'

const env = {
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef,
  [QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]:
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope,
}

function buildReadyInput(
  overrides: Partial<Qwen25VlExternalBetaProductRouteReadbackValidationInput> = {},
): Qwen25VlExternalBetaProductRouteReadbackValidationInput {
  return {
    env,
    routeId: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID,
    requestId: 'request_qwen_route_readback_validation_1',
    authenticatedUserRef: 'user_qwen_route_readback_validation_1',
    workspaceMembershipRef: 'workspace_membership_qwen_route_readback_validation_1',
    routeIdempotencyKey: 'route_idempotency_qwen_route_readback_validation_1',
    workflowBindingId: 'qwen_product_route_readback_validation_1',
    workspaceId: 'workspace_qwen_product_route_readback_validation_1',
    projectId: 'project_qwen_product_route_readback_validation_1',
    editSessionId: 'edit_session_qwen_product_route_readback_validation_1',
    adapterRequestId: 'qwen_product_route_readback_adapter_validation_request_1',
    sourceSequenceMapRef: 'source_sequence_map_qwen_product_route_readback_validation_1',
    compiledIntentSnapshotRef: 'compiled_intent_qwen_product_route_readback_validation_1',
    editPlanVersionRef: 'edit_plan_version_qwen_product_route_readback_validation_1',
    approvedSnapshotRef: 'approved_snapshot_qwen_product_route_readback_validation_1',
    creditReservationRef: 'credit_reservation_qwen_product_route_readback_validation_1',
    queueLeaseRef: 'queue_lease_qwen_product_route_readback_validation_1',
    idempotencyKey: 'idempotency_qwen_product_route_readback_validation_1',
    privateInputManifestRef: 'private_input_manifest_qwen_product_route_readback_validation_1',
    privateArtifactManifestRef: 'private_artifact_manifest_qwen_product_route_readback_validation_1',
    privateArtifactChecksumRef: 'sha256:qwen-product-route-readback-validation-checksum-ref',
    modelRoutingPolicyRef: 'model_routing_policy_qwen_product_route_readback_validation_1',
    qaPolicyRef: 'qa_policy_qwen_product_route_readback_validation_1',
    approvedSnapshotReadbackRef: 'readback_approved_snapshot_qwen_product_route_readback_validation_1',
    creditReservationReadbackRef: 'readback_credit_reservation_qwen_product_route_readback_validation_1',
    queueLeaseReadbackRef: 'readback_queue_lease_qwen_product_route_readback_validation_1',
    privateInputManifestReadbackRef: 'readback_private_input_manifest_qwen_product_route_readback_validation_1',
    privateArtifactManifestReadbackRef: 'readback_private_artifact_manifest_qwen_product_route_readback_validation_1',
    privateArtifactChecksumReadbackRef: 'readback_sha256:qwen-product-route-readback-validation-checksum-ref',
    sourceSequenceMapReadbackRef: 'readback_source_sequence_map_qwen_product_route_readback_validation_1',
    compiledIntentReadbackRef: 'readback_compiled_intent_qwen_product_route_readback_validation_1',
    modelRoutingPolicyReadbackRef: 'readback_model_routing_policy_qwen_product_route_readback_validation_1',
    qaPolicyReadbackRef: 'readback_qa_policy_qwen_product_route_readback_validation_1',
    workflowStatus: 'external_beta_guarded_binding',
    ...overrides,
  }
}

const originalConfirmation = process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV]
delete process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV]

const noConfirmation = buildQwen25VlExternalBetaProductRouteReadbackValidation(buildReadyInput())
assert.equal(noConfirmation.ok, false)
assert.equal(
  noConfirmation.status,
  'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation',
)
assert.equal(noConfirmation.confirmationGate.confirmationPresent, false)
assert.equal(noConfirmation.confirmationGate.currentPhaseRemoteReadbackExecuted, false)
assert.equal(noConfirmation.safety.routeReadbackExecution, false)
assert.equal(noConfirmation.safety.supabaseReadbackExecution, false)
assert.equal(noConfirmation.safety.serviceRoleReadbackExecution, false)
assertQwen25VlExternalBetaProductRouteReadbackValidationResult(noConfirmation)

const missingTarget = buildQwen25VlExternalBetaProductRouteReadbackValidation(
  buildReadyInput({ confirmation: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE }),
)
assert.equal(missingTarget.ok, false)
assert.equal(missingTarget.status, 'blocked_missing_named_product_route_readback_target')
assert.match(missingTarget.blockers.join(','), /named_qwen2_5_vl_product_route_readback_target_required/)
assertQwen25VlExternalBetaProductRouteReadbackValidationResult(missingTarget)

const readyForConfirmedRuntime = buildQwen25VlExternalBetaProductRouteReadbackValidation(
  buildReadyInput({
    confirmation: true,
    targetRef: 'reeditpro-main-supabase-staging-readback-target',
  }),
)
assert.equal(readyForConfirmedRuntime.ok, true)
assert.equal(readyForConfirmedRuntime.status, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS)
assert.equal(readyForConfirmedRuntime.routeIntegration.ok, true)
assert.equal(readyForConfirmedRuntime.allowedReadbackUse.routeContractReady, true)
assert.equal(readyForConfirmedRuntime.allowedReadbackUse.actualRemoteReadbackAllowedNow, false)
assert.equal(readyForConfirmedRuntime.allowedReadbackUse.routeHandlerExecutionAllowedNow, false)
assert.equal(readyForConfirmedRuntime.allowedReadbackUse.supabaseReadbackExecutionAllowedNow, false)
assert.equal(readyForConfirmedRuntime.safety.secretPayloadAccess, false)
assert.equal(readyForConfirmedRuntime.safety.sqlExecution, false)
assertQwen25VlExternalBetaProductRouteReadbackValidationResult(readyForConfirmedRuntime)

const unsafeRouteReadback = buildQwen25VlExternalBetaProductRouteReadbackValidation(
  buildReadyInput({
    confirmation: true,
    targetRef: 'reeditpro-main-supabase-staging-readback-target',
    routeReadbackExecutionRequested: true,
  }),
)
assert.equal(unsafeRouteReadback.ok, false)
assert.equal(unsafeRouteReadback.status, 'blocked_product_route_readback_unsafe_remote_request')
assert.match(unsafeRouteReadback.blockers.join(','), /remote_readback_execution_not_allowed/)
assert.equal(unsafeRouteReadback.safety.routeReadbackExecution, false)
assertQwen25VlExternalBetaProductRouteReadbackValidationResult(unsafeRouteReadback)

if (typeof originalConfirmation === 'string') {
  process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV] = originalConfirmation
}

console.log('qwen2-5-vl-external-beta-product-route-readback-validation-1-smoke passed')
