import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-sound-runtime-media-gap-closure.md',
  dispatchGap: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure.md',
  dispatchRemaining: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-remaining-register.md',
  claimLease: 'docs/worker-runtime-jobs-sound-cpu-dispatch-claim-lease-owner-register.md',
  retryObservability: 'docs/worker-runtime-jobs-sound-cpu-retry-timeout-cancellation-observability-owner-register.md',
  executionPreconditions: 'docs/worker-runtime-jobs-sound-cpu-dispatch-execution-approval-precondition-register.md',
}

const decision = 'worker_runtime_jobs_sound_cpu_claim_lease_lifecycle_gap_closure_completed_with_warnings_ready_for_sound_runtime_media_gap_closure'
const dispatchGapDecision = 'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_gap_closure_completed_with_warnings_ready_for_claim_lease_lifecycle_gap_closure'
const criteriaDecision = 'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_criteria_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_schema_plan'
const preconditionDecision = 'worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_plan_completed_with_warnings_ready_for_collection_closure_owner_review'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-SOUND-RUNTIME-MEDIA-GAP-CLOSURE: close SOUND runtime/media gap, no execution'

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
    'claimLeaseLifecyclePlanningGapClosed',
    'soundRuntimeMediaGapClosureMayBePlanned',
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

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-claim-lease-lifecycle-gap-claim-policy')
const dispatchGap = parseJsonFence(files.dispatchGap, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure')
const dispatchRemaining = parseJsonFence(files.dispatchRemaining, 'worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-remaining-register')
const claimLease = parseJsonFence(files.claimLease, 'worker-runtime-jobs-sound-cpu-dispatch-claim-lease-owner-register')
const retryObservability = parseJsonFence(files.retryObservability, 'worker-runtime-jobs-sound-cpu-retry-timeout-cancellation-observability-owner-register')
const executionPreconditions = parseJsonFence(files.executionPreconditions, 'worker-runtime-jobs-sound-cpu-dispatch-execution-approval-precondition-register')
const promptText = read(files.nextPrompt)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === '3e2b270bb1f949de2aceb90ee254f9189d88426a', 'source head mismatch')
assert(closure.sourceVerification.pr1066.mergeCommit === '3e2b270bb1f949de2aceb90ee254f9189d88426a', 'PR #1066 merge commit mismatch')
assert(closure.sourceVerification.pr1066.decision === dispatchGapDecision, 'PR #1066 decision mismatch')
assert(closure.gapClosureResult.closedGapId === 'claim_lease_lifecycle', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 2, 'closed gap count should be two')
assert(closure.gapClosureResult.remainingGapCount === 6, 'remaining gap count mismatch')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
assert(closure.gapClosureResult.workerDispatchContractPlanningGapClosed === true, 'dispatch contract planning gap should remain closed')
assert(closure.gapClosureResult.claimLeaseLifecyclePlanningGapClosed === true, 'claim/lease lifecycle gap should close')
assert(closure.gapClosureResult.dispatchClaimLeaseCriteriaAccepted === true, 'claim/lease criteria missing')
assert(closure.gapClosureResult.retryTimeoutCancellationObservabilityCriteriaAccepted === true, 'retry/observability criteria missing')
assert(closure.gapClosureResult.executionPreconditionsAccepted === true, 'execution preconditions missing')
for (const [key, value] of Object.entries(closure.gapClosureResult)) {
  if (
    key === 'closedGapId' ||
    key === 'closedGapCountToday' ||
    key === 'remainingGapCount' ||
    key === 'toolCandidateCount' ||
    key === 'workerDispatchContractPlanningGapClosed' ||
    key === 'claimLeaseLifecyclePlanningGapClosed' ||
    key === 'dispatchClaimLeaseCriteriaAccepted' ||
    key === 'retryTimeoutCancellationObservabilityCriteriaAccepted' ||
    key === 'executionPreconditionsAccepted'
  ) continue
  if (key === 'executionApprovalsGrantedToday') {
    assert(value === 'none', 'execution approvals must be none')
  } else {
    assert(value === false, `${key} must remain false`)
  }
}
assert(closure.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(sourceRegister.decision === decision, 'source register decision mismatch')
assert(sourceRegister.sourceRows.length === 4, 'source row count mismatch')
for (const row of sourceRegister.sourceRows) {
  read(row.file)
  assert(row.acceptedForGapClosure === true, `${row.sourceId} not accepted`)
}
assert(sourceRegister.summary.sourceRowCount === 4, 'source row summary mismatch')
assert(sourceRegister.summary.acceptedSourceRowCount === 4, 'accepted row summary mismatch')
assert(sourceRegister.summary.acceptedForExecution === false, 'source register execution widened')

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'claim_lease_lifecycle', 'acceptance gap mismatch')
assert(acceptance.acceptedClosure.acceptedForPlanningGapClosure === true, 'planning closure missing')
assert(acceptance.acceptedClosure.acceptedForClaimLeaseExecution === false, 'claim/lease execution widened')
assert(acceptance.acceptedClosure.acceptedForWorkerDispatch === false, 'worker dispatch widened')
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.dispatchClaimLeaseCriteriaCountAccepted === 8, 'claim/lease criteria count mismatch')
assert(acceptance.acceptedCounts.retryTimeoutCancellationObservabilityCriteriaCountAccepted === 6, 'retry/observability count mismatch')
assert(acceptance.acceptedCounts.executionApprovalPreconditionCountAccepted === 6, 'precondition count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 2, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 6, 'accepted remaining gap count mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 2, 'closed gap list count mismatch')
assert(remaining.closedGaps[0].gapId === 'worker_dispatch_contract', 'first closed gap mismatch')
assert(remaining.closedGaps[1].gapId === 'claim_lease_lifecycle', 'second closed gap mismatch')
for (const gap of remaining.closedGaps) {
  assert(gap.closedForPlanningToday === true, `${gap.gapId} should close for planning`)
  assert(gap.executionApprovedToday === false, `${gap.gapId} must not approve execution`)
}
assert(remaining.remainingGaps.length === 6, 'remaining gap count mismatch')
assert(remaining.remainingGaps[0].gapId === 'sound_runtime_media', 'next gap mismatch')
assert(remaining.remainingGaps[0].nextPromptMayProceed === true, 'SOUND runtime/media should be next')
for (const gap of remaining.remainingGaps) {
  assert(gap.closedToday === false, `${gap.gapId} must remain open`)
  if (gap.gapId !== 'sound_runtime_media') {
    assert(gap.nextPromptMayProceed === false, `${gap.gapId} should wait`)
  }
}
assert(remaining.summary.closedGapCountToday === 2, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 6, 'remaining summary count mismatch')
assert(remaining.summary.nextPromptMayProceedCount === 1, 'remaining next count mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('claim/lease lifecycle planning gap closed'), 'allowed closure claim missing')
assert(claims.forbiddenClaims.includes('claim/lease readiness'), 'claim/lease readiness must be forbidden')
assert(claims.forbiddenClaims.includes('external beta readiness'), 'external beta readiness must be forbidden')
assert(claims.forbiddenClaims.includes('production readiness'), 'production readiness must be forbidden')
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(dispatchGap.decision === dispatchGapDecision, 'dispatch gap decision mismatch')
assert(dispatchGap.gapClosureResult.closedGapCountToday === 1, 'dispatch source closed gap count mismatch')
assert(dispatchRemaining.remainingGaps[0].gapId === 'claim_lease_lifecycle', 'dispatch source next gap mismatch')
assert(claimLease.decision === criteriaDecision, 'claim lease source decision mismatch')
assert(claimLease.dispatchClaimLeaseOwnerReview.length === 8, 'claim lease criteria count mismatch')
for (const row of claimLease.dispatchClaimLeaseOwnerReview) {
  assert(row.ownerDisposition === 'accepted_for_future_schema_planning', `${row.criteriaId} disposition mismatch`)
}
assert(claimLease.claimLeaseApprovedToday === false, 'claim lease source widened')
assert(retryObservability.decision === criteriaDecision, 'retry source decision mismatch')
assert(retryObservability.retryTimeoutCancellationObservabilityOwnerReview.length === 6, 'retry source criteria count mismatch')
assert(retryObservability.workerExecutionApprovedToday === false, 'retry source worker execution widened')
assert(executionPreconditions.decision === preconditionDecision, 'precondition source decision mismatch')
assert(executionPreconditions.executionApprovalPreconditions.length === 6, 'precondition count mismatch')
assert(executionPreconditions.approvalStateToday.allPreconditionsSatisfiedToday === false, 'all preconditions cannot be satisfied')
assert(executionPreconditions.approvalStateToday.executionApprovalsGrantedToday === 'none', 'execution approvals source widened')

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
      status: 'worker_runtime_jobs_sound_cpu_claim_lease_lifecycle_gap_closure_diagnostics_passed',
      decision: closure.decision,
      sourceHead: closure.sourceVerification.sourceHead,
      closedGapId: closure.gapClosureResult.closedGapId,
      closedGapCountToday: closure.gapClosureResult.closedGapCountToday,
      remainingGapCount: closure.gapClosureResult.remainingGapCount,
      toolCandidateCount: closure.gapClosureResult.toolCandidateCount,
      claimLeaseAllowed: closure.gapClosureResult.claimLeaseApprovedToday,
      nextPrompt: closure.nextPrompt,
    },
    null,
    2,
  ),
)
