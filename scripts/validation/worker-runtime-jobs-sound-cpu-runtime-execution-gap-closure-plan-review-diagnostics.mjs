import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_gap_closure_plan_review_passed_with_warnings_ready_for_worker_dispatch_contract_criteria_plan'
const gate2anDecision =
  'sound_runtime_media_gate_2an_runtime_execution_approval_readiness_gap_closure_plan_completed_with_warnings_ready_for_gap_closure_owner_review'
const ownerApprovalPacketReviewDecision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_owner_approval_packet_review_passed_with_warnings_ready_for_runtime_execution_approval_gap_closure_plan'
const sourceHead = 'd3e15470784feb2b7ff2240e9e8e3ae4045963bf'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-plan-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-plan-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr986.status === 'merged', 'PR #986 status mismatch')
assert(review.sourceVerification.pr986.mergeCommit === sourceHead, 'PR #986 merge commit mismatch')
assert(review.sourceVerification.pr986.decision === gate2anDecision, 'PR #986 decision mismatch')
assert(review.sourceVerification.pr983.decision === ownerApprovalPacketReviewDecision, 'PR #983 decision mismatch')
assert(review.ownerReviewResult.runtimeExecutionGapClosurePlanAcceptedForWorkerDispatchCriteriaPlanning === true, 'gap closure acceptance missing')
assert(review.ownerReviewResult.trackedGapCountAccepted === 8, 'tracked gap count mismatch')
assert(review.ownerReviewResult.closedGapCountAccepted === 0, 'closed gap count must be zero')
assert(review.ownerReviewResult.futureWorkerDispatchContractCriteriaPlanMayProceed === true, 'future criteria plan flag missing')
for (const [key, value] of Object.entries(review.ownerReviewResult)) {
  if (
    key === 'runtimeExecutionGapClosurePlanAcceptedForWorkerDispatchCriteriaPlanning' ||
    key === 'trackedGapCountAccepted' ||
    key === 'closedGapCountAccepted' ||
    key === 'futureWorkerDispatchContractCriteriaPlanMayProceed'
  ) continue
  assert(value === false, `${key} must be false`)
}

const gate2an = parseJsonBlock('docs/sound-runtime-media-gate-2an-runtime-execution-approval-readiness-gap-closure-plan.md')
assert(gate2an.decision === gate2anDecision, 'Gate 2AN decision mismatch')
assert(gate2an.gapClosurePlanResult.trackedGapCount === 8, 'Gate 2AN tracked gap count mismatch')
assert(gate2an.gapClosurePlanResult.closedGapCountToday === 0, 'Gate 2AN closed gap count must be zero')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-acceptance-register.md']
assert(acceptance.acceptedGapClosureEvidence.gate2anDecisionAccepted === true, 'Gate 2AN acceptance missing')
assert(acceptance.acceptedGapClosureEvidence.trackedGapCount === 8, 'accepted tracked gap count mismatch')
assert(acceptance.acceptedGapClosureEvidence.closedGapCountToday === 0, 'accepted closed gap count must be zero')
assert(acceptance.acceptedForWorkerDispatchCriteriaPlanningOnly === true, 'planning-only acceptance missing')
assert(acceptance.acceptedForRuntimeExecutionToday === false, 'runtime execution must remain false')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-readiness-register.md']
for (const [key, value] of Object.entries(readiness.futureWorkerDispatchContractCriteriaReadiness)) {
  if (key.startsWith('mayPlan')) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_execution_gap_closure_plan_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'worker_dispatch_contract_criteria_plan_pending' && row.status === 'next'), 'next dispatch criteria blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'all_runtime_execution_gaps_still_open'), 'all gaps still open blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (key === 'runtimeExecutionGapClosurePlanAcceptedForWorkerDispatchCriteriaPlanning' || key === 'futureWorkerDispatchContractCriteriaPlanMayProceed') {
    assert(value === true, `${key} must be true`)
  } else if (key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ao-worker-dispatch-contract-approval-criteria-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not approve the contract'), 'next prompt must block contract approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-execution-gap-closure-plan-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-plan-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_execution_gap_closure_plan_review_diagnostics_passed',
  decision,
  sourceHead,
  pr986Verified: true,
  runtimeExecutionGapClosurePlanAcceptedForWorkerDispatchCriteriaPlanning: true,
  trackedGapCountAccepted: 8,
  closedGapCountAccepted: 0,
  futureWorkerDispatchContractCriteriaPlanMayProceed: true,
  runtimeExecutionApprovedToday: false,
  workerDispatchApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AO: worker dispatch contract approval criteria plan, no execution'
}, null, 2))
