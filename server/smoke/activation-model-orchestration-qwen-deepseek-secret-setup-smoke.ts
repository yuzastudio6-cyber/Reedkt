import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_REPORT_DIR,
  buildModelOrchestrationQwenDeepseekSecretSetupReports,
} from '../activation/model-orchestration-provider-dry-run/qwen-deepseek-secret-setup'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

function assertNoForbiddenText(source: string, label: string): void {
  for (const forbidden of [
    /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /supabase\.co/i,
    new RegExp(`x-goog-${'signature'}|x-amz-${'signature'}|${'signature'}=|x-goog-${'credential'}|x-amz-${'credential'}`, 'i'),
    /authorization\s*[:=]\s*bearer/i,
    /"rawProviderResponses?Stored"\s*:\s*true/i,
    /"rawProviderOutputPersisted"\s*:\s*true/i,
    /"secretPayloadAccessedInSetup"\s*:\s*true/i,
    /"secretPayloadPrinted"\s*:\s*true/i,
    /"secretPayloadCommitted"\s*:\s*true/i,
    /"secretValueStoredInReports"\s*:\s*true/i,
    /"providerCallsInSetupPrompt"\s*:\s*true/i,
    /"qwenRerunAttempted"\s*:\s*true/i,
    /"deepseekRerunAttempted"\s*:\s*true/i,
    /"supabaseWrites"\s*:\s*true/i,
    /"sqlExecuted"\s*:\s*true/i,
    /"migrationsDeployed"\s*:\s*true/i,
    /"workers"\s*:\s*true/i,
    /"tools"\s*:\s*true/i,
    /"routes"\s*:\s*true/i,
    /"publicArtifacts"\s*:\s*true/i,
    /"signedUrls"\s*:\s*true/i,
    /"generatedAssets"\s*:\s*true/i,
    /"production"\s*:\s*true/i,
    /"externalBeta"\s*:\s*true/i,
    /"paidProduction"\s*:\s*true/i,
  ]) {
    assert(!forbidden.test(source), `Forbidden pattern found in ${label}`)
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
assert(
  packageJson.scripts?.['activation:model-orchestration-qwen-deepseek-secret-setup:report'] ===
    'tsx server/cli/activation-model-orchestration-qwen-deepseek-secret-setup-report.ts',
  'Missing Qwen DeepSeek secret setup report script.',
)
assert(
  packageJson.scripts?.['activation:model-orchestration-qwen-deepseek-secret-setup:summary'] ===
    'tsx server/cli/activation-model-orchestration-qwen-deepseek-secret-setup-summary.ts',
  'Missing Qwen DeepSeek secret setup summary script.',
)
assert(
  packageJson.scripts?.['smoke:activation-model-orchestration-qwen-deepseek-secret-setup'] ===
    'tsx server/smoke/activation-model-orchestration-qwen-deepseek-secret-setup-smoke.ts',
  'Missing Qwen DeepSeek secret setup smoke script.',
)

assert(existsSync(MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_REPORT_DIR), 'Secret setup report dir missing.')
for (const report of MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_REPORT_DIR, report)), `Missing report: ${report}`)
}
assert(
  existsSync('docs/model-orchestration-qwen-deepseek-secret-setup-result.md'),
  'Missing Qwen DeepSeek secret setup result doc.',
)

const sourceQwen = readJson('docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json')
const sourceDeepseek = readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json')
const sourceSecret = readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_secret_access_report.json')
const sourceDecision = readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json')
const approvalDecision = readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_approval_decision.json')
const syntheticCases = readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_synthetic_cases.json')
const fixSummary = readJson('docs/activation-model-orchestration-provider-dry-run-fix-reports/qwen_provider_fix_summary.json')
const reports = buildModelOrchestrationQwenDeepseekSecretSetupReports()
const summary = reports.qwenSecretSetupSummary
const decision = reports.qwenSecretSetupDecision
const region = reports.qwenRegionContractReview
const endpoint = reports.qwenUsEndpointContract
const alias = reports.qwenUsModelAliasReview
const secret = reports.qwenSecretRefVerification
const permission = reports.qwenSubworkspacePermissionReview
const readiness = reports.qwenRerunReadiness
const noRuntime = reports.qwenSecretSetupNoRuntimeUnlocks

