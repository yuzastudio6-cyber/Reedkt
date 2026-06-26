import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_owner_review_passed_with_warnings_ready_for_required_owner_evidence_collection_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_plan_completed_with_warnings_ready_for_collection_closure_owner_review'
const priorOwnerDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_contract_signoff_evidence_owner_review_passed_with_warnings_ready_for_signoff_collection_closure_plan'
const sourceHead = '35eb8bd18eb5bff6c572637e072ac3e1423b6481'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-status-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-owner-follow-up-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-claim-policy.md',
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

function assertOwnerReviewClosedMap(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (
      [
        'collectionClosurePlanAcceptedForRequiredOwnerEvidenceCollectionPlanning',
        'futureRequiredOwnerEvidenceCollectionPlanMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (
      ['collectionStatusRowsAccepted', 'remainingOwnerFollowUpsAccepted', 'carriedForwardBlockerCountAccepted'].includes(
        key
      )
    ) {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (key === 'executionApprovalPreconditionsAccepted') {
      assert(value === 6, `${context}.${key} must be 6`)
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1017.status === 'merged', 'PR #1017 status mismatch')
assert(review.sourceVerification.pr1017.mergeCommit === sourceHead, 'PR #1017 merge commit mismatch')
assert(review.sourceVerification.pr1017.decision === sourceDecision, 'PR #1017 decision mismatch')
assert(review.sourceVerification.pr1014.decision === priorOwnerDecision, 'PR #1014 decision mismatch')
assertOwnerReviewClosedMap(review.ownerReviewResult, 'ownerReviewResult')
assert(
  review.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-REQUIRED-OWNER-EVIDENCE-COLLECTION-PLAN: plan required owner evidence collection, no execution',
  'next prompt mismatch'
)

const sourcePlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-plan.md')
assert(sourcePlan.decision === sourceDecision, 'source closure plan decision mismatch')
assert(sourcePlan.closurePlanResult.futureCollectionClosureOwnerReviewMayProceed === true, 'source owner-review readiness missing')
assert(sourcePlan.closurePlanResult.completedOwnerSignoffCountToday === 0, 'source completed signoffs must be zero')
assert(sourcePlan.closurePlanResult.closedGapCountToday === 0, 'source closed gaps must be zero')
assert(sourcePlan.closurePlanResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourcePlan.closurePlanResult.dispatchContractApprovedToday === false, 'source must not approve dispatch')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-acceptance-register.md']
assert(acceptance.acceptedClosurePacket.sourceDecisionAccepted === true, 'source decision acceptance missing')
assert(
  acceptance.acceptedClosurePacket.acceptedForRequiredOwnerEvidenceCollectionPlanningOnly === true,
  'planning-only acceptance missing'
)
assert(acceptance.acceptedClosurePacket.collectionStatusRowsAccepted === 7, 'accepted status row count mismatch')
assert(acceptance.acceptedClosurePacket.remainingOwnerFollowUpsAccepted === 7, 'accepted follow-up count mismatch')
assert(acceptance.acceptedClosurePacket.executionApprovalPreconditionsAccepted === 6, 'accepted precondition count mismatch')
assert(acceptance.acceptedClosurePacket.carriedForwardBlockerCountAccepted === 7, 'accepted blocker count mismatch')
for (const [key, value] of Object.entries(acceptance.acceptedClosurePacket)) {
  if (
    key === 'sourceDecisionAccepted' ||
    key === 'acceptedForRequiredOwnerEvidenceCollectionPlanningOnly'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (
    key === 'collectionStatusRowsAccepted' ||
    key === 'remainingOwnerFollowUpsAccepted' ||
    key === 'carriedForwardBlockerCountAccepted'
  ) {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'executionApprovalPreconditionsAccepted') {
    assert(value === 6, `${key} must be 6`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(acceptance.completedOwnerSignoffCountToday === 0, 'acceptance completed signoffs must be zero')
assert(acceptance.closedGapCountToday === 0, 'acceptance closed gaps must be zero')
assert(acceptance.executionApprovalsGrantedToday === 'none', 'acceptance execution approvals must be none')

const status = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-status-owner-review-register.md']
assert(status.acceptedOwnerAreas.length === 7, 'accepted owner area count mismatch')
for (const owner of ownerAreas) {
  assert(status.acceptedOwnerAreas.includes(owner), `${owner} accepted area missing`)
}
assert(status.statusReviewResult.collectionStatusRowsAcceptedForEvidenceCollectionPlanning === true, 'status acceptance missing')
assert(status.statusReviewResult.acceptedOwnerAreaCount === 7, 'status owner area count mismatch')
assert(status.statusReviewResult.completedOwnerAreaCountToday === 0, 'completed owner areas must be zero')
assert(status.statusReviewResult.allOwnerAreasCompleteToday === false, 'all owners must not be complete')
assert(status.statusReviewResult.anyOwnerAreaConvertedToExecutionApprovalToday === false, 'no owner area may convert to execution')
assert(status.statusReviewResult.executionApprovalsGrantedToday === 'none', 'status execution approvals must be none')
assert(status.statusReviewResult.dispatchContractApprovedToday === false, 'status dispatch approval must be false')
assert(status.statusReviewResult.workerExecutionApprovedToday === false, 'status worker execution must be false')
assert(status.statusReviewResult.runtimeReadinessClaimedToday === false, 'status runtime readiness must be false')
assert(status.statusReviewResult.betaProductionReadinessClaimedToday === false, 'status beta/prod readiness must be false')

const followUps = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-owner-follow-up-owner-review-register.md']
assert(followUps.acceptedFollowUpOwners.length === 7, 'accepted follow-up owner count mismatch')
for (const owner of ownerAreas) {
  assert(followUps.acceptedFollowUpOwners.includes(owner), `${owner} follow-up owner missing`)
}
assert(followUps.followUpReviewResult.remainingOwnerFollowUpsAcceptedForEvidenceCollectionPlanning === true, 'follow-up acceptance missing')
assert(followUps.followUpReviewResult.remainingOwnerFollowUpCountAccepted === 7, 'follow-up count mismatch')
assert(followUps.followUpReviewResult.ownerFollowUpsClosedToday === 0, 'follow-ups closed must be zero')
assert(followUps.followUpReviewResult.futureRequiredOwnerEvidenceCollectionPlanMayProceed === true, 'evidence plan readiness missing')
assert(followUps.followUpReviewResult.executionApprovalsGrantedToday === 'none', 'follow-up execution approvals must be none')
for (const [key, value] of Object.entries(followUps.followUpReviewResult)) {
  if (
    key === 'remainingOwnerFollowUpsAcceptedForEvidenceCollectionPlanning' ||
    key === 'futureRequiredOwnerEvidenceCollectionPlanMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else if (key === 'remainingOwnerFollowUpCountAccepted') {
    assert(value === 7, `${key} must be 7`)
  } else if (key === 'ownerFollowUpsClosedToday') {
    assert(value === 0, `${key} must be zero`)
  } else if (key === 'executionApprovalsGrantedToday') {
    assert(value === 'none', `${key} must be none`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const blockers =
  parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-blocker-follow-up-register.md']
assert(
  blockers.resolvedForPlanning.some(
    (row) => row.blockerId === 'dispatch_signoff_collection_closure_owner_review_pending'
  ),
  'owner review blocker resolution missing'
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'required_owner_evidence_collection_plan_pending' && row.status === 'next'
  ),
  'next required owner evidence collection blocker missing'
)
assert(blockers.completedOwnerSignoffCountToday === 0, 'blocker completed signoffs must be zero')
assert(blockers.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(blockers.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
assert(blockers.dispatchContractApprovedToday === false, 'blocker dispatch approval must be false')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-claim-policy.md']
assertOwnerReviewClosedMap(policy.allowedClaims, 'allowedClaims')
for (const claim of [
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
]) {
  assert(policy.forbiddenClaims.includes(claim), `${claim} forbidden claim missing`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')
assert(policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification mismatch')
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action classification mismatch')

const nextPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-plan.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('completed owner signoffs `0`'), 'next prompt must preserve completed signoffs zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-dispatch-signoff-collection-closure-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr1017Verified: true,
  collectionClosurePlanAcceptedForRequiredOwnerEvidenceCollectionPlanning: true,
  futureRequiredOwnerEvidenceCollectionPlanMayProceed: true,
  collectionStatusRowsAccepted: 7,
  remainingOwnerFollowUpsAccepted: 7,
  executionApprovalPreconditionsAccepted: 6,
  carriedForwardBlockerCountAccepted: 7,
  completedOwnerSignoffCountToday: 0,
  closedGapCountToday: 0,
  executionApprovalsGrantedToday: 'none',
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-REQUIRED-OWNER-EVIDENCE-COLLECTION-PLAN: plan required owner evidence collection, no execution'
}, null, 2))
