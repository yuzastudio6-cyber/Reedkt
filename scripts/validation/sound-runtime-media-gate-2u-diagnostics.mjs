#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2u_route_readiness_criteria_plan_completed_with_warnings_ready_for_criteria_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_static_review_owner_review_passed_with_warnings_ready_for_route_readiness_criteria_plan'
const gate2tDecision = 'sound_runtime_media_gate_2t_bounded_route_readiness_static_review_completed_with_warnings_ready_for_static_review_owner_review'
const sourceHead = 'f06ac285bbfcba27762217acefd8a4617da5900d'

const docs = [
  ['docs/sound-runtime-media-gate-2u-route-readiness-criteria-plan.md', 'sound-runtime-media-gate-2u-route-readiness-criteria-plan'],
  ['docs/sound-runtime-media-gate-2u-criteria-register.md', 'sound-runtime-media-gate-2u-criteria-register'],
  ['docs/sound-runtime-media-gate-2u-proof-requirements-register.md', 'sound-runtime-media-gate-2u-proof-requirements-register'],
  ['docs/sound-runtime-media-gate-2u-blocked-readiness-register.md', 'sound-runtime-media-gate-2u-blocked-readiness-register'],
  ['docs/sound-runtime-media-gate-2u-blocker-follow-up-register.md', 'sound-runtime-media-gate-2u-blocker-follow-up-register'],
  ['docs/sound-runtime-media-gate-2u-runtime-claim-policy.md', 'sound-runtime-media-gate-2u-runtime-claim-policy'],
]

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function parseBlock(file, label) {
  const text = read(file)
  const marker = `\`\`\`json ${label}`
  const start = text.indexOf(marker)
  assert(start >= 0, `${file} missing JSON block ${label}`)
  const jsonStart = start + marker.length
  const end = text.indexOf('```', jsonStart)
  assert(end >= 0, `${file} missing JSON close`)
  return JSON.parse(text.slice(jsonStart, end).trim())
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must remain false`)
  }
}

for (const [file, label] of docs) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
  parseBlock(file, label)
}

const plan = parseBlock(docs[0][0], docs[0][1])
const criteria = parseBlock(docs[1][0], docs[1][1])
const proof = parseBlock(docs[2][0], docs[2][1])
const blocked = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-review.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-review')
const gate2t = parseBlock('docs/sound-runtime-media-gate-2t-bounded-route-readiness-static-review-result.md', 'sound-runtime-media-gate-2t-bounded-route-readiness-static-review-result')

for (const entry of [plan, criteria, proof, blocked, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2U decision mismatch')
}

assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr865.status === 'merged', 'PR #865 must be merged')
assert(plan.sourceVerification.pr865.mergeCommit === sourceHead, 'PR #865 merge commit mismatch')
assert(plan.sourceVerification.pr865.decision === ownerDecision, 'PR #865 decision mismatch')
assert(plan.sourceVerification.pr861.decision === gate2tDecision, 'PR #861 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(ownerReview.ownerReviewResult.gate2tStaticReviewAcceptedForCriteriaPlanning === true, 'owner criteria planning acceptance missing')
assert(ownerReview.ownerReviewResult.acceptedForRouteReadinessToday === false, 'owner route readiness must remain false')
assert(gate2t.decision === gate2tDecision, 'Gate 2T decision mismatch')
assert(gate2t.staticReviewResult.acceptedForRouteReadinessToday === false, 'Gate 2T route readiness must remain false')

assert(plan.criteriaPlanResult.routeReadinessCriteriaPlanCreated === true, 'criteria plan not created')
assert(plan.criteriaPlanResult.canonicalRejectedPayloadFieldCount === 14, 'canonical field count mismatch')
assert(plan.criteriaPlanResult.fixtureCount === 9, 'fixture count mismatch')
assert(plan.criteriaPlanResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(plan.criteriaPlanResult.mismatchCaseCount === 5, 'mismatch case count mismatch')
for (const key of [
  'criteriaSatisfiedToday',
  'routeReadinessClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'mediaReadinessClaimed',
  'betaOrProductionReadinessClaimed',
  'routeResolverImportedInGate2u',
  'serverRouteExecutedInGate2u',
  'workerExecutionRunInGate2u',
]) {
  assert(plan.criteriaPlanResult[key] === false, `criteriaPlanResult.${key} must remain false`)
}

assert(criteria.requiredBeforeAnyRouteReadinessClaim.length >= 7, 'criteria list incomplete')
assert(criteria.criteriaMetToday === false, 'criteria must not be met today')
assert(criteria.requiredBeforeAnyRouteReadinessClaim.some((row) => row.criterionId === 'controlled_server_route_execution_proof_passed' && row.currentEvidenceStatus === 'not_run'), 'controlled route execution criterion must remain not run')
assert(proof.futureProofRequirements.routeResolverImportProofRequired === true, 'route resolver proof requirement missing')
assert(proof.futureProofRequirements.controlledRouteExecutionProofRequired === true, 'controlled route proof requirement missing')
for (const [key, value] of Object.entries(proof.notRunInGate2u)) {
  assert(value === true, `notRunInGate2u.${key} must be true`)
}
for (const [key, value] of Object.entries(blocked.blockedExecutionScopes)) {
  assert(value === true, `blockedExecutionScopes.${key} must be true`)
}
for (const value of Object.values(blocked.blockedReadinessClaims)) {
  assert(value === 'blocked_unclaimed', 'readiness claims must remain blocked_unclaimed')
}
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'route_readiness_criteria_plan_pending'), 'resolved criteria blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_criteria_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.routeReadinessCriteriaPlanCreated === true, 'criteria plan allowed claim missing')
assert(policy.allowedClaims.criteriaSatisfiedToday === false, 'criteria satisfied today must remain false')
assert(policy.allowedClaims.routeReadinessClaimAllowed === false, 'route readiness claim must not be allowed')
assertAllFalse(policy.runtimeFlags, 'runtime flags')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2U decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no-route-execution scope')
assert(nextPrompt.includes('must not import route resolvers'), 'next prompt must block route resolver imports')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2u:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2u-diagnostics.mjs', 'Gate 2U package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2u_diagnostics_passed',
  decision,
  sourceHead,
  routeReadinessCriteriaPlanCreated: plan.criteriaPlanResult.routeReadinessCriteriaPlanCreated,
  criteriaSatisfiedToday: plan.criteriaPlanResult.criteriaSatisfiedToday,
  routeReadinessClaimed: plan.criteriaPlanResult.routeReadinessClaimed,
  routeResolverImportedInGate2u: plan.criteriaPlanResult.routeResolverImportedInGate2u,
  serverRouteExecutedInGate2u: plan.criteriaPlanResult.serverRouteExecutedInGate2u,
  nextPrompt: plan.nextPrompt,
}, null, 2))
