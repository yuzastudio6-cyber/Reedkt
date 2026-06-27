import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_controlled_runtime_beta_preflight_after_runner_boundary_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_completion_decision_after_image_import_proof_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation_after_runner_boundary_execution_proof'

const files = {
  reconciliation: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof.md',
  counts: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-count-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-blocker-register.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-duplicate-register.md',
  nextStep: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof.md',
  sourceCompletionDecision: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof.md',
  sourceCompletionEvidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-evidence-register-after-image-import-proof.md',
  sourceCompletionDuplicates: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-duplicate-register-after-image-import-proof.md',
  oldReconciliation: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof.md',
  oldReconciliationCounts: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-count-register.md',
  oldControlledPreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof.md',
  oldControlledPreflightReadiness: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-readiness-register.md',
  toolCallPlan: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof.md',
  toolCallProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  toolCallOwnerReview: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  betaPreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof.md'
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

const reconciliation = parseBlock(files.reconciliation, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof')
const counts = parseBlock(files.counts, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-count-register')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-blocker-register')
const duplicates = parseBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-duplicate-register')
const nextStep = parseBlock(files.nextStep, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-next-step-register')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-claim-policy')
const sourceCompletionDecision = parseBlock(files.sourceCompletionDecision, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof')
const sourceCompletionEvidence = parseBlock(files.sourceCompletionEvidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-evidence-register-after-image-import-proof')
const sourceCompletionDuplicates = parseBlock(files.sourceCompletionDuplicates, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-duplicate-register-after-image-import-proof')
const oldReconciliation = parseBlock(files.oldReconciliation, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof')
const oldReconciliationCounts = parseBlock(files.oldReconciliationCounts, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof-count-register')
const oldControlledPreflight = parseBlock(files.oldControlledPreflight, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof')
const oldControlledPreflightReadiness = parseBlock(files.oldControlledPreflightReadiness, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-readiness-register')
const toolCallPlan = parseBlock(files.toolCallPlan, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof')
const toolCallProof = parseBlock(files.toolCallProof, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof')
const toolCallOwnerReview = parseBlock(files.toolCallOwnerReview, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof')
const betaPreflight = parseBlock(files.betaPreflight, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [reconciliation, counts, blockers, duplicates, nextStep, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(reconciliation.sourceDecision === sourceDecision, 'source decision mismatch')
assert(reconciliation.sourcePr === 1240, 'source PR mismatch')
assert(reconciliation.sourceMergeCommit === 'b7ab9f2a6006e332e8f1d29f6a07cad6e93b362d', 'source merge mismatch')
assert(reconciliation.reconciliationResult.runnerBoundaryExecutionProofAccepted === true, 'runner boundary proof not accepted')
assert(reconciliation.reconciliationResult.runnerBoundaryBlockerClosedForPlanning === true, 'runner blocker not closed')
assert(reconciliation.reconciliationResult.priorControlledRuntimeBetaPreflightBlockedByDisk === true, 'prior disk blocker missing')
assert(reconciliation.reconciliationResult.currentValidationDiskAboveRetryThresholdAtPacketCreation === true, 'disk retry evidence missing')
assert(reconciliation.reconciliationResult.existingToolCallReadinessLaneReused === true, 'existing tool-call lane not reused')
assert(reconciliation.reconciliationResult.duplicateToolCallReadinessLaneCreated === false, 'duplicate tool-call lane created')
assert(reconciliation.reconciliationResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(reconciliation.reconciliationResult.syntheticToolCallProbePassedCount === 15, 'tool-call probe count mismatch')
assert(reconciliation.reconciliationResult.runnerBoundaryAllowPassedCount === 15, 'runner allow count mismatch')
assert(reconciliation.reconciliationResult.runnerBoundaryBlockedPassedCount === 14, 'runner blocked count mismatch')
assert(reconciliation.reconciliationResult.runnerBoundaryFailedFixtureCount === 0, 'runner failed count widened')
assert(reconciliation.reconciliationResult.planningGapCountClosedThisPacket === 2, 'closed gap count mismatch')
assert(reconciliation.reconciliationResult.remainingPlanningGapCount === 4, 'remaining gap count mismatch')
assert(reconciliation.reconciliationResult.nextSafeGate === 'controlled_runtime_beta_preflight_after_runner_boundary_execution_proof', 'next gate mismatch')

for (const key of [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'billingStripeApprovedToday',
  'complianceSecurityApprovedForExternalBetaToday',
  'internalBetaAllowedToday',
  'externalBetaAllowedToday',
  'productionAllowedToday'
]) {
  assert(reconciliation.reconciliationResult[key] === false, `${key} widened`)
}

assert(counts.counts.productToolCallExecutionReadyCount === 0, 'product tool-call readiness widened')
assert(counts.counts.workerExecutionReadyCount === 0, 'worker readiness widened')
assert(counts.counts.routeExecutionReadyCount === 0, 'route readiness widened')
assert(counts.counts.mediaProcessingReadyCount === 0, 'media readiness widened')
assert(counts.counts.supabaseSqlReadyCount === 0, 'Supabase readiness widened')
assert(counts.counts.internalBetaReadyCount === 0, 'internal beta widened')
assert(counts.counts.externalBetaReadyCount === 0, 'external beta widened')
assert(counts.counts.productionReadyCount === 0, 'production widened')
assert(counts.interpretation.controlledRuntimeBetaPreflightMustRunBeforeAnyInternalBetaClaim === true, 'internal beta prerequisite missing')

assert(blockers.resolvedForPlanning.length === 2, 'resolved blocker count mismatch')
assert(blockers.stillBlocked.length === 4, 'still blocked count mismatch')
assert(blockers.stillBlocked.some((row) => row.id === 'controlled_runtime_beta_preflight_after_runner_boundary_execution_proof' && row.status === 'next'), 'next preflight blocker missing')
assert(blockers.stillBlocked.some((row) => row.id === 'product_tool_call_execution'), 'product blocker missing')
assert(blockers.counts.externalBetaBlockingCount === 4, 'external beta blocker count mismatch')
assert(blockers.counts.productionBlockingCount === 4, 'production blocker count mismatch')

assert(duplicates.duplicateGuard.samePurposeRemoteBranchFoundAtCreation === false, 'same-purpose branch found')
assert(duplicates.duplicateGuard.samePurposeOpenPrFoundAtCreation === false, 'same-purpose PR found')
assert(duplicates.duplicateGuard.existingToolCallReadinessPlanAfterImageImportProof === true, 'existing tool plan missing')
assert(duplicates.duplicateGuard.existingToolCallReadinessProofAfterImageImportProof === true, 'existing tool proof missing')
assert(duplicates.duplicateGuard.existingToolCallReadinessOwnerReviewAfterImageImportProof === true, 'existing owner review missing')
assert(duplicates.duplicateGuard.existingControlledBetaToolCallPreflightAfterImageImportProof === true, 'existing beta preflight missing')
assert(duplicates.duplicateGuard.existingRuntimeBetaReadinessReconciliationAfterImageImportProof === true, 'existing reconciliation missing')
assert(duplicates.duplicateGuard.existingBlockedControlledRuntimeBetaPreflightAfterImageImportProof === true, 'old blocked preflight missing')
assert(duplicates.duplicateGuard.newDuplicateToolCallReadinessLaneCreated === false, 'duplicate tool-call lane created')
assert(duplicates.counts.duplicateLaneCreatedCount === 0, 'duplicate count widened')

assert(nextStep.nextStep.prompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-RUNTIME-BETA-PREFLIGHT-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF', 'next prompt mismatch')
assert(nextStep.nextStep.mayUseDependencyHydration === true, 'dependency hydration planning missing')
for (const key of [
  'mayExecuteProductToolCalls',
  'mayExecuteWorkers',
  'mayOpenMedia',
  'mayWriteArtifacts',
  'mayTouchSupabaseOrSql',
  'mayUnlockInternalBeta',
  'mayUnlockExternalBeta',
  'mayUnlockProduction'
]) {
  assert(nextStep.nextStep[key] === false, `${key} widened`)
}

for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'product tool-call execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceCompletionDecision.decision === sourceDecision, 'source completion decision mismatch')
assert(sourceCompletionDecision.sourcePr === 1235, 'source completion PR mismatch')
assert(sourceCompletionDecision.acceptedDecision.runnerBoundaryBlockerClosedForPlanning === true, 'source runner blocker missing')
assert(sourceCompletionDecision.acceptedDecision.productExecutionAuthorizedCount === 0, 'source product execution widened')
assert(sourceCompletionEvidence.acceptedProofEvidence.runnerBoundaryCompletionStatus === 'complete_for_planning_only', 'source completion status mismatch')
assert(sourceCompletionDuplicates.duplicateGuard.newDuplicateToolCallReadinessPlanCreated === false, 'source duplicate widened')

assert(oldReconciliation.reconciliationResult.currentSourceNeedsPreflightRefresh === true, 'old reconciliation did not require preflight refresh')
assert(oldReconciliation.reconciliationResult.toolExecutionApprovedToday === false, 'old reconciliation tool execution widened')
assert(oldReconciliationCounts.counts.productToolCallExecutionReadyCount === 0, 'old product readiness widened')
assert(oldControlledPreflight.decision === 'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_image_import_proof_blocked_dependency_hydration_disk_risk', 'old preflight blocker mismatch')
assert(oldControlledPreflightReadiness.dependencyBackedPreflightPassed === false, 'old preflight unexpectedly passed')
assert(oldControlledPreflightReadiness.externalBetaReady === false, 'old preflight external beta widened')

assert(toolCallPlan.planResult.acceptedSoundCpuToolCount === 15, 'tool-call plan tool count mismatch')
assert(toolCallPlan.planResult.toolCallExecutionApprovedToday === false, 'tool-call plan execution widened')
assert(toolCallProof.result.probePassedCount === 15, 'tool-call proof probe mismatch')
assert(toolCallProof.scope.mediaFileOpen === 'no', 'tool-call proof media widened')
assert(toolCallOwnerReview.acceptedForToday.productToolCallExecution === 'no', 'owner review product widened')
assert(betaPreflight.preflightResult.productToolCallExecutionApprovedToday === false, 'beta preflight product widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"runtimeExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"toolExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"internalBetaAllowedToday": true',
  '"externalBetaAllowedToday": true',
  '"productionAllowedToday": true',
  '"externalBetaReadyCount": 15',
  '"productionReadyCount": 15',
  '"sqlExecuted": "yes"',
  'external beta ready true',
  'production ready true'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: reconciliation.sourcePr,
      sourceMergeCommit: reconciliation.sourceMergeCommit,
      acceptedSoundCpuToolCount: reconciliation.reconciliationResult.acceptedSoundCpuToolCount,
      runnerBoundaryBlockerClosedForPlanning: reconciliation.reconciliationResult.runnerBoundaryBlockerClosedForPlanning,
      duplicateLaneCreatedCount: duplicates.counts.duplicateLaneCreatedCount,
      internalBetaAllowedToday: reconciliation.reconciliationResult.internalBetaAllowedToday,
      externalBetaAllowedToday: reconciliation.reconciliationResult.externalBetaAllowedToday,
      nextPrompt: reconciliation.nextPrompt
    },
    null,
    2
  )
)
