import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase118_product_tool_execution_gate_owner_review_passed_with_warnings_ready_for_controlled_product_tool_execution_proof_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase119_controlled_product_tool_execution_proof_passed_with_warnings_ready_for_controlled_product_tool_execution_proof_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE119-CONTROLLED-PRODUCT-TOOL-EXECUTION-PROOF-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-acceptance-register-no-real-user-media.md',
  sourceProofPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-proof-plan-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media.md',
  runner:
    'scripts/validation/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media-runner.mjs',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media-result.md',
  output:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-output-register-no-real-user-media.md',
  sideEffects:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-no-side-effect-register.md',
  coverage:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-tool-coverage-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media.md',
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
    'realUserMediaAllowed',
    'workerDispatchAllowed',
    'routeExecutionAllowed',
    'manifestPersistenceAllowed',
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
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-acceptance-register-no-real-user-media',
  ),
  sourceProofPlan: parseJsonBlock(
    docs.sourceProofPlan,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-proof-plan-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media-result',
  ),
  output: parseJsonBlock(
    docs.output,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-output-register-no-real-user-media',
  ),
  sideEffects: parseJsonBlock(
    docs.sideEffects,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-no-side-effect-register',
  ),
  coverage: parseJsonBlock(
    docs.coverage,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-tool-coverage-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)
