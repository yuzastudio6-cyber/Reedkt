import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase188_disabled_route_execution_preflight_owner_review_passed_with_warnings_ready_for_preflight_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase189_disabled_route_execution_preflight_static_validation_passed_with_warnings_ready_for_preflight_static_validation_result_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase190_disabled_route_execution_preflight_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_synthetic_preflight_plan'

const docs = {
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation-result.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-phase189-static-proof-output.md',
  readback: 'docs/worker-runtime-jobs-sound-cpu-phase189-source-readback-register.md',
  flags: 'docs/worker-runtime-jobs-sound-cpu-phase189-disabled-flag-assertion-register.md',
  noExecution: 'docs/worker-runtime-jobs-sound-cpu-phase189-no-execution-observation-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-phase189-blocker-follow-up-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase189-runtime-claim-policy.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase189-static-validation-result-owner-review-readiness-register.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review.md',
  runner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation-runner.mjs',
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

function assertTrueMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === true, `${label}.${key} must be true`)
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
    'worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation',
  ),
  sourceReview: parseJsonBlock(
    docs.sourceReview,
    'worker-runtime-jobs-sound-cpu-phase188-disabled-route-execution-preflight-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation-result',
  ),
  proof: parseJsonBlock(docs.proof, 'worker-runtime-jobs-sound-cpu-phase189-static-proof-output'),
  readback: parseJsonBlock(docs.readback, 'worker-runtime-jobs-sound-cpu-phase189-source-readback-register'),
  flags: parseJsonBlock(docs.flags, 'worker-runtime-jobs-sound-cpu-phase189-disabled-flag-assertion-register'),
  noExecution: parseJsonBlock(docs.noExecution, 'worker-runtime-jobs-sound-cpu-phase189-no-execution-observation-register'),
  blockers: parseJsonBlock(docs.blockers, 'worker-runtime-jobs-sound-cpu-phase189-blocker-follow-up-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase189-runtime-claim-policy'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase189-static-validation-result-owner-review-readiness-register',
  ),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase190-disabled-route-execution-preflight-static-validation-result-owner-review',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(read(docs.runner).includes('fs.readFileSync'), 'runner must read source files')
assert(!read(docs.runner).includes('import('), 'runner must not dynamically import route code')
assert(!read(docs.runner).includes('child_process'), 'runner must not shell out')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowStaticAssertionsOnly === true, 'source prompt static-only missing')
assert(parsed.sourcePrompt.validationScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.validationScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.validationScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceReview.decision === sourceDecision, 'source review decision mismatch')
assert(parsed.sourceReview.sourceVerification.sourcePr === 2259, 'source review PR mismatch')
assert(parsed.sourceReview.ownerReviewResult.sourceOnlyPreflightStaticValidationMayProceed === true, 'source review static validation missing')
assert(parsed.sourceReview.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'source review runtime accepted')
assert(parsed.sourceReview.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'source review dispatch accepted')
assert(parsed.sourceReview.ownerReviewResult.acceptedForRouteExecutionToday === false, 'source review route accepted')
assert(parsed.sourceReview.ownerReviewResult.externalAgentExecutionReady === false, 'source review external agent ready claimed')
assertNoop(parsed.sourceReview.supabaseClassification, 'sourceReview.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2263, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'a9a6247710725ff3c8f786b9dcadcfbc5766f709', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.validationResult.sourceOnlyPreflightStaticValidationPassed === true, 'result validation missing')
assert(parsed.result.validationResult.staticAssertionsOnly === true, 'result static-only missing')
assert(parsed.result.validationResult.serverStarted === false, 'result server started')
assert(parsed.result.validationResult.routeHandlerInvoked === false, 'result handler invoked')
assert(parsed.result.validationResult.expressRouterInstantiated === false, 'result router instantiated')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.validationResult.routeExecutionEnabled === false, 'result route widened')
assert(parsed.result.validationResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.proof.decision === decision, 'proof decision mismatch')
assert(parsed.proof.sourceOnlyPreflightStaticValidationPassed === true, 'proof validation missing')
assert(parsed.proof.failedChecks.length === 0, 'proof failed checks present')
assertTrueMap(parsed.proof.checks, 'proof.checks')
assert(parsed.proof.serverStarted === false, 'proof server started')
assert(parsed.proof.httpRouteRequestExecuted === false, 'proof HTTP executed')
assert(parsed.proof.routeHandlerInvoked === false, 'proof handler invoked')
assert(parsed.proof.expressRouterInstantiated === false, 'proof router instantiated')
assert(parsed.proof.workerDispatchExecutionEnabled === false, 'proof dispatch widened')
assert(parsed.proof.routeExecutionEnabled === false, 'proof route widened')
assert(parsed.proof.supabaseMutationEnabled === false, 'proof supabase widened')
assert(parsed.proof.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE190-DISABLED-ROUTE-EXECUTION-PREFLIGHT-STATIC-VALIDATION-RESULT-OWNER-REVIEW', 'proof next prompt mismatch')

assert(parsed.readback.sourceFilesChangedToday === false, 'readback changed source')
assert(parsed.readback.serverStarted === false, 'readback server started')
assert(parsed.readback.routeHandlerInvoked === false, 'readback handler invoked')
assert(parsed.readback.expressRouterInstantiated === false, 'readback router instantiated')

assertTrueMap(parsed.flags.assertionsPassed, 'flags.assertionsPassed')
assert(parsed.flags.enabledFlagsDetected === false, 'flags enabled detected')
assert(parsed.flags.externalAgentExecutionReady === false, 'flags external ready claimed')

assertFalseMap(parsed.noExecution.observedActions, 'noExecution.observedActions')
assert(parsed.noExecution.staticValidationOnly === true, 'noExecution static-only missing')

assert(parsed.blockers.failedChecks.length === 0, 'blockers failed checks present')
assert(parsed.blockers.blockedDecisionUsed === 'none', 'blockers blocked decision used')
assert(parsed.blockers.fixPrompt === 'not_required', 'blockers fix prompt mismatch')

assert(parsed.claimPolicy.allowedClaims.sourceOnlyPreflightStaticValidationPassed === true, 'claim validation missing')
assert(parsed.claimPolicy.allowedClaims.staticAssertionsOnly === true, 'claim static-only missing')
assert(parsed.claimPolicy.allowedClaims.acceptedForRuntimeExecutionToday === false, 'claim runtime accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForWorkerDispatchExecutionToday === false, 'claim dispatch accepted')
assert(parsed.claimPolicy.allowedClaims.acceptedForRouteExecutionToday === false, 'claim route accepted')
assert(parsed.claimPolicy.allowedClaims.externalAgentExecutionReady === false, 'claim external ready claimed')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceOnlyPreflightStaticValidationPassed === true, 'readiness validation missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'readiness owner review missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationResultReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowDisabledRouteSyntheticPreflightPlanNext === true, 'next prompt synthetic plan missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.reviewScope.allowExternalAgentExecutionReadyClaim === false, 'next prompt external ready widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase189-disabled-route-execution-preflight-static-validation:proof'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation-runner.mjs',
  'package proof script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase189-disabled-route-execution-preflight-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2263,
      sourceOnlyPreflightStaticValidationPassed: true,
      staticAssertionsOnly: true,
      serverStarted: false,
      httpRouteRequestExecuted: false,
      routeHandlerInvoked: false,
      expressRouterInstantiated: false,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE190-DISABLED-ROUTE-EXECUTION-PREFLIGHT-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
