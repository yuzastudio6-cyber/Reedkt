import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase182_disabled_route_registry_app_registration_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_runtime_readiness_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase183_disabled_route_runtime_readiness_plan_completed_with_warnings_ready_for_disabled_route_runtime_readiness_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase184_disabled_route_runtime_readiness_owner_review_passed_with_warnings_ready_for_disabled_route_runtime_readiness_static_validation'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan-result.md',
  flags: 'docs/worker-runtime-jobs-sound-cpu-phase183-runtime-disabled-flag-inventory.md',
  noInvocation: 'docs/worker-runtime-jobs-sound-cpu-phase183-route-handler-no-invocation-policy.md',
  blockerMap: 'docs/worker-runtime-jobs-sound-cpu-phase183-worker-dispatch-blocker-map.md',
  supabaseNoop: 'docs/worker-runtime-jobs-sound-cpu-phase183-supabase-sql-noop-policy.md',
  claimBoundary: 'docs/worker-runtime-jobs-sound-cpu-phase183-readiness-claim-boundary.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-owner-review-readiness-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review.md',
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
    'serverAppSourceChangedToday',
    'routeSourceChangedToday',
    'serverStartedToday',
    'serverStarted',
    'httpRouteRequestExecuted',
    'routeHandlerInvoked',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'routeHandlerInvocationEnabled',
    'serverStartEnabled',
    'httpRouteRequestExecutionEnabled',
    'claimLeaseMutationEnabled',
    'toolExecutionEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'serviceRoleMutationEnabled',
    'jobRecordWriteEnabled',
    'artifactRecordWriteEnabled',
    'storageObjectWriteEnabled',
    'signedUrlCreationEnabled',
    'publicArtifactCreationEnabled',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'routeReadinessClaimed',
    'toolExecutionReadinessClaimed',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'acceptedForRuntimeExecutionToday',
    'acceptedForRouteExecutionToday',
    'allowServerAppSourceChange',
    'allowRouteSourceChange',
    'allowServerStart',
    'allowHttpRouteRequestExecution',
    'allowRouteHandlerInvocation',
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
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review',
  ),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan-result'),
  flags: parseJsonBlock(docs.flags, 'worker-runtime-jobs-sound-cpu-phase183-runtime-disabled-flag-inventory'),
  noInvocation: parseJsonBlock(docs.noInvocation, 'worker-runtime-jobs-sound-cpu-phase183-route-handler-no-invocation-policy'),
  blockerMap: parseJsonBlock(docs.blockerMap, 'worker-runtime-jobs-sound-cpu-phase183-worker-dispatch-blocker-map'),
  supabaseNoop: parseJsonBlock(docs.supabaseNoop, 'worker-runtime-jobs-sound-cpu-phase183-supabase-sql-noop-policy'),
  claimBoundary: parseJsonBlock(docs.claimBoundary, 'worker-runtime-jobs-sound-cpu-phase183-readiness-claim-boundary'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-owner-review-readiness-register',
  ),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2245, 'source PR mismatch')
assert(parsed.source.ownerReviewResult.disabledRouteRuntimeReadinessPlanningMayProceed === true, 'source planning missing')
assert(parsed.source.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'source dispatch accepted')
assert(parsed.source.ownerReviewResult.acceptedForRouteExecutionToday === false, 'source route accepted')
assert(parsed.source.ownerReviewResult.runtimeReadinessClaimed === false, 'source runtime readiness claimed')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowRuntimeReadinessPlanning === true, 'source prompt planning missing')
assert(parsed.sourcePrompt.planningScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.planningScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2248, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '3fd6e71d62167ff65cf1f353313fd6b20fd3c6f3', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.disabledRouteRuntimeReadinessPlanCreated === true, 'plan not created')
assert(parsed.result.planResult.sourceOnlyPlanning === true, 'source-only planning missing')
assert(parsed.result.planResult.serverAppSourceChangedToday === false, 'app source changed')
assert(parsed.result.planResult.routeSourceChangedToday === false, 'route source changed')
assert(parsed.result.planResult.serverStartedToday === false, 'server started')
assert(parsed.result.planResult.httpRouteRequestExecuted === false, 'HTTP executed')
assert(parsed.result.planResult.routeHandlerInvoked === false, 'handler invoked')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route widened')
assert(parsed.result.planResult.runtimeReadinessClaimed === false, 'runtime readiness claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.flags.routeFlag.expectedValue === false, 'route flag value widened')
assert(parsed.flags.registryFlag.expectedValue === false, 'registry flag value widened')
assert(parsed.flags.runtimeEnvFlags.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime env widened')
assert(parsed.flags.runtimeEnvFlags.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker env widened')
assert(parsed.flags.runtimeEnvFlags.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media env widened')
assert(parsed.flags.runtimeReadinessClaimed === false, 'flags runtime readiness claimed')

assert(parsed.noInvocation.policy.serverStartAllowed === false, 'server start allowed')
assert(parsed.noInvocation.policy.httpRequestAllowed === false, 'HTTP allowed')
assert(parsed.noInvocation.policy.expressRouterInstantiationAllowed === false, 'router instantiation allowed')
assert(parsed.noInvocation.policy.routeHandlerInvocationAllowed === false, 'handler invocation allowed')
assert(parsed.noInvocation.allowedValidation.readSourceFiles === true, 'read source not allowed')
assert(parsed.noInvocation.runtimeReadinessClaimed === false, 'noInvocation runtime readiness claimed')

assertFalseMap(parsed.blockerMap.blockedDispatchSurfaces, 'blockerMap.blockedDispatchSurfaces')
assert(parsed.blockerMap.futureOwnerGatesRequired.includes('route_handler_invocation_owner_review'), 'handler owner gate missing')
assert(parsed.blockerMap.acceptedForDispatchToday === false, 'dispatch accepted today')

assertNoop(parsed.supabaseNoop.supabaseClassification, 'supabaseNoop.supabaseClassification')
assertFalseMap(parsed.supabaseNoop.blockedStorageAndDatabaseActions, 'supabaseNoop.blockedStorageAndDatabaseActions')

assert(parsed.claimBoundary.allowedClaims.disabledRouteRuntimeReadinessPlanCreated === true, 'claim plan missing')
assert(parsed.claimBoundary.allowedClaims.runtimeDisabledFlagInventoryCreated === true, 'claim flags missing')
assertFalseMap(parsed.claimBoundary.blockedClaims, 'claimBoundary.blockedClaims')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.ownerReviewMayProceed === true, 'owner review readiness missing')
assert(parsed.readiness.runtimeReadinessPlanCreated === true, 'runtime plan readiness missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'runtime accepted today')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'route accepted today')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE184-DISABLED-ROUTE-RUNTIME-READINESS-OWNER-REVIEW', 'readiness next prompt mismatch')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowRuntimeReadinessPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowRuntimeReadinessStaticValidationNext === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase183-disabled-route-runtime-readiness-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2248,
      disabledRouteRuntimeReadinessPlanCreated: true,
      sourceOnlyPlanning: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE184-DISABLED-ROUTE-RUNTIME-READINESS-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
