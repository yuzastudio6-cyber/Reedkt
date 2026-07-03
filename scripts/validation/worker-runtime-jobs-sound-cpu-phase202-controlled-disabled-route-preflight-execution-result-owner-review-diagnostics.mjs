import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase201_controlled_disabled_route_preflight_execution_completed_with_warnings_ready_for_execution_result_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase202_controlled_disabled_route_preflight_execution_result_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase203_current_execution_readiness_blocker_selection_completed_with_warnings_ready_for_product_tool_call_execution_gap_closure'

const docs = {
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution-result.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-proof-evidence-register.md',
  sourceRoutePath: 'docs/worker-runtime-jobs-sound-cpu-phase201-route-path-reconciliation-register.md',
  phase144Result: 'docs/worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review-result.md',
  currentNextBlocker:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-next-blocker-after-internal-dry-run.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase202-preflight-execution-acceptance-register.md',
  routeWarning: 'docs/worker-runtime-jobs-sound-cpu-phase202-route-path-warning-acceptance-register.md',
  duplicateAvoidance: 'docs/worker-runtime-jobs-sound-cpu-phase202-duplicate-route-proof-avoidance-register.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-phase202-blocked-execution-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase202-runtime-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection.md',
  productGapPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run.md',
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
    'allowAdditionalServerStart',
    'allowAdditionalHttpRequest',
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowRouteExecutionBeyondFailClosedPreflight',
    'allowProductToolCallExecution',
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
    'allowExternalBetaUnlock',
    'allowProductionUnlock',
    'workerDispatchExecutionEnabled',
    'routeExecutionBeyondFailClosedPreflightEnabled',
    'routeExecutionEnabled',
    'productToolCallExecutionReady',
    'realUserMediaProcessingEnabled',
    'artifactDeliveryEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'gcpCloudRunExecutionEnabled',
    'externalBetaUnlocked',
    'paidProductionUnlocked',
    'productionReady',
    'runtimeReadinessClaimed',
    'workerReady',
    'routeReady',
    'toolExecutionReady',
    'runtimeReady',
    'realUserMediaBetaReady',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = {
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-execution-result',
  ),
  sourceProof: parseJsonBlock(
    docs.sourceProof,
    'worker-runtime-jobs-sound-cpu-phase201-controlled-disabled-route-preflight-proof-evidence-register',
  ),
  sourceRoutePath: parseJsonBlock(
    docs.sourceRoutePath,
    'worker-runtime-jobs-sound-cpu-phase201-route-path-reconciliation-register',
  ),
  phase144Result: parseJsonBlock(
    docs.phase144Result,
    'worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review-result',
  ),
  currentNextBlocker: parseJsonBlock(
    docs.currentNextBlocker,
    'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-next-blocker-after-internal-dry-run',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase202-preflight-execution-acceptance-register',
  ),
  routeWarning: parseJsonBlock(
    docs.routeWarning,
    'worker-runtime-jobs-sound-cpu-phase202-route-path-warning-acceptance-register',
  ),
  duplicateAvoidance: parseJsonBlock(
    docs.duplicateAvoidance,
    'worker-runtime-jobs-sound-cpu-phase202-duplicate-route-proof-avoidance-register',
  ),
  blocked: parseJsonBlock(docs.blocked, 'worker-runtime-jobs-sound-cpu-phase202-blocked-execution-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase202-runtime-claim-policy'),
  nextPrompt: parseJsonBlock(
    docs.nextPrompt,
    'worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection',
  ),
}

