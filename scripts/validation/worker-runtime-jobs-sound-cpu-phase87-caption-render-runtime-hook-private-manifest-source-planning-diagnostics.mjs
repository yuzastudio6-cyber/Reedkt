import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase87_caption_render_runtime_hook_private_manifest_source_planning_completed_with_warnings_ready_for_private_manifest_owner_review_no_execution'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase86_caption_render_runtime_hook_real_media_artifact_boundary_owner_review_passed_with_warnings_ready_for_private_manifest_source_planning_no_execution'
const sourceMergeCommit = '94dc920c704fe1ca9166712efeaf975f676e38de'
const existingSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE87-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning.md',
  sourceOwnerReview:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-source-planning-readiness-register.md',
  phase69Source:
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result.md',
  phase69Owner:
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-result.md',
  reuse:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-existing-private-manifest-source-reuse-register.md',
  fields:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-plan.md',
  mediaRefs:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-media-asset-reference-plan.md',
  artifactRefs:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-artifact-reference-plan.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-safety-policy.md',
  nonExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-non-execution-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review.md',
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
    'newSourceFileCreatedToday": true',
    'existingSourceEditedToday": true',
    'editExistingSourceToday": true',
    'editSourceToday": true',
    'createNewSourceToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning',
  ),
  sourceOwnerReview: parseJsonBlock(
    docs.sourceOwnerReview,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-source-planning-readiness-register',
  ),
  phase69Source: parseJsonBlock(
    docs.phase69Source,
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result',
  ),
  phase69Owner: parseJsonBlock(
    docs.phase69Owner,
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-result',
  ),
  reuse: parseJsonBlock(
    docs.reuse,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-existing-private-manifest-source-reuse-register',
  ),
  fields: parseJsonBlock(
    docs.fields,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-plan',
  ),
  mediaRefs: parseJsonBlock(
    docs.mediaRefs,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-media-asset-reference-plan',
  ),
  artifactRefs: parseJsonBlock(
    docs.artifactRefs,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-artifact-reference-plan',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-safety-policy',
  ),
  nonExecution: parseJsonBlock(
    docs.nonExecution,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-non-execution-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const sourceText = read(existingSourcePath)
for (const required of [
  'SoundCpuPrivateMediaManifest',
  'SoundCpuPrivateMediaManifestInput',
  'SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'validateSoundCpuPrivateMediaManifest',
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'privateMediaAssetIds',
  'plannedPrivateArtifactIds',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(required), `Existing private manifest source missing ${required}`)
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceOwnerReview.decision === sourceDecision, 'source owner decision mismatch')
assert(parsed.sourceOwnerReview.sourceVerification.sourceMergeCommit === '7a4de4710807cd8e8e6446a89d09da33d57647d2', 'source owner parent merge mismatch')
assert(parsed.sourceOwnerReview.ownerReview.approvePrivateManifestSourcePlanningOnly === true, 'source owner planning approval missing')
assert(parsed.sourceOwnerReview.soundCpuTools.covered === 15, 'source owner tool count mismatch')
assert(parsed.sourceOwnerReview.soundCpuTools.readyForRealExecutionToday === 0, 'source owner ready count must remain zero')
assert(parsed.sourceReadiness.nextPlanningGate.privateManifestSourcePlanningMayProceed === true, 'source readiness missing')
assertFalse(parsed.sourceReadiness.stillBlockedToday.createManifestToday, 'source readiness manifest creation must remain false')
assert(parsed.phase69Source.createdSource.path === existingSourcePath, 'Phase 69 source path mismatch')
assert(parsed.phase69Source.createdSource.created === true, 'Phase 69 source creation evidence missing')
assert(parsed.phase69Owner.reviewedSource.path === existingSourcePath, 'Phase 69 owner source path mismatch')
assert(parsed.phase69Owner.reviewedSource.staticTypesConfirmed === true, 'Phase 69 static types not confirmed')
assert(parsed.phase69Owner.reviewedSource.pureValidationFunctionConfirmed === true, 'Phase 69 pure validator not confirmed')
assert(parsed.phase69Owner.reviewedSource.runtimeDefaultsFalseConfirmed === true, 'Phase 69 runtime defaults not confirmed')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1983, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.existingSourceReconciliation.existingSourcePath === existingSourcePath, 'result existing source path mismatch')
assert(parsed.result.existingSourceReconciliation.existingSourcePresent === true, 'result existing source missing')
assert(parsed.result.existingSourceReconciliation.reuseExistingSourceInsteadOfDuplicate === true, 'result duplicate avoidance missing')
assertFalse(parsed.result.existingSourceReconciliation.newSourceFileCreatedToday, 'result must not create source today')
assert(parsed.result.privateManifestSourcePlanning.approvedSnapshotWorkspaceProjectJobFieldsPlanned === true, 'result required fields missing')
assert(parsed.result.privateManifestSourcePlanning.runtimeDefaultsFalsePlanningPreserved === true, 'result runtime defaults missing')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result ready count must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
for (const value of [
  parsed.result.privateManifestSourcePlanning.createManifestToday,
  parsed.result.privateManifestSourcePlanning.useRealMediaBytesToday,
  parsed.result.privateManifestSourcePlanning.openMediaFileToday,
  parsed.result.privateManifestSourcePlanning.createArtifactToday,
  parsed.result.privateManifestSourcePlanning.createSignedUrlToday,
  parsed.result.privateManifestSourcePlanning.dispatchWorkerToday,
  parsed.result.privateManifestSourcePlanning.callRouteToolProviderToday,
  parsed.result.privateManifestSourcePlanning.touchSupabaseSqlToday,
  parsed.result.privateManifestSourcePlanning.unlockBetaToday,
  parsed.result.privateManifestSourcePlanning.unlockProductionToday,
]) {
  assertFalse(value, 'result execution state must remain false')
}

