import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function readText(file) {
  return readFileSync(file, 'utf8')
}

function collectFiles(paths) {
  const files = []
  for (const inputPath of paths) {
    if (!existsSync(inputPath)) continue
    const stats = statSync(inputPath)
    if (stats.isDirectory()) {
      for (const name of readdirSync(inputPath)) {
        files.push(...collectFiles([path.join(inputPath, name)]))
      }
    } else {
      files.push(inputPath)
    }
  }
  return files.sort()
}

const requiredDocs = [
  'docs/model-provider-dryrun-1b-source-of-truth-read.md',
  'docs/model-provider-dryrun-1b-secret-metadata-review.md',
  'docs/model-provider-dryrun-1b-results.md',
  'docs/implementation-prompts/prompt-model-dryrun-1b-qwen-dashscope-owner-secret-rotation-retry.md',
  'docs/activation-model-provider-dry-run-reports/model_provider_dryrun_1b_owner_rotation_retry_summary.json',
]

for (const file of requiredDocs) {
  assert(existsSync(file), `Missing MODEL-DRYRUN-1B file: ${file}`)
}

const packageJson = readJson('package.json')
assert(
  packageJson.scripts?.['model-provider:dryrun-1b:diagnostics'] === 'node scripts/validation/model-provider-dryrun-1b-diagnostics.mjs',
  'Missing package script model-provider:dryrun-1b:diagnostics',
)

const summary = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dryrun_1b_owner_rotation_retry_summary.json')
const oneA = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dryrun_1a_gate_fix_summary.json')
const readiness = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dry_run_readiness_report.json')
const providerResults = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dry_run_provider_results.json')

const allowedFinalStates = new Set([
  'provider_dry_run_passed',
  'blocked_pending_dashscope_secret_rotation_by_owner',
  'blocked_provider_call_failed',
  'blocked_provider_config_review',
  'blocked_secret_metadata_review',
])

assert(summary.phase === 'MODEL_DRYRUN_1B', '1B summary phase mismatch.')
assert(summary.status === 'blocked' || summary.status === 'passed' || summary.status === 'partial', '1B summary status mismatch.')
assert(allowedFinalStates.has(summary.finalState), `Unexpected 1B final state: ${summary.finalState}`)
assert(summary.ownerRepairSignal === 'no_new_repair_signal' || summary.ownerRepairSignal === 'new_enabled_version_detected' || summary.ownerRepairSignal === 'metadata_unavailable' || summary.ownerRepairSignal === 'owner_repair_confirmed', 'Unexpected owner repair signal.')
assert(summary.sourceOfTruthRead === true, 'Source-of-truth read must be recorded.')
assert(summary.providerConfigReviewed === true, 'Provider config review must be recorded.')
assert(summary.repoSideFixApplied === false, '1B must not claim a repo-side provider fix.')
assert(summary.secretManagerMetadataReviewed === true || summary.ownerRepairSignal === 'metadata_unavailable', 'Secret Manager metadata review must be recorded unless unavailable.')
assert(summary.secretManagerPayloadFetchedBy1bDiagnostics === false, '1B diagnostics must not fetch payloads.')
assert(summary.secretPayloadPrinted === false, 'Secret payload must not be printed.')
assert(summary.secretPayloadCommitted === false, 'Secret payload must not be committed.')
assert(summary.rawProviderResponsesCommitted === false, 'Raw provider responses must not be committed.')
assert(summary.supabaseUpdateStatus === 'docs_only', 'Supabase update status must remain docs_only.')
assert(summary.supabaseEnvironmentTouched === 'none', 'Supabase environment touched must remain none.')
assert(summary.sqlExecuted === 'none', 'SQL executed must remain none.')
assert(summary.migrationDeployed === 'no', 'Migration deployed must remain no.')
assert(summary.productionUnlocked === false, 'Production must remain locked.')
assert(summary.externalBetaUnlocked === false, 'External beta must remain locked.')

assert(summary.dashscopeMetadata?.secretName === 'DASHSCOPE_API_KEY', 'DashScope secret name mismatch.')
assert(summary.dashscopeMetadata?.resourcePathsCommitted === false, 'DashScope resource paths must not be committed.')
if (summary.ownerRepairSignal === 'no_new_repair_signal') {
  assert(summary.retryAllowed === false, 'Retry must not be allowed without a new repair signal.')
  assert(summary.retry?.executed === false, 'Retry must not execute without a new repair signal.')
  assert(summary.finalState === 'blocked_pending_dashscope_secret_rotation_by_owner', 'No-new-signal final state mismatch.')
  assert(summary.dashscopeMetadata.latestEnabledVersionObserved === oneA.dashscopeMetadata.latestEnabledVersionObserved, 'No-new-signal version must match 1A.')
  assert(summary.dashscopeMetadata.latestEnabledVersionCreateTime === oneA.dashscopeMetadata.latestEnabledVersionCreateTime, 'No-new-signal create time must match 1A.')
  assert(summary.providerCallsAttemptedBy1b === 0, '1B provider call count must be 0 when no retry runs.')
}

