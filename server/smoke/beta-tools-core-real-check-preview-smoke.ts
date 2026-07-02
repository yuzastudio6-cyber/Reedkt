import assert from 'node:assert/strict'
import {
  buildBetaToolsCoreRealCheckPreviewTemplate,
  renderBetaToolsCoreRealCheckPreviewTemplateMarkdown,
  runBetaToolsCoreRealCheckPreview,
  type BetaToolsCoreRealCheckPreviewEnv,
} from '../cli/beta-tools-core-real-check-preview'

const template = buildBetaToolsCoreRealCheckPreviewTemplate()
const templateMarkdown = renderBetaToolsCoreRealCheckPreviewTemplateMarkdown(template)

assert.equal(template.ok, true, 'preview template should build')
assert.equal(
  template.decision,
  'beta_tools_core_real_check_preview_template_passed_ready_for_local_operator_preview',
)
assert.equal(template.previewOnly, true, 'preview template must be preview-only')
assert.equal(template.recordsBackendEvidence, false, 'preview template must not record backend evidence')
assert.equal(template.valuePolicy.acceptanceMode, 'bounded_accepted_evidence_only')
assert.equal(template.valuePolicy.productReadyLocalOss, false, 'preview template must not accept product-ready local OSS')
assert.ok(template.envTemplate.includes('REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE="true"'))
assert.ok(template.envTemplate.includes('REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS="false"'))
assert.ok(template.envTemplate.includes('REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE="true"'))
assert.ok(template.envTemplate.includes('REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS="false"'))
assert.ok(template.envTemplate.includes('Warning-status tools such as libass are handled by their separate QA/bundle lane'))
assert.ok(template.envTemplate.includes('npm run beta:tools:core-real-check-preview'))
assert.ok(template.envTemplate.includes('npm run beta:tools:core-real-check-preview -- --local-defaults'))
assert.ok(template.envTemplate.includes('npm run beta:tools:core-real-check-preview:hydrated -- --local-defaults'))
assert.ok(template.recommendedCommands.includes('npm run beta:tools:core-real-check-preview -- --local-defaults'))
assert.equal(template.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), false)
assert.equal(template.envTemplate.includes('service_role'), false)
assert.equal(template.envTemplate.includes('x-goog-signature='), false)
assert.equal(template.blockedScopeConfirmations.deployedBackendCalled, false)
assert.equal(template.blockedScopeConfirmations.supabaseWritesRan, false)
assert.equal(template.blockedScopeConfirmations.externalBetaEnabled, false)
assert.equal(templateMarkdown.includes('Product-ready local OSS acceptance: `false`'), true)

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
assert.equal(readyReport.localDefaultsApplied, false, 'complete manual preview should not report local defaults')
assert.deepEqual(readyReport.localDefaultedInputNames, [], 'complete manual preview should not default any inputs')
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
assert.equal(noEnvReport.localDefaultsApplied, false, 'missing env should not apply defaults unless requested')

const localDefaultsReport = runBetaToolsCoreRealCheckPreview({}, {
  localDefaults: true,
  sourceSha: 'cccccccccccccccccccccccccccccccccccccccc',
})
assert.equal(localDefaultsReport.ok, true, 'local defaults preview should pass without manual env')
assert.equal(localDefaultsReport.previewOnly, true, 'local defaults preview must remain preview-only')
assert.equal(localDefaultsReport.readyToRecordAcceptedEvidence, true, 'local defaults preview should collect accepted evidence')
assert.equal(localDefaultsReport.localDefaultsApplied, true, 'local defaults preview should report default application')
assert.ok(
  localDefaultsReport.localDefaultedInputNames.includes('REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID'),
  'local defaults should include workspace ID',
)
assert.ok(
  localDefaultsReport.localDefaultedInputNames.includes('REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA'),
  'local defaults should include source SHA',
)
assert.equal(localDefaultsReport.missingConfiguration.length, 0, 'local defaults preview should close required config gaps')
assert.equal(localDefaultsReport.confirmationGaps.length, 0, 'local defaults preview should close bounded confirmation gaps')
assert.equal(localDefaultsReport.invalidToolIds.length, 0, 'local defaults preview should not introduce invalid tools')
assert.equal(localDefaultsReport.secretLikeInputPaths.length, 0, 'local defaults preview should not introduce secret-like values')
assert.ok(
  localDefaultsReport.acceptedToolCount > 0,
  'local defaults preview should accept at least one bounded tool on the local registry',
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
  templateDecision: template.decision,
  previewOnly: readyReport.previewOnly,
  acceptedToolIds: readyReport.acceptedToolIds,
  missingConfigurationCount: noEnvReport.missingConfiguration.length,
  localDefaultsAcceptedToolCount: localDefaultsReport.acceptedToolCount,
  invalidToolIds: invalidToolReport.invalidToolIds,
  confirmationGapCount: confirmationGapReport.confirmationGaps.length,
  secretNotesRejected: secretNotesReport.secretLikeInputPaths.length > 0,
}, null, 2))
