import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase119_controlled_product_tool_execution_proof_owner_review_passed_with_warnings_ready_for_external_agent_product_tool_execution_readiness_reconciliation_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase120_external_agent_product_tool_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_external_agent_product_tool_execution_readiness_owner_review_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase120_external_agent_product_tool_execution_readiness_owner_review_passed_with_warnings_ready_for_controlled_product_tool_call_execution_plan_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE120-EXTERNAL-AGENT-PRODUCT-TOOL-EXECUTION-READINESS-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-acceptance-register-no-real-user-media.md',
  sourceReconciliation:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-readiness-reconciliation-register-no-real-user-media.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-blocker-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media-result.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-evidence-register-no-real-user-media.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-scope-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media.md',
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
    'readyForProductToolCallExecutionToday',
    'readyForRealExternalAgentExecutionToday',
    'readyForRealUserMediaExecutionToday',
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
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-acceptance-register-no-real-user-media',
  ),
  sourceReconciliation: parseJsonBlock(
    docs.sourceReconciliation,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-readiness-reconciliation-register-no-real-user-media',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-blocker-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media-result',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-evidence-register-no-real-user-media',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-scope-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2084, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'd7eb0f4cfce29ec06e39b345d519ccfba4f19683',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.controlledProductToolExecutionProofAccepted === true, 'source proof acceptance missing')
assert(parsed.source.ownerReview.whatHappenedEvidenceRecorded === true, 'source what-happened missing')
assert(
  parsed.source.ownerReview.externalAgentProductToolExecutionReadinessReconciliationMayProceedNext === true,
  'source reconciliation permission missing',
)
assert(parsed.source.ownerReview.acceptedToolCount === 15, 'source accepted tool count mismatch')
assert(parsed.source.ownerReview.acceptedForProductToolCallExecutionToday === false, 'source product execution widened')
assert(parsed.source.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'source real agent widened')
assert(parsed.source.soundCpuTools.readyForExternalAgentProductToolExecutionReadinessReconciliationNoRealUserMedia === 15, 'source reconciliation count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product count widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE120-EXTERNAL-AGENT-PRODUCT-TOOL-EXECUTION-READINESS-RECONCILIATION-NO-REAL-USER-MEDIA', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedProofEvidence.recordWhatHappened === true, 'source acceptance what-happened missing')
assert(parsed.sourceAcceptance.acceptedProofEvidence.proofCommandRunCount === 1, 'source acceptance proof count mismatch')
assert(parsed.sourceAcceptance.acceptedProofEvidence.totalSyntheticBoundaryInvocationsObserved === 4, 'source acceptance invocation mismatch')
assert(parsed.sourceAcceptance.acceptedProofEvidence.toolCountCovered === 15, 'source acceptance tool count mismatch')
assertArrayEquals(parsed.sourceAcceptance.acceptedWorkers, expectedWorkers, 'source acceptance workers')
assertArrayEquals(parsed.sourceAcceptance.acceptedImages, expectedImages, 'source acceptance images')
assertArrayEquals(parsed.sourceAcceptance.acceptedJobTypes, expectedJobTypes, 'source acceptance job types')
assertArrayEquals(parsed.sourceAcceptance.acceptedTools, expectedTools, 'source acceptance tools')
assert(parsed.sourceReconciliation.nextReconciliationTarget.expectedDecision === decision, 'source reconciliation expected mismatch')
assert(parsed.sourceReconciliation.requiredEvidenceToCarryForward.whatHappenedEvidenceRecorded === true, 'source carry-forward evidence missing')
assert(parsed.sourceReconciliation.requiredEvidenceToCarryForward.noSideEffectsVerified === true, 'source carry-forward side effects missing')
assert(parsed.sourceReconciliation.readinessCountsAfterOwnerReview.toolsEligibleForNoRealMediaReadinessReconciliation === 15, 'source readiness count mismatch')
assert(parsed.sourceReconciliation.readinessCountsAfterOwnerReview.toolsReadyForProductToolCallExecutionToday === 0, 'source readiness product widened')
assert(parsed.sourceBlockers.readyForExternalAgentProductToolExecutionReadinessReconciliation === true, 'source blocker reconciliation missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product widened')
assert(parsed.sourcePolicy.nextGateMayRunExternalAgentProductToolExecutionReadinessReconciliation === true, 'source policy next missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reconciliationScope.reconcileExternalAgentProductToolExecutionReadinessOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reconciliationScope.allowedToolCount === 15, 'prompt tool count mismatch')
assertArrayEquals(parsed.prompt.reconciliationScope.requiredWorkers, expectedWorkers, 'prompt workers')
assertArrayEquals(parsed.prompt.reconciliationScope.requiredImages, expectedImages, 'prompt images')
assertArrayEquals(parsed.prompt.reconciliationScope.requiredJobTypes, expectedJobTypes, 'prompt job types')
assert(parsed.prompt.reconciliationScope.requireWhatHappenedEvidenceRecorded === true, 'prompt what-happened missing')
assert(parsed.prompt.reconciliationScope.allowProductToolCallExecutionToday === false, 'prompt product widened')
assert(parsed.prompt.reconciliationScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.reconciliationScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2086, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'fb2334f0595f16afed9031001b9387ec04d17fce',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.reconciliationResult.phase119ProofOwnerReviewAccepted === true, 'result source accepted missing')
assert(parsed.result.reconciliationResult.whatHappenedEvidenceRecorded === true, 'result what-happened missing')
assert(parsed.result.reconciliationResult.sourceNoSideEffectsAccepted === true, 'result no side effects missing')
assert(parsed.result.reconciliationResult.toolCountCovered === 15, 'result tool count mismatch')
assert(parsed.result.reconciliationResult.readyForExternalAgentProductToolExecutionReadinessOwnerReview === 15, 'result owner review count mismatch')
assert(parsed.result.reconciliationResult.readyForProductToolCallExecutionToday === 0, 'result product execution widened')
assert(parsed.result.reconciliationResult.readyForRealExternalAgentExecutionToday === 0, 'result real external widened')
assert(parsed.result.reconciliationResult.readyForRealUserMediaExecutionToday === 0, 'result real media widened')
for (const key of [
  'realUserMediaUsed',
  'workerDispatched',
  'routeExecuted',
  'manifestPersisted',
  'mediaOpened',
  'providerCalled',
  'modelCalled',
  'supabaseTouched',
  'sqlExecuted',
  'storageObjectCreated',
  'signedUrlCreated',
  'artifactCreated',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assert(parsed.result.reconciliationResult[key] === false, `result ${key} widened`)
}
assert(parsed.result.soundCpuTools.externalAgentProductToolExecutionReadinessReconciled === 15, 'result tool reconciled count mismatch')
assert(parsed.result.soundCpuTools.readyForExternalAgentProductToolExecutionReadinessOwnerReview === 15, 'result tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result tool product widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.sourceEvidence.phase119ProofOwnerReviewAccepted === true, 'evidence source accepted missing')
assert(parsed.evidence.sourceEvidence.proofCommandRunCount === 1, 'evidence proof count mismatch')
assert(parsed.evidence.sourceEvidence.totalSyntheticBoundaryInvocationsObserved === 4, 'evidence invocation count mismatch')
assert(parsed.evidence.sourceEvidence.toolCountCovered === 15, 'evidence tool count mismatch')
assert(parsed.evidence.sourceEvidence.whatHappenedEvidenceRecorded === true, 'evidence what-happened missing')
assert(parsed.evidence.sourceEvidence.noSideEffectsVerified === true, 'evidence no side effects missing')
assertArrayEquals(parsed.evidence.reconciledWorkers, expectedWorkers, 'evidence workers')
assertArrayEquals(parsed.evidence.reconciledImages, expectedImages, 'evidence images')
assertArrayEquals(parsed.evidence.reconciledJobTypes, expectedJobTypes, 'evidence job types')
assertArrayEquals(parsed.evidence.reconciledTools, expectedTools, 'evidence tools')
for (const value of Object.values(parsed.evidence.evidenceLimitations)) {
  assert(value === true, 'evidence limitations must remain true')
}

assert(parsed.scope.readinessScope.externalAgentProductToolExecutionReadinessReconciled === true, 'scope reconciled missing')
assert(parsed.scope.readinessScope.readyForExternalAgentProductToolExecutionReadinessOwnerReview === true, 'scope owner review missing')
assert(parsed.scope.readinessScope.toolCountCovered === 15, 'scope tool count mismatch')
assert(parsed.scope.readinessScope.productToolCallExecutionToday === false, 'scope product execution widened')
assert(parsed.scope.readinessScope.realExternalAgentExecutionToday === false, 'scope real agent widened')
assert(parsed.scope.readinessScope.realUserMediaExecutionToday === false, 'scope real media widened')
assert(parsed.scope.nextOwnerReviewMustDecide.whetherNoRealMediaExternalAgentProductToolExecutionReadinessCanAdvance === true, 'scope next decision missing')

assert(parsed.blockers.readyForExternalAgentProductToolExecutionReadinessOwnerReview === true, 'blocker owner review missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.readyForRealExternalAgentExecutionToday === false, 'blocker real agent widened')
assert(parsed.blockers.soundCpuToolsReadyForExternalAgentProductToolExecutionReadinessOwnerReview === 15, 'blocker owner review count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker product count widened')

assert(parsed.policy.allowedClaims.externalAgentProductToolExecutionReadinessReconciledClaimed === true, 'policy reconciliation claim missing')
assert(parsed.policy.allowedClaims.externalAgentProductToolExecutionReadinessOwnerReviewMayProceedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceRecordedClaimed === true, 'policy what-happened missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product widened')
assert(parsed.policy.blockedClaims.realExternalAgentExecutionReadyClaimed === false, 'policy real agent widened')
assert(parsed.policy.nextGateMayRunExternalAgentProductToolExecutionReadinessOwnerReview === true, 'policy next missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'policy real agent widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.next.reviewScope.reviewReadinessReconciliationOnly === true, 'next prompt scope mismatch')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next prompt tool count mismatch')
assert(parsed.next.reviewScope.mayPlanControlledProductToolCallExecutionNext === true, 'next prompt plan permission missing')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next prompt product widened')
assert(parsed.next.reviewScope.allowRealExternalAgentExecutionToday === false, 'next prompt real agent widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next prompt real media widened')
assert(parsed.next.reviewScope.allowWorkerDispatchToday === false, 'next prompt worker widened')
assert(parsed.next.reviewScope.allowSupabaseMutationToday === false, 'next prompt Supabase widened')
assert(parsed.next.reviewScope.allowArtifactCreationToday === false, 'next prompt artifact widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourceDecision,
      sourcePr: 2086,
      sourceMergeCommit: 'fb2334f0595f16afed9031001b9387ec04d17fce',
      acceptedToolCount: 15,
      whatHappenedEvidenceRecorded: true,
      externalAgentProductToolExecutionReadinessReconciled: 15,
      readyForExternalAgentProductToolExecutionReadinessOwnerReview: 15,
      productToolCallExecutionToday: 0,
      realExternalAgentExecutionToday: 0,
      realUserMediaExecutionToday: 0,
      nextPrompt,
      supabase: 'no-op',
    },
    null,
    2,
  ),
)
