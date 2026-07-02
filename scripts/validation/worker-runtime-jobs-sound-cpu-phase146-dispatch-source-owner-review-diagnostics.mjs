import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase145_dispatch_contract_source_plan_completed_with_warnings_ready_for_dispatch_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase146_dispatch_source_owner_review_passed_with_warnings_ready_for_dispatch_contract_source_creation_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase147_dispatch_contract_source_creation_plan_completed_with_warnings_ready_for_actual_dispatch_contract_source_creation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan-result.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-acceptance-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan.md',
  packageJson: 'package.json',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const match = read(file).match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoop(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'sourceCreationAllowedToday',
    'sourceCreationAllowedInThisGate',
    'allowSourceCreation',
    'allowActualSourceCreation',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'claimLeaseMutationEnabled',
    'allowWorkerDispatchExecution',
    'allowRouteExecutionEnablement',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan-result'),
  sourcePlan: parseJsonBlock(docs.sourcePlan, 'worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-acceptance-register'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase147-dispatch-contract-source-creation-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.planResult.dispatchContractSourcePlanned === true, 'source plan missing')
assert(parsed.source.planResult.dispatchSourceCreated === false, 'source already created')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source worker widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePlan.futureSourcePath === 'server/workers/sound-cpu/dispatch-contract.ts', 'future source path mismatch')
assert(parsed.sourcePlan.sourceCreationAllowedInThisGate === false, 'source plan widened')
assert(parsed.sourcePlan.plannedBehavior.failClosedWithoutDispatch === true, 'fail-closed behavior missing')
assert(parsed.sourcePlan.plannedBehavior.performWorkerDispatch === false, 'dispatch widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt required decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.reviewSourcePlanOnly === true, 'owner review scope mismatch')
assert(parsed.sourcePrompt.reviewScope.allowSourceCreation === false, 'owner review source creation widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2167, 'source PR mismatch')
assert(parsed.result.ownerReviewResult.dispatchContractSourcePlanAccepted === true, 'source plan not accepted')
assert(parsed.result.ownerReviewResult.sourceCreationPlanMayProceed === true, 'next plan not allowed')
assert(parsed.result.ownerReviewResult.sourceCreationAllowedToday === false, 'source creation widened')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForNextPlanning.includes('future_source_path_server_workers_sound_cpu_dispatch_contract_ts'), 'future path acceptance missing')
assert(parsed.acceptance.rejectedForCurrentExecution.includes('worker_dispatch'), 'worker dispatch rejection missing')
assert(parsed.acceptance.acceptedForExecutionToday === false, 'execution acceptance widened')

assert(parsed.blocker.unblockedForNextGate.includes('dispatch_contract_source_creation_plan'), 'next gate missing')
assert(parsed.blocker.mustRemainBlocked.includes('worker_dispatch_execution'), 'worker dispatch blocker missing')
assert(parsed.blocker.mustRemainBlocked.includes('Supabase_job_persistence'), 'Supabase persistence blocker missing')
assert(parsed.blocker.noFixBlockerFound === true, 'unexpected fix blocker')

assert(parsed.claimPolicy.allowedClaims.dispatchContractSourcePlanAccepted === true, 'allowed claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.futureSourcePath === 'server/workers/sound-cpu/dispatch-contract.ts', 'next prompt path mismatch')
assert(parsed.nextPrompt.reviewScope.planSourceCreationOnly === true, 'next prompt scope mismatch')
assert(parsed.nextPrompt.reviewScope.allowActualSourceCreation === false, 'next prompt source creation widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase146-dispatch-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2167,
      sourceCreationPlanMayProceed: true,
      sourceCreationAllowedToday: false,
      workerDispatchExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE147-DISPATCH-CONTRACT-SOURCE-CREATION-PLAN',
    },
    null,
    2,
  ),
)
