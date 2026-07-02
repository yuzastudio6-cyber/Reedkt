import assert from 'node:assert/strict'

import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
  runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket,
  summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketBoundary,
  validateGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1'

const validInput = buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput()
assert.deepEqual(validateGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput(validInput), [])

const routeRunner = async () => runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge(validInput.runtimeRouteInput, {
  env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV]: 'true' },
  runtimeRunner: async () => ({
    packet: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2',
    decision: 'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
    execution: 'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch',
    runId: 'smoke-run-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1',
    outputDir: '/tmp/reeditpro-smoke-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1',
    report: '/tmp/reeditpro-smoke-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1/report.json',
    manifest: '/tmp/reeditpro-smoke-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1/manifest.json',
    artifacts: [
      {
        fileName: 'report.json',
        bytes: 1234,
        sha256: 'b'.repeat(64),
      },
    ],
  }),
})

let routeRunnerCalledWithoutGate = false
const blockedWithoutGate = await runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(validInput, {
  env: {},
  routeRunner: async () => {
    routeRunnerCalledWithoutGate = true
    return routeRunner()
  },
})
assert.equal(blockedWithoutGate.ok, false)
assert.equal(blockedWithoutGate.status, 'blocked_missing_worker_dispatch_runtime_execution_packet_confirmation')
assert.equal(routeRunnerCalledWithoutGate, false)
assert.equal(blockedWithoutGate.safety.routeHandlerInvocation, false)
assert.equal(blockedWithoutGate.safety.gstreamerExecution, false)
assert.equal(blockedWithoutGate.safety.mkvtoolnixExecution, false)
assert.equal(blockedWithoutGate.safety.dockerExecution, false)

const completed = await runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(validInput, {
  env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV]: 'true' },
  routeRunner,
})
assert.equal(completed.ok, true)
assert.equal(completed.status, 'completed_worker_dispatch_runtime_execution_packet')
assert.equal(completed.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION)
assert.equal(completed.sanitizedExecutionPacket.sourceGateMergeSha, '488df755ef9f9954e8696ed336f9106bada06319')
assert.equal(completed.sanitizedExecutionPacket.dryRunMergeSha, 'ef5b15adcf5de407f3083abb64ffc14b298692cc')
assert.equal(completed.sanitizedExecutionPacket.dryRunRunId, '2026-07-02T16-10-17-014Z-eec19f59')
assert.equal(completed.sanitizedExecutionPacket.routePath, '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute')
assert.equal(completed.sanitizedExecutionPacket.workerSourcePath, 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts')
assert.equal(completed.sanitizedExecutionPacket.executionPacketIdempotencyKey, validInput.executionPacketIdempotencyKey)
assert.equal(completed.sanitizedExecutionPacket.routeHandlerInvocation, 'completed_guarded_route_handler')
assert.equal(completed.sanitizedExecutionPacket.runtimeRouteDelegate, 'completed_existing_guarded_route_delegate')
assert.equal(completed.sanitizedExecutionPacket.workerDispatch, false)
assert.equal(completed.sanitizedExecutionPacket.workerExecution, false)
assert.equal(completed.sanitizedExecutionPacket.workerLeaseMutation, false)
assert.equal(completed.sanitizedExecutionPacket.persistentJobQueueWrite, false)
assert.equal(completed.sanitizedExecutionPacket.gstreamerExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.sanitizedExecutionPacket.mkvtoolnixExecution, 'completed_controlled_generated_fixture_only')
assert.equal(completed.sanitizedExecutionPacket.mediaProcessing, 'controlled_generated_fixture_only')
assert.equal(completed.safety.realWorkerDispatch, false)
assert.equal(completed.safety.workerExecution, false)
assert.equal(completed.safety.supabaseMutation, false)
assert.equal(completed.safety.sqlExecution, false)
assert.equal(completed.safety.publicArtifactCreation, false)
assert.equal(completed.safety.finalRenderExport, false)
assert.equal(completed.productReadyEndToEndLocalOssTools, 0)
assert.equal(completed.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE)

const invalidDryRun = await runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput({
    dryRunRunId: 'wrong-run-id',
  }),
  {
    env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV]: 'true' },
    routeRunner,
  },
)
assert.equal(invalidDryRun.ok, false)
assert.ok(invalidDryRun.blockers.includes('blocked_invalid_worker_dispatch_runtime_execution_packet_dry_run_source'))

const idempotencyMismatch = await runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput({
    executionPacketIdempotencyKey: 'wrong-execution-packet-key',
  }),
  {
    env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV]: 'true' },
    routeRunner,
  },
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_worker_dispatch_runtime_execution_packet_idempotency_mismatch'))

const unsafeWorkerDispatch = await runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput({
    workerDispatchRequestedNow: true,
  }),
  {
    env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV]: 'true' },
    routeRunner,
  },
)
assert.equal(unsafeWorkerDispatch.ok, false)
assert.ok(unsafeWorkerDispatch.blockers.includes('blocked_unsafe_worker_dispatch_runtime_execution_packet_request'))
assert.equal(unsafeWorkerDispatch.safety.realWorkerDispatch, false)

const unsafeRouteDelegate = await runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(validInput, {
  env: { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV]: 'true' },
  routeRunner: async () => {
    const unsafeSafety = { ...completed.routeResult!.safety }
    unsafeSafety.supabaseMutation = Boolean(1) as false
    return {
      ...completed.routeResult!,
      safety: unsafeSafety,
    }
  },
})
assert.equal(unsafeRouteDelegate.ok, false)
assert.ok(unsafeRouteDelegate.blockers.includes('blocked_worker_dispatch_runtime_execution_packet_route_delegate_safety_invalid'))
assert.equal(unsafeRouteDelegate.safety.supabaseMutation, false)

const boundary = summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketBoundary()
assert.ok(boundary.some((line) => line.includes('#2158 source-gate')))
assert.ok(boundary.some((line) => line.includes('#2162 worker-dispatch dry-run')))
assert.ok(boundary.some((line) => line.includes('existing guarded generated-fixture route/runtime bridge')))
assert.ok(boundary.some((line) => line.includes('real worker dispatch')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmation_gate_blocks_before_route_delegate',
    'execution_packet_accepts_only_2158_2162_source_evidence',
    'route_path_worker_source_idempotency_cleanup_and_evidence_are_recorded',
    'fake_route_delegate_success_path_records_controlled_generated_fixture_runtime_only',
    'invalid_dry_run_source_blocks',
    'idempotency_mismatch_blocks',
    'worker_dispatch_request_blocks',
    'unsafe_route_delegate_safety_blocks',
    'no_supabase_sql_private_media_public_artifact_final_export_or_production_unlock_enabled',
  ],
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION,
  nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE,
}, null, 2))
