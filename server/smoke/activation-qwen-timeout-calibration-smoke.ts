import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  QWEN_TIMEOUT_BLOCKED_SCOPES,
  QWEN_TIMEOUT_CALIBRATION_REPORT_DIR,
  QWEN_TIMEOUT_EXPECTED_ARTIFACTS,
  QWEN_TIMEOUT_FAILURES,
  buildQwenTimeoutCalibrationReports,
} from '../activation/model-orchestration-qwen-timeout-calibration'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
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

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:qwen-timeout-calibration',
  'activation:qwen-timeout-calibration:report',
  'activation:qwen-timeout-calibration:summary',
  'smoke:activation-qwen-timeout-calibration',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-timeout-calibration-types.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-timeout-calibration-policy.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-timeout-source-audit.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-schema-case-minimizer.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-timeout-target-runner.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-streaming-calibration.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-timeout-result-analyzer.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-timeout-artifacts.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/qwen-timeout-report-builder.ts',
  'server/activation/model-orchestration-qwen-timeout-calibration/index.ts',
]) {
  assert(existsSync(file), `Missing module file: ${file}`)
}

assert(!existsSync('server/workers/model-orchestration-qwen-timeout-calibration'), 'Qwen timeout calibration must not add a worker.')
assert(!existsSync('server/routes/model-orchestration-qwen-timeout-calibration.ts'), 'Qwen timeout calibration must not add a route.')

const reports = buildQwenTimeoutCalibrationReports()
const policy = reports.policy as Record<string, unknown>
assert(policy.secretSourcePolicy === 'google_secret_manager_only', 'Secret source must be Google Secret Manager only.')
assert(JSON.stringify(policy.exactSecretRefsOnly) === JSON.stringify(['DASHSCOPE_API_KEY', 'DASHSCOPE_BASE_URL', 'DASHSCOPE_REGION']), 'Unexpected Secret Manager refs.')
assert(policy.primaryModel === 'qwen3.7-plus', 'Primary model must remain qwen3.7-plus.')
assert(policy.escalationModel === 'qwen3.7-max', 'Escalation model must be qwen3.7-max.')
assert(policy.knownUnavailableModel === 'qwen-max', 'qwen-max must be recorded as unavailable.')
assert(policy.qwenMaxRetested === false, 'qwen-max must not be retested.')
assert(policy.deepseekCalls === false, 'DeepSeek calls must be false.')
assert(policy.fullProviderDryRun === false, 'Full provider dry-run must be false.')
assert(policy.supabaseWrites === false, 'Supabase writes must be false.')
assert(policy.sqlExecuted === false, 'SQL must not execute.')
assert(policy.migrationDeployed === false, 'Migration deployment must be false.')

for (const failure of [
  'provider_timeout',
  'first_byte_timeout',
  'stream_timeout',
  'schema_invalid',
  'model_alias_unavailable',
  'auth_regression',
  'region_mismatch',
  'output_too_large',
  'prompt_too_large',
]) {
  assert(QWEN_TIMEOUT_FAILURES.includes(failure as typeof QWEN_TIMEOUT_FAILURES[number]), `Missing failure class: ${failure}`)
}

for (const scope of [
  'full_qwen_deepseek_provider_dry_run',
  'deepseek_calls',
  'tools_workers_routes',
  'supabase_writes',
  'sql_migrations_schema_rls',
  'production',
]) {
  assert(QWEN_TIMEOUT_BLOCKED_SCOPES.includes(scope as typeof QWEN_TIMEOUT_BLOCKED_SCOPES[number]), `Missing blocked scope: ${scope}`)
}

for (const artifact of QWEN_TIMEOUT_EXPECTED_ARTIFACTS) {
  assert(typeof artifact === 'string' && artifact.endsWith('.json'), `Invalid expected artifact: ${String(artifact)}`)
}

const corpus = [
  ...readAllFiles(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR),
  ...[
    'docs/model-orchestration/qwen-timeout-calibration-runbook.md',
    'docs/model-orchestration/qwen-timeout-calibration-policy.md',
    'docs/activation-phase-qwen-timeout-calibration-results.md',
  ].filter(existsSync).map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"deepseekCalls"\s*:\s*true/,
    /"fullProviderDryRun"\s*:\s*true/,
    /"toolsWorkersRoutes"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"sqlExecuted"\s*:\s*true/,
    /"migrationDeployed"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"production"\s*:\s*true/,
    /"externalBeta"\s*:\s*true/,
    /"paidProduction"\s*:\s*true/,
    /"rawProviderResponsesStored"\s*:\s*true/,
    /"payloadPrinted"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /x-goog-signature=/i,
    /sk-[A-Za-z0-9]{20,}/,
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-qwen-timeout-calibration',
  decision: reports.readinessReport.decision,
  primaryModel: policy.primaryModel,
  deepseekCalls: false,
  fullProviderDryRun: false,
  rawProviderResponsesStored: false,
  secretPayloadPrinted: false,
  toolsWorkersRoutes: false,
  supabaseWrites: false,
  sqlExecuted: false,
}, null, 2))
