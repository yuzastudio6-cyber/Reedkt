import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase191_disabled_route_synthetic_preflight_plan_completed_with_warnings_ready_for_synthetic_preflight_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase192_disabled_route_synthetic_preflight_owner_review_passed_with_warnings_ready_for_synthetic_preflight_static_validation'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase193_disabled_route_synthetic_preflight_static_validation_passed_with_warnings_ready_for_synthetic_preflight_static_validation_result_owner_review'

const docs = {
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan-result.md',
  sourcePayload: 'docs/worker-runtime-jobs-sound-cpu-phase191-synthetic-payload-plan.md',
  sourceAuth: 'docs/worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan.md',
  sourceResponse: 'docs/worker-runtime-jobs-sound-cpu-phase191-expected-disabled-response-plan.md',
  sourceSideEffects: 'docs/worker-runtime-jobs-sound-cpu-phase191-no-side-effect-observation-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase192-synthetic-preflight-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase192-static-validation-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase192-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase192-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase193-disabled-route-synthetic-preflight-static-validation.md',
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
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review'),
  sourceResult: parseJsonBlock(docs.sourceResult, 'worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan-result'),
  sourcePayload: parseJsonBlock(docs.sourcePayload, 'worker-runtime-jobs-sound-cpu-phase191-synthetic-payload-plan'),
  sourceAuth: parseJsonBlock(docs.sourceAuth, 'worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan'),
  sourceResponse: parseJsonBlock(docs.sourceResponse, 'worker-runtime-jobs-sound-cpu-phase191-expected-disabled-response-plan'),
  sourceSideEffects: parseJsonBlock(docs.sourceSideEffects, 'worker-runtime-jobs-sound-cpu-phase191-no-side-effect-observation-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase192-synthetic-preflight-acceptance-register'),
  readiness: parseJsonBlock(docs.readiness, 'worker-runtime-jobs-sound-cpu-phase192-static-validation-readiness-register'),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase192-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase192-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase193-disabled-route-synthetic-preflight-static-validation'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowSyntheticPreflightPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowSyntheticPreflightStaticValidationNext === true, 'source prompt static validation missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2268, 'source result PR mismatch')
assert(parsed.sourceResult.planResult.disabledRouteSyntheticPreflightPlanCreated === true, 'source plan missing')
assert(parsed.sourceResult.planResult.planningOnly === true, 'source planning-only missing')
assert(parsed.sourceResult.planResult.serverStarted === false, 'source server started')
assert(parsed.sourceResult.planResult.httpRouteRequestExecuted === false, 'source HTTP executed')
assert(parsed.sourceResult.planResult.routeHandlerInvoked === false, 'source handler invoked')
assert(parsed.sourceResult.planResult.expressRouterInstantiated === false, 'source router instantiated')
assert(parsed.sourceResult.planResult.externalAgentExecutionReady === false, 'source external ready claimed')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourcePayload.futureSyntheticPayload.staticOnlyRuntimeFlags.routeExecutionEnabled === false, 'source payload route widened')
assert(parsed.sourcePayload.futureSyntheticPayload.staticOnlyRuntimeFlags.workerDispatchExecutionEnabled === false, 'source payload dispatch widened')
assert(parsed.sourcePayload.currentGatePayloadSent === false, 'source payload sent')
assert(parsed.sourceAuth.futureSyntheticRequestContext.secretPayloadAllowed === false, 'source auth secret allowed')
assert(parsed.sourceAuth.currentGateAuthMiddlewareInvoked === false, 'source auth invoked')
assert(parsed.sourceResponse.futureExpectedDisabledResponse.httpStatus === 409, 'source response status mismatch')
assert(parsed.sourceResponse.currentGateResponseObserved === false, 'source response observed')
assertFalseMap(parsed.sourceSideEffects.futureObservationPoints, 'sourceSideEffects.futureObservationPoints')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2271, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'b51b3c6e74be6861ea4e69c8c84c988f165cb295', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.disabledRouteSyntheticPreflightPlanAccepted === true, 'result plan not accepted')
assert(parsed.result.ownerReviewResult.sourceOnlySyntheticPreflightStaticValidationMayProceed === true, 'result static validation missing')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2271, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.disabledRouteSyntheticPreflightPlanCreated === true, 'acceptance plan missing')
assert(parsed.acceptance.acceptedSourceEvidence.planningOnly === true, 'acceptance planning-only missing')
assert(parsed.acceptance.acceptedSourceEvidence.serverStarted === false, 'acceptance server started')
assert(parsed.acceptance.acceptedForNextStaticValidation.readSyntheticPayloadPlanOnly === true, 'acceptance payload read missing')
assert(parsed.acceptance.acceptedForNextStaticValidation.startServer === false, 'acceptance server widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.sendHttpRequest === false, 'acceptance HTTP widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.invokeRouteHandler === false, 'acceptance handler widened')
assert(parsed.acceptance.acceptedForNextStaticValidation.dispatchWorker === false, 'acceptance dispatch widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceOnlySyntheticPreflightStaticValidationMayProceed === true, 'readiness static validation missing')
assert(parsed.readiness.staticValidationOnlyRequired === true, 'readiness static-only missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.disabledRouteSyntheticPreflightPlanAccepted === true, 'claim plan missing')
assert(parsed.claimPolicy.allowedClaims.sourceOnlySyntheticPreflightStaticValidationMayProceed === true, 'claim static validation missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.validationScope.allowReadSyntheticPayloadPlan === true, 'next prompt payload read missing')
assert(parsed.nextPrompt.validationScope.allowStaticAssertionsOnly === true, 'next prompt static-only missing')
assert(parsed.nextPrompt.validationScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.validationScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.validationScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.validationScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase192-disabled-route-synthetic-preflight-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2271,
      disabledRouteSyntheticPreflightPlanAccepted: true,
      sourceOnlySyntheticPreflightStaticValidationMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE193-DISABLED-ROUTE-SYNTHETIC-PREFLIGHT-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
