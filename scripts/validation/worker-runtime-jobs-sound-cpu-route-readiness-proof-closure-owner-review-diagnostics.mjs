import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_proof_closure_owner_review_passed_with_warnings_ready_for_route_readiness_claim_owner_gate'
const gate2aaDecision = 'sound_runtime_media_gate_2aa_route_readiness_proof_closure_plan_completed_with_warnings_ready_for_route_readiness_proof_closure_owner_review'
const serverProofOwnerDecision = 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_owner_review_passed_with_warnings_ready_for_route_readiness_proof_closure_plan'
const gate2zDecision = 'sound_runtime_media_gate_2z_typescript_runtime_loading_fix_passed_with_warnings_ready_for_server_route_execution_proof_owner_review'
const sourceHead = 'bf281a19ca20cf9c26b049bf5f3642417eb29399'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-boundary-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-owner-claim-policy.md',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must remain false`)
  }
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const review = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-owner-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr909.status === 'merged', 'PR #909 merge evidence missing')
assert(review.sourceVerification.pr909.mergeCommit === sourceHead, 'PR #909 merge commit mismatch')
assert(review.sourceVerification.pr909.decision === gate2aaDecision, 'PR #909 decision mismatch')
assert(review.sourceVerification.pr904.decision === serverProofOwnerDecision, 'PR #904 decision mismatch')
assert(review.sourceVerification.pr900.decision === gate2zDecision, 'PR #900 decision mismatch')
assert(review.ownerReviewResult.gate2aaProofClosureAcceptedForRouteReadinessClaimGatePlanning === true, 'Gate 2AA acceptance missing')
assert(review.ownerReviewResult.futureGate2abRouteReadinessClaimOwnerGateMayProceed === true, 'Gate 2AB may proceed missing')
assert(review.ownerReviewResult.criteriaEvidenceAccepted === true, 'criteria evidence acceptance missing')
assert(review.ownerReviewResult.serverRouteProofEvidenceAccepted === true, 'server proof evidence acceptance missing')
assert(review.ownerReviewResult.acceptedCaseCount === 4, 'accepted case count mismatch')
assert(review.ownerReviewResult.rejectedCaseCount === 5, 'rejected case count mismatch')
assert(review.ownerReviewResult.sourceEditedInThisOwnerReview === false, 'source edit claim must be false')
assert(review.ownerReviewResult.proofRerunInThisOwnerReview === false, 'proof rerun claim must be false')
assert(review.ownerReviewResult.serverRouteExecutedInThisOwnerReview === false, 'server route execution claim must be false')
assert(review.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'route readiness claim must remain false')
assert(review.ownerReviewResult.acceptedForBetaOrProductionToday === false, 'beta/production claim must remain false')

const gate2aa = parseJsonBlock('docs/sound-runtime-media-gate-2aa-route-readiness-proof-closure-plan.md')
assert(gate2aa.decision === gate2aaDecision, 'Gate 2AA decision mismatch')
assert(gate2aa.sourceVerification.pr904.mergeCommit === '7d86c6fa7e1b10e6c40939d5c941f8995bfe74b2', 'Gate 2AA PR #904 evidence mismatch')
assert(gate2aa.closurePlanResult.routeReadinessProofClosurePlanCreated === true, 'Gate 2AA closure plan missing')
assert(gate2aa.closurePlanResult.criteriaEvidenceAccepted === true, 'Gate 2AA criteria acceptance missing')
assert(gate2aa.closurePlanResult.serverRouteProofEvidenceAccepted === true, 'Gate 2AA server proof acceptance missing')
assert(gate2aa.closurePlanResult.acceptedCaseCount === 4, 'Gate 2AA accepted count mismatch')
assert(gate2aa.closurePlanResult.rejectedCaseCount === 5, 'Gate 2AA rejected count mismatch')
assert(gate2aa.closurePlanResult.routeReadinessClaimed === false, 'Gate 2AA route readiness claim must be false')
assert(gate2aa.closurePlanResult.serverRouteExecutedInGate2aa === false, 'Gate 2AA server route execution must be false')
assert(gate2aa.closurePlanResult.workerExecutionRunInGate2aa === false, 'Gate 2AA worker execution must be false')

