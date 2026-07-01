import assert from 'node:assert/strict'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_MERGE_SHA,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_RUN_ID,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_HANDOFF_MERGE_SHA,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput,
  summarizeGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeBoundary,
  validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1'

const valid = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(),
)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS)
assert.equal(valid.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DECISION)
assert.equal(valid.validationMode, 'backend_source_reference_validation_only')
assert.equal(valid.sanitizedBridge.dryRunRunId, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_RUN_ID)
assert.equal(valid.sanitizedBridge.dryRunMergeSha, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_MERGE_SHA)
assert.equal(valid.sanitizedBridge.handoffMergeSha, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_HANDOFF_MERGE_SHA)
assert.equal(valid.sanitizedBridge.bridgeAccepted, true)
assert.equal(valid.sanitizedBridge.dockerNetwork, 'none')
assert.equal(valid.sanitizedBridge.routeExecution, false)
assert.equal(valid.sanitizedBridge.workerDispatch, false)
assert.equal(valid.sanitizedBridge.workerExecution, false)
assert.equal(valid.sanitizedBridge.gstreamerExecution, false)
assert.equal(valid.sanitizedBridge.mkvtoolnixExecution, false)
assert.equal(valid.sanitizedBridge.mediaProcessing, false)
assert.equal(valid.sanitizedBridge.finalRenderExport, false)
assert.equal(valid.safety.liveHttpRouteExecution, false)
assert.equal(valid.safety.externalAgentRuntimeExecution, false)
assert.equal(valid.safety.realWorkerDispatch, false)
assert.equal(valid.safety.workerProcessStarted, false)
assert.equal(valid.safety.workerLeaseClaim, false)
assert.equal(valid.safety.persistentJobQueueWrite, false)
assert.equal(valid.safety.gstreamerExecution, false)
assert.equal(valid.safety.mkvtoolnixExecution, false)
assert.equal(valid.safety.dockerExecution, false)
assert.equal(valid.safety.ffmpegFfprobeExecution, false)
assert.equal(valid.safety.supabaseMutation, false)
assert.equal(valid.safety.sqlExecution, false)
assert.equal(valid.safety.publicArtifactCreation, false)
assert.equal(valid.productReadyEndToEndLocalOssTools, 0)
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE)

for (const commandTemplateId of RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES) {
  const result = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
    buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ commandTemplateId }),
  )
  assert.equal(result.ok, true, `template should be accepted: ${commandTemplateId}`)
}

const missingSnapshot = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ approvedSnapshotId: '' }),
)
assert.equal(missingSnapshot.ok, false)
assert.ok(missingSnapshot.blockers.includes('blocked_missing_narrow_external_agent_runtime_bridge_reference'))

const wrongDryRunEvidence = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ dryRunRunId: 'wrong-run-id' }),
)
assert.equal(wrongDryRunEvidence.ok, false)
assert.ok(wrongDryRunEvidence.blockers.includes('blocked_narrow_external_agent_runtime_source_evidence_mismatch'))

const wrongNetwork = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ dockerNetwork: 'bridge' }),
)
assert.equal(wrongNetwork.ok, false)
assert.ok(wrongNetwork.blockers.includes('blocked_narrow_external_agent_runtime_source_evidence_mismatch'))

const unapprovedTemplate = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ commandTemplateId: 'gst-launch-raw-command' }),
)
assert.equal(unapprovedTemplate.ok, false)
assert.ok(unapprovedTemplate.blockers.includes('blocked_unapproved_narrow_external_agent_runtime_command_template'))

const rawCommand = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ rawCommand: 'gst-launch-1.0 arbitrary ! fakesink' }),
)
assert.equal(rawCommand.ok, false)
assert.ok(rawCommand.blockers.includes('blocked_unsupported_narrow_external_agent_runtime_input'))

const publicUrl = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ publicUrl: 'https://example.invalid/input.mp4' }),
)
assert.equal(publicUrl.ok, false)
assert.ok(publicUrl.blockers.includes('blocked_unsupported_narrow_external_agent_runtime_input'))

const routeRequest = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ routeExecutionRequest: true }),
)
assert.equal(routeRequest.ok, false)
assert.ok(routeRequest.blockers.includes('blocked_unsafe_narrow_external_agent_runtime_bridge_request'))

const workerDispatchRequest = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ workerDispatchRequest: true }),
)
assert.equal(workerDispatchRequest.ok, false)
assert.ok(workerDispatchRequest.blockers.includes('blocked_unsafe_narrow_external_agent_runtime_bridge_request'))

const toolExecutionRequest = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ gstreamerExecutionRequest: true }),
)
assert.equal(toolExecutionRequest.ok, false)
assert.ok(toolExecutionRequest.blockers.includes('blocked_unsafe_narrow_external_agent_runtime_bridge_request'))

const supabaseRequest = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ supabaseMutationRequest: true }),
)
assert.equal(supabaseRequest.ok, false)
assert.ok(supabaseRequest.blockers.includes('blocked_unsafe_narrow_external_agent_runtime_bridge_request'))

const finalExportRequest = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput({ finalRenderExportRequest: true }),
)
assert.equal(finalExportRequest.ok, false)
assert.ok(finalExportRequest.blockers.includes('blocked_unsafe_narrow_external_agent_runtime_bridge_request'))

const boundary = summarizeGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeBoundary()
assert.ok(boundary.some((line) => line.includes('exact source-derived handoff and dry-run references')))
assert.ok(boundary.some((line) => line.includes('does not execute an HTTP route')))
assert.ok(boundary.some((line) => line.includes('Raw commands')))
assert.ok(boundary.some((line) => line.includes('bridge QA rollup')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_narrow_external_agent_runtime_bridge_reference_validation',
    'all_allowed_command_templates_accept',
    'missing_reference_blocks',
    'source_evidence_mismatch_blocks',
    'unapproved_template_blocks',
    'raw_command_and_public_url_block',
    'route_worker_tool_supabase_and_export_requests_block',
    'safety_flags_remain_false',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS,
  dryRunRunId: valid.sanitizedBridge.dryRunRunId,
  nextMilestone: valid.nextMilestone,
}, null, 2))
