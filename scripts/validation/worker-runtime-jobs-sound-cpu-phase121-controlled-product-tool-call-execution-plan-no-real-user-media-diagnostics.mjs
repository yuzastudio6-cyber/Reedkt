import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase120_external_agent_product_tool_execution_readiness_owner_review_passed_with_warnings_ready_for_controlled_product_tool_call_execution_plan_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase121_controlled_product_tool_call_execution_plan_no_real_user_media_completed_with_warnings_ready_for_controlled_product_tool_call_execution_plan_owner_review_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase121_controlled_product_tool_call_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_product_tool_call_execution_proof_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE121-CONTROLLED-PRODUCT-TOOL-CALL-EXECUTION-PLAN-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-acceptance-register-no-real-user-media.md',
  sourceHandoff:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-plan-handoff-register-no-real-user-media.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-blocker-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-no-real-user-media-result.md',
  invocation:
    'docs/worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-invocation-register-no-real-user-media.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-boundary-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-owner-review-no-real-user-media.md',
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
    'allowControlledProductToolCallExecutionProofToday',
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
    'readyForControlledProductToolCallExecutionProofToday',
    'readyForProductToolCallExecutionToday',
    'readyForRealExternalAgentExecutionToday',
    'readyForRealUserMediaExecutionToday',
    'controlledProductToolCallExecutionProofPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-acceptance-register-no-real-user-media',
  ),
  sourceHandoff: parseJsonBlock(
    docs.sourceHandoff,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-plan-handoff-register-no-real-user-media',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-blocker-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-no-real-user-media-result',
  ),
  invocation: parseJsonBlock(
    docs.invocation,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-invocation-register-no-real-user-media',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-boundary-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2087, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'd7a1986fe6133eb6f01d3414c88c80e42e2ff730',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.controlledProductToolCallExecutionPlanMayProceedNext === true, 'source plan permission missing')
assert(parsed.source.ownerReview.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.source.ownerReview.acceptedForProductToolCallExecutionToday === false, 'source product widened')
assert(parsed.source.soundCpuTools.readyForControlledProductToolCallExecutionPlanNoRealUserMedia === 15, 'source plan count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product count widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedReadinessEvidence.phase120ReadinessReconciliationAccepted === true, 'source acceptance reconciliation missing')
assert(parsed.sourceAcceptance.acceptedReadinessEvidence.whatHappenedEvidenceRecorded === true, 'source acceptance evidence missing')
assert(parsed.sourceAcceptance.acceptedReadinessEvidence.toolCountCovered === 15, 'source acceptance tool count mismatch')
assertArrayEquals(parsed.sourceAcceptance.acceptedWorkers, expectedWorkers, 'source workers')
assertArrayEquals(parsed.sourceAcceptance.acceptedImages, expectedImages, 'source images')
assertArrayEquals(parsed.sourceAcceptance.acceptedJobTypes, expectedJobTypes, 'source job types')
assert(parsed.sourceHandoff.nextPlanTarget.expectedDecision === decision, 'source handoff expected mismatch')
assert(parsed.sourceHandoff.nextPlanTarget.mayCreatePlan === true, 'source handoff plan missing')
assert(parsed.sourceHandoff.nextPlanTarget.mayExecuteProductToolCalls === false, 'source handoff execution widened')
assert(parsed.sourceHandoff.requiredEvidenceToCarryForward.toolCountCovered === 15, 'source handoff tool count mismatch')
assert(parsed.sourceBlockers.readyForControlledProductToolCallExecutionPlanNoRealUserMedia === true, 'source blocker plan missing')
assert(parsed.sourcePolicy.nextGateMayRunControlledProductToolCallExecutionPlan === true, 'source policy next plan missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planScope.planControlledProductToolCallExecutionOnly === true, 'prompt plan scope mismatch')
assert(parsed.prompt.planScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.planScope.useSyntheticOrNoMediaInputsOnly === true, 'prompt no media missing')
assert(parsed.prompt.planScope.requireWhatHappenedEvidenceRecorded === true, 'prompt what-happened missing')
assert(parsed.prompt.planScope.allowProductToolCallExecutionToday === false, 'prompt product widened')
assert(parsed.prompt.planScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.planScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2088, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '3eeabf9b66ad80c29da60a9e8cd38ddfe50c4f3c',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planResult.controlledProductToolCallExecutionPlanCreated === true, 'result plan missing')
assert(parsed.result.planResult.planOnly === true, 'result plan-only missing')
assert(parsed.result.planResult.useSyntheticOrNoMediaInputsOnly === true, 'result no media missing')
assert(parsed.result.planResult.requireWhatHappenedEvidenceRecorded === true, 'result what-happened missing')
assert(parsed.result.planResult.plannedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.planResult.readyForControlledProductToolCallExecutionPlanOwnerReview === 15, 'result owner review count mismatch')
assert(parsed.result.planResult.readyForControlledProductToolCallExecutionProofToday === 0, 'result proof today widened')
assert(parsed.result.planResult.readyForProductToolCallExecutionToday === 0, 'result product today widened')
assert(parsed.result.planResult.readyForRealExternalAgentExecutionToday === 0, 'result real agent widened')
for (const key of [
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
assert(parsed.result.soundCpuTools.controlledProductToolCallExecutionPlanCreated === 15, 'result tool plan count mismatch')
assert(parsed.result.soundCpuTools.readyForControlledProductToolCallExecutionPlanOwnerReview === 15, 'result tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result tool product widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.invocation.plannedProof.futureProofCommandCreatedInThisGate === false, 'future proof command created too early')
assert(parsed.invocation.plannedProof.futureProofCommandRunInThisGate === false, 'future proof command run too early')
assert(parsed.invocation.plannedProof.expectedInvocationCount === 4, 'future invocation count mismatch')
assert(parsed.invocation.plannedProof.expectedToolCountCovered === 15, 'future tool count mismatch')
assert(parsed.invocation.plannedProof.requireRecordWhatHappened === true, 'future what-happened missing')
assertArrayEquals(parsed.invocation.plannedWorkers, expectedWorkers, 'planned workers')
assertArrayEquals(parsed.invocation.plannedImages, expectedImages, 'planned images')
assertArrayEquals(parsed.invocation.plannedJobTypes, expectedJobTypes, 'planned job types')
assertArrayEquals(parsed.invocation.plannedTools, expectedTools, 'planned tools')

assert(parsed.boundary.allowedFutureProofInputs.syntheticOrNoMediaInputsOnly === true, 'boundary synthetic missing')
assert(parsed.boundary.allowedFutureProofInputs.realUserMediaAllowed === false, 'boundary real media widened')
assert(parsed.boundary.allowedFutureProofInputs.signedUrlsAllowed === false, 'boundary signed URL widened')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.productToolCallExecutionBoundaryOnly === true, 'boundary product-only missing')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.realExternalAgentExecutionEnabled === false, 'boundary real agent widened')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.workerDispatchEnabled === false, 'boundary worker widened')
assert(parsed.boundary.requiredFutureProofRuntimeFlags.supabaseMutationEnabled === false, 'boundary Supabase widened')
assert(parsed.boundary.requiredFutureProofOutput.recordWhatHappened === true, 'boundary what-happened missing')
assert(parsed.boundary.requiredFutureProofOutput.writeFullPayloadToDisk === false, 'boundary payload widened')

assert(parsed.blockers.readyForControlledProductToolCallExecutionPlanOwnerReview === true, 'blocker owner review missing')
assert(parsed.blockers.readyForControlledProductToolCallExecutionProofToday === false, 'blocker proof widened')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForControlledProductToolCallExecutionPlanOwnerReview === 15, 'blocker owner count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker product count widened')

assert(parsed.policy.allowedClaims.controlledProductToolCallExecutionPlanCreatedClaimed === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.controlledProductToolCallExecutionPlanOwnerReviewMayProceedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceRequiredClaimed === true, 'policy what-happened missing')
assert(parsed.policy.blockedClaims.controlledProductToolCallExecutionProofPassedClaimed === false, 'policy proof widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product widened')
assert(parsed.policy.nextGateMayRunControlledProductToolCallExecutionPlanOwnerReview === true, 'policy next missing')
assert(parsed.policy.nextGateMayRunControlledProductToolCallExecutionProof === false, 'policy proof execution widened')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.next.reviewScope.reviewControlledProductToolCallExecutionPlanOnly === true, 'next prompt scope mismatch')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next prompt tool count mismatch')
assert(parsed.next.reviewScope.mayCreateControlledProductToolCallExecutionProofNext === true, 'next prompt proof next missing')
assert(parsed.next.reviewScope.allowControlledProductToolCallExecutionProofToday === false, 'next prompt proof today widened')
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
      sourcePr: 2088,
      sourceMergeCommit: '3eeabf9b66ad80c29da60a9e8cd38ddfe50c4f3c',
      plannedToolCount: 15,
      readyForControlledProductToolCallExecutionPlanOwnerReview: 15,
      controlledProductToolCallExecutionProofToday: 0,
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
