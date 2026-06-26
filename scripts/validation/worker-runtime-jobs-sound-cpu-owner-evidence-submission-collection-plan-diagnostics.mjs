import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_plan_completed_with_warnings_ready_for_owner_evidence_submission_collection_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_collection_plan'
const priorDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_plan_completed_with_warnings_ready_for_owner_evidence_submission_packet_owner_review'
const sourceHead = 'ad289fc28072e1be82ed41956ff8cde0d829de33'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-area-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-method-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-validation-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-claim-policy.md',
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
        'ownerEvidenceSubmissionCollectionPlanCreated',
        'ownerAreaRowsPlanned',
        'collectionMethodsPlanned',
        'collectionValidationPolicyPlanned',
        'blockersCarriedForward',
        'futureOwnerEvidenceSubmissionCollectionOwnerReviewMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (['requiredOwnerAreaCount', 'plannedCollectionRowCount', 'requiredEvidenceItemCount'].includes(key)) {
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

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr1026.status === 'merged', 'PR #1026 status mismatch')
assert(plan.sourceVerification.pr1026.mergeCommit === sourceHead, 'PR #1026 merge commit mismatch')
assert(plan.sourceVerification.pr1026.decision === sourceDecision, 'PR #1026 decision mismatch')
assert(plan.sourceVerification.pr1025.decision === priorDecision, 'PR #1025 decision mismatch')
assertClosedMap(plan.collectionPlanResult, 'collectionPlanResult')
assert(
  plan.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-COLLECTION-OWNER-REVIEW: review owner evidence submission collection plan, no execution',
  'next prompt mismatch'
)

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(
  sourceReview.ownerReviewResult.futureOwnerEvidenceSubmissionCollectionPlanMayProceed === true,
  'source collection plan readiness missing'
)
assert(sourceReview.ownerReviewResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourceReview.ownerReviewResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourceReview.ownerReviewResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourceReview.ownerReviewResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourceReview.ownerReviewResult.dispatchContractApprovedToday === false, 'source dispatch approval must be false')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-area-register.md']
assert(rows.plannedCollectionRows.length === 7, 'planned collection row count mismatch')
for (const owner of ownerAreas) {
  const row = rows.plannedCollectionRows.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} collection row missing`)
  assert(row.collectionStatusToday === 'not_collected', `${owner} must not be collected`)
  assert(row.grantsExecutionApprovalToday === false, `${owner} must not grant execution approval`)
}
assert(rows.ownerAreaSummary.ownerAreaRowsPlanned === true, 'owner rows planned flag missing')
assert(rows.ownerAreaSummary.plannedCollectionRowCount === 7, 'planned collection row count mismatch')
assert(rows.ownerAreaSummary.requiredEvidenceItemCount === 7, 'required evidence item count mismatch')
assert(rows.ownerAreaSummary.collectedEvidenceCountToday === 0, 'row collected evidence must be zero')
assert(rows.ownerAreaSummary.submittedEvidenceCountToday === 0, 'row submitted evidence must be zero')
assert(rows.ownerAreaSummary.acceptedEvidenceCountToday === 0, 'row accepted evidence must be zero')
assert(rows.ownerAreaSummary.completedOwnerSignoffCountToday === 0, 'row signoffs must be zero')
assert(rows.ownerAreaSummary.executionApprovalsGrantedToday === 'none', 'row execution approvals must be none')
assert(rows.ownerAreaSummary.dispatchContractApprovedToday === false, 'row dispatch approval must be false')

const methods = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-method-register.md']
assert(methods.plannedCollectionMethods.length === 3, 'collection method count mismatch')
for (const rejected of [
  'raw_prompt_execution',
  'secret_material',
  'service_role_payload',
  'signed_url_as_source_of_truth',
  'public_artifact_as_source_of_truth',
  'provider_output_blob',
  'media_execution_artifact',
]) {
  assert(methods.rejectedCollectionInputs.includes(rejected), `${rejected} rejected input missing`)
}
assert(methods.methodStateToday.collectionMethodsPlanned === true, 'collection methods planned flag missing')
assert(methods.methodStateToday.collectionMethodCount === 3, 'collection method count field mismatch')
assert(methods.methodStateToday.collectedEvidenceCountToday === 0, 'method collected evidence must be zero')
assert(methods.methodStateToday.submittedEvidenceCountToday === 0, 'method submitted evidence must be zero')
assert(methods.methodStateToday.acceptedEvidenceCountToday === 0, 'method accepted evidence must be zero')
assert(methods.methodStateToday.executionApprovalsGrantedToday === 'none', 'method execution approvals must be none')
assert(methods.methodStateToday.workerExecutionApprovedToday === false, 'method worker execution must be false')
assert(methods.methodStateToday.runtimeReadinessClaimedToday === false, 'method runtime readiness must be false')

const validation = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-validation-policy.md']
for (const [key, value] of Object.entries(validation.validationPolicy)) {
  assert(value === true, `${key} must be true`)
}
assert(validation.validationStateToday.collectionValidationPolicyPlanned === true, 'validation policy planned flag missing')
assert(validation.validationStateToday.collectedEvidenceCountToday === 0, 'validation collected evidence must be zero')
assert(validation.validationStateToday.submittedEvidenceCountToday === 0, 'validation submitted evidence must be zero')
assert(validation.validationStateToday.acceptedEvidenceCountToday === 0, 'validation accepted evidence must be zero')
assert(validation.validationStateToday.completedOwnerSignoffCountToday === 0, 'validation signoffs must be zero')
assert(validation.validationStateToday.closedGapCountToday === 0, 'validation closed gaps must be zero')
assert(validation.validationStateToday.executionApprovalsGrantedToday === 'none', 'validation execution approvals must be none')
assert(validation.validationStateToday.dispatchContractApprovedToday === false, 'validation dispatch approval must be false')
assert(validation.validationStateToday.runtimeReadinessClaimedToday === false, 'validation runtime readiness must be false')
assert(validation.validationStateToday.betaProductionReadinessClaimedToday === false, 'validation beta/prod readiness must be false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-blocker-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'owner_evidence_submission_collection_plan_pending'),
  'collection plan blocker resolution missing'
)
assert(blockers.carriedForwardBlockers.length === 7, 'carried blocker count mismatch')
assert(blockers.blockerState.blockersCarriedForward === true, 'blockers carried flag missing')
assert(blockers.blockerState.carriedForwardBlockerCount === 7, 'carried blocker count field mismatch')
assert(blockers.blockerState.collectedEvidenceCountToday === 0, 'blocker collected evidence must be zero')
assert(blockers.blockerState.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(blockers.blockerState.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(blockers.blockerState.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(blockers.blockerState.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(blockers.blockerState.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
assert(blockers.blockerState.dispatchContractApprovedToday === false, 'blocker dispatch must be false')
assert(blockers.blockerState.workerExecutionApprovedToday === false, 'blocker worker execution must be false')
assert(blockers.blockerState.runtimeReadinessClaimedToday === false, 'blocker runtime readiness must be false')
assert(blockers.blockerState.betaProductionReadinessClaimedToday === false, 'blocker beta/prod readiness must be false')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-claim-policy.md']
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

const nextPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-review.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require collection plan decision')
assert(nextPrompt.includes('Do not collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('submit evidence'), 'next prompt must block evidence submission')
assert(nextPrompt.includes('approve dispatch contracts'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('collected evidence count `0`'), 'next prompt must preserve collected evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-collection-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr1026Verified: true,
  ownerEvidenceSubmissionCollectionPlanCreated: true,
  plannedCollectionRowCount: 7,
  requiredEvidenceItemCount: 7,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-COLLECTION-OWNER-REVIEW: review owner evidence submission collection plan, no execution'
}, null, 2))
