import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_controlled_runtime_beta_preflight_after_runner_boundary_execution_proof'

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof.md',
  validation: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-dependency-validation-register.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-tool-boundary-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-blocker-register.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-duplicate-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof.md',
  sourceReconciliation: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof.md',
  sourceCounts: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-count-register.md',
  sourceDuplicates: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-duplicate-register.md',
  sourceCompletion: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof.md',
  toolCallPlan: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof.md',
  toolCallProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  toolCallOwnerReview: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  oldBetaPreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof.md'
}

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

const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof')
const validation = parseBlock(files.validation, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-dependency-validation-register')
const tools = parseBlock(files.tools, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-tool-boundary-register')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-blocker-register')
const duplicates = parseBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-duplicate-register')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-claim-policy')
const sourceReconciliation = parseBlock(files.sourceReconciliation, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof')
const sourceCounts = parseBlock(files.sourceCounts, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-count-register')
const sourceDuplicates = parseBlock(files.sourceDuplicates, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-duplicate-register')
const sourceCompletion = parseBlock(files.sourceCompletion, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof')
const toolCallPlan = parseBlock(files.toolCallPlan, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof')
const toolCallProof = parseBlock(files.toolCallProof, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof')
const toolCallOwnerReview = parseBlock(files.toolCallOwnerReview, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof')
const oldBetaPreflight = parseBlock(files.oldBetaPreflight, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof')

read(files.prompt)

for (const row of [result, validation, tools, blockers, duplicates, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(result.sourceDecision === sourceDecision, 'source decision mismatch')
assert(result.sourcePr === 1250, 'source PR mismatch')
assert(result.sourceMergeCommit === 'e9cfdb40b0fce8b8f50649ea33e69e9ae79590ea', 'source merge mismatch')
assert(result.preflightResult.dependencyBackedPreflightPassed === true, 'dependency preflight did not pass')
assert(result.preflightResult.dependencyHydrationPassed === true, 'dependency hydration did not pass')
assert(result.preflightResult.packageLockUnchanged === true, 'package lock changed')
assert(result.preflightResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(result.preflightResult.runnerBoundaryBlockerClosedForPlanning === true, 'runner blocker not closed')
assert(result.preflightResult.existingToolCallReadinessLaneReused === true, 'existing lane not reused')
assert(result.preflightResult.duplicateToolCallReadinessLaneCreated === false, 'duplicate lane created')

for (const key of [
  'productToolCallExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'mediaFileOpenPerformed',
  'mediaProcessingPerformed',
  'artifactWritePerformed',
  'supabaseSqlPerformed',
  'providerModelCallPerformed',
  'dockerGcpPerformed',
  'internalBetaUnlockedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday'
]) {
  assert(result.preflightResult[key] === false, `${key} widened`)
}

assert(validation.validationMode === 'dependency_backed_static_only', 'validation mode mismatch')
assert(validation.packageLockHash === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'package lock hash mismatch')
for (const command of validation.commands) {
  assert(command.status === 'passed' || command.status === 'passed_with_blocked_readiness' || command.status === 'passed_with_external_beta_blocked' || command.status === 'passed_with_existing_warnings', `unexpected command status for ${command.command}`)
}
assert(validation.artifactPolicy.nodeModulesStaged === false, 'node_modules staged')
assert(validation.artifactPolicy.distStaged === false, 'dist staged')
assert(validation.artifactPolicy.distServerStaged === false, 'dist-server staged')
assert(validation.artifactPolicy.sidecarsStaged === false, 'sidecars staged')

assert(tools.acceptedForControlledRuntimeBetaPreflightPlanning.length === 15, 'accepted tool count mismatch')
assert(tools.notAcceptedForProductExecutionToday.length === 15, 'not-ready tool count mismatch')
assert(tools.counts.acceptedForControlledRuntimeBetaPreflightPlanningCount === 15, 'tool planning count mismatch')
assert(tools.counts.acceptedForProductExecutionTodayCount === 0, 'product execution count widened')
assert(tools.counts.acceptedForWorkerExecutionTodayCount === 0, 'worker execution count widened')
assert(tools.counts.acceptedForExternalBetaTodayCount === 0, 'external beta count widened')
assert(tools.counts.acceptedForProductionTodayCount === 0, 'production count widened')
for (const value of Object.values(tools.runtimeBoundaries)) assert(value === 'no', 'runtime boundary widened')

assert(blockers.resolvedForPlanning.length === 3, 'resolved blocker count mismatch')
assert(blockers.remainingBeforeInternalBeta.length === 5, 'internal beta blocker count mismatch')
assert(blockers.remainingBeforeExternalBeta.length === 5, 'external beta blocker count mismatch')
assert(blockers.remainingBeforeInternalBeta.includes('runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof'), 'owner review blocker missing')
assert(blockers.remainingBeforeExternalBeta.includes('production_readiness_gate'), 'production blocker missing')
assert(blockers.counts.internalBetaBlockingCount === 5, 'internal beta blocker count field mismatch')
assert(blockers.counts.externalBetaBlockingCount === 5, 'external beta blocker count field mismatch')

assert(duplicates.duplicateGuard.samePurposeRemoteBranchFoundAtCreation === false, 'same-purpose branch found')
assert(duplicates.duplicateGuard.samePurposeOpenPrFoundAtCreation === false, 'same-purpose PR found')
assert(duplicates.duplicateGuard.existingAfterImageImportToolCallReadinessLaneReused === true, 'tool-call lane not reused')
assert(duplicates.duplicateGuard.existingAfterImageImportControlledBetaPreflightReused === true, 'old beta preflight not reused')
assert(duplicates.duplicateGuard.newDuplicateToolCallReadinessLaneCreated === false, 'duplicate tool-call lane created')
assert(duplicates.duplicateGuard.newDuplicateRunnerBoundaryLaneCreated === false, 'duplicate runner lane created')
assert(duplicates.counts.duplicateLaneCreatedCount === 0, 'duplicate count widened')

for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'product tool-call execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceReconciliation.decision === sourceDecision, 'source reconciliation mismatch')
assert(sourceReconciliation.reconciliationResult.runnerBoundaryBlockerClosedForPlanning === true, 'source runner blocker missing')
assert(sourceReconciliation.reconciliationResult.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceReconciliation.reconciliationResult.externalBetaAllowedToday === false, 'source external beta widened')
assert(sourceCounts.counts.productToolCallExecutionReadyCount === 0, 'source product tool-call count widened')
assert(sourceCounts.counts.externalBetaReadyCount === 0, 'source external beta count widened')
assert(sourceDuplicates.counts.duplicateLaneCreatedCount === 0, 'source duplicate count widened')
assert(sourceCompletion.acceptedDecision.runnerBoundaryBlockerClosedForPlanning === true, 'source completion runner blocker missing')
assert(sourceCompletion.acceptedDecision.productExecutionAuthorizedCount === 0, 'source completion product widened')
assert(toolCallPlan.planResult.acceptedSoundCpuToolCount === 15, 'tool-call plan count mismatch')
assert(toolCallProof.result.probePassedCount === 15, 'tool-call proof count mismatch')
assert(toolCallOwnerReview.acceptedForToday.productToolCallExecution === 'no', 'tool-call owner review widened')
assert(oldBetaPreflight.preflightResult.productToolCallExecutionApprovedToday === false, 'old beta preflight product widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionPerformed": true',
  '"workerExecutionPerformed": true',
  '"routeExecutionPerformed": true',
  '"mediaFileOpenPerformed": true',
  '"mediaProcessingPerformed": true',
  '"artifactWritePerformed": true',
  '"supabaseSqlPerformed": true',
  '"providerModelCallPerformed": true',
  '"dockerGcpPerformed": true',
  '"internalBetaUnlockedToday": true',
  '"externalBetaUnlockedToday": true',
  '"productionUnlockedToday": true',
  '"acceptedForProductExecutionTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"sqlExecuted": "yes"',
  'external beta ready true',
  'production ready true'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: result.sourcePr,
      sourceMergeCommit: result.sourceMergeCommit,
      acceptedSoundCpuToolCount: result.preflightResult.acceptedSoundCpuToolCount,
      dependencyBackedPreflightPassed: result.preflightResult.dependencyBackedPreflightPassed,
      productToolCallExecutionPerformed: result.preflightResult.productToolCallExecutionPerformed,
      internalBetaUnlockedToday: result.preflightResult.internalBetaUnlockedToday,
      externalBetaUnlockedToday: result.preflightResult.externalBetaUnlockedToday,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
