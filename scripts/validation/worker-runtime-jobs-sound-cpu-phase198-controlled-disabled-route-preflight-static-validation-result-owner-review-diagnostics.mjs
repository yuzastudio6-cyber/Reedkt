import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase197_controlled_disabled_route_preflight_static_validation_passed_with_warnings_ready_for_controlled_disabled_route_preflight_static_validation_result_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase198_controlled_disabled_route_preflight_static_validation_result_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_execution_plan'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase199_controlled_disabled_route_preflight_execution_plan_completed_with_warnings_ready_for_controlled_preflight_execution_owner_review'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase197-controlled-disabled-route-preflight-static-validation-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase197-static-proof-output.md',
  sourceReadiness: 'docs/worker-runtime-jobs-sound-cpu-phase197-static-validation-result-owner-review-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase198-static-validation-result-acceptance-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-phase198-controlled-preflight-execution-plan-readiness-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase198-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase198-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan.md',
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
    'httpRouteRequestExecuted',
    'routeHandlerInvoked',
    'expressRouterInstantiated',
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
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase197-controlled-disabled-route-preflight-static-validation-result',
  ),
  sourceProof: parseJsonBlock(docs.sourceProof, 'worker-runtime-jobs-sound-cpu-phase197-static-proof-output'),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase197-static-validation-result-owner-review-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase198-static-validation-result-acceptance-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase198-controlled-preflight-execution-plan-readiness-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase198-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase198-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase199-controlled-disabled-route-preflight-execution-plan'),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.allowStaticValidationResultReview === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowControlledDisabledRoutePreflightExecutionPlanNext === true, 'source prompt next plan missing')
assert(parsed.sourcePrompt.reviewScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.reviewScope.allowHttpRouteRequestExecution === false, 'source prompt HTTP widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2284, 'source result PR mismatch')
assert(parsed.sourceResult.validationResult.sourceOnlyControlledPreflightStaticValidationPassed === true, 'source result pass missing')
assert(parsed.sourceResult.validationResult.staticAssertionsOnly === true, 'source result static-only missing')
assert(parsed.sourceResult.validationResult.serverStarted === false, 'source result server started')
assert(parsed.sourceResult.validationResult.httpRouteRequestExecuted === false, 'source result HTTP executed')
assert(parsed.sourceResult.validationResult.routeHandlerInvoked === false, 'source result handler invoked')
assert(parsed.sourceResult.validationResult.workerDispatchExecutionEnabled === false, 'source result dispatch widened')
assert(parsed.sourceResult.validationResult.routeExecutionEnabled === false, 'source result route widened')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(parsed.sourceProof.sourceOnlyControlledPreflightStaticValidationPassed === true, 'source proof pass missing')
assert(parsed.sourceProof.failedChecks.length === 0, 'source proof failed checks')
assert(parsed.sourceProof.staticAssertionsOnly === true, 'source proof static-only missing')
assert(parsed.sourceProof.serverStarted === false, 'source proof server started')
assert(parsed.sourceProof.httpRouteRequestExecuted === false, 'source proof HTTP executed')
assert(parsed.sourceProof.workerDispatchExecutionEnabled === false, 'source proof dispatch widened')
assert(parsed.sourceProof.routeExecutionEnabled === false, 'source proof route widened')
assert(parsed.sourceProof.supabaseMutationEnabled === false, 'source proof supabase widened')

assert(parsed.sourceReadiness.nextExpectedDecision === decision, 'source readiness expected decision mismatch')
assert(parsed.sourceReadiness.sourceOnlyControlledPreflightStaticValidationPassed === true, 'source readiness pass missing')
assert(parsed.sourceReadiness.ownerReviewMayProceed === true, 'source readiness owner review missing')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2287, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '7de12ac08b4c85346e6b677db6fb6062e28e8488', 'result source merge mismatch')
assert(parsed.result.ownerReviewResult.controlledPreflightStaticValidationResultAccepted === true, 'result source not accepted')
assert(parsed.result.ownerReviewResult.sourceOnlyControlledPreflightStaticValidationPassed === true, 'result pass missing')
assert(parsed.result.ownerReviewResult.failedChecksAccepted.length === 0, 'result failed checks')
assert(parsed.result.ownerReviewResult.controlledDisabledRoutePreflightExecutionPlanMayProceed === true, 'result next plan missing')
assert(parsed.result.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'result runtime accepted')
assert(parsed.result.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'result dispatch accepted')
assert(parsed.result.ownerReviewResult.acceptedForRouteExecutionToday === false, 'result route accepted')
assert(parsed.result.ownerReviewResult.externalAgentExecutionReady === false, 'result external ready claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedSourceEvidence.sourcePr === 2287, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedSourceEvidence.sourceOnlyControlledPreflightStaticValidationPassed === true, 'acceptance pass missing')
assert(parsed.acceptance.acceptedSourceEvidence.staticAssertionsOnly === true, 'acceptance static-only missing')
assert(parsed.acceptance.acceptedSourceEvidence.failedChecks.length === 0, 'acceptance failed checks')
assert(parsed.acceptance.acceptedSourceEvidence.serverStarted === false, 'acceptance server started')
assert(parsed.acceptance.acceptedSourceEvidence.httpRouteRequestExecuted === false, 'acceptance HTTP executed')
assert(parsed.acceptance.acceptedSourceEvidence.workerDispatchExecutionEnabled === false, 'acceptance dispatch widened')
assert(parsed.acceptance.acceptedSourceEvidence.routeExecutionEnabled === false, 'acceptance route widened')
assert(parsed.acceptance.acceptedForNextExecutionPlan.planControlledDisabledRoutePreflightExecutionOnly === true, 'acceptance next plan missing')
assert(parsed.acceptance.acceptedForNextExecutionPlan.executePlanToday === false, 'acceptance execution widened')
assert(parsed.acceptance.acceptedForNextExecutionPlan.startServerToday === false, 'acceptance server widened')
assert(parsed.acceptance.acceptedForNextExecutionPlan.sendHttpRequestToday === false, 'acceptance HTTP widened')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.controlledDisabledRoutePreflightExecutionPlanMayProceed === true, 'readiness next plan missing')
assert(parsed.readiness.planningOnlyRequired === true, 'readiness planning-only missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assertFalseMap(parsed.blocked.blockedToday, 'blocked.blockedToday')
assertFalseMap(parsed.blocked.blockedClaims, 'blocked.blockedClaims')
assert(parsed.claimPolicy.allowedClaims.controlledPreflightStaticValidationResultAccepted === true, 'claim source accepted missing')
assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightExecutionPlanMayProceed === true, 'claim next plan missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.planningScope.allowControlledDisabledRoutePreflightExecutionPlanning === true, 'next prompt execution planning missing')
assert(parsed.nextPrompt.planningScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.planningScope.allowHttpRouteRequestExecution === false, 'next prompt HTTP widened')
assert(parsed.nextPrompt.planningScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.[
    'worker-runtime-jobs:sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase198-controlled-disabled-route-preflight-static-validation-result-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2287,
      controlledPreflightStaticValidationResultAccepted: true,
      sourceOnlyControlledPreflightStaticValidationPassed: true,
      controlledDisabledRoutePreflightExecutionPlanMayProceed: true,
      acceptedForRuntimeExecutionToday: false,
      acceptedForWorkerDispatchExecutionToday: false,
      acceptedForRouteExecutionToday: false,
      externalAgentExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE199-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-EXECUTION-PLAN',
    },
    null,
    2,
  ),
)
