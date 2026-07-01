import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase80_caption_render_runtime_hook_limited_fixture_instance_creation_planning_owner_review_passed_with_warnings_ready_for_fixture_instance_creation_static_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase81_caption_render_runtime_hook_fixture_instance_creation_static_plan_completed_with_warnings_ready_for_creation_static_plan_owner_review_no_execution'
const sourceMergeCommit = '02fcae0da43f09df9667005884d11bf845ba41ad'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE81-CAPTION-RENDER-RUNTIME-HOOK-FIXTURE-INSTANCE-CREATION-STATIC-PLAN-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-acceptance-register.md',
  sourcePreconditions:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-owner-review-register.md',
  sourceManifest:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register.md',
  sourceIdempotency:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-owner-review-register.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-owner-review-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-result.md',
  inputs:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-register.md',
  outputShape:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-plan.md',
  idempotency:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-plan.md',
  guards:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-plan.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-plan-safety-scan-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review.md',
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
    'fixtureInstanceCreatedToday": true',
    'fixtureInstancesCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesUsedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'storageTransferToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-acceptance-register',
  ),
  sourcePreconditions: parseJsonBlock(
    docs.sourcePreconditions,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-creation-precondition-owner-review-register',
  ),
  sourceManifest: parseJsonBlock(
    docs.sourceManifest,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register',
  ),
  sourceIdempotency: parseJsonBlock(
    docs.sourceIdempotency,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-owner-review-register',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-no-media-artifact-write-boundary-owner-review-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-result',
  ),
  inputs: parseJsonBlock(
    docs.inputs,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-register',
  ),
  outputShape: parseJsonBlock(
    docs.outputShape,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-plan',
  ),
  idempotency: parseJsonBlock(
    docs.idempotency,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-plan',
  ),
  guards: parseJsonBlock(
    docs.guards,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-plan',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-plan-safety-scan-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'fc7e6b6e3d738b195d7563676a2c5e3824bdd07b', 'source parent merge mismatch')
assert(parsed.sourceResult.acceptedForFixtureInstanceCreationStaticPlanOnly.fixtureInstanceCreationStaticPlanMayProceed === true, 'source did not allow static plan')
assert(parsed.sourceAcceptance.acceptedPlanningEvidence.plannedFixtureInstanceCount === 3, 'source accepted fixture count mismatch')
assert(parsed.sourcePreconditions.plannedFixtureInstanceCount === 3, 'source precondition count mismatch')
assert(parsed.sourceManifest.acceptedManifestInstanceShape.requiredFieldsAccepted.includes('idempotencyKey'), 'source manifest missing idempotency key')
assert(parsed.sourceIdempotency.acceptedIdempotencyKeys.length === 3, 'source idempotency count mismatch')
assert(parsed.sourceBoundary.acceptedNoExecutionBoundary.mediaFileOpenBlocked === true, 'source media boundary missing')
assert(parsed.sourceBoundary.acceptedNoExecutionBoundary.workerDispatchBlocked === true, 'source worker boundary missing')

assert(parsed.result.decision === decision, 'decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.staticCreationPlan.staticCreationInputsPlanned === true, 'inputs not planned')
assert(parsed.result.staticCreationPlan.staticCreationOutputShapePlanned === true, 'output shape not planned')
assert(parsed.result.staticCreationPlan.idempotencyAssertionsPlanned === true, 'idempotency assertions not planned')
assert(parsed.result.staticCreationPlan.noExecutionGuardsPlanned === true, 'guards not planned')
assert(parsed.result.staticCreationPlan.plannedFixtureInstanceCount === 3, 'planned fixture count mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.staticCreationPlan.fixtureInstancesCreatedToday,
  parsed.result.staticCreationPlan.fixtureManifestPersistedToday,
  parsed.result.staticCreationPlan.realMediaBytesUsedToday,
  parsed.result.staticCreationPlan.mediaFileOpenedToday,
  parsed.result.staticCreationPlan.artifactCreatedToday,
  parsed.result.staticCreationPlan.workerDispatchedToday,
  parsed.result.staticCreationPlan.routeToolProviderExecutedToday,
  parsed.result.staticCreationPlan.supabaseSqlTouchedToday,
  parsed.result.staticCreationPlan.externalBetaUnlockedToday,
  parsed.result.staticCreationPlan.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

assert(parsed.inputs.plannedStaticCreationInputs.length === 3, 'input count mismatch')
assertUnique(
  parsed.inputs.plannedStaticCreationInputs.map((item) => item.fixtureInstanceId),
  'fixture instance ids must be unique',
)
assertUnique(
  parsed.inputs.plannedStaticCreationInputs.map((item) => item.idempotencyKey),
  'idempotency keys must be unique',
)
for (const item of parsed.inputs.plannedStaticCreationInputs) {
  assert(item.approvedPlanSnapshotId === 'phase81-static-plan-only', 'bad approved plan snapshot id')
  assert(item.fixtureInstanceId.startsWith('sound-cpu-caption-render-fixture-instance-'), 'bad fixture instance prefix')
  assert(item.idempotencyKey.startsWith('sound-cpu:caption-render:fixture-instance:'), 'bad idempotency prefix')
}
assert(parsed.inputs.inputPolicy.inputsContainNoSignedUrls === true, 'input signed URL policy missing')
assertFalse(parsed.inputs.executionState.fixtureInstanceCreatedToday, 'inputs must not create')
assert(parsed.outputShape.plannedOutputShape.requiredFields.includes('creationGate'), 'output shape missing creationGate')
assert(parsed.outputShape.plannedOutputShape.disallowedFields.includes('signedUrl'), 'output shape must disallow signed URL')
assertFalse(parsed.outputShape.executionState.fixtureManifestPersistedToday, 'output shape must not persist')
assert(parsed.idempotency.plannedAssertions.fixtureInstanceIdOrdinalMatchesIdempotencyKeyOrdinal === true, 'ordinal assertion missing')
assert(parsed.idempotency.plannedIdempotencyKeyCount === 3, 'idempotency count mismatch')
assertFalse(parsed.idempotency.executionState.supabaseSqlTouchedToday, 'idempotency must not touch Supabase')
assert(parsed.guards.plannedNoExecutionGuards.mediaFileOpenBlocked === true, 'guard media block missing')
assert(parsed.guards.plannedNoExecutionGuards.workerDispatchBlocked === true, 'guard worker block missing')
assert(parsed.guards.plannedNoExecutionGuards.supabaseSqlBlocked === true, 'guard Supabase block missing')
assertFalse(parsed.guards.executionState.workerDispatchedToday, 'guards must block worker dispatch')
assert(parsed.safety.scanPassed.serviceRolePayloads === true, 'safety service-role scan missing')
assertFalse(parsed.safety.executionState.mediaOperationExecutedToday, 'safety must not execute media')
assert(parsed.blockers.remainingBlockersBeforeExecution.fixtureInstanceCreationStaticPlanOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.disallowedClaims.fixtureInstanceCreated === 'disallowed', 'policy must disallow fixture instance creation')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewStaticFixtureInstanceCreationInputs === true, 'next prompt missing input review')
assertFalse(parsed.next.reviewScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      staticCreationInputsPlanned: true,
      plannedFixtureInstanceCount: parsed.inputs.plannedStaticCreationInputs.length,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
