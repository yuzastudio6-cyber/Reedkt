import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge,
  summarizeGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeBoundary,
  validateGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'

const validInput = buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput()
const validation = validateGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput(validInput)
assert.deepEqual(validation, [])

const blockedWithoutGate = await runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge(validInput, {
  env: {},
  runtimeRunner: async () => {
    throw new Error('runner should not be called without gate')
  },
})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(blockedWithoutGate.status, 'blocked_missing_narrow_execution_ready_route_worker_bridge_confirmation')
assert.equal(blockedWithoutGate.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGate.safety.mkvtoolnixExecution, false)
assert.equal(blockedWithoutGate.safety.dockerExecution, false)

const unsafePayload = await runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge(
  buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput({
    publicUrl: 'https://example.invalid/private-media.mp4',
  }),
  {
    env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV]: 'true' },
    runtimeRunner: async () => {
      throw new Error('runner should not be called for unsafe payload')
    },
  },
)
assert.equal(unsafePayload.ok, false)
assert.ok(unsafePayload.blockers.includes('blocked_unsupported_runtime_request_payload'))
assert.equal(unsafePayload.safety.publicArtifactCreation, false)

const completed = await runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge(validInput, {
  env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV]: 'true' },
  runtimeRunner: async () => ({
    packet: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2',
    decision: 'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
    execution: 'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch',
    runId: 'smoke-run-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    outputDir: '/tmp/reeditpro-smoke-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    report: '/tmp/reeditpro-smoke-gstreamer-mkvtoolnix-narrow-execution-ready-bridge/report.json',
    manifest: '/tmp/reeditpro-smoke-gstreamer-mkvtoolnix-narrow-execution-ready-bridge/manifest.json',
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
  'completed_narrow_execution_ready_route_worker_bridge_controlled_generated_fixture_runtime_delegate',
)
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION)
assert.equal(completed.safety.routeHandlerInvocation, 'completed_guarded_route_handler')
assert.equal(completed.safety.realWorkerDispatch, false)
assert.equal(completed.safety.workerExecutionByRoute, false)
assert.equal(completed.safety.gstreamerExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.safety.mkvtoolnixExecution, 'completed_controlled_generated_fixture_only')
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
    ...buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput({
      workspaceId: 'workspace-route-smoke-gstreamer-mkvtoolnix',
      projectId: 'project-route-smoke-gstreamer-mkvtoolnix',
    }),
  }
  delete (requestBody as { routeIdempotencyKey?: string }).routeIdempotencyKey
  const response = await fetch(`http://127.0.0.1:${address.port}${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'idem-route-smoke-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    },
    body: JSON.stringify(requestBody),
  })
  assert.equal(response.status, 409)
  const body = await response.json() as {
    data?: { result?: { ok?: boolean; status?: string; safety?: { gstreamerExecution?: unknown } } }
  }
  assert.equal(body.data?.result?.ok, false)
  assert.equal(body.data?.result?.status, 'blocked_missing_narrow_execution_ready_route_worker_bridge_confirmation')
  assert.equal(body.data?.result?.safety?.gstreamerExecution, false)
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

const boundary = summarizeGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeBoundary()
assert.ok(boundary.some((line) => line.includes('backend route')))
assert.ok(boundary.some((line) => line.includes('Fails closed')))
assert.ok(boundary.some((line) => line.includes('generated SRT/subtitle-only MKV')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_generated_fixture_bridge_input',
    'confirmation_gate_blocks_before_runner',
    'unsafe_public_url_payload_blocks_before_runner',
    'fake_runner_success_path_accepts_existing_runtime_packet_2',
    'express_route_registered_and_fails_closed_without_env_gate',
    'no_private_media_supabase_sql_public_artifact_or_final_export_enabled',
  ],
  routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION,
}, null, 2))
