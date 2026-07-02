import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase117_limited_no_real_media_tool_execution_proof_owner_review_passed_with_warnings_ready_for_product_tool_execution_gate_plan_no_real_user_media'
const proofDecision =
  'worker_runtime_jobs_sound_cpu_phase117_controlled_limited_no_real_media_tool_execution_proof_passed_with_warnings_ready_for_limited_no_real_media_tool_execution_proof_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase118_product_tool_execution_gate_plan_no_real_user_media_completed_with_warnings_ready_for_product_tool_execution_gate_owner_review'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE118-PRODUCT-TOOL-EXECUTION-GATE-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-acceptance-register.md',
  sourceGatePlan:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-gate-plan-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-claim-policy.md',
  sourceProof:
    'docs/worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-result.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-result.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-scope-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-evidence-register.md',
  stops:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-stop-conditions.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media.md',
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
    'realUserMediaAllowed',
    'productToolCallExecutionAllowedToday',
    'controlledProductToolExecutionProofAllowedToday',
    'realExternalAgentExecutionAllowedToday',
    'workerDispatchAllowedToday',
    'routeExecutionAllowedToday',
    'manifestPersistenceAllowedToday',
    'mediaOpenAllowedToday',
    'artifactWriteAllowedToday',
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
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-acceptance-register',
  ),
  sourceGatePlan: parseJsonBlock(
    docs.sourceGatePlan,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-gate-plan-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase117-limited-no-real-media-tool-execution-proof-owner-claim-policy',
  ),
  sourceProof: parseJsonBlock(
    docs.sourceProof,
    'worker-runtime-jobs-sound-cpu-phase117-controlled-limited-no-real-media-tool-execution-proof-result',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-result',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-scope-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-evidence-register',
  ),
  stops: parseJsonBlock(
    docs.stops,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-stop-conditions',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2078, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '8091a0cfaff0dbe1a88ca812b44e8808aff36b63',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.controlledLimitedNoRealMediaToolExecutionProofAccepted === true, 'source proof not accepted')
assert(parsed.source.ownerReview.acceptedProofCommandRunCount === 2, 'source run count mismatch')
assert(parsed.source.ownerReview.acceptedTotalSyntheticBoundaryInvocationsObserved === 8, 'source total invocation mismatch')
assert(parsed.source.ownerReview.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.source.ownerReview.acceptedForProductToolCallExecutionToday === false, 'source product execution widened')
assert(parsed.source.ownerReview.acceptedForRealUserMediaToday === false, 'source real media widened')
assert(parsed.source.soundCpuTools.readyForProductToolExecutionGatePlanNoRealUserMedia === 15, 'source gate count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product readiness widened')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceProof.decision === proofDecision, 'proof decision mismatch')
assert(parsed.sourceProof.proofResult.status === 'passed', 'proof status mismatch')
assert(parsed.sourceProof.proofResult.proofCommandRunCount === 2, 'proof run count mismatch')
assert(parsed.sourceProof.proofResult.totalSyntheticBoundaryInvocationsObserved === 8, 'proof total invocation mismatch')
assert(parsed.sourceProof.proofResult.toolCountCovered === 15, 'proof tool count mismatch')
assert(parsed.sourceProof.proofResult.realUserMediaUsed === false, 'proof real media widened')
assert(parsed.sourceProof.proofResult.workerDispatched === false, 'proof worker dispatch widened')
assert(parsed.sourceProof.proofResult.routeExecuted === false, 'proof route widened')

assert(parsed.sourceAcceptance.acceptedProofElements.proofCommandRunCount === 2, 'source acceptance run count mismatch')
assert(parsed.sourceAcceptance.acceptedProofElements.toolCountCovered === 15, 'source acceptance tool count mismatch')
assert(parsed.sourceAcceptance.acceptedProofElements.readyForProductToolCallExecutionToday === 0, 'source acceptance product widened')
assertArrayEquals(parsed.sourceAcceptance.acceptedWorkers, expectedWorkers, 'source acceptance workers')
assertArrayEquals(parsed.sourceAcceptance.acceptedImages, expectedImages, 'source acceptance images')
assertArrayEquals(parsed.sourceAcceptance.acceptedJobTypes, expectedJobTypes, 'source acceptance job types')
assertAllTrue(parsed.sourceAcceptance.notAcceptedForToday, 'source notAcceptedForToday')

