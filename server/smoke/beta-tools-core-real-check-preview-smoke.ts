import assert from 'node:assert/strict'
import {
  runBetaToolsCoreRealCheckPreview,
  type BetaToolsCoreRealCheckPreviewEnv,
} from '../cli/beta-tools-core-real-check-preview'

const completeEnv: BetaToolsCoreRealCheckPreviewEnv = {
  REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID: 'workspace-core-real-check-preview-smoke',
  REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID: 'project-core-real-check-preview-smoke',
  REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID: 'beta-tools-core-real-check-preview-smoke',
  REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  REEDITPRO_BETA_TOOLS_PREVIEW_NOTES: 'Local operator preview for bounded Hyperframe metadata evidence.',
  REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS: 'hyperframe',
  REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS: 'false',
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE: 'true',
}

const readyReport = runBetaToolsCoreRealCheckPreview(completeEnv)
assert.equal(readyReport.previewOnly, true, 'preview report should be marked preview-only')
assert.equal(readyReport.ok, true, 'complete preview input should pass')
assert.equal(readyReport.readyToRecordAcceptedEvidence, true, 'complete preview should be ready to record accepted evidence later')
assert.deepEqual(readyReport.requestedToolIds, ['hyperframe'], 'preview should keep requested tool IDs scoped')
assert.deepEqual(readyReport.acceptedToolIds, ['hyperframe'], 'preview should accept the safe Hyperframe source-boundary check')
assert.equal(readyReport.acceptedToolCount, 1, 'preview should accept one scoped tool')
assert.equal(readyReport.skippedToolCount, 0, 'scoped successful preview should not skip requested tools')
assert.equal(readyReport.missingConfiguration.length, 0, 'complete preview should have no missing configuration')
assert.equal(readyReport.confirmationGaps.length, 0, 'complete preview should have no confirmation gaps')
assert.equal(readyReport.invalidToolIds.length, 0, 'complete preview should have no invalid tools')
assert.equal(readyReport.secretLikeInputPaths.length, 0, 'complete preview should have no secret-like inputs')
assert.equal(readyReport.readinessSummary.totalSpecs, 1, 'scoped preview summary should cover one readiness spec')
assert.ok(readyReport.coreToolReadinessReport, 'preview should include core readiness details for operator review')
assert.ok(
  readyReport.warnings.some((warning) => warning.includes('no backend evidence was recorded')),
  'preview should warn that no backend evidence was recorded',
)
assert.equal(JSON.stringify(readyReport).includes('/v1/beta-readiness/evidence/core-real-check'), false, 'preview must not build a deployed endpoint call')

const noEnvReport = runBetaToolsCoreRealCheckPreview({})
assert.equal(noEnvReport.ok, false, 'missing preview env should fail closed')
assert.equal(noEnvReport.readyToRecordAcceptedEvidence, false, 'missing preview env should not be record-ready')
assert.ok(
  noEnvReport.missingConfiguration.some((item) => item.includes('REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID')),
  'missing workspace ID should be named',
)
assert.ok(
  noEnvReport.missingConfiguration.some((item) => item.includes('REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE')),
  'missing require-accepted flag should be named',
)

const invalidToolReport = runBetaToolsCoreRealCheckPreview({
  ...completeEnv,
  REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS: 'hyperframe,nope',
})
assert.equal(invalidToolReport.ok, false, 'invalid preview tool IDs should fail closed')
assert.deepEqual(invalidToolReport.invalidToolIds, ['nope'], 'invalid preview tool should be named')

const confirmationGapReport = runBetaToolsCoreRealCheckPreview({
  ...completeEnv,
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'false',
})
assert.equal(confirmationGapReport.ok, false, 'missing product-ready confirmation should fail closed')
assert.ok(
  confirmationGapReport.confirmationGaps.some((gap) => gap.includes('PRODUCT_READY_LOCAL_OSS_ACCEPTANCE')),
  'product-ready confirmation gap should be named',
)

const secretNotesReport = runBetaToolsCoreRealCheckPreview({
  ...completeEnv,
  REEDITPRO_BETA_TOOLS_PREVIEW_NOTES: 'Bearer should-not-be-recorded',
})
assert.equal(secretNotesReport.ok, false, 'secret-like preview notes should fail closed')
assert.ok(
  secretNotesReport.secretLikeInputPaths.some((path) => path.includes('notes')),
  'secret-like preview note path should be named',
)

console.log(JSON.stringify({
  ok: true,
  previewOnly: readyReport.previewOnly,
  acceptedToolIds: readyReport.acceptedToolIds,
  missingConfigurationCount: noEnvReport.missingConfiguration.length,
  invalidToolIds: invalidToolReport.invalidToolIds,
  confirmationGapCount: confirmationGapReport.confirmationGaps.length,
  secretNotesRejected: secretNotesReport.secretLikeInputPaths.length > 0,
}, null, 2))
