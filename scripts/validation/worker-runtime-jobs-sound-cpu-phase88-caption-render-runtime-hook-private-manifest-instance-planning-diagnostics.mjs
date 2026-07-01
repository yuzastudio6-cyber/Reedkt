import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase87_caption_render_runtime_hook_private_manifest_owner_review_passed_with_warnings_ready_for_manifest_instance_planning_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase88_caption_render_runtime_hook_private_manifest_instance_planning_completed_with_warnings_ready_for_manifest_instance_owner_review_no_execution'
const sourceMergeCommit = '7ec11b438002ad7cce4ea382d7b9e372cb49cb5c'
const existingSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE88-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning.md',
  sourceOwner:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-manifest-instance-planning-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning-result.md',
  shape:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-plan.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-plan.md',
  references:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-plan.md',
  validation:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-validation-plan.md',
  nonExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-non-execution-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review.md',
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
    'manifestPersistedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning',
  ),
  sourceOwner: parseJsonBlock(
    docs.sourceOwner,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-manifest-instance-planning-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-planning-result',
  ),
  shape: parseJsonBlock(
    docs.shape,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-plan',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-plan',
  ),
  references: parseJsonBlock(
    docs.references,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-plan',
  ),
  validation: parseJsonBlock(
    docs.validation,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-validation-plan',
  ),
  nonExecution: parseJsonBlock(
    docs.nonExecution,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-non-execution-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review',
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
assert(parsed.sourceOwner.decision === sourceDecision, 'source owner decision mismatch')
assert(parsed.sourceOwner.sourceVerification.sourceMergeCommit === 'bd7b869cc8f45daf84204d8007ff93ccad052eb1', 'source owner parent merge mismatch')
assert(parsed.sourceOwner.ownerReview.approveManifestInstancePlanningOnly === true, 'source owner next planning approval missing')
assert(parsed.sourceOwner.soundCpuTools.covered === 15, 'source owner tool count mismatch')
assert(parsed.sourceOwner.soundCpuTools.readyForRealExecutionToday === 0, 'source owner ready count must be zero')
assert(parsed.sourceReadiness.nextPlanningGate.manifestInstancePlanningMayProceed === true, 'source readiness missing')
assertFalse(parsed.sourceReadiness.stillBlockedToday.createManifestToday, 'source readiness create manifest must be false')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1986, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.instancePlanning.privateManifestInstanceShapePlanned === true, 'instance shape not planned')
assert(parsed.result.instancePlanning.existingSourceContractUsed === existingSourcePath, 'existing source path mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result ready count must be zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
for (const value of [
  parsed.result.instancePlanning.createManifestToday,
  parsed.result.instancePlanning.persistManifestToday,
  parsed.result.instancePlanning.useRealMediaBytesToday,
  parsed.result.instancePlanning.openMediaFileToday,
  parsed.result.instancePlanning.createArtifactToday,
  parsed.result.instancePlanning.createSignedUrlToday,
  parsed.result.instancePlanning.dispatchWorkerToday,
  parsed.result.instancePlanning.callRouteToolProviderToday,
  parsed.result.instancePlanning.touchSupabaseSqlToday,
  parsed.result.instancePlanning.unlockBetaToday,
  parsed.result.instancePlanning.unlockProductionToday,
]) {
  assertFalse(value, 'result execution state must remain false')
}

assert(parsed.shape.plannedManifestInstanceShape.schemaVersion === 'sound-cpu-private-media-manifest-v1', 'shape schema mismatch')
assert(parsed.shape.plannedManifestInstanceShape.sourceContractPath === existingSourcePath, 'shape source path mismatch')
for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'privateMediaAssetIds', 'plannedPrivateArtifactIds']) {
  assert(parsed.shape.plannedManifestInstanceShape.requiredFields.includes(field), `shape missing field ${field}`)
}
for (const [flag, value] of Object.entries(parsed.shape.plannedManifestInstanceShape.runtimeDefaults)) {
  assertFalse(value, `shape runtime default ${flag}`)
}
assert(parsed.shape.plannedManifestInstanceShape.disallowedFields.includes('signedUrl'), 'shape must disallow signedUrl')
assertFalse(parsed.shape.executionState.manifestInstanceCreatedToday, 'shape must not create instance')
assert(parsed.scope.approvedSnapshotScope.approvedPlanSnapshotIdRequired === true, 'approved snapshot required missing')
assert(parsed.scope.approvedSnapshotScope.rawPromptRejected === true, 'raw prompt rejection missing')
assertFalse(parsed.scope.executionState.dispatchWorkerToday, 'scope dispatch must be false')
assert(parsed.references.privateReferenceInstancePolicy.privateMediaAssetIdsAreOpaqueIds === true, 'media opaque ID plan missing')
assert(parsed.references.privateReferenceInstancePolicy.signedUrlsRejected === true, 'signed URL rejection missing')
assertFalse(parsed.references.executionState.openMediaFileToday, 'references open media must be false')
assertFalse(parsed.references.executionState.createArtifactToday, 'references artifact creation must be false')
assert(parsed.validation.validationPlan.useExistingPureValidator === 'validateSoundCpuPrivateMediaManifest', 'validator name mismatch')
assert(parsed.validation.validationPlan.validatorSourcePath === existingSourcePath, 'validator source path mismatch')
assert(parsed.validation.validationPlan.validateRuntimeDefaultsRemainFalse === true, 'runtime default validation missing')
assertFalse(parsed.validation.executionState.runValidatorWithRealPayloadToday, 'real payload validation must be false')
assertFalse(parsed.nonExecution.closedExecutionGates.manifestInstanceCreatedToday, 'non-execution manifest instance must be false')
assertFalse(parsed.nonExecution.closedExecutionGates.realMediaBytesUsedToday, 'non-execution media bytes must be false')
assertFalse(parsed.nonExecution.readinessClaims.runtimeReadinessClaimed, 'runtime readiness must be unclaimed')
assert(parsed.blockers.resolvedForThisGate.includes('manifestInstanceShapePlanned'), 'blocker resolution missing')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.manifestInstanceOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.manifestInstancePlanningCompleted === true, 'policy planning claim missing')
assertFalse(parsed.policy.blockedClaims.manifestInstanceCreatedToday, 'policy instance creation must be false')
assertFalse(parsed.policy.blockedClaims.realUserMediaBetaReadyClaimed, 'policy beta readiness must be false')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase88_caption_render_runtime_hook_private_manifest_instance_owner_review_passed_with_warnings_ready_for_instance_static_validation_plan_no_execution', 'next prompt expected decision mismatch')
assertFalse(parsed.next.reviewScope.createManifestToday, 'next prompt create manifest must be false')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt open media must be false')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      existingSourcePath,
      manifestInstancePlanningCompleted: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
