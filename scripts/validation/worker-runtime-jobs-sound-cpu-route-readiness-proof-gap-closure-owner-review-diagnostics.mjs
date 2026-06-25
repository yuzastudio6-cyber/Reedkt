import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_proof_gap_closure_owner_review_passed_with_warnings_ready_for_route_resolver_import_owner_approval_plan'
const gate2vDecision = 'sound_runtime_media_gate_2v_route_readiness_proof_gap_closure_plan_completed_with_warnings_ready_for_proof_gap_closure_owner_review'
const criteriaOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_criteria_owner_review_passed_with_warnings_ready_for_proof_gap_closure_plan'
const sourceHead = 'd3253e40ea4c6650bdbcbbeb1f6781e37135338f'
const gate2vSourceHead = 'b678413e73799c4ee5942a226bf71143fad5b134'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-route-resolver-import-approval-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-owner-claim-policy.md',
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr873.status === 'merged', 'PR #873 merge evidence missing')
assert(review.sourceVerification.pr873.mergeCommit === sourceHead, 'PR #873 merge commit mismatch')
assert(review.sourceVerification.pr873.decision === gate2vDecision, 'PR #873 decision mismatch')
assert(review.sourceVerification.pr870.decision === criteriaOwnerDecision, 'PR #870 decision mismatch')
assert(review.ownerReviewResult.gate2vPlanAcceptedForRouteResolverImportApprovalPlanning === true, 'Gate 2V must be accepted for import approval planning')
assert(review.ownerReviewResult.proofGapsClosedToday === false, 'proof gaps must remain open')
assert(review.ownerReviewResult.routeResolverImportApprovedToday === false, 'resolver import must not be approved today')
assert(review.ownerReviewResult.routeResolverImportRunToday === false, 'resolver import must not run today')
assert(review.ownerReviewResult.serverRouteExecutionRunToday === false, 'server route execution must not run today')
assert(review.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'route readiness claim must remain blocked')

const gate2vPlan = parseJsonBlock('docs/sound-runtime-media-gate-2v-route-readiness-proof-gap-closure-plan.md')
assert(gate2vPlan.decision === gate2vDecision, 'Gate 2V decision mismatch')
assert(gate2vPlan.sourceVerification.sourceHead === gate2vSourceHead, 'Gate 2V source head mismatch')
assert(gate2vPlan.sourceVerification.pr870.mergeCommit === gate2vSourceHead, 'Gate 2V PR #870 source evidence mismatch')
assert(gate2vPlan.proofGapClosurePlan.planCreated === true, 'Gate 2V plan missing')
assert(gate2vPlan.proofGapClosurePlan.criteriaSatisfiedToday === false, 'criteria must remain unsatisfied')
assert(gate2vPlan.proofGapClosurePlan.routeReadinessClaimed === false, 'Gate 2V route readiness must be unclaimed')
assert(gate2vPlan.proofGapClosurePlan.routeResolverImportRunInGate2v === false, 'Gate 2V resolver import must not run')
assert(gate2vPlan.proofGapClosurePlan.serverRouteExecutionRunInGate2v === false, 'Gate 2V route execution must not run')
assert(gate2vPlan.proofGapClosurePlan.workerExecutionRunInGate2v === false, 'Gate 2V worker execution must not run')

const gate2vBlocked = parseJsonBlock('docs/sound-runtime-media-gate-2v-blocked-readiness-register.md')
for (const value of Object.values(gate2vBlocked.blockedReadinessClaims)) {
  assert(value === 'blocked_unclaimed', 'Gate 2V readiness claims must remain blocked_unclaimed')
}

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-acceptance-register.md']
assert(acceptance.acceptedForFuturePlanningOnly.includes('routeResolverImportOwnerApprovalPlanMayProceed'), 'import approval planning acceptance missing')
for (const value of Object.values(acceptance.acceptedForExecutionToday)) {
  assert(value === false, 'execution acceptance must remain false')
}

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-evidence-register.md']
assert(evidence.acceptedGate2vEvidence.gate2vDecision === gate2vDecision, 'accepted Gate 2V evidence decision mismatch')
assert(evidence.acceptedGate2vEvidence.canonicalRejectedPayloadFieldCount === 14, 'canonical rejected field count mismatch')
assert(evidence.acceptedGate2vEvidence.fixtureCount === 9, 'fixture count mismatch')
assert(evidence.acceptedGate2vEvidence.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(evidence.acceptedGate2vEvidence.mismatchCaseCount === 5, 'mismatch case count mismatch')
assert(evidence.remainingBeforeAnyRouteReadinessProof.includes('route_resolver_import_owner_review'), 'route resolver owner review gap missing')

const importReadiness = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-route-resolver-import-approval-readiness-register.md']
assert(importReadiness.routeResolverImportApprovalReadiness.ownerApprovalPlanMayProceed === true, 'owner approval plan may proceed missing')
assert(importReadiness.routeResolverImportApprovalReadiness.ownerApprovalGrantedToday === false, 'owner approval must not be granted today')
assert(importReadiness.routeResolverImportApprovalReadiness.routeResolverImportDidRunToday === false, 'resolver import must not run today')
assert(importReadiness.routeResolverImportApprovalReadiness.serverRouteExecutionMayRunToday === false, 'server route execution may not run today')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'proof_gap_closure_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_resolver_import_owner_approval_pending'), 'remaining import approval blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must remain no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must remain no')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-owner-claim-policy.md']
assert(policy.allowedClaims.routeResolverImportOwnerApprovalPlanMayProceed === true, 'allowed import approval planning claim missing')
assert(policy.allowedClaims.proofGapsClosedToday === false, 'proof gaps must not be closed today')
assert(policy.allowedClaims.routeResolverImportRunToday === false, 'resolver import claim must be false')
assert(policy.allowedClaims.routeReadinessClaimAllowedToday === false, 'route readiness claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'forbidden generated fixture claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'forbidden dry run claim missing')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2w-route-resolver-import-owner-approval-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no route execution')
assert(nextPrompt.includes('must not import route resolvers'), 'next prompt must block route resolver imports')
assert(nextPrompt.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-RESOLVER-IMPORT-OWNER-REVIEW'), 'next owner-review prompt missing')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-route-readiness-proof-gap-closure-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_proof_gap_closure_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  gate2vPlanAcceptedForRouteResolverImportApprovalPlanning: true,
  proofGapsClosedToday: false,
  routeResolverImportApprovedToday: false,
  routeResolverImportRunToday: false,
  routeReadinessClaimAllowedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2W: route resolver import owner-approval plan, no route execution'
}, null, 2))
