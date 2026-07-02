import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase156_disabled_dispatch_route_plan_completed_with_warnings_ready_for_disabled_dispatch_route_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase157_disabled_dispatch_route_owner_review_passed_with_warnings_ready_for_disabled_dispatch_route_source_creation_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase158_disabled_dispatch_route_source_creation_plan_completed_with_warnings_ready_for_actual_disabled_dispatch_route_source_creation'
const futureRoutePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan-result.md',
  sourceRoutePlan: 'docs/worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-contract-plan.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase157-route-owner-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase157-source-creation-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase157-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase157-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan.md',
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
    'routeSourceCreated',
    'routeRegistered',
    'workerDispatchExecutionEnabled',
    'claimLeaseMutationEnabled',
    'routeExecutionEnabled',
    'toolExecutionEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'dockerBuildEnabled',
    'dockerPushEnabled',
    'dockerRunEnabled',
    'gcpCloudRunEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'allowRouteSourceChange',
    'allowRouteRegistration',
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowClaimLeaseMutation',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-plan-result'),
  sourceRoutePlan: parseJsonBlock(docs.sourceRoutePlan, 'worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-route-contract-plan'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase157-route-owner-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase157-source-creation-plan-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase157-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase157-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(!fs.existsSync(path.join(process.cwd(), futureRoutePath)), 'future route source must not exist in Phase157')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.planResult.disabledDispatchRoutePlanned === true, 'source route plan missing')
assert(parsed.source.planResult.routeSourceCreated === false, 'source route source created')
assert(parsed.source.planResult.routeRegistered === false, 'source route registered')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceRoutePlan.futureRoutePath === futureRoutePath, 'source future route path mismatch')
assert(parsed.sourceRoutePlan.routeBehavior.mustReturnAcceptedForDispatch === false, 'source route accepts dispatch')
assert(parsed.sourceRoutePlan.routeSourceCreatedToday === false, 'source route created today')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowDisabledRoutePlanReview === true, 'route plan review missing')
assert(parsed.sourcePrompt.reviewScope.allowRouteSourceChange === false, 'source route change widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2189, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'acb31e63e7fc8d1ea382079f5df0953ea347222b', 'source merge mismatch')
assert(parsed.result.ownerReviewResult.disabledDispatchRoutePlanAccepted === true, 'route plan not accepted')
assert(parsed.result.ownerReviewResult.routeSourceCreationPlanningMayProceed === true, 'source planning not allowed')
assert(parsed.result.ownerReviewResult.routeSourceCreatedToday === false, 'route source created today')
assert(parsed.result.ownerReviewResult.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedForSourceCreationPlanning === true, 'source creation planning not accepted')
assert(parsed.acceptance.acceptedForSourceCreationToday === false, 'source creation accepted today')
assert(parsed.acceptance.acceptedForRouteRegistrationToday === false, 'route registration accepted today')
assert(parsed.acceptance.acceptedForRouteExecutionToday === false, 'route execution accepted today')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceCreationPlanningMayProceed === true, 'source creation planning readiness missing')
assert(parsed.readiness.actualSourceCreationRequiresPhase158 === true, 'Phase158 requirement missing')
assert(parsed.readiness.routeSourceCreatedToday === false, 'readiness route source created')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.disabledDispatchRoutePlanAccepted === true, 'route plan accepted claim missing')
assert(parsed.claimPolicy.allowedClaims.sourceCreationPlanningMayProceed === true, 'source creation planning claim missing')
assert(parsed.claimPolicy.allowedClaims.routeSourceCreated === false, 'route source allowed claim widened')
assert(parsed.claimPolicy.allowedClaims.routeRegistered === false, 'route registered allowed claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowRouteSourceCreationPlan === true, 'next prompt source plan missing')
assert(parsed.nextPrompt.planningScope.allowRouteSourceChange === false, 'next prompt source change widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route execution widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase157-disabled-dispatch-route-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2189,
      disabledDispatchRoutePlanAccepted: true,
      sourceCreationPlanningMayProceed: true,
      routeSourceCreatedToday: false,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE158-DISABLED-DISPATCH-ROUTE-SOURCE-CREATION-PLAN',
    },
    null,
    2,
  ),
)
