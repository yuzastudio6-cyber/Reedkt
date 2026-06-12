import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
  WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR,
  buildWorkerRuntimeDryRunApprovalReports,
} from '../activation/worker-runtime-dry-run-approval'

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
  'activation:worker-runtime-dry-run-approval:plan',
  'activation:worker-runtime-dry-run-approval',
  'activation:worker-runtime-dry-run-approval:report',
  'activation:worker-runtime-dry-run-approval:summary',
  'smoke:activation-worker-runtime-dry-run-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/worker-runtime-dry-run-approval/index.ts'), 'Worker dry-run approval module missing.')
assert(!existsSync('server/workers/worker-runtime-dry-run-approval'), 'Approval packet must not add a worker implementation.')
assert(!existsSync('server/routes/worker-runtime-dry-run-approval.ts'), 'Approval packet must not add a runtime route.')
assert(existsSync(WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR), 'Worker dry-run approval report dir missing.')
for (const report of WORKER_RUNTIME_DRY_RUN_APPROVAL_EXPECTED_REPORTS) {
  assert(existsSync(path.join(WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/worker-runtime-dry-run-approval.md',
  'docs/worker-runtime-dry-run-scope-policy.md',
  'docs/worker-runtime-dry-run-artifact-scope-guardrails.md',
  'docs/worker-runtime-dry-run-queue-job-sidecar-policy.md',
  'docs/worker-runtime-dry-run-approval-decision.md',
  'docs/implementation-prompts/prompt-worker-runtime-noop-dry-run-execution.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildWorkerRuntimeDryRunApprovalReports()
const decision = reports.decision as Record<string, unknown>
const readiness = reports.readinessReport as Record<string, unknown>
const fixtures = reports.approvedPlanSnapshotFixtures as Record<string, unknown>
const scope = reports.scopePolicy as Record<string, unknown>
const artifact = reports.artifactScopeGuardrails as Record<string, unknown>
const queue = reports.queueJobSidecarPolicy as Record<string, unknown>
const observability = reports.observabilityCostFailureGuardrails as Record<string, unknown>
const failClosed = reports.failClosedPolicy as Record<string, unknown>

assert(decision.decision === 'approved_for_future_worker_noop_dry_run_execution', 'Worker dry-run approval decision should approve future no-op dry run.')
assert(readiness.futureNoopDryRunExecutionApproved === true, 'Future no-op dry-run execution should be approved.')
assert(readiness.workerExecutionReady === false, 'Worker execution must not be ready.')
assert(readiness.workerExecutionApproved === false, 'Worker execution must not be approved.')
assert(fixtures.status === 'passed', 'Approved plan snapshot fixtures must pass.')
assert(fixtures.fixtureCount === 8, 'Expected 8 approved plan snapshot fixtures.')
assert(fixtures.validFixtureCount === 4, 'Expected 4 valid synthetic fixtures.')
assert(fixtures.invalidFailClosedFixtureCount === 4, 'Expected 4 invalid fail-closed fixtures.')
assert(scope.status === 'passed', 'Scope policy must pass.')
assert(artifact.status === 'passed', 'Artifact guardrails must pass.')
assert(queue.status === 'passed', 'Queue/job/sidecar policy must pass.')
assert(observability.status === 'passed', 'Observability/cost/failure guardrails must pass.')
assert(failClosed.status === 'passed', 'Fail-closed policy must pass.')

for (const [key, expected] of Object.entries({
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  providerCalls: false,
  dockerRun: false,
  cloudRunJob: false,
  cloudBuild: false,
  mediaProcessing: false,
  supabaseWrites: false,
  publicArtifacts: false,
  signedUrls: false,
  rawPromptExecution: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
  secretPayloadPrinted: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}

const corpus = [
  ...readAllFiles(WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR),
  ...[
    'docs/worker-runtime-dry-run-approval.md',
    'docs/worker-runtime-dry-run-scope-policy.md',
    'docs/worker-runtime-dry-run-artifact-scope-guardrails.md',
    'docs/worker-runtime-dry-run-queue-job-sidecar-policy.md',
    'docs/worker-runtime-dry-run-approval-decision.md',
    'docs/implementation-prompts/prompt-worker-runtime-noop-dry-run-execution.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"workerExecution"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"providerCalls"\s*:\s*true/,
    /"dockerRun"\s*:\s*true/,
    /"cloudRunJob"\s*:\s*true/,
    /"cloudBuild"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /docker\s+run/i,
    /gcloud\s+run/i,
    /gcloud\s+builds/i,
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
  phase: 'worker-runtime-dry-run-approval-after-repo-audit',
  decision: decision.decision,
  futureNoopDryRunExecutionApproved: readiness.futureNoopDryRunExecutionApproved,
  workerExecution: false,
  toolExecution: false,
  providerCalls: false,
  dockerRun: false,
  cloudRunJob: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
