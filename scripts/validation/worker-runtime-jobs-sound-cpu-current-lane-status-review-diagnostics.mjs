import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_current_lane_status_review_completed_with_warnings_ready_for_runtime_beta_readiness_decision_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_package_proof_lane_reconciliation_completed_with_warnings_ready_for_current_lane_status_review'
const sourceHead = '792b67da0a2fa29ddd147fb0ef18732e11793b29'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-BETA-READINESS-DECISION-REVIEW: decide next safe SOUND CPU runtime/beta gate from repo evidence, no execution'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-current-lane-status-review.md',
  'docs/worker-runtime-jobs-sound-cpu-current-tool-readiness-count-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-lane-context-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-blocked-gates-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-next-step-decision-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-lane-status-claim-policy.md',
]

const requiredFiles = [
  ...docs,
  'docs/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md',
  'docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review.md',
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

const status = parsed['docs/worker-runtime-jobs-sound-cpu-current-lane-status-review.md']
assert(status.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(status.sourceVerification.pr1114.mergeCommit === sourceHead, 'PR #1114 merge commit mismatch')
assert(status.sourceVerification.pr1114.decision === sourceDecision, 'PR #1114 decision mismatch')
assert(status.statusReviewResult.repoEvidenceInspected === true, 'repo evidence inspection missing')
assert(status.statusReviewResult.ownerChatWaitRequired === false, 'owner chat wait must be false')
assert(status.statusReviewResult.openDuplicatePrFound === false, 'duplicate PR flag must be false')
assert(status.statusReviewResult.packageProofReadyForPlanningCount === 15, 'package proof planning count mismatch')
assert(status.statusReviewResult.persistentRuntimeInstallReadyCount === 0, 'persistent runtime install count must be zero')
assert(status.statusReviewResult.toolCallExecutionReadyCount === 0, 'tool-call ready count must be zero')
assert(status.statusReviewResult.workerRuntimeExecutionReadyCount === 0, 'worker runtime ready count must be zero')
assert(status.statusReviewResult.notYetRuntimeInstalledOrCallableCount === 15, 'not callable count mismatch')
assert(status.statusReviewResult.externalBetaReadyToday === false, 'external beta must be false')
assert(status.statusReviewResult.productionReadyToday === false, 'production must be false')
assert(status.nextPrompt === nextPrompt, 'next prompt mismatch')

const counts = parsed['docs/worker-runtime-jobs-sound-cpu-current-tool-readiness-count-register.md']
assert(counts.toolCounts.candidateToolCount === 15, 'candidate tool count mismatch')
assert(counts.toolCounts.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(counts.toolCounts.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(counts.toolCounts.packageProofReadyForPlanningTools.length === 15, 'package-proof tool list count mismatch')
assert(counts.toolCounts.persistentRuntimeInstallReadyTools.length === 0, 'runtime install-ready list must be empty')
assert(counts.toolCounts.toolCallExecutionReadyTools.length === 0, 'tool-call-ready list must be empty')
assert(counts.interpretation.doNotCallTheseToolsYet === true, 'do-not-call flag missing')

const context = parsed['docs/worker-runtime-jobs-sound-cpu-current-lane-context-register.md']
assert(context.contextRows.length === 6, 'context row count mismatch')
for (const lane of ['package_proof', 'package_proof_lane_reconciliation', 'synthetic_tool_call_owner_review', 'controlled_runtime_beta_preflight', 'runtime_execution_approval_gate', 'limited_no_media_no_artifact_package_proof']) {
  assert(context.contextRows.some((row) => row.lane === lane), `missing context lane ${lane}`)
}

const blocked = parsed['docs/worker-runtime-jobs-sound-cpu-current-blocked-gates-register.md']
for (const value of Object.values(blocked.blockedGates)) assert(value === true, 'all current gates must remain blocked')
assert(blocked.whyStillBlocked.length >= 3, 'blocked rationale missing')

const next = parsed['docs/worker-runtime-jobs-sound-cpu-current-next-step-decision-register.md']
assert(next.nextStep.recommendedPrompt === nextPrompt, 'recommended next prompt mismatch')
assert(next.nextStep.doNotResumeBlindlyFromOlderPrompt === true, 'blind resume guard missing')
assert(next.nextStep.doNotStartExternalBeta === true, 'external beta guard missing')
assert(next.nextStep.doNotStartToolCalls === true, 'tool-call guard missing')
assert(next.decisionOptionsForNextPrompt.length === 3, 'decision option count mismatch')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-current-lane-status-claim-policy.md']
assert(policy.allowedClaims.allFifteenToolsHavePackageProofForPlanning === true, 'allowed package proof claim missing')
assert(policy.allowedClaims.persistentRuntimeInstallReadyCountIsZero === true, 'runtime zero claim missing')
assert(policy.allowedClaims.toolCallExecutionReadyCountIsZero === true, 'tool-call zero claim missing')
for (const claim of ['15 tools are callable today', '15 tools are runtime installed today', 'tool-call execution ready', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assertNoop(policy.supabaseClassification, 'policy.supabaseClassification')

const reconciliation = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md')
assert(reconciliation.decision === sourceDecision, 'reconciliation source decision mismatch')
assert(reconciliation.reconciliationResult.allFifteenCandidateToolsPackageProofCovered === true, 'reconciliation package proof missing')
assert(reconciliation.reconciliationResult.toolCallExecutionApprovedToday === false, 'reconciliation tool-call gate widened')

const packageProof = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md')
assert(packageProof.ownerReviewResult.allFifteenCandidateToolsCovered === true, 'package proof source count mismatch')
assert(packageProof.ownerReviewResult.acceptedForToolCallExecutionToday === false, 'package proof source execution widened')

const syntheticToolCall = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md')
assert(syntheticToolCall.acceptedEvidence.toolCandidateCount === 15, 'synthetic tool-call candidate count mismatch')
assert(syntheticToolCall.acceptedForToday.workerExecution === 'no', 'synthetic worker execution widened')
assert(syntheticToolCall.acceptedForToday.externalBetaUnlock === 'no', 'synthetic beta widened')

const preflight = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md')
assert(preflight.preflightResult.toolCandidateCount === 15, 'preflight candidate count mismatch')
assert(preflight.preflightResult.externalBetaAllowed === false, 'preflight external beta widened')
assert(preflight.preflightResult.runtimeExecutionApprovedToday === false, 'preflight runtime execution widened')

const runtimeGate = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md')
assert(runtimeGate.approvalGateResult.futureLimitedNoMediaNoArtifactExecutionPlanMayProceed === true, 'runtime gate planning flag missing')
assert(runtimeGate.approvalGateResult.approvedForExecutionToday === false, 'runtime gate execution approval widened')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review.md')
assert(prompt.includes(decision), 'next prompt must require current status decision')
assert(prompt.includes('persistent runtime-install-ready count is `0`'), 'next prompt must preserve runtime zero count')
assert(prompt.includes('tool-call-execution-ready count is `0`'), 'next prompt must preserve tool-call zero count')
assert(prompt.includes('Do not duplicate'), 'next prompt must block duplicates')
assert(prompt.includes('readiness claims'), 'next prompt must block readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-current-lane-status-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-current-lane-status-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_current_lane_status_review_diagnostics_passed',
  decision,
  sourceHead,
  packageProofReadyForPlanningCount: 15,
  persistentRuntimeInstallReadyCount: 0,
  toolCallExecutionReadyCount: 0,
  notYetRuntimeInstalledOrCallableCount: 15,
  externalBetaReadyToday: false,
  productionReadyToday: false,
  nextPrompt,
}, null, 2))
