import assert from 'node:assert/strict'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput,
  summarizeGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionBoundary,
  validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1'

const valid = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(),
)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, 'completed_narrow_route_worker_source_execution_packet')
assert.equal(valid.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_DECISION)
assert.equal(valid.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_CONFIRM_ENV)
assert.equal(valid.confirmationRequired, true)
assert.equal(valid.sanitizedSourceExecutionPacket.sourceExecutionMode, 'metadata_only_source_execution_packet_no_runtime_execution')
assert.equal(valid.sanitizedSourceExecutionPacket.routeSourceMode, 'metadata_only_route_source_declared_no_runtime_registration')
assert.equal(valid.sanitizedSourceExecutionPacket.workerSourceMode, 'metadata_only_worker_source_declared_no_process_start')
assert.equal(valid.sanitizedSourceExecutionPacket.queueSourceMode, 'metadata_only_queue_source_declared_no_persistent_write')
assert.equal(valid.sanitizedSourceExecutionPacket.sourceClass, 'generated_fixture_only_narrow_controlled_worker_runtime_source')
assert.equal(valid.sanitizedSourceExecutionPacket.routeRegisteredAtRuntime, false)
assert.equal(valid.sanitizedSourceExecutionPacket.productionRouteFileCreated, false)
assert.equal(valid.sanitizedSourceExecutionPacket.routeExecution, false)
assert.equal(valid.sanitizedSourceExecutionPacket.workerDispatch, false)
assert.equal(valid.sanitizedSourceExecutionPacket.workerExecution, false)
assert.equal(valid.sanitizedSourceExecutionPacket.workerProcessStart, false)
assert.equal(valid.sanitizedSourceExecutionPacket.workerLeaseClaim, false)
assert.equal(valid.sanitizedSourceExecutionPacket.persistentJobQueueWrite, false)
assert.equal(valid.sanitizedSourceExecutionPacket.gstreamerExecution, false)
assert.equal(valid.sanitizedSourceExecutionPacket.mkvtoolnixExecution, false)
assert.equal(valid.sanitizedSourceExecutionPacket.dockerExecution, false)
assert.equal(valid.sanitizedSourceExecutionPacket.ffmpegFfprobeExecution, false)
assert.equal(valid.sanitizedSourceExecutionPacket.supabaseMutation, false)
assert.equal(valid.sanitizedSourceExecutionPacket.sqlExecution, false)
assert.equal(valid.sanitizedSourceExecutionPacket.publicArtifactCreation, false)
assert.equal(valid.sanitizedSourceExecutionPacket.finalRenderExport, false)
assert.equal(valid.responseShape.status, 'accepted_narrow_route_worker_source_execution_packet')
assert.equal(valid.responseShape.routeExecution, false)
assert.equal(valid.responseShape.workerDispatch, false)
assert.equal(valid.responseShape.workerExecution, false)
assert.equal(valid.responseShape.toolExecution, false)
assert.equal(valid.productReadyEndToEndLocalOssTools, 0)
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_NEXT_MILESTONE)

const missingConfirmation = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({ confirmation: false }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(
  missingConfirmation.blockers.includes('blocked_missing_narrow_route_worker_source_execution_confirmation'),
)

const missingSource = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({
    runtimeIntegrationImplementationQaStatus: 'pending',
  }),
)
assert.equal(missingSource.ok, false)
assert.ok(missingSource.blockers.includes('blocked_missing_runtime_integration_implementation_qa_source'))

const runtimeMode = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({
    sourceExecutionMode: 'runtime_route_worker_source_execution',
  }),
)
assert.equal(runtimeMode.ok, false)
assert.ok(runtimeMode.blockers.includes('blocked_invalid_route_worker_source_execution_state'))

const routeRequest = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({ routeExecutionRequestedNow: true }),
)
assert.equal(routeRequest.ok, false)
assert.ok(routeRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const workerRequest = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({ workerProcessStartRequestedNow: true }),
)
assert.equal(workerRequest.ok, false)
assert.ok(workerRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const toolRequest = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({ gstreamerExecutionRequestedNow: true }),
)
assert.equal(toolRequest.ok, false)
assert.ok(toolRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const broadSource = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({ sourceClass: 'private_or_user_media' }),
)
assert.equal(broadSource.ok, false)
assert.ok(broadSource.blockers.includes('blocked_invalid_route_worker_source_execution_state'))

const idempotencyMismatch = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({
    routeWorkerSourceExecutionPacketIdempotencyKey: 'wrong-key',
  }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_route_worker_source_execution_idempotency_mismatch'))

const boundary = summarizeGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionBoundary()
assert.ok(boundary.some((line) => line.includes('#2074 runtime integration implementation QA rollup')))
assert.ok(boundary.some((line) => line.includes('metadata-only route/worker source execution packet')))
assert.ok(boundary.some((line) => line.includes('Does not register routes')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_route_worker_source_execution_packet',
    'confirmation_gate_blocks',
    'missing_source_qa_blocks',
    'runtime_mode_blocks',
    'route_worker_and_tool_requests_block',
    'broad_source_class_blocks',
    'idempotency_mismatch_blocks',
    'safety_flags_remain_false',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_READY_STATUS,
  nextMilestone: valid.nextMilestone,
}, null, 2))
