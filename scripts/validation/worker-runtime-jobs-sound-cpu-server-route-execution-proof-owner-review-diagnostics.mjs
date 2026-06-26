import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_owner_review_passed_with_warnings_ready_for_route_readiness_proof_closure_plan'
const gate2zFixDecision = 'sound_runtime_media_gate_2z_typescript_runtime_loading_fix_passed_with_warnings_ready_for_server_route_execution_proof_owner_review'
const gate2zBlockedDecision = 'sound_runtime_media_gate_2z_blocked_typescript_runtime_loading'
const sourceHead = '891c7857b6c7d6e885b4143656cd84391306ad67'
const gate2zFixSourceHead = '0af8840a88850f284b029a357ce868d60ed4ae58'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-boundary-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr900.status === 'merged', 'PR #900 merge evidence missing')
assert(review.sourceVerification.pr900.mergeCommit === sourceHead, 'PR #900 merge commit mismatch')
assert(review.sourceVerification.pr900.decision === gate2zFixDecision, 'PR #900 decision mismatch')
assert(review.sourceVerification.pr898.status === 'merged', 'PR #898 merge evidence missing')
assert(review.sourceVerification.pr898.decision === gate2zBlockedDecision, 'PR #898 decision mismatch')
assert(review.ownerReviewResult.gate2zFixAndProofAcceptedForRouteReadinessProofClosurePlanning === true, 'Gate 2Z fix/proof acceptance missing')
assert(review.ownerReviewResult.futureGate2aaRouteReadinessProofClosurePlanMayProceed === true, 'Gate 2AA may proceed missing')
assert(review.ownerReviewResult.typescriptRuntimeLoadingBlockerResolved === true, 'runtime loading blocker resolution missing')
assert(review.ownerReviewResult.staticInMemoryResolverProofPassed === true, 'static resolver proof pass missing')
assert(review.ownerReviewResult.acceptedCaseCount === 4, 'accepted case count mismatch')
assert(review.ownerReviewResult.rejectedCaseCount === 5, 'rejected case count mismatch')
assert(review.ownerReviewResult.sourceEditedInThisOwnerReview === false, 'owner review must not edit source')
assert(review.ownerReviewResult.proofRerunInThisOwnerReview === false, 'owner review must not rerun proof')
assert(review.ownerReviewResult.serverRouteExecutedInThisOwnerReview === false, 'owner review must not execute server route')
assert(review.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'readiness claim must remain blocked')
assert(review.ownerReviewResult.acceptedForBetaOrProductionToday === false, 'beta/production must remain blocked')

const gate2zFix = parseJsonBlock('docs/sound-runtime-media-gate-2z-typescript-runtime-loading-fix-result.md')
assert(gate2zFix.decision === gate2zFixDecision, 'Gate 2Z fix decision mismatch')
assert(gate2zFix.sourceVerification.sourceHead === gate2zFixSourceHead, 'Gate 2Z fix source head mismatch')
assert(gate2zFix.proofResult.proofStatus === 'passed', 'Gate 2Z proof must pass')
assert(gate2zFix.proofResult.imported === true, 'Gate 2Z import must pass')
assert(gate2zFix.proofResult.resolverInvoked === true, 'Gate 2Z resolver invocation missing')
assert(gate2zFix.proofResult.assertionInvoked === true, 'Gate 2Z assertion invocation missing')
assert(gate2zFix.proofResult.acceptedCaseCount === 4, 'Gate 2Z accepted count mismatch')
assert(gate2zFix.proofResult.rejectedCaseCount === 5, 'Gate 2Z rejected count mismatch')
assert(gate2zFix.proofResult.serverRouteExecuted === false, 'Gate 2Z server route execution must be false')
assert(gate2zFix.proofResult.workerExecutionRun === false, 'Gate 2Z worker execution must be false')
assert(gate2zFix.proofResult.supabaseSqlRun === false, 'Gate 2Z Supabase/SQL must be false')
assert(gate2zFix.proofResult.routeReadinessClaimed === false, 'Gate 2Z readiness must remain false')