assert(approvalDecision.decision === 'approved_for_future_qwen_deepseek_provider_dry_run', 'PR #318 approval must match.')
assert(sourceDecision.decision === 'blocked_pending_provider_error_review', 'PR #320 decision must remain blocked.')
assert(syntheticCases.caseCount === 8, 'Synthetic case count must be 8.')
assert(syntheticCases.syntheticOnly === true, 'Synthetic cases must be synthetic-only.')
assert(syntheticCases.containsUserData === false, 'Synthetic cases must not contain user data.')
assert(syntheticCases.containsPrivateProjectData === false, 'Synthetic cases must not contain private project data.')
assert(syntheticCases.containsMedia === false, 'Synthetic cases must not contain media.')

assert(sourceQwen.status === 'blocked', 'Qwen PR #320 status must remain blocked.')
assert(sourceQwen.providerCallsAttempted === 4, 'Qwen must have four attempted calls in PR #320.')
assert(sourceQwen.providerCallsPassed === 0, 'Qwen must have zero passed calls in PR #320.')
assert(sourceQwen.providerCallsBlocked === 4, 'Qwen must have four blocked calls in PR #320.')
for (const result of asArray(sourceQwen.results).map(asRecord)) {
  assert(result.httpStatus === 401, 'Qwen blocked result must be HTTP 401.')
  assert(result.blocker === 'provider_auth_or_permission_failed', 'Qwen blocker must be auth/permission.')
}

assert(sourceDeepseek.status === 'passed', 'DeepSeek evidence must remain passed.')
assert(sourceDeepseek.providerCallsAttempted === 3, 'DeepSeek must have three attempted calls.')
assert(sourceDeepseek.providerCallsPassed === 3, 'DeepSeek must have three passed calls.')
assert(sourceDeepseek.providerCallsBlocked === 0, 'DeepSeek must have zero blocked calls.')

const qwenSecret = asArray(sourceSecret.entries).map(asRecord)
  .find((entry) => entry.secretRef === 'DASHSCOPE_API_KEY')
assert(qwenSecret?.payloadAccessStatus === 'succeeded', 'DashScope secret ref must have succeeded in PR #320 metadata.')
assert(qwenSecret.payloadPrinted === false, 'DashScope secret payload must not be printed.')
assert(qwenSecret.payloadCommitted === false, 'DashScope secret payload must not be committed.')
assert(qwenSecret.secretValueStoredInReports === false, 'DashScope secret value must not be stored.')

assert(fixSummary.classification === 'qwen_secret_present_but_rejected', 'PR #323 classification must be preserved.')
assert(fixSummary.qwenRerunAttempted === false, 'PR #323 must not have rerun Qwen.')
assert(fixSummary.deepseekRerunAttempted === false, 'PR #323 must not have rerun DeepSeek.')

