import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR,
  buildModelOrchestrationProviderDryRunFixReports,
} from '../activation/model-orchestration-provider-dry-run/provider-dry-run-fix'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
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
    /"secretPayloadPrinted"\s*:\s*true/i,
    /"secretPayloadCommitted"\s*:\s*true/i,
    /"secretValueStoredInReports"\s*:\s*true/i,
    /"supabaseWrites"\s*:\s*true/i,
    /"workers"\s*:\s*true/i,
    /"tools"\s*:\s*true/i,
    /"routes"\s*:\s*true/i,
    /"publicArtifacts"\s*:\s*true/i,
    /"signedUrls"\s*:\s*true/i,
    /"production"\s*:\s*true/i,
    /"externalBeta"\s*:\s*true/i,
    /"paidProduction"\s*:\s*true/i,
  ]) {
    assert(!forbidden.test(source), `Forbidden pattern found in ${label}`)
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
assert(
  packageJson.scripts?.['activation:model-orchestration-provider-dry-run-fix:report'] ===
    'tsx server/cli/activation-model-orchestration-provider-dry-run-fix-report.ts',
  'Missing provider dry-run fix report script.',
)
assert(
  packageJson.scripts?.['activation:model-orchestration-provider-dry-run-fix:summary'] ===
    'tsx server/cli/activation-model-orchestration-provider-dry-run-fix-summary.ts',
  'Missing provider dry-run fix summary script.',
)
assert(
  packageJson.scripts?.['smoke:activation-model-orchestration-provider-dry-run-fix'] ===
    'tsx server/smoke/activation-model-orchestration-provider-dry-run-fix-smoke.ts',
  'Missing provider dry-run fix smoke script.',
)

assert(existsSync(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR), 'Provider dry-run fix report dir missing.')
for (const report of MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR, report)), `Missing report: ${report}`)
}
assert(existsSync('docs/model-orchestration-provider-dry-run-fix-result.md'), 'Missing provider dry-run fix result doc.')

const sourceQwen = readJson('docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json')
const sourceDeepseek = readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json')
const sourceSecret = readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_secret_access_report.json')
const sourceDecision = readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json')
const approvalDecision = readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_approval_decision.json')
const syntheticCases = readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_synthetic_cases.json')
const reports = buildModelOrchestrationProviderDryRunFixReports()
const summary = reports.qwenProviderFixSummary
const decision = reports.qwenProviderFixDecision
const secretReview = reports.qwenProviderSecretPermissionReview
const endpointReview = reports.qwenProviderEndpointContractReview
const modelReview = reports.qwenProviderModelAliasReview
const failClosed = reports.qwenProviderFixFailClosedVerification
const noRuntime = reports.qwenProviderFixNoRuntimeUnlocks

assert(approvalDecision.decision === 'approved_for_future_qwen_deepseek_provider_dry_run', 'PR #318 approval must match.')
assert(sourceDecision.decision === 'blocked_pending_provider_error_review', 'PR #320 decision must be blocked.')
assert(syntheticCases.caseCount === 8, 'Synthetic case count must be 8.')
assert(syntheticCases.syntheticOnly === true, 'Synthetic cases must be synthetic-only.')
assert(syntheticCases.containsUserData === false, 'Synthetic cases must not contain user data.')
assert(syntheticCases.containsPrivateProjectData === false, 'Synthetic cases must not contain private project data.')
assert(syntheticCases.containsMedia === false, 'Synthetic cases must not contain media.')

assert(sourceQwen.status === 'blocked', 'Qwen PR #320 status must remain blocked.')
assert(sourceQwen.providerCallsAttempted === 4, 'Qwen must have four attempted calls.')
assert(sourceQwen.providerCallsPassed === 0, 'Qwen must have zero passed calls.')
assert(sourceQwen.providerCallsBlocked === 4, 'Qwen must have four blocked calls.')
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

assert(summary.decision === 'blocked_pending_dashscope_secret_or_permission_setup', 'Fix decision must block on DashScope setup.')
assert(summary.classification === 'qwen_secret_present_but_rejected', 'Fix classification must match.')
assert(summary.qwenRerunAttempted === false, 'Qwen rerun must not be attempted.')
assert(summary.deepseekRerunAttempted === false, 'DeepSeek rerun must not be attempted.')
assert(summary.deepseekPassedEvidencePreserved === true, 'DeepSeek passed evidence must be preserved.')
assert(summary.planSnapshotContractReady === false, 'Plan snapshot contract must not be ready.')
assert(summary.rawProviderOutputPersisted === false, 'Raw provider output must not be persisted.')
assert(summary.secretPayloadPrinted === false, 'Secret payload must not be printed.')
assert(
  summary.nextRecommendedPrompt ===
    'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-SECRET-SETUP: verify provider secret refs/permissions, no provider calls',
  'Next recommendation must be secret setup.',
)

assert(decision.providerExecutionClientChanged !== true, 'Provider execution client must not be changed.')
assert(secretReview.secretPayloadAccessInFixPrompt === false, 'Fix prompt must not access secret payload.')
assert(endpointReview.endpointChangedInFixPrompt === false, 'Endpoint must not change in fix prompt.')
assert(endpointReview.endpointMatchesApprovedSourceOfTruth === true, 'Endpoint must match approved source of truth.')
assert(modelReview.attemptedAliasesApproved === true, 'Qwen attempted aliases must remain approved.')
assert(modelReview.aliasChangedInFixPrompt === false, 'Model aliases must not change.')
assert(failClosed.failClosedOn401Or403 === true, '401/403 must fail closed.')
assert(failClosed.provider401TreatedAsPass === false, '401 must not be treated as pass.')

const runtimeGates = asRecord(noRuntime.runtimeGates)
for (const [key, value] of Object.entries(runtimeGates)) {
  assert(value === false, `Runtime gate ${key} must remain false.`)
}

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR),
  { file: 'docs/model-orchestration-provider-dry-run-fix-result.md', text: readFileSync('docs/model-orchestration-provider-dry-run-fix-result.md', 'utf8') },
  { file: 'server/activation/model-orchestration-provider-dry-run/provider-dry-run-fix.ts', text: readFileSync('server/activation/model-orchestration-provider-dry-run/provider-dry-run-fix.ts', 'utf8') },
]

for (const { file, text } of corpus) assertNoForbiddenText(text, file)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-provider-dry-run-fix',
  decision: summary.decision,
  classification: summary.classification,
  qwenRerunAttempted: summary.qwenRerunAttempted,
  deepseekPassedEvidencePreserved: summary.deepseekPassedEvidencePreserved,
  rawProviderOutputPersisted: summary.rawProviderOutputPersisted,
  secretPayloadPrinted: summary.secretPayloadPrinted,
  supabaseWrites: summary.supabaseWrites,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
