import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase119_controlled_product_tool_execution_proof_passed_with_warnings_ready_for_controlled_product_tool_execution_proof_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase119_controlled_product_tool_execution_proof_owner_review_passed_with_warnings_ready_for_external_agent_product_tool_execution_readiness_reconciliation_no_real_user_media'
const phase120Decision =
  'worker_runtime_jobs_sound_cpu_phase120_external_agent_product_tool_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_external_agent_product_tool_execution_readiness_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE120-EXTERNAL-AGENT-PRODUCT-TOOL-EXECUTION-READINESS-RECONCILIATION-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-output-register-no-real-user-media.md',
  sourceSideEffects:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-no-side-effect-register.md',
  sourceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-tool-coverage-register-no-real-user-media.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-blocker-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-acceptance-register-no-real-user-media.md',
  reconciliation:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-readiness-reconciliation-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media.md',
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
const expectedTools = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
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
    'mayExecuteProductToolCalls',
    'mayUseRealExternalAgents',
    'mayUseRealUserMedia',
    'productToolCallExecutionReadyClaimed',
    'realExternalAgentExecutionReadyClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-output-register-no-real-user-media',
  ),
  sourceSideEffects: parseJsonBlock(
    docs.sourceSideEffects,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-no-side-effect-register',
  ),
  sourceCoverage: parseJsonBlock(
    docs.sourceCoverage,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-tool-coverage-register-no-real-user-media',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-blocker-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-acceptance-register-no-real-user-media',
  ),
  reconciliation: parseJsonBlock(
    docs.reconciliation,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-readiness-reconciliation-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2082, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'f16f0caab3e581ea968af6f45d45fb24f57080c8',
  'source merge mismatch',
)
assert(parsed.source.proofResult.status === 'passed', 'source proof status mismatch')
assert(parsed.source.proofResult.recordWhatHappened === true, 'source what-happened missing')
assert(parsed.source.proofResult.proofCommandRunCount === 1, 'source proof command count mismatch')
assert(parsed.source.proofResult.invocationCount === 4, 'source invocation count mismatch')
assert(parsed.source.proofResult.totalSyntheticBoundaryInvocationsObserved === 4, 'source total invocation count mismatch')
assert(parsed.source.proofResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.proofResult.runtimeFlagsAllFalse === true, 'source runtime flags mismatch')
assert(parsed.source.proofResult.realUserMediaUsed === false, 'source real user media widened')
assert(parsed.source.proofResult.workerDispatched === false, 'source worker widened')
assert(parsed.source.proofResult.routeExecuted === false, 'source route widened')
assert(parsed.source.proofResult.manifestPersisted === false, 'source manifest widened')
assert(parsed.source.proofResult.mediaOpened === false, 'source media widened')
assert(parsed.source.proofResult.supabaseTouched === false, 'source Supabase widened')
assert(parsed.source.proofResult.sqlExecuted === false, 'source SQL widened')
assert(parsed.source.proofResult.artifactCreated === false, 'source artifact widened')
assert(parsed.source.soundCpuTools.controlledProductToolExecutionProofPassed === 15, 'source proof tool count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product execution widened')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceOutput.sanitizedProofOutput.proofCommandRunCount === 1, 'source output run count mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.invocationCount === 4, 'source output invocation count mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.toolCountCovered === 15, 'source output tool count mismatch')
assert(parsed.sourceOutput.proofOutputWrittenToDisk === false, 'proof output was written')
assert(parsed.sourceOutput.tempProofArtifactsCreated === false, 'temp proof artifacts created')
assert(parsed.sourceOutput.fullPayloadRetained === false, 'full payload retained')
assertAllFalse(parsed.sourceSideEffects.verifiedFalse, 'source side effects')
assert(parsed.sourceCoverage.soundCpuToolSet.totalToolsInLane === 15, 'source coverage tool count mismatch')
assertArrayEquals(parsed.sourceCoverage.soundCpuToolSet.tools, expectedTools, 'source coverage tools')
assertArrayEquals(parsed.sourceCoverage.workersCovered, expectedWorkers, 'source coverage workers')
assertArrayEquals(parsed.sourceCoverage.imagesCovered, expectedImages, 'source coverage images')
assertArrayEquals(parsed.sourceCoverage.jobTypesCovered, expectedJobTypes, 'source coverage job types')
assert(parsed.sourceBlockers.readyForControlledProductToolExecutionProofOwnerReview === true, 'source blocker owner review missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product widened')
assert(parsed.sourcePolicy.allowedClaims.whatHappenedEvidenceRecordedClaimed === true, 'source policy what-happened missing')
assert(parsed.sourcePolicy.nextGateMayRunControlledProductToolExecutionProofOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product widened')
assertNoOpClassification(parsed.sourcePolicy.supabaseClassification, 'sourcePolicy.supabaseClassification')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewControlledProductToolExecutionProofOnly === true, 'prompt review scope mismatch')
assert(parsed.prompt.reviewScope.mayReconcileExternalAgentProductToolExecutionReadinessNext === true, 'prompt reconciliation missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product execution widened')
assert(parsed.prompt.reviewScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2084, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'd7eb0f4cfce29ec06e39b345d519ccfba4f19683',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.controlledProductToolExecutionProofAccepted === true, 'result owner acceptance missing')
assert(parsed.result.ownerReview.whatHappenedEvidenceRecorded === true, 'result what-happened missing')
assert(parsed.result.ownerReview.externalAgentProductToolExecutionReadinessReconciliationMayProceedNext === true, 'result reconciliation missing')
assert(parsed.result.ownerReview.acceptedProofCommandRunCount === 1, 'result proof command mismatch')
assert(parsed.result.ownerReview.acceptedInvocationCount === 4, 'result invocation mismatch')
assert(parsed.result.ownerReview.acceptedTotalSyntheticBoundaryInvocationsObserved === 4, 'result total invocation mismatch')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'result product widened')
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'result real external widened')
assert(parsed.result.soundCpuTools.controlledProductToolExecutionProofOwnerReviewed === 15, 'result tool owner reviewed mismatch')
assert(parsed.result.soundCpuTools.readyForExternalAgentProductToolExecutionReadinessReconciliationNoRealUserMedia === 15, 'result reconciliation count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.soundCpuTools.readyForRealExternalAgentExecutionToday === 0, 'result real agent count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedProofEvidence.proofStatus === 'passed', 'acceptance proof status mismatch')
assert(parsed.acceptance.acceptedProofEvidence.recordWhatHappened === true, 'acceptance what-happened missing')
assert(parsed.acceptance.acceptedProofEvidence.proofCommandRunCount === 1, 'acceptance proof run mismatch')
assert(parsed.acceptance.acceptedProofEvidence.totalSyntheticBoundaryInvocationsObserved === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedProofEvidence.toolCountCovered === 15, 'acceptance tool count mismatch')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
assertArrayEquals(parsed.acceptance.acceptedTools, expectedTools, 'acceptance tools')
assert(parsed.acceptance.acceptedForNextReconciliationOnly.whatHappenedEvidenceMustRemainRecorded === true, 'acceptance evidence carry forward missing')
assert(parsed.acceptance.notAcceptedForToday.productToolCallExecution === true, 'acceptance product blocker missing')
assert(parsed.acceptance.notAcceptedForToday.realExternalAgentExecution === true, 'acceptance real agent blocker missing')
assert(parsed.acceptance.notAcceptedForToday.realUserMedia === true, 'acceptance real media blocker missing')

