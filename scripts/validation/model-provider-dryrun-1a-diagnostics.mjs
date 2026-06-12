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
  'docs/model-provider-dryrun-1a-qwen-dashscope-failure-diagnosis.md',
  'docs/model-provider-dryrun-1a-provider-config-review.md',
  'docs/model-provider-dryrun-1a-results.md',
  'docs/implementation-prompts/prompt-model-dryrun-1a-qwen-deepseek-dry-run-gate-fixes.md',
  'docs/activation-model-provider-dry-run-reports/model_provider_dryrun_1a_gate_fix_summary.json',
]

for (const file of requiredDocs) {
  assert(existsSync(file), `Missing MODEL-DRYRUN-1A file: ${file}`)
}

const packageJson = readJson('package.json')
assert(
  packageJson.scripts?.['model-provider:dryrun-1a:diagnostics'] === 'node scripts/validation/model-provider-dryrun-1a-diagnostics.mjs',
  'Missing package script model-provider:dryrun-1a:diagnostics',
)

const readiness = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dry_run_readiness_report.json')
const providerResults = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dry_run_provider_results.json')
const secretResolution = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dry_run_secret_resolution.json')
const failClosed = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dry_run_fail_closed.json')
const summary = readJson('docs/activation-model-provider-dry-run-reports/model_provider_dryrun_1a_gate_fix_summary.json')

assert(readiness.status === 'blocked', 'Readiness status must remain blocked after Qwen 401.')
assert(readiness.decision === 'blocked_provider_call_failed', 'Base readiness decision must preserve blocked_provider_call_failed.')
assert(readiness.qwenModel === 'qwen3.7-plus', 'Qwen model mismatch.')
assert(readiness.deepseekModel === 'deepseek-v4-flash', 'DeepSeek model mismatch.')
assert(readiness.supabaseUpdateStatus === 'docs_only', 'Supabase update status must remain docs_only.')
assert(readiness.supabaseEnvironmentTouched === 'none', 'Supabase environment touched must remain none.')
assert(readiness.sqlExecuted === 'none', 'SQL executed must remain none.')
assert(readiness.migrationDeployed === 'no', 'Migration deployed must remain no.')
assert(readiness.secretPayloadsPrinted === false, 'Secret payloads must not be printed.')
assert(readiness.secretPayloadsCommitted === false, 'Secret payloads must not be committed.')
assert(readiness.rawProviderResponsesCommitted === false, 'Raw provider responses must not be committed.')
assert(readiness.productionUnlocked === false, 'Production must remain locked.')
assert(readiness.externalBetaUnlocked === false, 'External beta must remain locked.')

const qwen = providerResults.results?.find((result) => result.providerId === 'qwen_dashscope')
const deepseek = providerResults.results?.find((result) => result.providerId === 'deepseek')
assert(qwen, 'Missing Qwen provider result.')
assert(deepseek, 'Missing DeepSeek provider result.')
assert(qwen.modelId === 'qwen3.7-plus', 'Qwen result model mismatch.')
assert(qwen.status === 'blocked', 'Qwen result must remain blocked.')
assert(qwen.httpStatus === 401, 'Qwen result must record HTTP 401.')
assert(String(qwen.blocker ?? '').includes('Incorrect API key provided'), 'Qwen blocker must record sanitized incorrect API key class.')
assert(qwen.rawContentCommitted === false, 'Qwen raw content must not be committed.')
assert(deepseek.modelId === 'deepseek-v4-flash', 'DeepSeek result model mismatch.')
assert(deepseek.status === 'passed', 'DeepSeek result must pass.')
assert(deepseek.rawContentCommitted === false, 'DeepSeek raw content must not be committed.')
assert(providerResults.providerCallsAttempted === 2, 'Provider call attempt count must be 2.')
assert(providerResults.providerCallsPassed === 1, 'Provider pass count must be 1.')

assert(secretResolution.status === 'passed', 'Secret resolution report must pass.')
assert(secretResolution.payloadValuesPrinted === false, 'Secret resolution must not print payloads.')
assert(secretResolution.payloadValuesCommitted === false, 'Secret resolution must not commit payloads.')
for (const secret of secretResolution.secrets ?? []) {
  assert(secret.payloadPrinted === false, `Secret payload printed for ${secret.secretName}`)
  assert(secret.payloadCommitted === false, `Secret payload committed for ${secret.secretName}`)
}