assert(readiness.rawProviderResponsesCommitted === false, 'Base readiness must not commit raw provider responses.')
assert(readiness.secretPayloadsPrinted === false, 'Base readiness must not print secret payloads.')
assert(readiness.secretPayloadsCommitted === false, 'Base readiness must not commit secret payloads.')

const qwen = providerResults.results?.find((result) => result.providerId === 'qwen_dashscope')
const deepseek = providerResults.results?.find((result) => result.providerId === 'deepseek')
assert(qwen?.modelId === 'qwen3.7-plus', 'Qwen provider result model mismatch.')
assert(deepseek?.modelId === 'deepseek-v4-flash', 'DeepSeek provider result model mismatch.')
assert(qwen.rawContentCommitted === false, 'Qwen raw content must not be committed.')
assert(deepseek.rawContentCommitted === false, 'DeepSeek raw content must not be committed.')

const requiredTerms = [
  'MODEL-DRYRUN-1B',
  'blocked_pending_dashscope_secret_rotation_by_owner',
  'no_new_repair_signal',
  'qwen3.7-plus',
  'deepseek-v4-flash',
  'docs_only',
  'No worker execution, tool execution, route execution',
]

const corpusFiles = collectFiles([
  ...requiredDocs,
  'docs/activation-phase-model-provider-dry-run-results.md',
  'docs/cross-chat/model-dryrun-1-handoff.md',
  'docs/runtime-unlock/model-dryrun-1-runtime-unlock-note.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
  'docs/activation-product-internal-beta-readiness-reports/internal_beta_blocker_inventory.json',
])

const corpus = corpusFiles.map((file) => ({ file, text: readText(file) }))
const combined = corpus.map(({ text }) => text).join('\n')
for (const term of requiredTerms) {
  assert(combined.includes(term), `Missing required MODEL-DRYRUN-1B term: ${term}`)
}

const forbiddenPatterns = [
  { pattern: /"secretPayloadsPrinted"\s*:\s*true/, label: 'secret payload printed true' },
  { pattern: /"secretPayloadsCommitted"\s*:\s*true/, label: 'secret payload committed true' },
  { pattern: /"secretManagerPayloadFetchedBy1bDiagnostics"\s*:\s*true/, label: '1B payload fetch true' },
  { pattern: /"rawProviderResponsesCommitted"\s*:\s*true/, label: 'raw provider response committed true' },
  { pattern: /"toolExecutionUsed"\s*:\s*true/, label: 'tool execution true' },
  { pattern: /"workerExecutionUsed"\s*:\s*true/, label: 'worker execution true' },
  { pattern: /"routeExecutionUsed"\s*:\s*true/, label: 'route execution true' },
  { pattern: /"publicArtifactsCreated"\s*:\s*true/, label: 'public artifacts true' },
  { pattern: /"signedUrlsCreated"\s*:\s*true/, label: 'signed urls true' },
  { pattern: /"productionUnlocked"\s*:\s*true/, label: 'production unlock true' },
  { pattern: /"externalBetaUnlocked"\s*:\s*true/, label: 'external beta unlock true' },
  { pattern: /postgres(?:ql)?:\/\/[^ \n"'`]+/i, label: 'raw database url' },
  { pattern: /https?:\/\/[^ \n"'`]*X-Goog-Signature=/i, label: 'signed url' },
  { pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, label: 'jwt-like secret' },
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'aws key' },
  { pattern: /sk-[A-Za-z0-9]{20,}/, label: 'secret-like api key' },
  { pattern: /BEGIN PRIVATE KEY/, label: 'private key' },
  { pattern: /projects\/[0-9]+\/secrets\/[^/\s]+\/versions\/[0-9]+/, label: 'Secret Manager resource path' },
  { pattern: /supabase\s+(link|db push|db reset)/i, label: 'supabase lifecycle command' },
  { pattern: /\bpsql\b/i, label: 'psql command' },
]

for (const { file, text } of corpus) {
  for (const { pattern, label } of forbiddenPatterns) {
    assert(!pattern.test(text), `Forbidden ${label} found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'MODEL_DRYRUN_1B',
  finalState: summary.finalState,
  ownerRepairSignal: summary.ownerRepairSignal,
  secretManagerMetadataReviewed: summary.secretManagerMetadataReviewed,
  secretPayloadCommitted: summary.secretPayloadCommitted,
  providerRetryExecuted: summary.retry.executed,
  qwenDashscopeStatus: summary.qwenDashscopeStatus,
  deepSeekStatus: summary.deepSeekStatus,
  supabaseUpdateRequired: summary.supabaseUpdateRequired,
  supabaseUpdateStatus: summary.supabaseUpdateStatus,
  supabaseEnvironmentTouched: summary.supabaseEnvironmentTouched,
  sqlExecuted: summary.sqlExecuted,
  migrationDeployed: summary.migrationDeployed,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
