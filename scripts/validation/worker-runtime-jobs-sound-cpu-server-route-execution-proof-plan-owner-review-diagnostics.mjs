import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_plan_owner_review_passed_with_warnings_ready_for_controlled_server_route_execution_proof'
const gate2yDecision = 'sound_runtime_media_gate_2y_controlled_server_route_execution_proof_plan_completed_with_warnings_ready_for_route_execution_plan_owner_review'
const sourceHead = 'e9458954f1f85d6efd924df64a197bc15bd8c6a9'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-boundary-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-owner-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-owner-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr892.status === 'merged', 'PR #892 merge evidence missing')
assert(review.sourceVerification.pr892.mergeCommit === sourceHead, 'PR #892 merge commit mismatch')
assert(review.sourceVerification.pr892.decision === gate2yDecision, 'PR #892 decision mismatch')
assert(review.reviewResult.gate2yPlanAccepted === true, 'Gate 2Y plan acceptance missing')
assert(review.reviewResult.controlledServerRouteExecutionProofMayProceed === true, 'controlled server route proof may proceed missing')
assert(review.reviewResult.acceptedForFutureGate2zOnly === true, 'future-only acceptance missing')
assert(review.reviewResult.serverRouteExecutionRunInThisOwnerReview === false, 'owner review must not execute server route')
assert(review.reviewResult.resolverInvokedInThisOwnerReview === false, 'owner review must not invoke resolver')
assert(review.reviewResult.routeSourceImportedInThisOwnerReview === false, 'owner review must not import route source')
assert(review.reviewResult.routeReadinessClaimAllowedToday === false, 'readiness must remain blocked')

const gate2y = parseJsonBlock('docs/sound-runtime-media-gate-2y-controlled-server-route-execution-proof-plan.md')
assert(gate2y.decision === gate2yDecision, 'Gate 2Y decision mismatch')
assert(gate2y.sourceVerification.pr888.status === 'merged', 'Gate 2Y PR #888 evidence missing')
assert(gate2y.planningMode === 'controlled_server_route_execution_proof_plan_only', 'Gate 2Y planning mode mismatch')
assert(gate2y.plannedProofSurface.plannedResolverExport === 'resolveSoundCpuSyntheticRoute', 'Gate 2Y resolver export mismatch')
assert(gate2y.gate2yActions.planCreated === true, 'Gate 2Y plan-created flag missing')
assert(gate2y.gate2yActions.sourceImported === false, 'Gate 2Y must not import source')
assert(gate2y.gate2yActions.serverRouteExecuted === false, 'Gate 2Y must not execute server route')
assert(gate2y.gate2yActions.resolverInvoked === false, 'Gate 2Y must not invoke resolver')
assert(gate2y.gate2yActions.routeReadinessClaimed === false, 'Gate 2Y must not claim readiness')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-acceptance-register.md']
assert(acceptance.acceptedForFutureGate2zOnly.includes('resolveSoundCpuSyntheticRouteFutureInvocation'), 'future resolver acceptance missing')
assert(acceptance.acceptedForFutureGate2zOnly.includes('assertSoundCpuSyntheticRouteAcceptedFutureInvocation'), 'future assertion acceptance missing')
for (const value of Object.values(acceptance.acceptedForThisOwnerReviewExecution)) {
  assert(value === false, 'owner review execution acceptance must remain false')
}
assert(acceptance.acceptedCountsForFutureProof.minimumPlannedFixtureCount === 9, 'future proof fixture count mismatch')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-evidence-register.md']
assert(evidence.acceptedGate2yEvidence.gate2yDecision === gate2yDecision, 'accepted Gate 2Y decision mismatch')
assert(evidence.acceptedGate2yEvidence.planCreated === true, 'accepted plan-created evidence missing')
assert(evidence.acceptedGate2yEvidence.routeIndexPath === 'server/workers/sound-cpu/index.ts', 'route index evidence mismatch')
assert(evidence.acceptedGate2yEvidence.serverRouteExecuted === false, 'accepted server route execution must be false')
assert(evidence.acceptedGate2yEvidence.resolverInvoked === false, 'accepted resolver invocation must be false')
assert(evidence.remainingBeforeAnyReadinessClaim.includes('controlled_server_route_execution_proof'), 'route proof requirement missing')

const boundary = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-boundary-owner-register.md']
assert(boundary.futureGate2zAllowedBoundary.mayImportRouteIndex === true, 'future route import boundary missing')
assert(boundary.futureGate2zAllowedBoundary.staticInMemoryPayloadsOnly === true, 'static payload boundary missing')
for (const value of Object.values(boundary.futureGate2zStillForbidden)) {
  assert(value === true, 'future forbidden boundary must stay true')
}
assert(boundary.ownerReviewBoundaryResult.serverRouteExecutedInOwnerReview === false, 'owner review route execution must be false')
assert(boundary.ownerReviewBoundaryResult.resolverInvokedInOwnerReview === false, 'owner review resolver invocation must be false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'route_execution_plan_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'controlled_server_route_execution_proof_not_run'), 'proof-not-run blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-owner-claim-policy.md']
assert(policy.allowedClaims.gate2yPlanAccepted === true, 'plan accepted claim missing')
assert(policy.allowedClaims.controlledServerRouteExecutionProofMayProceed === true, 'future proof may proceed claim missing')
assert(policy.allowedClaims.routeSourceImportedInThisOwnerReview === false, 'route source import in owner review must be false')
assert(policy.allowedClaims.serverRouteExecutedInThisOwnerReview === false, 'server route execution in owner review must be false')
assert(policy.allowedClaims.routeReadinessClaimAllowedToday === false, 'readiness today must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2z-controlled-server-route-execution-proof.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('may import the approved route source'), 'next prompt must describe bounded route source import')
assert(nextPrompt.includes('must not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('no worker/media/Supabase execution'), 'next prompt must preserve bounded scope')
assert(nextPrompt.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-SERVER-ROUTE-EXECUTION-PROOF-OWNER-REVIEW'), 'next owner proof review prompt missing')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-server-route-execution-proof-plan-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_plan_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  gate2yPlanAccepted: true,
  controlledServerRouteExecutionProofMayProceed: true,
  serverRouteExecutedInThisOwnerReview: false,
  routeReadinessClaimAllowedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2Z: controlled server route execution proof, no worker/media/Supabase execution'
}, null, 2))
