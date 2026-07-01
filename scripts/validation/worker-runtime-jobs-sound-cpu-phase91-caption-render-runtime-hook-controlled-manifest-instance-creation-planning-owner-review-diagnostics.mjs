import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase91_caption_render_runtime_hook_controlled_manifest_instance_creation_planning_completed_with_warnings_ready_for_controlled_manifest_instance_creation_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase91_caption_render_runtime_hook_controlled_manifest_instance_creation_planning_owner_review_passed_with_warnings_ready_for_controlled_manifest_instance_creation_no_execution'
const sourceMergeCommit = '04bda1ad9be74e11fa3679df5ef7b0d4024636ee'
const sourceHead = 'c718af54fc2f8f7b2dbd686d7bfc17ef97a00f6e'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE92-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-MANIFEST-INSTANCE-CREATION'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-result.md',
  sourceFieldMap:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-field-map.md',
  sourceProcedure:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-creation-procedure-plan.md',
  sourceSynthetic:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-synthetic-private-reference-input-plan.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-no-persistence-runtime-boundary.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-owner-review-readiness-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-acceptance-register.md',
  fieldMapReview:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-field-map-owner-review-register.md',
  procedureReview:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-procedure-owner-review-register.md',
  syntheticReview:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-synthetic-input-owner-review-register.md',
  boundaryReview:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-no-persistence-owner-review-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, message) {
  assert(value === false, message)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) assertFalse(value, `${label}.${key} must be false`)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'persistManifestToday": ' + 'true',
    'manifestInstanceCreatedToday": ' + 'true',
    'manifestInstancePersistedToday": ' + 'true',
    'syntheticInputCreatedToday": ' + 'true',
    'realMediaBytesUsedToday": ' + 'true',
    'useRealMediaBytesToday": ' + 'true',
    'openMediaFileToday": ' + 'true',
    'mediaFileOpenedToday": ' + 'true',
    'createArtifactToday": ' + 'true',
    'artifactCreatedToday": ' + 'true',
    'createSignedUrlToday": ' + 'true',
    'signedUrlCreatedToday": ' + 'true',
    'dispatchWorkerToday": ' + 'true',
    'workerDispatchedToday": ' + 'true',
    'callRouteToolProviderToday": ' + 'true',
    'routeToolProviderExecutedToday": ' + 'true',
    'touchSupabaseSqlToday": ' + 'true',
    'supabaseSqlTouchedToday": ' + 'true',
    'unlockBetaToday": ' + 'true',
    'unlockProductionToday": ' + 'true',
    'generatedLocalFixturePassedClaimed": ' + 'true',
    'dryRunPassedClaimed": ' + 'true',
    'runtimeReadinessClaimed": ' + 'true',
    'realUserMediaBetaReadyClaimed": ' + 'true',
    'productionReadinessClaimed": ' + 'true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-result',
  ),
  sourceFieldMap: parseJsonBlock(
    docs.sourceFieldMap,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-field-map',
  ),
  sourceProcedure: parseJsonBlock(
    docs.sourceProcedure,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-creation-procedure-plan',
  ),
  sourceSynthetic: parseJsonBlock(
    docs.sourceSynthetic,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-synthetic-private-reference-input-plan',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-no-persistence-runtime-boundary',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-owner-review-readiness-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-acceptance-register',
  ),
  fieldMapReview: parseJsonBlock(
    docs.fieldMapReview,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-field-map-owner-review-register',
  ),
  procedureReview: parseJsonBlock(
    docs.procedureReview,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-procedure-owner-review-register',
  ),
  syntheticReview: parseJsonBlock(
    docs.syntheticReview,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-synthetic-input-owner-review-register',
  ),
  boundaryReview: parseJsonBlock(
    docs.boundaryReview,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-no-persistence-owner-review-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const sourceText = read(sourcePath)
for (const token of [
  'validateSoundCpuPrivateMediaManifest',
  'approvedPlanSnapshotId',
  'privateMediaAssetIds',
  'plannedPrivateArtifactIds',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(token), `private manifest source missing ${token}`)
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.acceptForControlledManifestInstanceCreationProofOnly === true, 'source prompt proof-only')
assertFalse(parsed.sourcePrompt.reviewScope.createManifestToday, 'source prompt create manifest')
assertFalse(parsed.sourcePrompt.reviewScope.persistManifestToday, 'source prompt persist manifest')
assertFalse(parsed.sourcePrompt.reviewScope.dispatchWorkerToday, 'source prompt dispatch')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1995, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === 'd52a6e76ef95e220553597f3f37bcadda8a121cf', 'source result reviewed head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '6a680abf9182c49da409af708e5cdacea9524def', 'source result reviewed merge')
assert(parsed.sourceResult.planningResult.controlledManifestInstanceCreationPlanned === true, 'source planning missing')
assertFalse(parsed.sourceResult.planningResult.createManifestToday, 'source result create manifest')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tool count')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result real execution count')

assert(parsed.sourceFieldMap.requiredFields.length === 11, 'source field count')
assert(parsed.sourceFieldMap.acceptedWorkerNames.length === 2, 'source worker count')
assert(parsed.sourceFieldMap.acceptedJobTypes.length === 4, 'source job count')
assert(parsed.sourceFieldMap.referencePolicy.signedUrlsRejectedAsSourceOfTruth === true, 'source signed URL rejection')
assertAllFalse(parsed.sourceFieldMap.executionState, 'sourceFieldMap.executionState')

