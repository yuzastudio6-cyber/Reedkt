import assert from 'node:assert/strict'

import { buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource } from '../workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION,
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate,
  summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateBoundary,
  validateGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1'
import { buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput } from '../services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1'

const input = buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput()
assert.deepEqual(validateGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput(input), [])

const blockedWithoutGate = runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(input, {})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(blockedWithoutGate.status, 'blocked_missing_worker_dispatch_runtime_source_gate_confirmation')
assert.equal(blockedWithoutGate.safety.dispatchEnvelopeCreated, false)
assert.equal(blockedWithoutGate.safety.workerDispatch, false)
assert.equal(blockedWithoutGate.safety.workerExecution, false)
assert.equal(blockedWithoutGate.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGate.safety.mkvtoolnixExecution, false)

const completed = runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(input, {
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV]: 'true',
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_worker_dispatch_runtime_source_gate')
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION)
assert.equal(completed.sanitizedDispatchSourceGate.dispatchEnvelopeReady, true)
assert.equal(completed.sanitizedDispatchSourceGate.persistedJobType, 'quality_check')
assert.equal(completed.sanitizedDispatchSourceGate.persistedJobPayloadKind, 'gstreamer_mkvtoolnix_generated_fixture_runtime')
assert.equal(completed.sanitizedDispatchSourceGate.claimLeaseMode, 'remote_supabase_worker_claim_lease_no_worker_execution')
assert.equal(completed.sanitizedDispatchSourceGate.claimedJobCannotBeReclaimedBeforeDispatch, true)
assert.equal(completed.sanitizedDispatchSourceGate.rollbackResidueVerified, true)
assert.equal(completed.safety.sourceGateEvaluation, 'completed_source_gate_validation')
assert.equal(completed.safety.dispatchEnvelopeCreated, 'completed_metadata_only_source_envelope')
assert.equal(completed.safety.routeHandlerInvocation, false)
assert.equal(completed.safety.workerDispatch, false)
assert.equal(completed.safety.workerExecution, false)
assert.equal(completed.safety.workerProcessStart, false)
assert.equal(completed.safety.workerLeaseMutation, false)
assert.equal(completed.safety.persistentJobQueueWrite, false)
assert.equal(completed.safety.gstreamerExecution, false)
assert.equal(completed.safety.mkvtoolnixExecution, false)
assert.equal(completed.safety.mediaProcessing, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)

const unsafe = runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput({
    workerDispatchRequestedNow: true,
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(unsafe.ok, false)
assert.ok(unsafe.blockers.includes('blocked_unsafe_worker_dispatch_runtime_source_gate_request'))
assert.equal(unsafe.safety.workerDispatch, false)

const invalidSourceChain = runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput({
    remoteValidationRunId: 'wrong-run-id',
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(invalidSourceChain.ok, false)
assert.ok(invalidSourceChain.blockers.includes('blocked_invalid_worker_dispatch_runtime_source_chain'))

const invalidClaimLease = runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput({
    persistedClaimLeaseInput: buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput({
      claimLeaseMode: 'local_mock_claim_lease_no_worker_execution',
      remoteWorkerClaimLeaseConfirmed: false,
    }),
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(invalidClaimLease.ok, false)
assert.ok(invalidClaimLease.blockers.includes('blocked_invalid_worker_dispatch_runtime_claim_lease_payload'))

const invalidWorkerSource = runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput({
    workerSource: buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource({
      workerRegisteredAtRuntime: true,
    } as never),
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV]: 'true',
  },
)
assert.equal(invalidWorkerSource.ok, false)
assert.ok(invalidWorkerSource.blockers.includes('blocked_invalid_worker_dispatch_runtime_worker_source'))

const boundary = summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateBoundary()
assert.ok(boundary.some((line) => line.includes('#2155 remote worker claim/lease rollback proof')))
assert.ok(boundary.some((line) => line.includes('quality_check')))
assert.ok(boundary.some((line) => line.includes('metadata dispatch envelope')))
assert.ok(boundary.some((line) => line.includes('Does not invoke a route handler')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gate_blocks_source_gate',
    'source_gate_accepts_only_2155_remote_claim_lease_proof',
    'dispatch_envelope_created_metadata_only',
    'unsafe_dispatch_request_blocks',
    'invalid_source_chain_blocks',
    'local_mock_claim_lease_payload_blocks',
    'runtime_registered_worker_source_blocks',
    'no_route_worker_tool_media_supabase_sql_execution_enabled',
  ],
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION,
}, null, 2))
