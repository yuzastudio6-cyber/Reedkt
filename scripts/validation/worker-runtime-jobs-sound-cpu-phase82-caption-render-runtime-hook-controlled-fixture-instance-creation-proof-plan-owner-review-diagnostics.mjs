import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase82_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_plan_completed_with_warnings_ready_for_controlled_fixture_instance_creation_proof_plan_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase82_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_plan_owner_review_passed_with_warnings_ready_for_proof_runner_source_plan_no_execution'
const sourceMergeCommit = '304ba268b6f20d311a243ede1f48a04441b5fd3f'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE83-CAPTION-RENDER-RUNTIME-HOOK-PROOF-RUNNER-SOURCE-PLAN'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-result.md',
  sourceTarget:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-disposable-local-manifest-target-plan.md',
  sourceInputs:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan.md',
  sourceCommand:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-plan.md',
  sourceNoMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-no-media-artifact-assertion-plan.md',
  sourceCleanup:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-cleanup-verification-plan.md',
  sourceSafety:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-safety-scan-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review-result.md',
  targetReview:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-disposable-local-manifest-target-owner-review-register.md',
  inputReview:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-owner-review-register.md',
  commandReview:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-owner-review-register.md',
  noMediaReview:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-no-media-artifact-assertion-owner-review-register.md',
  cleanupReview:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-cleanup-verification-owner-review-register.md',
  safetyReview:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-owner-safety-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-runner-source-plan-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan.md',
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
    'proofRunnerSourceApprovedToday": true',
    'proofRunnerSourceCreatedToday": true',
    'controlledProofExecutionApprovedToday": true',
    'controlledProofExecutedToday": true',
    'controlledFixtureInstanceCreationProofExecutedToday": true',
    'fixtureInstanceCreationApprovedToday": true',
    'fixtureInstanceCreatedToday": true',
    'fixtureInstancesCreatedToday": true',
    'fixtureManifestPersistenceApprovedToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesApprovedToday": true',
    'realMediaBytesUsedToday": true',
    'mediaFileOpenApprovedToday": true',
    'mediaFileOpenedToday": true',
    'mediaOperationExecutedToday": true',
    'artifactCreationApprovedToday": true',
    'artifactCreatedToday": true',
    'storageTransferToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
    'workerDispatchApprovedToday": true',
    'workerDispatchedToday": true',
    'workerOperationExecutedToday": true',
    'routeToolProviderExecutionApprovedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlApprovedToday": true',
    'supabaseSqlTouchedToday": true',
    'supabaseOperationExecutedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'generatedLocalFixturePassedClaimed": true',
    'dryRunPassedClaimed": true',
    'runtimeReadinessClaimed": true',
    'runtimeReadinessClaimedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-result',
  ),
  sourceTarget: parseJsonBlock(
    docs.sourceTarget,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-disposable-local-manifest-target-plan',
  ),
  sourceInputs: parseJsonBlock(
    docs.sourceInputs,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan',
  ),
  sourceCommand: parseJsonBlock(
    docs.sourceCommand,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-plan',
  ),
  sourceNoMedia: parseJsonBlock(
    docs.sourceNoMedia,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-no-media-artifact-assertion-plan',
  ),
  sourceCleanup: parseJsonBlock(
    docs.sourceCleanup,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-cleanup-verification-plan',
  ),
  sourceSafety: parseJsonBlock(
    docs.sourceSafety,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-safety-scan-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review-result',
  ),
  targetReview: parseJsonBlock(
    docs.targetReview,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-disposable-local-manifest-target-owner-review-register',
  ),
  inputReview: parseJsonBlock(
    docs.inputReview,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-owner-review-register',
  ),
  commandReview: parseJsonBlock(
    docs.commandReview,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-owner-review-register',
  ),
  noMediaReview: parseJsonBlock(
    docs.noMediaReview,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-no-media-artifact-assertion-owner-review-register',
  ),
  cleanupReview: parseJsonBlock(
    docs.cleanupReview,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-cleanup-verification-owner-review-register',
  ),
  safetyReview: parseJsonBlock(
    docs.safetyReview,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-owner-safety-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-runner-source-plan-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-plan-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '2d4e8edb8b2b454babc3b8ed2fc4048b9fd2c765', 'source parent merge mismatch')