assert(parsed.reconciliation.nextReconciliationTarget.prompt === nextPrompt, 'reconciliation prompt mismatch')
assert(parsed.reconciliation.nextReconciliationTarget.expectedDecision === phase120Decision, 'reconciliation expected mismatch')
assert(parsed.reconciliation.nextReconciliationTarget.mayReconcileReadiness === true, 'reconciliation readiness missing')
assert(parsed.reconciliation.nextReconciliationTarget.mayExecuteProductToolCalls === false, 'reconciliation product widened')
assert(parsed.reconciliation.nextReconciliationTarget.mayUseRealExternalAgents === false, 'reconciliation real agent widened')
assert(parsed.reconciliation.nextReconciliationTarget.mayUseRealUserMedia === false, 'reconciliation real media widened')
assert(parsed.reconciliation.requiredEvidenceToCarryForward.proofCommandRunCount === 1, 'reconciliation proof count mismatch')
assert(parsed.reconciliation.requiredEvidenceToCarryForward.totalSyntheticBoundaryInvocationsObserved === 4, 'reconciliation invocation count mismatch')
assert(parsed.reconciliation.requiredEvidenceToCarryForward.toolCountCovered === 15, 'reconciliation tool count mismatch')
assert(parsed.reconciliation.requiredEvidenceToCarryForward.whatHappenedEvidenceRecorded === true, 'reconciliation what-happened missing')
assert(parsed.reconciliation.requiredEvidenceToCarryForward.noSideEffectsVerified === true, 'reconciliation side-effects missing')
assert(parsed.reconciliation.readinessCountsAfterOwnerReview.toolsEligibleForNoRealMediaReadinessReconciliation === 15, 'reconciliation count mismatch')
assert(parsed.reconciliation.readinessCountsAfterOwnerReview.toolsReadyForProductToolCallExecutionToday === 0, 'reconciliation product count widened')

