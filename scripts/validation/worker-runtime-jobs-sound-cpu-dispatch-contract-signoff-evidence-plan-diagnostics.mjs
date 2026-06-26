import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_plan_completed_with_warnings_ready_for_signoff_evidence_owner_review'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_owner_review_passed_with_warnings_ready_for_dispatch_contract_signoff_evidence_plan'
const closurePlanDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_plan_completed_with_warnings_ready_for_dispatch_contract_approval_closure_owner_review'
const sourceHead = '18f1ea2dadc8ac67049e850e86f3f3bbb9ee1604'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-per-owner-evidence-row-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-order-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-execution-blocker-carry-forward-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-validation-handoff-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-claim-policy.md',
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

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr1007.status === 'merged', 'PR #1007 status mismatch')
assert(plan.sourceVerification.pr1007.mergeCommit === sourceHead, 'PR #1007 merge commit mismatch')
assert(plan.sourceVerification.pr1007.decision === ownerReviewDecision, 'PR #1007 decision mismatch')
assert(plan.sourceVerification.pr1005.decision === closurePlanDecision, 'PR #1005 decision mismatch')
assert(plan.signoffEvidencePlanResult.requiredOwnerSignoffCount === 7, 'required owner signoff count mismatch')
assert(plan.signoffEvidencePlanResult.completedOwnerSignoffCountToday === 0, 'completed signoff count must be zero')
assert(plan.signoffEvidencePlanResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(plan.signoffEvidencePlanResult)) {
  if (
    key === 'perOwnerEvidenceRowsPlanned' ||
    key === 'evidenceOrderingPlanned' ||
    key === 'executionBlockersCarriedForward' ||
    key === 'validationHandoffRegisterCreated' ||
    key === 'futureSignoffEvidenceOwnerReviewMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'requiredOwnerSignoffCount') {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'completedOwnerSignoffCountToday' || key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review.md')
assert(ownerReview.decision === ownerReviewDecision, 'owner-review source decision mismatch')
assert(ownerReview.ownerReviewResult.dispatchContractApprovedToday === false, 'owner-review source must not approve dispatch')
assert(ownerReview.ownerReviewResult.workerExecutionApprovedToday === false, 'owner-review source must not approve worker execution')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-per-owner-evidence-row-register.md']
assert(rows.plannedEvidenceRows.length === 7, 'planned evidence row count mismatch')
assert(rows.plannedEvidenceRowCount === 7, 'planned evidence row count field mismatch')
assert(rows.completedEvidenceRowsToday === 0, 'completed evidence rows must be zero')
for (const owner of [
  'WORKER_RUNTIME_JOBS',
  'SOUND_RUNTIME_MEDIA',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'BILLING_STRIPE_CREDITS',
  'COMPLIANCE_SECURITY',
  'PRODUCT_BETA_READINESS',
]) {
  assert(rows.plannedEvidenceRows.some((row) => row.ownerArea === owner), `${owner} evidence row missing`)
}
assert(rows.dispatchContractApprovedToday === false, 'per-owner rows must not approve dispatch')

const order = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-order-register.md']
assert(order.evidenceOrder.length === 10, 'evidence order count mismatch')
assert(order.evidenceOrderPlannedToday === true, 'evidence order planning flag missing')
assert(order.allEvidenceRowsCompleteToday === false, 'evidence rows must not be complete')
assert(order.dispatchContractExecutionApprovalReachedToday === false, 'execution approval must not be reached')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-execution-blocker-carry-forward-register.md']
for (const blocker of [
  'dispatch_contract_signoff_evidence_owner_review_pending',
  'all_required_owner_signoffs_incomplete',
  'worker_dispatch_execution_owner_signoffs_missing',
  'supabase_service_role_storage_sql_boundary_unapproved',
  'media_runtime_and_artifact_delivery_unapproved',
  'provider_model_and_model_weight_execution_unapproved',
  'billing_beta_production_unlock_unapproved',
]) {
  assert(blockers.carriedForwardBlockers.includes(blocker), `${blocker} carry-forward blocker missing`)
}
assert(blockers.executionBlockersCarriedForward === true, 'execution blocker carry-forward flag missing')
assert(blockers.closedGapCountToday === 0, 'carry-forward closed gap count mismatch')
assert(blockers.dispatchContractApprovedToday === false, 'carry-forward register must not approve dispatch')

const handoff = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-validation-handoff-register.md']
assert(handoff.validationHandoff.sourceDiagnosticsRequired.length === 4, 'source diagnostics count mismatch')
assert(handoff.validationHandoff.readinessSummaryWarningAccepted.includes('tsx command not found'), 'readiness warning missing')
assert(handoff.validationHandoff.dependencyHydrationStarted === false, 'dependency hydration must be false')
assert(handoff.validationHandoffRegisterCreatedToday === true, 'validation handoff flag missing')
assert(handoff.runtimeReadinessClaimedToday === false, 'runtime readiness must not be claimed')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (key === 'signoffEvidencePlanCreated' || key === 'futureSignoffEvidenceOwnerReviewMayProceed') {
    assert(value === true, `${key} must be true`)
  } else if (key === 'requiredOwnerSignoffCount') {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'completedOwnerSignoffCountToday' || key === 'closedGapCountToday') {
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require signoff plan decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('completed owner signoffs `0`'), 'next prompt must preserve completed signoffs zero')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dispatch-contract-signoff-evidence-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr1007Verified: true,
  signoffEvidencePlanCreated: true,
  futureSignoffEvidenceOwnerReviewMayProceed: true,
  requiredOwnerSignoffCount: 7,
  completedOwnerSignoffCountToday: 0,
  closedGapCountToday: 0,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DISPATCH-CONTRACT-SIGNOFF-EVIDENCE-OWNER-REVIEW: review dispatch contract signoff evidence plan, no execution'
}, null, 2))
