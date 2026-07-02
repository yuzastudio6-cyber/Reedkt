import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase138_route_source_creation_plan_completed_with_warnings_ready_for_route_source_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase138_route_source_owner_review_passed_with_warnings_ready_for_actual_route_source_creation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan-result.md',
  sourcePaths: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-file-path-register.md',
  sourceHandler: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-handler-contract-plan.md',
  sourceValidation: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-validation-schema-plan.md',
  sourceRegistration: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-registration-plan.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-owner-acceptance-register.md',
  contract: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-contract-owner-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-owner-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoOpClassification(record, label) {
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
    'routeExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'workerLeaseMutationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'toolRuntimeExecutionAgainstUserAssetsEnabled',
    'mediaProcessingEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'storageObjectCreationEnabled',
    'signedUrlCreationEnabled',
    'publicArtifactCreationEnabled',
    'creditMutationEnabled',
    'productionUnlockEnabled',
    'allowRouteExecution',
    'allowWorkerDispatchExecution',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowStorageObjectCreation',
    'allowRealUserMediaBetaEnablement',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan-result'),
  sourcePaths: parseJsonBlock(docs.sourcePaths, 'worker-runtime-jobs-sound-cpu-phase138-route-file-path-register'),
  sourceHandler: parseJsonBlock(docs.sourceHandler, 'worker-runtime-jobs-sound-cpu-phase138-route-handler-contract-plan'),
  sourceValidation: parseJsonBlock(docs.sourceValidation, 'worker-runtime-jobs-sound-cpu-phase138-route-validation-schema-plan'),
  sourceRegistration: parseJsonBlock(docs.sourceRegistration, 'worker-runtime-jobs-sound-cpu-phase138-route-registration-plan'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase138-route-source-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase138-route-source-owner-acceptance-register'),
  contract: parseJsonBlock(docs.contract, 'worker-runtime-jobs-sound-cpu-phase138-route-contract-owner-register'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase138-route-source-owner-blocker-register'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase138-route-source-owner-claim-policy'),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2143, 'source plan source PR mismatch')
assert(parsed.source.routeSourcePlanResult.routeSourceCreationPlanned === true, 'source plan missing')
assert(parsed.source.routeSourcePlanResult.routeSourceCreated === false, 'source route created unexpectedly')
assert(parsed.sourcePaths.plannedFutureSourceFiles[0].path === 'server/routes/sound-cpu-worker-routes.ts', 'source path mismatch')
assert(parsed.sourceHandler.futureHandlers.length === 2, 'handler count mismatch')
assert(parsed.sourceValidation.acceptedJobTypes.length === 4, 'job type count mismatch')
assert(parsed.sourceRegistration.futureRegistration.registeredInThisGate === false, 'registration widened')
assert(parsed.sourcePolicy.allowedClaims.routeSourceOwnerReviewMayProceed === true, 'source policy owner next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.acceptRouteSourceCreationPlanningOnly === true, 'prompt scope missing')
assert(parsed.prompt.reviewScope.mayProceedToActualRouteSourceCreation === true, 'prompt next missing')
assert(parsed.prompt.reviewScope.allowRouteSourceCreation === false, 'prompt route source widened')
assert(parsed.prompt.reviewScope.allowRouteExecution === false, 'prompt route execution widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2145, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '80173a0731066deaac9c9876d9b2358bc64a5e3d', 'source merge mismatch')
assert(parsed.result.ownerReview.routeSourceCreationPlanAccepted === true, 'plan acceptance missing')
assert(parsed.result.ownerReview.actualRouteSourceCreationMayProceed === true, 'actual source next missing')
assert(parsed.result.ownerReview.routeSourceCreated === false, 'route source created unexpectedly')
assert(parsed.result.ownerReview.routeExecutionEnabled === false, 'route execution widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanning.nextGap === 'actual_route_source_creation', 'next gap mismatch')
assertFalseMap(parsed.acceptance.acceptedForExecutionToday, 'acceptance.acceptedForExecutionToday')

assert(parsed.contract.acceptedFutureHandlers.length === 2, 'contract handler count mismatch')
assert(parsed.contract.acceptedRequiredFields.includes('approvedPlanSnapshotId'), 'contract snapshot missing')
assert(parsed.contract.acceptedFailClosedResponses.includes('route_execution_not_enabled'), 'fail closed missing')
assert(parsed.contract.routeExecutionEnabled === false, 'contract route widened')

assert(parsed.blocker.blockingBeforeExecution.includes('static_route_source_validation'), 'static validation blocker missing')
assertFalseMap(parsed.blocker.notUnblockedByThisReview, 'blocker.notUnblockedByThisReview')

assert(parsed.policy.allowedClaims.routeSourceCreationPlanAccepted === true, 'policy acceptance missing')
assert(parsed.policy.allowedClaims.actualRouteSourceCreationMayProceed === true, 'policy next missing')
assertFalseMap(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.creationScope.allowRouteSourceCreation === true, 'next should allow route source creation')
assert(parsed.next.creationScope.allowRouteExecution === false, 'next route execution widened')
assert(parsed.next.creationScope.allowSupabaseMutation === false, 'next Supabase widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2145,
      routeSourceCreationPlanAccepted: true,
      actualRouteSourceCreationMayProceed: true,
      routeSourceCreated: false,
      routeExecutionEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE139-ACTUAL-ROUTE-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
