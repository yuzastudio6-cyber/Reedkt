import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase87_caption_render_runtime_hook_private_manifest_source_planning_completed_with_warnings_ready_for_private_manifest_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase87_caption_render_runtime_hook_private_manifest_owner_review_passed_with_warnings_ready_for_manifest_instance_planning_no_execution'
const sourceMergeCommit = 'bd7b869cc8f45daf84204d8007ff93ccad052eb1'
const existingSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE88-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-PLANNING'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-result.md',
  sourceReuse:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-existing-private-manifest-source-reuse-register.md',
  sourceFields:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-plan.md',
  sourceMediaRefs:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-media-asset-reference-plan.md',
  sourceArtifactRefs:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-artifact-reference-plan.md',
  sourceSafety:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-safety-policy.md',
  sourceNonExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-non-execution-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-acceptance-register.md',
  reuseReview:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-reuse-owner-review-register.md',
  fieldReview:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-owner-review-register.md',
  referenceReview:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-reference-policy-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-manifest-instance-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning.md',
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
    'createManifestToday": true',
    'persistManifestToday": true',
    'manifestInstanceCreatedToday": true',
    'realMediaBytesUsedToday": true',
    'useRealMediaBytesToday": true',
    'openMediaFileToday": true',
    'mediaFileOpenedToday": true',
    'ffmpegFfprobeExecutedToday": true',
    'createArtifactToday": true',
    'artifactCreatedToday": true',
    'createSignedUrlToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'storageTransferCreatedToday": true',
    'dispatchWorkerToday": true',
    'workerDispatchedToday": true',
    'callRouteToolProviderToday": true',
    'routeToolProviderExecutedToday": true',
    'providerModelCalledToday": true',
    'touchSupabaseSqlToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'generatedLocalFixturePassedClaimed": true',
    'dryRunPassedClaimed": true',
    'runtimeReadinessClaimed": true',
    'realUserMediaBetaReadyClaimed": true',
    'productionReadinessClaimed": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-result',
  ),
  sourceReuse: parseJsonBlock(
    docs.sourceReuse,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-existing-private-manifest-source-reuse-register',
  ),
  sourceFields: parseJsonBlock(
    docs.sourceFields,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-plan',
  ),
  sourceMediaRefs: parseJsonBlock(
    docs.sourceMediaRefs,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-media-asset-reference-plan',
  ),
  sourceArtifactRefs: parseJsonBlock(
    docs.sourceArtifactRefs,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-artifact-reference-plan',
  ),
  sourceSafety: parseJsonBlock(
    docs.sourceSafety,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-safety-policy',
  ),
  sourceNonExecution: parseJsonBlock(
    docs.sourceNonExecution,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-non-execution-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-acceptance-register',
  ),
  reuseReview: parseJsonBlock(
    docs.reuseReview,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-reuse-owner-review-register',
  ),
  fieldReview: parseJsonBlock(
    docs.fieldReview,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-owner-review-register',
  ),
  referenceReview: parseJsonBlock(
    docs.referenceReview,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-reference-policy-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-manifest-instance-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(fs.existsSync(path.join(process.cwd(), existingSourcePath)), 'existing private manifest source missing')
assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1983, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '94dc920c704fe1ca9166712efeaf975f676e38de', 'source result source merge mismatch')
assert(parsed.sourceResult.existingSourceReconciliation.existingSourcePath === existingSourcePath, 'source result source path mismatch')
assert(parsed.sourceResult.existingSourceReconciliation.reuseExistingSourceInsteadOfDuplicate === true, 'source result duplicate avoidance missing')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source ready count must remain zero')
assert(parsed.sourceReuse.sourceReuse.duplicateSourceCreationAllowed === false, 'source reuse must forbid duplicate source')
assert(parsed.sourceFields.rejectedManifestFieldCategories.signedUrl === 'rejected_as_source_of_truth', 'source field signed URL rejection missing')
assert(parsed.sourceMediaRefs.privateMediaAssetReferencePolicy.referencesMustNotBeSignedUrls === true, 'source media signed URL rejection missing')
assertFalse(parsed.sourceMediaRefs.executionState.openMediaFileToday, 'source media open must be false')
assertFalse(parsed.sourceArtifactRefs.privateArtifactReferencePolicy.signedUrlCreationDefault, 'source artifact signed URL default must be false')
assertFalse(parsed.sourceArtifactRefs.executionState.createArtifactToday, 'source artifact creation must be false')
assert(parsed.sourceSafety.sourceSafetyPolicy.runtimeDefaultsMustRemainFalse === true, 'source safety runtime defaults missing')
assertFalse(parsed.sourceNonExecution.closedExecutionGates.manifestInstanceCreatedToday, 'source manifest instance must be false')
assertFalse(parsed.sourceNonExecution.readinessClaims.runtimeReadinessClaimed, 'source runtime readiness must be unclaimed')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1985, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.existingPrivateManifestSourceReuseAccepted === true, 'source reuse not accepted')
assert(parsed.result.ownerReview.fieldContractPlanAccepted === true, 'field contract not accepted')
assert(parsed.result.ownerReview.privateMediaAssetReferencePlanAccepted === true, 'media refs not accepted')
assert(parsed.result.ownerReview.privateArtifactReferencePlanAccepted === true, 'artifact refs not accepted')
assert(parsed.result.ownerReview.sourceSafetyPolicyAccepted === true, 'source safety not accepted')
assert(parsed.result.ownerReview.approveManifestInstancePlanningOnly === true, 'manifest instance planning not approved')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result ready count must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
for (const value of [
  parsed.result.ownerReview.createManifestToday,
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

assert(parsed.acceptance.acceptedPlanningEvidence.duplicatePrivateManifestSourceAvoided === true, 'acceptance duplicate avoidance missing')
assert(parsed.acceptance.acceptedNextGateOnly.manifestInstancePlanningMayProceed === true, 'acceptance next planning missing')
assertFalse(parsed.acceptance.acceptedNextGateOnly.manifestInstanceCreationToday, 'acceptance manifest creation must be false')
assert(parsed.reuseReview.reviewedSourceReuse.sourcePath === existingSourcePath, 'reuse review source path mismatch')
assertFalse(parsed.reuseReview.reviewedSourceReuse.duplicateSourceCreationAllowed, 'reuse review duplicate source must be false')
assert(parsed.reuseReview.sourceCapabilitiesAccepted.runtimeDefaultsAllFalse === true, 'reuse review runtime defaults missing')
assert(parsed.fieldReview.acceptedRequiredFields.includes('approvedPlanSnapshotId'), 'field review approved snapshot missing')
assert(parsed.fieldReview.acceptedRejectedFields.includes('signedUrl'), 'field review signed URL rejection missing')
assertFalse(parsed.fieldReview.executionState.createManifestToday, 'field review manifest creation must be false')
assert(parsed.referenceReview.privateMediaReferencePolicyAccepted.noSignedUrls === true, 'reference review media signed URL rejection missing')
assertFalse(parsed.referenceReview.privateArtifactReferencePolicyAccepted.signedUrlCreationDefault, 'reference review artifact signed URL default must be false')
assertFalse(parsed.referenceReview.executionState.createArtifactToday, 'reference review artifact creation must be false')
assert(parsed.readiness.nextPlanningGate.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.readiness.nextPlanningGate.manifestInstancePlanningMayProceed === true, 'readiness manifest planning missing')
assertFalse(parsed.readiness.stillBlockedToday.createManifestToday, 'readiness manifest creation must be false')
assertFalse(parsed.readiness.stillBlockedToday.openMediaFileToday, 'readiness media open must be false')
assert(parsed.blockers.resolvedForThisGate.includes('duplicatePrivateManifestSourceAvoided'), 'blockers duplicate avoidance missing')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.manifestInstancePlanning === 'required_next', 'blockers next mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.privateManifestOwnerReviewPassed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.manifestInstancePlanningMayProceed === true, 'policy next planning claim missing')
assertFalse(parsed.policy.blockedClaims.manifestInstanceCreatedToday, 'policy manifest instance must be false')
assertFalse(parsed.policy.blockedClaims.realUserMediaBetaReadyClaimed, 'policy beta readiness must be false')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase88_caption_render_runtime_hook_private_manifest_instance_planning_completed_with_warnings_ready_for_manifest_instance_owner_review_no_execution', 'next prompt expected decision mismatch')
assertFalse(parsed.next.planningScope.createManifestToday, 'next prompt create manifest must be false')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'next prompt open media must be false')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      existingSourcePath,
      manifestInstancePlanningMayProceed: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
