import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_CONFIRM_ENV,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH,
  buildThreeToolExternalAgentPersistedJobRouteInvocationInput,
  runThreeToolExternalAgentPersistedJobRouteInvocation,
  summarizeThreeToolExternalAgentPersistedJobRouteInvocationBoundary,
  validateThreeToolExternalAgentPersistedJobRouteInvocationInput,
} from '../services/tracka-three-tool-external-agent-persisted-job-route-invocation-1'

const input = buildThreeToolExternalAgentPersistedJobRouteInvocationInput()
assert.deepEqual(validateThreeToolExternalAgentPersistedJobRouteInvocationInput(input), [])

const fakeOutputDir = '/tmp/reeditpro-tracka-three-tool-persisted-route-invocation-smoke'
fs.mkdirSync(fakeOutputDir, { recursive: true })
const fakeReport = path.join(fakeOutputDir, 'report.json')
const fakeManifest = path.join(fakeOutputDir, 'manifest.json')
fs.writeFileSync(fakeReport, JSON.stringify({
  approvedSnapshotJobExecution: {
    gstreamerExecution: 'completed_controlled_generated_fixture_only',
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
    gpacMp4boxExecution: 'completed_controlled_generated_fixture_only',
  },
  safety: {
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  },
}, null, 2))
fs.writeFileSync(fakeManifest, JSON.stringify({ artifacts: [] }, null, 2))

const env = {
  [TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV]: 'true',
  [TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION_CONFIRM_ENV]: 'true',
}

const fakeRuntimeRunner = async () => ({
  packet: 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1',
  decision: 'completed_three_tool_external_agent_approved_snapshot_job_execution',
  execution: 'completed_confirmation_gated_three_tool_approved_snapshot_job_execution_generated_fixture_only',
  runId: 'smoke-three-tool-persisted-job-route-invocation',
  outputDir: fakeOutputDir,
  report: fakeReport,
  manifest: fakeManifest,
  artifacts: [
    {
      fileName: 'report.json',
      bytes: fs.statSync(fakeReport).size,
      sha256: 'a'.repeat(64),
    },
  ],
})

const blockedWithoutGates = await runThreeToolExternalAgentPersistedJobRouteInvocation(input, {
  env: {},
  runtimeRunner: fakeRuntimeRunner,
})
assert.equal(blockedWithoutGates.ok, false)
assert.equal(
  blockedWithoutGates.status,
  'blocked_pending_three_tool_persisted_job_route_invocation_confirmation',
)
assert.equal(blockedWithoutGates.safety.runtimeRouteInvocation, false)
assert.equal(blockedWithoutGates.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGates.safety.mkvtoolnixExecution, false)
assert.equal(blockedWithoutGates.safety.gpacMp4boxExecution, false)

const completed = await runThreeToolExternalAgentPersistedJobRouteInvocation(input, {
  env,
  runtimeRunner: fakeRuntimeRunner,
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_persisted_job_route_invocation')
assert.equal(completed.decision, TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION)
assert.equal(completed.sanitizedInvocation.runtimeRouteInvocation, 'completed_three_tool_approved_snapshot_runtime_delegate')
assert.equal(completed.sanitizedInvocation.gstreamerExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.sanitizedInvocation.mkvtoolnixExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.sanitizedInvocation.gpacMp4boxExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.safety.persistedJobPayloadRead, 'completed_local_payload_read_only')
assert.equal(completed.safety.workerDispatch, false)
assert.equal(completed.safety.workerExecution, false)
assert.equal(completed.safety.persistentJobQueueWrite, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.safety.publicArtifactCreation, false)
assert.equal(completed.safety.finalRenderExport, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)

const unsafe = await runThreeToolExternalAgentPersistedJobRouteInvocation(
  buildThreeToolExternalAgentPersistedJobRouteInvocationInput({ workerDispatchRequestedNow: true }),
  {
    env,
    runtimeRunner: fakeRuntimeRunner,
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_three_tool_persisted_job_route_invocation_unsafe_request'))

const routeEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_SERVICE_ROLE_KEY: '',
  SUPABASE_URL: '',
})
const app = createReeditProApiApp(routeEnv)
const server = app.listen(0)
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const response = await fetch(`http://127.0.0.1:${address.port}${TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': input.routeIdempotencyKey,
    },
    body: JSON.stringify(input),
  })
  assert.equal(response.status, 409)
  const body = await response.json() as {
    data?: { result?: { ok?: boolean; status?: string; safety?: { runtimeRouteInvocation?: unknown } } }
  }
  assert.equal(body.data?.result?.ok, false)
  assert.equal(
    body.data?.result?.status,
    'blocked_pending_three_tool_persisted_job_route_invocation_confirmation',
  )
  assert.equal(body.data?.result?.safety?.runtimeRouteInvocation, false)
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

const boundary = summarizeThreeToolExternalAgentPersistedJobRouteInvocationBoundary()
assert.ok(boundary.some((line) => line.includes('local/mock three-tool persisted job handoff payload')))
assert.ok(boundary.some((line) => line.includes('approved-snapshot generated-fixture runtime packet')))
assert.ok(boundary.some((line) => line.includes('GStreamer, MKVToolNix, and GPAC/MP4Box')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gates_block_before_route_invocation',
    'persisted_job_payload_delegates_to_fake_approved_snapshot_runtime',
    'unsafe_worker_dispatch_request_blocks',
    'express_route_registered_and_fails_closed_without_env_gates',
    'no_private_media_supabase_sql_worker_execution_public_artifact_or_final_export_enabled',
  ],
  routePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH,
  decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION,
}, null, 2))
