import assert from 'node:assert/strict'

import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_QA_MERGE_SHA,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_READY_STATUS,
  buildThreeToolExternalAgentExecutionBridgeInput,
  summarizeThreeToolExternalAgentExecutionBridgeBoundary,
  validateThreeToolExternalAgentExecutionBridgeInput,
} from '../services/tracka-three-tool-external-agent-execution-bridge-1'

const valid = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput(),
)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_READY_STATUS)
assert.equal(valid.confirmationGate, TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV)
assert.equal(valid.confirmationRequiredForFutureDryRun, true)
assert.equal(valid.directRuntimeExecutionInThisBridge, false)
assert.equal(valid.activeNativeContainerToolLaneCount, 3)
assert.equal(valid.sanitizedRequest.combinedExecutionQaMergeSha, TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_QA_MERGE_SHA)
assert.equal(valid.safety.routeExecution, false)
assert.equal(valid.safety.workerDispatch, false)
assert.equal(valid.safety.workerExecution, false)
assert.equal(valid.safety.gstreamerExecutionInThisBridge, false)
assert.equal(valid.safety.mkvtoolnixExecutionInThisBridge, false)
assert.equal(valid.safety.gpacMp4boxExecutionInThisBridge, false)
assert.equal(valid.safety.dockerExecutionInThisBridge, false)
assert.equal(valid.safety.privateMediaProcessing, false)
assert.equal(valid.safety.supabaseMutation, false)
assert.equal(valid.safety.sqlExecution, false)
assert.equal(valid.childRouteBridges.gstreamerMkvtoolnix.routePath, '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute')
assert.equal(valid.childRouteBridges.gstreamerMkvtoolnix.commandTemplates.length, 4)
assert.equal(valid.childRouteBridges.gpacMp4box.routePath, '/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute')
assert.equal(valid.childRouteBridges.gpacMp4box.commandTemplates.length, 2)
assert.equal(valid.nextMilestone, TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE)

const missingSnapshot = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({ approvedSnapshotId: '' }),
)
assert.equal(missingSnapshot.ok, false)
assert.ok(missingSnapshot.blockers.includes('blocked_missing_three_tool_external_agent_execution_bridge_reference'))

const invalidSnapshotState = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({ approvedSnapshotStatus: 'draft' }),
)
assert.equal(invalidSnapshotState.ok, false)
assert.ok(invalidSnapshotState.blockers.includes('blocked_invalid_three_tool_external_agent_execution_bridge_state'))

const wrongEvidence = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({ combinedExecutionRunId: 'wrong-run-id' }),
)
assert.equal(wrongEvidence.ok, false)
assert.ok(wrongEvidence.blockers.includes('blocked_invalid_three_tool_external_agent_execution_bridge_state'))

const unapprovedTemplate = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({
    gpacMp4boxCommandTemplates: ['MP4Box -raw-command'],
  }),
)
assert.equal(unapprovedTemplate.ok, false)
assert.ok(unapprovedTemplate.blockers.includes('blocked_unapproved_three_tool_external_agent_command_template'))

const rawCommand = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({ rawCommandString: 'docker run arbitrary-tool' }),
)
assert.equal(rawCommand.ok, false)
assert.ok(rawCommand.blockers.includes('blocked_unsupported_three_tool_external_agent_input'))

const publicUrl = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({ publicUrlSourceOfTruth: 'https://example.invalid/input.mp4' }),
)
assert.equal(publicUrl.ok, false)
assert.ok(publicUrl.blockers.includes('blocked_unsupported_three_tool_external_agent_input'))

const unsafeExecution = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({ gstreamerExecutionRequestedNow: true }),
)
assert.equal(unsafeExecution.ok, false)
assert.ok(unsafeExecution.blockers.includes('blocked_unsafe_three_tool_external_agent_execution_bridge_request'))

const unsafeDispatch = validateThreeToolExternalAgentExecutionBridgeInput(
  buildThreeToolExternalAgentExecutionBridgeInput({ workerDispatchRequestedNow: true }),
)
assert.equal(unsafeDispatch.ok, false)
assert.ok(unsafeDispatch.blockers.includes('blocked_unsafe_three_tool_external_agent_execution_bridge_request'))

const boundary = summarizeThreeToolExternalAgentExecutionBridgeBoundary()
assert.ok(boundary.some((line) => line.includes('structured three-tool generated-fixture bridge envelopes')))
assert.ok(boundary.some((line) => line.includes('composes the existing GStreamer/MKVToolNix and GPAC/MP4Box')))
assert.ok(boundary.some((line) => line.includes('performs no route execution')))
assert.ok(boundary.some((line) => line.includes('separate confirmation-gated bridge dry run')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_three_tool_bridge_input_ready_for_dry_run',
    'missing_refs_block',
    'invalid_state_blocks',
    'runtime_evidence_mismatch_blocks',
    'unapproved_templates_block',
    'raw_command_and_public_url_block',
    'tool_execution_and_worker_dispatch_requests_block',
    'child_bridge_routes_and_template_allowlists_present',
    'safety_flags_remain_false',
  ],
  confirmationGate: valid.confirmationGate,
  nextMilestone: valid.nextMilestone,
}, null, 2))
