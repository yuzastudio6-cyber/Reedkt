import { loadRuntimeEnv } from '../config/env'
import type { ServiceContext } from '../types'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  STORAGE_MODE: process.env.STORAGE_MODE ?? 'local',
})

const jobId = readArg('--job-id') ?? 'job-probe-cli'
const storageObjectRecordId = readArg('--storage-object-id')
const mediaAssetId = readArg('--media-asset-id')
const bucketName = readArg('--bucket-name')
const objectPath = readArg('--object-path')

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'cli-media-probe',
  auth: { userId: 'local-cli-worker', isMockUser: true },
}

const result = await runWorkerClaimRunner(context, {
  jobId,
  workspaceId: readArg('--workspace-id') ?? 'workspace-cli',
  projectId: readArg('--project-id') ?? 'project-cli',
  jobType: 'media_analysis',
  workerType: 'media_probe_worker',
  workerInstanceId: readArg('--worker-instance-id') ?? env.workerInstanceId,
  idempotencyKey: readArg('--idempotency-key') ?? `cli-probe-${jobId}`,
  mediaAssetId,
  storageObjectRecordId,
  payloadJson: bucketName && objectPath ? { bucketName, objectPath, mediaAssetId, storageObjectRecordId } : {},
})

console.log(JSON.stringify(result, null, 2))
process.exitCode = result.status === 'failed' || result.status === 'blocked' ? 1 : 0

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
