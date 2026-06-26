import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const decision = 'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_passed_with_warnings_ready_for_limited_no_media_no_artifact_execution_plan'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_passed_with_warnings_ready_for_runtime_execution_approval_gate'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-LIMITED-NO-MEDIA-NO-ARTIFACT-EXECUTION-PLAN: plan limited SOUND CPU execution proof, no execution'

const files = {
  gate: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md',
  criteria: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-criteria-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-boundary-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-blocker-register.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-execution-plan.md',
  preflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md',
  preflightReadiness: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-readiness-register.md',
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

const gate = parseJsonFence(files.gate, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate')
const criteria = parseJsonFence(files.criteria, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-criteria-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-boundary-register')
const blockers = parseJsonFence(files.blockers, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-blocker-register')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-claim-policy')
const preflight = parseJsonFence(files.preflight, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight')
const preflightReadiness = parseJsonFence(files.preflightReadiness, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-readiness-register')
const promptText = read(files.prompt)

assert(gate.owner === 'WORKER_RUNTIME_JOBS', 'gate owner mismatch')
assert(gate.decision === decision, 'gate decision mismatch')
assert(gate.sourceVerification.sourceHead === 'a2d7d543ab427d0ab77ebad6d8be1450aea91e01', 'source head mismatch')
assert(gate.sourceVerification.pr1099.mergeCommit === 'a2d7d543ab427d0ab77ebad6d8be1450aea91e01', 'PR #1099 merge commit mismatch')
assert(gate.sourceVerification.pr1099.decision === sourceDecision, 'PR #1099 decision mismatch')
assert(preflight.decision === sourceDecision, 'preflight source decision mismatch')
assert(preflight.preflightResult.toolCandidateCount === 15, 'preflight tool count mismatch')
assert(preflight.preflightResult.dependencyHydrationPassed === true, 'preflight dependency hydration should pass')
assert(preflight.preflightResult.externalBetaAllowed === false, 'preflight external beta should remain false')
assert(preflightReadiness.productionReadinessSummary.overallStatus === 'blocked', 'production readiness must remain blocked')

assert(gate.approvalGateResult.toolCandidateCount === 15, 'gate tool count mismatch')
assert(gate.approvalGateResult.dependencyBackedStaticPreflightPassed === true, 'static preflight flag mismatch')
assert(gate.approvalGateResult.planningGapCountClosed === 8, 'planning gap count mismatch')
assert(gate.approvalGateResult.remainingPlanningGapCount === 0, 'remaining planning gap mismatch')
assert(gate.approvalGateResult.futureLimitedNoMediaNoArtifactExecutionPlanMayProceed === true, 'future plan flag mismatch')
assert(gate.approvalGateResult.futurePlanMustRemainSeparatePrompt === true, 'separate prompt flag mismatch')
assertFalseFlags(gate.approvalGateResult, [
  'approvedForExecutionToday',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'providerCallsApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'creditMutationApprovedToday',
  'stripePaymentProcessingApprovedToday',
  'internalBetaAllowed',
  'externalBetaAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionAllowed',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
], 'gate.approvalGateResult')
assert(gate.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(criteria.criteria.length === 6, 'criteria count mismatch')
for (const criterion of criteria.criteria) {
  assert(criterion.required === true, `${criterion.criterionId} should be required`)
  assert(criterion.met === true, `${criterion.criterionId} should be met`)
}
assert(criteria.summary.criteriaMet === 6, 'criteria met count mismatch')
assert(criteria.summary.mayPlanLimitedExecutionProof === true, 'criteria future plan flag mismatch')
assert(criteria.summary.mayExecuteToday === false, 'criteria mayExecuteToday must be false')

assert(boundary.futurePlanAllowedScope.planOnly === true, 'future scope must be plan-only')
assert(boundary.futurePlanAllowedScope.candidateCount === 15, 'future scope candidate count mismatch')
assert(boundary.futurePlanAllowedScope.requiresSeparatePromptBeforeExecution === true, 'future proof must require separate prompt')
assertTrueFlags(boundary.blockedToday, [
  'workerDispatch',
  'claimLease',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaFileOpen',
  'audioreadAudioOpen',
  'pydubMediaOperation',
  'ffmpegFfprobe',
  'providerCalls',
  'modelDownloads',
  'artifactWrites',
  'signedUrls',
  'supabaseWrites',
  'sqlExecution',
  'creditMutation',
  'stripePaymentProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
], 'boundary.blockedToday')
assert(boundary.summary.futurePlanAllowed === true, 'boundary future plan flag mismatch')
assertFalseFlags(boundary.summary, ['executionAllowedToday', 'realMediaAllowedToday', 'artifactsAllowedToday', 'supabaseAllowedToday'], 'boundary.summary')

assert(blockers.resolvedForPlanning.length === 2, 'resolved blocker count mismatch')
assert(blockers.currentBlockers.length === 4, 'current blocker count mismatch')
assert(blockers.summary.nextBlockerId === 'execution_plan_not_authored', 'next blocker mismatch')
assertFalseFlags(blockers.summary, ['runtimeExecutionAllowedToday', 'externalBetaAllowed', 'productionAllowed'], 'blockers.summary')

for (const claim of [
  'a future limited no-media no-artifact execution proof may be planned',
  'dependency-backed static preflight passed',
  'the future plan must be separate before any execution',
]) {
  assert(claims.allowedClaims.includes(claim), `allowed claim missing: ${claim}`)
}
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'live tool-call readiness',
  'worker execution readiness',
  'route execution readiness',
  'tool execution readiness',
  'external beta readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims')

for (const phrase of [
  decision,
  'Do not execute workers',
  'no-media/no-artifact',
  'service-role payloads',
  'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_execution_plan_blocked_safety_scope',
]) {
  assert(promptText.includes(phrase), `next prompt missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-runtime-execution-approval-gate:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_diagnostics_passed',
  decision,
  toolCandidateCount: gate.approvalGateResult.toolCandidateCount,
  futureLimitedNoMediaNoArtifactExecutionPlanMayProceed: gate.approvalGateResult.futureLimitedNoMediaNoArtifactExecutionPlanMayProceed,
  runtimeExecutionApprovedToday: gate.approvalGateResult.runtimeExecutionApprovedToday,
  toolExecutionApprovedToday: gate.approvalGateResult.toolExecutionApprovedToday,
  externalBetaAllowed: gate.approvalGateResult.externalBetaAllowed,
  productionAllowed: gate.approvalGateResult.productionAllowed,
  nextPrompt,
}, null, 2))
