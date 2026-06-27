import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_tool_call_readiness_proof_after_image_import_proof_passed_with_warnings_ready_for_tool_call_readiness_owner_review_after_image_import_proof'

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-tool-register.md',
  flags: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-runtime-flag-register.md',
  beta: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-beta-boundary.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof.md'
}

const expectedTools = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm'
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof')
const tools = parseBlock(files.tools, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-tool-register')
const flags = parseBlock(files.flags, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-runtime-flag-register')
const beta = parseBlock(files.beta, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-beta-boundary')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-blocker-register')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-claim-policy')
const sourcePlan = parseBlock(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof')

read(files.prompt)
assert(existsSync(path.join(root, 'scripts/validation/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-runner.py')), 'missing reused proof runner')

assert(result.decision === decision, 'result decision mismatch')
assert(tools.decision === decision, 'tool register decision mismatch')
assert(flags.decision === decision, 'runtime flag decision mismatch')
assert(beta.decision === decision, 'beta boundary decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(result.sourcePr === 1168, 'source PR mismatch')
assert(result.sourceMergeCommit === '24f520340a3967734d76b081cc4c03f7f83d6b15', 'source merge mismatch')
assert(result.result.toolCandidateCount === 15, 'tool candidate count mismatch')
assert(result.result.directPackageCount === 13, 'direct package count mismatch')
assert(result.result.aliasToolCount === 2, 'alias tool count mismatch')
assert(result.result.metadataPassedCount === 13, 'metadata pass count mismatch')
assert(result.result.metadataFailedCount === 0, 'metadata failure count mismatch')
assert(result.result.importPassedCount === 13, 'import pass count mismatch')
assert(result.result.importFailedCount === 0, 'import failure count mismatch')
assert(result.result.probePassedCount === 15, 'probe pass count mismatch')
assert(result.result.probeFailedCount === 0, 'probe failure count mismatch')
assert(result.result.tempVenvRemoved === true, 'temporary venv must be removed')

const toolIds = new Set(tools.toolCalls.map((row) => row.toolId))
for (const toolId of expectedTools) assert(toolIds.has(toolId), `missing tool ${toolId}`)
for (const row of tools.toolCalls) assert(row.probeStatus === 'passed', `probe must pass for ${row.toolId}`)
assert(tools.counts.readyForOwnerReviewCount === 15, 'owner review count mismatch')
assert(tools.counts.readyForExternalBetaCount === 0, 'external beta count must remain zero')
assert(tools.counts.readyForProductionCount === 0, 'production count must remain zero')

for (const [flag, value] of Object.entries(flags.runtimeFlags)) {
  assert(value === false, `runtime flag must remain false: ${flag}`)
}
assert(flags.guardResult.syntheticInputOnly === true, 'synthetic input guard missing')
assert(flags.guardResult.trackedRepoMutationFromProof === false, 'proof must not mutate tracked repo')

assert(beta.betaBoundary.internalSyntheticToolCallProof === 'passed', 'internal synthetic proof must pass')
assert(beta.betaBoundary.toolCallReadinessOwnerReviewMayProceed === true, 'owner review should proceed')
assert(beta.betaBoundary.productToolCallExecutionReadyToday === false, 'product tool-call execution must remain blocked')
assert(beta.betaBoundary.externalBeta === 'blocked', 'external beta must remain blocked')
assert(beta.betaBoundary.paidProduction === 'blocked', 'production must remain blocked')

assert(blockers.resolvedByThisProof.includes('controlled_synthetic_no_media_no_artifact_tool_call_probe_for_15_tools'), 'resolved proof marker missing')
for (const blocker of ['tool_call_readiness_owner_review_after_image_import_proof', 'media_file_open_and_artifact_policy_gate', 'external_beta_readiness_gate']) {
  assert(blockers.remainingBeforeProductToolCalls.includes(blocker), `missing remaining blocker ${blocker}`)
}
for (const value of Object.values(blockers.blockedToday)) assert(value === true, 'all blocked-today markers must be true')

assert(policy.allowedClaims.controlledSyntheticNoMediaNoArtifactToolCallProofPassed === true, 'allowed proof claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')
assert(
  sourcePlan.decision ===
    'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_after_image_import_proof_completed_with_warnings_ready_for_controlled_tool_call_readiness_proof_after_image_import_proof',
  'source plan decision mismatch'
)
assert(sourcePlan.planResult.toolCallExecutionApprovedToday === false, 'source plan widened tool execution')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionReadyToday": true',
  '"workerExecutionReadyToday": true',
  '"routeExecutionReadyToday": true',
  '"externalBetaReady": "yes"',
  '"productionReady": "yes"',
  '"readyForExternalBetaCount": 15',
  '"readyForProductionCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_tool_call_readiness_proof_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: result.sourceMergeCommit,
      toolCandidateCount: result.result.toolCandidateCount,
      probePassedCount: result.result.probePassedCount,
      readyForOwnerReviewCount: tools.counts.readyForOwnerReviewCount,
      externalBeta: beta.betaBoundary.externalBeta,
      production: beta.betaBoundary.paidProduction,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
