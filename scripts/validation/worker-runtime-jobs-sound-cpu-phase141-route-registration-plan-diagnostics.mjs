import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase140_controlled_no_media_route_import_validation_passed_with_warnings_ready_for_route_registration_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase141_route_registration_plan_completed_with_warnings_ready_for_route_registration_owner_review'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase141_route_registration_owner_review_passed_with_warnings_ready_for_disabled_route_registration_source_creation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation-result.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase140-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase141-route-registration-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-plan-result.md',
  touchpoint: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-touchpoint-plan.md',
  guard: 'docs/worker-runtime-jobs-sound-cpu-phase141-disabled-registration-guard-plan.md',
  staticValidation: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-static-validation-plan.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase141-route-registration-claim-policy.md',
  ownerPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-review.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase140-controlled-no-media-route-import-validation-result'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase140-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-plan-result'),
  touchpoint: parseJsonBlock(docs.touchpoint, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-touchpoint-plan'),
  guard: parseJsonBlock(docs.guard, 'worker-runtime-jobs-sound-cpu-phase141-disabled-registration-guard-plan'),
  staticValidation: parseJsonBlock(docs.staticValidation, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-static-validation-plan'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-claim-policy'),
  ownerPrompt: parseJsonBlock(docs.ownerPrompt, 'worker-runtime-jobs-sound-cpu-phase141-route-registration-owner-review'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.importValidationResult.routeModuleImported === true, 'source import proof missing')
assert(parsed.source.importValidationResult.routeFactoryInvoked === false, 'source route factory invoked')
assert(parsed.source.importValidationResult.routeExecutionEnabled === false, 'source route execution widened')
assert(parsed.sourcePolicy.allowedClaims.routeRegistrationPlanMayProceed === true, 'source policy next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planRouteRegistrationOnly === true, 'prompt planning scope missing')
assert(parsed.prompt.planningScope.allowRouteRegistrationSourceChange === false, 'prompt source change widened')
assert(parsed.prompt.planningScope.allowRouteExecution === false, 'prompt route widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2151, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '1c612afd0a42acd17301db7f512677b3a03cc08c', 'source merge mismatch')
assert(parsed.result.registrationPlanResult.routeRegistrationPlanned === true, 'registration plan missing')
assert(parsed.result.registrationPlanResult.routeRegistrationSourceChanged === false, 'registration source changed')
assert(parsed.result.registrationPlanResult.routeRegisteredInApp === false, 'route registered')
assert(parsed.result.registrationPlanResult.routeExecutionEnabled === false, 'route widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.touchpoint.plannedFutureTouchpoints[0].path === 'server/app.ts', 'touchpoint path mismatch')
assert(parsed.touchpoint.plannedFutureTouchpoints.every((touchpoint) => touchpoint.modifiedInThisGate === false), 'touchpoint modified')
assert(parsed.touchpoint.routeModule === 'server/routes/sound-cpu-worker-routes.ts', 'route module mismatch')
assert(parsed.touchpoint.registeredInThisGate === false, 'registered in plan gate')

assert(parsed.guard.futureRegistrationGuards.routeExecutionFlagMustRemainFalse === true, 'route guard missing')
assertFalseMap(parsed.guard.blockedToday, 'guard.blockedToday')

assert(parsed.staticValidation.validationSourceCreatedInThisGate === false, 'validation source created unexpectedly')
assert(parsed.staticValidation.futureStaticValidationMustConfirm.includes('no_supabase_client_import'), 'Supabase static check missing')
assert(parsed.staticValidation.futureStaticValidationMustConfirm.includes('no_real_user_media_beta_or_production_claim'), 'beta/production check missing')

assert(parsed.blocker.unblockedForNextReview.includes('route_registration_owner_review'), 'owner review next missing')
assert(parsed.blocker.blockedBeforeExecution.includes('disabled_route_registration_source_creation'), 'disabled registration source blocker missing')
assertFalseMap(parsed.blocker.notUnblockedByThisGate, 'blocker.notUnblockedByThisGate')

assert(parsed.claimPolicy.allowedClaims.routeRegistrationPlanned === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.routeRegistrationOwnerReviewMayProceed === true, 'claim owner next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.ownerPrompt.requiredSourceDecision === decision, 'owner prompt source mismatch')
assert(parsed.ownerPrompt.expectedDecision === ownerReviewDecision, 'owner prompt expected mismatch')
assert(parsed.ownerPrompt.reviewScope.acceptRouteRegistrationPlanningOnly === true, 'owner prompt scope missing')
assert(parsed.ownerPrompt.reviewScope.allowRouteRegistrationSourceChange === false, 'owner prompt source change widened')
assert(parsed.ownerPrompt.reviewScope.allowRouteExecution === false, 'owner prompt route widened')
assertNoOpClassification(parsed.ownerPrompt.supabaseClassification, 'ownerPrompt.supabaseClassification')

const appSource = read('server/app.ts')
const workerRoutes = read('server/routes/worker-routes.ts')
assert(!appSource.includes('sound-cpu-worker-routes'), 'app has SOUND CPU route registration')
assert(!workerRoutes.includes('sound-cpu-worker-routes'), 'worker-routes has SOUND CPU route registration')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2151,
      routeRegistrationPlanned: true,
      routeRegistrationSourceChanged: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE141-ROUTE-REGISTRATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
