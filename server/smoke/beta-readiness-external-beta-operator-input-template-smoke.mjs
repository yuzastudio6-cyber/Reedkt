import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessExternalBetaOperatorInputStatus,
  buildBetaReadinessExternalBetaOperatorInputTemplate,
  renderBetaReadinessExternalBetaOperatorInputStatusMarkdown,
  renderBetaReadinessExternalBetaOperatorInputTemplateMarkdown,
} from '../cli/beta-readiness-external-beta-operator-input-template.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const expectedLocalEvidenceSourceSha = 'd47015e88943dd4760dd9eb6ee45ad0f8ead15ca'
const secretPlaceholderText = '<secret value supplied only in the operator shell>'
const staleLocalEvidenceSourceShas = [
  '94c37bb492a584c087247625dcb1fb53398c17f4',
  'e8821759a10a43a60795accb596b3b83c15f9dfb',
]
const committedMarkdown = readFileSync(
  'docs/beta-readiness/external-beta-operator-input-template/2026-06-29-184f-external-beta-operator-input-template.md',
  'utf8',
)

assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-input-template'],
  'node server/cli/beta-readiness-external-beta-operator-input-template.mjs',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-external-beta-operator-input-template'],
  'node server/smoke/beta-readiness-external-beta-operator-input-template-smoke.mjs',
)

const report = buildBetaReadinessExternalBetaOperatorInputTemplate()
const status = buildBetaReadinessExternalBetaOperatorInputStatus(report)
const markdown = renderBetaReadinessExternalBetaOperatorInputTemplateMarkdown(report)
const statusMarkdown = renderBetaReadinessExternalBetaOperatorInputStatusMarkdown(status)
const serialized = JSON.stringify(report)
const serializedStatus = JSON.stringify(status)

assert.equal(report.ok, true)
assert.equal(
  report.decision,
  'beta_readiness_external_beta_operator_input_template_passed_ready_for_operator_value_collection',
)
assert.equal(report.sourceTruth.deployedSourceSha, '184f8b225d01d5bb38c7d3a09d8461bcf8e325dc')
assert.deepEqual(report.sourceTruth.trackBToolTotals, {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
})
assert.equal(report.inputCounts.required, 60)
assert.equal(report.inputCounts.currentlyPendingInBlankEnvironment, 57)
assert.equal(status.ok, true)
assert.equal(
  status.decision,
  'beta_readiness_external_beta_operator_input_status_passed_ready_for_operator_value_collection',
)
assert.equal(status.templateDecision, report.decision)
assert.equal(status.inputCounts.required, 60)
assert.equal(status.inputCounts.currentlyPendingInBlankEnvironment, 57)
assert.equal(status.pendingInputs.length, 57)
assert.deepEqual(status.pendingInputGroups, {
  shared: 5,
  tool_evidence: 14,
  platform_evidence: 22,
  launch_approval: 16,
})
assert.deepEqual(status.pendingValuePolicies, {
  operator_secret_or_sensitive: 1,
  operator_non_secret_value: 3,
  prefilled_non_secret_constant: 38,
  operator_unique_id: 4,
  owner_evidence_note: 11,
})
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN' && input.secret), true)
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID'), true)
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'), true)
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_API_BASE_URL'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'), true)

assert.ok(report.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_API_BASE_URL="https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app"'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN="<secret value supplied only in the operator shell>"'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_SOURCE_SHA="184f8b225d01d5bb38c7d3a09d8461bcf8e325dc"'))
assert.ok(report.envTemplate.includes(`REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA="${expectedLocalEvidenceSourceSha}"`))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT="0"'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE="<non-secret owner evidence summary>"'))
assert.ok(report.envTemplate.includes('operator-status-api can reuse REEDITPRO_BETA_EXTERNAL_API_BASE_URL'))
assert.ok(report.validationCommands.includes('npm run beta:readiness:external-beta-evidence-collector'))
for (const staleSourceSha of staleLocalEvidenceSourceShas) {
  assert.equal(report.envTemplate.includes(staleSourceSha), false)
}

assert.equal(serialized.includes('secret-token'), false)
assert.equal(serialized.includes('Bearer secret'), false)
assert.equal(serialized.includes('service_role_key'), false)
assert.equal(serialized.includes('x-goog-signature='), false)
assert.equal(serializedStatus.includes('https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app'), false)
assert.equal(serializedStatus.includes(secretPlaceholderText), false)
assert.equal(serializedStatus.includes('non-secret owner evidence summary'), false)
assert.equal(serializedStatus.includes('secret-token'), false)
assert.equal(serializedStatus.includes('Bearer secret'), false)
assert.equal(serializedStatus.includes('service_role_key'), false)
assert.equal(serializedStatus.includes('x-goog-signature='), false)
assert.equal(statusMarkdown.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), true)
assert.equal(statusMarkdown.includes('https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app'), false)
assert.equal(statusMarkdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'), true)
assert.equal(markdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'), true)
assert.equal(markdown.includes('enable external beta'), true)
assert.equal(markdown.includes(expectedLocalEvidenceSourceSha), true)
for (const staleSourceSha of staleLocalEvidenceSourceShas) {
  assert.equal(markdown.includes(staleSourceSha), false)
}
assert.equal(committedMarkdown.includes(expectedLocalEvidenceSourceSha), true)
for (const staleSourceSha of staleLocalEvidenceSourceShas) {
  assert.equal(committedMarkdown.includes(staleSourceSha), false)
}

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  statusDecision: status.decision,
  requiredInputs: report.inputCounts.required,
  pendingRequiredInputs: report.inputCounts.currentlyPendingInBlankEnvironment,
  trackBToolTotals: report.sourceTruth.trackBToolTotals,
  productReadyLocalOssCount: report.sourceTruth.productReadyLocalOssCount,
}, null, 2))
