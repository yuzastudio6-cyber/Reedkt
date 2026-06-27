import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_after_image_import_proof_completed_with_warnings_ready_for_controlled_beta_tool_call_preflight_owner_review_after_image_import_proof'

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof.md',
  checklist: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-checklist-after-image-import-proof.md',
  payload: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-payload-guard-register-after-image-import-proof.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-tool-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-review-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-acceptance-register-after-image-import-proof.md'
}

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

const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof')
const checklist = parseBlock(files.checklist, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-checklist-after-image-import-proof')
const payload = parseBlock(files.payload, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-payload-guard-register-after-image-import-proof')
const tools = parseBlock(files.tools, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-tool-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof')
const sourceAcceptance = parseBlock(files.sourceAcceptance, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-acceptance-register-after-image-import-proof')

read(files.prompt)

assert(result.decision === decision, 'result decision mismatch')
assert(checklist.decision === decision, 'checklist decision mismatch')
assert(payload.decision === decision, 'payload decision mismatch')
assert(tools.decision === decision, 'tools decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(policy.decision === decision, 'policy decision mismatch')
assert(result.sourcePr === 1173, 'source PR mismatch')
assert(result.sourceMergeCommit === '4b3b8bb7201acd9cfa88995400b40eb44bec0d47', 'source merge mismatch')
assert(result.preflightResult.controlledPreflightPlanCreated === true, 'preflight plan missing')
assert(result.preflightResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(result.preflightResult.sourceSyntheticProbePassedCount === 15, 'source proof count mismatch')
assert(result.preflightResult.preflightExecutionPerformed === false, 'preflight execution must not run')

for (const key of [
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactCreationApprovedToday',
  'externalBetaApprovedToday',
  'productionApprovedToday'
]) {
  assert(result.preflightResult[key] === false, `${key} must remain false`)
}

assert(checklist.counts.requiredCheckCount === 6, 'checklist count mismatch')
assert(checklist.counts.pendingCheckCount === 6, 'pending count mismatch')
assert(checklist.counts.passedCheckCount === 0, 'passed count must remain zero')
for (const row of checklist.requiredBeforeBetaFacingToolCalls) assert(row.status === 'pending', `check must remain pending: ${row.checkId}`)

for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'workerName', 'imageName', 'jobType', 'toolId']) {
  assert(payload.allowedPlanningFields.includes(field), `missing payload field ${field}`)
}
for (const value of Object.values(payload.requiredFalseRuntimeFlags)) assert(value === false, 'runtime flag must remain false')
for (const field of ['mediaFilePath', 'signedUrl', 'publicUrl', 'artifactWriteTarget', 'supabaseMutation', 'sqlStatement']) {
  assert(payload.forbiddenPayloadFields.includes(field), `missing forbidden payload field ${field}`)
}

assert(tools.acceptedForPreflightPlanning.length === 15, 'preflight tool count mismatch')
assert(tools.notAcceptedForBetaFacingExecutionToday.length === 15, 'not-ready tool count mismatch')
assert(tools.counts.acceptedForBetaFacingExecutionTodayCount === 0, 'beta-facing execution count widened')
assert(tools.counts.acceptedForExternalBetaTodayCount === 0, 'external beta count widened')

for (const blocker of ['controlled_beta_tool_call_preflight_owner_review_after_image_import_proof', 'runtime_worker_route_execution_owner_gate', 'media_processing_artifact_delivery_owner_gate']) {
  assert(blockers.remainingBeforeBetaFacingToolCalls.includes(blocker), `missing beta-facing blocker ${blocker}`)
}
assert(blockers.remainingBeforeExternalBeta.includes('production_readiness_gate'), 'production blocker missing')

assert(policy.allowedClaims.controlledBetaToolCallPreflightPlanCreated === true, 'allowed preflight claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden claim missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')

assert(
  sourceReview.decision ===
    'worker_runtime_jobs_sound_cpu_tool_call_readiness_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_beta_tool_call_preflight_after_image_import_proof',
  'source review decision mismatch'
)
assert(sourceAcceptance.counts.acceptedToolCount === 15, 'source acceptance count mismatch')
assert(sourceAcceptance.counts.acceptedForProductExecutionTodayCount === 0, 'source product execution widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"externalBetaApprovedToday": true',
  '"productionApprovedToday": true',
  '"acceptedForBetaFacingExecutionTodayCount": 15',
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
      status: 'worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: result.sourceMergeCommit,
      acceptedSoundCpuToolCount: result.preflightResult.acceptedSoundCpuToolCount,
      betaFacingExecutionReadyCount: tools.counts.acceptedForBetaFacingExecutionTodayCount,
      externalBetaReadyCount: tools.counts.acceptedForExternalBetaTodayCount,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
