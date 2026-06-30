import assert from 'node:assert/strict'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS,
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
  createGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunMetadata,
  summarizeGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunBoundary,
  validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'

const validInput = buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput()
const validation = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(validInput)

assert.equal(validation.ok, true, validation.blockers.join(', '))
assert.equal(validation.status, 'dispatched_controlled_worker_dispatch_dry_run_metadata_only')
assert.equal(validation.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION)
assert.equal(validation.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV)
assert.equal(validation.controlledWorkerQueueStatus, 'ready_for_agent_controlled_worker_dispatch_dry_run')
assert.equal(validation.sanitizedDispatchDryRun.dispatchDryRunMode, 'metadata_only_worker_dispatch_dry_run')
assert.equal(validation.sanitizedDispatchDryRun.workerRuntimeMode, 'dry_run_no_worker_claim')
assert.equal(validation.sanitizedDispatchDryRun.queueStatusAtDryRun, 'pending_validation')
assert.equal(validation.sanitizedDispatchDryRun.dryRunDispatchEnvelopeCreated, true)
assert.equal(validation.sanitizedDispatchDryRun.dryRunDispatchAccepted, true)
assert.equal(validation.sanitizedDispatchDryRun.nextWorkerRuntimeExecution, 'pending_next_milestone')
assert.equal(validation.sanitizedDispatchDryRun.workerDispatch, false)
assert.equal(validation.sanitizedDispatchDryRun.workerExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.workerLeaseClaim, false)
assert.equal(validation.sanitizedDispatchDryRun.gstreamerExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.mkvtoolnixExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.mediaProcessing, false)
assert.equal(validation.sanitizedDispatchDryRun.persistentJobQueueWrite, false)
assert.equal(validation.sanitizedDispatchDryRun.publicArtifactCreation, false)
assert.equal(validation.safety.workerDispatch, false)
assert.equal(validation.safety.workerExecution, false)
assert.equal(validation.safety.workerLeaseClaim, false)
assert.equal(validation.safety.gstreamerExecutionInThisDispatchDryRun, false)
assert.equal(validation.safety.mkvtoolnixExecutionInThisDispatchDryRun, false)
assert.equal(validation.safety.persistentJobQueueWrite, false)
assert.equal(validation.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE)

const dispatched = createGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunMetadata(
  createMockDatabase(),
  validInput,
)
assert.equal(dispatched.ok, true, dispatched.blockers.join(', '))
assert.equal(dispatched.status, 'dispatched_controlled_worker_dispatch_dry_run_metadata_only')
assert.equal(dispatched.sanitizedDispatchDryRun.queueStatusAtDryRun, 'queued')
assert.equal(dispatched.sanitizedDispatchDryRun.dryRunDispatchEnvelopeCreated, true)
assert.ok(dispatched.queueItem, 'queue item must be present')
assert.equal(dispatched.queueItem.queueStatus, 'queued')
assert.equal(dispatched.queueItem.mockOnly, true)
assert.equal(dispatched.queueItem.payload.mockOnly, true)
assert.equal(dispatched.queueItem.payload.workerDispatch, false)
assert.equal(dispatched.queueItem.payload.workerExecution, false)
assert.equal(dispatched.queueItem.payload.gstreamerExecution, false)
assert.equal(dispatched.queueItem.payload.mkvtoolnixExecution, false)
assert.equal(dispatched.queueItem.payload.persistentJobQueueWrite, false)
assert.equal(Object.keys(dispatched.queueItem.payload).some((key) => /secret|token|password/i.test(key)), false)

const missingConfirmation = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({ confirmation: false }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(missingConfirmation.blockers.includes('blocked_missing_controlled_worker_dispatch_dry_run_confirmation'))

const invalidQueue = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({
    controlledWorkerQueueInput: buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput({ confirmation: false }),
  }),
)
assert.equal(invalidQueue.ok, false)
assert.ok(invalidQueue.blockers.includes('blocked_controlled_worker_queue_validation_failed'))

const invalidMode = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({ dispatchDryRunMode: 'runtime_worker_dispatch' }),
)
assert.equal(invalidMode.ok, false)
assert.ok(invalidMode.blockers.includes('blocked_invalid_controlled_worker_dispatch_dry_run_state'))

const invalidWorkerMode = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({ workerRuntimeMode: 'claim_worker_lease' }),
)
assert.equal(invalidWorkerMode.ok, false)
assert.ok(invalidWorkerMode.blockers.includes('blocked_invalid_controlled_worker_dispatch_dry_run_state'))

const idempotencyMismatch = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({ dispatchDryRunIdempotencyKey: 'wrong-dispatch-dry-run-key' }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_controlled_worker_dispatch_dry_run_idempotency_mismatch'))

const workerDispatchRequest = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({ workerDispatchRequestedNow: true }),
)
assert.equal(workerDispatchRequest.ok, false)
assert.ok(workerDispatchRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const workerLeaseRequest = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({ workerLeaseClaimRequestedNow: true }),
)
assert.equal(workerLeaseRequest.ok, false)
assert.ok(workerLeaseRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const toolRequest = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({ gstreamerExecutionRequestedNow: true }),
)
assert.equal(toolRequest.ok, false)
assert.ok(toolRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const boundary = summarizeGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunBoundary()
assert.ok(boundary.some((line) => line.includes('queued local mock metadata')))
assert.ok(boundary.some((line) => line.includes('does not claim a worker lease')))
assert.ok(boundary.some((line) => line.includes('separately guarded worker runtime execution packet')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_controlled_worker_dispatch_dry_run_boundary',
    'local_mock_queue_item_reused_for_dry_run',
    'dispatch_dry_run_payload_sanitized_refs_only',
    'confirmation_gate_blocks',
    'invalid_queue_blocks',
    'invalid_dispatch_mode_blocks',
    'worker_lease_claim_blocks',
    'idempotency_mismatch_blocks',
    'worker_dispatch_and_tool_execution_requests_block',
    'safety_flags_remain_false',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS,
  queueStatusAtDryRun: dispatched.sanitizedDispatchDryRun.queueStatusAtDryRun,
  nextMilestone: dispatched.nextMilestone,
}, null, 2))
