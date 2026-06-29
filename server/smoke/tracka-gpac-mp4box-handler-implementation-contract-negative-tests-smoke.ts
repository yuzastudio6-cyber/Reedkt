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
  const result = validateGpacMp4boxDisabledHandlerImplementationContractInput({
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
  const result = validateGpacMp4boxDisabledHandlerImplementationContractInput({
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
  const result = validateGpacMp4boxDisabledHandlerImplementationContractInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_storage_or_public_artifact_attempt'), `${key} blocker missing`)
}

const reviewDriftAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  guardedHandlerImplementationReviewRef: {
    ...baseline.guardedHandlerImplementationReviewRef,
    decision: 'wrong',
  },
} as unknown as typeof baseline)
assert.equal(reviewDriftAttempt.ok, false)
assert.ok(reviewDriftAttempt.blockers.includes('blocked_guarded_handler_implementation_review_invalid'))

const handlerAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  handlerImplemented: true,
} as unknown as typeof baseline)
assert.equal(handlerAttempt.ok, false)
assert.ok(handlerAttempt.blockers.includes('blocked_handler_implementation_not_disabled'))

const featureFlagAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(featureFlagAttempt.ok, false)
assert.ok(featureFlagAttempt.blockers.includes('blocked_feature_flag_enabled'))

const serviceRoleAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  serviceRoleContext: {
    ...baseline.serviceRoleContext,
    serviceRoleSecretPayloadAccess: true,
  },
} as unknown as typeof baseline)
assert.equal(serviceRoleAttempt.ok, false)
assert.ok(serviceRoleAttempt.blockers.includes('blocked_missing_backend_service_role_context'))

const snapshotGuardAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  approvedSnapshotGuardRef: {
    ...baseline.approvedSnapshotGuardRef,
    status: 'planned',
  },
} as unknown as typeof baseline)
assert.equal(snapshotGuardAttempt.ok, false)
assert.ok(snapshotGuardAttempt.blockers.includes('blocked_missing_approved_snapshot_guard'))

const commandAllowlistAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  commandAllowlistGuardRef: {
    ...baseline.commandAllowlistGuardRef,
    rawCommandStringsAllowed: true,
  },
} as unknown as typeof baseline)
assert.equal(commandAllowlistAttempt.ok, false)
assert.ok(commandAllowlistAttempt.blockers.includes('blocked_missing_command_allowlist_guard'))

const negativeTestsGuardAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  negativeTestsGuardRef: {
    ...baseline.negativeTestsGuardRef,
    requiredBeforeEnablement: false,
  },
} as unknown as typeof baseline)
assert.equal(negativeTestsGuardAttempt.ok, false)
assert.ok(negativeTestsGuardAttempt.blockers.includes('blocked_missing_negative_tests_guard'))

const cleanupAuditAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
  ...baseline,
  cleanupAuditRef: {
    ...baseline.cleanupAuditRef,
    cleanupAuditRequired: false,
  },
} as unknown as typeof baseline)
assert.equal(cleanupAuditAttempt.ok, false)
assert.ok(cleanupAuditAttempt.blockers.includes('blocked_missing_cleanup_audit_reference'))

const operatorConfirmationAttempt = validateGpacMp4boxDisabledHandlerImplementationContractInput({
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
    'baseline_disabled_handler_implementation_contract_validates',
    'all_rejected_input_cases_block',
    'all_runtime_attempt_cases_block',
    'all_delivery_attempt_cases_block',
    'guarded_handler_implementation_review_drift_blocks',
    'handler_implementation_enablement_blocks',
    'feature_flag_enablement_blocks',
    'service_role_secret_payload_blocks',
    'approved_snapshot_guard_blocks',
    'command_allowlist_guard_blocks',
    'negative_tests_guard_blocks',
    'cleanup_audit_reference_blocks',
    'operator_confirmation_drift_blocks',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  rejectedInputCases,
  runtimeAttemptCases,
  deliveryAttemptCases,
  currentRequiredGate: 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-CONTRACT-NEGATIVE-TESTS-1',
  nextPrompt: 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-PLAN-1',
}, null, 2))
