import assert from 'node:assert/strict'

import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import type { ServiceContext } from '../types'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_READY_STATUS,
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult,
  buildQwen25VlExternalBetaProductRouteBackendJobHandoff,
} from '../services/qwen2-5-vl-external-beta-product-route-handler-source'

const providerFixtureConfirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE'

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
    workerInstanceId: 'qwen-route-provider-fixture-1r-smoke',
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
  requestId: 'request_qwen_route_provider_fixture_1r_smoke',
  auth: {
    userId: 'user_qwen_route_provider_fixture_1r_smoke',
    email: 'route-provider-fixture-1r@reeditpro.local',
    isMockUser: true,
  },
}

const input = {
  workspaceId: 'workspace_qwen_route_provider_fixture_1r_smoke',
  projectId: 'project_qwen_route_provider_fixture_1r_smoke',
  editSessionId: 'edit_session_qwen_route_provider_fixture_1r_smoke',
  requestId: 'request_qwen_route_provider_fixture_1r_smoke',
  routeIdempotencyKey: 'route_idempotency_qwen_route_provider_fixture_1r_smoke',
  workspaceMembershipRef: 'workspace_membership_qwen_route_provider_fixture_1r_smoke',
  targetRef: 'reeditpro-main-supabase-staging-readback-target',
  adapterRequestId: 'adapter_request_qwen_route_provider_fixture_1r_smoke',
  approvedSnapshotReadbackRef: 'readback_approved_snapshot_qwen_route_provider_fixture_1r_smoke',
  creditReservationReadbackRef: 'readback_credit_reservation_qwen_route_provider_fixture_1r_smoke',
  queueLeaseReadbackRef: 'readback_queue_lease_qwen_route_provider_fixture_1r_smoke',
  privateInputManifestReadbackRef: 'readback_private_input_manifest_qwen_route_provider_fixture_1r_smoke',
  privateArtifactManifestReadbackRef: 'readback_private_artifact_manifest_qwen_route_provider_fixture_1r_smoke',
  privateArtifactChecksumReadbackRef: 'readback_sha256:qwen-route-provider-fixture-1r-smoke',
  sourceSequenceMapReadbackRef: 'readback_source_sequence_map_qwen_route_provider_fixture_1r_smoke',
  compiledIntentReadbackRef: 'readback_compiled_intent_qwen_route_provider_fixture_1r_smoke',
  editPlanVersionReadbackRef: 'readback_edit_plan_version_qwen_route_provider_fixture_1r_smoke',
  modelRoutingPolicyReadbackRef: 'readback_model_routing_policy_qwen_route_provider_fixture_1r_smoke',
  qaPolicyReadbackRef: 'readback_qa_policy_qwen_route_provider_fixture_1r_smoke',
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key]
    return
  }
  process.env[key] = value
}

const previousProviderFixtureConfirmation = process.env[providerFixtureConfirmEnv]
const previousHandoffConfirmation = process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV]
const previousReadbackConfirmation =
  process.env.REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION
const previousRuntimeGate = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]
const previousRuntimeTarget = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]
const previousRuntimeScope = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]

try {
  delete process.env[providerFixtureConfirmEnv]
  assert.equal(process.env[providerFixtureConfirmEnv], undefined)

  process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV] =
    QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE
  process.env.REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION = 'true'
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope

  const handoff = buildQwen25VlExternalBetaProductRouteBackendJobHandoff(context, input)
  assert.equal(handoff.ok, true)
  assert.equal(handoff.status, QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_READY_STATUS)
  assert.equal(handoff.backendHandoff.handoffPrepared, true)
  assert.equal(handoff.backendHandoff.providerRuntimeExecutedNow, false)
  assert.equal(handoff.backendHandoff.workerDispatchAllowedNow, false)
  assert.equal(handoff.backendHandoff.cloudRunExecutionAllowedNow, false)
  assert.equal(handoff.allowedExecution.providerModelCallAllowedNow, false)
  assert.equal(handoff.allowedExecution.cloudRunJobExecutionAllowedNow, false)
  assert.equal(handoff.safety.productRouteProviderRuntimeExecution, false)
  assert.equal(handoff.safety.providerCall, false)
  assert.equal(handoff.safety.modelCall, false)
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult(handoff)

  const unsafe = buildQwen25VlExternalBetaProductRouteBackendJobHandoff(context, {
    ...input,
    workerDispatchRequested: true,
  })
  assert.equal(unsafe.ok, false)
  assert.equal(unsafe.status, 'blocked_product_route_handler_unsafe_runtime_request')
  assert.equal(unsafe.backendHandoff.handoffPrepared, false)
  assertQwen25VlExternalBetaProductRouteBackendJobHandoffResult(unsafe)
} finally {
  restoreEnv(providerFixtureConfirmEnv, previousProviderFixtureConfirmation)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV, previousHandoffConfirmation)
  restoreEnv(
    'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION',
    previousReadbackConfirmation,
  )
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled, previousRuntimeGate)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef, previousRuntimeTarget)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope, previousRuntimeScope)
}

console.log('qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-smoke passed')
