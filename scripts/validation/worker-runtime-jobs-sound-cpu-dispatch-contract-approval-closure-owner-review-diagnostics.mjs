import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_owner_review_passed_with_warnings_ready_for_dispatch_contract_signoff_evidence_plan'
const closurePlanDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_plan_completed_with_warnings_ready_for_dispatch_contract_approval_closure_owner_review'
const schemaOwnerDecision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_owner_review_passed_with_warnings_ready_for_dispatch_contract_approval_closure_plan'
const sourceHead = '3c98bd7b0f203bb32cad5174c681a82552b2b194'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-owner-signoff-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-evidence-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1005.status === 'merged', 'PR #1005 status mismatch')
assert(review.sourceVerification.pr1005.mergeCommit === sourceHead, 'PR #1005 merge commit mismatch')
assert(review.sourceVerification.pr1005.decision === closurePlanDecision, 'PR #1005 decision mismatch')
assert(review.sourceVerification.pr999.decision === schemaOwnerDecision, 'PR #999 decision mismatch')
assert(review.ownerReviewResult.approvalClosurePlanAcceptedForSignoffEvidencePlanning === true, 'closure acceptance missing')
assert(review.ownerReviewResult.futureDispatchContractSignoffEvidencePlanMayProceed === true, 'signoff evidence plan readiness missing')
assert(review.ownerReviewResult.requiredOwnerSignoffCountAccepted === 7, 'owner signoff count mismatch')
assert(review.ownerReviewResult.evidenceRequirementCountAccepted === 6, 'evidence requirement count mismatch')
assert(review.ownerReviewResult.closureOrderStepCountAccepted === 5, 'closure order count mismatch')
assert(review.ownerReviewResult.remainingBlockerCountAccepted === 6, 'remaining blocker count mismatch')
assert(review.ownerReviewResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(review.ownerReviewResult)) {
  if (
    key === 'approvalClosurePlanAcceptedForSignoffEvidencePlanning' ||
    key === 'futureDispatchContractSignoffEvidencePlanMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'requiredOwnerSignoffCountAccepted') {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'evidenceRequirementCountAccepted' || key === 'remainingBlockerCountAccepted') {
    assert(value === 6, `${key} must be 6`)
  } else if (key === 'closureOrderStepCountAccepted') {
    assert(value === 5, `${key} must be 5`)
  } else if (key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const closurePlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-plan.md')
assert(closurePlan.decision === closurePlanDecision, 'closure plan source decision mismatch')
assert(closurePlan.approvalClosurePlanResult.dispatchContractApprovedToday === false, 'closure plan source must not approve dispatch')
assert(closurePlan.approvalClosurePlanResult.workerExecutionApprovedToday === false, 'closure plan source must not approve worker execution')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-acceptance-register.md']
assert(acceptance.acceptedClosureEvidence.closurePlanDecisionAccepted === true, 'closure plan acceptance missing')
assert(acceptance.acceptedClosureEvidence.acceptedForSignoffEvidencePlanningOnly === true, 'signoff evidence planning-only flag missing')
assert(acceptance.acceptedClosureEvidence.acceptedForDispatchExecutionToday === false, 'dispatch execution must remain false')
assert(acceptance.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')

const signoff = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-owner-signoff-owner-register.md']
assert(signoff.acceptedOwnerSignoffAreas.length === 7, 'accepted owner signoff count mismatch')
for (const owner of [
  'WORKER_RUNTIME_JOBS',
  'SOUND_RUNTIME_MEDIA',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'BILLING_STRIPE_CREDITS',
  'COMPLIANCE_SECURITY',
  'PRODUCT_BETA_READINESS',
]) {
  assert(signoff.acceptedOwnerSignoffAreas.includes(owner), `${owner} owner signoff area missing`)
}
assert(signoff.signoffAreaAcceptance.allRequiredOwnerSignoffsCompleteToday === false, 'owner signoffs must not be complete')
assert(signoff.signoffAreaAcceptance.dispatchContractApprovedToday === false, 'dispatch must not be approved')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-evidence-owner-register.md']
assert(evidence.acceptedEvidenceRequirements.length === 6, 'accepted evidence requirement count mismatch')
assert(evidence.evidenceOwnerAcceptance.evidenceRequirementsAcceptedForSignoffEvidencePlanning === true, 'evidence planning acceptance missing')
assert(evidence.evidenceOwnerAcceptance.validationHandoffAcceptedWithUnhydratedReadinessWarning === true, 'validation warning handoff missing')
assert(
  evidence.evidenceOwnerAcceptance.packageLockHashPreserved ===
    'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3',
  'package-lock hash mismatch'
)
assert(evidence.evidenceOwnerAcceptance.evidenceCompleteForExecutionApprovalToday === false, 'execution evidence must remain incomplete')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-readiness-register.md']
for (const [key, value] of Object.entries(readiness.futureSignoffEvidencePlanReadiness)) {
  if (key.startsWith('mayPlan')) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(
  readiness.signoffEvidencePlanMustPreserve.some((item) => item.includes('does not authorize dispatch')),
  'dispatch authorization preservation missing'
)

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-blocker-follow-up-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'dispatch_contract_approval_closure_owner_review_pending'),
  'resolved owner review blocker missing'
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'dispatch_contract_signoff_evidence_plan_pending' && row.status === 'next'),
  'next signoff evidence blocker missing'
)
assert(blockers.closedGapCountToday === 0, 'owner blocker closed gap mismatch')
assert(blockers.dispatchContractApprovedToday === false, 'owner blocker register must not approve dispatch')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (
    key === 'approvalClosurePlanAcceptedForSignoffEvidencePlanning' ||
    key === 'futureDispatchContractSignoffEvidencePlanMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'requiredOwnerSignoffCountAccepted') {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'evidenceRequirementCountAccepted' || key === 'remainingBlockerCountAccepted') {
    assert(value === 6, `${key} must be 6`)
  } else if (key === 'closureOrderStepCountAccepted') {
    assert(value === 5, `${key} must be 5`)
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('closed gap count `0`'), 'next prompt must preserve closed gap zero')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dispatch-contract-approval-closure-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr1005Verified: true,
  approvalClosurePlanAcceptedForSignoffEvidencePlanning: true,
  futureDispatchContractSignoffEvidencePlanMayProceed: true,
  requiredOwnerSignoffCountAccepted: 7,
  evidenceRequirementCountAccepted: 6,
  closureOrderStepCountAccepted: 5,
  remainingBlockerCountAccepted: 6,
  closedGapCountToday: 0,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DISPATCH-CONTRACT-SIGNOFF-EVIDENCE-PLAN: plan dispatch contract signoff evidence, no execution'
}, null, 2))