assert(summary.decision === 'metadata_ready_for_qwen_us_provider_dry_run_rerun', 'Secret setup decision must be metadata-ready.')
assert(summary.status === 'metadata_ready', 'Secret setup status must be metadata-ready.')
assert(summary.selectedRegion === 'us_virginia', 'Selected region must be US Virginia.')
assert(
  summary.selectedEndpoint === 'https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions',
  'Selected endpoint must be US compatible-mode chat completions.',
)
assert(asArray(summary.usDocumentedAliases).includes('qwen-plus-us'), 'US aliases must include qwen-plus-us.')
assert(asArray(summary.usDocumentedAliases).includes('qwen-flash-us'), 'US aliases must include qwen-flash-us.')
assert(asArray(summary.historicalPr320Aliases).includes('qwen3.7-plus'), 'Historical aliases must preserve qwen3.7-plus.')
assert(asArray(summary.historicalPr320Aliases).includes('qwen3.7-max'), 'Historical aliases must preserve qwen3.7-max.')
assert(summary.historicalAliasesReadyForUsRerun === false, 'Historical PR #320 aliases must not be marked ready for US rerun.')
assert(summary.providerSecretValidityVerified === false, 'Secret validity must remain unverified.')
assert(summary.modelCallPermissionVerified === false, 'Model call permission must remain unverified.')
assert(summary.metadataReadyForQwenOnlyRerun === true, 'Metadata must be ready for Qwen-only rerun.')
assert(
  summary.nextRecommendedPrompt ===
    'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-DRY-RUN-RERUN: rerun approved synthetic Qwen dry-run after secret/region update, no workers/tools/routes',
  'Next prompt must be Qwen provider dry-run rerun.',
)

assert(decision.providerCallsAttempted === false, 'Setup decision must not attempt provider calls.')
assert(decision.secretPayloadAccessedInSetup === false, 'Setup decision must not access secret payload.')
assert(decision.planSnapshotContractReady === false, 'Plan snapshot contract must not be ready.')
assert(region.regionalApiKeysDiffer === true, 'Region review must record regional key separation.')
assert(region.oldEndpointNotSelectedForNextRerun === true, 'Old endpoint must not be selected.')
assert(endpoint.selectedBaseUrl === 'https://dashscope-us.aliyuncs.com/compatible-mode/v1', 'US base URL must match.')
assert(endpoint.endpointExecutionAttempted === false, 'Endpoint must not be executed.')
assert(alias.defaultRerunModelId === 'qwen-plus-us', 'Default rerun model must be qwen-plus-us.')
assert(alias.alternateRerunModelId === 'qwen-flash-us', 'Alternate rerun model must be qwen-flash-us.')
assert(alias.historicalAliasesReadyForUsRerun === false, 'Historical aliases must not be rerun-ready.')
assert(secret.secretPayloadAccessInSetupPrompt === false, 'Setup prompt must not access secret payload.')
assert(secret.secretValidityVerifiedByProvider === false, 'Secret validity must not be provider-verified.')
assert(permission.permissionVerifiedByCodex === false, 'Permission must not be verified by Codex.')
assert(permission.providerCallAttemptedInSetup === false, 'Permission review must not call provider.')
assert(readiness.readyForQwenOnlyRerun === true, 'Readiness must allow Qwen-only rerun.')
assert(readiness.requiresSeparateExplicitProviderRerunPrompt === true, 'Readiness must require separate rerun prompt.')

const runtimeGates = asRecord(noRuntime.runtimeGates)
for (const [key, value] of Object.entries(runtimeGates)) {
  assert(value === false, `Runtime gate ${key} must remain false.`)
}

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_REPORT_DIR),
  {
    file: 'docs/model-orchestration-qwen-deepseek-secret-setup-result.md',
    text: readFileSync('docs/model-orchestration-qwen-deepseek-secret-setup-result.md', 'utf8'),
  },
  {
    file: 'server/activation/model-orchestration-provider-dry-run/qwen-deepseek-secret-setup.ts',
    text: readFileSync('server/activation/model-orchestration-provider-dry-run/qwen-deepseek-secret-setup.ts', 'utf8'),
  },
]

for (const { file, text } of corpus) assertNoForbiddenText(text, file)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-qwen-deepseek-secret-setup',
  decision: summary.decision,
  selectedRegion: summary.selectedRegion,
  selectedEndpoint: summary.selectedEndpoint,
  recommendedRerunAliases: summary.recommendedRerunAliases,
  metadataReadyForQwenOnlyRerun: summary.metadataReadyForQwenOnlyRerun,
  qwenRerunAttempted: summary.qwenRerunAttempted,
  deepseekRerunAttempted: summary.deepseekRerunAttempted,
  secretPayloadAccessedInSetup: summary.secretPayloadAccessedInSetup,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
