import assert from 'node:assert/strict'

import {
  createInternalBetaJobQueueLocalRuntime,
  type InternalBetaJobQueueLocalRuntimeInput,
} from '../services/internal-beta-job-queue-local-runtime'

function buildInput(overrides: Partial<InternalBetaJobQueueLocalRuntimeInput> = {}): InternalBetaJobQueueLocalRuntimeInput {
  return {
    workspaceId: 'workspace_job_local_smoke_001',
    projectId: 'project_job_local_smoke_001',
    userId: 'user_job_local_smoke_001',
    approvedPlanSnapshotId: 'approved_snapshot_job_local_smoke_001',
    creditReservationId: 'credit_reservation_job_local_smoke_001',
    idempotencyKey: 'idempotency_job_local_smoke_001',
    requestedByUserId: 'user_job_local_smoke_001',
    jobs: [
      { jobType: 'prepare_private_preview_manifest', workerType: 'backend_metadata', priority: 'normal' },
      { jobType: 'render_private_preview_future', workerType: 'remotion_render_worker_future', dependsOnLocalJobIndexes: [0] },
    ],
    metadata: { source: 'internal_beta_job_queue_local_runtime_smoke' },
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof createInternalBetaJobQueueLocalRuntime>) {
  assert.equal(result.localOnly, true)
  assert.equal(result.persistedToSupabase, false)
  assert.equal(result.safety.routeExecution, false)
  assert.equal(result.safety.remoteSupabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.serviceRoleRouteExecution, false)
  assert.equal(result.safety.creditMutation, false)
  assert.equal(result.safety.realCreditMutation, false)
  assert.equal(result.safety.jobEnqueueExecution, false)
  assert.equal(result.safety.jobEventWriteExecution, false)
  assert.equal(result.safety.workerLeaseClaim, false)
  assert.equal(result.safety.workerHeartbeat, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.providerModelCall, false)
  assert.equal(result.safety.rawPromptExecution, false)
  assert.equal(result.safety.renderExportExecution, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.internalBetaUnlock, false)
}

const valid = createInternalBetaJobQueueLocalRuntime(buildInput())
assert.equal(valid.ok, true)
assert.equal(valid.status, 'local_job_queue_metadata_validated_no_worker_execution')
assert.equal(valid.localJobBatchRecordCreated, true)
assert.equal(valid.localJobRecordsCreated, 2)
assert.equal(valid.localJobDependencyRecordsCreated, 1)
assert.equal(valid.localJobEventRecordsCreated, 2)
assert.match(valid.jobQueueHash ?? '', /^[a-f0-9]{64}$/)
assert.match(valid.batch?.id ?? '', /^job_batch_[a-f0-9]{24}$/)
assert.equal(valid.batch?.workerExecution, false)
assert.equal(valid.batch?.workerDispatch, false)
assert.equal(valid.jobs[0].status, 'queued_metadata_only')
assert.equal(valid.jobs[0].workerLeaseClaimed, false)
assert.equal(valid.jobs[0].workerExecution, false)
assert.equal(valid.events[0].jobEventWriteExecution, false)
assertSafety(valid)

const repeated = createInternalBetaJobQueueLocalRuntime(buildInput())
assert.equal(repeated.jobQueueHash, valid.jobQueueHash, 'same job queue basis should hash deterministically')
assert.equal(repeated.batch?.id, valid.batch?.id, 'same job queue basis should create deterministic batch id')
assertSafety(repeated)

const missingReservation = createInternalBetaJobQueueLocalRuntime(buildInput({ creditReservationId: undefined }))
assert.equal(missingReservation.ok, false)
assert.equal(missingReservation.status, 'blocked_invalid_job_queue_input')
assert.ok(missingReservation.validation.errors.some((error) => error.includes('creditReservationId')))
assertSafety(missingReservation)

const selfDependency = createInternalBetaJobQueueLocalRuntime(
  buildInput({ jobs: [{ jobType: 'invalid', workerType: 'none', dependsOnLocalJobIndexes: [0] }] }),
)
assert.equal(selfDependency.ok, false)
assert.ok(selfDependency.validation.errors.some((error) => error.includes('must not depend on itself')))
assertSafety(selfDependency)

const rawPrompt = createInternalBetaJobQueueLocalRuntime(
  buildInput({ jobs: [{ jobType: 'unsafe', workerType: 'none', payload: { rawPrompt: 'run the worker now' } }] }),
)
assert.equal(rawPrompt.ok, false)
assert.ok(rawPrompt.validation.errors.some((error) => error.includes('raw prompt')))
assertSafety(rawPrompt)

const signedUrl = createInternalBetaJobQueueLocalRuntime(
  buildInput({ metadata: { signedUrl: 'https://example.test/private.mp4?signature=abc' } }),
)
assert.equal(signedUrl.ok, false)
assert.ok(signedUrl.validation.errors.some((error) => error.includes('signed/public URL')))
assertSafety(signedUrl)

console.log('internal-beta-job-queue-local-runtime-smoke passed')
