import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase199_controlled_disabled_route_preflight_execution_plan_completed_with_warnings_ready_for_controlled_preflight_execution_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase200_controlled_disabled_route_preflight_execution_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase201_controlled_disabled_route_preflight_execution_completed_with_warnings_ready_for_execution_result_owner_review'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan-result.md',
  sourceServer: 'docs/worker-runtime-jobs-sound-cpu-phase199-server-start-preconditions-plan.md',
  sourceRequest: 'docs/worker-runtime-jobs-sound-cpu-phase199-synthetic-http-request-plan.md',
  sourceResponse: 'docs/worker-runtime-jobs-sound-cpu-phase199-expected-fail-closed-response-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase200-execution-plan-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase200-controlled-preflight-execution-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase200-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase200-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution.md',
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
    'httpRouteRequestExecutedToday',
    'routeHandlerInvokedToday',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'externalAgentExecutionReady',
    'allowWorkerDispatchExecution',
    'allowRouteExecutionBeyondFailClosedPreflight',
    'allowClaimLeaseMutation',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowProviderCall',
    'allowModelCall',
    'allowDockerOrCloudRunExecution',
    'allowExternalAgentExecutionReadyClaim',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan-result',
  ),
  sourceServer: parseJsonBlock(docs.sourceServer, 'worker-runtime-jobs-sound-cpu-phase199-server-start-preconditions-plan'),
  sourceRequest: parseJsonBlock(docs.sourceRequest, 'worker-runtime-jobs-sound-cpu-phase199-synthetic-http-request-plan'),
  sourceResponse: parseJsonBlock(docs.sourceResponse, 'worker-runtime-jobs-sound-cpu-phase199-expected-fail-closed-response-plan'),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review',
  ),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase200-execution-plan-acceptance-register'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase200-controlled-preflight-execution-readiness-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase200-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase200-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowControlledDisabledRoutePreflightExecutionPlanReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowControlledDisabledRoutePreflightExecutionNext === true, 'source prompt next execution missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2290, 'source result PR mismatch')
assert(parsed.sourceResult.planResult.controlledDisabledRoutePreflightExecutionPlanCreated === true, 'source plan missing')
assert(parsed.sourceResult.planResult.planningOnly === true, 'source planning-only missing')
assert(parsed.sourceResult.planResult.singleSyntheticHttpRequestPlanned === true, 'source request plan missing')
assert(parsed.sourceResult.planResult.expectedFailClosedResponsePlanned === true, 'source response plan missing')
assert(parsed.sourceResult.planResult.noSideEffectObservationPlanned === true, 'source observation plan missing')
assert(parsed.sourceResult.planResult.serverStartedToday === false, 'source server started')
assert(parsed.sourceResult.planResult.httpRouteRequestExecuted === false, 'source HTTP executed')
assert(parsed.sourceResult.planResult.routeHandlerInvokedToday === false, 'source handler invoked')
assert(parsed.sourceResult.planResult.externalAgentExecutionReady === false, 'source external ready claimed')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceServer.futurePreflightServerPlan.serverStartRequiresPhase200OwnerApproval === true, 'source server owner approval missing')
assert(parsed.sourceServer.futurePreflightServerPlan.requireRouteExecutionFlagFalse === true, 'source route false missing')
assert(parsed.sourceServer.futurePreflightServerPlan.requireNoSupabaseEnvironment === true, 'source no supabase missing')
assertFalseMap(parsed.sourceServer.currentGateExecution, 'sourceServer.currentGateExecution')

assert(parsed.sourceRequest.futureSyntheticRequest.method === 'POST', 'source request method mismatch')
assert(parsed.sourceRequest.futureSyntheticRequest.targetRoute === '/api/workers/sound-cpu/jobs', 'source request route mismatch')
assert(parsed.sourceRequest.futureSyntheticRequest.rawPromptAllowed === false, 'source request raw prompt allowed')
assert(parsed.sourceRequest.futureSyntheticRequest.secretPayloadAllowed === false, 'source request secret allowed')
assert(parsed.sourceRequest.currentGateRequestSent === false, 'source request sent')

