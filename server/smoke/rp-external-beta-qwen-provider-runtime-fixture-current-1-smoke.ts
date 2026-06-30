import assert from 'node:assert/strict'
import { request } from 'node:http'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

import {
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES,
} from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE,
} from '../services/qwen2-5-vl-external-beta-product-route-handler-source'
import { handleServerRequest } from '../../src/server/server-router'

const routePath = '/api/providers/qwen2-5-vl/structured-visual-metadata'
const readbackConfirmEnv = 'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION'
const localValidationConfirmEnv = 'REEDITPRO_CONFIRM_QWEN_NATIVE_API_AUTH_CONTEXT_LOCAL_VALIDATION'
const validationUserIdEnv = 'REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID'
const validationEmailEnv = 'REEDITPRO_ROUTE_VALIDATION_AUTH_EMAIL'

const routeBody = {
  workspaceId: 'workspace_qwen_provider_runtime_fixture_current_smoke',
  projectId: 'project_qwen_provider_runtime_fixture_current_smoke',
  editSessionId: 'edit_session_qwen_provider_runtime_fixture_current_smoke',
  requestId: 'request_qwen_provider_runtime_fixture_current_smoke',
  workspaceMembershipRef: 'workspace_membership_qwen_provider_runtime_fixture_current_smoke',
  targetRef: 'wmyyttnynmteqgcdishd',
  adapterRequestId: 'adapter_request_qwen_provider_runtime_fixture_current_smoke',
  approvedSnapshotReadbackRef: 'readback_approved_snapshot_qwen_provider_runtime_fixture_current_smoke',
  creditReservationReadbackRef: 'readback_credit_reservation_qwen_provider_runtime_fixture_current_smoke',
  queueLeaseReadbackRef: 'readback_queue_lease_qwen_provider_runtime_fixture_current_smoke',
  privateInputManifestReadbackRef: 'readback_private_input_manifest_qwen_provider_runtime_fixture_current_smoke',
  privateArtifactManifestReadbackRef: 'readback_private_artifact_manifest_qwen_provider_runtime_fixture_current_smoke',
  privateArtifactChecksumReadbackRef: 'readback_sha256:qwen-provider-runtime-fixture-current-smoke',
  sourceSequenceMapReadbackRef: 'readback_source_sequence_map_qwen_provider_runtime_fixture_current_smoke',
  compiledIntentReadbackRef: 'readback_compiled_intent_qwen_provider_runtime_fixture_current_smoke',
  editPlanVersionReadbackRef: 'readback_edit_plan_version_qwen_provider_runtime_fixture_current_smoke',
  modelRoutingPolicyReadbackRef: 'readback_model_routing_policy_qwen_provider_runtime_fixture_current_smoke',
  qaPolicyReadbackRef: 'readback_qa_policy_qwen_provider_runtime_fixture_current_smoke',
}

const envKeys = [
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV,
  readbackConfirmEnv,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef,
  QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope,
  localValidationConfirmEnv,
  validationUserIdEnv,
  validationEmailEnv,
]
const previousEnv = new Map(envKeys.map((key) => [key, process.env[key]]))

interface RouteResponseBody {
  ok?: boolean
  decision: string
  status?: string
  blocker?: string
  error?: {
    code: string
    message: string
  }
  routeReadbackValidation?: {
    status: string
    routeIntegration: {
      status: string
    }
  }
  backendHandoff: {
    handoffPrepared: boolean
    executeNow: boolean
    providerRuntimeExecutedNow: boolean
  }
  allowedExecution: {
    providerModelCallAllowedNow: boolean
    workerDispatchAllowedNow: boolean
    cloudRunJobExecutionAllowedNow: boolean
  }
  safety: {
    providerCall: boolean
    modelCall: boolean
    workerDispatch: boolean
    cloudRunJobExecution?: boolean
  }
}

function restoreEnv(): void {
  for (const [key, value] of previousEnv) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function setConfirmedBackendHandoffEnv(): void {
  process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV] =
    QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE
  process.env[readbackConfirmEnv] = 'true'
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.enabled] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.enabled
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.targetRef] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.targetRef
  process.env[QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV.scope] =
    QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_REQUIRED_VALUES.scope
}

function setLocalValidationAuthEnv(): void {
  process.env[localValidationConfirmEnv] = 'true'
  process.env[validationUserIdEnv] = '11111111-1111-4111-8111-111111111111'
  process.env[validationEmailEnv] = 'route-validation@reeditpro.local'
}

