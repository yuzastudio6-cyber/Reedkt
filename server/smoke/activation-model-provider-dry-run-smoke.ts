import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
  MODEL_PROVIDER_DRY_RUN_REPORT_DIR,
  executeModelProviderDryRun,
} from '../activation/model-orchestration-provider-dry-run'

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
  'activation:model-provider-dry-run',
  'activation:model-provider-dry-run:report',
  'activation:model-provider-dry-run:iam-plan',
  'activation:model-provider-dry-run:summary',
  'smoke:activation-model-provider-dry-run',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

const result = await executeModelProviderDryRun({ execute: false, writeArtifacts: false })
assert(result.exitCode === 0, 'Report-only dry-run smoke should exit 0.')
assert(result.reports.readinessReport.status === 'skipped', 'Report-only readiness should be skipped.')
assert(
  result.reports.readinessReport.decision === 'report_only_not_executed',
  'Report-only readiness decision should be report_only_not_executed.',
)

assert(existsSync('server/activation/model-orchestration-provider-dry-run/index.ts'), 'Provider dry-run module missing.')
assert(!existsSync('server/workers/model-orchestration-provider-dry-run'), 'Provider dry-run must not add workers.')
assert(existsSync(MODEL_PROVIDER_DRY_RUN_REPORT_DIR), 'Provider dry-run report dir missing.')
for (const report of MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_PROVIDER_DRY_RUN_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/model-orchestration-provider-dry-run-runbook.md',
  'docs/model-orchestration-provider-dry-run-policy.md',
  'docs/model-orchestration-provider-dry-run-qa-policy.md',
  'docs/activation-phase-model-provider-dry-run-results.md',
  'docs/implementation-prompts/prompt-model-dryrun-1-qwen-deepseek-synthetic-provider-dry-run.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const readiness = result.reports.readinessReport
for (const [key, expected] of Object.entries({
  userDataUsed: false,
  rawMediaUsed: false,
  providerChainingUsed: false,
  toolExecutionUsed: false,
  workerExecutionUsed: false,
  routeExecutionUsed: false,
  browserCaptureUsed: false,
  mapRenderingUsed: false,
  mediaProcessingUsed: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  rawProviderResponsesCommitted: false,
  secretPayloadsPrinted: false,
  secretPayloadsCommitted: false,
  productionUnlocked: false,
  externalBetaUnlocked: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${String(expected)}.`)
}
assert(readiness.supabaseEnvironmentTouched === 'none', 'Supabase environment must remain none in report-only mode.')
assert(readiness.sqlExecuted === 'none', 'SQL must remain none in report-only mode.')
assert(readiness.migrationDeployed === 'no', 'Migration deployed must remain no in report-only mode.')

const corpus = [
  ...readAllFiles(MODEL_PROVIDER_DRY_RUN_REPORT_DIR),
  ...[
    'docs/model-orchestration-provider-dry-run-runbook.md',
    'docs/model-orchestration-provider-dry-run-policy.md',
    'docs/model-orchestration-provider-dry-run-qa-policy.md',
    'docs/activation-phase-model-provider-dry-run-results.md',
    'docs/implementation-prompts/prompt-model-dryrun-1-qwen-deepseek-synthetic-provider-dry-run.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"secretPayloadsPrinted"\s*:\s*true/,
    /"secretPayloadsCommitted"\s*:\s*true/,
    /"rawProviderResponsesCommitted"\s*:\s*true/,
    /"toolExecutionUsed"\s*:\s*true/,
    /"workerExecutionUsed"\s*:\s*true/,
    /"publicArtifactsCreated"\s*:\s*true/,
    /"signedUrlsCreated"\s*:\s*true/,
    /"productionUnlocked"\s*:\s*true/,
    /"externalBetaUnlocked"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^ \n"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /BEGIN PRIVATE KEY/,
    /x-goog-signature=/i,
    /AKIA[0-9A-Z]{16}/,
    /sk-[A-Za-z0-9]{20,}/,
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'MODEL_DRYRUN_1',
  decision: readiness.decision,
  providerCalls: 'report_only_not_attempted',
  secretPayloadAccess: 'report_only_not_attempted',
  supabaseEnvironmentTouched: readiness.supabaseEnvironmentTouched,
  sqlExecuted: readiness.sqlExecuted,
  migrationDeployed: readiness.migrationDeployed,
}, null, 2))
