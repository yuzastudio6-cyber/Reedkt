import assert from 'node:assert/strict'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_CONFIRM_ENV,
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

const remoteModeMissingGate = await runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease(
  buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-remote-missing-gate',
    claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution',
    remoteWorkerClaimLeaseConfirmed: true,
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
assert.equal(remoteModeMissingGate.ok, false)
assert.ok(
  remoteModeMissingGate.blockers.includes('blocked_missing_gstreamer_mkvtoolnix_remote_worker_claim_lease_confirmation'),
)

const remoteClaim = {
  id: 'worker_claim_remote_stub',
  workspace_id: input.workspaceId,
  project_id: input.projectId,
  job_id: 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-remote-stub',
  worker_type: 'gstreamer_mkvtoolnix_generated_fixture_worker',
  worker_instance_id: 'remote-gstreamer-mkvtoolnix-generated-fixture-worker-stub',
  claim_status: 'active',
}
const adminStub = {
  rpc: async () => ({ data: true, error: null }),
  from: () => ({
    insert: () => ({
      select: () => ({
        single: async () => ({ data: remoteClaim, error: null }),
      }),
    }),
  }),
} as unknown as ServiceContext['clients']['admin']

const remoteCompleted = await runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease(
  buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput({
    persistedJobId: remoteClaim.job_id,
    persistedInvocationId: 'persisted-runtime-invocation-gstreamer-mkvtoolnix-generated-fixture-remote-stub',
    workerInstanceId: remoteClaim.worker_instance_id,
    claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution',
    remoteWorkerClaimLeaseConfirmed: true,
  }),
  {
    ...context,
    clients: { admin: adminStub, public: null },
    env: { ...runtimeEnv, mockOnly: false, hasSupabaseAdmin: true },
  },
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV]: 'true',
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(remoteCompleted.ok, true)
assert.equal(remoteCompleted.sanitizedClaimLease.workerLeaseClaim, 'completed_remote_worker_claim_only')
assert.equal(remoteCompleted.safety.localMockWorkerLeaseClaim, false)
assert.equal(remoteCompleted.safety.remoteWorkerClaim, 'completed')
assert.equal(remoteCompleted.safety.supabaseMutation, 'worker_claim_lease_only')
assert.equal(remoteCompleted.safety.workerDispatch, false)
assert.equal(remoteCompleted.safety.workerExecution, false)
assert.equal(remoteCompleted.safety.gstreamerExecution, false)
assert.equal(remoteCompleted.safety.mkvtoolnixExecution, false)
assert.equal(remoteCompleted.safety.sqlExecution, false)

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
assert.ok(boundary.some((line) => line.includes('Remote Supabase worker-claim mutation is limited')))
assert.ok(boundary.some((line) => line.includes('Does not dispatch or execute a worker')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gate_blocks_worker_claim_lease',
    'local_mock_worker_claim_lease_succeeds_without_worker_execution',
    'unsafe_runtime_flags_block',
    'remote_worker_claim_blocks_without_separate_confirmation',
    'remote_worker_claim_requires_second_confirmation_gate',
    'remote_worker_claim_stub_succeeds_without_worker_execution',
    'express_route_requires_idempotency_and_returns_201',
  ],
  routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
}, null, 2))
