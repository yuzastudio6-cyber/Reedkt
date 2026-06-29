import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledLiveRegistrationContractInput,
  validateGpacMp4boxDisabledLiveRegistrationContractInput,
  type GpacMp4boxDisabledLiveRegistrationRejectedInputs,
  type GpacMp4boxDisabledLiveRegistrationSafety,
} from '../../src/backend/contracts/gpac-mp4box-disabled-live-registration-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledLiveRegistrationContractInput({ createdAt })

const baselineResult = validateGpacMp4boxDisabledLiveRegistrationContractInput(baseline)
assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.registrationStatus, 'disabled_live_registration_contract_registered_no_handler')

const rejectedInputCases: Array<keyof GpacMp4boxDisabledLiveRegistrationRejectedInputs> = [
  'rawChat',
  'rawCommandString',
  'frontendFilePath',
  'publicUrlSourceOfTruth',
  'signedUrlSourceOfTruth',
  'arbitraryPrivateMedia',
  'providerOrModelPromptPayload',
  'serviceRoleSecretPayload',
  'broadServiceRoleHandlerPayload',
]

for (const key of rejectedInputCases) {
  const result = validateGpacMp4boxDisabledLiveRegistrationContractInput({
    ...baseline,
    rejectedInputs: {
      ...baseline.rejectedInputs,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_rejected_input_present'), `${key} should produce rejected input blocker`)
}

const runtimeAttemptCases: Array<keyof GpacMp4boxDisabledLiveRegistrationSafety> = [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'gpacMp4boxExecution',
  'mediaProcessing',
  'supabaseMutation',
  'sqlExecution',
]

for (const key of runtimeAttemptCases) {
  const result = validateGpacMp4boxDisabledLiveRegistrationContractInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_runtime_execution_attempt'), `${key} should produce runtime blocker`)
}

const deliveryAttemptCases: Array<keyof GpacMp4boxDisabledLiveRegistrationSafety> = [
  'storageTransfer',
  'signedUrlCreation',
  'publicArtifactCreation',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
  'finalDeliveryExport',
]

for (const key of deliveryAttemptCases) {
  const result = validateGpacMp4boxDisabledLiveRegistrationContractInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_storage_or_public_artifact_attempt'), `${key} should produce delivery blocker`)
}

const invalidReview = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  guardedReviewRef: {
    ...baseline.guardedReviewRef,
    mergeSha: 'invalid',
  },
} as unknown as typeof baseline)
assert.equal(invalidReview.ok, false)
assert.ok(invalidReview.blockers.includes('blocked_guarded_review_invalid'))

const missingServiceRole = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  serviceRoleContext: {
    ...baseline.serviceRoleContext,
    serviceRoleSecretPayloadAccess: true,
  },
} as unknown as typeof baseline)
assert.equal(missingServiceRole.ok, false)
assert.ok(missingServiceRole.blockers.includes('blocked_missing_backend_service_role_context'))

const liveHandler = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  liveHandlerRegistered: true,
} as unknown as typeof baseline)
assert.equal(liveHandler.ok, false)
assert.ok(liveHandler.blockers.includes('blocked_live_handler_registered'))

const enabledFlag = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  featureFlagDefault: true,
} as unknown as typeof baseline)
assert.equal(enabledFlag.ok, false)
assert.ok(enabledFlag.blockers.includes('blocked_feature_flag_enabled'))

const missingSnapshot = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  approvedSnapshotGuardRef: {
    ...baseline.approvedSnapshotGuardRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingSnapshot.ok, false)
assert.ok(missingSnapshot.blockers.includes('blocked_missing_approved_snapshot_guard'))

const missingIdempotency = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  routeIdempotencyGuardRef: {
    ...baseline.routeIdempotencyGuardRef,
    idempotencyRequired: false,
  },
} as unknown as typeof baseline)
assert.equal(missingIdempotency.ok, false)
assert.ok(missingIdempotency.blockers.includes('blocked_missing_route_idempotency_guard'))

const missingPrivateArtifact = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  privateArtifactManifestGuardRef: {
    ...baseline.privateArtifactManifestGuardRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingPrivateArtifact.ok, false)
assert.ok(missingPrivateArtifact.blockers.includes('blocked_missing_private_artifact_manifest_guard'))

const missingCommandAllowlist = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  commandAllowlistGuardRef: {
    ...baseline.commandAllowlistGuardRef,
    rawCommandStringsAllowed: true,
  },
} as unknown as typeof baseline)
assert.equal(missingCommandAllowlist.ok, false)
assert.ok(missingCommandAllowlist.blockers.includes('blocked_missing_command_allowlist_guard'))

const missingNegativeTests = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  negativeTestsGuardRef: {
    ...baseline.negativeTestsGuardRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingNegativeTests.ok, false)
assert.ok(missingNegativeTests.blockers.includes('blocked_missing_negative_tests_guard'))

const missingStorageGate = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  storageTransferGateRef: {
    ...baseline.storageTransferGateRef,
    storageTransferEnabled: true,
  },
} as unknown as typeof baseline)
assert.equal(missingStorageGate.ok, false)
assert.ok(missingStorageGate.blockers.includes('blocked_missing_storage_or_public_artifact_gate'))

const missingOperatorConfirmation = validateGpacMp4boxDisabledLiveRegistrationContractInput({
  ...baseline,
  operatorConfirmationGuardRef: {
    ...baseline.operatorConfirmationGuardRef,
    confirmed: true,
  },
} as unknown as typeof baseline)
assert.equal(missingOperatorConfirmation.ok, false)
assert.ok(missingOperatorConfirmation.blockers.includes('blocked_missing_operator_confirmation_guard'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'baseline_disabled_live_registration_contract_validates',
    'all_rejected_input_cases_block',
    'all_runtime_attempt_cases_block',
    'all_delivery_attempt_cases_block',
    'invalid_guarded_review_blocks',
    'service_role_secret_payload_access_blocks',
    'live_handler_registration_blocks',
    'feature_flag_enablement_blocks',
    'missing_guard_cases_block',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  rejectedInputCases,
  runtimeAttemptCases,
  deliveryAttemptCases,
  nextRequiredGate: baselineResult.nextRequiredGate,
}, null, 2))
