import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_fixture_instance_creation_proof_no_execution'
const sourceMergeCommit = '8c83f3ff8da4b941bfcd94e423d61796a1a05f09'
const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase83-controlled-fixture-instance-creation-proof-runner.mjs'
const targetRoot = '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE85-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-FIXTURE-INSTANCE-CREATION-PROOF'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-result.md',
  sourceImport:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-import-static-validation-register.md',
  sourceInput:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-validation-static-register.md',
  sourceManifest:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-output-manifest-static-register.md',
  sourceNoExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-no-execution-static-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-owner-acceptance-register.md',
  importReview:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-import-owner-review-register.md',
  inputReview:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-owner-review-register.md',
  manifestReview:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-manifest-owner-review-register.md',
  noExecutionReview:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-no-execution-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof.md',
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
    'runnerExecutedToday": true',
    'runProofRunnerToday": true',
    'proofRunnerExecutionInThisOwnerReview": true',
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

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-result',
  ),
  sourceImport: parseJsonBlock(
    docs.sourceImport,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-import-static-validation-register',
  ),
  sourceInput: parseJsonBlock(
    docs.sourceInput,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-validation-static-register',
  ),
  sourceManifest: parseJsonBlock(
    docs.sourceManifest,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-output-manifest-static-register',
  ),
  sourceNoExecution: parseJsonBlock(
    docs.sourceNoExecution,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-no-execution-static-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-owner-acceptance-register',
  ),
  importReview: parseJsonBlock(
    docs.importReview,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-import-owner-review-register',
  ),
  inputReview: parseJsonBlock(
    docs.inputReview,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-owner-review-register',
  ),
  manifestReview: parseJsonBlock(
    docs.manifestReview,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-manifest-owner-review-register',
  ),
  noExecutionReview: parseJsonBlock(
    docs.noExecutionReview,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-no-execution-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-controlled-fixture-instance-creation-proof-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase85-caption-render-runtime-hook-controlled-fixture-instance-creation-proof',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assertFalse(parsed.sourcePrompt.reviewScope.runProofRunnerToday, 'source prompt must block runner execution')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '010cfe61b69ac189db611398a6173606eabe08bf', 'source result parent merge mismatch')
assert(parsed.sourceResult.staticValidation.runnerPath === runnerPath, 'source runner path mismatch')
assert(parsed.sourceResult.staticValidation.runnerSourceExists === true, 'source runner missing')
assertFalse(parsed.sourceResult.staticValidation.runnerExecutedToday, 'source runner must not execute')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution must be zero')
assert(parsed.sourceImport.allowedImportsFound.length === 3, 'source import count mismatch')
assert(parsed.sourceInput.validatedInputLogic.rejectSignedUrls === true, 'source signed URL rejection missing')
assert(parsed.sourceManifest.validatedManifestLogic.usesExclusiveWriteFlag === 'wx', 'source manifest exclusive write missing')
assertFalse(parsed.sourceManifest.executionState.manifestWrittenToday, 'source manifest must not be written')
assert(parsed.sourceNoExecution.validatedNoExecutionProperties.noSupabaseClient === true, 'source no-execution Supabase block missing')
assert(fs.existsSync(path.join(process.cwd(), runnerPath)), 'runner source missing')
assert(!fs.existsSync(targetRoot), 'disposable target exists; runner may have executed')

assert(parsed.result.decision === decision, 'owner decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.ownerReview.controlledProofPlanningOnlyApproved === true, 'controlled proof planning not approved')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution must be zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
for (const value of [
  parsed.result.ownerReview.runProofRunnerToday,
  parsed.result.ownerReview.createFixtureInstancesToday,
  parsed.result.ownerReview.persistFixtureManifestToday,
  parsed.result.ownerReview.openMediaFileToday,
  parsed.result.ownerReview.createArtifactToday,
  parsed.result.ownerReview.dispatchWorkerToday,
  parsed.result.ownerReview.touchSupabaseSqlToday,
  parsed.result.ownerReview.unlockBetaToday,
  parsed.result.ownerReview.unlockProductionToday,
]) {
  assertFalse(value, 'owner-review execution state must remain false')
}

assert(parsed.acceptance.acceptedStaticValidationEvidence.allowedImportCount === 3, 'acceptance import count mismatch')
assert(parsed.acceptance.acceptedStaticValidationEvidence.rejectSignedUrls === true, 'acceptance signed URL rejection missing')
assert(parsed.acceptance.acceptedNextGateOnly.controlledFixtureInstanceCreationProofMayProceed === true, 'next proof not accepted')
assertFalse(parsed.acceptance.acceptedNextGateOnly.proofRunnerExecutionInThisOwnerReview, 'owner review must not run proof')
assert(parsed.importReview.acceptedImports.length === 3, 'import review count mismatch')
assert(parsed.importReview.acceptedForbiddenImportAbsence.supabaseClient === true, 'import review Supabase block missing')
assertFalse(parsed.importReview.executionState.runnerExecutedToday, 'import review must not execute runner')
assert(parsed.inputReview.acceptedInputValidation.requiresThreeInputs === true, 'input review count missing')
assert(parsed.inputReview.acceptedInputValidation.rejectSignedUrls === true, 'input review signed URL rejection missing')
assertFalse(parsed.inputReview.executionState.fixtureInstanceCreatedToday, 'input review must not create fixture')
assert(parsed.manifestReview.acceptedManifestBehavior.targetRoot === targetRoot, 'manifest target mismatch')
assert(parsed.manifestReview.acceptedManifestBehavior.usesExclusiveWriteFlag === 'wx', 'manifest exclusive write mismatch')
assertFalse(parsed.manifestReview.executionState.manifestWrittenToday, 'manifest review must not write manifest')
assert(parsed.noExecutionReview.acceptedNoExecutionProperties.noRouteToolProviderExecution === true, 'no execution route block missing')
assert(parsed.noExecutionReview.acceptedNoExecutionProperties.noSupabaseClient === true, 'no execution Supabase block missing')
assertFalse(parsed.noExecutionReview.executionState.workerOperationExecutedToday, 'no execution review must block worker operation')
assert(parsed.readiness.controlledProofMayProceedNext.requiredNextPrompt === nextPrompt, 'readiness next prompt mismatch')
assert(parsed.readiness.controlledProofMayProceedNext.runExactRunnerOnlyInNextGate === true, 'readiness must allow exact runner only next')
assertFalse(parsed.readiness.stillBlockedToday.runProofRunnerToday, 'readiness must block runner today')
assert(parsed.blockers.resolvedForThisGate.includes('staticValidationOwnerReview'), 'blocker not resolved')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentExecution.controlledFixtureInstanceCreationProof === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.controlledFixtureInstanceCreationProofMayProceedNext === true, 'policy next claim missing')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.proofScope.runExactProofRunnerOnce === true, 'next prompt must run exact runner once')
assert(parsed.next.proofScope.runnerPath === runnerPath, 'next prompt runner path mismatch')
assert(parsed.next.proofScope.targetRoot === targetRoot, 'next prompt target mismatch')
assertFalse(parsed.next.proofScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.proofScope.createArtifactToday, 'next prompt must block artifact creation')
assertFalse(parsed.next.proofScope.dispatchWorkerToday, 'next prompt must block worker dispatch')
assertFalse(parsed.next.proofScope.touchSupabaseSqlToday, 'next prompt must block Supabase')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      runnerPath,
      runnerExecutedToday: false,
      controlledFixtureInstanceCreationProofMayProceedNext: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
