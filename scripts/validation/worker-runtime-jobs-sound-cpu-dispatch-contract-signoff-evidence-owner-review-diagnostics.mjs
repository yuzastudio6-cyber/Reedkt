import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_owner_review_passed_with_warnings_ready_for_signoff_collection_closure_plan'
const signoffPlanDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_plan_completed_with_warnings_ready_for_signoff_evidence_owner_review'
const closureOwnerDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_owner_review_passed_with_warnings_ready_for_dispatch_contract_signoff_evidence_plan'
const sourceHead = 'fa896bb8efb184c99651b4d6d512c680f18f9b7e'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-row-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-collection-closure-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1011.status === 'merged', 'PR #1011 status mismatch')
assert(review.sourceVerification.pr1011.mergeCommit === sourceHead, 'PR #1011 merge commit mismatch')
assert(review.sourceVerification.pr1011.decision === signoffPlanDecision, 'PR #1011 decision mismatch')
assert(review.sourceVerification.pr1007.decision === closureOwnerDecision, 'PR #1007 decision mismatch')
assert(review.ownerReviewResult.signoffEvidencePlanAcceptedForCollectionClosurePlanning === true, 'signoff evidence acceptance missing')
assert(review.ownerReviewResult.futureSignoffCollectionClosurePlanMayProceed === true, 'collection closure readiness missing')
assert(review.ownerReviewResult.perOwnerEvidenceRowCountAccepted === 7, 'owner row count mismatch')
assert(review.ownerReviewResult.evidenceOrderStepCountAccepted === 10, 'evidence order count mismatch')
assert(review.ownerReviewResult.carriedForwardBlockerCountAccepted === 7, 'carried blocker count mismatch')
assert(review.ownerReviewResult.completedOwnerSignoffCountToday === 0, 'completed signoffs must be zero')
assert(review.ownerReviewResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(review.ownerReviewResult)) {
  if (
    key === 'signoffEvidencePlanAcceptedForCollectionClosurePlanning' ||
    key === 'futureSignoffCollectionClosurePlanMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'perOwnerEvidenceRowCountAccepted' || key === 'carriedForwardBlockerCountAccepted') {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'evidenceOrderStepCountAccepted') {
    assert(value === 10, `${key} must be 10`)
  } else if (key === 'completedOwnerSignoffCountToday' || key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const signoffPlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-plan.md')
assert(signoffPlan.decision === signoffPlanDecision, 'signoff plan source decision mismatch')
assert(signoffPlan.signoffEvidencePlanResult.completedOwnerSignoffCountToday === 0, 'source completed signoffs must be zero')
assert(signoffPlan.signoffEvidencePlanResult.dispatchContractApprovedToday === false, 'source must not approve dispatch')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-acceptance-register.md']
assert(acceptance.acceptedSignoffEvidencePlan.sourceDecisionAccepted === true, 'source decision acceptance missing')
assert(acceptance.acceptedSignoffEvidencePlan.acceptedForSignoffCollectionClosurePlanningOnly === true, 'planning-only flag missing')
assert(acceptance.acceptedSignoffEvidencePlan.acceptedForDispatchExecutionToday === false, 'dispatch execution must remain false')
assert(acceptance.completedOwnerSignoffCountToday === 0, 'acceptance completed signoffs must be zero')
assert(acceptance.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-row-review-register.md']
assert(rows.acceptedOwnerRows.length === 7, 'accepted owner row count mismatch')
for (const owner of [
  'WORKER_RUNTIME_JOBS',
  'SOUND_RUNTIME_MEDIA',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'BILLING_STRIPE_CREDITS',
  'COMPLIANCE_SECURITY',
  'PRODUCT_BETA_READINESS',
]) {
  assert(rows.acceptedOwnerRows.includes(owner), `${owner} row missing`)
}
assert(rows.ownerRowReviewResult.completedOwnerRowsToday === 0, 'completed owner rows must be zero')
assert(rows.ownerRowReviewResult.allOwnerRowsCompleteToday === false, 'owner rows must not be complete')
assert(rows.ownerRowReviewResult.dispatchContractApprovedToday === false, 'owner rows must not approve dispatch')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-blocker-follow-up-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'dispatch_contract_signoff_evidence_owner_review_pending'),
  'resolved signoff owner blocker missing'
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'dispatch_signoff_collection_closure_plan_pending' && row.status === 'next'),
  'next collection closure blocker missing'
)
assert(blockers.completedOwnerSignoffCountToday === 0, 'blocker completed signoff count mismatch')
assert(blockers.closedGapCountToday === 0, 'blocker closed gap count mismatch')
assert(blockers.dispatchContractApprovedToday === false, 'blocker register must not approve dispatch')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-collection-closure-readiness-register.md']
for (const [key, value] of Object.entries(readiness.futureCollectionClosureReadiness)) {
  if (key.startsWith('mayPlan')) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'completedOwnerSignoffCountToday' || key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(
  readiness.collectionClosurePlanMustPreserve.some((item) => item.includes('completed owner signoffs remain zero')),
  'completed signoff preservation missing'
)

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (
    key === 'signoffEvidencePlanAcceptedForCollectionClosurePlanning' ||
    key === 'futureSignoffCollectionClosurePlanMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'perOwnerEvidenceRowCountAccepted' || key === 'carriedForwardBlockerCountAccepted') {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'evidenceOrderStepCountAccepted') {
    assert(value === 10, `${key} must be 10`)
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('completed owner signoffs `0`'), 'next prompt must preserve completed signoffs zero')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dispatch-contract-signoff-evidence-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr1011Verified: true,
  signoffEvidencePlanAcceptedForCollectionClosurePlanning: true,
  futureSignoffCollectionClosurePlanMayProceed: true,
  perOwnerEvidenceRowCountAccepted: 7,
  evidenceOrderStepCountAccepted: 10,
  carriedForwardBlockerCountAccepted: 7,
  completedOwnerSignoffCountToday: 0,
  closedGapCountToday: 0,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DISPATCH-SIGNOFF-COLLECTION-CLOSURE-PLAN: plan dispatch signoff collection closure, no execution'
}, null, 2))
