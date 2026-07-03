import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase193_disabled_route_synthetic_preflight_static_validation_passed_with_warnings_ready_for_synthetic_preflight_static_validation_result_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase194_disabled_route_synthetic_preflight_static_validation_result_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase195_controlled_disabled_route_preflight_plan_completed_with_warnings_ready_for_controlled_disabled_route_preflight_owner_review'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase193-disabled-route-synthetic-preflight-static-validation-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase193-static-proof-output.md',
  sourcePayload: 'docs/worker-runtime-jobs-sound-cpu-phase193-payload-static-validation-register.md',
  sourceResponse: 'docs/worker-runtime-jobs-sound-cpu-phase193-disabled-response-static-validation-register.md',
  sourceNoExecution: 'docs/worker-runtime-jobs-sound-cpu-phase193-no-execution-observation-register.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-phase193-blocker-follow-up-register.md',
  sourceClaimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase193-runtime-claim-policy.md',
  sourceReadiness: 'docs/worker-runtime-jobs-sound-cpu-phase193-static-validation-result-owner-review-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase194-static-validation-result-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase194-controlled-disabled-route-preflight-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase194-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase194-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan.md',
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
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase193-disabled-route-synthetic-preflight-static-validation-result',
  ),
  sourceProof: parseJsonBlock(docs.sourceProof, 'worker-runtime-jobs-sound-cpu-phase193-static-proof-output'),
  sourcePayload: parseJsonBlock(
    docs.sourcePayload,
    'worker-runtime-jobs-sound-cpu-phase193-payload-static-validation-register',
  ),
  sourceResponse: parseJsonBlock(
    docs.sourceResponse,
    'worker-runtime-jobs-sound-cpu-phase193-disabled-response-static-validation-register',
  ),
  sourceNoExecution: parseJsonBlock(
    docs.sourceNoExecution,
    'worker-runtime-jobs-sound-cpu-phase193-no-execution-observation-register',
  ),
  sourceBlockers: parseJsonBlock(docs.sourceBlockers, 'worker-runtime-jobs-sound-cpu-phase193-blocker-follow-up-register'),
  sourceClaimPolicy: parseJsonBlock(docs.sourceClaimPolicy, 'worker-runtime-jobs-sound-cpu-phase193-runtime-claim-policy'),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase193-static-validation-result-owner-review-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase194-static-validation-result-acceptance-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase194-controlled-disabled-route-preflight-readiness-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase194-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase194-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase195-controlled-disabled-route-preflight-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationResultReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowControlledDisabledRoutePreflightPlanNext === true, 'source prompt next planning missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2273, 'source result source PR mismatch')
assert(parsed.sourceResult.validationResult.sourceOnlySyntheticPreflightStaticValidationPassed === true, 'source result pass missing')
assert(parsed.sourceResult.validationResult.staticAssertionsOnly === true, 'source result static-only missing')
assert(parsed.sourceResult.validationResult.serverStarted === false, 'source result server started')
assert(parsed.sourceResult.validationResult.httpRouteRequestExecuted === false, 'source result HTTP executed')
assert(parsed.sourceResult.validationResult.routeHandlerInvoked === false, 'source result handler invoked')
assert(parsed.sourceResult.validationResult.workerDispatchExecutionEnabled === false, 'source result dispatch widened')
assert(parsed.sourceResult.validationResult.routeExecutionEnabled === false, 'source result route widened')
assert(parsed.sourceResult.validationResult.externalAgentExecutionReady === false, 'source result external ready claimed')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(parsed.sourceProof.sourceOnlySyntheticPreflightStaticValidationPassed === true, 'source proof pass missing')
assert(parsed.sourceProof.failedChecks.length === 0, 'source proof failed checks')
assert(parsed.sourceProof.staticAssertionsOnly === true, 'source proof static-only missing')
assert(parsed.sourceProof.serverStarted === false, 'source proof server started')
assert(parsed.sourceProof.httpRouteRequestExecuted === false, 'source proof HTTP executed')
assert(parsed.sourceProof.routeHandlerInvoked === false, 'source proof handler invoked')
assert(parsed.sourceProof.expressRouterInstantiated === false, 'source proof router instantiated')
assert(parsed.sourceProof.workerDispatchExecutionEnabled === false, 'source proof dispatch widened')
assert(parsed.sourceProof.routeExecutionEnabled === false, 'source proof route widened')
assert(parsed.sourceProof.supabaseMutationEnabled === false, 'source proof supabase widened')
assert(parsed.sourceProof.externalAgentExecutionReady === false, 'source proof external ready claimed')

