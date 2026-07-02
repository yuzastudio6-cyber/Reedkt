import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
  TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION,
  TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput,
  runGpacMp4boxExecutionReadyRouteWorkerBridge,
  summarizeGpacMp4boxExecutionReadyRouteWorkerBridgeBoundary,
  validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput,
} from '../services/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1'

const validInput = buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput()
const validation = validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput(validInput)
assert.deepEqual(validation, [])

const blockedWithoutGate = await runGpacMp4boxExecutionReadyRouteWorkerBridge(validInput, {
  env: {},
  runtimeRunner: async () => {
    throw new Error('runner should not be called without gate')
  },
})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(
  blockedWithoutGate.status,
  'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_confirmation',
)
assert.equal(blockedWithoutGate.safety.gpacMp4boxExecution, false)
assert.equal(blockedWithoutGate.safety.dockerExecution, false)
assert.equal(blockedWithoutGate.safety.privateMediaProcessing, false)

const unsafePayload = await runGpacMp4boxExecutionReadyRouteWorkerBridge(
  buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput({
    publicUrl: 'https://example.invalid/private-media.mp4',
  }),
  {
    env: { [TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV]: 'true' },
    runtimeRunner: async () => {
      throw new Error('runner should not be called for unsafe payload')
    },
  },
)
assert.equal(unsafePayload.ok, false)
assert.ok(unsafePayload.blockers.includes('blocked_unsupported_gpac_mp4box_runtime_request_payload'))
assert.equal(unsafePayload.safety.publicArtifactCreation, false)

const completed = await runGpacMp4boxExecutionReadyRouteWorkerBridge(validInput, {
  env: { [TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV]: 'true' },
  runtimeRunner: async () => ({
    packet: 'TRACKA-GPAC-MP4BOX-GENERATED-FIXTURE-RUNTIME-EXECUTION-1',
    decision: 'completed_gpac_mp4box_generated_fixture_runtime_execution',
    execution: 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only',
    runId: 'smoke-run-gpac-mp4box-execution-ready-bridge',
    outputDir: '/tmp/reeditpro-smoke-gpac-mp4box-execution-ready-bridge',
    report: '/tmp/reeditpro-smoke-gpac-mp4box-execution-ready-bridge/report.json',
    manifest: '/tmp/reeditpro-smoke-gpac-mp4box-execution-ready-bridge/manifest.json',
    artifacts: [
      {
        fileName: 'report.json',
        bytes: 1234,
        sha256: 'a'.repeat(64),
      },
    ],
  }),
})
assert.equal(completed.ok, true)
assert.equal(
  completed.status,
  'completed_gpac_mp4box_execution_ready_route_worker_bridge_generated_fixture_runtime_delegate',
)
assert.equal(completed.decision, TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION)
assert.equal(completed.safety.routeHandlerInvocation, 'completed_guarded_route_handler')
assert.equal(completed.safety.realWorkerDispatch, false)
assert.equal(completed.safety.workerExecutionByRoute, false)
assert.equal(completed.safety.gpacMp4boxExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.safety.mediaProcessing, 'controlled_generated_fixture_only')
assert.equal(completed.safety.privateMediaProcessing, false)
assert.equal(completed.safety.userMediaProcessing, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.safety.finalRenderExport, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_SERVICE_ROLE_KEY: '',
  SUPABASE_URL: '',
})
const app = createReeditProApiApp(env)
const server = app.listen(0)
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const requestBody = {
    ...buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput({
      workspaceId: 'workspace-route-smoke-gpac-mp4box',
      projectId: 'project-route-smoke-gpac-mp4box',
    }),
  }
  delete (requestBody as { routeIdempotencyKey?: string }).routeIdempotencyKey
  const response = await fetch(
    `http://127.0.0.1:${address.port}${TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'idem-route-smoke-gpac-mp4box-execution-ready-bridge',
      },
      body: JSON.stringify(requestBody),
    },
  )
  assert.equal(response.status, 409)
  const body = await response.json() as {
    data?: { result?: { ok?: boolean; status?: string; safety?: { gpacMp4boxExecution?: unknown } } }
  }
  assert.equal(body.data?.result?.ok, false)
  assert.equal(
    body.data?.result?.status,
    'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_confirmation',
  )
  assert.equal(body.data?.result?.safety?.gpacMp4boxExecution, false)
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

const boundary = summarizeGpacMp4boxExecutionReadyRouteWorkerBridgeBoundary()
assert.ok(boundary.some((line) => line.includes('backend route')))
assert.ok(boundary.some((line) => line.includes('Fails closed')))
assert.ok(boundary.some((line) => line.includes('generated SRT/subtitle-only MP4')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_gpac_mp4box_generated_fixture_bridge_input',
    'confirmation_gate_blocks_before_runner',
    'unsafe_public_url_payload_blocks_before_runner',
    'fake_runner_success_path_accepts_generated_fixture_runtime_packet',
    'express_route_registered_and_fails_closed_without_env_gate',
    'no_private_media_supabase_sql_public_artifact_or_final_export_enabled',
  ],
  routePath: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  decision: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION,
}, null, 2))
