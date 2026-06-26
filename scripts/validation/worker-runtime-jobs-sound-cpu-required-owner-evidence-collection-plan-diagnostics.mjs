import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_plan_completed_with_warnings_ready_for_required_owner_evidence_collection_owner_review'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_owner_review_passed_with_warnings_ready_for_required_owner_evidence_collection_plan'
const closurePlanDecision =
  'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_plan_completed_with_warnings_ready_for_collection_closure_owner_review'
const sourceHead = 'db9c197d602a5b6dc7a92009b4aa2d4775eee031'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-source-register.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-checklist.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-gap-register.md',
  'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-blocker-carry-forward-register.md',
  'docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-claim-policy.md',
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

function assertCollectionClosedMap(map, context) {
  for (const [key, value] of Object.entries(map)) {
    if (
      [
        'requiredOwnerEvidenceCollectionPlanCreated',
        'requiredOwnerEvidenceSourcesPlanned',
        'ownerEvidenceChecklistCreated',
        'ownerEvidenceGapRegisterCreated',
        'ownerEvidenceSubmissionPolicyCreated',
        'blockersCarriedForward',
        'futureRequiredOwnerEvidenceCollectionOwnerReviewMayProceed',
      ].includes(key)
    ) {
      assert(value === true, `${context}.${key} must be true`)
    } else if (['requiredOwnerAreaCount', 'requiredEvidenceItemCount', 'openEvidenceGapCount'].includes(key)) {
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

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr1020.status === 'merged', 'PR #1020 status mismatch')
assert(plan.sourceVerification.pr1020.mergeCommit === sourceHead, 'PR #1020 merge commit mismatch')
assert(plan.sourceVerification.pr1020.decision === sourceDecision, 'PR #1020 decision mismatch')
assert(plan.sourceVerification.pr1017.decision === closurePlanDecision, 'PR #1017 decision mismatch')
assertCollectionClosedMap(plan.collectionPlanResult, 'collectionPlanResult')
assert(
  plan.nextPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-REQUIRED-OWNER-EVIDENCE-COLLECTION-OWNER-REVIEW: review required owner evidence collection plan, no execution',
  'next prompt mismatch'
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review.md'
)
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(
  sourceReview.ownerReviewResult.futureRequiredOwnerEvidenceCollectionPlanMayProceed === true,
  'source future evidence collection readiness missing'
)
assert(sourceReview.ownerReviewResult.completedOwnerSignoffCountToday === 0, 'source signoffs must be zero')
assert(sourceReview.ownerReviewResult.closedGapCountToday === 0, 'source closed gaps must be zero')
assert(sourceReview.ownerReviewResult.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')
assert(sourceReview.ownerReviewResult.dispatchContractApprovedToday === false, 'source dispatch must not be approved')

const sources = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-source-register.md']
assert(sources.requiredEvidenceSources.length === 7, 'required evidence source count mismatch')
for (const owner of ownerAreas) {
  const row = sources.requiredEvidenceSources.find((entry) => entry.ownerArea === owner)
  assert(row, `${owner} evidence source missing`)
  assert(row.evidenceStatusToday === 'not_collected', `${owner} evidence must not be collected`)
  assert(row.mayApproveExecutionToday === false, `${owner} may not approve execution today`)
}
assert(sources.sourceSummary.requiredOwnerAreaCount === 7, 'source owner area count mismatch')
assert(sources.sourceSummary.requiredEvidenceItemCount === 7, 'source evidence item count mismatch')
assert(sources.sourceSummary.submittedEvidenceCountToday === 0, 'submitted evidence must be zero')
assert(sources.sourceSummary.acceptedEvidenceCountToday === 0, 'accepted evidence must be zero')
assert(sources.sourceSummary.executionApprovalsGrantedToday === 'none', 'source execution approvals must be none')

const checklist = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-checklist.md']
assert(checklist.collectionChecklist.length === 7, 'checklist count mismatch')
assert(checklist.checklistStateToday.ownerEvidenceChecklistCreated === true, 'checklist created flag missing')
assert(checklist.checklistStateToday.checklistItemCount === 7, 'checklist item count mismatch')
assert(checklist.checklistStateToday.completedChecklistItemCountToday === 0, 'completed checklist items must be zero')
assert(checklist.checklistStateToday.submittedEvidenceCountToday === 0, 'checklist submitted evidence must be zero')
assert(checklist.checklistStateToday.acceptedEvidenceCountToday === 0, 'checklist accepted evidence must be zero')
assert(checklist.checklistStateToday.completedOwnerSignoffCountToday === 0, 'checklist signoffs must be zero')
assert(checklist.checklistStateToday.closedGapCountToday === 0, 'checklist closed gaps must be zero')
assert(checklist.checklistStateToday.executionApprovalsGrantedToday === 'none', 'checklist execution approvals must be none')
assert(checklist.checklistStateToday.dispatchContractApprovedToday === false, 'checklist dispatch approval must be false')
assert(checklist.checklistStateToday.workerExecutionApprovedToday === false, 'checklist worker execution must be false')
assert(checklist.checklistStateToday.runtimeReadinessClaimedToday === false, 'checklist runtime readiness must be false')
assert(checklist.checklistStateToday.betaProductionReadinessClaimedToday === false, 'checklist beta/prod readiness must be false')

const gaps = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-gap-register.md']
assert(gaps.ownerEvidenceGaps.length === 7, 'gap count mismatch')
assert(gaps.gapSummary.ownerEvidenceGapRegisterCreated === true, 'gap register created flag missing')
assert(gaps.gapSummary.openEvidenceGapCount === 7, 'open gap count mismatch')
assert(gaps.gapSummary.closedGapCountToday === 0, 'closed gaps must be zero')
assert(gaps.gapSummary.submittedEvidenceCountToday === 0, 'gap submitted evidence must be zero')
assert(gaps.gapSummary.acceptedEvidenceCountToday === 0, 'gap accepted evidence must be zero')
assert(gaps.gapSummary.completedOwnerSignoffCountToday === 0, 'gap owner signoffs must be zero')
assert(gaps.gapSummary.executionApprovalsGrantedToday === 'none', 'gap execution approvals must be none')
assert(gaps.gapSummary.dispatchContractApprovedToday === false, 'gap dispatch approval must be false')

const submission = parsed['docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-policy.md']
for (const [key, value] of Object.entries(submission.submissionPolicy)) {
  if (
    key === 'evidenceMustBeOwnerScoped' ||
    key === 'evidenceMustReferenceApprovedPlanSnapshot' ||
    key === 'evidenceMustKeepExecutionDisabledUntilReview'
  ) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(submission.submissionStateToday.submittedEvidenceCountToday === 0, 'submission evidence must be zero')
assert(submission.submissionStateToday.acceptedEvidenceCountToday === 0, 'accepted evidence must be zero')
assert(submission.submissionStateToday.completedOwnerSignoffCountToday === 0, 'submission signoffs must be zero')
assert(submission.submissionStateToday.executionApprovalsGrantedToday === 'none', 'submission execution approvals must be none')
assert(submission.submissionStateToday.dispatchContractApprovedToday === false, 'submission dispatch approval must be false')
assert(submission.submissionStateToday.workerDispatchApprovedToday === false, 'submission worker dispatch must be false')
assert(submission.submissionStateToday.workerExecutionApprovedToday === false, 'submission worker execution must be false')
assert(submission.submissionStateToday.supabaseSqlApprovedToday === false, 'submission Supabase SQL must be false')
assert(submission.submissionStateToday.artifactDeliveryApprovedToday === false, 'submission artifact delivery must be false')
assert(submission.submissionStateToday.billingBetaProductionApprovedToday === false, 'submission billing beta prod must be false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-blocker-carry-forward-register.md']
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'required_owner_evidence_collection_plan_pending'),
  'owner evidence collection pending blocker resolution missing'
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

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-claim-policy.md']
assertCollectionClosedMap(policy.allowedClaims, 'allowedClaims')
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
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-owner-review.md'
)
assert(nextPrompt.includes(decision), 'next prompt must require evidence collection plan decision')
assert(nextPrompt.includes('Do not approve the dispatch contract'), 'next prompt must block dispatch approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('submitted evidence count `0`'), 'next prompt must preserve submitted evidence zero')
assert(nextPrompt.includes('execution approvals `none`'), 'next prompt must preserve execution approvals none')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-required-owner-evidence-collection-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-required-owner-evidence-collection-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_required_owner_evidence_collection_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr1020Verified: true,
  requiredOwnerEvidenceCollectionPlanCreated: true,
  requiredOwnerAreaCount: 7,
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
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-REQUIRED-OWNER-EVIDENCE-COLLECTION-OWNER-REVIEW: review required owner evidence collection plan, no execution'
}, null, 2))
