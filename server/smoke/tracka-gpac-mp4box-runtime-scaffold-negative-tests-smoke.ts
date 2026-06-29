import assert from 'node:assert/strict'
import {
  buildGpacMp4boxDisabledRuntimeScaffoldInput,
  validateGpacMp4boxDisabledRuntimeScaffoldInput,
  type GpacMp4boxDisabledRuntimeScaffoldRejectedInputs,
  type GpacMp4boxDisabledRuntimeScaffoldSafety,
} from '../../src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts'

const createdAt = new Date('2026-06-29T00:00:00.000Z').toISOString()
const baseline = buildGpacMp4boxDisabledRuntimeScaffoldInput({ createdAt })

const baselineResult = validateGpacMp4boxDisabledRuntimeScaffoldInput(baseline)
assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.scaffoldStatus, 'disabled_scaffold_registered_no_runtime')

const rejectedInputCases: Array<keyof GpacMp4boxDisabledRuntimeScaffoldRejectedInputs> = [
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
  const result = validateGpacMp4boxDisabledRuntimeScaffoldInput({
    ...baseline,
    rejectedInputs: {
      ...baseline.rejectedInputs,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_rejected_input_present'), `${key} should produce rejected input blocker`)
}

const runtimeAttemptCases: Array<keyof GpacMp4boxDisabledRuntimeScaffoldSafety> = [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'gpacMp4boxExecution',
  'mediaProcessing',
  'supabaseMutation',
  'sqlExecution',
]

for (const key of runtimeAttemptCases) {
  const result = validateGpacMp4boxDisabledRuntimeScaffoldInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_runtime_execution_attempt'), `${key} should produce runtime blocker`)
}

const deliveryAttemptCases: Array<keyof GpacMp4boxDisabledRuntimeScaffoldSafety> = [
  'storageTransfer',
  'signedUrlCreation',
  'publicArtifactCreation',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
]

for (const key of deliveryAttemptCases) {
  const result = validateGpacMp4boxDisabledRuntimeScaffoldInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_storage_or_public_delivery_attempt'), `${key} should produce delivery blocker`)
}

const invalidEnablementPlan = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  enablementPlanRef: {
    ...baseline.enablementPlanRef,
    mergeSha: 'invalid',
  },
} as unknown as typeof baseline)
assert.equal(invalidEnablementPlan.ok, false)
assert.ok(invalidEnablementPlan.blockers.includes('blocked_enablement_plan_invalid'))

const enabledRuntime = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  enabled: true,
} as unknown as typeof baseline)
assert.equal(enabledRuntime.ok, false)
assert.ok(enabledRuntime.blockers.includes('blocked_runtime_flag_not_disabled'))

const missingSnapshot = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  approvedSnapshotRef: {
    ...baseline.approvedSnapshotRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingSnapshot.ok, false)
assert.ok(missingSnapshot.blockers.includes('blocked_missing_approved_snapshot_ref'))

const missingServiceRoleRoute = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  serviceRoleRouteRef: {
    ...baseline.serviceRoleRouteRef,
    status: 'approved',
  },
} as unknown as typeof baseline)
assert.equal(missingServiceRoleRoute.ok, false)
assert.ok(missingServiceRoleRoute.blockers.includes('blocked_missing_service_role_route_ref'))

const missingWorkerDispatch = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  workerDispatchRef: {
    ...baseline.workerDispatchRef,
    dispatchEnabled: true,
  },
} as unknown as typeof baseline)
assert.equal(missingWorkerDispatch.ok, false)
assert.ok(missingWorkerDispatch.blockers.includes('blocked_missing_worker_dispatch_ref'))

const missingPrivateArtifact = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  privateArtifactManifestRef: {
    ...baseline.privateArtifactManifestRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingPrivateArtifact.ok, false)
assert.ok(missingPrivateArtifact.blockers.includes('blocked_missing_private_artifact_refs'))

const missingAllowlist = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  commandAllowlistRef: {
    ...baseline.commandAllowlistRef,
    rawCommandStringsAllowed: true,
  },
} as unknown as typeof baseline)
assert.equal(missingAllowlist.ok, false)
assert.ok(missingAllowlist.blockers.includes('blocked_missing_command_allowlist_ref'))

const missingQaCleanupAudit = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  qaReportRef: {
    ...baseline.qaReportRef,
    id: '',
  },
} as unknown as typeof baseline)
assert.equal(missingQaCleanupAudit.ok, false)
assert.ok(missingQaCleanupAudit.blockers.includes('blocked_missing_qa_cleanup_audit_refs'))

const missingRollbackResidue = validateGpacMp4boxDisabledRuntimeScaffoldInput({
  ...baseline,
  residuePolicyRef: {
    ...baseline.residuePolicyRef,
    residueValidationRequired: false,
  },
} as unknown as typeof baseline)
assert.equal(missingRollbackResidue.ok, false)
assert.ok(missingRollbackResidue.blockers.includes('blocked_missing_rollback_or_residue_refs'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'baseline_disabled_scaffold_validates',
    'all_rejected_input_cases_block',
    'all_runtime_attempt_cases_block',
    'all_storage_public_delivery_cases_block',
    'invalid_enablement_plan_blocks',
    'enabled_runtime_flag_blocks',
    'missing_reference_cases_block',
    'no_route_worker_tool_storage_media_or_unlock_enabled',
  ],
  rejectedInputCases,
  runtimeAttemptCases,
  deliveryAttemptCases,
  nextRequiredGate: baselineResult.nextRequiredGate,
}, null, 2))
