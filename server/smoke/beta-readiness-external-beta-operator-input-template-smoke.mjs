import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessExternalBetaOperatorAutofillEnv,
  buildBetaReadinessExternalBetaOperatorHumanInputChecklist,
  buildBetaReadinessExternalBetaOperatorInputStatus,
  buildBetaReadinessExternalBetaOperatorInputTemplate,
  buildBetaReadinessExternalBetaOperatorLocalEnvBootstrap,
  renderBetaReadinessExternalBetaOperatorAutofillEnvMarkdown,
  renderBetaReadinessExternalBetaOperatorHumanInputChecklistMarkdown,
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
  'docs/beta-readiness/external-beta-operator-input-template/2026-06-30-ee177-external-beta-operator-input-template.md',
  'utf8',
)

assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-input-template'],
  'node server/cli/beta-readiness-external-beta-operator-input-template.mjs',
)
assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-autofill-env'],
  'node server/cli/beta-readiness-external-beta-operator-input-template.mjs --autofill-env',
)
assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-human-input-checklist'],
  'node server/cli/beta-readiness-external-beta-operator-input-template.mjs --human-input-checklist',
)
assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-local-env-bootstrap'],
  'node server/cli/beta-readiness-external-beta-operator-input-template.mjs --bootstrap-local-env',
)
assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-value-progress'],
  'node server/cli/beta-readiness-external-beta-operator-local-env-preflight.mjs --progress',
)
assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-local-env-preflight'],
  'node server/cli/beta-readiness-external-beta-operator-local-env-preflight.mjs',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-external-beta-operator-input-template'],
  'node server/smoke/beta-readiness-external-beta-operator-input-template-smoke.mjs',
)

const report = buildBetaReadinessExternalBetaOperatorInputTemplate()
const status = buildBetaReadinessExternalBetaOperatorInputStatus(report)
const autofill = buildBetaReadinessExternalBetaOperatorAutofillEnv(report)
const checklist = buildBetaReadinessExternalBetaOperatorHumanInputChecklist(report)
const bootstrap = buildBetaReadinessExternalBetaOperatorLocalEnvBootstrap(report)
const markdown = renderBetaReadinessExternalBetaOperatorInputTemplateMarkdown(report)
const statusMarkdown = renderBetaReadinessExternalBetaOperatorInputStatusMarkdown(status)
const autofillMarkdown = renderBetaReadinessExternalBetaOperatorAutofillEnvMarkdown(autofill)
const checklistMarkdown = renderBetaReadinessExternalBetaOperatorHumanInputChecklistMarkdown(checklist)
const serialized = JSON.stringify(report)
const serializedStatus = JSON.stringify(status)
const serializedAutofill = JSON.stringify(autofill)
const serializedChecklist = JSON.stringify(checklist)

