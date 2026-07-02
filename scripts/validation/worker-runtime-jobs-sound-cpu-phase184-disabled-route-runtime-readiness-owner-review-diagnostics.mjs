import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase183_disabled_route_runtime_readiness_plan_completed_with_warnings_ready_for_disabled_route_runtime_readiness_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase184_disabled_route_runtime_readiness_owner_review_passed_with_warnings_ready_for_disabled_route_runtime_readiness_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase185_disabled_route_runtime_readiness_static_validation_passed_with_warnings_ready_for_runtime_readiness_static_validation_result_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase184-plan-acceptance-register.md',
  staticValidation: 'docs/worker-runtime-jobs-sound-cpu-phase184-static-validation-acceptance-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase184-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase184-claim-policy.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase184-runtime-readiness-static-validation-readiness-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation.md',
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
    'acceptedForRuntimeExecutionToday',
    'acceptedForWorkerDispatchExecutionToday',
    'acceptedForRouteExecutionToday',
    'serverStartedToday',
    'serverStarted',
    'httpRouteRequestExecuted',
    'routeHandlerInvoked',
    'expressRouterInstantiated',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'claimLeaseMutationEnabled',
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
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'routeReadinessClaimed',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase183-disabled-route-runtime-readiness-plan-result'),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review-result',
  ),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase184-plan-acceptance-register'),
  staticValidation: parseJsonBlock(
    docs.staticValidation,
    'worker-runtime-jobs-sound-cpu-phase184-static-validation-acceptance-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase184-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase184-claim-policy'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase184-runtime-readiness-static-validation-readiness-register',
  ),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2248, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '3fd6e71d62167ff65cf1f353313fd6b20fd3c6f3', 'source merge mismatch')
assert(parsed.source.planResult.disabledRouteRuntimeReadinessPlanCreated === true, 'source plan missing')
assert(parsed.source.planResult.sourceOnlyPlanning === true, 'source source-only missing')
assert(parsed.source.planResult.serverStartedToday === false, 'source server started')
assert(parsed.source.planResult.httpRouteRequestExecuted === false, 'source HTTP executed')
assert(parsed.source.planResult.routeHandlerInvoked === false, 'source handler invoked')
assert(parsed.source.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.planResult.routeExecutionEnabled === false, 'source route widened')
assert(parsed.source.planResult.runtimeReadinessClaimed === false, 'source runtime readiness claimed')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowRuntimeReadinessPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowRuntimeReadinessStaticValidationNext === true, 'source prompt static validation missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2249, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'f7d1d6014729ff10eefed4485dba474906237979', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.runtimeReadinessPlanAccepted === true, 'plan not accepted')
assert(parsed.result.ownerReviewResult.runtimeReadinessStaticValidationMayProceed === true, 'static validation not accepted')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'route accepted')
assert(parsed.result.ownerReviewResult.runtimeReadinessClaimed === false, 'runtime readiness claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourcePlan.sourcePr === 2249, 'acceptance source mismatch')
assert(parsed.acceptance.acceptedSourcePlan.disabledRouteRuntimeReadinessPlanCreated === true, 'acceptance plan missing')
assert(parsed.acceptance.acceptedSourcePlan.workerDispatchExecutionEnabled === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedSourcePlan.routeExecutionEnabled === false, 'acceptance route widened')
assert(parsed.acceptance.acceptedPlanTopics.includes('readiness_claim_boundary'), 'claim boundary topic missing')

assert(parsed.staticValidation.runtimeReadinessStaticValidationMayProceed === true, 'static validation missing')
assert(parsed.staticValidation.allowedValidation.readSourceFiles === true, 'read source missing')
assert(parsed.staticValidation.allowedValidation.verifyReadinessClaimsClosed === true, 'readiness closed check missing')
assertFalseMap(parsed.staticValidation.forbiddenValidation, 'staticValidation.forbiddenValidation')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')

assert(parsed.claimPolicy.allowedClaims.runtimeReadinessPlanAccepted === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.runtimeReadinessStaticValidationMayProceed === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.runtimeReadinessStaticValidationMayProceed === true, 'readiness static validation missing')
assert(parsed.readiness.sourceOnlyValidationRequired === true, 'readiness source-only missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE185-DISABLED-ROUTE-RUNTIME-READINESS-STATIC-VALIDATION', 'readiness next prompt mismatch')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowReadSourceFiles === true, 'next prompt read missing')
assert(parsed.nextPrompt.validationScope.allowVerifyDisabledRuntimeFlags === true, 'next prompt flags missing')
assert(parsed.nextPrompt.validationScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.validationScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase184-disabled-route-runtime-readiness-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2249,
      runtimeReadinessPlanAccepted: true,
      runtimeReadinessStaticValidationMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE185-DISABLED-ROUTE-RUNTIME-READINESS-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
