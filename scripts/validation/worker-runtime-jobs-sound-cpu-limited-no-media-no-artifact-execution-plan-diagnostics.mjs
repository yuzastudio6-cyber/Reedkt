import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const decision = 'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_execution_plan_completed_with_warnings_ready_for_controlled_no_media_no_artifact_execution_proof'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_passed_with_warnings_ready_for_limited_no_media_no_artifact_execution_plan'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NO-MEDIA-NO-ARTIFACT-EXECUTION-PROOF: run limited SOUND CPU package proof, no media/artifacts'

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-execution-plan.md',
  commands: 'docs/worker-runtime-jobs-sound-cpu-limited-execution-command-plan-register.md',
  guards: 'docs/worker-runtime-jobs-sound-cpu-limited-execution-safety-guardrail-register.md',
  cleanup: 'docs/worker-runtime-jobs-sound-cpu-limited-execution-cleanup-stop-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-execution-blocker-register.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-limited-execution-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof.md',
  sourceGate: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-boundary-register.md',
  packageJson: 'package.json',
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseJsonFence(relativePath, label) {
  const text = read(relativePath)
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON fence ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assertFalseFlags(value, keys, label) {
  for (const key of keys) assert(value?.[key] === false, `${label}.${key} must remain false`)
}

function assertTrueFlags(value, keys, label) {
  for (const key of keys) assert(value?.[key] === true, `${label}.${key} must remain true`)
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update classification widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment classification widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase SQL classification widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migration classification widened`)
  assert(value?.nextAction === 'none', `${label} Supabase next action widened`)
}

const plan = parseJsonFence(files.plan, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-execution-plan')
const commands = parseJsonFence(files.commands, 'worker-runtime-jobs-sound-cpu-limited-execution-command-plan-register')
const guards = parseJsonFence(files.guards, 'worker-runtime-jobs-sound-cpu-limited-execution-safety-guardrail-register')
const cleanup = parseJsonFence(files.cleanup, 'worker-runtime-jobs-sound-cpu-limited-execution-cleanup-stop-register')
const blockers = parseJsonFence(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-execution-blocker-register')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-limited-execution-claim-policy')
const sourceGate = parseJsonFence(files.sourceGate, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate')
const sourceBoundary = parseJsonFence(files.sourceBoundary, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-boundary-register')
const promptText = read(files.prompt)

assert(plan.owner === 'WORKER_RUNTIME_JOBS', 'plan owner mismatch')
assert(plan.decision === decision, 'plan decision mismatch')
assert(plan.sourceVerification.sourceHead === '12cec7a1e8b34c5ab0ccd19fef300c2fb92da5cd', 'source head mismatch')
assert(plan.sourceVerification.pr1100.mergeCommit === '12cec7a1e8b34c5ab0ccd19fef300c2fb92da5cd', 'PR #1100 merge commit mismatch')
assert(plan.sourceVerification.pr1100.decision === sourceDecision, 'PR #1100 decision mismatch')
assert(sourceGate.decision === sourceDecision, 'source gate decision mismatch')
assert(sourceBoundary.futurePlanAllowedScope.requiresSeparatePromptBeforeExecution === true, 'source boundary must require separate prompt')

assert(plan.planResult.toolCandidateCount === 15, 'tool count mismatch')
assert(plan.planResult.planOnly === true, 'planOnly must be true')
assert(plan.planResult.futureControlledProofMayProceed === true, 'future proof flag mismatch')
assert(plan.planResult.futureProofRequiresSeparatePrompt === true, 'separate prompt flag mismatch')
assert(plan.planResult.futureProofRuntime === 'disposable_local_python_venv_outside_repo', 'future runtime mismatch')
assertFalseFlags(plan.planResult, [
  'futureProofMediaAllowed',
  'futureProofArtifactAllowed',
  'futureProofWorkerRouteToolRuntimeAllowed',
  'futureProofSupabaseSqlAllowed',
  'futureProofProviderAllowed',
  'futureProofDockerGcpAllowed',
  'executionPerformedInThisPrompt',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'internalBetaAllowed',
  'externalBetaAllowed',
  'realUserMediaBetaAllowed',
  'productionAllowed',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
], 'plan.planResult')
assert(plan.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(commands.futureCommandsProposedNotExecuted.length === 5, 'future command count mismatch')
assert(commands.futureProofCategories.length === 7, 'future proof category count mismatch')
assert(commands.summary.commandsExecutedInThisPrompt === 0, 'commands must not execute in this prompt')
assert(commands.summary.futureProofRequiresSeparatePrompt === true, 'commands must require future prompt')
for (const blocked of ['audioread.audio_open', 'pydub media open/export/playback', 'FFmpeg or ffprobe', 'worker dispatch', 'Supabase mutation', 'Docker build/run/push']) {
  assert(commands.explicitlyNotProposed.includes(blocked), `missing explicitly not proposed item: ${blocked}`)
}

assertTrueFlags(guards.requiredGuardsForFutureProof, [
  'worktreeCleanBeforeStart',
  'packageLockHashRecordedBeforeAfter',
  'venvOutsideRepo',
  'noMediaFileOpen',
  'noRealUserMedia',
  'noArtifacts',
  'noSupabase',
  'noSql',
  'noProviders',
  'noWorkerDispatch',
  'noRouteExecution',
  'noDockerGcp',
  'timeoutRequired',
  'sanitizedLogsOnly',
  'venvRemovalRequired',
], 'guards.requiredGuardsForFutureProof')
assert(guards.runtimeFlagsRequiredFalse.length === 6, 'runtime false flag count mismatch')
assert(guards.stopConditions.length === 10, 'stop condition count mismatch')
assert(guards.summary.futureProofMayProceedOnlyIfAllGuardsAccepted === true, 'guard summary future proof flag mismatch')
assert(guards.summary.executionAllowedInThisPrompt === false, 'guard summary execution flag mismatch')

assert(cleanup.cleanupRequirementsForFutureProof.length === 4, 'cleanup requirement count mismatch')
assert(cleanup.blockedOutcomeDecisions.length === 6, 'blocked outcome count mismatch')
assert(cleanup.summary.futureProofMustStopOnAnyBlockedOutcome === true, 'cleanup stop flag mismatch')

assert(blockers.resolvedForPlanning.length === 1, 'resolved blocker count mismatch')
assert(blockers.currentBlockers.length === 3, 'current blocker count mismatch')
assert(blockers.summary.nextBlockerId === 'controlled_execution_proof_not_run', 'next blocker mismatch')
assertFalseFlags(blockers.summary, ['executionAllowedInThisPrompt', 'externalBetaAllowed', 'productionAllowed'], 'blockers.summary')

for (const claim of [
  'future limited no-media no-artifact proof plan is authored',
  'future proof must use a disposable local venv outside the repo',
  'future proof requires a separate prompt before execution',
]) {
  assert(claims.allowedClaims.includes(claim), `allowed claim missing: ${claim}`)
}
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'package proof passed',
  'live tool-call readiness',
  'tool execution readiness',
  'external beta readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims')

for (const phrase of [
  decision,
  'Do not run ReeditPro workers',
  'audioread.audio_open',
  'service-role payloads',
  'If any prohibited action is attempted',
]) {
  assert(promptText.includes(phrase), `next prompt missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-limited-no-media-no-artifact-execution-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-execution-plan-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_execution_plan_diagnostics_passed',
  decision,
  toolCandidateCount: plan.planResult.toolCandidateCount,
  planOnly: plan.planResult.planOnly,
  futureControlledProofMayProceed: plan.planResult.futureControlledProofMayProceed,
  executionPerformedInThisPrompt: plan.planResult.executionPerformedInThisPrompt,
  externalBetaAllowed: plan.planResult.externalBetaAllowed,
  productionAllowed: plan.planResult.productionAllowed,
  nextPrompt,
}, null, 2))
