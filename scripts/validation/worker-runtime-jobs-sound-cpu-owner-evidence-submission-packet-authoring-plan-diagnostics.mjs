import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_plan_completed_with_warnings_ready_for_packet_authoring_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_authoring_plan'
const priorDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_plan_completed_with_warnings_ready_for_owner_evidence_submission_owner_review'
const sourceHead = 'eec530d86f5e1b14239bd07223c66890cf8a949d'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-file-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-guidance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-validation-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-claim-policy.md',
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
        'ownerEvidencePacketAuthoringPlanCreated',
        'packetFilesPlanned',
        'ownerAuthoringGuidancePlanned',
        'packetValidationPolicyPlanned',
        'blockersCarriedForward',
        'futurePacketAuthoringOwnerReviewMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (['requiredOwnerAreaCount', 'plannedPacketFileCount', 'requiredEvidenceItemCount'].includes(key)) {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (
      key === 'authoredEvidencePacketCountToday' ||
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

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr1036.status === 'merged', 'PR #1036 status mismatch')
assert(plan.sourceVerification.pr1036.mergeCommit === sourceHead, 'PR #1036 merge commit mismatch')
assert(plan.sourceVerification.pr1036.decision === sourceDecision, 'PR #1036 decision mismatch')
assert(plan.sourceVerification.pr1034.decision === priorDecision, 'PR #1034 decision mismatch')
assertClosedMap(plan.authoringPlanResult, 'authoringPlanResult')
assert(
  plan.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-AUTHORING-OWNER-REVIEW: review owner evidence packet authoring plan, no execution',
  'next prompt mismatch'
)

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(
  sourceReview.ownerReviewResult.futureOwnerEvidenceSubmissionPacketAuthoringPlanMayProceed === true,
  'source packet authoring readiness missing'
)
assert(sourceReview.ownerReviewResult.collectedEvidenceCountToday === 0, 'source collected evidence must be zero')
assert(sourceReview.ownerReviewResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourceReview.ownerReviewResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourceReview.ownerReviewResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourceReview.ownerReviewResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourceReview.ownerReviewResult.dispatchContractApprovedToday === false, 'source dispatch approval must be false')

