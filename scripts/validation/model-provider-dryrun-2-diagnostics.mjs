import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'docs/model-provider-dryrun-2-source-of-truth-read.md',
  'docs/model-provider-dryrun-2-calibrated-target-review.md',
  'docs/model-provider-dryrun-2-results.md',
  'docs/implementation-prompts/prompt-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run.md',
  'docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_plan.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/provider_secret_access_report.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json',
]

const allowedFinalStates = new Set([
  'provider_dry_run_passed',
  'blocked_provider_call_failed',
  'blocked_qwen_timeout_or_schema',
  'blocked_secret_metadata_review',
  'blocked_provider_config_review',
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
if (existsSync(path.join(root, 'docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json'))) {
  summary = readJson('docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json')
}

if (!allowedFinalStates.has(summary.finalState)) {
  errors.push(`invalid_final_state:${summary.finalState ?? 'missing'}`)
}

const expectedPairs = [
  ['calibratedQwenTarget.modelId', summary.calibratedQwenTarget?.modelId, 'qwen3.7-plus'],
  ['calibratedQwenTarget.mode', summary.calibratedQwenTarget?.mode, 'non_streaming'],
  ['calibratedQwenTarget.timeoutMs', summary.calibratedQwenTarget?.timeoutMs, 45000],
  ['calibratedQwenTarget.maxOutputTokens', summary.calibratedQwenTarget?.maxOutputTokens, 650],
  ['calibratedQwenTarget.stream', summary.calibratedQwenTarget?.stream, false],
  ['calibratedQwenTarget.qwen37MaxUsed', summary.calibratedQwenTarget?.qwen37MaxUsed, false],
  ['dashscopeConfig.approvedBaseUrl', summary.dashscopeConfig?.approvedBaseUrl, 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'],
  ['dashscopeConfig.approvedRegion', summary.dashscopeConfig?.approvedRegion, 'us'],
  ['supabaseUpdateRequired', summary.supabaseUpdateRequired, 'docs/status only'],
  ['supabaseUpdateStatus', summary.supabaseUpdateStatus, 'docs_only'],
  ['supabaseEnvironmentTouched', summary.supabaseEnvironmentTouched, 'none'],
  ['sqlExecuted', summary.sqlExecuted, 'none'],
  ['migrationDeployed', summary.migrationDeployed, 'no'],
  ['secretPayloadPrinted', summary.secretPayloadPrinted, false],
  ['secretPayloadCommitted', summary.secretPayloadCommitted, false],
  ['rawProviderResponseCommitted', summary.rawProviderResponseCommitted, false],
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

const textFiles = requiredFiles.filter((file) => file.endsWith('.md'))
const combinedText = textFiles.filter((file) => existsSync(path.join(root, file))).map(read).join('\n')

for (const token of [
  'MODEL-DRYRUN-2',
  'qwen3.7-plus',
  'non_streaming',
  '45000ms',
  '650',
  'DASHSCOPE_BASE_URL',
  'DASHSCOPE_REGION',
  'DEEPSEEK_API_KEY',
  'docs/status only',
  'docs_only',
]) {
  if (!combinedText.includes(token)) errors.push(`missing_required_text:${token}`)
}

if (!combinedText.includes(requiredNoScope)) errors.push('missing_exact_no_scope_statement_in_docs')

const unsafeRegexes = [
  /\b(secretPayloadPrinted|secretPayloadCommitted|rawProviderResponseCommitted|rawProviderResponsesStored|publicArtifactsCreated|signedUrlsCreated|workerExecution|toolExecution|routeExecution|mediaProcessing|browserCapture|dockerCloudRunExecution|productionDeployment|externalBetaUnlock|paidProductionUnlock|productionBetaUnlock)\b\s*[:=]\s*true/i,
  /\b(Supabase mutation|SQL executed|migration deployed|signed URL creation|public artifact creation|production deployment|external beta unlock|paid production unlock|worker execution|tool execution|route execution)\b\s*[:=-]\s*(true|yes|enabled|passed|completed)/i,
  /sk-[A-Za-z0-9_-]{12,}/,
  /Bearer\s+[A-Za-z0-9._-]{12,}/i,
  /X-Goog-Signature=/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+/i,
  /raw provider response (stored|committed|printed)/i,
  /public artifact (created|uploaded|published)/i,
  /signed url (created|generated|used as source of truth)/i,
  /production (deployment|unlock) (enabled|completed|passed)/i,
]

const scanFiles = requiredFiles.filter((file) => existsSync(path.join(root, file)))
for (const file of scanFiles) {
  const body = read(file)
  for (const pattern of unsafeRegexes) {
    if (pattern.test(body)) errors.push(`unsafe_pattern:${file}:${pattern}`)
  }
}

const packageJson = readJson('package.json')
if (packageJson.scripts?.['model-provider:dryrun-2:diagnostics'] !== 'node scripts/validation/model-provider-dryrun-2-diagnostics.mjs') {
  errors.push('missing_package_script:model-provider:dryrun-2:diagnostics')
}

const plan = existsSync(path.join(root, 'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_plan.json'))
  ? readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_plan.json')
  : {}
if (plan.qwenApprovedBaseUrl !== 'https://dashscope-us.aliyuncs.com/compatible-mode/v1') errors.push('plan_missing_us_dashscope_base_url')
if (plan.calibratedQwenTarget?.timeoutMs !== 45000) errors.push('plan_missing_calibrated_timeout')
if (plan.calibratedQwenTarget?.maxOutputTokens !== 650) errors.push('plan_missing_calibrated_max_tokens')

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  modelProviderDryrun2Status: summary.finalState,
  qwenTarget: summary.calibratedQwenTarget,
  supabaseUpdateRequired: summary.supabaseUpdateRequired,
  supabaseUpdateStatus: summary.supabaseUpdateStatus,
  supabaseEnvironmentTouched: summary.supabaseEnvironmentTouched,
  sqlExecuted: summary.sqlExecuted,
  migrationDeployed: summary.migrationDeployed,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
