import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_controlled_route_resolver_import_proof_owner_review_passed_with_warnings_ready_for_route_execution_proof_plan'
const gate2xDecision = 'sound_runtime_media_gate_2x_controlled_route_resolver_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceHead = 'e1da4e59538364768598fe86c0c278ca8beddb7d'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-execution-proof-plan-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-owner-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr884.status === 'merged', 'PR #884 merge evidence missing')
assert(review.sourceVerification.pr884.mergeCommit === sourceHead, 'PR #884 merge commit mismatch')
assert(review.sourceVerification.pr884.decision === gate2xDecision, 'PR #884 decision mismatch')
assert(review.ownerReviewResult.controlledImportProofAccepted === true, 'controlled import proof must be accepted')
assert(review.ownerReviewResult.routeExecutionProofPlanMayProceed === true, 'route execution proof plan may proceed missing')
assert(review.ownerReviewResult.routeResolverImportProofPassed === true, 'import proof pass missing')
assert(review.ownerReviewResult.serverRouteExecutionApprovedToday === false, 'server route execution must not be approved today')
assert(review.ownerReviewResult.serverRouteExecutedToday === false, 'server route must not execute today')
assert(review.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'route readiness claim must be blocked')

const gate2x = parseJsonBlock('docs/sound-runtime-media-gate-2x-controlled-route-resolver-import-proof-result.md')
assert(gate2x.decision === gate2xDecision, 'Gate 2X decision mismatch')
assert(gate2x.sourceVerification.sourceHead === '6ff8028189b4f60552e61cfd2161d2b4e5c47d44', 'Gate 2X source head mismatch')
assert(gate2x.controlledImportProof.proofStatus === 'passed', 'Gate 2X proof must pass')
assert(gate2x.controlledImportProof.imported === true, 'Gate 2X import must be true')
assert(gate2x.controlledImportProof.functionInvoked === false, 'Gate 2X function must not be invoked')
assert(gate2x.controlledImportProof.serverRouteExecuted === false, 'Gate 2X route execution must be false')
assert(gate2x.controlledImportProof.routeReadinessClaimed === false, 'Gate 2X readiness must remain false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-acceptance-register.md']
assert(acceptance.acceptedForFuturePlanningOnly.includes('routeExecutionProofPlanMayProceed'), 'route execution proof planning acceptance missing')
for (const value of Object.values(acceptance.acceptedForExecutionToday)) {
  assert(value === false, 'execution acceptance must remain false')
}

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-evidence-register.md']
assert(evidence.acceptedGate2xEvidence.gate2xDecision === gate2xDecision, 'accepted Gate 2X decision mismatch')
assert(evidence.acceptedGate2xEvidence.controlledImportProofPassed === true, 'accepted import proof pass missing')
assert(evidence.acceptedGate2xEvidence.serverRouteExecuted === false, 'accepted route execution must be false')
assert(evidence.acceptedGate2xEvidence.routeReadinessClaimed === false, 'accepted readiness must be false')
assert(evidence.remainingBeforeAnyRouteReadinessClaim.includes('controlled_server_route_execution_proof'), 'route execution proof requirement missing')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-route-execution-proof-plan-readiness-register.md']
assert(readiness.routeExecutionProofPlanReadiness.planMayProceed === true, 'route execution proof plan may proceed missing')
assert(readiness.routeExecutionProofPlanReadiness.serverRouteExecutionApprovedToday === false, 'route execution must not be approved today')
assert(readiness.routeExecutionProofPlanReadiness.serverRouteExecutionMayRunInPlanGate === false, 'plan gate must not run routes')
assert(readiness.routeExecutionProofPlanReadiness.routeReadinessClaimAllowedAfterPlanOnly === false, 'plan alone must not allow readiness')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'controlled_route_resolver_import_proof_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'controlled_server_route_execution_proof_plan_pending'), 'route execution proof plan blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-owner-claim-policy.md']
assert(policy.allowedClaims.controlledImportProofAccepted === true, 'controlled import proof accepted claim missing')
assert(policy.allowedClaims.routeExecutionProofPlanMayProceed === true, 'route execution plan may proceed claim missing')
assert(policy.allowedClaims.serverRouteExecutedToday === false, 'server route execution today must be false')
assert(policy.allowedClaims.routeReadinessClaimAllowedToday === false, 'readiness today must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2y-controlled-server-route-execution-proof-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('no worker/media/Supabase execution'), 'next prompt must preserve bounded no-execution scope')
assert(nextPrompt.includes('must not execute server routes'), 'next prompt must block server route execution')
assert(nextPrompt.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-SERVER-ROUTE-EXECUTION-PROOF-PLAN-OWNER-REVIEW'), 'next owner review prompt missing')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-route-resolver-import-proof-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_route_resolver_import_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  controlledImportProofAccepted: true,
  routeExecutionProofPlanMayProceed: true,
  serverRouteExecutedToday: false,
  routeReadinessClaimAllowedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2Y: controlled server route execution proof plan, no worker/media/Supabase execution'
}, null, 2))
