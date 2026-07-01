import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase80_caption_render_runtime_hook_limited_fixture_instance_creation_planning_completed_with_warnings_ready_for_creation_planning_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase80_caption_render_runtime_hook_limited_fixture_instance_creation_planning_owner_review_passed_with_warnings_ready_for_fixture_instance_creation_static_plan_no_execution'
const sourceMergeCommit = 'fc7e6b6e3d738b195d7563676a2c5e3824bdd07b'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE81-CAPTION-RENDER-RUNTIME-HOOK-FIXTURE-INSTANCE-CREATION-STATIC-PLAN'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-result.md',
  sourcePreconditions:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-plan.md',
  sourceManifestShape:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-plan.md',
  sourceIdempotency:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-plan.md',
  sourceRollback:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-plan.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-acceptance-register.md',
  preconditionReview:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-owner-review-register.md',
  manifestReview:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register.md',
  idempotencyReview:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-owner-review-register.md',
  rollbackReview:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-owner-review-register.md',
  boundaryReview:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-static-plan-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan.md',
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
    'fixtureInstanceCreationApprovedToday": true',
    'fixtureInstanceCreatedToday": true',
    'fixtureInstancesCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesApprovedToday": true',
    'realMediaBytesUsedToday": true',
    'mediaFileOpenApprovedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreationApprovedToday": true',
    'artifactCreatedToday": true',
    'storageTransferApprovedToday": true',
    'signedUrlCreationApprovedToday": true',
    'storageObjectReadToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-result',
  ),
  sourcePreconditions: parseJsonBlock(
    docs.sourcePreconditions,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-plan',
  ),
  sourceManifestShape: parseJsonBlock(
    docs.sourceManifestShape,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-plan',
  ),
  sourceIdempotency: parseJsonBlock(
    docs.sourceIdempotency,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-plan',
  ),
  sourceRollback: parseJsonBlock(
    docs.sourceRollback,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-plan',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-acceptance-register',
  ),
  preconditionReview: parseJsonBlock(
    docs.preconditionReview,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-owner-review-register',
  ),
  manifestReview: parseJsonBlock(
    docs.manifestReview,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register',
  ),
  idempotencyReview: parseJsonBlock(
    docs.idempotencyReview,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-owner-review-register',
  ),
  rollbackReview: parseJsonBlock(
    docs.rollbackReview,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-owner-review-register',
  ),
  boundaryReview: parseJsonBlock(
    docs.boundaryReview,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-static-plan-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '787c1c60c7a5a1194c3c08d637429abb5ce57742', 'source result parent merge mismatch')
assert(parsed.sourceResult.creationPlanning.creationPreconditionsPlanned === true, 'source preconditions not planned')
assert(parsed.sourceResult.creationPlanning.privateManifestInstanceShapePlanned === true, 'source manifest shape not planned')
assert(parsed.sourceResult.creationPlanning.idempotencyKeysPlanned === true, 'source idempotency not planned')
assert(parsed.sourceResult.creationPlanning.rollbackAndCleanupPolicyPlanned === true, 'source rollback not planned')
assert(parsed.sourceResult.creationPlanning.noMediaOpenNoArtifactWriteBoundaryPlanned === true, 'source boundary not planned')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution must be zero')
assert(parsed.sourcePreconditions.plannedFixtureInstanceCount === 3, 'source fixture count mismatch')
assert(parsed.sourceManifestShape.plannedManifestInstanceShape.requiredFields.includes('idempotencyKey'), 'source manifest missing idempotency key')
assert(parsed.sourceManifestShape.plannedManifestInstanceShape.disallowedFields.includes('signedUrl'), 'source manifest must disallow signed URLs')
assert(parsed.sourceIdempotency.plannedIdempotencyKeys.length === 3, 'source idempotency count mismatch')
assertUnique(parsed.sourceIdempotency.plannedIdempotencyKeys, 'source idempotency keys not unique')
assert(parsed.sourceRollback.plannedRollbackPolicy.futureCreationFailureRequiresOwnerReviewBeforeRetry === true, 'source rollback owner review missing')
assert(parsed.sourceBoundary.plannedNoExecutionBoundary.mediaFileOpenBlocked === true, 'source media boundary missing')
assert(parsed.sourceBoundary.plannedNoExecutionBoundary.artifactCreationBlocked === true, 'source artifact boundary missing')

assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.fixtureInstanceCreationStaticPlanMayProceed === true, 'static plan not allowed')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.fixtureInstanceCreationApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForFixtureInstanceCreationStaticPlanOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.acceptance.acceptedPlanningEvidence.plannedFixtureInstanceCount === 3, 'acceptance fixture count mismatch')
assert(parsed.acceptance.acceptedPlanningEvidence.plannedIdempotencyKeyCount === 3, 'acceptance idempotency count mismatch')
assert(parsed.acceptance.acceptedNextGateOnly.fixtureInstanceCreationStaticPlan === true, 'next static plan not accepted')
assertFalse(parsed.acceptance.acceptedNextGateOnly.actualFixtureInstanceCreation, 'actual fixture instance creation must remain blocked')
assert(parsed.preconditionReview.acceptedPreconditions.fixtureInstanceStaticValidationAccepted === true, 'precondition review missing static validation')
assert(parsed.preconditionReview.plannedFixtureInstanceCount === 3, 'precondition review count mismatch')
assertFalse(parsed.preconditionReview.executionState.fixtureInstanceCreatedToday, 'precondition review must not create')
assert(parsed.manifestReview.acceptedManifestInstanceShape.requiredFieldsAccepted.includes('idempotencyKey'), 'manifest review missing idempotency key')
assert(parsed.manifestReview.acceptedManifestInstanceShape.disallowedFieldsAccepted.includes('signedUrl'), 'manifest review must disallow signed URL')
assertFalse(parsed.manifestReview.executionState.fixtureManifestPersistedToday, 'manifest review must not persist')
assert(parsed.idempotencyReview.acceptedIdempotencyKeys.length === 3, 'idempotency review count mismatch')
assertUnique(parsed.idempotencyReview.acceptedIdempotencyKeys, 'idempotency review keys must be unique')
for (const key of parsed.idempotencyReview.acceptedIdempotencyKeys) {
  assert(/^sound-cpu:caption-render:fixture-instance:\d{3}:phase80$/.test(key), `bad idempotency key ${key}`)
}
assert(parsed.idempotencyReview.acceptedIdempotencyPolicy.keysContainNoSecrets === true, 'idempotency review secret check missing')
assertFalse(parsed.idempotencyReview.executionState.fixtureInstanceCreatedToday, 'idempotency review must not create')
assert(parsed.rollbackReview.acceptedRollbackPolicy.futureCreationFailureRequiresOwnerReviewBeforeRetry === true, 'rollback review missing owner retry')
assertFalse(parsed.rollbackReview.executionState.cleanupExecutedToday, 'rollback review must not execute cleanup')
assert(parsed.boundaryReview.acceptedNoExecutionBoundary.mediaFileOpenBlocked === true, 'boundary review missing media block')
assert(parsed.boundaryReview.acceptedNoExecutionBoundary.workerDispatchBlocked === true, 'boundary review missing worker block')
assertFalse(parsed.boundaryReview.executionState.mediaFileOpenedToday, 'boundary review must block media open')
assert(parsed.readiness.fixtureInstanceCreationStaticPlanMayProceed.planStaticCreationInputs === true, 'readiness missing static inputs')
assertFalse(parsed.readiness.fixtureInstanceCreationStaticPlanMayProceed.createFixtureInstancesToday, 'readiness must block instance creation')
assert(parsed.readiness.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.blockers.remainingBlockersBeforeExecution.fixtureInstanceCreationStaticPlan === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.disallowedClaims.fixtureInstanceCreated === 'disallowed', 'policy must disallow fixture instance creation')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.planningScope.planStaticFixtureInstanceCreationInputs === true, 'next prompt missing static input planning')
assertFalse(parsed.next.planningScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.planningScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureInstanceCreationStaticPlanMayProceed: true,
      plannedFixtureInstanceCount: 3,
      idempotencyKeysAccepted: parsed.idempotencyReview.acceptedIdempotencyKeys.length,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
