import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

import { createReeditProApiApp } from '../app'
import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS,
} from '../services/qwen2-5-vl-external-beta-product-route-readback-validation'
import type { RuntimeEnv } from '../config/env'

const routePath = '/api/providers/qwen2-5-vl/structured-visual-metadata'
const validationUserId = '22222222-2222-4222-8222-222222222222'
const targetRef = 'wmyyttnynmteqgcdishd'

const runtimeEnv: RuntimeEnv = {
  nodeEnv: 'test',
  mode: 'mock',
  apiPort: 0,
  allowMockWithoutSupabase: true,
  storageMode: 'local',
  localStorageRoot: '.reeditpro-local-storage',
  signedUrlTtlSeconds: 900,
  gcsDefaultRegion: 'us-east1',
  workerRuntimeMode: 'disabled',
  workerInstanceId: 'qwen-route-readback-runtime-validation',
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
  warnings: ['QWEN readback runtime validation uses local mock-safe route runtime only.'],
}

const basePayload = {
  workspaceId: 'workspace_qwen_route_readback_runtime_validation',
  projectId: 'project_qwen_route_readback_runtime_validation',
  editSessionId: 'edit_session_qwen_route_readback_runtime_validation',
  requestId: 'request_qwen_route_readback_runtime_validation',
  workspaceMembershipRef: 'workspace_membership_qwen_route_readback_runtime_validation',
  targetRef,
  approvedSnapshotReadbackRef: 'readback_approved_snapshot_qwen_route_readback_runtime_validation',
  creditReservationReadbackRef: 'readback_credit_reservation_qwen_route_readback_runtime_validation',
  queueLeaseReadbackRef: 'readback_queue_lease_qwen_route_readback_runtime_validation',
  privateInputManifestReadbackRef: 'readback_private_input_manifest_qwen_route_readback_runtime_validation',
  privateArtifactManifestReadbackRef: 'readback_private_artifact_manifest_qwen_route_readback_runtime_validation',
  privateArtifactChecksumReadbackRef: 'readback_sha256:qwen-route-readback-runtime-validation',
  sourceSequenceMapReadbackRef: 'readback_source_sequence_map_qwen_route_readback_runtime_validation',
  compiledIntentReadbackRef: 'readback_compiled_intent_qwen_route_readback_runtime_validation',
  editPlanVersionReadbackRef: 'readback_edit_plan_version_qwen_route_readback_runtime_validation',
  modelRoutingPolicyReadbackRef: 'readback_model_routing_policy_qwen_route_readback_runtime_validation',
  qaPolicyReadbackRef: 'readback_qa_policy_qwen_route_readback_runtime_validation',
}

interface StartedServer {
  baseUrl: string
  server: Server
}

async function startLocalApp(): Promise<StartedServer> {
  const app = createReeditProApiApp(runtimeEnv)
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
  }
}

async function stopLocalApp(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

async function postRoute(baseUrl: string, payload: Record<string, unknown>, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${routePath}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'request-qwen-route-readback-runtime-validation',
      ...headers,
    },
    body: JSON.stringify(payload),
  })
  return {
    status: response.status,
    body: await response.json(),
  }
}

