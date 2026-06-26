import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_owner_review_passed_with_warnings_ready_for_dispatch_contract_approval_closure_plan'
const schemaPlanDecision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review'
const criteriaOwnerReviewDecision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_criteria_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_schema_plan'
const sourceHead = '0180b8d3a31b83318c7407c70692cfbbb7c6eba6'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-field-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-payload-guardrail-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr995.status === 'merged', 'PR #995 status mismatch')
assert(review.sourceVerification.pr995.mergeCommit === sourceHead, 'PR #995 merge commit mismatch')
assert(review.sourceVerification.pr995.decision === schemaPlanDecision, 'PR #995 decision mismatch')
assert(review.sourceVerification.pr994.decision === criteriaOwnerReviewDecision, 'PR #994 decision mismatch')
assert(
  review.ownerReviewResult.workerDispatchContractSchemaAcceptedForApprovalClosurePlanning === true,
  'schema acceptance missing'
)
assert(review.ownerReviewResult.futureDispatchContractApprovalClosurePlanMayProceed === true, 'closure planning flag missing')
assert(review.ownerReviewResult.schemaSectionCountAccepted === 6, 'schema section count mismatch')
assert(review.ownerReviewResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(review.ownerReviewResult)) {
  if (
    key === 'workerDispatchContractSchemaAcceptedForApprovalClosurePlanning' ||
    key === 'futureDispatchContractApprovalClosurePlanMayProceed' ||
    key === 'schemaSectionCountAccepted' ||
    key === 'closedGapCountToday'
  ) continue
  assert(value === false, `${key} must be false`)
}

const schemaPlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-plan.md')
assert(schemaPlan.decision === schemaPlanDecision, 'schema plan decision mismatch')
assert(schemaPlan.schemaPlanResult.schemaSectionCount === 6, 'schema plan section count mismatch')
assert(schemaPlan.schemaPlanResult.dispatchContractApprovedToday === false, 'schema plan dispatch approval must remain false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-acceptance-register.md']
assert(acceptance.acceptedSchemaEvidence.schemaPlanDecisionAccepted === true, 'schema plan acceptance missing')
assert(acceptance.acceptedSchemaEvidence.schemaSectionCount === 6, 'accepted schema section count mismatch')
assert(acceptance.acceptedSchemaEvidence.acceptedForApprovalClosurePlanningOnly === true, 'approval closure planning-only flag missing')
assert(acceptance.acceptedSchemaEvidence.acceptedForExecutionToday === false, 'execution must remain false')
assert(acceptance.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')

const fields = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-field-owner-register.md']
assert(fields.acceptedFieldGroups.length === 12, 'accepted field group count mismatch')
assert(fields.acceptedFieldGroups.includes('Supabase service-role boundary placeholders'), 'Supabase boundary field group missing')
assert(fields.schemaApprovedForExecutionToday === false, 'schema execution approval must remain false')
assert(fields.workerDispatchApprovedToday === false, 'worker dispatch must remain false')

const guardrail = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-payload-guardrail-owner-register.md']
for (const guard of ['no secrets or API keys', 'no Supabase service-role keys', 'no signed URLs as source of truth', 'no SQL text']) {
  assert(guardrail.acceptedGuardrailsForPlanning.includes(guard), `${guard} missing`)
}
for (const [key, value] of Object.entries(guardrail.guardrailApprovalsToday)) {
  assert(value === false, `${key} must be false`)
}

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-readiness-register.md']
for (const [key, value] of Object.entries(readiness.futureApprovalClosurePlanningReadiness)) {
  if (key.startsWith('mayPlan')) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(
  readiness.closurePlanMustPreserve.some((item) => item.includes('runtime execution remains blocked')),
  'runtime block preservation missing'
)

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'worker_dispatch_contract_schema_owner_review_pending'), 'resolved schema owner blocker missing')
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'dispatch_contract_approval_closure_plan_pending' && row.status === 'next'),
  'next closure plan blocker missing'
)
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_owner_signoffs_missing'), 'runtime signoff blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (
    key === 'workerDispatchContractSchemaAcceptedForApprovalClosurePlanning' ||
    key === 'futureDispatchContractApprovalClosurePlanMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'schemaSectionCountAccepted') {
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require schema owner review decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-worker-dispatch-contract-schema-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr995Verified: true,
  workerDispatchContractSchemaAcceptedForApprovalClosurePlanning: true,
  futureDispatchContractApprovalClosurePlanMayProceed: true,
  schemaSectionCountAccepted: 6,
  closedGapCountToday: 0,
  schemaApprovedForExecutionToday: false,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DISPATCH-CONTRACT-APPROVAL-CLOSURE-PLAN: plan dispatch contract approval closure, no execution'
}, null, 2))
