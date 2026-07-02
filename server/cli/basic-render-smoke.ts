import { loadRuntimeEnv } from '../config/env'
import { checkBasicRenderSmokeTools, createSkippedBasicRenderSmokeResult } from '../services/render-smoke-service'
import type { ServiceContext } from '../types'
import { createBasicRenderSmokeFixture } from '../workers/jobs/basic-render-smoke-fixtures'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'

const strict = process.argv.includes('--strict') ||
  process.env.STRICT_RENDER_SMOKE === 'true' ||
  process.env.STRICT_RENDER_SMOKE === '1'

const env = loadRuntimeEnv({
  ...process.env,
  API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'local',
  WORKER_RUNTIME_MODE: process.env.WORKER_RUNTIME_MODE ?? 'local',
  STORAGE_MODE: process.env.STORAGE_MODE ?? 'local',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'cli-basic-render-smoke',
  auth: { userId: 'local-render-smoke-worker', isMockUser: true },
}

const tools = await checkBasicRenderSmokeTools(context)
if (!tools.ready) {
  const skipped = createSkippedBasicRenderSmokeResult({
    workspaceId: 'workspace-render-smoke',
    projectId: 'project-render-smoke',
    renderJobId: 'render_job_smoke_skipped',
    sourceStorageObjectId: 'storage_object_smoke_skipped',
    approvedPlanSnapshotId: 'approved_snapshot_smoke_skipped',
    creditReservationId: 'credit_reservation_smoke_skipped',
    strict,
  }, tools.warnings)
  console.log(JSON.stringify({
    ...skipped,
    strictRenderSmoke: strict,
    message: strict
      ? 'STRICT_RENDER_SMOKE blocked basic render smoke because FFmpeg/FFprobe are unavailable.'
      : 'Basic render smoke skipped because FFmpeg/FFprobe are unavailable.',
  }, null, 2))
  if (strict) process.exitCode = 1
} else {
  const fixture = await createBasicRenderSmokeFixture(context)
  if (fixture.warnings.length > 0 || !fixture.request.sourceStorageObject) {
    const skipped = createSkippedBasicRenderSmokeResult(fixture.request, fixture.warnings)
    console.log(JSON.stringify({
      ...skipped,
      strictRenderSmoke: strict,
      message: 'Basic render smoke fixture could not be generated.',
    }, null, 2))
    if (strict) process.exitCode = 1
  } else {
    const result = await runWorkerClaimRunner(context, {
      jobId: fixture.jobId,
      workspaceId: fixture.request.workspaceId,
      projectId: fixture.request.projectId,
      jobType: 'basic_render_smoke',
      workerType: 'basic_render_smoke_worker',
      workerInstanceId: env.workerInstanceId,
      idempotencyKey: fixture.idempotencyKey,
      approvedPlanSnapshotId: fixture.request.approvedPlanSnapshotId,
      creditReservationId: fixture.request.creditReservationId,
      storageObjectRecordId: fixture.request.sourceStorageObjectId,
      payloadJson: {
        sourceStorageObjectId: fixture.request.sourceStorageObjectId,
        storageObjectRecordId: fixture.request.sourceStorageObjectId,
        sourceStorageObject: fixture.request.sourceStorageObject,
      },
    })

    console.log(JSON.stringify({
      ok: result.status === 'completed',
      strictRenderSmoke: strict,
      workerResult: result,
      renderSmoke: result.output,
      warnings: fixture.warnings,
    }, null, 2))

    if (result.status !== 'completed') process.exitCode = 1
  }
}
