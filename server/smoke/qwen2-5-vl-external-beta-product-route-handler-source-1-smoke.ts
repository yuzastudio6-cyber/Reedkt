import assert from 'node:assert/strict'

import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import type { ServiceContext } from '../types'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_NEXT_MILESTONE,
  assertQwen25VlExternalBetaProductRouteHandlerSourceResult,
  buildQwen25VlExternalBetaProductRouteHandlerSourceResult,
} from '../services/qwen2-5-vl-external-beta-product-route-handler-source'

const context: ServiceContext = {
  env: {
    nodeEnv: 'test',
    mode: 'local',
    apiPort: 8787,
    allowMockWithoutSupabase: true,
    storageMode: 'local',
    localStorageRoot: '.reeditpro-local-storage',
    signedUrlTtlSeconds: 900,
    gcsDefaultRegion: 'us-east1',
    workerRuntimeMode: 'disabled',
    workerInstanceId: 'qwen-route-handler-source-smoke',
    workerHeartbeatIntervalSeconds: 30,
    workerClaimLeaseSeconds: 300,
    strictToolReadiness: false,
    toolCheckTimeoutMs: 10000,
    ffmpegBin: 'ffmpeg',
    ffprobeBin: 'ffprobe',
    remotionBin: 'npx remotion',
    pythonBin: 'python',
    playwrightBin: 'npx playwright',
    providerSecretReferenceNames: {},
    hasSupabaseAdmin: false,
    hasSupabasePublic: false,
    mockOnly: true,
    warnings: [],
  },
  clients: { admin: null, public: null },
  requestId: 'request_qwen_route_handler_source_smoke',
  auth: {
    userId: 'user_qwen_route_handler_source_smoke',
    email: 'route-handler-source@reeditpro.local',
    isMockUser: true,
  },
}

const baseInput = {
  workspaceId: 'workspace_qwen_route_handler_source_smoke',
  projectId: 'project_qwen_route_handler_source_smoke',
  editSessionId: 'edit_session_qwen_route_handler_source_smoke',
  requestId: 'request_qwen_route_handler_source_smoke',
  routeIdempotencyKey: 'route_idempotency_qwen_route_handler_source_smoke',
  workspaceMembershipRef: 'workspace_membership_qwen_route_handler_source_smoke',
  approvedSnapshotReadbackRef: 'readback_approved_snapshot_qwen_route_handler_source_smoke',
  creditReservationReadbackRef: 'readback_credit_reservation_qwen_route_handler_source_smoke',
  queueLeaseReadbackRef: 'readback_queue_lease_qwen_route_handler_source_smoke',
  privateInputManifestReadbackRef: 'readback_private_input_manifest_qwen_route_handler_source_smoke',
  privateArtifactManifestReadbackRef: 'readback_private_artifact_manifest_qwen_route_handler_source_smoke',
  privateArtifactChecksumReadbackRef: 'readback_sha256:qwen-route-handler-source-smoke',
  sourceSequenceMapReadbackRef: 'readback_source_sequence_map_qwen_route_handler_source_smoke',
  compiledIntentReadbackRef: 'readback_compiled_intent_qwen_route_handler_source_smoke',
  editPlanVersionReadbackRef: 'readback_edit_plan_version_qwen_route_handler_source_smoke',
  modelRoutingPolicyReadbackRef: 'readback_model_routing_policy_qwen_route_handler_source_smoke',
  qaPolicyReadbackRef: 'readback_qa_policy_qwen_route_handler_source_smoke',
}

const failClosed = buildQwen25VlExternalBetaProductRouteHandlerSourceResult(context, baseInput)
assert.equal(failClosed.ok, false)
assert.equal(failClosed.status, 'blocked_pending_route_readback_validation_gate')
assert.equal(failClosed.httpStatus, 424)
assert.equal(failClosed.route.routeHandlerRegisteredNow, true)
assert.equal(failClosed.route.routeHandlerFailClosed, true)
assert.equal(failClosed.allowedExecution.routeExecutionAcceptedNow, false)
assert.equal(failClosed.allowedExecution.routeReadbackExecutionAllowedNow, false)
assert.equal(failClosed.allowedExecution.providerModelCallAllowedNow, false)
assert.equal(failClosed.safety.routeExecutionInThisPhase, false)
assert.equal(failClosed.safety.routeReadbackExecution, false)
assert.equal(failClosed.safety.supabaseReadbackExecution, false)
assert.equal(failClosed.safety.providerCall, false)
assert.equal(failClosed.safety.modelCall, false)
assertQwen25VlExternalBetaProductRouteHandlerSourceResult(failClosed)

const unsafe = buildQwen25VlExternalBetaProductRouteHandlerSourceResult(context, {
  ...baseInput,
  providerModelCallRequested: true,
})
assert.equal(unsafe.ok, false)
assert.equal(unsafe.status, 'blocked_product_route_handler_unsafe_runtime_request')
assert.match(unsafe.blockers.join(','), /runtime_execution_not_allowed/)
assert.equal(unsafe.safety.providerCall, false)
assert.equal(unsafe.safety.modelCall, false)
assertQwen25VlExternalBetaProductRouteHandlerSourceResult(unsafe)

process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled] =
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled
process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef] =
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef
process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope] =
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope
process.env.REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION = 'true'

const confirmedGateStillProviderBlocked = buildQwen25VlExternalBetaProductRouteHandlerSourceResult(context, {
  ...baseInput,
  targetRef: 'reeditpro-main-supabase-staging-readback-target',
})
assert.equal(confirmedGateStillProviderBlocked.ok, false)
assert.equal(confirmedGateStillProviderBlocked.status, 'blocked_provider_runtime_not_enabled')
assert.equal(
  confirmedGateStillProviderBlocked.routeReadbackValidation.status,
  'ready_for_confirmed_qwen2_5_vl_product_route_readback_validation_runtime_packet',
)
assert.equal(confirmedGateStillProviderBlocked.nextMilestone, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_NEXT_MILESTONE)
assert.equal(confirmedGateStillProviderBlocked.safety.providerCall, false)
assert.equal(confirmedGateStillProviderBlocked.safety.modelCall, false)
assertQwen25VlExternalBetaProductRouteHandlerSourceResult(confirmedGateStillProviderBlocked)

delete process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]
delete process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]
delete process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]
delete process.env.REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION

console.log('qwen2-5-vl-external-beta-product-route-handler-source-1-smoke passed')
