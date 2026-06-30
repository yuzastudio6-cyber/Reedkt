import assert from 'node:assert/strict'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_READY_STATUS,
  buildGstreamerMkvtoolnixAgentControlledDispatchInput,
  summarizeGstreamerMkvtoolnixAgentControlledDispatchBoundary,
  validateGstreamerMkvtoolnixAgentControlledDispatchInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS,
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1'

const validInput = buildGstreamerMkvtoolnixAgentControlledDispatchInput()
const valid = validateGstreamerMkvtoolnixAgentControlledDispatchInput(validInput)

assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.status, 'accepted_controlled_dispatch_metadata_only')
assert.equal(valid.decision, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_DECISION)
assert.equal(valid.confirmationGate, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV)
assert.equal(valid.confirmationRequired, true)
assert.equal(valid.bridgeStatus, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS)
assert.equal(valid.sanitizedDispatch.controlledDispatchAccepted, true)
assert.equal(valid.sanitizedDispatch.queueIntegration, 'pending_next_milestone')
assert.equal(valid.sanitizedDispatch.dispatchMode, 'metadata_only_controlled_dispatch')
assert.equal(valid.sanitizedDispatch.dispatchId, 'dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1')
assert.equal(valid.sanitizedDispatch.dispatchIdempotencyKey, validInput.dispatchIdempotencyKey)
assert.equal(valid.sanitizedDispatch.externalAgentRequestId, 'external-agent-request-gstreamer-mkvtoolnix-controlled-dispatch-1')
assert.equal(valid.safety.routeExecution, false)
assert.equal(valid.safety.workerDispatch, false)
assert.equal(valid.safety.workerExecution, false)
assert.equal(valid.safety.gstreamerExecutionInThisDispatch, false)
assert.equal(valid.safety.mkvtoolnixExecutionInThisDispatch, false)
assert.equal(valid.safety.mediaProcessing, false)
assert.equal(valid.safety.supabaseMutation, false)
assert.equal(valid.safety.sqlExecution, false)
assert.equal(valid.safety.signedUrlCreation, false)
assert.equal(valid.safety.publicArtifactCreation, false)
assert.equal(valid.safety.finalRenderExport, false)
assert.equal(valid.safety.productionUnlock, false)
assert.equal(valid.nextMilestone, RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_NEXT_MILESTONE)

const missingConfirmation = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({ confirmation: false }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(missingConfirmation.blockers.includes('blocked_missing_controlled_dispatch_confirmation'))

const invalidBridge = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({
    bridgeInput: buildGstreamerMkvtoolnixAgentExecutionBridgeInput({ approvedSnapshotStatus: 'draft' }),
  }),
)
assert.equal(invalidBridge.ok, false)
assert.ok(invalidBridge.blockers.includes('blocked_bridge_validation_failed'))

const rawCommandBridge = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({
    bridgeInput: buildGstreamerMkvtoolnixAgentExecutionBridgeInput({
      rawCommandString: 'mkvmerge -o output.mkv input.mp4',
    }),
  }),
)
assert.equal(rawCommandBridge.ok, false)
assert.ok(rawCommandBridge.blockers.includes('blocked_bridge_validation_failed'))

const invalidMode = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({ dispatchMode: 'runtime_worker_dispatch' }),
)
assert.equal(invalidMode.ok, false)
assert.ok(invalidMode.blockers.includes('blocked_invalid_controlled_dispatch_state'))

const idempotencyMismatch = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({ dispatchIdempotencyKey: 'wrong-idempotency-key' }),
)
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_controlled_dispatch_idempotency_mismatch'))

const runtimeRequest = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({ workerDispatchRequestedNow: true }),
)
assert.equal(runtimeRequest.ok, false)
assert.ok(runtimeRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const toolRequest = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({ gstreamerExecutionRequestedNow: true }),
)
assert.equal(toolRequest.ok, false)
assert.ok(toolRequest.blockers.includes('blocked_runtime_execution_not_enabled'))

const missingDispatchRef = validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  buildGstreamerMkvtoolnixAgentControlledDispatchInput({ dispatchId: '' }),
)
assert.equal(missingDispatchRef.ok, false)
assert.ok(missingDispatchRef.blockers.includes('blocked_missing_controlled_dispatch_reference'))

const boundary = summarizeGstreamerMkvtoolnixAgentControlledDispatchBoundary()
assert.ok(boundary.some((line) => line.includes('bridge-validated structured refs')))
assert.ok(boundary.some((line) => line.includes('does not execute a route')))
assert.ok(boundary.some((line) => line.includes('controlled worker queue boundary')))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_controlled_dispatch_metadata_boundary',
    'confirmation_gate_blocks',
    'invalid_bridge_blocks',
    'raw_command_bridge_blocks',
    'invalid_dispatch_mode_blocks',
    'dispatch_idempotency_mismatch_blocks',
    'runtime_dispatch_and_tool_execution_requests_block',
    'missing_dispatch_refs_block',
    'safety_flags_remain_false',
  ],
  readyStatus: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_READY_STATUS,
  confirmationGate: valid.confirmationGate,
  nextMilestone: valid.nextMilestone,
}, null, 2))
