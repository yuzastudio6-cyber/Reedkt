import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase116_limited_no_real_media_tool_execution_preflight_completed_with_warnings_ready_for_controlled_limited_no_real_media_tool_execution_proof'
const decision =
  'worker_runtime_jobs_sound_cpu_phase117_controlled_limited_no_real_media_tool_execution_proof_passed_with_warnings_ready_for_limited_no_real_media_tool_execution_proof_owner_review'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE117-LIMITED-NO-REAL-MEDIA-TOOL-EXECUTION-PROOF-OWNER-REVIEW'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight-result.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-boundary-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-result.md',
  output:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-output-register.md',
  sideEffects:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-no-side-effect-register.md',
  coverage:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-tool-coverage-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review.md',
}

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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must be false`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight-result',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-boundary-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-result',
  ),
  output: parseJsonBlock(
    docs.output,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-output-register',
  ),
  sideEffects: parseJsonBlock(
    docs.sideEffects,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-no-side-effect-register',
  ),
  coverage: parseJsonBlock(
    docs.coverage,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-tool-coverage-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2075, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'd6051e287d2fca6a32e77713c57b0de25fc9b28d',
  'source upstream merge mismatch',
)
assert(parsed.source.preflightResult.controlledLimitedNoRealMediaToolExecutionProofMayProceedNext === true, 'source proof permission missing')
assert(parsed.source.preflightResult.vagueOwnerProofAccepted === false, 'source accepted vague proof')
assert(parsed.source.soundCpuTools.readyForControlledLimitedNoRealMediaToolExecutionProof === 15, 'source proof count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product count widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE117-CONTROLLED-LIMITED-NO-REAL-MEDIA-TOOL-EXECUTION-PROOF', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceBoundary.allowedNextProofEnvelope.controlledLimitedNoRealMediaToolExecutionProof === true, 'source boundary proof missing')
assert(parsed.sourceBoundary.allowedNextProofEnvelope.requiresSanitizedWhatHappenedOutput === true, 'source boundary what-happened missing')
assertAllFalse(parsed.sourceBoundary.mustRemainFalseInNextProof, 'source boundary false flags')
assert(parsed.sourcePolicy.nextGateMayRunControlledLimitedNoRealMediaToolExecutionProof === true, 'source policy proof missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.proofScope.mayRunControlledLimitedNoRealMediaToolExecutionProof === true, 'prompt proof permission missing')
assert(parsed.prompt.proofScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.proofScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.proofScope.allowWorkerDispatchToday === false, 'prompt worker widened')
assert(parsed.prompt.proofScope.allowRouteExecutionToday === false, 'prompt route widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2076, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '023cdb2111c1403c753427ab81c4c36e3843d67e',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.proofResult.status === 'passed', 'proof did not pass')
assert(parsed.result.proofResult.proofKind === 'controlled_limited_no_real_media_tool_execution_boundary', 'proof kind mismatch')
assert(parsed.result.proofResult.sourceDecisionVerified === true, 'proof source not verified')
assert(parsed.result.proofResult.controlledLimitedNoRealMediaBoundaryInvoked === true, 'proof boundary not invoked')
assert(parsed.result.proofResult.proofCommandRunCount === 2, 'proof run count mismatch')
assert(parsed.result.proofResult.invocationCount === 4, 'proof invocation count mismatch')
assert(parsed.result.proofResult.totalSyntheticBoundaryInvocationsObserved === 8, 'proof total invocation count mismatch')
assert(parsed.result.proofResult.acceptedToolCount === 15, 'proof accepted tool count mismatch')
assert(parsed.result.proofResult.toolCountCovered === 15, 'proof coverage mismatch')
assert(parsed.result.proofResult.runtimeFlagsAllFalse === true, 'runtime flags not false')
assert(parsed.result.proofResult.realUserMediaUsed === false, 'real media used')
assert(parsed.result.proofResult.workerDispatched === false, 'worker dispatched')
assert(parsed.result.proofResult.routeExecuted === false, 'route executed')
assert(parsed.result.proofResult.mediaOpened === false, 'media opened')
assert(parsed.result.proofResult.supabaseTouched === false, 'Supabase touched')
assert(parsed.result.proofResult.artifactCreated === false, 'artifact created')
assert(parsed.result.soundCpuTools.controlledLimitedNoRealMediaToolExecutionProofPassed === 15, 'result proof tool count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedNoRealMediaToolExecutionProofOwnerReview === 15, 'result owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.proofCommand === 'npm run worker-runtime-jobs:sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof:proof', 'proof command mismatch')
assert(parsed.output.sanitizedProofOutput.status === 'passed', 'output status mismatch')
assert(parsed.output.sanitizedProofOutput.proofCommandRunCount === 2, 'output proof run count mismatch')
assert(parsed.output.sanitizedProofOutput.invocationCount === 4, 'output invocation mismatch')
assert(parsed.output.sanitizedProofOutput.totalSyntheticBoundaryInvocationsObserved === 8, 'output total invocation mismatch')
assert(parsed.output.sanitizedProofOutput.toolCountCovered === 15, 'output coverage mismatch')
assert(parsed.output.sanitizedProofOutput.realUserMediaUsed === false, 'output real media widened')
assert(parsed.output.sanitizedProofOutput.workerDispatched === false, 'output worker widened')
assert(parsed.output.sanitizedProofOutput.routeExecuted === false, 'output route widened')
assert(parsed.output.proofOutputWrittenToDisk === false, 'proof output written')
assert(parsed.output.tempProofArtifactsCreated === false, 'temp proof artifacts created')
assert(parsed.output.fullPayloadRetained === false, 'full payload retained')

assertAllFalse(parsed.sideEffects.verifiedFalse, 'verifiedFalse')
assert(parsed.sideEffects.artifactPolicy.proofOutputWrittenToDisk === false, 'side effect proof output written')
assert(parsed.sideEffects.artifactPolicy.tempProofArtifactsCreated === false, 'side effect temp artifacts created')
assert(parsed.sideEffects.artifactPolicy.fullPayloadRetained === false, 'side effect full payload retained')

assert(parsed.coverage.soundCpuToolSet.totalToolsInLane === 15, 'coverage total mismatch')
assertArrayEquals(parsed.coverage.soundCpuToolSet.toolsCovered, expectedTools, 'coverage tools')
assert(parsed.coverage.soundCpuToolSet.readyForLimitedNoRealMediaToolExecutionProofOwnerReview === 15, 'coverage owner review count mismatch')
assert(parsed.coverage.soundCpuToolSet.readyForProductToolCallExecutionToday === 0, 'coverage product count widened')
assertArrayEquals(parsed.coverage.workersCovered, expectedWorkers, 'coverage workers')
assertArrayEquals(parsed.coverage.imagesCovered, expectedImages, 'coverage images')
assertArrayEquals(parsed.coverage.jobTypesCovered, expectedJobTypes, 'coverage job types')

assert(parsed.blockers.readyForLimitedNoRealMediaToolExecutionProofOwnerReview === true, 'blocker owner review missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedNoRealMediaToolExecutionProofOwnerReview === 15, 'blocker owner review count mismatch')
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'limited_no_real_media_tool_execution_proof_owner_review_pending',
  ),
  'owner review blocker missing',
)

assert(parsed.policy.allowedClaims.controlledLimitedNoRealMediaToolExecutionProofPassed === true, 'policy proof claim missing')
assert(parsed.policy.allowedClaims.limitedNoRealMediaToolExecutionProofOwnerReviewMayProceedNext === true, 'policy owner review next missing')
assert(parsed.policy.allowedClaims.soundCpuToolsCoveredByControlledProof === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayReviewControlledLimitedNoRealMediaProof === true, 'policy next review missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase117_limited_no_real_media_tool_execution_proof_owner_review_passed_with_warnings_ready_for_product_tool_execution_gate_plan_no_real_user_media',
  'next expected mismatch',
)
assert(parsed.next.reviewScope.reviewControlledLimitedNoRealMediaProofOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayPlanProductToolExecutionGateNext === true, 'next gate planning missing')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      proofStatus: parsed.result.proofResult.status,
      readyForLimitedNoRealMediaToolExecutionProofOwnerReview:
        parsed.result.soundCpuTools.readyForLimitedNoRealMediaToolExecutionProofOwnerReview,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
