import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_tool_call_readiness_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_beta_tool_call_preflight_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-acceptance-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-evidence-register-after-image-import-proof.md',
  beta: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-beta-boundary-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  sourceTools: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-tool-register.md'
}

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
  'mir_eval'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-acceptance-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-evidence-register-after-image-import-proof')
const beta = parseBlock(files.beta, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-beta-boundary-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-claim-policy-after-image-import-proof')
const sourceProof = parseBlock(files.sourceProof, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof')
const sourceTools = parseBlock(files.sourceTools, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-tool-register')

read(files.prompt)

assert(review.decision === decision, 'review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(evidence.decision === decision, 'evidence decision mismatch')
assert(beta.decision === decision, 'beta decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(policy.decision === decision, 'policy decision mismatch')
assert(review.sourcePr === 1171, 'source PR mismatch')
assert(review.sourceMergeCommit === '9991152090972426e4b9cf01cf4f82923c6f3137', 'source merge mismatch')
assert(review.acceptedEvidence.toolCandidateCount === 15, 'tool count mismatch')
assert(review.acceptedEvidence.probePassedCount === 15, 'probe pass mismatch')
assert(review.acceptedEvidence.probeFailedCount === 0, 'probe failure mismatch')
assert(review.acceptedEvidence.runtimeFlagsAllFalse === true, 'runtime flags evidence missing')

assert(acceptance.acceptedToolCallsForControlledPreflightPlanning.length === 15, 'accepted tool list size mismatch')
for (const toolId of expectedTools) {
  assert(acceptance.acceptedToolCallsForControlledPreflightPlanning.includes(toolId), `missing accepted tool ${toolId}`)
}
assert(acceptance.acceptedForExecutionToday === 'none', 'execution must not be accepted today')
assert(acceptance.counts.acceptedForProductExecutionTodayCount === 0, 'product execution count widened')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta count widened')

assert(evidence.sourceEvidence.sourcePr === 1171, 'evidence source PR mismatch')
assert(evidence.evidenceAccepted.syntheticProbePassedCount === 15, 'accepted proof count mismatch')
assert(evidence.evidenceAccepted.syntheticProbeFailedCount === 0, 'accepted failure count mismatch')
assert(evidence.evidenceAccepted.packageLockUnchanged === true, 'package lock evidence missing')
assert(evidence.evidenceNotAcceptedAs.includes('external_beta_unlock'), 'external beta non-acceptance missing')

assert(beta.boundary.controlledBetaToolCallPreflightPlanningMayProceed === true, 'controlled preflight planning should proceed')
for (const key of [
  'productToolCallExecutionReadyToday',
  'workerExecutionReadyToday',
  'routeExecutionReadyToday',
  'mediaProcessingReadyToday',
  'artifactDeliveryReadyToday',
  'externalBetaReadyToday',
  'productionReadyToday'
]) {
  assert(beta.boundary[key] === false, `${key} must remain false`)
}

for (const blocker of ['controlled_beta_tool_call_preflight_after_image_import_proof', 'media_processing_and_artifact_policy_gate', 'external_beta_readiness_gate']) {
  assert(blockers.remainingBeforeExternalBeta.includes(blocker), `missing blocker ${blocker}`)
}
for (const value of Object.values(blockers.blockedToday)) assert(value === true, 'all blocked-today markers must be true')

assert(policy.allowedClaims.controlledBetaToolCallPreflightPlanningMayProceed === true, 'allowed planning claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden claim missing')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')

assert(
  sourceProof.decision ===
    'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_tool_call_readiness_proof_after_image_import_proof_passed_with_warnings_ready_for_tool_call_readiness_owner_review_after_image_import_proof',
  'source proof decision mismatch'
)
assert(sourceProof.result.probePassedCount === 15, 'source proof pass count mismatch')
assert(sourceTools.counts.readyForExternalBetaCount === 0, 'source external beta widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-tool-call-readiness-owner-review-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionReadyToday": true',
  '"workerExecutionReadyToday": true',
  '"routeExecutionReadyToday": true',
  '"externalBetaReadyToday": true',
  '"productionReadyToday": true',
  '"acceptedForProductExecutionTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_tool_call_readiness_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedToolCount: acceptance.counts.acceptedToolCount,
      acceptedForProductExecutionTodayCount: acceptance.counts.acceptedForProductExecutionTodayCount,
      externalBetaReadyToday: beta.boundary.externalBetaReadyToday,
      productionReadyToday: beta.boundary.productionReadyToday,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
