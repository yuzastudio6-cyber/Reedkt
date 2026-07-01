import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase77_caption_render_runtime_hook_limited_real_media_fixture_static_validation_passed_with_warnings_ready_for_fixture_static_validation_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase77_caption_render_runtime_hook_limited_real_media_fixture_static_validation_owner_review_passed_with_warnings_ready_for_limited_fixture_instance_planning_no_execution'
const sourceMergeCommit = '06a60ef8a5c3d467035db157a3bb51626927e8ac'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE78-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-FIXTURE-INSTANCE-PLANNING'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-result.md',
  sourceFixture:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-identifier-static-validation-register.md',
  sourcePrivateMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-private-media-asset-static-validation-register.md',
  sourceArtifacts:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-planned-private-artifact-static-validation-register.md',
  sourceProhibited:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-static-scan-register.md',
  sourceRuntime:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-runtime-flag-static-validation-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-acceptance-register.md',
  staticReview:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-owner-review-register.md',
  prohibitedReview:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-owner-review-register.md',
  runtimeReview:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-runtime-flag-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-fixture-instance-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning.md',
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
    'fixtureInstanceCreatedToday": true',
    'fixtureInstanceCreationApprovedToday": true',
    'realMediaBytesApprovedToday": true',
    'mediaFileOpenApprovedToday": true',
    'artifactCreationApprovedToday": true',
    'fixtureManifestPersistenceApprovedToday": true',
    'workerDispatchApprovedToday": true',
    'routeToolProviderExecutionApprovedToday": true',
    'supabaseSqlApprovedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'realMediaRead": true',
    'mediaFileOpen": true',
    'privateArtifactWrite": true',
    'manifestPersistence": true',
    'workerDispatch": true',
    'supabaseMutation": true',
    'sqlExecution": true',
    'externalBetaUnlock": true',
    'productionUnlock": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'storageObjectReadToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
    'mediaOperationExecutedToday": true',
    'workerOperationExecutedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseOperationExecutedToday": true',
    'generatedLocalFixturePassedClaimed": true',
    'dryRunPassedClaimed": true',
    'runtimeReadinessClaimed": true',
    'realUserMediaBetaReadyClaimed": true',
    'createFixtureInstancesToday": true',
    'persistFixtureManifestToday": true',
    'openMediaFileToday": true',
    'createArtifactToday": true',
    'dispatchWorkerToday": true',
    'touchSupabaseSqlToday": true',
    'useRealMediaBytesToday": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-result',
  ),
  sourceFixture: parseJsonBlock(
    docs.sourceFixture,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-identifier-static-validation-register',
  ),
  sourcePrivateMedia: parseJsonBlock(
    docs.sourcePrivateMedia,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-private-media-asset-static-validation-register',
  ),
  sourceArtifacts: parseJsonBlock(
    docs.sourceArtifacts,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-planned-private-artifact-static-validation-register',
  ),
  sourceProhibited: parseJsonBlock(
    docs.sourceProhibited,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-static-scan-register',
  ),
  sourceRuntime: parseJsonBlock(
    docs.sourceRuntime,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-runtime-flag-static-validation-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-acceptance-register',
  ),
  staticReview: parseJsonBlock(
    docs.staticReview,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-owner-review-register',
  ),
  prohibitedReview: parseJsonBlock(
    docs.prohibitedReview,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-owner-review-register',
  ),
  runtimeReview: parseJsonBlock(
    docs.runtimeReview,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-runtime-flag-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-fixture-instance-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.staticValidationResult.fixtureIdentifierStringsPassed === true, 'source fixture validation missing')
assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.acceptedForLimitedInstancePlanningOnly.limitedFixtureInstancePlanningMayProceed === true, 'instance planning not allowed')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForLimitedInstancePlanningOnly.fixtureInstanceCreationApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForLimitedInstancePlanningOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.sourceFixture.validatedFixtureSet.plannedFixtureIds.length === 3, 'source fixture count mismatch')
assert(parsed.sourcePrivateMedia.validatedPrivateMediaAssetIds.length === 3, 'source private media count mismatch')
assert(parsed.sourceArtifacts.validatedPlannedPrivateArtifactIds.length === 3, 'source artifact count mismatch')
assert(parsed.sourceProhibited.scanPassed.providerOutputBlobReferences === true, 'source prohibited scan missing')
assert(parsed.sourceRuntime.validatedRuntimeDisabledDefaults.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'source runtime flag missing')
assert(parsed.acceptance.acceptedStaticValidationEvidence.validatedFixtureIdCount === 3, 'acceptance fixture count mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.limitedFixtureInstancePlanning === true, 'limited fixture instance planning missing')
assertFalse(parsed.acceptance.acceptedForNextGateOnly.fixtureInstanceCreation, 'fixture instance creation must be blocked')
assert(parsed.staticReview.acceptedValidatedCounts.fixtureIdentifiers === 3, 'static review fixture count mismatch')
assert(parsed.staticReview.acceptedValidationProperties.idsHaveNoUrls === true, 'url validation missing')
assertFalse(parsed.staticReview.executionState.fixtureInstanceCreatedToday, 'fixture instance must not be created')
assert(parsed.prohibitedReview.acceptedScanResult.httpUrlReferencesAbsent === true, 'http scan missing')
assertFalse(parsed.prohibitedReview.executionState.providerModelCalledToday, 'provider call must remain blocked')
assert(parsed.runtimeReview.acceptedRuntimeDisabledDefaults.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker flag missing')
assertFalse(parsed.runtimeReview.readinessClaims.runtimeReadinessClaimed, 'runtime readiness must be unclaimed')
assert(parsed.readiness.limitedFixtureInstancePlanningMayProceed.planFixtureInstanceIds === true, 'instance ID planning missing')
assertFalse(parsed.readiness.limitedFixtureInstancePlanningMayProceed.createFixtureInstancesToday, 'fixture creation must be blocked')
assertFalse(parsed.readiness.executionState.fixtureInstanceCreatedToday, 'fixture instance created state must be false')
assert(parsed.blockers.remainingBlockersBeforeExecution.limitedFixtureInstancePlanning === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'Phase 78 prompt source decision mismatch')
assert(parsed.next.planningScope.planFixtureInstanceIds === true, 'Phase 78 prompt missing instance planning')
assertFalse(parsed.next.planningScope.createFixtureInstancesToday, 'Phase 78 prompt must block fixture creation')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'Phase 78 prompt must block media open')
assertFalse(parsed.next.planningScope.createArtifactToday, 'Phase 78 prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      limitedFixtureInstancePlanningMayProceed: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
