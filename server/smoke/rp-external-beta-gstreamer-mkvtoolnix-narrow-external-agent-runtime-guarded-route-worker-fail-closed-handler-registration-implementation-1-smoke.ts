import assert from 'node:assert/strict'

import {
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput,
  createGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationDisabledResponse,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_DECISION,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_EXECUTION,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE,
  summarizeGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationBoundary,
  validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput,
} from '../routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-handler-registration-source'

const valid = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(),
)

assert.equal(valid.ok, true)
assert.equal(valid.status, 'accepted_fail_closed_handler_registration_source_metadata')
assert.equal(valid.decision, GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_DECISION)
assert.equal(valid.execution, GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_EXECUTION)
assert.equal(valid.sanitizedRegistration.handlerContractAccepted, true)
assert.equal(valid.sanitizedRegistration.handlerRuntimeRegistration, false)
assert.equal(valid.sanitizedRegistration.routeExecution, false)
assert.equal(valid.sanitizedRegistration.workerDispatch, false)
assert.equal(valid.sanitizedRegistration.gstreamerExecution, false)
assert.equal(valid.sanitizedRegistration.mkvtoolnixExecution, false)
assert.equal(valid.productReadyEndToEndLocalOssTools, 0)
assert.equal(valid.nextMilestone, GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE)

const disabledResponse = createGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationDisabledResponse(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(),
)
assert.equal(disabledResponse.handlerRuntimeRegistration, false)
assert.equal(disabledResponse.routeExecution, false)
assert.equal(disabledResponse.workerDispatch, false)
assert.equal(disabledResponse.toolExecution, false)

const missingConfirmation = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput({ confirmation: false }),
)
assert.equal(missingConfirmation.ok, false)
assert.ok(missingConfirmation.blockers.includes('blocked_missing_registration_confirmation'))

const badContract = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput({ handlerContractId: 'wrong-contract' }),
)
assert.equal(badContract.ok, false)
assert.ok(badContract.blockers.includes('blocked_invalid_handler_contract_reference'))

const runtimeAttempt = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput({
    handlerRuntimeRegistration: true,
    routeExecution: true,
    workerDispatch: true,
    gstreamerExecution: true,
  }),
)
assert.equal(runtimeAttempt.ok, false)
assert.ok(runtimeAttempt.blockers.includes('blocked_runtime_handler_registration_not_enabled'))
assert.ok(runtimeAttempt.blockers.includes('blocked_route_worker_or_tool_execution_not_enabled'))

const publicArtifactAttempt = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput({ publicArtifactCreation: true }),
)
assert.equal(publicArtifactAttempt.ok, false)
assert.ok(publicArtifactAttempt.blockers.includes('blocked_public_or_signed_artifact_attempt'))

const unlockAttempt = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput({ productionUnlock: true }),
)
assert.equal(unlockAttempt.ok, false)
assert.ok(unlockAttempt.blockers.includes('blocked_delivery_or_unlock_attempt'))

const summary = summarizeGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationBoundary()
assert.ok(summary.some((line) => line.includes('no handler is registered at runtime')))
assert.ok(summary.some((line) => line.includes('Rejects runtime handler registration')))

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        'valid_fail_closed_handler_registration_source_metadata',
        'disabled_response_shape',
        'missing_confirmation_blocks',
        'invalid_handler_contract_blocks',
        'runtime_attempt_blocks',
        'public_artifact_attempt_blocks',
        'unlock_attempt_blocks',
      ],
      nextMilestone: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE,
    },
    null,
    2,
  ),
)
