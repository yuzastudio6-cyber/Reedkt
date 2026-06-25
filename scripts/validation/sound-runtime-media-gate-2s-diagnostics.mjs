#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2s_bounded_route_readiness_review_plan_completed_with_warnings_ready_for_bounded_route_readiness_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_controlled_import_proof_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_review'
const gate2rDecision = 'sound_runtime_media_gate_2r_controlled_static_integration_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceHead = '546d609d06690e38504b801150f6e9353f378989'

const docs = [
  ['docs/sound-runtime-media-gate-2s-bounded-route-readiness-review-plan.md', 'sound-runtime-media-gate-2s-bounded-route-readiness-review-plan'],
  ['docs/sound-runtime-media-gate-2s-review-boundary-register.md', 'sound-runtime-media-gate-2s-review-boundary-register'],
  ['docs/sound-runtime-media-gate-2s-source-evidence-register.md', 'sound-runtime-media-gate-2s-source-evidence-register'],
  ['docs/sound-runtime-media-gate-2s-owner-review-checklist.md', 'sound-runtime-media-gate-2s-owner-review-checklist'],
  ['docs/sound-runtime-media-gate-2s-blocker-follow-up-register.md', 'sound-runtime-media-gate-2s-blocker-follow-up-register'],
  ['docs/sound-runtime-media-gate-2s-runtime-claim-policy.md', 'sound-runtime-media-gate-2s-runtime-claim-policy'],
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
const boundary = parseBlock(docs[1][0], docs[1][1])
const evidence = parseBlock(docs[2][0], docs[2][1])
const checklist = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review')
const gate2r = parseBlock('docs/sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result.md', 'sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result')

for (const entry of [plan, boundary, evidence, checklist, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2S decision mismatch')
}

assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr853.status === 'merged', 'PR #853 must be merged')
assert(plan.sourceVerification.pr853.mergeCommit === sourceHead, 'PR #853 merge commit mismatch')
assert(plan.sourceVerification.pr853.decision === ownerDecision, 'PR #853 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2r.decision === gate2rDecision, 'Gate 2R decision mismatch')
assert(plan.planScope.boundedRouteReadinessReviewPlanned === true, 'bounded review plan missing')
assert(plan.planScope.fixtureCount === 9, 'fixture count mismatch')
assert(plan.planScope.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(plan.planScope.rejectedPayloadFieldCount === 14, 'rejected payload field count mismatch')
assert(plan.planScope.mismatchCaseCount === 5, 'mismatch case count mismatch')
for (const key of [
  'routeResolverImportPlanned',
  'serverRouteExecutionPlanned',
  'workerDispatchPlanned',
  'workerExecutionPlanned',
  'routeReadinessClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
]) {
  assert(plan.planScope[key] === false, `planScope.${key} must remain false`)
}
assert(boundary.boundedReviewMayConsider.staticEvaluatorCounts === true, 'static evaluator count review missing')
assert(boundary.boundedReviewMayConsider.canonicalRejectedPayloadFieldCoverage === true, 'canonical field review missing')
assertAllFalse(boundary.acceptedForToday, 'accepted for today')
assert(evidence.acceptedSourceEvidence.pr850Merged === true, 'PR #850 evidence missing')
assert(evidence.acceptedSourceEvidence.pr853Merged === true, 'PR #853 evidence missing')
assert(evidence.acceptedSourceEvidence.gate2rProofPassed === true, 'Gate 2R proof evidence missing')
assert(evidence.acceptedSourceEvidence.gate2rOwnerReviewAccepted === true, 'Gate 2R owner review evidence missing')
assert(evidence.acceptedSourceEvidence.canonicalRejectedPayloadFieldCount === 14, 'canonical count evidence mismatch')
assert(evidence.acceptedSourceEvidence.readinessClaimFalse === true, 'readiness false evidence missing')
assert(evidence.acceptedSourceEvidence.runtimeFlagsFalse === true, 'runtime flag evidence missing')
for (const value of Object.values(evidence.evidenceNotAcceptedFor)) {
  assert(value === true, 'evidence not-accepted scopes must remain true')
}
assert(checklist.ownerReviewOutputs.mayApproveBoundedReviewPlanning === true, 'bounded review output missing')
for (const [key, value] of Object.entries(checklist.ownerReviewOutputs)) {
  if (key !== 'mayApproveBoundedReviewPlanning') {
    assert(value === false, `ownerReviewOutputs.${key} must remain false`)
  }
}
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'bounded_route_readiness_owner_review_pending' && row.status === 'next'), 'bounded owner-review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.boundedRouteReadinessReviewPlanCreated === true, 'allowed plan claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'owner review claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2S decision')
assert(nextPrompt.includes('no route execution'), 'owner-review prompt must preserve no-route-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2s:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2s-diagnostics.mjs', 'Gate 2S package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2s_diagnostics_passed',
  decision,
  sourceHead,
  pr853Verified: true,
  boundedRouteReadinessReviewPlanned: plan.planScope.boundedRouteReadinessReviewPlanned,
  acceptedForRouteReadinessToday: boundary.acceptedForToday.routeReadiness,
  routeResolverImportPlanned: plan.planScope.routeResolverImportPlanned,
  serverRouteExecutionPlanned: plan.planScope.serverRouteExecutionPlanned,
  workerExecutionPlanned: plan.planScope.workerExecutionPlanned,
  nextPrompt: plan.nextPrompt,
}, null, 2))
