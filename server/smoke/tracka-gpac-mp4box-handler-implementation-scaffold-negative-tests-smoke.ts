import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledHandlerImplementationScaffoldInput,
  validateGpacMp4boxDisabledHandlerImplementationScaffoldInput,
} from '../../src/backend/contracts/gpac-mp4box-disabled-handler-implementation-scaffold-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledHandlerImplementationScaffoldInput({ createdAt })
const baselineResult = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput(baseline)

assert.equal(baselineResult.ok, true)
assert.equal(baselineResult.scaffoldStatus, 'disabled_handler_implementation_scaffold_registered_no_executable_handler')

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
  const result = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
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
  'executableHandlerImplementation',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'gpacMp4boxExecution',
  'mediaProcessing',
  'supabaseMutation',
  'sqlExecution',
] as const

for (const key of runtimeAttemptCases) {
  const result = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
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
  const result = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_storage_or_public_artifact_attempt'), `${key} blocker missing`)
}

const planDriftAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  guardedHandlerImplementationPlanRef: {
    ...baseline.guardedHandlerImplementationPlanRef,
    decision: 'wrong',
  },
} as unknown as typeof baseline)
assert.equal(planDriftAttempt.ok, false)
assert.ok(planDriftAttempt.blockers.includes('blocked_guarded_handler_implementation_plan_invalid'))

const handlerAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  handlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(handlerAttempt.ok, false)
assert.ok(handlerAttempt.blockers.includes('blocked_handler_implementation_not_disabled'))

const featureFlagAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const cleanupAuditAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
  ...baseline,
  cleanupAuditRef: {
    ...baseline.cleanupAuditRef,
    cleanupAuditRequired: false,
  },
} as unknown as typeof baseline)
assert.equal(cleanupAuditAttempt.ok, false)
assert.ok(cleanupAuditAttempt.blockers.includes('blocked_missing_cleanup_audit_reference'))

const operatorConfirmationAttempt = validateGpacMp4boxDisabledHandlerImplementationScaffoldInput({
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
    'baseline_disabled_handler_implementation_scaffold_validates',
    'all_rejected_input_cases_block',
    'all_runtime_attempt_cases_block',
    'all_delivery_attempt_cases_block',
    'guarded_handler_implementation_plan_drift_blocks',
    'handler_implementation_enablement_blocks',
    'feature_flag_enablement_blocks',
    'cleanup_audit_reference_blocks',
    'operator_confirmation_drift_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  rejectedInputCases,
  runtimeAttemptCases,
  deliveryAttemptCases,
  currentRequiredGate: 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-SCAFFOLD-NEGATIVE-TESTS-1',
  nextPrompt: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-REVIEW-2',
}, null, 2))
