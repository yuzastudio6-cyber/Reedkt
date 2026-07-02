import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase124_limited_external_agent_product_tool_call_execution_plan_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_plan_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase124_limited_external_agent_product_tool_call_execution_plan_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_proof_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase125_limited_external_agent_product_tool_call_execution_proof_no_real_user_media_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_proof_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE125-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-PROOF-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media-result.md',
  sourceInvocation:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-invocation-register-no-real-user-media.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-boundary-register-no-real-user-media.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-blocker-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-acceptance-register-no-real-user-media.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-proof-handoff-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-no-real-user-media.md',
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
    'readyForLimitedExternalAgentProductToolCallExecutionToday',
    'readyForProductToolCallExecutionToday',
    'readyForRealExternalAgentExecutionToday',
    'limitedExternalAgentProductToolCallExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'realExternalAgentExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media-result',
  ),
  sourceInvocation: parseJsonBlock(
    docs.sourceInvocation,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-invocation-register-no-real-user-media',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-boundary-register-no-real-user-media',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-blocker-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-acceptance-register-no-real-user-media',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-proof-handoff-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2097, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '6d0d2fe82c29db70dc9f02c2464db85936f7fdee',
  'source merge mismatch',
)
assert(parsed.source.planResult.limitedExternalAgentProductToolCallExecutionPlanCreated === true, 'source plan missing')
assert(parsed.source.planResult.planOnly === true, 'source plan-only missing')
assert(parsed.source.planResult.plannedToolCount === 15, 'source tool count mismatch')
assert(parsed.source.planResult.readyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.planResult.readyForLimitedExternalAgentProductToolCallExecutionProofToday === 0, 'source proof today widened')
assert(parsed.source.planResult.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'source execution today widened')
assert(parsed.source.planResult.missingWhatHappenedEvidenceBlocksReadiness === true, 'source evidence blocker missing')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === 15, 'source tool owner count mismatch')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'source limited execution widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceInvocation.plannedProof.futureProofCommandCreatedInThisGate === false, 'source proof command created too early')
assert(parsed.sourceInvocation.plannedProof.futureProofCommandRunInThisGate === false, 'source proof command run too early')
assert(parsed.sourceInvocation.plannedProof.expectedInvocationCount === 4, 'source invocation count mismatch')
assert(parsed.sourceInvocation.plannedProof.expectedToolCountCovered === 15, 'source tool count mismatch')
assert(parsed.sourceInvocation.plannedProof.requireRecordWhatHappened === true, 'source what-happened missing')
assert(parsed.sourceInvocation.plannedProof.missingWhatHappenedEvidenceBlocksReadiness === true, 'source missing evidence blocker missing')
assertArrayEquals(parsed.sourceInvocation.plannedWorkers, expectedWorkers, 'source workers')
assertArrayEquals(parsed.sourceInvocation.plannedImages, expectedImages, 'source images')
assertArrayEquals(parsed.sourceInvocation.plannedJobTypes, expectedJobTypes, 'source job types')
assertArrayEquals(parsed.sourceInvocation.plannedTools, expectedTools, 'source tools')
assert(parsed.sourceBoundary.allowedFutureProofInputs.realUserMediaAllowed === false, 'source boundary real media widened')
assert(parsed.sourceBoundary.requiredFutureProofRuntimeFlags.workerDispatchEnabled === false, 'source boundary worker widened')
assert(parsed.sourceBoundary.requiredFutureProofRuntimeFlags.supabaseMutationEnabled === false, 'source boundary Supabase widened')
assert(parsed.sourceBoundary.requiredFutureProofOutput.recordWhatHappened === true, 'source boundary what happened missing')
assert(parsed.sourceBoundary.requiredFutureProofOutput.recordExternalAgentWasLimitedOrMocked === true, 'source boundary limited agent evidence missing')
assert(parsed.sourceBlockers.readyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === true, 'source blocker owner missing')
assert(parsed.sourceBlockers.readyForLimitedExternalAgentProductToolCallExecutionProofToday === false, 'source blocker proof widened')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === true, 'source policy owner missing')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionProof === false, 'source policy proof widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewLimitedExternalAgentProductToolCallExecutionPlanOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.mayCreateLimitedExternalAgentProductToolCallExecutionProofNext === true, 'prompt proof next missing')
assert(parsed.prompt.reviewScope.requireWhatHappenedEvidenceInFutureProof === true, 'prompt what-happened missing')
assert(parsed.prompt.reviewScope.allowLimitedExternalAgentProductToolCallExecutionProofToday === false, 'prompt proof today widened')
assert(parsed.prompt.reviewScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'prompt limited execution widened')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product widened')
assert(parsed.prompt.reviewScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2099, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '8f653e42e426b7082e9f94f2e64bd4384256c8a5',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.limitedExternalAgentProductToolCallExecutionPlanAccepted === true, 'result plan acceptance missing')
assert(parsed.result.ownerReview.limitedExternalAgentProductToolCallExecutionProofMayProceedNext === true, 'result proof next missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedExpectedInvocationCount === 4, 'result invocation count mismatch')
assert(parsed.result.ownerReview.whatHappenedEvidenceRequired === true, 'result what-happened missing')
assert(parsed.result.ownerReview.missingWhatHappenedEvidenceBlocksReadiness === true, 'result evidence blocker missing')
assert(parsed.result.ownerReview.acceptedForLimitedExternalAgentProductToolCallExecutionProofToday === false, 'result proof today widened')
assert(parsed.result.ownerReview.acceptedForLimitedExternalAgentProductToolCallExecutionToday === false, 'result limited execution widened')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'result product widened')
assert(parsed.result.soundCpuTools.limitedExternalAgentProductToolCallExecutionPlanOwnerReviewed === 15, 'result owner reviewed count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionProofNoRealUserMedia === 15, 'result proof count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result limited execution count widened')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanElements.limitedExternalAgentProductToolCallExecutionPlanCreated === true, 'acceptance plan missing')
assert(parsed.acceptance.acceptedPlanElements.plannedToolCount === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedPlanElements.plannedExpectedInvocationCount === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedPlanElements.missingWhatHappenedEvidenceBlocksReadiness === true, 'acceptance evidence blocker missing')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
assert(parsed.acceptance.acceptedForNextProofOnly.limitedExternalAgentProductToolCallExecutionProofMayProceed === true, 'acceptance proof next missing')
assert(parsed.acceptance.acceptedForNextProofOnly.missingWhatHappenedEvidenceMustBlockReadiness === true, 'acceptance evidence blocker missing')
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'acceptance notAcceptedForToday must remain true')
}

