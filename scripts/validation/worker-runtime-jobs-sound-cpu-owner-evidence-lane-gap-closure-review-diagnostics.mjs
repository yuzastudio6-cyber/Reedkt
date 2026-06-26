import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-acceptance-register.md',
  sequence: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-sequence-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-readiness-policy.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review-blocker-register.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-closure.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-plan.md',
  sourceActions: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-action-register.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-readiness-boundary.md',
  sourceClaims: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-claim-policy.md',
  sourceAudit: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit.md',
  syntheticProof: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md',
}

const decision = 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_gap_closure_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_closure'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_gap_closure_plan_completed_with_warnings_ready_for_owner_gap_closure_review'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-WORKER-DISPATCH-CONTRACT-GAP-CLOSURE: close worker dispatch contract gap, no execution'

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

function assertClosedPolicy(policy) {
  const allowedTrue = new Set([
    'gapClosureReviewPassed',
    'workerDispatchContractGapClosureMayBePlanned',
    'internalSyntheticToolCallPlanningMayContinue',
  ])
  for (const [key, value] of Object.entries(policy)) {
    if (allowedTrue.has(key)) {
      assert(value === true, `${key} should be true`)
    } else if (key === 'toolCandidateCount') {
      assert(value === 15, 'tool candidate count mismatch')
    } else {
      assert(value === false, `${key} must remain false`)
    }
  }
}