const files = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-file-register.md']
assert(files.plannedPacketFiles.length === 7, 'planned packet file count mismatch')
for (const owner of ownerAreas) {
  const row = files.plannedPacketFiles.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} planned packet file missing`)
  assert(row.plannedFile.startsWith('docs/'), `${owner} planned file must be docs scoped`)
  assert(row.authoredToday === false, `${owner} authored today must be false`)
  assert(row.submittedToday === false, `${owner} submitted today must be false`)
  assert(row.acceptedToday === false, `${owner} accepted today must be false`)
}
assert(files.fileRegisterSummary.packetFilesPlanned === true, 'packet files planned flag missing')
assert(files.fileRegisterSummary.plannedPacketFileCount === 7, 'planned packet file count field mismatch')
assert(files.fileRegisterSummary.requiredOwnerAreaCount === 7, 'required owner area count mismatch')
assert(files.fileRegisterSummary.authoredEvidencePacketCountToday === 0, 'file authored count must be zero')
assert(files.fileRegisterSummary.collectedEvidenceCountToday === 0, 'file collected evidence must be zero')
assert(files.fileRegisterSummary.submittedEvidenceCountToday === 0, 'file submitted evidence must be zero')
assert(files.fileRegisterSummary.acceptedEvidenceCountToday === 0, 'file accepted evidence must be zero')
assert(files.fileRegisterSummary.executionApprovalsGrantedToday === 'none', 'file execution approvals must be none')
assert(files.fileRegisterSummary.dispatchContractApprovedToday === false, 'file dispatch approval must be false')

const guidance =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-guidance-register.md']
assert(guidance.requiredOwnerPacketSections.length === 7, 'required section count mismatch')
assert(guidance.forbiddenPacketInputs.length === 8, 'forbidden input count mismatch')
assert(guidance.guidanceStateToday.ownerAuthoringGuidancePlanned === true, 'authoring guidance planned flag missing')
assert(guidance.guidanceStateToday.requiredSectionCount === 7, 'required section count field mismatch')
assert(guidance.guidanceStateToday.forbiddenInputCount === 8, 'forbidden input count field mismatch')
assert(guidance.guidanceStateToday.authoredEvidencePacketCountToday === 0, 'guidance authored count must be zero')
assert(guidance.guidanceStateToday.collectedEvidenceCountToday === 0, 'guidance collected evidence must be zero')
assert(guidance.guidanceStateToday.submittedEvidenceCountToday === 0, 'guidance submitted evidence must be zero')
assert(guidance.guidanceStateToday.acceptedEvidenceCountToday === 0, 'guidance accepted evidence must be zero')
assert(guidance.guidanceStateToday.executionApprovalsGrantedToday === 'none', 'guidance execution approvals must be none')
assert(guidance.guidanceStateToday.workerExecutionApprovedToday === false, 'guidance worker execution must be false')
assert(guidance.guidanceStateToday.runtimeReadinessClaimedToday === false, 'guidance runtime readiness must be false')

const validation =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-validation-policy.md']
for (const [key, value] of Object.entries(validation.validationPolicy)) {
  assert(value === true, `${key} must be true`)
}
assert(validation.validationStateToday.packetValidationPolicyPlanned === true, 'validation policy planned flag missing')
assert(validation.validationStateToday.authoredEvidencePacketCountToday === 0, 'validation authored count must be zero')
assert(validation.validationStateToday.collectedEvidenceCountToday === 0, 'validation collected evidence must be zero')
assert(validation.validationStateToday.submittedEvidenceCountToday === 0, 'validation submitted evidence must be zero')
assert(validation.validationStateToday.acceptedEvidenceCountToday === 0, 'validation accepted evidence must be zero')
assert(validation.validationStateToday.completedOwnerSignoffCountToday === 0, 'validation signoffs must be zero')
assert(validation.validationStateToday.closedGapCountToday === 0, 'validation closed gaps must be zero')
assert(validation.validationStateToday.executionApprovalsGrantedToday === 'none', 'validation execution approvals must be none')
assert(validation.validationStateToday.dispatchContractApprovedToday === false, 'validation dispatch approval must be false')
assert(validation.validationStateToday.runtimeReadinessClaimedToday === false, 'validation runtime readiness must be false')
assert(validation.validationStateToday.betaProductionReadinessClaimedToday === false, 'validation beta/prod readiness must be false')

const blockers =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-blocker-register.md']
assert(
  blockers.resolvedForPlanning.some(
    (row) => row.blockerId === 'owner_evidence_submission_packet_authoring_plan_pending'
  ),
  'packet authoring plan blocker resolution missing'
)
assert(blockers.carriedForwardBlockers.length === 7, 'carried blocker count mismatch')
assert(blockers.blockerState.blockersCarriedForward === true, 'blockers carried flag missing')
assert(blockers.blockerState.carriedForwardBlockerCount === 7, 'carried blocker count field mismatch')
assert(blockers.blockerState.authoredEvidencePacketCountToday === 0, 'blocker authored count must be zero')
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

const policy =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-claim-policy.md']
assertClosedMap(policy.allowedClaims, 'allowedClaims')
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'owner_evidence_packet_authored',
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
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-owner-review.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require packet authoring decision')
assert(nextPrompt.includes('Do not author evidence packets'), 'next prompt must block evidence packet authoring')
assert(nextPrompt.includes('collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('submit evidence'), 'next prompt must block evidence submission')
assert(nextPrompt.includes('accept evidence'), 'next prompt must block evidence acceptance')
assert(nextPrompt.includes('approve dispatch contracts'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('authored evidence packet count `0`'), 'next prompt must preserve authored packet zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-packet-authoring-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr1036Verified: true,
  ownerEvidencePacketAuthoringPlanCreated: true,
  plannedPacketFileCount: 7,
  requiredEvidenceItemCount: 7,
  authoredEvidencePacketCountToday: 0,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-AUTHORING-OWNER-REVIEW: review owner evidence packet authoring plan, no execution'
}, null, 2))
