import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_route_resolver_import_owner_review_passed_with_warnings_ready_for_controlled_import_proof'
const gate2wDecision = 'sound_runtime_media_gate_2w_route_resolver_import_owner_approval_plan_completed_with_warnings_ready_for_import_approval_owner_review'
const sourceHead = '9dce95a7ef92b877710f7128bc670eea99fb4ef1'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-route-resolver-import-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-route-resolver-import-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-resolver-import-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-import-proof-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-resolver-import-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-resolver-import-owner-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-route-resolver-import-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr878.status === 'merged', 'PR #878 merge evidence missing')
assert(review.sourceVerification.pr878.mergeCommit === sourceHead, 'PR #878 merge commit mismatch')
assert(review.sourceVerification.pr878.decision === gate2wDecision, 'PR #878 decision mismatch')
assert(review.ownerReviewResult.gate2wPlanAcceptedForControlledImportProof === true, 'Gate 2W plan must be accepted for controlled import proof')
assert(review.ownerReviewResult.controlledImportProofMayProceed === true, 'controlled import proof may proceed missing')
assert(review.ownerReviewResult.routeResolverImportApprovedForFutureProofOnly === true, 'future proof-only import approval missing')
assert(review.ownerReviewResult.routeResolverImportedToday === false, 'resolver import must not run today')
assert(review.ownerReviewResult.serverRouteExecutedToday === false, 'server route execution must not run today')
assert(review.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'route readiness claim must be blocked')

const gate2w = parseJsonBlock('docs/sound-runtime-media-gate-2w-route-resolver-import-owner-approval-plan.md')
assert(gate2w.decision === gate2wDecision, 'Gate 2W decision mismatch')
assert(gate2w.sourceVerification.sourceHead === 'f1ca1749b2077e236d7716490c254c2395899861', 'Gate 2W source head mismatch')
assert(gate2w.ownerApprovalPlan.routeResolverImportApprovalCriteriaDefined === true, 'Gate 2W criteria missing')
assert(gate2w.ownerApprovalPlan.routeResolverImportApprovedToday === false, 'Gate 2W import must not be approved today')
assert(gate2w.ownerApprovalPlan.routeResolverImportedInGate2w === false, 'Gate 2W resolver import must remain false')
assert(gate2w.ownerApprovalPlan.serverRouteExecutedInGate2w === false, 'Gate 2W route execution must remain false')
assert(gate2w.ownerApprovalPlan.routeReadinessClaimed === false, 'Gate 2W route readiness must remain false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-route-resolver-import-acceptance-register.md']
assert(acceptance.acceptedForFutureProofOnly.includes('controlledRouteResolverImportProofMayProceed'), 'controlled import proof acceptance missing')
for (const value of Object.values(acceptance.acceptedForExecutionToday)) {
  assert(value === false, 'execution acceptance must remain false')
}

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-route-resolver-import-evidence-register.md']
assert(evidence.acceptedGate2wEvidence.gate2wDecision === gate2wDecision, 'accepted Gate 2W evidence decision mismatch')
assert(evidence.acceptedGate2wEvidence.routeResolverImportApprovalCriteriaDefined === true, 'accepted criteria evidence missing')
assert(evidence.acceptedGate2wEvidence.routeResolverImportedInGate2w === false, 'Gate 2W import evidence must be false')
assert(evidence.acceptedGate2wEvidence.serverRouteExecutedInGate2w === false, 'Gate 2W route execution evidence must be false')
assert(evidence.futureProofRequirements.includes('no_server_route_execution'), 'no server route execution requirement missing')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-import-proof-readiness-register.md']
assert(readiness.controlledImportProofReadiness.proofMayProceedInNextGate === true, 'next proof may proceed missing')
assert(readiness.controlledImportProofReadiness.serverRouteExecutionAllowedInNextGate === false, 'server route execution must be disallowed in next gate')
assert(readiness.controlledImportProofReadiness.routeReadinessClaimAllowedAfterImportAlone === false, 'import alone must not allow readiness claim')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-route-resolver-import-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'route_resolver_import_owner_approval_pending'), 'resolved import approval blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'controlled_route_resolver_import_proof_not_run'), 'controlled import proof blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_claim_blocked'), 'readiness blocked blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-route-resolver-import-owner-claim-policy.md']
assert(policy.allowedClaims.gate2wAcceptedForControlledImportProof === true, 'Gate 2W acceptance claim missing')
assert(policy.allowedClaims.routeResolverImportApprovedForFutureProofOnly === true, 'future import approval claim missing')
assert(policy.allowedClaims.routeResolverImportedToday === false, 'resolver import today claim must be false')
assert(policy.allowedClaims.serverRouteExecutedToday === false, 'route execution today claim must be false')
assert(policy.allowedClaims.routeReadinessClaimAllowedToday === false, 'readiness today claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'forbidden generated fixture claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'forbidden dry run claim missing')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2x-controlled-route-resolver-import-proof.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no route execution')
assert(nextPrompt.includes('must not execute server routes'), 'next prompt must block route execution')
assert(nextPrompt.includes('sound_runtime_media_gate_2x_blocked_import_scope_unclear'), 'blocked import scope fallback missing')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-route-resolver-import-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-resolver-import-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_resolver_import_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  controlledImportProofMayProceed: true,
  routeResolverImportApprovedForFutureProofOnly: true,
  routeResolverImportedToday: false,
  serverRouteExecutedToday: false,
  routeReadinessClaimAllowedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2X: controlled route resolver import proof, no route execution'
}, null, 2))
