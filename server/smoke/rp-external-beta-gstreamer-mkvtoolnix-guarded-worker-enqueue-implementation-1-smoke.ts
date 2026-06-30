import assert from 'node:assert/strict'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { buildGstreamerMkvtoolnixGuardedWorkerRouteRequest } from '../../src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-route-contracts'
import {
  buildGstreamerMkvtoolnixGuardedWorkerEnqueueInput,
  enqueueGstreamerMkvtoolnixGuardedWorkerMock,
  summarizeGstreamerMkvtoolnixGuardedWorkerEnqueueBoundary,
  validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput,
} from '../../src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-enqueue-contracts'

const createdAt = new Date('2026-06-30T15:45:00.000Z').toISOString()
const routeRequest = buildGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  createdAt,
  workspaceId: 'workspace-gstreamer-mkvtoolnix-enqueue-smoke',
  projectId: 'project-gstreamer-mkvtoolnix-enqueue-smoke',
  approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-enqueue-smoke',
  jobId: 'job-gstreamer-mkvtoolnix-enqueue-smoke',
  commandTemplateId: 'gst_controlled_generated_fixture_pipeline_v1',
})
const enqueueInput = buildGstreamerMkvtoolnixGuardedWorkerEnqueueInput({ routeRequest, createdAt })

const validation = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput(enqueueInput)
assert.equal(validation.ok, true, validation.sanitizedSummary)
assert.equal(validation.enqueueStatus, 'queued_mock_contract_only')
assert.deepEqual(validation.blockers, [])
assert.equal(validation.sanitizedPayload.routeExecution, false)
assert.equal(validation.sanitizedPayload.workerDispatchAttempted, false)
assert.equal(validation.sanitizedPayload.workerExecution, false)
assert.equal(validation.sanitizedPayload.gstreamerExecution, false)
assert.equal(validation.sanitizedPayload.mkvtoolnixExecution, false)
assert.equal(validation.sanitizedPayload.mediaProcessing, false)
assert.equal(validation.sanitizedPayload.publicArtifactCreation, false)
assert.equal(validation.sanitizedPayload.signedUrlCreation, false)
assert.equal(validation.sanitizedPayload.routeIdempotencyKey, routeRequest.routeIdempotencyKey)
assert.equal(
  validation.nextRequiredGate,
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1',
)

const result = enqueueGstreamerMkvtoolnixGuardedWorkerMock(createMockDatabase(), enqueueInput)
assert.equal(result.ok, true, result.sanitizedSummary)
assert.equal(result.enqueueStatus, 'queued_mock_contract_only')
assert.ok(result.queueItem, 'queue item must be created')
assert.equal(result.queueItem.queueStatus, 'queued')
assert.equal(result.queueItem.workerKind, 'render_export')
assert.equal(result.queueItem.mockOnly, true)
assert.equal(result.queueItem.payload.mockOnly, true)
assert.equal(result.queueItem.payload.workerDispatchAttempted, false)
assert.equal(result.queueItem.payload.workerExecution, false)
assert.equal(result.queueItem.payload.gstreamerExecution, false)
assert.equal(result.queueItem.payload.mkvtoolnixExecution, false)
assert.equal(result.queueItem.payload.mediaProcessing, false)
assert.equal(result.queueItem.payload.publicArtifactCreation, false)
assert.equal(result.queueItem.payload.routeIdempotencyKey, routeRequest.routeIdempotencyKey)
assert.equal(result.queueItem.payload.commandTemplateId, 'gst_controlled_generated_fixture_pipeline_v1')
assert.equal(Object.keys(result.queueItem.payload).some((key) => /secret|token|password/i.test(key)), false)

const dispatchAttempt = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput({
  ...enqueueInput,
  workerDispatchAttempted: true,
} as unknown as typeof enqueueInput)
assert.equal(dispatchAttempt.ok, false)
assert.ok(dispatchAttempt.blockers.includes('blocked_worker_dispatch_not_enabled'))

const workerExecutionAttempt = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput({
  ...enqueueInput,
  workerExecution: true,
} as unknown as typeof enqueueInput)
assert.equal(workerExecutionAttempt.ok, false)
assert.ok(workerExecutionAttempt.blockers.includes('blocked_worker_execution_not_enabled'))

const toolExecutionAttempt = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput({
  ...enqueueInput,
  gstreamerExecution: true,
} as unknown as typeof enqueueInput)
assert.equal(toolExecutionAttempt.ok, false)
assert.ok(toolExecutionAttempt.blockers.includes('blocked_tool_execution_not_enabled'))

const routeInvalid = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput({
  ...enqueueInput,
  routeRequest: {
    ...routeRequest,
    serviceRoleContextRef: {
      ...routeRequest.serviceRoleContextRef,
      broadServiceRoleHandler: true,
    },
  },
} as unknown as typeof enqueueInput)
assert.equal(routeInvalid.ok, false)
assert.ok(routeInvalid.blockers.includes('blocked_route_contract_invalid'))

const idempotencyMismatch = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput({
  ...enqueueInput,
  routeRequest: {
    ...routeRequest,
    routeIdempotencyKey: 'wrong-idempotency-key',
  },
})
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_idempotency_mismatch'))

const publicArtifactAttempt = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput({
  ...enqueueInput,
  publicArtifactCreation: true,
} as unknown as typeof enqueueInput)
assert.equal(publicArtifactAttempt.ok, false)
assert.ok(publicArtifactAttempt.blockers.includes('blocked_public_or_signed_artifact_attempt'))

const deliveryAttempt = validateGstreamerMkvtoolnixGuardedWorkerEnqueueInput({
  ...enqueueInput,
  finalRenderExport: true,
} as unknown as typeof enqueueInput)
assert.equal(deliveryAttempt.ok, false)
assert.ok(deliveryAttempt.blockers.includes('blocked_delivery_or_unlock_attempt'))

const boundary = summarizeGstreamerMkvtoolnixGuardedWorkerEnqueueBoundary()
assert.ok(boundary.some((line) => line.includes('Mock enqueue consumes')))
assert.ok(boundary.some((line) => line.includes('no worker dispatch attempt')))
assert.ok(boundary.some((line) => line.includes('guarded worker skeleton')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'enqueue_input_validates',
    'mock_queue_item_created',
    'queue_payload_sanitized_refs_only',
    'dispatch_execution_tool_attempts_block',
    'route_invalid_blocks',
    'idempotency_mismatch_blocks',
    'public_artifact_and_delivery_attempts_block',
    'no_route_worker_gstreamer_mkvtoolnix_media_supabase_sql_or_unlock_execution_enabled',
  ],
  queueStatus: result.queueItem.queueStatus,
  nextRequiredGate: result.nextRequiredGate,
}, null, 2))
