import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledLiveRegistrationContractInput,
  validateGpacMp4boxDisabledLiveRegistrationContractInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-live-registration-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledLiveRegistrationContractInput({ createdAt })

const baselineResult = validateGpacMp4boxDisabledLiveRegistrationContractInput(baseline)
assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.registrationStatus, 'disabled_live_registration_contract_registered_no_handler')
assert.equal(baselineResult.contractId, 'liveRegistration.gpacMp4box.disabled')
assert.equal(baselineResult.sanitizedRegistration.routeRegistrationMode, 'disabled_metadata_contract_only')
assert.equal(baselineResult.sanitizedRegistration.liveHandlerRegistered, false)
assert.equal(baselineResult.sanitizedRegistration.liveHandlerEnabled, false)
assert.equal(baselineResult.sanitizedRegistration.featureFlagDefault, false)
assert.equal(baselineResult.sanitizedRegistration.runtimeExecutionApproved, false)
assert.equal(baselineResult.sanitizedRegistration.routeExecution, false)
assert.equal(baselineResult.sanitizedRegistration.workerDispatch, false)
assert.equal(baselineResult.sanitizedRegistration.workerExecution, false)
assert.equal(baselineResult.sanitizedRegistration.gpacMp4boxExecution, false)
assert.equal(baselineResult.sanitizedRegistration.storageTransfer, false)
assert.equal(baselineResult.sanitizedRegistration.signedUrlCreation, false)
assert.equal(baselineResult.sanitizedRegistration.publicArtifactCreation, false)
assert.equal(baselineResult.nextRequiredGate, 'TRACKA-GPAC-MP4BOX-LIVE-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1')

const liveHandlerAttempt = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  liveHandlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(liveHandlerAttempt.ok, false)
assert.ok(liveHandlerAttempt.blockers.includes('blocked_live_handler_registered'))

const featureFlagAttempt = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const routeExecutionAttempt = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    routeExecution: true,
  },
} as unknown as typeof baseline)
assert.equal(routeExecutionAttempt.ok, false)
assert.ok(routeExecutionAttempt.blockers.includes('blocked_runtime_execution_attempt'))

const storageAttempt = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    signedUrlCreation: true,
  },
} as unknown as typeof baseline)
assert.equal(storageAttempt.ok, false)
assert.ok(storageAttempt.blockers.includes('blocked_storage_or_public_artifact_attempt'))

const missingGuardAttempt = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  approvedSnapshotGuardRef: {
    ...baseline.approvedSnapshotGuardRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingGuardAttempt.ok, false)
assert.ok(missingGuardAttempt.blockers.includes('blocked_missing_approved_snapshot_guard'))

const rejectedInputAttempt = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  rejectedInputs: {
    ...baseline.rejectedInputs,
    rawCommandString: true,
  },
} as unknown as typeof baseline)
assert.equal(rejectedInputAttempt.ok, false)
assert.ok(rejectedInputAttempt.blockers.includes('blocked_rejected_input_present'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'disabled_live_registration_contract_validates',
    'live_handler_registration_blocks',
    'feature_flag_enablement_blocks',
    'route_execution_blocks',
    'signed_public_artifact_attempt_blocks',
    'missing_approved_snapshot_guard_blocks',
    'raw_command_input_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  registrationStatus: baselineResult.registrationStatus,
  nextRequiredGate: baselineResult.nextRequiredGate,
}, null, 2))
