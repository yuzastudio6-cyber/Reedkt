import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase200_controlled_disabled_route_preflight_execution_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_preflight_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase201_controlled_disabled_route_preflight_execution_completed_with_warnings_ready_for_execution_result_owner_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase202_controlled_disabled_route_preflight_execution_result_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_review'

const docs = {
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution-result.md',
  proof: 'docs/worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-proof-evidence-register.md',
  routePath: 'docs/worker-runtime-jobs-sound-cpu-phase201-route-path-reconciliation-register.md',
  observation: 'docs/worker-runtime-jobs-sound-cpu-phase201-no-side-effect-observation-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase201-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase201-runtime-claim-policy.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review.md',
  runner: 'scripts/validation/worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution-runner.ts',
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

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'acceptedForRuntimeExecutionToday',
    'acceptedForWorkerDispatchExecutionToday',
    'acceptedForBroadRouteExecutionToday',
    'workerDispatchExecutionEnabled',
    'routeExecutionBeyondFailClosedPreflightEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'externalAgentExecutionReady',
    'realUserMediaBetaAllowed',
    'paidProductionAllowed',
    'workerDispatchStarted',
    'supabaseMutationStarted',
    'sqlExecutionStarted',
    'mediaProcessingStarted',
    'artifactCreated',
    'allowAdditionalServerStart',
    'allowAdditionalHttpRequest',
    'allowWorkerDispatchExecution',
    'allowRouteExecutionBeyondFailClosedPreflight',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowProviderCall',
    'allowModelCall',
    'allowDockerOrCloudRunExecution',
    'allowExternalAgentExecutionReadyClaim',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = {
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase200-controlled-disabled-route-preflight-execution-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution-result',
  ),
  proof: parseJsonBlock(
    docs.proof,
    'worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-proof-evidence-register',
  ),
  routePath: parseJsonBlock(docs.routePath, 'worker-runtime-jobs-sound-cpu-phase201-route-path-reconciliation-register'),
  observation: parseJsonBlock(
    docs.observation,
    'worker-runtime-jobs-sound-cpu-phase201-no-side-effect-observation-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase201-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase201-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoForbiddenTrueClaims(file)

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.executionScope.allowControlledLocalServerStartForPreflight === true, 'prompt server preflight missing')
assert(parsed.prompt.executionScope.allowSingleSyntheticHttpRouteRequest === true, 'prompt single request missing')
assert(parsed.prompt.executionScope.allowFailClosedRouteHandlerObservation === true, 'prompt fail-closed observation missing')
assert(parsed.prompt.executionScope.allowWorkerDispatchExecution === false, 'prompt dispatch widened')
assert(parsed.prompt.executionScope.allowSupabaseMutation === false, 'prompt supabase widened')
assertNoop(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(
  parsed.sourceResult.ownerReviewResult.controlledDisabledRoutePreflightExecutionMayProceedNext === true,
  'source did not allow next proof',
)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2298, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'a99162f1324d3c118948a3816732e3fe6c9619bb', 'source merge mismatch')
assert(parsed.result.executionResult.localLoopbackOnly === true, 'result not local-only')
assert(parsed.result.executionResult.serverStarted === true, 'server start not recorded')
assert(parsed.result.executionResult.httpRouteRequestExecuted === true, 'HTTP request not recorded')
assert(parsed.result.executionResult.requestCount === 1, 'request count mismatch')
assert(parsed.result.executionResult.method === 'POST', 'method mismatch')
assert(parsed.result.executionResult.sourceRegisteredRoute === '/v1/sound-cpu/jobs', 'source route mismatch')
assert(parsed.result.executionResult.plannedPhase199Route === '/api/workers/sound-cpu/jobs', 'planned route warning mismatch')
assert(parsed.result.executionResult.routePathReconciledToSource === true, 'route path reconciliation missing')
assert(parsed.result.executionResult.status === 409, 'status mismatch')
assert(parsed.result.executionResult.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'error code mismatch')
assert(parsed.result.executionResult.accepted === false, 'route accepted unexpectedly')
assert(parsed.result.executionResult.failClosedRouteHandlerObserved === true, 'fail-closed handler not observed')
assert(parsed.result.executionResult.serverClosed === true, 'server close not recorded')
assert(parsed.result.executionResult.workerDispatchExecutionEnabled === false, 'worker dispatch widened')
assert(parsed.result.executionResult.supabaseMutationEnabled === false, 'supabase widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(
  parsed.proof.proofCommand ===
    'npm run worker-runtime-jobs:sound-cpu-phase201-controlled-disabled-route-preflight-execution:proof',
  'proof command mismatch',
)
assert(parsed.proof.runner === docs.runner, 'proof runner mismatch')
assert(parsed.proof.proofOutput.requestCount === 1, 'proof request count mismatch')
assert(parsed.proof.proofOutput.path === '/v1/sound-cpu/jobs', 'proof path mismatch')
assert(parsed.proof.proofOutput.status === 409, 'proof status mismatch')
assert(parsed.proof.proofOutput.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'proof error mismatch')
assert(parsed.proof.proofOutput.serverClosed === true, 'proof server close mismatch')
assert(
  parsed.proof.packageHashesBeforeProof.packageLockSha256 ===
    '1bb8eeaeb320c32aecf53939056ad5e63b6d99fc0272b7dad87c5e95f724b2af',
  'package lock hash mismatch',
)

assert(parsed.routePath.routePathReconciliation.phase199PlannedRoute === '/api/workers/sound-cpu/jobs', 'route path planned mismatch')
assert(parsed.routePath.routePathReconciliation.sourceRegisteredRoute === '/v1/sound-cpu/jobs', 'source registered route mismatch')
assert(parsed.routePath.routePathReconciliation.phase143PriorProofAlreadyUsedSourceRegisteredRoute === true, 'prior proof not represented')
assert(parsed.routePath.routePathReconciliation.phase201ProofUsedSourceRegisteredRoute === true, 'phase201 source route not represented')
assert(parsed.routePath.routePathReconciliation.broadRouteReadinessClaimed === false, 'broad route readiness claimed')

assert(parsed.observation.observation.localLoopbackOnly === true, 'observation local-only missing')
assert(parsed.observation.observation.ephemeralInMemoryIdempotencyOnly === true, 'ephemeral idempotency missing')
for (const [key, value] of Object.entries(parsed.observation.observation)) {
  if (['localLoopbackOnly', 'syntheticPayloadOnly', 'ephemeralInMemoryIdempotencyOnly', 'serverClosed'].includes(key)) {
    assert(value === true, `observation.${key} must be true`)
  } else {
    assert(value === false, `observation.${key} must be false`)
  }
}

assertTrueMap(parsed.blocked.completedInThisGate, 'blocked.completedInThisGate')
assertTrueMap(parsed.blocked.stillBlocked, 'blocked.stillBlocked')
assertFalseMap(parsed.blocked.stillBlockedClaims, 'blocked.stillBlockedClaims')

assert(parsed.claimPolicy.allowedClaims.controlledDisabledRoutePreflightExecuted === true, 'allowed preflight claim missing')
assert(parsed.claimPolicy.allowedClaims.singleSyntheticHttpRequestReturned409 === true, 'allowed request claim missing')
assert(parsed.claimPolicy.allowedClaims.executionResultOwnerReviewMayProceed === true, 'allowed owner review claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.acceptControlledDisabledRoutePreflightExecution === true, 'next prompt review missing')
assert(parsed.nextPrompt.reviewScope.acceptRoutePathWarning === true, 'next prompt route warning missing')
assert(parsed.nextPrompt.reviewScope.mayProceedToWorkerDispatchContractGapReview === true, 'next prompt next missing')
assert(parsed.nextPrompt.reviewScope.allowAdditionalServerStart === false, 'next prompt server widened')
assert(parsed.nextPrompt.reviewScope.allowAdditionalHttpRequest === false, 'next prompt request widened')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt worker widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const runner = read(docs.runner)
assert(runner.includes("host: '127.0.0.1'"), 'runner is not loopback-only')
assert(runner.includes('path: sourceRegisteredRoute'), 'runner does not use source registered route')
assert(runner.includes("const plannedPhase199Route = '/api/workers/sound-cpu/jobs'"), 'runner missing planned path warning')
assert(!runner.includes('child_process'), 'runner imports child_process')
assert(!runner.includes('docker build'), 'runner mentions Docker build')
assert(!runner.includes('createSupabase'), 'runner imports Supabase')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase201-controlled-disabled-route-preflight-execution:proof'] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution-runner.ts',
  'package proof script missing',
)
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase201-controlled-disabled-route-preflight-execution:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2298,
      controlledPreflightExecuted: true,
      requestCount: 1,
      status: 409,
      errorCode: 'ROUTE_EXECUTION_NOT_ENABLED',
      sourceRegisteredRoute: '/v1/sound-cpu/jobs',
      routePathWarningRecorded: true,
      workerDispatchExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE202-CONTROLLED-DISABLED-ROUTE-PREFLIGHT-EXECUTION-RESULT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
