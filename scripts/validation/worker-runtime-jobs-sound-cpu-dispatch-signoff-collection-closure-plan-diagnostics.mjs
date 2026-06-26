import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_plan_completed_with_warnings_ready_for_collection_closure_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_owner_review_passed_with_warnings_ready_for_signoff_collection_closure_plan'
const signoffEvidencePlanDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_plan_completed_with_warnings_ready_for_signoff_evidence_owner_review'
const sourceHead = '58be9f3423baab9a363926dfa230aafc5020a1f6'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-status-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-remaining-owner-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-execution-approval-precondition-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-blocker-carry-forward-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-claim-policy.md',
]

const ownerAreas = [
  'WORKER_RUNTIME_JOBS',
  'SOUND_RUNTIME_MEDIA',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'BILLING_STRIPE_CREDITS',
  'COMPLIANCE_SECURITY',
  'PRODUCT_BETA_READINESS',
]

const forbiddenClaims = [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'dispatch_contract_approved',
  'worker_dispatch_enabled',
  'claim_lease_enabled',
  'worker_execution_enabled',
  'runtime_readiness_passed',
  'worker_readiness_passed',
  'media_readiness_passed',
  'beta_readiness_passed',
  'production_readiness_passed',
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

function assertApprovalClosedMap(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (
      [
        'signoffCollectionClosurePlanCreated',
        'perOwnerCollectionStatusRowsPlanned',
        'remainingOwnerFollowUpsPlanned',
        'executionApprovalPreconditionsPlanned',
        'blockersCarriedForward',
        'futureCollectionClosureOwnerReviewMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (
      ['requiredOwnerSignoffCount', 'remainingOwnerFollowUpCount', 'carriedForwardBlockerCount'].includes(key)
    ) {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (key === 'completedOwnerSignoffCountToday' || key === 'closedGapCountToday') {
      assert(value === 0, `${context}.${key} must be zero`)
    } else if (key === 'executionApprovalsGrantedToday') {
      assert(value === 'none', `${context}.${key} must be none`)
    } else {
      assert(value === false, `${context}.${key} must be false`)
    }
  }
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${path} owner mismatch`)
  assert(json.decision === decision, `${path} decision mismatch`)
}

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr1014.status === 'merged', 'PR #1014 status mismatch')
assert(plan.sourceVerification.pr1014.mergeCommit === sourceHead, 'PR #1014 merge commit mismatch')
assert(plan.sourceVerification.pr1014.decision === sourceDecision, 'PR #1014 decision mismatch')
assert(plan.sourceVerification.pr1011.decision === signoffEvidencePlanDecision, 'PR #1011 decision mismatch')
assertApprovalClosedMap(plan.closurePlanResult, 'closurePlanResult')
assert(
  plan.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-DISPATCH-SIGNOFF-COLLECTION-CLOSURE-OWNER-REVIEW: review dispatch signoff collection closure plan, no execution',
  'next prompt mismatch'
)

const sourceOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-review.md'
)
assert(sourceOwnerReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceOwnerReview.ownerReviewResult.futureSignoffCollectionClosurePlanMayProceed === true, 'source readiness missing')
assert(sourceOwnerReview.ownerReviewResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourceOwnerReview.ownerReviewResult.dispatchContractApprovedToday === false, 'source must not approve dispatch')

const status = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-status-register.md']
assert(status.collectionStatusRows.length === 7, 'collection status row count mismatch')
for (const owner of ownerAreas) {
  const row = status.collectionStatusRows.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} collection row missing`)
  assert(row.collectionStatus === 'pending_owner_evidence', `${owner} must remain pending`)
  assert(row.completeToday === false, `${owner} must not complete today`)
  assert(row.grantsExecutionApprovalToday === false, `${owner} must not approve execution`)
}
assert(status.collectionSummary.requiredOwnerSignoffCount === 7, 'required owner count mismatch')
assert(status.collectionSummary.collectedOwnerSignoffCountToday === 0, 'collected signoffs must be zero')
assert(status.collectionSummary.completedOwnerSignoffCountToday === 0, 'completed signoffs must be zero')
assert(status.collectionSummary.closedGapCountToday === 0, 'closed gaps must be zero')
assert(status.collectionSummary.allOwnersCompleteToday === false, 'all owners must not be complete')
assert(status.collectionSummary.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')
assert(status.collectionSummary.dispatchContractApprovedToday === false, 'dispatch must not be approved')

const followUps = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-remaining-owner-follow-up-register.md']
assert(followUps.remainingOwnerFollowUps.length === 7, 'remaining owner follow-up count mismatch')
for (const owner of ownerAreas) {
  const row = followUps.remainingOwnerFollowUps.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} follow-up missing`)
  assert(row.status === 'blocked_pending_owner_review', `${owner} follow-up status mismatch`)
  assert(row.mayExecuteToday === false, `${owner} mayExecuteToday must be false`)
}
assert(followUps.followUpSummary.remainingOwnerFollowUpCount === 7, 'follow-up summary count mismatch')
assert(followUps.followUpSummary.ownerFollowUpsClosedToday === 0, 'follow-ups closed must be zero')
assert(followUps.followUpSummary.executionApprovalsGrantedToday === 'none', 'follow-up execution approvals must be none')
assert(followUps.followUpSummary.futureCollectionClosureOwnerReviewMayProceed === true, 'owner review readiness missing')
assert(followUps.followUpSummary.dispatchContractApprovedToday === false, 'follow-up dispatch must not be approved')
assert(followUps.followUpSummary.workerExecutionApprovedToday === false, 'follow-up worker execution must be false')
assert(followUps.followUpSummary.runtimeReadinessClaimedToday === false, 'runtime readiness must be unclaimed')
assert(followUps.followUpSummary.betaProductionReadinessClaimedToday === false, 'beta/prod readiness must be unclaimed')

const preconditions = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-execution-approval-precondition-register.md']
assert(preconditions.executionApprovalPreconditions.length === 6, 'precondition count mismatch')
for (const row of preconditions.executionApprovalPreconditions) {
  assert(row.required === true, `${row.precondition} must be required`)
  assert(row.satisfiedToday === false, `${row.precondition} must remain unsatisfied`)
}
assert(preconditions.approvalStateToday.executionApprovalPreconditionsPlanned === true, 'preconditions planned flag missing')
for (const [key, value] of Object.entries(preconditions.approvalStateToday)) {
  if (key === 'executionApprovalPreconditionsPlanned') {
    assert(value === true, `${key} must be true`)
  } else if (key === 'executionApprovalsGrantedToday') {
    assert(value === 'none', `${key} must be none`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-blocker-carry-forward-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'dispatch_signoff_collection_closure_plan_pending'),
  'closure plan pending blocker resolution missing'
)
for (const blocker of [
  'all_required_owner_signoffs_incomplete',
  'dispatch_contract_execution_owner_approval_missing',
  'worker_dispatch_claim_lease_owner_approval_missing',
  'runtime_media_artifact_owner_approval_missing',
  'supabase_service_role_storage_sql_boundary_unapproved',
  'provider_model_and_model_weight_execution_unapproved',
  'billing_compliance_beta_production_unlock_unapproved',
]) {
  assert(blockers.carriedForwardBlockers.includes(blocker), `${blocker} carry-forward blocker missing`)
}
assert(blockers.carryForwardState.blockersCarriedForward === true, 'blocker carry-forward flag missing')
assert(blockers.carryForwardState.carriedForwardBlockerCount === 7, 'carried blocker count mismatch')
assert(blockers.carryForwardState.closedGapCountToday === 0, 'closed gaps must be zero')
assert(blockers.carryForwardState.completedOwnerSignoffCountToday === 0, 'completed signoffs must be zero')
assert(blockers.carryForwardState.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
assert(blockers.carryForwardState.dispatchContractApprovedToday === false, 'blocker dispatch must not be approved')
assert(blockers.carryForwardState.workerExecutionApprovedToday === false, 'blocker worker execution must be false')
assert(blockers.carryForwardState.runtimeReadinessClaimedToday === false, 'blocker runtime readiness must be unclaimed')
assert(blockers.carryForwardState.betaProductionReadinessClaimedToday === false, 'blocker beta/prod readiness must be unclaimed')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-claim-policy.md']
assertApprovalClosedMap(policy.allowedClaims, 'allowedClaims')
for (const claim of forbiddenClaims) {
  assert(policy.forbiddenClaims.includes(claim), `${claim} forbidden claim missing`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')
assert(policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification mismatch')
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action classification mismatch')

const nextPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review.md'
)
assert(nextPrompt.includes(decision), 'owner-review prompt must require closure-plan decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'owner-review prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'owner-review prompt must block Supabase')
assert(nextPrompt.includes('completed owner signoffs `0`'), 'owner-review prompt must preserve completed signoffs zero')
assert(nextPrompt.includes('execution approvals `none`'), 'owner-review prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dispatch-signoff-collection-closure-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr1014Verified: true,
  signoffCollectionClosurePlanCreated: true,
  perOwnerCollectionStatusRowsPlanned: true,
  remainingOwnerFollowUpsPlanned: true,
  executionApprovalPreconditionsPlanned: true,
  blockersCarriedForward: true,
  requiredOwnerSignoffCount: 7,
  completedOwnerSignoffCountToday: 0,
  closedGapCountToday: 0,
  executionApprovalsGrantedToday: 'none',
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DISPATCH-SIGNOFF-COLLECTION-CLOSURE-OWNER-REVIEW: review dispatch signoff collection closure plan, no execution'
}, null, 2))
