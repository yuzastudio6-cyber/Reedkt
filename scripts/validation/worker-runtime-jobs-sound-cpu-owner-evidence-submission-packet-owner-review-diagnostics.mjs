import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_collection_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_plan_completed_with_warnings_ready_for_owner_evidence_submission_packet_owner_review'
const priorDecision =
  'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_plan'
const sourceHead = '2975f41a7248a9f160ab45ca2b6b684e66b7497f'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-schema-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-row-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-claim-policy.md',
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
        'ownerEvidenceSubmissionPacketPlanAcceptedForCollectionPlanning',
        'submissionPacketSchemaAcceptedForCollectionPlanning',
        'ownerSubmissionRowsAcceptedForCollectionPlanning',
        'submissionValidationPolicyAcceptedForCollectionPlanning',
        'blockersAcceptedForCarryForward',
        'futureOwnerEvidenceSubmissionCollectionPlanMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (
      ['requiredOwnerAreaCountAccepted', 'plannedSubmissionRowCountAccepted', 'requiredEvidenceItemCountAccepted'].includes(
        key
      )
    ) {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1025.status === 'merged', 'PR #1025 status mismatch')
assert(review.sourceVerification.pr1025.mergeCommit === sourceHead, 'PR #1025 merge commit mismatch')
assert(review.sourceVerification.pr1025.decision === sourceDecision, 'PR #1025 decision mismatch')
assert(review.sourceVerification.pr1023.decision === priorDecision, 'PR #1023 decision mismatch')
assertClosedMap(review.ownerReviewResult, 'ownerReviewResult')
assert(
  review.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-COLLECTION-PLAN: plan owner evidence submission collection, no execution',
  'next prompt mismatch'
)

const sourcePlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-plan.md')
assert(sourcePlan.decision === sourceDecision, 'source packet plan decision mismatch')
assert(
  sourcePlan.submissionPacketPlanResult.futureOwnerEvidenceSubmissionPacketOwnerReviewMayProceed === true,
  'source owner-review readiness missing'
)
assert(sourcePlan.submissionPacketPlanResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourcePlan.submissionPacketPlanResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourcePlan.submissionPacketPlanResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourcePlan.submissionPacketPlanResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourcePlan.submissionPacketPlanResult.dispatchContractApprovedToday === false, 'source dispatch approval must be false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-acceptance-register.md']
for (const [key, value] of Object.entries(acceptance.acceptedSubmissionPacketPlan)) {
  if (
    [
      'sourceDecisionAccepted',
      'acceptedForOwnerEvidenceSubmissionCollectionPlanningOnly',
      'schemaAccepted',
      'ownerRowsAccepted',
      'validationPolicyAccepted',
      'blockerCarryForwardAccepted',
    ].includes(key)
  ) {
    assert(value === true, `${key} must be true`)
  } else if (
    ['requiredOwnerAreaCountAccepted', 'plannedSubmissionRowCountAccepted', 'requiredEvidenceItemCountAccepted'].includes(
      key
    )
  ) {
    assert(value === 7, `${key} must be 7`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(acceptance.submittedEvidenceCountToday === 0, 'acceptance submitted evidence must be zero')
assert(acceptance.acceptedEvidenceCountToday === 0, 'acceptance accepted evidence must be zero')
assert(acceptance.completedOwnerSignoffCountToday === 0, 'acceptance signoffs must be zero')
assert(acceptance.closedGapCountToday === 0, 'acceptance closed gaps must be zero')
assert(acceptance.executionApprovalsGrantedToday === 'none', 'acceptance execution approvals must be none')

const schema = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-schema-owner-review-register.md']
assert(schema.acceptedSchemaFields.length === 10, 'schema field count mismatch')
for (const field of [
  'packetId',
  'sourcePlanMergeCommit',
  'ownerArea',
  'evidenceCategory',
  'evidenceDocumentPath',
  'approvalIntent',
  'approvedPlanSnapshotId',
  'submittedByOwner',
  'submittedAt',
  'reviewDecision',
]) {
  assert(schema.acceptedSchemaFields.includes(field), `${field} accepted field missing`)
}
for (const rejected of [
  'secret_material',
  'service_role_payload',
  'raw_prompt_as_evidence',
  'signed_url_as_source_of_truth',
  'provider_output_blob',
  'media_execution_artifact',
]) {
  assert(schema.rejectedEvidenceInputs.includes(rejected), `${rejected} rejected input missing`)
}
assert(schema.schemaReviewResult.submissionPacketSchemaAcceptedForCollectionPlanning === true, 'schema acceptance missing')
assert(schema.schemaReviewResult.requiredFieldCountAccepted === 10, 'schema accepted count mismatch')
assert(schema.schemaReviewResult.submittedEvidenceCountToday === 0, 'schema submitted evidence must be zero')
assert(schema.schemaReviewResult.acceptedEvidenceCountToday === 0, 'schema accepted evidence must be zero')
assert(schema.schemaReviewResult.executionApprovalsGrantedToday === 'none', 'schema execution approvals must be none')
assert(schema.schemaReviewResult.dispatchContractApprovedToday === false, 'schema dispatch approval must be false')
assert(schema.schemaReviewResult.workerExecutionApprovedToday === false, 'schema worker execution must be false')
assert(schema.schemaReviewResult.supabaseSqlApprovedToday === false, 'schema Supabase SQL must be false')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-row-owner-review-register.md']
assert(rows.acceptedOwnerSubmissionRows.length === 7, 'accepted owner row count mismatch')
for (const owner of ownerAreas) {
  const row = rows.acceptedOwnerSubmissionRows.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} owner row missing`)
  assert(row.acceptedForCollectionPlanning === true, `${owner} must be accepted for collection planning`)
  assert(row.submissionStatusToday === 'not_submitted', `${owner} must not be submitted`)
  assert(row.grantsExecutionApprovalToday === false, `${owner} must not grant execution approval`)
}
assert(rows.rowReviewResult.ownerSubmissionRowsAcceptedForCollectionPlanning === true, 'row review acceptance missing')
assert(rows.rowReviewResult.plannedSubmissionRowCountAccepted === 7, 'row count accepted mismatch')
assert(rows.rowReviewResult.submittedEvidenceCountToday === 0, 'row submitted evidence must be zero')
assert(rows.rowReviewResult.acceptedEvidenceCountToday === 0, 'row accepted evidence must be zero')
assert(rows.rowReviewResult.executionApprovalsGrantedToday === 'none', 'row execution approvals must be none')
assert(rows.rowReviewResult.dispatchContractApprovedToday === false, 'row dispatch approval must be false')
assert(rows.rowReviewResult.workerExecutionApprovedToday === false, 'row worker execution must be false')

const blockers =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-blocker-follow-up-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'owner_evidence_submission_packet_owner_review_pending'),
  'owner review blocker resolution missing'
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'owner_evidence_submission_collection_plan_pending' && row.status === 'next'
  ),
  'owner evidence submission collection plan blocker missing'
)
assert(blockers.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(blockers.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(blockers.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(blockers.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(blockers.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
assert(blockers.dispatchContractApprovedToday === false, 'blocker dispatch approval must be false')
assert(blockers.workerExecutionApprovedToday === false, 'blocker worker execution must be false')
assert(blockers.runtimeReadinessClaimedToday === false, 'blocker runtime readiness must be false')
assert(blockers.betaProductionReadinessClaimedToday === false, 'blocker beta/prod readiness must be false')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-claim-policy.md']
assertClosedMap(policy.allowedClaims, 'allowedClaims')
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'dispatch_contract_approved',
  'owner_evidence_accepted',
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('do not collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('approve dispatch contracts'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('submitted evidence count `0`'), 'next prompt must preserve submitted evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-packet-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr1025Verified: true,
  ownerEvidenceSubmissionPacketPlanAcceptedForCollectionPlanning: true,
  futureOwnerEvidenceSubmissionCollectionPlanMayProceed: true,
  requiredOwnerAreaCountAccepted: 7,
  plannedSubmissionRowCountAccepted: 7,
  requiredEvidenceItemCountAccepted: 7,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-COLLECTION-PLAN: plan owner evidence submission collection, no execution'
}, null, 2))
