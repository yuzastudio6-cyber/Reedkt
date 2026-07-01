import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase85_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_passed_with_warnings_ready_for_proof_owner_review_no_media_no_artifacts'
const decision =
  'worker_runtime_jobs_sound_cpu_phase85_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_owner_review_passed_with_warnings_ready_for_real_media_artifact_boundary_planning_no_execution'
const sourceMergeCommit = 'a941b14cc77bcf974eb508a67fa3be921c3d5c1b'
const targetRoot = '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE86-CAPTION-RENDER-RUNTIME-HOOK-REAL-MEDIA-ARTIFACT-BOUNDARY-PLANNING'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-result.md',
  sourceManifest:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-manifest-verification-register.md',
  sourceCleanup:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-cleanup-register.md',
  sourceNoMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-no-media-no-artifact-execution-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-evidence-owner-review-register.md',
  cleanup:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-cleanup-owner-review-register.md',
  noMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-no-media-no-artifact-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-real-media-artifact-boundary-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning.md',
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
    'rerunProofRunnerToday": true',
    'proofRunnerRerun": true',
    'realMediaBytesUsed": true',
    'useRealMediaBytesToday": true',
    'openMediaFileToday": true',
    'mediaFileOpened": true',
    'mediaOperationExecuted": true',
    'createArtifactToday": true',
    'artifactCreated": true',
    'createSignedUrlToday": true',
    'signedUrlCreated": true',
    'publicArtifactCreated": true',
    'dispatchWorkerToday": true',
    'workerDispatched": true',
    'routeToolProviderExecuted": true',
    'providerModelCalled": true',
    'touchSupabaseSqlToday": true',
    'supabaseSqlTouched": true',
    'dockerCloudRunExecuted": true',
    'externalBetaUnlocked": true',
    'productionUnlocked": true',
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
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-result',
  ),
  sourceManifest: parseJsonBlock(
    docs.sourceManifest,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-manifest-verification-register',
  ),
  sourceCleanup: parseJsonBlock(
    docs.sourceCleanup,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-cleanup-register',
  ),
  sourceNoMedia: parseJsonBlock(
    docs.sourceNoMedia,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-no-media-no-artifact-execution-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-evidence-owner-review-register',
  ),
  cleanup: parseJsonBlock(
    docs.cleanup,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-cleanup-owner-review-register',
  ),
  noMedia: parseJsonBlock(
    docs.noMedia,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-no-media-no-artifact-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-real-media-artifact-boundary-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-artifact-boundary-planning',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assertFalse(parsed.sourcePrompt.reviewScope.rerunProofRunnerToday, 'source prompt must block proof rerun')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '4a419f9c988381aa8e189e3a7a9e926b5cf83325', 'source result parent merge mismatch')
assert(parsed.sourceResult.controlledProof.runnerExecutedExactlyOnce === true, 'source proof execution missing')
assert(parsed.sourceResult.controlledProof.fixtureInstanceCount === 3, 'source fixture count mismatch')
assert(parsed.sourceResult.controlledProof.tempManifestRemoved === true, 'source cleanup missing')
assertFalse(parsed.sourceResult.controlledProof.mediaFileOpened, 'source media must remain closed')
assertFalse(parsed.sourceResult.controlledProof.artifactCreated, 'source artifact must remain closed')
assertFalse(parsed.sourceResult.controlledProof.workerDispatched, 'source worker must remain closed')
assert(parsed.sourceManifest.manifestVerification.verifiedFixtureInstanceCount === 3, 'manifest verification count mismatch')
assert(parsed.sourceManifest.cleanupState.disposableTargetExistsAfterProof === false, 'source target should be absent')
assert(parsed.sourceCleanup.cleanup.postProofTargetExists === false, 'cleanup target should be absent')
assert(parsed.sourceNoMedia.closedExecutionGates.supabaseSqlTouched === false, 'source Supabase gate must be closed')
assert(parsed.sourceNoMedia.readinessClaims.runtimeReadinessClaimed === false, 'source runtime readiness must be unclaimed')
assert(!fs.existsSync(targetRoot), 'disposable proof target still exists')

assert(parsed.result.decision === decision, 'owner review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'owner source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'owner source decision mismatch')
assert(parsed.result.ownerReview.controlledProofResultAccepted === true, 'controlled proof not accepted')
assert(parsed.result.ownerReview.approveNextPlanningOnly === true, 'next planning approval missing')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.ownerReview.rerunProofRunnerToday,
  parsed.result.ownerReview.openMediaFileToday,
  parsed.result.ownerReview.createArtifactToday,
  parsed.result.ownerReview.dispatchWorkerToday,
  parsed.result.ownerReview.callRouteToolProviderToday,
  parsed.result.ownerReview.touchSupabaseSqlToday,
  parsed.result.ownerReview.unlockBetaToday,
  parsed.result.ownerReview.unlockProductionToday,
]) {
  assertFalse(value, 'owner review execution state must remain false')
}

