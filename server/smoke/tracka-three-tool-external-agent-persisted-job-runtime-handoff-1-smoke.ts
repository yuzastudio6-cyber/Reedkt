import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
  buildThreeToolExternalAgentPersistedJobRuntimeHandoffInput,
  runThreeToolExternalAgentPersistedJobRuntimeHandoff,
  summarizeThreeToolExternalAgentPersistedJobRuntimeHandoffBoundary,
  validateThreeToolExternalAgentPersistedJobRuntimeHandoffInput,
} from '../services/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1'
import type { ServiceContext } from '../types'

const input = buildThreeToolExternalAgentPersistedJobRuntimeHandoffInput()
assert.deepEqual(validateThreeToolExternalAgentPersistedJobRuntimeHandoffInput(input), [])

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
  requestId: 'tracka-three-tool-persisted-job-runtime-handoff-smoke',
  auth: {
    userId: 'mock-user-three-tool-runtime',
    email: 'mock-user-three-tool@reeditpro.local',
    isMockUser: true,
  },
}

const blockedWithoutGate = await runThreeToolExternalAgentPersistedJobRuntimeHandoff(input, context, {
  env: {},
})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(
  blockedWithoutGate.status,
  'blocked_pending_three_tool_persisted_job_runtime_handoff_confirmation',
)
assert.equal(blockedWithoutGate.safety.localMockJobServiceHandoff, false)
assert.equal(blockedWithoutGate.safety.serviceRoleJobServiceWrite, false)
assert.equal(blockedWithoutGate.safety.runtimeRouteInvocation, false)
assert.equal(blockedWithoutGate.safety.workerDispatch, false)
assert.equal(blockedWithoutGate.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGate.safety.mkvtoolnixExecution, false)
assert.equal(blockedWithoutGate.safety.gpacMp4boxExecution, false)

const completed = await runThreeToolExternalAgentPersistedJobRuntimeHandoff(input, context, {
  env: {
    [TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV]: 'true',
  },
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_persisted_job_runtime_handoff')
assert.equal(completed.decision, TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION)
assert.equal(completed.sanitizedHandoff.persistedJobHandoffMode, 'local_mock_job_service_handoff_no_remote_mutation')
assert.equal(completed.sanitizedHandoff.localMockJobServiceWrite, true)
assert.equal(completed.sanitizedHandoff.serviceRoleJobServiceWrite, false)
assert.equal(completed.sanitizedHandoff.runtimeRouteInvocation, false)
assert.equal(completed.sanitizedHandoff.persistentJobQueueWrite, false)
assert.equal(completed.sanitizedHandoff.workerDispatch, false)
assert.equal(completed.sanitizedHandoff.workerExecution, false)
assert.equal(completed.sanitizedHandoff.gstreamerExecution, false)
assert.equal(completed.sanitizedHandoff.mkvtoolnixExecution, false)
assert.equal(completed.sanitizedHandoff.gpacMp4boxExecution, false)
assert.equal(completed.sanitizedHandoff.supabaseMutation, false)
assert.equal(completed.safety.localMockJobServiceHandoff, true)
assert.equal(completed.safety.serviceRoleJobServiceWrite, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.safety.publicArtifactCreation, false)
assert.equal(completed.safety.finalRenderExport, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)
assert.ok(completed.jobBatch?.mockOnly)
assert.ok(completed.job?.mockOnly)
assert.ok(completed.warnings.some((warning) => warning.includes('mock')))

const remoteBlocked = await runThreeToolExternalAgentPersistedJobRuntimeHandoff(
  input,
  {
    ...context,
    env: {
      ...env,
      mockOnly: false,
    },
    clients: {
      admin: {} as ServiceContext['clients']['admin'],
      public: null,
    },
  },
  {
    env: {
      [TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV]: 'true',
    },
  },
)
assert.equal(remoteBlocked.ok, false)
assert.ok(remoteBlocked.blockers.includes('blocked_remote_job_service_write_not_approved_for_three_tool_handoff'))

const unsafe = await runThreeToolExternalAgentPersistedJobRuntimeHandoff(
  buildThreeToolExternalAgentPersistedJobRuntimeHandoffInput({ workerDispatchRequestedNow: true }),
  context,
  {
    env: {
      [TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV]: 'true',
    },
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_three_tool_persisted_job_runtime_handoff_unsafe_request'))

const app = createReeditProApiApp(env)
const server = app.listen(0)
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const response = await fetch(`http://127.0.0.1:${address.port}${TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': input.routeIdempotencyKey ?? 'tracka-three-tool-persisted-handoff-smoke',
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
    'blocked_pending_three_tool_persisted_job_runtime_handoff_confirmation',
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

const boundary = summarizeThreeToolExternalAgentPersistedJobRuntimeHandoffBoundary()
assert.ok(boundary.some((line) => line.includes('local/mock backend job-service handoff')))
assert.ok(boundary.some((line) => line.includes('GStreamer, MKVToolNix, and GPAC/MP4Box')))
assert.ok(boundary.some((line) => line.includes('Remote service-role job-service writes deliberately fail closed')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gate_blocks_before_handoff',
    'local_mock_job_service_handoff_created',
    'remote_service_role_write_fails_closed',
    'unsafe_worker_dispatch_request_blocks',
    'express_route_registered_and_fails_closed_without_env_gate',
    'no_tool_media_supabase_sql_worker_execution_public_artifact_or_final_export_enabled',
  ],
  routePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
  decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION,
}, null, 2))
