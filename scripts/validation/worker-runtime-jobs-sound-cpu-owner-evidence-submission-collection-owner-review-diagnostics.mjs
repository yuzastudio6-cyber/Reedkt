import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_plan_completed_with_warnings_ready_for_owner_evidence_submission_collection_owner_review'
const priorDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_collection_plan'
const sourceHead = '195ab87d2bfe409a8a0259df04f1d4c3628b76a6'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-method-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-row-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-claim-policy.md',
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

function assertClosedMap(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (
      [
        'ownerEvidenceSubmissionCollectionPlanAcceptedForSubmissionPlanning',
        'ownerAreaRowsAcceptedForSubmissionPlanning',
        'collectionMethodsAcceptedForSubmissionPlanning',
        'collectionValidationPolicyAcceptedForSubmissionPlanning',
        'blockersAcceptedForCarryForward',
        'futureOwnerEvidenceSubmissionPlanMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (
      ['requiredOwnerAreaCountAccepted', 'plannedCollectionRowCountAccepted', 'requiredEvidenceItemCountAccepted'].includes(
        key
      )
    ) {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (
      key === 'collectedEvidenceCountToday' ||
      key === 'submittedEvidenceCountToday' ||
      key === 'acceptedEvidenceCountToday' ||
      key === 'completedOwnerSignoffCountToday' ||
      key === 'closedGapCountToday'
    ) {
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1029.status === 'merged', 'PR #1029 status mismatch')
assert(review.sourceVerification.pr1029.mergeCommit === sourceHead, 'PR #1029 merge commit mismatch')
assert(review.sourceVerification.pr1029.decision === sourceDecision, 'PR #1029 decision mismatch')
assert(review.sourceVerification.pr1026.decision === priorDecision, 'PR #1026 decision mismatch')
assertClosedMap(review.ownerReviewResult, 'ownerReviewResult')
assert(
  review.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PLAN: plan actual owner evidence submission packet, no execution',
  'next prompt mismatch'
)

const sourcePlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-plan.md')
assert(sourcePlan.decision === sourceDecision, 'source collection plan decision mismatch')
assert(
  sourcePlan.collectionPlanResult.futureOwnerEvidenceSubmissionCollectionOwnerReviewMayProceed === true,
  'source owner-review readiness missing'
)
assert(sourcePlan.collectionPlanResult.collectedEvidenceCountToday === 0, 'source collected evidence must be zero')
assert(sourcePlan.collectionPlanResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourcePlan.collectionPlanResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourcePlan.collectionPlanResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourcePlan.collectionPlanResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourcePlan.collectionPlanResult.dispatchContractApprovedToday === false, 'source dispatch approval must be false')

const acceptance =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-acceptance-register.md']
for (const [key, value] of Object.entries(acceptance.acceptedCollectionPlan)) {
  if (
    [
      'sourceDecisionAccepted',
      'acceptedForOwnerEvidenceSubmissionPlanningOnly',
      'ownerAreaRowsAccepted',
      'collectionMethodsAccepted',
      'collectionValidationPolicyAccepted',
      'blockerCarryForwardAccepted',
    ].includes(key)
  ) {
    assert(value === true, `${key} must be true`)
  } else if (
    ['requiredOwnerAreaCountAccepted', 'plannedCollectionRowCountAccepted', 'requiredEvidenceItemCountAccepted'].includes(
      key
    )
  ) {
    assert(value === 7, `${key} must be 7`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(acceptance.collectedEvidenceCountToday === 0, 'acceptance collected evidence must be zero')
assert(acceptance.submittedEvidenceCountToday === 0, 'acceptance submitted evidence must be zero')
assert(acceptance.acceptedEvidenceCountToday === 0, 'acceptance accepted evidence must be zero')
assert(acceptance.completedOwnerSignoffCountToday === 0, 'acceptance signoffs must be zero')
assert(acceptance.closedGapCountToday === 0, 'acceptance closed gaps must be zero')
assert(acceptance.executionApprovalsGrantedToday === 'none', 'acceptance execution approvals must be none')

const methods =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-method-owner-review-register.md']
assert(methods.acceptedCollectionMethods.length === 3, 'accepted method count mismatch')
for (const rejected of [
  'raw_prompt_execution',
  'secret_material',
  'service_role_payload',
  'signed_url_as_source_of_truth',
  'public_artifact_as_source_of_truth',
  'provider_output_blob',
  'media_execution_artifact',
]) {
  assert(methods.rejectedCollectionInputsAccepted.includes(rejected), `${rejected} rejected input missing`)
}
assert(methods.methodReviewResult.collectionMethodsAcceptedForSubmissionPlanning === true, 'method acceptance missing')
assert(methods.methodReviewResult.collectionMethodCountAccepted === 3, 'method accepted count mismatch')
assert(methods.methodReviewResult.collectedEvidenceCountToday === 0, 'method collected evidence must be zero')
assert(methods.methodReviewResult.submittedEvidenceCountToday === 0, 'method submitted evidence must be zero')
assert(methods.methodReviewResult.acceptedEvidenceCountToday === 0, 'method accepted evidence must be zero')
assert(methods.methodReviewResult.completedOwnerSignoffCountToday === 0, 'method signoffs must be zero')
assert(methods.methodReviewResult.executionApprovalsGrantedToday === 'none', 'method execution approvals must be none')
assert(methods.methodReviewResult.workerExecutionApprovedToday === false, 'method worker execution must be false')
assert(methods.methodReviewResult.runtimeReadinessClaimedToday === false, 'method runtime readiness must be false')
assert(methods.methodReviewResult.betaProductionReadinessClaimedToday === false, 'method beta/prod readiness must be false')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-row-owner-review-register.md']
assert(rows.acceptedOwnerRows.length === 7, 'accepted owner row count mismatch')
for (const owner of ownerAreas) {
  assert(rows.acceptedOwnerRows.includes(owner), `${owner} accepted owner row missing`)
}
assert(rows.rowReviewResult.ownerAreaRowsAcceptedForSubmissionPlanning === true, 'row acceptance missing')
assert(rows.rowReviewResult.requiredOwnerAreaCountAccepted === 7, 'row owner area count mismatch')
assert(rows.rowReviewResult.plannedCollectionRowCountAccepted === 7, 'row collection count mismatch')
assert(rows.rowReviewResult.requiredEvidenceItemCountAccepted === 7, 'row evidence item count mismatch')
assert(rows.rowReviewResult.collectedEvidenceCountToday === 0, 'row collected evidence must be zero')
assert(rows.rowReviewResult.submittedEvidenceCountToday === 0, 'row submitted evidence must be zero')
assert(rows.rowReviewResult.acceptedEvidenceCountToday === 0, 'row accepted evidence must be zero')
assert(rows.rowReviewResult.completedOwnerSignoffCountToday === 0, 'row signoffs must be zero')
assert(rows.rowReviewResult.executionApprovalsGrantedToday === 'none', 'row execution approvals must be none')
assert(rows.rowReviewResult.dispatchContractApprovedToday === false, 'row dispatch approval must be false')
assert(rows.rowReviewResult.workerExecutionApprovedToday === false, 'row worker execution must be false')

const blockers =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-blocker-follow-up-register.md']
assert(
  blockers.resolvedForPlanning.some(
    (row) => row.blockerId === 'owner_evidence_submission_collection_owner_review_pending'
  ),
  'collection owner-review blocker resolution missing'
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'owner_evidence_submission_plan_pending'),
  'owner evidence submission plan blocker missing'
)
assert(blockers.collectedEvidenceCountToday === 0, 'blocker collected evidence must be zero')
assert(blockers.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(blockers.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(blockers.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(blockers.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(blockers.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
assert(blockers.dispatchContractApprovedToday === false, 'blocker dispatch approval must be false')
assert(blockers.workerExecutionApprovedToday === false, 'blocker worker execution must be false')
assert(blockers.runtimeReadinessClaimedToday === false, 'blocker runtime readiness must be false')
assert(blockers.betaProductionReadinessClaimedToday === false, 'blocker beta/prod readiness must be false')

const policy =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-claim-policy.md']
assertClosedMap(policy.allowedClaims, 'allowedClaims')
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'owner_evidence_collected',
  'owner_evidence_submitted',
  'owner_evidence_accepted',
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('do not collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('submit evidence'), 'next prompt must block evidence submission')
assert(nextPrompt.includes('accept evidence'), 'next prompt must block evidence acceptance')
assert(nextPrompt.includes('approve dispatch contracts'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('collected evidence count `0`'), 'next prompt must preserve collected evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-collection-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr1029Verified: true,
  ownerEvidenceSubmissionCollectionPlanAcceptedForSubmissionPlanning: true,
  futureOwnerEvidenceSubmissionPlanMayProceed: true,
  requiredOwnerAreaCountAccepted: 7,
  plannedCollectionRowCountAccepted: 7,
  requiredEvidenceItemCountAccepted: 7,
  collectedEvidenceCountToday: 0,
  submittedEvidenceCountToday: 0,
  acceptedEvidenceCountToday: 0,
  completedOwnerSignoffCountToday: 0,
  closedGapCountToday: 0,
  executionApprovalsGrantedToday: 'none',
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PLAN: plan actual owner evidence submission packet, no execution'
}, null, 2))
