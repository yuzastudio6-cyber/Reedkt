#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_synthetic_tool_call_owner_review_passed_with_warnings_ready_for_synthetic_worker_route_plan'
const gate2aDecision = 'sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-beta-boundary-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-beta-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-claim-policy'],
]

const prompts = [
  'docs/implementation-prompts/prompt-sound-runtime-media-gate-2b-synthetic-worker-route-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review.md',
]

const expectedTools = [
  'librosa',
  'audioread',
  'pydub',
  'pydub_effects',
  'scipy',
  'resampy',
  'pyloudnorm',
  'ebu_r128_pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
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

for (const relativePath of prompts) {
  assert(fs.existsSync(path.join(repoRoot, relativePath)), `missing prompt ${relativePath}`)
}

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const beta = parseBlock(docs[2][0], docs[2][1])
const blockers = parseBlock(docs[3][0], docs[3][1])
const policy = parseBlock(docs[4][0], docs[4][1])
const gate2a = parseBlock('docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md', 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')

assert(review.decision === decision, 'owner review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(beta.decision === decision, 'beta boundary decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(policy.decision === decision, 'claim policy decision mismatch')
assert(review.sourceVerification.pr744.status === 'merged', 'PR #744 must be merged')
assert(review.sourceVerification.pr744.decision === gate2aDecision, 'PR #744 decision mismatch')
assert(gate2a.decision === gate2aDecision, 'Gate 2A source doc decision mismatch')
assert(gate2a.probePassedCount === 15, 'Gate 2A source probe count mismatch')

for (const toolId of expectedTools) {
  assert(acceptance.acceptedToolCallsForPlanning.includes(toolId), `missing accepted tool for planning ${toolId}`)
}

assert(acceptance.acceptedForExecutionToday === 'none', 'execution must not be accepted')
assert(acceptance.acceptedForMediaProcessingToday === 'none', 'media processing must not be accepted')
assert(acceptance.acceptedForBetaUnlockToday === 'none', 'beta unlock must not be accepted')
assert(beta.betaBoundary.syntheticWorkerRoutePlanningMayProceed === true, 'synthetic route planning must proceed')
assert(beta.betaBoundary.controlledWorkerExecutionProofMayProceed === false, 'worker execution proof must not proceed yet')
assert(beta.betaBoundary.realUserMediaBetaAllowed === false, 'real user media beta must remain blocked')
assert(beta.betaBoundary.externalBetaAllowed === false, 'external beta must remain blocked')
assert(beta.betaBoundary.paidProductionAllowed === false, 'production must remain blocked')

assert(blockers.blockers.some((row) => row.blockerId === 'synthetic_worker_route_not_planned' && row.status === 'next'), 'next route blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'media_file_open_not_approved' && row.status === 'blocked'), 'media file blocker missing')
assert(policy.allowedClaims.gate2aProofAcceptedForFutureRoutePlanning === true, 'allowed owner-review claim missing')
assert(policy.forbiddenClaims.workerExecutionApproved === true, 'worker execution must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-synthetic-tool-call-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review-diagnostics.mjs',
  'package script missing for synthetic tool-call owner-review diagnostics',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_synthetic_tool_call_owner_review_diagnostics_passed',
  decision,
  sourceHead: review.sourceVerification.sourceHead,
  pr744Verified: review.sourceVerification.pr744.status === 'merged',
  acceptedToolCount: acceptance.acceptedToolCallsForPlanning.length,
  acceptedForExecutionToday: acceptance.acceptedForExecutionToday,
  syntheticWorkerRoutePlanningMayProceed: beta.betaBoundary.syntheticWorkerRoutePlanningMayProceed,
  realUserMediaBetaAllowed: beta.betaBoundary.realUserMediaBetaAllowed,
  externalBetaAllowed: beta.betaBoundary.externalBetaAllowed,
  productionAllowed: beta.betaBoundary.paidProductionAllowed,
  nextPrompt: review.nextPrompt,
}, null, 2))
