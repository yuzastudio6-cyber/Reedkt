import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_completed_with_warnings_ready_for_runtime_beta_blocker_resolution_refresh'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_retry_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation'
const sourceHead = '1483b8ce7a40b7a1555cbc17661357dd0a62df82'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-BETA-BLOCKER-RESOLUTION-REFRESH: refresh runtime beta blockers after no-media package proof retry, no execution'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-count-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-next-step-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-duplicate-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-claim-policy.md',
]

const requiredFiles = [
  ...docs,
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review.md',
  'docs/worker-runtime-jobs-sound-cpu-current-lane-status-review.md',
  'docs/worker-runtime-jobs-sound-cpu-current-tool-readiness-count-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md',
  'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh.md',
  'package.json',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  assert(fs.existsSync(file), `Missing file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJsonBlock(file) {
  const text = read(file)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${file} missing fenced json block`)
  return JSON.parse(match[1])
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value?.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value?.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value?.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value?.nextAction === 'none', `${label}.nextAction must be none`)
}

for (const file of requiredFiles) read(file)

const parsed = Object.fromEntries(docs.map((file) => [file, parseJsonBlock(file)]))
for (const [file, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${file} owner mismatch`)
  assert(json.decision === decision, `${file} decision mismatch`)
}

const reconciliation = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation.md']
assert(reconciliation.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(reconciliation.sourceVerification.pr1120.mergeCommit === sourceHead, 'PR #1120 merge commit mismatch')
assert(reconciliation.sourceVerification.pr1120.decision === sourceDecision, 'PR #1120 decision mismatch')
assert(reconciliation.reconciliationResult.repoEvidenceInspected === true, 'repo evidence inspection missing')
assert(reconciliation.reconciliationResult.ownerChatWaitRequired === false, 'owner wait must be false')
assert(reconciliation.reconciliationResult.openDuplicatePrFound === false, 'duplicate PR flag must be false')
assert(reconciliation.reconciliationResult.packageProofRetryPassed === true, 'retry proof pass missing')
assert(reconciliation.reconciliationResult.packageProofReadyForPlanningCount === 15, 'package proof count mismatch')
assert(reconciliation.reconciliationResult.persistentRuntimeInstallReadyCount === 0, 'persistent runtime install count must be zero')
assert(reconciliation.reconciliationResult.toolCallExecutionReadyCount === 0, 'tool-call count must be zero')
assert(reconciliation.reconciliationResult.oldRuntimeBetaBlockerResolutionPredatesRetryProof === true, 'old blocker age flag missing')
assert(reconciliation.reconciliationResult.nextSafeGate === 'runtime_beta_blocker_resolution_refresh_after_retry_proof', 'next safe gate mismatch')
assert(reconciliation.reconciliationResult.nextGateRequiresSeparatePrompt === true, 'separate prompt guard missing')
for (const key of [
  'currentPromptExecutionPerformed',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseSqlApprovedToday',
  'artifactDeliveryApprovedToday',
  'internalBetaAllowedToday',
  'externalBetaAllowedToday',
  'productionAllowedToday',
]) {
  assert(reconciliation.reconciliationResult[key] === false, `${key} must remain false`)
}
assert(reconciliation.nextPrompt === nextPrompt, 'next prompt mismatch')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-evidence-register.md']
assert(evidence.evidenceRows.length === 4, 'evidence row count mismatch')
for (const row of evidence.evidenceRows) {
  assert(Array.isArray(row.evidenceFiles) && row.evidenceFiles.length > 0, `${row.lane} evidence list missing`)
  for (const file of row.evidenceFiles) read(file)
}

const counts = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-count-register.md']
assert(counts.counts.candidateToolCount === 15, 'candidate count mismatch')
assert(counts.counts.retryPackageProofPassedCount === 15, 'retry proof count mismatch')
assert(counts.counts.persistentRuntimeInstallReadyCount === 0, 'runtime install count must be zero')
assert(counts.counts.toolCallExecutionReadyCount === 0, 'tool-call count must be zero')
assert(counts.counts.externalBetaReadyCount === 0, 'external beta count must be zero')
assert(counts.interpretation.packageProofIsNecessaryButNotSufficientForBeta === true, 'package proof interpretation missing')

const next = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-next-step-register.md']
assert(next.nextStep.recommendedPrompt === nextPrompt, 'recommended prompt mismatch')
assert(next.nextStep.recommendedPromptFile === 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh.md', 'recommended prompt file mismatch')
for (const key of ['doNotResumeOldBetaPromptBlindly', 'doNotStartToolCalls', 'doNotStartWorkersRoutes', 'doNotStartMedia', 'doNotStartSupabase', 'doNotUnlockBeta', 'doNotUnlockProduction']) {
  assert(next.nextStep[key] === true, `${key} guard missing`)
}

const duplicate = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-duplicate-register.md']
assert(duplicate.duplicateReview.samePurposeOpenPrFound === false, 'same-purpose PR must be false')
assert(duplicate.duplicateReview.samePurposeRemoteBranchFound === false, 'same-purpose branch must be false')
assert(duplicate.duplicateReview.adjacentOpenPrs.length === 3, 'adjacent PR count mismatch')
assert(duplicate.duplicateReview.adjacentOpenPrs.every((row) => row.blocksThisPacket === false), 'adjacent PRs must not block')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-blocker-register.md']
assert(blockers.resolvedForPlanning.length === 1, 'resolved blocker count mismatch')
assert(blockers.stillBlocked.length === 9, 'still-blocked count mismatch')
assert(blockers.stillBlocked.every((row) => row.status === 'blocked'), 'all blockers must remain blocked')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-claim-policy.md']
for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claims must be true')
for (const claim of ['tool-call execution ready', 'worker execution ready', 'route execution ready', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assertNoop(policy.supabaseClassification, 'policy.supabaseClassification')

const retry = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md')
assert(retry.decision === sourceDecision, 'retry source decision mismatch')
assert(retry.proofResult.packageProofPassed === true, 'retry package proof did not pass')
assert(retry.readinessOutcome.toolCallReadinessClaimed === false, 'retry widened tool-call readiness')
assert(retry.readinessOutcome.externalBetaUnlocked === false, 'retry widened external beta')

const oldBlocker = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution.md')
assert(oldBlocker.resolutionResult.repoLaneEvidenceSufficientForNextPlanningStep === true, 'old blocker source missing')
assert(oldBlocker.resolutionResult.runtimeExecutionApprovedToday === false, 'old blocker widened runtime execution')

const productBeta = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md')
assert(productBeta.gapClosureResult.allPlanningGapsClosedToday === true, 'planning gap closure missing')
assert(productBeta.gapClosureResult.externalBetaAllowed === false, 'product beta closure widened external beta')
assert(productBeta.gapClosureResult.productionAllowed === false, 'product beta closure widened production')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh.md')
assert(prompt.includes(decision), 'refresh prompt must require reconciliation decision')
assert(prompt.includes('This prompt is no-execution and decision-only'), 'refresh prompt must be no-execution')
assert(prompt.includes('Do not run package installation'), 'refresh prompt must block package install')
assert(prompt.includes('Do not claim internal beta'), 'refresh prompt must block beta claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-beta-readiness-reconciliation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_diagnostics_passed',
  decision,
  sourceHead,
  retryPackageProofPassed: true,
  persistentRuntimeInstallReadyCount: 0,
  toolCallExecutionReadyCount: 0,
  externalBetaAllowedToday: false,
  productionAllowedToday: false,
  nextPrompt,
}, null, 2))
