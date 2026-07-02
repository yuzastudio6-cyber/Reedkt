import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
  runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease,
  summarizeGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseBoundary,
  validateGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1'

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
  requestId: 'smoke-persisted-job-worker-claim-lease',
  auth: { userId: 'mock-user', isMockUser: true },
}

const input = buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput()
assert.deepEqual(validateGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput(input), [])

const blockedWithoutGate = await runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease(input, context, {})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(
  blockedWithoutGate.status,
  'blocked_missing_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_confirmation',
)
assert.equal(blockedWithoutGate.safety.localMockWorkerLeaseClaim, false)
assert.equal(blockedWithoutGate.safety.workerDispatch, false)
assert.equal(blockedWithoutGate.safety.workerExecution, false)

const completed = await runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease(input, context, {
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]: 'true',
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_persisted_job_worker_claim_lease_boundary')
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION)
assert.equal(completed.sanitizedClaimLease.workerLeaseClaim, 'completed_local_mock_claim_only')
assert.equal(completed.safety.localMockWorkerLeaseClaim, 'completed')
assert.equal(completed.safety.remoteWorkerClaim, false)
assert.equal(completed.safety.workerDispatch, false)
assert.equal(completed.safety.workerExecution, false)
assert.equal(completed.safety.gstreamerExecution, false)
assert.equal(completed.safety.mkvtoolnixExecution, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)

const unsafe = await runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease(
  buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-unsafe',
    workerExecutionRequestedNow: true,
  }),
  context,
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_request'))

const remoteBlocked = await runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease(
  buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-remote-blocked',
  }),
  {
    ...context,
    clients: { admin: {} as ServiceContext['clients']['admin'], public: null },
    env: { ...runtimeEnv, mockOnly: false, hasSupabaseAdmin: true },
  },
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(remoteBlocked.ok, false)
assert.ok(remoteBlocked.blockers.includes('blocked_remote_worker_claim_requires_separate_owner_confirmation'))

process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV] = 'true'
const app = createReeditProApiApp(runtimeEnv)
const server = app.listen(0)
try {
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const routeInput = buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-route-smoke',
    persistedInvocationId: 'persisted-runtime-invocation-gstreamer-mkvtoolnix-generated-fixture-route-smoke',
    workerInstanceId: 'local-gstreamer-mkvtoolnix-generated-fixture-worker-route-smoke',
  })
  const response = await fetch(`http://127.0.0.1:${address.port}${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH}`, {
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
  assert.equal(body.data?.result?.status, 'completed_persisted_job_worker_claim_lease_boundary')
  assert.equal(body.data?.result?.safety?.workerDispatch, false)
  assert.equal(body.data?.result?.safety?.workerExecution, false)
} finally {
  delete process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

const boundary = summarizeGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseBoundary()
assert.ok(boundary.some((line) => line.includes('local/mock worker lease claim')))
assert.ok(boundary.some((line) => line.includes('Blocks remote Supabase worker-claim mutation')))
assert.ok(boundary.some((line) => line.includes('Does not dispatch or execute a worker')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gate_blocks_worker_claim_lease',
    'local_mock_worker_claim_lease_succeeds_without_worker_execution',
    'unsafe_runtime_flags_block',
    'remote_worker_claim_blocks_without_separate_confirmation',
    'express_route_requires_idempotency_and_returns_201',
  ],
  routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
}, null, 2))
