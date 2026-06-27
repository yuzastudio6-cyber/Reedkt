import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_plan_after_image_import_proof_completed_with_warnings_ready_for_limited_internal_runner_boundary_execution_owner_review_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_completion_decision_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_execution_plan_after_image_import_proof'

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-after-image-import-proof.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-tool-register-after-image-import-proof.md',
  payload: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-payload-register-after-image-import-proof.md',
  guards: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-guard-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-owner-review-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-after-image-import-proof.md',
  sourceDecisionDoc: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-evidence-register-after-image-import-proof.md',
  sourceScope: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-scope-register-after-image-import-proof.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-blocker-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-claim-policy-after-image-import-proof.md'
}

const expectedTools = [
  'librosa',
  'audioread',
  'pydub',
  'pydub_effects',
  'scipy',
  'resampy',
  'pyloudnorm',
  'ebu_r128_pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval'
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const plan = parseBlock(files.plan, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-after-image-import-proof')
const tools = parseBlock(files.tools, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-tool-register-after-image-import-proof')
const payload = parseBlock(files.payload, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-payload-register-after-image-import-proof')
const guards = parseBlock(files.guards, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-guard-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-claim-policy-after-image-import-proof')
const source = parseBlock(files.sourceDecisionDoc, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-evidence-register-after-image-import-proof')
const sourceScope = parseBlock(files.sourceScope, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-scope-register-after-image-import-proof')
const sourceBlockers = parseBlock(files.sourceBlockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-blocker-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-claim-policy-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [plan, tools, payload, guards, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'controlled proof no longer passes')
assert(liveProof.allowPassedCount === 15, 'live allow count mismatch')
assert(liveProof.blockedPassedCount === 14, 'live blocked count mismatch')
assert(liveProof.failedFixtures.length === 0, 'live failed fixtures present')
assert(liveProof.productToolCallExecution === 'no', 'live product execution widened')
assert(liveProof.workerExecution === 'no', 'live worker execution widened')
assert(liveProof.internalBetaUnlock === 'no', 'live internal beta widened')

assert(plan.sourceDecision === sourceDecision, 'source decision mismatch')
assert(plan.sourcePr === 1219, 'source PR mismatch')
assert(plan.sourceMergeCommit === '9fc6a76f407ecc16d79501f9df2f74409568a2c7', 'source merge mismatch')
assert(plan.executionPlan.plannedOnly === true, 'execution plan is not planning-only')
assert(plan.executionPlan.executionProofRunInThisGate === false, 'execution proof was claimed in plan gate')
assert(plan.executionPlan.futureProofScope === 'limited_internal_no_media_no_artifact_runner_boundary_execution_proof', 'future proof scope mismatch')
assert(plan.executionPlan.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(plan.executionPlan.allowPassedCount === 15, 'allow count mismatch')
assert(plan.executionPlan.forbiddenPayloadStopCount === 14, 'forbidden stop count mismatch')
assert(plan.executionPlan.failedFixtureCount === 0, 'failed fixture count widened')
assert(plan.executionPlan.requiredFieldCount === 9, 'required field count mismatch')
assert(plan.executionPlan.runtimeFlagsRequiredFalseCount === 3, 'runtime flag count mismatch')
assert(plan.executionPlan.ownerReviewRequiredBeforeAnyFutureProof === true, 'owner review guard missing')
assert(plan.executionPlan.sanitizedEvidenceOnly === true, 'sanitized evidence missing')
assert(plan.acceptedForToday.limitedInternalRunnerBoundaryExecutionPlanning === 'yes', 'execution planning not accepted')
assert(plan.acceptedForToday.limitedInternalRunnerBoundaryExecutionOwnerReviewHandoff === 'yes', 'owner review handoff not accepted')

for (const key of [
  'limitedInternalRunnerBoundaryExecutionProof',
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaFileOpen',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(plan.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(JSON.stringify(tools.acceptedForFutureLimitedInternalRunnerBoundaryExecutionPlanning) === JSON.stringify(expectedTools), 'tool allowlist mismatch')
assert(JSON.stringify(tools.notAcceptedForProductExecutionToday) === JSON.stringify(expectedTools), 'tool no-execution list mismatch')
assert(tools.counts.acceptedForFutureLimitedInternalRunnerBoundaryExecutionPlanningCount === 15, 'future tool planning count mismatch')
assert(tools.counts.acceptedForProductExecutionTodayCount === 0, 'product execution tool count widened')
assert(tools.counts.acceptedForWorkerExecutionTodayCount === 0, 'worker execution tool count widened')
assert(tools.counts.acceptedForInternalBetaTodayCount === 0, 'internal beta tool count widened')
assert(tools.counts.acceptedForExternalBetaTodayCount === 0, 'external beta tool count widened')
assert(tools.counts.acceptedForProductionTodayCount === 0, 'production tool count widened')

assert(payload.counts.requiredFutureSyntheticPayloadFieldCount === 9, 'payload field count mismatch')
assert(payload.counts.runtimeFlagsRequiredFalseCount === 3, 'runtime false flag count mismatch')
assert(payload.counts.forbiddenPayloadFamilyCount === 14, 'forbidden payload family count mismatch')
assert(payload.counts.permittedProductPayloadFamilyCountToday === 0, 'product payload family count widened')
for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'toolId']) {
  assert(payload.requiredFutureSyntheticPayloadFields.includes(field), `missing required field: ${field}`)
}
for (const flag of ['runtimeEnabled', 'mediaProcessingEnabled', 'artifactWritesEnabled']) {
  assert(payload.runtimeFlagsRequiredFalse.includes(flag), `missing false runtime flag: ${flag}`)
}
for (const forbidden of ['rawPrompt', 'mediaFilePath', 'artifactWriteTarget', 'supabaseWriteIntent', 'sqlStatement', 'dockerRunRequest', 'workerDispatchRequest']) {
  assert(payload.forbiddenPayloadFamilies.includes(forbidden), `missing forbidden payload family: ${forbidden}`)
}

assert(guards.counts.futureOwnerReviewRequiredGuardCount === 10, 'guard count mismatch')
assert(guards.counts.blockedTodayCount === 24, 'blocked-today count mismatch')
assert(guards.counts.readyForProductExecutionGuardCount === 0, 'product execution guard widened')
assert(guards.futureOwnerReviewRequiredGuards.includes('package_lock_unchanged'), 'package lock guard missing')
assert(guards.blockedToday.includes('product_tool_call_execution'), 'product execution block missing')
assert(guards.blockedToday.includes('future_execution_proof_without_owner_review'), 'owner review block missing')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 4, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product blocker widened')
assert(blockers.nextBlocker.recommendedPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-LIMITED-INTERNAL-RUNNER-BOUNDARY-EXECUTION-OWNER-REVIEW-AFTER-IMAGE-IMPORT-PROOF', 'next prompt mismatch')

assert(policy.allowedClaims.limitedInternalRunnerBoundaryExecutionPlanningMayProceed === true, 'allowed execution planning claim missing')
assert(policy.allowedClaims.limitedInternalRunnerBoundaryExecutionOwnerReviewRequired === true, 'owner review required claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.allowPassedCount === 15, 'allowed allow count mismatch')
assert(policy.allowedClaims.blockedPassedCount === 14, 'allowed blocked count mismatch')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count widened')
assert(policy.forbiddenClaims.limitedInternalRunnerBoundaryExecutionProofPassed === true, 'execution proof forbidden missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaUnlocked === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(source.decision === sourceDecision, 'source decision mismatch')
assert(source.sourcePr === 1216, 'source upstream PR mismatch')
assert(source.sourceMergeCommit === 'b7c2da1f3994990425451380229f019356af123e', 'source upstream merge mismatch')
assert(source.acceptedDecision.limitedInternalRunnerBoundaryExecutionPlanningMayProceed === true, 'source execution planning missing')
assert(source.acceptedDecision.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(source.acceptedDecision.allowPassedCount === 15, 'source allow count mismatch')
assert(source.acceptedDecision.blockedPassedCount === 14, 'source blocked count mismatch')
assert(source.acceptedDecision.failedFixtureCount === 0, 'source failed count widened')
assert(source.acceptedDecision.productExecutionAuthorizedCount === 0, 'source product execution widened')
assert(source.acceptedDecision.workerExecutionAuthorizedCount === 0, 'source worker execution widened')
assert(source.acceptedDecision.internalBetaUnlockCount === 0, 'source internal beta widened')
assert(source.acceptedDecision.externalBetaReadyCount === 0, 'source external beta widened')
assert(source.acceptedDecision.productionReadyCount === 0, 'source production widened')
assert(sourceEvidence.acceptedProofEvidence.acceptedToolCount === 15, 'source evidence tool count mismatch')
assert(sourceEvidence.acceptedProofEvidence.allowPassedCount === 15, 'source evidence allow count mismatch')
assert(sourceEvidence.acceptedProofEvidence.blockedPassedCount === 14, 'source evidence blocked count mismatch')
assert(sourceEvidence.acceptedProofEvidence.failedFixtureCount === 0, 'source evidence failed count widened')
assert(sourceScope.counts.productExecutionAuthorizedCount === 0, 'source scope product execution widened')
assert(sourceScope.counts.workerExecutionAuthorizedCount === 0, 'source scope worker execution widened')
assert(sourceBlockers.counts.readyForProductExecutionBlockerCount === 0, 'source blocker product execution widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-internal-runner-boundary-execution-plan-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"mediaFileOpen": "yes"',
  '"mediaProcessing": "yes"',
  '"artifactWrites": "yes"',
  '"supabaseSql": "yes"',
  '"internalBetaUnlock": "yes"',
  '"externalBetaUnlock": "yes"',
  '"productionUnlock": "yes"',
  '"limitedInternalRunnerBoundaryExecutionProof": "yes"',
  '"acceptedForProductExecutionTodayCount": 15',
  '"acceptedForWorkerExecutionTodayCount": 15',
  '"acceptedForInternalBetaTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"acceptedForProductionTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled',
  'production ready'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_plan_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: plan.sourcePr,
      sourceMergeCommit: plan.sourceMergeCommit,
      acceptedSoundCpuToolCount: plan.executionPlan.acceptedSoundCpuToolCount,
      allowPassedCount: plan.executionPlan.allowPassedCount,
      forbiddenPayloadStopCount: plan.executionPlan.forbiddenPayloadStopCount,
      failedFixtureCount: plan.executionPlan.failedFixtureCount,
      productExecutionAuthorizedToday: plan.acceptedForToday.productToolCallExecution,
      workerExecutionAuthorizedToday: plan.acceptedForToday.workerExecution,
      nextPrompt: plan.nextPrompt
    },
    null,
    2
  )
)