assert(parsed.sourceProcedure.plannedProcedure.includes('validate_with_existing_pure_validator'), 'source procedure validator')
assertAllFalse(parsed.sourceProcedure.blockedProcedureStepsToday, 'sourceProcedure.blockedProcedureStepsToday')
assert(parsed.sourceSynthetic.syntheticInputPlan.rawPromptIncluded === false, 'source synthetic raw prompt')
assertAllFalse(parsed.sourceSynthetic.executionState, 'sourceSynthetic.executionState')
assertAllFalse(parsed.sourceBoundary.closedRuntimeBoundaries, 'sourceBoundary.closedRuntimeBoundaries')
assertAllFalse(parsed.sourceBoundary.readinessClaims, 'sourceBoundary.readinessClaims')
assert(parsed.sourceReadiness.ownerReviewReadiness.controlledCreationOwnerReviewMayProceed === true, 'source readiness owner review')
assert(parsed.sourceBlockers.remainingBlockersBeforeExternalAgentRealMediaExecution.controlledManifestInstanceCreationPlanningOwnerReview === 'required_next', 'source blockers owner review next')
assert(parsed.sourcePolicy.allowedClaims.controlledManifestInstanceCreationOwnerReviewMayProceed === true, 'source policy owner review')
assertAllFalse(parsed.sourcePolicy.blockedClaims, 'sourcePolicy.blockedClaims')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1997, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.acceptedForControlledManifestInstanceCreationProofOnly === true, 'result proof-only')
assert(parsed.result.ownerReview.controlledInMemoryManifestInstanceCreationProofMayProceed === true, 'result proof may proceed')
for (const key of [
  'createManifestToday',
  'persistManifestToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.result.ownerReview[key], `result.ownerReview.${key}`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution count')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt')

assert(parsed.acceptance.acceptedPlanningEvidence.controlledManifestInstanceCreationPlanningCompleted === true, 'acceptance planning')
assert(parsed.acceptance.acceptedForNextGateOnly.controlledInMemoryManifestInstanceCreationProofMayProceed === true, 'acceptance proof')
assert(parsed.acceptance.acceptedForExecutionToday === 'none', 'acceptance execution')
assert(parsed.fieldMapReview.reviewedFieldMap.requiredFieldsCount === 11, 'field map review count')
assert(parsed.fieldMapReview.reviewedFieldMap.acceptedWorkerNames.length === 2, 'field map review workers')
assert(parsed.fieldMapReview.reviewedFieldMap.acceptedJobTypes.length === 4, 'field map review jobs')
assert(parsed.fieldMapReview.ownerDecision.fieldMapAcceptedForControlledProofOnly === true, 'field map review acceptance')
assertFalse(parsed.fieldMapReview.ownerDecision.createManifestToday, 'field map review create')

assert(parsed.procedureReview.reviewedProcedure.includes('assert_runtime_defaults_false'), 'procedure review defaults')
assert(parsed.procedureReview.reviewedPreconditions.runtimeFlagsAllFalse === true, 'procedure review runtime flag')
assertAllFalse(parsed.procedureReview.blockedProcedureStepsToday, 'procedureReview.blockedProcedureStepsToday')
assert(parsed.syntheticReview.reviewedSyntheticInputPlan.placeholderPatternsAccepted === true, 'synthetic review placeholder')
assert(parsed.syntheticReview.reviewedSyntheticInputPlan.signedUrlIncluded === false, 'synthetic review signed URL')
assertAllFalse(parsed.syntheticReview.executionState, 'syntheticReview.executionState')
assertAllFalse(parsed.boundaryReview.reviewedClosedRuntimeBoundaries, 'boundaryReview.reviewedClosedRuntimeBoundaries')
assertAllFalse(parsed.boundaryReview.reviewedReadinessClaims, 'boundaryReview.reviewedReadinessClaims')
assert(parsed.boundaryReview.ownerDecision.noPersistenceBoundaryAccepted === true, 'boundary review acceptance')
assert(parsed.boundaryReview.ownerDecision.executionApprovalsToday === 'none', 'boundary review execution')

assert(parsed.blockers.resolvedForThisGate.includes('controlledManifestInstanceCreationPlanningOwnerReviewPassed'), 'blockers owner review')
assert(
  parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.controlledInMemoryManifestInstanceCreationProof ===
    'required_next',
  'blockers next proof',
)
assert(parsed.blockers.executionApprovalsToday === 'none', 'blockers execution')
assert(parsed.policy.allowedClaims.controlledManifestInstanceCreationPlanningOwnerReviewPassed === true, 'policy owner review')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.executionScope.createControlledInMemoryManifestInstance === true, 'next prompt in-memory proof missing')
assert(parsed.next.executionScope.useSyntheticPrivateReferenceIdsOnly === true, 'next prompt synthetic refs')
assert(parsed.next.executionScope.discardInMemoryManifestAfterValidation === true, 'next prompt discard missing')
for (const key of [
  'persistManifestToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.next.executionScope[key], `next.executionScope.${key}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      reviewedSourcePr: parsed.result.sourceVerification.sourcePr,
      controlledInMemoryManifestInstanceCreationProofMayProceed:
        parsed.result.ownerReview.controlledInMemoryManifestInstanceCreationProofMayProceed,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      executionApprovalsToday: parsed.policy.executionApprovalsToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
