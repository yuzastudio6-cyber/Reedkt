import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase86_caption_render_runtime_hook_real_media_artifact_boundary_planning_completed_with_warnings_ready_for_boundary_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase86_caption_render_runtime_hook_real_media_artifact_boundary_owner_review_passed_with_warnings_ready_for_private_manifest_source_planning_no_execution'
const sourceMergeCommit = '7a4de4710807cd8e8e6446a89d09da33d57647d2'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE87-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-SOURCE-PLANNING'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning-result.md',
  sourcePrivateManifest:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-boundary-plan.md',
  sourceArtifactDelivery:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-artifact-delivery-boundary-plan.md',
  sourceWorkerDispatch:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-worker-dispatch-preconditions-plan.md',
  sourceNonExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-non-execution-register.md',
  sourceClaimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-boundary-source-evidence-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-source-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning.md',
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
    'createManifestToday": true',
    'createArtifactToday": true',
    'artifactCreatedToday": true',
    'createSignedUrlToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'storageTransferCreatedToday": true',
    'writeStorageObjectToday": true',
    'dispatchWorkerToday": true',
    'workerDispatchedToday": true',
    'callRouteToolProviderToday": true',
    'routeToolProviderExecutedToday": true',
    'providerModelCalledToday": true',
    'touchSupabaseSqlToday": true',
    'supabaseSqlTouchedToday": true',
    'dockerCloudRunExecuted": true',
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
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning-result',
  ),
  sourcePrivateManifest: parseJsonBlock(
    docs.sourcePrivateManifest,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-boundary-plan',
  ),
  sourceArtifactDelivery: parseJsonBlock(
    docs.sourceArtifactDelivery,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-artifact-delivery-boundary-plan',
  ),
  sourceWorkerDispatch: parseJsonBlock(
    docs.sourceWorkerDispatch,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-worker-dispatch-preconditions-plan',
  ),
  sourceNonExecution: parseJsonBlock(
    docs.sourceNonExecution,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-non-execution-register',
  ),
  sourceClaimPolicy: parseJsonBlock(
    docs.sourceClaimPolicy,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-boundary-source-evidence-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-private-manifest-source-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-source-planning',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1980, 'source result parent PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'a8739f356cca9bd4f96ca5de4590e86852633e55', 'source result parent merge mismatch')
assert(parsed.sourceResult.boundaryPlanning.realMediaArtifactBoundaryPlanned === true, 'boundary planning missing')
assert(parsed.sourceResult.boundaryPlanning.privateManifestOnlyPlanned === true, 'private manifest planning missing')
assert(parsed.sourceResult.boundaryPlanning.workerDispatchPreconditionsPlanned === true, 'worker dispatch planning missing')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution must remain zero')
for (const value of [
  parsed.sourceResult.boundaryPlanning.useRealMediaBytesToday,
  parsed.sourceResult.boundaryPlanning.openMediaFileToday,
  parsed.sourceResult.boundaryPlanning.createArtifactToday,
  parsed.sourceResult.boundaryPlanning.createSignedUrlToday,
  parsed.sourceResult.boundaryPlanning.dispatchWorkerToday,
  parsed.sourceResult.boundaryPlanning.callRouteToolProviderToday,
  parsed.sourceResult.boundaryPlanning.touchSupabaseSqlToday,
  parsed.sourceResult.boundaryPlanning.unlockBetaToday,
  parsed.sourceResult.boundaryPlanning.unlockProductionToday,
]) {
  assertFalse(value, 'source boundary execution state must remain false')
}

