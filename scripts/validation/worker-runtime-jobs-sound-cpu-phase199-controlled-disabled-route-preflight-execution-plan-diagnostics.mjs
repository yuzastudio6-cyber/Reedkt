import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase198_controlled_disabled_route_preflight_static_validation_result_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_execution_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase199_controlled_disabled_route_preflight_execution_plan_completed_with_warnings_ready_for_controlled_preflight_execution_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase200_controlled_disabled_route_preflight_execution_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_execution'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan-result.md',
  server: 'docs/worker-runtime-jobs-sound-cpu-phase199-server-start-preconditions-plan.md',
  request: 'docs/worker-runtime-jobs-sound-cpu-phase199-synthetic-http-request-plan.md',
  response: 'docs/worker-runtime-jobs-sound-cpu-phase199-expected-fail-closed-response-plan.md',
  sideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase199-no-side-effect-observation-plan.md',
  aborts: 'docs/worker-runtime-jobs-sound-cpu-phase199-abort-conditions-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase199-controlled-preflight-execution-owner-review-readiness-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase199-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review.md',
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
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
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
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowExternalAgentExecutionReadyClaim',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review',
  ),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan-result'),
  server: parseJsonBlock(docs.server, 'worker-runtime-jobs-sound-cpu-phase199-server-start-preconditions-plan'),
  request: parseJsonBlock(docs.request, 'worker-runtime-jobs-sound-cpu-phase199-synthetic-http-request-plan'),
  response: parseJsonBlock(docs.response, 'worker-runtime-jobs-sound-cpu-phase199-expected-fail-closed-response-plan'),
  sideEffects: parseJsonBlock(docs.sideEffects, 'worker-runtime-jobs-sound-cpu-phase199-no-side-effect-observation-plan'),
  aborts: parseJsonBlock(docs.aborts, 'worker-runtime-jobs-sound-cpu-phase199-abort-conditions-register'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase199-controlled-preflight-execution-owner-review-readiness-register',
  ),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase199-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2287, 'source PR mismatch')
assert(parsed.source.ownerReviewResult.controlledDisabledRoutePreflightExecutionPlanMayProceed === true, 'source next plan missing')
assert(parsed.source.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'source runtime accepted')
assert(parsed.source.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'source dispatch accepted')
assert(parsed.source.ownerReviewResult.acceptedForRouteExecutionToday === false, 'source route accepted')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowControlledDisabledRoutePreflightExecutionPlanning === true, 'source prompt planning missing')
assert(parsed.sourcePrompt.planningScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.planningScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2290, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '43ace73121801169dc46190901e8561070f7824b', 'result source merge mismatch')
assert(parsed.result.planResult.controlledDisabledRoutePreflightExecutionPlanCreated === true, 'execution plan missing')
assert(parsed.result.planResult.planningOnly === true, 'planning-only missing')
assert(parsed.result.planResult.singleSyntheticHttpRequestPlanned === true, 'request plan missing')
assert(parsed.result.planResult.expectedFailClosedResponsePlanned === true, 'response plan missing')
assert(parsed.result.planResult.noSideEffectObservationPlanned === true, 'observation plan missing')
assert(parsed.result.planResult.serverStartedToday === false, 'server started')
assert(parsed.result.planResult.httpRouteRequestExecuted === false, 'HTTP executed')
assert(parsed.result.planResult.routeHandlerInvokedToday === false, 'handler invoked')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route widened')
assert(parsed.result.planResult.externalAgentExecutionReady === false, 'external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.server.futurePreflightServerPlan.serverStartRequiresPhase200OwnerApproval === true, 'server owner approval missing')
assert(parsed.server.futurePreflightServerPlan.requireRouteExecutionFlagFalse === true, 'route flag precondition missing')
assert(parsed.server.futurePreflightServerPlan.requireNoSupabaseEnvironment === true, 'supabase precondition missing')
assertFalseMap(parsed.server.currentGateExecution, 'server.currentGateExecution')

assert(parsed.request.futureSyntheticRequest.method === 'POST', 'request method mismatch')
assert(parsed.request.futureSyntheticRequest.targetRoute === '/api/workers/sound-cpu/jobs', 'request route mismatch')
assert(parsed.request.futureSyntheticRequest.rawPromptAllowed === false, 'raw prompt allowed')
assert(parsed.request.futureSyntheticRequest.secretPayloadAllowed === false, 'secret allowed')
assert(parsed.request.currentGateRequestSent === false, 'request sent today')

assert(parsed.response.futureExpectedResponse.httpStatus === 409, 'response status mismatch')
assert(parsed.response.futureExpectedResponse.ok === false, 'response ok widened')
assert(parsed.response.futureExpectedResponse.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'response error mismatch')
assert(parsed.response.futureExpectedResponse.workerDispatchStarted === false, 'response dispatch widened')
assert(parsed.response.futureExpectedResponse.supabaseMutationStarted === false, 'response supabase widened')
assert(parsed.response.currentGateResponseObserved === false, 'response observed today')

assertFalseMap(parsed.sideEffects.futureObservationPoints, 'sideEffects.futureObservationPoints')
assert(parsed.sideEffects.currentGateObservationPerformed === false, 'side effect observation performed today')
assert(parsed.aborts.futureControlledPreflightMustAbortIf.includes('expected_fail_closed_response_not_returned'), 'response abort missing')
assert(parsed.aborts.currentGateUnsafeConditionDetected === false, 'unsafe condition today')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.controlledDisabledRoutePreflightExecutionPlanCreated === true, 'readiness plan missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'readiness owner review missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightExecutionPlanCreated === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.planningOnly === true, 'claim planning-only missing')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowControlledDisabledRoutePreflightExecutionPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowControlledDisabledRoutePreflightExecutionNext === true, 'next prompt execution next missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2290,
      controlledDisabledRoutePreflightExecutionPlanCreated: true,
      planningOnly: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE200-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-EXECUTION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
