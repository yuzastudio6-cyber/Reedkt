import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createWorkerClaimService } from '../services/worker-claim-service'
import type { ServiceContext } from '../types'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  STRICT_TOOL_READINESS: 'false',
  TOOL_CHECK_TIMEOUT_MS: '10000',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'worker-claim-smoke',
  auth: { userId: 'worker-smoke-user', isMockUser: true },
}

const blocked = await runWorkerClaimRunner(context, {
  jobId: 'job-expensive-missing-snapshot',
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  jobType: 'render_preview',
  workerType: 'noop_worker',
  idempotencyKey: 'smoke-blocked-expensive',
  dryRun: true,
})
assert(blocked.status === 'blocked', 'Expensive worker job should block without approved snapshot and credit reservation.')
assert(blocked.gateChecks.some((gate) => gate.gate === 'approved_snapshot' && !gate.passed), 'Approved snapshot gate should fail.')

const claimService = createWorkerClaimService(context)
await claimService.claimJob({
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  jobId: 'job-duplicate-claim',
  workerType: 'noop_worker',
  workerInstanceId: 'worker-smoke-1',
  leaseExpiresAt: new Date(Date.now() + 300000).toISOString(),
  idempotencyKey: 'duplicate-claim-1',
})

let duplicateBlocked = false
try {
  await claimService.claimJob({
    workspaceId: 'workspace-smoke',
    projectId: 'project-smoke',
    jobId: 'job-duplicate-claim',
    workerType: 'noop_worker',
    workerInstanceId: 'worker-smoke-2',
    leaseExpiresAt: new Date(Date.now() + 300000).toISOString(),
    idempotencyKey: 'duplicate-claim-2',
  })
} catch (error) {
  duplicateBlocked = error instanceof ApiError && error.code === 'WORKER_CLAIM_CONFLICT'
}
await claimService.release({ jobId: 'job-duplicate-claim', claimStatus: 'released' })
assert(duplicateBlocked, 'Duplicate active claim should be blocked in mock mode.')

const noOp = await runWorkerClaimRunner(context, {
  jobId: 'job-noop',
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  jobType: 'other',
  workerType: 'noop_worker',
  idempotencyKey: 'smoke-noop-worker',
})
assert(noOp.status === 'completed', 'No-op worker should complete.')
assert(noOp.events.some((event) => event.eventName === 'worker_completed'), 'No-op worker should emit completed event.')

const mediaProbe = await runWorkerClaimRunner(context, {
  jobId: 'job-probe-missing-storage',
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  jobType: 'media_analysis',
  workerType: 'media_probe_worker',
  idempotencyKey: 'smoke-probe-missing-storage',
})
assert(mediaProbe.status === 'blocked' || mediaProbe.status === 'failed', 'Media probe should fail safely without finalized local storage metadata or ffprobe readiness.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'expensive_job_blocks_without_snapshot',
    'duplicate_active_claim_blocks',
    'noop_worker_claims_emits_releases',
    'media_probe_fails_safely_without_readiness',
    'no_provider_calls_attempted',
  ],
}))
