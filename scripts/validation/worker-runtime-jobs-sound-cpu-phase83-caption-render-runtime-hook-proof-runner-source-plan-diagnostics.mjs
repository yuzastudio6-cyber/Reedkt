import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase82_caption_render_runtime_hook_controlled_fixture_instance_creation_proof_plan_owner_review_passed_with_warnings_ready_for_proof_runner_source_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase83_caption_render_runtime_hook_proof_runner_source_plan_completed_with_warnings_ready_for_proof_runner_source_owner_review_no_execution'
const sourceMergeCommit = '443a867953cbfdbf6bfd5a564cc7a5572e0201f3'
const futureRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase83-controlled-fixture-instance-creation-proof-runner.mjs'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE83-CAPTION-RENDER-RUNTIME-HOOK-PROOF-RUNNER-SOURCE-PLAN-OWNER-REVIEW'
const phase84SourceCreationResult =
  'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-result.md'
const phase84SourceCreationDecision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_created_with_warnings_ready_for_source_static_validation_no_execution'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan.md',
  sourceOwnerResult:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-runner-source-plan-readiness-register.md',
  sourceCommandReview:
    'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-owner-review-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-result.md',
  pathPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-path-plan.md',
  contractPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-contract-plan.md',
  inputPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-input-validation-plan.md',
  manifestPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-schema-plan.md',
  idempotencyPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-idempotency-cleanup-plan.md',
  guardPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-no-execution-guard-plan.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-safety-scan-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review.md',
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
    'sourceCreationAllowedToday": true',
    'proofExecutionAllowedToday": true',
    'proofRunnerSourceCreatedToday": true',
    'entrypointCreatedToday": true',
    'entrypointExecutedToday": true',
    'inputValidationCodeCreatedToday": true',
    'inputValidationExecutedToday": true',
    'manifestSchemaSourceCreatedToday": true',
    'manifestWrittenToday": true',
    'cleanupCodeCreatedToday": true',
    'cleanupExecutedToday": true',
    'createProofRunnerSourceToday": true',
    'runControlledProofToday": true',
    'controlledProofExecutedToday": true',
    'controlledFixtureInstanceCreationProofExecutedToday": true',
    'createFixtureInstancesToday": true',
    'fixtureInstanceCreatedToday": true',
    'fixtureInstancesCreatedToday": true',
    'persistFixtureManifestToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesUsedToday": true',
    'openMediaFileToday": true',
    'mediaFileOpenedToday": true',
    'mediaOperationExecutedToday": true',
    'createArtifactToday": true',
    'artifactCreatedToday": true',
    'storageTransferToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
    'dispatchWorkerToday": true',
    'workerDispatchedToday": true',
    'workerOperationExecutedToday": true',
    'routeToolProviderExecutedToday": true',
    'touchSupabaseSqlToday": true',
    'supabaseSqlTouchedToday": true',
    'supabaseOperationExecutedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'generatedLocalFixturePassedClaimed": true',
    'dryRunPassedClaimed": true',
    'runtimeReadinessClaimed": true',
    'realUserMediaBetaReadyClaimed": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

