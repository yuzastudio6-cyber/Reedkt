import assert from 'node:assert/strict'
import {
  buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput,
  type GuardedRuntimeExecutionSummary,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput,
  createGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationResponse,
  summarizeGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationBoundary,
  validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1'

const guardedRuntime = {
  packet: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1',
  decision: 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
  execution: 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only',
  runId: 'guarded-runtime-run-id-narrow-integration-implementation-smoke',
  outputDir: '/tmp/reeditpro-smoke-narrow-runtime-integration-implementation',
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

const validInput = buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime)
const validation = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(validInput)

assert.equal(validation.ok, true, validation.blockers.join(', '))
assert.equal(validation.status, 'completed_narrow_controlled_worker_runtime_integration_implementation_source_envelope')
assert.equal(validation.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_DECISION)
assert.equal(validation.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_CONFIRM_ENV)
assert.equal(validation.confirmationRequired, true)
assert.equal(validation.controlledWorkerRuntimeStatus, 'ready_for_guarded_narrow_route_worker_runtime_qa_rollup')
assert.equal(validation.sanitizedIntegrationImplementation.runtimeIntegrationMode, 'metadata_only_generated_fixture_source_envelope')
assert.equal(validation.sanitizedIntegrationImplementation.routeBindingMode, 'deferred_no_route_registration')
assert.equal(validation.sanitizedIntegrationImplementation.workerDispatchMode, 'deferred_no_worker_dispatch')
assert.equal(validation.sanitizedIntegrationImplementation.workerLeaseMode, 'deferred_no_worker_lease_claim')
assert.equal(validation.sanitizedIntegrationImplementation.generatedFixtureEvidenceAccepted, true)
assert.equal(validation.sanitizedIntegrationImplementation.routeRegisteredAtRuntime, false)
assert.equal(validation.sanitizedIntegrationImplementation.productionRouteFileCreated, false)
assert.equal(validation.sanitizedIntegrationImplementation.routeExecution, false)
assert.equal(validation.sanitizedIntegrationImplementation.workerDispatch, false)
assert.equal(validation.sanitizedIntegrationImplementation.workerExecution, false)
assert.equal(validation.sanitizedIntegrationImplementation.workerProcessStart, false)
assert.equal(validation.sanitizedIntegrationImplementation.workerLeaseClaim, false)
assert.equal(validation.sanitizedIntegrationImplementation.persistentJobQueueWrite, false)
assert.equal(validation.sanitizedIntegrationImplementation.gstreamerExecutionInThisImplementation, false)
assert.equal(validation.sanitizedIntegrationImplementation.mkvtoolnixExecutionInThisImplementation, false)
assert.equal(validation.sanitizedIntegrationImplementation.dockerExecutionInThisImplementation, false)
assert.equal(validation.sanitizedIntegrationImplementation.ffmpegFfprobeExecutionInThisImplementation, false)
assert.equal(validation.sanitizedIntegrationImplementation.supabaseMutation, false)
assert.equal(validation.sanitizedIntegrationImplementation.sqlExecution, false)
assert.equal(validation.safety.publicArtifactCreation, false)
assert.equal(validation.safety.finalRenderExport, false)
assert.equal(validation.productReadyEndToEndLocalOssTools, 0)
assert.equal(validation.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_NEXT_MILESTONE)
assert.equal(validation.responseShape.status, 'accepted_narrow_runtime_integration_source_envelope')
assert.equal(validation.responseShape.runtimeEnabled, false)
assert.equal(validation.responseShape.routeExecution, false)
assert.equal(validation.responseShape.workerDispatch, false)
assert.equal(validation.responseShape.workerExecution, false)
assert.equal(validation.responseShape.toolExecution, false)

const response = createGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationResponse(validInput)
assert.deepEqual(response, validation.responseShape)

const missingConfirmation = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(
  buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime, {
    confirmation: false,
  }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(
  missingConfirmation.blockers.includes('blocked_missing_narrow_runtime_integration_implementation_confirmation'),
)

const invalidRuntimePacket = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(
  buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime, {
    controlledWorkerRuntimeInput: buildGstreamerMkvtoolnixNarrowControlledWorkerRuntimeInput(guardedRuntime, {
      confirmation: false,
    }),
  }),
)
assert.equal(invalidRuntimePacket.ok, false)
assert.ok(invalidRuntimePacket.blockers.includes('blocked_narrow_controlled_worker_runtime_packet_validation_failed'))

const invalidIntegrationMode = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(
  buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime, {
    runtimeIntegrationMode: 'route_worker_runtime_integration',
  }),
)
assert.equal(invalidIntegrationMode.ok, false)
assert.ok(invalidIntegrationMode.blockers.includes('blocked_invalid_narrow_runtime_integration_implementation_state'))

const missingQaSource = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(
  buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime, {
    sourceQaStatus: 'pending',
  }),
)
assert.equal(missingQaSource.ok, false)
assert.ok(missingQaSource.blockers.includes('blocked_missing_narrow_runtime_integration_packet_qa_source'))

const idempotencyMismatch = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(
  buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime, {
    runtimeIntegrationImplementationIdempotencyKey: 'wrong-narrow-runtime-integration-implementation-key',
  }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(
  idempotencyMismatch.blockers.includes(
    'blocked_narrow_runtime_integration_implementation_idempotency_mismatch',
  ),
)

for (const unsafeOverride of [
  { routeExecutionRequestedNow: true },
  { routeRegistrationRequestedNow: true },
  { workerDispatchRequestedNow: true },
  { workerExecutionRequestedNow: true },
  { workerProcessStartRequestedNow: true },
  { workerLeaseClaimRequestedNow: true },
  { persistentJobQueueWriteRequestedNow: true },
  { gstreamerExecutionRequestedNow: true },
  { mkvtoolnixExecutionRequestedNow: true },
  { dockerExecutionRequestedNow: true },
  { ffmpegFfprobeExecutionRequestedNow: true },
  { privateMediaProcessingRequestedNow: true },
  { supabaseMutationRequestedNow: true },
  { sqlExecutionRequestedNow: true },
  { publicArtifactRequestedNow: true },
  { finalRenderExportRequestedNow: true },
] satisfies Partial<Parameters<typeof buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput>[1]>[]) {
  const result = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(
    buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime, unsafeOverride),
  )
  assert.equal(result.ok, false, JSON.stringify(unsafeOverride))
  assert.ok(
    result.blockers.includes('blocked_route_worker_or_tool_execution_not_enabled'),
    JSON.stringify(unsafeOverride),
  )
}

const summary = summarizeGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationBoundary()
assert.ok(summary.some((line) => line.includes('metadata-only source envelope')))
assert.ok(summary.some((line) => line.includes('registers no runtime route')))
assert.ok(summary.some((line) => line.includes('no tool execution occurs in this implementation phase')))
assert.ok(summary.some((line) => line.includes(RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_CONFIRM_ENV)))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_narrow_runtime_integration_implementation_source_envelope',
    'response_shape_remains_runtime_disabled',
    'missing_confirmation_blocks',
    'invalid_runtime_packet_blocks',
    'invalid_integration_mode_blocks',
    'missing_qa_source_blocks',
    'idempotency_mismatch_blocks',
    'route_worker_tool_media_supabase_sql_unlock_requests_block',
    'safety_flags_remain_false_for_this_implementation',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_RUNTIME_INTEGRATION_IMPLEMENTATION_READY_STATUS,
  nextMilestone: validation.nextMilestone,
}, null, 2))
