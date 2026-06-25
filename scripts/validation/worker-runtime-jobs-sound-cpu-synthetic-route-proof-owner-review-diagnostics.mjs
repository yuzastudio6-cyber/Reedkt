#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_synthetic_route_proof_owner_review_passed_with_warnings_ready_for_synthetic_route_source_plan'
const gate2cDecision = 'sound_runtime_media_gate_2c_controlled_synthetic_worker_route_proof_passed_with_warnings_ready_for_route_proof_owner_review'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-proof-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-proof-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-proof-beta-boundary-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-proof-beta-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-proof-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-proof-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-claim-policy'],
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const pattern = new RegExp('```json ' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  assert(match, `missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

for (const [relativePath, label] of docs) {
  assert(fs.existsSync(path.join(repoRoot, relativePath)), `missing doc ${relativePath}`)
  parseBlock(relativePath, label)
}

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const beta = parseBlock(docs[2][0], docs[2][1])
const blockers = parseBlock(docs[3][0], docs[3][1])
const policy = parseBlock(docs[4][0], docs[4][1])
const gate2c = parseBlock('docs/sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-result.md', 'sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-result')

assert(review.decision === decision, 'owner review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(beta.decision === decision, 'beta decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(policy.decision === decision, 'claim policy decision mismatch')
assert(review.sourceVerification.pr752.status === 'merged', 'PR #752 must be merged')
assert(review.sourceVerification.pr752.decision === gate2cDecision, 'PR #752 decision mismatch')
assert(gate2c.decision === gate2cDecision, 'Gate 2C source decision mismatch')
assert(gate2c.proofResult.routeDecisionProofRun === true, 'Gate 2C route proof must have run')
assert(gate2c.proofResult.routeDecisionCount === 4, 'Gate 2C route decision count mismatch')
assert(gate2c.proofResult.rejectedPayloadFieldCount === 14, 'Gate 2C rejection count mismatch')
assert(gate2c.proofResult.workerExecutionRun === false, 'Gate 2C worker execution must not run')
assert(gate2c.proofResult.routeExecutionRun === false, 'Gate 2C route execution must not run')
assert(acceptance.acceptedRouteDecisionsForPlanning.length === 4, 'accepted route decision count mismatch')
assert(acceptance.acceptedRejectedPayloadFieldCount === 14, 'accepted rejected payload count mismatch')
assert(acceptance.acceptedForSyntheticRouteSourcePlanning === true, 'source planning must be accepted')
assert(acceptance.acceptedForExecutionToday === 'none', 'execution must not be accepted today')
assert(beta.betaBoundary.syntheticRouteSourcePlanningMayProceed === true, 'source planning must proceed')
assert(beta.betaBoundary.controlledSyntheticRouteExecutionMayProceed === false, 'route execution must remain blocked')
assert(beta.betaBoundary.realUserMediaBetaAllowed === false, 'real user media beta must remain blocked')
assert(beta.betaBoundary.externalBetaAllowed === false, 'external beta must remain blocked')
assert(beta.betaBoundary.paidProductionAllowed === false, 'production must remain blocked')
assert(blockers.blockers.some((row) => row.blockerId === 'synthetic_route_source_not_planned' && row.status === 'next'), 'next source plan blocker missing')
assert(policy.allowedClaims.gate2cRouteProofAcceptedForFutureSourcePlanning === true, 'allowed planning claim missing')
assert(policy.forbiddenClaims.workerExecutionApproved === true, 'worker execution must remain forbidden')
assert(policy.forbiddenClaims.routeExecutionApprovedForBeta === true, 'route execution beta approval must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const gate2dPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2d-synthetic-worker-route-source-plan.md')
assert(gate2dPrompt.includes(decision), 'Gate 2D prompt must require owner-review decision')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-synthetic-route-proof-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review-diagnostics.mjs',
  'package script missing for route proof owner-review diagnostics',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_synthetic_route_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead: review.sourceVerification.sourceHead,
  pr752Verified: review.sourceVerification.pr752.status === 'merged',
  routeDecisionCount: gate2c.proofResult.routeDecisionCount,
  rejectedPayloadFieldCount: gate2c.proofResult.rejectedPayloadFieldCount,
  syntheticRouteSourcePlanningMayProceed: beta.betaBoundary.syntheticRouteSourcePlanningMayProceed,
  controlledSyntheticRouteExecutionMayProceed: beta.betaBoundary.controlledSyntheticRouteExecutionMayProceed,
  realUserMediaBetaAllowed: beta.betaBoundary.realUserMediaBetaAllowed,
  externalBetaAllowed: beta.betaBoundary.externalBetaAllowed,
  productionAllowed: beta.betaBoundary.paidProductionAllowed,
  nextPrompt: review.nextPrompt,
}, null, 2))
