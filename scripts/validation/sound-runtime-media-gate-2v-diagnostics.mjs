import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2v_route_readiness_proof_gap_closure_plan_completed_with_warnings_ready_for_proof_gap_closure_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_criteria_owner_review_passed_with_warnings_ready_for_proof_gap_closure_plan'
const gate2uDecision = 'sound_runtime_media_gate_2u_route_readiness_criteria_plan_completed_with_warnings_ready_for_criteria_owner_review'
const sourceHead = 'b678413e73799c4ee5942a226bf71143fad5b134'

const docs = [
  'docs/sound-runtime-media-gate-2v-route-readiness-proof-gap-closure-plan.md',
  'docs/sound-runtime-media-gate-2v-gap-closure-register.md',
  'docs/sound-runtime-media-gate-2v-proof-readiness-dependency-map.md',
  'docs/sound-runtime-media-gate-2v-negative-payload-preservation-plan.md',
  'docs/sound-runtime-media-gate-2v-blocked-readiness-register.md',
  'docs/sound-runtime-media-gate-2v-runtime-claim-policy.md',
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

const plan = parsed['docs/sound-runtime-media-gate-2v-route-readiness-proof-gap-closure-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr870.status === 'merged', 'PR #870 merge evidence missing')
assert(plan.sourceVerification.pr870.mergeCommit === sourceHead, 'PR #870 merge commit mismatch')
assert(plan.sourceVerification.pr870.decision === sourceDecision, 'PR #870 decision mismatch')
assert(plan.sourceVerification.pr867.decision === gate2uDecision, 'PR #867 decision mismatch')
assert(plan.proofGapClosurePlan.planCreated === true, 'proof gap closure plan not created')
assert(plan.proofGapClosurePlan.criteriaAcceptedForPlanning === true, 'criteria acceptance not preserved')
assert(plan.proofGapClosurePlan.criteriaSatisfiedToday === false, 'criteria must remain unsatisfied')
assert(plan.proofGapClosurePlan.routeReadinessClaimed === false, 'route readiness must remain unclaimed')
assert(plan.proofGapClosurePlan.routeResolverImportRunInGate2v === false, 'route resolver import must not run')
assert(plan.proofGapClosurePlan.serverRouteExecutionRunInGate2v === false, 'server route execution must not run')
assert(plan.proofGapClosurePlan.workerExecutionRunInGate2v === false, 'worker execution must not run')

const sourceOwner = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-review.md')
assert(sourceOwner.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceOwner.sourceVerification.sourceHead === 'a2a114304506dfc4895976eeb6938d112ffaee32', 'source owner-review head mismatch')
assert(sourceOwner.ownerReviewResult.gate2uCriteriaAcceptedForProofGapClosurePlanning === true, 'source owner review did not accept criteria for proof-gap planning')
assert(sourceOwner.ownerReviewResult.routeReadinessClaimAllowedToday === false, 'source owner review must not allow readiness today')
assert(sourceOwner.ownerReviewResult.routeResolverImportApprovedToday === false, 'source owner review must not approve resolver import')
assert(sourceOwner.ownerReviewResult.serverRouteExecutionApprovedToday === false, 'source owner review must not approve route execution')

const gate2uPlan = parseJsonBlock('docs/sound-runtime-media-gate-2u-route-readiness-criteria-plan.md')
assert(gate2uPlan.decision === gate2uDecision, 'Gate 2U decision mismatch')
assert(gate2uPlan.criteriaPlanResult.routeReadinessCriteriaPlanCreated === true, 'Gate 2U criteria plan missing')
assert(gate2uPlan.criteriaPlanResult.criteriaSatisfiedToday === false, 'Gate 2U criteria must remain unsatisfied')
assert(gate2uPlan.criteriaPlanResult.routeReadinessClaimed === false, 'Gate 2U route readiness must remain unclaimed')
assert(gate2uPlan.criteriaPlanResult.routeResolverImportedInGate2u === false, 'Gate 2U route resolver import must remain false')
assert(gate2uPlan.criteriaPlanResult.serverRouteExecutedInGate2u === false, 'Gate 2U server route execution must remain false')

const gapRegister = parsed['docs/sound-runtime-media-gate-2v-gap-closure-register.md']
assert(gapRegister.plannedGapClosureItems.length === 5, 'expected five planned gap closure items')
assert(gapRegister.allGapsRemainOpenToday === true, 'all gaps must remain open today')
for (const item of gapRegister.plannedGapClosureItems) {
  assert(item.statusAfterGate2v.includes('not_') || item.statusAfterGate2v === 'blocked_not_requested', `${item.gapId} must not be closed in Gate 2V`)
}

const dependencyMap = parsed['docs/sound-runtime-media-gate-2v-proof-readiness-dependency-map.md']
assert(dependencyMap.sourceEvidence.canonicalRejectedPayloadFieldCount === 14, 'canonical rejected field count mismatch')
assert(dependencyMap.sourceEvidence.fixtureCount === 9, 'fixture count mismatch')
assert(dependencyMap.sourceEvidence.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(dependencyMap.sourceEvidence.mismatchCaseCount === 5, 'mismatch case count mismatch')
assert(dependencyMap.routeReadinessMayBeClaimedToday === false, 'route readiness may not be claimed today')

const negativePlan = parsed['docs/sound-runtime-media-gate-2v-negative-payload-preservation-plan.md']
assert(negativePlan.negativePayloadPreservation.preserveMismatchCoverageBeforeRouteExecution === true, 'mismatch coverage preservation missing')
assert(negativePlan.negativePayloadPreservation.newFixtureExecutionRunInGate2v === false, 'new fixture execution must not run')
assert(negativePlan.negativePayloadPreservation.serverRouteImportedInGate2v === false, 'server route import must not run')
assert(negativePlan.negativePayloadPreservation.routeResolverImportedInGate2v === false, 'route resolver import must not run')

const blocked = parsed['docs/sound-runtime-media-gate-2v-blocked-readiness-register.md']
for (const value of Object.values(blocked.blockedReadinessClaims)) {
  assert(value === 'blocked_unclaimed', 'readiness claims must remain blocked_unclaimed')
}
for (const value of Object.values(blocked.blockedExecutionScopes)) {
  assert(value === true, 'execution scopes must remain blocked')
}

const policy = parsed['docs/sound-runtime-media-gate-2v-runtime-claim-policy.md']
assert(policy.allowedClaims.proofGapClosurePlanCreated === true, 'allowed plan claim missing')
assert(policy.allowedClaims.proofGapClosureOwnerReviewMayProceed === true, 'owner review may proceed claim missing')
assert(policy.allowedClaims.routeReadinessClaimed === false, 'route readiness claim must be false')
assert(policy.allowedClaims.workerReadinessClaimed === false, 'worker readiness claim must be false')
for (const value of Object.values(policy.forbiddenInGate2v)) {
  assert(value === true, 'forbidden Gate 2V scope must remain true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-proof-gap-closure-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2V decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no route execution')
assert(nextPrompt.includes('must not import route resolvers'), 'next prompt must block route resolver imports')
assert(nextPrompt.includes('SOUND-RUNTIME-MEDIA-GATE-2W'), 'next prompt must name Gate 2W follow-up')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2v:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2v-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2v_diagnostics_passed',
  decision,
  sourceHead,
  proofGapClosurePlanCreated: true,
  criteriaSatisfiedToday: false,
  routeReadinessClaimed: false,
  routeResolverImportRunInGate2v: false,
  serverRouteExecutionRunInGate2v: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-READINESS-PROOF-GAP-CLOSURE-OWNER-REVIEW: review route-readiness proof gap closure plan, no route execution'
}, null, 2))
