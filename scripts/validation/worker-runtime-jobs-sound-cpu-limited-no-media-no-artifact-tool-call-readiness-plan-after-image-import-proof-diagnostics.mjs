import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof.md',
  allowlist: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-allowlist.md',
  schema: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-payload-schema.md',
  guards: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-runtime-guards.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-stop-conditions.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-blocker-register.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-duplicate-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  sourceGate: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof.md',
  oldPlan: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan.md'
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

const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof')
const allowlist = parseBlock(files.allowlist, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-allowlist')
const schema = parseBlock(files.schema, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-payload-schema')
const guards = parseBlock(files.guards, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-runtime-guards')
const stops = parseBlock(files.stops, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-stop-conditions')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-blocker-register')
const duplicates = parseBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-duplicate-register')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-claim-policy')
const sourceGate = parseBlock(files.sourceGate, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof')
const oldPlan = parseBlock(files.oldPlan, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan')

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_after_image_import_proof_completed_with_warnings_ready_for_controlled_tool_call_readiness_proof_after_image_import_proof'

assert(result.decision === expectedDecision, 'unexpected decision')
assert(result.sourceMergeCommit === '9f9cd3091808d5efe7f3930d4a8b0338cb5289ae', 'source merge mismatch')
assert(result.planResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(result.planResult.futureControlledToolCallReadinessProofMayProceed === true, 'future proof should proceed')
for (const key of [
  'currentPromptExecutionPerformed',
  'toolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseSqlApprovedToday',
  'artifactCreationApprovedToday',
  'internalBetaAllowedToday',
  'externalBetaAllowedToday',
  'productionAllowedToday'
]) {
  assert(result.planResult[key] === false, `${key} must be false`)
}

assert(allowlist.allowedToolsForFutureProofPlanning.length === 15, 'allowlist must include 15 tools')
assert(allowlist.counts.readyForToolCallExecutionToday === 0, 'ready today count must be zero')
for (const forbidden of ['media_file_open', 'audioread.audio_open', 'pydub.AudioSegment.from_file', 'ffmpeg', 'ffprobe', 'worker_dispatch', 'route_execution', 'supabase_or_sql']) {
  assert(allowlist.explicitlyForbiddenFutureCalls.includes(forbidden), `missing forbidden future call ${forbidden}`)
}

for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'toolId', 'callCategory', 'syntheticInputId', 'runtimeFlags', 'attempt']) {
  assert(schema.futureProofPayload.requiredFields.includes(field), `missing payload field ${field}`)
}
for (const value of Object.values(schema.futureProofPayload.runtimeFlagsMustEqual)) assert(value === false, 'runtime flag must be false')
for (const forbidden of ['rawPrompt', 'mediaFilePath', 'signedUrl', 'publicUrl', 'serviceRolePayload', 'artifactWriteTarget']) {
  assert(schema.futureProofPayload.forbiddenFields.includes(forbidden), `missing forbidden field ${forbidden}`)
}
assert(schema.futureProofResult.allowedStatuses.includes('passed'), 'missing passed status')
assert(schema.futureProofResult.allowedStatuses.includes('failed_safe'), 'missing failed_safe status')

for (const value of Object.values(guards.failClosedDefaults)) assert(value === '0', 'fail-closed default must be 0')
for (const value of Object.values(guards.futureProofTemporaryOverrides)) assert(value === true, 'future proof guard must be true')
assert(guards.stopConditions.includes('media_path_detected'), 'missing media stop condition')

assert(stops.stopConditions.length >= 8, 'stop list too short')
for (const claim of ['tool-call execution ready', 'runtime ready', 'worker ready', 'route ready', 'external beta ready', 'production ready']) {
  assert(stops.blockedReadinessClaims.includes(claim), `missing blocked claim ${claim}`)
}

assert(blockers.remainingBeforeExternalBeta.includes('controlled_tool_call_readiness_proof_not_run_yet'), 'proof blocker missing')
assert(blockers.currentPromptDoesNotResolve.includes('tool_call_execution_readiness'), 'execution readiness must remain unresolved')
assert(duplicates.samePurposeRemoteBranchFound === false, 'same-purpose branch found')
assert(duplicates.samePurposeOpenPrFound === false, 'same-purpose PR found')
assert(duplicates.olderToolCallReadinessPlanExists === true, 'older plan evidence missing')
assert(duplicates.olderToolCallReadinessPlanPredatesImageImportProof === true, 'older plan should predate image proof')
assert(duplicates.ownerResponseWaitRequired === false, 'owner wait should be false')
assert(duplicates.ownershipConflictFound === false, 'ownership conflict found')

assert(policy.allowedClaims.futureControlledSyntheticToolCallReadinessProofMayProceed === true, 'allowed planning claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')

assert(
  sourceGate.decision ===
    'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_refresh_after_image_import_proof_passed_with_warnings_ready_for_limited_no_media_no_artifact_tool_call_readiness_plan_after_image_import_proof',
  'source gate decision mismatch'
)
assert(sourceGate.approvalGateRefresh.toolExecutionApprovedToday === false, 'source gate widened tool execution')
assert(oldPlan.planResult.futureControlledToolCallReadinessProofMayProceed === true, 'old plan evidence mismatch')
assert(oldPlan.planResult.toolCallExecutionApprovedToday === false, 'old plan widened execution')

read(files.prompt)
const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  'tool-call execution ready true',
  'worker execution ready true',
  'route execution ready true',
  'external beta ready true',
  'production ready true',
  'SQL executed yes',
  'Supabase mutation yes'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_after_image_import_proof_diagnostics_passed',
      decision: result.decision,
      sourceMergeCommit: result.sourceMergeCommit,
      allowedToolCount: allowlist.counts.allowedToolCount,
      readyForToolCallExecutionToday: allowlist.counts.readyForToolCallExecutionToday,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
