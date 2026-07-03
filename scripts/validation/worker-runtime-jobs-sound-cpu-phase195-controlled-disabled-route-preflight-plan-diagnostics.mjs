import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase194_disabled_route_synthetic_preflight_static_validation_result_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase195_controlled_disabled_route_preflight_plan_completed_with_warnings_ready_for_controlled_disabled_route_preflight_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase196_controlled_disabled_route_preflight_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_static_validation'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-phase194-static-validation-result-acceptance-register.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan-result.md',
  checklist: 'docs/worker-runtime-jobs-sound-cpu-phase195-preflight-checklist.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-phase195-route-handler-boundary-plan.md',
  auth: 'docs/worker-runtime-jobs-sound-cpu-phase195-auth-idempotency-preconditions.md',
  response: 'docs/worker-runtime-jobs-sound-cpu-phase195-disabled-response-contract-plan.md',
  sideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase195-no-side-effect-observation-plan.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-phase195-stop-conditions-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase195-controlled-preflight-owner-review-readiness-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase195-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase196-controlled-disabled-route-preflight-owner-review.md',
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
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase194-static-validation-result-acceptance-register',
  ),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan-result'),
  checklist: parseJsonBlock(docs.checklist, 'worker-runtime-jobs-sound-cpu-phase195-preflight-checklist'),
  boundary: parseJsonBlock(docs.boundary, 'worker-runtime-jobs-sound-cpu-phase195-route-handler-boundary-plan'),
  auth: parseJsonBlock(docs.auth, 'worker-runtime-jobs-sound-cpu-phase195-auth-idempotency-preconditions'),
  response: parseJsonBlock(docs.response, 'worker-runtime-jobs-sound-cpu-phase195-disabled-response-contract-plan'),
  sideEffects: parseJsonBlock(docs.sideEffects, 'worker-runtime-jobs-sound-cpu-phase195-no-side-effect-observation-plan'),
  stops: parseJsonBlock(docs.stops, 'worker-runtime-jobs-sound-cpu-phase195-stop-conditions-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase195-controlled-preflight-owner-review-readiness-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase195-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase196-controlled-disabled-route-preflight-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2276, 'source PR mismatch')
assert(parsed.source.ownerReviewResult.controlledDisabledRoutePreflightPlanMayProceed === true, 'source next plan missing')
assert(parsed.source.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'source runtime accepted')
assert(parsed.source.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'source dispatch accepted')
assert(parsed.source.ownerReviewResult.acceptedForRouteExecutionToday === false, 'source route accepted')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedSourceEvidence.sourcePr === 2276, 'source acceptance PR mismatch')
assert(parsed.sourceAcceptance.acceptedSourceEvidence.sourceOnlySyntheticPreflightStaticValidationPassed === true, 'source acceptance pass missing')
assert(parsed.sourceAcceptance.acceptedForNextControlledDisabledRoutePreflightPlan.planControlledDisabledRoutePreflightOnly === true, 'source acceptance next plan missing')
assert(parsed.sourceAcceptance.acceptedForNextControlledDisabledRoutePreflightPlan.startServer === false, 'source acceptance server widened')
assert(parsed.sourceAcceptance.acceptedForNextControlledDisabledRoutePreflightPlan.sendHttpRequest === false, 'source acceptance HTTP widened')
assert(parsed.sourceAcceptance.acceptedForNextControlledDisabledRoutePreflightPlan.invokeRouteHandler === false, 'source acceptance handler widened')
assert(parsed.sourceAcceptance.acceptedForNextControlledDisabledRoutePreflightPlan.dispatchWorker === false, 'source acceptance dispatch widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowControlledDisabledRoutePreflightPlanning === true, 'source prompt controlled planning missing')
assert(parsed.sourcePrompt.planningScope.allowExpectedDisabledResponsePlanning === true, 'source prompt response planning missing')
assert(parsed.sourcePrompt.planningScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.planningScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.planningScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2280, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '696f6946fb3a4e85e6fc702c355a5b8d7f13c841', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.controlledDisabledRoutePreflightPlanCreated === true, 'preflight plan missing')
assert(parsed.result.planResult.planningOnly === true, 'planning-only missing')
assert(parsed.result.planResult.serverAppSourceChangedToday === false, 'server app changed')
assert(parsed.result.planResult.routeSourceChangedToday === false, 'route source changed')
assert(parsed.result.planResult.serverStartedToday === false, 'server started')
assert(parsed.result.planResult.httpRouteRequestExecuted === false, 'HTTP executed')
assert(parsed.result.planResult.routeHandlerInvokedToday === false, 'handler invoked')
assert(parsed.result.planResult.expressRouterInstantiatedToday === false, 'router instantiated')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route widened')
assert(parsed.result.planResult.externalAgentExecutionReady === false, 'external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.checklist.futureControlledPreflightPreconditions.phase194OwnerReviewDecisionRequired === true, 'phase194 source missing')
assert(parsed.checklist.futureControlledPreflightPreconditions.routeExecutionFlagMustRemainFalse === true, 'route flag precondition missing')
assert(parsed.checklist.futureControlledPreflightPreconditions.serverStartRequiresLaterOwnerApproval === true, 'server approval missing')
assert(parsed.checklist.futureControlledPreflightPreconditions.httpRouteRequestRequiresLaterOwnerApproval === true, 'HTTP approval missing')
assertFalseMap(parsed.checklist.currentGateActions, 'checklist.currentGateActions')

assert(parsed.boundary.futureProofBoundary.targetRouteSource === 'server/routes/sound-cpu-worker-routes.ts', 'route source mismatch')
assert(parsed.boundary.futureProofBoundary.expectedHttpStatus === 409, 'expected status mismatch')
assert(parsed.boundary.futureProofBoundary.expectedWorkerDispatchStarted === false, 'dispatch expected true')
assertFalseMap(parsed.boundary.currentGateBoundary, 'boundary.currentGateBoundary')

assert(parsed.auth.futureSyntheticPreconditions.rawPromptAllowed === false, 'raw prompt allowed')
assert(parsed.auth.futureSyntheticPreconditions.secretPayloadAllowed === false, 'secret allowed')
assert(parsed.auth.futureSyntheticPreconditions.serviceRolePayloadAllowed === false, 'service role allowed')
assertFalseMap(parsed.auth.currentGateExecution, 'auth.currentGateExecution')

assert(parsed.response.futureExpectedDisabledResponse.ok === false, 'response ok widened')
assert(parsed.response.futureExpectedDisabledResponse.httpStatus === 409, 'response status mismatch')
assert(parsed.response.futureExpectedDisabledResponse.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'response error code mismatch')
assert(parsed.response.futureExpectedDisabledResponse.workerDispatchStarted === false, 'response dispatch widened')
assert(parsed.response.futureExpectedDisabledResponse.supabaseMutationStarted === false, 'response supabase widened')
assert(parsed.response.currentGateResponseCreated === false, 'response created today')
assert(parsed.response.currentGateResponseObserved === false, 'response observed today')

assertFalseMap(parsed.sideEffects.futureObservationPoints, 'sideEffects.futureObservationPoints')
assert(parsed.sideEffects.currentGateObservationPerformed === false, 'side effect observation performed today')

assert(parsed.stops.futureControlledPreflightMustStopIf.includes('route_execution_flag_true'), 'route flag stop missing')
assert(parsed.stops.futureControlledPreflightMustStopIf.includes('supabase_or_sql_write_required'), 'supabase stop missing')
assert(parsed.stops.futureControlledPreflightMustStopIf.includes('expected_disabled_response_not_fail_closed'), 'disabled response stop missing')
assert(
  parsed.stops.futureControlledPreflightMustStopIf.includes(
    'external_agent_execution_ready_claim_requested_before_disabled_preflight_proof',
  ),
  'external-ready stop missing',
)
assert(parsed.stops.currentGateStoppedForUnsafeCondition === false, 'unsafe stop today')
assert(parsed.stops.currentGateUnsafeConditionDetected === false, 'unsafe condition today')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.controlledDisabledRoutePreflightPlanCreated === true, 'readiness preflight missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'readiness owner review missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightPlanCreated === true, 'claim preflight missing')
assert(parsed.claimPolicy.allowedClaims.planningOnly === true, 'claim planning-only missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowControlledDisabledRoutePreflightPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowControlledDisabledRoutePreflightStaticValidationNext === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.reviewScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.reviewScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase195-controlled-disabled-route-preflight-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2280,
      controlledDisabledRoutePreflightPlanCreated: true,
      planningOnly: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE196-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
