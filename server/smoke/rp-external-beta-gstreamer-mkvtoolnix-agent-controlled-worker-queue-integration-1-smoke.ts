import assert from 'node:assert/strict'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  buildGstreamerMkvtoolnixAgentControlledDispatchInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_READY_STATUS,
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput,
  queueGstreamerMkvtoolnixAgentControlledWorkerQueueMetadataMock,
  summarizeGstreamerMkvtoolnixAgentControlledWorkerQueueBoundary,
  validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'

const validInput = buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput()
const validation = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(validInput)

assert.equal(validation.ok, true, validation.blockers.join(', '))
assert.equal(validation.status, 'queued_controlled_worker_queue_metadata_only')
assert.equal(validation.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_DECISION)
assert.equal(validation.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV)
assert.equal(validation.sanitizedQueue.queueMode, 'mock_queue_metadata_only')
assert.equal(validation.sanitizedQueue.localMockQueueItemCreated, false)
assert.equal(validation.sanitizedQueue.queueStatus, 'pending_validation')
assert.equal(validation.sanitizedQueue.nextWorkerDispatch, 'pending_next_milestone')
assert.equal(validation.sanitizedQueue.workerDispatch, false)
assert.equal(validation.sanitizedQueue.workerExecution, false)
assert.equal(validation.sanitizedQueue.gstreamerExecution, false)
assert.equal(validation.sanitizedQueue.mkvtoolnixExecution, false)
assert.equal(validation.sanitizedQueue.persistentJobQueueWrite, false)
assert.equal(validation.safety.workerDispatch, false)
assert.equal(validation.safety.workerExecution, false)
assert.equal(validation.safety.gstreamerExecutionInThisQueueIntegration, false)
assert.equal(validation.safety.mkvtoolnixExecutionInThisQueueIntegration, false)
assert.equal(validation.safety.persistentJobQueueWrite, false)
assert.equal(validation.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE)

const queued = queueGstreamerMkvtoolnixAgentControlledWorkerQueueMetadataMock(createMockDatabase(), validInput)
assert.equal(queued.ok, true, queued.blockers.join(', '))
assert.equal(queued.status, 'queued_controlled_worker_queue_metadata_only')
assert.equal(queued.sanitizedQueue.localMockQueueItemCreated, true)
assert.equal(queued.sanitizedQueue.queueStatus, 'queued')
assert.ok(queued.queueItem, 'queue item must be created')
assert.equal(queued.queueItem.queueStatus, 'queued')
assert.equal(queued.queueItem.mockOnly, true)
assert.equal(queued.queueItem.workerKind, 'render_export')
assert.equal(queued.queueItem.payload.mockOnly, true)
assert.equal(queued.queueItem.payload.queueMode, 'mock_queue_metadata_only')
assert.equal(queued.queueItem.payload.queueIdempotencyKey, validInput.queueIdempotencyKey)
assert.equal(queued.queueItem.payload.workerDispatch, false)
assert.equal(queued.queueItem.payload.workerExecution, false)
assert.equal(queued.queueItem.payload.gstreamerExecution, false)
assert.equal(queued.queueItem.payload.mkvtoolnixExecution, false)
assert.equal(queued.queueItem.payload.mediaProcessing, false)
assert.equal(queued.queueItem.payload.persistentJobQueueWrite, false)
assert.equal(queued.queueItem.payload.publicArtifactCreation, false)
assert.equal(Object.keys(queued.queueItem.payload).some((key) => /secret|token|password/i.test(key)), false)

const missingConfirmation = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput({ confirmation: false }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(missingConfirmation.blockers.includes('blocked_missing_controlled_worker_queue_confirmation'))

const invalidDispatch = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput({
    controlledDispatchInput: buildGstreamerMkvtoolnixAgentControlledDispatchInput({ confirmation: false }),
  }),
)
assert.equal(invalidDispatch.ok, false)
assert.ok(invalidDispatch.blockers.includes('blocked_controlled_dispatch_validation_failed'))

const invalidMode = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput({ queueMode: 'runtime_worker_queue' }),
)
assert.equal(invalidMode.ok, false)
assert.ok(invalidMode.blockers.includes('blocked_invalid_controlled_worker_queue_state'))

const idempotencyMismatch = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput({ queueIdempotencyKey: 'wrong-queue-key' }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_controlled_worker_queue_idempotency_mismatch'))

const runtimeRequest = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput({ workerDispatchRequestedNow: true }),
)
assert.equal(runtimeRequest.ok, false)
assert.ok(runtimeRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const toolRequest = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput({ mkvtoolnixExecutionRequestedNow: true }),
)
assert.equal(toolRequest.ok, false)
assert.ok(toolRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const boundary = summarizeGstreamerMkvtoolnixAgentControlledWorkerQueueBoundary()
assert.ok(boundary.some((line) => line.includes('accepted controlled-dispatch metadata')))
assert.ok(boundary.some((line) => line.includes('local mock queue metadata only')))
assert.ok(boundary.some((line) => line.includes('controlled worker-dispatch dry run')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_worker_queue_metadata_boundary',
    'local_mock_queue_item_created',
    'queue_payload_sanitized_refs_only',
    'confirmation_gate_blocks',
    'invalid_dispatch_blocks',
    'invalid_queue_mode_blocks',
    'queue_idempotency_mismatch_blocks',
    'runtime_dispatch_and_tool_execution_requests_block',
    'safety_flags_remain_false',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_READY_STATUS,
  queueStatus: queued.queueItem.queueStatus,
  nextMilestone: queued.nextMilestone,
}, null, 2))
