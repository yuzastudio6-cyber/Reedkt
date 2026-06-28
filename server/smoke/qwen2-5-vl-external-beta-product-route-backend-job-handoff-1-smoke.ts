import assert from 'node:assert/strict'

import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import type { ServiceContext } from '../types'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_NEXT_MILESTONE,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_READY_STATUS,
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult,
  buildQwen25VlExternalBetaProductRouteBackendJobHandoff,
  createQwen25VlExternalBetaProductRouteHandlerSource,
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
    workerInstanceId: 'qwen-route-backend-handoff-smoke',
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
  requestId: 'request_qwen_route_backend_handoff_smoke',
  auth: {
    userId: 'user_qwen_route_backend_handoff_smoke',
    email: 'route-backend-handoff@reeditpro.local',
    isMockUser: true,
  },
}

const baseInput = {
  workspaceId: 'workspace_qwen_route_backend_handoff_smoke',
  projectId: 'project_qwen_route_backend_handoff_smoke',
  editSessionId: 'edit_session_qwen_route_backend_handoff_smoke',
  requestId: 'request_qwen_route_backend_handoff_smoke',
  routeIdempotencyKey: 'route_idempotency_qwen_route_backend_handoff_smoke',
  workspaceMembershipRef: 'workspace_membership_qwen_route_backend_handoff_smoke',
  targetRef: 'reeditpro-main-supabase-staging-readback-target',
  adapterRequestId: 'adapter_request_qwen_route_backend_handoff_smoke',
  approvedSnapshotReadbackRef: 'readback_approved_snapshot_qwen_route_backend_handoff_smoke',
  creditReservationReadbackRef: 'readback_credit_reservation_qwen_route_backend_handoff_smoke',
  queueLeaseReadbackRef: 'readback_queue_lease_qwen_route_backend_handoff_smoke',
  privateInputManifestReadbackRef: 'readback_private_input_manifest_qwen_route_backend_handoff_smoke',
  privateArtifactManifestReadbackRef: 'readback_private_artifact_manifest_qwen_route_backend_handoff_smoke',
  privateArtifactChecksumReadbackRef: 'readback_sha256:qwen-route-backend-handoff-smoke',
  sourceSequenceMapReadbackRef: 'readback_source_sequence_map_qwen_route_backend_handoff_smoke',
  compiledIntentReadbackRef: 'readback_compiled_intent_qwen_route_backend_handoff_smoke',
  editPlanVersionReadbackRef: 'readback_edit_plan_version_qwen_route_backend_handoff_smoke',
  modelRoutingPolicyReadbackRef: 'readback_model_routing_policy_qwen_route_backend_handoff_smoke',
  qaPolicyReadbackRef: 'readback_qa_policy_qwen_route_backend_handoff_smoke',
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key]
    return
  }
  process.env[key] = value
}

const previousRuntimeGate = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]
const previousRuntimeTarget = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]
const previousRuntimeScope = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]
const previousReadbackConfirmation =
  process.env.REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION
const previousHandoffConfirmation = process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV]

try {
  delete process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV]

  const missingHandoffConfirmation = buildQwen25VlExternalBetaProductRouteBackendJobHandoff(context, baseInput)
  assert.equal(missingHandoffConfirmation.ok, false)
  assert.equal(missingHandoffConfirmation.status, 'blocked_pending_backend_job_handoff_confirmation')
  assert.equal(missingHandoffConfirmation.httpStatus, 424)
  assert.equal(missingHandoffConfirmation.backendHandoff.handoffPrepared, false)
  assert.equal(missingHandoffConfirmation.allowedExecution.providerModelCallAllowedNow, false)
  assert.equal(missingHandoffConfirmation.safety.providerCall, false)
  assert.equal(missingHandoffConfirmation.safety.modelCall, false)
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult(missingHandoffConfirmation)

  process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV] =
    QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE

  const missingReadbackGate = createQwen25VlExternalBetaProductRouteHandlerSource(context).buildBackendJobHandoff(baseInput)
  assert.equal(missingReadbackGate.ok, false)
  assert.equal(missingReadbackGate.status, 'blocked_pending_route_readback_validation_gate')
  assert.equal(missingReadbackGate.backendHandoff.handoffPrepared, false)
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult(missingReadbackGate)

  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope
  process.env.REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION = 'true'

  const ready = buildQwen25VlExternalBetaProductRouteBackendJobHandoff(context, baseInput)
  assert.equal(ready.ok, true)
  assert.equal(ready.status, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_READY_STATUS)
  assert.equal(ready.httpStatus, 202)
  assert.equal(ready.route.routeBehaviorChangedInThisPhase, false)
  assert.equal(ready.backendHandoff.handoffPrepared, true)
  assert.equal(ready.backendHandoff.executeNow, false)
  assert.equal(ready.backendHandoff.providerRuntimeExecutedNow, false)
  assert.equal(ready.backendHandoff.workerDispatchAllowedNow, false)
  assert.equal(ready.backendHandoff.cloudRunExecutionAllowedNow, false)
  assert.equal(ready.backendHandoff.adapterRuntimeLane, 'qwen2_5_vl_confirmed_private_adapter_runtime_fixture')
  assert.equal(ready.backendHandoff.approvedSnapshotRef, baseInput.approvedSnapshotReadbackRef)
  assert.equal(ready.backendHandoff.creditReservationRef, baseInput.creditReservationReadbackRef)
  assert.equal(ready.backendHandoff.queueLeaseRef, baseInput.queueLeaseReadbackRef)
  assert.equal(ready.allowedExecution.backendJobHandoffPreparedNow, true)
  assert.equal(ready.allowedExecution.providerModelCallAllowedNow, false)
  assert.equal(ready.allowedExecution.workerDispatchAllowedNow, false)
  assert.equal(ready.allowedExecution.cloudRunJobExecutionAllowedNow, false)
  assert.equal(ready.safety.qwenRuntimeExecutedInThisPhase, false)
  assert.equal(ready.safety.productRouteProviderRuntimeExecution, false)
  assert.equal(ready.safety.providerCall, false)
  assert.equal(ready.safety.modelCall, false)
  assert.equal(ready.safety.workerDispatch, false)
  assert.equal(ready.safety.supabaseMutation, false)
  assert.equal(ready.nextMilestone, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_NEXT_MILESTONE)
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult(ready)

  const unsafe = buildQwen25VlExternalBetaProductRouteBackendJobHandoff(context, {
    ...baseInput,
    providerModelCallRequested: true,
  })
  assert.equal(unsafe.ok, false)
  assert.equal(unsafe.status, 'blocked_product_route_handler_unsafe_runtime_request')
  assert.equal(unsafe.backendHandoff.handoffPrepared, false)
  assert.match(unsafe.blockers.join(','), /rejects_unsafe_runtime_request_flags/)
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult(unsafe)
} finally {
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled, previousRuntimeGate)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef, previousRuntimeTarget)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope, previousRuntimeScope)
  restoreEnv(
    'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION',
    previousReadbackConfirmation,
  )
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV, previousHandoffConfirmation)
}

console.log('qwen2-5-vl-external-beta-product-route-backend-job-handoff-1-smoke passed')
