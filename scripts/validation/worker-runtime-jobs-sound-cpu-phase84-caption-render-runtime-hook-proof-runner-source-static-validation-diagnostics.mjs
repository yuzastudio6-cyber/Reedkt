import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_created_with_warnings_ready_for_source_static_validation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_execution'
const sourceMergeCommit = '010cfe61b69ac189db611398a6173606eabe08bf'
const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase83-controlled-fixture-instance-creation-proof-runner.mjs'
const targetRoot = '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE84-CAPTION-RENDER-RUNTIME-HOOK-PROOF-RUNNER-SOURCE-STATIC-VALIDATION-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-result.md',
  importRegister:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-import-static-validation-register.md',
  inputRegister:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-validation-static-register.md',
  manifestRegister:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-output-manifest-static-register.md',
  noExecutionRegister:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-no-execution-static-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review.md',
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
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-result',
  ),
  importRegister: parseJsonBlock(
    docs.importRegister,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-import-static-validation-register',
  ),
  inputRegister: parseJsonBlock(
    docs.inputRegister,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-validation-static-register',
  ),
  manifestRegister: parseJsonBlock(
    docs.manifestRegister,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-output-manifest-static-register',
  ),
  noExecutionRegister: parseJsonBlock(
    docs.noExecutionRegister,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-no-execution-static-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-validation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.validationScope.runnerPath === runnerPath, 'source prompt runner path mismatch')
assertFalse(parsed.sourcePrompt.validationScope.runProofRunnerToday, 'source prompt must block proof runner execution')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'f957c041e4f9a1925cc6e3270c23dfda8b39298c', 'source result parent merge mismatch')
assert(parsed.sourceResult.sourceCreation.runnerPath === runnerPath, 'source result runner path mismatch')

const runnerFullPath = path.join(process.cwd(), runnerPath)
assert(fs.existsSync(runnerFullPath), 'runner source missing')
const runner = fs.readFileSync(runnerFullPath, 'utf8')
for (const required of [
  "import fs from 'node:fs/promises'",
  "import path from 'node:path'",
  "import { fileURLToPath } from 'node:url'",
  'export async function runControlledFixtureInstanceCreationProofRunner()',
  'plannedProofInputs',
  'inputs.length === 3',
  'expectedSnapshotId',
  'inputsContainNoFilesystemPaths',
  'inputsContainNoSignedUrls',
  'fixtureInstances',
  'creationGate',
  "flag: 'wx'",
  'fs.rm(targetRoot',
]) {
  assert(runner.includes(required), `runner missing required static token: ${required}`)
}
for (const forbidden of [
  'node:child_process',
  'node:http',
  'node:https',
  'node:net',
  'node:dgram',
  'fetch(',
  'XMLHttpRequest',
  'audioread',
  'pydub',
  'ffmpeg',
  'ffprobe',
  'docker',
  'gcloud',
  'createClient(',
  'service_role',
  'process.env.SUPABASE',
]) {
  assert(!runner.includes(forbidden), `runner contains forbidden static token: ${forbidden}`)
}
assert(!fs.existsSync(targetRoot), 'disposable target exists; runner may have executed')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.staticValidation.runnerPath === runnerPath, 'result runner path mismatch')
assert(parsed.result.staticValidation.runnerSourceExists === true, 'result must record runner source exists')
assertFalse(parsed.result.staticValidation.runnerExecutedToday, 'result must record runner not executed')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.staticValidation.fixtureInstancesCreatedToday,
  parsed.result.staticValidation.fixtureManifestPersistedToday,
  parsed.result.staticValidation.mediaFileOpenedToday,
  parsed.result.staticValidation.artifactCreatedToday,
  parsed.result.staticValidation.workerDispatchedToday,
  parsed.result.staticValidation.routeToolProviderExecutedToday,
  parsed.result.staticValidation.supabaseSqlTouchedToday,
  parsed.result.staticValidation.externalBetaUnlockedToday,
  parsed.result.staticValidation.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

assert(parsed.importRegister.allowedImportsFound.length === 3, 'import register count mismatch')
assert(parsed.importRegister.forbiddenImportsAbsent.nodeChildProcess === true, 'import register child process missing')
assertFalse(parsed.importRegister.executionState.runnerExecutedToday, 'import register must not execute runner')
assert(parsed.inputRegister.validatedInputLogic.requiresThreeInputs === true, 'input register missing count check')
assert(parsed.inputRegister.validatedInputLogic.rejectSignedUrls === true, 'input register missing signed URL rejection')
assert(parsed.manifestRegister.validatedManifestLogic.targetRoot === targetRoot, 'manifest register target mismatch')
assert(parsed.manifestRegister.validatedManifestLogic.usesExclusiveWriteFlag === 'wx', 'manifest register missing exclusive write')
assertFalse(parsed.manifestRegister.executionState.manifestWrittenToday, 'manifest register must not write manifest')
assert(parsed.noExecutionRegister.validatedNoExecutionProperties.noSupabaseClient === true, 'no-execution register missing Supabase block')
assert(parsed.noExecutionRegister.validatedNoExecutionProperties.noSignedPublicArtifactCreation === true, 'no-execution register missing artifact block')
assertFalse(parsed.noExecutionRegister.executionState.workerOperationExecutedToday, 'no-execution register must block worker execution')
assert(parsed.blockers.remainingBlockersBeforeExecution.staticValidationOwnerReview === 'required_next', 'blocker next gate mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.runnerExecutedToday === false, 'policy must record runner not executed')
assert(parsed.policy.disallowedClaims.proofRunnerExecuted === 'disallowed', 'policy must disallow runner execution')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assertFalse(parsed.next.reviewScope.runProofRunnerToday, 'next prompt must block proof runner execution')
assertFalse(parsed.next.reviewScope.createFixtureInstancesToday, 'next prompt must block fixture creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      runnerPath,
      runnerSourceExists: true,
      runnerExecutedToday: false,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
