import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase113_limited_product_tool_call_execution_plan_completed_with_warnings_ready_for_limited_product_tool_call_execution_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase113_limited_product_tool_call_execution_owner_review_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE114-LIMITED-PRODUCT-TOOL-CALL-EXECUTION-PROOF'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan-result.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-scope-register.md',
  sourceStops:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-stop-conditions.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-acceptance-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof.md',
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
    'limitedProductToolCallExecutionProofPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan-result',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-scope-register',
  ),
  sourceStops: parseJsonBlock(
    docs.sourceStops,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-stop-conditions',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-acceptance-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2067, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '7fe47b567e444cad55bfe2546da59a0c0d972710',
  'source source merge mismatch',
)
assert(parsed.source.planResult.limitedProductToolCallExecutionPlanCreated === true, 'source plan missing')
assert(parsed.source.planResult.planUsesSyntheticOrNoMediaInputsOnly === true, 'source synthetic/no-media plan missing')
assert(parsed.source.planResult.readyForLimitedProductToolCallExecutionOwnerReview === 15, 'source owner-review count mismatch')
assert(parsed.source.planResult.readyForProductToolCallExecutionToday === 0, 'source product execution widened')
assert(parsed.source.planResult.readyForRealExternalAgentExecutionToday === 0, 'source external execution widened')
assert(parsed.source.soundCpuTools.readyForLimitedProductToolCallExecutionOwnerReview === 15, 'source tool owner-review count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceScope.limitedToolCallEnvelope.inputPolicy.syntheticOrNoMediaOnly === true, 'source scope input policy missing')
assert(parsed.sourceScope.limitedToolCallEnvelope.inputPolicy.realUserMediaAllowed === false, 'source scope real media widened')
assert(parsed.sourceScope.limitedToolCallEnvelope.runtimePolicy.productToolCallExecutionAllowedToday === false, 'source scope product execution widened')
assert(parsed.sourceScope.limitedToolCallEnvelope.toolCount === 15, 'source scope tool count mismatch')
assert(parsed.sourceStops.futureGateMustStopOn.includes('real user media path'), 'source stop real media missing')
assert(parsed.sourceStops.futureGateMustStopOn.includes('worker dispatch or lease mutation'), 'source stop worker dispatch missing')
assert(parsed.sourceBlockers.readyForLimitedProductToolCallExecutionOwnerReview === true, 'source blocker owner review missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product execution widened')
assert(parsed.sourcePolicy.nextGateMayRunLimitedProductToolCallExecutionOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy proof execution widened before owner review')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reviewScope.reviewLimitedProductToolCallExecutionPlanOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayAcceptLimitedProductToolCallExecutionProofNext === true, 'prompt next proof missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product execution today widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2068, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '759e09884bfe6f7f1b6f689c776b725ed7c8bdc8',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.limitedProductToolCallExecutionPlanAccepted === true, 'plan acceptance missing')
assert(parsed.result.ownerReview.limitedProductToolCallExecutionProofMayProceedNext === true, 'next proof missing')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'product execution today widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaToday === false, 'real media today widened')
assert(parsed.result.ownerReview.acceptedForWorkerDispatchToday === false, 'worker dispatch widened')
assert(parsed.result.soundCpuTools.readyForLimitedProductToolCallExecutionProof === 15, 'proof readiness count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product execution widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanElements.limitedProductToolCallExecutionPlanCreated === true, 'acceptance plan missing')
assert(parsed.acceptance.acceptedPlanElements.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedPlanElements.readyForProductToolCallExecutionToday === 0, 'acceptance execution widened')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
for (const value of Object.values(parsed.acceptance.acceptedForNextProofOnly)) {
  assert(value === true, 'acceptedForNextProofOnly must remain true')
}
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_owner_review_pending',
  ),
  'owner-review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_proof_pending',
  ),
  'proof blocker missing',
)
assert(parsed.blockers.readyForLimitedProductToolCallExecutionProof === true, 'limited proof readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product execution widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedProductToolCallExecutionProof === 15, 'blocker proof count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker product execution count widened')

assert(parsed.policy.allowedClaims.limitedProductToolCallExecutionPlanOwnerReviewedClaimed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.limitedProductToolCallExecutionProofMayProceedClaimed === true, 'proof may proceed claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.limitedProductToolCallExecutionProofPassedClaimed === false, 'proof pass claim widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'product execution readiness widened')
assert(parsed.policy.nextGateMayRunLimitedProductToolCallProof === true, 'next proof permission missing')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'real media permission widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'worker dispatch permission widened')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.expectedDecisionOnPass === 'worker_runtime_jobs_sound_cpu_phase114_limited_product_tool_call_execution_proof_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_owner_review_no_real_user_media', 'next prompt expected decision mismatch')
assert(parsed.next.proofScope.runLimitedProductToolCallBoundary === true, 'next prompt proof boundary missing')
assert(parsed.next.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'next prompt synthetic/no-media missing')
assert(parsed.next.proofScope.allowedToolCount === 15, 'next prompt tool count mismatch')
assertArrayEquals(parsed.next.proofScope.allowedWorkers, expectedWorkers, 'next prompt workers')
assertArrayEquals(parsed.next.proofScope.allowedImages, expectedImages, 'next prompt images')
assertArrayEquals(parsed.next.proofScope.allowedJobTypes, expectedJobTypes, 'next prompt job types')
assert(parsed.next.proofScope.allowRealUserMedia === false, 'next prompt real media widened')
assert(parsed.next.proofScope.allowWorkerDispatch === false, 'next prompt worker dispatch widened')
assert(parsed.next.proofScope.allowRouteExecution === false, 'next prompt route execution widened')
assert(parsed.next.proofScope.allowManifestPersistence === false, 'next prompt manifest persistence widened')
assert(parsed.next.proofScope.allowMediaOpen === false, 'next prompt media open widened')
assert(parsed.next.proofScope.allowSupabaseMutation === false, 'next prompt supabase widened')
assert(parsed.next.proofScope.allowArtifactCreation === false, 'next prompt artifact widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForLimitedProductToolCallExecutionProof:
        parsed.result.soundCpuTools.readyForLimitedProductToolCallExecutionProof,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
