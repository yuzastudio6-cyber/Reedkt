import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_no_execution_regression_proof_owner_review_passed_with_warnings_ready_for_runtime_execution_owner_gate_map'
const gate2akDecision =
  'sound_runtime_media_gate_2ak_no_execution_regression_proof_passed_with_warnings_ready_for_regression_proof_owner_review'
const ownerSourceDecision =
  'worker_runtime_jobs_sound_cpu_runtime_guard_source_hardening_owner_review_passed_with_warnings_ready_for_no_execution_regression_proof'
const sourceHead = '4930f4ce3e97b2d6b3293f5071df2659fa00eb01'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-claim-policy.md',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function parseJsonBlock(path) {
  const text = read(path)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${path} missing fenced json block`)
  return JSON.parse(match[1])
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${path} owner mismatch`)
  assert(json.decision === decision, `${path} decision mismatch`)
}

const review = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr969.status === 'merged', 'PR #969 evidence missing')
assert(review.sourceVerification.pr969.mergeCommit === sourceHead, 'PR #969 merge commit mismatch')
assert(review.sourceVerification.pr969.decision === gate2akDecision, 'PR #969 decision mismatch')
assert(review.sourceVerification.pr963.decision === ownerSourceDecision, 'PR #963 decision mismatch')
assert(review.ownerReviewResult.noExecutionRegressionProofAcceptedForOwnerGateMapping === true, 'owner proof acceptance missing')
assert(review.ownerReviewResult.disabledFlagRegressionProofAccepted === true, 'disabled flag proof acceptance missing')
assert(review.ownerReviewResult.failClosedGuardProofAccepted === true, 'fail-closed proof acceptance missing')
assert(review.ownerReviewResult.runtimeModuleImportProofAccepted === true, 'runtime import proof acceptance missing')
assert(review.ownerReviewResult.futureRuntimeExecutionOwnerGateMapMayProceed === true, 'future owner gate map flag missing')
assert(review.ownerReviewResult.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const gate2ak = parseJsonBlock('docs/sound-runtime-media-gate-2ak-no-execution-regression-proof-result.md')
assert(gate2ak.decision === gate2akDecision, 'Gate 2AK decision mismatch')
assert(gate2ak.sourceVerification.pr963.decision === ownerSourceDecision, 'Gate 2AK PR #963 evidence mismatch')
assert(gate2ak.proofResult.controlledNoExecutionRegressionProofPassed === true, 'Gate 2AK proof pass missing')
assert(gate2ak.proofResult.importedRuntimeModuleCount === 6, 'Gate 2AK module count mismatch')
assert(gate2ak.proofResult.disabledFlagKeyCount === 5, 'Gate 2AK disabled flag count mismatch')
assert(gate2ak.proofResult.failClosedAssertionCount === 5, 'Gate 2AK fail-closed assertion count mismatch')
assert(gate2ak.proofResult.runtimeExecutionEnabledToday !== true, 'Gate 2AK must not enable runtime execution')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-acceptance-register.md']
assert(acceptance.acceptedProofEvidence.gate2akDecisionAccepted === true, 'Gate 2AK acceptance missing')
assert(acceptance.acceptedProofEvidence.controlledNoExecutionRegressionProofPassed === true, 'proof acceptance missing')
assert(acceptance.acceptedProofEvidence.importedRuntimeModuleCount === 6, 'accepted module count mismatch')
assert(acceptance.acceptedProofEvidence.disabledFlagKeyCount === 5, 'accepted flag count mismatch')
assert(acceptance.acceptedProofEvidence.failClosedAssertionCount === 5, 'accepted fail-closed count mismatch')
assert(acceptance.acceptedProofEvidence.workerDispatchExecuted === false, 'worker dispatch must be false')
assert(acceptance.acceptedProofEvidence.supabaseSqlExecuted === false, 'Supabase/SQL must be false')
assert(acceptance.acceptedForExecutionToday === false, 'accepted for execution today must be false')
assert(acceptance.acceptedForRuntimeReadinessToday === false, 'accepted for runtime readiness today must be false')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-readiness-register.md']
for (const [key, value] of Object.entries(readiness.futureGate2alReadiness)) {
  if (key.startsWith('mayPlan') || key.startsWith('mayMap')) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'no_execution_regression_proof_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_owner_gate_map_pending' && row.status === 'next'), 'next owner-gate map blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-claim-policy.md']
assert(policy.allowedClaims.noExecutionRegressionProofAcceptedForOwnerGateMapping === true, 'allowed proof acceptance claim missing')
assert(policy.allowedClaims.futureRuntimeExecutionOwnerGateMapMayProceed === true, 'future owner-gate map claim missing')
assert(policy.allowedClaims.runtimeExecutionEnabledToday === false, 'runtime execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2al-runtime-execution-readiness-owner-gate-map.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-no-execution-regression-proof-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_no_execution_regression_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr969Verified: true,
  noExecutionRegressionProofAcceptedForOwnerGateMapping: true,
  futureRuntimeExecutionOwnerGateMapMayProceed: true,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AL: runtime execution readiness owner-gate map, no execution'
}, null, 2))
