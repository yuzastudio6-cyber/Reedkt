import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase122_controlled_product_tool_call_execution_proof_no_real_user_media_passed_with_warnings_ready_for_controlled_product_tool_call_execution_proof_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase122_controlled_product_tool_call_execution_proof_owner_review_passed_with_warnings_ready_for_product_tool_call_execution_readiness_reconciliation_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase123_product_tool_call_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_product_tool_call_execution_readiness_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE123-PRODUCT-TOOL-CALL-EXECUTION-READINESS-RECONCILIATION-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-no-real-user-media-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-output-register-no-real-user-media.md',
  sourceSideEffects:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-no-side-effect-register.md',
  sourceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-tool-coverage-register-no-real-user-media.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-blocker-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-readiness-reconciliation-handoff-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media.md',
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
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-no-real-user-media-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-output-register-no-real-user-media',
  ),
  sourceSideEffects: parseJsonBlock(
    docs.sourceSideEffects,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-no-side-effect-register',
  ),
  sourceCoverage: parseJsonBlock(
    docs.sourceCoverage,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-tool-coverage-register-no-real-user-media',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-blocker-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-readiness-reconciliation-handoff-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2091, 'source source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '7c9d383a1798fa7720662417e56bb8b015e09bbe',
  'source source merge mismatch',
)
assert(parsed.source.proofResult.status === 'passed', 'source proof status mismatch')
assert(parsed.source.proofResult.proofCommandRunCount === 1, 'source proof run count mismatch')
assert(parsed.source.proofResult.invocationCount === 4, 'source invocation mismatch')
assert(parsed.source.proofResult.whatHappenedEvidenceRecorded === true, 'source what-happened missing')
assert(parsed.source.proofResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.proofResult.realExternalAgentUsed === false, 'source real agent widened')
assert(parsed.source.proofResult.realUserMediaUsed === false, 'source real media widened')
assert(parsed.source.proofResult.workerDispatched === false, 'source worker widened')
assert(parsed.source.proofResult.routeExecuted === false, 'source route widened')
assert(parsed.source.proofResult.manifestPersisted === false, 'source manifest widened')
assert(parsed.source.proofResult.supabaseTouched === false, 'source Supabase widened')
assert(parsed.source.proofResult.artifactCreated === false, 'source artifact widened')
assert(parsed.source.soundCpuTools.controlledProductToolCallExecutionProofPassed === 15, 'source tool proof count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceOutput.whatHappened.length === 4, 'source what-happened count mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.toolCountCovered === 15, 'source output tool count mismatch')
assert(parsed.sourceOutput.proofOutputWrittenToDisk === false, 'source output written')
assert(parsed.sourceOutput.tempProofArtifactsCreated === false, 'source temp artifacts created')
assertAllFalse(parsed.sourceSideEffects.verifiedFalse, 'source side effects')
assert(parsed.sourceCoverage.soundCpuToolSet.totalToolsInLane === 15, 'source coverage count mismatch')
assertArrayEquals(parsed.sourceCoverage.workersCovered, expectedWorkers, 'source workers')
assertArrayEquals(parsed.sourceCoverage.imagesCovered, expectedImages, 'source images')
assertArrayEquals(parsed.sourceCoverage.jobTypesCovered, expectedJobTypes, 'source job types')
assert(parsed.sourceBlockers.readyForControlledProductToolCallExecutionProofOwnerReview === true, 'source owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunControlledProductToolCallExecutionProofOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecutionWithRealAgents === false, 'source policy product widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecisionOnPass === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewControlledProductToolCallExecutionProofOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.requireWhatHappenedEvidence === true, 'prompt evidence missing')
assert(parsed.prompt.reviewScope.mayReconcileProductToolCallExecutionReadinessNext === true, 'prompt reconciliation missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.expectedInvocationCount === 4, 'prompt invocation count mismatch')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product today widened')
assert(parsed.prompt.reviewScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.reviewScope.allowWorkerDispatchToday === false, 'prompt worker widened')
assert(parsed.prompt.reviewScope.allowSupabaseMutationToday === false, 'prompt Supabase widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2093, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'f15e3f338e13fc500e900e3ff696cb2d6e0fc7c9',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.controlledProductToolCallExecutionProofAccepted === true, 'result acceptance missing')
assert(parsed.result.ownerReview.productToolCallExecutionReadinessReconciliationMayProceedNext === true, 'result reconciliation missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedInvocationCount === 4, 'result invocation mismatch')
assert(parsed.result.ownerReview.whatHappenedEvidenceAccepted === true, 'result evidence missing')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'result product widened')
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'result real agent widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaToday === false, 'result real media widened')
assert(parsed.result.soundCpuTools.controlledProductToolCallExecutionProofOwnerReviewed === 15, 'result owner count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionReadinessReconciliationNoRealUserMedia === 15, 'result reconciliation count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedProofEvidence.proofCommandRunCount === 1, 'acceptance run count mismatch')
assert(parsed.acceptance.acceptedProofEvidence.invocationCount === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedProofEvidence.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedProofEvidence.whatHappenedEvidenceRecorded === true, 'acceptance evidence missing')
assert(parsed.acceptance.acceptedProofEvidence.proofOutputWrittenToDisk === false, 'acceptance output written')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
assert(parsed.acceptance.acceptedForNextReconciliationOnly.productToolCallExecutionReadinessReconciliationMayProceed === true, 'acceptance next reconciliation missing')

assert(parsed.handoff.nextReconciliationTarget.prompt === nextPrompt, 'handoff next prompt mismatch')
assert(parsed.handoff.nextReconciliationTarget.expectedDecision === nextDecision, 'handoff next decision mismatch')
assert(parsed.handoff.nextReconciliationTarget.mayRunProductToolCalls === false, 'handoff product widened')
assert(parsed.handoff.nextReconciliationTarget.mayUseRealExternalAgents === false, 'handoff real agent widened')
assert(parsed.handoff.nextReconciliationTarget.mayUseRealUserMedia === false, 'handoff real media widened')
assert(parsed.handoff.requiredEvidenceToCarryForward.phase122SourcePr === 2093, 'handoff source PR mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.toolCountCovered === 15, 'handoff tool count mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.invocationCount === 4, 'handoff invocation mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.whatHappenedEvidenceRecorded === true, 'handoff evidence missing')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'controlled_product_tool_call_execution_proof_owner_review_pending',
  ),
  'owner review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'product_tool_call_execution_readiness_reconciliation_pending',
  ),
  'readiness reconciliation blocker missing',
)
assert(parsed.blockers.readyForProductToolCallExecutionReadinessReconciliationNoRealUserMedia === true, 'blocker reconciliation missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForReadinessReconciliation === 15, 'blocker tool count mismatch')

assert(parsed.policy.allowedClaims.controlledProductToolCallExecutionProofOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.productToolCallExecutionReadinessReconciliationMayProceedClaimed === true, 'policy reconciliation missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceAcceptedClaimed === true, 'policy evidence missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunProductToolCallExecutionReadinessReconciliation === true, 'policy next reconciliation missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecutionWithRealAgents === false, 'policy product widened')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'policy real media widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'policy dispatch widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecisionOnPass === nextDecision, 'next decision mismatch')
assert(parsed.next.reconciliationScope.reconcileControlledProofEvidence === true, 'next proof reconciliation missing')
assert(parsed.next.reconciliationScope.reconcileExternalAgentReadinessWithoutRealAgents === true, 'next no-agent reconciliation missing')
assert(parsed.next.reconciliationScope.requireWhatHappenedEvidence === true, 'next evidence missing')
assert(parsed.next.reconciliationScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reconciliationScope.expectedInvocationCount === 4, 'next invocation mismatch')
assert(parsed.next.reconciliationScope.allowProductToolCallExecutionToday === false, 'next product widened')
assert(parsed.next.reconciliationScope.allowRealExternalAgentExecutionToday === false, 'next real agent widened')
assert(parsed.next.reconciliationScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      acceptedToolCount: parsed.result.ownerReview.acceptedToolCount,
      acceptedInvocationCount: parsed.result.ownerReview.acceptedInvocationCount,
      readyForProductToolCallExecutionReadinessReconciliationNoRealUserMedia:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionReadinessReconciliationNoRealUserMedia,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExternalAgentExecutionToday:
        parsed.result.soundCpuTools.readyForRealExternalAgentExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
