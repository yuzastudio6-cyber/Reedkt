import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledHandlerRegistrationContractInput,
  validateGpacMp4boxDisabledHandlerRegistrationContractInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-handler-registration-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledHandlerRegistrationContractInput({ createdAt })
const baselineResult = validateGpacMp4boxDisabledHandlerRegistrationContractInput(baseline)

assert.equal(baselineResult.ok, true)
assert.equal(baselineResult.registrationStatus, 'disabled_handler_registration_contract_registered_no_executable_handler')
assert.equal(baselineResult.nextRequiredGate, 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1')

const rejectedInputCases = [
  'rawChat',
  'rawCommandString',
  'frontendFilePath',
  'publicUrlSourceOfTruth',
  'signedUrlSourceOfTruth',
  'arbitraryPrivateMedia',
  'providerOrModelPromptPayload',
  'serviceRoleSecretPayload',
  'broadServiceRoleHandlerPayload',
] as const

for (const key of rejectedInputCases) {
  const result = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
    ...baseline,
    rejectedInputs: {
      ...baseline.rejectedInputs,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_rejected_input_present'), `${key} blocker missing`)
}

const runtimeAttemptCases = [
  'executableHandlerRegistration',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'gpacMp4boxExecution',
  'mediaProcessing',
  'supabaseMutation',
  'sqlExecution',
] as const

for (const key of runtimeAttemptCases) {
  const result = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_runtime_execution_attempt'), `${key} blocker missing`)
}

const deliveryAttemptCases = [
  'storageTransfer',
  'signedUrlCreation',
  'publicArtifactCreation',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
  'finalDeliveryExport',
] as const

for (const key of deliveryAttemptCases) {
  const result = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_storage_or_public_artifact_attempt'), `${key} blocker missing`)
}

const handlerRegistrationAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  handlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(handlerRegistrationAttempt.ok, false)
assert.ok(handlerRegistrationAttempt.blockers.includes('blocked_executable_handler_registered'))

const featureFlagAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const cleanupAuditAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  cleanupAuditRef: {
    ...baseline.cleanupAuditRef,
    cleanupAuditRequired: false,
  },
} as unknown as typeof baseline)
assert.equal(cleanupAuditAttempt.ok, false)
assert.ok(cleanupAuditAttempt.blockers.includes('blocked_missing_cleanup_audit_reference'))

const operatorConfirmationAttempt = validateGpacMp4boxDisabledHandlerRegistrationContractInput({
  ...baseline,
  operatorConfirmationGuardRef: {
    ...baseline.operatorConfirmationGuardRef,
    confirmed: true,
  },
} as unknown as typeof baseline)
assert.equal(operatorConfirmationAttempt.ok, false)
assert.ok(operatorConfirmationAttempt.blockers.includes('blocked_missing_operator_confirmation_guard'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'baseline_disabled_handler_registration_contract_validates',
    'all_rejected_input_cases_block',
    'all_runtime_attempt_cases_block',
    'all_delivery_attempt_cases_block',
    'executable_handler_registration_blocks',
    'feature_flag_enablement_blocks',
    'cleanup_audit_reference_blocks',
    'operator_confirmation_drift_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  rejectedInputCases,
  runtimeAttemptCases,
  deliveryAttemptCases,
  currentRequiredGate: 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1',
  nextPrompt: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-REGISTRATION-PLAN-1',
}, null, 2))
