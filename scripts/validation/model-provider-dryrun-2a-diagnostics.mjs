import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'docs/model-provider-dryrun-2a-source-of-truth-read.md',
  'docs/model-provider-dryrun-2a-token-guardrail-diagnosis.md',
  'docs/model-provider-dryrun-2a-static-budget-plan.md',
  'docs/model-provider-dryrun-2a-results.md',
  'docs/implementation-prompts/prompt-model-dryrun-2a-provider-token-guardrail-fixes.md',
  'docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2a_summary.json',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'server/activation/model-orchestration-provider-dry-run/index.ts',
  'scripts/validation/model-provider-dryrun-token-budget-preflight.mjs',
]

const allowedFinalStates = new Set([
  'provider_dry_run_passed',
  'blocked_provider_call_failed',
  'blocked_qwen_timeout_or_schema',
  'blocked_secret_metadata_review',
  'blocked_provider_config_review',
  'blocked_pending_execute_retry',
])

const requiredNoScope =
  'No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.'

const errors = []

function read(file) {
  return readFileSync(path.join(root, file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) errors.push(`missing_required_file:${file}`)
}

let summary = {}
if (existsSync(path.join(root, 'docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2a_summary.json'))) {
  summary = readJson('docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2a_summary.json')
}

if (!allowedFinalStates.has(summary.finalState)) {
  errors.push(`invalid_final_state:${summary.finalState ?? 'missing'}`)
}

const expectedPairs = [
  ['phase', summary.phase, 'MODEL-DRYRUN-2A'],
  ['maxTotalTokens', summary.tokenGuardrail?.maxTotalTokens, 7200],
  ['qwenEnableThinking', summary.qwenTokenGuardrailControl?.enableThinking, false],
  ['qwenModel', summary.qwenTokenGuardrailControl?.modelId, 'qwen3.7-plus'],
  ['qwenMode', summary.qwenTokenGuardrailControl?.mode, 'non_streaming'],
  ['qwenTimeoutMs', summary.qwenTokenGuardrailControl?.timeoutMs, 45000],
  ['qwenMaxOutputTokens', summary.qwenTokenGuardrailControl?.maxOutputTokens, 650],
  ['qwen37MaxUsed', summary.qwenTokenGuardrailControl?.qwen37MaxUsed, false],
  ['caseCountPreserved', summary.caseMatrix?.approvedSyntheticProviderCasesPreserved, 7],
  ['supabaseUpdateRequired', summary.supabaseUpdateRequired, 'docs/status only'],
  ['supabaseUpdateStatus', summary.supabaseUpdateStatus, 'docs_only'],
  ['supabaseEnvironmentTouched', summary.supabaseEnvironmentTouched, 'none'],
  ['sqlExecuted', summary.sqlExecuted, 'none'],
  ['migrationDeployed', summary.migrationDeployed, 'no'],
  ['secretPayloadPrinted', summary.secretPayloadPrinted, false],
  ['secretPayloadCommitted', summary.secretPayloadCommitted, false],
  ['rawProviderResponseCommitted', summary.rawProviderResponseCommitted, false],
  ['rawProviderResponsesStored', summary.rawProviderResponsesStored, false],
  ['workerExecution', summary.workerExecution, false],
  ['toolExecution', summary.toolExecution, false],
  ['routeExecution', summary.routeExecution, false],
  ['productionBetaUnlock', summary.productionBetaUnlock, false],
]

for (const [label, actual, expected] of expectedPairs) {
  if (actual !== expected) errors.push(`summary_mismatch:${label}:${String(actual)}!=${String(expected)}`)
}

if (summary.noScopeStatement !== requiredNoScope) {
  errors.push('missing_exact_no_scope_statement_in_summary')
}

const source = existsSync(path.join(root, 'server/activation/model-orchestration-provider-dry-run/index.ts'))
  ? read('server/activation/model-orchestration-provider-dry-run/index.ts')
  : ''
if (!source.includes('MODEL_DRY_RUN_QWEN_ENABLE_THINKING = false')) errors.push('source_missing_qwen_thinking_false_constant')
if (!source.includes('enable_thinking: MODEL_DRY_RUN_QWEN_ENABLE_THINKING')) errors.push('source_missing_qwen_enable_thinking_request_field')
if (!source.includes('maxTotalTokens: 7200')) errors.push('source_missing_unchanged_7200_cap')

const packageJson = existsSync(path.join(root, 'package.json')) ? readJson('package.json') : { scripts: {} }
if (packageJson.scripts?.['model-provider:dryrun-token-budget:preflight'] !== 'node scripts/validation/model-provider-dryrun-token-budget-preflight.mjs') {
  errors.push('missing_package_script:model-provider:dryrun-token-budget:preflight')
}
if (packageJson.scripts?.['model-provider:dryrun-2a:diagnostics'] !== 'node scripts/validation/model-provider-dryrun-2a-diagnostics.mjs') {
  errors.push('missing_package_script:model-provider:dryrun-2a:diagnostics')
}

const textFiles = requiredFiles.filter((file) => file.endsWith('.md'))
const combinedText = textFiles.filter((file) => existsSync(path.join(root, file))).map(read).join('\n')

for (const token of [
  'MODEL-DRYRUN-2A',
  'provider_cost_or_token_guardrail_exceeded',
  'enable_thinking: false',
  'maxTotalTokens=7200',
  'qwen3.7-plus',
  '45000ms',
  '650',
  '7842',
  '7200',
  'docs/status only',
  'docs_only',
]) {
  if (!combinedText.includes(token)) errors.push(`missing_required_text:${token}`)
}

if (!combinedText.includes(requiredNoScope)) errors.push('missing_exact_no_scope_statement_in_docs')

const unsafeRegexes = [
  /\b(secretPayloadPrinted|secretPayloadCommitted|rawProviderResponseCommitted|rawProviderResponsesStored|publicArtifactsCreated|signedUrlsCreated|workerExecution|toolExecution|routeExecution|mediaProcessing|browserCapture|dockerCloudRunExecution|productionDeployment|externalBetaUnlock|paidProductionUnlock|productionBetaUnlock)\b\s*[:=]\s*true/i,
  /sk-[A-Za-z0-9_-]{12,}/,
  /Bearer\s+[A-Za-z0-9._-]{12,}/i,
  /X-Goog-Signature=/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+/i,
  /raw provider response (stored|committed|printed):\s*(true|yes|enabled)/i,
  /public artifact (created|uploaded|published):\s*(true|yes|enabled)/i,
  /signed url (created|generated|used as source of truth):\s*(true|yes|enabled)/i,
  /production (deployment|unlock) (enabled|completed|passed)/i,
]

for (const file of requiredFiles.filter((item) => existsSync(path.join(root, item)))) {
  const body = read(file)
  for (const pattern of unsafeRegexes) {
    if (pattern.test(body)) errors.push(`unsafe_pattern:${file}:${pattern}`)
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  modelProviderDryrun2aStatus: summary.finalState,
  qwenThinkingEnabled: summary.qwenTokenGuardrailControl?.enableThinking,
  maxTotalTokens: summary.tokenGuardrail?.maxTotalTokens,
  supabaseUpdateRequired: summary.supabaseUpdateRequired,
  supabaseUpdateStatus: summary.supabaseUpdateStatus,
  supabaseEnvironmentTouched: summary.supabaseEnvironmentTouched,
  sqlExecuted: summary.sqlExecuted,
  migrationDeployed: summary.migrationDeployed,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
