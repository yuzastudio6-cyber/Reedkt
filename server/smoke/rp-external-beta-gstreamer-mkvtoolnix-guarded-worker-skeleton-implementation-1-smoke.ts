import assert from 'node:assert/strict'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { buildGstreamerMkvtoolnixGuardedWorkerRouteRequest } from '../../src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-route-contracts'
import {
  buildGstreamerMkvtoolnixGuardedWorkerEnqueueInput,
  enqueueGstreamerMkvtoolnixGuardedWorkerMock,
} from '../../src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-enqueue-contracts'
import {
  buildGstreamerMkvtoolnixGuardedWorkerSkeletonInput,
  summarizeGstreamerMkvtoolnixGuardedWorkerSkeletonBoundary,
  validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput,
} from '../../src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-skeleton-contracts'

const createdAt = new Date('2026-06-30T16:20:00.000Z').toISOString()
const routeRequest = buildGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  createdAt,
  workspaceId: 'workspace-gstreamer-mkvtoolnix-skeleton-smoke',
  projectId: 'project-gstreamer-mkvtoolnix-skeleton-smoke',
  approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-skeleton-smoke',
  jobId: 'job-gstreamer-mkvtoolnix-skeleton-smoke',
  commandTemplateId: 'gst_controlled_generated_fixture_pipeline_v1',
})
const enqueueInput = buildGstreamerMkvtoolnixGuardedWorkerEnqueueInput({ routeRequest, createdAt })
const enqueueResult = enqueueGstreamerMkvtoolnixGuardedWorkerMock(createMockDatabase(), enqueueInput)

assert.equal(enqueueResult.ok, true, enqueueResult.sanitizedSummary)
assert.equal(enqueueResult.enqueueStatus, 'queued_mock_contract_only')

const skeletonInput = buildGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  enqueueResult,
  createdAt,
})
const skeleton = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput(skeletonInput)

assert.equal(skeleton.ok, true, skeleton.sanitizedSummary)
assert.equal(skeleton.skeletonStatus, 'registered_disabled_worker_skeleton_metadata_only')
assert.equal(skeleton.skeletonId, 'worker.gstreamerMkvtoolnix.guarded.disabledSkeleton')
assert.equal(skeleton.sanitizedPayload.queueStatus, 'queued')
assert.equal(skeleton.sanitizedPayload.workerKind, 'render_export')
assert.equal(skeleton.sanitizedPayload.workerSkeletonEnabled, false)
assert.equal(skeleton.sanitizedPayload.routeExecution, false)
assert.equal(skeleton.sanitizedPayload.workerDispatchAttempted, false)
assert.equal(skeleton.sanitizedPayload.workerExecution, false)
assert.equal(skeleton.sanitizedPayload.gstreamerExecution, false)
assert.equal(skeleton.sanitizedPayload.mkvtoolnixExecution, false)
assert.equal(skeleton.sanitizedPayload.ffmpegFfprobeExecution, false)
assert.equal(skeleton.sanitizedPayload.dockerExecution, false)
assert.equal(skeleton.sanitizedPayload.remotionExecution, false)
assert.equal(skeleton.sanitizedPayload.mediaProcessing, false)
assert.equal(skeleton.sanitizedPayload.signedUrlCreation, false)
assert.equal(skeleton.sanitizedPayload.publicArtifactCreation, false)
assert.equal(skeleton.sanitizedPayload.finalRenderExport, false)
assert.equal(skeleton.sanitizedPayload.routeIdempotencyKey, routeRequest.routeIdempotencyKey)
assert.equal(skeleton.sanitizedPayload.commandTemplateId, 'gst_controlled_generated_fixture_pipeline_v1')
assert.equal(
  skeleton.nextRequiredGate,
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1',
)

const dispatchAttempt = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  ...skeletonInput,
  workerDispatchAttempted: true,
} as unknown as typeof skeletonInput)
assert.equal(dispatchAttempt.ok, false)
assert.ok(dispatchAttempt.blockers.includes('blocked_worker_dispatch_not_enabled'))

const workerExecutionAttempt = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  ...skeletonInput,
  workerExecution: true,
} as unknown as typeof skeletonInput)
assert.equal(workerExecutionAttempt.ok, false)
assert.ok(workerExecutionAttempt.blockers.includes('blocked_worker_execution_not_enabled'))

const toolExecutionAttempt = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  ...skeletonInput,
  gstreamerExecution: true,
} as unknown as typeof skeletonInput)
assert.equal(toolExecutionAttempt.ok, false)
assert.ok(toolExecutionAttempt.blockers.includes('blocked_tool_execution_not_enabled'))

const rawInputAttempt = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  ...skeletonInput,
  rawChatAllowed: true,
} as unknown as typeof skeletonInput)
assert.equal(rawInputAttempt.ok, false)
assert.ok(rawInputAttempt.blockers.includes('blocked_raw_or_unapproved_input_attempt'))

const mutatedQueue = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  ...skeletonInput,
  enqueueResult: {
    ...enqueueResult,
    queueItem: {
      ...enqueueResult.queueItem!,
      queueStatus: 'running',
    },
  },
})
assert.equal(mutatedQueue.ok, false)
assert.ok(mutatedQueue.blockers.includes('blocked_queue_item_not_queued'))

const publicArtifactAttempt = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  ...skeletonInput,
  publicArtifactCreation: true,
} as unknown as typeof skeletonInput)
assert.equal(publicArtifactAttempt.ok, false)
assert.ok(publicArtifactAttempt.blockers.includes('blocked_public_or_signed_artifact_attempt'))

const deliveryAttempt = validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput({
  ...skeletonInput,
  finalRenderExport: true,
} as unknown as typeof skeletonInput)
assert.equal(deliveryAttempt.ok, false)
assert.ok(deliveryAttempt.blockers.includes('blocked_delivery_or_unlock_attempt'))

const boundary = summarizeGstreamerMkvtoolnixGuardedWorkerSkeletonBoundary()
assert.ok(boundary.some((line) => line.includes('mock queue metadata')))
assert.ok(boundary.some((line) => line.includes('registered disabled')))
assert.ok(boundary.some((line) => line.includes('bounded confirmed runtime execution plan')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'skeleton_input_validates',
    'skeleton_registered_disabled_metadata_only',
    'queue_payload_sanitized_refs_only',
    'dispatch_execution_tool_attempts_block',
    'raw_or_unapproved_input_attempts_block',
    'non_queued_item_blocks',
    'public_artifact_and_delivery_attempts_block',
    'no_route_worker_gstreamer_mkvtoolnix_ffmpeg_ffprobe_docker_remotion_media_supabase_sql_or_unlock_execution_enabled',
  ],
  skeletonStatus: skeleton.skeletonStatus,
  nextRequiredGate: skeleton.nextRequiredGate,
}, null, 2))
