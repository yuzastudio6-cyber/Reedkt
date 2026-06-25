#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review'
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

const docs = [
  ['docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md', 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result'],
  ['docs/sound-runtime-media-gate-2a-tool-call-register.md', 'sound-runtime-media-gate-2a-tool-call-register'],
  ['docs/sound-runtime-media-gate-2a-beta-readiness-boundary.md', 'sound-runtime-media-gate-2a-beta-readiness-boundary'],
  ['docs/sound-runtime-media-gate-2a-runtime-blocker-register.md', 'sound-runtime-media-gate-2a-runtime-blocker-register'],
  ['docs/sound-runtime-media-gate-2a-runtime-claim-policy.md', 'sound-runtime-media-gate-2a-runtime-claim-policy'],
]

const prompts = [
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md',
  'docs/implementation-prompts/prompt-sound-runtime-media-gate-2b-synthetic-worker-route-plan.md',
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
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

assert(fs.existsSync(path.join(repoRoot, 'scripts/validation/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-runner.py')), 'missing Gate 2A proof runner')

const result = parseBlock(docs[0][0], docs[0][1])
const register = parseBlock(docs[1][0], docs[1][1])
const beta = parseBlock(docs[2][0], docs[2][1])
const blockers = parseBlock(docs[3][0], docs[3][1])
const policy = parseBlock(docs[4][0], docs[4][1])

assert(result.decision === decision, 'Gate 2A result decision mismatch')
assert(register.decision === decision, 'Gate 2A register decision mismatch')
assert(beta.decision === decision, 'Gate 2A beta boundary decision mismatch')
assert(blockers.decision === decision, 'Gate 2A blocker decision mismatch')
assert(result.sourceVerification.pr739.status === 'merged', 'PR #739 source must be merged')
assert(result.sourceVerification.sourceHead === 'eb4fa16292f41e97660fe1dd429cd567fa944380', 'Gate 2A source head mismatch')

assert(result.toolCandidateCount === 15, 'tool candidate count mismatch')
assert(result.directPackageCount === 13, 'direct package count mismatch')
assert(result.aliasToolCount === 2, 'alias tool count mismatch')
assert(result.metadataPassedCount === 13, 'metadata pass count mismatch')
assert(result.importPassedCount === 13, 'import pass count mismatch')
assert(result.probePassedCount === 15, 'probe pass count mismatch')
assert(result.probeFailedCount === 0, 'probe failure count mismatch')
assert(result.tempVenvRemoved === true, 'temporary venv must be removed')

const registeredTools = new Set(register.toolCalls.map((row) => row.toolId))
for (const toolId of expectedTools) {
  assert(registeredTools.has(toolId), `missing tool call register row for ${toolId}`)
}
assert(register.toolCalls.every((row) => row.status === 'passed'), 'all tool call rows must pass')
assert(register.acceptedForWorkerExecutionToday === false, 'worker execution must remain unaccepted')
assert(register.acceptedForMediaProcessingToday === false, 'media processing must remain unaccepted')
assert(register.acceptedForExternalBetaToday === false, 'external beta must remain unaccepted')

for (const [flag, value] of Object.entries(result.runtimeFlags)) {
  assert(value === false, `runtime flag must remain false: ${flag}`)
}

assert(beta.betaStatus.internalSyntheticToolCallProof === 'passed', 'internal synthetic proof must pass')
assert(beta.betaStatus.realUserMediaBeta === 'blocked', 'real user media beta must remain blocked')
assert(beta.betaStatus.externalBeta === 'blocked', 'external beta must remain blocked')
assert(beta.betaStatus.production === 'blocked', 'production must remain blocked')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_route_not_implemented' && row.status === 'blocked'), 'worker route blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'media_file_open_not_approved' && row.status === 'blocked'), 'media file blocker missing')

assert(policy.allowedClaims.controlledSyntheticToolCallProofPassed === true, 'allowed synthetic proof claim missing')
assert(policy.forbiddenClaims.workerReadiness === true, 'worker readiness must remain forbidden')
assert(policy.forbiddenClaims.runtimeReadiness === true, 'runtime readiness must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2a:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2a-diagnostics.mjs',
  'package script missing for Gate 2A diagnostics',
)

const changedText = docs.map(([relativePath]) => read(relativePath)).join('\n') + '\n' + prompts.map(read).join('\n')
const forbiddenPatterns = [
  /external beta (is )?(unlocked|enabled|allowed)/i,
  /production (is )?(unlocked|enabled|allowed)/i,
  /worker readiness claimed/i,
  /runtime readiness claimed/i,
  /media readiness claimed/i,
  /supabase mutation enabled/i,
  /sql execution enabled/i,
  /docker push enabled/i,
  /docker run enabled/i,
  /gcp enabled/i,
]

for (const pattern of forbiddenPatterns) {
  assert(!pattern.test(changedText), `forbidden readiness widening matched ${pattern}`)
}

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2a_diagnostics_passed',
  decision,
  sourceHead: result.sourceVerification.sourceHead,
  toolCandidateCount: result.toolCandidateCount,
  directPackageCount: result.directPackageCount,
  aliasToolCount: result.aliasToolCount,
  metadataPassedCount: result.metadataPassedCount,
  importPassedCount: result.importPassedCount,
  probePassedCount: result.probePassedCount,
  tempVenvRemoved: result.tempVenvRemoved,
  internalSyntheticToolCallProof: beta.betaStatus.internalSyntheticToolCallProof,
  realUserMediaBeta: beta.betaStatus.realUserMediaBeta,
  externalBeta: beta.betaStatus.externalBeta,
  production: beta.betaStatus.production,
  nextPrompt: result.nextPrompt,
}, null, 2))
