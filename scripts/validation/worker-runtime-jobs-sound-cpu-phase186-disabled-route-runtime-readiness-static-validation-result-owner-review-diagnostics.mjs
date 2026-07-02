import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase185_disabled_route_runtime_readiness_static_validation_passed_with_warnings_ready_for_runtime_readiness_static_validation_result_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase186_disabled_route_runtime_readiness_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_execution_preflight_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase187_disabled_route_execution_preflight_plan_completed_with_warnings_ready_for_execution_preflight_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase185-runtime-readiness-static-proof-output.md',
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase186-static-validation-result-acceptance-register.md',
  preflight: 'docs/worker-runtime-jobs-sound-cpu-phase186-execution-preflight-planning-acceptance-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase186-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase186-claim-policy.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase186-execution-preflight-plan-readiness-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan.md',
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
    'serverStarted',
    'serverStartedToday',
    'httpRouteRequestExecuted',
    'httpRouteRequestExecutedToday',
    'routeHandlerInvoked',
    'routeHandlerInvokedToday',
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
    'toolExecutionReadinessClaimed',
    'externalAgentExecutionReady',
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
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation-result',
  ),
  sourceProof: parseJsonBlock(
    docs.sourceProof,
    'worker-runtime-jobs-sound-cpu-phase185-runtime-readiness-static-proof-output',
  ),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase186-static-validation-result-acceptance-register',
  ),
  preflight: parseJsonBlock(
    docs.preflight,
    'worker-runtime-jobs-sound-cpu-phase186-execution-preflight-planning-acceptance-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase186-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase186-claim-policy'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase186-execution-preflight-plan-readiness-register'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2253, 'source PR mismatch')
assert(parsed.source.validationResult.sourceOnlyRuntimeReadinessStaticValidationPassed === true, 'source validation missing')
assert(parsed.source.validationResult.routeExecutionFlagFalse === true, 'source route flag missing')
assert(parsed.source.validationResult.routeSchemaAllFlagsLiteralFalse === true, 'source schema flags missing')
assert(parsed.source.validationResult.dispatchRuntimeFlagsDisabled === true, 'source dispatch flags missing')
assert(parsed.source.validationResult.runtimeGateStateFailClosed === true, 'source runtime gate missing')
assert(parsed.source.validationResult.serverStarted === false, 'source server started')
assert(parsed.source.validationResult.routeHandlerInvoked === false, 'source handler invoked')
assert(parsed.source.validationResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.validationResult.routeExecutionEnabled === false, 'source route widened')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(parsed.sourceProof.sourceOnlyRuntimeReadinessStaticValidationPassed === true, 'source proof validation missing')
assert(parsed.sourceProof.expressRouterInstantiated === false, 'source proof router instantiated')
assert(parsed.sourceProof.workerDispatchExecutionEnabled === false, 'source proof dispatch widened')
assert(parsed.sourceProof.routeExecutionEnabled === false, 'source proof route widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationResultReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowExecutionPreflightPlanningNext === true, 'source prompt preflight missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2254, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'e93392282e1a99346b5810cb5178386dab555c3a', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.sourceOnlyRuntimeReadinessStaticValidationAccepted === true, 'result validation not accepted')
assert(parsed.result.ownerReviewResult.disabledRouteExecutionPreflightPlanningMayProceed === true, 'result preflight not accepted')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === undefined, 'result should not claim external agent execution ready')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2254, 'acceptance source mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.sourceOnlyRuntimeReadinessStaticValidationPassed === true, 'acceptance validation missing')
assert(parsed.acceptance.acceptedSourceEvidence.routeExecutionFlagFalse === true, 'acceptance route flag missing')
assert(parsed.acceptance.acceptedSourceEvidence.routeHandlerInvoked === false, 'acceptance handler invoked')
assert(parsed.acceptance.acceptedForNextPlanning.disabledRouteExecutionPreflightPlan === true, 'acceptance preflight missing')
assert(parsed.acceptance.acceptedForNextPlanning.routeExecutionEnablement === false, 'acceptance route widened')
assert(parsed.acceptance.acceptedForNextPlanning.workerDispatchEnablement === false, 'acceptance dispatch widened')

assert(parsed.preflight.executionPreflightPlanningMayProceed === true, 'preflight planning missing')
assert(parsed.preflight.planningOnly === true, 'preflight planning-only missing')
assert(parsed.preflight.plannedPreflightTopics.includes('stop_conditions_for_unsafe_runtime_drift'), 'stop condition topic missing')
assertFalseMap(parsed.preflight.executionStillBlocked, 'preflight.executionStillBlocked')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.sourceOnlyRuntimeReadinessStaticValidationAccepted === true, 'claim validation missing')
assert(parsed.claimPolicy.allowedClaims.disabledRouteExecutionPreflightPlanningMayProceed === true, 'claim preflight missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external agent ready widened')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.executionPreflightPlanMayProceed === true, 'readiness preflight missing')
assert(parsed.readiness.planningOnlyRequired === true, 'readiness planning-only missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE187-DISABLED-ROUTE-EXECUTION-PREFLIGHT-PLAN', 'readiness next prompt mismatch')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowReadSourceFiles === true, 'next prompt read missing')
assert(parsed.nextPrompt.planningScope.allowExecutionPreflightPlanning === true, 'next prompt preflight missing')
assert(parsed.nextPrompt.planningScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.planningScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2254,
      sourceOnlyRuntimeReadinessStaticValidationAccepted: true,
      disabledRouteExecutionPreflightPlanningMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE187-DISABLED-ROUTE-EXECUTION-PREFLIGHT-PLAN',
    },
    null,
    2,
  ),
)