assert(parsed.sourceResponse.futureExpectedResponse.httpStatus === 409, 'source response status mismatch')
assert(parsed.sourceResponse.futureExpectedResponse.ok === false, 'source response ok widened')
assert(parsed.sourceResponse.futureExpectedResponse.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'source response error mismatch')
assert(parsed.sourceResponse.futureExpectedResponse.workerDispatchStarted === false, 'source response dispatch widened')
assert(parsed.sourceResponse.futureExpectedResponse.supabaseMutationStarted === false, 'source response supabase widened')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2292, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'b223079bf9be46fc2c76ba8241747bda59ff0ffe', 'result source merge mismatch')
assert(parsed.result.ownerReviewResult.controlledDisabledRoutePreflightExecutionPlanAccepted === true, 'result plan not accepted')
assert(parsed.result.ownerReviewResult.singleSyntheticHttpRequestPlanAccepted === true, 'result request not accepted')
assert(parsed.result.ownerReviewResult.expectedFailClosedResponsePlanAccepted === true, 'result response not accepted')
assert(parsed.result.ownerReviewResult.noSideEffectObservationPlanAccepted === true, 'result observation not accepted')
assert(parsed.result.ownerReviewResult.controlledDisabledRoutePreflightExecutionMayProceedNext === true, 'result next execution missing')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.serverStartedToday === false, 'result server started')
assert(parsed.result.ownerReviewResult.httpRouteRequestExecutedToday === false, 'result HTTP executed')
assert(parsed.result.ownerReviewResult.routeHandlerInvokedToday === false, 'result handler invoked')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2292, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.controlledDisabledRoutePreflightExecutionPlanCreated === true, 'acceptance plan missing')
assert(parsed.acceptance.acceptedSourceEvidence.planningOnly === true, 'acceptance planning-only missing')
assert(parsed.acceptance.acceptedForNextGate.controlledDisabledRoutePreflightExecutionMayProceed === true, 'acceptance next execution missing')
assert(parsed.acceptance.acceptedForNextGate.singleLocalServerPreflightOnly === true, 'acceptance single server missing')
assert(parsed.acceptance.acceptedForNextGate.singleSyntheticHttpRequestOnly === true, 'acceptance single request missing')
assert(parsed.acceptance.acceptedForNextGate.expectedFailClosedResponseRequired === true, 'acceptance response required missing')
assert(parsed.acceptance.acceptedForNextGate.noSideEffectObservationRequired === true, 'acceptance observation required missing')
assertFalseMap(parsed.acceptance.currentGateExecution, 'acceptance.currentGateExecution')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.controlledDisabledRoutePreflightExecutionMayProceedNext === true, 'readiness next execution missing')
assert(parsed.readiness.phase201RequiredPreconditions.cleanWorktree === true, 'readiness clean worktree missing')
assert(parsed.readiness.phase201RequiredPreconditions.supabaseEnvironmentAbsent === true, 'readiness no supabase missing')
assert(parsed.readiness.phase201RequiredPreconditions.abortOnUnexpectedSideEffect === true, 'readiness abort missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')
assert(parsed.readiness.externalAgentExecutionReady === false, 'readiness external ready claimed')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightExecutionPlanAccepted === true, 'claim plan accepted missing')
assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightExecutionMayProceedNext === true, 'claim next missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.executionScope.allowControlledLocalServerStartForPreflight === true, 'next prompt local server preflight missing')
assert(parsed.nextPrompt.executionScope.allowSingleSyntheticHttpRouteRequest === true, 'next prompt single request missing')
assert(parsed.nextPrompt.executionScope.allowFailClosedRouteHandlerObservation === true, 'next prompt fail-closed observation missing')
assert(parsed.nextPrompt.executionScope.allowWorkerDispatchExecution === false, 'next prompt dispatch widened')
assert(parsed.nextPrompt.executionScope.allowRouteExecutionBeyondFailClosedPreflight === false, 'next prompt route widened')
assert(parsed.nextPrompt.executionScope.allowSupabaseMutation === false, 'next prompt supabase widened')
assert(parsed.nextPrompt.executionScope.allowSqlExecution === false, 'next prompt SQL widened')
assert(parsed.nextPrompt.executionScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.[
    'worker-runtime-jobs:sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2292,
      controlledDisabledRoutePreflightExecutionPlanAccepted: true,
      controlledDisabledRoutePreflightExecutionMayProceedNext: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      serverStartedToday: false,
      httpRouteRequestExecutedToday: false,
      routeHandlerInvokedToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE201-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-EXECUTION',
    },
    null,
    2,
  ),
)
