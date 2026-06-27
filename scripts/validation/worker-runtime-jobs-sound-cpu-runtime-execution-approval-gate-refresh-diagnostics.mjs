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
  result: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh.md',
  criteria: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-criteria-register.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-tool-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-blocker-register.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-duplicate-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan.md',
  sourceRefresh: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh.md',
  sourceRetry: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh')
const criteria = parseJsonBlock(files.criteria, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-criteria-register')
const tools = parseJsonBlock(files.tools, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-tool-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-blocker-register')
const duplicates = parseJsonBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-duplicate-register')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-claim-policy')
const refresh = parseJsonBlock(files.sourceRefresh, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh')
const retry = parseJsonBlock(files.sourceRetry, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result')

const decision = 'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_refresh_completed_with_warnings_ready_for_limited_no_media_no_artifact_tool_call_readiness_plan'
assert(result.decision === decision, 'unexpected decision')
assert(result.sourceVerification.sourceHead === 'ee88f613b14ecbde4c0769edf0a9ddc8bc1eb359', 'unexpected source head')
assert(result.sourceVerification.pr1124.status === 'merged', 'PR #1124 source not marked merged')
assert(result.sourceVerification.ownerChatWaitRequired === false, 'owner wait should be false')
assert(result.approvalGateRefresh.packageProofReadyForPlanningCount === 15, 'package proof count must be 15')
for (const key of ['persistentRuntimeInstallReadyCount', 'toolCallExecutionReadyCount', 'workerRuntimeExecutionReadyCount']) {
  assert(result.approvalGateRefresh[key] === 0, `${key} must be zero`)
}
assert(result.approvalGateRefresh.futureLimitedNoMediaNoArtifactToolCallReadinessPlanMayProceed === true, 'future readiness plan should be allowed')
assert(result.approvalGateRefresh.futurePlanMustRemainSeparatePrompt === true, 'separate prompt guard missing')
for (const key of [
  'approvedForExecutionToday',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'providerCallsApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'internalBetaAllowed',
  'externalBetaAllowed',
  'productionAllowed',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'toolCallReadinessClaimedToday',
  'mediaReadinessClaimedToday'
]) {
  assert(result.approvalGateRefresh[key] === false, `${key} must be false`)
}
assert(result.approvalGateRefresh.executionApprovalsGrantedToday === 'none', 'execution approval must be none')

assert(criteria.acceptedPrerequisites.candidateToolCount === 15, 'criteria tool count mismatch')
assert(criteria.acceptedPrerequisites.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(criteria.acceptedPrerequisites.aliasCoveredToolCount === 2, 'alias count mismatch')
for (const value of Object.values(criteria.criteriaForFutureReadinessPlan)) assert(value === true, 'future criteria guard must be true')
for (const value of Object.values(criteria.notAcceptedToday)) assert(value === false, 'not accepted today value must be false')

assert(tools.packageProofReadyForPlanning.length === 15, 'ready-for-planning list must include 15 tools')
assert(tools.notYetReadyForToolCallExecution.length === 15, 'not-ready list must include 15 tools')
assert(tools.counts.toolCallExecutionReadyCount === 0, 'tool-call execution count must be zero')
assert(tools.counts.notYetReadyForToolCallExecutionCount === 15, 'not-ready count must be 15')

for (const required of [
  'persistent_runtime_install_readiness',
  'explicit_tool_call_allowlist',
  'runtime_flag_guard_review',
  'synthetic_payload_schema_review',
  'supabase_sql_storage_stays_disabled',
  'beta_readiness_not_unlocked'
]) {
  assert(blockers.remainingBeforeToolCalls.includes(required), `missing blocker ${required}`)
}
for (const value of Object.values(blockers.blockedToday)) assert(value === true, 'blocked today value must be true')

assert(duplicates.duplicateCheck.samePurposeRemoteBranchFound === false, 'same-purpose branch should be false')
assert(duplicates.duplicateCheck.samePurposeOpenPrFound === false, 'same-purpose PR should be false')
assert(duplicates.coordinationPolicy.ownerResponseWaitRequired === false, 'owner wait should be false')

assert(next.selectedNextStep.prompt.includes('TOOL-CALL-READINESS-PLAN'), 'unexpected next prompt')
assert(next.selectedNextStep.separatePromptRequired === true, 'next prompt must be separate')

for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claim marker must be true')
for (const claim of ['tool-call execution ready', 'worker execution ready', 'route execution ready', 'runtime readiness', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update should be no')
assert(policy.requiredNoScopeStatement.includes('tool-call execution'), 'no-scope tool-call guard missing')

assert(refresh.decision === 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_completed_with_warnings_ready_for_runtime_execution_approval_gate_refresh', 'source refresh decision mismatch')
assert(refresh.refreshResult.packageProofRetryAccepted === true, 'source refresh package proof missing')
assert(retry.proofResult.packageProofPassed === true, 'retry package proof not passed')
assert(retry.readinessOutcome.toolCallReadinessClaimed === false, 'retry widened tool-call readiness')
assert(retry.readinessOutcome.externalBetaUnlocked === false, 'retry widened external beta')

const changedTexts = [
  files.result,
  files.criteria,
  files.tools,
  files.blockers,
  files.duplicates,
  files.next,
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
  status: 'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_refresh_diagnostics_passed',
  decision,
  sourceHead: result.sourceVerification.sourceHead,
  packageProofReadyForPlanningCount: result.approvalGateRefresh.packageProofReadyForPlanningCount,
  persistentRuntimeInstallReadyCount: result.approvalGateRefresh.persistentRuntimeInstallReadyCount,
  toolCallExecutionReadyCount: result.approvalGateRefresh.toolCallExecutionReadyCount,
  nextPrompt: result.nextPrompt
}, null, 2))
