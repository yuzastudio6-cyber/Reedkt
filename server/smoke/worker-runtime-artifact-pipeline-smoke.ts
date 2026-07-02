import assert from 'node:assert/strict'

import { createToolExecutionGatewayService } from '../services/tool-execution-gateway-service'
import type { ServiceContext } from '../types'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import {
  clearMockWorkerRuntimeArtifactPipelineState,
  recordWorkerRuntimeArtifactPipeline,
} from '../workers/production/production-worker-artifact-pipeline'
import { createProductionWorkerResult } from '../workers/production/production-worker-result-writer'
import type { ProductionWorkerJobPayload } from '../workers/production/production-worker-types'
import type { ToolExecutionGatewayDispatchBody } from '../validation/tool-execution-gateway-schemas'

const context: ServiceContext = {
  env: {
    mockOnly: true,
    allowMockWithoutSupabase: true,
  } as never,
  clients: {
    admin: null,
    public: null,
  },
  requestId: 'worker-runtime-artifact-pipeline-smoke',
  auth: {
    userId: 'user-worker-runtime-smoke',
    email: 'worker-runtime-smoke@reeditpro.local',
    isMockUser: true,
  },
}

clearMockWorkerRuntimeArtifactPipelineState()

const service = createToolExecutionGatewayService(context)

const baseInput: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } = {
  workspaceId: 'workspace-runtime',
  projectId: 'project-runtime',
  jobId: 'job-runtime-ffprobe',
  toolExecutionPlanId: 'plan-runtime-ffprobe',
  editPlanId: 'edit-plan-runtime',
  mediaAssetId: 'media-runtime',
  approvedPlanSnapshotId: 'approved-snapshot-runtime',
  creditEstimateId: 'credit-estimate-runtime',
  creditReservationId: 'credit-reservation-runtime',
  approvedReservationRemainingCredits: 50,
  estimatedHighCredits: 4,
  workerType: 'cpu_analysis_worker',
  executionMode: 'mock_safe',
  adapterId: 'cpu_analysis_worker_placeholder',
  trackBAdapterToolId: 'ffprobe',
  trackBAdapterExecutionMode: 'bounded_execution',
  requestedToolIds: ['ffprobe'],
  requestedRecipeIds: ['ffprobe-private-probe-recipe'],
  artifactReferences: [{
    id: 'artifact-runtime-source',
    storageBucketPurpose: 'source_media',
    storageObjectPath: 'workspaces/workspace-runtime/projects/project-runtime/source/source-media.mp4',
    isPrivate: true,
    sourceOfTruth: true,
  }],
  attempt: 1,
  maxAttempts: 2,
  metadata: {
    workerRuntimeSmoke: true,
  },
  apiIdempotencyKey: 'api-idempotency-runtime-ffprobe',
}

const firstDispatch = await service.dispatchApprovedToolCall(baseInput)
assert.equal(firstDispatch.gateway.status, 'dispatched', 'first gateway dispatch should succeed')
assert.equal(firstDispatch.workerResult?.status, 'completed', 'placeholder worker should complete')
assert.equal(firstDispatch.workerRuntimeArtifactPipeline?.replayed, false, 'first dispatch should create a new runtime artifact record')
assert.equal(firstDispatch.workerRuntimeArtifactPipeline?.job.status, 'completed', 'runtime job should be completed')
assert.equal(firstDispatch.workerRuntimeArtifactPipeline?.job.lease.leaseStatus, 'released', 'runtime job lease should be released after completion')
assert.ok(firstDispatch.workerRuntimeArtifactPipeline?.job.workerIdempotencyKey.startsWith('prod-worker:'), 'runtime job should keep worker idempotency key')
assert.ok((firstDispatch.workerRuntimeArtifactPipeline?.outputManifest.length ?? 0) > 0, 'runtime pipeline should expose private output artifacts')

const firstArtifacts = firstDispatch.workerRuntimeArtifactPipeline?.outputManifest ?? []
assert.ok(firstArtifacts.every((artifact) => artifact.isPrivate), 'all output artifacts should be private')
assert.ok(firstArtifacts.every((artifact) => artifact.sourceOfTruth), 'all output artifacts should be source-of-truth refs')
assert.ok(firstArtifacts.every((artifact) => artifact.storageObjectPath.startsWith('workspaces/workspace-runtime/projects/project-runtime/')), 'output refs should stay scoped to the project')
assert.ok(firstArtifacts.every((artifact) => !artifact.storageObjectPath.startsWith('http')), 'output refs must not be signed/raw URLs')

const manifestAfterFirst = await service.getProjectToolOutputManifest({
  workspaceId: 'workspace-runtime',
  projectId: 'project-runtime',
})
assert.equal(
  manifestAfterFirst.outputManifest.artifactRecords.length,
  firstArtifacts.length,
  'editor-readable project manifest should include first dispatch outputs',
)