function assertBlockedProviderRuntime(result: Awaited<ReturnType<typeof postRoute>>): void {
  assert.equal(result.status, 424)
  assert.equal(result.body.error?.code, 'PROVIDER_ROUTE_BLOCKED')
  assert.equal(result.body.error?.details?.status, 'blocked_provider_runtime_not_enabled')
  assert.equal(result.body.error?.details?.auth?.authenticatedUserRef, validationUserId)
  assert.equal(result.body.error?.details?.route?.routeHandlerRegisteredNow, true)
  assert.equal(result.body.error?.details?.route?.routeHandlerFailClosed, true)
  assert.equal(result.body.error?.details?.routeReadbackValidation?.ok, true)
  assert.equal(
    result.body.error?.details?.routeReadbackValidation?.status,
    QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS,
  )
  assert.equal(result.body.error?.details?.routeReadbackValidation?.target?.targetRef, targetRef)
  assert.equal(result.body.error?.details?.routeReadbackValidation?.confirmationGate?.confirmationPresent, true)
  assert.equal(
    result.body.error?.details?.routeReadbackValidation?.confirmationGate?.currentPhaseRemoteReadbackExecuted,
    false,
  )
  assert.equal(result.body.error?.details?.allowedExecution?.routeReadbackExecutionAllowedNow, false)
  assert.equal(result.body.error?.details?.allowedExecution?.providerModelCallAllowedNow, false)
  assert.equal(result.body.error?.details?.allowedExecution?.workerDispatchAllowedNow, false)
  assert.equal(result.body.error?.details?.allowedExecution?.signedUrlCreationAllowedNow, false)
  assert.equal(result.body.error?.details?.allowedExecution?.publicArtifactAllowedNow, false)
  assert.equal(result.body.error?.details?.allowedExecution?.finalRenderExportAllowedNow, false)
  assert.equal(result.body.error?.details?.allowedExecution?.externalBetaUnlockAllowedNow, false)
  assert.equal(result.body.error?.details?.safety?.routeReadbackExecution, false)
  assert.equal(result.body.error?.details?.safety?.supabaseReadbackExecution, false)
  assert.equal(result.body.error?.details?.safety?.serviceRoleReadbackExecution, false)
  assert.equal(result.body.error?.details?.safety?.qwenRuntimeExecutedInThisPhase, false)
  assert.equal(result.body.error?.details?.safety?.providerCall, false)
  assert.equal(result.body.error?.details?.safety?.modelCall, false)
  assert.equal(result.body.error?.details?.safety?.workerExecution, false)
  assert.equal(result.body.error?.details?.safety?.workerDispatch, false)
  assert.equal(result.body.error?.details?.safety?.supabaseMutation, false)
  assert.equal(result.body.error?.details?.safety?.sqlExecution, false)
  assert.equal(result.body.error?.details?.safety?.secretPayloadAccess, false)
  assert.equal(result.body.error?.details?.safety?.signedUrlCreation, false)
  assert.equal(result.body.error?.details?.safety?.publicArtifactCreation, false)
  assert.equal(result.body.error?.details?.safety?.mediaProcessing, false)
  assert.equal(result.body.error?.details?.safety?.finalRenderExport, false)
  assert.equal(result.body.error?.details?.safety?.externalBetaUnlockAppliedToEnvironment, false)
}

const previousValidationUserId = process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID
const previousValidationEmail = process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL
const previousRuntimeGate = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled]
const previousRuntimeTarget = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef]
const previousRuntimeScope = process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope]
const previousReadbackConfirmation = process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV]

process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID = validationUserId
process.env.REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL = 'qwen-route-readback-runtime-validation@reeditpro.local'
process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled] =
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled
process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef] = targetRef
process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope] =
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope
process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV] =
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE

const { baseUrl, server } = await startLocalApp()

try {
  const missingIdempotency = await postRoute(baseUrl, basePayload)
  assert.equal(missingIdempotency.status, 400)
  assert.equal(missingIdempotency.body.error?.code, 'IDEMPOTENCY_KEY_REQUIRED')

  const confirmedReadbackGate = await postRoute(baseUrl, basePayload, {
    'idempotency-key': 'idempotency-qwen-route-readback-runtime-validation',
  })
  assertBlockedProviderRuntime(confirmedReadbackGate)

  const unsafeRemoteReadbackRequest = await postRoute(
    baseUrl,
    {
      ...basePayload,
      routeReadbackExecutionRequested: true,
    },
    {
      'idempotency-key': 'idempotency-qwen-route-readback-runtime-unsafe-request-validation',
    },
  )
  assert.equal(unsafeRemoteReadbackRequest.status, 424)
  assert.equal(unsafeRemoteReadbackRequest.body.error?.code, 'PROVIDER_ROUTE_BLOCKED')
  assert.equal(unsafeRemoteReadbackRequest.body.error?.details?.status, 'blocked_product_route_handler_unsafe_runtime_request')
  assert.equal(unsafeRemoteReadbackRequest.body.error?.details?.routeReadbackValidation?.status, 'blocked_product_route_readback_unsafe_remote_request')
  assert.equal(unsafeRemoteReadbackRequest.body.error?.details?.safety?.providerCall, false)
  assert.equal(unsafeRemoteReadbackRequest.body.error?.details?.safety?.modelCall, false)
  assert.equal(unsafeRemoteReadbackRequest.body.error?.details?.safety?.supabaseMutation, false)
  assert.equal(unsafeRemoteReadbackRequest.body.error?.details?.safety?.sqlExecution, false)
} finally {
  await stopLocalApp(server)
  restoreEnv('REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID', previousValidationUserId)
  restoreEnv('REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL', previousValidationEmail)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled, previousRuntimeGate)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef, previousRuntimeTarget)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope, previousRuntimeScope)
  restoreEnv(QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV, previousReadbackConfirmation)
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key]
    return
  }
  process.env[key] = value
}

console.log('qwen2-5-vl-external-beta-product-route-readback-runtime-validation-1-smoke passed')