for (const file of Object.values(docs).filter((file) => file.endsWith('.md'))) assertNoForbiddenTrueClaims(file)

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reviewScope.acceptControlledDisabledRoutePreflightExecution === true, 'prompt acceptance missing')
assert(parsed.prompt.reviewScope.acceptRoutePathWarning === true, 'prompt route warning missing')
assert(parsed.prompt.reviewScope.mayProceedToWorkerDispatchContractGapReview === true, 'prompt next gate mismatch')
assert(parsed.prompt.reviewScope.allowWorkerDispatchExecution === false, 'prompt dispatch widened')
assertNoop(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2298, 'source PR mismatch')
assert(parsed.sourceResult.executionResult.requestCount === 1, 'source request count mismatch')
assert(parsed.sourceResult.executionResult.sourceRegisteredRoute === '/v1/sound-cpu/jobs', 'source route mismatch')
assert(parsed.sourceResult.executionResult.status === 409, 'source status mismatch')
assert(parsed.sourceResult.executionResult.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'source error code mismatch')
assert(parsed.sourceResult.executionResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assertNoop(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceProof.proofOutput.path === '/v1/sound-cpu/jobs', 'proof path mismatch')
assert(parsed.sourceProof.proofOutput.requestCount === 1, 'proof count mismatch')
assert(parsed.sourceProof.proofOutput.status === 409, 'proof status mismatch')
assert(parsed.sourceProof.proofOutput.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'proof error mismatch')
assert(
  parsed.sourceProof.packageHashesBeforeProof.packageLockSha256 ===
    '1bb8eeaeb320c32aecf53939056ad5e63b6d99fc0272b7dad87c5e95f724b2af',
  'package lock hash mismatch',
)

assert(
  parsed.sourceRoutePath.routePathReconciliation.phase199PlannedRoute === '/api/workers/sound-cpu/jobs',
  'planned route mismatch',
)
assert(
  parsed.sourceRoutePath.routePathReconciliation.sourceRegisteredRoute === '/v1/sound-cpu/jobs',
  'source registered route mismatch',
)
assert(parsed.sourceRoutePath.routePathReconciliation.ownerReviewMustPreserveWarning === true, 'source route warning not preserved')

assert(
  parsed.phase144Result.decision ===
    'worker_runtime_jobs_sound_cpu_phase144_worker_dispatch_contract_gap_review_completed_with_warnings_ready_for_dispatch_source_plan',
  'phase144 decision mismatch',
)
assert(parsed.phase144Result.reviewResult.phase143DisabledRouteProofAccepted === true, 'phase144 proof acceptance missing')
assert(parsed.phase144Result.reviewResult.dispatchSourcePlanMayProceed === true, 'phase144 source plan not allowed')
assert(parsed.phase144Result.reviewResult.workerDispatchExecutionEnabled === false, 'phase144 dispatch widened')
assertNoop(parsed.phase144Result.supabaseClassification, 'phase144.supabaseClassification')

assert(
  parsed.currentNextBlocker.selectedNextBlocker.blockerId === 'product_tool_call_execution_readiness_gap',
  'current next blocker mismatch',
)
assert(
  parsed.currentNextBlocker.selectedNextBlocker.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PRODUCT-TOOL-CALL-EXECUTION-READINESS-GAP-CLOSURE-AFTER-INTERNAL-DRY-RUN: close product tool-call execution readiness gap after bounded internal dry-run, no external beta',
  'current next blocker prompt mismatch',
)
assert(parsed.currentNextBlocker.selectedNextBlocker.mayExecuteProductCallsInThisPrompt === false, 'current next blocker widened')
assert(read(docs.productGapPrompt).includes('This prompt must not unlock external beta'), 'product gap prompt scope missing')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2306, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '5fddc395cb5e3e26df68e7a589a4b7120d5375f6', 'result merge mismatch')
assert(parsed.result.sourceVerification.phase201ProofAccepted === true, 'phase201 proof not accepted')
assert(parsed.result.sourceVerification.phase144DispatchGapReviewAlreadyMerged === true, 'phase144 duplicate avoidance missing')
assert(parsed.result.ownerReviewResult.controlledDisabledRoutePreflightAccepted === true, 'preflight not accepted')
assert(parsed.result.ownerReviewResult.routePathWarningAccepted === true, 'route warning not accepted')
assert(parsed.result.ownerReviewResult.workerDispatchContractGapReviewMayProceed === true, 'dispatch gap review handoff missing')
assert(parsed.result.ownerReviewResult.workerDispatchContractGapReviewAlreadySatisfiedByPhase144 === true, 'phase144 satisfied flag missing')
assert(parsed.result.ownerReviewResult.duplicateWorkerDispatchContractGapReviewShouldNotBeRepeated === true, 'duplicate gap review flag missing')
assert(parsed.result.ownerReviewResult.additionalServerStarted === false, 'server started in review')
assert(parsed.result.ownerReviewResult.additionalHttpRequestSent === false, 'HTTP request sent in review')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.ownerReviewResult.runtimeReadinessClaimed === false, 'runtime readiness widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.sourcePr === 2306, 'acceptance source PR mismatch')
assert(parsed.acceptance.acceptedEvidence.path === '/v1/sound-cpu/jobs', 'acceptance route mismatch')
assert(parsed.acceptance.acceptedEvidence.status === 409, 'acceptance status mismatch')
assert(parsed.acceptance.acceptedEvidence.errorCode === 'ROUTE_EXECUTION_NOT_ENABLED', 'acceptance error mismatch')
assert(parsed.acceptance.acceptedForPlanningOnly.failClosedRoutePreflightEvidence === true, 'planning evidence missing')
assert(parsed.acceptance.acceptedForPlanningOnly.productToolCallReadinessEvaluationMayProceed === true, 'product readiness eval missing')
assert(parsed.acceptance.acceptedForPlanningOnly.workerDispatchExecutionToday === false, 'acceptance dispatch widened')

