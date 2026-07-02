import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase181_disabled_route_registry_app_registration_static_validation_passed_with_warnings_ready_for_static_validation_result_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase182_disabled_route_registry_app_registration_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_runtime_readiness_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase183_disabled_route_runtime_readiness_plan_completed_with_warnings_ready_for_disabled_route_runtime_readiness_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase181-source-only-app-registration-proof-output.md',
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase182-static-validation-acceptance-register.md',
  runtimePlanning: 'docs/worker-runtime-jobs-sound-cpu-phase182-runtime-readiness-planning-acceptance-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase182-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase182-claim-policy.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase182-runtime-readiness-plan-prompt-readiness-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan.md',
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
    'acceptedForWorkerDispatchExecutionToday',
    'acceptedForRouteExecutionToday',
    'serverStarted',
    'serverStartedToday',
    'httpRouteRequestExecuted',
    'httpRouteRequestExecutedToday',
    'routeHandlerInvoked',
    'routeHandlerInvokedToday',
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
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'routeReadinessClaimed',
    'imageReadinessClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation-result',
  ),
  sourceProof: parseJsonBlock(
    docs.sourceProof,
    'worker-runtime-jobs-sound-cpu-phase181-source-only-app-registration-proof-output',
  ),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase182-static-validation-acceptance-register',
  ),
  runtimePlanning: parseJsonBlock(
    docs.runtimePlanning,
    'worker-runtime-jobs-sound-cpu-phase182-runtime-readiness-planning-acceptance-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase182-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase182-claim-policy'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase182-runtime-readiness-plan-prompt-readiness-register',
  ),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2243, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'a15ec81b28572eb9f3d3dd4089b341ca8e2112a2', 'source merge mismatch')
assert(parsed.source.validationResult.sourceOnlyStaticValidationPassed === true, 'source validation missing')
assert(parsed.source.validationResult.appImportCount === 1, 'source import count mismatch')
assert(parsed.source.validationResult.appMountCount === 1, 'source mount count mismatch')
assert(parsed.source.validationResult.duplicateAppRegistrationFound === false, 'source duplicate found')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.validationResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(parsed.sourceProof.sourceOnlyStaticValidationPassed === true, 'source proof validation missing')
assert(parsed.sourceProof.appImportCount === 1, 'source proof import mismatch')
assert(parsed.sourceProof.appMountCount === 1, 'source proof mount mismatch')
assert(parsed.sourceProof.routeFactoryReferenceCount === 2, 'source proof references mismatch')
assert(parsed.sourceProof.duplicateAppRegistrationFound === false, 'source proof duplicate found')
assert(parsed.sourceProof.serverStarted === false, 'source proof server started')
assert(parsed.sourceProof.httpRouteRequestExecuted === false, 'source proof HTTP executed')
assert(parsed.sourceProof.routeHandlerInvoked === false, 'source proof handler invoked')
assert(parsed.sourceProof.workerDispatchExecutionEnabled === false, 'source proof dispatch widened')
assert(parsed.sourceProof.routeExecutionEnabled === false, 'source proof route widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationResultReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowRuntimeReadinessPlanningNext === true, 'source prompt planning missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2245, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '374754bbbeac1b9fb50ef705773e704535ab0a6c', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.sourceOnlyStaticValidationAccepted === true, 'result validation not accepted')
assert(parsed.result.ownerReviewResult.disabledRouteRuntimeReadinessPlanningMayProceed === true, 'result planning not accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.runtimeReadinessClaimed === false, 'result runtime readiness claimed')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.ownerReviewResult.routeExecutionEnabled === false, 'result route widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2245, 'acceptance source mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.sourceOnlyStaticValidationPassed === true, 'acceptance validation missing')
assert(parsed.acceptance.acceptedSourceEvidence.appImportCount === 1, 'acceptance import mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.appMountCount === 1, 'acceptance mount mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.duplicateAppRegistrationFound === false, 'acceptance duplicate found')
assert(parsed.acceptance.acceptedForNextPlanning.disabledRouteRuntimeReadinessPlan === true, 'acceptance planning missing')
assert(parsed.acceptance.acceptedForNextPlanning.routeExecutionEnablement === false, 'acceptance route widened')
assert(parsed.acceptance.acceptedForNextPlanning.workerDispatchEnablement === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedForNextPlanning.serverStart === false, 'acceptance server widened')
assert(parsed.acceptance.acceptedForNextPlanning.httpRouteRequest === false, 'acceptance HTTP widened')

assert(parsed.runtimePlanning.planningMayProceed === true, 'runtime planning missing')
assert(parsed.runtimePlanning.planningSurface.appRegistration === 'server/app.ts', 'planning app source mismatch')
assert(parsed.runtimePlanning.planningTopics.includes('runtime_disabled_flag_inventory'), 'runtime flag topic missing')
assertFalseMap(parsed.runtimePlanning.executionStillBlocked, 'runtimePlanning.executionStillBlocked')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.sourceOnlyStaticValidationAccepted === true, 'claim validation missing')
assert(parsed.claimPolicy.allowedClaims.disabledRouteRuntimeReadinessPlanningMayProceed === true, 'claim planning missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.runtimeReadinessClaimed === false, 'claim runtime readiness widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE183-DISABLED-ROUTE-RUNTIME-READINESS-PLAN', 'readiness next prompt mismatch')
assert(parsed.readiness.runtimeReadinessPlanMayProceed === true, 'readiness plan missing')
assert(parsed.readiness.sourceOnlyPlanningRequired === true, 'readiness source-only missing')
assert(parsed.readiness.mustStayClosed.includes('route_execution'), 'route blocker missing')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowReadSourceFiles === true, 'next prompt read missing')
assert(parsed.nextPrompt.planningScope.allowRuntimeReadinessPlanning === true, 'next prompt planning missing')
assert(parsed.nextPrompt.planningScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.planningScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.planningScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase182-disabled-route-registry-app-registration-static-validation-result-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2245,
      sourceOnlyStaticValidationAccepted: true,
      disabledRouteRuntimeReadinessPlanningMayProceed: true,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE183-DISABLED-ROUTE-RUNTIME-READINESS-PLAN',
    },
    null,
    2,
  ),
)
