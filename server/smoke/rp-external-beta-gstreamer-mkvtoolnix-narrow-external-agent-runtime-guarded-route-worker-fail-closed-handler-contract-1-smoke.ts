import assert from 'node:assert/strict'
import {
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_DECISION,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_EXECUTION,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput,
  createGstreamerMkvtoolnixNarrowSourceExecutionBoundaryDisabledResponse,
  summarizeGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractBoundary,
  validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput,
} from '../routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-handler-contract'

const valid = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(),
)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, 'accepted_fail_closed_handler_contract')
assert.equal(valid.decision, GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_DECISION)
assert.equal(valid.execution, GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_EXECUTION)
assert.equal(valid.sanitizedHandlerContract.routeRegistryStatus, 'disabled')
assert.equal(valid.sanitizedHandlerContract.runtimeMode, 'backend_required')
assert.equal(valid.sanitizedHandlerContract.requiresServiceRole, true)
assert.equal(valid.sanitizedHandlerContract.handlerRegisteredAtRuntime, false)
assert.equal(valid.sanitizedHandlerContract.routeExecution, false)
assert.equal(valid.sanitizedHandlerContract.workerDispatch, false)
assert.equal(valid.sanitizedHandlerContract.workerExecution, false)
assert.equal(valid.sanitizedHandlerContract.gstreamerExecution, false)
assert.equal(valid.sanitizedHandlerContract.mkvtoolnixExecution, false)
assert.equal(valid.sanitizedHandlerContract.mediaProcessing, false)
assert.equal(valid.sanitizedHandlerContract.publicArtifactCreation, false)
assert.equal(valid.sanitizedHandlerContract.finalRenderExport, false)
assert.equal(valid.productReadyEndToEndLocalOssTools, 0)
assert.equal(valid.nextMilestone, GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_NEXT_MILESTONE)

const response = createGstreamerMkvtoolnixNarrowSourceExecutionBoundaryDisabledResponse(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(),
)
assert.deepEqual(response, valid.responseShape)

const negativeCases = [
  {
    name: 'missing_confirmation',
    input: buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput({ confirmation: false }),
    blocker: 'blocked_missing_handler_contract_confirmation',
  },
  {
    name: 'invalid_route_status',
    input: buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput({ routeRegistryStatus: 'mock_ready' }),
    blocker: 'blocked_invalid_route_registration_metadata',
  },
  {
    name: 'missing_approved_snapshot',
    input: buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput({ approvedSnapshotId: '' }),
    blocker: 'blocked_missing_approved_snapshot_reference',
  },
  {
    name: 'missing_manifest',
    input: buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput({
      privateGeneratedFixtureManifestId: '',
    }),
    blocker: 'blocked_missing_private_generated_fixture_manifest_reference',
  },
  {
    name: 'runtime_requested',
    input: buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput({ routeExecution: true }),
    blocker: 'blocked_route_worker_or_tool_execution_not_enabled',
  },
  {
    name: 'tool_requested',
    input: buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput({ gstreamerExecution: true }),
    blocker: 'blocked_route_worker_or_tool_execution_not_enabled',
  },
  {
    name: 'idempotency_mismatch',
    input: buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput({ idempotencyKey: 'wrong' }),
    blocker: 'blocked_idempotency_mismatch',
  },
] as const

for (const testCase of negativeCases) {
  const result = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(testCase.input)
  assert.equal(result.ok, false, testCase.name)
  assert.ok(result.blockers.includes(testCase.blocker), testCase.name)
}

const summary = summarizeGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractBoundary()
assert.ok(summary.some((line) => line.includes('no route handler is registered')))
assert.ok(summary.some((line) => line.includes('approved snapshot')))
assert.ok(summary.some((line) => line.includes('Rejects route execution')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_fail_closed_handler_contract',
    'disabled_backend_required_route_metadata',
    'required_references_present',
    'negative_cases_block_runtime_tool_media_paths',
    'response_shape_remains_disabled',
  ],
  nextMilestone: valid.nextMilestone,
}, null, 2))
