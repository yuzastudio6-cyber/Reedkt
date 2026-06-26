import fs from 'node:fs'

const decision =
  'sound_runtime_media_gate_2ao_worker_dispatch_contract_approval_criteria_plan_completed_with_warnings_ready_for_worker_dispatch_contract_criteria_owner_review'
const gapClosureReviewDecision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_gap_closure_plan_review_passed_with_warnings_ready_for_worker_dispatch_contract_criteria_plan'
const gate2anDecision =
  'sound_runtime_media_gate_2an_runtime_execution_approval_readiness_gap_closure_plan_completed_with_warnings_ready_for_gap_closure_owner_review'
const sourceHead = '43b6e3a679a4f96d456d444c91386f56c5e25f63'

const docs = [
  'docs/sound-runtime-media-gate-2ao-worker-dispatch-contract-approval-criteria-plan.md',
  'docs/sound-runtime-media-gate-2ao-dispatch-claim-lease-criteria-register.md',
  'docs/sound-runtime-media-gate-2ao-retry-timeout-cancellation-observability-criteria-register.md',
  'docs/sound-runtime-media-gate-2ao-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2ao-runtime-claim-policy.md',
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
  assert(json.decision === decision, `${path} decision mismatch`)
}

const plan = parsed['docs/sound-runtime-media-gate-2ao-worker-dispatch-contract-approval-criteria-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr988.status === 'merged', 'PR #988 status mismatch')
assert(plan.sourceVerification.pr988.mergeCommit === sourceHead, 'PR #988 merge commit mismatch')
assert(plan.sourceVerification.pr988.decision === gapClosureReviewDecision, 'PR #988 decision mismatch')
assert(plan.sourceVerification.pr986.decision === gate2anDecision, 'PR #986 decision mismatch')
assert(plan.criteriaPlanResult.workerDispatchContractApprovalCriteriaPlanCreated === true, 'criteria plan missing')
assert(plan.criteriaPlanResult.futureWorkerDispatchContractCriteriaOwnerReviewMayProceed === true, 'future owner review flag missing')
assert(plan.criteriaPlanResult.dispatchCriteriaCount === 8, 'dispatch criteria count mismatch')
assert(plan.criteriaPlanResult.ownerGapCountCarriedForward === 8, 'owner gap count mismatch')
assert(plan.criteriaPlanResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(plan.criteriaPlanResult)) {
  if (
    key === 'workerDispatchContractApprovalCriteriaPlanCreated' ||
    key === 'futureWorkerDispatchContractCriteriaOwnerReviewMayProceed' ||
    key === 'dispatchCriteriaCount' ||
    key === 'ownerGapCountCarriedForward' ||
    key === 'closedGapCountToday'
  ) continue
  assert(value === false, `${key} must be false`)
}

const gapClosureReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-plan-review.md'
)
assert(gapClosureReview.decision === gapClosureReviewDecision, 'gap closure review decision mismatch')
assert(
  gapClosureReview.ownerReviewResult.futureWorkerDispatchContractCriteriaPlanMayProceed === true,
  'gap closure review does not allow criteria planning'
)
assert(gapClosureReview.ownerReviewResult.closedGapCountAccepted === 0, 'accepted closed gap count must be zero')
assert(gapClosureReview.ownerReviewResult.runtimeExecutionApprovedToday === false, 'runtime execution must remain false')

const gate2an = parseJsonBlock('docs/sound-runtime-media-gate-2an-runtime-execution-approval-readiness-gap-closure-plan.md')
assert(gate2an.decision === gate2anDecision, 'Gate 2AN decision mismatch')
assert(gate2an.gapClosurePlanResult.trackedGapCount === 8, 'Gate 2AN tracked gap count mismatch')
assert(gate2an.gapClosurePlanResult.closedGapCountToday === 0, 'Gate 2AN closed gap count must be zero')

const dispatch = parsed['docs/sound-runtime-media-gate-2ao-dispatch-claim-lease-criteria-register.md']
assert(dispatch.dispatchClaimLeaseCriteria.length === 8, 'dispatch criteria count mismatch')
for (const row of dispatch.dispatchClaimLeaseCriteria) {
  assert(row.approvalStatusToday === 'criteria_planned_not_approved', `${row.criteriaId} must remain unapproved`)
}
assert(dispatch.criteriaApprovedToday === false, 'criteria must not be approved today')
assert(dispatch.dispatchApprovedToday === false, 'dispatch must not be approved today')
assert(dispatch.leaseClaimApprovedToday === false, 'lease/claim must not be approved today')

const retry = parsed['docs/sound-runtime-media-gate-2ao-retry-timeout-cancellation-observability-criteria-register.md']
assert(retry.retryTimeoutCancellationObservabilityCriteria.length === 6, 'retry/timeout criteria count mismatch')
for (const row of retry.retryTimeoutCancellationObservabilityCriteria) {
  assert(row.approvalStatusToday === 'criteria_planned_not_approved', `${row.criteriaId} must remain unapproved`)
}
assert(retry.retryPolicyApprovedToday === false, 'retry policy must remain false')
assert(retry.timeoutPolicyApprovedToday === false, 'timeout policy must remain false')
assert(retry.cancellationPolicyApprovedToday === false, 'cancellation policy must remain false')
assert(retry.observabilityPolicyApprovedToday === false, 'observability policy must remain false')
assert(retry.workerExecutionApprovedToday === false, 'worker execution must remain false')

const blockers = parsed['docs/sound-runtime-media-gate-2ao-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'worker_dispatch_contract_criteria_plan_pending'), 'resolved planning blocker missing')
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'worker_dispatch_contract_criteria_owner_review_pending' && row.status === 'next'),
  'next owner review blocker missing'
)
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'all_runtime_execution_gaps_still_open'), 'all gaps blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ao-runtime-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (
    key === 'workerDispatchContractApprovalCriteriaPlanCreated' ||
    key === 'futureWorkerDispatchContractCriteriaOwnerReviewMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'dispatchCriteriaCount') {
    assert(value === 8, `${key} must be 8`)
  } else if (key === 'retryTimeoutCancellationObservabilityCriteriaCount') {
    assert(value === 6, `${key} must be 6`)
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

const nextPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-owner-review.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AO decision')
assert(nextPrompt.includes('Do not approve worker dispatch'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ao:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-2ao-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ao_diagnostics_passed',
  decision,
  sourceHead,
  pr988Verified: true,
  workerDispatchContractApprovalCriteriaPlanCreated: true,
  dispatchCriteriaCount: 8,
  retryTimeoutCancellationObservabilityCriteriaCount: 6,
  closedGapCountToday: 0,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-WORKER-DISPATCH-CONTRACT-CRITERIA-OWNER-REVIEW: review worker dispatch contract approval criteria, no execution'
}, null, 2))
