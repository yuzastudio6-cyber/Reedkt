import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase76_caption_render_runtime_hook_limited_real_media_fixture_planning_completed_with_warnings_ready_for_fixture_planning_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase76_caption_render_runtime_hook_limited_real_media_fixture_planning_owner_review_passed_with_warnings_ready_for_fixture_static_validation_no_execution'
const sourceMergeCommit = 'cbddff3f27033478ac5cffc5f2ad0f85d2547f77'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE77-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-REAL-MEDIA-FIXTURE-STATIC-VALIDATION'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-result.md',
  fixtureIds:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-identifier-register.md',
  privateMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-asset-example-register.md',
  plannedArtifacts:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-planned-private-artifact-example-register.md',
  staticPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-plan-owner-acceptance-register.md',
  fixtureReview:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-identifier-owner-review-register.md',
  mediaArtifactReview:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-artifact-owner-review-register.md',
  staticReview:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-owner-review-register.md',
  prohibited:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-owner-prohibited-runtime-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation.md',
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
    'realMediaBytesApprovedToday": true',
    'mediaFileOpenApprovedToday": true',
    'artifactCreationApprovedToday": true',
    'fixtureManifestPersistenceApprovedToday": true',
    'workerDispatchApprovedToday": true',
    'routeToolProviderExecutionApprovedToday": true',
    'supabaseSqlApprovedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'realMediaBytesAttachedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'fixtureRecordsPersistedToday": true',
    'storageObjectReadToday": true',
    'signedUrlCreatedToday": true',
    'privateArtifactWrittenToday": true',
    'storageTransferToday": true',
    'publicArtifactCreatedToday": true',
    'openMediaFileToday": true',
    'createArtifactToday": true',
    'persistManifestToday": true',
    'dispatchWorkerToday": true',
    'useRealMediaBytesToday": true',
    'persistFixtureManifestToday": true',
    'touchSupabaseSqlToday": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
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
  staticPlan: parseJsonBlock(
    docs.staticPlan,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-plan-owner-acceptance-register',
  ),
  fixtureReview: parseJsonBlock(
    docs.fixtureReview,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-identifier-owner-review-register',
  ),
  mediaArtifactReview: parseJsonBlock(
    docs.mediaArtifactReview,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-artifact-owner-review-register',
  ),
  staticReview: parseJsonBlock(
    docs.staticReview,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-owner-review-register',
  ),
  prohibited: parseJsonBlock(
    docs.prohibited,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-owner-prohibited-runtime-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected owner-review decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.fixturePlanning.manifestBackedFixtureIdsPlanned === true, 'fixture IDs not planned in source')
assert(parsed.result.decision === decision, 'owner-review result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.acceptedForStaticValidationOnly.fixtureStaticValidationMayProceed === true, 'static validation not allowed')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForStaticValidationOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForStaticValidationOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForStaticValidationOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForStaticValidationOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForStaticValidationOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForStaticValidationOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForStaticValidationOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForStaticValidationOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForStaticValidationOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.fixtureIds.plannedFixtureIds.length === 3, 'source fixture ID count mismatch')
assert(parsed.privateMedia.privateMediaAssetIdExamples.length === 3, 'source private media count mismatch')
assert(parsed.plannedArtifacts.plannedPrivateArtifactIdExamples.length === 3, 'source planned artifact count mismatch')
assert(parsed.staticPlan.futureStaticValidationChecks.runtimeFlagsRemainFalse === true, 'runtime false validation missing')
assert(parsed.acceptance.acceptedFixturePlanningEvidence.plannedFixtureIdCount === 3, 'acceptance fixture count mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.fixtureStaticValidationExecution === true, 'static validation next gate missing')
assertFalse(parsed.acceptance.acceptedForNextGateOnly.realMediaRead, 'real media read must remain blocked')
assert(parsed.fixtureReview.acceptedEvidence.manifestBackedOnly === true, 'fixture owner review missing manifest-backed evidence')
assert(parsed.fixtureReview.acceptedEvidence.plannedFixtureIds.length === 3, 'fixture review ID count mismatch')
assertFalse(parsed.fixtureReview.executionState.fixtureRecordsPersistedToday, 'fixture records must not persist')
assert(parsed.mediaArtifactReview.acceptedPrivateMediaAssetIds.count === 3, 'private media review count mismatch')
assert(parsed.mediaArtifactReview.acceptedPlannedPrivateArtifactIds.count === 3, 'planned artifact review count mismatch')
assertFalse(parsed.mediaArtifactReview.executionState.mediaFileOpenedToday, 'media file must not open')
assertFalse(parsed.mediaArtifactReview.executionState.artifactCreatedToday, 'artifact must not be created')
assert(parsed.staticReview.acceptedStaticValidationPlan.fixtureIdsAreManifestBacked === true, 'static review missing fixture check')
assertFalse(parsed.staticReview.allowedNextGate.openMediaFileToday, 'next gate must block media open')
assert(parsed.prohibited.acceptedState.runtimeFlagsRemainFalse === true, 'prohibited state missing runtime false')
assert(parsed.prohibited.acceptedState.generatedLocalFixturePassedUnclaimed === true, 'generated fixture pass must remain unclaimed')
assert(parsed.blockers.remainingBlockersBeforeExecution.fixtureStaticValidation === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'Phase 77 prompt source decision mismatch')
assert(parsed.next.validationScope.validateFixtureIdentifierStrings === true, 'Phase 77 prompt missing fixture validation')
assertFalse(parsed.next.validationScope.useRealMediaBytesToday, 'Phase 77 prompt must block real media bytes')
assertFalse(parsed.next.validationScope.openMediaFileToday, 'Phase 77 prompt must block media open')
assertFalse(parsed.next.validationScope.createArtifactToday, 'Phase 77 prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureStaticValidationMayProceed: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
