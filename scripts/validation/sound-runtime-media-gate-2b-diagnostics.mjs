#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'sound_runtime_media_gate_2b_synthetic_worker_route_plan_completed_with_warnings_ready_for_route_owner_review'
const gate2aDecision = 'sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_synthetic_tool_call_owner_review_passed_with_warnings_ready_for_synthetic_worker_route_plan'

const docs = [
  ['docs/sound-runtime-media-gate-2b-synthetic-worker-route-plan.md', 'sound-runtime-media-gate-2b-synthetic-worker-route-plan'],
  ['docs/sound-runtime-media-gate-2b-route-contract-register.md', 'sound-runtime-media-gate-2b-route-contract-register'],
  ['docs/sound-runtime-media-gate-2b-fail-closed-policy.md', 'sound-runtime-media-gate-2b-fail-closed-policy'],
  ['docs/sound-runtime-media-gate-2b-beta-readiness-boundary.md', 'sound-runtime-media-gate-2b-beta-readiness-boundary'],
  ['docs/sound-runtime-media-gate-2b-runtime-blocker-register.md', 'sound-runtime-media-gate-2b-runtime-blocker-register'],
  ['docs/sound-runtime-media-gate-2b-runtime-claim-policy.md', 'sound-runtime-media-gate-2b-runtime-claim-policy'],
]

const prompts = [
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review.md',
  'docs/implementation-prompts/prompt-sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review.md',
]

const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
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

const plan = parseBlock(docs[0][0], docs[0][1])
const contracts = parseBlock(docs[1][0], docs[1][1])
const failClosed = parseBlock(docs[2][0], docs[2][1])
const beta = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2a = parseBlock('docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md', 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review')

assert(plan.decision === decision, 'Gate 2B plan decision mismatch')
assert(contracts.decision === decision, 'Gate 2B contract decision mismatch')
assert(failClosed.decision === decision, 'Gate 2B fail-closed decision mismatch')
assert(beta.decision === decision, 'Gate 2B beta decision mismatch')
assert(blockers.decision === decision, 'Gate 2B blocker decision mismatch')
assert(policy.decision === decision, 'Gate 2B claim policy decision mismatch')
assert(plan.sourceVerification.pr744.decision === gate2aDecision, 'PR #744 decision mismatch')
assert(plan.sourceVerification.pr746.decision === ownerDecision, 'PR #746 decision mismatch')
assert(gate2a.decision === gate2aDecision, 'Gate 2A source decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner-review source decision mismatch')

for (const jobType of expectedJobTypes) {
  assert(plan.routePlan.jobTypes.includes(jobType), `missing route job type ${jobType}`)
  assert(contracts.routeContracts.some((row) => row.jobType === jobType), `missing route contract ${jobType}`)
}

const allCoveredTools = new Set(contracts.routeContracts.flatMap((row) => row.toolCoverage))
for (const toolId of expectedTools) {
  assert(allCoveredTools.has(toolId), `missing tool coverage ${toolId}`)
}

assert(plan.routePlan.routeSourceCreated === false, 'route source must not be created in Gate 2B')
assert(plan.routePlan.workerExecutionRun === false, 'worker execution must not run in Gate 2B')
assert(plan.routePlan.routeExecutionRun === false, 'route execution must not run in Gate 2B')
assert(plan.routePlan.toolExecutionRun === false, 'tool execution must not run in Gate 2B')
assert(plan.routePlan.mediaProcessingRun === false, 'media processing must not run in Gate 2B')
assert(contracts.routeSourceCreated === false, 'contract register must not create route source')
assert(contracts.executionApprovedToday === false, 'execution must not be approved today')

const rejectedFields = new Set(failClosed.requiredRejectedPayloadFields)
for (const field of ['rawPrompt', 'uploadedMediaUri', 'signedUrl', 'mediaFilePath', 'providerOutputBlob', 'serviceRolePayload', 'modelWeightPath', 'artifactWriteTarget', 'supabaseMutation', 'sqlText', 'dockerCommand', 'gcpCommand']) {
  assert(rejectedFields.has(field), `missing rejected payload field ${field}`)
}

for (const [flag, value] of Object.entries(failClosed.requiredRuntimeFlags)) {
  assert(value === false, `runtime flag must be false: ${flag}`)
}

assert(beta.betaBoundary.syntheticWorkerRoutePlanningComplete === true, 'route planning completion claim missing')
assert(beta.betaBoundary.syntheticWorkerRouteOwnerReviewMayProceed === true, 'owner review must be next')
assert(beta.betaBoundary.controlledSyntheticRouteProofMayProceed === false, 'controlled route proof must not proceed before owner review')
assert(beta.betaBoundary.realUserMediaBetaAllowed === false, 'real user media beta must stay blocked')
assert(beta.betaBoundary.externalBetaAllowed === false, 'external beta must stay blocked')
assert(beta.betaBoundary.paidProductionAllowed === false, 'production must stay blocked')

assert(blockers.blockers.some((row) => row.blockerId === 'route_owner_review_not_complete' && row.status === 'next'), 'route owner review blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_route_execution_not_approved' && row.status === 'blocked'), 'controlled route execution blocker missing')
assert(policy.allowedClaims.gate2bSyntheticRoutePlanCreated === true, 'allowed Gate 2B planning claim missing')
assert(policy.forbiddenClaims.workerExecutionApproved === true, 'worker execution must remain forbidden')
assert(policy.forbiddenClaims.routeExecutionApproved === true, 'route execution must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const ownerRoutePrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-worker-route-owner-review.md')
assert(ownerRoutePrompt.includes(decision), 'route owner-review prompt must require Gate 2B decision')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2b:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2b-diagnostics.mjs',
  'package script missing for Gate 2B diagnostics',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2b_diagnostics_passed',
  decision,
  sourceHead: plan.sourceVerification.sourceHead,
  routeContractCount: contracts.routeContracts.length,
  toolCoverageCount: allCoveredTools.size,
  routeSourceCreated: plan.routePlan.routeSourceCreated,
  workerExecutionRun: plan.routePlan.workerExecutionRun,
  routeExecutionRun: plan.routePlan.routeExecutionRun,
  realUserMediaBetaAllowed: beta.betaBoundary.realUserMediaBetaAllowed,
  externalBetaAllowed: beta.betaBoundary.externalBetaAllowed,
  productionAllowed: beta.betaBoundary.paidProductionAllowed,
  nextPrompt: plan.nextPrompt,
}, null, 2))
