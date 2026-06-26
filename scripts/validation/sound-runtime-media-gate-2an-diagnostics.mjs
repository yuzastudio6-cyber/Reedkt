import fs from 'node:fs'

const decision =
  'sound_runtime_media_gate_2an_runtime_execution_approval_readiness_gap_closure_plan_completed_with_warnings_ready_for_gap_closure_owner_review'
const ownerApprovalPacketReviewDecision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_owner_approval_packet_review_passed_with_warnings_ready_for_runtime_execution_approval_gap_closure_plan'
const gate2amDecision =
  'sound_runtime_media_gate_2am_runtime_execution_owner_approval_packet_completed_with_warnings_ready_for_owner_approval_packet_review'
const sourceHead = '09fa015ff8859a142e3331eea2d0a37c95057bcf'

const docs = [
  'docs/sound-runtime-media-gate-2an-runtime-execution-approval-readiness-gap-closure-plan.md',
  'docs/sound-runtime-media-gate-2an-gap-closure-sequence-register.md',
  'docs/sound-runtime-media-gate-2an-evidence-requirements-register.md',
  'docs/sound-runtime-media-gate-2an-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2an-runtime-claim-policy.md',
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

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const plan = parsed['docs/sound-runtime-media-gate-2an-runtime-execution-approval-readiness-gap-closure-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr983.status === 'merged', 'PR #983 status mismatch')
assert(plan.sourceVerification.pr983.mergeCommit === sourceHead, 'PR #983 merge commit mismatch')
assert(plan.sourceVerification.pr983.decision === ownerApprovalPacketReviewDecision, 'PR #983 decision mismatch')
assert(plan.sourceVerification.pr981.decision === gate2amDecision, 'PR #981 decision mismatch')
assert(plan.gapClosurePlanResult.runtimeExecutionApprovalGapClosurePlanCreated === true, 'gap closure plan missing')
assert(plan.gapClosurePlanResult.trackedGapCount === 8, 'tracked gap count mismatch')
assert(plan.gapClosurePlanResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(plan.gapClosurePlanResult)) {
  if (key === 'runtimeExecutionApprovalGapClosurePlanCreated' || key === 'trackedGapCount' || key === 'closedGapCountToday') continue
  assert(value === false, `${key} must be false`)
}

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review.md')
assert(ownerReview.decision === ownerApprovalPacketReviewDecision, 'owner approval packet review decision mismatch')
assert(ownerReview.ownerReviewResult.futureRuntimeExecutionApprovalGapClosurePlanMayProceed === true, 'owner review did not authorize gap closure planning')
assert(ownerReview.ownerReviewResult.runtimeExecutionApprovedToday === false, 'owner review must keep runtime execution false')

const sequence = parsed['docs/sound-runtime-media-gate-2an-gap-closure-sequence-register.md']
assert(sequence.gapClosureSequence.length === 8, 'gap sequence count mismatch')
for (let index = 0; index < sequence.gapClosureSequence.length; index += 1) {
  const row = sequence.gapClosureSequence[index]
  assert(row.order === index + 1, `gap sequence order mismatch at ${index + 1}`)
  assert(row.closureStatusToday === 'open', `${row.owner} gap must remain open`)
}
assert(sequence.allGapsClosedToday === false, 'all gaps must remain open')

const evidence = parsed['docs/sound-runtime-media-gate-2an-evidence-requirements-register.md']
assert(evidence.evidenceRequiredBeforeAnyRuntimeExecutionApproval.workerRuntimeJobs.length >= 3, 'worker evidence coverage too small')
assert(evidence.evidenceRequiredBeforeAnyRuntimeExecutionApproval.supabaseStorageSql.length >= 3, 'Supabase evidence coverage too small')
assert(evidence.evidenceAcceptedToday === false, 'evidence must not be accepted today')

const blockers = parsed['docs/sound-runtime-media-gate-2an-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_execution_approval_gap_closure_plan_pending'), 'resolved planning blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_gap_closure_plan_owner_review_pending' && row.status === 'next'), 'next owner review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'all_owner_signoffs_missing'), 'all signoffs blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2an-runtime-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (key === 'runtimeExecutionApprovalGapClosurePlanCreated' || key === 'gapClosureSequenceDocumented' || key === 'futureGapClosureOwnerReviewMayProceed') {
    assert(value === true, `${key} must be true`)
  } else if (key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-execution-gap-closure-plan-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AN decision')
assert(nextPrompt.includes('Do not close gaps'), 'next prompt must block gap closure')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2an:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-2an-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2an_diagnostics_passed',
  decision,
  sourceHead,
  pr983Verified: true,
  runtimeExecutionApprovalGapClosurePlanCreated: true,
  trackedGapCount: 8,
  closedGapCountToday: 0,
  allOwnerSignoffsGrantedToday: false,
  runtimeExecutionApprovedToday: false,
  workerDispatchApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-EXECUTION-GAP-CLOSURE-PLAN-REVIEW: review runtime execution approval gap closure plan, no execution'
}, null, 2))
