import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase75_caption_render_runtime_hook_limited_real_media_boundary_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase75_caption_render_runtime_hook_limited_real_media_boundary_static_validation_owner_review_passed_with_warnings_ready_for_limited_real_media_fixture_planning_no_execution'
const sourceMergeCommit = '1cde74d647761d6295764c9de76a42b8cfd9f10d'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE76-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-REAL-MEDIA-FIXTURE-PLANNING'

const docs = {
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-acceptance-register.md',
  manifest:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-manifest-static-validation-owner-review-register.md',
  mediaArtifact:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-media-artifact-contract-owner-review-register.md',
  prohibited:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-prohibited-runtime-owner-review-register.md',
  fixtureReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-fixture-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-static-validation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-static-validation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning.md',
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review.md',
  phase75:
    'docs/worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-result.md',
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
    'realMediaExecutionApprovedToday": true',
    'mediaFileOpenApprovedToday": true',
    'artifactCreationApprovedToday": true',
    'workerDispatchApprovedToday": true',
    'routeToolProviderExecutionApprovedToday": true',
    'supabaseSqlApprovedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'realMediaUsedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
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
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-acceptance-register',
  ),
  manifest: parseJsonBlock(
    docs.manifest,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-manifest-static-validation-owner-review-register',
  ),
  mediaArtifact: parseJsonBlock(
    docs.mediaArtifact,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-media-artifact-contract-owner-review-register',
  ),
  prohibited: parseJsonBlock(
    docs.prohibited,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-prohibited-runtime-owner-review-register',
  ),
  fixtureReadiness: parseJsonBlock(
    docs.fixtureReadiness,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-fixture-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-static-validation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-static-validation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning',
  ),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-owner-review',
  ),
  phase75: parseJsonBlock(
    docs.phase75,
    'worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-limited-real-media-boundary-static-validation-result',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.phase75.decision === sourceDecision, 'Phase 75 source decision mismatch')
assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assert(parsed.result.reviewedStaticValidation.limitedRealMediaFixturePlanningMayProceed === true, 'fixture planning not allowed')
for (const value of [
  parsed.result.reviewedStaticValidation.realMediaExecutionApprovedToday,
  parsed.result.reviewedStaticValidation.mediaFileOpenApprovedToday,
  parsed.result.reviewedStaticValidation.artifactCreationApprovedToday,
  parsed.result.reviewedStaticValidation.workerDispatchApprovedToday,
  parsed.result.reviewedStaticValidation.routeToolProviderExecutionApprovedToday,
  parsed.result.reviewedStaticValidation.supabaseSqlApprovedToday,
  parsed.result.reviewedStaticValidation.externalBetaUnlockedToday,
  parsed.result.reviewedStaticValidation.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.acceptance.acceptedForLimitedFixturePlanningOnly.privateManifestStaticBoundary === true, 'fixture planning acceptance missing manifest')
assertFalse(parsed.acceptance.acceptedForExecutionToday.realMediaRead, 'real media read must be blocked')
assertFalse(parsed.acceptance.acceptedForExecutionToday.mediaFileOpen, 'media open must be blocked')
assertFalse(parsed.acceptance.acceptedForExecutionToday.privateArtifactWrite, 'artifact write must be blocked')
assert(parsed.manifest.acceptedEvidence.acceptedWorkerNamesCount === 2, 'worker count mismatch')
assert(parsed.manifest.acceptedEvidence.acceptedJobTypesCount === 4, 'job type count mismatch')
assertFalse(parsed.manifest.executionState.manifestInstanceCreatedToday, 'manifest instance must not be created')
assert(parsed.mediaArtifact.acceptedStaticContracts.privateMediaAssetIdsRequired === true, 'private media id contract missing')
assertFalse(parsed.mediaArtifact.executionState.mediaFileOpenedToday, 'media open must remain blocked')
assertFalse(parsed.mediaArtifact.executionState.artifactCreatedToday, 'artifact creation must remain blocked')
assert(parsed.prohibited.acceptedStaticEvidence.runtimeFlagsRemainFalse === true, 'runtime false evidence missing')
assertFalse(parsed.prohibited.executionState.workerDispatchApprovedToday, 'worker dispatch must remain blocked')
assert(parsed.fixtureReadiness.limitedFixturePlanningMayProceed.manifestBackedFixtureIds === true, 'fixture id planning missing')
assertFalse(parsed.fixtureReadiness.fixturePlanningBoundaries.useRealMediaBytesToday, 'real media bytes must remain blocked')
assertFalse(parsed.fixtureReadiness.fixturePlanningBoundaries.persistFixtureManifestToday, 'fixture persistence must remain blocked')
assert(parsed.blockers.remainingBlockersBeforeExecution.limitedRealMediaFixturePlanning === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'Phase 76 prompt source decision mismatch')
assert(parsed.next.planningScope.planManifestBackedFixtureIds === true, 'Phase 76 prompt missing fixture ids')
assertFalse(parsed.next.planningScope.useRealMediaBytesToday, 'Phase 76 prompt must block real media bytes')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'Phase 76 prompt must block media open')
assertFalse(parsed.next.planningScope.createArtifactToday, 'Phase 76 prompt must block artifacts')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      limitedRealMediaFixturePlanningMayProceed: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