async function postJson(port: number): Promise<{ statusCode: number; body: RouteResponseBody }> {
  const body = JSON.stringify(routeBody)
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: '127.0.0.1',
        port,
        method: 'POST',
        path: routePath,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
          'idempotency-key': 'route_idempotency_qwen_provider_runtime_fixture_current_smoke',
          'x-request-id': 'request_qwen_provider_runtime_fixture_current_smoke',
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('error', reject)
        res.on('end', () => {
          const responseText = Buffer.concat(chunks).toString('utf8')
          resolve({
            statusCode: res.statusCode ?? 0,
            body: JSON.parse(responseText) as RouteResponseBody,
          })
        })
      },
    )
    req.on('error', reject)
    req.end(body)
  })
}

const server = createServer((request, response) => {
  void handleServerRequest(request, response)
})

try {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.equal(typeof address, 'object')
  assert.ok(address)
  const port = (address as AddressInfo).port

  restoreEnv()
  const failClosed = await postJson(port)
  assert.equal(failClosed.statusCode, 424)
  assert.equal(failClosed.body.decision, 'completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract')
  assert.equal(failClosed.body.safety.providerCall, false)
  assert.equal(failClosed.body.safety.modelCall, false)
  assert.equal(failClosed.body.safety.workerDispatch, false)

  restoreEnv()
  process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV] =
    QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE
  const missingBearerBeforeReadbackGate = await postJson(port)
  assert.equal(missingBearerBeforeReadbackGate.statusCode, 401)
  assert.equal(missingBearerBeforeReadbackGate.body.ok, false)
  assert.equal(missingBearerBeforeReadbackGate.body.error?.code, 'AUTH_REQUIRED')
  assert.equal(missingBearerBeforeReadbackGate.body.blocker, 'blocked_missing_authorization_bearer_token')
  assert.equal(missingBearerBeforeReadbackGate.body.safety.providerCall, false)
  assert.equal(missingBearerBeforeReadbackGate.body.safety.modelCall, false)

  restoreEnv()
  process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_ENV] =
    QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_CONFIRM_VALUE
  setLocalValidationAuthEnv()
  const missingReadbackGate = await postJson(port)
  assert.equal(missingReadbackGate.statusCode, 424)
  assert.equal(missingReadbackGate.body.decision, 'completed_qwen2_5_vl_product_route_backend_job_handoff_source_contract')
  assert.equal(missingReadbackGate.body.status, 'blocked_pending_route_readback_validation_gate')
  assert.equal(missingReadbackGate.body.backendHandoff.handoffPrepared, false)
  assert.equal(missingReadbackGate.body.safety.providerCall, false)
  assert.equal(missingReadbackGate.body.safety.modelCall, false)

  restoreEnv()
  setConfirmedBackendHandoffEnv()
  const missingBearerToken = await postJson(port)
  assert.equal(missingBearerToken.statusCode, 401)
  assert.equal(missingBearerToken.body.ok, false)
  assert.equal(missingBearerToken.body.error?.code, 'AUTH_REQUIRED')
  assert.equal(missingBearerToken.body.blocker, 'blocked_missing_authorization_bearer_token')
  assert.equal(missingBearerToken.body.safety.providerCall, false)
  assert.equal(missingBearerToken.body.safety.modelCall, false)
  assert.equal(missingBearerToken.body.safety.workerDispatch, false)
  assert.equal(missingBearerToken.body.safety.cloudRunJobExecution, false)

  restoreEnv()
  setConfirmedBackendHandoffEnv()
  setLocalValidationAuthEnv()
  const readyWithValidationAuth = await postJson(port)
  assert.equal(readyWithValidationAuth.statusCode, 202)
  assert.equal(readyWithValidationAuth.body.decision, 'completed_qwen2_5_vl_product_route_backend_job_handoff_source_contract')
  assert.equal(readyWithValidationAuth.body.status, 'ready_for_guarded_qwen2_5_vl_product_route_provider_runtime_fixture')
  assert.equal(readyWithValidationAuth.body.backendHandoff.handoffPrepared, true)
  assert.equal(readyWithValidationAuth.body.backendHandoff.executeNow, false)
  assert.equal(readyWithValidationAuth.body.backendHandoff.providerRuntimeExecutedNow, false)
  assert.equal(readyWithValidationAuth.body.allowedExecution.providerModelCallAllowedNow, false)
  assert.equal(readyWithValidationAuth.body.allowedExecution.workerDispatchAllowedNow, false)
  assert.equal(readyWithValidationAuth.body.allowedExecution.cloudRunJobExecutionAllowedNow, false)
  assert.equal(readyWithValidationAuth.body.safety.providerCall, false)
  assert.equal(readyWithValidationAuth.body.safety.modelCall, false)
  assert.equal(readyWithValidationAuth.body.safety.workerDispatch, false)
  assert.equal(readyWithValidationAuth.body.safety.cloudRunJobExecution, false)
} finally {
  restoreEnv()
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
}

console.log('rp-external-beta-qwen-provider-runtime-fixture-current-1-smoke passed')
