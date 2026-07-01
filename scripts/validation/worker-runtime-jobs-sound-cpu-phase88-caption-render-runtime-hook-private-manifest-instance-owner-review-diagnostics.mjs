import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase88_caption_render_runtime_hook_private_manifest_instance_planning_completed_with_warnings_ready_for_manifest_instance_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase88_caption_render_runtime_hook_private_manifest_instance_owner_review_passed_with_warnings_ready_for_instance_static_validation_plan_no_execution'
const sourceMergeCommit = '4a97368b73b8abf48797689b8d5b2d8bf5086ce7'
const sourceHead = '6e758dd57c162b2f109ae7440266c9a5b4d27567'
const existingSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE89-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-STATIC-VALIDATION-PLAN'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning-result.md',
  sourceShape:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-plan.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-plan.md',
  sourceReferences:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-plan.md',
  sourceValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-validation-plan.md',
  sourceNonExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-non-execution-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-acceptance-register.md',
  shapeReview:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register.md',
  scopeReview:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-owner-review-register.md',
  referenceReview:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-static-validation-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan.md',
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

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'createManifestToday": ' + 'true',
    'persistManifestToday": ' + 'true',
    'manifestInstanceCreatedToday": ' + 'true',
    'manifestInstancePersistedToday": ' + 'true',
    'manifestPersistedToday": ' + 'true',
    'realMediaBytesUsedToday": ' + 'true',
    'useRealMediaBytesToday": ' + 'true',
    'openMediaFileToday": ' + 'true',
    'mediaFileOpenedToday": ' + 'true',
    'ffmpegFfprobeExecutedToday": ' + 'true',
    'createArtifactToday": ' + 'true',
    'artifactCreatedToday": ' + 'true',
    'createSignedUrlToday": ' + 'true',
    'signedUrlCreatedToday": ' + 'true',
    'publicArtifactCreatedToday": ' + 'true',
    'storageTransferCreatedToday": ' + 'true',
    'dispatchWorkerToday": ' + 'true',
    'workerDispatchedToday": ' + 'true',
    'callRouteToolProviderToday": ' + 'true',
    'routeToolProviderExecutedToday": ' + 'true',
    'providerModelCalledToday": ' + 'true',
    'touchSupabaseSqlToday": ' + 'true',
    'supabaseSqlTouchedToday": ' + 'true',
    'externalBetaUnlockedToday": ' + 'true',
    'productionUnlockedToday": ' + 'true',
    'generatedLocalFixturePassedClaimed": ' + 'true',
    'dryRunPassedClaimed": ' + 'true',
    'runtimeReadinessClaimed": ' + 'true',
    'realUserMediaBetaReadyClaimed": ' + 'true',
    'productionReadinessClaimed": ' + 'true',
    'unlockBetaToday": ' + 'true',
    'unlockProductionToday": ' + 'true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning-result',
  ),
  sourceShape: parseJsonBlock(
    docs.sourceShape,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-plan',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-plan',
  ),
  sourceReferences: parseJsonBlock(
    docs.sourceReferences,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-plan',
  ),
  sourceValidation: parseJsonBlock(
    docs.sourceValidation,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-validation-plan',
  ),
  sourceNonExecution: parseJsonBlock(
    docs.sourceNonExecution,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-non-execution-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-acceptance-register',
  ),
  shapeReview: parseJsonBlock(
    docs.shapeReview,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register',
  ),
  scopeReview: parseJsonBlock(
    docs.scopeReview,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-owner-review-register',
  ),
  referenceReview: parseJsonBlock(
    docs.referenceReview,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-static-validation-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const sourceText = read(existingSourcePath)
for (const required of [
  'schemaVersion',
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'privateMediaAssetIds',
  'plannedPrivateArtifactIds',
  'validateSoundCpuPrivateMediaManifest',
  'acceptedForManifestInstanceCreationToday: false',
]) {
  assert(sourceText.includes(required), `Existing manifest source missing ${required}`)
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.reviewManifestInstanceShapePlan === true, 'source prompt scope missing')
assertFalse(parsed.sourcePrompt.reviewScope.createManifestToday, 'source prompt create manifest must be false')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '7ec11b438002ad7cce4ea382d7b9e372cb49cb5c', 'source result parent merge mismatch')
assert(parsed.sourceResult.instancePlanning.privateManifestInstanceShapePlanned === true, 'source instance shape missing')
assert(parsed.sourceResult.instancePlanning.existingSourceContractUsed === existingSourcePath, 'source existing contract mismatch')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source ready count must remain zero')
assert(parsed.sourceShape.plannedManifestInstanceShape.schemaVersion === 'sound-cpu-private-media-manifest-v1', 'source shape schema mismatch')
assert(parsed.sourceShape.plannedManifestInstanceShape.requiredFields.includes('approvedPlanSnapshotId'), 'source shape approved snapshot missing')
assert(parsed.sourceShape.plannedManifestInstanceShape.disallowedFields.includes('signedUrl'), 'source shape signed URL rejection missing')
assertFalse(parsed.sourceShape.executionState.manifestInstanceCreatedToday, 'source shape must not create instance')
assert(parsed.sourceScope.approvedSnapshotScope.approvedPlanSnapshotIdRequired === true, 'source scope approved snapshot missing')
assert(parsed.sourceScope.approvedSnapshotScope.rawPromptRejected === true, 'source scope raw prompt rejection missing')
assertFalse(parsed.sourceScope.executionState.dispatchWorkerToday, 'source scope dispatch must be false')
assert(parsed.sourceReferences.privateReferenceInstancePolicy.privateMediaAssetIdsAreOpaqueIds === true, 'source references opaque media missing')
assert(parsed.sourceReferences.privateReferenceInstancePolicy.signedUrlsRejected === true, 'source references signed URL rejection missing')
assertFalse(parsed.sourceReferences.executionState.openMediaFileToday, 'source references open media must be false')
assertFalse(parsed.sourceReferences.executionState.createArtifactToday, 'source references artifact creation must be false')
assert(parsed.sourceValidation.validationPlan.useExistingPureValidator === 'validateSoundCpuPrivateMediaManifest', 'source validation pure validator mismatch')
assert(parsed.sourceValidation.validationPlan.validateRuntimeDefaultsRemainFalse === true, 'source validation runtime defaults missing')
assertFalse(parsed.sourceValidation.executionState.runValidatorWithRealPayloadToday, 'source validation real payload must be false')
assertFalse(parsed.sourceNonExecution.closedExecutionGates.manifestInstanceCreatedToday, 'source non-execution manifest instance must be false')
assertFalse(parsed.sourceNonExecution.readinessClaims.runtimeReadinessClaimed, 'source runtime readiness must be unclaimed')
assert(parsed.sourceBlockers.remainingBlockersBeforeExternalAgentRealMediaExecution.manifestInstanceOwnerReview === 'required_next', 'source next blocker mismatch')
assert(parsed.sourceBlockers.executionApprovalsToday === 'none', 'source execution approvals must be none')
assert(parsed.sourcePolicy.allowedClaims.manifestInstancePlanningCompleted === true, 'source policy planning claim missing')
assertFalse(parsed.sourcePolicy.blockedClaims.manifestInstanceCreatedToday, 'source policy manifest creation must be false')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1988, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.privateManifestInstanceShapeAccepted === true, 'shape acceptance missing')
assert(parsed.result.ownerReview.approvedSnapshotInstanceScopeAccepted === true, 'scope acceptance missing')
assert(parsed.result.ownerReview.privateReferenceInstancePolicyAccepted === true, 'reference acceptance missing')
assert(parsed.result.ownerReview.manifestInstanceValidationPlanAccepted === true, 'validation plan acceptance missing')
assert(parsed.result.ownerReview.staticValidationPlanningMayProceed === true, 'static validation planning acceptance missing')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result ready count must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
for (const value of [
  parsed.result.ownerReview.createManifestToday,
  parsed.result.ownerReview.persistManifestToday,
  parsed.result.ownerReview.useRealMediaBytesToday,
  parsed.result.ownerReview.openMediaFileToday,
  parsed.result.ownerReview.createArtifactToday,
  parsed.result.ownerReview.createSignedUrlToday,
  parsed.result.ownerReview.dispatchWorkerToday,
  parsed.result.ownerReview.callRouteToolProviderToday,
  parsed.result.ownerReview.touchSupabaseSqlToday,
  parsed.result.ownerReview.unlockBetaToday,
  parsed.result.ownerReview.unlockProductionToday,
]) {
  assertFalse(value, 'owner review execution state must remain false')
}

