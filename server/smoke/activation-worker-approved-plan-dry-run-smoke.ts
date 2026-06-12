import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR,
  buildWorkerApprovedPlanDryRunBundle,
} from '../activation/worker-approved-plan-dry-run'

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
  'activation:worker-approved-plan-dry-run',
  'activation:worker-approved-plan-dry-run:report',
  'activation:worker-approved-plan-dry-run:summary',
  'smoke:activation-worker-approved-plan-dry-run',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/worker-approved-plan-dry-run/index.ts',
  'server/activation/worker-approved-plan-dry-run/worker-approved-plan-dry-run-types.ts',
  'server/activation/worker-approved-plan-dry-run/worker-dry-run-report-builder.ts',
  'docs/worker-runtime/approved-plan-snapshot-dry-run.md',
  'docs/worker-runtime/worker-job-plan-dry-run.md',
  'docs/worker-runtime/worker-claim-lease-dry-run.md',
  'docs/worker-runtime/worker-dry-run-gap-map.md',
  'docs/worker-runtime/worker-dry-run-next-phase-plan.md',
  'docs/implementation-prompts/prompt-tool-route-0-execution-unlock-audit.md',
  'docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md',
]) {
  assert(existsSync(file), `Missing WORKER-1 file: ${file}`)
}

assert(!existsSync('server/workers/worker-approved-plan-dry-run'), 'WORKER-1 must not add a worker.')
assert(!existsSync('server/routes/worker-approved-plan-dry-run.ts'), 'WORKER-1 must not add a route.')
assert(!existsSync('server/activation/supabase-milestone-sync'), 'This base should not add Supabase milestone sync.')

const bundle = buildWorkerApprovedPlanDryRunBundle({ runId: 'worker1-smoke' })
assert(bundle.sourceAudit.worker0.runId === 'worker0-20260612T191022', 'WORKER-0 source evidence must be loaded.')
assert(bundle.sourceAudit.planSnapshot1.runId === 'plansnapshot1-20260612T182758', 'PLAN-SNAPSHOT-1 source evidence must be loaded.')
assert(bundle.sourceAudit.modelDryRun1.runId === 'modeldryrun1-20260612T174538', 'MODEL-DRYRUN-1 source evidence must be loaded.')
assert(bundle.evidenceContext.candidatePlanId === 'candidate-approved-plan-plansnapshot1-20260612T182758', 'Candidate plan must be loaded.')
assert(bundle.snapshotValidation.acceptedForDryRunOnly === true, 'Candidate snapshot must be accepted for dry-run only.')
assert(bundle.snapshotValidation.realWorkerValidationInvoked === false, 'Real worker validation must not be invoked.')
assert(bundle.jobBatchPlan.jobs.length === 7, 'WORKER-1 must build exactly seven simulated jobs.')
assert(bundle.jobBatchPlan.dependencies.length === 10, 'WORKER-1 dependency plan must match the seven-job graph.')
assert(bundle.jobBatchPlan.dryRunOnly === true, 'Job batch must be dry-run only.')
assert(bundle.jobBatchPlan.workerExecutionAllowed === false, 'Worker execution must be false.')
assert(bundle.jobBatchPlan.toolExecutionAllowed === false, 'Tool execution must be false.')
assert(bundle.jobBatchPlan.providerCallsAllowed === false, 'Provider calls must be false.')
assert(bundle.jobBatchPlan.routeExecutionAllowed === false, 'Route execution must be false.')
assert(bundle.jobBatchPlan.approvedForRuntime === false, 'Approved for runtime must be false.')
assert(bundle.simulatedClaimLeaseResult.claimAttempted === false, 'Real claim must not be attempted.')
assert(bundle.simulatedClaimLeaseResult.simulatedClaim === true, 'Claim must be simulated.')
assert(bundle.simulatedClaimLeaseResult.blockerForRealRuntime === 'blocked_until_future_transactional_backend_runtime', 'Real runtime blocker must be recorded.')
assert(bundle.artifactScopeValidation.status === 'passed', 'Artifact scope validation must pass.')
assert(bundle.blockedRouteValidation.blockedRoutes.length >= 12, 'Blocked route validation must include required route families.')
assert(bundle.blockedRouteValidation.allExecutionBlocked === true, 'All route/tool/provider/runtime execution must be blocked.')
assert(bundle.eventLogPlan.persistToDatabase === false, 'Event log plan must not persist to database.')
assert(bundle.gapMap.toolRoute0Readiness === 'ready for tool-route execution unlock audit', 'TOOL-ROUTE-0 readiness must be ready on passing QA.')
assert(bundle.manifest.supabaseMilestoneSync.status === 'not_attempted_current_branch_missing_sync_layer', 'Supabase sync must remain not attempted.')
assert(bundle.qa.passed === true, 'QA must pass in smoke context.')

for (const value of Object.values(bundle.qa.safetyFlags)) {
  assert(value === false, 'All WORKER-1 safety flags must be false.')
}

const corpus = readAllFiles(WORKER_APPROVED_PLAN_DRY_RUN_REPORT_DIR)
  .concat([
    'docs/worker-runtime/approved-plan-snapshot-dry-run.md',
    'docs/worker-runtime/worker-job-plan-dry-run.md',
    'docs/worker-runtime/worker-claim-lease-dry-run.md',
    'docs/worker-runtime/worker-dry-run-gap-map.md',
    'docs/worker-runtime/worker-dry-run-next-phase-plan.md',
    'docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md',
    'docs/implementation-prompts/prompt-tool-route-0-execution-unlock-audit.md',
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
    /"paidProduction"\s*:\s*true/,
    /"broadMedia"\s*:\s*true/,
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER_1',
  sourceWorker0RunId: bundle.sourceAudit.worker0.runId,
  sourcePlanSnapshotRunId: bundle.sourceAudit.planSnapshot1.runId,
  decision: bundle.summary.decision,
  jobCount: bundle.jobBatchPlan.jobs.length,
  toolRoute0Readiness: bundle.nextPhasePlan.readiness,
  workerExecution: false,
  toolExecution: false,
  providerCalls: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
