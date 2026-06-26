import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-closure.md',
  gapReview: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review.md',
  gapSequence: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-sequence-register.md',
  criteriaReview: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-owner-review.md',
  schemaReview: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md',
  approvalReview: 'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review.md',
  signoffReview: 'docs/worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-review.md',
  collectionReview: 'docs/worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review.md',
}

const decision = 'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_gap_closure_completed_with_warnings_ready_for_claim_lease_lifecycle_gap_closure'
const gapReviewDecision = 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_gap_closure_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_closure'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-CLAIM-LEASE-LIFECYCLE-GAP-CLOSURE: close claim/lease lifecycle gap, no execution'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseJsonFence(relativePath, label) {
  const text = read(relativePath)
  const pattern = new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  assert(match, `Missing JSON fence ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update classification widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment classification widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase SQL classification widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migration classification widened`)
  assert(value?.nextAction === 'none', `${label} Supabase next action widened`)
}

function assertBoundary(value) {
  const allowedTrue = new Set([
    'workerDispatchContractPlanningGapClosed',
    'claimLeaseLifecycleGapClosureMayBePlanned',
    'internalSyntheticToolCallPlanningMayContinue',
  ])
  for (const [key, entry] of Object.entries(value)) {
    if (allowedTrue.has(key)) {
      assert(entry === true, `${key} should be true`)
    } else if (key === 'toolCandidateCount') {
      assert(entry === 15, 'boundary tool count mismatch')
    } else {
      assert(entry === false, `${key} must remain false`)
    }
  }
}

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-claim-policy')
const gapReview = parseJsonFence(files.gapReview, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review')
const gapSequence = parseJsonFence(files.gapSequence, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-sequence-register')
const criteriaReview = parseJsonFence(files.criteriaReview, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-owner-review')
const schemaReview = parseJsonFence(files.schemaReview, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review')
const approvalReview = parseJsonFence(files.approvalReview, 'worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-owner-review')
const signoffReview = parseJsonFence(files.signoffReview, 'worker-runtime-jobs-sound-cpu-dispatch-contract-signoff-evidence-owner-review')
const collectionReview = parseJsonFence(files.collectionReview, 'worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-closure-owner-review')
const promptText = read(files.nextPrompt)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === 'e01888b059bdf83fc38a10bafe8f58fb0b712415', 'source head mismatch')
assert(closure.sourceVerification.pr1063.mergeCommit === 'e01888b059bdf83fc38a10bafe8f58fb0b712415', 'PR #1063 merge commit mismatch')
assert(closure.sourceVerification.pr1063.decision === gapReviewDecision, 'PR #1063 decision mismatch')
assert(closure.gapClosureResult.closedGapId === 'worker_dispatch_contract', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 1, 'closed gap count should be one')
assert(closure.gapClosureResult.remainingGapCount === 7, 'remaining gap count mismatch')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
assert(closure.gapClosureResult.dispatchContractPlanningGapClosed === true, 'dispatch contract planning gap should close')
assert(closure.gapClosureResult.dispatchCriteriaEvidenceAccepted === true, 'criteria evidence missing')
assert(closure.gapClosureResult.dispatchSchemaEvidenceAccepted === true, 'schema evidence missing')
assert(closure.gapClosureResult.dispatchSignoffEvidenceAccepted === true, 'signoff evidence missing')
for (const [key, value] of Object.entries(closure.gapClosureResult)) {
  if (
    key === 'closedGapId' ||
    key === 'closedGapCountToday' ||
    key === 'remainingGapCount' ||
    key === 'toolCandidateCount' ||
    key === 'dispatchContractPlanningGapClosed' ||
    key === 'dispatchCriteriaEvidenceAccepted' ||
    key === 'dispatchSchemaEvidenceAccepted' ||
    key === 'dispatchSignoffEvidenceAccepted'
  ) continue
  if (key === 'executionApprovalsGrantedToday') {
    assert(value === 'none', 'execution approvals must be none')
  } else {
    assert(value === false, `${key} must remain false`)
  }
}
assert(closure.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(sourceRegister.decision === decision, 'source register decision mismatch')
assert(sourceRegister.sourceRows.length === 6, 'source row count mismatch')
for (const row of sourceRegister.sourceRows) {
  read(row.file)
  assert(row.acceptedForGapClosure === true, `${row.sourceId} not accepted`)
}
assert(sourceRegister.summary.sourceRowCount === 6, 'source row summary mismatch')
assert(sourceRegister.summary.acceptedSourceRowCount === 6, 'accepted row summary mismatch')
assert(sourceRegister.summary.acceptedForExecution === false, 'source register execution widened')

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'worker_dispatch_contract', 'acceptance gap mismatch')
assert(acceptance.acceptedClosure.acceptedForPlanningGapClosure === true, 'planning closure missing')
assert(acceptance.acceptedClosure.acceptedForDispatchExecution === false, 'dispatch execution widened')
assert(acceptance.acceptedClosure.acceptedForWorkerExecution === false, 'worker execution widened')
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.dispatchCriteriaCountAccepted === 8, 'criteria count mismatch')
assert(acceptance.acceptedCounts.retryTimeoutCancellationObservabilityCriteriaCountAccepted === 6, 'retry criteria count mismatch')
assert(acceptance.acceptedCounts.schemaSectionCountAccepted === 6, 'schema section count mismatch')
assert(acceptance.acceptedCounts.requiredOwnerSignoffCountAccepted === 7, 'signoff count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 1, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 7, 'accepted remaining gap count mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 1, 'closed gap list count mismatch')
assert(remaining.closedGaps[0].gapId === 'worker_dispatch_contract', 'remaining closed gap mismatch')
assert(remaining.closedGaps[0].closedForPlanningToday === true, 'closed gap should close for planning')
assert(remaining.closedGaps[0].executionApprovedToday === false, 'closed gap must not approve execution')
assert(remaining.remainingGaps.length === 7, 'remaining gap count mismatch')
assert(remaining.remainingGaps[0].gapId === 'claim_lease_lifecycle', 'next gap mismatch')
assert(remaining.remainingGaps[0].nextPromptMayProceed === true, 'claim/lease should be next')
for (const gap of remaining.remainingGaps) {
  assert(gap.closedToday === false, `${gap.gapId} must remain open`)
  if (gap.gapId !== 'claim_lease_lifecycle') {
    assert(gap.nextPromptMayProceed === false, `${gap.gapId} should wait`)
  }
}
assert(remaining.summary.closedGapCountToday === 1, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 7, 'remaining summary count mismatch')
assert(remaining.summary.nextPromptMayProceedCount === 1, 'remaining next count mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('worker dispatch contract planning gap closed'), 'allowed closure claim missing')
assert(claims.forbiddenClaims.includes('worker dispatch readiness'), 'worker dispatch readiness must be forbidden')
assert(claims.forbiddenClaims.includes('external beta readiness'), 'external beta readiness must be forbidden')
assert(claims.forbiddenClaims.includes('production readiness'), 'production readiness must be forbidden')
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(gapReview.decision === gapReviewDecision, 'gap review decision mismatch')
assert(gapReview.reviewResult.approvedNextClosureLane === 'worker_dispatch_contract', 'gap review next lane mismatch')
assert(gapReview.reviewResult.closedGapCountToday === 0, 'gap review closed count should be zero')
assert(gapSequence.gapSequence[0].gapId === 'worker_dispatch_contract', 'gap sequence first row mismatch')
assert(criteriaReview.decision === closure.sourceVerification.dispatchEvidence.criteriaOwnerReviewDecision, 'criteria review decision mismatch')
assert(criteriaReview.ownerReviewResult.dispatchCriteriaCountAccepted === 8, 'criteria count source mismatch')
assert(schemaReview.decision === closure.sourceVerification.dispatchEvidence.schemaOwnerReviewDecision, 'schema review decision mismatch')
assert(schemaReview.ownerReviewResult.schemaSectionCountAccepted === 6, 'schema count source mismatch')
assert(approvalReview.decision === closure.sourceVerification.dispatchEvidence.approvalClosureOwnerReviewDecision, 'approval review decision mismatch')
assert(approvalReview.ownerReviewResult.requiredOwnerSignoffCountAccepted === 7, 'signoff count source mismatch')
assert(signoffReview.decision === closure.sourceVerification.dispatchEvidence.signoffEvidenceOwnerReviewDecision, 'signoff review decision mismatch')
assert(collectionReview.decision === closure.sourceVerification.dispatchEvidence.collectionClosureOwnerReviewDecision, 'collection review decision mismatch')

for (const phrase of [
  'Do not run workers',
  'run routes',
  'run tools',
  'dispatch jobs',
  'claim leases',
  'touch Supabase',
  'execute SQL',
  'unlock beta',
  'unlock production',
  'same-head and same-purpose open PRs',
]) {
  assert(promptText.includes(phrase), `next prompt missing phrase: ${phrase}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_gap_closure_diagnostics_passed',
      decision: closure.decision,
      sourceHead: closure.sourceVerification.sourceHead,
      closedGapId: closure.gapClosureResult.closedGapId,
      closedGapCountToday: closure.gapClosureResult.closedGapCountToday,
      remainingGapCount: closure.gapClosureResult.remainingGapCount,
      toolCandidateCount: closure.gapClosureResult.toolCandidateCount,
      workerDispatchAllowed: closure.gapClosureResult.workerDispatchApprovedToday,
      nextPrompt: closure.nextPrompt,
    },
    null,
    2,
  ),
)
