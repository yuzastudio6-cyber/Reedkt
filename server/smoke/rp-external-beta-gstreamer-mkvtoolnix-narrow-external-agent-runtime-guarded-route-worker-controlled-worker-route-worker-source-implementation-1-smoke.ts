import assert from 'node:assert/strict'
import {
  buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource,
} from '../routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-route-source'
import {
  buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
} from '../workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput,
  createGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationResponse,
  summarizeGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationBoundary,
  validateGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1'

const valid = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput(),
)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, 'completed_narrow_route_worker_source_implementation')
assert.equal(valid.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_DECISION)
assert.equal(valid.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_CONFIRM_ENV)
assert.equal(valid.confirmationRequired, true)
assert.equal(valid.sanitizedImplementation.sourceExecutionPacketQaMergeSha, 'ee557c2322317f7fdc3e3f0f85b6571f9bf88fc4')
assert.equal(valid.sanitizedImplementation.routeSourceMode, 'source_file_created_not_registered')
assert.equal(valid.sanitizedImplementation.workerSourceMode, 'source_file_created_not_registered_not_dispatched')
assert.equal(valid.sanitizedImplementation.queueSourceMode, 'metadata_only_queue_source_declared_no_persistent_write')
assert.equal(valid.sanitizedImplementation.sourceClass, 'generated_fixture_only_narrow_controlled_worker_runtime_source')
assert.equal(valid.sanitizedImplementation.approvedSnapshotRequirement, 'required_before_future_runtime')
assert.equal(valid.sanitizedImplementation.routeRegisteredAtRuntime, false)
assert.equal(valid.sanitizedImplementation.productionRouteFileCreated, false)
assert.equal(valid.sanitizedImplementation.routeExecution, false)
assert.equal(valid.sanitizedImplementation.workerDispatch, false)
assert.equal(valid.sanitizedImplementation.workerExecution, false)
assert.equal(valid.sanitizedImplementation.workerProcessStart, false)
assert.equal(valid.sanitizedImplementation.workerLeaseClaim, false)
assert.equal(valid.sanitizedImplementation.persistentJobQueueWrite, false)
assert.equal(valid.sanitizedImplementation.gstreamerExecution, false)
assert.equal(valid.sanitizedImplementation.mkvtoolnixExecution, false)
assert.equal(valid.sanitizedImplementation.dockerExecution, false)
assert.equal(valid.sanitizedImplementation.ffmpegFfprobeExecution, false)
assert.equal(valid.sanitizedImplementation.supabaseMutation, false)
assert.equal(valid.sanitizedImplementation.sqlExecution, false)
assert.equal(valid.sanitizedImplementation.publicArtifactCreation, false)
assert.equal(valid.sanitizedImplementation.finalRenderExport, false)
assert.equal(valid.responseShape.status, 'accepted_narrow_route_worker_source_implementation')
assert.equal(valid.responseShape.routeRegisteredAtRuntime, false)
assert.equal(valid.responseShape.routeExecution, false)
assert.equal(valid.responseShape.workerDispatch, false)
assert.equal(valid.responseShape.workerExecution, false)
assert.equal(valid.responseShape.toolExecution, false)
assert.equal(valid.productReadyEndToEndLocalOssTools, 0)
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_NEXT_MILESTONE)

const response = createGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationResponse(
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput(),
)
assert.deepEqual(response, valid.responseShape)

const malformedRouteSource = (
  overrides: Record<string, unknown>,
): ReturnType<typeof buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource> => ({
  ...buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource(),
  ...overrides,
} as unknown as ReturnType<typeof buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource>)

const malformedWorkerSource = (
  overrides: Record<string, unknown>,
): ReturnType<typeof buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource> => ({
  ...buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource(),
  ...overrides,
} as unknown as ReturnType<typeof buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource>)

const negativeCases = [
  {
    name: 'missing_confirmation',
    input: buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput({ confirmation: false }),
    blocker: 'blocked_missing_narrow_route_worker_source_implementation_confirmation',
  },
  {
    name: 'missing_qa_rollup',
    input: buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput({
      sourceExecutionPacketQaStatus: 'pending',
    }),
    blocker: 'blocked_missing_source_execution_packet_qa_rollup',
  },
  {
    name: 'route_registered',
    input: buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput({
      routeSource: malformedRouteSource({
        routeRegisteredAtRuntime: true,
      }),
    }),
    blocker: 'blocked_route_source_validation_failed',
  },
  {
    name: 'worker_dispatch',
    input: buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput({
      workerSource: malformedWorkerSource({
        workerDispatch: true,
      }),
    }),
    blocker: 'blocked_worker_source_validation_failed',
  },
  {
    name: 'tool_execution',
    input: buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput({
      gstreamerExecutionRequestedNow: true,
    }),
    blocker: 'blocked_route_worker_or_tool_execution_not_enabled',
  },
  {
    name: 'idempotency_mismatch',
    input: buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput({
      sourceImplementationIdempotencyKey: 'wrong-source-implementation-key',
    }),
    blocker: 'blocked_source_implementation_idempotency_mismatch',
  },
] as const

for (const testCase of negativeCases) {
  const result = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput(testCase.input)
  assert.equal(result.ok, false, testCase.name)
  assert.ok(result.blockers.includes(testCase.blocker), testCase.name)
}

const summary = summarizeGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationBoundary()
assert.ok(summary.some((line) => line.includes('source-only route/worker files')))
assert.ok(summary.some((line) => line.includes('not registered at runtime')))
assert.ok(summary.some((line) => line.includes('not dispatched')))
assert.ok(summary.some((line) => line.includes(RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_CONFIRM_ENV)))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_source_only_route_worker_implementation',
    'route_source_created_not_registered',
    'worker_source_created_not_dispatched',
    'confirmation_gate_required',
    'negative_cases_block_runtime_and_tool_paths',
    'response_shape_remains_runtime_disabled',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_READY_STATUS,
  nextMilestone: valid.nextMilestone,
}, null, 2))
