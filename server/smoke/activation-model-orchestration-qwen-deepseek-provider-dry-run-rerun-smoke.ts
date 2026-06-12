import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REPORT_DIR,
  buildModelOrchestrationQwenProviderDryRunRerunReports,
} from '../activation/model-orchestration-provider-dry-run/qwen-provider-dry-run-rerun'

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
    new RegExp(`${'raw_provider'}_${'response_body'}|${'rawProvider'}${'ResponseBody'}|${'provider_response'}_${'payload'}|${'providerResponse'}${'Payload'}`, 'i'),
    /"rawProviderResponses?Stored"\s*:\s*true/i,
    /"rawProviderOutputPersisted"\s*:\s*true/i,
    /"rawProviderOutputPrinted"\s*:\s*true/i,
    /"modelGeneratedContentStored"\s*:\s*true/i,
    /"secretPayloadPrinted"\s*:\s*true/i,
    /"secretPayloadCommitted"\s*:\s*true/i,
    /"secretValueStoredInReports"\s*:\s*true/i,
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
  packageJson.scripts?.['activation:model-orchestration-qwen-deepseek-provider-dry-run-rerun'] ===
    'tsx server/cli/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun.ts',
  'Missing Qwen rerun execution script.',
)
assert(
  packageJson.scripts?.['activation:model-orchestration-qwen-deepseek-provider-dry-run-rerun:report'] ===
    'tsx server/cli/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-report.ts',
  'Missing Qwen rerun report script.',
)
assert(
  packageJson.scripts?.['activation:model-orchestration-qwen-deepseek-provider-dry-run-rerun:summary'] ===
    'tsx server/cli/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-summary.ts',
  'Missing Qwen rerun summary script.',
)
assert(
  packageJson.scripts?.['smoke:activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun'] ===
    'tsx server/smoke/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-smoke.ts',
  'Missing Qwen rerun smoke script.',
)

assert(existsSync(MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REPORT_DIR), 'Qwen rerun report dir missing.')
for (const report of MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REPORT_DIR, report)), `Missing report: ${report}`)
}
assert(
  existsSync('docs/model-orchestration-qwen-deepseek-provider-dry-run-rerun-result.md'),
  'Missing Qwen rerun result doc.',
)

const pr320Qwen = readJson('docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json')
const pr320Deepseek = readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json')
const pr323Fix = readJson('docs/activation-model-orchestration-provider-dry-run-fix-reports/qwen_provider_fix_summary.json')
const pr326Setup = readJson('docs/activation-model-orchestration-qwen-deepseek-secret-setup-reports/qwen_secret_setup_summary.json')
const reports = buildModelOrchestrationQwenProviderDryRunRerunReports()
const summary = reports.summary
const preflight = reports.preflight
const caseResults = reports.caseResults
const schemaValidation = reports.schemaValidation
const blockerReport = reports.blockerReport
const deepseekPreservation = reports.deepseekPreservation
const noRuntime = reports.noRuntimeUnlocks

assert(pr320Qwen.status === 'blocked', 'PR #320 Qwen blocker evidence must exist.')
assert(pr320Qwen.providerCallsAttempted === 4, 'PR #320 Qwen must have four attempted calls.')
assert(pr320Qwen.providerCallsBlocked === 4, 'PR #320 Qwen must have four blocked calls.')
assert(pr320Deepseek.status === 'passed', 'PR #320 DeepSeek evidence must be passed.')
assert(pr320Deepseek.providerCallsPassed === 3, 'PR #320 DeepSeek must have three passed calls.')
assert(pr323Fix.classification === 'qwen_secret_present_but_rejected', 'PR #323 fix evidence must be preserved.')
assert(pr326Setup.decision === 'metadata_ready_for_qwen_us_provider_dry_run_rerun', 'PR #326 secret setup must be metadata ready.')

assert(preflight.selectedEndpoint === 'https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions', 'Preflight endpoint must be US DashScope.')
assert(asArray(preflight.selectedAliases).includes('qwen-plus-us'), 'Preflight aliases must include qwen-plus-us.')
assert(asArray(preflight.selectedAliases).includes('qwen-flash-us'), 'Preflight aliases must include qwen-flash-us.')
assert(asArray(preflight.historicalAliasesExcluded).includes('qwen3.7-plus'), 'Historical qwen3.7-plus must be excluded.')
assert(asArray(preflight.historicalAliasesExcluded).includes('qwen3.7-max'), 'Historical qwen3.7-max must be excluded.')
assert(preflight.containsUserData === false, 'Rerun cases must not contain user data.')
assert(preflight.containsPrivateProjectData === false, 'Rerun cases must not contain private project data.')
assert(preflight.containsMedia === false, 'Rerun cases must not contain media.')

