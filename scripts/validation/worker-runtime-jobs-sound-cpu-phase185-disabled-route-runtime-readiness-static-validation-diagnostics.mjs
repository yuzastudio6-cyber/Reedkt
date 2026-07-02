import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase184_disabled_route_runtime_readiness_owner_review_passed_with_warnings_ready_for_disabled_route_runtime_readiness_static_validation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase185_disabled_route_runtime_readiness_static_validation_passed_with_warnings_ready_for_runtime_readiness_static_validation_result_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase186_disabled_route_runtime_readiness_static_validation_result_owner_review_passed_with_warnings_ready_for_disabled_route_execution_preflight_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation-result.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-phase185-runtime-readiness-static-proof-output.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-phase185-static-validation-source-register.md',
  closedGates: 'docs/worker-runtime-jobs-sound-cpu-phase185-closed-runtime-gate-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase185-static-validation-result-owner-review-readiness-register.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review.md',
  runner:
    'scripts/validation/worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation-runner.mjs',
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
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'routeReadinessClaimed',
    'toolExecutionReadinessClaimed',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase184-disabled-route-runtime-readiness-owner-review-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation-result'),
  proof: parseJsonBlock(docs.proof, 'worker-runtime-jobs-sound-cpu-phase185-runtime-readiness-static-proof-output'),
  sourceRegister: parseJsonBlock(docs.sourceRegister, 'worker-runtime-jobs-sound-cpu-phase185-static-validation-source-register'),
  closedGates: parseJsonBlock(docs.closedGates, 'worker-runtime-jobs-sound-cpu-phase185-closed-runtime-gate-register'),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase185-static-validation-result-owner-review-readiness-register',
  ),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase186-disabled-route-runtime-readiness-static-validation-result-owner-review',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoUnsafeTrueClaims(file)

const runnerSource = read(docs.runner)
assert(runnerSource.includes("import fs from 'node:fs'"), 'runner must read source files')
assert(!runnerSource.includes("from '../../server/"), 'runner must not import server modules')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2249, 'source PR mismatch')
assert(parsed.source.ownerReviewResult.runtimeReadinessStaticValidationMayProceed === true, 'source validation missing')
assert(parsed.source.ownerReviewResult.acceptedForRuntimeExecutionToday === false, 'source runtime accepted')
assert(parsed.source.ownerReviewResult.acceptedForWorkerDispatchExecutionToday === false, 'source dispatch accepted')
assert(parsed.source.ownerReviewResult.acceptedForRouteExecutionToday === false, 'source route accepted')
assertNoop(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.validationScope.allowVerifyDisabledRuntimeFlags === true, 'source prompt flags missing')
assert(parsed.sourcePrompt.validationScope.allowServerStart === false, 'source prompt server widened')
assert(parsed.sourcePrompt.validationScope.allowRouteHandlerInvocation === false, 'source prompt handler widened')
assert(parsed.sourcePrompt.validationScope.allowRouteExecution === false, 'source prompt route widened')
assertNoop(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2253, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'a9bfdb9024c10e9916e023c47332d9795bb7d278', 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.validationResult.sourceOnlyRuntimeReadinessStaticValidationPassed === true, 'validation failed')
assert(parsed.result.validationResult.routeExecutionFlagFalse === true, 'route flag failed')
assert(parsed.result.validationResult.routeDisabledResponseNoExecution === true, 'route no-execution failed')
assert(parsed.result.validationResult.routeSchemaAllFlagsLiteralFalse === true, 'schema literal false failed')
assert(parsed.result.validationResult.dispatchRuntimeFlagsDisabled === true, 'dispatch flags failed')
assert(parsed.result.validationResult.runtimeGateStateFailClosed === true, 'runtime gate failed')
assert(parsed.result.validationResult.serverStarted === false, 'server started')
assert(parsed.result.validationResult.routeHandlerInvoked === false, 'handler invoked')
assert(parsed.result.validationResult.workerDispatchExecutionEnabled === false, 'dispatch widened')
assert(parsed.result.validationResult.routeExecutionEnabled === false, 'route widened')
assert(parsed.result.validationResult.runtimeReadinessClaimed === false, 'runtime readiness claimed')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.proof.decision === decision, 'proof decision mismatch')
assert(parsed.proof.sourceOnlyRuntimeReadinessStaticValidationPassed === true, 'proof validation failed')
assert(parsed.proof.routeExecutionFlagFalse === true, 'proof route flag failed')
assert(parsed.proof.routeSchemaAllFlagsLiteralFalse === true, 'proof schema failed')
assert(parsed.proof.dispatchRuntimeFlagsDisabled === true, 'proof dispatch flags failed')
assert(parsed.proof.runtimeGateStateFailClosed === true, 'proof runtime gate failed')
assert(parsed.proof.serverStarted === false, 'proof server started')
assert(parsed.proof.httpRouteRequestExecuted === false, 'proof HTTP executed')
assert(parsed.proof.routeHandlerInvoked === false, 'proof handler invoked')
assert(parsed.proof.workerDispatchExecutionEnabled === false, 'proof dispatch widened')
assert(parsed.proof.routeExecutionEnabled === false, 'proof route widened')

assert(parsed.sourceRegister.validatedSourceFiles.length === 5, 'source register file count mismatch')
assert(parsed.sourceRegister.validationMode === 'source text read only', 'source register mode mismatch')
assert(parsed.sourceRegister.serverStarted === false, 'source register server started')
assert(parsed.sourceRegister.routeHandlerInvoked === false, 'source register handler invoked')

assertFalseMap(parsed.closedGates.closedGates, 'closedGates.closedGates')
assertFalseMap(parsed.closedGates.readinessClaims, 'closedGates.readinessClaims')

assert(parsed.readiness.nextExpectedDecision === nextDecision, 'readiness next decision mismatch')
assert(parsed.readiness.sourceOnlyRuntimeReadinessStaticValidationPassed === true, 'readiness validation missing')
assert(parsed.readiness.ownerReviewMayProceed === true, 'readiness owner review missing')
assert(parsed.readiness.acceptedForRuntimeExecutionToday === false, 'readiness runtime accepted')
assert(parsed.readiness.acceptedForWorkerDispatchExecutionToday === false, 'readiness dispatch accepted')
assert(parsed.readiness.acceptedForRouteExecutionToday === false, 'readiness route accepted')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.allowStaticValidationResultReview === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.allowExecutionPreflightPlanningNext === true, 'next prompt preflight missing')
assert(parsed.nextPrompt.reviewScope.allowServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowRouteHandlerInvocation === false, 'next prompt handler widened')
assert(parsed.nextPrompt.reviewScope.allowRouteExecution === false, 'next prompt route widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase185-disabled-route-runtime-readiness-static-validation:proof'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation-runner.mjs',
  'package proof script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase185-disabled-route-runtime-readiness-static-validation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase185-disabled-route-runtime-readiness-static-validation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2253,
      sourceOnlyRuntimeReadinessStaticValidationPassed: true,
      routeExecutionFlagFalse: true,
      routeSchemaAllFlagsLiteralFalse: true,
      dispatchRuntimeFlagsDisabled: true,
      runtimeGateStateFailClosed: true,
      workerDispatchExecutionEnabled: false,
      routeExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE186-DISABLED-ROUTE-RUNTIME-READINESS-STATIC-VALIDATION-RESULT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