assert(parsed.sourceGatePlan.gatePlanTarget.nextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE118-PRODUCT-TOOL-EXECUTION-GATE-PLAN-NO-REAL-USER-MEDIA', 'source gate next mismatch')
assert(parsed.sourceGatePlan.gatePlanTarget.allowedToolCount === 15, 'source gate tool count mismatch')
assert(parsed.sourceGatePlan.gatePlanTarget.realUserMediaAllowed === false, 'source gate real media widened')
assert(parsed.sourceGatePlan.requiredEvidenceForGatePlan.proofCommandRunCount === 2, 'source gate run count mismatch')
assert(
  parsed.sourceGatePlan.gatePlanMustStopIf.some((item) => item.includes('what happened')),
  'source missing what-happened stop',
)
assert(parsed.sourceBlockers.readyForProductToolExecutionGatePlanNoRealUserMedia === true, 'source blocker gate missing')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionToday === false, 'source blocker product widened')
assert(parsed.sourcePolicy.nextGateMayPlanProductToolExecutionGate === true, 'source policy gate missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.gatePlanScope.gatePlanOnly === true, 'prompt gate plan missing')
assert(parsed.prompt.gatePlanScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.gatePlanScope.allowProductToolCallExecutionToday === false, 'prompt product widened')
assert(parsed.prompt.gatePlanScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.gatePlanScope.allowWorkerDispatchToday === false, 'prompt dispatch widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2079, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '6d955eca1736e362cb0bc68cd40db1ca5b132e4b',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.gatePlanResult.productToolExecutionGatePlanCreated === true, 'result gate plan missing')
assert(parsed.result.gatePlanResult.gatePlanOnly === true, 'result gate-only missing')
assert(parsed.result.gatePlanResult.allowedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.gatePlanResult.sourceProofCommandRunCountAccepted === 2, 'result run count mismatch')
assert(parsed.result.gatePlanResult.sourceTotalSyntheticBoundaryInvocationsAccepted === 8, 'result invocation mismatch')
assert(parsed.result.gatePlanResult.readyForProductToolExecutionGateOwnerReview === 15, 'result owner review count mismatch')
assert(parsed.result.gatePlanResult.readyForControlledProductToolExecutionProofToday === 0, 'result proof widened')
assert(parsed.result.gatePlanResult.readyForProductToolCallExecutionToday === 0, 'result product widened')
assert(parsed.result.gatePlanResult.readyForRealExternalAgentExecutionToday === 0, 'result real widened')
assert(parsed.result.gatePlanResult.realUserMediaAllowed === false, 'result real media widened')
assert(parsed.result.gatePlanResult.workerDispatchAllowedToday === false, 'result worker widened')
assert(parsed.result.soundCpuTools.productToolExecutionGatePlanCreated === 15, 'tool gate count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolExecutionGateOwnerReview === 15, 'tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'tool real widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.scope.plannedGateEnvelope.gatePlanOnly === true, 'scope gate plan missing')
assert(parsed.scope.plannedGateEnvelope.toolCount === 15, 'scope tool count mismatch')
assertArrayEquals(parsed.scope.plannedGateEnvelope.workers, expectedWorkers, 'scope workers')
assertArrayEquals(parsed.scope.plannedGateEnvelope.images, expectedImages, 'scope images')
assertArrayEquals(parsed.scope.plannedGateEnvelope.jobTypes, expectedJobTypes, 'scope job types')
assert(parsed.scope.plannedGateEnvelope.requiredPlanningFields.includes('approvedPlanSnapshotId'), 'scope approved snapshot missing')
assert(parsed.scope.plannedGateEnvelope.requiredPlanningFields.includes('idempotencyKey'), 'scope idempotency missing')
assert(parsed.scope.plannedGateEnvelope.inputPolicy.syntheticOrNoMediaOnly === true, 'scope synthetic/no-media missing')
assert(parsed.scope.plannedGateEnvelope.inputPolicy.realUserMediaAllowed === false, 'scope real media widened')
assert(parsed.scope.plannedGateEnvelope.inputPolicy.rawPromptAllowed === false, 'scope raw prompt widened')
assert(parsed.scope.plannedGateEnvelope.inputPolicy.signedUrlInputAllowed === false, 'scope signed URL widened')
assert(parsed.scope.plannedGateEnvelope.runtimePolicy.productToolCallExecutionAllowedToday === false, 'scope product widened')
assert(parsed.scope.plannedGateEnvelope.runtimePolicy.workerDispatchAllowedToday === false, 'scope worker widened')
assert(parsed.scope.plannedGateEnvelope.runtimePolicy.routeExecutionAllowedToday === false, 'scope route widened')

assert(parsed.evidence.requiredSourceEvidence.phase117OwnerReviewPr === 2079, 'evidence source PR mismatch')
assert(parsed.evidence.requiredSourceEvidence.phase117OwnerReviewMergeCommit === '6d955eca1736e362cb0bc68cd40db1ca5b132e4b', 'evidence source merge mismatch')
assert(parsed.evidence.requiredSourceEvidence.phase117OwnerReviewDecision === sourceDecision, 'evidence source decision mismatch')
assert(parsed.evidence.requiredSourceEvidence.phase117ProofDecision === proofDecision, 'evidence proof decision mismatch')
assert(parsed.evidence.requiredSourceEvidence.proofCommandRunCount === 2, 'evidence run count mismatch')
assert(parsed.evidence.requiredSourceEvidence.totalSyntheticBoundaryInvocationsObserved === 8, 'evidence total invocation mismatch')
assert(parsed.evidence.requiredSourceEvidence.toolCount === 15, 'evidence tool count mismatch')
assertAllTrue(parsed.evidence.requiredBeforeAnyFutureControlledProof, 'requiredBeforeAnyFutureControlledProof')
assert(parsed.evidence.evidenceMustIncludeWhatHappened.required === true, 'what-happened evidence required')
assert(parsed.evidence.evidenceMustIncludeWhatHappened.ifMissing.includes('stop'), 'what-happened stop missing')

assert(parsed.stops.futureGateMustStopOn.includes('owner proof or owner review does not record what happened'), 'stop missing what-happened')
assert(parsed.stops.futureGateMustStopOn.includes('real user media path'), 'stop missing real media')
assert(parsed.stops.futureGateMustStopOn.includes('Supabase mutation'), 'stop missing Supabase')
assert(parsed.stops.futureGateMustStopOn.includes('artifact creation'), 'stop missing artifact')
assert(parsed.stops.classificationOnStop.decision === 'worker_runtime_jobs_sound_cpu_phase118_blocked_product_tool_execution_gate_plan_safety_stop', 'stop decision mismatch')

assert(
  parsed.blockers.resolvedForThisGate.some((row) => row.blockerId === 'product_tool_execution_gate_plan_pending'),
  'gate-plan blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some((row) => row.blockerId === 'product_tool_execution_gate_owner_review_pending'),
  'owner-review blocker missing',
)
assert(parsed.blockers.readyForProductToolExecutionGateOwnerReview === true, 'blocker owner review readiness missing')
assert(parsed.blockers.readyForControlledProductToolExecutionProofToday === false, 'blocker proof widened')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.soundCpuToolsReadyForProductToolExecutionGateOwnerReview === 15, 'blocker tool count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker real widened')

assert(parsed.policy.allowedClaims.productToolExecutionGatePlanCreatedClaimed === true, 'policy gate claim missing')
assert(parsed.policy.allowedClaims.productToolExecutionGateOwnerReviewMayProceedClaimed === true, 'policy owner-review claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunProductToolExecutionGateOwnerReview === true, 'policy next owner review missing')
assert(parsed.policy.nextGateMayRunControlledProductToolExecutionProof === false, 'policy proof widened')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'policy dispatch widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase118_product_tool_execution_gate_owner_review_passed_with_warnings_ready_for_controlled_product_tool_execution_proof_no_real_user_media',
  'next expected mismatch',
)
assert(parsed.next.reviewScope.reviewProductToolExecutionGatePlanOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayAcceptControlledProductToolExecutionProofNext === true, 'next proof permission missing')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.allowControlledProductToolExecutionProofToday === false, 'next proof today widened')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next product widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.reviewScope.allowWorkerDispatchToday === false, 'next dispatch widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      productToolExecutionGatePlanCreated: true,
      readyForProductToolExecutionGateOwnerReview:
        parsed.result.soundCpuTools.readyForProductToolExecutionGateOwnerReview,
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
