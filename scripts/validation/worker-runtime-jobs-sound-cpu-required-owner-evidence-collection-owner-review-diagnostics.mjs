import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_owner_review_passed_with_warnings_ready_for_owner_evidence_submission_packet_plan'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_plan_completed_with_warnings_ready_for_required_owner_evidence_collection_owner_review'
const priorOwnerDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_owner_review_passed_with_warnings_ready_for_required_owner_evidence_collection_plan'
const sourceHead = 'd9592c157826717c8eb67496df5ca3f41cdd35b2'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-source-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-gap-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-owner-review-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-claim-policy.md',
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
        'requiredOwnerEvidenceCollectionPlanAcceptedForSubmissionPacketPlanning',
        'futureOwnerEvidenceSubmissionPacketPlanMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (
      ['requiredOwnerAreaCountAccepted', 'requiredEvidenceItemCountAccepted', 'openEvidenceGapCountAccepted'].includes(
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1022.status === 'merged', 'PR #1022 status mismatch')
assert(review.sourceVerification.pr1022.mergeCommit === sourceHead, 'PR #1022 merge commit mismatch')
assert(review.sourceVerification.pr1022.decision === sourceDecision, 'PR #1022 decision mismatch')
assert(review.sourceVerification.pr1020.decision === priorOwnerDecision, 'PR #1020 decision mismatch')
assertOwnerReviewClosedMap(review.ownerReviewResult, 'ownerReviewResult')
assert(
  review.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-PLAN: plan owner evidence submission packet, no execution',
  'next prompt mismatch'
)

const sourcePlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-plan.md')
assert(sourcePlan.decision === sourceDecision, 'source collection plan decision mismatch')
assert(
  sourcePlan.collectionPlanResult.futureRequiredOwnerEvidenceCollectionOwnerReviewMayProceed === true,
  'source owner-review readiness missing'
)
assert(sourcePlan.collectionPlanResult.submittedEvidenceCountToday === 0, 'source submitted evidence must be zero')
assert(sourcePlan.collectionPlanResult.acceptedEvidenceCountToday === 0, 'source accepted evidence must be zero')
assert(sourcePlan.collectionPlanResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourcePlan.collectionPlanResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourcePlan.collectionPlanResult.dispatchContractApprovedToday === false, 'source dispatch must not be approved')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-acceptance-register.md']
assert(acceptance.acceptedCollectionPlan.sourceDecisionAccepted === true, 'source decision acceptance missing')
assert(
  acceptance.acceptedCollectionPlan.acceptedForOwnerEvidenceSubmissionPacketPlanningOnly === true,
  'submission-packet planning acceptance missing'
)
assert(acceptance.acceptedCollectionPlan.requiredOwnerAreaCountAccepted === 7, 'accepted owner area count mismatch')
assert(acceptance.acceptedCollectionPlan.requiredEvidenceItemCountAccepted === 7, 'accepted evidence item count mismatch')
assert(acceptance.acceptedCollectionPlan.openEvidenceGapCountAccepted === 7, 'accepted gap count mismatch')
for (const [key, value] of Object.entries(acceptance.acceptedCollectionPlan)) {
  if (key === 'sourceDecisionAccepted' || key === 'acceptedForOwnerEvidenceSubmissionPacketPlanningOnly') {
    assert(value === true, `${key} must be true`)
  } else if (
    key === 'requiredOwnerAreaCountAccepted' ||
    key === 'requiredEvidenceItemCountAccepted' ||
    key === 'openEvidenceGapCountAccepted'
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

const sources = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-source-owner-review-register.md']
assert(sources.acceptedOwnerAreas.length === 7, 'accepted owner area count mismatch')
for (const owner of ownerAreas) {
  assert(sources.acceptedOwnerAreas.includes(owner), `${owner} missing from accepted owner areas`)
}
assert(
  sources.sourceReviewResult.requiredOwnerEvidenceSourcesAcceptedForSubmissionPacketPlanning === true,
  'source review acceptance missing'
)
assert(sources.sourceReviewResult.requiredOwnerAreaCountAccepted === 7, 'source owner area count mismatch')
assert(sources.sourceReviewResult.requiredEvidenceItemCountAccepted === 7, 'source evidence item count mismatch')
assert(sources.sourceReviewResult.submittedEvidenceCountToday === 0, 'source review submitted evidence must be zero')
assert(sources.sourceReviewResult.acceptedEvidenceCountToday === 0, 'source review accepted evidence must be zero')
assert(sources.sourceReviewResult.executionApprovalsGrantedToday === 'none', 'source review execution approvals must be none')
assert(sources.sourceReviewResult.dispatchContractApprovedToday === false, 'source review dispatch approval must be false')
assert(sources.sourceReviewResult.workerExecutionApprovedToday === false, 'source review worker execution must be false')
assert(sources.sourceReviewResult.runtimeReadinessClaimedToday === false, 'source review runtime readiness must be false')
assert(sources.sourceReviewResult.betaProductionReadinessClaimedToday === false, 'source review beta/prod readiness must be false')

const gaps = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-gap-owner-review-register.md']
assert(gaps.acceptedEvidenceGaps.length === 7, 'accepted evidence gap count mismatch')
assert(gaps.gapReviewResult.ownerEvidenceGapsAcceptedForSubmissionPacketPlanning === true, 'gap acceptance missing')
assert(gaps.gapReviewResult.openEvidenceGapCountAccepted === 7, 'open gap count mismatch')
assert(gaps.gapReviewResult.closedGapCountToday === 0, 'gap closed count must be zero')
assert(gaps.gapReviewResult.submittedEvidenceCountToday === 0, 'gap submitted evidence must be zero')
assert(gaps.gapReviewResult.acceptedEvidenceCountToday === 0, 'gap accepted evidence must be zero')
assert(gaps.gapReviewResult.completedOwnerSignoffCountToday === 0, 'gap signoffs must be zero')
assert(gaps.gapReviewResult.executionApprovalsGrantedToday === 'none', 'gap execution approvals must be none')
assert(gaps.gapReviewResult.dispatchContractApprovedToday === false, 'gap dispatch approval must be false')

const submission = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-owner-review-policy.md']
for (const [key, value] of Object.entries(submission.acceptedSubmissionPolicy)) {
  if (
    key === 'evidenceMustBeOwnerScoped' ||
    key === 'evidenceMustReferenceApprovedPlanSnapshot' ||
    key === 'evidenceMustKeepExecutionDisabledUntilReview' ||
    key === 'acceptedForSubmissionPacketPlanningOnly'
  ) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(submission.submissionReviewStateToday.submittedEvidenceCountToday === 0, 'submission evidence must be zero')
assert(submission.submissionReviewStateToday.acceptedEvidenceCountToday === 0, 'accepted evidence must be zero')
assert(submission.submissionReviewStateToday.completedOwnerSignoffCountToday === 0, 'submission signoffs must be zero')
assert(submission.submissionReviewStateToday.executionApprovalsGrantedToday === 'none', 'submission execution approvals must be none')
assert(submission.submissionReviewStateToday.dispatchContractApprovedToday === false, 'submission dispatch approval must be false')
assert(submission.submissionReviewStateToday.workerExecutionApprovedToday === false, 'submission worker execution must be false')
assert(submission.submissionReviewStateToday.runtimeExecutionApprovedToday === false, 'submission runtime execution must be false')
assert(submission.submissionReviewStateToday.supabaseSqlApprovedToday === false, 'submission Supabase SQL must be false')
assert(submission.submissionReviewStateToday.artifactDeliveryApprovedToday === false, 'submission artifact must be false')
assert(submission.submissionReviewStateToday.billingBetaProductionApprovedToday === false, 'submission beta/prod must be false')

const blockers =
  parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-blocker-follow-up-register.md']
assert(
  blockers.resolvedForPlanning.some(
    (row) => row.blockerId === 'required_owner_evidence_collection_owner_review_pending'
  ),
  'owner review blocker resolution missing'
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'owner_evidence_submission_packet_plan_pending' && row.status === 'next'
  ),
  'next owner evidence submission blocker missing'
)
assert(blockers.submittedEvidenceCountToday === 0, 'blocker submitted evidence must be zero')
assert(blockers.acceptedEvidenceCountToday === 0, 'blocker accepted evidence must be zero')
assert(blockers.completedOwnerSignoffCountToday === 0, 'blocker signoffs must be zero')
assert(blockers.closedGapCountToday === 0, 'blocker closed gaps must be zero')
assert(blockers.executionApprovalsGrantedToday === 'none', 'blocker execution approvals must be none')
assert(blockers.dispatchContractApprovedToday === false, 'blocker dispatch approval must be false')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-claim-policy.md']
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not collect evidence'), 'next prompt must block evidence collection')
assert(nextPrompt.includes('Do not collect evidence, approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('submitted evidence count `0`'), 'next prompt must preserve submitted evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-required-owner-evidence-collection-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr1022Verified: true,
  requiredOwnerEvidenceCollectionPlanAcceptedForSubmissionPacketPlanning: true,
  futureOwnerEvidenceSubmissionPacketPlanMayProceed: true,
  requiredOwnerAreaCountAccepted: 7,
  requiredEvidenceItemCountAccepted: 7,
  openEvidenceGapCountAccepted: 7,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-OWNER-EVIDENCE-SUBMISSION-PACKET-PLAN: plan owner evidence submission packet, no execution'
}, null, 2))