assert(parsed.sourcePrivateManifest.privateManifestPolicy.manifestContainsNoSignedUrls === true, 'manifest signed URL policy missing')
assert(parsed.sourcePrivateManifest.privateManifestPolicy.manifestContainsNoSecrets === true, 'manifest secret exclusion missing')
assertFalse(parsed.sourcePrivateManifest.executionState.createManifestToday, 'manifest creation must remain blocked')
assertFalse(parsed.sourcePrivateManifest.executionState.writeStorageObjectToday, 'storage write must remain blocked')
assert(parsed.sourceArtifactDelivery.artifactDeliveryPolicy.privateArtifactsOnly === true, 'private artifact policy missing')
assertFalse(parsed.sourceArtifactDelivery.artifactDeliveryPolicy.signedUrlCreationDefault, 'signed URL default must be false')
assertFalse(parsed.sourceArtifactDelivery.executionState.artifactCreatedToday, 'artifact creation must remain blocked')
assert(parsed.sourceWorkerDispatch.workerDispatchPreconditions.requiresApprovedPlanSnapshotId === true, 'approved snapshot precondition missing')
assert(parsed.sourceWorkerDispatch.workerDispatchPreconditions.requiresWorkerRuntimeExecutionGate === true, 'worker runtime gate precondition missing')
assertFalse(parsed.sourceWorkerDispatch.executionState.dispatchWorkerToday, 'worker dispatch must remain blocked')
assertFalse(
  parsed.sourceNonExecution.closedExecutionGates.realMediaBytesUsedToday,
  'non-execution real media must remain false',
)
assertFalse(parsed.sourceNonExecution.closedExecutionGates.openMediaFileToday, 'non-execution media open must remain false')
assertFalse(
  parsed.sourceNonExecution.closedExecutionGates.createArtifactToday,
  'non-execution artifact creation must remain false',
)
assertFalse(
  parsed.sourceNonExecution.closedExecutionGates.createSignedUrlToday,
  'non-execution signed URL creation must remain false',
)
assertFalse(
  parsed.sourceNonExecution.closedExecutionGates.dispatchWorkerToday,
  'non-execution worker dispatch must remain false',
)
assertFalse(
  parsed.sourceNonExecution.readinessClaims.runtimeReadinessClaimed,
  'non-execution runtime readiness must remain unclaimed',
)
assert(
  parsed.sourceClaimPolicy.disallowedClaims.runtimeReadinessClaimed === 'disallowed',
  'source runtime readiness must be disallowed',
)
assert(
  parsed.sourceClaimPolicy.disallowedClaims.realUserMediaBetaReadyClaimed === 'disallowed',
  'source real user media beta must be disallowed',
)

assert(parsed.result.decision === decision, 'owner review decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1981, 'owner source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'owner source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'owner source decision mismatch')
assert(parsed.result.ownerReview.realMediaBoundaryPlanAccepted === true, 'real media boundary not accepted')
assert(parsed.result.ownerReview.privateManifestBoundaryPlanAccepted === true, 'private manifest boundary not accepted')
assert(parsed.result.ownerReview.artifactDeliveryBoundaryPlanAccepted === true, 'artifact delivery boundary not accepted')
assert(parsed.result.ownerReview.workerDispatchPreconditionsAccepted === true, 'worker dispatch preconditions not accepted')
assert(parsed.result.ownerReview.approvePrivateManifestSourcePlanningOnly === true, 'private manifest source planning approval missing')
assert(parsed.result.soundCpuTools.covered === 15, 'owner tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'owner real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'owner next prompt mismatch')
for (const value of [
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

assert(parsed.acceptance.acceptedPlanningEvidence.coveredSoundCpuTools === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedNextGateOnly.privateManifestSourcePlanningMayProceed === true, 'private manifest source planning not accepted')
assertFalse(parsed.acceptance.acceptedNextGateOnly.realMediaExecutionToday, 'real media execution must be blocked')
assert(parsed.evidence.reviewedSourceEvidence.sourceDecisionAccepted === true, 'source decision not accepted')
assert(parsed.evidence.reviewedSourceEvidence.privateManifestNoSignedUrlPolicyAccepted === true, 'private manifest policy not accepted')
assert(parsed.evidence.reviewedSourceEvidence.workerDispatchRequiresFutureOwnerGates === true, 'worker future gate requirement missing')
assertFalse(parsed.evidence.executionState.createSignedUrlToday, 'signed URL creation must be blocked')
assert(parsed.readiness.nextPlanningGate.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.readiness.nextPlanningGate.privateManifestSourcePlanningMayProceed === true, 'readiness private manifest planning missing')
assertFalse(parsed.readiness.stillBlockedToday.createManifestToday, 'manifest creation must remain blocked')
assertFalse(parsed.readiness.stillBlockedToday.openMediaFileToday, 'media open must remain blocked')
assert(parsed.blockers.resolvedForThisGate.includes('realMediaArtifactBoundaryPlanReviewed'), 'boundary review blocker not resolved')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.privateManifestSourcePlanning === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.boundaryPlanReviewed === true, 'policy boundary review claim missing')
assert(parsed.policy.allowedClaims.privateManifestSourcePlanningMayProceed === true, 'policy next planning claim missing')
assert(parsed.policy.blockedClaims.realMediaBytesUsedToday === false, 'policy real media must be false')
assert(parsed.policy.blockedClaims.runtimeReadinessClaimed === false, 'policy runtime readiness must be unclaimed')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase87_caption_render_runtime_hook_private_manifest_source_planning_completed_with_warnings_ready_for_private_manifest_owner_review_no_execution', 'next prompt expected decision mismatch')
assertFalse(parsed.next.planningScope.createManifestToday, 'next prompt must not create manifest today')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'next prompt must block media open')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      boundaryOwnerReviewAccepted: true,
      privateManifestSourcePlanningMayProceed: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