assert.equal(report.ok, true)
assert.equal(
  report.decision,
  'beta_readiness_external_beta_operator_input_template_passed_ready_for_operator_value_collection',
)
assert.equal(report.sourceTruth.deployedSourceSha, 'ee177046bfb07868c4eb0ebd04f4eaff42c811ce')
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
assert.deepEqual(status.actionabilityCounts, {
  humanActionablePending: 45,
  autoFillablePending: 12,
  pendingPrefilledConstants: 8,
  pendingOperatorGeneratedIds: 4,
  pendingOwnerEvidenceNotes: 11,
  pendingOwnerApprovalConfirmations: 15,
  pendingOperatorConfirmations: 11,
  pendingTechnicalVerificationConfirmations: 4,
  pendingSecretOrSensitiveInputs: 1,
  pendingNonSecretOperatorValues: 3,
})
assert.deepEqual(status.pendingInputGroups, {
  shared: 5,
  tool_evidence: 14,
  platform_evidence: 22,
  launch_approval: 16,
})
assert.deepEqual(status.pendingValuePolicies, {
  operator_secret_or_sensitive: 1,
  operator_non_secret_value: 3,
  operator_confirmation: 11,
  operator_unique_id: 4,
  prefilled_non_secret_constant: 8,
  owner_approval_confirmation: 15,
  technical_verification_confirmation: 4,
  owner_evidence_note: 11,
})
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN' && input.secret), true)
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID'), true)
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'), true)
assert.equal(status.pendingInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'), true)
assert.equal(status.humanActionablePendingInputs.length, 45)
assert.equal(status.autoFillablePendingInputs.length, 12)
assert.equal(status.humanActionablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN' && input.secret), true)
assert.equal(status.humanActionablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID'), true)
assert.equal(status.humanActionablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID'), true)
assert.equal(status.humanActionablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'), true)
assert.equal(status.humanActionablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY' && input.valuePolicy === 'owner_approval_confirmation'), true)
assert.equal(status.humanActionablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED' && input.valuePolicy === 'technical_verification_confirmation'), true)
assert.equal(status.humanActionablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE' && input.valuePolicy === 'operator_confirmation'), true)
assert.equal(status.autoFillablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'), true)
assert.equal(status.autoFillablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT'), true)
assert.equal(status.autoFillablePendingInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY'), false)
assert.equal(autofill.ok, true)
assert.equal(
  autofill.decision,
  'beta_readiness_external_beta_operator_autofill_env_passed_ready_for_human_operator_value_collection',
)
assert.equal(autofill.inputCounts.autoFillablePending, 12)
assert.equal(autofill.inputCounts.generatedIdempotencyKeys, 4)
assert.equal(autofill.inputCounts.prefilledNonSecretConstants, 8)
assert.equal(autofill.inputCounts.humanActionableInputsEmitted, 0)
assert.equal(autofill.inputCounts.secretOrSensitiveInputsEmitted, 0)
assert.equal(autofill.inputCounts.ownerApprovalInputsEmitted, 0)
assert.equal(autofill.inputCounts.ownerEvidenceNotesEmitted, 0)
assert.equal(autofill.autoFillableInputs.length, 12)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'), true)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY'), true)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY'), true)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA'), true)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), false)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID'), false)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY'), false)
assert.equal(autofill.autoFillableInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'), false)
assert.equal(checklist.ok, true)
assert.equal(
  checklist.decision,
  'beta_readiness_external_beta_operator_human_input_checklist_passed_ready_for_operator_owner_collection',
)
assert.deepEqual(checklist.inputCounts, {
  humanActionablePending: 45,
  operatorSecretOrSensitive: 1,
  operatorNonSecretValues: 3,
  operatorConfirmations: 11,
  ownerApprovalConfirmations: 15,
  technicalVerificationConfirmations: 4,
  ownerEvidenceNotes: 11,
  autoFillableInputsEmitted: 0,
  valuesEmitted: 0,
})
assert.deepEqual(checklist.pendingGroups, {
  shared: 5,
  tool_evidence: 5,
  platform_evidence: 20,
  launch_approval: 15,
})
assert.deepEqual(checklist.pendingCollectionRoles, {
  operator_secret_or_sensitive: 1,
  operator_non_secret_value: 3,
  operator_confirmation: 11,
  owner_approval_confirmation: 15,
  technical_verification_confirmation: 4,
  owner_evidence_note: 11,
})
assert.equal(checklist.humanActionableInputs.length, 45)
assert.equal(checklist.humanActionableInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN' && input.secret), true)
assert.equal(checklist.humanActionableInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID'), true)
assert.equal(checklist.humanActionableInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY'), true)
assert.equal(checklist.humanActionableInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED'), true)
assert.equal(checklist.humanActionableInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'), true)
assert.equal(checklist.humanActionableInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'), false)
assert.equal(checklist.humanActionableInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA'), false)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_EXTERNAL_API_BASE_URL'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID'), true)
assert.equal(report.requiredInputs.some((input) => input.name === 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'), true)

assert.ok(report.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_API_BASE_URL="https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app"'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN="<secret value supplied only in the operator shell>"'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_SOURCE_SHA="ee177046bfb07868c4eb0ebd04f4eaff42c811ce"'))
assert.equal(report.envTemplate.includes('REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY="true"'), false)
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY="<owner approval: set to true only after named owner approval is recorded>"'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED="<technical verification: set to true only after evidence readback passes>"'))
assert.ok(report.envTemplate.includes(`REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA="${expectedLocalEvidenceSourceSha}"`))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT="0"'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE="<non-secret owner evidence summary>"'))
assert.ok(report.envTemplate.includes('operator-status-api can reuse REEDITPRO_BETA_EXTERNAL_API_BASE_URL'))
assert.ok(report.envTemplate.includes('chmod 600 .env.reeditpro-beta-operator.local'))
assert.ok(report.envTemplate.includes('npm run beta:readiness:external-beta-operator-local-env-bootstrap'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight'))
assert.ok(report.envTemplate.includes('REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight'))
assert.equal(report.envTemplate.includes('/path/to/local-only.env'), false)
assert.ok(autofill.envTemplate.includes('export REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY='))
assert.ok(autofill.envTemplate.includes(`export REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA="${expectedLocalEvidenceSourceSha}"`))
assert.ok(autofill.envTemplate.includes('export REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT="0"'))
assert.ok(autofill.envTemplate.includes('export REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY='))
assert.ok(autofill.envTemplate.includes('export REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY='))
assert.equal(autofill.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_API_BASE_URL='), false)
assert.equal(autofill.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN='), false)
assert.equal(autofill.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID='), false)
assert.equal(autofill.envTemplate.includes('REEDITPRO_BETA_EXTERNAL_PROJECT_ID='), false)
assert.equal(autofill.envTemplate.includes('REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY='), false)
assert.equal(autofill.envTemplate.includes('REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE='), false)
assert.equal(bootstrap.ok, true)
assert.equal(
  bootstrap.decision,
  'beta_readiness_external_beta_operator_local_env_bootstrap_passed_ready_for_human_operator_value_collection',
)
assert.equal(bootstrap.inputCounts.assignedSafeInputs, 14)
assert.equal(bootstrap.inputCounts.commentedHumanInputs, 46)
assert.equal(bootstrap.inputCounts.secretOrSensitiveValuesAssigned, 0)
assert.equal(bootstrap.inputCounts.ownerApprovalValuesAssigned, 0)
assert.equal(bootstrap.inputCounts.ownerEvidenceValuesAssigned, 0)
assert.equal(bootstrap.envFileContent.includes(`REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA="${expectedLocalEvidenceSourceSha}"`), true)
assert.equal(/^REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN=/m.test(bootstrap.envFileContent), false)
assert.equal(/^# REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN=/m.test(bootstrap.envFileContent), true)
assert.equal(/^REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY=/m.test(bootstrap.envFileContent), false)
assert.equal(/^# REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY=/m.test(bootstrap.envFileContent), true)
assert.ok(checklist.validationCommands.includes('npm run beta:readiness:external-beta-operator-human-input-checklist'))
assert.ok(report.envTemplate.includes('npm run beta:readiness:owner-approval-intake-status'))
assert.ok(report.validationCommands.includes('npm run beta:readiness:external-beta-operator-local-env-bootstrap'))
assert.ok(report.validationCommands.includes('REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-value-progress -- --markdown'))
assert.ok(report.validationCommands.includes('npm run beta:readiness:external-beta-operator-autofill-env'))
assert.ok(report.validationCommands.includes('npm run beta:readiness:external-beta-operator-human-input-checklist'))
assert.ok(report.validationCommands.includes('REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight'))
assert.ok(checklist.validationCommands.includes('REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight'))
assert.ok(report.envTemplate.includes('npm run beta:readiness:external-beta-operator-local-env-preflight'))
assert.ok(autofill.validationCommands.includes('npm run beta:readiness:external-beta-operator-autofill-env'))
assert.ok(report.validationCommands.includes('npm run beta:readiness:owner-approval-intake-status'))
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
assert.equal(serializedAutofill.includes('secret value supplied only in the operator shell'), false)
assert.equal(serializedAutofill.includes('https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app'), false)
assert.equal(serializedAutofill.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), false)
assert.equal(serializedAutofill.includes('REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID'), false)
assert.equal(serializedAutofill.includes('REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY'), false)
assert.equal(serializedAutofill.includes('non-secret owner evidence summary'), false)
assert.equal(serializedChecklist.includes('secret value supplied only in the operator shell'), false)
assert.equal(serializedChecklist.includes('https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app'), false)
assert.equal(serializedChecklist.includes('non-secret owner evidence summary'), false)
assert.equal(serializedChecklist.includes('reeditpro-beta-tools-local-bundle-core-idempotency-key'), false)
assert.equal(serializedChecklist.includes('d47015e88943dd4760dd9eb6ee45ad0f8ead15ca'), false)
assert.equal(serializedChecklist.includes('"valueEmitted":true'), false)
assert.equal(statusMarkdown.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), true)
assert.equal(statusMarkdown.includes('https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app'), false)
assert.equal(autofillMarkdown.includes('Auto-fillable pending inputs: `12`'), true)
assert.equal(autofillMarkdown.includes('Human-actionable inputs emitted: `0`'), true)
assert.equal(autofillMarkdown.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), false)
assert.equal(autofillMarkdown.includes('REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY'), false)
assert.equal(autofillMarkdown.includes('non-secret owner evidence summary'), false)
assert.equal(checklistMarkdown.includes('Human-actionable pending inputs: `45`'), true)
assert.equal(checklistMarkdown.includes('Values emitted: `0`'), true)
assert.equal(checklistMarkdown.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'), true)
assert.equal(checklistMarkdown.includes('REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY'), true)
assert.equal(checklistMarkdown.includes('https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app'), false)
assert.equal(checklistMarkdown.includes('non-secret owner evidence summary'), false)
assert.equal(checklistMarkdown.includes('reeditpro-beta-tools-local-bundle-core-idempotency-key'), false)
assert.equal(statusMarkdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'), true)
assert.equal(statusMarkdown.includes('Human-actionable pending inputs: `45`'), true)
assert.equal(statusMarkdown.includes('Auto-fillable pending inputs: `12`'), true)
assert.equal(statusMarkdown.includes('## Human-Actionable Pending Inputs'), true)
assert.equal(statusMarkdown.includes('## Auto-Fillable Pending Inputs'), true)
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
  humanActionablePendingInputs: status.actionabilityCounts.humanActionablePending,
  autoFillablePendingInputs: status.actionabilityCounts.autoFillablePending,
  autofillInputs: autofill.inputCounts.autoFillablePending,
  humanChecklistInputs: checklist.inputCounts.humanActionablePending,
  trackBToolTotals: report.sourceTruth.trackBToolTotals,
  productReadyLocalOssCount: report.sourceTruth.productReadyLocalOssCount,
}, null, 2))
