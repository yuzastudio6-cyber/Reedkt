import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase115_product_tool_call_readiness_owner_review_passed_with_warnings_ready_for_limited_no_real_media_tool_execution_preflight'
const decision =
  'worker_runtime_jobs_sound_cpu_phase116_limited_no_real_media_tool_execution_preflight_completed_with_warnings_ready_for_controlled_limited_no_real_media_tool_execution_proof'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE117-CONTROLLED-LIMITED-NO-REAL-MEDIA-TOOL-EXECUTION-PROOF'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-acceptance-register.md',
  sourcePreflight:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-preflight-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight-result.md',
  checklist:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight-checklist.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-boundary-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof.md',
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

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
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

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-acceptance-register',
  ),
  sourcePreflight: parseJsonBlock(
    docs.sourcePreflight,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-preflight-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase115-product-tool-call-readiness-owner-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight-result',
  ),
  checklist: parseJsonBlock(
    docs.checklist,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-preflight-checklist',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-boundary-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase116-limited-no-real-media-tool-execution-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2073, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '8eea5fea3cb78e4e7e9f88d62f447a1d9db70c94',
  'source upstream merge mismatch',
)
assert(parsed.source.ownerReview.productToolCallReadinessReconciliationAccepted === true, 'source owner review missing')
assert(parsed.source.ownerReview.limitedNoRealMediaToolExecutionPreflightMayProceedNext === true, 'source preflight next missing')
assert(parsed.source.ownerReview.acceptedForProductToolCallExecutionToday === false, 'source product execution widened')
assert(parsed.source.soundCpuTools.readyForLimitedNoRealMediaToolExecutionPreflight === 15, 'source preflight count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product count widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE116-LIMITED-NO-REAL-MEDIA-TOOL-EXECUTION-PREFLIGHT', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedReadinessElements.phase115ReconciliationAccepted === true, 'source acceptance reconciliation missing')
assert(parsed.sourceAcceptance.acceptedReadinessElements.readyForLimitedNoRealMediaToolExecutionPreflight === 15, 'source acceptance count mismatch')
assert(parsed.sourceAcceptance.acceptedReadinessElements.readyForProductToolCallExecutionToday === 0, 'source acceptance execution widened')
assertArrayEquals(parsed.sourceAcceptance.acceptedWorkers, expectedWorkers, 'source acceptance workers')
assertArrayEquals(parsed.sourceAcceptance.acceptedImages, expectedImages, 'source acceptance images')
assertArrayEquals(parsed.sourceAcceptance.acceptedJobTypes, expectedJobTypes, 'source acceptance job types')
assertAllTrue(parsed.sourceAcceptance.acceptedForNextPreflightOnly, 'source acceptedForNextPreflightOnly')
assertAllTrue(parsed.sourceAcceptance.notAcceptedForToday, 'source notAcceptedForToday')

