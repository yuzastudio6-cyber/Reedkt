import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase74_caption_render_runtime_hook_real_media_artifact_boundary_plan_completed_with_warnings_ready_for_real_media_artifact_boundary_owner_review_no_execution'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase73_caption_render_runtime_hook_private_manifest_instance_static_validation_owner_review_passed_with_warnings_ready_for_real_media_artifact_boundary_plan_no_execution'
const sourceMergeCommit = '90e8dd83159806d451dbb31614d706275223bb17'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE74-CAPTION-RENDER-RUNTIME-HOOK-REAL-MEDIA-ARTIFACT-BOUNDARY-OWNER-REVIEW'

const docs = {
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-plan-result.md',
  media:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-read-boundary-plan.md',
  artifact:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-artifact-write-boundary-plan.md',
  ownership:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-manifest-idempotency-ownership-boundary-plan.md',
  storage:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-storage-transfer-signed-url-prohibition-register.md',
  dispatch:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-worker-dispatch-preflight-boundary-plan.md',
  supabase:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-supabase-noop-future-migration-boundary-plan.md',
  beta:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-user-media-beta-gate-boundary-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-boundary-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review.md',
  phase73:
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result.md',
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
    'realMediaUsedToday": true',
    'artifactCreatedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderCalledToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'mediaFileOpenApprovedToday": true',
    'privateArtifactWriteApprovedToday": true',
    'storageTransferApprovedToday": true',
    'signedUrlCreationApprovedToday": true',
    'workerDispatchApprovedToday": true',
    'supabaseMutationApprovedToday": true',
    'realUserMediaBetaAllowedToday": true',
  ]
  for (const phrase of unsafe) {
    assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
  }
}

const parsed = {
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-plan-result',
  ),
  media: parseJsonBlock(
    docs.media,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-read-boundary-plan',
  ),
  artifact: parseJsonBlock(
    docs.artifact,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-artifact-write-boundary-plan',
  ),
  ownership: parseJsonBlock(
    docs.ownership,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-manifest-idempotency-ownership-boundary-plan',
  ),
  storage: parseJsonBlock(
    docs.storage,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-storage-transfer-signed-url-prohibition-register',
  ),
  dispatch: parseJsonBlock(
    docs.dispatch,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-worker-dispatch-preflight-boundary-plan',
  ),
  supabase: parseJsonBlock(
    docs.supabase,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-supabase-noop-future-migration-boundary-plan',
  ),
  beta: parseJsonBlock(
    docs.beta,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-user-media-beta-gate-boundary-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-boundary-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-owner-review',
  ),
  phase73: parseJsonBlock(
    docs.phase73,
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result',
  ),
}

for (const file of Object.values(docs)) {
  assertNoUnsafeClaims(file)
}

