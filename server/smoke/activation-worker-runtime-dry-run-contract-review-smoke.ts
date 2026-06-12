import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_ALLOWED_DECISIONS,
  WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_EXPECTED_REPORTS,
  WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR,
  buildWorkerRuntimeDryRunContractReviewReports,
} from '../activation/worker-runtime-dry-run-contract-review'

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
  'activation:worker-runtime-dry-run-contract-review:report',
  'activation:worker-runtime-dry-run-contract-review:summary',
  'smoke:activation-worker-runtime-dry-run-contract-review',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const source of [
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_execution_decision.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json',
  'docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
]) {
  assert(existsSync(source), `Missing source evidence: ${source}`)
}

for (const report of WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_EXPECTED_REPORTS) {
  assert(existsSync(path.join(WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR, report)), `Missing contract review report: ${report}`)
}

for (const doc of [
  'docs/worker-runtime-unlock-2-dry-run-contract-review.md',
  'docs/implementation-prompts/prompt-worker-runtime-unlock-3-fixture-hardening.md',
]) {
  assert(existsSync(doc), `Missing contract review doc: ${doc}`)
}

for (const { file, text } of readAllFiles('server/activation/worker-runtime-dry-run-contract-review')) {
  assert(!text.includes("from 'node:child_process'"), `Contract review must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Contract review must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Contract review must not spawn processes: ${file}`)
  assert(!text.includes('execFile'), `Contract review must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Contract review must not make network calls: ${file}`)
  assert(!/from ['"].*server\/workers/i.test(text), `Contract review must not import workers: ${file}`)
  assert(!/from ['"].*supabase/i.test(text), `Contract review must not import Supabase clients: ${file}`)
  assert(!/from ['"].*provider/i.test(text), `Contract review must not import providers: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Contract review must not import Track A: ${file}`)
}

const reports = buildWorkerRuntimeDryRunContractReviewReports()
const decision = reports.decision as Record<string, unknown>
const noopEvidence = reports.noopEvidenceAcceptance as Record<string, unknown>
const fixture = reports.fixtureContractReview as Record<string, unknown>
const payload = reports.payloadSchemaReview as Record<string, unknown>
const result = reports.resultSchemaReview as Record<string, unknown>
const invalid = reports.invalidFixtureFailClosedReview as Record<string, unknown>
const queue = reports.queueJobSidecarContractReview as Record<string, unknown>
const claimLease = reports.claimLeaseIdempotencyContractReview as Record<string, unknown>
const artifact = reports.artifactSourceRefContractReview as Record<string, unknown>
const observability = reports.observabilityCostContractReview as Record<string, unknown>
const billing = reports.billingCreditContractReview as Record<string, unknown>
const supabase = reports.supabasePersistenceBlockerReview as Record<string, unknown>
const blockers = reports.workerExecutionBlockerRegister as Record<string, unknown>

assert(WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_ALLOWED_DECISIONS.includes(String(decision.decision) as typeof WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_ALLOWED_DECISIONS[number]), 'Decision must be allowed.')
assert(decision.decision === 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening', 'Expected pass decision for unchanged source state.')
assert(decision.dryRunContractsReadyForFixtureHardening === true, 'Dry-run contracts should be ready for fixture hardening.')
assert(decision.realWorkerExecutionReady === false, 'Real worker execution must remain blocked.')
assert(decision.workerDispatchReady === false, 'Worker dispatch must remain blocked.')
assert(decision.jobClaimReady === false, 'Job claim must remain blocked.')
assert(decision.jobLeaseReady === false, 'Job lease must remain blocked.')
assert(decision.supabasePersistenceReady === false, 'Supabase persistence must remain blocked.')
assert(noopEvidence.status === 'passed', 'No-op evidence acceptance must pass.')
assert(noopEvidence.sourceOfTruthConflictsFound === false, 'Source-of-truth conflicts must be false.')
assert(fixture.status === 'passed', 'Fixture contract review must pass.')
assert(payload.status === 'passed', 'Payload schema review must pass.')
assert(result.status === 'passed', 'Result schema review must pass.')
assert(invalid.status === 'passed', 'Invalid fixture fail-closed review must pass.')
assert(invalid.rawPromptRejected === true, 'Raw prompt rejection must be recorded.')
assert(invalid.publicArtifactRejected === true, 'Public artifact rejection must be recorded.')
assert(invalid.broadMediaRejected === true, 'Broad media rejection must be recorded.')
assert(invalid.productionWriteRejected === true, 'Production write rejection must be recorded.')
assert(invalid.signedUrlSourceOfTruthRejected === true, 'Signed URL source-of-truth rejection must be recorded.')
assert(queue.enqueue === false, 'No enqueue.')
assert(queue.dispatch === false, 'No dispatch.')
assert(queue.claim === false, 'No claim.')
assert(queue.lease === false, 'No lease.')
assert(queue.sidecarSpawn === false, 'No sidecar spawn.')
assert(queue.subprocessSpawn === false, 'No subprocess spawn.')
assert(claimLease.claimMutationAllowed === false, 'Claim mutation must be blocked.')
assert(claimLease.leaseMutationAllowed === false, 'Lease mutation must be blocked.')
assert(artifact.signedUrlRejectedAsSourceOfTruth === true, 'Signed URL source-of-truth must be rejected.')
assert(artifact.publicArtifactRejected === true, 'Public artifact must be rejected.')
assert(observability.auditMetadataOnly === true, 'Audit metadata must be metadata only.')
assert(billing.creditReservationCreated === false, 'Credit reservation must not be created.')
assert(supabase.supabaseEnvironmentTouched === 'no', 'Supabase environment must not be touched.')
assert(supabase.sqlExecuted === false, 'SQL must not execute.')
assert(supabase.migrationDeployed === false, 'Migrations must not deploy.')
assert(blockers.generatedLocalFixturePassedClaimed === false, 'generated_local_fixture_passed must not be claimed.')
assert(String(decision.nextRecommendedPhase).includes('WORKER-RUNTIME-UNLOCK-3'), 'Next prompt must be fixture hardening.')

const corpus = [
  ...readAllFiles(WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR),
  ...readAllFiles('server/activation/worker-runtime-dry-run-contract-review'),
  ...[
    'server/smoke/activation-worker-runtime-dry-run-contract-review-smoke.ts',
    'docs/worker-runtime-unlock-2-dry-run-contract-review.md',
    'docs/implementation-prompts/prompt-worker-runtime-unlock-3-fixture-hardening.md',
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
    /"claimMutation"\s*:\s*true/,
    /"leaseMutation"\s*:\s*true/,
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
    /"rawProviderOutputExecution"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /"internalBeta"\s*:\s*true/,
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
  phase: 'worker-runtime-dry-run-contract-review',
  decision: decision.decision,
  readyForFixtureHardening: decision.dryRunContractsReadyForFixtureHardening,
  workerExecution: false,
  jobDispatch: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
