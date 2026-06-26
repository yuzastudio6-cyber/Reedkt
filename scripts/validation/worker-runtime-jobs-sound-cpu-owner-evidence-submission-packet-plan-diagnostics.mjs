import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_plan_completed_with_warnings_ready_for_owner_evidence_submission_packet_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_plan'
const collectionPlanDecision =
  'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_plan_completed_with_warnings_ready_for_required_owner_evidence_collection_owner_review'
const sourceHead = '05cdfab77ba6996f283fbc00a90e3ff96494ad2e'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-schema-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-row-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-validation-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-blocker-carry-forward-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-claim-policy.md',
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

function assertPacketClosedMap(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (
      [
        'ownerEvidenceSubmissionPacketPlanCreated',
        'submissionPacketSchemaPlanned',
        'ownerSubmissionRowsPlanned',
        'submissionValidationPolicyPlanned',
        'blockersCarriedForward',
        'futureOwnerEvidenceSubmissionPacketOwnerReviewMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (['requiredOwnerAreaCount', 'plannedSubmissionRowCount', 'requiredEvidenceItemCount'].includes(key)) {
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

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr1023.status === 'merged', 'PR #1023 status mismatch')
assert(plan.sourceVerification.pr1023.mergeCommit === sourceHead, 'PR #1023 merge commit mismatch')
assert(plan.sourceVerification.pr1023.decision === sourceDecision, 'PR #1023 decision mismatch')
assert(plan.sourceVerification.pr1022.decision === collectionPlanDecision, 'PR #1022 decision mismatch')
assertPacketClosedMap(plan.submissionPacketPlanResult, 'submissionPacketPlanResult')
assert(
  plan.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-OWNER-REVIEW: review owner evidence submission packet plan, no execution',
  'next prompt mismatch'
)

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(
  sourceReview.ownerReviewResult.futureOwnerEvidenceSubmissionPacketPlanMayProceed === true,
  'source submission packet readiness missing'
)
assert(sourceReview.ownerReviewResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourceReview.ownerReviewResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourceReview.ownerReviewResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourceReview.ownerReviewResult.dispatchContractApprovedToday === false, 'source dispatch approval must be false')

const schema = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-schema-register.md']
for (const key of [
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
  assert(Object.hasOwn(schema.plannedPacketSchema, key), `${key} schema field missing`)
}
for (const key of [
  'executionApprovalGranted',
  'serviceRolePayloadAllowed',
  'secretMaterialAllowed',
  'rawPromptAcceptedAsEvidence',
  'signedUrlAcceptedAsSourceOfTruth',
]) {
  assert(schema.plannedPacketSchema[key] === false, `${key} must be false`)
}
assert(schema.schemaStateToday.submissionPacketSchemaPlanned === true, 'schema planned flag missing')
assert(schema.schemaStateToday.requiredFieldCount === 10, 'required field count mismatch')
assert(schema.schemaStateToday.submittedEvidenceCountToday === 0, 'schema submitted evidence must be zero')
assert(schema.schemaStateToday.acceptedEvidenceCountToday === 0, 'schema accepted evidence must be zero')
assert(schema.schemaStateToday.executionApprovalsGrantedToday === 'none', 'schema execution approvals must be none')
assert(schema.schemaStateToday.dispatchContractApprovedToday === false, 'schema dispatch approval must be false')
assert(schema.schemaStateToday.workerExecutionApprovedToday === false, 'schema worker execution must be false')
assert(schema.schemaStateToday.supabaseSqlApprovedToday === false, 'schema Supabase SQL must be false')

const rows = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-row-register.md']
assert(rows.plannedOwnerSubmissionRows.length === 7, 'owner submission row count mismatch')
for (const owner of ownerAreas) {
  const row = rows.plannedOwnerSubmissionRows.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} submission row missing`)
  assert(row.submissionStatusToday === 'not_submitted', `${owner} must not be submitted`)
  assert(row.grantsExecutionApprovalToday === false, `${owner} must not grant execution approval`)
}
assert(rows.ownerRowSummary.ownerSubmissionRowsPlanned === true, 'owner rows planned flag missing')
assert(rows.ownerRowSummary.plannedSubmissionRowCount === 7, 'planned submission row count mismatch')
assert(rows.ownerRowSummary.submittedEvidenceCountToday === 0, 'row submitted evidence must be zero')
assert(rows.ownerRowSummary.acceptedEvidenceCountToday === 0, 'row accepted evidence must be zero')
assert(rows.ownerRowSummary.completedOwnerSignoffCountToday === 0, 'row signoffs must be zero')
assert(rows.ownerRowSummary.executionApprovalsGrantedToday === 'none', 'row execution approvals must be none')
assert(rows.ownerRowSummary.dispatchContractApprovedToday === false, 'row dispatch approval must be false')

const validation = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-validation-policy.md']
for (const [key, value] of Object.entries(validation.validationPolicy)) {
  assert(value === true, `${key} must be true`)
}
assert(validation.validationStateToday.submissionValidationPolicyPlanned === true, 'validation planned flag missing')
assert(validation.validationStateToday.submittedEvidenceCountToday === 0, 'validation submitted evidence must be zero')
assert(validation.validationStateToday.acceptedEvidenceCountToday === 0, 'validation accepted evidence must be zero')
assert(validation.validationStateToday.completedOwnerSignoffCountToday === 0, 'validation signoffs must be zero')
assert(validation.validationStateToday.closedGapCountToday === 0, 'validation closed gaps must be zero')
assert(validation.validationStateToday.executionApprovalsGrantedToday === 'none', 'validation execution approvals must be none')
assert(validation.validationStateToday.dispatchContractApprovedToday === false, 'validation dispatch approval must be false')
assert(validation.validationStateToday.runtimeReadinessClaimedToday === false, 'validation runtime readiness must be false')
assert(validation.validationStateToday.betaProductionReadinessClaimedToday === false, 'validation beta/prod readiness must be false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-blocker-carry-forward-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'owner_evidence_submission_packet_plan_pending'),
  'submission packet pending blocker resolution missing'
)
assert(blockers.carriedForwardBlockers.length === 7, 'carried blocker count mismatch')
assert(blockers.carryForwardState.blockersCarriedForward === true, 'blockers carried flag missing')
assert(blockers.carryForwardState.carriedForwardBlockerCount === 7, 'carried blocker count field mismatch')
assert(blockers.carryForwardState.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(blockers.carryForwardState.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(blockers.carryForwardState.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(blockers.carryForwardState.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(blockers.carryForwardState.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
assert(blockers.carryForwardState.dispatchContractApprovedToday === false, 'blocker dispatch must be false')
assert(blockers.carryForwardState.workerExecutionApprovedToday === false, 'blocker worker execution must be false')
assert(blockers.carryForwardState.runtimeReadinessClaimedToday === false, 'blocker runtime readiness must be false')
assert(blockers.carryForwardState.betaProductionReadinessClaimedToday === false, 'blocker beta/prod readiness must be false')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-claim-policy.md']
assertPacketClosedMap(policy.allowedClaims, 'allowedClaims')
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
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-owner-review.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require submission packet plan decision')
assert(nextPrompt.includes('Do not collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('approve the dispatch contract'), 'next prompt must mention dispatch approval block')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('submitted evidence count `0`'), 'next prompt must preserve submitted evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-packet-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr1023Verified: true,
  ownerEvidenceSubmissionPacketPlanCreated: true,
  plannedSubmissionRowCount: 7,
  requiredEvidenceItemCount: 7,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-OWNER-REVIEW: review owner evidence submission packet plan, no execution'
}, null, 2))
