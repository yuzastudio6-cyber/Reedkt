import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase202_controlled_disabled_route_preflight_execution_result_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase203_current_execution_readiness_blocker_selection_completed_with_warnings_ready_for_product_tool_call_execution_gap_closure'
const productGapPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PRODUCT-TOOL-CALL-EXECUTION-READINESS-GAP-CLOSURE-AFTER-INTERNAL-DRY-RUN'

const files = {
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection.md',
  phase202: 'docs/worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review.md',
  currentNextBlocker:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-next-blocker-after-internal-dry-run.md',
  productGapPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection-result.md',
  sourceMap: 'docs/worker-runtime-jobs-sound-cpu-phase203-source-evidence-map.md',
  selected: 'docs/worker-runtime-jobs-sound-cpu-phase203-selected-blocker-register.md',
  notSelected: 'docs/worker-runtime-jobs-sound-cpu-phase203-not-selected-blockers-register.md',
  duplicate: 'docs/worker-runtime-jobs-sound-cpu-phase203-duplicate-avoidance-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase203-runtime-claim-policy.md',
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

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowProductToolCallExecution',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMediaProcessing',
    'allowArtifactCreation',
    'allowProviderCall',
    'allowModelCall',
    'allowDockerOrCloudRunExecution',
    'allowExternalBetaUnlock',
    'allowProductionUnlock',
    'mayExecuteProductCallsInPhase203',
    'mayUnlockExternalBetaInPhase203',
    'mayClaimRuntimeReadinessInPhase203',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'mediaProcessingEnabled',
    'artifactCreationEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'productToolCallExecutionReady',
    'realUserMediaProcessingEnabled',
    'artifactDeliveryEnabled',
    'internalBetaUnlocked',
    'externalBetaUnlocked',
    'paidProductionUnlocked',
    'productionReady',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = {
  prompt: parseJsonBlock(files.prompt, 'worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection'),
  phase202: parseJsonBlock(
    files.phase202,
    'worker-runtime-jobs-sound-cpu-phase202-controlled-disabled-route-preflight-execution-result-owner-review',
  ),
  currentNextBlocker: parseJsonBlock(
    files.currentNextBlocker,
    'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-next-blocker-after-internal-dry-run',
  ),
  result: parseJsonBlock(
    files.result,
    'worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection-result',
  ),
  sourceMap: parseJsonBlock(files.sourceMap, 'worker-runtime-jobs-sound-cpu-phase203-source-evidence-map'),
  selected: parseJsonBlock(files.selected, 'worker-runtime-jobs-sound-cpu-phase203-selected-blocker-register'),
  notSelected: parseJsonBlock(files.notSelected, 'worker-runtime-jobs-sound-cpu-phase203-not-selected-blockers-register'),
  duplicate: parseJsonBlock(files.duplicate, 'worker-runtime-jobs-sound-cpu-phase203-duplicate-avoidance-register'),
  claimPolicy: parseJsonBlock(files.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase203-runtime-claim-policy'),
}

for (const file of Object.values(files).filter((file) => file.endsWith('.md'))) assertNoForbiddenTrueClaims(file)

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.selectionScope.inspectCurrentRepoEvidence === true, 'prompt current inspection missing')
assert(parsed.prompt.selectionScope.avoidDuplicateRouteProof === true, 'prompt duplicate route avoidance missing')
assert(parsed.prompt.selectionScope.avoidDuplicateDispatchGapReview === true, 'prompt duplicate dispatch avoidance missing')
assert(parsed.prompt.selectionScope.selectedCurrentNextPrompt === productGapPrompt, 'prompt next blocker mismatch')
assert(parsed.prompt.selectionScope.allowProductToolCallExecution === false, 'prompt product execution widened')
assertNoop(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.phase202.decision === sourceDecision, 'phase202 decision mismatch')
assert(parsed.phase202.ownerReviewResult.duplicateWorkerDispatchContractGapReviewShouldNotBeRepeated === true, 'phase202 duplicate avoidance missing')
assert(parsed.phase202.ownerReviewResult.currentNextRuntimeBlockerPrompt === productGapPrompt, 'phase202 current blocker prompt mismatch')
assert(parsed.phase202.ownerReviewResult.externalBetaUnlocked === false, 'phase202 beta widened')
assertNoop(parsed.phase202.supabaseClassification, 'phase202.supabaseClassification')

assert(parsed.currentNextBlocker.selectedNextBlocker.blockerId === 'product_tool_call_execution_readiness_gap', 'current blocker mismatch')
assert(parsed.currentNextBlocker.selectedNextBlocker.nextPrompt.startsWith(productGapPrompt), 'current blocker prompt mismatch')
assert(parsed.currentNextBlocker.selectedNextBlocker.mayProceed === true, 'current blocker not allowed')
assert(parsed.currentNextBlocker.selectedNextBlocker.mayExecuteProductCallsInThisPrompt === false, 'current blocker execution widened')
assert(read(files.productGapPrompt).includes('This prompt must not unlock external beta'), 'product gap prompt beta guard missing')
assert(read(files.productGapPrompt).includes('No product tool-call execution'), 'product gap prompt execution guard missing')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2315, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'ffd3c1c66e9c6ce926e5a51985b8a493c86fee17', 'source merge mismatch')
assert(parsed.result.selectionResult.selectedNextBlocker === 'product_tool_call_execution_readiness_gap', 'selected blocker mismatch')
assert(parsed.result.selectionResult.selectedNextPrompt === productGapPrompt, 'selected prompt mismatch')
assert(parsed.result.selectionResult.mayProceedToProductToolCallGapClosure === true, 'selected prompt may proceed missing')
assert(parsed.result.selectionResult.mayExecuteProductToolCallsInPhase203 === false, 'phase203 execution widened')
assert(parsed.result.selectionResult.workerDispatchExecutionEnabled === false, 'result worker widened')
assert(parsed.result.selectionResult.supabaseMutationEnabled === false, 'result supabase widened')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.sourceMap.sourceEvidence.phase202.pr === 2315, 'source map phase202 PR mismatch')
assert(parsed.sourceMap.sourceEvidence.phase201.status === 409, 'source map phase201 status mismatch')
assert(parsed.sourceMap.sourceEvidence.phase201.sourceRegisteredRoute === '/v1/sound-cpu/jobs', 'source map route mismatch')
assert(parsed.sourceMap.sourceEvidence.currentRuntimeBlockerEvidence.selectedBlocker === 'product_tool_call_execution_readiness_gap', 'source map current blocker mismatch')
assert(parsed.sourceMap.evidenceDisposition.productToolCallExecutionEnoughForReadiness === false, 'source map readiness widened')
assert(parsed.sourceMap.evidenceDisposition.externalBetaEnoughForUnlock === false, 'source map beta widened')

