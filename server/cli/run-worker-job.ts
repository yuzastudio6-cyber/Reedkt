import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
})

const jobId = readArg('--job-id') ?? 'job-cli-mock'
const workerType = readArg('--worker-type') ?? 'noop_worker'
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'cli-worker-run',
  auth: { userId: 'local-cli-worker', isMockUser: true },
}

const result = await runWorkerClaimRunner(context, {
  jobId,
  workspaceId: readArg('--workspace-id') ?? 'workspace-cli',
  projectId: readArg('--project-id') ?? 'project-cli',
  jobType: readArg('--job-type') ?? 'other',
  workerType,
  workerInstanceId: readArg('--worker-instance-id') ?? env.workerInstanceId,
  idempotencyKey: readArg('--idempotency-key') ?? `cli-${jobId}-${workerType}`,
  dryRun: process.argv.includes('--dry-run'),
  approvedPlanSnapshotId: readArg('--approved-snapshot-id'),
  creditReservationId: readArg('--credit-reservation-id'),
  payloadJson: {},
})

console.log(JSON.stringify(result, null, 2))
process.exitCode = result.status === 'failed' || result.status === 'blocked' ? 1 : 0

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
