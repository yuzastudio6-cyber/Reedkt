import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase117_controlled_limited_no_real_media_tool_execution_proof_passed_with_warnings_ready_for_limited_no_real_media_tool_execution_proof_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase117_limited_no_real_media_tool_execution_proof_owner_review_passed_with_warnings_ready_for_product_tool_execution_gate_plan_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE118-PRODUCT-TOOL-EXECUTION-GATE-PLAN-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-output-register.md',
  sourceSideEffects:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-no-side-effect-register.md',
  sourceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-tool-coverage-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-acceptance-register.md',
  gatePlan:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-gate-plan-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media.md',
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

function assertAllTrue(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === true, `${label}.${key} must be true`)
  }
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must be false`)
  }
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowProductToolCallExecutionToday',
    'allowRealExternalAgentExecutionToday',
    'allowRealUserMedia',
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
    'acceptedForProviderCallToday',
    'acceptedForModelCallToday',
    'acceptedForSupabaseMutationToday',
    'acceptedForSqlExecutionToday',
    'acceptedForStorageObjectCreationToday',
    'acceptedForSignedUrlCreationToday',
    'acceptedForArtifactCreationToday',
    'acceptedForBetaUnlockToday',
    'acceptedForProductionUnlockToday',
    'realUserMediaAllowed',
    'productExecutionAllowedToday',
    'realExternalAgentExecutionAllowedToday',
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
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-output-register',
  ),
  sourceSideEffects: parseJsonBlock(
    docs.sourceSideEffects,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-no-side-effect-register',
  ),
  sourceCoverage: parseJsonBlock(
    docs.sourceCoverage,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-tool-coverage-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-acceptance-register',
  ),
  gatePlan: parseJsonBlock(
    docs.gatePlan,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-gate-plan-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2076, 'source upstream PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '023cdb2111c1403c753427ab81c4c36e3843d67e',
  'source upstream merge mismatch',
)
assert(parsed.source.proofResult.status === 'passed', 'source proof status mismatch')
assert(parsed.source.proofResult.proofCommandRunCount === 2, 'source proof run count mismatch')
assert(parsed.source.proofResult.totalSyntheticBoundaryInvocationsObserved === 8, 'source total invocation mismatch')
assert(parsed.source.proofResult.toolCountCovered === 15, 'source coverage mismatch')
assert(parsed.source.proofResult.workerDispatched === false, 'source worker dispatch widened')
assert(parsed.source.proofResult.routeExecuted === false, 'source route widened')
assert(parsed.source.proofResult.realUserMediaUsed === false, 'source real media widened')
assert(parsed.source.soundCpuTools.readyForLimitedNoRealMediaToolExecutionProofOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product count widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE117-LIMITED-NO-REAL-MEDIA-TOOL-EXECUTION-PROOF-OWNER-REVIEW', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceOutput.sanitizedProofOutput.status === 'passed', 'source output status mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.proofCommandRunCount === 2, 'source output run count mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.toolCountCovered === 15, 'source output coverage mismatch')
assert(parsed.sourceOutput.proofOutputWrittenToDisk === false, 'source output written')
assert(parsed.sourceOutput.tempProofArtifactsCreated === false, 'source temp artifacts created')
assert(parsed.sourceOutput.fullPayloadRetained === false, 'source retained full payload')
assertAllFalse(parsed.sourceSideEffects.verifiedFalse, 'source side effects')
assert(parsed.sourceCoverage.soundCpuToolSet.totalToolsInLane === 15, 'source coverage total mismatch')
assertArrayEquals(parsed.sourceCoverage.workersCovered, expectedWorkers, 'source coverage workers')
assertArrayEquals(parsed.sourceCoverage.imagesCovered, expectedImages, 'source coverage images')
assertArrayEquals(parsed.sourceCoverage.jobTypesCovered, expectedJobTypes, 'source coverage job types')
assert(parsed.sourceBlockers.readyForLimitedNoRealMediaToolExecutionProofOwnerReview === true, 'source blocker owner review missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product widened')
assert(parsed.sourcePolicy.nextGateMayReviewControlledLimitedNoRealMediaProof === true, 'source policy review missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewControlledLimitedNoRealMediaProofOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayPlanProductToolExecutionGateNext === true, 'prompt gate plan missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product execution widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2078, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '8091a0cfaff0dbe1a88ca812b44e8808aff36b63',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.controlledLimitedNoRealMediaToolExecutionProofAccepted === true, 'owner proof acceptance missing')
assert(parsed.result.ownerReview.productToolExecutionGatePlanMayProceedNext === true, 'gate plan permission missing')
assert(parsed.result.ownerReview.acceptedProofCommandRunCount === 2, 'accepted run count mismatch')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'accepted tool count mismatch')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'result product execution widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaToday === false, 'result real media widened')
assert(parsed.result.ownerReview.acceptedForWorkerDispatchToday === false, 'result worker widened')
assert(parsed.result.soundCpuTools.readyForProductToolExecutionGatePlanNoRealUserMedia === 15, 'result gate plan count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedProofElements.controlledLimitedNoRealMediaToolExecutionProofPassed === true, 'acceptance proof missing')
assert(parsed.acceptance.acceptedProofElements.proofCommandRunCount === 2, 'acceptance run count mismatch')
assert(parsed.acceptance.acceptedProofElements.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedProofElements.readyForProductToolExecutionGatePlanNoRealUserMedia === 15, 'acceptance gate count mismatch')
assert(parsed.acceptance.acceptedProofElements.readyForProductToolCallExecutionToday === 0, 'acceptance product widened')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
assertAllTrue(parsed.acceptance.acceptedForNextGatePlanOnly, 'acceptedForNextGatePlanOnly')
assertAllTrue(parsed.acceptance.notAcceptedForToday, 'notAcceptedForToday')

assert(parsed.gatePlan.gatePlanTarget.nextPrompt === nextPrompt, 'gate plan next mismatch')
assert(parsed.gatePlan.gatePlanTarget.gatePlanOnly === true, 'gate plan only missing')
assert(parsed.gatePlan.gatePlanTarget.allowedToolCount === 15, 'gate plan tool count mismatch')
assert(parsed.gatePlan.gatePlanTarget.realUserMediaAllowed === false, 'gate plan real media widened')
assert(parsed.gatePlan.requiredEvidenceForGatePlan.proofCommandRunCount === 2, 'gate plan run count mismatch')
assert(parsed.gatePlan.gatePlanMustStopIf.some((item) => item.includes('what happened')), 'gate plan what-happened stop missing')

assert(parsed.blockers.readyForProductToolExecutionGatePlanNoRealUserMedia === true, 'blocker gate plan missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForProductToolExecutionGatePlanNoRealUserMedia === 15, 'blocker gate count mismatch')
assert(
  parsed.blockers.remainingBlockers.some((row) => row.blockerId === 'product_tool_execution_gate_plan_pending'),
  'gate plan blocker missing',
)

assert(parsed.policy.allowedClaims.controlledLimitedNoRealMediaProofOwnerReviewed === true, 'policy review claim missing')
assert(parsed.policy.allowedClaims.productToolExecutionGatePlanMayProceedNext === true, 'policy next gate missing')
assert(parsed.policy.allowedClaims.soundCpuToolsReadyForNoRealUserMediaGatePlan === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayPlanProductToolExecutionGate === true, 'policy gate plan missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase118_product_tool_execution_gate_plan_no_real_user_media_completed_with_warnings_ready_for_product_tool_execution_gate_owner_review',
  'next expected mismatch',
)
assert(parsed.next.gatePlanScope.gatePlanOnly === true, 'next gate plan only missing')
assert(parsed.next.gatePlanScope.mayPrepareProductToolExecutionGateOwnerReviewNext === true, 'next owner review missing')
assert(parsed.next.gatePlanScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.gatePlanScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.gatePlanScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForProductToolExecutionGatePlanNoRealUserMedia:
        parsed.result.soundCpuTools.readyForProductToolExecutionGatePlanNoRealUserMedia,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