assert(parsed.phase73.decision === sourceDecision, 'Phase 73 owner-review source decision mismatch')
assert(parsed.result.decision === decision, 'Phase 74 decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Phase 74 source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'Phase 74 source decision mismatch')
assert(parsed.result.boundaryPlan.sourcePath === docs.privateManifest, 'Private manifest path mismatch')
assert(parsed.result.boundaryPlan.privateMediaReadBoundaryPlanned === true, 'Private media boundary not planned')
assert(parsed.result.boundaryPlan.privateArtifactWriteBoundaryPlanned === true, 'Artifact boundary not planned')
assert(parsed.result.boundaryPlan.manifestBackedIdempotencyAndOwnershipPlanned === true, 'Ownership boundary not planned')
assert(parsed.result.boundaryPlan.storageTransferAndSignedUrlProhibitionsPlanned === true, 'Storage prohibition not planned')
assert(parsed.result.boundaryPlan.workerDispatchPreflightPlannedWithoutDispatch === true, 'Dispatch preflight not planned')
assert(parsed.result.boundaryPlan.supabaseNoOpFutureMigrationBoundaryPlanned === true, 'Supabase boundary not planned')
assert(parsed.result.boundaryPlan.realUserMediaBetaGatePlanned === true, 'Real user media beta gate not planned')
assert(parsed.result.soundCpuTools.covered === 15, 'Expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'Real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'Next prompt mismatch')

assert(parsed.media.acceptedInputContractPlanningOnly.privateMediaAssetIdsRequired === true, 'private media ids required')
assertFalse(parsed.media.readBoundary.mediaFileOpenApprovedToday, 'media file open must remain blocked')
assertFalse(parsed.media.readBoundary.workerRuntimeMediaReadApprovedToday, 'runtime media read must remain blocked')
assert(parsed.artifact.acceptedOutputContractPlanningOnly.plannedPrivateArtifactIdsRequired === true, 'artifact ids required')
assertFalse(parsed.artifact.writeBoundary.privateArtifactWriteApprovedToday, 'private artifact write must remain blocked')
assertFalse(parsed.artifact.writeBoundary.signedUrlCreationApprovedToday, 'signed URL creation must remain blocked')
assert(parsed.ownership.manifestOwnershipRequirements.idempotencyKeyRequired === true, 'idempotency required')
assert(parsed.ownership.acceptedWorkers.length === 2, 'accepted worker count mismatch')
assert(parsed.ownership.acceptedJobTypes.length === 4, 'accepted job type count mismatch')
assertFalse(parsed.ownership.executionState.workerExecutionApprovedToday, 'worker execution must remain blocked')
assert(parsed.storage.prohibitedToday.storageTransfer === true, 'storage transfer prohibition missing')
assert(parsed.storage.prohibitedToday.signedUrlCreation === true, 'signed URL prohibition missing')
assertFalse(parsed.storage.phase74Outcome.publicArtifactApprovedToday, 'public artifact must remain blocked')
assert(parsed.dispatch.preflightChecksPlanned.privateManifestValidationRequired === true, 'private manifest preflight missing')
assertFalse(parsed.dispatch.dispatchState.workerDispatchApprovedToday, 'worker dispatch must remain blocked')
assert(parsed.supabase.supabaseClassification.updateRequired === 'no', 'Supabase update must remain no')
assertFalse(parsed.supabase.phase74State.supabaseMutationApprovedToday, 'Supabase mutation must remain blocked')
assert(parsed.beta.realUserMediaBetaGate.limitedBetaSafetyScorecardRequired === true, 'limited beta safety scorecard missing')
assertFalse(parsed.beta.phase74BetaState.realUserMediaBetaAllowedToday, 'real user media beta must remain blocked')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'Owner-review prompt source decision mismatch')
assertFalse(parsed.next.reviewScope.approveRealMediaExecutionToday, 'owner-review prompt must block real media approval today')
assertFalse(parsed.next.reviewScope.approveArtifactCreationToday, 'owner-review prompt must block artifact approval today')
assertFalse(parsed.next.reviewScope.approveWorkerDispatchToday, 'owner-review prompt must block worker dispatch today')

const privateManifest = read(docs.privateManifest)
assert(privateManifest.includes('artifactWriteEnabled: false'), 'private manifest must keep artifact flag false')
assert(privateManifest.includes('storageTransferEnabled: false'), 'private manifest must keep storage flag false')
assert(privateManifest.includes('signedUrlCreationEnabled: false'), 'private manifest must keep signed URL flag false')
assert(privateManifest.includes('mediaProcessingEnabled: false'), 'private manifest must keep media flag false')
assert(read(docs.artifactPolicy).includes('privateArtifactWriteApproved: false'), 'artifact policy must remain blocked')
assert(read(docs.mediaGuards).includes('mediaFileOpenApproved: false'), 'media guard must remain blocked')
assert(read(docs.supabaseGuards).includes('sqlExecuted'), 'Supabase guard classification missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      sourcePath: docs.privateManifest,
      boundaryPlanComplete: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
