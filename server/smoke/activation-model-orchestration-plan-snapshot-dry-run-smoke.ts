import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR,
  buildModelOrchestrationPlanSnapshotDryRunReports,
} from '../activation/model-orchestration-plan-snapshot-dry-run'

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
  'activation:model-orchestration-plan-snapshot-dry-run:plan',
  'activation:model-orchestration-plan-snapshot-dry-run',
  'activation:model-orchestration-plan-snapshot-dry-run:report',
  'activation:model-orchestration-plan-snapshot-dry-run:summary',
  'smoke:activation-model-orchestration-plan-snapshot-dry-run',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/model-orchestration-plan-snapshot-dry-run/index.ts'), 'Plan snapshot dry-run module missing.')
assert(!existsSync('server/workers/model-orchestration-plan-snapshot-dry-run'), 'Plan snapshot dry-run must not add a worker.')
assert(!existsSync('server/routes/model-orchestration-plan-snapshot-dry-run.ts'), 'Plan snapshot dry-run must not add a route.')
assert(existsSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR), 'Plan snapshot dry-run report dir missing.')
for (const report of MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/model-orchestration-plan-snapshot-dry-run.md',
  'docs/model-orchestration-plan-snapshot-dry-run-decision.md',
  'docs/model-orchestration-plan-snapshot-fail-closed.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-repo-audit-after-plan-snapshot.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildModelOrchestrationPlanSnapshotDryRunReports()
const decision = reports.decision as Record<string, unknown>
const readiness = reports.readinessReport as Record<string, unknown>
const fixtures = reports.syntheticFixtures as Record<string, unknown>
const findingsToIntents = reports.findingsToIntentsValidation as Record<string, unknown>
const intentsToCandidate = reports.intentsToCandidateValidation as Record<string, unknown>
const approvalGate = reports.approvalGateValidation as Record<string, unknown>
const failClosed = reports.failClosedReport as Record<string, unknown>
const summary = reports.summaryReport as Record<string, unknown>

assert(decision.decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit', 'Dry-run decision should pass for worker runtime repo audit.')
assert(readiness.workerRuntimeRepoAuditReady === true, 'Worker runtime repo audit should be ready after dry-run pass.')
assert(fixtures.fixtureCount === 10, 'Expected 10 synthetic fixtures.')
assert(findingsToIntents.status === 'passed', 'Findings-to-intents validation must pass.')
assert(intentsToCandidate.status === 'passed', 'Intents-to-candidate validation must pass.')
assert(approvalGate.status === 'passed', 'Approval gate validation must pass.')
assert(failClosed.status === 'passed', 'Fail-closed validation must pass.')
assert(summary.unsafeOutputCount === 0, 'Unsafe output count must be zero.')
assert(summary.executionFlagsEnabledCount === 0, 'Execution flags enabled count must be zero.')
assert(summary.workerToolProviderExecutionCount === 0, 'Worker/tool/provider execution count must be zero.')
assert(summary.supabaseWritesCount === 0, 'Supabase writes count must be zero.')
assert(summary.productionTouched === false, 'Production must remain untouched.')

for (const [key, expected] of Object.entries({
  providerCalls: false,
  secretPayloadAccess: false,
  supabaseWrites: false,
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  rawPromptExecution: false,
  mediaProcessing: false,
  publicArtifacts: false,
  signedUrls: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR),
  ...[
    'docs/model-orchestration-plan-snapshot-dry-run.md',
    'docs/model-orchestration-plan-snapshot-dry-run-decision.md',
    'docs/model-orchestration-plan-snapshot-fail-closed.md',
    'docs/implementation-prompts/prompt-worker-runtime-jobs-repo-audit-after-plan-snapshot.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"providerCalls"\s*:\s*true/,
    /"secretPayloadAccess"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"workerExecution"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    new RegExp('BEGIN ' + 'PRIVATE KEY'),
    new RegExp('x-goog-' + 'signature=', 'i'),
    new RegExp('AKIA' + '[0-9A-Z]{16}'),
    new RegExp('sk-' + '[A-Za-z0-9]{20,}'),
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-plan-snapshot-dry-run',
  decision: decision.decision,
  fixtures: fixtures.fixtureCount,
  findingsToIntents: findingsToIntents.status,
  intentsToCandidate: intentsToCandidate.status,
  approvalGate: approvalGate.status,
  failClosed: failClosed.status,
  providerCalls: false,
  secretPayloadAccess: false,
  runtimeExecution: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