assert(parsed.acceptance.acceptedPlanningEvidence.privateManifestInstanceShapePlanned === true, 'acceptance shape missing')
assert(parsed.acceptance.acceptedPlanningEvidence.existingSourceContractUsed === existingSourcePath, 'acceptance source path mismatch')
assert(parsed.acceptance.acceptedPlanningEvidence.soundCpuToolsCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedPlanningEvidence.disallowedFieldsPlanned.includes('signedUrl'), 'acceptance signed URL rejection missing')
assert(parsed.acceptance.acceptedNextGateOnly.instanceStaticValidationPlanningMayProceed === true, 'acceptance next planning missing')
assertFalse(parsed.acceptance.acceptedNextGateOnly.manifestInstanceCreationToday, 'acceptance manifest creation must be false')
assert(parsed.shapeReview.reviewedInstanceShape.schemaVersion === 'sound-cpu-private-media-manifest-v1', 'shape review schema mismatch')
assert(parsed.shapeReview.reviewedInstanceShape.requiredFieldsAccepted.includes('approvedPlanSnapshotId'), 'shape review approved snapshot missing')
assert(parsed.shapeReview.reviewedInstanceShape.runtimeDefaultsMustRemainFalse === true, 'shape review runtime default missing')
assert(parsed.shapeReview.reviewedInstanceShape.signedUrlsRejectedAsSourceOfTruth === true, 'shape review signed URL rejection missing')
assertFalse(parsed.shapeReview.executionState.manifestInstanceCreatedToday, 'shape review manifest creation must be false')
assert(parsed.scopeReview.approvedSnapshotScopeAccepted.approvedPlanSnapshotIdRequired === true, 'scope review approved snapshot missing')
assert(parsed.scopeReview.approvedSnapshotScopeAccepted.rawPromptRejected === true, 'scope review raw prompt rejection missing')
assertFalse(parsed.scopeReview.executionState.dispatchWorkerToday, 'scope review dispatch must be false')
assert(parsed.referenceReview.privateReferencePolicyAccepted.privateMediaAssetIdsAreOpaqueIds === true, 'reference review opaque media missing')
assert(parsed.referenceReview.privateReferencePolicyAccepted.signedUrlsRejected === true, 'reference review signed URL rejection missing')
assertFalse(parsed.referenceReview.executionState.openMediaFileToday, 'reference review open media must be false')
assertFalse(parsed.referenceReview.executionState.createArtifactToday, 'reference review artifact creation must be false')
assert(parsed.readiness.instanceStaticValidationPlanningMayProceed.validateRequiredInstanceFields === true, 'readiness field validation missing')
assert(parsed.readiness.instanceStaticValidationPlanningMayProceed.validateRuntimeDefaultsRemainFalse === true, 'readiness runtime validation missing')
assertFalse(parsed.readiness.instanceStaticValidationPlanningMayProceed.createManifestToday, 'readiness create manifest must be false')
assert(parsed.readiness.nextPlanningGate.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.blockers.resolvedForThisGate.includes('privateManifestInstanceShapeOwnerReviewed'), 'blocker shape resolution missing')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.instanceStaticValidationPlanning === 'required_next', 'blocker next mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.manifestInstanceOwnerReviewPassed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.staticValidationPlanningMayProceed === true, 'policy static planning claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assertFalse(parsed.policy.blockedClaims.manifestInstanceCreatedToday, 'policy manifest instance must be false')
assertFalse(parsed.policy.blockedClaims.staticValidationExecutedToday, 'policy static validation execution must be false')
assertFalse(parsed.policy.blockedClaims.realUserMediaBetaReadyClaimed, 'policy real media beta readiness must be false')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase89_caption_render_runtime_hook_private_manifest_instance_static_validation_plan_completed_with_warnings_ready_for_private_manifest_instance_static_validation_no_execution', 'next prompt expected decision mismatch')
assert(parsed.next.planningScope.planRequiredFieldStaticValidation === true, 'next prompt field validation planning missing')
assert(parsed.next.planningScope.planRuntimeDefaultFalseValidation === true, 'next prompt runtime validation planning missing')
assertFalse(parsed.next.planningScope.createManifestToday, 'next prompt create manifest must be false')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'next prompt open media must be false')
assertFalse(parsed.next.planningScope.createArtifactToday, 'next prompt create artifact must be false')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      existingSourcePath,
      manifestInstanceOwnerReviewPassed: true,
      staticValidationPlanningMayProceed: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