assert(read(docs.runner).includes('invokeControlledProductToolExecutionBoundary'), 'runner boundary missing')
assert(read(docs.runner).includes('proofOutputWrittenToDisk: false'), 'runner output policy missing')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2081, 'source source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '064f890964eb9c2d150c1bbc1d5775ed081f109e',
  'source source merge mismatch',
)
assert(parsed.source.ownerReview.controlledProductToolExecutionProofMayProceedNext === true, 'source proof next missing')
assert(parsed.source.ownerReview.ownerEvidenceMustRecordWhatHappened === true, 'source evidence rule missing')
assert(parsed.source.soundCpuTools.readyForControlledProductToolExecutionProofNoRealUserMedia === 15, 'source proof count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product widened')
assert(parsed.sourceAcceptance.acceptedForNextProofOnly.whatHappenedEvidenceMustBeRecorded === true, 'source acceptance evidence rule missing')
assert(parsed.sourceProofPlan.requiredBeforeNextProof.whatHappenedEvidenceRequired === true, 'source proof evidence rule missing')
assert(parsed.sourceProofPlan.nextProofTarget.proofMayRunInThisOwnerReview === false, 'source proof ran too early')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecisionOnPass === decision, 'prompt expected mismatch')
assert(parsed.prompt.proofScope.runControlledProductToolExecutionBoundary === true, 'prompt proof boundary missing')
assert(parsed.prompt.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'prompt no-media missing')
assert(parsed.prompt.proofScope.recordWhatHappened === true, 'prompt what-happened missing')
assert(parsed.prompt.proofScope.allowedToolCount === 15, 'prompt tool count mismatch')
assertArrayEquals(parsed.prompt.proofScope.allowedWorkers, expectedWorkers, 'prompt workers')
assertArrayEquals(parsed.prompt.proofScope.allowedImages, expectedImages, 'prompt images')
assertArrayEquals(parsed.prompt.proofScope.allowedJobTypes, expectedJobTypes, 'prompt job types')
assert(parsed.prompt.proofScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.proofScope.allowWorkerDispatch === false, 'prompt worker widened')
assert(parsed.prompt.proofScope.allowRouteExecution === false, 'prompt route widened')
assert(parsed.prompt.proofScope.allowManifestPersistence === false, 'prompt manifest widened')
assert(parsed.prompt.proofScope.allowMediaOpen === false, 'prompt media widened')
assert(parsed.prompt.proofScope.allowSupabaseMutation === false, 'prompt Supabase widened')
assert(parsed.prompt.proofScope.allowArtifactCreation === false, 'prompt artifact widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2082, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'f16f0caab3e581ea968af6f45d45fb24f57080c8',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.proofResult.status === 'passed', 'proof status mismatch')
assert(parsed.result.proofResult.proofCommandRunCount === 1, 'proof run count mismatch')
assert(parsed.result.proofResult.totalSyntheticBoundaryInvocationsObserved === 4, 'proof total invocation mismatch')
assert(parsed.result.proofResult.toolCountCovered === 15, 'proof tool count mismatch')
assert(parsed.result.proofResult.recordWhatHappened === true, 'proof what-happened missing')
assert(parsed.result.proofResult.realUserMediaUsed === false, 'proof real media widened')
assert(parsed.result.proofResult.workerDispatched === false, 'proof worker widened')
assert(parsed.result.proofResult.routeExecuted === false, 'proof route widened')
assert(parsed.result.proofResult.manifestPersisted === false, 'proof manifest widened')
assert(parsed.result.proofResult.mediaOpened === false, 'proof media widened')
assert(parsed.result.proofResult.supabaseTouched === false, 'proof Supabase widened')
assert(parsed.result.proofResult.artifactCreated === false, 'proof artifact widened')
assert(parsed.result.soundCpuTools.controlledProductToolExecutionProofPassed === 15, 'tool proof count mismatch')
assert(parsed.result.soundCpuTools.readyForControlledProductToolExecutionProofOwnerReview === 15, 'tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'tool product widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'tool real widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.sanitizedProofOutput.status === 'passed', 'output proof status mismatch')
assert(parsed.output.sanitizedProofOutput.proofCommandRunCount === 1, 'output run count mismatch')
assert(parsed.output.sanitizedProofOutput.invocationCount === 4, 'output invocation count mismatch')
assert(parsed.output.sanitizedProofOutput.toolCountCovered === 15, 'output tool count mismatch')
assert(parsed.output.proofOutputWrittenToDisk === false, 'proof output written')
assert(parsed.output.tempProofArtifactsCreated === false, 'temp proof artifacts created')
assert(parsed.output.fullPayloadRetained === false, 'full payload retained')
assertAllFalse(parsed.sideEffects.verifiedFalse, 'side effect register')
assert(parsed.coverage.soundCpuToolSet.totalToolsInLane === 15, 'coverage tool count mismatch')
assertArrayEquals(parsed.coverage.soundCpuToolSet.tools, expectedTools, 'coverage tools')
assertArrayEquals(parsed.coverage.workersCovered, expectedWorkers, 'coverage workers')
assertArrayEquals(parsed.coverage.imagesCovered, expectedImages, 'coverage images')
assertArrayEquals(parsed.coverage.jobTypesCovered, expectedJobTypes, 'coverage job types')
assert(parsed.coverage.coverageKind === 'controlled_product_tool_execution_boundary_no_real_user_media', 'coverage kind mismatch')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'controlled_product_tool_execution_proof_pending',
  ),
  'proof blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'controlled_product_tool_execution_proof_owner_review_pending',
  ),
  'owner review blocker missing',
)
assert(parsed.blockers.readyForControlledProductToolExecutionProofOwnerReview === true, 'owner review readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'product today widened')
assert(parsed.blockers.soundCpuToolsReadyForControlledProductToolExecutionProofOwnerReview === 15, 'blocker tool count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker product count widened')

assert(parsed.policy.allowedClaims.controlledProductToolExecutionProofPassedClaimed === true, 'policy proof claim missing')
assert(parsed.policy.allowedClaims.controlledProductToolExecutionProofOwnerReviewMayProceedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceRecordedClaimed === true, 'policy evidence claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunControlledProductToolExecutionProofOwnerReview === true, 'policy next owner review missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product widened')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'policy real media widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'policy dispatch widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewControlledProductToolExecutionProofOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayReconcileExternalAgentProductToolExecutionReadinessNext === true, 'next reconciliation missing')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next product today widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.reviewScope.allowWorkerDispatchToday === false, 'next worker widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      proofCommandRunCount: parsed.result.proofResult.proofCommandRunCount,
      controlledProductToolExecutionProofPassed:
        parsed.result.soundCpuTools.controlledProductToolExecutionProofPassed,
      readyForControlledProductToolExecutionProofOwnerReview:
        parsed.result.soundCpuTools.readyForControlledProductToolExecutionProofOwnerReview,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
