import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase186_disabled_route_runtime_readiness_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_execution_preflight_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase187_disabled_route_execution_preflight_plan_completed_with_warnings_ready_for_execution_preflight_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase188_disabled_route_execution_preflight_owner_review_passed_with_warnings_ready_for_preflight_static_validation'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan-result.md',
  checklist: 'docs/worker-runtime-jobs-sound-cpu-phase187-preflight-checklist.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-phase187-route-handler-boundary-plan.md',
  auth: 'docs/worker-runtime-jobs-sound-cpu-phase187-auth-idempotency-preconditions.md',
  response: 'docs/worker-runtime-jobs-sound-cpu-phase187-disabled-response-contract-plan.md',
  sideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase187-no-side-effect-observation-plan.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-phase187-stop-conditions-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase187-execution-preflight-owner-review-readiness-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review.md',
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
    'worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review',
  ),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan-result'),
  checklist: parseJsonBlock(docs.checklist, 'worker-runtime-jobs-sound-cpu-phase187-preflight-checklist'),
  boundary: parseJsonBlock(docs.boundary, 'worker-runtime-jobs-sound-cpu-phase187-route-handler-boundary-plan'),
  auth: parseJsonBlock(docs.auth, 'worker-runtime-jobs-sound-cpu-phase187-auth-idempotency-preconditions'),
  response: parseJsonBlock(docs.response, 'worker-runtime-jobs-sound-cpu-phase187-disabled-response-contract-plan'),
  sideEffects: parseJsonBlock(docs.sideEffects, 'worker-runtime-jobs-sound-cpu-phase187-no-side-effect-observation-plan'),
  stops: parseJsonBlock(docs.stops, 'worker-runtime-jobs-sound-cpu-phase187-stop-conditions-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase187-execution-preflight-owner-review-readiness-register'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2254, 'source PR mismatch')
assert(parsed.source.ownerReviewResult.disabledRouteExecutionPreflightPlanningMayProceed === true, 'source preflight missing')
assert(parsed.source.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'source runtime accepted')
assert(parsed.source.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'source dispatch accepted')
assert(parsed.source.ownerReviewResult.acceptedForRouteExecutionToday === false, 'source route accepted')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.planningScope.allowExecutionPreflightPlanning === true, 'source prompt preflight missing')
assert(parsed.sourcePrompt.planningScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.planningScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.planningScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2256, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'dfd8405e3638901a800850cf07fbcd545765d376', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.disabledRouteExecutionPreflightPlanCreated === true, 'preflight plan missing')
assert(parsed.result.planResult.planningOnly === true, 'planning-only missing')
assert(parsed.result.planResult.serverStartedToday === false, 'server started')
assert(parsed.result.planResult.httpRouteRequestExecuted === false, 'HTTP executed')
assert(parsed.result.planResult.routeHandlerInvokedToday === false, 'handler invoked')
assert(parsed.result.planResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.planResult.routeExecutionEnabled === false, 'route widened')
assert(parsed.result.planResult.externalAgentExecutionReady === false, 'external agent ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.checklist.futureControlledProofPreconditions.routeExecutionFlagMustRemainFalse === true, 'route flag precondition missing')
assert(parsed.checklist.futureControlledProofPreconditions.serverStartRequiresLaterOwnerApproval === true, 'server approval missing')
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
assert(parsed.response.futureExpectedDisabledResponse.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'response error code mismatch')
assert(parsed.response.futureExpectedDisabledResponse.workerDispatchStarted === false, 'response dispatch widened')
assert(parsed.response.currentGateResponseCreated === false, 'response created today')

assertFalseMap(parsed.sideEffects.futureObservationPoints, 'sideEffects.futureObservationPoints')
assert(parsed.sideEffects.currentGateObservationPerformed === false, 'side effect observation performed today')

assert(parsed.stops.futureProofMustStopIf.includes('route_execution_flag_true'), 'route flag stop missing')
assert(parsed.stops.futureProofMustStopIf.includes('supabase_or_sql_write_required'), 'supabase stop missing')
assert(parsed.stops.futureProofMustStopIf.includes('external_agent_execution_ready_claim_requested_before_proof'), 'external-ready stop missing')
assert(parsed.stops.currentGateStoppedForUnsafeCondition === false, 'unsafe stop today')
assert(parsed.stops.currentGateUnsafeConditionDetected === false, 'unsafe condition today')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.executionPreflightPlanCreated === true, 'readiness preflight missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'readiness owner review missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')
assert(parsed.readiness.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE188-DISABLED-ROUTE-EXECUTION-PREFLIGHT-OWNER-REVIEW', 'readiness next prompt mismatch')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowExecutionPreflightPlanReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowPreflightStaticValidationNext === true, 'next prompt static validation missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase187-disabled-route-execution-preflight-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase187-disabled-route-execution-preflight-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2256,
      disabledRouteExecutionPreflightPlanCreated: true,
      planningOnly: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE188-DISABLED-ROUTE-EXECUTION-PREFLIGHT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
