import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase85_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_owner_review_passed_with_warnings_ready_for_real_media_artifact_boundary_planning_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase86_caption_render_runtime_hook_real_media_artifact_boundary_planning_completed_with_warnings_ready_for_boundary_owner_review_no_execution'
const sourceMergeCommit = 'a8739f356cca9bd4f96ca5de4590e86852633e55'
const targetRoot = '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE86-CAPTION-RENDER-RUNTIME-HOOK-REAL-MEDIA-ARTIFACT-BOUNDARY-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning.md',
  sourceOwnerReview:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning-result.md',
  mediaBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-boundary-plan.md',
  privateManifest:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-boundary-plan.md',
  artifactBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-artifact-delivery-boundary-plan.md',
  workerPreconditions:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-worker-dispatch-preconditions-plan.md',
  nonExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-non-execution-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review.md',
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
    'writeStorageObjectToday": true',
    'dispatchWorkerToday": true',
    'workerDispatchedToday": true',
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
    'externalBetaReadinessClaimed": true',
    'productionReadinessClaimed": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning',
  ),
  sourceOwnerReview: parseJsonBlock(
    docs.sourceOwnerReview,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning-result',
  ),
  mediaBoundary: parseJsonBlock(
    docs.mediaBoundary,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-boundary-plan',
  ),
  privateManifest: parseJsonBlock(
    docs.privateManifest,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-boundary-plan',
  ),
  artifactBoundary: parseJsonBlock(
    docs.artifactBoundary,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-artifact-delivery-boundary-plan',
  ),
  workerPreconditions: parseJsonBlock(
    docs.workerPreconditions,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-worker-dispatch-preconditions-plan',
  ),
  nonExecution: parseJsonBlock(
    docs.nonExecution,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-non-execution-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.planningScope.planRealMediaArtifactBoundary === true, 'source prompt boundary planning missing')
assertFalse(parsed.sourcePrompt.planningScope.useRealMediaBytesToday, 'source prompt must block media bytes')
assertFalse(parsed.sourcePrompt.planningScope.createArtifactToday, 'source prompt must block artifacts')
assert(parsed.sourceOwnerReview.decision === sourceDecision, 'source owner review decision mismatch')
assert(parsed.sourceOwnerReview.sourceVerification.sourceMergeCommit === 'a941b14cc77bcf974eb508a67fa3be921c3d5c1b', 'source owner parent merge mismatch')
assert(parsed.sourceOwnerReview.ownerReview.approveNextPlanningOnly === true, 'source owner planning approval missing')
assert(parsed.sourceOwnerReview.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceOwnerReview.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution must be zero')
assert(!fs.existsSync(targetRoot), 'disposable proof target still exists')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.boundaryPlanning.realMediaArtifactBoundaryPlanned === true, 'result boundary plan missing')
assert(parsed.result.boundaryPlanning.privateManifestOnlyPlanned === true, 'result private manifest plan missing')
assert(parsed.result.boundaryPlanning.noSignedPublicArtifactDefaultPlanned === true, 'result signed URL default missing')
assert(parsed.result.boundaryPlanning.workerDispatchPreconditionsPlanned === true, 'result worker preconditions missing')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.boundaryPlanning.useRealMediaBytesToday,
  parsed.result.boundaryPlanning.openMediaFileToday,
  parsed.result.boundaryPlanning.createArtifactToday,
  parsed.result.boundaryPlanning.createSignedUrlToday,
  parsed.result.boundaryPlanning.dispatchWorkerToday,
  parsed.result.boundaryPlanning.callRouteToolProviderToday,
  parsed.result.boundaryPlanning.touchSupabaseSqlToday,
  parsed.result.boundaryPlanning.unlockBetaToday,
  parsed.result.boundaryPlanning.unlockProductionToday,
]) {
  assertFalse(value, 'boundary planning execution state must remain false')
}

assert(parsed.mediaBoundary.acceptedFutureInputBoundary.rejectSignedUrlsAsSourceOfTruth === true, 'media boundary signed URL rejection missing')
assertFalse(parsed.mediaBoundary.executionState.openMediaFileToday, 'media boundary must block file open')
assert(parsed.privateManifest.privateManifestPolicy.manifestContainsNoSignedUrls === true, 'private manifest signed URL policy missing')
assertFalse(parsed.privateManifest.executionState.createManifestToday, 'manifest must not be created')
assert(parsed.artifactBoundary.artifactDeliveryPolicy.privateArtifactsOnly === true, 'artifact private policy missing')
assert(parsed.artifactBoundary.artifactDeliveryPolicy.signedUrlCreationDefault === false, 'signed URL default must be false')
assertFalse(parsed.artifactBoundary.executionState.artifactCreatedToday, 'artifact must not be created')
assert(parsed.workerPreconditions.workerDispatchPreconditions.requiresApprovedPlanSnapshotId === true, 'worker precondition snapshot missing')
assertFalse(parsed.workerPreconditions.executionState.dispatchWorkerToday, 'worker dispatch must be blocked')
assert(parsed.nonExecution.closedExecutionGates.realMediaBytesUsedToday === false, 'real media gate must be closed')
assert(parsed.nonExecution.closedExecutionGates.supabaseSqlTouchedToday === false, 'Supabase gate must be closed')
assert(parsed.nonExecution.readinessClaims.realUserMediaBetaReadyClaimed === false, 'real media beta must be unclaimed')
assert(parsed.blockers.resolvedForThisGate.includes('realMediaArtifactBoundaryPlanning'), 'boundary blocker not resolved')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentExecution.realMediaArtifactBoundaryOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.realMediaArtifactBoundaryPlanningCompleted === true, 'policy boundary planning claim missing')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewRealMediaBoundaryPlan === true, 'next prompt media review missing')
assert(parsed.next.reviewScope.approvePrivateManifestSourcePlanningOnly === true, 'next prompt next planning approval missing')
assertFalse(parsed.next.reviewScope.useRealMediaBytesToday, 'next prompt must block media bytes')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact')
assertFalse(parsed.next.reviewScope.dispatchWorkerToday, 'next prompt must block worker')
assertFalse(parsed.next.reviewScope.touchSupabaseSqlToday, 'next prompt must block Supabase')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      realMediaArtifactBoundaryPlanningCompleted: true,
      privateManifestOnlyPolicyPlanned: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
