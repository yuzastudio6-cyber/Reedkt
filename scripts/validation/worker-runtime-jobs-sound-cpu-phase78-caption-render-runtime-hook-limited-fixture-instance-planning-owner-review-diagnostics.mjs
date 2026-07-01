import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase78_caption_render_runtime_hook_limited_fixture_instance_planning_completed_with_warnings_ready_for_instance_planning_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase78_caption_render_runtime_hook_limited_fixture_instance_planning_owner_review_passed_with_warnings_ready_for_instance_static_validation_no_execution'
const sourceMergeCommit = 'd2cee15bfb5f81992d9b51b120a18aa136633db7'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE79-CAPTION-RENDER-RUNTIME-HOOK-FIXTURE-INSTANCE-STATIC-VALIDATION'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-result.md',
  sourceInstances:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-register.md',
  sourceMapping:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-media-artifact-mapping-register.md',
  sourceStaticPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-plan.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-acceptance-register.md',
  instanceReview:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-review-register.md',
  mappingReview:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-readiness-register.md',
  boundaryReview:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-owner-review-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation.md',
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
    'fixtureInstanceCreationApprovedToday": true',
    'fixtureInstanceCreatedToday": true',
    'fixtureInstancesCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesApprovedToday": true',
    'realMediaBytesAttachedToday": true',
    'mediaFileOpenApprovedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreationApprovedToday": true',
    'artifactCreatedToday": true',
    'storageTransferApprovedToday": true',
    'signedUrlCreationApprovedToday": true',
    'workerDispatchApprovedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutionApprovedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlApprovedToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-result',
  ),
  sourceInstances: parseJsonBlock(
    docs.sourceInstances,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-register',
  ),
  sourceMapping: parseJsonBlock(
    docs.sourceMapping,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-media-artifact-mapping-register',
  ),
  sourceStaticPlan: parseJsonBlock(
    docs.sourceStaticPlan,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-plan',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-acceptance-register',
  ),
  instanceReview: parseJsonBlock(
    docs.instanceReview,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-review-register',
  ),
  mappingReview: parseJsonBlock(
    docs.mappingReview,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-readiness-register',
  ),
  boundaryReview: parseJsonBlock(
    docs.boundaryReview,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-owner-review-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.fixtureInstancePlanning.fixtureInstanceIdsPlanned === true, 'source instance planning missing')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution must be zero')
assert(parsed.sourceInstances.plannedFixtureInstances.length === 3, 'source fixture instance count mismatch')
assert(parsed.sourceMapping.validatedMappingCountsPlanned.privateMediaAssetMappings === 3, 'source media mapping count mismatch')
assert(parsed.sourceMapping.validatedMappingCountsPlanned.plannedPrivateArtifactMappings === 3, 'source artifact mapping count mismatch')
assert(parsed.sourceStaticPlan.futureStaticValidationChecks.fixtureInstanceIdsAreUnique === true, 'source static plan missing ID check')
assert(parsed.sourceBoundary.readinessClaims.runtimeReadinessClaimed === false, 'source runtime readiness must be unclaimed')
assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.acceptedForInstanceStaticValidationOnly.fixtureInstanceStaticValidationMayProceed === true, 'static validation not approved')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForInstanceStaticValidationOnly.fixtureInstanceCreationApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForInstanceStaticValidationOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.acceptance.acceptedPlanningCounts.fixtureInstances === 3, 'accepted fixture instance count mismatch')
assert(parsed.acceptance.acceptedNextGateOnly.fixtureInstanceStaticValidation === true, 'next gate not accepted')
assertFalse(parsed.acceptance.acceptedNextGateOnly.fixtureInstanceCreation, 'fixture instance creation must remain blocked')
assert(parsed.instanceReview.acceptedFixtureInstanceIds.length === 3, 'instance review count mismatch')
assert(parsed.instanceReview.reviewResult.idsAreUnique === true, 'instance uniqueness review missing')
assertFalse(parsed.instanceReview.executionState.fixtureInstanceCreatedToday, 'fixture instance must not be created')
assert(parsed.mappingReview.acceptedMappingCounts.privateMediaAssetMappings === 3, 'mapping review media count mismatch')
assert(parsed.mappingReview.acceptedMappingProperties.rawMediaPathsRejected === true, 'raw path rejection missing')
assertFalse(parsed.mappingReview.executionState.mediaFileOpenApprovedToday, 'media open must be blocked')
assert(parsed.readiness.fixtureInstanceStaticValidationMayProceed.validateFixtureInstanceIdUniqueness === true, 'readiness missing static validation')
assertFalse(parsed.readiness.fixtureInstanceStaticValidationMayProceed.openMediaFileToday, 'readiness must block media open')
assert(parsed.boundaryReview.acceptedRuntimeDisabledDefaults.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime flag missing')
assert(parsed.boundaryReview.readinessClaims.runtimeReadinessClaimed === false, 'runtime readiness must be unclaimed')
assert(parsed.blockers.remainingBlockersBeforeExecution.fixtureInstanceStaticValidation === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.validationScope.validateFixtureInstanceIds === true, 'next prompt missing fixture validation')
assertFalse(parsed.next.validationScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.validationScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.validationScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureInstancesAccepted: parsed.instanceReview.acceptedFixtureInstanceIds.length,
      privateMediaMappingsAccepted: parsed.mappingReview.acceptedMappingCounts.privateMediaAssetMappings,
      plannedPrivateArtifactMappingsAccepted: parsed.mappingReview.acceptedMappingCounts.plannedPrivateArtifactMappings,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
