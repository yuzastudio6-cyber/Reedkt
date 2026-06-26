import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_plan_completed_with_warnings_ready_for_owner_evidence_submission_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_plan'
const priorDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_plan_completed_with_warnings_ready_for_owner_evidence_submission_collection_owner_review'
const sourceHead = '5d7f2a07158c3ab442dd2853a26c637ca4c15043'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-row-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shape-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-validation-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-claim-policy.md',
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
        'ownerEvidenceSubmissionPlanCreated',
        'ownerSubmissionRowsPlanned',
        'submissionPacketShapePlanned',
        'submissionValidationPolicyPlanned',
        'blockersCarriedForward',
        'futureOwnerEvidenceSubmissionOwnerReviewMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (['requiredOwnerAreaCount', 'plannedSubmissionRowCount', 'requiredEvidenceItemCount'].includes(key)) {
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

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr1031.status === 'merged', 'PR #1031 status mismatch')
assert(plan.sourceVerification.pr1031.mergeCommit === sourceHead, 'PR #1031 merge commit mismatch')
assert(plan.sourceVerification.pr1031.decision === sourceDecision, 'PR #1031 decision mismatch')
assert(plan.sourceVerification.pr1029.decision === priorDecision, 'PR #1029 decision mismatch')
assertClosedMap(plan.submissionPlanResult, 'submissionPlanResult')
assert(
  plan.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-OWNER-REVIEW: review owner evidence submission plan, no execution',
  'next prompt mismatch'
)

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source collection owner-review decision mismatch')
assert(
  sourceReview.ownerReviewResult.futureOwnerEvidenceSubmissionPlanMayProceed === true,
  'source submission plan readiness missing'
)
assert(sourceReview.ownerReviewResult.collectedEvidenceCountToday === 0, 'source collected evidence must be zero')
assert(sourceReview.ownerReviewResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourceReview.ownerReviewResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourceReview.ownerReviewResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourceReview.ownerReviewResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourceReview.ownerReviewResult.dispatchContractApprovedToday === false, 'source dispatch approval must be false')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-row-register.md']
assert(rows.plannedSubmissionRows.length === 7, 'planned submission row count mismatch')
for (const owner of ownerAreas) {
  const row = rows.plannedSubmissionRows.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} submission row missing`)
  assert(row.plannedSubmissionPacketPath.startsWith('docs/'), `${owner} packet path must be docs scoped`)
  assert(row.submissionStatusToday === 'not_submitted', `${owner} must not be submitted`)
  assert(row.grantsExecutionApprovalToday === false, `${owner} must not grant execution approval`)
}
assert(rows.rowSummary.ownerSubmissionRowsPlanned === true, 'owner submission rows planned flag missing')
assert(rows.rowSummary.plannedSubmissionRowCount === 7, 'planned submission row count mismatch')
assert(rows.rowSummary.requiredEvidenceItemCount === 7, 'required evidence item count mismatch')
assert(rows.rowSummary.collectedEvidenceCountToday === 0, 'row collected evidence must be zero')
assert(rows.rowSummary.submittedEvidenceCountToday === 0, 'row submitted evidence must be zero')
assert(rows.rowSummary.acceptedEvidenceCountToday === 0, 'row accepted evidence must be zero')
assert(rows.rowSummary.completedOwnerSignoffCountToday === 0, 'row signoffs must be zero')
assert(rows.rowSummary.executionApprovalsGrantedToday === 'none', 'row execution approvals must be none')
assert(rows.rowSummary.dispatchContractApprovedToday === false, 'row dispatch approval must be false')

const shape = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-shape-register.md']
for (const key of [
  'packetId',
  'sourcePlanMergeCommit',
  'ownerArea',
  'ownerStatement',
  'evidenceItem',
  'evidenceDocumentPath',
  'approvedPlanSnapshotId',
  'submittedByOwner',
  'submittedAt',
  'reviewDecision',
]) {
  assert(Object.hasOwn(shape.plannedPacketShape, key), `${key} planned shape field missing`)
}
for (const key of [
  'executionApprovalGranted',
  'serviceRolePayloadAllowed',
  'secretMaterialAllowed',
  'rawPromptAcceptedAsEvidence',
  'signedUrlAcceptedAsSourceOfTruth',
  'publicArtifactAcceptedAsSourceOfTruth',
]) {
  assert(shape.plannedPacketShape[key] === false, `${key} must be false`)
}
assert(shape.shapeStateToday.submissionPacketShapePlanned === true, 'packet shape planned flag missing')
assert(shape.shapeStateToday.requiredFieldCount === 10, 'packet shape field count mismatch')
assert(shape.shapeStateToday.collectedEvidenceCountToday === 0, 'shape collected evidence must be zero')
assert(shape.shapeStateToday.submittedEvidenceCountToday === 0, 'shape submitted evidence must be zero')
assert(shape.shapeStateToday.acceptedEvidenceCountToday === 0, 'shape accepted evidence must be zero')
assert(shape.shapeStateToday.executionApprovalsGrantedToday === 'none', 'shape execution approvals must be none')
assert(shape.shapeStateToday.dispatchContractApprovedToday === false, 'shape dispatch approval must be false')
assert(shape.shapeStateToday.workerExecutionApprovedToday === false, 'shape worker execution must be false')
assert(shape.shapeStateToday.supabaseSqlApprovedToday === false, 'shape Supabase SQL must be false')
assert(shape.shapeStateToday.artifactDeliveryApprovedToday === false, 'shape artifact delivery must be false')

const validation = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-validation-policy.md']
for (const [key, value] of Object.entries(validation.validationPolicy)) {
  assert(value === true, `${key} must be true`)
}
assert(validation.validationStateToday.submissionValidationPolicyPlanned === true, 'validation policy planned flag missing')
assert(validation.validationStateToday.collectedEvidenceCountToday === 0, 'validation collected evidence must be zero')
assert(validation.validationStateToday.submittedEvidenceCountToday === 0, 'validation submitted evidence must be zero')
assert(validation.validationStateToday.acceptedEvidenceCountToday === 0, 'validation accepted evidence must be zero')
assert(validation.validationStateToday.completedOwnerSignoffCountToday === 0, 'validation signoffs must be zero')
assert(validation.validationStateToday.closedGapCountToday === 0, 'validation closed gaps must be zero')
assert(validation.validationStateToday.executionApprovalsGrantedToday === 'none', 'validation execution approvals must be none')
assert(validation.validationStateToday.dispatchContractApprovedToday === false, 'validation dispatch approval must be false')
assert(validation.validationStateToday.runtimeReadinessClaimedToday === false, 'validation runtime readiness must be false')
assert(validation.validationStateToday.betaProductionReadinessClaimedToday === false, 'validation beta/prod readiness must be false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-blocker-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'owner_evidence_submission_plan_pending'),
  'submission plan blocker resolution missing'
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

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-claim-policy.md']
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require submission plan decision')
assert(nextPrompt.includes('Do not collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('submit evidence'), 'next prompt must block evidence submission')
assert(nextPrompt.includes('accept evidence'), 'next prompt must block evidence acceptance')
assert(nextPrompt.includes('approve dispatch contracts'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('collected evidence count `0`'), 'next prompt must preserve collected evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_owner_evidence_submission_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr1031Verified: true,
  ownerEvidenceSubmissionPlanCreated: true,
  plannedSubmissionRowCount: 7,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-OWNER-REVIEW: review owner evidence submission plan, no execution'
}, null, 2))
