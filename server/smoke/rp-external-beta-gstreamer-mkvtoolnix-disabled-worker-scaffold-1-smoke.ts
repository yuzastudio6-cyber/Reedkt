import assert from 'node:assert/strict'
import {
  buildGstreamerMkvtoolnixDisabledWorkerScaffoldInput,
  validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput,
  type GstreamerMkvtoolnixDisabledWorkerScaffoldSafety,
  type GstreamerMkvtoolnixRejectedInputs,
} from '../../src/backend/contracts/gstreamer-mkvtoolnix-disabled-worker-scaffold-contracts'

const createdAt = new Date('2026-06-30T13:15:00.000Z').toISOString()
const baseline = buildGstreamerMkvtoolnixDisabledWorkerScaffoldInput({ createdAt })
const baselineResult = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput(baseline)

assert.equal(baselineResult.ok, true, baselineResult.sanitizedSummary)
assert.equal(baselineResult.scaffoldStatus, 'disabled_worker_scaffold_registered_no_tool_execution')
assert.equal(baselineResult.sanitizedScaffold.enabled, false)
assert.equal(baselineResult.sanitizedScaffold.workerLeaseStatus, 'disabled')
assert.equal(baselineResult.sanitizedScaffold.rawCommandStringsAllowed, false)
assert.equal(baselineResult.sanitizedScaffold.workerExecution, false)
assert.equal(baselineResult.sanitizedScaffold.workerDispatch, false)
assert.equal(baselineResult.sanitizedScaffold.gstreamerExecution, false)
assert.equal(baselineResult.sanitizedScaffold.mkvtoolnixExecution, false)
assert.equal(baselineResult.sanitizedScaffold.ffmpegFfprobeExecution, false)
assert.equal(baselineResult.nextRequiredGate, 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENABLEMENT-REVIEW-1')

for (const commandTemplateId of [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const) {
  const result = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput(
    buildGstreamerMkvtoolnixDisabledWorkerScaffoldInput({ createdAt, commandTemplateId }),
  )
  assert.equal(result.ok, true, `${commandTemplateId} should be an allowed template`)
}

const missingSnapshot = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  approvedPlanSnapshotRef: {
    ...baseline.approvedPlanSnapshotRef,
    id: '',
  },
})
assert.equal(missingSnapshot.ok, false)
assert.ok(missingSnapshot.blockers.includes('blocked_missing_approved_plan_snapshot'))

const missingApproval = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  approvalRecordRef: {
    ...baseline.approvalRecordRef,
    status: 'planned',
  },
} as unknown as typeof baseline)
assert.equal(missingApproval.ok, false)
assert.ok(missingApproval.blockers.includes('blocked_missing_approval_record'))

const missingCredit = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  creditPolicyRef: {
    ...baseline.creditPolicyRef,
    id: '',
  },
})
assert.equal(missingCredit.ok, false)
assert.ok(missingCredit.blockers.includes('blocked_missing_credit_or_no_spend_policy'))

const missingWorkerLease = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  workerLeaseRef: {
    ...baseline.workerLeaseRef,
    status: 'approved',
  },
} as unknown as typeof baseline)
assert.equal(missingWorkerLease.ok, false)
assert.ok(missingWorkerLease.blockers.includes('blocked_missing_worker_lease'))

const missingIdempotency = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  idempotencyRef: {
    ...baseline.idempotencyRef,
    id: '',
  },
})
assert.equal(missingIdempotency.ok, false)
assert.ok(missingIdempotency.blockers.includes('blocked_missing_idempotency_key'))

const unapprovedTemplate = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  commandTemplateRef: {
    ...baseline.commandTemplateRef,
    templateId: 'arbitrary_command_template',
  },
} as unknown as typeof baseline)
assert.equal(unapprovedTemplate.ok, false)
assert.ok(unapprovedTemplate.blockers.includes('blocked_unapproved_command_template'))

const rawCommandAllowed = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  commandTemplateRef: {
    ...baseline.commandTemplateRef,
    rawCommandStringsAllowed: true,
  },
} as unknown as typeof baseline)
assert.equal(rawCommandAllowed.ok, false)
assert.ok(rawCommandAllowed.blockers.includes('blocked_raw_command_string'))