assert(parsed.sourcePreflight.preflightTarget.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE116-LIMITED-NO-REAL-MEDIA-TOOL-EXECUTION-PREFLIGHT', 'source preflight next mismatch')
assert(parsed.sourcePreflight.preflightTarget.preflightOnly === true, 'source preflight only missing')
assert(parsed.sourcePreflight.preflightTarget.allowedToolCount === 15, 'source preflight tool count mismatch')
assert(parsed.sourcePreflight.preflightTarget.realUserMediaAllowed === false, 'source preflight media widened')
assert(parsed.sourcePreflight.requiredEvidenceForPreflight.toolCount === 15, 'source preflight evidence count mismatch')
assert(parsed.sourcePreflight.preflightMustStopIf.some((item) => item.includes('vague')), 'source vague-proof stop missing')

assert(parsed.sourceBlockers.readyForLimitedNoRealMediaToolExecutionPreflight === true, 'source blocker preflight missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product widened')
assert(parsed.sourcePolicy.nextGateMayRunLimitedNoRealMediaToolExecutionPreflight === true, 'source policy next missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product widened')
assertNoOpClassification(parsed.sourcePolicy.supabaseClassification, 'sourcePolicy.supabaseClassification')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.preflightScope.preflightOnly === true, 'prompt preflight only missing')
assert(parsed.prompt.preflightScope.mayPlanControlledLimitedNoRealMediaToolExecutionProofNext === true, 'prompt proof planning missing')
assert(parsed.prompt.preflightScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.preflightScope.allowProductToolCallExecutionToday === false, 'prompt product execution widened')
assert(parsed.prompt.preflightScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2075, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'd6051e287d2fca6a32e77713c57b0de25fc9b28d',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.preflightResult.sourceOwnerReviewAccepted === true, 'result source accepted missing')
assert(parsed.result.preflightResult.whatHappenedEvidenceRequired === true, 'result what-happened guard missing')
assert(parsed.result.preflightResult.vagueOwnerProofAccepted === false, 'vague owner proof accepted')
assert(parsed.result.preflightResult.limitedNoRealMediaToolExecutionPreflightCompleted === true, 'preflight not completed')
assert(parsed.result.preflightResult.controlledLimitedNoRealMediaToolExecutionProofMayProceedNext === true, 'next proof permission missing')
assert(parsed.result.preflightResult.toolCountCovered === 15, 'result tool count mismatch')
assert(parsed.result.preflightResult.productToolCallExecutionRan === false, 'product execution ran')
assert(parsed.result.preflightResult.realUserMediaUsed === false, 'real media used')
assert(parsed.result.preflightResult.workerDispatched === false, 'worker dispatched')
assert(parsed.result.preflightResult.routeExecuted === false, 'route executed')
assert(parsed.result.preflightResult.supabaseTouched === false, 'Supabase touched')
assert(parsed.result.preflightResult.artifactCreated === false, 'artifact created')
assert(parsed.result.soundCpuTools.readyForControlledLimitedNoRealMediaToolExecutionProof === 15, 'result proof count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.checklist.preflightChecks.phase115OwnerReviewMerged === true, 'checklist source merge missing')
assert(parsed.checklist.preflightChecks.ownerPacketRecordsWhatHappened === true, 'checklist what-happened missing')
assert(parsed.checklist.preflightChecks.toolCountConfirmed === 15, 'checklist tool count mismatch')
assertArrayEquals(parsed.checklist.preflightChecks.workerNamesConfirmed, expectedWorkers, 'checklist workers')
assertArrayEquals(parsed.checklist.preflightChecks.imageNamesConfirmed, expectedImages, 'checklist images')
assertArrayEquals(parsed.checklist.preflightChecks.jobTypesConfirmed, expectedJobTypes, 'checklist job types')
assertAllTrue(parsed.checklist.preflightDoesNotRun, 'preflightDoesNotRun')

assert(parsed.boundary.allowedNextProofEnvelope.controlledLimitedNoRealMediaToolExecutionProof === true, 'boundary proof missing')
assert(parsed.boundary.allowedNextProofEnvelope.syntheticInputsOnly === true, 'boundary synthetic missing')
assert(parsed.boundary.allowedNextProofEnvelope.realUserMediaAllowed === false, 'boundary real media widened')
assert(parsed.boundary.allowedNextProofEnvelope.toolCountAllowed === 15, 'boundary tool count mismatch')
assert(parsed.boundary.allowedNextProofEnvelope.requiresSanitizedWhatHappenedOutput === true, 'boundary what-happened missing')
assertAllFalse(parsed.boundary.mustRemainFalseInNextProof, 'mustRemainFalseInNextProof')

assert(parsed.blockers.readyForControlledLimitedNoRealMediaToolExecutionProof === true, 'blocker proof readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForControlledLimitedNoRealMediaToolExecutionProof === 15, 'blocker proof tool count mismatch')
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'controlled_limited_no_real_media_tool_execution_proof_pending',
  ),
  'controlled proof blocker missing',
)

assert(parsed.policy.allowedClaims.limitedNoRealMediaToolExecutionPreflightCompleted === true, 'policy preflight claim missing')
assert(parsed.policy.allowedClaims.controlledLimitedNoRealMediaToolExecutionProofMayProceedNext === true, 'policy proof next missing')
assert(parsed.policy.allowedClaims.soundCpuToolsReadyForControlledProof === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'blockedClaims')
assert(parsed.policy.nextGateMayRunControlledLimitedNoRealMediaToolExecutionProof === true, 'policy next proof missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase117_controlled_limited_no_real_media_tool_execution_proof_passed_with_warnings_ready_for_limited_no_real_media_tool_execution_proof_owner_review',
  'next expected mismatch',
)
assert(parsed.next.proofScope.mayRunControlledLimitedNoRealMediaToolExecutionProof === true, 'next proof permission missing')
assert(parsed.next.proofScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.proofScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.proofScope.allowWorkerDispatchToday === false, 'next worker widened')
assert(parsed.next.proofScope.allowRouteExecutionToday === false, 'next route widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForControlledLimitedNoRealMediaToolExecutionProof:
        parsed.result.soundCpuTools.readyForControlledLimitedNoRealMediaToolExecutionProof,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
