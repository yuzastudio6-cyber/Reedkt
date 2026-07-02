import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase118_product_tool_execution_gate_plan_no_real_user_media_completed_with_warnings_ready_for_product_tool_execution_gate_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase118_product_tool_execution_gate_owner_review_passed_with_warnings_ready_for_controlled_product_tool_execution_proof_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE119-CONTROLLED-PRODUCT-TOOL-EXECUTION-PROOF-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-result.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-scope-register.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-evidence-register.md',
  sourceStops:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-stop-conditions.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-acceptance-register-no-real-user-media.md',
  proofPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-proof-plan-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media.md',
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
    'allowControlledProductToolExecutionProofToday',
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
    'acceptedForControlledProductToolExecutionProofToday',
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
    'workerDispatchAllowed',
    'routeExecutionAllowed',
    'manifestPersistenceAllowed',
    'supabaseSqlStorageArtifactAllowed',
    'controlledProductToolExecutionProofPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-result',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-scope-register',
  ),
  sourceEvidence: parseJsonBlock(
    docs.sourceEvidence,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-evidence-register',
  ),
  sourceStops: parseJsonBlock(
    docs.sourceStops,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-stop-conditions',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-acceptance-register-no-real-user-media',
  ),
  proofPlan: parseJsonBlock(
    docs.proofPlan,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-proof-plan-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase119-controlled-product-tool-execution-proof-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2079, 'source source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '6d955eca1736e362cb0bc68cd40db1ca5b132e4b',
  'source source merge mismatch',
)
assert(parsed.source.gatePlanResult.productToolExecutionGatePlanCreated === true, 'source gate plan missing')
assert(parsed.source.gatePlanResult.gatePlanOnly === true, 'source gate-only missing')
assert(parsed.source.gatePlanResult.readyForProductToolExecutionGateOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.gatePlanResult.readyForControlledProductToolExecutionProofToday === 0, 'source proof widened')
assert(parsed.source.gatePlanResult.readyForProductToolCallExecutionToday === 0, 'source product widened')
assert(parsed.source.gatePlanResult.realUserMediaAllowed === false, 'source real media widened')
assert(parsed.source.soundCpuTools.readyForProductToolExecutionGateOwnerReview === 15, 'source tool owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceScope.plannedGateEnvelope.toolCount === 15, 'source scope tool count mismatch')
assertArrayEquals(parsed.sourceScope.plannedGateEnvelope.workers, expectedWorkers, 'source scope workers')
assertArrayEquals(parsed.sourceScope.plannedGateEnvelope.images, expectedImages, 'source scope images')
assertArrayEquals(parsed.sourceScope.plannedGateEnvelope.jobTypes, expectedJobTypes, 'source scope job types')
assert(parsed.sourceScope.plannedGateEnvelope.inputPolicy.syntheticOrNoMediaOnly === true, 'source scope synthetic missing')
assert(parsed.sourceScope.plannedGateEnvelope.inputPolicy.realUserMediaAllowed === false, 'source scope real media widened')
assert(parsed.sourceScope.plannedGateEnvelope.runtimePolicy.productToolCallExecutionAllowedToday === false, 'source scope product widened')
assert(parsed.sourceScope.plannedGateEnvelope.runtimePolicy.workerDispatchAllowedToday === false, 'source scope worker widened')

assert(parsed.sourceEvidence.requiredSourceEvidence.phase117OwnerReviewPr === 2079, 'source evidence PR mismatch')
assert(parsed.sourceEvidence.requiredSourceEvidence.proofCommandRunCount === 2, 'source evidence run count mismatch')
assert(parsed.sourceEvidence.requiredSourceEvidence.totalSyntheticBoundaryInvocationsObserved === 8, 'source evidence invocation mismatch')
assert(parsed.sourceEvidence.requiredSourceEvidence.toolCount === 15, 'source evidence tool count mismatch')
assertAllTrue(parsed.sourceEvidence.requiredBeforeAnyFutureControlledProof, 'source future proof requirements')
assert(parsed.sourceEvidence.evidenceMustIncludeWhatHappened.required === true, 'source what-happened missing')

assert(
  parsed.sourceStops.futureGateMustStopOn.includes('owner proof or owner review does not record what happened'),
  'source stop what-happened missing',
)
assert(parsed.sourceStops.futureGateMustStopOn.includes('real user media path'), 'source stop real media missing')
assert(parsed.sourceBlockers.readyForProductToolExecutionGateOwnerReview === true, 'source blocker owner review missing')
assert(parsed.sourceBlockers.readyForControlledProductToolExecutionProofToday === false, 'source blocker proof widened')
assert(parsed.sourcePolicy.nextGateMayRunProductToolExecutionGateOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunControlledProductToolExecutionProof === false, 'source policy proof widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewProductToolExecutionGatePlanOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayAcceptControlledProductToolExecutionProofNext === true, 'prompt proof next missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.allowControlledProductToolExecutionProofToday === false, 'prompt proof today widened')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product today widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2081, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '064f890964eb9c2d150c1bbc1d5775ed081f109e',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.productToolExecutionGatePlanAccepted === true, 'owner gate acceptance missing')
assert(parsed.result.ownerReview.controlledProductToolExecutionProofMayProceedNext === true, 'owner proof next missing')
assert(parsed.result.ownerReview.ownerEvidenceMustRecordWhatHappened === true, 'owner evidence rule missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'owner accepted tool count mismatch')
assert(parsed.result.ownerReview.acceptedForControlledProductToolExecutionProofToday === false, 'owner proof today widened')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'owner product widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaToday === false, 'owner real media widened')
assert(parsed.result.soundCpuTools.readyForControlledProductToolExecutionProofNoRealUserMedia === 15, 'proof readiness count mismatch')
assert(parsed.result.soundCpuTools.readyForControlledProductToolExecutionProofToday === 0, 'proof today widened')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'product today widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real today widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedGatePlanElements.productToolExecutionGatePlanCreated === true, 'acceptance gate missing')
assert(parsed.acceptance.acceptedGatePlanElements.evidenceMustRecordWhatHappened === true, 'acceptance evidence rule missing')
assert(parsed.acceptance.acceptedGatePlanElements.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedGatePlanElements.readyForControlledProductToolExecutionProofToday === 0, 'acceptance proof today widened')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
assertAllTrue(parsed.acceptance.acceptedForNextProofOnly, 'acceptedForNextProofOnly')
assertAllTrue(parsed.acceptance.notAcceptedForToday, 'notAcceptedForToday')

assert(parsed.proofPlan.nextProofTarget.nextPrompt === nextPrompt, 'proof plan next mismatch')
assert(parsed.proofPlan.nextProofTarget.proofMayBePlannedNext === true, 'proof plan next missing')
assert(parsed.proofPlan.nextProofTarget.proofMayRunInThisOwnerReview === false, 'proof ran in owner review')
assert(parsed.proofPlan.nextProofTarget.realUserMediaAllowed === false, 'proof plan real media widened')
assert(parsed.proofPlan.nextProofTarget.workerDispatchAllowed === false, 'proof plan dispatch widened')
assert(parsed.proofPlan.requiredBeforeNextProof.whatHappenedEvidenceRequired === true, 'proof plan evidence missing')
assert(parsed.proofPlan.proofMustStopIf.includes('owner proof does not record what happened'), 'proof plan stop missing')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'product_tool_execution_gate_owner_review_pending',
  ),
  'owner-review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'controlled_product_tool_execution_proof_pending',
  ),
  'proof blocker missing',
)
assert(parsed.blockers.readyForControlledProductToolExecutionProofNoRealUserMedia === true, 'controlled proof readiness missing')
assert(parsed.blockers.readyForControlledProductToolExecutionProofToday === false, 'controlled proof today widened')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'product today widened')
assert(parsed.blockers.soundCpuToolsReadyForControlledProductToolExecutionProofNoRealUserMedia === 15, 'proof tool count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'product tool count widened')

assert(parsed.policy.allowedClaims.productToolExecutionGatePlanOwnerReviewedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.controlledProductToolExecutionProofMayProceedClaimed === true, 'policy proof may proceed missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceRequiredClaimed === true, 'policy evidence claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunControlledProductToolExecutionProof === true, 'policy next proof missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product widened')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'policy real media widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'policy dispatch widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(
  parsed.next.expectedDecisionOnPass ===
    'worker_runtime_jobs_sound_cpu_phase119_controlled_product_tool_execution_proof_passed_with_warnings_ready_for_controlled_product_tool_execution_proof_owner_review_no_real_user_media',
  'next expected mismatch',
)
assert(parsed.next.proofScope.runControlledProductToolExecutionBoundary === true, 'next proof boundary missing')
assert(parsed.next.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'next synthetic/no-media missing')
assert(parsed.next.proofScope.recordWhatHappened === true, 'next what-happened missing')
assert(parsed.next.proofScope.allowedToolCount === 15, 'next tool count mismatch')
assertArrayEquals(parsed.next.proofScope.allowedWorkers, expectedWorkers, 'next workers')
assertArrayEquals(parsed.next.proofScope.allowedImages, expectedImages, 'next images')
assertArrayEquals(parsed.next.proofScope.allowedJobTypes, expectedJobTypes, 'next job types')
assert(parsed.next.proofScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.proofScope.allowWorkerDispatch === false, 'next worker widened')
assert(parsed.next.proofScope.allowRouteExecution === false, 'next route widened')
assert(parsed.next.proofScope.allowManifestPersistence === false, 'next manifest widened')
assert(parsed.next.proofScope.allowMediaOpen === false, 'next media open widened')
assert(parsed.next.proofScope.allowSupabaseMutation === false, 'next supabase widened')
assert(parsed.next.proofScope.allowArtifactCreation === false, 'next artifact widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForControlledProductToolExecutionProofNoRealUserMedia:
        parsed.result.soundCpuTools.readyForControlledProductToolExecutionProofNoRealUserMedia,
      readyForControlledProductToolExecutionProofToday:
        parsed.result.soundCpuTools.readyForControlledProductToolExecutionProofToday,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
