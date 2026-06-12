import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_EXPECTED_REPORTS,
  WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR,
  buildWorkerRuntimeNoopDryRunExecutionReports,
} from '../activation/worker-runtime-noop-dry-run-execution'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const entries: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return entries
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) entries.push(...readAllFiles(fullPath))
    else entries.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return entries
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:worker-runtime-noop-dry-run-execution',
  'activation:worker-runtime-noop-dry-run-execution:report',
  'activation:worker-runtime-noop-dry-run-execution:summary',
  'smoke:activation-worker-runtime-noop-dry-run-execution',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/worker-runtime-noop-dry-run-execution/index.ts'), 'No-op dry-run execution module missing.')
assert(!existsSync('server/workers/worker-runtime-noop-dry-run-execution'), 'No-op dry-run must not add a worker implementation.')
assert(!existsSync('server/routes/worker-runtime-noop-dry-run-execution.ts'), 'No-op dry-run must not add a runtime route.')
assert(existsSync('docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json'), 'PR #342 approval decision missing.')
assert(existsSync('docs/activation-worker-runtime-dry-run-approval-reports/approved_plan_snapshot_dry_run_fixtures.json'), 'PR #342 fixture report missing.')
assert(existsSync(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR), 'No-op dry-run report dir missing.')
for (const report of WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_EXPECTED_REPORTS) {
  assert(existsSync(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, report)), `Missing no-op dry-run report: ${report}`)
}
for (const doc of [
  'docs/worker-runtime-noop-dry-run-execution-result.md',
  'docs/implementation-prompts/prompt-worker-runtime-unlock-2-dry-run-contract-review.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

for (const scanDir of ['server/activation/worker-runtime-noop-dry-run-execution']) {
  for (const { file, text } of readAllFiles(scanDir)) {
    assert(!text.includes("from 'node:child_process'"), `No-op worker dry-run must not import child_process: ${file}`)
    assert(!text.includes('spawn('), `No-op worker dry-run must not spawn processes: ${file}`)
    assert(!text.includes('spawnSync('), `No-op worker dry-run must not spawn processes: ${file}`)
    assert(!text.includes('execFile'), `No-op worker dry-run must not execute commands: ${file}`)
    assert(!text.includes('fetch('), `No-op worker dry-run must not make network calls: ${file}`)
    assert(!/from ['"].*server\/workers/i.test(text), `No-op worker dry-run must not import workers: ${file}`)
    assert(!/from ['"].*supabase/i.test(text), `No-op worker dry-run must not import Supabase clients: ${file}`)
    assert(!/from ['"].*provider/i.test(text), `No-op worker dry-run must not import providers: ${file}`)
    assert(!/from ['"].*track-a/i.test(text), `No-op worker dry-run must not import Track A: ${file}`)
  }
}

const reports = buildWorkerRuntimeNoopDryRunExecutionReports()
const approvalDecision = JSON.parse(readFileSync('docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json', 'utf8')) as Record<string, unknown>
const decision = reports.decision as Record<string, unknown>
const readiness = reports.readinessReport as Record<string, unknown>
const fixtureInventory = reports.fixtureInventory as Record<string, unknown>
const validFixtureResults = reports.validFixtureResults as Record<string, unknown>
const invalidFixtureResults = reports.invalidFixtureResults as Record<string, unknown>
const queue = reports.queueJobSidecarGuardrails as Record<string, unknown>
const artifact = reports.artifactSourceRefGuardrails as Record<string, unknown>
const rawPrompt = reports.rawPromptRejection as Record<string, unknown>
const signedUrlPublic = reports.signedUrlPublicArtifactRejection as Record<string, unknown>
const supabaseNoWrite = reports.supabaseNoWriteVerification as Record<string, unknown>
const runtimeNoExecution = reports.runtimeNoExecutionVerification as Record<string, unknown>

assert(approvalDecision.decision === 'approved_for_future_worker_noop_dry_run_execution', 'PR #342 approval decision must approve future no-op dry-run execution.')
assert(decision.decision === 'worker_noop_dry_run_passed_ready_for_contract_review', 'No-op dry-run decision should pass for contract review.')
assert(readiness.readyForWorkerRuntimeDryRunContractReview === true, 'No-op dry-run should be ready for contract review.')
assert(readiness.workerRuntimeExecutionReady === false, 'Worker runtime execution must not be ready.')
assert(readiness.workerDispatchReady === false, 'Worker dispatch must not be ready.')
assert(readiness.generatedLocalFixturePassedClaimed === false, 'generated_local_fixture_passed must not be claimed.')
assert(fixtureInventory.fixtureCount === 8, 'Expected 8 approved plan snapshot fixtures.')
assert(fixtureInventory.validFixtureCount === 4, 'Expected 4 valid fixtures.')
assert(fixtureInventory.invalidFailClosedFixtureCount === 4, 'Expected 4 invalid fail-closed fixtures.')
assert(validFixtureResults.status === 'passed', 'Valid fixtures must pass metadata-only validation.')
assert(validFixtureResults.acceptedCount === 4, 'All valid fixtures must be accepted.')
assert(invalidFixtureResults.status === 'passed', 'Invalid fixtures must pass fail-closed validation.')
assert(invalidFixtureResults.passedFailClosedCount === 4, 'All invalid fixtures must fail closed.')
assert(queue.queueEnqueueOccurred === false, 'No enqueue occurred.')
assert(queue.jobClaimOccurred === false, 'No claim occurred.')
assert(queue.jobLeaseOccurred === false, 'No lease occurred.')
assert(queue.sidecarSpawnOccurred === false, 'No sidecar spawn occurred.')
assert(queue.subprocessSpawnOccurred === false, 'No subprocess spawn occurred.')
assert(artifact.signedUrlsAsSourceOfTruthAllowed === false, 'Signed URLs as source of truth must be blocked.')
assert(artifact.publicArtifactUrlsAllowed === false, 'Public artifact URLs must be blocked.')
assert(rawPrompt.rawPromptRejected === true, 'Raw prompt fixture must be rejected.')
assert(signedUrlPublic.publicArtifactRejected === true, 'Public artifact fixture must be rejected.')
assert(signedUrlPublic.signedUrlSourceOfTruthRejected === true, 'Signed URL source-of-truth must be rejected.')
assert(supabaseNoWrite.supabaseEnvironmentTouched === 'no', 'Supabase environment must not be touched.')
assert(supabaseNoWrite.sqlExecuted === false, 'SQL must not execute.')
assert(supabaseNoWrite.migrationDeployed === false, 'Migrations must not deploy.')
assert(runtimeNoExecution.status === 'passed', 'Runtime no-execution verification must pass.')
assert(String(decision.nextRecommendedPhase).includes('WORKER-RUNTIME-UNLOCK-2'), 'Next prompt must be contract review.')

const allowedDecisions = new Set([
  'worker_noop_dry_run_passed_ready_for_contract_review',
  'worker_noop_dry_run_passed_with_warnings_ready_for_contract_review',
  'worker_noop_dry_run_blocked_preflight_failed',
  'worker_noop_dry_run_blocked_fixture_validation_failed',
  'worker_noop_dry_run_blocked_policy_violation',
  'worker_noop_dry_run_blocked_source_of_truth_conflict',
  'worker_noop_dry_run_failed',
])
assert(allowedDecisions.has(String(decision.decision)), 'Decision must be an allowed no-op dry-run decision.')

const corpus = [
  ...readAllFiles(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR),
  ...readAllFiles('server/activation/worker-runtime-noop-dry-run-execution'),
  ...[
    'server/smoke/activation-worker-runtime-noop-dry-run-execution-smoke.ts',
    'docs/worker-runtime-noop-dry-run-execution-result.md',
    'docs/implementation-prompts/prompt-worker-runtime-unlock-2-dry-run-contract-review.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"workerExecution"\s*:\s*true/,
    /"workerRuntimeExecutionReady"\s*:\s*true/,
    /"workerExecutionReady"\s*:\s*true/,
    /"jobDispatch"\s*:\s*true/,
    /"queueEnqueue"\s*:\s*true/,
    /"jobClaim"\s*:\s*true/,
    /"jobLease"\s*:\s*true/,
    /"sidecarSpawn"\s*:\s*true/,
    /"subprocessSpawn"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"providerCalls"\s*:\s*true/,
    /"dockerRun"\s*:\s*true/,
    /"cloudRunJob"\s*:\s*true/,
    /"cloudBuild"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"sqlExecuted"\s*:\s*true/,
    /"migrationDeployed"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /"externalBeta"\s*:\s*true/,
    /"paidProduction"\s*:\s*true/,
    /"generatedLocalFixturePassedClaimed"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /service[_-]?role[_-]?key\s*[:=]\s*["'][^"']+["']/i,
    /anon[_-]?key\s*[:=]\s*["'][^"']+["']/i,
    /authorization\s*:\s*bearer/i,
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
  phase: 'worker-runtime-noop-dry-run-execution',
  decision: decision.decision,
  fixtureCount: fixtureInventory.fixtureCount,
  validFixtures: `${validFixtureResults.acceptedCount}/${validFixtureResults.resultCount}`,
  invalidFailClosedFixtures: `${invalidFixtureResults.passedFailClosedCount}/${invalidFixtureResults.resultCount}`,
  workerExecution: false,
  jobDispatch: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
