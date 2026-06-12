import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const reportDir = 'docs/activation-worker-runtime-unlock-0-repo-audit-reports'
const resultDoc = 'docs/worker-runtime-unlock-0-repo-audit.md'
const nextPrompt = 'docs/implementation-prompts/prompt-worker-runtime-unlock-1-dry-run-plan.md'

const requiredReports = [
  'worker_runtime_source_of_truth_audit.json',
  'worker_runtime_existing_implementation_inventory.json',
  'worker_runtime_contract_inventory.json',
  'worker_runtime_job_claim_lease_idempotency_inventory.json',
  'worker_runtime_plan_snapshot_handoff_review.json',
  'worker_runtime_payload_boundary_review.json',
  'worker_runtime_supabase_dependency_map.json',
  'worker_runtime_cloudrun_docker_dependency_map.json',
  'worker_runtime_tool_provider_route_dependency_map.json',
  'worker_runtime_observability_cost_dependency_map.json',
  'worker_runtime_billing_dependency_map.json',
  'worker_runtime_blocked_use_register.json',
  'worker_runtime_duplicate_work_risk_register.json',
  'worker_runtime_internal_testing_gap_map.json',
  'worker_runtime_repo_audit_decision.json',
  'worker_runtime_no_execution_policy.json',
  'worker_runtime_summary.json',
]

const allowedDecisions = new Set([
  'worker_runtime_repo_audit_passed_ready_for_dry_run_plan',
  'worker_runtime_repo_audit_passed_with_warnings_ready_for_dry_run_plan',
  'worker_runtime_repo_audit_blocked_missing_contracts',
  'worker_runtime_repo_audit_blocked_missing_supabase_owner_handoff',
  'worker_runtime_repo_audit_blocked_duplicate_ownership_risk',
  'worker_runtime_repo_audit_blocked_source_of_truth_conflict',
])

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function readAllFiles(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

function assertNoForbiddenText(text, file) {
  const forbidden = [
    /worker_runtime_execution_ready/i,
    /worker_dispatch_ready/i,
    /staging_ready/i,
    /production_ready/i,
    /beta_ready/i,
    /"workerRuntimeExecutionReady"\s*:\s*true/i,
    /"workerExecution"\s*:\s*true/i,
    /"jobDispatch"\s*:\s*true/i,
    /"jobClaimLeaseMutation"\s*:\s*true/i,
    /"supabaseMutation"\s*:\s*true/i,
    /"supabaseWrites"\s*:\s*true/i,
    /"sqlExecuted"\s*:\s*true/i,
    /"sqlExecution"\s*:\s*true/i,
    /"migrationDeployed"\s*:\s*true/i,
    /"providerCall"\s*:\s*true/i,
    /"toolExecution"\s*:\s*true/i,
    /"routeExecution"\s*:\s*true/i,
    /"rawPromptExecution"\s*:\s*true/i,
    /"publicArtifactCreation"\s*:\s*true/i,
    /"publicArtifacts"\s*:\s*true/i,
    /"signedUrlCreation"\s*:\s*true/i,
    /"signedUrls"\s*:\s*true/i,
    /"productionClaimed"\s*:\s*true/i,
    /"externalBetaClaimed"\s*:\s*true/i,
    /"paidProductionClaimed"\s*:\s*true/i,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /authorization\s*[:=]\s*bearer/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /x-amz-signature|x-goog-signature|x-amz-credential|x-goog-credential|[?&]signature=/i,
    /raw_provider_response_body|rawProviderResponseBody|provider_response_payload|providerResponsePayload/i,
  ]
  for (const pattern of forbidden) {
    assert(!pattern.test(text), `Forbidden audit claim or secret-like marker found in ${file}: ${pattern}`)
  }
}

assert(existsSync(reportDir), 'Report directory missing.')
for (const report of requiredReports) {
  assert(existsSync(path.join(reportDir, report)), `Missing report: ${report}`)
}
assert(existsSync(resultDoc), 'Result doc missing.')
assert(existsSync(nextPrompt), 'Next prompt missing.')

const decision = readJson(path.join(reportDir, 'worker_runtime_repo_audit_decision.json'))
const summary = readJson(path.join(reportDir, 'worker_runtime_summary.json'))
const source = readJson(path.join(reportDir, 'worker_runtime_source_of_truth_audit.json'))
const noExecution = readJson(path.join(reportDir, 'worker_runtime_no_execution_policy.json'))
const supabase = readJson(path.join(reportDir, 'worker_runtime_supabase_dependency_map.json'))
const payload = readJson(path.join(reportDir, 'worker_runtime_payload_boundary_review.json'))

assert(allowedDecisions.has(decision.decision), `Unsupported audit decision: ${decision.decision}`)
assert(summary.decision === decision.decision, 'Summary decision must match decision report.')
assert(source.pr335PlanSnapshotContractReviewed === true, 'PR #335 handoff must be reviewed.')
assert(source.pr335Decision === 'ready_for_plan_snapshot_contract_handoff', 'PR #335 decision mismatch.')
assert(source.sourceOfTruthConflictsFound === false, 'Source-of-truth conflict must not be present.')
assert(decision.workerRuntimeExecutionReady === false, 'Worker runtime execution must remain blocked.')
assert(summary.workerRuntimeExecutionReady === false, 'Summary must keep worker runtime execution blocked.')
assert(summary.supabasePersistenceReady === false, 'Supabase persistence must remain blocked.')
assert(supabase.supabaseUpdateRequired === 'no', 'Supabase update must not be required.')
assert(supabase.sqlExecuted === false, 'SQL must not be executed.')
assert(supabase.migrationDeployed === false, 'Migrations must not be deployed.')
assert(payload.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
assert(payload.publicArtifactsAllowed === false, 'Public artifacts must remain blocked.')

for (const [key, value] of Object.entries(noExecution.noExecutionPolicy)) {
  assert(value === false, `No-execution policy ${key} must be false.`)
}

const corpus = [
  ...readAllFiles(reportDir),
  { file: resultDoc, text: readFileSync(resultDoc, 'utf8') },
  { file: nextPrompt, text: readFileSync(nextPrompt, 'utf8') },
]
for (const { file, text } of corpus) assertNoForbiddenText(text, file)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'worker-runtime-unlock-0-repo-audit',
  decision: decision.decision,
  workerRuntimeReadyForDryRunPlanning: decision.workerRuntimeReadyForDryRunPlanning,
  workerRuntimeExecutionReady: decision.workerRuntimeExecutionReady,
  supabasePersistenceReady: summary.supabasePersistenceReady,
  reportsValidated: requiredReports.length,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
