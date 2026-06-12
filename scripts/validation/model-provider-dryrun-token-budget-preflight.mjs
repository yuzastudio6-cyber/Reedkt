import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const maxTotalTokens = 7200
const requiredMarginTokens = 600

const files = {
  source: 'server/activation/model-orchestration-provider-dry-run/index.ts',
  qwenReport: 'docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json',
  deepseekReport: 'docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json',
  comparisonReport: 'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_comparison_report.json',
  modelDryRun2Summary: 'docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json',
}

const errors = []

function read(file) {
  return readFileSync(path.join(root, file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

for (const file of Object.values(files)) {
  if (!existsSync(path.join(root, file))) errors.push(`missing_required_file:${file}`)
}

let summary = {}
let comparison = {}
let qwenReport = {}
let deepseekReport = {}
let source = ''

if (errors.length === 0) {
  summary = readJson(files.modelDryRun2Summary)
  comparison = readJson(files.comparisonReport)
  qwenReport = readJson(files.qwenReport)
  deepseekReport = readJson(files.deepseekReport)
  source = read(files.source)
}

const qwenMaxMatch = source.match(/MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS\s*=\s*(\d+)/)
const qwenMaxOutputTokens = qwenMaxMatch ? Number(qwenMaxMatch[1]) : NaN

if (!source.includes('MODEL_DRY_RUN_QWEN_ENABLE_THINKING = false')) {
  errors.push('qwen_thinking_constant_not_false')
}

if (!source.includes('enable_thinking: MODEL_DRY_RUN_QWEN_ENABLE_THINKING')) {
  errors.push('qwen_request_body_missing_enable_thinking_false')
}

if (comparison.maxTotalTokens !== maxTotalTokens) {
  errors.push(`max_total_tokens_changed:${comparison.maxTotalTokens ?? 'missing'}`)
}

if (summary.activeBlockers && Array.isArray(summary.activeBlockers) &&
    summary.finalState === 'blocked_provider_call_failed' &&
    !summary.activeBlockers.includes('provider_cost_or_token_guardrail_exceeded')) {
  errors.push('model_dryrun2_summary_missing_cost_guardrail_blocker')
}

if (!Number.isFinite(qwenMaxOutputTokens) || qwenMaxOutputTokens !== 650) {
  errors.push(`qwen_max_output_tokens_not_650:${String(qwenMaxOutputTokens)}`)
}

const qwenResults = Array.isArray(qwenReport.results) ? qwenReport.results : []
const deepseekResults = Array.isArray(deepseekReport.results) ? deepseekReport.results : []
const qwenPromptTokens = qwenResults.reduce((total, result) => total + Number(result.usage?.promptTokens ?? 0), 0)
const qwenCompletionTokens = qwenResults.reduce((total, result) => total + Number(result.usage?.completionTokens ?? 0), 0)
const qwenEvidenceTotal = qwenResults.reduce((total, result) => total + Number(result.usage?.totalTokens ?? 0), 0)
const deepseekEvidenceTotal = deepseekResults.reduce((total, result) => total + Number(result.usage?.totalTokens ?? 0), 0)
const evidenceTotal = Number(comparison.totalTokensReported ?? (qwenEvidenceTotal + deepseekEvidenceTotal))
const projectedQwenCompletionTokens = qwenResults.length * qwenMaxOutputTokens
const projectedTotalTokens = qwenPromptTokens + projectedQwenCompletionTokens + deepseekEvidenceTotal
const projectedMarginTokens = maxTotalTokens - projectedTotalTokens

if (qwenResults.length !== 4) errors.push(`unexpected_qwen_case_count:${qwenResults.length}`)
if (deepseekResults.length !== 3) errors.push(`unexpected_deepseek_case_count:${deepseekResults.length}`)

if (evidenceTotal > maxTotalTokens && projectedMarginTokens < requiredMarginTokens) {
  errors.push(`projected_margin_too_small:${projectedMarginTokens}`)
}

if (projectedTotalTokens >= maxTotalTokens) {
  errors.push(`projected_total_not_under_cap:${projectedTotalTokens}`)
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'MODEL-DRYRUN-2A',
  sourceEvidenceFinalState: summary.finalState ?? 'missing',
  sourceEvidenceTotalTokens: evidenceTotal,
  maxTotalTokens,
  qwenCaseCount: qwenResults.length,
  deepseekCaseCount: deepseekResults.length,
  qwenThinkingEnabled: false,
  qwenPromptTokens,
  qwenEvidenceCompletionTokens: qwenCompletionTokens,
  qwenProjectedCompletionTokens: projectedQwenCompletionTokens,
  deepseekEvidenceTotal,
  projectedTotalTokens,
  projectedMarginTokens,
  requiredMarginTokens,
  retryPreflightDecision: projectedTotalTokens < maxTotalTokens && projectedMarginTokens >= requiredMarginTokens
    ? 'static_budget_preflight_passed'
    : 'static_budget_preflight_blocked',
}, null, 2))