const review = parseJsonFence(files.review, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-acceptance-register')
const sequence = parseJsonFence(files.sequence, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-sequence-register')
const readiness = parseJsonFence(files.readiness, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-readiness-policy')
const blockers = parseJsonFence(files.blockers, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review-blocker-register')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-review-claim-policy')
const sourcePlan = parseJsonFence(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-plan')
const sourceActions = parseJsonFence(files.sourceActions, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-action-register')
const sourceBoundary = parseJsonFence(files.sourceBoundary, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-readiness-boundary')
const sourceClaims = parseJsonFence(files.sourceClaims, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-claim-policy')
const sourceAudit = parseJsonFence(files.sourceAudit, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit')
const syntheticProof = parseJsonFence(files.syntheticProof, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const promptText = read(files.nextPrompt)

assert(review.owner === 'WORKER_RUNTIME_JOBS', 'review owner mismatch')
assert(review.decision === decision, 'review decision mismatch')
assert(review.sourceVerification.sourceHead === '2df30ad1a30347ce618efeeca04d232de9157576', 'review source head mismatch')
assert(review.sourceVerification.pr1060.mergeCommit === '2df30ad1a30347ce618efeeca04d232de9157576', 'PR #1060 merge commit mismatch')
assert(review.sourceVerification.pr1060.decision === sourceDecision, 'PR #1060 decision mismatch')
assert(review.reviewResult.gapClosurePlanAccepted === true, 'gap closure plan not accepted')
assert(review.reviewResult.gapClosureSequenceAccepted === true, 'gap closure sequence not accepted')
assert(review.reviewResult.toolCandidateCount === 15, 'review tool count mismatch')
assert(review.reviewResult.acceptedForInternalSyntheticPlanning === true, 'internal synthetic planning should stay true')
assert(review.reviewResult.acceptedForLiveToolCalls === false, 'live tool calls must stay false')
assert(review.reviewResult.acceptedForExternalBeta === false, 'external beta must stay false')
assert(review.reviewResult.acceptedForProduction === false, 'production must stay false')
assert(review.reviewResult.trackedGapCount === 8, 'tracked gap count mismatch')
assert(review.reviewResult.closureActionCount === 8, 'closure action count mismatch')
assert(review.reviewResult.closedGapCountToday === 0, 'closed gap count must remain zero')
assert(review.reviewResult.executionApprovalsGrantedToday === 'none', 'execution approvals must remain none')
assert(review.reviewResult.approvedNextClosureLane === 'worker_dispatch_contract', 'next closure lane mismatch')
assert(review.reviewResult.parallelClosureAllowedToday === false, 'parallel closure should stay false')
assert(review.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.sourceDecision === sourceDecision, 'acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.length === 4, 'accepted evidence count mismatch')
for (const item of acceptance.acceptedEvidence) {
  assert(item.acceptedForPlanning === true, `${item.item} should be accepted for planning`)
  assert(item.acceptedForExecution === false, `${item.item} must not be accepted for execution`)
}
assert(acceptance.acceptedForToday.firstClosureLaneMayProceed === true, 'first closure lane should proceed')
assert(acceptance.acceptedForToday.firstClosureLane === 'worker_dispatch_contract', 'first closure lane mismatch')
for (const [key, value] of Object.entries(acceptance.acceptedForToday)) {
  if (key !== 'firstClosureLaneMayProceed' && key !== 'firstClosureLane') {
    assert(value === false, `${key} must remain false`)
  }
}
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(sequence.decision === decision, 'sequence decision mismatch')
assert(sequence.sequencePolicy.singleLaneAtATime === true, 'sequence must be single-lane')
assert(sequence.sequencePolicy.duplicateSamePurposePrCheckRequired === true, 'duplicate check required')
assert(sequence.sequencePolicy.sourceBranchFreshnessCheckRequired === true, 'source freshness check required')
assert(sequence.sequencePolicy.currentReviewClosesGap === false, 'review must not close a gap')
assert(sequence.gapSequence.length === 8, 'gap sequence length mismatch')
assert(sequence.gapSequence[0].gapId === 'worker_dispatch_contract', 'first gap mismatch')
assert(sequence.gapSequence[0].nextPromptMayProceed === true, 'first gap should be next')
for (const gap of sequence.gapSequence) {
  assert(gap.closedToday === false, `${gap.gapId} must remain open today`)
  if (gap.order !== 1) {
    assert(gap.nextPromptMayProceed === false, `${gap.gapId} should wait`)
  }
}
assert(sequence.summary.trackedGapCount === 8, 'sequence tracked gap mismatch')
assert(sequence.summary.closedGapCountToday === 0, 'sequence closed gap mismatch')
assert(sequence.summary.nextPromptMayProceedCount === 1, 'sequence next prompt count mismatch')

assert(readiness.decision === decision, 'readiness decision mismatch')
assertClosedPolicy(readiness.readinessPolicy)

assert(blockers.decision === decision, 'blocker decision mismatch')
assert(blockers.blockers.length === 4, 'blocker count mismatch')
for (const blocker of blockers.blockers) {
  assert(blocker.resolvedToday === false, `${blocker.blockerId} should not resolve today`)
}
assert(blockers.summary.resolvedToday === 0, 'blocker resolved count mismatch')

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('gap sequence accepted for planning'), 'allowed claim missing')
assert(claims.forbiddenClaims.includes('external beta readiness'), 'external beta readiness must be forbidden')
assert(claims.forbiddenClaims.includes('production readiness'), 'production readiness must be forbidden')
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourcePlan.gapClosurePlanResult.toolCandidateCount === 15, 'source plan tool count mismatch')
assert(sourcePlan.gapClosurePlanResult.trackedGapCount === 8, 'source plan tracked gap mismatch')
assert(sourcePlan.gapClosurePlanResult.closedGapCountToday === 0, 'source plan closed gap mismatch')
assert(sourcePlan.gapClosurePlanResult.acceptedForExternalBeta === false, 'source plan external beta widened')
assert(sourceActions.gapActions.length === 8, 'source actions gap count mismatch')
assert(sourceActions.gapActions[0].gapId === 'worker_dispatch_contract', 'source first gap mismatch')
assert(sourceBoundary.readinessBoundary.liveToolCallsAllowed === false, 'source live tool call boundary widened')
assert(sourceClaims.forbiddenClaims.includes('worker readiness'), 'source claim policy missing worker readiness')
assert(
  sourceAudit.decision === 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_reconciliation_completed_with_warnings_ready_for_owner_gap_closure_plan',
  'source audit decision mismatch',
)
assert(syntheticProof.toolCandidateCount === 15, 'synthetic proof tool count mismatch')
assert(syntheticProof.probePassedCount === 15, 'synthetic proof passed count mismatch')

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
      status: 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_gap_closure_review_diagnostics_passed',
      decision: review.decision,
      sourceHead: review.sourceVerification.sourceHead,
      toolCandidateCount: review.reviewResult.toolCandidateCount,
      trackedGapCount: review.reviewResult.trackedGapCount,
      closedGapCountToday: review.reviewResult.closedGapCountToday,
      approvedNextClosureLane: review.reviewResult.approvedNextClosureLane,
      externalBetaAllowed: review.reviewResult.acceptedForExternalBeta,
      nextPrompt: review.nextPrompt,
    },
    null,
    2,
  ),
)
