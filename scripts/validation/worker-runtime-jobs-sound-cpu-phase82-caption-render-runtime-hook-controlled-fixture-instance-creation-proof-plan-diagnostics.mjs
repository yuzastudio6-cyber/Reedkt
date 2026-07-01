import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase81_caption_render_runtime_hook_fixture_instance_creation_static_plan_owner_review_passed_with_warnings_ready_for_controlled_fixture_instance_creation_proof_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase82_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_plan_completed_with_warnings_ready_for_controlled_fixture_instance_creation_proof_plan_owner_review_no_execution'
const sourceMergeCommit = '2d4e8edb8b2b454babc3b8ed2fc4048b9fd2c765'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE82-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-FIXTURE-INSTANCE-CREATION-PROOF-PLAN-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-readiness-register.md',
  sourceInputs:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-owner-review-register.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-owner-review-register.md',
  sourceGuards:
    'docs/worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-owner-review-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-result.md',
  target:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-disposable-local-manifest-target-plan.md',
  inputs:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan.md',
  command:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-plan.md',
  assertions:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-no-media-artifact-assertion-plan.md',
  cleanup:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-cleanup-verification-plan.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-safety-scan-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review.md',
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
    'controlledFixtureInstanceCreationProofApprovedToday": true',
    'controlledFixtureInstanceCreationProofExecutedToday": true',
    'runControlledProofToday": true',
    'targetCreatedToday": true',
    'commandExecutedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-fixture-instance-creation-static-plan-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-readiness-register',
  ),
  sourceInputs: parseJsonBlock(
    docs.sourceInputs,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-owner-review-register',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-output-shape-owner-review-register',
  ),
  sourceGuards: parseJsonBlock(
    docs.sourceGuards,
    'worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-no-execution-guard-owner-review-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-result',
  ),
  target: parseJsonBlock(
    docs.target,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-disposable-local-manifest-target-plan',
  ),
  inputs: parseJsonBlock(
    docs.inputs,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan',
  ),
  command: parseJsonBlock(
    docs.command,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-plan',
  ),
  assertions: parseJsonBlock(
    docs.assertions,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-no-media-artifact-assertion-plan',
  ),
  cleanup: parseJsonBlock(
    docs.cleanup,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-cleanup-verification-plan',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-safety-scan-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'fa92f5a9ab952cccd8f1cd5d626cf21bedeec8d4', 'source parent merge mismatch')
assert(parsed.sourceResult.acceptedForControlledProofPlanningOnly.controlledFixtureInstanceCreationProofPlanMayProceed === true, 'source did not allow proof planning')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution must be zero')
assert(parsed.sourceReadiness.controlledFixtureInstanceCreationProofPlanMayProceed.planDisposableLocalManifestTarget === true, 'source readiness missing disposable target plan')
assert(parsed.sourceReadiness.controlledFixtureInstanceCreationProofPlanMayProceed.runControlledProofToday === false, 'source readiness must block proof run')
assert(parsed.sourceInputs.acceptedStaticCreationInputs.fixtureInstanceCount === 3, 'source input count mismatch')
assert(parsed.sourceOutput.acceptedOutputShape.disallowedFieldsAccepted.includes('signedUrl'), 'source output must disallow signed URL')
assert(parsed.sourceGuards.acceptedNoExecutionGuards.mediaFileOpenBlocked === true, 'source guard media block missing')

assert(parsed.result.decision === decision, 'decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.controlledProofPlan.disposableLocalManifestTargetPlanned === true, 'target not planned')
assert(parsed.result.controlledProofPlan.fixtureInstanceCreationInputsPlanned === true, 'inputs not planned')
assert(parsed.result.controlledProofPlan.idempotentCreateCommandPlanned === true, 'command not planned')
assert(parsed.result.controlledProofPlan.noMediaOpenNoArtifactWriteAssertionsPlanned === true, 'assertions not planned')
assert(parsed.result.controlledProofPlan.cleanupVerificationPlanned === true, 'cleanup not planned')
assert(parsed.result.controlledProofPlan.plannedFixtureInstanceCount === 3, 'fixture count mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.controlledProofPlan.runControlledProofToday,
  parsed.result.controlledProofPlan.fixtureInstancesCreatedToday,
  parsed.result.controlledProofPlan.fixtureManifestPersistedToday,
  parsed.result.controlledProofPlan.realMediaBytesUsedToday,
  parsed.result.controlledProofPlan.mediaFileOpenedToday,
  parsed.result.controlledProofPlan.artifactCreatedToday,
  parsed.result.controlledProofPlan.workerDispatchedToday,
  parsed.result.controlledProofPlan.routeToolProviderExecutedToday,
  parsed.result.controlledProofPlan.supabaseSqlTouchedToday,
  parsed.result.controlledProofPlan.externalBetaUnlockedToday,
  parsed.result.controlledProofPlan.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

assert(parsed.target.plannedTarget.targetKind === 'disposable_local_json_manifest', 'target kind mismatch')
assert(parsed.target.plannedTarget.insideRepository === false, 'target must be outside repo')
assert(parsed.target.plannedTarget.trackedSourcePath === false, 'target must not be tracked source')
assertFalse(parsed.target.executionState.targetCreatedToday, 'target must not be created')
assert(parsed.inputs.plannedProofInputs.length === 3, 'proof input count mismatch')
assertUnique(parsed.inputs.plannedProofInputs.map((item) => item.fixtureInstanceId), 'fixture instance IDs must be unique')
assertUnique(parsed.inputs.plannedProofInputs.map((item) => item.idempotencyKey), 'idempotency keys must be unique')
for (const item of parsed.inputs.plannedProofInputs) {
  assert(item.approvedPlanSnapshotId === 'phase82-controlled-proof-plan-only', 'bad approved plan snapshot id')
  assert(item.fixtureInstanceId.startsWith('sound-cpu-caption-render-fixture-instance-'), 'bad fixture instance prefix')
  assert(item.idempotencyKey.startsWith('sound-cpu:caption-render:fixture-instance:'), 'bad idempotency prefix')
}
assert(parsed.command.plannedCommand.commandExecutedToday === false, 'command must not execute')
assert(parsed.command.plannedCommand.requiresNoSupabase === true, 'command plan must require no Supabase')
assert(parsed.command.plannedCommand.requiresNoMediaOpen === true, 'command plan must require no media open')
assert(parsed.command.idempotencyRequirements.sameIdempotencyKeyRewritesSameFixtureInstanceRecord === true, 'idempotency command requirement missing')
assertFalse(parsed.command.executionState.commandExecutedToday, 'command execution must be false')
assert(parsed.assertions.plannedAssertions.proofMustNotOpenMediaFiles === true, 'media assertion missing')
assert(parsed.assertions.plannedAssertions.proofMustNotCreateArtifacts === true, 'artifact assertion missing')
assertFalse(parsed.assertions.executionState.mediaFileOpenedToday, 'assertions must block media open')
assert(parsed.cleanup.plannedCleanupVerification.verifyDisposableTargetAbsentAfterProof === true, 'cleanup absence verification missing')
assert(parsed.cleanup.plannedCleanupVerification.verifyNoTrackedFilesCreated === true, 'cleanup tracked-file verification missing')
assertFalse(parsed.cleanup.executionState.cleanupExecutedToday, 'cleanup must not execute today')
assert(parsed.safety.scanPassed.proofRunnerAbsenceCheck === true, 'safety proof-runner absence check missing')
assertFalse(parsed.safety.executionState.proofRunnerCreatedToday, 'proof runner must not be created today')
assert(parsed.blockers.remainingBlockersBeforeExecution.controlledFixtureInstanceCreationProofPlanOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.disallowedClaims.controlledFixtureInstanceCreationProofExecuted === 'disallowed', 'policy must disallow proof execution')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewDisposableLocalManifestTargetPlan === true, 'next prompt target review missing')
assertFalse(parsed.next.reviewScope.runControlledProofToday, 'next prompt must block proof run')
assertFalse(parsed.next.reviewScope.createFixtureInstancesToday, 'next prompt must block fixture creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      disposableLocalManifestTargetPlanned: true,
      plannedFixtureInstanceCount: parsed.inputs.plannedProofInputs.length,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