assert(parsed.selected.selectedBlocker.blockerId === 'product_tool_call_execution_readiness_gap', 'selected register blocker mismatch')
assert(parsed.selected.selectedBlocker.nextPrompt === productGapPrompt, 'selected register prompt mismatch')
assert(parsed.selected.selectedBlocker.mayProceed === true, 'selected register mayProceed missing')
assert(parsed.selected.selectedBlocker.mayExecuteProductCallsInThisPrompt === false, 'selected register execution widened')
assert(parsed.selected.selectedBlocker.mustStopIfEvidenceTooNarrow === true, 'selected register stop guard missing')

assert(parsed.notSelected.notSelected.length === 5, 'not selected blocker count mismatch')
for (const blocker of parsed.notSelected.notSelected) assert(blocker.mayProceedNow === false, `not-selected blocker widened: ${blocker.blockerId}`)

assert(parsed.duplicate.duplicateAvoidance.doNotRepeatPhase143DisabledRouteProof === true, 'phase143 duplicate guard missing')
assert(parsed.duplicate.duplicateAvoidance.doNotRepeatPhase144DispatchGapReview === true, 'phase144 duplicate guard missing')
assert(parsed.duplicate.duplicateAvoidance.doNotRepeatPhase201ControlledRoutePreflight === true, 'phase201 duplicate guard missing')
assert(parsed.duplicate.duplicateAvoidance.doNotCreateDuplicateProductGapPrompt === true, 'product prompt duplicate guard missing')
assert(parsed.duplicate.duplicateAvoidance.routePathWarningStillOpen === true, 'route warning not carried')

assert(parsed.claimPolicy.allowedClaims.productToolCallExecutionReadinessGapSelected === true, 'allowed selected claim missing')
assert(parsed.claimPolicy.allowedClaims.externalBetaRemainsBlocked === true, 'allowed beta blocked claim missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

const pkg = JSON.parse(read(files.packageJson))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase203-current-execution-readiness-blocker-selection:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase203-current-execution-readiness-blocker-selection-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2315,
      selectedNextBlocker: 'product_tool_call_execution_readiness_gap',
      selectedNextPrompt: productGapPrompt,
      productToolCallExecutionReady: false,
      workerDispatchExecutionEnabled: false,
      externalBetaUnlocked: false,
      supabaseMutationEnabled: false,
    },
    null,
    2,
  ),
)
