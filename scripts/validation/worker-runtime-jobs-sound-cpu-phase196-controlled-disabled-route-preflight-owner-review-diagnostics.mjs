import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase195_controlled_disabled_route_preflight_plan_completed_with_warnings_ready_for_controlled_disabled_route_preflight_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase196_controlled_disabled_route_preflight_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase197_controlled_disabled_route_preflight_static_validation_passed_with_warnings_ready_for_controlled_disabled_route_preflight_static_validation_result_owner_review'

const docs = {
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase196-controlled-disabled-route-preflight-owner-review.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan-result.md',
  sourceChecklist: 'docs/worker-runtime-jobs-sound-cpu-phase195-preflight-checklist.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-phase195-route-handler-boundary-plan.md',
  sourceAuth: 'docs/worker-runtime-jobs-sound-cpu-phase195-auth-idempotency-preconditions.md',
  sourceResponse: 'docs/worker-runtime-jobs-sound-cpu-phase195-disabled-response-contract-plan.md',
  sourceSideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase195-no-side-effect-observation-plan.md',
  sourceStops: 'docs/worker-runtime-jobs-sound-cpu-phase195-stop-conditions-register.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase196-controlled-disabled-route-preflight-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase196-controlled-preflight-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase196-controlled-preflight-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase196-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase196-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase197-controlled-disabled-route-preflight-static-validation.md',
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
    'expressRouterInstantiatedToday',
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
    'externalAgentExecutionReady',
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
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase196-controlled-disabled-route-preflight-owner-review'),
  sourceResult: parseJsonBlock(docs.sourceResult, 'worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan-result'),
  sourceChecklist: parseJsonBlock(docs.sourceChecklist, 'worker-runtime-jobs-sound-cpu-phase195-preflight-checklist'),
  sourceBoundary: parseJsonBlock(docs.sourceBoundary, 'worker-runtime-jobs-sound-cpu-phase195-route-handler-boundary-plan'),
  sourceAuth: parseJsonBlock(docs.sourceAuth, 'worker-runtime-jobs-sound-cpu-phase195-auth-idempotency-preconditions'),
  sourceResponse: parseJsonBlock(docs.sourceResponse, 'worker-runtime-jobs-sound-cpu-phase195-disabled-response-contract-plan'),
  sourceSideEffects: parseJsonBlock(docs.sourceSideEffects, 'worker-runtime-jobs-sound-cpu-phase195-no-side-effect-observation-plan'),
  sourceStops: parseJsonBlock(docs.sourceStops, 'worker-runtime-jobs-sound-cpu-phase195-stop-conditions-register'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase196-controlled-disabled-route-preflight-owner-review'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase196-controlled-preflight-acceptance-register'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase196-controlled-preflight-static-validation-readiness-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase196-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase196-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase197-controlled-disabled-route-preflight-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowControlledDisabledRoutePreflightPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowControlledDisabledRoutePreflightStaticValidationNext === true, 'source prompt static validation missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2280, 'source result PR mismatch')
assert(parsed.sourceResult.planResult.controlledDisabledRoutePreflightPlanCreated === true, 'source plan missing')
assert(parsed.sourceResult.planResult.planningOnly === true, 'source planning-only missing')
assert(parsed.sourceResult.planResult.serverStartedToday === false, 'source server started')
assert(parsed.sourceResult.planResult.httpRouteRequestExecuted === false, 'source HTTP executed')
assert(parsed.sourceResult.planResult.routeHandlerInvokedToday === false, 'source handler invoked')
assert(parsed.sourceResult.planResult.expressRouterInstantiatedToday === false, 'source router instantiated')
assert(parsed.sourceResult.planResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.sourceResult.planResult.routeExecutionEnabled === false, 'source route widened')
assert(parsed.sourceResult.planResult.externalAgentExecutionReady === false, 'source external ready claimed')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceChecklist.futureControlledPreflightPreconditions.phase194OwnerReviewDecisionRequired === true, 'source checklist owner review missing')
assert(parsed.sourceChecklist.futureControlledPreflightPreconditions.routeExecutionFlagMustRemainFalse === true, 'source checklist route flag missing')
assertFalseMap(parsed.sourceChecklist.currentGateActions, 'sourceChecklist.currentGateActions')
assert(parsed.sourceBoundary.futureProofBoundary.expectedHttpStatus === 409, 'source boundary status mismatch')
assertFalseMap(parsed.sourceBoundary.currentGateBoundary, 'sourceBoundary.currentGateBoundary')
assert(parsed.sourceAuth.futureSyntheticPreconditions.secretPayloadAllowed === false, 'source auth secret allowed')
assertFalseMap(parsed.sourceAuth.currentGateExecution, 'sourceAuth.currentGateExecution')
assert(parsed.sourceResponse.futureExpectedDisabledResponse.httpStatus === 409, 'source response status mismatch')
assert(parsed.sourceResponse.futureExpectedDisabledResponse.workerDispatchStarted === false, 'source response dispatch widened')
assert(parsed.sourceResponse.currentGateResponseObserved === false, 'source response observed')
assertFalseMap(parsed.sourceSideEffects.futureObservationPoints, 'sourceSideEffects.futureObservationPoints')
assert(parsed.sourceStops.futureControlledPreflightMustStopIf.includes('expected_disabled_response_not_fail_closed'), 'source stop missing')
assert(parsed.sourceStops.currentGateUnsafeConditionDetected === false, 'source unsafe detected')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2281, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '00125eb5d0cfaf11a78723103a905f0f6268e47e', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.controlledDisabledRoutePreflightPlanAccepted === true, 'result plan not accepted')
assert(parsed.result.ownerReviewResult.sourceOnlyControlledPreflightStaticValidationMayProceed === true, 'result static validation missing')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2281, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.controlledDisabledRoutePreflightPlanCreated === true, 'acceptance plan missing')
assert(parsed.acceptance.acceptedSourceEvidence.planningOnly === true, 'acceptance planning-only missing')
assert(parsed.acceptance.acceptedSourceEvidence.serverStartedToday === false, 'acceptance server started')
assert(parsed.acceptance.acceptedSourceEvidence.httpRouteRequestExecuted === false, 'acceptance HTTP executed')
assert(parsed.acceptance.acceptedSourceEvidence.routeHandlerInvokedToday === false, 'acceptance handler invoked')
assert(parsed.acceptance.acceptedForNextStaticValidation.readPreflightChecklistOnly === true, 'acceptance checklist read missing')
assert(parsed.acceptance.acceptedForNextStaticValidation.startServer === false, 'acceptance server widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.sendHttpRequest === false, 'acceptance HTTP widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.invokeRouteHandler === false, 'acceptance handler widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.dispatchWorker === false, 'acceptance dispatch widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceOnlyControlledPreflightStaticValidationMayProceed === true, 'readiness static validation missing')
assert(parsed.readiness.staticValidationOnlyRequired === true, 'readiness static-only missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightPlanAccepted === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.sourceOnlyControlledPreflightStaticValidationMayProceed === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowStaticAssertionsOnly === true, 'next prompt static-only missing')
assert(parsed.nextPrompt.validationScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.validationScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.validationScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.validationScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase196-controlled-disabled-route-preflight-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase196-controlled-disabled-route-preflight-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2281,
      controlledDisabledRoutePreflightPlanAccepted: true,
      sourceOnlyControlledPreflightStaticValidationMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE197-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