assert(failClosed.status === 'blocked', 'Fail-closed report must remain blocked.')
assert(failClosed.gates?.providerCallsPassed === false, 'Fail-closed provider gate must remain false.')

assert(summary.phase === 'MODEL_DRYRUN_1A', '1A summary phase mismatch.')
assert(summary.decision === 'blocked_pending_dashscope_secret_rotation_by_owner', '1A summary decision mismatch.')
assert(summary.repoSideFixApplied === false, '1A must not claim a repo-side fix.')
assert(summary.secretManagerMetadataReviewed === true, '1A metadata review must be recorded.')
assert(summary.secretManagerPayloadFetchedBy1aDiagnostics === false, '1A diagnostic must not fetch payloads.')
assert(summary.retry?.executed === true, '1A retry execution must be recorded.')
assert(summary.retry?.qwenStatus === 'blocked_http_401', '1A Qwen retry status mismatch.')
assert(summary.retry?.deepseekStatus === 'passed', '1A DeepSeek retry status mismatch.')
assert(summary.privateArtifactUpload === 'not_attempted_provider_gate_blocked', 'Private artifact upload must be blocked by provider gate.')
assert(summary.supabaseUpdateStatus === 'docs_only', '1A summary Supabase status must remain docs_only.')
assert(summary.sqlExecuted === 'none', '1A summary SQL status must remain none.')
assert(summary.migrationDeployed === 'no', '1A summary migration status must remain no.')

const requiredTerms = [
  'blocked_pending_dashscope_secret_rotation_by_owner',
  'blocked_http_401',
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
  assert(combined.includes(term), `Missing required MODEL-DRYRUN-1A term: ${term}`)
}

const forbiddenPatterns = [
  { pattern: /"secretPayloadsPrinted"\s*:\s*true/, label: 'secret payload printed true' },
  { pattern: /"secretPayloadsCommitted"\s*:\s*true/, label: 'secret payload committed true' },
  { pattern: /"rawProviderResponsesCommitted"\s*:\s*true/, label: 'raw provider response committed true' },
  { pattern: /"toolExecutionUsed"\s*:\s*true/, label: 'tool execution true' },
  { pattern: /"workerExecutionUsed"\s*:\s*true/, label: 'worker execution true' },
  { pattern: /"routeExecutionUsed"\s*:\s*true/, label: 'route execution true' },
  { pattern: /"publicArtifactsCreated"\s*:\s*true/, label: 'public artifacts true' },
  { pattern: /"signedUrlsCreated"\s*:\s*true/, label: 'signed urls true' },
  { pattern: /"productionUnlocked"\s*:\s*true/, label: 'production unlock true' },
  { pattern: /"externalBetaUnlocked"\s*:\s*true/, label: 'external beta unlock true' },
  { pattern: /postgres(?:ql)?:\/\/[^ \n"'`]+/i, label: 'raw database url' },
  { pattern: /x-goog-signature=/i, label: 'signed url' },
  { pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, label: 'jwt-like secret' },
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'aws key' },
  { pattern: /sk-[A-Za-z0-9]{20,}/, label: 'secret-like api key' },
  { pattern: /BEGIN PRIVATE KEY/, label: 'private key' },
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
  phase: 'MODEL_DRYRUN_1A',
  decision: summary.decision,
  qwenStatus: summary.retry.qwenStatus,
  deepseekStatus: summary.retry.deepseekStatus,
  repoSideFixApplied: summary.repoSideFixApplied,
  secretManagerMetadataReviewed: summary.secretManagerMetadataReviewed,
  secretPayloadCommitted: summary.secretPayloadCommitted,
  rawProviderResponsesCommitted: readiness.rawProviderResponsesCommitted,
  supabaseUpdateStatus: summary.supabaseUpdateStatus,
  supabaseEnvironmentTouched: summary.supabaseEnvironmentTouched,
  sqlExecuted: summary.sqlExecuted,
  migrationDeployed: summary.migrationDeployed,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
