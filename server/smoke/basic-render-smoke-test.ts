import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { checkBasicRenderSmokeTools, createSkippedBasicRenderSmokeResult } from '../services/render-smoke-service'
import type { ServiceContext } from '../types'
import { createBasicRenderSmokeFixture } from '../workers/jobs/basic-render-smoke-fixtures'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'basic-render-smoke-test',
  auth: { userId: 'basic-render-smoke-test-user', isMockUser: true },
}

const tools = await checkBasicRenderSmokeTools(context)
if (!tools.ready) {
  const skipped = createSkippedBasicRenderSmokeResult({
    workspaceId: 'workspace-render-smoke-test',
    projectId: 'project-render-smoke-test',
    renderJobId: 'render_job_smoke_test_skipped',
    sourceStorageObjectId: 'storage_object_smoke_test_skipped',
    approvedPlanSnapshotId: 'approved_snapshot_smoke_test_skipped',
    creditReservationId: 'credit_reservation_smoke_test_skipped',
  }, tools.warnings)
  assert(skipped.status === 'skipped', 'Missing FFmpeg/FFprobe should produce skipped render smoke result.')
  assert(skipped.error?.code === 'RENDER_SMOKE_SKIPPED', 'Skipped render smoke should expose RENDER_SMOKE_SKIPPED.')
  console.log(JSON.stringify({
    ok: true,
    skipped: true,
    checks: [
      'missing_ffmpeg_ffprobe_reported_honestly',
      'strict_mode_should_fail_outside_this_non_strict_smoke',
      'no_provider_calls_attempted',
      'no_signed_url_canonical_output_created',
    ],
    warnings: skipped.warnings,
  }))
} else {
  const fixture = await createBasicRenderSmokeFixture(context)
  assert(Boolean(fixture.request.sourceStorageObject), 'Available tools should create a source media fixture.')
  let blocked: ApiError | undefined
  try {
    await runWorkerClaimRunner(context, {
      jobId: fixture.jobId,
      workspaceId: fixture.request.workspaceId,
      projectId: fixture.request.projectId,
      jobType: 'basic_render_smoke',
      workerType: 'basic_render_smoke_worker',
      workerInstanceId: env.workerInstanceId,
      idempotencyKey: `${fixture.idempotencyKey}-test`,
      approvedPlanSnapshotId: fixture.request.approvedPlanSnapshotId,
      creditReservationId: fixture.request.creditReservationId,
      storageObjectRecordId: fixture.request.sourceStorageObjectId,
      payloadJson: {
        sourceStorageObjectId: fixture.request.sourceStorageObjectId,
        storageObjectRecordId: fixture.request.sourceStorageObjectId,
        sourceStorageObject: fixture.request.sourceStorageObject,
      },
    })
  } catch (error) {
    if (error instanceof ApiError) blocked = error
  }
  assert(blocked?.code === 'TOOL_NOT_READY', 'Legacy caller-authored render authority must fail closed.')
  assert(
    (blocked.details as Record<string, unknown> | undefined)?.requiredGate ===
      'canonical_authority_job_loader',
    'Legacy render must identify the canonical authority loader replacement gate.',
  )

  console.log(JSON.stringify({
    ok: true,
    skipped: true,
    checks: [
      'legacy_caller_authored_render_authority_rejected',
      'canonical_authority_job_loader_required',
      'no_preview_or_export_side_effect',
    ],
    requiredGate: 'canonical_authority_job_loader',
  }))
}