assert(parsed.handoff.nextProofTarget.prompt === nextPrompt, 'handoff prompt mismatch')
assert(parsed.handoff.nextProofTarget.expectedDecision === nextDecision, 'handoff expected mismatch')
assert(parsed.handoff.nextProofTarget.mayCreateProofRunner === true, 'handoff proof runner missing')
assert(parsed.handoff.nextProofTarget.mayRunProofCommandInNextGate === true, 'handoff proof command missing')
assert(parsed.handoff.nextProofTarget.mayUseRealExternalAgents === false, 'handoff real agent widened')
assert(parsed.handoff.nextProofTarget.mayUseRealUserMedia === false, 'handoff real media widened')
assert(parsed.handoff.requiredEvidenceToCarryForward.toolCountCovered === 15, 'handoff tool count mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.expectedInvocationCount === 4, 'handoff invocation count mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.whatHappenedEvidenceRequired === true, 'handoff what happened missing')
assert(parsed.handoff.requiredEvidenceToCarryForward.missingWhatHappenedEvidenceBlocksReadiness === true, 'handoff evidence blocker missing')
assert(parsed.handoff.requiredEvidenceToCarryForward.noSideEffectsRequired === true, 'handoff side effects missing')

assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionProofNoRealUserMedia === true, 'blocker proof missing')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionToday === false, 'blocker limited execution widened')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionProofNoRealUserMedia === 15, 'blocker proof count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'blocker limited execution count widened')
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'missing_what_happened_evidence_blocks_readiness',
  ),
  'missing what-happened blocker absent',
)

assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionPlanOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionProofMayProceedClaimed === true, 'policy proof next missing')
assert(parsed.policy.allowedClaims.missingWhatHappenedEvidenceBlocksReadinessClaimed === true, 'policy evidence blocker missing')
assert(parsed.policy.blockedClaims.limitedExternalAgentProductToolCallExecutionProofPassedClaimed === false, 'policy proof passed widened')
assert(parsed.policy.blockedClaims.limitedExternalAgentProductToolCallExecutionReadyClaimed === false, 'policy limited execution widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product widened')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionProof === true, 'policy proof next missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecutionWithRealAgents === false, 'policy real agent widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.expectedDecisionOnPass === nextDecision, 'next prompt expected mismatch')
assert(parsed.next.proofScope.createLimitedExternalAgentProductToolCallExecutionProofRunner === true, 'next proof runner missing')
assert(parsed.next.proofScope.runLimitedExternalAgentProductToolCallExecutionProofCommand === true, 'next proof command missing')
assert(parsed.next.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'next synthetic missing')
assert(parsed.next.proofScope.recordWhatHappened === true, 'next what-happened missing')
assert(parsed.next.proofScope.missingWhatHappenedEvidenceBlocksReadiness === true, 'next evidence blocker missing')
assert(parsed.next.proofScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.proofScope.expectedInvocationCount === 4, 'next invocation count mismatch')
assert(parsed.next.proofScope.allowRealExternalAgentExecution === false, 'next real agent widened')
assert(parsed.next.proofScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.proofScope.allowWorkerDispatch === false, 'next worker widened')
assert(parsed.next.proofScope.allowSupabaseMutation === false, 'next Supabase widened')
assert(parsed.next.proofScope.allowArtifactCreation === false, 'next artifact widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourceDecision,
      sourcePr: 2099,
      sourceMergeCommit: '8f653e42e426b7082e9f94f2e64bd4384256c8a5',
      acceptedToolCount: 15,
      limitedExternalAgentProductToolCallExecutionProofMayProceedNext: true,
      limitedExternalAgentProductToolCallExecutionToday: 0,
      productToolCallExecutionToday: 0,
      realExternalAgentExecutionToday: 0,
      realUserMediaExecutionToday: 0,
      missingWhatHappenedEvidenceBlocksReadiness: true,
      nextPrompt,
      supabase: 'no-op',
    },
    null,
    2,
  ),
)
