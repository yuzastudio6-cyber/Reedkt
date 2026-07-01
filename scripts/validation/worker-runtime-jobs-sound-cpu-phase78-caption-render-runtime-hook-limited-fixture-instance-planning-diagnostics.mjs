import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase77_caption_render_runtime_hook_limited_real_media_fixture_static_validation_owner_review_passed_with_warnings_ready_for_limited_fixture_instance_planning_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase78_caption_render_runtime_hook_limited_fixture_instance_planning_completed_with_warnings_ready_for_instance_planning_owner_review_no_execution'
const sourceMergeCommit = '6bbe17ebc9d30ad6ac3fc90ab877575eecf4a3e0'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE78-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-FIXTURE-INSTANCE-PLANNING-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review-result.md',
  sourceFixtureReview:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-owner-review-register.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-fixture-instance-planning-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-result.md',
  instances:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-register.md',
  mapping:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-media-artifact-mapping-register.md',
  staticPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-plan.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review.md',
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

function assertUnique(values, message) {
  assert(new Set(values).size === values.length, message)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'fixtureInstancesCreatedToday": true',
    'fixtureInstanceCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesUsedToday": true',
    'realMediaBytesAttachedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'storageTransferToday": true',
    'signedUrlCreatedToday": true',
    'staticValidationExecutedToday": true',
    'mediaOperationExecutedToday": true',
    'workerOperationExecutedToday": true',
    'supabaseOperationExecutedToday": true',
    'generatedLocalFixturePassedClaimed": true',
    'dryRunPassedClaimed": true',
    'runtimeReadinessClaimed": true',
    'realUserMediaBetaReadyClaimed": true',
    'createFixtureInstancesToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review-result',
  ),
  sourceFixtureReview: parseJsonBlock(
    docs.sourceFixtureReview,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-owner-review-register',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-fixture-instance-planning-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-result',
  ),
  instances: parseJsonBlock(
    docs.instances,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-register',
  ),
  mapping: parseJsonBlock(
    docs.mapping,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-media-artifact-mapping-register',
  ),
  staticPlan: parseJsonBlock(
    docs.staticPlan,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-plan',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.acceptedForLimitedInstancePlanningOnly.limitedFixtureInstancePlanningMayProceed === true, 'source did not allow instance planning')
assert(parsed.sourceFixtureReview.acceptedValidatedCounts.fixtureIdentifiers === 3, 'source fixture review count mismatch')
assert(parsed.sourceReadiness.limitedFixtureInstancePlanningMayProceed.planFixtureInstanceIds === true, 'source readiness missing instance planning')
assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.fixtureInstancePlanning.fixtureInstanceIdsPlanned === true, 'instance IDs not planned')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.fixtureInstancePlanning.fixtureInstancesCreatedToday,
  parsed.result.fixtureInstancePlanning.realMediaBytesUsedToday,
  parsed.result.fixtureInstancePlanning.mediaFileOpenedToday,
  parsed.result.fixtureInstancePlanning.artifactCreatedToday,
  parsed.result.fixtureInstancePlanning.fixtureManifestPersistedToday,
  parsed.result.fixtureInstancePlanning.workerDispatchedToday,
  parsed.result.fixtureInstancePlanning.routeToolProviderExecutedToday,
  parsed.result.fixtureInstancePlanning.supabaseSqlTouchedToday,
  parsed.result.fixtureInstancePlanning.externalBetaUnlockedToday,
  parsed.result.fixtureInstancePlanning.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

const instances = parsed.instances.plannedFixtureInstances
assert(instances.length === 3, 'expected three planned fixture instances')
assertUnique(instances.map((item) => item.fixtureInstanceId), 'fixture instance IDs must be unique')
assertUnique(instances.map((item) => item.sourceFixtureId), 'source fixture IDs must be unique')
assertUnique(instances.map((item) => item.privateMediaAssetId), 'private media mappings must be unique')
for (const item of instances) {
  assert(/^sound-cpu-caption-render-fixture-instance-\d{3}$/.test(item.fixtureInstanceId), `bad fixture instance ID ${item.fixtureInstanceId}`)
  assert(/^sound-cpu-caption-render-fixture-audio-\d{3}$/.test(item.sourceFixtureId), `bad source fixture ID ${item.sourceFixtureId}`)
  assert(/^private-media-asset:sound-cpu:caption-render:fixture-audio-\d{3}$/.test(item.privateMediaAssetId), `bad private media ID ${item.privateMediaAssetId}`)
  assert(item.plannedPrivateArtifactIds.length >= 1, 'fixture instance must map to artifact IDs')
  for (const artifactId of item.plannedPrivateArtifactIds) {
    assert(
      /^planned-private-artifact:sound-cpu:caption-render:fixture-audio-\d{3}:(caption-json|caption-vtt|render-manifest)$/.test(artifactId),
      `bad planned artifact ID ${artifactId}`,
    )
  }
}
assertFalse(parsed.instances.runtimeState.fixtureInstancesCreatedToday, 'fixture instances must not be created')
assert(parsed.mapping.mappingRules.rawMediaPathsRejected === true, 'raw path rejection missing')
assert(parsed.mapping.validatedMappingCountsPlanned.fixtureInstances === 3, 'mapping fixture count mismatch')
assertFalse(parsed.mapping.runtimeState.mediaFileOpenedToday, 'media file must not open')
assert(parsed.staticPlan.futureStaticValidationChecks.fixtureInstancesReferenceValidatedFixtureIds === true, 'static plan missing fixture references')
assertFalse(parsed.staticPlan.executionState.staticValidationExecutedToday, 'static validation belongs to later gate')
assert(parsed.boundary.blockedToday.fixtureInstanceCreation === true, 'fixture instance creation must be blocked')
assert(parsed.boundary.readinessClaims.runtimeReadinessClaimed === false, 'runtime readiness must be unclaimed')
assert(parsed.blockers.remainingBlockersBeforeExecution.instancePlanningOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewFixtureInstanceIds === true, 'next prompt missing instance ID review')
assertFalse(parsed.next.reviewScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureInstancesPlanned: instances.length,
      privateMediaMappingsPlanned: parsed.mapping.validatedMappingCountsPlanned.privateMediaAssetMappings,
      plannedPrivateArtifactMappingsPlanned: parsed.mapping.validatedMappingCountsPlanned.plannedPrivateArtifactMappings,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
