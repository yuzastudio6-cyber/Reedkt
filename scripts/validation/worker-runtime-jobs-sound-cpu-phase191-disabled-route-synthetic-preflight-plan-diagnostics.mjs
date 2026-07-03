import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase190_disabled_route_execution_preflight_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_synthetic_preflight_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase191_disabled_route_synthetic_preflight_plan_completed_with_warnings_ready_for_synthetic_preflight_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase192_disabled_route_synthetic_preflight_owner_review_passed_with_warnings_ready_for_synthetic_preflight_static_validation'

const docs = {
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan.md',
  sourceReview:
    'docs/worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan-result.md',
  payload: 'docs/worker-runtime-jobs-sound-cpu-phase191-synthetic-payload-plan.md',
  auth: 'docs/worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan.md',
  response: 'docs/worker-runtime-jobs-sound-cpu-phase191-expected-disabled-response-plan.md',
  sideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase191-no-side-effect-observation-plan.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-phase191-stop-conditions-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase191-synthetic-preflight-owner-review-readiness-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review.md',
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
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan'),
  sourceReview: parseJsonBlock(
    docs.sourceReview,
    'worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review',
  ),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan-result'),
  payload: parseJsonBlock(docs.payload, 'worker-runtime-jobs-sound-cpu-phase191-synthetic-payload-plan'),
  auth: parseJsonBlock(docs.auth, 'worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan'),
  response: parseJsonBlock(docs.response, 'worker-runtime-jobs-sound-cpu-phase191-expected-disabled-response-plan'),
  sideEffects: parseJsonBlock(docs.sideEffects, 'worker-runtime-jobs-sound-cpu-phase191-no-side-effect-observation-plan'),
  stops: parseJsonBlock(docs.stops, 'worker-runtime-jobs-sound-cpu-phase191-stop-conditions-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase191-synthetic-preflight-owner-review-readiness-register'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowSyntheticPayloadPlanning === true, 'source prompt payload planning missing')
assert(parsed.sourcePrompt.planningScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.planningScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceReview.decision === sourceDecision, 'source review decision mismatch')
assert(parsed.sourceReview.sourceVerification.sourcePr === 2266, 'source review PR mismatch')
assert(parsed.sourceReview.ownerReviewResult.disabledRouteSyntheticPreflightPlanningMayProceed === true, 'source review synthetic planning missing')
assert(parsed.sourceReview.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'source review runtime accepted')
assert(parsed.sourceReview.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'source review dispatch accepted')
assert(parsed.sourceReview.ownerReviewResult.acceptedForRouteExecutionToday === false, 'source review route accepted')
assert(parsed.sourceReview.ownerReviewResult.externalAgentExecutionReady === false, 'source review external ready claimed')
assertNoop(parsed.sourceReview.supabaseClassification, 'sourceReview.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2268, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '791c9cfe7c313c1dd031db51eb4860a0d71a8f5f', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.disabledRouteSyntheticPreflightPlanCreated === true, 'result synthetic plan missing')
assert(parsed.result.planResult.planningOnly === true, 'result planning-only missing')
assert(parsed.result.planResult.syntheticPayloadPlanned === true, 'result payload missing')
assert(parsed.result.planResult.expectedDisabledResponsePlanned === true, 'result response missing')
assert(parsed.result.planResult.serverStarted === false, 'result server started')
assert(parsed.result.planResult.httpRouteRequestExecuted === false, 'result HTTP executed')
assert(parsed.result.planResult.routeHandlerInvoked === false, 'result handler invoked')
assert(parsed.result.planResult.expressRouterInstantiated === false, 'result router instantiated')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'result route widened')
assert(parsed.result.planResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.payload.futureSyntheticPayload.jobType === 'sound.package_import_smoke', 'payload job type mismatch')
assert(parsed.payload.futureSyntheticPayload.staticOnlyRuntimeFlags.routeExecutionEnabled === false, 'payload route flag widened')
assert(parsed.payload.futureSyntheticPayload.staticOnlyRuntimeFlags.workerDispatchExecutionEnabled === false, 'payload dispatch flag widened')
assert(parsed.payload.futureSyntheticPayload.staticOnlyRuntimeFlags.supabaseMutationEnabled === false, 'payload supabase flag widened')
assert(parsed.payload.currentGatePayloadSent === false, 'payload sent today')

assert(parsed.auth.futureSyntheticRequestContext.rawPromptAllowed === false, 'auth raw prompt allowed')
assert(parsed.auth.futureSyntheticRequestContext.secretPayloadAllowed === false, 'auth secret allowed')
assert(parsed.auth.futureSyntheticRequestContext.serviceRolePayloadAllowed === false, 'auth service role allowed')
assert(parsed.auth.currentGateAuthMiddlewareInvoked === false, 'auth middleware invoked')
assert(parsed.auth.currentGateIdempotencyMiddlewareInvoked === false, 'idempotency middleware invoked')

assert(parsed.response.futureExpectedDisabledResponse.httpStatus === 409, 'response status mismatch')
assert(parsed.response.futureExpectedDisabledResponse.ok === false, 'response ok widened')
assert(parsed.response.futureExpectedDisabledResponse.workerDispatchStarted === false, 'response dispatch widened')
assert(parsed.response.currentGateResponseObserved === false, 'response observed today')

assertFalseMap(parsed.sideEffects.futureObservationPoints, 'sideEffects.futureObservationPoints')
assert(parsed.sideEffects.currentGateObservationPerformed === false, 'side effects observed today')

assert(parsed.stops.futureSyntheticPreflightMustStopIf.includes('route_execution_flag_true'), 'stop route flag missing')
assert(parsed.stops.futureSyntheticPreflightMustStopIf.includes('supabase_or_sql_write_required'), 'stop supabase missing')
assert(parsed.stops.futureSyntheticPreflightMustStopIf.includes('external_agent_execution_ready_claim_requested_before_disabled_preflight_proof'), 'stop external ready missing')
assert(parsed.stops.currentGateUnsafeConditionDetected === false, 'unsafe condition today')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.disabledRouteSyntheticPreflightPlanCreated === true, 'readiness plan missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'readiness owner review missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowSyntheticPreflightPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowSyntheticPreflightStaticValidationNext === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.reviewScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase191-disabled-route-synthetic-preflight-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2268,
      disabledRouteSyntheticPreflightPlanCreated: true,
      planningOnly: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE192-DISABLED-ROUTE-SYNTHETIC-PREFLIGHT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
