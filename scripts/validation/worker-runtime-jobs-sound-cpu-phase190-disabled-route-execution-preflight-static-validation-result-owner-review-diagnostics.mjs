import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase189_disabled_route_execution_preflight_static_validation_passed_with_warnings_ready_for_preflight_static_validation_result_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase190_disabled_route_execution_preflight_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_synthetic_preflight_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase191_disabled_route_synthetic_preflight_plan_completed_with_warnings_ready_for_synthetic_preflight_owner_review'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase189-static-proof-output.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase190-static-validation-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase190-synthetic-preflight-planning-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase190-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase190-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan.md',
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
    'worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation-result',
  ),
  sourceProof: parseJsonBlock(docs.sourceProof, 'worker-runtime-jobs-sound-cpu-phase189-static-proof-output'),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review',
  ),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase190-static-validation-acceptance-register'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase190-synthetic-preflight-planning-readiness-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase190-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase190-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase191-disabled-route-synthetic-preflight-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationResultReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowDisabledRouteSyntheticPreflightPlanNext === true, 'source prompt synthetic plan missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.reviewScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2263, 'source result source PR mismatch')
assert(parsed.sourceResult.validationResult.sourceOnlyPreflightStaticValidationPassed === true, 'source validation missing')
assert(parsed.sourceResult.validationResult.serverStarted === false, 'source server started')
assert(parsed.sourceResult.validationResult.routeHandlerInvoked === false, 'source handler invoked')
assert(parsed.sourceResult.validationResult.expressRouterInstantiated === false, 'source router instantiated')
assert(parsed.sourceResult.validationResult.externalAgentExecutionReady === false, 'source external ready claimed')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(parsed.sourceProof.sourceOnlyPreflightStaticValidationPassed === true, 'source proof missing')
assert(parsed.sourceProof.failedChecks.length === 0, 'source proof failed checks')
assert(parsed.sourceProof.serverStarted === false, 'source proof server started')
assert(parsed.sourceProof.httpRouteRequestExecuted === false, 'source proof HTTP executed')
assert(parsed.sourceProof.routeHandlerInvoked === false, 'source proof handler invoked')
assert(parsed.sourceProof.expressRouterInstantiated === false, 'source proof router instantiated')
assert(parsed.sourceProof.workerDispatchExecutionEnabled === false, 'source proof dispatch widened')
assert(parsed.sourceProof.routeExecutionEnabled === false, 'source proof route widened')
assert(parsed.sourceProof.externalAgentExecutionReady === false, 'source proof external ready claimed')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2266, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '8a1d9eaa460bf173e8ec5266560481045d64c6f9', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReviewResult.sourceOnlyPreflightStaticValidationAccepted === true, 'result validation not accepted')
assert(parsed.result.ownerReviewResult.disabledRouteSyntheticPreflightPlanningMayProceed === true, 'result synthetic plan missing')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2266, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.sourceOnlyPreflightStaticValidationPassed === true, 'acceptance validation missing')
assert(parsed.acceptance.acceptedSourceEvidence.staticAssertionsOnly === true, 'acceptance static-only missing')
assert(parsed.acceptance.acceptedSourceEvidence.serverStarted === false, 'acceptance server started')
assert(parsed.acceptance.acceptedSourceEvidence.httpRouteRequestExecuted === false, 'acceptance HTTP executed')
assert(parsed.acceptance.acceptedSourceEvidence.routeHandlerInvoked === false, 'acceptance handler invoked')
assert(parsed.acceptance.acceptedSourceEvidence.expressRouterInstantiated === false, 'acceptance router instantiated')
assert(parsed.acceptance.acceptedSourceEvidence.externalAgentExecutionReady === false, 'acceptance external ready claimed')
assert(parsed.acceptance.acceptedForNextPlanning.disabledRouteSyntheticPreflightPlan === true, 'acceptance synthetic plan missing')
assert(parsed.acceptance.acceptedForNextPlanning.routeExecutionEnablement === false, 'acceptance route widened')
assert(parsed.acceptance.acceptedForNextPlanning.workerDispatchEnablement === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedForNextPlanning.serverStartToday === false, 'acceptance server widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.disabledRouteSyntheticPreflightPlanningMayProceed === true, 'readiness synthetic plan missing')
assert(parsed.readiness.planningOnlyRequired === true, 'readiness planning-only missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.sourceOnlyPreflightStaticValidationAccepted === true, 'claim validation missing')
assert(parsed.claimPolicy.allowedClaims.disabledRouteSyntheticPreflightPlanningMayProceed === true, 'claim synthetic plan missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowSyntheticPayloadPlanning === true, 'next prompt payload plan missing')
assert(parsed.nextPrompt.planningScope.allowExpectedDisabledResponsePlanning === true, 'next prompt response plan missing')
assert(parsed.nextPrompt.planningScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.planningScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.planningScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2266,
      sourceOnlyPreflightStaticValidationAccepted: true,
      disabledRouteSyntheticPreflightPlanningMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE191-DISABLED-ROUTE-SYNTHETIC-PREFLIGHT-PLAN',
    },
    null,
    2,
  ),
)
