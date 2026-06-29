import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledHandlerRegistrationScaffoldInput,
  validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-handler-registration-scaffold-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledHandlerRegistrationScaffoldInput({ createdAt })
const baselineResult = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput(baseline)

assert.equal(baselineResult.ok, true)
assert.equal(baselineResult.scaffoldStatus, 'disabled_handler_registration_scaffold_registered_no_executable_handler')

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
  const result = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
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
  const result = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
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
  const result = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_storage_or_public_artifact_attempt'), `${key} blocker missing`)
}

const planDriftAttempt = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
  ...baseline,
  guardedHandlerRegistrationPlanRef: {
    ...baseline.guardedHandlerRegistrationPlanRef,
    decision: 'wrong',
  },
} as unknown as typeof baseline)
assert.equal(planDriftAttempt.ok, false)
assert.ok(planDriftAttempt.blockers.includes('blocked_guarded_handler_registration_plan_invalid'))

const handlerAttempt = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
  ...baseline,
  handlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(handlerAttempt.ok, false)
assert.ok(handlerAttempt.blockers.includes('blocked_handler_registration_not_disabled'))

const featureFlagAttempt = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const cleanupAuditAttempt = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
  ...baseline,
  cleanupAuditRef: {
    ...baseline.cleanupAuditRef,
    cleanupAuditRequired: false,
  },
} as unknown as typeof baseline)
assert.equal(cleanupAuditAttempt.ok, false)
assert.ok(cleanupAuditAttempt.blockers.includes('blocked_missing_cleanup_audit_reference'))

const operatorConfirmationAttempt = validateGpacMp4boxDisabledHandlerRegistrationScaffoldInput({
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
    'baseline_disabled_handler_registration_scaffold_validates',
    'all_rejected_input_cases_block',
    'all_runtime_attempt_cases_block',
    'all_delivery_attempt_cases_block',
    'guarded_handler_registration_plan_drift_blocks',
    'handler_registration_enablement_blocks',
    'feature_flag_enablement_blocks',
    'cleanup_audit_reference_blocks',
    'operator_confirmation_drift_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  rejectedInputCases,
  runtimeAttemptCases,
  deliveryAttemptCases,
  currentRequiredGate: 'TRACKA-GPAC-MP4BOX-HANDLER-REGISTRATION-SCAFFOLD-NEGATIVE-TESTS-1',
  nextPrompt: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-REVIEW-1',
}, null, 2))
