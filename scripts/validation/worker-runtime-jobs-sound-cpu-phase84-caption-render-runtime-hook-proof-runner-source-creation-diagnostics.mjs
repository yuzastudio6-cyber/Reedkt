import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase83_caption_render_runtime_hook_proof_runner_source_plan_owner_review_passed_with_warnings_ready_for_proof_runner_source_creation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_created_with_warnings_ready_for_source_static_validation_no_execution'
const sourceMergeCommit = 'f957c041e4f9a1925cc6e3270c23dfda8b39298c'
const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase83-controlled-fixture-instance-creation-proof-runner.mjs'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE84-CAPTION-RENDER-RUNTIME-HOOK-PROOF-RUNNER-SOURCE-STATIC-VALIDATION'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation.md',
  sourceOwnerResult:
    'docs/worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-result.md',
  content:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-content-register.md',
  runtimeScan:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-absence-of-runtime-scan.md',
  validationPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-validation-plan.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation.md',
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

function assertNoUnsafeDocClaims(file) {
  const text = read(file)
  const unsafe = [
    'runnerExecutedToday": true',
    'controlledProofExecutedToday": true',
    'runProofRunnerToday": true',
    'runControlledProofToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation',
  ),
  sourceOwnerResult: parseJsonBlock(
    docs.sourceOwnerResult,
    'worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-source-plan-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-result',
  ),
  content: parseJsonBlock(
    docs.content,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-content-register',
  ),
  runtimeScan: parseJsonBlock(
    docs.runtimeScan,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-static-absence-of-runtime-scan',
  ),
  validationPlan: parseJsonBlock(
    docs.validationPlan,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-validation-plan',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-creation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeDocClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.creationScope.runnerPath === runnerPath, 'source prompt runner path mismatch')
assertFalse(parsed.sourcePrompt.creationScope.runControlledProofToday, 'source prompt must block proof run')
assert(parsed.sourceOwnerResult.decision === sourceDecision, 'source owner result decision mismatch')
assert(parsed.sourceOwnerResult.sourceVerification.sourceMergeCommit === 'a464149e355cd77a0ce9240f3a4d07d60458be48', 'source owner result merge mismatch')
assert(parsed.sourceOwnerResult.acceptedForProofRunnerSourceCreationOnly.proofRunnerSourceCreationMayProceed === true, 'source owner did not allow source creation')

assert(fs.existsSync(path.join(process.cwd(), runnerPath)), 'runner source was not created')
const runner = read(runnerPath)
for (const required of [
  "import fs from 'node:fs/promises'",
  "import path from 'node:path'",
  "import { fileURLToPath } from 'node:url'",
  'runControlledFixtureInstanceCreationProofRunner',
  'plannedProofInputs',
  'approvedPlanSnapshotId',
  'fs.rm(targetRoot, { recursive: true, force: true })',
  'fs.writeFile(targetFile',
  'fixtureInstances.length',
]) {
  assert(runner.includes(required), `runner missing required source: ${required}`)
}
for (const forbidden of [
  'node:child_process',
  'node:http',
  'node:https',
  'node:net',
  'node:dgram',
  'fetch(',
  'audioread',
  'pydub',
  'ffmpeg',
  'ffprobe',
  'docker',
  'gcloud',
  'createClient(',
  'service_role',
  'signedUrl',
  'publicArtifactUrl',
]) {
  assert(!runner.includes(forbidden), `runner contains forbidden source token: ${forbidden}`)
}

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.sourceCreation.runnerSourceCreated === true, 'result must record source created')
assert(parsed.result.sourceCreation.runnerPath === runnerPath, 'result runner path mismatch')
assert(parsed.result.soundCpuTools.covered === 15, 'tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.sourceCreation.runnerExecutedToday,
  parsed.result.sourceCreation.controlledProofExecutedToday,
  parsed.result.sourceCreation.fixtureInstancesCreatedToday,
  parsed.result.sourceCreation.fixtureManifestPersistedToday,
  parsed.result.sourceCreation.realMediaBytesUsedToday,
  parsed.result.sourceCreation.mediaFileOpenedToday,
  parsed.result.sourceCreation.artifactCreatedToday,
  parsed.result.sourceCreation.workerDispatchedToday,
  parsed.result.sourceCreation.routeToolProviderExecutedToday,
  parsed.result.sourceCreation.supabaseSqlTouchedToday,
  parsed.result.sourceCreation.externalBetaUnlockedToday,
  parsed.result.sourceCreation.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

assert(parsed.content.runnerSource.path === runnerPath, 'content runner path mismatch')
assert(parsed.content.runnerSource.nodeBuiltInsOnly === true, 'content must require built-ins only')
assert(parsed.content.runnerSource.exportsRunFunction === true, 'content must export run function')
assertFalse(parsed.content.executionState.runnerExecutedToday, 'content must record runner not executed')
assert(parsed.runtimeScan.scanPassed.childProcess === true, 'runtime scan child process check missing')
assert(parsed.runtimeScan.scanPassed.supabaseClient === true, 'runtime scan Supabase check missing')
assertFalse(parsed.runtimeScan.executionState.runnerExecutedToday, 'runtime scan must record runner not executed')
assert(parsed.validationPlan.staticValidationMayProceed.inspectRunnerImports === true, 'validation plan missing import inspection')
assertFalse(parsed.validationPlan.staticValidationMayProceed.executeRunnerToday, 'validation plan must block execution')
assert(parsed.validationPlan.requiredNextPrompt === nextPrompt, 'validation next prompt mismatch')
assert(parsed.blockers.remainingBlockersBeforeExecution.proofRunnerSourceStaticValidation === 'required_next', 'blocker next action mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.phase84ProofRunnerSourceCreated === true, 'policy must allow source created claim')
assert(parsed.policy.disallowedClaims.proofRunnerExecuted === 'disallowed', 'policy must disallow runner execution')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.validationScope.runnerPath === runnerPath, 'next prompt runner path mismatch')
assertFalse(parsed.next.validationScope.runProofRunnerToday, 'next prompt must block runner execution')
assertFalse(parsed.next.validationScope.createFixtureInstancesToday, 'next prompt must block fixture creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      runnerPath,
      runnerSourceCreated: true,
      runnerExecutedToday: false,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
