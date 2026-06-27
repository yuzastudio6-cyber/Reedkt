#!/usr/bin/env node
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const exists = (path) => fs.existsSync(path)
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const parseJsonBlock = (path, label) => {
  const text = read(path)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${path}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${path}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan.md',
  allowlist: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-static-allowlist.md',
  schema: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-payload-schema-plan.md',
  guards: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-runtime-guard-plan.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-stop-condition-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-blocker-register.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-duplicate-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof.md',
  sourceGate: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh.md',
  sourceRetry: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan')
const allowlist = parseJsonBlock(files.allowlist, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-static-allowlist')
const schema = parseJsonBlock(files.schema, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-payload-schema-plan')
const guards = parseJsonBlock(files.guards, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-runtime-guard-plan')
const stops = parseJsonBlock(files.stops, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-stop-condition-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-blocker-register')
const duplicates = parseJsonBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-duplicate-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-claim-policy')
const sourceGate = parseJsonBlock(files.sourceGate, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh')
const retry = parseJsonBlock(files.sourceRetry, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result')

const decision = 'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_completed_with_warnings_ready_for_controlled_tool_call_readiness_proof'
assert(result.decision === decision, 'unexpected decision')
assert(result.sourceVerification.sourceHead === 'c4b759cf9a1c6417d572e2ee03dc65339ec08766', 'unexpected source head')
assert(result.sourceVerification.pr1126.status === 'merged', 'PR #1126 source not marked merged')
assert(result.sourceVerification.ownerChatWaitRequired === false, 'owner wait should be false')
assert(result.planResult.packageProofReadyForPlanningCount === 15, 'package proof count must be 15')
assert(result.planResult.persistentRuntimeInstallReadyCount === 0, 'persistent runtime install must be zero')
assert(result.planResult.toolCallExecutionReadyCount === 0, 'tool-call execution ready count must be zero')
assert(result.planResult.futureControlledToolCallReadinessProofMayProceed === true, 'future proof should be planned')
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

for (const required of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'toolId', 'callCategory', 'syntheticInputId', 'runtimeFlags', 'attempt']) {
  assert(schema.futureProofPayload.requiredFields.includes(required), `missing payload field ${required}`)
}
for (const value of Object.values(schema.futureProofPayload.runtimeFlagsMustEqual)) assert(value === false, 'runtime flag must be false')
for (const forbidden of ['rawPrompt', 'mediaFilePath', 'signedUrl', 'publicUrl', 'serviceRolePayload', 'artifactWriteTarget']) {
  assert(schema.futureProofPayload.forbiddenFields.includes(forbidden), `missing forbidden payload field ${forbidden}`)
}
assert(schema.futureProofResult.allowedStatuses.includes('passed'), 'result statuses missing passed')
assert(schema.futureProofResult.allowedStatuses.includes('failed_safe'), 'result statuses missing failed_safe')

for (const value of Object.values(guards.failClosedDefaults)) assert(value === '0', 'fail-closed default must be 0')
for (const value of Object.values(guards.futureProofTemporaryOverrides)) assert(value === true, 'future proof override guard must be true')
assert(guards.stopConditions.includes('media_path_detected'), 'guard stop condition missing media path')

assert(stops.stopConditions.length >= 7, 'stop condition list too short')
for (const claim of ['tool-call execution ready', 'runtime ready', 'worker ready', 'route ready', 'external beta ready', 'production ready']) {
  assert(stops.blockedReadinessClaims.includes(claim), `missing blocked readiness claim ${claim}`)
}

assert(blockers.remainingBeforeExternalBeta.includes('controlled_tool_call_readiness_proof_not_run_yet'), 'missing proof-not-run blocker')
assert(blockers.currentPromptDoesNotResolve.includes('tool_call_execution_readiness'), 'must not resolve execution readiness')
assert(duplicates.duplicateCheck.samePurposeRemoteBranchFound === false, 'same-purpose branch should be false')
assert(duplicates.duplicateCheck.samePurposeOpenPrFound === false, 'same-purpose PR should be false')
assert(duplicates.coordinationPolicy.ownerResponseWaitRequired === false, 'owner wait should be false')

for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claim marker must be true')
for (const claim of ['tool-call execution ready', 'worker execution ready', 'route execution ready', 'runtime readiness', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update should be no')

assert(sourceGate.decision === 'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_refresh_completed_with_warnings_ready_for_limited_no_media_no_artifact_tool_call_readiness_plan', 'source gate decision mismatch')
assert(sourceGate.approvalGateRefresh.futureLimitedNoMediaNoArtifactToolCallReadinessPlanMayProceed === true, 'source gate did not allow planning')
assert(sourceGate.approvalGateRefresh.toolExecutionApprovedToday === false, 'source gate widened execution')
assert(sourceGate.approvalGateRefresh.toolCallReadinessClaimedToday === false, 'source gate widened readiness')
assert(retry.proofResult.packageProofPassed === true, 'retry proof not passed')
assert(retry.readinessOutcome.toolCallReadinessClaimed === false, 'retry widened tool-call readiness')

const changedTexts = [
  files.result,
  files.allowlist,
  files.schema,
  files.guards,
  files.stops,
  files.blockers,
  files.duplicates,
  files.policy,
  files.prompt
].map(read).join('\n')
for (const forbidden of [
  'tool-call execution ready true',
  'worker execution ready true',
  'route execution ready true',
  'external beta ready true',
  'production ready true',
  'SQL executed yes',
  'Supabase mutation yes'
]) {
  assert(!changedTexts.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_diagnostics_passed',
  decision,
  sourceHead: result.sourceVerification.sourceHead,
  allowedToolCount: allowlist.counts.allowedToolCount,
  readyForToolCallExecutionToday: allowlist.counts.readyForToolCallExecutionToday,
  nextPrompt: result.nextPrompt
}, null, 2))
