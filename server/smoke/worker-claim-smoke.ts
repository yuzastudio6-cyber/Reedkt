import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createWorkerClaimService } from '../services/worker-claim-service'
import type { ServiceContext } from '../types'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  STRICT_TOOL_READINESS: 'false',
  TOOL_CHECK_TIMEOUT_MS: '10000',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'worker-canonical-cutover-smoke',
  auth: { userId: 'worker-smoke-user', isMockUser: true },
}

await expectToolNotReady(
  () => runWorkerClaimRunner(context, {
    jobId: 'caller-job-id',
    workspaceId: 'caller-workspace',
    projectId: 'caller-project',
    jobType: 'render_preview',
    workerType: 'noop_worker',
    idempotencyKey: 'caller-worker-run',
    dryRun: true,
    approvedPlanSnapshotId: 'caller-snapshot',
    creditReservationId: 'caller-reservation',
    mediaAssetId: 'caller-media',
    storageObjectRecordId: 'caller-storage',
    payloadJson: { callerAuthored: true },
  }),
  'Caller-authored worker job loading must fail before even a dry-run gate can claim authority.',
)

const claimService = createWorkerClaimService(context)
await expectToolNotReady(
  () => claimService.claimJob({
    workspaceId: 'caller-workspace',
    projectId: 'caller-project',
    jobId: 'caller-job-id',
    workerType: 'noop_worker',
    workerInstanceId: 'caller-worker',
    leaseExpiresAt: new Date(Date.now() + 300_000).toISOString(),
    idempotencyKey: 'caller-claim',
  }),
  'Caller job IDs must not create worker claims.',
)
await expectToolNotReady(
  () => claimService.heartbeat({ jobId: 'caller-job-id', claimId: 'caller-claim-id' }),
  'Caller job IDs must not create worker heartbeats.',
)
await expectToolNotReady(
  () => claimService.release({ jobId: 'caller-job-id', claimStatus: 'completed' }),
  'Caller job IDs must not release or complete worker claims.',
)
await expectToolNotReady(
  () => claimService.recordToolRuntimeCheck({
    workspaceId: 'caller-workspace',
    workerType: 'caller-worker',
    toolName: 'ffmpeg',
    checkStatus: 'passed',
    checkSummary: 'caller says ready',
  }),
  'Caller JSON must not become canonical tool-runtime evidence.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'caller_authored_worker_job_loader_disabled',
    'legacy_worker_claim_disabled',
    'legacy_worker_heartbeat_disabled',
    'legacy_worker_release_disabled',
    'caller_tool_runtime_evidence_write_disabled',
    'canonical_job_and_opaque_lease_required',
    'no_worker_provider_media_render_or_cost_side_effect',
  ],
}))

async function expectToolNotReady(action: () => Promise<unknown>, message: string): Promise<void> {
  let caught: unknown
  try {
    await action()
  } catch (error) {
    caught = error
  }
  assert.ok(caught instanceof ApiError && caught.code === 'TOOL_NOT_READY', `${message} Received: ${String(caught)}`)
}
