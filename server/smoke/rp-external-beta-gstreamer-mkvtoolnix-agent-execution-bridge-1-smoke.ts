import assert from 'node:assert/strict'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID,
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput,
  summarizeGstreamerMkvtoolnixAgentExecutionBridgeBoundary,
  validateGstreamerMkvtoolnixAgentExecutionBridgeInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1'

const valid = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput(),
)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS)
assert.equal(valid.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV)
assert.equal(valid.confirmationRequiredForFutureDryRun, true)
assert.equal(valid.directRuntimeExecutionInThisBridge, false)
assert.equal(valid.sanitizedRequest.runtimeExecutionRunId, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID)
assert.equal(valid.sanitizedRequest.runtimeExecutionMergeSha, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA)
assert.equal(valid.sanitizedRequest.commandTemplateId, 'gst_controlled_generated_fixture_pipeline_v1')
assert.equal(valid.safety.routeExecution, false)
assert.equal(valid.safety.workerDispatch, false)
assert.equal(valid.safety.workerExecution, false)
assert.equal(valid.safety.gstreamerExecutionInThisBridge, false)
assert.equal(valid.safety.mkvtoolnixExecutionInThisBridge, false)
assert.equal(valid.safety.privateMediaProcessing, false)
assert.equal(valid.safety.supabaseMutation, false)
assert.equal(valid.safety.sqlExecution, false)
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE)

const missingSnapshot = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ approvedSnapshotId: '' }),
)
assert.equal(missingSnapshot.ok, false)
assert.ok(missingSnapshot.blockers.includes('blocked_missing_agent_execution_bridge_reference'))

const invalidSnapshotState = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ approvedSnapshotStatus: 'draft' }),
)
assert.equal(invalidSnapshotState.ok, false)
assert.ok(invalidSnapshotState.blockers.includes('blocked_invalid_agent_execution_bridge_state'))

const unapprovedTemplate = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ commandTemplateId: 'gst-launch-raw-command' }),
)
assert.equal(unapprovedTemplate.ok, false)
assert.ok(unapprovedTemplate.blockers.includes('blocked_unapproved_command_template'))

const rawCommand = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ rawCommandString: 'gst-launch-1.0 videotestsrc ! fakesink' }),
)
assert.equal(rawCommand.ok, false)
assert.ok(rawCommand.blockers.includes('blocked_unsupported_external_agent_input'))

const publicUrl = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ publicUrlSourceOfTruth: 'https://example.test/input.mp4' }),
)
assert.equal(publicUrl.ok, false)
assert.ok(publicUrl.blockers.includes('blocked_unsupported_external_agent_input'))

const unsafeDispatch = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ workerDispatchRequestedNow: true }),
)
assert.equal(unsafeDispatch.ok, false)
assert.ok(unsafeDispatch.blockers.includes('blocked_unsafe_agent_execution_bridge_request'))

const unsafeToolExecution = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ gstreamerExecutionRequestedNow: true }),
)
assert.equal(unsafeToolExecution.ok, false)
assert.ok(unsafeToolExecution.blockers.includes('blocked_unsafe_agent_execution_bridge_request'))

const wrongRuntimeEvidence = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ runtimeExecutionRunId: 'wrong-run-id' }),
)
assert.equal(wrongRuntimeEvidence.ok, false)
assert.ok(wrongRuntimeEvidence.blockers.includes('blocked_invalid_agent_execution_bridge_state'))

const boundary = summarizeGstreamerMkvtoolnixAgentExecutionBridgeBoundary()
assert.ok(boundary.some((line) => line.includes('External agents may submit only structured')))
assert.ok(boundary.some((line) => line.includes('rejects raw commands')))
assert.ok(boundary.some((line) => line.includes('separate confirmation-gated bridge dry run')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_bridge_input_ready_for_confirmation_gated_dry_run',
    'missing_refs_block',
    'invalid_state_blocks',
    'unapproved_template_blocks',
    'raw_command_and_public_url_block',
    'dispatch_and_tool_execution_requests_block',
    'runtime_evidence_mismatch_blocks',
    'safety_flags_remain_false',
  ],
  confirmationGate: valid.confirmationGate,
  nextMilestone: valid.nextMilestone,
}, null, 2))
