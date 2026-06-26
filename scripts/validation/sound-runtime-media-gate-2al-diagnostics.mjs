import fs from 'node:fs'

const decision =
  'sound_runtime_media_gate_2al_runtime_execution_readiness_owner_gate_map_completed_with_warnings_ready_for_owner_gate_map_review'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_no_execution_regression_proof_owner_review_passed_with_warnings_ready_for_runtime_execution_owner_gate_map'
const gate2akDecision =
  'sound_runtime_media_gate_2ak_no_execution_regression_proof_passed_with_warnings_ready_for_regression_proof_owner_review'
const sourceHead = 'd8ae0fccd738ce0217a57bfbc188fff31c68fc12'

const docs = [
  'docs/sound-runtime-media-gate-2al-runtime-execution-readiness-owner-gate-map.md',
  'docs/sound-runtime-media-gate-2al-required-owner-approval-register.md',
  'docs/sound-runtime-media-gate-2al-runtime-execution-preflight-map.md',
  'docs/sound-runtime-media-gate-2al-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2al-runtime-claim-policy.md',
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

const result = parsed['docs/sound-runtime-media-gate-2al-runtime-execution-readiness-owner-gate-map.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr973.status === 'merged', 'PR #973 status mismatch')
assert(result.sourceVerification.pr973.mergeCommit === sourceHead, 'PR #973 merge commit mismatch')
assert(result.sourceVerification.pr973.decision === ownerReviewDecision, 'PR #973 decision mismatch')
assert(result.sourceVerification.pr969.decision === gate2akDecision, 'PR #969 decision mismatch')
assert(result.ownerGateMapResult.runtimeExecutionOwnerGateMapCreated === true, 'owner gate map result missing')
assert(result.ownerGateMapResult.requiredOwnerGateCount === requiredOwners.length, 'owner gate count mismatch')
for (const [key, value] of Object.entries(result.ownerGateMapResult)) {
  if (key === 'runtimeExecutionOwnerGateMapCreated' || key === 'requiredOwnerGateCount') continue
  assert(value === false, `${key} must be false`)
}

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-no-execution-regression-proof-owner-review.md')
assert(ownerReview.decision === ownerReviewDecision, 'owner review source decision mismatch')
assert(ownerReview.ownerReviewResult.futureRuntimeExecutionOwnerGateMapMayProceed === true, 'owner review did not authorize mapping')
assert(ownerReview.ownerReviewResult.runtimeExecutionEnabledToday === false, 'owner review must keep runtime disabled')

const register = parsed['docs/sound-runtime-media-gate-2al-required-owner-approval-register.md']
assert(register.requiredOwnerApprovals.length === requiredOwners.length, 'required owner register count mismatch')
for (const owner of requiredOwners) {
  const row = register.requiredOwnerApprovals.find((entry) => entry.owner === owner)
  assert(row, `missing owner ${owner}`)
  assert(row.status === 'blocked_pending_owner_review', `${owner} status must be blocked`)
}
assert(register.allApprovalsGrantedToday === false, 'approvals must not be granted today')

const preflight = parsed['docs/sound-runtime-media-gate-2al-runtime-execution-preflight-map.md']
for (const group of Object.values(preflight.futurePreflightGroups)) {
  assert(group.status === 'planned_not_approved', 'preflight groups must remain planned_not_approved')
}
assert(preflight.runtimeExecutionPreflightPassedToday === false, 'runtime preflight cannot pass today')

const blockers = parsed['docs/sound-runtime-media-gate-2al-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_execution_owner_gate_map_pending'), 'resolved planning blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'worker_runtime_jobs_owner_approval_pending' && row.status === 'next'), 'next worker owner blocker missing')
assert(blockers.remainingBlockers.some((row) => row.owner === 'SUPABASE_RLS_STORAGE_DATABASE'), 'Supabase owner blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2al-runtime-claim-policy.md']
assert(policy.allowedClaims.runtimeExecutionOwnerGateMapCreated === true, 'owner gate map allowed claim missing')
assert(policy.allowedClaims.ownerApprovalsMapped === true, 'owner approvals mapped claim missing')
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (key === 'runtimeExecutionOwnerGateMapCreated' || key === 'ownerApprovalsMapped' || key === 'futureOwnerReviewMayProceed') {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review.md')
assert(nextPrompt.includes(decision), 'owner review prompt must require Gate 2AL decision')
assert(nextPrompt.includes('Do not dispatch workers'), 'owner review prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'owner review prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'owner review prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2al:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-2al-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2al_diagnostics_passed',
  decision,
  sourceHead,
  pr973Verified: true,
  runtimeExecutionOwnerGateMapCreated: true,
  requiredOwnerGateCount: requiredOwners.length,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  artifactDeliveryApprovedToday: false,
  betaProductionReadinessClaimedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-EXECUTION-OWNER-GATE-MAP-REVIEW: review runtime execution owner-gate map, no execution'
}, null, 2))