const missingManifest = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  privateInputManifestRef: {
    ...baseline.privateInputManifestRef,
    id: '',
  },
})
assert.equal(missingManifest.ok, false)
assert.ok(missingManifest.blockers.includes('blocked_missing_private_input_manifest'))

const checksumMismatch = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  privateInputManifestRef: {
    ...baseline.privateInputManifestRef,
    checksumMatches: false,
  },
} as unknown as typeof baseline)
assert.equal(checksumMismatch.ok, false)
assert.ok(checksumMismatch.blockers.includes('blocked_manifest_checksum_mismatch'))

const rejectedInputCases: Array<keyof GstreamerMkvtoolnixRejectedInputs> = [
  'rawChat',
  'frontendFilePath',
  'arbitraryPrivateMedia',
  'unmanifestedFile',
  'providerOrModelPromptPayload',
  'serviceRoleSecretPayload',
]

for (const key of rejectedInputCases) {
  const result = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
    ...baseline,
    rejectedInputs: {
      ...baseline.rejectedInputs,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_unapproved_media_source'), `${key} should produce media/source blocker`)
}

for (const key of ['publicUrlSourceOfTruth', 'signedUrlSourceOfTruth'] as const) {
  const result = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
    ...baseline,
    rejectedInputs: {
      ...baseline.rejectedInputs,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_public_or_signed_url_source'), `${key} should produce URL blocker`)
}

const missingOutput = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  expectedOutputManifestSchemaRef: {
    ...baseline.expectedOutputManifestSchemaRef,
    id: '',
  },
})
assert.equal(missingOutput.ok, false)
assert.ok(missingOutput.blockers.includes('blocked_output_manifest_missing'))

const missingQa = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  expectedQaReportSchemaRef: {
    ...baseline.expectedQaReportSchemaRef,
    id: '',
  },
})
assert.equal(missingQa.ok, false)
assert.ok(missingQa.blockers.includes('blocked_qa_report_missing'))

const missingCleanup = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
  ...baseline,
  cleanupPolicyRef: {
    ...baseline.cleanupPolicyRef,
    id: '',
  },
})
assert.equal(missingCleanup.ok, false)
assert.ok(missingCleanup.blockers.includes('blocked_cleanup_policy_missing'))

const runtimeAttemptCases: Array<keyof GstreamerMkvtoolnixDisabledWorkerScaffoldSafety> = [
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'remotionExecution',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
  'supabaseMutation',
  'sqlExecution',
]

for (const key of runtimeAttemptCases) {
  const result = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_worker_or_tool_execution_attempt'), `${key} should produce runtime blocker`)
}

const deliveryAttemptCases: Array<keyof GstreamerMkvtoolnixDisabledWorkerScaffoldSafety> = [
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
  'broadExternalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'dependencyMutation',
  'packageLockMutation',
]

for (const key of deliveryAttemptCases) {
  const result = validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput({
    ...baseline,
    safety: {
      ...baseline.safety,
      [key]: true,
    },
  } as unknown as typeof baseline)
  assert.equal(result.ok, false, `${key} should block`)
  assert.ok(result.blockers.includes('blocked_delivery_or_unlock_attempt'), `${key} should produce delivery blocker`)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'baseline_disabled_worker_scaffold_validates',
    'all_allowed_command_templates_validate_as_contract_metadata',
    'missing_snapshot_approval_credit_worker_lease_idempotency_block',
    'unapproved_template_and_raw_command_block',
    'missing_or_mismatched_private_input_manifest_blocks',
    'public_signed_unmanifested_arbitrary_media_blocks',
    'missing_output_qa_cleanup_blocks',
    'all_worker_tool_runtime_attempts_block',
    'all_delivery_unlock_attempts_block',
    'no_gstreamer_mkvtoolnix_ffmpeg_docker_remotion_supabase_or_media_execution_enabled',
  ],
  scaffoldStatus: baselineResult.scaffoldStatus,
  nextRequiredGate: baselineResult.nextRequiredGate,
}, null, 2))
