import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledHandlerRegistrationContractInput,
  validateGpacMp4boxDisabledHandlerRegistrationContractInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-handler-registration-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledHandlerRegistrationContractInput({ createdAt })

const baselineResult = validateGpacMp4boxDisabledHandlerRegistrationContractInput(baseline)
assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.registrationStatus, 'disabled_handler_registration_contract_registered_no_executable_handler')
assert.equal(baselineResult.contractId, 'handlerRegistration.gpacMp4box.disabled')
assert.equal(baselineResult.sanitizedRegistration.handlerRegistrationMode, 'disabled_handler_registration_metadata_contract_only')
assert.equal(baselineResult.sanitizedRegistration.handlerRegistered, false)
assert.equal(baselineResult.sanitizedRegistration.handlerEnabled, false)
assert.equal(baselineResult.sanitizedRegistration.featureFlagDefault, false)
assert.equal(baselineResult.sanitizedRegistration.runtimeExecutionApproved, false)
assert.equal(baselineResult.sanitizedRegistration.executableHandlerRegistration, false)
assert.equal(baselineResult.sanitizedRegistration.routeExecution, false)
assert.equal(baselineResult.sanitizedRegistration.workerDispatch, false)
assert.equal(baselineResult.sanitizedRegistration.workerExecution, false)
assert.equal(baselineResult.sanitizedRegistration.gpacMp4boxExecution, false)
assert.equal(baselineResult.sanitizedRegistration.storageTransfer, false)
assert.equal(baselineResult.sanitizedRegistration.signedUrlCreation, false)
assert.equal(baselineResult.sanitizedRegistration.publicArtifactCreation, false)
assert.equal(baselineResult.nextRequiredGate, 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1')

const handlerAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  handlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(handlerAttempt.ok, false)
assert.ok(handlerAttempt.blockers.includes('blocked_executable_handler_registered'))

const featureFlagAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const routeExecutionAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    routeExecution: true,
  },
} as unknown as typeof baseline)
assert.equal(routeExecutionAttempt.ok, false)
assert.ok(routeExecutionAttempt.blockers.includes('blocked_runtime_execution_attempt'))

const storageAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  safety: {
    ...baseline.safety,
    signedUrlCreation: true,
  },
} as unknown as typeof baseline)
assert.equal(storageAttempt.ok, false)
assert.ok(storageAttempt.blockers.includes('blocked_storage_or_public_artifact_attempt'))

const missingCleanupAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  cleanupAuditRef: {
    ...baseline.cleanupAuditRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingCleanupAttempt.ok, false)
assert.ok(missingCleanupAttempt.blockers.includes('blocked_missing_cleanup_audit_reference'))

const missingGuardAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  approvedSnapshotGuardRef: {
    ...baseline.approvedSnapshotGuardRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingGuardAttempt.ok, false)
assert.ok(missingGuardAttempt.blockers.includes('blocked_missing_approved_snapshot_guard'))

const rejectedInputAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
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
    'disabled_handler_registration_contract_validates',
    'executable_handler_registration_blocks',
    'feature_flag_enablement_blocks',
    'route_execution_blocks',
    'signed_public_artifact_attempt_blocks',
    'missing_cleanup_audit_reference_blocks',
    'missing_approved_snapshot_guard_blocks',
    'raw_command_input_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  registrationStatus: baselineResult.registrationStatus,
  nextRequiredGate: baselineResult.nextRequiredGate,
}, null, 2))
