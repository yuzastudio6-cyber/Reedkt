import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_beta_runner_boundary_preflight_after_image_import_proof_completed_with_warnings_ready_for_limited_beta_runner_boundary_preflight_owner_review_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_decision_after_image_import_proof_passed_with_warnings_ready_for_limited_no_media_no_artifact_beta_runner_boundary_preflight_after_image_import_proof'

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof.md',
  scope: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-scope-register-after-image-import-proof.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-tool-register-after-image-import-proof.md',
  payload: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-payload-guard-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof.md',
  sourceDecision: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-decision-after-image-import-proof.md',
  sourceScope: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-scope-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-evidence-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-claim-policy-after-image-import-proof.md',
  allowlist: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-allowlist-proof-register-after-image-import-proof.md'
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

const result = parseBlock(
  files.result,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof'
)
const scope = parseBlock(
  files.scope,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-scope-register-after-image-import-proof'
)
const tools = parseBlock(
  files.tools,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-tool-register-after-image-import-proof'
)
const payload = parseBlock(
  files.payload,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-payload-guard-register-after-image-import-proof'
)
const blockers = parseBlock(
  files.blockers,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-blocker-register-after-image-import-proof'
)
const policy = parseBlock(
  files.policy,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-claim-policy-after-image-import-proof'
)
const source = parseBlock(
  files.sourceDecision,
  'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-decision-after-image-import-proof'
)
const sourceScope = parseBlock(
  files.sourceScope,
  'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-scope-register-after-image-import-proof'
)
const sourceEvidence = parseBlock(
  files.sourceEvidence,
  'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-evidence-register-after-image-import-proof'
)
const sourcePolicy = parseBlock(
  files.sourcePolicy,
  'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-claim-policy-after-image-import-proof'
)
const allowlist = parseBlock(
  files.allowlist,
  'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-allowlist-proof-register-after-image-import-proof'
)

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [result, scope, tools, payload, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(result.sourceDecision === sourceDecision, 'source decision mismatch')
assert(result.sourcePr === 1193, 'source PR mismatch')
assert(result.sourceMergeCommit === '49e4406d9e1e2dff08dadc3734769ce2d304b36e', 'source merge commit mismatch')
assert(result.preflightPlan.plannedOnly === true, 'preflight is not planning-only')
assert(result.preflightPlan.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(result.preflightPlan.forbiddenPayloadStopCount === 14, 'forbidden payload stop count mismatch')
assert(result.preflightPlan.failedFixtureCount === 0, 'failed fixture count widened')
assert(result.preflightPlan.sanitizedEvidenceOnly === true, 'sanitized evidence policy missing')
assert(result.acceptedForToday.limitedInternalRunnerBoundaryPreflightPlanning === 'yes', 'planning not accepted')

for (const key of [
  'limitedInternalRunnerBoundaryPreflightExecution',
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaFileOpen',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(result.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(scope.counts.authorizedFuturePlanningItemCount === 6, 'future planning item count mismatch')
assert(scope.counts.notAuthorizedItemCount === 18, 'not authorized count mismatch')
assert(scope.counts.productExecutionAuthorizedCount === 0, 'product execution authorization widened')
assert(scope.counts.externalBetaReadyCount === 0, 'external beta readiness widened')
assert(scope.counts.productionReadyCount === 0, 'production readiness widened')
for (const item of ['product_tool_call_execution', 'media_file_open', 'artifact_write', 'supabase_mutation', 'sql_execution']) {
  assert(scope.notAuthorized.includes(item), `missing non-authorization: ${item}`)
}

assert(JSON.stringify(tools.acceptedForFutureSyntheticPreflightPlanning) === JSON.stringify(expectedTools), 'tool allowlist mismatch')
assert(JSON.stringify(tools.notAcceptedForProductExecutionToday) === JSON.stringify(expectedTools), 'tool no-execution list mismatch')
assert(tools.counts.acceptedForFutureSyntheticPreflightPlanningCount === 15, 'future tool planning count mismatch')
assert(tools.counts.acceptedForProductExecutionTodayCount === 0, 'product execution tool count widened')
assert(tools.counts.acceptedForExternalBetaTodayCount === 0, 'external beta tool count widened')
assert(tools.counts.acceptedForProductionTodayCount === 0, 'production tool count widened')

assert(payload.counts.requiredFutureSyntheticPayloadFieldCount === 9, 'payload required field count mismatch')
assert(payload.counts.forbiddenPayloadFamilyCount === 14, 'forbidden payload family count mismatch')
assert(payload.counts.runtimeFlagsRequiredFalseCount === 3, 'runtime false flag count mismatch')
for (const field of ['approvedPlanSnapshotId', 'idempotencyKey', 'toolId']) {
  assert(payload.requiredFutureSyntheticPayloadFields.includes(field), `missing required payload field: ${field}`)
}
for (const forbidden of ['rawPrompt', 'mediaFilePath', 'artifactWriteTarget', 'supabaseWriteIntent', 'dockerRunRequest']) {
  assert(payload.forbiddenPayloadFamilies.includes(forbidden), `missing forbidden payload family: ${forbidden}`)
}

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 4, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product execution blocker count widened')

assert(policy.allowedClaims.limitedInternalRunnerBoundaryPreflightPlanning === true, 'allowed preflight planning claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count claim mismatch')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden claim missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden claim missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden claim missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(source.decision === sourceDecision, 'source reauthorization decision mismatch')
assert(source.sourcePr === 1190, 'upstream source PR mismatch')
assert(source.acceptedDecision.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(source.acceptedDecision.blockedPassedCount === 14, 'source blocked count mismatch')
assert(source.acceptedDecision.externalBetaReadyCount === 0, 'source external beta widened')
assert(source.acceptedDecision.productionReadyCount === 0, 'source production widened')
assert(sourceScope.counts.productExecutionAuthorizedCount === 0, 'source product execution widened')
assert(sourceEvidence.proofEvidence.allowPassedCount === 15, 'source allow proof count mismatch')
assert(sourceEvidence.proofEvidence.blockedPassedCount === 14, 'source blocked proof count mismatch')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')
assert(JSON.stringify(allowlist.acceptedToolIds) === JSON.stringify([
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
]), 'source allowlist register drifted')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const jsonYes = (key) => `"${key}"` + ': "yes"'
const jsonCount = (key, count) => `"${key}"` + `: ${count}`
const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  jsonYes('productToolCallExecution'),
  jsonYes('workerExecution'),
  jsonYes('routeExecution'),
  jsonYes('mediaFileOpen'),
  jsonYes('mediaProcessing'),
  jsonYes('artifactWrites'),
  jsonYes('supabaseSql'),
  jsonYes('providerModelCalls'),
  jsonYes('dockerGcp'),
  jsonYes('externalBetaUnlock'),
  jsonYes('productionUnlock'),
  jsonCount('productExecutionAuthorizedCount', 15),
  jsonCount('acceptedForProductExecutionTodayCount', 15),
  jsonCount('acceptedForExternalBetaTodayCount', 15),
  jsonCount('acceptedForProductionTodayCount', 15),
  jsonCount('externalBetaReadyCount', 15),
  jsonCount('productionReadyCount', 15),
  jsonYes('sqlExecuted'),
  'Docker push ' + 'enabled',
  'Docker run ' + 'enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_beta_runner_boundary_preflight_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: result.sourcePr,
      sourceMergeCommit: result.sourceMergeCommit,
      acceptedSoundCpuToolCount: result.preflightPlan.acceptedSoundCpuToolCount,
      forbiddenPayloadStopCount: result.preflightPlan.forbiddenPayloadStopCount,
      productExecutionAuthorizedCount: scope.counts.productExecutionAuthorizedCount,
      externalBetaReadyCount: scope.counts.externalBetaReadyCount,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
