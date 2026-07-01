import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase83_caption_render_runtime_hook_proof_runner_source_plan_completed_with_warnings_ready_for_proof_runner_source_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase83_caption_render_runtime_hook_proof_runner_source_plan_owner_review_passed_with_warnings_ready_for_proof_runner_source_creation_no_execution'
const sourceMergeCommit = 'a464149e355cd77a0ce9240f3a4d07d60458be48'
const futureRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase83-controlled-fixture-instance-creation-proof-runner.mjs'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE84-CAPTION-RENDER-RUNTIME-HOOK-PROOF-RUNNER-SOURCE-CREATION'
const phase84SourceCreationResult =
  'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-result.md'
const phase84SourceCreationDecision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_created_with_warnings_ready_for_source_static_validation_no_execution'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-result.md',
  sourcePath:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-path-plan.md',
  sourceContract:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-contract-plan.md',
  sourceInput:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-input-validation-plan.md',
  sourceManifest:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-schema-plan.md',
  sourceIdempotency:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-idempotency-cleanup-plan.md',
  sourceGuard:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-no-execution-guard-plan.md',
  sourceSafety:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-safety-scan-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review-result.md',
  pathReview:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-path-owner-review-register.md',
  contractReview:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-contract-owner-review-register.md',
  inputReview:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-input-validation-owner-review-register.md',
  manifestReview:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-owner-review-register.md',
  idempotencyReview:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-idempotency-cleanup-owner-review-register.md',
  guardReview:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-no-execution-guard-owner-review-register.md',
  safetyReview:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-safety-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-creation-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation.md',
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
    'proofRunnerSourceCreatedToday": true',
    'entrypointCreatedToday": true',
    'inputValidationCodeCreatedToday": true',
    'manifestSchemaSourceCreatedToday": true',
    'cleanupCodeCreatedToday": true',
    'runControlledProofToday": true',
    'controlledProofExecutedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-result',
  ),
  sourcePath: parseJsonBlock(
    docs.sourcePath,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-path-plan',
  ),
  sourceContract: parseJsonBlock(
    docs.sourceContract,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-contract-plan',
  ),
  sourceInput: parseJsonBlock(
    docs.sourceInput,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-input-validation-plan',
  ),
  sourceManifest: parseJsonBlock(
    docs.sourceManifest,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-schema-plan',
  ),
  sourceIdempotency: parseJsonBlock(
    docs.sourceIdempotency,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-idempotency-cleanup-plan',
  ),
  sourceGuard: parseJsonBlock(
    docs.sourceGuard,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-no-execution-guard-plan',
  ),
  sourceSafety: parseJsonBlock(
    docs.sourceSafety,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-safety-scan-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review-result',
  ),
  pathReview: parseJsonBlock(
    docs.pathReview,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-path-owner-review-register',
  ),
  contractReview: parseJsonBlock(
    docs.contractReview,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-contract-owner-review-register',
  ),
  inputReview: parseJsonBlock(
    docs.inputReview,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-input-validation-owner-review-register',
  ),
  manifestReview: parseJsonBlock(
    docs.manifestReview,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-owner-review-register',
  ),
  idempotencyReview: parseJsonBlock(
    docs.idempotencyReview,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-idempotency-cleanup-owner-review-register',
  ),
  guardReview: parseJsonBlock(
    docs.guardReview,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-no-execution-guard-owner-review-register',
  ),
  safetyReview: parseJsonBlock(
    docs.safetyReview,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-safety-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-creation-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

if (!phase84SourceCreationIsPresent()) {
  assert(!fs.existsSync(path.join(process.cwd(), futureRunnerPath)), 'proof runner source must not exist before Phase 84 source creation')
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assertFalse(parsed.sourcePrompt.reviewScope.createProofRunnerSourceToday, 'source prompt must block source creation')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '443a867953cbfdbf6bfd5a564cc7a5572e0201f3', 'source merge mismatch')
assert(parsed.sourceResult.proofRunnerSourcePlan.futureRunnerPath === futureRunnerPath, 'source future runner path mismatch')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution must be zero')
assert(parsed.sourcePath.plannedRunnerSource.futurePath === futureRunnerPath, 'source path mismatch')
assertFalse(parsed.sourcePath.plannedRunnerSource.sourceCreationAllowedToday, 'source path must block source creation')
assert(parsed.sourceContract.plannedRunnerContract.entrypoint.endsWith(futureRunnerPath), 'source contract entrypoint mismatch')
assert(parsed.sourceInput.plannedInputValidation.requiredFixtureInstanceCount === 3, 'source input count mismatch')
assert(parsed.sourceManifest.plannedOutputManifestSchema.requiredFixtureInstanceFields.includes('creationGate'), 'source manifest missing creationGate')
assert(parsed.sourceIdempotency.plannedIdempotencyAndCleanup.futureRunnerDoesNotStageFiles === true, 'source idempotency staging guard missing')
assert(parsed.sourceGuard.plannedNoExecutionGuards.supabaseSqlBlocked === true, 'source guard Supabase block missing')
assert(parsed.sourceSafety.scanPassed.proofRunnerSourceAbsenceCheck === true, 'source safety absence check missing')

assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'owner-review source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'owner-review source decision mismatch')
assert(parsed.result.acceptedForProofRunnerSourceCreationOnly.proofRunnerSourceCreationMayProceed === true, 'source creation not allowed for next gate')
assert(parsed.result.acceptedForProofRunnerSourceCreationOnly.futureRunnerPath === futureRunnerPath, 'owner-review future runner path mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'owner-review tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'owner-review real execution must be zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForProofRunnerSourceCreationOnly.proofRunnerSourceCreatedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.controlledProofExecutionApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.fixtureInstanceCreationApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForProofRunnerSourceCreationOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.pathReview.acceptedRunnerSource.futurePath === futureRunnerPath, 'path review mismatch')
assertFalse(parsed.pathReview.executionState.proofRunnerSourceCreatedToday, 'path review must not create source')
assert(parsed.contractReview.acceptedRunnerContract.entrypoint.endsWith(futureRunnerPath), 'contract review entrypoint mismatch')
assertFalse(parsed.contractReview.executionState.entrypointCreatedToday, 'contract review must not create entrypoint')
assert(parsed.inputReview.acceptedInputValidation.requiredFixtureInstanceCount === 3, 'input review count mismatch')
assert(parsed.inputReview.acceptedInputValidation.rejectSignedUrls === true, 'input review must reject signed URLs')
assert(parsed.manifestReview.acceptedOutputManifestSchema.requiredFixtureInstanceFieldsAccepted.includes('creationGate'), 'manifest review missing creationGate')
assert(parsed.manifestReview.acceptedOutputManifestSchema.disallowedFieldsAccepted.includes('signedUrl'), 'manifest review must disallow signedUrl')
assert(parsed.idempotencyReview.acceptedIdempotencyAndCleanup.futureRunnerDoesNotStageFiles === true, 'idempotency review staging guard missing')
assert(parsed.guardReview.acceptedNoExecutionGuards.mediaFileOpenBlocked === true, 'guard review media block missing')
assert(parsed.guardReview.acceptedNoExecutionGuards.supabaseSqlBlocked === true, 'guard review Supabase block missing')
assert(parsed.safetyReview.acceptedScanPassed.proofRunnerSourceAbsenceCheck === true, 'safety review absence check missing')
assertFalse(parsed.safetyReview.executionState.proofRunnerSourceCreatedToday, 'safety review must not create source')
assert(parsed.readiness.proofRunnerSourceCreationMayProceed.createNodeBuiltInsOnlyRunnerSource === true, 'readiness missing source creation next action')
assertFalse(parsed.readiness.proofRunnerSourceCreationMayProceed.runControlledProofToday, 'readiness must block proof run')
assert(parsed.readiness.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.blockers.remainingBlockersBeforeExecution.proofRunnerSourceCreation === 'required_next', 'blocker next action mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.disallowedClaims.proofRunnerSourceCreated === 'disallowed', 'policy must disallow source created claim')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.creationScope.runnerPath === futureRunnerPath, 'next prompt runner path mismatch')
assertFalse(parsed.next.creationScope.runControlledProofToday, 'next prompt must block proof run')
assertFalse(parsed.next.creationScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      futureRunnerPath,
      proofRunnerSourceCreationMayProceed: true,
      proofRunnerSourceCreatedToday: false,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
