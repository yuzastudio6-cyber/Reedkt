import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase74_caption_render_runtime_hook_real_media_artifact_boundary_plan_completed_with_warnings_ready_for_real_media_artifact_boundary_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase74_caption_render_runtime_hook_real_media_artifact_boundary_owner_review_passed_with_warnings_ready_for_limited_real_media_boundary_static_validation_no_execution'
const sourceMergeCommit = '86200b16480f38b5fe8284d135c9f40e78cb3a17'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE75-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-REAL-MEDIA-BOUNDARY-STATIC-VALIDATION'

const docs = {
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-acceptance-register.md',
  media:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-boundary-owner-review-register.md',
  artifact:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-artifact-boundary-owner-review-register.md',
  dispatchSupabase:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-worker-dispatch-supabase-owner-review-register.md',
  beta:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-beta-owner-review-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation.md',
  phase74Plan:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-plan-result.md',
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review.md',
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
  if (!condition) {
    throw new Error(message)
  }
}

function assertFalse(value, message) {
  assert(value === false, message)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'realMediaExecutionApprovedToday": true',
    'artifactCreationApprovedToday": true',
    'workerDispatchApprovedToday": true',
    'routeToolProviderExecutionApprovedToday": true',
    'supabaseSqlApprovedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'mediaFileOpenApprovedToday": true',
    'privateArtifactWriteApprovedToday": true',
    'toolExecutionApprovedToday": true',
    'providerModelCallApprovedToday": true',
    'supabaseMutationApprovedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-acceptance-register',
  ),
  media: parseJsonBlock(
    docs.media,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-boundary-owner-review-register',
  ),
  artifact: parseJsonBlock(
    docs.artifact,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-artifact-boundary-owner-review-register',
  ),
  dispatchSupabase: parseJsonBlock(
    docs.dispatchSupabase,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-worker-dispatch-supabase-owner-review-register',
  ),
  beta: parseJsonBlock(
    docs.beta,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-beta-owner-review-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation',
  ),
  phase74Plan: parseJsonBlock(
    docs.phase74Plan,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-plan-result',
  ),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review',
  ),
}

for (const file of Object.values(docs)) {
  assertNoUnsafeClaims(file)
}

assert(parsed.phase74Plan.decision === sourceDecision, 'Phase 74 plan source decision mismatch')
assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'Source prompt required decision mismatch')
assert(parsed.result.decision === decision, 'Owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'Expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'Real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'Next prompt mismatch')

const boundary = parsed.result.reviewedBoundaryPlan
assert(boundary.privateMediaReadBoundaryAcceptedForStaticValidation === true, 'media boundary not accepted')
assert(boundary.privateArtifactWriteBoundaryAcceptedForStaticValidation === true, 'artifact boundary not accepted')
assert(boundary.manifestBackedIdempotencyAndOwnershipAccepted === true, 'ownership boundary not accepted')
assert(boundary.storageTransferAndSignedUrlProhibitionsAccepted === true, 'storage prohibition not accepted')
assert(boundary.workerDispatchPreflightAcceptedForStaticValidation === true, 'dispatch preflight not accepted')
assert(boundary.supabaseNoOpFutureMigrationBoundaryAccepted === true, 'Supabase boundary not accepted')
assert(boundary.realUserMediaBetaGateAcceptedForStaticValidation === true, 'beta gate not accepted')
for (const value of [
  boundary.realMediaExecutionApprovedToday,
  boundary.artifactCreationApprovedToday,
  boundary.workerDispatchApprovedToday,
  boundary.routeToolProviderExecutionApprovedToday,
  boundary.supabaseSqlApprovedToday,
  boundary.externalBetaUnlockedToday,
  boundary.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.acceptance.acceptedForStaticValidationOnly.privateMediaReadBoundary === true, 'acceptance missing media')
assertFalse(parsed.acceptance.acceptedForExecutionToday.realMediaRead, 'real media read must be blocked')
assertFalse(parsed.acceptance.acceptedForExecutionToday.privateArtifactWrite, 'private artifact write must be blocked')
assertFalse(parsed.acceptance.acceptedForExecutionToday.workerDispatch, 'worker dispatch must be blocked')
assertFalse(parsed.acceptance.acceptedForExecutionToday.supabaseMutation, 'Supabase mutation must be blocked')
assert(parsed.media.acceptedStaticChecks.privateMediaAssetIdsRequired === true, 'media id static check missing')
assertFalse(parsed.media.executionState.mediaFileOpenApprovedToday, 'media open must remain blocked')
assert(parsed.artifact.acceptedStaticChecks.plannedPrivateArtifactIdsRequired === true, 'artifact id static check missing')
assertFalse(parsed.artifact.executionState.privateArtifactWriteApprovedToday, 'artifact write must remain blocked')
assert(parsed.dispatchSupabase.dispatchPreflightAcceptedForStaticValidation.privateManifestValidationRequired === true, 'dispatch preflight missing private manifest')
assert(parsed.dispatchSupabase.supabaseClassification.updateRequired === 'no', 'Supabase update must remain no')
assertFalse(parsed.dispatchSupabase.executionState.workerDispatchApprovedToday, 'dispatch must remain blocked')
assertFalse(parsed.dispatchSupabase.executionState.supabaseMutationApprovedToday, 'Supabase mutation must remain blocked')
assert(parsed.beta.acceptedForNextStaticValidation.privateManifestBoundary === true, 'beta static validation gate missing')
assertFalse(parsed.beta.betaState.realUserMediaBetaAllowedToday, 'real user media beta must remain blocked')
assert(parsed.beta.readinessClaims.generated_local_fixture_passed === 'unclaimed', 'generated fixture claim must be unclaimed')
assert(parsed.beta.readinessClaims.dry_run_passed === 'unclaimed', 'dry-run claim must be unclaimed')
assert(parsed.blockers.remainingBlockersBeforeExecution.limitedRealMediaBoundaryStaticValidation === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy must keep approvals none')
assert(parsed.next.requiredSourceDecision === decision, 'Phase 75 prompt source decision mismatch')
assert(parsed.next.validationScope.validatePrivateManifestStaticBoundary === true, 'Phase 75 prompt missing private manifest static validation')
assertFalse(parsed.next.validationScope.openMediaFileToday, 'Phase 75 prompt must block media open')
assertFalse(parsed.next.validationScope.createArtifactToday, 'Phase 75 prompt must block artifact creation')
assertFalse(parsed.next.validationScope.dispatchWorkerToday, 'Phase 75 prompt must block worker dispatch')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      acceptedForStaticValidationOnly: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
