import assert from 'node:assert/strict'
import {
  buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-dispatch-dry-run-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_ALLOWED_TEMPLATES,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput,
  summarizeGstreamerMkvtoolnixNarrowControlledWorkerRuntimeBoundary,
  validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput,
  type GuardedRuntimeExecutionSummary,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1'

const guardedRuntime = {
  packet: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1',
  decision: 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
  execution: 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only',
  runId: 'guarded-runtime-run-id-narrow-smoke',
  outputDir: '/tmp/reeditpro-smoke-narrow-guarded-runtime',
  imageTag: 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  commandResults: [
    {
      templateId: 'gst_fakesrc_fakesink_no_media_healthcheck_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: false,
      mediaOutput: false,
    },
    {
      templateId: 'gst_controlled_generated_fixture_pipeline_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: false,
      mediaOutput: false,
    },
    {
      templateId: 'mkvmerge_generated_subtitle_only_package_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: 'generated_srt_fixture_only',
      mediaOutput: 'generated_subtitle_only_mkv_fixture',
    },
    {
      templateId: 'mkvmerge_identify_generated_subtitle_only_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: 'generated_srt_fixture_only',
      mediaOutput: false,
    },
  ],
  runtimeExecution: {
    status: 'completed_controlled_generated_fixture_runtime_execution',
    dockerNetwork: 'none',
    routeExecution: 'not_run_runtime_runner_only',
    workerDispatch: 'not_run_runtime_runner_only',
    workerExecution: 'not_run_runtime_runner_only',
    gstreamerExecution: 'completed_controlled_generated_fixture_only',
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
    mediaProcessing: 'controlled_generated_fixture_only',
    privateMediaProcessing: false,
    userMediaProcessing: false,
  },
  safety: {},
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  validation: 'passed',
} satisfies GuardedRuntimeExecutionSummary

const validInput = buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime)
const validation = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(validInput)

assert.equal(validation.ok, true, validation.blockers.join(', '))
assert.equal(validation.status, 'completed_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only')
assert.equal(validation.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_DECISION)
assert.equal(validation.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV)
assert.equal(
  validation.controlledWorkerDispatchDryRunStatus,
  'ready_for_guarded_narrow_route_worker_runtime_execution_packet',
)
assert.equal(validation.sanitizedRuntimePacket.runtimeExecutionMode, 'controlled_generated_fixture_runtime_execution')
assert.equal(validation.sanitizedRuntimePacket.fixtureScope, 'generated_srt_and_generated_subtitle_only_mkv_fixture')
assert.equal(validation.sanitizedRuntimePacket.workerRuntimeMode, 'runner_invoked_guarded_runtime_no_route_dispatch')
assert.equal(validation.sanitizedRuntimePacket.runtimePacketAccepted, true)
assert.equal(validation.sanitizedRuntimePacket.nextRuntimeQaRollup, 'pending_next_milestone')
assert.deepEqual(validation.sanitizedRuntimePacket.allowedCommandTemplates, [
  ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_ALLOWED_TEMPLATES,
])
assert.equal(validation.sanitizedRuntimePacket.commandResults.length, 4)
assert.equal(validation.sanitizedRuntimePacket.routeExecution, false)
assert.equal(validation.sanitizedRuntimePacket.workerDispatch, false)
assert.equal(validation.sanitizedRuntimePacket.workerExecution, false)
assert.equal(validation.sanitizedRuntimePacket.workerProcessStart, false)
assert.equal(validation.sanitizedRuntimePacket.workerLeaseClaim, false)
assert.equal(validation.sanitizedRuntimePacket.persistentJobQueueWrite, false)
assert.equal(validation.sanitizedRuntimePacket.privateMediaProcessing, false)
assert.equal(validation.sanitizedRuntimePacket.userMediaProcessing, false)
assert.equal(validation.safety.gstreamerExecution, 'completed_controlled_generated_fixture_only')
assert.equal(validation.safety.mkvtoolnixExecution, 'completed_controlled_generated_fixture_only')
assert.equal(validation.safety.mediaProcessing, 'controlled_generated_fixture_only')
assert.equal(validation.safety.dockerExecution, 'completed_local_image_only_network_disabled_no_push_no_deploy')
assert.equal(validation.safety.workerDispatch, false)
assert.equal(validation.safety.workerExecution, false)
assert.equal(validation.safety.workerLeaseClaim, false)
assert.equal(validation.productReadyEndToEndLocalOssTools, 0)
assert.equal(validation.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_NEXT_MILESTONE)

const missingConfirmation = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime, { confirmation: false }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(
  missingConfirmation.blockers.includes('blocked_missing_narrow_controlled_worker_runtime_execution_confirmation'),
)

const invalidDryRun = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime, {
    controlledWorkerDispatchDryRunInput: buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput({
      confirmation: false,
    }),
  }),
)
assert.equal(invalidDryRun.ok, false)
assert.ok(invalidDryRun.blockers.includes('blocked_narrow_controlled_worker_dispatch_dry_run_validation_failed'))

const broadScope = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime, {
    fixtureScope: 'private_or_user_media',
  }),
)
assert.equal(broadScope.ok, false)
assert.ok(broadScope.blockers.includes('blocked_invalid_narrow_controlled_worker_runtime_execution_state'))
assert.ok(broadScope.blockers.includes('blocked_unapproved_narrow_runtime_execution_scope'))

const workerDispatchRequest = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime, {
    workerDispatchRequestedNow: true,
  }),
)
assert.equal(workerDispatchRequest.ok, false)
assert.ok(workerDispatchRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const workerLeaseRequest = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime, {
    workerLeaseClaimRequestedNow: true,
  }),
)
assert.equal(workerLeaseRequest.ok, false)
assert.ok(workerLeaseRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const failedGuardedRuntime = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput({
    ...guardedRuntime,
    commandResults: guardedRuntime.commandResults.map((result, index) =>
      index === 0 ? { ...result, ok: false, exitStatus: 1 } : result,
    ),
  }),
)
assert.equal(failedGuardedRuntime.ok, false)
assert.ok(failedGuardedRuntime.blockers.includes('blocked_guarded_runtime_execution_result_failed'))

const idempotencyMismatch = validateGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime, {
    runtimeExecutionIdempotencyKey: 'wrong-narrow-runtime-execution-key',
  }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_narrow_controlled_worker_runtime_execution_idempotency_mismatch'))

const boundary = summarizeGstreamerMkvtoolnixNarrowControlledWorkerRuntimeBoundary()
assert.ok(boundary.some((line) => line.includes('passed narrow dispatch dry-run envelope')))
assert.ok(boundary.some((line) => line.includes('Docker network disabled')))
assert.ok(boundary.some((line) => line.includes('approved generated fixture command templates only')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_narrow_controlled_worker_runtime_execution_packet',
    'guarded_runtime_generated_fixture_result_accepted',
    'allowed_command_templates_required',
    'confirmation_gate_blocks',
    'invalid_dry_run_source_blocks',
    'broad_fixture_scope_blocks',
    'worker_dispatch_and_lease_requests_block',
    'failed_guarded_runtime_result_blocks',
    'runtime_idempotency_mismatch_blocks',
    'safety_boundary_preserved',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_RUNTIME_READY_STATUS,
  nextMilestone: validation.nextMilestone,
}, null, 2))
