import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
  buildGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput,
  runGstreamerMkvtoolnixPersistedJobRuntimeHandoff,
  summarizeGstreamerMkvtoolnixPersistedJobRuntimeHandoffBoundary,
  validateGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1'
import type { ServiceContext } from '../types'

const input = buildGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput()
assert.deepEqual(validateGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput(input), [])

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_SERVICE_ROLE_KEY: '',
  SUPABASE_URL: '',
})

const context: ServiceContext = {
  env,
  clients: {
    admin: null,
    public: null,
  },
  requestId: 'gstreamer-mkvtoolnix-persisted-job-runtime-handoff-smoke',
  auth: {
    userId: 'mock-user-runtime',
    email: 'mock-user@reeditpro.local',
    isMockUser: true,
  },
}

const blockedWithoutGates = await runGstreamerMkvtoolnixPersistedJobRuntimeHandoff(input, context, {
  env: {},
})
assert.equal(blockedWithoutGates.ok, false)
assert.equal(
  blockedWithoutGates.status,
  'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_confirmation',
)
assert.equal(blockedWithoutGates.safety.persistentJobQueueWrite, false)
assert.equal(blockedWithoutGates.safety.runtimeRouteInvocation, false)
assert.equal(blockedWithoutGates.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGates.safety.mkvtoolnixExecution, false)

const completed = await runGstreamerMkvtoolnixPersistedJobRuntimeHandoff(input, context, {
  env: {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV]: 'true',
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV]: 'true',
  },
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_persisted_job_runtime_handoff')
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION)
assert.equal(completed.sanitizedHandoff.externalAgentRuntimeHandoffReady, true)
assert.equal(completed.sanitizedHandoff.runtimeInvocationBodyAccepted, true)
assert.equal(completed.sanitizedHandoff.runtimeRouteBodyAccepted, true)
assert.equal(completed.sanitizedHandoff.jobServiceMode, 'local_mock_job_service')
assert.equal(completed.sanitizedHandoff.localMockJobServiceWrite, true)
assert.equal(completed.sanitizedHandoff.serviceRoleJobServiceWrite, false)
assert.equal(completed.sanitizedHandoff.supabaseMutation, false)
assert.equal(completed.safety.persistentJobQueueWrite, 'completed_job_service_job_batch_and_job_handoff')
assert.equal(completed.safety.serviceRoleWriteScope, false)
assert.equal(completed.safety.localMockJobServiceWrite, true)
assert.equal(completed.safety.runtimeRouteInvocation, false)
assert.equal(completed.safety.gstreamerExecution, false)
assert.equal(completed.safety.mkvtoolnixExecution, false)
assert.equal(completed.safety.workerDispatch, false)
assert.equal(completed.safety.workerExecution, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.safety.publicArtifactCreation, false)
assert.equal(completed.safety.finalRenderExport, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)
assert.ok(completed.jobBatch?.mockOnly)
assert.ok(completed.job?.mockOnly)
assert.ok(completed.warnings.some((warning) => warning.includes('mock')))

const unsafe = await runGstreamerMkvtoolnixPersistedJobRuntimeHandoff(
  buildGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput({ runtimeRouteInvocationRequestedNow: true }),
  context,
  {
    env: {
      [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV]: 'true',
      [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV]: 'true',
    },
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_request'))

const app = createReeditProApiApp(env)
const server = app.listen(0)
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const response = await fetch(`http://127.0.0.1:${address.port}${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH}`, {
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
    'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_confirmation',
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

const boundary = summarizeGstreamerMkvtoolnixPersistedJobRuntimeHandoffBoundary()
assert.ok(boundary.some((line) => line.includes('backend job-service handoff')))
assert.ok(boundary.some((line) => line.includes('does not execute GStreamer')))
assert.ok(boundary.some((line) => line.includes('job batch and job records only')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gates_block_before_persisted_handoff',
    'local_mock_job_service_handoff_created',
    'runtime_invocation_body_stored_without_execution',
    'unsafe_runtime_invocation_request_blocks',
    'express_route_registered_and_fails_closed_without_env_gates',
    'no_private_media_supabase_sql_worker_execution_public_artifact_or_final_export_enabled',
  ],
  routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION,
}, null, 2))
