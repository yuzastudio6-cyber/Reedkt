#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'sound_runtime_media_gate_2c_controlled_synthetic_worker_route_proof_passed_with_warnings_ready_for_route_proof_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_synthetic_worker_route_owner_review_passed_with_warnings_ready_for_controlled_synthetic_route_proof'
const gate2bDecision = 'sound_runtime_media_gate_2b_synthetic_worker_route_plan_completed_with_warnings_ready_for_route_owner_review'

const docs = [
  ['docs/sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-result.md', 'sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-result'],
  ['docs/sound-runtime-media-gate-2c-route-decision-proof-register.md', 'sound-runtime-media-gate-2c-route-decision-proof-register'],
  ['docs/sound-runtime-media-gate-2c-fail-closed-rejection-register.md', 'sound-runtime-media-gate-2c-fail-closed-rejection-register'],
  ['docs/sound-runtime-media-gate-2c-beta-readiness-boundary.md', 'sound-runtime-media-gate-2c-beta-readiness-boundary'],
  ['docs/sound-runtime-media-gate-2c-runtime-claim-policy.md', 'sound-runtime-media-gate-2c-runtime-claim-policy'],
]

const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
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

assert(fs.existsSync(path.join(repoRoot, 'scripts/validation/sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-runner.mjs')), 'missing Gate 2C proof runner')
assert(fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review.md')), 'missing route proof owner-review prompt')
assert(fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-sound-runtime-media-gate-2d-synthetic-worker-route-source-plan.md')), 'missing Gate 2D prompt')

const result = parseBlock(docs[0][0], docs[0][1])
const routeRegister = parseBlock(docs[1][0], docs[1][1])
const rejectionRegister = parseBlock(docs[2][0], docs[2][1])
const beta = parseBlock(docs[3][0], docs[3][1])
const policy = parseBlock(docs[4][0], docs[4][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review')
const gate2b = parseBlock('docs/sound-runtime-media-gate-2b-synthetic-worker-route-plan.md', 'sound-runtime-media-gate-2b-synthetic-worker-route-plan')

assert(result.decision === decision, 'Gate 2C result decision mismatch')
assert(routeRegister.decision === decision, 'Gate 2C route register decision mismatch')
assert(rejectionRegister.decision === decision, 'Gate 2C rejection register decision mismatch')
assert(beta.decision === decision, 'Gate 2C beta decision mismatch')
assert(policy.decision === decision, 'Gate 2C claim policy decision mismatch')
assert(result.sourceVerification.pr750.status === 'merged', 'PR #750 must be merged')
assert(result.sourceVerification.pr750.decision === ownerDecision, 'PR #750 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'route owner review source decision mismatch')
assert(gate2b.decision === gate2bDecision, 'Gate 2B source decision mismatch')

for (const jobType of expectedJobTypes) {
  assert(routeRegister.routeDecisions.some((row) => row.jobType === jobType && row.accepted === true), `missing accepted route decision ${jobType}`)
}

assert(result.proofResult.routeDecisionProofRun === true, 'route decision proof must run')
assert(result.proofResult.routeDecisionCount === 4, 'route decision count mismatch')
assert(result.proofResult.rejectedPayloadFieldCount === 14, 'rejected payload field count mismatch')
assert(result.proofResult.workerExecutionRun === false, 'worker execution must not run')
assert(result.proofResult.routeExecutionRun === false, 'route execution must not run')
assert(result.proofResult.toolExecutionRun === false, 'tool execution must not run')
assert(result.proofResult.mediaProcessingRun === false, 'media processing must not run')
assert(result.proofResult.dockerRun === false, 'docker run must not run')
assert(result.proofResult.dockerPush === false, 'docker push must not run')
assert(result.proofResult.gcpTouched === false, 'GCP must not be touched')
assert(result.proofResult.supabaseTouched === false, 'Supabase must not be touched')
assert(result.proofResult.sqlExecuted === false, 'SQL must not execute')
assert(result.proofResult.artifactCreated === false, 'artifact must not be created')
assert(rejectionRegister.rejectedPayloadFieldCount === 14, 'rejection count mismatch')
assert(beta.betaBoundary.routeProofOwnerReviewMayProceed === true, 'route proof owner review must proceed')
assert(beta.betaBoundary.workerExecutionMayProceedForBeta === false, 'worker execution for beta must remain blocked')
assert(beta.betaBoundary.realUserMediaBetaAllowed === false, 'real user media beta must remain blocked')
assert(beta.betaBoundary.externalBetaAllowed === false, 'external beta must remain blocked')
assert(beta.betaBoundary.paidProductionAllowed === false, 'production must remain blocked')
assert(policy.allowedClaims.controlledSyntheticRouteDecisionProofPassed === true, 'allowed proof claim missing')
assert(policy.forbiddenClaims.workerExecutionApproved === true, 'worker execution must remain forbidden')
assert(policy.forbiddenClaims.routeExecutionApprovedForBeta === true, 'route execution beta approval must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review.md')
assert(ownerPrompt.includes(decision), 'route proof owner-review prompt must require Gate 2C decision')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2c:proof'] === 'node scripts/validation/sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-runner.mjs',
  'package script missing for Gate 2C proof runner',
)
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2c:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2c-diagnostics.mjs',
  'package script missing for Gate 2C diagnostics',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2c_diagnostics_passed',
  decision,
  sourceHead: result.sourceVerification.sourceHead,
  pr750Verified: result.sourceVerification.pr750.status === 'merged',
  routeDecisionProofRun: result.proofResult.routeDecisionProofRun,
  routeDecisionCount: result.proofResult.routeDecisionCount,
  rejectedPayloadFieldCount: result.proofResult.rejectedPayloadFieldCount,
  workerExecutionRun: result.proofResult.workerExecutionRun,
  routeExecutionRun: result.proofResult.routeExecutionRun,
  realUserMediaBetaAllowed: beta.betaBoundary.realUserMediaBetaAllowed,
  externalBetaAllowed: beta.betaBoundary.externalBetaAllowed,
  productionAllowed: beta.betaBoundary.paidProductionAllowed,
  nextPrompt: result.nextPrompt,
}, null, 2))
