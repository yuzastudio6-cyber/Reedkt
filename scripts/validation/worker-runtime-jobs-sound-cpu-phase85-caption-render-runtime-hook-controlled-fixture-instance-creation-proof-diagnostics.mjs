import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_fixture_instance_creation_proof_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase85_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_passed_with_warnings_ready_for_proof_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '4a419f9c988381aa8e189e3a7a9e926b5cf83325'
const sourceOwnerReviewSourceMergeCommit = '8c83f3ff8da4b941bfcd94e423d61796a1a05f09'
const targetRoot = '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof'
const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase83-controlled-fixture-instance-creation-proof-runner.mjs'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE85-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-FIXTURE-INSTANCE-CREATION-PROOF-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof.md',
  sourceOwnerReview:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-result.md',
  log:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-log-summary.md',
  manifest:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-manifest-verification-register.md',
  cleanup:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-cleanup-register.md',
  noMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-no-media-no-artifact-execution-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-owner-review.md',
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
    'realMediaBytesUsed": true',
    'openMediaFileToday": true',
    'mediaFileOpened": true',
    'mediaOperationExecuted": true',
    'createArtifactToday": true',
    'artifactCreated": true',
    'storageTransferCreated": true',
    'signedUrlCreated": true',
    'publicArtifactCreated": true',
    'dispatchWorkerToday": true',
    'workerDispatched": true',
    'workerOperationExecuted": true',
    'routeToolProviderExecuted": true',
    'providerModelCalled": true',
    'touchSupabaseSqlToday": true',
    'supabaseSqlTouched": true',
    'supabaseOperationExecuted": true',
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
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof',
  ),
  sourceOwnerReview: parseJsonBlock(
    docs.sourceOwnerReview,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-result',
  ),
  log: parseJsonBlock(
    docs.log,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-log-summary',
  ),
  manifest: parseJsonBlock(
    docs.manifest,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-manifest-verification-register',
  ),
  cleanup: parseJsonBlock(
    docs.cleanup,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-cleanup-register',
  ),
  noMedia: parseJsonBlock(
    docs.noMedia,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-no-media-no-artifact-execution-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-proof-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.proofScope.runExactProofRunnerOnce === true, 'source prompt must permit exact proof runner')
assert(parsed.sourcePrompt.proofScope.runnerPath === runnerPath, 'source prompt runner mismatch')
assert(parsed.sourcePrompt.proofScope.targetRoot === targetRoot, 'source prompt target mismatch')
assertFalse(parsed.sourcePrompt.proofScope.openMediaFileToday, 'source prompt must block media')
assert(parsed.sourceOwnerReview.decision === sourceDecision, 'source owner review decision mismatch')
assert(
  parsed.sourceOwnerReview.sourceVerification.sourceMergeCommit === sourceOwnerReviewSourceMergeCommit,
  'source owner review merge mismatch',
)
assert(parsed.sourceOwnerReview.ownerReview.controlledProofPlanningOnlyApproved === true, 'source owner did not approve next planning')
assert(fs.existsSync(path.join(process.cwd(), runnerPath)), 'runner source missing')
assert(!fs.existsSync(targetRoot), 'disposable proof target still exists')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.controlledProof.runnerExecutedExactlyOnce === true, 'runner execution count claim missing')
assert(parsed.result.controlledProof.status === 'passed', 'proof status mismatch')
assert(parsed.result.controlledProof.fixtureInstanceCount === 3, 'fixture count mismatch')
assert(parsed.result.controlledProof.tempManifestRemoved === true, 'temp manifest must be removed')
assertFalse(parsed.result.controlledProof.disposableTargetExistsAfterProof, 'target must be absent after proof')
assertFalse(parsed.result.controlledProof.mediaFileOpened, 'media file must not open')
assertFalse(parsed.result.controlledProof.artifactCreated, 'artifact must not be created')
assertFalse(parsed.result.controlledProof.workerDispatched, 'worker must not dispatch')
assertFalse(parsed.result.controlledProof.routeToolProviderExecuted, 'route/tool/provider must not execute')
assertFalse(parsed.result.controlledProof.storageTransferCreated, 'storage transfer must not happen')
assertFalse(parsed.result.controlledProof.supabaseSqlTouched, 'Supabase SQL must not be touched')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')

assert(parsed.log.sanitizedOutput.status === 'passed', 'log status mismatch')
assert(parsed.log.sanitizedOutput.fixtureInstanceCount === 3, 'log fixture count mismatch')
assert(parsed.log.sensitiveOutputPolicy.secretsLogged === false, 'secrets must not be logged')
assert(parsed.manifest.manifestVerification.verifiedFixtureInstanceCount === 3, 'manifest fixture count mismatch')
assert(parsed.manifest.manifestVerification.verifiedNoSignedUrls === true, 'manifest signed URL policy missing')
assert(parsed.manifest.cleanupState.disposableTargetExistsAfterProof === false, 'manifest target must be absent')
assert(parsed.cleanup.cleanup.runnerRemovedTargetRoot === true, 'cleanup removal missing')
assert(parsed.cleanup.cleanup.postProofTargetExists === false, 'cleanup target must be absent')
assert(parsed.cleanup.cleanup.repoFileCreatedByProof === false, 'proof must not create repo files')
assert(parsed.noMedia.closedExecutionGates.mediaFileOpened === false, 'media gate must be closed')
assert(parsed.noMedia.closedExecutionGates.artifactCreated === false, 'artifact gate must be closed')
assert(parsed.noMedia.closedExecutionGates.supabaseSqlTouched === false, 'Supabase gate must be closed')
assert(parsed.noMedia.readinessClaims.runtimeReadinessClaimed === false, 'runtime readiness must be unclaimed')
assert(parsed.blockers.resolvedForThisGate.includes('controlledFixtureInstanceCreationProof'), 'controlled proof blocker not resolved')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentExecution.controlledProofOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.policy.allowedClaims.controlledFixtureInstanceCreationProofPassed === true, 'policy proof claim missing')
assert(parsed.policy.executionApprovalsToday === 'controlled_local_fixture_instance_manifest_proof_only', 'policy execution scope mismatch')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewControlledProofResult === true, 'next prompt must review proof')
assertFalse(parsed.next.reviewScope.rerunProofRunnerToday, 'next prompt must not rerun proof')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact')
assertFalse(parsed.next.reviewScope.dispatchWorkerToday, 'next prompt must block worker')
assertFalse(parsed.next.reviewScope.touchSupabaseSqlToday, 'next prompt must block Supabase')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      runnerExecutedExactlyOnce: true,
      fixtureInstanceCount: 3,
      tempManifestRemoved: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
