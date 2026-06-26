import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_owner_gate_map_review_passed_with_warnings_ready_for_runtime_execution_owner_approval_packet'
const gate2alDecision =
  'sound_runtime_media_gate_2al_runtime_execution_readiness_owner_gate_map_completed_with_warnings_ready_for_owner_gate_map_review'
const owner2akDecision =
  'worker_runtime_jobs_sound_cpu_no_execution_regression_proof_owner_review_passed_with_warnings_ready_for_runtime_execution_owner_gate_map'
const sourceHead = '93d177348c9cefc128dbedf3878a5b7223b89c9d'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-dependency-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr976.status === 'merged', 'PR #976 status mismatch')
assert(review.sourceVerification.pr976.mergeCommit === sourceHead, 'PR #976 merge commit mismatch')
assert(review.sourceVerification.pr976.decision === gate2alDecision, 'PR #976 decision mismatch')
assert(review.sourceVerification.pr973.decision === owner2akDecision, 'PR #973 decision mismatch')
assert(review.ownerReviewResult.runtimeExecutionOwnerGateMapAcceptedForApprovalPacketPlanning === true, 'map acceptance missing')
assert(review.ownerReviewResult.requiredOwnerGateCountAccepted === 8, 'owner gate count mismatch')
assert(review.ownerReviewResult.futureRuntimeExecutionOwnerApprovalPacketMayProceed === true, 'future approval packet flag missing')
for (const [key, value] of Object.entries(review.ownerReviewResult)) {
  if (
    key === 'runtimeExecutionOwnerGateMapAcceptedForApprovalPacketPlanning' ||
    key === 'requiredOwnerGateCountAccepted' ||
    key === 'futureRuntimeExecutionOwnerApprovalPacketMayProceed'
  ) continue
  assert(value === false, `${key} must be false`)
}

const gate2al = parseJsonBlock('docs/sound-runtime-media-gate-2al-runtime-execution-readiness-owner-gate-map.md')
assert(gate2al.decision === gate2alDecision, 'Gate 2AL decision mismatch')
assert(gate2al.ownerGateMapResult.runtimeExecutionOwnerGateMapCreated === true, 'Gate 2AL map missing')
assert(gate2al.ownerGateMapResult.requiredOwnerGateCount === 8, 'Gate 2AL owner count mismatch')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-acceptance-register.md']
assert(acceptance.acceptedMapEvidence.gate2alDecisionAccepted === true, 'Gate 2AL acceptance missing')
assert(acceptance.acceptedMapEvidence.requiredOwnerGateCount === 8, 'accepted owner count mismatch')
assert(acceptance.acceptedForPlanningOnly === true, 'planning-only acceptance missing')
assert(acceptance.acceptedForExecutionToday === false, 'execution must remain false')

const dependencies = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-dependency-register.md']
for (const [key, group] of Object.entries(dependencies.approvalDependencies)) {
  assert(group.futureApprovalPacketRequired === true, `${key} future approval packet required missing`)
  for (const [field, value] of Object.entries(group)) {
    if (field === 'futureApprovalPacketRequired') continue
    assert(value === false, `${key}.${field} must be false`)
  }
}

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_execution_owner_gate_map_review_pending'), 'resolved owner review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_owner_approval_packet_pending' && row.status === 'next'), 'next approval packet blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_artifact_policy_pending'), 'Supabase/artifact blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-claim-policy.md']
assert(policy.allowedClaims.runtimeExecutionOwnerGateMapAcceptedForApprovalPacketPlanning === true, 'allowed map acceptance missing')
assert(policy.allowedClaims.futureRuntimeExecutionOwnerApprovalPacketMayProceed === true, 'future approval packet claim missing')
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (key === 'runtimeExecutionOwnerGateMapAcceptedForApprovalPacketPlanning' || key === 'futureRuntimeExecutionOwnerApprovalPacketMayProceed') {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2am-runtime-execution-owner-approval-packet.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('keep runtime execution blocked'), 'next prompt must preserve runtime block')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-execution-owner-gate-map-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_execution_owner_gate_map_review_diagnostics_passed',
  decision,
  sourceHead,
  pr976Verified: true,
  runtimeExecutionOwnerGateMapAcceptedForApprovalPacketPlanning: true,
  futureRuntimeExecutionOwnerApprovalPacketMayProceed: true,
  runtimeExecutionApprovedToday: false,
  workerDispatchApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AM: runtime execution owner approval packet, no execution'
}, null, 2))
