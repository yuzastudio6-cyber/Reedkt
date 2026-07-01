import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase74_caption_render_runtime_hook_real_media_artifact_boundary_owner_review_passed_with_warnings_ready_for_limited_real_media_boundary_static_validation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase75_caption_render_runtime_hook_limited_real_media_boundary_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_execution'
const sourceMergeCommit = 'b98d9bc560e861a233f450c1d159fc1170952e60'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE75-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-REAL-MEDIA-BOUNDARY-STATIC-VALIDATION-OWNER-REVIEW'

const docs = {
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-result.md',
  manifest:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-manifest-static-boundary-validation-register.md',
  media:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-media-asset-id-contract-validation-register.md',
  artifact:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-artifact-id-contract-validation-register.md',
  prohibited:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-prohibited-runtime-static-scan-register.md',
  supabaseBeta:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-supabase-beta-static-validation-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review.md',
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation.md',
  phase74Review:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result.md',
  privateManifest: 'server/workers/sound-cpu/runtime/privateManifest.ts',
  artifactPolicy: 'server/workers/sound-cpu/runtime/soundCpuArtifactPolicy.ts',
  mediaGuards: 'server/workers/sound-cpu/runtime/soundCpuMediaGuards.ts',
  supabaseGuards: 'server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required file: ${file}`)
  }
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) {
    throw new Error(`Missing JSON block ${label} in ${file}`)
  }
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
    'realMediaUsedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderCalledToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'mediaFileOpenApprovedToday": true',
    'privateArtifactWriteApprovedToday": true',
    'workerDispatchApprovedToday": true',
    'realUserMediaBetaAllowedToday": true',
    'openMediaFileToday": true',
    'createArtifactToday": true',
    'dispatchWorkerToday": true',
    'touchSupabaseSqlToday": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) {
    assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
  }
}

const parsed = {
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-result',
  ),
  manifest: parseJsonBlock(
    docs.manifest,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-manifest-static-boundary-validation-register',
  ),
  media: parseJsonBlock(
    docs.media,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-media-asset-id-contract-validation-register',
  ),
  artifact: parseJsonBlock(
    docs.artifact,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-artifact-id-contract-validation-register',
  ),
  prohibited: parseJsonBlock(
    docs.prohibited,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-prohibited-runtime-static-scan-register',
  ),
  supabaseBeta: parseJsonBlock(
    docs.supabaseBeta,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-supabase-beta-static-validation-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review',
  ),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation',
  ),
  phase74Review: parseJsonBlock(
    docs.phase74Review,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.phase74Review.decision === sourceDecision, 'Phase 74 owner-review decision mismatch')
assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'Phase 75 prompt source decision mismatch')
assert(parsed.result.decision === decision, 'Phase 75 decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'Expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'Real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'Next prompt mismatch')

const validation = parsed.result.staticValidation
assert(validation.privateManifestStaticBoundaryValidated === true, 'private manifest boundary not validated')
assert(validation.privateMediaAssetIdContractValidated === true, 'private media id contract not validated')
assert(validation.plannedPrivateArtifactIdContractValidated === true, 'artifact id contract not validated')
assert(validation.storageSignedUrlPublicArtifactProhibitionsValidated === true, 'prohibitions not validated')
assert(validation.workerDispatchPreflightStaticBoundaryValidated === true, 'dispatch preflight not validated')
assert(validation.supabaseNoOpFutureMigrationBoundaryValidated === true, 'Supabase no-op not validated')
assert(validation.realUserMediaBetaGateRemainsClosedValidated === true, 'beta gate closure not validated')
for (const value of [
  validation.realMediaUsedToday,
  validation.mediaFileOpenedToday,
  validation.artifactCreatedToday,
  validation.workerDispatchedToday,
  validation.routeToolProviderCalledToday,
  validation.supabaseSqlTouchedToday,
  validation.externalBetaUnlockedToday,
  validation.productionUnlockedToday,
]) {
  assertFalse(value, 'runtime action must remain false')
}

assert(parsed.manifest.validatedStaticSource.acceptedWorkerNames === 2, 'worker count mismatch')
assert(parsed.manifest.validatedStaticSource.acceptedJobTypes === 4, 'job type count mismatch')
assert(parsed.manifest.validatedStaticSource.runtimeDefaultsAllFalse === true, 'runtime defaults not validated false')
assert(parsed.manifest.validatedStaticSource.validationRejectsNonFalseRuntimeFlags === true, 'non-false runtime flag rejection missing')
assertFalse(parsed.manifest.executionState.manifestInstanceCreatedToday, 'manifest instance must not be created')
assert(parsed.media.validatedStaticContract.privateMediaAssetIdsRequired === true, 'private media asset id requirement missing')
assertFalse(parsed.media.executionState.mediaFileOpenedToday, 'media file must not be opened')
assert(parsed.artifact.validatedStaticContract.plannedPrivateArtifactIdsRequired === true, 'private artifact id requirement missing')
assertFalse(parsed.artifact.executionState.artifactCreatedToday, 'artifact must not be created')
assert(parsed.prohibited.validatedProhibitions.runtimeFlagsRemainFalse === true, 'runtime false validation missing')
assertFalse(parsed.prohibited.executionState.workerDispatchApprovedToday, 'worker dispatch must remain blocked')
assert(parsed.supabaseBeta.supabaseClassification.updateRequired === 'no', 'Supabase update must remain no')
assertFalse(parsed.supabaseBeta.betaStaticValidation.realUserMediaBetaAllowedToday, 'real user media beta must remain blocked')
assert(parsed.supabaseBeta.betaStaticValidation.generated_local_fixture_passed === 'unclaimed', 'generated fixture claim must be unclaimed')
assert(parsed.blockers.remainingBlockersBeforeExecution.staticValidationOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'owner-review prompt source decision mismatch')
assertFalse(parsed.next.reviewScope.approveRealMediaExecutionToday, 'owner-review prompt must block real media execution')

const privateManifest = read(docs.privateManifest)
assert(privateManifest.includes('privateMediaAssetIds: readonly string[]'), 'private manifest must include privateMediaAssetIds')
assert(privateManifest.includes('plannedPrivateArtifactIds: readonly string[]'), 'private manifest must include plannedPrivateArtifactIds')
assert(privateManifest.includes('artifactWriteEnabled: false'), 'artifact flag must remain false')
assert(privateManifest.includes('mediaProcessingEnabled: false'), 'media flag must remain false')
assert(privateManifest.includes('storageTransferEnabled: false'), 'storage transfer flag must remain false')
assert(privateManifest.includes('signedUrlCreationEnabled: false'), 'signed URL flag must remain false')
assert(privateManifest.includes('runtime_flag_must_remain_false'), 'runtime false validation must exist')
assert(read(docs.artifactPolicy).includes('privateArtifactWriteApproved: false'), 'artifact policy must remain blocked')
assert(read(docs.mediaGuards).includes('mediaFileOpenApproved: false'), 'media guard must remain blocked')
assert(read(docs.supabaseGuards).includes("sqlExecuted: 'no'"), 'Supabase guard must remain no-op')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      staticValidationPassed: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
