import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_claim_owner_review_passed_with_warnings_ready_for_worker_media_supabase_execution_owner_gate_plan'
const gate2abDecision = 'sound_runtime_media_gate_2ab_route_readiness_claim_owner_gate_completed_with_warnings_ready_for_route_readiness_claim_owner_review'
const sourceHead = 'f2b5290dff46d034f8b6b0f60dde7c2db47da46c'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-execution-boundary-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr919.status === 'merged', 'PR #919 merge evidence missing')
assert(review.sourceVerification.pr919.mergeCommit === sourceHead, 'PR #919 merge commit mismatch')
assert(review.sourceVerification.pr919.decision === gate2abDecision, 'PR #919 decision mismatch')
assert(review.ownerReviewResult.boundedRouteReadinessClaimAcceptedForPlanning === true, 'bounded claim acceptance missing')
assert(review.ownerReviewResult.futureWorkerMediaSupabaseExecutionOwnerGatePlanMayProceed === true, 'future Gate 2AC flag missing')
assert(review.ownerReviewResult.routeReadinessClaimAcceptedForExecutionToday === false, 'route readiness execution claim must remain false')
assert(review.ownerReviewResult.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(review.ownerReviewResult.mediaProcessingApprovedToday === false, 'media processing must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')
assert(review.ownerReviewResult.acceptedForBetaOrProductionToday === false, 'beta/production must remain false')

const gate2ab = parseJsonBlock('docs/sound-runtime-media-gate-2ab-route-readiness-claim-owner-gate.md')
assert(gate2ab.decision === gate2abDecision, 'Gate 2AB decision mismatch')
assert(gate2ab.sourceVerification.pr914.mergeCommit === '530e0597bba6dd288d9923c11719d9ec97310f5f', 'PR #914 source evidence mismatch')
assert(gate2ab.claimGateResult.routeReadinessClaimBoundaryCreated === true, 'Gate 2AB boundary missing')
assert(gate2ab.claimGateResult.routeReadinessClaimedToday === false, 'Gate 2AB must not claim execution readiness')
assert(gate2ab.claimGateResult.workerExecutionRunInGate2ab === false, 'Gate 2AB worker execution must be false')
assert(gate2ab.claimGateResult.supabaseSqlRunInGate2ab === false, 'Gate 2AB Supabase/SQL must be false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-acceptance-register.md']
assert(acceptance.acceptedForFuturePlanningOnly.includes('worker_media_supabase_execution_owner_gate_plan'), 'Gate 2AC planning acceptance missing')
assert(acceptance.acceptedBoundary.acceptedCaseCount === 4, 'accepted count mismatch')
assert(acceptance.acceptedBoundary.rejectedCaseCount === 5, 'rejected count mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-evidence-register.md']
assert(evidence.acceptedPr919Evidence.gate2abDecision === gate2abDecision, 'accepted PR #919 evidence mismatch')
assert(evidence.acceptedPr919Evidence.mergeCommit === sourceHead, 'accepted PR #919 merge commit mismatch')
assert(evidence.acceptedPr919Evidence.routeReadinessClaimBoundaryCreated === true, 'accepted claim boundary missing')
assert(evidence.acceptedPr919Evidence.routeReadinessClaimedToday === false, 'accepted route readiness today must be false')
assert(evidence.remainingBeforeExecution.includes('worker_media_supabase_execution_owner_gate_plan'), 'execution gate gap missing')

const boundary = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-execution-boundary-register.md']
assertAllFalse(boundary.currentOwnerReviewExecution, 'currentOwnerReviewExecution')
assert(boundary.futureGate2acBoundary.workerMediaSupabaseExecutionOwnerGatePlanMayProceed === true, 'future Gate 2AC flag missing')
assert(boundary.futureGate2acBoundary.executionMayRunInGate2ac === false, 'execution must not run in Gate 2AC')
assert(boundary.futureGate2acBoundary.supabaseSqlMayRunInGate2ac === false, 'Supabase/SQL must not run in Gate 2AC')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'route_readiness_claim_owner_review_pending'), 'owner review blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'worker_media_supabase_execution_owner_gate_plan_pending' && row.status === 'next'), 'Gate 2AC next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-policy.md']
assert(policy.allowedClaims.boundedRouteReadinessClaimAcceptedForPlanning === true, 'allowed bounded claim missing')
assert(policy.allowedClaims.workerMediaSupabaseExecutionOwnerGatePlanMayProceed === true, 'allowed Gate 2AC claim missing')
assert(policy.allowedClaims.routeReadinessClaimAcceptedForExecutionToday === false, 'route readiness execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ac-worker-media-supabase-execution-owner-gate-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not edit runtime source'), 'next prompt must block source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block widened readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-route-readiness-claim-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_claim_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr919Verified: true,
  boundedRouteReadinessClaimAcceptedForPlanning: true,
  futureWorkerMediaSupabaseExecutionOwnerGatePlanMayProceed: true,
  routeReadinessClaimAcceptedForExecutionToday: false,
  workerExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AC: worker/media/Supabase execution owner-gate plan, no execution'
}, null, 2))