assert(deepseekPreservation.deepseekRerunAttempted === false, 'DeepSeek must not be rerun.')
assert(deepseekPreservation.status === 'passed', 'DeepSeek passed evidence must be preserved.')
assert(summary.activeRegion === 'us_virginia', 'Summary must use US region.')
assert(summary.endpointUsed === 'https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions', 'Summary endpoint must be US DashScope.')
assert(asArray(summary.historicalQwenAliasesUsed).length === 0, 'No historical qwen3.7 aliases may be used.')
assert(summary.deepseekRerunAttempted === false, 'Summary must preserve DeepSeek without rerun.')
assert(summary.rawProviderOutputPersisted === false, 'Raw provider output must not be persisted.')
assert(summary.modelGeneratedContentStored === false, 'Model-generated content must not be stored.')
assert(summary.secretPayloadPrinted === false, 'Secret payload must not be printed.')

const resultRows = asArray(caseResults.results).map(asRecord)
if (summary.qwenRerunAttempted === true) {
  assert(resultRows.length === 4, 'Qwen rerun must attempt exactly four approved cases.')
  for (const result of resultRows) {
    const modelId = String(result.modelId)
    assert(result.provider === 'qwen_dashscope', 'Only Qwen/DashScope cases may be included.')
    assert(result.endpoint === 'https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions', 'Case endpoint must be US DashScope.')
    assert(modelId === 'qwen-plus-us' || modelId === 'qwen-flash-us', 'Case model must be a US Qwen alias.')
    assert(!['qwen3.7-plus', 'qwen3.7-max'].includes(modelId), 'Historical aliases must not be used.')
    assert(result.rawProviderResponseStored === false, 'Raw provider response must not be stored.')
    assert(result.modelGeneratedContentStored === false, 'Model-generated content must not be stored.')
    assert(result.schemaValidationStatus === 'passed' || result.schemaValidationStatus === 'blocked', 'Schema validation status required.')
  }
  assert(schemaValidation.executed === true, 'Schema validation report must mark execution.')
} else {
  assert(asArray(blockerReport.activeBlockers).length > 0, 'Blocked no-call outcome must record blockers.')
}

assert(
  [
    'MODEL-ORCHESTRATION-PLAN-SNAPSHOT-CONTRACT-0: plan snapshot contract after provider dry-run, no workers/tools',
    'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-SECRET-SETUP-USER: complete external DashScope key/model permission setup, no provider calls',
    'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-CONTRACT-FIX: clarify Qwen/DashScope endpoint/model contract, no workers/tools/routes',
    'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-DRY-RUN-RERUN-FIX: fix Qwen rerun failures, no workers/tools/routes',
  ].includes(String(summary.nextRecommendedPrompt)),
  'Unexpected next prompt.',
)

const runtimeGates = asRecord(noRuntime.runtimeGates)
for (const [key, value] of Object.entries(runtimeGates)) {
  assert(value === false, `Runtime gate ${key} must remain false.`)
}

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REPORT_DIR),
  {
    file: 'docs/model-orchestration-qwen-deepseek-provider-dry-run-rerun-result.md',
    text: readFileSync('docs/model-orchestration-qwen-deepseek-provider-dry-run-rerun-result.md', 'utf8'),
  },
  {
    file: 'server/activation/model-orchestration-provider-dry-run/qwen-provider-dry-run-rerun.ts',
    text: readFileSync('server/activation/model-orchestration-provider-dry-run/qwen-provider-dry-run-rerun.ts', 'utf8'),
  },
]

for (const { file, text } of corpus) assertNoForbiddenText(text, file)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-qwen-deepseek-provider-dry-run-rerun',
  decision: summary.decision,
  qwenRerunAttempted: summary.qwenRerunAttempted,
  qwenRerunPassed: summary.qwenRerunPassed,
  providerDryRunNowPassesOverall: summary.providerDryRunNowPassesOverall,
  planSnapshotContractReady: summary.planSnapshotContractReady,
  deepseekRerunAttempted: summary.deepseekRerunAttempted,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