const gate2aaEvidence = parseJsonBlock('docs/sound-runtime-media-gate-2aa-proof-closure-evidence-map.md')
assert(gate2aaEvidence.acceptedEvidence.serverRouteProofAcceptedForClosurePlanning === true, 'server proof closure evidence missing')
assert(gate2aaEvidence.acceptedEvidence.routeReadinessClaimed === false, 'proof evidence must not claim route readiness')
assert(gate2aaEvidence.evidenceGapsRemainingForReadinessClaim.includes('route_readiness_proof_closure_owner_review'), 'owner review gap missing')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-acceptance-register.md']
assert(acceptance.acceptedForFuturePlanningOnly.includes('route_readiness_claim_owner_gate_may_be_planned'), 'Gate 2AB planning acceptance missing')
assert(acceptance.acceptedProofCounts.acceptedCaseCount === 4, 'accepted proof count mismatch')
assert(acceptance.acceptedProofCounts.rejectedCaseCount === 5, 'rejected proof count mismatch')
assert(acceptance.acceptedProofCounts.criteriaRejectedPayloadFieldCount === 14, 'criteria rejected field count mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-evidence-register.md']
assert(evidence.acceptedPr909Evidence.gate2aaDecision === gate2aaDecision, 'accepted PR #909 decision mismatch')
assert(evidence.acceptedPr909Evidence.mergeCommit === sourceHead, 'accepted PR #909 merge commit mismatch')
assert(evidence.acceptedPr909Evidence.closurePlanCreated === true, 'accepted closure plan evidence missing')
assert(evidence.acceptedPr909Evidence.serverRouteExecuted === false, 'accepted server route execution must be false')
assert(evidence.acceptedPr909Evidence.workerExecutionRun === false, 'accepted worker execution must be false')
assert(evidence.acceptedPr909Evidence.supabaseSqlRun === false, 'accepted Supabase/SQL must be false')
assert(evidence.acceptedPr909Evidence.routeReadinessClaimed === false, 'accepted route readiness claim must be false')
assert(evidence.remainingBeforeAnyRouteReadinessClaim.includes('route_readiness_claim_owner_gate'), 'route readiness claim gate gap missing')

const boundary = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-boundary-register.md']
assert(boundary.acceptedGate2aaBoundary.routeReadinessProofClosurePlanCreated === true, 'Gate 2AA boundary missing')
assert(boundary.acceptedGate2aaBoundary.routeReadinessClaimed === false, 'Gate 2AA boundary must not claim readiness')
assertAllFalse(boundary.currentOwnerReviewExecution, 'currentOwnerReviewExecution')
assert(boundary.futureGate2abBoundary.routeReadinessClaimOwnerGateMayProceed === true, 'future Gate 2AB flag missing')
assert(boundary.futureGate2abBoundary.routeReadinessMayBeClaimedBeforeGate2abOwnerDecision === false, 'route readiness must remain gated')
assert(boundary.futureGate2abBoundary.workerExecutionMayRunInGate2ab === false, 'worker execution must remain blocked')
assert(boundary.futureGate2abBoundary.supabaseSqlMayRunInGate2ab === false, 'Supabase/SQL must remain blocked')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'route_readiness_proof_closure_owner_review_pending'), 'owner review blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_claim_owner_gate_pending' && row.status === 'next'), 'Gate 2AB next blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'worker_execution_unlock_blocked'), 'worker execution blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-owner-claim-policy.md']
assert(policy.allowedClaims.gate2aaProofClosureAcceptedForRouteReadinessClaimGatePlanning === true, 'allowed acceptance claim missing')
assert(policy.allowedClaims.routeReadinessClaimOwnerGateMayProceed === true, 'allowed Gate 2AB claim missing')
assert(policy.allowedClaims.routeReadinessClaimAllowedToday === false, 'route readiness claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ab-route-readiness-claim-owner-gate.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not edit runtime source'), 'next prompt must block source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block widened readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-route-readiness-proof-closure-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_proof_closure_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr909Verified: true,
  gate2aaProofClosureAcceptedForRouteReadinessClaimGatePlanning: true,
  futureGate2abRouteReadinessClaimOwnerGateMayProceed: true,
  routeReadinessClaimAllowedToday: false,
  serverRouteExecutedInThisOwnerReview: false,
  workerExecutionApprovedToday: false,
  supabaseSqlRun: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AB: route-readiness claim owner gate, no worker/media/Supabase execution'
}, null, 2))
