#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_synthetic_worker_route_owner_review_passed_with_warnings_ready_for_controlled_synthetic_route_proof'
const gate2bDecision = 'sound_runtime_media_gate_2b_synthetic_worker_route_plan_completed_with_warnings_ready_for_route_owner_review'
const toolOwnerDecision = 'worker_runtime_jobs_sound_cpu_synthetic_tool_call_owner_review_passed_with_warnings_ready_for_synthetic_worker_route_plan'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-worker-route-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-worker-route-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-worker-route-contract-approval-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-worker-route-contract-approval-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-worker-route-beta-boundary-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-worker-route-beta-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-worker-route-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-worker-route-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-claim-policy'],
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

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const routeApproval = parseBlock(docs[2][0], docs[2][1])
const beta = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2b = parseBlock('docs/sound-runtime-media-gate-2b-synthetic-worker-route-plan.md', 'sound-runtime-media-gate-2b-synthetic-worker-route-plan')
const contractRegister = parseBlock('docs/sound-runtime-media-gate-2b-route-contract-register.md', 'sound-runtime-media-gate-2b-route-contract-register')
const toolOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review')

assert(review.decision === decision, 'owner review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(routeApproval.decision === decision, 'route approval decision mismatch')
assert(beta.decision === decision, 'beta boundary decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(policy.decision === decision, 'claim policy decision mismatch')
assert(review.sourceVerification.pr747.status === 'merged', 'PR #747 must be merged')
assert(review.sourceVerification.pr747.decision === gate2bDecision, 'PR #747 decision mismatch')
assert(gate2b.decision === gate2bDecision, 'Gate 2B source decision mismatch')
assert(toolOwner.decision === toolOwnerDecision, 'tool owner-review source decision mismatch')

for (const jobType of expectedJobTypes) {
  assert(acceptance.acceptedJobTypesForPlanning.includes(jobType), `missing accepted job type ${jobType}`)
  assert(routeApproval.approvedForFutureProofPlanning.some((row) => row.jobType === jobType), `missing future proof approval ${jobType}`)
  assert(contractRegister.routeContracts.some((row) => row.jobType === jobType), `missing Gate 2B source contract ${jobType}`)
}

assert(acceptance.acceptedRouteContractsForPlanning === 4, 'route contract count mismatch')
assert(acceptance.acceptedToolCoverageForPlanning === 15, 'tool coverage count mismatch')
assert(acceptance.acceptedForControlledSyntheticRouteProofPlanning === true, 'controlled route proof planning must be accepted')
assert(acceptance.acceptedForExecutionToday === 'none', 'execution must not be accepted today')
assert(acceptance.acceptedForMediaProcessingToday === 'none', 'media processing must not be accepted today')
assert(acceptance.acceptedForBetaUnlockToday === 'none', 'beta unlock must not be accepted today')
assert(beta.betaBoundary.controlledSyntheticRouteProofMayProceed === true, 'controlled route proof must proceed next')
assert(beta.betaBoundary.workerExecutionMayProceedForBeta === false, 'worker execution for beta must remain blocked')
assert(beta.betaBoundary.realUserMediaBetaAllowed === false, 'real user media beta must remain blocked')
assert(beta.betaBoundary.externalBetaAllowed === false, 'external beta must remain blocked')
assert(beta.betaBoundary.paidProductionAllowed === false, 'production must remain blocked')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_synthetic_route_proof_not_run' && row.status === 'next'), 'next proof blocker missing')
assert(policy.allowedClaims.gate2bRoutePlanAcceptedForControlledProofPlanning === true, 'allowed planning claim missing')
assert(policy.forbiddenClaims.workerExecutionApproved === true, 'worker execution must remain forbidden')
assert(policy.forbiddenClaims.routeExecutionApprovedForBeta === true, 'route execution beta approval must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const gate2cPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof.md')
assert(gate2cPrompt.includes(decision), 'Gate 2C prompt must require owner-review decision')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-synthetic-worker-route-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review-diagnostics.mjs',
  'package script missing for route owner-review diagnostics',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_synthetic_worker_route_owner_review_diagnostics_passed',
  decision,
  sourceHead: review.sourceVerification.sourceHead,
  pr747Verified: review.sourceVerification.pr747.status === 'merged',
  routeContractCount: acceptance.acceptedRouteContractsForPlanning,
  toolCoverageCount: acceptance.acceptedToolCoverageForPlanning,
  controlledSyntheticRouteProofMayProceed: beta.betaBoundary.controlledSyntheticRouteProofMayProceed,
  workerExecutionMayProceedForBeta: beta.betaBoundary.workerExecutionMayProceedForBeta,
  realUserMediaBetaAllowed: beta.betaBoundary.realUserMediaBetaAllowed,
  externalBetaAllowed: beta.betaBoundary.externalBetaAllowed,
  productionAllowed: beta.betaBoundary.paidProductionAllowed,
  nextPrompt: review.nextPrompt,
}, null, 2))
