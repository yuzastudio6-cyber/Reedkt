import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase79_caption_render_runtime_hook_fixture_instance_static_validation_owner_review_passed_with_warnings_ready_for_limited_fixture_instance_creation_planning_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase80_caption_render_runtime_hook_limited_fixture_instance_creation_planning_completed_with_warnings_ready_for_creation_planning_owner_review_no_execution'
const sourceMergeCommit = '787c1c60c7a5a1194c3c08d637429abb5ce57742'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE80-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-FIXTURE-INSTANCE-CREATION-PLANNING-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-acceptance-register.md',
  sourceIds:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-owner-review-register.md',
  sourceMappings:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-limited-fixture-instance-creation-planning-readiness-register.md',
  sourceRuntime:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-owner-review-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-result.md',
  preconditions:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-plan.md',
  manifestShape:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-plan.md',
  idempotency:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-plan.md',
  rollback:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-plan.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-plan.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review.md',
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
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'storageTransferToday": true',
    'signedUrlCreatedToday": true',
    'storageObjectReadToday": true',
    'cleanupExecutedToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-acceptance-register',
  ),
  sourceIds: parseJsonBlock(
    docs.sourceIds,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-owner-review-register',
  ),
  sourceMappings: parseJsonBlock(
    docs.sourceMappings,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-limited-fixture-instance-creation-planning-readiness-register',
  ),
  sourceRuntime: parseJsonBlock(
    docs.sourceRuntime,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-owner-review-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-result',
  ),
  preconditions: parseJsonBlock(
    docs.preconditions,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-plan',
  ),
  manifestShape: parseJsonBlock(
    docs.manifestShape,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-plan',
  ),
  idempotency: parseJsonBlock(
    docs.idempotency,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-plan',
  ),
  rollback: parseJsonBlock(
    docs.rollback,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-plan',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-plan',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.acceptedForLimitedCreationPlanningOnly.limitedFixtureInstanceCreationPlanningMayProceed === true, 'source did not allow creation planning')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution must be zero')
assert(parsed.sourceAcceptance.acceptedStaticValidationEvidence.fixtureInstanceIdCount === 3, 'source fixture count mismatch')
assert(parsed.sourceIds.acceptedFixtureInstanceIds.length === 3, 'source ID review count mismatch')
assert(parsed.sourceMappings.acceptedMappingCounts.privateMediaAssetMappings === 3, 'source mapping count mismatch')
assert(parsed.sourceReadiness.limitedFixtureInstanceCreationPlanningMayProceed.planFixtureInstanceCreationPreconditions === true, 'source readiness missing creation planning')
assert(parsed.sourceRuntime.readinessClaims.runtimeReadinessClaimed === false, 'source runtime readiness must be unclaimed')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.creationPlanning.creationPreconditionsPlanned === true, 'preconditions not planned')
assert(parsed.result.creationPlanning.privateManifestInstanceShapePlanned === true, 'manifest shape not planned')
assert(parsed.result.creationPlanning.idempotencyKeysPlanned === true, 'idempotency keys not planned')
assert(parsed.result.creationPlanning.rollbackAndCleanupPolicyPlanned === true, 'rollback policy not planned')
assert(parsed.result.creationPlanning.noMediaOpenNoArtifactWriteBoundaryPlanned === true, 'no media/artifact boundary not planned')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.creationPlanning.fixtureInstancesCreatedToday,
  parsed.result.creationPlanning.realMediaBytesUsedToday,
  parsed.result.creationPlanning.mediaFileOpenedToday,
  parsed.result.creationPlanning.artifactCreatedToday,
  parsed.result.creationPlanning.fixtureManifestPersistedToday,
  parsed.result.creationPlanning.workerDispatchedToday,
  parsed.result.creationPlanning.routeToolProviderExecutedToday,
  parsed.result.creationPlanning.supabaseSqlTouchedToday,
  parsed.result.creationPlanning.externalBetaUnlockedToday,
  parsed.result.creationPlanning.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

assert(parsed.preconditions.plannedPreconditions.fixtureInstanceStaticValidationAccepted === true, 'precondition missing static validation')
assert(parsed.preconditions.plannedFixtureInstanceCount === 3, 'precondition fixture count mismatch')
assertFalse(parsed.preconditions.executionState.fixtureInstanceCreatedToday, 'precondition must not create')
assert(parsed.manifestShape.plannedManifestInstanceShape.requiredFields.includes('idempotencyKey'), 'manifest shape missing idempotency key')
assert(parsed.manifestShape.plannedManifestInstanceShape.disallowedFields.includes('signedUrl'), 'manifest shape must disallow signed URL')
assertFalse(parsed.manifestShape.executionState.fixtureManifestPersistedToday, 'manifest must not persist')
assert(parsed.idempotency.plannedIdempotencyKeys.length === 3, 'expected three idempotency keys')
assertUnique(parsed.idempotency.plannedIdempotencyKeys, 'idempotency keys must be unique')
for (const key of parsed.idempotency.plannedIdempotencyKeys) {
  assert(/^sound-cpu:caption-render:fixture-instance:\d{3}:phase80$/.test(key), `bad idempotency key ${key}`)
}
assert(parsed.idempotency.idempotencyPolicy.keysContainNoSecrets === true, 'idempotency key secret check missing')
assertFalse(parsed.idempotency.executionState.fixtureInstanceCreatedToday, 'idempotency plan must not create')
assert(parsed.rollback.plannedRollbackPolicy.futureCreationFailureRequiresOwnerReviewBeforeRetry === true, 'rollback owner review missing')
assertFalse(parsed.rollback.executionState.cleanupExecutedToday, 'rollback cleanup must not execute')
assert(parsed.boundary.plannedNoExecutionBoundary.mediaFileOpenBlocked === true, 'media boundary missing')
assert(parsed.boundary.plannedNoExecutionBoundary.artifactCreationBlocked === true, 'artifact boundary missing')
assert(parsed.boundary.plannedNoExecutionBoundary.workerDispatchBlocked === true, 'worker boundary missing')
assertFalse(parsed.boundary.executionState.mediaFileOpenedToday, 'boundary must block media open')
assertFalse(parsed.boundary.executionState.artifactCreatedToday, 'boundary must block artifact creation')
assert(parsed.blockers.remainingBlockersBeforeExecution.creationPlanningOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewFixtureInstanceCreationPreconditions === true, 'next prompt missing precondition review')
assertFalse(parsed.next.reviewScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      creationPreconditionsPlanned: true,
      privateManifestInstanceShapePlanned: true,
      idempotencyKeysPlanned: parsed.idempotency.plannedIdempotencyKeys.length,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