assert(parsed.routeWarning.routePathWarning.warningAccepted === true, 'route warning acceptance mismatch')
assert(parsed.routeWarning.routePathWarning.duplicateRouteProofRequired === false, 'duplicate route proof required unexpectedly')
assert(parsed.routeWarning.routePathWarning.broadRouteReadinessClaimed === false, 'broad route readiness widened')

assert(parsed.duplicateAvoidance.duplicateAvoidance.phase143DisabledRouteProofAlreadyAccepted === true, 'phase143 duplicate flag missing')
assert(parsed.duplicateAvoidance.duplicateAvoidance.phase144WorkerDispatchGapReviewAlreadySatisfied === true, 'phase144 duplicate flag missing')
assert(parsed.duplicateAvoidance.duplicateAvoidance.phase201ControlledDisabledRoutePreflightAlreadyExecuted === true, 'phase201 duplicate flag missing')
assert(parsed.duplicateAvoidance.duplicateAvoidance.phase202RunsAdditionalServer === false, 'duplicate server widened')
assert(parsed.duplicateAvoidance.duplicateAvoidance.phase202SendsAdditionalHttpRequest === false, 'duplicate request widened')
assert(parsed.duplicateAvoidance.duplicateAvoidance.phase202RepeatsWorkerDispatchGapReview === false, 'duplicate dispatch review repeated')

assertTrueMap(parsed.blocked.completedInThisGate, 'blocked.completedInThisGate')
assertTrueMap(parsed.blocked.stillBlocked, 'blocked.stillBlocked')
assertFalseMap(parsed.blocked.stillBlockedClaims, 'blocked.stillBlockedClaims')

assert(parsed.claimPolicy.allowedClaims.phase201ControlledDisabledRoutePreflightAccepted === true, 'allowed claim missing')
assert(parsed.claimPolicy.allowedClaims.currentExecutionReadinessBlockerSelectionMayProceed === true, 'blocker selection claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.nextPrompt.selectionScope.treatPhase144DispatchGapReviewAsAlreadySatisfied === true, 'next prompt duplicate avoidance missing')
assert(parsed.nextPrompt.selectionScope.avoidDuplicateRouteProof === true, 'next prompt route duplicate avoidance missing')
assert(
  parsed.nextPrompt.selectionScope.selectedCurrentNextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PRODUCT-TOOL-CALL-EXECUTION-READINESS-GAP-CLOSURE-AFTER-INTERNAL-DRY-RUN',
  'next prompt selected blocker mismatch',
)
assert(parsed.nextPrompt.selectionScope.allowProductToolCallExecution === false, 'next prompt product execution widened')
assert(parsed.nextPrompt.selectionScope.allowExternalBetaUnlock === false, 'next prompt beta widened')
assertNoop(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

const pkg = JSON.parse(read(docs.packageJson))
assert(
  pkg.scripts?.[
    'worker-runtime-jobs:sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2306,
      phase201ProofAccepted: true,
      routePathWarningAccepted: true,
      duplicateRouteProofAvoided: true,
      phase144DispatchGapReviewAlreadySatisfied: true,
      selectedCurrentNextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PRODUCT-TOOL-CALL-EXECUTION-READINESS-GAP-CLOSURE-AFTER-INTERNAL-DRY-RUN',
      workerDispatchExecutionEnabled: false,
      productToolCallExecutionReady: false,
      externalBetaUnlocked: false,
      supabaseMutationEnabled: false,
    },
    null,
    2,
  ),
)