const gate2zOutput = parseJsonBlock('docs/sound-runtime-media-gate-2z-server-route-proof-output-register.md')
assert(gate2zOutput.observedProofState.routeSourceImportCompleted === true, 'Gate 2Z route import completion missing')
assert(gate2zOutput.observedProofState.rejectedReasons.includes('unsafe_runtime_flag'), 'unsafe runtime flag rejection missing')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-acceptance-register.md']
assert(acceptance.acceptedForFuturePlanningOnly.includes('routeReadinessProofClosurePlanMayProceed'), 'proof closure planning acceptance missing')
assert(acceptance.acceptedProofCounts.exportCount === 9, 'export count mismatch')
assert(acceptance.acceptedProofCounts.acceptedCaseCount === 4, 'accepted proof count mismatch')
assert(acceptance.acceptedProofCounts.rejectedCaseCount === 5, 'rejected proof count mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-evidence-register.md']
assert(evidence.acceptedPr900Evidence.gate2zDecision === gate2zFixDecision, 'accepted PR #900 decision mismatch')
assert(evidence.acceptedPr900Evidence.mergeCommit === sourceHead, 'accepted PR #900 merge commit mismatch')
assert(evidence.acceptedPr900Evidence.proofStatus === 'passed', 'accepted proof status mismatch')
assert(evidence.acceptedPr900Evidence.imported === true, 'accepted import evidence missing')
assert(evidence.acceptedPr900Evidence.resolverInvoked === true, 'accepted resolver evidence missing')
assert(evidence.acceptedPr900Evidence.assertionInvoked === true, 'accepted assertion evidence missing')
assert(evidence.acceptedPr900Evidence.serverRouteExecuted === false, 'accepted server route execution must be false')
assert(evidence.acceptedPr900Evidence.workerExecutionRun === false, 'accepted worker execution must be false')
assert(evidence.acceptedPr900Evidence.supabaseSqlRun === false, 'accepted Supabase/SQL must be false')
assert(evidence.remainingBeforeAnyRouteReadinessClaim.includes('route_readiness_proof_closure_plan'), 'route readiness proof closure gap missing')

const boundary = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-boundary-register.md']
assert(boundary.acceptedGate2zBoundary.narrowRuntimeSourceImportSpecifierFix === true, 'accepted source fix boundary missing')
assert(boundary.acceptedGate2zBoundary.staticInMemoryPayloadResolverInvocation === true, 'accepted resolver boundary missing')
assert(boundary.acceptedGate2zBoundary.serverRouteExecution === false, 'accepted server route execution boundary must be false')
assertAllFalse(boundary.currentOwnerReviewExecution, 'currentOwnerReviewExecution')
assert(boundary.futureGate2aaBoundary.routeReadinessProofClosurePlanMayProceed === true, 'future Gate 2AA planning flag missing')
assert(boundary.futureGate2aaBoundary.routeReadinessClaimMayBeMadeInGate2aa === false, 'Gate 2AA must not claim readiness')
assert(boundary.futureGate2aaBoundary.workerExecutionMayRunInGate2aa === false, 'Gate 2AA must not run workers')
assert(boundary.futureGate2aaBoundary.supabaseSqlMayRunInGate2aa === false, 'Gate 2AA must not run Supabase/SQL')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'server_route_execution_proof_owner_review_pending'), 'owner review blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_proof_closure_plan_pending' && row.status === 'next'), 'Gate 2AA next blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_claim_blocked'), 'readiness blocked blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-claim-policy.md']
assert(policy.allowedClaims.gate2zFixAndProofAcceptedForRouteReadinessProofClosurePlanning === true, 'allowed acceptance claim missing')
assert(policy.allowedClaims.routeReadinessProofClosurePlanMayProceed === true, 'allowed closure planning claim missing')
assert(policy.allowedClaims.proofRerunInThisOwnerReview === false, 'proof rerun claim must be false')
assert(policy.allowedClaims.serverRouteExecutedInThisOwnerReview === false, 'server route execution claim must be false')
assert(policy.allowedClaims.routeReadinessClaimAllowedToday === false, 'route readiness claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2aa-route-readiness-proof-closure-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not claim route readiness'), 'next prompt must block route readiness claim')
assert(nextPrompt.includes('must not edit runtime source'), 'next prompt must block source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-server-route-execution-proof-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr900Verified: true,
  gate2zFixAndProofAcceptedForRouteReadinessProofClosurePlanning: true,
  futureGate2aaRouteReadinessProofClosurePlanMayProceed: true,
  proofRerunInThisOwnerReview: false,
  serverRouteExecutedInThisOwnerReview: false,
  workerExecutionApprovedToday: false,
  routeReadinessClaimAllowedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AA: route readiness proof closure plan, no worker/media/Supabase execution'
}, null, 2))
