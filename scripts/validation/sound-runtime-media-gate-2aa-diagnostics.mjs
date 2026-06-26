import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2aa_route_readiness_proof_closure_plan_completed_with_warnings_ready_for_route_readiness_proof_closure_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_owner_review_passed_with_warnings_ready_for_route_readiness_proof_closure_plan'
const gate2zDecision = 'sound_runtime_media_gate_2z_typescript_runtime_loading_fix_passed_with_warnings_ready_for_server_route_execution_proof_owner_review'
const criteriaDecision = 'sound_runtime_media_gate_2u_route_readiness_criteria_plan_completed_with_warnings_ready_for_criteria_owner_review'
const criteriaOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_criteria_owner_review_passed_with_warnings_ready_for_proof_gap_closure_plan'
const sourceHead = '7d86c6fa7e1b10e6c40939d5c941f8995bfe74b2'

const docs = [
  'docs/sound-runtime-media-gate-2aa-route-readiness-proof-closure-plan.md',
  'docs/sound-runtime-media-gate-2aa-proof-closure-evidence-map.md',
  'docs/sound-runtime-media-gate-2aa-criteria-reconciliation-register.md',
  'docs/sound-runtime-media-gate-2aa-closure-boundary-register.md',
  'docs/sound-runtime-media-gate-2aa-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2aa-runtime-claim-policy.md',
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

const plan = parsed['docs/sound-runtime-media-gate-2aa-route-readiness-proof-closure-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr904.status === 'merged', 'PR #904 evidence missing')
assert(plan.sourceVerification.pr904.mergeCommit === sourceHead, 'PR #904 merge commit mismatch')
assert(plan.sourceVerification.pr904.decision === ownerDecision, 'PR #904 decision mismatch')
assert(plan.sourceVerification.pr900.decision === gate2zDecision, 'PR #900 decision mismatch')
assert(plan.sourceVerification.pr867.decision === criteriaDecision, 'PR #867 decision mismatch')
assert(plan.closurePlanResult.routeReadinessProofClosurePlanCreated === true, 'closure plan creation missing')
assert(plan.closurePlanResult.criteriaEvidenceAccepted === true, 'criteria evidence acceptance missing')
assert(plan.closurePlanResult.serverRouteProofEvidenceAccepted === true, 'server route proof evidence acceptance missing')
assert(plan.closurePlanResult.staticInMemoryResolverProofPassed === true, 'static resolver proof pass missing')
assert(plan.closurePlanResult.acceptedCaseCount === 4, 'accepted case count mismatch')
assert(plan.closurePlanResult.rejectedCaseCount === 5, 'rejected case count mismatch')
assert(plan.closurePlanResult.routeReadinessClaimed === false, 'route readiness must not be claimed')
assert(plan.closurePlanResult.workerExecutionRunInGate2aa === false, 'worker execution must not run')

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-review.md')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(ownerReview.sourceVerification.sourceHead === '891c7857b6c7d6e885b4143656cd84391306ad67', 'owner review source head mismatch')
assert(ownerReview.ownerReviewResult.futureGate2aaRouteReadinessProofClosurePlanMayProceed === true, 'owner review did not allow Gate 2AA')
assert(ownerReview.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'owner review readiness claim must be false')

const gate2zFix = parseJsonBlock('docs/sound-runtime-media-gate-2z-typescript-runtime-loading-fix-result.md')
assert(gate2zFix.decision === gate2zDecision, 'Gate 2Z decision mismatch')
assert(gate2zFix.proofResult.proofStatus === 'passed', 'Gate 2Z proof must pass')
assert(gate2zFix.proofResult.resolverInvoked === true, 'Gate 2Z resolver invocation missing')
assert(gate2zFix.proofResult.serverRouteExecuted === false, 'Gate 2Z server route must be false')
assert(gate2zFix.proofResult.routeReadinessClaimed === false, 'Gate 2Z readiness must remain false')

const criteria = parseJsonBlock('docs/sound-runtime-media-gate-2u-route-readiness-criteria-plan.md')
assert(criteria.decision === criteriaDecision, 'criteria decision mismatch')
assert(criteria.criteriaPlanResult.criteriaSatisfiedToday === false, 'criteria must not have been satisfied today in Gate 2U')
assert(criteria.criteriaPlanResult.routeReadinessClaimed === false, 'Gate 2U readiness must remain unclaimed')
assert(criteria.criteriaPlanResult.canonicalRejectedPayloadFieldCount === 14, 'criteria rejected field count mismatch')
assert(criteria.criteriaPlanResult.acceptedFixtureCount === 4, 'criteria accepted fixture count mismatch')
assert(criteria.criteriaPlanResult.mismatchCaseCount === 5, 'criteria mismatch count mismatch')

const criteriaOwner = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-review.md')
assert(criteriaOwner.decision === criteriaOwnerDecision, 'criteria owner decision mismatch')
assert(criteriaOwner.ownerReviewResult.gate2uCriteriaAcceptedForProofGapClosurePlanning === true, 'criteria owner did not accept proof-gap closure planning')
assert(criteriaOwner.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'criteria owner readiness claim must be false')

const evidence = parsed['docs/sound-runtime-media-gate-2aa-proof-closure-evidence-map.md']
assert(evidence.acceptedEvidence.criteriaOwnerReviewDecision === criteriaOwnerDecision, 'criteria owner evidence mismatch')
assert(evidence.acceptedEvidence.serverRouteProofOwnerReviewDecision === ownerDecision, 'server route proof owner evidence mismatch')
assert(evidence.acceptedEvidence.gate2zProofStatus === 'passed', 'Gate 2Z proof status mismatch')
assert(evidence.acceptedEvidence.routeSourceImportCompleted === true, 'route source import completion missing')
assert(evidence.acceptedEvidence.resolverInvoked === true, 'resolver invocation evidence missing')
assert(evidence.acceptedEvidence.routeReadinessClaimed === false, 'readiness evidence must be false')
assert(evidence.evidenceGapsRemainingForReadinessClaim.includes('route_readiness_proof_closure_owner_review'), 'owner-review gap missing')

const reconciliation = parsed['docs/sound-runtime-media-gate-2aa-criteria-reconciliation-register.md']
assert(reconciliation.criteriaReconciliation.canonicalRejectedPayloadFieldCount === 14, 'reconciliation rejected field count mismatch')
assert(reconciliation.criteriaReconciliation.acceptedFixtureCount === 4, 'reconciliation accepted fixture count mismatch')
assert(reconciliation.criteriaReconciliation.pr900AcceptedStaticCaseCount === 4, 'PR #900 accepted count mismatch')
assert(reconciliation.criteriaReconciliation.pr900RejectedStaticCaseCount === 5, 'PR #900 rejected count mismatch')
assert(reconciliation.criteriaReconciliation.criteriaSatisfiedForPlanningReview === true, 'criteria should be satisfied for planning review')
assert(reconciliation.criteriaReconciliation.criteriaSatisfiedForReadinessClaimToday === false, 'criteria must not be readiness claim today')

const boundary = parsed['docs/sound-runtime-media-gate-2aa-closure-boundary-register.md']
assert(boundary.allowedInGate2aa.docsDiagnosticsOnlyClosurePlan === true, 'docs-only plan allowance missing')
for (const value of Object.values(boundary.notAllowedInGate2aa)) {
  assert(value === true, 'notAllowedInGate2aa entries must stay true')
}
for (const value of Object.values(boundary.actualGate2aaExecution)) {
  assert(value === false, 'actual Gate 2AA execution entries must stay false')
}

const blockers = parsed['docs/sound-runtime-media-gate-2aa-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'route_readiness_proof_closure_plan_pending'), 'resolved closure plan blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_proof_closure_owner_review_pending'), 'owner review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_claim_blocked'), 'readiness blocked blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/sound-runtime-media-gate-2aa-runtime-claim-policy.md']
assert(policy.allowedClaims.routeReadinessProofClosurePlanCreated === true, 'closure plan claim missing')
assert(policy.allowedClaims.routeReadinessClaimed === false, 'route readiness claim must be false')
assert(policy.allowedClaims.workerExecutionRun === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlRun === false, 'Supabase/SQL claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-proof-closure-owner-review.md')
assert(ownerPrompt.includes(decision), 'owner prompt must require Gate 2AA decision')
assert(ownerPrompt.includes('must not edit runtime source'), 'owner prompt must block source edits')
assert(ownerPrompt.includes('touch Supabase'), 'owner prompt must block Supabase')
assert(ownerPrompt.includes('claim route/worker/runtime/media readiness'), 'owner prompt must block readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2aa:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2aa-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2aa_diagnostics_passed',
  decision,
  sourceHead,
  pr904Verified: true,
  criteriaEvidenceAccepted: true,
  serverRouteProofEvidenceAccepted: true,
  closureOwnerReviewMayProceed: true,
  routeReadinessClaimed: false,
  workerExecutionRunInGate2aa: false,
  supabaseSqlRun: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-READINESS-PROOF-CLOSURE-OWNER-REVIEW: review route-readiness proof closure plan, no worker/media/Supabase execution'
}, null, 2))