function phase84SourceCreationIsPresent() {
  const full = path.join(process.cwd(), phase84SourceCreationResult)
  if (!fs.existsSync(full)) return false
  const parsed = parseJsonBlock(
    phase84SourceCreationResult,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-result',
  )
  return parsed.decision === phase84SourceCreationDecision && parsed.sourceCreation?.runnerSourceCreated === true
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan',
  ),
  sourceOwnerResult: parseJsonBlock(
    docs.sourceOwnerResult,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-plan-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-runner-source-plan-readiness-register',
  ),
  sourceCommandReview: parseJsonBlock(
    docs.sourceCommandReview,
    'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-idempotent-create-command-owner-review-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-result',
  ),
  pathPlan: parseJsonBlock(
    docs.pathPlan,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-path-plan',
  ),
  contractPlan: parseJsonBlock(
    docs.contractPlan,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-contract-plan',
  ),
  inputPlan: parseJsonBlock(
    docs.inputPlan,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-input-validation-plan',
  ),
  manifestPlan: parseJsonBlock(
    docs.manifestPlan,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-schema-plan',
  ),
  idempotencyPlan: parseJsonBlock(
    docs.idempotencyPlan,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-idempotency-cleanup-plan',
  ),
  guardPlan: parseJsonBlock(
    docs.guardPlan,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-no-execution-guard-plan',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-safety-scan-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

if (!phase84SourceCreationIsPresent()) {
  assert(!fs.existsSync(path.join(process.cwd(), futureRunnerPath)), 'proof runner source must not exist before Phase 84 source creation')
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.planningScope.planNodeBuiltInsOnlyRunner === true, 'source prompt runner planning missing')
assertFalse(parsed.sourcePrompt.planningScope.createProofRunnerSourceToday, 'source prompt must block source creation')
assertFalse(parsed.sourcePrompt.planningScope.runControlledProofToday, 'source prompt must block proof run')
assert(parsed.sourceOwnerResult.decision === sourceDecision, 'source owner decision mismatch')
assert(parsed.sourceOwnerResult.sourceVerification.sourceMergeCommit === '304ba268b6f20d311a243ede1f48a04441b5fd3f', 'source owner merge mismatch')
assert(parsed.sourceOwnerResult.acceptedForProofRunnerSourcePlanningOnly.proofRunnerSourcePlanMayProceed === true, 'source owner did not allow source planning')
assert(parsed.sourceOwnerResult.soundCpuTools.covered === 15, 'source owner tool count mismatch')
assert(parsed.sourceOwnerResult.soundCpuTools.readyForRealExecutionToday === 0, 'source owner real execution must be zero')
assert(parsed.sourceReadiness.proofRunnerSourcePlanMayProceed.planNodeBuiltInsOnlyRunner === true, 'source readiness missing runner plan')
assertFalse(parsed.sourceReadiness.proofRunnerSourcePlanMayProceed.createProofRunnerSourceToday, 'source readiness must block source creation')
assert(parsed.sourceCommandReview.acceptedFutureCommandPlan.commandName === path.basename(futureRunnerPath), 'source command review runner name mismatch')
assertFalse(parsed.sourceCommandReview.executionState.proofRunnerSourceCreatedToday, 'source command review must not create runner')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.proofRunnerSourcePlan.futureRunnerPath === futureRunnerPath, 'future runner path mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.proofRunnerSourcePlan.createProofRunnerSourceToday,
  parsed.result.proofRunnerSourcePlan.runControlledProofToday,
  parsed.result.proofRunnerSourcePlan.fixtureInstancesCreatedToday,
  parsed.result.proofRunnerSourcePlan.fixtureManifestPersistedToday,
  parsed.result.proofRunnerSourcePlan.realMediaBytesUsedToday,
  parsed.result.proofRunnerSourcePlan.mediaFileOpenedToday,
  parsed.result.proofRunnerSourcePlan.artifactCreatedToday,
  parsed.result.proofRunnerSourcePlan.workerDispatchedToday,
  parsed.result.proofRunnerSourcePlan.routeToolProviderExecutedToday,
  parsed.result.proofRunnerSourcePlan.supabaseSqlTouchedToday,
  parsed.result.proofRunnerSourcePlan.externalBetaUnlockedToday,
  parsed.result.proofRunnerSourcePlan.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

assert(parsed.pathPlan.plannedRunnerSource.futurePath === futureRunnerPath, 'path plan mismatch')
assert(parsed.pathPlan.plannedRunnerSource.nodeBuiltInsOnly === true, 'path plan must require built-ins only')
assertFalse(parsed.pathPlan.plannedRunnerSource.sourceCreationAllowedToday, 'path plan must block source creation')
assert(parsed.contractPlan.plannedRunnerContract.entrypoint.endsWith(futureRunnerPath), 'contract entrypoint mismatch')
assert(parsed.contractPlan.plannedRunnerContract.idempotent === true, 'contract must be idempotent')
assertFalse(parsed.contractPlan.executionState.entrypointCreatedToday, 'contract must not create entrypoint')
assert(parsed.inputPlan.plannedInputValidation.requiredFixtureInstanceCount === 3, 'input count mismatch')
assert(parsed.inputPlan.plannedInputValidation.rejectSignedUrls === true, 'input plan must reject signed URLs')
assertFalse(parsed.inputPlan.executionState.inputValidationCodeCreatedToday, 'input plan must not create code')
assert(parsed.manifestPlan.plannedOutputManifestSchema.requiredFixtureInstanceFields.includes('creationGate'), 'manifest schema missing creationGate')
assert(parsed.manifestPlan.plannedOutputManifestSchema.disallowedFields.includes('signedUrl'), 'manifest schema must disallow signedUrl')
assertFalse(parsed.manifestPlan.executionState.manifestWrittenToday, 'manifest plan must not write manifest')
assert(parsed.idempotencyPlan.plannedIdempotencyAndCleanup.sameInputProducesSameManifest === true, 'idempotency plan missing same input assertion')
assert(parsed.idempotencyPlan.plannedIdempotencyAndCleanup.futureRunnerRemovesDisposableTargetAfterProof === true, 'cleanup plan missing target removal')
assertFalse(parsed.idempotencyPlan.executionState.cleanupCodeCreatedToday, 'idempotency plan must not create cleanup code')
assert(parsed.guardPlan.plannedNoExecutionGuards.mediaFileOpenBlocked === true, 'guard plan media block missing')
assert(parsed.guardPlan.plannedNoExecutionGuards.supabaseSqlBlocked === true, 'guard plan Supabase block missing')
assertFalse(parsed.guardPlan.executionState.workerDispatchedToday, 'guard plan must not dispatch workers')
assert(parsed.safety.scanPassed.proofRunnerSourceAbsenceCheck === true, 'safety proof runner absence check missing')
assertFalse(parsed.safety.executionState.proofRunnerSourceCreatedToday, 'safety must not create runner')
assert(parsed.blockers.remainingBlockersBeforeExecution.proofRunnerSourceOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.disallowedClaims.proofRunnerSourceCreated === 'disallowed', 'policy must disallow runner source creation')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase83_caption_render_runtime_hook_proof_runner_source_plan_owner_review_passed_with_warnings_ready_for_proof_runner_source_creation_no_execution', 'next prompt expected decision mismatch')
assertFalse(parsed.next.reviewScope.createProofRunnerSourceToday, 'next prompt must block source creation')
assertFalse(parsed.next.reviewScope.runControlledProofToday, 'next prompt must block proof run')
assertFalse(parsed.next.reviewScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      futureRunnerPath,
      proofRunnerSourceCreatedToday: false,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
