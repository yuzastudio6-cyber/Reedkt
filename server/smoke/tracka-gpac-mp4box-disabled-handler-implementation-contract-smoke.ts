import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledHandlerImplementationContractInput,
  validateGpacMp4boxDisabledHandlerImplementationContractInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-handler-implementation-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledHandlerImplementationContractInput({ createdAt })
const baselineResult = validateGpacMp4boxDisabledHandlerImplementationContractInput(baseline)

assert.equal(baselineResult.ok, true)
assert.equal(baselineResult.contractStatus, 'disabled_handler_implementation_contract_registered_no_executable_handler')
assert.equal(baselineResult.sanitizedContract.routeExecution, false)
assert.equal(baselineResult.sanitizedContract.workerExecution, false)
assert.equal(baselineResult.sanitizedContract.gpacMp4boxExecution, false)

const reviewDriftAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  guardedHandlerImplementationReviewRef: {
    ...baseline.guardedHandlerImplementationReviewRef,
    decision: 'wrong',
  },
} as unknown as typeof baseline)
assert.equal(reviewDriftAttempt.ok, false)
assert.ok(reviewDriftAttempt.blockers.includes('blocked_guarded_handler_implementation_review_invalid'))

const handlerRegistrationAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  handlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(handlerRegistrationAttempt.ok, false)
assert.ok(handlerRegistrationAttempt.blockers.includes('blocked_handler_implementation_not_disabled'))

const handlerImplementationAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  handlerImplemented: true,
} as unknown as typeof baseline)
assert.equal(handlerImplementationAttempt.ok, false)
assert.ok(handlerImplementationAttempt.blockers.includes('blocked_handler_implementation_not_disabled'))

const featureFlagAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const routeAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    routeExecution: true,
  },
} as unknown as typeof baseline)
assert.equal(routeAttempt.ok, false)
assert.ok(routeAttempt.blockers.includes('blocked_runtime_execution_attempt'))

const toolAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    gpacMp4boxExecution: true,
  },
} as unknown as typeof baseline)
assert.equal(toolAttempt.ok, false)
assert.ok(toolAttempt.blockers.includes('blocked_runtime_execution_attempt'))

const signedArtifactAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    signedUrlCreation: true,
  },
} as unknown as typeof baseline)
assert.equal(signedArtifactAttempt.ok, false)
assert.ok(signedArtifactAttempt.blockers.includes('blocked_storage_or_public_artifact_attempt'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'disabled_handler_implementation_contract_validates',
    'guarded_handler_implementation_review_drift_blocks',
    'executable_handler_registration_blocks',
    'handler_implementation_enablement_blocks',
    'feature_flag_enablement_blocks',
    'route_execution_blocks',
    'gpac_mp4box_execution_blocks',
    'signed_artifact_creation_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  contractId: baseline.contractId,
  routeId: baseline.routeId,
  currentRequiredGate: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-IMPLEMENTATION-CONTRACT-1',
  nextPrompt: 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-CONTRACT-NEGATIVE-TESTS-1',
}, null, 2))
