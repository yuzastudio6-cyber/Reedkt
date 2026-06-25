#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2k_controlled_route_readiness_plan_completed_with_warnings_ready_for_route_readiness_owner_review'
const sourceHead = '772709293711ea92f7b5be311e3335c25dbd6cb4'
const ownerReviewDecision = 'worker_runtime_jobs_sound_cpu_route_fixture_validation_owner_review_passed_with_warnings_ready_for_route_readiness_planning'
const gate2jDecision = 'sound_runtime_media_gate_2j_controlled_route_fixture_validation_passed_with_warnings_ready_for_fixture_validation_owner_review'

const docs = [
  ['docs/sound-runtime-media-gate-2k-controlled-route-readiness-plan.md', 'sound-runtime-media-gate-2k-controlled-route-readiness-plan'],
  ['docs/sound-runtime-media-gate-2k-route-readiness-preflight-checklist.md', 'sound-runtime-media-gate-2k-route-readiness-preflight-checklist'],
  ['docs/sound-runtime-media-gate-2k-route-readiness-boundary-register.md', 'sound-runtime-media-gate-2k-route-readiness-boundary-register'],
  ['docs/sound-runtime-media-gate-2k-route-readiness-owner-handoff.md', 'sound-runtime-media-gate-2k-route-readiness-owner-handoff'],
  ['docs/sound-runtime-media-gate-2k-route-readiness-blocker-register.md', 'sound-runtime-media-gate-2k-route-readiness-blocker-register'],
  ['docs/sound-runtime-media-gate-2k-runtime-claim-policy.md', 'sound-runtime-media-gate-2k-runtime-claim-policy'],
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
const preflight = parseBlock(docs[1][0], docs[1][1])
const boundary = parseBlock(docs[2][0], docs[2][1])
const handoff = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review')
const gate2j = parseBlock('docs/sound-runtime-media-gate-2j-controlled-route-fixture-validation-result.md', 'sound-runtime-media-gate-2j-controlled-route-fixture-validation-result')

for (const entry of [plan, preflight, boundary, handoff, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2K decision mismatch')
}

assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr814.status === 'merged', 'PR #814 must be merged')
assert(plan.sourceVerification.pr814.mergeCommit === sourceHead, 'PR #814 merge commit mismatch')
assert(plan.sourceVerification.pr814.decision === ownerReviewDecision, 'PR #814 decision mismatch')
assert(plan.sourceVerification.pr812.status === 'merged', 'PR #812 must be merged')
assert(plan.sourceVerification.pr812.decision === gate2jDecision, 'PR #812 decision mismatch')
assert(ownerReview.decision === ownerReviewDecision, 'owner review decision mismatch')
assert(gate2j.decision === gate2jDecision, 'Gate 2J decision mismatch')

assert(plan.planningResult.routeReadinessPlanCreated === true, 'route readiness plan must be created')
assert(plan.planningResult.acceptedForFutureOwnerReviewOnly === true, 'future owner review only must be true')
assert(plan.planningResult.fixtureCount === 4, 'fixture count mismatch')
assert(plan.planningResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(plan.planningResult.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(plan.planningResult.mismatchCaseCount === 5, 'mismatch case count mismatch')
for (const key of [
  'routeResolverImported',
  'routeExecutionRun',
  'serverRouteExecuted',
  'workerDispatchRun',
  'workerExecutionRun',
  'mediaFileOpened',
  'mediaProcessingRun',
  'dockerOrGcpRun',
  'supabaseOrSqlRun',
  'artifactCreated',
  'routeReadinessClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'mediaReadinessClaimed',
  'betaOrProductionReadinessClaimed',
]) {
  assert(plan.planningResult[key] === false, `planningResult.${key} must remain false`)
}

assert(plan.routeContracts.length === 4, 'route contract count mismatch')
assert(preflight.preflightChecklist.length >= 6, 'preflight checklist incomplete')
assert(boundary.futureOwnerReviewMayConsider.acceptRouteReadinessPlanning === true, 'owner review planning handoff missing')
for (const [key, value] of Object.entries(boundary.futureOwnerReviewMayConsider)) {
  if (key !== 'acceptRouteReadinessPlanning') {
    assert(value === false, `futureOwnerReviewMayConsider.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentGateExecution, 'current gate execution')

assert(handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(handoff.acceptedPlanningInputs.fixtureCount === 4, 'handoff fixture count mismatch')
assertAllFalse(handoff.acceptedForExecutionToday, 'accepted for execution today')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_runtime_jobs_owner_review_pending' && row.status === 'next'), 'owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.routeReadinessPlanCreated === true, 'route-readiness plan claim missing')
assert(policy.allowedClaims.futureOwnerReviewMayProceed === true, 'future owner review claim missing')
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (!['routeReadinessPlanCreated', 'futureOwnerReviewMayProceed', 'gate2jValidationAcceptedAsSourceEvidence'].includes(key)) {
    assert(value === false, `allowedClaims.${key} must remain false`)
  }
}
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-owner-review.md')
assert(prompt.includes(decision), 'owner-review prompt must require Gate 2K decision')
assert(prompt.includes('no execution'), 'owner-review prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2k:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2k-diagnostics.mjs', 'Gate 2K package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2k_diagnostics_passed',
  decision,
  sourceHead,
  pr814Verified: true,
  routeReadinessPlanCreated: plan.planningResult.routeReadinessPlanCreated,
  fixtureCount: plan.planningResult.fixtureCount,
  acceptedFixtureCount: plan.planningResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: plan.planningResult.rejectedPayloadFieldCount,
  mismatchCaseCount: plan.planningResult.mismatchCaseCount,
  routeExecutionRun: plan.planningResult.routeExecutionRun,
  workerExecutionRun: plan.planningResult.workerExecutionRun,
  mediaProcessingRun: plan.planningResult.mediaProcessingRun,
  nextPrompt: plan.nextPrompt,
}, null, 2))
