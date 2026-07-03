import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase187_disabled_route_execution_preflight_plan_completed_with_warnings_ready_for_execution_preflight_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase188_disabled_route_execution_preflight_owner_review_passed_with_warnings_ready_for_preflight_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase189_disabled_route_execution_preflight_static_validation_passed_with_warnings_ready_for_preflight_static_validation_result_owner_review'

const docs = {
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan-result.md',
  sourceChecklist: 'docs/worker-runtime-jobs-sound-cpu-phase187-preflight-checklist.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-phase187-route-handler-boundary-plan.md',
  sourceAuth: 'docs/worker-runtime-jobs-sound-cpu-phase187-auth-idempotency-preconditions.md',
  sourceResponse: 'docs/worker-runtime-jobs-sound-cpu-phase187-disabled-response-contract-plan.md',
  sourceSideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase187-no-side-effect-observation-plan.md',
  sourceStops: 'docs/worker-runtime-jobs-sound-cpu-phase187-stop-conditions-register.md',
  sourceReadiness: 'docs/worker-runtime-jobs-sound-cpu-phase187-execution-preflight-owner-review-readiness-register.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase188-preflight-plan-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase188-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase188-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase188-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation.md',
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
    'externalAgentExecutionReady',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'allowServerAppSourceChange',
    'allowRouteSourceChange',
    'allowServerStart',
    'allowHttpRouteRequestExecution',
    'allowRouteHandlerInvocation',
    'allowExpressRouterInstantiation',
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowClaimLeaseMutation',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowExternalAgentExecutionReadyClaim',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan-result',
  ),
  sourceChecklist: parseJsonBlock(docs.sourceChecklist, 'worker-runtime-jobs-sound-cpu-phase187-preflight-checklist'),
  sourceBoundary: parseJsonBlock(docs.sourceBoundary, 'worker-runtime-jobs-sound-cpu-phase187-route-handler-boundary-plan'),
  sourceAuth: parseJsonBlock(docs.sourceAuth, 'worker-runtime-jobs-sound-cpu-phase187-auth-idempotency-preconditions'),
  sourceResponse: parseJsonBlock(docs.sourceResponse, 'worker-runtime-jobs-sound-cpu-phase187-disabled-response-contract-plan'),
  sourceSideEffects: parseJsonBlock(
    docs.sourceSideEffects,
    'worker-runtime-jobs-sound-cpu-phase187-no-side-effect-observation-plan',
  ),
  sourceStops: parseJsonBlock(docs.sourceStops, 'worker-runtime-jobs-sound-cpu-phase187-stop-conditions-register'),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase187-execution-preflight-owner-review-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review',
  ),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase188-preflight-plan-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase188-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase188-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase188-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.allowExecutionPreflightPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowPreflightStaticValidationNext === true, 'source prompt static validation missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2256, 'source result source PR mismatch')
assert(
  parsed.sourceResult.sourceVerification.sourceMergeCommit === 'dfd8405e3638901a800850cf07fbcd545765d376',
  'source result source merge mismatch',
)
assert(parsed.sourceResult.planResult.disabledRouteExecutionPreflightPlanCreated === true, 'source preflight missing')
assert(parsed.sourceResult.planResult.planningOnly === true, 'source planning-only missing')
assert(parsed.sourceResult.planResult.serverStartedToday === false, 'source server started')
assert(parsed.sourceResult.planResult.httpRouteRequestExecuted === false, 'source HTTP executed')
assert(parsed.sourceResult.planResult.routeHandlerInvokedToday === false, 'source handler invoked')
assert(parsed.sourceResult.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.sourceResult.planResult.routeExecutionEnabled === false, 'source route widened')
assert(parsed.sourceResult.planResult.externalAgentExecutionReady === false, 'source external agent ready claimed')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assertFalseMap(parsed.sourceChecklist.currentGateActions, 'sourceChecklist.currentGateActions')
assert(parsed.sourceBoundary.currentGateBoundary.handlerInvocationAllowed === false, 'source boundary handler widened')
assert(parsed.sourceBoundary.currentGateBoundary.expressRouterInstantiationAllowed === false, 'source boundary router widened')
assert(parsed.sourceAuth.currentGateExecution.routeHandlerInvoked === false, 'source auth handler invoked')
assert(parsed.sourceResponse.currentGateResponseCreated === false, 'source response created today')
assert(parsed.sourceSideEffects.currentGateObservationPerformed === false, 'source side effects observed today')
assert(parsed.sourceStops.currentGateUnsafeConditionDetected === false, 'source unsafe condition detected')
assert(parsed.sourceReadiness.nextExpectedDecision === decision, 'source readiness next decision mismatch')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2259, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '762dd4c0217bfd151205813b14970b9c71f03d1a', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.disabledRouteExecutionPreflightPlanAccepted === true, 'result preflight not accepted')
assert(parsed.result.ownerReviewResult.sourceOnlyPreflightStaticValidationMayProceed === true, 'result static validation not accepted')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === false, 'result external agent ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2259, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.disabledRouteExecutionPreflightPlanCreated === true, 'acceptance preflight missing')
assert(parsed.acceptance.acceptedSourceEvidence.planningOnly === true, 'acceptance planning-only missing')
assert(parsed.acceptance.acceptedSourceEvidence.serverStartedToday === false, 'acceptance server started')
assert(parsed.acceptance.acceptedSourceEvidence.routeHandlerInvokedToday === false, 'acceptance handler invoked')
assert(parsed.acceptance.acceptedSourceEvidence.workerDispatchExecutionEnabled === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedSourceEvidence.routeExecutionEnabled === false, 'acceptance route widened')
assert(parsed.acceptance.acceptedSourceEvidence.externalAgentExecutionReady === false, 'acceptance external agent ready claimed')
assert(parsed.acceptance.acceptedForNextStaticValidation.readRouteSourceOnly === true, 'acceptance route source missing')
assert(parsed.acceptance.acceptedForNextStaticValidation.verifyDisabledFlagsOnly === true, 'acceptance disabled flag missing')
assert(parsed.acceptance.acceptedForNextStaticValidation.startServer === false, 'acceptance server widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.sendHttpRequest === false, 'acceptance HTTP widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.invokeRouteHandler === false, 'acceptance handler widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.dispatchWorker === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.mutateSupabase === false, 'acceptance Supabase widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceOnlyPreflightStaticValidationMayProceed === true, 'readiness static validation missing')
assert(parsed.readiness.staticValidationOnlyRequired === true, 'readiness static-only missing')
assert(parsed.readiness.allowedStaticValidationTopics.includes('route_disabled_flag_readback'), 'readiness route flag missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')
assert(
  parsed.readiness.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE189-DISABLED-ROUTE-EXECUTION-PREFLIGHT-STATIC-VALIDATION',
  'readiness next prompt mismatch',
)

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteExecutionPreflightPlanAccepted === true, 'claim preflight missing')
assert(parsed.claimPolicy.allowedClaims.sourceOnlyPreflightStaticValidationMayProceed === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external agent ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowReadRouteSource === true, 'next prompt route read missing')
assert(parsed.nextPrompt.validationScope.allowStaticAssertionsOnly === true, 'next prompt static-only missing')
assert(parsed.nextPrompt.validationScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.validationScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.validationScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.validationScope.allowExpressRouterInstantiation === false, 'next prompt router widened')
assert(parsed.nextPrompt.validationScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.validationScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external agent ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase188-disabled-route-execution-preflight-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2259,
      disabledRouteExecutionPreflightPlanAccepted: true,
      sourceOnlyPreflightStaticValidationMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE189-DISABLED-ROUTE-EXECUTION-PREFLIGHT-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
