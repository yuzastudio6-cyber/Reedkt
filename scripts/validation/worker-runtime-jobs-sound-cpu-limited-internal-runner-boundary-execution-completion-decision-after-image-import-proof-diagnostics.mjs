import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_completion_decision_after_image_import_proof_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation_after_runner_boundary_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_owner_review_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_execution_completion_decision_after_image_import_proof'
const controlledProofDecision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_execution_proof_owner_review_after_image_import_proof'

const files = {
  decision: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-evidence-register-after-image-import-proof.md',
  scope: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-scope-register-after-image-import-proof.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-duplicate-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-acceptance-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-evidence-review-register-after-image-import-proof.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-boundary-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-claim-policy-after-image-import-proof.md',
  controlledProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof.md',
  controlledProofEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-evidence-register-after-image-import-proof.md',
  toolCallPlan: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof.md',
  toolCallProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  toolCallOwnerReview: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  betaPreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof.md',
  runtimeBetaReconciliation: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof.md'
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

const decisionDoc = parseBlock(files.decision, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-evidence-register-after-image-import-proof')
const scope = parseBlock(files.scope, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-scope-register-after-image-import-proof')
const duplicates = parseBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-duplicate-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof')
const sourceAcceptance = parseBlock(files.sourceAcceptance, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-acceptance-register-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-evidence-review-register-after-image-import-proof')
const sourceBoundary = parseBlock(files.sourceBoundary, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-boundary-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-claim-policy-after-image-import-proof')
const controlledProof = parseBlock(files.controlledProof, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof')
const controlledProofEvidence = parseBlock(files.controlledProofEvidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-evidence-register-after-image-import-proof')
const toolCallPlan = parseBlock(files.toolCallPlan, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof')
const toolCallProof = parseBlock(files.toolCallProof, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof')
const toolCallOwnerReview = parseBlock(files.toolCallOwnerReview, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof')
const betaPreflight = parseBlock(files.betaPreflight, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof')
const runtimeBetaReconciliation = parseBlock(files.runtimeBetaReconciliation, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [decisionDoc, evidence, scope, duplicates, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'controlled execution proof no longer passes')
assert(liveProof.acceptedToolCount === 15, 'live tool count mismatch')
assert(liveProof.allowPassedCount === 15, 'live allow count mismatch')
assert(liveProof.blockedPassedCount === 14, 'live blocked count mismatch')
assert(liveProof.failedFixtures.length === 0, 'live failed fixtures present')
assert(liveProof.productToolCallExecution === 'no', 'live product execution widened')
assert(liveProof.workerExecution === 'no', 'live worker execution widened')
assert(liveProof.internalBetaUnlock === 'no', 'live internal beta widened')

assert(decisionDoc.sourceDecision === sourceDecision, 'source decision mismatch')
assert(decisionDoc.sourcePr === 1235, 'source PR mismatch')
assert(decisionDoc.sourceMergeCommit === '3f3cea1016a18f87715684bc12b3eb6b042aec7d', 'source merge mismatch')
assert(decisionDoc.acceptedDecision.limitedInternalRunnerBoundaryExecutionProofCompleteForPlanning === true, 'completion not accepted')
assert(decisionDoc.acceptedDecision.runnerBoundaryBlockerClosedForPlanning === true, 'runner blocker not closed for planning')
assert(decisionDoc.acceptedDecision.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(decisionDoc.acceptedDecision.allowPassedCount === 15, 'allow count mismatch')
assert(decisionDoc.acceptedDecision.blockedPassedCount === 14, 'blocked count mismatch')
assert(decisionDoc.acceptedDecision.failedFixtureCount === 0, 'failed fixture count widened')
assert(decisionDoc.acceptedDecision.requiredFieldCount === 9, 'required field count mismatch')
assert(decisionDoc.acceptedDecision.runtimeFlagsRequiredFalseCount === 3, 'runtime false flag count mismatch')
assert(decisionDoc.acceptedDecision.productExecutionAuthorizedCount === 0, 'product execution widened')
assert(decisionDoc.acceptedDecision.workerExecutionAuthorizedCount === 0, 'worker execution widened')
assert(decisionDoc.acceptedDecision.internalBetaUnlockCount === 0, 'internal beta widened')
assert(decisionDoc.acceptedDecision.externalBetaReadyCount === 0, 'external beta widened')
assert(decisionDoc.acceptedDecision.productionReadyCount === 0, 'production widened')
assert(decisionDoc.acceptedForToday.runtimeBetaReadinessReconciliationPlanning === 'yes', 'reconciliation planning not accepted')
assert(decisionDoc.acceptedForToday.limitedInternalRunnerBoundaryExecutionCompletionStatus === 'complete_for_planning_only', 'completion status widened')

for (const key of [
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
  assert(decisionDoc.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(evidence.sourceEvidence.proofOwnerReviewPr === 1235, 'evidence owner review PR mismatch')
assert(evidence.sourceEvidence.controlledExecutionProofPr === 1228, 'evidence controlled proof PR mismatch')
assert(evidence.acceptedProofEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.acceptedProofEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.acceptedProofEvidence.blockedPassedCount === 14, 'evidence blocked count mismatch')
assert(evidence.acceptedProofEvidence.failedFixtureCount === 0, 'evidence failed count widened')
assert(evidence.existingRelatedLaneEvidence.duplicateToolCallReadinessPlanCreatedInThisPacket === false, 'duplicate plan created')
assert(evidence.evidenceStatus === 'accepted_for_runtime_beta_readiness_reconciliation_planning_after_runner_boundary_execution_proof_only', 'evidence status widened')
for (const item of ['generated_local_fixture_passed', 'dry_run_passed', 'product_tool_call_execution', 'external_beta']) {
  assert(evidence.notEvidenceFor.includes(item), `missing not-evidence item ${item}`)
}

assert(scope.counts.authorizedNextPlanningItemCount === 6, 'authorized planning count mismatch')
assert(scope.counts.notAuthorizedTodayCount === 23, 'not authorized count mismatch')
for (const key of [
  'productExecutionAuthorizedCount',
  'workerExecutionAuthorizedCount',
  'mediaProcessingAuthorizedCount',
  'artifactDeliveryAuthorizedCount',
  'supabaseSqlAuthorizedCount',
  'betaUnlockAuthorizedCount',
  'productionUnlockAuthorizedCount'
]) {
  assert(scope.counts[key] === 0, `${key} widened`)
}
for (const item of ['product_tool_call_execution', 'media_file_open', 'artifact_write', 'supabase_mutation', 'sql_execution']) {
  assert(scope.notAuthorized.includes(item), `missing non-authorization ${item}`)
}

assert(duplicates.duplicateGuard.samePurposeRemoteBranchFoundAtCreation === false, 'same-purpose branch found')
assert(duplicates.duplicateGuard.samePurposeOpenPrFoundAtCreation === false, 'same-purpose PR found')
assert(duplicates.duplicateGuard.existingLimitedNoMediaToolCallReadinessPlanAfterImageImportProof === true, 'existing tool plan missing')
assert(duplicates.duplicateGuard.existingControlledToolCallReadinessProofAfterImageImportProof === true, 'existing tool proof missing')
assert(duplicates.duplicateGuard.existingToolCallReadinessOwnerReviewAfterImageImportProof === true, 'existing tool owner review missing')
assert(duplicates.duplicateGuard.existingRuntimeBetaReadinessReconciliationAfterImageImportProof === true, 'existing beta reconciliation missing')
assert(duplicates.duplicateGuard.newDuplicateToolCallReadinessPlanCreated === false, 'duplicate tool plan widened')
assert(duplicates.reusePolicy.refreshOnlyRuntimeBetaReadinessReconciliationAfterRunnerBoundaryCompletion === true, 'refresh policy missing')
assert(duplicates.reusePolicy.ownerChatWaitRequired === false, 'owner wait widened')
assert(duplicates.counts.duplicateLaneCreatedCount === 0, 'duplicate lane count widened')

assert(blockers.closedForPlanning.length === 3, 'closed planning count mismatch')
assert(blockers.nextBlocker.recommendedPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-BETA-READINESS-RECONCILIATION-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF', 'next blocker prompt mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product execution blocker widened')

assert(policy.allowedClaims.limitedInternalRunnerBoundaryExecutionProofCompleteForPlanning === true, 'allowed completion claim missing')
assert(policy.allowedClaims.runtimeBetaReadinessReconciliationPlanningMayProceed === true, 'allowed reconciliation claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.allowPassedCount === 15, 'allowed allow count mismatch')
assert(policy.allowedClaims.blockedPassedCount === 14, 'allowed blocked count mismatch')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count widened')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceReview.decision === sourceDecision, 'source review decision mismatch')
assert(sourceReview.sourcePr === 1228, 'source review upstream PR mismatch')
assert(sourceReview.sourceMergeCommit === '7c054acdb5dac6e91d4599dbc852ecd34dddedd5', 'source review merge mismatch')
assert(sourceReview.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceReview.acceptedEvidence.allowPassedCount === 15, 'source allow count mismatch')
assert(sourceReview.acceptedEvidence.blockedPassedCount === 14, 'source blocked count mismatch')
assert(sourceReview.acceptedEvidence.failedFixtureCount === 0, 'source failed widened')
assert(sourceReview.acceptedEvidence.productExecutionAuthorizedCount === 0, 'source product execution widened')
assert(sourceAcceptance.counts.acceptedForProductExecutionTodayCount === 0, 'source product count widened')
assert(sourceEvidence.reviewedProofEvidence.failedFixtureCount === 0, 'source evidence failed widened')
assert(sourceBoundary.boundary.productToolCallExecutionReadyToday === false, 'source product readiness widened')
assert(sourceBoundary.boundary.internalBetaUnlockedToday === false, 'source internal beta widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

assert(controlledProof.decision === controlledProofDecision, 'controlled proof decision mismatch')
assert(controlledProof.result.allowPassedCount === 15, 'controlled proof allow mismatch')
assert(controlledProof.result.blockedPassedCount === 14, 'controlled proof blocked mismatch')
assert(controlledProof.result.failedFixtureCount === 0, 'controlled proof failed widened')
assert(controlledProof.scope.productToolCallExecution === 'no', 'controlled proof product widened')
assert(controlledProof.scope.workerExecution === 'no', 'controlled proof worker widened')
assert(controlledProofEvidence.proofEvidence.failedFixtureCount === 0, 'controlled proof evidence failed widened')

assert(toolCallPlan.planResult.acceptedSoundCpuToolCount === 15, 'tool-call plan tool count mismatch')
assert(toolCallPlan.planResult.toolCallExecutionApprovedToday === false, 'tool-call plan execution widened')
assert(toolCallProof.result.probePassedCount === 15, 'tool-call proof probe count mismatch')
assert(toolCallProof.scope.mediaFileOpen === 'no', 'tool-call proof media widened')
assert(toolCallOwnerReview.acceptedForToday.productToolCallExecution === 'no', 'tool-call owner product widened')
assert(betaPreflight.preflightResult.productToolCallExecutionApprovedToday === false, 'beta preflight product widened')
assert(runtimeBetaReconciliation.reconciliationResult.currentSourceNeedsPreflightRefresh === true, 'existing reconciliation freshness expectation missing')
assert(runtimeBetaReconciliation.reconciliationResult.toolExecutionApprovedToday === false, 'existing reconciliation tool execution widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof-diagnostics.mjs',
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
  '"productExecutionAuthorizedCount": 15',
  '"workerExecutionAuthorizedCount": 15',
  '"betaUnlockAuthorizedCount": 15',
  '"externalBetaReadyCount": 15',
  '"productionReadyCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled',
  'external beta ready',
  'production ready'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_completion_decision_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: decisionDoc.sourcePr,
      sourceMergeCommit: decisionDoc.sourceMergeCommit,
      acceptedSoundCpuToolCount: decisionDoc.acceptedDecision.acceptedSoundCpuToolCount,
      allowPassedCount: decisionDoc.acceptedDecision.allowPassedCount,
      blockedPassedCount: decisionDoc.acceptedDecision.blockedPassedCount,
      failedFixtureCount: decisionDoc.acceptedDecision.failedFixtureCount,
      duplicateLaneCreatedCount: duplicates.counts.duplicateLaneCreatedCount,
      productExecutionAuthorizedCount: decisionDoc.acceptedDecision.productExecutionAuthorizedCount,
      workerExecutionAuthorizedCount: decisionDoc.acceptedDecision.workerExecutionAuthorizedCount,
      nextPrompt: decisionDoc.nextPrompt
    },
    null,
    2
  )
)
