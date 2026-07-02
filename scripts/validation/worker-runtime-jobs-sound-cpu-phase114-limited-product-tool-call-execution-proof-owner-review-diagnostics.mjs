import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase114_limited_product_tool_call_execution_proof_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase114_limited_product_tool_call_execution_proof_owner_review_passed_with_warnings_ready_for_product_tool_call_readiness_reconciliation_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE115-PRODUCT-TOOL-CALL-READINESS-RECONCILIATION'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-proof-output-register.md',
  sourceVerification:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-no-side-effect-verification-register.md',
  sourceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-tool-coverage-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-acceptance-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation.md',
}

const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const expectedImages = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
]
const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertArrayEquals(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  assert(actual.length === expected.length, `${label} length mismatch`)
  for (const item of expected) assert(actual.includes(item), `${label} missing ${item}`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowProductToolCallExecutionToday',
    'allowRealExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowMediaOpenToday',
    'allowProviderCallToday',
    'allowModelCallToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowStorageObjectCreationToday',
    'allowSignedUrlCreationToday',
    'allowArtifactCreationToday',
    'allowBetaUnlockToday',
    'allowProductionUnlockToday',
    'acceptedForProductToolCallExecutionToday',
    'acceptedForRealExternalAgentExecutionToday',
    'acceptedForRealUserMediaToday',
    'acceptedForWorkerDispatchToday',
    'acceptedForRouteExecutionToday',
    'acceptedForManifestPersistenceToday',
    'acceptedForMediaOpenToday',
    'acceptedForSupabaseMutationToday',
    'acceptedForSqlExecutionToday',
    'externalAgentExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'manifestPersistenceReadyClaimed',
    'realUserMediaExecutionReadyClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'realUserMediaBetaReadyClaimed',
    'externalBetaUnlockClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-proof-output-register',
  ),
  sourceVerification: parseJsonBlock(
    docs.sourceVerification,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-no-side-effect-verification-register',
  ),
  sourceCoverage: parseJsonBlock(
    docs.sourceCoverage,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-tool-coverage-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-acceptance-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-reconciliation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2069, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '892464ccce94e9ab240d3367af2d6009e392110c',
  'source merge mismatch',
)
assert(parsed.source.proofResult.status === 'passed', 'source proof did not pass')
assert(parsed.source.proofResult.limitedProductToolCallBoundaryInvoked === true, 'source boundary missing')
assert(parsed.source.proofResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.soundCpuTools.readyForLimitedProductToolCallExecutionProofOwnerReview === 15, 'source owner-review count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product execution widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceOutput.sanitizedProofOutput.status === 'passed', 'source output status mismatch')
assert(parsed.sourceOutput.proofOutputWrittenToDisk === false, 'source output written to disk')
for (const value of Object.values(parsed.sourceVerification.verifiedFalse)) {
  assert(value === false, 'source verification false marker widened')
}
assert(parsed.sourceCoverage.soundCpuToolSet.totalToolsInLane === 15, 'source coverage count mismatch')
assert(parsed.sourceCoverage.soundCpuToolSet.readyForProductToolCallExecutionToday === 0, 'source coverage execution widened')
assert(parsed.sourceBlockers.readyForLimitedProductToolCallExecutionProofOwnerReview === true, 'source blocker owner review missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker execution widened')
assert(parsed.sourcePolicy.nextGateMayReviewLimitedProof === true, 'source policy next owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewLimitedProofOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayAcceptProductToolCallReadinessReconciliationNext === true, 'prompt reconciliation missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product execution widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2071, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '6a645566265d0c1f9399d4df148cc7845d31d976',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.limitedProductToolCallExecutionProofAccepted === true, 'proof acceptance missing')
assert(parsed.result.ownerReview.productToolCallReadinessReconciliationMayProceedNext === true, 'next reconciliation missing')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'product execution widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaToday === false, 'real media widened')
assert(parsed.result.ownerReview.acceptedForWorkerDispatchToday === false, 'worker dispatch widened')
assert(parsed.result.soundCpuTools.readyForProductToolCallReadinessReconciliation === 15, 'reconciliation count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product execution widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedProofElements.limitedProductToolCallExecutionProofPassed === true, 'acceptance proof missing')
assert(parsed.acceptance.acceptedProofElements.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedProofElements.readyForProductToolCallExecutionToday === 0, 'acceptance execution widened')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
for (const value of Object.values(parsed.acceptance.acceptedForNextReconciliationOnly)) {
  assert(value === true, 'acceptedForNextReconciliationOnly must remain true')
}
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_proof_owner_review_pending',
  ),
  'owner-review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'product_tool_call_readiness_reconciliation_pending',
  ),
  'reconciliation blocker missing',
)
assert(parsed.blockers.readyForProductToolCallReadinessReconciliation === true, 'reconciliation readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product execution widened')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallReadinessReconciliation === 15, 'blocker reconciliation count mismatch')

assert(parsed.policy.allowedClaims.limitedProductToolCallExecutionProofOwnerReviewedClaimed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.productToolCallReadinessReconciliationMayProceedClaimed === true, 'reconciliation claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product execution widened')
assert(parsed.policy.nextGateMayRunProductToolCallReadinessReconciliation === true, 'next reconciliation missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'product execution permission widened')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'real media permission widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase115_product_tool_call_readiness_reconciliation_completed_with_warnings_ready_for_product_tool_call_readiness_owner_review_no_real_user_media', 'next expected mismatch')
assert(parsed.next.reconciliationScope.reconcileLimitedProductToolCallProofOnly === true, 'next reconciliation scope missing')
assert(parsed.next.reconciliationScope.mayAcceptProductToolCallReadinessOwnerReviewNext === true, 'next owner review missing')
assert(parsed.next.reconciliationScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reconciliationScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.reconciliationScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForProductToolCallReadinessReconciliation:
        parsed.result.soundCpuTools.readyForProductToolCallReadinessReconciliation,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