assert(parsed.acceptance.acceptedProofEvidence.runnerExecutedExactlyOnce === true, 'acceptance runner proof missing')
assert(parsed.acceptance.acceptedProofEvidence.fixtureInstanceCount === 3, 'acceptance fixture count mismatch')
assert(parsed.acceptance.acceptedNextGateOnly.realMediaArtifactBoundaryPlanningMayProceed === true, 'boundary planning not accepted')
assertFalse(parsed.acceptance.acceptedNextGateOnly.realMediaExecutionToday, 'real media execution must be blocked')
assert(parsed.evidence.reviewedEvidence.runnerCommandWasExact === true, 'evidence exact runner missing')
assertFalse(parsed.evidence.reviewedEvidence.artifactCreated, 'evidence artifact must be false')
assertFalse(parsed.evidence.executionState.rerunProofRunnerToday, 'evidence must not rerun proof')
assert(parsed.cleanup.reviewedCleanup.postProofTargetExists === false, 'cleanup target must be absent')
assertFalse(parsed.cleanup.reviewedCleanup.repoFileCreatedByProof, 'proof must not create repo files')
assert(parsed.noMedia.acceptedClosedExecutionGates.mediaFileOpened === false, 'media gate must be closed')
assert(parsed.noMedia.acceptedClosedExecutionGates.artifactCreated === false, 'artifact gate must be closed')
assert(parsed.noMedia.acceptedClosedExecutionGates.supabaseSqlTouched === false, 'Supabase gate must be closed')
assert(parsed.noMedia.acceptedUnclaimedReadiness.realUserMediaBetaReadyClaimed === false, 'real user media beta must be unclaimed')
assert(parsed.readiness.nextPlanningGate.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.readiness.nextPlanningGate.planMediaArtifactBoundary === true, 'readiness boundary planning missing')
assertFalse(parsed.readiness.stillBlockedToday.openMediaFileToday, 'readiness must block media open')
assertFalse(parsed.readiness.stillBlockedToday.createArtifactToday, 'readiness must block artifact')
assert(parsed.blockers.resolvedForThisGate.includes('controlledProofOwnerReview'), 'owner blocker not resolved')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentExecution.realMediaArtifactBoundaryPlanning === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.realMediaArtifactBoundaryPlanningMayProceed === true, 'policy boundary planning missing')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.planningScope.planRealMediaArtifactBoundary === true, 'next prompt boundary planning missing')
assertFalse(parsed.next.planningScope.useRealMediaBytesToday, 'next prompt must block media bytes')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.planningScope.createArtifactToday, 'next prompt must block artifact')
assertFalse(parsed.next.planningScope.dispatchWorkerToday, 'next prompt must block worker')
assertFalse(parsed.next.planningScope.touchSupabaseSqlToday, 'next prompt must block Supabase')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      controlledProofOwnerReviewAccepted: true,
      realMediaArtifactBoundaryPlanningMayProceed: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
