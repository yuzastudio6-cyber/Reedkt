import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2w_route_resolver_import_owner_approval_plan_completed_with_warnings_ready_for_import_approval_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_proof_gap_closure_owner_review_passed_with_warnings_ready_for_route_resolver_import_owner_approval_plan'
const gate2vDecision = 'sound_runtime_media_gate_2v_route_readiness_proof_gap_closure_plan_completed_with_warnings_ready_for_proof_gap_closure_owner_review'
const sourceHead = 'f1ca1749b2077e236d7716490c254c2395899861'

const docs = [
  'docs/sound-runtime-media-gate-2w-route-resolver-import-owner-approval-plan.md',
  'docs/sound-runtime-media-gate-2w-import-approval-criteria-register.md',
  'docs/sound-runtime-media-gate-2w-import-scope-register.md',
  'docs/sound-runtime-media-gate-2w-route-execution-blocker-register.md',
  'docs/sound-runtime-media-gate-2w-safety-boundary-register.md',
  'docs/sound-runtime-media-gate-2w-runtime-claim-policy.md',
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

const plan = parsed['docs/sound-runtime-media-gate-2w-route-resolver-import-owner-approval-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr875.status === 'merged', 'PR #875 merge evidence missing')
assert(plan.sourceVerification.pr875.mergeCommit === sourceHead, 'PR #875 merge commit mismatch')
assert(plan.sourceVerification.pr875.decision === ownerDecision, 'PR #875 decision mismatch')
assert(plan.sourceVerification.pr873.decision === gate2vDecision, 'PR #873 decision mismatch')
assert(plan.ownerApprovalPlan.planCreated === true, 'owner approval plan not created')
assert(plan.ownerApprovalPlan.routeResolverImportApprovalCriteriaDefined === true, 'import approval criteria missing')
assert(plan.ownerApprovalPlan.routeResolverImportApprovedToday === false, 'route resolver import must not be approved today')
assert(plan.ownerApprovalPlan.routeResolverImportedInGate2w === false, 'route resolver must not be imported in Gate 2W')
assert(plan.ownerApprovalPlan.serverRouteImportedInGate2w === false, 'server route must not be imported in Gate 2W')
assert(plan.ownerApprovalPlan.serverRouteExecutedInGate2w === false, 'server route must not execute in Gate 2W')
assert(plan.ownerApprovalPlan.workerExecutionRunInGate2w === false, 'worker execution must not run in Gate 2W')
assert(plan.ownerApprovalPlan.routeReadinessClaimed === false, 'route readiness must remain unclaimed')

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-owner-review.md')
assert(ownerReview.decision === ownerDecision, 'source owner-review decision mismatch')
assert(ownerReview.sourceVerification.sourceHead === 'd3253e40ea4c6650bdbcbbeb1f6781e37135338f', 'source owner-review head mismatch')
assert(ownerReview.ownerReviewResult.gate2vPlanAcceptedForRouteResolverImportApprovalPlanning === true, 'source owner review did not accept Gate 2V for import approval planning')
assert(ownerReview.ownerReviewResult.routeResolverImportApprovedToday === false, 'source owner review must not approve import today')
assert(ownerReview.ownerReviewResult.routeResolverImportRunToday === false, 'source owner review must not run import today')
assert(ownerReview.ownerReviewResult.serverRouteExecutionRunToday === false, 'source owner review must not execute route today')
assert(ownerReview.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'source owner review must not allow readiness today')

const gate2v = parseJsonBlock('docs/sound-runtime-media-gate-2v-route-readiness-proof-gap-closure-plan.md')
assert(gate2v.decision === gate2vDecision, 'Gate 2V decision mismatch')
assert(gate2v.proofGapClosurePlan.routeResolverImportRunInGate2v === false, 'Gate 2V resolver import must remain false')
assert(gate2v.proofGapClosurePlan.serverRouteExecutionRunInGate2v === false, 'Gate 2V route execution must remain false')
assert(gate2v.proofGapClosurePlan.routeReadinessClaimed === false, 'Gate 2V route readiness must remain false')

const criteria = parsed['docs/sound-runtime-media-gate-2w-import-approval-criteria-register.md']
assert(criteria.criteriaBeforeAnyFutureResolverImport.length === 5, 'expected five import approval criteria')
assert(criteria.criteriaSatisfiedToday === false, 'criteria must not be satisfied today')
assert(criteria.criteriaBeforeAnyFutureResolverImport.some((row) => row.criterionId === 'WORKER_RUNTIME_JOBS_owner_review_accepts_import_scope'), 'owner review criterion missing')

const scope = parsed['docs/sound-runtime-media-gate-2w-import-scope-register.md']
assert(scope.futureImportScope.plannedTarget === 'server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs', 'planned target mismatch')
assert(scope.futureImportScope.approvedToImportToday === false, 'import must not be approved today')
assert(scope.futureImportScope.importedInGate2w === false, 'import must not run in Gate 2W')
assert(scope.explicitlyOutOfScope.includes('server route execution'), 'server route execution scope must be excluded')
assert(scope.explicitlyOutOfScope.includes('Supabase or SQL'), 'Supabase/SQL scope must be excluded')

const blockers = parsed['docs/sound-runtime-media-gate-2w-route-execution-blocker-register.md']
for (const value of Object.values(blockers.blockedUntilFutureExplicitGate)) {
  assert(value === true, 'execution/readiness blockers must remain true')
}

const safety = parsed['docs/sound-runtime-media-gate-2w-safety-boundary-register.md']
assert(safety.safetyBoundaries.supabaseUpdateRequired === 'no', 'Supabase update must be no')
assert(safety.safetyBoundaries.sqlExecuted === 'no', 'SQL execution must be no')
assert(safety.safetyBoundaries.dockerBuildRunPush === 'no', 'Docker build/run/push must be no')
assert(safety.forbiddenStatusClaimsRemainUnclaimed.includes('generated_local_fixture_passed'), 'generated fixture claim must remain unclaimed')
assert(safety.forbiddenStatusClaimsRemainUnclaimed.includes('dry_run_passed'), 'dry run claim must remain unclaimed')

const policy = parsed['docs/sound-runtime-media-gate-2w-runtime-claim-policy.md']
assert(policy.allowedClaims.routeResolverImportOwnerApprovalPlanCreated === true, 'allowed plan claim missing')
assert(policy.allowedClaims.importApprovalOwnerReviewMayProceed === true, 'owner review may proceed missing')
assert(policy.allowedClaims.routeResolverImportApprovedToday === false, 'approval claim must be false')
assert(policy.allowedClaims.routeResolverImportedInGate2w === false, 'import claim must be false')
assert(policy.allowedClaims.serverRouteExecutedInGate2w === false, 'route execution claim must be false')
assert(policy.allowedClaims.routeReadinessClaimed === false, 'route readiness claim must be false')
for (const value of Object.values(policy.forbiddenInGate2w)) {
  assert(value === true, 'forbidden Gate 2W scope must remain true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-resolver-import-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2W decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no route execution')
assert(nextPrompt.includes('must not import route resolvers'), 'next prompt must block resolver imports')
assert(nextPrompt.includes('SOUND-RUNTIME-MEDIA-GATE-2X'), 'next Gate 2X prompt missing')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2w:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2w-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2w_diagnostics_passed',
  decision,
  sourceHead,
  routeResolverImportApprovalCriteriaDefined: true,
  routeResolverImportApprovedToday: false,
  routeResolverImportedInGate2w: false,
  serverRouteExecutedInGate2w: false,
  routeReadinessClaimed: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-RESOLVER-IMPORT-OWNER-REVIEW: review route resolver import approval plan, no route execution'
}, null, 2))
