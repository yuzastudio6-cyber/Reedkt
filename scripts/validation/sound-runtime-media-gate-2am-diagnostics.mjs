import fs from 'node:fs'

const decision =
  'sound_runtime_media_gate_2am_runtime_execution_owner_approval_packet_completed_with_warnings_ready_for_owner_approval_packet_review'
const ownerGateMapReviewDecision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_owner_gate_map_review_passed_with_warnings_ready_for_runtime_execution_owner_approval_packet'
const gate2alDecision =
  'sound_runtime_media_gate_2al_runtime_execution_readiness_owner_gate_map_completed_with_warnings_ready_for_owner_gate_map_review'
const sourceHead = '70e70c7932f70806a7e492c597238c1f5c56ec99'

const docs = [
  'docs/sound-runtime-media-gate-2am-runtime-execution-owner-approval-packet.md',
  'docs/sound-runtime-media-gate-2am-owner-signoff-requirements-register.md',
  'docs/sound-runtime-media-gate-2am-runtime-execution-approval-criteria-register.md',
  'docs/sound-runtime-media-gate-2am-runtime-denial-blocker-register.md',
  'docs/sound-runtime-media-gate-2am-runtime-claim-policy.md',
]

const requiredOwners = [
  'WORKER_RUNTIME_JOBS',
  'SOUND_RUNTIME_MEDIA_GATE',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'BILLING_STRIPE_CREDITS',
  'COMPLIANCE_SECURITY',
  'PRODUCT_BETA_READINESS',
  'SOUND_OWNER_MEDIA_POLICY',
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

const packet = parsed['docs/sound-runtime-media-gate-2am-runtime-execution-owner-approval-packet.md']
assert(packet.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(packet.sourceVerification.pr979.status === 'merged', 'PR #979 status mismatch')
assert(packet.sourceVerification.pr979.mergeCommit === sourceHead, 'PR #979 merge commit mismatch')
assert(packet.sourceVerification.pr979.decision === ownerGateMapReviewDecision, 'PR #979 decision mismatch')
assert(packet.sourceVerification.pr976.decision === gate2alDecision, 'PR #976 decision mismatch')
assert(packet.ownerApprovalPacketResult.runtimeExecutionOwnerApprovalPacketCreated === true, 'approval packet missing')
assert(packet.ownerApprovalPacketResult.requiredOwnerSignoffCount === requiredOwners.length, 'owner signoff count mismatch')
for (const [key, value] of Object.entries(packet.ownerApprovalPacketResult)) {
  if (key === 'runtimeExecutionOwnerApprovalPacketCreated' || key === 'requiredOwnerSignoffCount') continue
  assert(value === false, `${key} must be false`)
}

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review.md')
assert(ownerReview.decision === ownerGateMapReviewDecision, 'owner gate map review source decision mismatch')
assert(ownerReview.ownerReviewResult.futureRuntimeExecutionOwnerApprovalPacketMayProceed === true, 'owner review did not authorize packet planning')
assert(ownerReview.ownerReviewResult.runtimeExecutionApprovedToday === false, 'owner review must keep runtime execution false')

const signoffs = parsed['docs/sound-runtime-media-gate-2am-owner-signoff-requirements-register.md']
assert(signoffs.ownerSignoffRequirements.length === requiredOwners.length, 'owner signoff register count mismatch')
for (const owner of requiredOwners) {
  const row = signoffs.ownerSignoffRequirements.find((entry) => entry.owner === owner)
  assert(row, `missing owner ${owner}`)
  assert(row.signoffGrantedToday === false, `${owner} signoff must be false`)
}
assert(signoffs.allSignoffsGrantedToday === false, 'all signoffs must be false')

const criteria = parsed['docs/sound-runtime-media-gate-2am-runtime-execution-approval-criteria-register.md']
for (const [key, group] of Object.entries(criteria.approvalCriteria)) {
  assert(group.approvedToday === false, `${key} approval must be false`)
}
assert(criteria.runtimeExecutionApprovalCriteriaSatisfiedToday === false, 'runtime criteria cannot be satisfied today')

const blockers = parsed['docs/sound-runtime-media-gate-2am-runtime-denial-blocker-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_execution_owner_approval_packet_pending'), 'resolved approval packet blocker missing')
assert(blockers.runtimeExecutionDeniedTodayBecause.length >= 5, 'denial reason coverage too small')
assert(blockers.nextBlocker.blockerId === 'runtime_execution_owner_approval_packet_review_pending', 'next blocker mismatch')

const policy = parsed['docs/sound-runtime-media-gate-2am-runtime-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (
    key === 'runtimeExecutionOwnerApprovalPacketCreated' ||
    key === 'ownerSignoffRequirementsDocumented' ||
    key === 'futureOwnerApprovalPacketReviewMayProceed'
  ) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AM decision')
assert(nextPrompt.includes('Do not grant runtime execution'), 'next prompt must block runtime grant')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2am:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-2am-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2am_diagnostics_passed',
  decision,
  sourceHead,
  pr979Verified: true,
  runtimeExecutionOwnerApprovalPacketCreated: true,
  requiredOwnerSignoffCount: requiredOwners.length,
  allOwnerSignoffsGrantedToday: false,
  runtimeExecutionApprovedToday: false,
  workerDispatchApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-EXECUTION-OWNER-APPROVAL-PACKET-REVIEW: review runtime execution owner approval packet, no execution'
}, null, 2))
