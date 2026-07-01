import assert from 'node:assert/strict'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  buildGstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput,
  createGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunMetadata,
  summarizeGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunBoundary,
  validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1'

const validInput = buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput()
const validation = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(validInput)

assert.equal(validation.ok, true, validation.blockers.join(', '))
assert.equal(validation.status, 'dispatched_narrow_controlled_worker_dispatch_dry_run_metadata_only')
assert.equal(validation.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION)
assert.equal(validation.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV)
assert.equal(
  validation.controlledWorkerQueueStatus,
  'ready_for_guarded_narrow_route_worker_controlled_worker_dispatch_dry_run',
)
assert.equal(validation.sanitizedDispatchDryRun.dispatchDryRunMode, 'metadata_only_worker_dispatch_dry_run')
assert.equal(validation.sanitizedDispatchDryRun.workerRuntimeMode, 'dry_run_no_worker_claim')
assert.equal(validation.sanitizedDispatchDryRun.queueStatusAtDryRun, 'pending_validation')
assert.equal(validation.sanitizedDispatchDryRun.dryRunDispatchEnvelopeCreated, true)
assert.equal(validation.sanitizedDispatchDryRun.dryRunDispatchAccepted, true)
assert.equal(validation.sanitizedDispatchDryRun.nextWorkerRuntimeExecution, 'pending_next_milestone')
assert.equal(validation.sanitizedDispatchDryRun.routeExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.workerDispatch, false)
assert.equal(validation.sanitizedDispatchDryRun.workerExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.workerProcessStart, false)
assert.equal(validation.sanitizedDispatchDryRun.workerLeaseClaim, false)
assert.equal(validation.sanitizedDispatchDryRun.persistentJobQueueWrite, false)
assert.equal(validation.sanitizedDispatchDryRun.gstreamerExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.mkvtoolnixExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.ffmpegFfprobeExecution, false)
assert.equal(validation.sanitizedDispatchDryRun.mediaProcessing, false)
assert.equal(validation.sanitizedDispatchDryRun.publicArtifactCreation, false)
assert.equal(validation.safety.routeExecution, false)
assert.equal(validation.safety.workerDispatch, false)
assert.equal(validation.safety.workerExecution, false)
assert.equal(validation.safety.workerLeaseClaim, false)
assert.equal(validation.safety.gstreamerExecutionInThisDispatchDryRun, false)
assert.equal(validation.safety.mkvtoolnixExecutionInThisDispatchDryRun, false)
assert.equal(validation.safety.persistentJobQueueWrite, false)
assert.equal(validation.productReadyEndToEndLocalOssTools, 0)
assert.equal(
  validation.nextMilestone,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
)

const dispatched = createGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunMetadata(
  createMockDatabase(),
  validInput,
)
assert.equal(dispatched.ok, true, dispatched.blockers.join(', '))
assert.equal(dispatched.status, 'dispatched_narrow_controlled_worker_dispatch_dry_run_metadata_only')
assert.equal(dispatched.sanitizedDispatchDryRun.queueStatusAtDryRun, 'queued')
assert.equal(dispatched.sanitizedDispatchDryRun.dryRunDispatchEnvelopeCreated, true)
assert.ok(dispatched.queueItem, 'queue item must be present')
assert.equal(dispatched.queueItem.queueStatus, 'queued')
assert.equal(dispatched.queueItem.mockOnly, true)
assert.equal(dispatched.queueItem.payload.mockOnly, true)
assert.equal(dispatched.queueItem.payload.workerDispatch, false)
assert.equal(dispatched.queueItem.payload.workerExecution, false)
assert.equal(dispatched.queueItem.payload.workerProcessStart, false)
assert.equal(dispatched.queueItem.payload.workerLeaseClaim, false)
assert.equal(dispatched.queueItem.payload.gstreamerExecution, false)
assert.equal(dispatched.queueItem.payload.mkvtoolnixExecution, false)
assert.equal(dispatched.queueItem.payload.persistentQueueWrite, false)
assert.equal(Object.keys(dispatched.queueItem.payload).some((key) => /secret|token|password/i.test(key)), false)

const missingConfirmation = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({ confirmation: false }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(
  missingConfirmation.blockers.includes('blocked_missing_narrow_controlled_worker_dispatch_dry_run_confirmation'),
)

const invalidQueue = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({
    controlledWorkerQueueInput: buildGstreamerMkvtoolnixNarrowControlledWorkerQueueInput({ confirmation: false }),
  }),
)
assert.equal(invalidQueue.ok, false)
assert.ok(invalidQueue.blockers.includes('blocked_narrow_controlled_worker_queue_validation_failed'))

const invalidMode = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({ dispatchDryRunMode: 'runtime_worker_dispatch' }),
)
assert.equal(invalidMode.ok, false)
assert.ok(invalidMode.blockers.includes('blocked_invalid_narrow_controlled_worker_dispatch_dry_run_state'))

const invalidWorkerMode = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({ workerRuntimeMode: 'claim_worker_lease' }),
)
assert.equal(invalidWorkerMode.ok, false)
assert.ok(invalidWorkerMode.blockers.includes('blocked_invalid_narrow_controlled_worker_dispatch_dry_run_state'))

const idempotencyMismatch = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({
    dispatchDryRunIdempotencyKey: 'wrong-narrow-dispatch-dry-run-key',
  }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(
  idempotencyMismatch.blockers.includes('blocked_narrow_controlled_worker_dispatch_dry_run_idempotency_mismatch'),
)

const workerDispatchRequest = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({ workerDispatchRequestedNow: true }),
)
assert.equal(workerDispatchRequest.ok, false)
assert.ok(workerDispatchRequest.blockers.includes('blocked_route_worker_or_tool_execution_not_enabled'))

const workerLeaseRequest = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({ workerLeaseClaimRequestedNow: true }),
)
assert.equal(workerLeaseRequest.ok, false)
assert.ok(workerLeaseRequest.blockers.includes('blocked_route_worker_or_tool_execution_not_enabled'))

const toolRequest = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({ gstreamerExecutionRequestedNow: true }),
)
assert.equal(toolRequest.ok, false)
assert.ok(toolRequest.blockers.includes('blocked_route_worker_or_tool_execution_not_enabled'))

const boundary = summarizeGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunBoundary()
assert.ok(boundary.some((line) => line.includes('queued local mock metadata')))
assert.ok(boundary.some((line) => line.includes('does not dispatch a worker')))
assert.ok(boundary.some((line) => line.includes('guarded runtime execution packet')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_narrow_controlled_worker_dispatch_dry_run_boundary',
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
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS,
  queueStatusAtDryRun: dispatched.sanitizedDispatchDryRun.queueStatusAtDryRun,
  nextMilestone: dispatched.nextMilestone,
}, null, 2))