assert(parsed.sourcePayload.payloadShapeValid === true, 'source payload shape invalid')
assert(parsed.sourcePayload.runtimeFlagsAllFalse === true, 'source payload flags widened')
assert(parsed.sourcePayload.payloadSentToday === false, 'source payload sent')
assert(parsed.sourceResponse.expectedHttpStatus === 409, 'source response status mismatch')
assert(parsed.sourceResponse.expectedOk === false, 'source response ok widened')
assert(parsed.sourceResponse.responseObservedToday === false, 'source response observed')
assertFalseMap(parsed.sourceNoExecution.observedActions, 'sourceNoExecution.observedActions')
assert(parsed.sourceNoExecution.staticValidationOnly === true, 'source no-execution static-only missing')
assert(parsed.sourceBlockers.failedChecks.length === 0, 'source blockers failed checks')
assert(parsed.sourceBlockers.blockedDecisionUsed === 'none', 'source blocked decision used')
assert(parsed.sourceClaimPolicy.allowedClaims.sourceOnlySyntheticPreflightStaticValidationPassed === true, 'source claim pass missing')
assert(parsed.sourceClaimPolicy.allowedClaims.staticAssertionsOnly === true, 'source claim static-only missing')
assert(parsed.sourceClaimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'source claim runtime accepted')
assertFalseMap(parsed.sourceClaimPolicy.blockedClaims, 'sourceClaimPolicy.blockedClaims')
assert(parsed.sourceReadiness.nextExpectedDecision === decision, 'source readiness expected decision mismatch')
assert(parsed.sourceReadiness.ownerReviewMayProceed === true, 'source readiness owner review missing')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2276, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '97765ae9d6b9ae26ebecbedb921155ffb11f9b7b', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.syntheticPreflightStaticValidationResultAccepted === true, 'result source not accepted')
assert(parsed.result.ownerReviewResult.sourceOnlySyntheticPreflightStaticValidationPassed === true, 'result pass missing')
assert(parsed.result.ownerReviewResult.staticAssertionsOnlyAccepted === true, 'result static-only missing')
assert(parsed.result.ownerReviewResult.failedChecksAccepted.length === 0, 'result failed checks accepted')
assert(parsed.result.ownerReviewResult.controlledDisabledRoutePreflightPlanMayProceed === true, 'result next plan missing')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2276, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.sourceMergeCommit === '97765ae9d6b9ae26ebecbedb921155ffb11f9b7b', 'acceptance source merge mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.sourceOnlySyntheticPreflightStaticValidationPassed === true, 'acceptance pass missing')
assert(parsed.acceptance.acceptedSourceEvidence.staticAssertionsOnly === true, 'acceptance static-only missing')
assert(parsed.acceptance.acceptedSourceEvidence.failedChecks.length === 0, 'acceptance failed checks')
assert(parsed.acceptance.acceptedSourceEvidence.serverStarted === false, 'acceptance server started')
assert(parsed.acceptance.acceptedSourceEvidence.httpRouteRequestExecuted === false, 'acceptance HTTP executed')
assert(parsed.acceptance.acceptedSourceEvidence.routeHandlerInvoked === false, 'acceptance handler invoked')
assert(parsed.acceptance.acceptedSourceEvidence.workerDispatchExecutionEnabled === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedSourceEvidence.routeExecutionEnabled === false, 'acceptance route widened')
assert(parsed.acceptance.acceptedSourceEvidence.externalAgentExecutionReady === false, 'acceptance external ready claimed')
assert(
  parsed.acceptance.acceptedForNextControlledDisabledRoutePreflightPlan.planControlledDisabledRoutePreflightOnly === true,
  'acceptance next plan missing',
)
assert(parsed.acceptance.acceptedForNextControlledDisabledRoutePreflightPlan.startServer === false, 'acceptance server widened')
assert(parsed.acceptance.acceptedForNextControlledDisabledRoutePreflightPlan.sendHttpRequest === false, 'acceptance HTTP widened')
assert(parsed.acceptance.acceptedForNextControlledDisabledRoutePreflightPlan.invokeRouteHandler === false, 'acceptance handler widened')
assert(parsed.acceptance.acceptedForNextControlledDisabledRoutePreflightPlan.dispatchWorker === false, 'acceptance dispatch widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.controlledDisabledRoutePreflightPlanMayProceed === true, 'readiness next plan missing')
assert(parsed.readiness.planningOnlyRequired === true, 'readiness planning-only missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.syntheticPreflightStaticValidationResultAccepted === true, 'claim source accepted missing')
assert(parsed.claimPolicy.allowedClaims.sourceOnlySyntheticPreflightStaticValidationPassed === true, 'claim pass missing')
assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightPlanMayProceed === true, 'claim next plan missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowControlledDisabledRoutePreflightPlanning === true, 'next prompt planning missing')
assert(parsed.nextPrompt.planningScope.allowExpectedDisabledResponsePlanning === true, 'next prompt response planning missing')
assert(parsed.nextPrompt.planningScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.planningScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.planningScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.planningScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.[
    'worker-runtime-jobs:sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase194-disabled-route-synthetic-preflight-static-validation-result-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2276,
      syntheticPreflightStaticValidationResultAccepted: true,
      sourceOnlySyntheticPreflightStaticValidationPassed: true,
      controlledDisabledRoutePreflightPlanMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE195-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-PLAN',
    },
    null,
    2,
  ),
)