assert(parsed.sourceResult.controlledProofPlan.plannedFixtureInstanceCount === 3, 'source fixture count mismatch')
assert(parsed.sourceResult.controlledProofPlan.disposableLocalManifestTargetPlanned === true, 'source target plan missing')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution must be zero')
assert(parsed.sourceTarget.plannedTarget.targetRoot === '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof', 'source target root mismatch')
assert(parsed.sourceTarget.plannedTarget.insideRepository === false, 'target must stay outside repository')
assert(parsed.sourceTarget.plannedTarget.requiresCleanupAfterProof === true, 'source target cleanup requirement missing')
assert(parsed.sourceTarget.plannedTarget.containsSignedUrls === false, 'source target must block signed URLs')
assert(parsed.sourceInputs.plannedProofInputs.length === 3, 'source input count mismatch')
assert(parsed.sourceInputs.inputPolicy.inputsContainNoSignedUrls === true, 'source input signed URL policy missing')
assert(parsed.sourceCommand.plannedCommand.commandName.endsWith('phase83-controlled-fixture-instance-creation-proof-runner.mjs'), 'source command name mismatch')
assert(parsed.sourceNoMedia.plannedAssertions.proofMustNotOpenMediaFiles === true, 'source no-media assertion missing')
assert(parsed.sourceNoMedia.plannedAssertions.proofMustNotCreateArtifacts === true, 'source artifact block missing')
assert(parsed.sourceCleanup.plannedCleanupVerification.deleteDisposableTargetAfterProof === true, 'source cleanup plan missing')
assert(parsed.sourceSafety.scanPassed.proofRunnerAbsenceCheck === true, 'source proof runner absence check missing')
assert(parsed.sourcePolicy.disallowedClaims.proofRunnerCreated === 'disallowed', 'source policy must disallow runner creation')

assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.acceptedForProofRunnerSourcePlanningOnly.proofRunnerSourcePlanMayProceed === true, 'proof runner source plan not allowed')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.proofRunnerSourceApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.controlledProofExecutionApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.fixtureInstanceCreationApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForProofRunnerSourcePlanningOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.targetReview.acceptedTargetPlan.targetRoot === '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof', 'target review root mismatch')
assert(parsed.targetReview.acceptedTargetPlan.targetIsDisposableLocalOnly === true, 'target review must be disposable')
assertFalse(parsed.targetReview.executionState.targetCreatedToday, 'target review must not create target')
assert(parsed.inputReview.acceptedProofInputs.fixtureInstanceCount === 3, 'input review count mismatch')
assert(parsed.inputReview.inputPolicyAccepted.inputsContainNoSignedUrls === true, 'input review signed URL policy missing')
assertFalse(parsed.inputReview.executionState.fixtureInstanceCreatedToday, 'input review must not create')
assert(parsed.commandReview.acceptedFutureCommandPlan.futureRunnerSourcePlanMayProceed === true, 'command review must allow source plan')
assert(parsed.commandReview.acceptedFutureCommandPlan.futureRunnerMustBeNodeBuiltInsOnly === true, 'command review must require built-ins only')
assertFalse(parsed.commandReview.executionState.proofRunnerSourceCreatedToday, 'command review must not create runner')
assert(parsed.noMediaReview.acceptedAssertions.mediaFileOpenBlocked === true, 'no-media review missing media block')
assert(parsed.noMediaReview.acceptedAssertions.artifactWriteBlocked === true, 'no-media review missing artifact block')
assertFalse(parsed.noMediaReview.executionState.mediaFileOpenedToday, 'no-media review must not open media')
assert(parsed.cleanupReview.acceptedCleanupVerification.futureProofMustRemoveDisposableManifestTarget === true, 'cleanup review missing removal requirement')
assertFalse(parsed.cleanupReview.executionState.cleanupPerformedToday, 'cleanup review must not perform cleanup')
assert(parsed.safetyReview.acceptedScanPassed.proofRunnerAbsenceCheck === true, 'safety review proof runner absence check missing')
assertFalse(parsed.safetyReview.executionState.proofRunnerCreatedToday, 'safety review must not create runner')
assert(parsed.readiness.proofRunnerSourcePlanMayProceed.planNodeBuiltInsOnlyRunner === true, 'readiness missing built-ins runner plan')
assertFalse(parsed.readiness.proofRunnerSourcePlanMayProceed.createProofRunnerSourceToday, 'readiness must block runner source creation')
assertFalse(parsed.readiness.proofRunnerSourcePlanMayProceed.runControlledProofToday, 'readiness must block proof run')
assert(parsed.readiness.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.blockers.remainingBlockersBeforeExecution.proofRunnerSourcePlan === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.disallowedClaims.proofRunnerSourceCreated === 'disallowed', 'policy must disallow runner source creation')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.planningScope.planNodeBuiltInsOnlyRunner === true, 'next prompt missing runner plan')
assertFalse(parsed.next.planningScope.createProofRunnerSourceToday, 'next prompt must block runner source creation')
assertFalse(parsed.next.planningScope.runControlledProofToday, 'next prompt must block proof run')
assertFalse(parsed.next.planningScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      proofRunnerSourcePlanMayProceed: true,
      acceptedFixtureInstanceCount: 3,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
