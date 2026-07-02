import assert from 'node:assert/strict'

import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun,
  summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunBoundary,
  validateGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'
import {
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1'

const input = buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput()
assert.deepEqual(validateGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput(input), [])

const blockedWithoutGate = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(input, {})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(blockedWithoutGate.status, 'blocked_missing_worker_dispatch_runtime_dry_run_confirmation')
assert.equal(blockedWithoutGate.safety.dryRunDispatchEnvelopeCreated, false)
assert.equal(blockedWithoutGate.safety.routeHandlerInvocation, false)
assert.equal(blockedWithoutGate.safety.workerDispatch, false)
assert.equal(blockedWithoutGate.safety.workerExecution, false)
assert.equal(blockedWithoutGate.safety.workerProcessStart, false)
assert.equal(blockedWithoutGate.safety.workerLeaseMutation, false)
assert.equal(blockedWithoutGate.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGate.safety.mkvtoolnixExecution, false)

const completed = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(input, {
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true',
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_worker_dispatch_runtime_dry_run')
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION)
assert.equal(completed.sanitizedWorkerDispatchDryRun.dryRunDispatchEnvelopeReady, true)
assert.equal(completed.sanitizedWorkerDispatchDryRun.sourceGateMergeSha, '488df755ef9f9954e8696ed336f9106bada06319')
assert.equal(completed.sanitizedWorkerDispatchDryRun.persistedJobType, 'quality_check')
assert.equal(completed.sanitizedWorkerDispatchDryRun.persistedJobPayloadKind, 'gstreamer_mkvtoolnix_generated_fixture_runtime')
assert.equal(completed.sanitizedWorkerDispatchDryRun.claimLeaseMode, 'remote_supabase_worker_claim_lease_no_worker_execution')
assert.equal(completed.sanitizedWorkerDispatchDryRun.claimedJobCannotBeReclaimedBeforeDispatch, true)
assert.equal(completed.sanitizedWorkerDispatchDryRun.rollbackResidueVerified, true)
assert.equal(completed.safety.dryRunEvaluation, 'completed_worker_dispatch_runtime_dry_run_validation')
assert.equal(completed.safety.dryRunDispatchEnvelopeCreated, 'completed_metadata_only_dry_run_dispatch_envelope')
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
assert.equal(completed.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE)

const invalidSourceGate = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput({
    sourceGateResult: runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(
      buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput({
        dispatchEnvelopeMode: 'wrong-envelope-mode',
      }),
      { REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE: 'true' },
    ),
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true',
  },
)
assert.equal(invalidSourceGate.ok, false)
assert.ok(invalidSourceGate.blockers.includes('blocked_invalid_worker_dispatch_runtime_dry_run_source_gate'))

const invalidMode = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput({
    dryRunMode: 'runtime_worker_dispatch',
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true',
  },
)
assert.equal(invalidMode.ok, false)
assert.ok(invalidMode.blockers.includes('blocked_invalid_worker_dispatch_runtime_dry_run_state'))

const idempotencyMismatch = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput({
    dryRunIdempotencyKey: 'wrong-dry-run-key',
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true',
  },
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_worker_dispatch_runtime_dry_run_idempotency_mismatch'))

const unsafeWorkerDispatch = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput({
    workerDispatchRequestedNow: true,
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true',
  },
)
assert.equal(unsafeWorkerDispatch.ok, false)
assert.ok(unsafeWorkerDispatch.blockers.includes('blocked_unsafe_worker_dispatch_runtime_dry_run_request'))
assert.equal(unsafeWorkerDispatch.safety.workerDispatch, false)

const unsafeToolExecution = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput({
    gstreamerExecutionRequestedNow: true,
  }),
  {
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true',
  },
)
assert.equal(unsafeToolExecution.ok, false)
assert.ok(unsafeToolExecution.blockers.includes('blocked_unsafe_worker_dispatch_runtime_dry_run_request'))
assert.equal(unsafeToolExecution.safety.gstreamerExecution, false)

const boundary = summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunBoundary()
assert.ok(boundary.some((line) => line.includes('#2158 source-gate evidence')))
assert.ok(boundary.some((line) => line.includes('without invoking a route handler')))
assert.ok(boundary.some((line) => line.includes('worker dispatch')))
assert.ok(boundary.some((line) => line.includes('Does not run GStreamer/MKVToolNix')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gate_blocks_worker_dispatch_runtime_dry_run',
    'dry_run_accepts_only_2158_source_gate_evidence',
    'dry_run_dispatch_envelope_created_metadata_only',
    'invalid_source_gate_blocks',
    'invalid_dry_run_mode_blocks',
    'idempotency_mismatch_blocks',
    'worker_dispatch_request_blocks',
    'tool_execution_request_blocks',
    'no_route_worker_tool_media_supabase_sql_execution_enabled',
  ],
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION,
  nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE,
}, null, 2))
