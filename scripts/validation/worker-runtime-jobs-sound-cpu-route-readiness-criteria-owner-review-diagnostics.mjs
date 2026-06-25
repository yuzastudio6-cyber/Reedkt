#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_criteria_owner_review_passed_with_warnings_ready_for_proof_gap_closure_plan'
const gate2uDecision = 'sound_runtime_media_gate_2u_route_readiness_criteria_plan_completed_with_warnings_ready_for_criteria_owner_review'
const sourceHead = 'a2a114304506dfc4895976eeb6938d112ffaee32'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-criteria-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-evidence-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-criteria-evidence-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-gap-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-criteria-gap-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-criteria-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-claim-policy'],
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

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const evidence = parseBlock(docs[2][0], docs[2][1])
const gaps = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const claimPolicy = parseBlock(docs[5][0], docs[5][1])
const gate2u = parseBlock('docs/sound-runtime-media-gate-2u-route-readiness-criteria-plan.md', 'sound-runtime-media-gate-2u-route-readiness-criteria-plan')
const gate2uCriteria = parseBlock('docs/sound-runtime-media-gate-2u-criteria-register.md', 'sound-runtime-media-gate-2u-criteria-register')
const gate2uBlocked = parseBlock('docs/sound-runtime-media-gate-2u-blocked-readiness-register.md', 'sound-runtime-media-gate-2u-blocked-readiness-register')

for (const entry of [review, acceptance, evidence, gaps, blockers, claimPolicy]) {
  assert(entry.decision === decision, 'criteria owner-review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr867.status === 'merged', 'PR #867 must be merged')
assert(review.sourceVerification.pr867.mergeCommit === sourceHead, 'PR #867 merge commit mismatch')
assert(review.sourceVerification.pr867.decision === gate2uDecision, 'PR #867 decision mismatch')
assert(gate2u.decision === gate2uDecision, 'Gate 2U decision mismatch')
assert(gate2u.criteriaPlanResult.routeReadinessCriteriaPlanCreated === true, 'Gate 2U criteria plan missing')
assert(gate2u.criteriaPlanResult.criteriaSatisfiedToday === false, 'Gate 2U criteria must not be satisfied today')
assert(gate2u.criteriaPlanResult.routeReadinessClaimed === false, 'Gate 2U route readiness claim must remain false')
assert(gate2u.criteriaPlanResult.routeResolverImportedInGate2u === false, 'Gate 2U route resolver import must be false')
assert(gate2u.criteriaPlanResult.serverRouteExecutedInGate2u === false, 'Gate 2U server route execution must be false')
assert(gate2uCriteria.criteriaMetToday === false, 'Gate 2U criteria met must be false')
for (const value of Object.values(gate2uBlocked.blockedReadinessClaims)) {
  assert(value === 'blocked_unclaimed', 'Gate 2U readiness claims must remain blocked')
}

assert(review.ownerReviewResult.gate2uCriteriaAcceptedForProofGapClosurePlanning === true, 'Gate 2U acceptance missing')
for (const key of [
  'criteriaMetToday',
  'routeReadinessClaimAllowedToday',
  'routeResolverImportApprovedToday',
  'serverRouteExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'acceptedForRouteReadinessToday',
  'acceptedForWorkerReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(review.ownerReviewResult[key] === false, `ownerReviewResult.${key} must remain false`)
}

assert(acceptance.acceptedForFuturePlanningOnly.proofGapClosurePlanMayProceed === true, 'gap closure plan acceptance missing')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')
assert(evidence.acceptedGate2uEvidence.criteriaSatisfiedToday === false, 'evidence criteria satisfied must remain false')
assert(evidence.acceptedGate2uEvidence.routeReadinessClaimed === false, 'evidence route readiness must remain false')
assert(evidence.requiredGapClosureBeforeReadiness.length >= 5, 'gap closure list incomplete')
assert(gaps.gapClosurePlanMayProceed === true, 'gap closure plan may proceed missing')
assert(gaps.openGaps.every((gap) => gap.status === 'open'), 'all gaps must remain open')
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'route_readiness_criteria_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_proof_gap_closure_plan_pending' && row.status === 'next'), 'next gap closure blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(claimPolicy.allowedClaims.criteriaAcceptedForProofGapClosurePlanning === true, 'allowed criteria acceptance claim missing')
assert(claimPolicy.allowedClaims.routeReadinessClaimAllowedToday === false, 'route readiness claim must not be allowed')
assertAllFalse(claimPolicy.runtimeFlags, 'claim policy runtime flags')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2v-route-readiness-proof-gap-closure-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no-route-execution scope')
assert(nextPrompt.includes('must not import route resolvers'), 'next prompt must block route resolver imports')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-criteria-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-criteria-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_criteria_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  gate2uCriteriaAcceptedForProofGapClosurePlanning: review.ownerReviewResult.gate2uCriteriaAcceptedForProofGapClosurePlanning,
  proofGapClosurePlanMayProceed: acceptance.acceptedForFuturePlanningOnly.proofGapClosurePlanMayProceed,
  criteriaMetToday: review.ownerReviewResult.criteriaMetToday,
  routeReadinessClaimAllowedToday: review.ownerReviewResult.routeReadinessClaimAllowedToday,
  nextPrompt: review.nextPrompt,
}, null, 2))
