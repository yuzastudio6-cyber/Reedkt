import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR,
  buildWorkerRuntimeJobsAuditBundle,
} from '../activation/worker-runtime-jobs-audit'

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
  'activation:worker-runtime-jobs-audit',
  'activation:worker-runtime-jobs-audit:report',
  'activation:worker-runtime-jobs:summary',
  'smoke:activation-worker-runtime-jobs-audit',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/worker-runtime-jobs-audit/index.ts',
  'server/activation/worker-runtime-jobs-audit/worker-runtime-audit-types.ts',
  'server/activation/worker-runtime-jobs-audit/worker-runtime-audit-report-builder.ts',
  'docs/worker-runtime/worker-runtime-jobs-repo-audit.md',
  'docs/worker-runtime/approved-plan-snapshot-intake-audit.md',
  'docs/worker-runtime/worker-claim-lease-gap-map.md',
  'docs/worker-runtime/worker-artifact-scope-policy.md',
  'docs/worker-runtime/worker-runtime-next-phase-plan.md',
  'docs/activation-phase-worker-0-worker-runtime-jobs-audit-results.md',
  'docs/implementation-prompts/prompt-worker-1-approved-plan-snapshot-dry-run.md',
]) {
  assert(existsSync(file), `Missing WORKER-0 file: ${file}`)
}

assert(!existsSync('server/workers/worker-runtime-jobs-audit'), 'WORKER-0 must not add a worker.')
assert(!existsSync('server/routes/worker-runtime-jobs-audit.ts'), 'WORKER-0 must not add a route.')
assert(!existsSync('server/activation/supabase-milestone-sync'), 'This base should not add Supabase milestone sync.')

const bundle = buildWorkerRuntimeJobsAuditBundle({ runId: 'worker0-smoke' })
assert(bundle.sourceAudit.sourceRunId === 'plansnapshot1-20260612T182758', 'PLAN-SNAPSHOT-1 run ID must be loaded.')
assert(
  bundle.sourceAudit.sourceDecision === 'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit',
  'PLAN-SNAPSHOT-1 decision must be loaded.',
)
assert(bundle.sourceAudit.planSnapshotExecutionStatus === 'candidate_only', 'Source plan snapshot must be candidate-only.')
assert(bundle.sourceAudit.planSnapshotApprovedForRuntime === false, 'Source plan snapshot must not be runtime approved.')
assert(bundle.approvedPlanIntakeAudit.candidateContractCompatibleForReview === true, 'Plan intake must be review compatible.')
assert(bundle.approvedPlanIntakeAudit.runtimeApproved === false, 'Runtime approval must remain false.')
assert(bundle.workerSchemaAudit.status === 'passed', 'Worker schema audit must pass.')
assert(bundle.workerClaimLeaseAudit.claimExecutionStatus === 'blocked_until_future_transactional_backend_runtime', 'Claim execution must remain blocked for real runtime.')
assert(bundle.workerArtifactScopeAudit.privateGcsRefsOnly === true, 'Artifacts must be private GCS refs only.')
assert(bundle.workerArtifactScopeAudit.publicArtifactsAllowed === false, 'Public artifacts must be blocked.')
assert(bundle.workerArtifactScopeAudit.signedUrlsSourceOfTruth === false, 'Signed URLs must not be source of truth.')
assert(bundle.workerEventLogAudit.status === 'passed', 'Event log audit must pass.')
assert(bundle.gapMap.worker1Readiness === 'ready for approved-plan snapshot dry-run', 'WORKER-1 readiness must be recorded.')
assert(bundle.nextPhasePlan.readiness === 'ready for approved-plan snapshot dry-run', 'Next phase plan must be ready for dry-run.')
assert(bundle.manifest.supabaseMilestoneSync.status === 'not_attempted_current_branch_missing_sync_layer', 'Supabase sync must remain absent on this branch.')
assert(bundle.qa.passed === true, 'QA must pass in smoke context.')

for (const value of Object.values(bundle.qa.safetyFlags)) {
  assert(value === false, 'All WORKER-0 safety flags must be false.')
}

const corpus = readAllFiles(WORKER_RUNTIME_JOBS_AUDIT_REPORT_DIR)
  .concat([
    'docs/worker-runtime/worker-runtime-jobs-repo-audit.md',
    'docs/worker-runtime/approved-plan-snapshot-intake-audit.md',
    'docs/worker-runtime/worker-claim-lease-gap-map.md',
    'docs/worker-runtime/worker-artifact-scope-policy.md',
    'docs/worker-runtime/worker-runtime-next-phase-plan.md',
    'docs/activation-phase-worker-0-worker-runtime-jobs-audit-results.md',
    'docs/implementation-prompts/prompt-worker-1-approved-plan-snapshot-dry-run.md',
  ].filter(existsSync).map((file) => ({ file, text: readFileSync(file, 'utf8') })))

for (const { file, text } of corpus) {
  for (const forbidden of [
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /bearer\s+[A-Za-z0-9._-]{20,}/i,
    new RegExp(`BEGIN ${'PRIVATE KEY'}`),
    new RegExp(`x-goog-${'signature'}=`, 'i'),
    /AKIA[0-9A-Z]{16}/,
    /sk-[A-Za-z0-9]{20,}/,
    /"workerExecution"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"providerCalls"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"runtimeExecution"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"rawPrompts"\s*:\s*true/,
    /"rawProviderResponses"\s*:\s*true/,
    /"production"\s*:\s*true/,
    /"externalBeta"\s*:\s*true/,
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER_0',
  sourcePlanSnapshotRunId: bundle.sourceAudit.sourceRunId,
  decision: bundle.summary.decision,
  worker1Readiness: bundle.nextPhasePlan.readiness,
  workerExecution: false,
  toolExecution: false,
  providerCalls: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
