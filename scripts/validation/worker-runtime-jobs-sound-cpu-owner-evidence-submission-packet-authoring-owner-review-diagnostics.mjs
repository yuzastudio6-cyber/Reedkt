import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_authoring'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_plan_completed_with_warnings_ready_for_packet_authoring_owner_review'
const priorDecision =
  'worker_runtime_jobs_sound_cpu_owner_evidence_submission_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_authoring_plan'
const sourceHead = '94a4ae7bf74c829254e55dbb2e3d725e5aebcc2e'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-file-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-guidance-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-validation-policy-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-owner-claim-policy.md',
]

const packetFiles = [
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-worker-runtime-jobs.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-sound-runtime-media.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-supabase-boundary.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-artifact-delivery.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-billing-credits.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-compliance-security.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-product-beta-readiness.md',
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

function assertCountsAndClosures(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (
      [
        'ownerEvidencePacketAuthoringPlanAcceptedForFuturePacketAuthoring',
        'plannedPacketFilesAccepted',
        'ownerAuthoringGuidanceAccepted',
        'packetValidationPolicyAccepted',
        'blockerCarryForwardAccepted',
        'claimPolicyAccepted',
        'futureOwnerEvidencePacketAuthoringMayProceed',
        'sourceDecisionAccepted',
        'acceptedForOwnerEvidencePacketAuthoringOnly',
        'futurePacketFilesAcceptedForAuthoring',
        'authoringGuidanceAcceptedForFuturePacketAuthoring',
        'packetValidationPolicyAcceptedForFuturePacketAuthoring',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (
      ['requiredOwnerAreaCountAccepted', 'plannedPacketFileCountAccepted', 'requiredEvidenceItemCountAccepted'].includes(
        key
      )
    ) {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (key === 'requiredSectionCountAccepted') {
      assert(value === 7, `${context}.${key} must be 7`)
    } else if (key === 'forbiddenInputCountAccepted') {
      assert(value === 8, `${context}.${key} must be 8`)
    } else if (key === 'acceptedValidationCheckCount') {
      assert(value === 10, `${context}.${key} must be 10`)
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1039.status === 'merged', 'PR #1039 status mismatch')
assert(review.sourceVerification.pr1039.mergeCommit === sourceHead, 'PR #1039 merge commit mismatch')
assert(review.sourceVerification.pr1039.decision === sourceDecision, 'PR #1039 decision mismatch')
assert(review.sourceVerification.pr1036.decision === priorDecision, 'PR #1036 decision mismatch')
assertCountsAndClosures(review.ownerReviewResult, 'ownerReviewResult')
assert(
  review.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-AUTHORING: author owner evidence packet shells, no execution',
  'next prompt mismatch'
)

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-plan.md'
)
assert(sourcePlan.decision === sourceDecision, 'source authoring plan decision mismatch')
assert(sourcePlan.sourceVerification.pr1036.decision === priorDecision, 'source prior decision mismatch')
assert(sourcePlan.authoringPlanResult.futurePacketAuthoringOwnerReviewMayProceed === true, 'source owner-review readiness missing')
assert(sourcePlan.authoringPlanResult.authoredEvidencePacketCountToday === 0, 'source authored evidence must be zero')
assert(sourcePlan.authoringPlanResult.collectedEvidenceCountToday === 0, 'source collected evidence must be zero')
assert(sourcePlan.authoringPlanResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourcePlan.authoringPlanResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourcePlan.authoringPlanResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourcePlan.authoringPlanResult.dispatchContractApprovedToday === false, 'source dispatch approval must be false')

const acceptance =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-acceptance-register.md']
assertCountsAndClosures(acceptance.acceptedAuthoringPlan, 'acceptedAuthoringPlan')

const fileRegister =
  parsed[
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-file-owner-review-register.md'
  ]
assert(fileRegister.acceptedFuturePacketFiles.length === 7, 'future packet file count mismatch')
for (const path of packetFiles) {
  assert(fileRegister.acceptedFuturePacketFiles.includes(path), `${path} accepted packet file missing`)
}
assertCountsAndClosures(fileRegister.fileReviewResult, 'fileReviewResult')

const guidance =
  parsed[
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-guidance-owner-review-register.md'
  ]
assert(guidance.acceptedRequiredSections.length === 7, 'accepted required section count mismatch')
assert(guidance.acceptedForbiddenInputs.length === 8, 'accepted forbidden input count mismatch')
for (const item of ['secret_material', 'service_role_payload', 'raw_prompt_as_evidence', 'runtime_generated_artifact']) {
  assert(guidance.acceptedForbiddenInputs.includes(item), `${item} forbidden input missing`)
}
assertCountsAndClosures(guidance.guidanceReviewResult, 'guidanceReviewResult')

const validation =
  parsed[
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-validation-policy-owner-review-register.md'
  ]
assert(validation.acceptedValidationChecks.length === 10, 'accepted validation check count mismatch')
assert(validation.acceptedValidationChecks.includes('package_lock_remains_unchanged'), 'package-lock check missing')
assertCountsAndClosures(validation.validationPolicyReviewResult, 'validationPolicyReviewResult')

const blockers =
  parsed[
    'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-blocker-follow-up-register.md'
  ]
assert(
  blockers.resolvedForPlanning.some(
    (row) => row.blockerId === 'owner_evidence_submission_packet_authoring_owner_review_pending'
  ),
  'authoring owner-review blocker resolution missing'
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'owner_evidence_packet_authoring_pending'),
  'owner evidence packet authoring pending blocker missing'
)
assert(blockers.authoredEvidencePacketCountToday === 0, 'blocker authored evidence must be zero')
assert(blockers.collectedEvidenceCountToday === 0, 'blocker collected evidence must be zero')
assert(blockers.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(blockers.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(blockers.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(blockers.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(blockers.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
for (const flag of [
  'dispatchContractApprovedToday',
  'workerDispatchApprovedToday',
  'claimLeaseApprovedToday',
  'workerExecutionApprovedToday',
  'runtimeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseSqlApprovedToday',
  'artifactDeliveryApprovedToday',
  'billingBetaProductionApprovedToday',
  'runtimeReadinessClaimedToday',
  'betaProductionReadinessClaimedToday',
]) {
  assert(blockers[flag] === false, `blocker ${flag} must be false`)
}

const policy =
  parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-owner-claim-policy.md']
assertCountsAndClosures(policy.allowedClaims, 'allowedClaims')
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'owner_evidence_packet_authored',
  'owner_evidence_collected',
  'owner_evidence_submitted',
  'owner_evidence_accepted',
  'dispatch_contract_approved',
  'worker_execution_enabled',
  'runtime_readiness_passed',
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
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('submit evidence'), 'next prompt must block evidence submission')
assert(nextPrompt.includes('accept evidence'), 'next prompt must block evidence acceptance')
assert(nextPrompt.includes('approve dispatch contracts'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('collected evidence count `0`'), 'next prompt must preserve collected evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-owner-evidence-submission-packet-authoring-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-authoring-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_authoring_owner_review_diagnostics_passed',
      decision,
      sourceHead,
      pr1039Verified: true,
      ownerEvidencePacketAuthoringPlanAcceptedForFuturePacketAuthoring: true,
      futureOwnerEvidencePacketAuthoringMayProceed: true,
      plannedPacketFileCountAccepted: 7,
      requiredEvidenceItemCountAccepted: 7,
      authoredEvidencePacketCountToday: 0,
      collectedEvidenceCountToday: 0,
      submittedEvidenceCountToday: 0,
      acceptedEvidenceCountToday: 0,
      completedOwnerSignoffCountToday: 0,
      closedGapCountToday: 0,
      executionApprovalsGrantedToday: 'none',
      dispatchContractApprovedToday: false,
      workerExecutionApprovedToday: false,
      runtimeExecutionApprovedToday: false,
      supabaseSqlApprovedToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-AUTHORING: author owner evidence packet shells, no execution',
    },
    null,
    2
  )
)
