import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2ab_route_readiness_claim_owner_gate_completed_with_warnings_ready_for_route_readiness_claim_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_proof_closure_owner_review_passed_with_warnings_ready_for_route_readiness_claim_owner_gate'
const gate2aaDecision = 'sound_runtime_media_gate_2aa_route_readiness_proof_closure_plan_completed_with_warnings_ready_for_route_readiness_proof_closure_owner_review'
const gate2zDecision = 'sound_runtime_media_gate_2z_typescript_runtime_loading_fix_passed_with_warnings_ready_for_server_route_execution_proof_owner_review'
const sourceHead = '530e0597bba6dd288d9923c11719d9ec97310f5f'

const docs = [
  'docs/sound-runtime-media-gate-2ab-route-readiness-claim-owner-gate.md',
  'docs/sound-runtime-media-gate-2ab-route-readiness-claim-boundary-register.md',
  'docs/sound-runtime-media-gate-2ab-proof-evidence-acceptance-register.md',
  'docs/sound-runtime-media-gate-2ab-execution-blocker-register.md',
  'docs/sound-runtime-media-gate-2ab-runtime-claim-policy.md',
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

const gate = parsed['docs/sound-runtime-media-gate-2ab-route-readiness-claim-owner-gate.md']
assert(gate.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(gate.sourceVerification.pr914.status === 'merged', 'PR #914 merge evidence missing')
assert(gate.sourceVerification.pr914.mergeCommit === sourceHead, 'PR #914 merge commit mismatch')
assert(gate.sourceVerification.pr914.decision === ownerDecision, 'PR #914 decision mismatch')
assert(gate.sourceVerification.pr909.decision === gate2aaDecision, 'PR #909 decision mismatch')
assert(gate.sourceVerification.pr900.decision === gate2zDecision, 'PR #900 decision mismatch')
assert(gate.claimGateResult.routeReadinessClaimBoundaryCreated === true, 'claim boundary creation missing')
assert(gate.claimGateResult.routeReadinessClaimOwnerReviewMayProceed === true, 'owner review next step missing')
assert(gate.claimGateResult.routeReadinessClaimedToday === false, 'route readiness claim must remain false today')
assert(gate.claimGateResult.workerReadinessClaimedToday === false, 'worker readiness must remain false')
assert(gate.claimGateResult.runtimeReadinessClaimedToday === false, 'runtime readiness must remain false')
assert(gate.claimGateResult.mediaReadinessClaimedToday === false, 'media readiness must remain false')
assert(gate.claimGateResult.serverRouteExecutedInGate2ab === false, 'server route execution must be false')
assert(gate.claimGateResult.workerExecutionRunInGate2ab === false, 'worker execution must be false')
assert(gate.claimGateResult.supabaseSqlRunInGate2ab === false, 'Supabase/SQL must be false')

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-owner-review.md')
assert(ownerReview.decision === ownerDecision, 'source owner-review decision mismatch')
assert(ownerReview.sourceVerification.pr909.mergeCommit === 'bf281a19ca20cf9c26b049bf5f3642417eb29399', 'PR #909 source evidence mismatch')
assert(ownerReview.ownerReviewResult.futureGate2abRouteReadinessClaimOwnerGateMayProceed === true, 'source owner-review must allow Gate 2AB')
assert(ownerReview.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'source owner-review must not claim readiness')

const gate2aa = parseJsonBlock('docs/sound-runtime-media-gate-2aa-route-readiness-proof-closure-plan.md')
assert(gate2aa.decision === gate2aaDecision, 'Gate 2AA decision mismatch')
assert(gate2aa.closurePlanResult.routeReadinessProofClosurePlanCreated === true, 'Gate 2AA closure plan missing')
assert(gate2aa.closurePlanResult.acceptedCaseCount === 4, 'Gate 2AA accepted count mismatch')
assert(gate2aa.closurePlanResult.rejectedCaseCount === 5, 'Gate 2AA rejected count mismatch')
assert(gate2aa.closurePlanResult.routeReadinessClaimed === false, 'Gate 2AA must not claim route readiness')

const boundary = parsed['docs/sound-runtime-media-gate-2ab-route-readiness-claim-boundary-register.md']
assert(boundary.boundedRouteReadinessClaimBoundary.claimStatus === 'ready_for_worker_runtime_jobs_owner_review', 'claim status mismatch')
assert(boundary.boundedRouteReadinessClaimBoundary.acceptedCaseCount === 4, 'boundary accepted count mismatch')
assert(boundary.boundedRouteReadinessClaimBoundary.rejectedCaseCount === 5, 'boundary rejected count mismatch')
assert(boundary.boundedRouteReadinessClaimBoundary.claimDoesNotApplyTo.includes('worker_dispatch'), 'worker dispatch exclusion missing')
assert(boundary.ownerReviewRequiredBeforeClaim === true, 'owner review requirement missing')
assert(boundary.separateWorkerMediaSupabaseGateRequiredBeforeExecution === true, 'separate execution gate requirement missing')

const evidence = parsed['docs/sound-runtime-media-gate-2ab-proof-evidence-acceptance-register.md']
assert(evidence.acceptedEvidence.pr914OwnerReviewDecision === ownerDecision, 'accepted PR #914 evidence mismatch')
assert(evidence.acceptedEvidence.pr909Gate2aaDecision === gate2aaDecision, 'accepted PR #909 evidence mismatch')
assert(evidence.acceptedEvidence.serverRouteExecuted === false, 'accepted evidence server route execution must be false')
assert(evidence.acceptedEvidence.workerExecutionRun === false, 'accepted evidence worker execution must be false')
assert(evidence.acceptedEvidence.supabaseSqlRun === false, 'accepted evidence Supabase/SQL must be false')
assert(evidence.evidenceAcceptedForToday.includes('route_readiness_claim_boundary_owner_review'), 'owner review evidence acceptance missing')
assert(evidence.evidenceRejectedForToday.includes('worker_execution_unlock'), 'worker execution rejection missing')

const blockers = parsed['docs/sound-runtime-media-gate-2ab-execution-blocker-register.md']
assert(blockers.nextBlockers.some((row) => row.blockerId === 'route_readiness_claim_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.nextBlockers.some((row) => row.blockerId === 'worker_media_supabase_execution_owner_gate_pending'), 'execution owner-gate blocker missing')
for (const value of Object.values(blockers.closedExecutionScopes)) {
  assert(value === true, 'closed execution scopes must remain true')
}
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const policy = parsed['docs/sound-runtime-media-gate-2ab-runtime-claim-policy.md']
assert(policy.allowedClaims.routeReadinessClaimBoundaryCreated === true, 'allowed boundary claim missing')
assert(policy.allowedClaims.routeReadinessClaimedToday === false, 'route readiness claim must remain false')
assert(policy.allowedClaims.workerExecutionRunInGate2ab === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlRunInGate2ab === false, 'Supabase/SQL claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.forbiddenClaims.includes('worker_execution_enabled'), 'worker execution forbidden claim missing')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AB decision')
assert(nextPrompt.includes('must not edit runtime source'), 'next prompt must block source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block widened readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ab:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2ab-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ab_diagnostics_passed',
  decision,
  sourceHead,
  pr914Verified: true,
  routeReadinessClaimBoundaryCreated: true,
  routeReadinessClaimedToday: false,
  workerExecutionRunInGate2ab: false,
  supabaseSqlRunInGate2ab: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-READINESS-CLAIM-OWNER-REVIEW: review route-readiness claim boundary, no worker/media/Supabase execution'
}, null, 2))
