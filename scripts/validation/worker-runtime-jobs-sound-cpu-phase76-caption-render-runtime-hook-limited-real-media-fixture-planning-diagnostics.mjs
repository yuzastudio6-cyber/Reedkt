import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase75_caption_render_runtime_hook_limited_real_media_boundary_static_validation_owner_review_passed_with_warnings_ready_for_limited_real_media_fixture_planning_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase76_caption_render_runtime_hook_limited_real_media_fixture_planning_completed_with_warnings_ready_for_fixture_planning_owner_review_no_execution'
const sourceMergeCommit = 'aec0af5e31f2ec481286acdcdac5e7acaf018bab'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE76-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-REAL-MEDIA-FIXTURE-PLANNING-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-result.md',
  fixtureIds:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-identifier-register.md',
  privateMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-asset-example-register.md',
  plannedArtifacts:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-planned-private-artifact-example-register.md',
  staticValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-plan.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-planning-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-planning-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review.md',
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
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'realMediaBytesAttachedToday": true',
    'storageObjectReadToday": true',
    'signedUrlCreatedToday": true',
    'privateArtifactWrittenToday": true',
    'storageTransferToday": true',
    'publicArtifactCreatedToday": true',
    'staticValidationExecutedToday": true',
    'mediaOperationExecutedToday": true',
    'workerOperationExecutedToday": true',
    'supabaseOperationExecutedToday": true',
    'useRealMediaBytesToday": true',
    'openMediaFileToday": true',
    'createArtifactToday": true',
    'persistFixtureManifestToday": true',
    'dispatchWorkerToday": true',
    'touchSupabaseSqlToday": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-result',
  ),
  fixtureIds: parseJsonBlock(
    docs.fixtureIds,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-identifier-register',
  ),
  privateMedia: parseJsonBlock(
    docs.privateMedia,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-asset-example-register',
  ),
  plannedArtifacts: parseJsonBlock(
    docs.plannedArtifacts,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-planned-private-artifact-example-register',
  ),
  staticValidation: parseJsonBlock(
    docs.staticValidation,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-plan',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-planning-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-planning-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.reviewedStaticValidation.limitedRealMediaFixturePlanningMayProceed === true, 'source did not allow fixture planning')
assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.fixturePlanning.manifestBackedFixtureIdsPlanned === true, 'fixture ids not planned')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.fixturePlanning.realMediaBytesUsedToday,
  parsed.result.fixturePlanning.mediaFileOpenedToday,
  parsed.result.fixturePlanning.artifactCreatedToday,
  parsed.result.fixturePlanning.fixtureManifestPersistedToday,
  parsed.result.fixturePlanning.workerDispatchedToday,
  parsed.result.fixturePlanning.routeToolProviderExecutedToday,
  parsed.result.fixturePlanning.supabaseSqlTouchedToday,
  parsed.result.fixturePlanning.externalBetaUnlockedToday,
  parsed.result.fixturePlanning.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

assert(parsed.fixtureIds.fixtureSet.manifestBackedOnly === true, 'fixture set must be manifest-backed')
assertFalse(parsed.fixtureIds.fixtureSet.rawMediaPathsAllowed, 'raw media paths must be rejected')
assertFalse(parsed.fixtureIds.fixtureSet.signedUrlsAllowedAsSourceOfTruth, 'signed URLs must be rejected')
assert(parsed.fixtureIds.plannedFixtureIds.length === 3, 'expected three fixture IDs')
assertFalse(parsed.fixtureIds.runtimeState.fixtureRecordsPersistedToday, 'fixture records must not be persisted')
assertFalse(parsed.fixtureIds.runtimeState.realMediaBytesAttachedToday, 'real media must not be attached')
assert(parsed.privateMedia.privateMediaAssetIdExamples.length === 3, 'expected three media asset examples')
assert(parsed.privateMedia.acceptedConstraints.idsMustNotExposeRawPath === true, 'raw path rejection missing')
assertFalse(parsed.privateMedia.runtimeState.mediaFileOpenedToday, 'media file must not open')
assertFalse(parsed.privateMedia.runtimeState.signedUrlCreatedToday, 'signed URL must not be created')
assert(parsed.plannedArtifacts.plannedPrivateArtifactIdExamples.length === 3, 'expected three planned artifact examples')
assert(parsed.plannedArtifacts.acceptedConstraints.publicArtifactCreationRejected === true, 'public artifact rejection missing')
assertFalse(parsed.plannedArtifacts.runtimeState.artifactCreatedToday, 'artifact must not be created')
assert(parsed.staticValidation.futureStaticValidationChecks.runtimeFlagsRemainFalse === true, 'runtime false validation missing')
assertFalse(parsed.staticValidation.executionState.staticValidationExecutedToday, 'static validation is later gate')
assert(parsed.blockers.remainingBlockersBeforeExecution.fixturePlanningOwnerReview === 'required_next', 'owner review blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewFixtureIdentifierPlan === true, 'next prompt missing fixture review')
assertFalse(parsed.next.reviewScope.useRealMediaBytesToday, 'next prompt must block real media bytes')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureIdentifiersPlanned: parsed.fixtureIds.plannedFixtureIds.length,
      privateMediaAssetExamples: parsed.privateMedia.privateMediaAssetIdExamples.length,
      plannedPrivateArtifactExamples: parsed.plannedArtifacts.plannedPrivateArtifactIdExamples.length,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
