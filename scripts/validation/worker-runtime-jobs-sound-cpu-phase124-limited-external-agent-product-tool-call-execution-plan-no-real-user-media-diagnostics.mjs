import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase123_product_tool_call_execution_readiness_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_plan_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase124_limited_external_agent_product_tool_call_execution_plan_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_plan_owner_review_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase124_limited_external_agent_product_tool_call_execution_plan_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_proof_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE124-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-PLAN-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media-result.md',
  sourceHandoff:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-plan-handoff-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media-result.md',
  invocation:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-invocation-register-no-real-user-media.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-boundary-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-review-no-real-user-media.md',
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
    'allowLimitedExternalAgentProductToolCallExecutionProofToday',
    'allowLimitedExternalAgentProductToolCallExecutionToday',
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
    'readyForLimitedExternalAgentProductToolCallExecutionProofToday',
    'readyForLimitedExternalAgentProductToolCallExecutionToday',
    'readyForProductToolCallExecutionToday',
    'readyForRealExternalAgentExecutionToday',
    'readyForRealUserMediaExecutionToday',
    'limitedExternalAgentProductToolCallExecutionProofPassedClaimed',
    'limitedExternalAgentProductToolCallExecutionReadyClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media-result',
  ),
  sourceHandoff: parseJsonBlock(
    docs.sourceHandoff,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-plan-handoff-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media-result',
  ),
  invocation: parseJsonBlock(
    docs.invocation,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-invocation-register-no-real-user-media',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-boundary-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2096, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'c8287c37ba5d20f3811356372a108d2d6ac7860f',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.limitedExternalAgentProductToolCallExecutionPlanMayProceedNext === true, 'source limited plan permission missing')
assert(parsed.source.ownerReview.whatHappenedEvidenceAccepted === true, 'source what-happened evidence missing')
assert(parsed.source.ownerReview.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.source.ownerReview.acceptedForProductToolCallExecutionToday === false, 'source product widened')
assert(parsed.source.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'source real agent widened')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia === 15, 'source limited plan count mismatch')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'source limited execution count widened')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product execution count widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceHandoff.nextPlanTarget.expectedDecision === decision, 'source handoff expected mismatch')
assert(parsed.sourceHandoff.nextPlanTarget.mayCreateLimitedExternalAgentPlanDocs === true, 'source handoff plan docs missing')
assert(parsed.sourceHandoff.nextPlanTarget.mayRunLimitedExternalAgentProductToolCalls === false, 'source handoff execution widened')
assert(parsed.sourceHandoff.requiredEvidenceToCarryForward.toolCountReconciled === 15, 'source handoff tool count mismatch')
assert(parsed.sourceHandoff.requiredEvidenceToCarryForward.whatHappenedEvidenceCarriedForward === true, 'source handoff what-happened missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecisionOnPass === decision, 'prompt expected mismatch')
assert(parsed.prompt.planScope.planLimitedExternalAgentProductToolCalls === true, 'prompt plan scope mismatch')
assert(parsed.prompt.planScope.requireSyntheticOrNoMediaInputsOnly === true, 'prompt no media missing')
assert(parsed.prompt.planScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.planScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'prompt limited execution widened')
assert(parsed.prompt.planScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.planScope.allowWorkerDispatchToday === false, 'prompt worker widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2097, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '6d0d2fe82c29db70dc9f02c2464db85936f7fdee',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.limitedExternalAgentProductToolCallExecutionPlanCreated === true, 'result plan missing')
assert(parsed.result.planResult.planOnly === true, 'result plan-only missing')
assert(parsed.result.planResult.useSyntheticOrNoMediaInputsOnly === true, 'result no media missing')
assert(parsed.result.planResult.requireWhatHappenedEvidenceRecorded === true, 'result what-happened missing')
assert(parsed.result.planResult.requireOwnerProofToPasteWhatHappened === true, 'result owner evidence requirement missing')
assert(parsed.result.planResult.missingWhatHappenedEvidenceBlocksReadiness === true, 'result missing-evidence blocker missing')
assert(parsed.result.planResult.plannedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.planResult.readyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === 15, 'result owner review count mismatch')
assert(parsed.result.planResult.readyForLimitedExternalAgentProductToolCallExecutionProofToday === 0, 'result proof today widened')
assert(parsed.result.planResult.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result limited execution today widened')
assert(parsed.result.planResult.readyForProductToolCallExecutionToday === 0, 'result product today widened')
assert(parsed.result.planResult.readyForRealExternalAgentExecutionToday === 0, 'result real agent widened')
for (const key of [
  'externalAgentCalled',
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
  assert(parsed.result.planResult[key] === false, `result ${key} widened`)
}
assert(parsed.result.soundCpuTools.limitedExternalAgentProductToolCallExecutionPlanCreated === 15, 'result tool plan count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === 15, 'result tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result tool limited execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.invocation.plannedProof.futureProofCommandCreatedInThisGate === false, 'future proof command created too early')
assert(parsed.invocation.plannedProof.futureProofCommandRunInThisGate === false, 'future proof command run too early')
assert(parsed.invocation.plannedProof.expectedInvocationCount === 4, 'future invocation count mismatch')
assert(parsed.invocation.plannedProof.expectedToolCountCovered === 15, 'future tool count mismatch')
assert(parsed.invocation.plannedProof.requireRecordWhatHappened === true, 'future what-happened missing')
assert(parsed.invocation.plannedProof.requireOwnerProofToPasteWhatHappened === true, 'future owner proof missing')
assert(parsed.invocation.plannedProof.missingWhatHappenedEvidenceBlocksReadiness === true, 'future missing evidence blocker missing')
assertArrayEquals(parsed.invocation.plannedWorkers, expectedWorkers, 'planned workers')
assertArrayEquals(parsed.invocation.plannedImages, expectedImages, 'planned images')
assertArrayEquals(parsed.invocation.plannedJobTypes, expectedJobTypes, 'planned job types')
assertArrayEquals(parsed.invocation.plannedTools, expectedTools, 'planned tools')

assert(parsed.boundary.allowedFutureProofInputs.syntheticOrNoMediaInputsOnly === true, 'boundary synthetic missing')
assert(parsed.boundary.allowedFutureProofInputs.realUserMediaAllowed === false, 'boundary real media widened')
assert(parsed.boundary.allowedFutureProofInputs.signedUrlsAllowed === false, 'boundary signed URL widened')
assert(parsed.boundary.allowedFutureProofInputs.rawPromptsAllowed === false, 'boundary raw prompt widened')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.limitedExternalAgentProductToolCallBoundaryOnly === true, 'boundary limited product-only missing')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.realExternalAgentExecutionEnabled === false, 'boundary real agent widened')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.workerDispatchEnabled === false, 'boundary worker widened')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.supabaseMutationEnabled === false, 'boundary Supabase widened')
assert(parsed.boundary.requiredFutureProofOutput.recordWhatHappened === true, 'boundary what-happened missing')
assert(parsed.boundary.requiredFutureProofOutput.recordExternalAgentWasLimitedOrMocked === true, 'boundary external-agent evidence missing')
assert(parsed.boundary.requiredFutureProofOutput.writeFullPayloadToDisk === false, 'boundary payload widened')

assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === true, 'blocker owner review missing')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionProofToday === false, 'blocker proof widened')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionToday === false, 'blocker limited execution widened')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === 15, 'blocker owner count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'blocker limited execution count widened')
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'missing_what_happened_evidence_blocks_readiness',
  ),
  'missing what-happened blocker absent',
)

assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionPlanCreatedClaimed === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionPlanOwnerReviewMayProceedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceRequiredClaimed === true, 'policy what-happened missing')
assert(parsed.policy.blockedClaims.limitedExternalAgentProductToolCallExecutionProofPassedClaimed === false, 'policy proof widened')
assert(parsed.policy.blockedClaims.limitedExternalAgentProductToolCallExecutionReadyClaimed === false, 'policy limited execution widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product widened')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionPlanOwnerReview === true, 'policy next missing')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionProof === false, 'policy proof execution widened')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecution === false, 'policy limited execution widened')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.next.reviewScope.reviewLimitedExternalAgentProductToolCallExecutionPlanOnly === true, 'next prompt scope mismatch')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next prompt tool count mismatch')
assert(parsed.next.reviewScope.mayCreateLimitedExternalAgentProductToolCallExecutionProofNext === true, 'next prompt proof next missing')
assert(parsed.next.reviewScope.requireWhatHappenedEvidenceInFutureProof === true, 'next prompt what-happened missing')
assert(parsed.next.reviewScope.allowLimitedExternalAgentProductToolCallExecutionProofToday === false, 'next prompt proof today widened')
assert(parsed.next.reviewScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'next prompt limited execution widened')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next prompt product widened')
assert(parsed.next.reviewScope.allowRealExternalAgentExecutionToday === false, 'next prompt real agent widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next prompt real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourceDecision,
      sourcePr: 2097,
      sourceMergeCommit: '6d0d2fe82c29db70dc9f02c2464db85936f7fdee',
      plannedToolCount: 15,
      readyForLimitedExternalAgentProductToolCallExecutionPlanOwnerReview: 15,
      limitedExternalAgentProductToolCallExecutionProofToday: 0,
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
