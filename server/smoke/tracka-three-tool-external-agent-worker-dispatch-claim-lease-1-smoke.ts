import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  buildThreeToolExternalAgentWorkerDispatchClaimLeaseInput,
  runThreeToolExternalAgentWorkerDispatchClaimLease,
  summarizeThreeToolExternalAgentWorkerDispatchClaimLeaseBoundary,
  validateThreeToolExternalAgentWorkerDispatchClaimLeaseInput,
} from '../services/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1'

const runtimeEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_SERVICE_ROLE_KEY: '',
  SUPABASE_URL: '',
})

const context: ServiceContext = {
  env: runtimeEnv,
  clients: { admin: null, public: null },
  requestId: 'smoke-tracka-three-tool-worker-claim-lease',
  auth: { userId: 'mock-user', isMockUser: true },
}

const input = buildThreeToolExternalAgentWorkerDispatchClaimLeaseInput()
assert.deepEqual(validateThreeToolExternalAgentWorkerDispatchClaimLeaseInput(input), [])

const blockedWithoutGate = await runThreeToolExternalAgentWorkerDispatchClaimLease(input, context, {})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(blockedWithoutGate.status, 'blocked_missing_three_tool_worker_claim_lease_confirmation')
assert.equal(blockedWithoutGate.safety.localMockWorkerLeaseClaim, false)
assert.equal(blockedWithoutGate.safety.workerDispatch, false)
assert.equal(blockedWithoutGate.safety.workerExecution, false)
assert.equal(blockedWithoutGate.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGate.safety.mkvtoolnixExecution, false)
assert.equal(blockedWithoutGate.safety.gpacMp4boxExecution, false)

const completed = await runThreeToolExternalAgentWorkerDispatchClaimLease(
  buildThreeToolExternalAgentWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-three-tool-external-agent-generated-fixture-runtime-smoke-1',
    workerInstanceId: 'local-tracka-three-tool-external-agent-worker-smoke-1',
  }),
  context,
  {
    [TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_three_tool_worker_claim_lease_boundary')
assert.equal(completed.decision, TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_DECISION)
assert.equal(completed.sanitizedClaimLease.workerLeaseClaim, 'completed_local_mock_claim_only')
assert.equal(completed.safety.localMockWorkerLeaseClaim, 'completed')
assert.equal(completed.safety.runtimeRouteInvocation, false)
assert.equal(completed.safety.workerDispatch, false)
assert.equal(completed.safety.workerExecution, false)
assert.equal(completed.safety.workerProcessStart, false)
assert.equal(completed.safety.gstreamerExecution, false)
assert.equal(completed.safety.mkvtoolnixExecution, false)
assert.equal(completed.safety.gpacMp4boxExecution, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)

const unsafe = await runThreeToolExternalAgentWorkerDispatchClaimLease(
  buildThreeToolExternalAgentWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-three-tool-external-agent-generated-fixture-runtime-unsafe',
    workerInstanceId: 'local-tracka-three-tool-external-agent-worker-unsafe',
    workerExecutionRequestedNow: true,
  }),
  context,
  {
    [TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_unsafe_three_tool_worker_claim_lease_request'))

const remoteBlocked = await runThreeToolExternalAgentWorkerDispatchClaimLease(
  buildThreeToolExternalAgentWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-three-tool-external-agent-generated-fixture-runtime-remote-blocked',
    workerInstanceId: 'remote-tracka-three-tool-external-agent-worker-blocked',
  }),
  {
    ...context,
    clients: { admin: {} as ServiceContext['clients']['admin'], public: null },
    env: { ...runtimeEnv, mockOnly: false, hasSupabaseAdmin: true },
  },
  {
    [TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(remoteBlocked.ok, false)
assert.ok(remoteBlocked.blockers.includes('blocked_remote_worker_claim_requires_separate_owner_confirmation'))

process.env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV] = 'true'
const app = createReeditProApiApp(runtimeEnv)
const server = app.listen(0)
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const routeInput = buildThreeToolExternalAgentWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-three-tool-external-agent-generated-fixture-runtime-route-smoke',
    persistedInvocationId: 'persisted-invocation-three-tool-external-agent-generated-fixture-route-smoke',
    workerInstanceId: 'local-tracka-three-tool-external-agent-worker-route-smoke',
  })
  const response = await fetch(`http://127.0.0.1:${address.port}${TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': routeInput.routeIdempotencyKey,
    },
    body: JSON.stringify(routeInput),
  })
  assert.equal(response.status, 201)
  const body = await response.json() as {
    data?: { result?: { ok?: boolean; status?: string; safety?: { workerDispatch?: unknown; workerExecution?: unknown } } }
  }
  assert.equal(body.data?.result?.ok, true)
  assert.equal(body.data?.result?.status, 'completed_three_tool_worker_claim_lease_boundary')
  assert.equal(body.data?.result?.safety?.workerDispatch, false)
  assert.equal(body.data?.result?.safety?.workerExecution, false)
} finally {
  delete process.env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

const boundary = summarizeThreeToolExternalAgentWorkerDispatchClaimLeaseBoundary()
assert.ok(boundary.some((line) => line.includes('local/mock worker lease claim')))
assert.ok(boundary.some((line) => line.includes('Remote Supabase worker-claim mutation remains blocked')))
assert.ok(boundary.some((line) => line.includes('Does not invoke the runtime route')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gate_blocks_worker_claim_lease',
    'local_mock_worker_claim_lease_succeeds_without_worker_execution',
    'unsafe_runtime_flags_block',
    'remote_worker_claim_blocks_without_separate_owner_gate',
    'express_route_requires_idempotency_and_returns_201',
  ],
  routePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
}, null, 2))