assert(parsed.blockers.readyForExternalAgentProductToolExecutionReadinessReconciliation === true, 'blocker reconciliation missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.readyForRealExternalAgentExecutionToday === false, 'blocker real agent widened')
assert(parsed.blockers.soundCpuToolsReadyForExternalAgentProductToolExecutionReadinessReconciliation === 15, 'blocker count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker product count widened')

assert(parsed.policy.allowedClaims.controlledProductToolExecutionProofOwnerReviewedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceRecordedClaimed === true, 'policy what-happened claim missing')
assert(parsed.policy.allowedClaims.externalAgentProductToolExecutionReadinessReconciliationMayProceedClaimed === true, 'policy reconciliation claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product widened')
assert(parsed.policy.blockedClaims.realExternalAgentExecutionReadyClaimed === false, 'policy real agent widened')
assert(parsed.policy.nextGateMayRunExternalAgentProductToolExecutionReadinessReconciliation === true, 'policy next reconciliation missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'policy real agent widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.expectedDecision === phase120Decision, 'next prompt expected mismatch')
assert(parsed.next.reconciliationScope.reconcileExternalAgentProductToolExecutionReadinessOnly === true, 'next prompt scope mismatch')
assert(parsed.next.reconciliationScope.allowedToolCount === 15, 'next prompt tool count mismatch')
assertArrayEquals(parsed.next.reconciliationScope.requiredWorkers, expectedWorkers, 'next prompt workers')
assertArrayEquals(parsed.next.reconciliationScope.requiredImages, expectedImages, 'next prompt images')
assertArrayEquals(parsed.next.reconciliationScope.requiredJobTypes, expectedJobTypes, 'next prompt job types')
assert(parsed.next.reconciliationScope.requireWhatHappenedEvidenceRecorded === true, 'next prompt what-happened missing')
assert(parsed.next.reconciliationScope.allowProductToolCallExecutionToday === false, 'next prompt product widened')
assert(parsed.next.reconciliationScope.allowRealExternalAgentExecutionToday === false, 'next prompt real agent widened')
assert(parsed.next.reconciliationScope.allowRealUserMedia === false, 'next prompt real media widened')
assert(parsed.next.reconciliationScope.allowWorkerDispatchToday === false, 'next prompt worker widened')
assert(parsed.next.reconciliationScope.allowSupabaseMutationToday === false, 'next prompt Supabase widened')
assert(parsed.next.reconciliationScope.allowArtifactCreationToday === false, 'next prompt artifact widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourceDecision,
      sourcePr: 2084,
      sourceMergeCommit: 'd7eb0f4cfce29ec06e39b345d519ccfba4f19683',
      acceptedToolCount: 15,
      proofCommandRunCount: 1,
      totalSyntheticBoundaryInvocationsObserved: 4,
      whatHappenedEvidenceRecorded: true,
      nextPrompt,
      productToolCallExecutionToday: 0,
      realExternalAgentExecutionToday: 0,
      realUserMediaExecutionToday: 0,
      supabase: 'no-op',
    },
    null,
    2,
  ),
)
