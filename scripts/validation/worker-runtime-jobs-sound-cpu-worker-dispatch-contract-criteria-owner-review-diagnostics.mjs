import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_criteria_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_schema_plan'
const gate2aoDecision =
  'sound_runtime_media_gate_2ao_worker_dispatch_contract_approval_criteria_plan_completed_with_warnings_ready_for_worker_dispatch_contract_criteria_owner_review'
const gapClosureReviewDecision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_gap_closure_plan_review_passed_with_warnings_ready_for_worker_dispatch_contract_criteria_plan'
const sourceHead = 'c0591f800e90e0316f4857d2147f0e23ee015e5c'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-claim-lease-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-retry-timeout-cancellation-observability-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr991.status === 'merged', 'PR #991 status mismatch')
assert(review.sourceVerification.pr991.mergeCommit === sourceHead, 'PR #991 merge commit mismatch')
assert(review.sourceVerification.pr991.decision === gate2aoDecision, 'PR #991 decision mismatch')
assert(review.sourceVerification.pr988.decision === gapClosureReviewDecision, 'PR #988 decision mismatch')
assert(review.ownerReviewResult.workerDispatchContractCriteriaAcceptedForSchemaPlanning === true, 'criteria acceptance missing')
assert(review.ownerReviewResult.futureWorkerDispatchContractSchemaPlanMayProceed === true, 'schema planning flag missing')
assert(review.ownerReviewResult.dispatchCriteriaCountAccepted === 8, 'dispatch criteria count mismatch')
assert(
  review.ownerReviewResult.retryTimeoutCancellationObservabilityCriteriaCountAccepted === 6,
  'retry/timeout criteria count mismatch'
)
assert(review.ownerReviewResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(review.ownerReviewResult)) {
  if (
    key === 'workerDispatchContractCriteriaAcceptedForSchemaPlanning' ||
    key === 'futureWorkerDispatchContractSchemaPlanMayProceed' ||
    key === 'dispatchCriteriaCountAccepted' ||
    key === 'retryTimeoutCancellationObservabilityCriteriaCountAccepted' ||
    key === 'closedGapCountToday'
  ) continue
  assert(value === false, `${key} must be false`)
}

const gate2ao = parseJsonBlock('docs/sound-runtime-media-gate-2ao-worker-dispatch-contract-approval-criteria-plan.md')
assert(gate2ao.decision === gate2aoDecision, 'Gate 2AO decision mismatch')
assert(gate2ao.criteriaPlanResult.dispatchCriteriaCount === 8, 'Gate 2AO dispatch count mismatch')
assert(gate2ao.criteriaPlanResult.closedGapCountToday === 0, 'Gate 2AO closed gap count must be zero')
assert(gate2ao.criteriaPlanResult.dispatchContractApprovedToday === false, 'Gate 2AO dispatch contract must remain false')

const gate2aoDispatch = parseJsonBlock('docs/sound-runtime-media-gate-2ao-dispatch-claim-lease-criteria-register.md')
assert(gate2aoDispatch.dispatchClaimLeaseCriteria.length === 8, 'Gate 2AO dispatch criteria count mismatch')
assert(gate2aoDispatch.dispatchApprovedToday === false, 'Gate 2AO dispatch must remain false')
assert(gate2aoDispatch.leaseClaimApprovedToday === false, 'Gate 2AO lease claim must remain false')

const gate2aoRetry = parseJsonBlock(
  'docs/sound-runtime-media-gate-2ao-retry-timeout-cancellation-observability-criteria-register.md'
)
assert(gate2aoRetry.retryTimeoutCancellationObservabilityCriteria.length === 6, 'Gate 2AO retry criteria count mismatch')
assert(gate2aoRetry.workerExecutionApprovedToday === false, 'Gate 2AO worker execution must remain false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-acceptance-register.md']
assert(acceptance.acceptedCriteriaEvidence.gate2aoDecisionAccepted === true, 'Gate 2AO acceptance missing')
assert(acceptance.acceptedCriteriaEvidence.dispatchCriteriaCount === 8, 'accepted dispatch criteria count mismatch')
assert(
  acceptance.acceptedCriteriaEvidence.retryTimeoutCancellationObservabilityCriteriaCount === 6,
  'accepted retry criteria count mismatch'
)
assert(acceptance.acceptedCriteriaEvidence.acceptedForSchemaPlanningOnly === true, 'planning-only acceptance missing')
assert(acceptance.acceptedCriteriaEvidence.acceptedForWorkerDispatchToday === false, 'dispatch must remain false')
assert(acceptance.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')

const dispatch = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-claim-lease-owner-register.md']
assert(dispatch.dispatchClaimLeaseOwnerReview.length === 8, 'dispatch owner review count mismatch')
for (const row of dispatch.dispatchClaimLeaseOwnerReview) {
  assert(row.ownerDisposition === 'accepted_for_future_schema_planning', `${row.criteriaId} disposition mismatch`)
}
assert(dispatch.dispatchContractApprovedToday === false, 'dispatch contract must remain false')
assert(dispatch.claimLeaseApprovedToday === false, 'claim/lease must remain false')
assert(dispatch.workerDispatchApprovedToday === false, 'worker dispatch must remain false')

const retry = parsed['docs/worker-runtime-jobs-sound-cpu-retry-timeout-cancellation-observability-owner-register.md']
assert(retry.retryTimeoutCancellationObservabilityOwnerReview.length === 6, 'retry owner review count mismatch')
for (const row of retry.retryTimeoutCancellationObservabilityOwnerReview) {
  assert(row.ownerDisposition === 'accepted_for_future_schema_planning', `${row.criteriaId} disposition mismatch`)
}
assert(retry.retryPolicyApprovedToday === false, 'retry policy must remain false')
assert(retry.workerExecutionApprovedToday === false, 'worker execution must remain false')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-readiness-register.md']
for (const [key, value] of Object.entries(readiness.futureSchemaPlanningReadiness)) {
  if (key.startsWith('mayPlan')) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(
  readiness.requiredFutureSchemaPlanGuardrails.some((item) => item.includes('worker dispatch, claim, lease, execution')),
  'schema guardrail must keep worker execution blocked'
)

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'worker_dispatch_contract_criteria_owner_review_pending'), 'resolved owner-review blocker missing')
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'worker_dispatch_contract_schema_plan_pending' && row.status === 'next'),
  'next schema plan blocker missing'
)
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'all_runtime_execution_gaps_still_open'), 'all gaps blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (
    key === 'workerDispatchContractCriteriaAcceptedForSchemaPlanning' ||
    key === 'futureWorkerDispatchContractSchemaPlanMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'dispatchCriteriaCountAccepted') {
    assert(value === 8, `${key} must be 8`)
  } else if (key === 'retryTimeoutCancellationObservabilityCriteriaCountAccepted') {
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner review decision')
assert(nextPrompt.includes('Do not approve the schema for execution'), 'next prompt must block execution approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-worker-dispatch-contract-criteria-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_criteria_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr991Verified: true,
  workerDispatchContractCriteriaAcceptedForSchemaPlanning: true,
  futureWorkerDispatchContractSchemaPlanMayProceed: true,
  dispatchCriteriaCountAccepted: 8,
  retryTimeoutCancellationObservabilityCriteriaCountAccepted: 6,
  closedGapCountToday: 0,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-WORKER-DISPATCH-CONTRACT-SCHEMA-PLAN: plan worker dispatch contract schema, no execution'
}, null, 2))
