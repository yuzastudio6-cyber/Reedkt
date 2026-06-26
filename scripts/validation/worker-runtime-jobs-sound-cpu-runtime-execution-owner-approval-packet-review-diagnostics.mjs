import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_owner_approval_packet_review_passed_with_warnings_ready_for_runtime_execution_approval_gap_closure_plan'
const gate2amDecision =
  'sound_runtime_media_gate_2am_runtime_execution_owner_approval_packet_completed_with_warnings_ready_for_owner_approval_packet_review'
const ownerGateMapReviewDecision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_owner_gate_map_review_passed_with_warnings_ready_for_runtime_execution_owner_approval_packet'
const sourceHead = '028f49b2e35930f0ddb2fd6663af6f80ab20deb1'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-signoff-gap-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-packet-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-claim-policy.md',
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
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${path} owner mismatch`)
  assert(json.decision === decision, `${path} decision mismatch`)
}

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr981.status === 'merged', 'PR #981 status mismatch')
assert(review.sourceVerification.pr981.mergeCommit === sourceHead, 'PR #981 merge commit mismatch')
assert(review.sourceVerification.pr981.decision === gate2amDecision, 'PR #981 decision mismatch')
assert(review.sourceVerification.pr979.decision === ownerGateMapReviewDecision, 'PR #979 decision mismatch')
assert(review.ownerReviewResult.runtimeExecutionOwnerApprovalPacketAcceptedForGapClosurePlanning === true, 'approval packet acceptance missing')
assert(review.ownerReviewResult.requiredOwnerSignoffCountAccepted === 8, 'owner signoff count mismatch')
assert(review.ownerReviewResult.futureRuntimeExecutionApprovalGapClosurePlanMayProceed === true, 'future gap closure flag missing')
for (const [key, value] of Object.entries(review.ownerReviewResult)) {
  if (
    key === 'runtimeExecutionOwnerApprovalPacketAcceptedForGapClosurePlanning' ||
    key === 'requiredOwnerSignoffCountAccepted' ||
    key === 'futureRuntimeExecutionApprovalGapClosurePlanMayProceed'
  ) continue
  assert(value === false, `${key} must be false`)
}

const gate2am = parseJsonBlock('docs/sound-runtime-media-gate-2am-runtime-execution-owner-approval-packet.md')
assert(gate2am.decision === gate2amDecision, 'Gate 2AM decision mismatch')
assert(gate2am.ownerApprovalPacketResult.runtimeExecutionOwnerApprovalPacketCreated === true, 'Gate 2AM packet missing')
assert(gate2am.ownerApprovalPacketResult.requiredOwnerSignoffCount === 8, 'Gate 2AM signoff count mismatch')
assert(gate2am.ownerApprovalPacketResult.allOwnerSignoffsGrantedToday === false, 'Gate 2AM signoffs must remain false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-acceptance-register.md']
assert(acceptance.acceptedPacketEvidence.gate2amDecisionAccepted === true, 'Gate 2AM acceptance missing')
assert(acceptance.acceptedPacketEvidence.requiredOwnerSignoffCount === 8, 'accepted owner count mismatch')
assert(acceptance.acceptedForGapClosurePlanningOnly === true, 'gap closure planning acceptance missing')
assert(acceptance.acceptedForRuntimeExecutionToday === false, 'runtime execution acceptance must be false')

const gaps = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-signoff-gap-register.md']
assert(gaps.signoffGaps.length === 8, 'signoff gap count mismatch')
for (const gap of gaps.signoffGaps) {
  assert(gap.closedToday === false, `${gap.owner} gap must remain open`)
}
assert(gaps.allSignoffGapsClosedToday === false, 'all gaps must remain open')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-packet-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_execution_owner_approval_packet_review_pending'), 'resolved review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_approval_gap_closure_plan_pending' && row.status === 'next'), 'next gap closure blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'all_owner_signoffs_missing'), 'all owner signoffs blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (key === 'runtimeExecutionOwnerApprovalPacketAcceptedForGapClosurePlanning' || key === 'futureRuntimeExecutionApprovalGapClosurePlanMayProceed') {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2an-runtime-execution-approval-readiness-gap-closure-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not grant approvals'), 'next prompt must block approval grants')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('keep runtime execution blocked'), 'next prompt must preserve runtime block')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-execution-owner-approval-packet-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_execution_owner_approval_packet_review_diagnostics_passed',
  decision,
  sourceHead,
  pr981Verified: true,
  runtimeExecutionOwnerApprovalPacketAcceptedForGapClosurePlanning: true,
  futureRuntimeExecutionApprovalGapClosurePlanMayProceed: true,
  allOwnerSignoffsGrantedToday: false,
  runtimeExecutionApprovedToday: false,
  workerDispatchApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AN: runtime execution approval readiness gap closure plan, no execution'
}, null, 2))
