import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase157_disabled_dispatch_route_owner_review_passed_with_warnings_ready_for_disabled_dispatch_route_source_creation_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase158_disabled_dispatch_route_source_creation_plan_completed_with_warnings_ready_for_actual_disabled_dispatch_route_source_creation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase159_actual_disabled_dispatch_route_source_creation_completed_with_warnings_ready_for_disabled_route_static_validation'
const futureRoutePath = 'server/workers/sound-cpu/disabled-dispatch-route.ts'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan-result.md',
  filePlan: 'docs/worker-runtime-jobs-sound-cpu-phase158-route-source-file-plan.md',
  checklist: 'docs/worker-runtime-jobs-sound-cpu-phase158-source-acceptance-checklist.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase158-actual-source-creation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase158-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase158-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-creation.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase157-disabled-dispatch-route-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan-result'),
  filePlan: parseJsonBlock(docs.filePlan, 'worker-runtime-jobs-sound-cpu-phase158-route-source-file-plan'),
  checklist: parseJsonBlock(docs.checklist, 'worker-runtime-jobs-sound-cpu-phase158-source-acceptance-checklist'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase158-actual-source-creation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase158-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase158-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase159-actual-disabled-dispatch-route-source-creation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(!fs.existsSync(path.join(process.cwd(), futureRoutePath)), 'future route source must not exist in Phase158')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReviewResult.routeSourceCreationPlanningMayProceed === true, 'source planning not accepted')
assert(parsed.source.ownerReviewResult.routeSourceCreatedToday === false, 'source route created')
assert(parsed.source.ownerReviewResult.routeRegisteredToday === false, 'source route registered')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowRouteSourceCreationPlan === true, 'source creation plan not allowed')
assert(parsed.sourcePrompt.planningScope.allowRouteSourceChange === false, 'source prompt source widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2193, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '1dc19d71a07543b2a72c60d98ba5863a8113c5f3', 'source merge mismatch')
assert(parsed.result.planResult.routeSourceCreationPlanned === true, 'source creation plan missing')
assert(parsed.result.planResult.routeSourceCreatedToday === false, 'route source created today')
assert(parsed.result.planResult.routeRegisteredToday === false, 'route registered today')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.filePlan.futureRoutePath === futureRoutePath, 'future route path mismatch')
assert(parsed.filePlan.sourceBehavior.mustNotCallWorkers === true, 'worker call blocker missing')
assert(parsed.filePlan.sourceBehavior.validPayloadReturnsAcceptedForDispatch === false, 'valid payload accepts dispatch')
assert(parsed.filePlan.sourceBehavior.invalidPayloadReturnsAcceptedForDispatch === false, 'invalid payload accepts dispatch')
assert(parsed.filePlan.routeSourceCreatedToday === false, 'file plan source created')

assert(parsed.checklist.requiresStaticValidationAfterSourceCreation === true, 'static validation requirement missing')
assert(parsed.checklist.routeRegistrationDeferred === true, 'route registration not deferred')
assert(parsed.checklist.routeExecutionDeferred === true, 'route execution not deferred')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.actualSourceCreationMayProceed === true, 'actual source creation not allowed next')
assert(parsed.readiness.routeSourceCreatedToday === false, 'readiness route source created')
assert(parsed.readiness.routeRegisteredToday === false, 'readiness route registered')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.routeSourceCreationPlanned === true, 'route source planning claim missing')
assert(parsed.claimPolicy.allowedClaims.actualSourceCreationMayProceed === true, 'actual source creation claim missing')
assert(parsed.claimPolicy.allowedClaims.routeSourceCreated === false, 'route source allowed claim widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.sourceCreationScope.allowRouteSourceChange === true, 'next prompt source creation missing')
assert(parsed.nextPrompt.sourceCreationScope.allowRouteRegistration === false, 'next prompt route registration widened')
assert(parsed.nextPrompt.sourceCreationScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase158-disabled-dispatch-route-source-creation-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase158-disabled-dispatch-route-source-creation-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2193,
      routeSourceCreationPlanned: true,
      actualSourceCreationMayProceed: true,
      routeSourceCreatedToday: false,
      routeRegisteredToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE159-ACTUAL-DISABLED-DISPATCH-ROUTE-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
