import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
  buildGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
  runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation,
  summarizeGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationBoundary,
  validateGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1'

const input = buildGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput()
assert.deepEqual(validateGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput(input), [])

const env = {
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV]: 'true',
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV]: 'true',
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV]: 'true',
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV]: 'true',
}

const fakeRuntimeRunner = async () => ({
  packet: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2',
  decision: 'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
  execution: 'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch',
  runId: 'smoke-persisted-job-runtime-route-invocation',
  outputDir: '/tmp/reeditpro-smoke-persisted-job-runtime-route-invocation',
  report: '/tmp/reeditpro-smoke-persisted-job-runtime-route-invocation/report.json',
  manifest: '/tmp/reeditpro-smoke-persisted-job-runtime-route-invocation/manifest.json',
  artifacts: [
    {
      fileName: 'report.json',
      bytes: 12,
      sha256: 'a'.repeat(64),
    },
  ],
})

const blockedWithoutGates = await runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation(input, {
  env: {},
  runtimeRunner: fakeRuntimeRunner,
})
assert.equal(blockedWithoutGates.ok, false)
assert.equal(
  blockedWithoutGates.status,
  'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation',
)
assert.equal(blockedWithoutGates.safety.runtimeRouteInvocation, false)
assert.equal(blockedWithoutGates.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGates.safety.mkvtoolnixExecution, false)

const completed = await runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation(input, {
  env,
  runtimeRunner: fakeRuntimeRunner,
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_persisted_job_runtime_route_invocation')
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_DECISION)
assert.equal(completed.sanitizedInvocation.runtimeInvocationBodyAccepted, true)
assert.equal(completed.sanitizedInvocation.runtimeRouteInvocation, 'completed_existing_guarded_runtime_route_delegate')
assert.equal(completed.sanitizedInvocation.gstreamerExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.sanitizedInvocation.mkvtoolnixExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.safety.persistedJobPayloadRead, 'completed_local_payload_read_only')
assert.equal(completed.safety.workerDispatch, false)
assert.equal(completed.safety.workerExecution, false)
assert.equal(completed.safety.persistentJobQueueWrite, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.safety.publicArtifactCreation, false)
assert.equal(completed.safety.finalRenderExport, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)

const unsafe = await runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation(
  buildGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput({ workerDispatchRequestedNow: true }),
  {
    env,
    runtimeRunner: fakeRuntimeRunner,
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_request'))

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
  const response = await fetch(`http://127.0.0.1:${address.port}${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH}`, {
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
    'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation',
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

const boundary = summarizeGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationBoundary()
assert.ok(boundary.some((line) => line.includes('persisted generated-fixture job payload')))
assert.ok(boundary.some((line) => line.includes('approved-snapshot')))
assert.ok(boundary.some((line) => line.includes('controlled generated SRT/subtitle-only MKV fixture')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gates_block_before_runtime_invocation',
    'persisted_job_payload_delegates_to_existing_runtime_invocation_with_fake_runner',
    'unsafe_runtime_invocation_controls_block',
    'express_route_registered_and_fails_closed_without_env_gates',
    'no_private_media_supabase_sql_worker_execution_public_artifact_or_final_export_enabled',
  ],
  routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_DECISION,
}, null, 2))