const replayDispatch = await service.dispatchApprovedToolCall(baseInput)
assert.equal(replayDispatch.gateway.status, 'dispatched', 'duplicate dispatch should replay successfully')
assert.equal(replayDispatch.workerRuntimeArtifactPipeline?.replayed, true, 'duplicate dispatch should be marked as replayed')
assert.equal(
  replayDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords.length,
  firstArtifacts.length,
  'idempotent replay must not duplicate output artifacts',
)

const secondTool = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-runtime-opencv',
  toolExecutionPlanId: 'plan-runtime-opencv',
  trackBAdapterToolId: 'opencv',
  requestedToolIds: ['opencv'],
  requestedRecipeIds: ['opencv-visual-analysis-recipe'],
  artifactReferences: [{
    id: 'artifact-runtime-frame',
    storageBucketPurpose: 'analysis_artifacts',
    storageObjectPath: 'workspaces/workspace-runtime/projects/project-runtime/analysis/frame-001.png',
    isPrivate: true,
    sourceOfTruth: true,
  }],
  apiIdempotencyKey: 'api-idempotency-runtime-opencv',
})
assert.equal(secondTool.gateway.status, 'dispatched', 'second tool dispatch should succeed')
assert.ok(
  (secondTool.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords.length ?? 0) > firstArtifacts.length,
  'merged project manifest should grow when a different tool produces outputs',
)

const signedUrl = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-runtime-signed-url',
  toolExecutionPlanId: 'plan-runtime-signed-url',
  artifactReferences: [{
    ...baseInput.artifactReferences[0],
    storageObjectPath: 'https://storage.example.com/source.mp4?X-Goog-Signature=abc',
  }],
  apiIdempotencyKey: 'api-idempotency-runtime-signed-url',
})
assert.equal(signedUrl.gateway.status, 'blocked', 'signed URL source truth should block before worker creation')
assert.equal(signedUrl.workerRuntimeArtifactPipeline, undefined, 'blocked signed URL dispatch should not create runtime artifacts')
assert.ok(
  signedUrl.gateway.blockers.some((blocker) => blocker.gateName === 'artifact_privacy' || blocker.gateName === 'trackb_adapter_pack'),
  'signed URL dispatch should identify artifact privacy or adapter pack blockers',
)

const failedPayload: ProductionWorkerJobPayload = {
  jobId: 'job-runtime-transient-failure',
  workspaceId: 'workspace-runtime',
  projectId: 'project-runtime',
  mediaAssetId: 'media-runtime',
  approvedSnapshotId: 'approved-snapshot-runtime',
  editPlanId: 'edit-plan-runtime',
  toolExecutionPlanId: 'plan-runtime-transient-failure',
  workerType: 'cpu_analysis_worker',
  executionMode: 'mock_safe',
  idempotencyKey: 'pending',
  attempt: 1,
  maxAttempts: 3,
  requestedToolIds: ['ffprobe'],
  requestedRecipeIds: ['ffprobe-private-probe-recipe'],
  storageReferenceIds: ['artifact-runtime-source'],
  creditReservationId: 'credit-reservation-runtime',
  createdAt: new Date().toISOString(),
}
failedPayload.idempotencyKey = buildWorkerIdempotencyKey(failedPayload)

const failedWorkerResult = createProductionWorkerResult({
  payload: failedPayload,
  status: 'failed',
  gateChecks: [],
  events: [],
  warnings: ['simulated transient failure'],
  error: {
    code: 'SIMULATED_TRANSIENT_FAILURE',
    message: 'Simulated transient runtime failure for retry-policy smoke.',
    failureCategory: 'transient_runtime',
  },
})
const failedPipeline = recordWorkerRuntimeArtifactPipeline({
  payload: failedPayload,
  workerResult: failedWorkerResult,
  apiIdempotencyKey: 'api-idempotency-transient-failure',
})
assert.equal(failedPipeline.job.status, 'failed', 'failed worker result should create failed runtime job')
assert.equal(failedPipeline.job.failureCategory, 'transient_runtime', 'failure category should be recorded')
assert.equal(failedPipeline.job.retryDecision.shouldRetry, true, 'transient runtime failure should be retryable before max attempts')
assert.equal(failedPipeline.job.retryDecision.nextAttempt, 2, 'retry policy should point to the next attempt')

console.log(JSON.stringify({
  ok: true,
  route: 'POST /v1/tool-executions/dispatch',
  manifestRoute: 'GET /v1/projects/:projectId/tool-output-manifest',
  createdJobs: [
    firstDispatch.workerRuntimeArtifactPipeline?.job.jobId,
    secondTool.workerRuntimeArtifactPipeline?.job.jobId,
    failedPipeline.job.jobId,
  ],
  firstOutputCount: firstArtifacts.length,
  mergedOutputCount: secondTool.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords.length,
  replayed: replayDispatch.workerRuntimeArtifactPipeline?.replayed,
  retryCategory: failedPipeline.job.failureCategory,
  realToolExecution: false,
}, null, 2))
