import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_owner_review_passed_with_warnings_ready_for_route_source_creation_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase138_route_source_creation_plan_completed_with_warnings_ready_for_route_source_owner_review'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase138_route_source_owner_review_passed_with_warnings_ready_for_actual_route_source_creation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review-result.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase137-rls-owner-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan-result.md',
  paths: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-file-path-register.md',
  handler: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-handler-contract-plan.md',
  validation: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-validation-schema-plan.md',
  registration: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-registration-plan.md',
  nonExecution: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-non-execution-policy.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase138-route-source-claim-policy.md',
  ownerPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review-result'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase137-rls-owner-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan-result'),
  paths: parseJsonBlock(docs.paths, 'worker-runtime-jobs-sound-cpu-phase138-route-file-path-register'),
  handler: parseJsonBlock(docs.handler, 'worker-runtime-jobs-sound-cpu-phase138-route-handler-contract-plan'),
  validation: parseJsonBlock(docs.validation, 'worker-runtime-jobs-sound-cpu-phase138-route-validation-schema-plan'),
  registration: parseJsonBlock(docs.registration, 'worker-runtime-jobs-sound-cpu-phase138-route-registration-plan'),
  nonExecution: parseJsonBlock(docs.nonExecution, 'worker-runtime-jobs-sound-cpu-phase138-route-non-execution-policy'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase138-route-source-blocker-register'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase138-route-source-claim-policy'),
  ownerPrompt: parseJsonBlock(docs.ownerPrompt, 'worker-runtime-jobs-sound-cpu-phase138-route-source-owner-review'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase139-actual-route-source-creation'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2141, 'source owner review source PR mismatch')
assert(parsed.source.ownerReview.routeSourceCreationPlanMayProceed === true, 'source next missing')
assert(parsed.source.ownerReview.routeExecutionEnabled === false, 'source route widened')
assert(parsed.source.ownerReview.supabaseMutationEnabled === false, 'source Supabase widened')
assert(parsed.sourcePolicy.allowedClaims.routeSourceCreationPlanMayProceed === true, 'source policy next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planRouteSourceCreationOnly === true, 'prompt scope missing')
assert(parsed.prompt.planningScope.allowRouteSourceCreation === false, 'prompt source creation widened')
assert(parsed.prompt.planningScope.allowRouteExecution === false, 'prompt route widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2143, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '86e5d5434f2168c77166da8e68cfded7a913e2aa', 'source merge mismatch')
assert(parsed.result.routeSourcePlanResult.routeSourceCreationPlanned === true, 'route source plan missing')
assert(parsed.result.routeSourcePlanResult.routeSourceOwnerReviewMayProceed === true, 'owner review next missing')
assert(parsed.result.routeSourcePlanResult.routeSourceCreated === false, 'route source created unexpectedly')
assert(parsed.result.routeSourcePlanResult.routeExecutionEnabled === false, 'route widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.paths.plannedFutureSourceFiles.length === 2, 'source path count mismatch')
assert(parsed.paths.plannedFutureSourceFiles[0].path === 'server/routes/sound-cpu-worker-routes.ts', 'route path mismatch')
assertFalseMap(parsed.paths.actualSourceChanges, 'paths.actualSourceChanges')

assert(parsed.handler.futureHandlers.length === 2, 'handler count mismatch')
assert(parsed.handler.requiredRequestFields.includes('approvedPlanSnapshotId'), 'snapshot field missing')
assert(parsed.handler.requiredRequestFields.includes('privateMediaManifestId'), 'manifest field missing')
assert(parsed.handler.requiredFailClosedResponses.includes('route_execution_not_enabled'), 'fail-closed response missing')

assert(parsed.validation.futureValidationRules.runtimeFlagsMustDefaultFalse === true, 'runtime flags rule missing')
assert(parsed.validation.acceptedWorkerNames.length === 2, 'worker count mismatch')
assert(parsed.validation.acceptedImages.length === 2, 'image count mismatch')
assert(parsed.validation.acceptedJobTypes.length === 4, 'job count mismatch')
assert(parsed.validation.validationSourceCreated === false, 'validation source created unexpectedly')

assert(parsed.registration.futureRegistration.routeModule === 'server/routes/sound-cpu-worker-routes.ts', 'registration route module mismatch')
assert(parsed.registration.futureRegistration.registeredInThisGate === false, 'registered unexpectedly')
assert(parsed.registration.registrationPreconditions.includes('static_route_source_validation'), 'static validation precondition missing')
assertFalseMap(parsed.registration.blockedToday, 'registration.blockedToday')

assertFalseMap(parsed.nonExecution.nonExecutionDefaults, 'nonExecution.nonExecutionDefaults')
assert(parsed.nonExecution.futureRouteMustReject.includes('runtime_flag_enabled_without_owner_review'), 'runtime rejection missing')

assert(parsed.blocker.blockedBeforeActualSourceCreation.includes('route_source_owner_review'), 'owner review blocker missing')
assert(parsed.blocker.blockedBeforeExecution.includes('controlled_no_media_route_import_validation'), 'import validation blocker missing')
assertFalseMap(parsed.blocker.notCreatedInThisGate, 'blocker.notCreatedInThisGate')

assert(parsed.policy.allowedClaims.routeSourceCreationPlanned === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.routeSourceOwnerReviewMayProceed === true, 'policy owner next missing')
assertFalseMap(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.ownerPrompt.requiredSourceDecision === decision, 'owner prompt source mismatch')
assert(parsed.ownerPrompt.expectedDecision === ownerReviewDecision, 'owner prompt expected mismatch')
assert(parsed.ownerPrompt.reviewScope.acceptRouteSourceCreationPlanningOnly === true, 'owner prompt scope missing')
assert(parsed.ownerPrompt.reviewScope.allowRouteSourceCreation === false, 'owner prompt source creation widened')
assert(parsed.ownerPrompt.reviewScope.allowRouteExecution === false, 'owner prompt route widened')
assertNoOpClassification(parsed.ownerPrompt.supabaseClassification, 'ownerPrompt.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === ownerReviewDecision, 'next prompt source mismatch')
assert(parsed.nextPrompt.creationScope.allowRouteSourceCreation === true, 'next prompt source creation should be allowed')
assert(parsed.nextPrompt.creationScope.allowRouteExecution === false, 'next prompt route execution widened')
assert(parsed.nextPrompt.creationScope.allowSupabaseMutation === false, 'next prompt Supabase widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2143,
      routeSourceCreationPlanned: true,
      routeSourceCreated: false,
      routeExecutionEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE138-ROUTE-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
