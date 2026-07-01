import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase81_caption_render_runtime_hook_fixture_instance_creation_static_plan_completed_with_warnings_ready_for_creation_static_plan_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase81_caption_render_runtime_hook_fixture_instance_creation_static_plan_owner_review_passed_with_warnings_ready_for_controlled_fixture_instance_creation_proof_plan_no_execution'
const sourceMergeCommit = 'fa92f5a9ab952cccd8f1cd5d626cf21bedeec8d4'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE82-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-FIXTURE-INSTANCE-CREATION-PROOF-PLAN'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-result.md',
  sourceInputs:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-register.md',
  sourceOutputShape:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-plan.md',
  sourceIdempotency:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-plan.md',
  sourceGuards:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-plan.md',
  sourceSafety:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-plan-safety-scan-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review-result.md',
  inputReview:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-owner-review-register.md',
  outputReview:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-owner-review-register.md',
  idempotencyReview:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-owner-review-register.md',
  guardReview:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-owner-review-register.md',
  safetyReview:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-plan-safety-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan.md',
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
    'controlledFixtureInstanceCreationProofApprovedToday": true',
    'controlledFixtureInstanceCreationProofExecutedToday": true',
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
    'storageTransferToday": true',
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
    'runControlledProofToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-result',
  ),
  sourceInputs: parseJsonBlock(
    docs.sourceInputs,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-register',
  ),
  sourceOutputShape: parseJsonBlock(
    docs.sourceOutputShape,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-plan',
  ),
  sourceIdempotency: parseJsonBlock(
    docs.sourceIdempotency,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-plan',
  ),
  sourceGuards: parseJsonBlock(
    docs.sourceGuards,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-plan',
  ),
  sourceSafety: parseJsonBlock(
    docs.sourceSafety,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-plan-safety-scan-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review-result',
  ),
  inputReview: parseJsonBlock(
    docs.inputReview,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-owner-review-register',
  ),
  outputReview: parseJsonBlock(
    docs.outputReview,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-owner-review-register',
  ),
  idempotencyReview: parseJsonBlock(
    docs.idempotencyReview,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-owner-review-register',
  ),
  guardReview: parseJsonBlock(
    docs.guardReview,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-owner-review-register',
  ),
  safetyReview: parseJsonBlock(
    docs.safetyReview,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-plan-safety-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '02fcae0da43f09df9667005884d11bf845ba41ad', 'source parent merge mismatch')
assert(parsed.sourceResult.staticCreationPlan.plannedFixtureInstanceCount === 3, 'source fixture count mismatch')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution must be zero')
assert(parsed.sourceInputs.plannedStaticCreationInputs.length === 3, 'source input count mismatch')
assert(parsed.sourceInputs.inputPolicy.inputsContainNoSignedUrls === true, 'source input signed URL policy missing')
assert(parsed.sourceOutputShape.plannedOutputShape.requiredFields.includes('creationGate'), 'source output shape missing creationGate')
assert(parsed.sourceOutputShape.plannedOutputShape.disallowedFields.includes('signedUrl'), 'source output shape must disallow signed URL')
assert(parsed.sourceIdempotency.plannedIdempotencyKeyCount === 3, 'source idempotency count mismatch')
assert(parsed.sourceGuards.plannedNoExecutionGuards.mediaFileOpenBlocked === true, 'source guard media block missing')
assert(parsed.sourceGuards.plannedNoExecutionGuards.supabaseSqlBlocked === true, 'source guard Supabase block missing')
assert(parsed.sourceSafety.scanPassed.serviceRolePayloads === true, 'source safety service-role scan missing')

assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.acceptedForControlledProofPlanningOnly.controlledFixtureInstanceCreationProofPlanMayProceed === true, 'proof plan not allowed')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForControlledProofPlanningOnly.controlledFixtureInstanceCreationProofApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.fixtureInstanceCreationApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForControlledProofPlanningOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.inputReview.acceptedStaticCreationInputs.fixtureInstanceCount === 3, 'input review count mismatch')
assert(parsed.inputReview.inputPolicyAccepted.inputsContainNoSignedUrls === true, 'input review signed URL policy missing')
assertFalse(parsed.inputReview.executionState.fixtureInstanceCreatedToday, 'input review must not create')
assert(parsed.outputReview.acceptedOutputShape.requiredFieldsAccepted.includes('creationGate'), 'output review missing creationGate')
assert(parsed.outputReview.acceptedOutputShape.disallowedFieldsAccepted.includes('signedUrl'), 'output review must disallow signed URL')
assertFalse(parsed.outputReview.executionState.fixtureManifestPersistedToday, 'output review must not persist')
assert(parsed.idempotencyReview.acceptedAssertions.fixtureInstanceIdOrdinalMatchesIdempotencyKeyOrdinal === true, 'idempotency ordinal assertion missing')
assert(parsed.idempotencyReview.acceptedIdempotencyKeyCount === 3, 'idempotency review count mismatch')
assertFalse(parsed.idempotencyReview.executionState.supabaseSqlTouchedToday, 'idempotency review must not touch Supabase')
assert(parsed.guardReview.acceptedNoExecutionGuards.workerDispatchBlocked === true, 'guard review worker block missing')
assert(parsed.guardReview.acceptedNoExecutionGuards.supabaseSqlBlocked === true, 'guard review Supabase block missing')
assertFalse(parsed.guardReview.executionState.workerDispatchedToday, 'guard review must block worker dispatch')
assert(parsed.safetyReview.acceptedScanPassed.serviceRolePayloads === true, 'safety review service-role scan missing')
assertFalse(parsed.safetyReview.executionState.mediaOperationExecutedToday, 'safety review must not execute media')
assert(parsed.readiness.controlledFixtureInstanceCreationProofPlanMayProceed.planDisposableLocalManifestTarget === true, 'readiness missing disposable target planning')
assertFalse(parsed.readiness.controlledFixtureInstanceCreationProofPlanMayProceed.runControlledProofToday, 'readiness must block proof run')
assert(parsed.readiness.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.blockers.remainingBlockersBeforeExecution.controlledFixtureInstanceCreationProofPlan === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.disallowedClaims.fixtureInstanceCreated === 'disallowed', 'policy must disallow fixture instance creation')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.planningScope.planDisposableLocalManifestTarget === true, 'next prompt missing proof target plan')
assertFalse(parsed.next.planningScope.runControlledProofToday, 'next prompt must block proof run')
assertFalse(parsed.next.planningScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.planningScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      controlledFixtureInstanceCreationProofPlanMayProceed: true,
      acceptedFixtureInstanceCount: 3,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