assert(parsed.reuse.sourceReuse.sourcePath === existingSourcePath, 'reuse path mismatch')
assert(parsed.reuse.sourceReuse.sourceAlreadyExists === true, 'reuse existing source missing')
assertFalse(parsed.reuse.sourceReuse.duplicateSourceCreationRequired, 'duplicate source creation must not be required')
assertFalse(parsed.reuse.sourceReuse.duplicateSourceCreationAllowed, 'duplicate source creation must not be allowed')
assert(parsed.reuse.existingSourceCapabilities.hasAcceptedWorkerNames === true, 'worker names not covered')
assert(parsed.reuse.existingSourceCapabilities.runtimeDefaultsAllFalse === true, 'runtime defaults not covered')
assertFalse(parsed.reuse.executionState.editExistingSourceToday, 'existing source edit must be false')
assertFalse(parsed.reuse.executionState.createNewSourceToday, 'new source creation must be false')

assert(parsed.fields.requiredManifestFieldCategories.schemaVersion === 'sound-cpu-private-media-manifest-v1', 'schema version mismatch')
assert(parsed.fields.requiredManifestFieldCategories.runtimeDefaults === 'all_false', 'runtime defaults plan mismatch')
assert(parsed.fields.rejectedManifestFieldCategories.signedUrl === 'rejected_as_source_of_truth', 'signed URL rejection missing')
assertFalse(parsed.fields.executionState.createManifestToday, 'field plan must not create manifest')
assert(parsed.mediaRefs.privateMediaAssetReferencePolicy.referencesAreOpaqueIds === true, 'media opaque ID policy missing')
assert(parsed.mediaRefs.privateMediaAssetReferencePolicy.referencesMustNotBeSignedUrls === true, 'media signed URL rejection missing')
assertFalse(parsed.mediaRefs.executionState.openMediaFileToday, 'media open must be false')
assert(parsed.artifactRefs.privateArtifactReferencePolicy.referencesArePlannedOpaqueIds === true, 'artifact planned ID policy missing')
assertFalse(parsed.artifactRefs.privateArtifactReferencePolicy.signedUrlCreationDefault, 'artifact signed URL default must be false')
assertFalse(parsed.artifactRefs.executionState.artifactCreatedToday, 'artifact creation must be false')
assert(parsed.safety.sourceSafetyPolicy.reuseExistingStaticSourceOnly === true, 'safety reuse policy missing')
assert(parsed.safety.sourceSafetyPolicy.runtimeDefaultsMustRemainFalse === true, 'safety runtime defaults missing')
assertFalse(parsed.safety.executionState.editSourceToday, 'safety edit source must be false')
assertFalse(parsed.safety.executionState.dispatchWorkerToday, 'safety worker dispatch must be false')
assertFalse(parsed.nonExecution.closedExecutionGates.newSourceFileCreatedToday, 'non-execution source creation must be false')
assertFalse(parsed.nonExecution.closedExecutionGates.realMediaBytesUsedToday, 'non-execution real media must be false')
assertFalse(parsed.nonExecution.readinessClaims.runtimeReadinessClaimed, 'runtime readiness must be unclaimed')
assert(parsed.blockers.resolvedForThisGate.includes('duplicatePrivateManifestSourceAvoided'), 'duplicate avoidance blocker missing')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.privateManifestOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.privateManifestSourcePlanningCompleted === true, 'policy planning claim missing')
assert(parsed.policy.allowedClaims.existingPrivateManifestSourceReused === true, 'policy reuse claim missing')
assertFalse(parsed.policy.blockedClaims.manifestInstanceCreatedToday, 'policy manifest instance must be false')
assertFalse(parsed.policy.blockedClaims.realUserMediaBetaReadyClaimed, 'policy beta readiness must be false')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase87_caption_render_runtime_hook_private_manifest_owner_review_passed_with_warnings_ready_for_manifest_instance_planning_no_execution', 'next prompt expected decision mismatch')
assertFalse(parsed.next.reviewScope.createManifestToday, 'next prompt must not create manifest')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must not open media')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      existingSourcePath,
      duplicatePrivateManifestSourceAvoided: true,
      privateManifestOwnerReviewMayProceed: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
