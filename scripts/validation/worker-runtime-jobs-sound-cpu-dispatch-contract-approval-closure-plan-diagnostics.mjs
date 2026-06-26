import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_plan_completed_with_warnings_ready_for_dispatch_contract_approval_closure_owner_review'
const schemaOwnerDecision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_owner_review_passed_with_warnings_ready_for_dispatch_contract_approval_closure_plan'
const schemaPlanDecision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review'
const criteriaOwnerDecision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_criteria_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_schema_plan'
const sourceHead = '64537f577571eeb88668260e062c9693d437ad6c'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-owner-signoff-checklist.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-evidence-requirements-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-closure-order-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-remaining-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-claim-policy.md',
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

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr999.status === 'merged', 'PR #999 status mismatch')
assert(plan.sourceVerification.pr999.mergeCommit === sourceHead, 'PR #999 merge commit mismatch')
assert(plan.sourceVerification.pr999.decision === schemaOwnerDecision, 'PR #999 decision mismatch')
assert(plan.sourceVerification.pr995.decision === schemaPlanDecision, 'PR #995 decision mismatch')
assert(plan.sourceVerification.pr994.decision === criteriaOwnerDecision, 'PR #994 decision mismatch')
assert(plan.approvalClosurePlanResult.sourceSchemaOwnerReviewAccepted === true, 'schema owner review acceptance missing')
assert(plan.approvalClosurePlanResult.futureDispatchContractApprovalClosureOwnerReviewMayProceed === true, 'owner review readiness missing')
assert(plan.approvalClosurePlanResult.closedGapCountToday === 0, 'closed gap count must remain zero')
for (const [key, value] of Object.entries(plan.approvalClosurePlanResult)) {
  if (
    key === 'sourceSchemaOwnerReviewAccepted' ||
    key === 'requiredOwnerSignoffChecklistCreated' ||
    key === 'evidenceRequirementsRegisterCreated' ||
    key === 'closureOrderRegisterCreated' ||
    key === 'remainingBlockerRegisterCreated' ||
    key === 'futureDispatchContractApprovalClosureOwnerReviewMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(plan.planningSurface.schemaSectionCountAccepted === 6, 'schema section count mismatch')
assert(plan.planningSurface.approvedForClosurePlanningOnly === true, 'planning-only flag missing')
assert(plan.planningSurface.jobTypes.length === 4, 'accepted job type count mismatch')

const schemaOwner = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md')
assert(schemaOwner.decision === schemaOwnerDecision, 'schema owner review source decision mismatch')
assert(schemaOwner.ownerReviewResult.closedGapCountToday === 0, 'schema owner closed gap source mismatch')
assert(schemaOwner.ownerReviewResult.dispatchContractApprovedToday === false, 'schema owner source must not approve dispatch')

const signoffs = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-owner-signoff-checklist.md']
assert(signoffs.requiredOwnerSignoffs.length >= 7, 'owner signoff count too small')
for (const owner of [
  'WORKER_RUNTIME_JOBS',
  'SOUND_RUNTIME_MEDIA',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'BILLING_STRIPE_CREDITS',
  'COMPLIANCE_SECURITY',
  'PRODUCT_BETA_READINESS',
]) {
  assert(signoffs.requiredOwnerSignoffs.some((row) => row.ownerArea === owner), `${owner} signoff missing`)
}
assert(signoffs.signoffChecklistCreatedToday === true, 'signoff checklist flag missing')
assert(signoffs.allRequiredOwnerSignoffsCompleteToday === false, 'owner signoffs must not be complete')
assert(signoffs.dispatchContractApprovedToday === false, 'dispatch contract must not be approved')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-evidence-requirements-register.md']
for (const id of [
  'schema_owner_review_decision',
  'schema_section_registers',
  'owner_signoff_checklist',
  'closure_order_register',
  'payload_guardrail_owner_evidence',
  'validation_handoff',
]) {
  assert(evidence.requiredEvidenceBeforeAnyDispatchApproval.some((row) => row.evidenceId === id), `${id} evidence missing`)
}
assert(evidence.evidenceRequirementsCreatedToday === true, 'evidence requirements flag missing')
assert(evidence.evidenceCompleteForExecutionApprovalToday === false, 'execution evidence must not be complete')

const order = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-closure-order-register.md']
assert(order.closureOrder.length === 5, 'closure order count mismatch')
assert(order.closureOrder[0].closureItem === 'dispatch_contract_approval_closure_owner_review', 'first closure step mismatch')
assert(order.closureOrder.at(-1).closureItem === 'dispatch_contract_execution_approval_gate', 'last closure step mismatch')
assert(order.closureOrder.at(-1).status === 'blocked_not_in_this_packet', 'execution approval gate must remain blocked')
assert(order.dispatchContractExecutionApprovalReachedToday === false, 'execution approval must not be reached')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-remaining-blocker-register.md']
assert(
  blockers.resolvedBlockersToday.some((row) => row.blockerId === 'schema_owner_review_pending'),
  'schema owner resolved blocker missing'
)
for (const id of [
  'dispatch_contract_approval_closure_owner_review_pending',
  'worker_dispatch_execution_owner_signoffs_missing',
  'supabase_service_role_storage_sql_boundary_unapproved',
  'media_runtime_and_artifact_delivery_unapproved',
  'provider_model_and_model_weight_execution_unapproved',
  'billing_beta_production_unlock_unapproved',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === id), `${id} blocker missing`)
}
assert(blockers.closedGapCountToday === 0, 'blocker closed gap count mismatch')
assert(blockers.dispatchContractApprovedToday === false, 'blocker register must not approve dispatch')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (
    key === 'dispatchContractApprovalClosurePlanCreated' ||
    key === 'futureDispatchContractApprovalClosureOwnerReviewMayProceed' ||
    key === 'requiredOwnerSignoffChecklistCreated' ||
    key === 'evidenceRequirementsRegisterCreated' ||
    key === 'closureOrderRegisterCreated' ||
    key === 'remainingBlockerRegisterCreated'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'dispatch_contract_approved',
  'worker_dispatch_enabled',
  'claim_lease_enabled',
]) {
  assert(policy.forbiddenClaims.includes(claim), `${claim} forbidden claim missing`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require closure decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dispatch-contract-approval-closure-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr999Verified: true,
  closurePlanCreated: true,
  futureDispatchContractApprovalClosureOwnerReviewMayProceed: true,
  closedGapCountToday: 0,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  claimLeaseApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DISPATCH-CONTRACT-APPROVAL-CLOSURE-OWNER-REVIEW: review dispatch contract approval closure plan, no execution'
}, null, 2))
