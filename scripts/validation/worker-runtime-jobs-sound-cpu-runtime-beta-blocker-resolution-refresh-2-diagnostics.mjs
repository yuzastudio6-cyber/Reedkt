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
  result: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-2.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-remaining-register.md',
  disk: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-validation-disk-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-reeditpro-local-validation-disk-cleanup-2-sound-cpu-beta-readiness.md',
  source: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-evidence-map.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-claim-policy.md'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_2_completed_with_warnings_ready_for_local_validation_disk_cleanup_2'
const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-2')
const remaining = parseJsonBlock(files.remaining, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-remaining-register')
const disk = parseJsonBlock(files.disk, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-validation-disk-register')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-claim-policy')
const source = parseJsonBlock(files.source, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation')
const sourceEvidence = parseJsonBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-evidence-map')
const sourcePolicy = parseJsonBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-claim-policy')

assert(result.decision === decision, 'unexpected refresh decision')
assert(result.sourceVerification.sourceHead === '59adba240343532a95e861ecdf37e4ab483dbad8', 'unexpected source head')
assert(result.sourceVerification.pr1131.status === 'merged', 'PR #1131 must be merged')
assert(result.sourceVerification.ownerChatWaitRequired === false, 'owner wait must be false')
assert(result.refreshResult.acceptedSoundCpuToolCount === 15, 'accepted tool count must be 15')
assert(result.refreshResult.packageProofReadyForPlanningCount === 15, 'package proof count must be 15')
assert(result.refreshResult.syntheticToolCallProbePassedCount === 15, 'synthetic probe passed count must be 15')
assert(result.refreshResult.syntheticToolCallProbeFailedCount === 0, 'synthetic probe failed count must be 0')
assert(result.refreshResult.duplicateProofRerunRequired === false, 'duplicate proof rerun must be false')
assert(result.refreshResult.firstUnresolvedBlocker === 'local_validation_disk_hydration_below_25_gib', 'unexpected first blocker')
assert(result.refreshResult.nextSafeGateRequiresDiskCleanup === true, 'disk cleanup must be selected')
for (const key of [
  'persistentRuntimeInstallReadyCount',
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'mediaProcessingReadyCount',
  'supabaseSqlReadyCount',
  'artifactDeliveryReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) {
  assert(result.refreshResult[key] === 0, `${key} must remain zero`)
}

assert(remaining.remainingBlockers.length >= 5, 'remaining blockers list too short')
assert(remaining.remainingBlockers[0].id === 'local_validation_disk_hydration_below_25_gib', 'disk blocker must be first')
assert(remaining.remainingBlockers[0].currentFreeSpaceGiBApprox < remaining.remainingBlockers[0].targetFreeSpaceGiB, 'disk blocker must remain below target')
assert(remaining.closedOrAcceptedPlanningEvidence.includes('tool_call_readiness_reconciliation_pr1131'), 'missing PR #1131 closed evidence')

assert(disk.diskObservation.mount === '/Volumes/backup', 'unexpected disk mount')
assert(disk.diskObservation.observedFreeSpaceGiBApprox < disk.diskObservation.targetBeforeHydrationGiB, 'disk observation must be below target')
assert(disk.diskObservation.dependencyHydrationAttemptedInThisPrompt === false, 'hydration must not run')
assert(disk.requiredCleanupPolicy.deleteTrackedSource === false, 'must not delete tracked source')
assert(disk.requiredCleanupPolicy.skipAmbiguousTargets === true, 'must skip ambiguous targets')

assert(next.selectedNextStep.prompt.includes('REEDITPRO-LOCAL-VALIDATION-DISK-CLEANUP-2'), 'unexpected next prompt')
for (const row of next.nonSelectedNextSteps) assert(row.reason, `missing reason for ${row.prompt}`)

assert(policy.allowedClaims.packageProofReadyForPlanningCount === 15, 'allowed package proof count mismatch')
assert(policy.allowedClaims.syntheticToolCallProbePassedCount === 15, 'allowed probe count mismatch')
assert(policy.allowedClaims.nextSafeGateIsDiskCleanup === true, 'allowed next gate mismatch')
for (const value of Object.values(policy.runtimeFlags)) assert(value === false, 'runtime flag must be false')
for (const claim of ['external beta ready', 'paid production ready', 'runtime readiness', 'product tool-call execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(source.decision === 'worker_runtime_jobs_sound_cpu_tool_call_readiness_reconciliation_completed_with_warnings_ready_for_runtime_beta_blocker_resolution_refresh_2', 'source decision mismatch')
assert(source.reconciliationResult.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(source.reconciliationResult.productToolCallExecutionReadyCount === 0, 'source product tool-call count must be 0')
assert(sourceEvidence.currentReadinessCounts.externalBetaReady === 0, 'source external beta must be 0')
assert(sourcePolicy.runtimeFlags.workerExecutionAttempted === false, 'source worker execution must be false')

const changedText = [
  files.result,
  files.remaining,
  files.disk,
  files.next,
  files.policy,
  files.prompt
].map(read).join('\n')
for (const forbidden of [
  'externalBetaReadyCount\": 1',
  'productionReadyCount\": 1',
  'packageInstallAttempted\": true',
  'toolCallAttempted\": true',
  'workerExecutionAttempted\": true',
  'routeExecutionAttempted\": true',
  'sqlExecutionAttempted\": true',
  'supabaseMutationAttempted\": true',
  'Docker build',
  'Docker push',
  'Docker run'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_2_diagnostics_passed',
  decision,
  acceptedSoundCpuToolCount: result.refreshResult.acceptedSoundCpuToolCount,
  syntheticToolCallProbePassedCount: result.refreshResult.syntheticToolCallProbePassedCount,
  firstUnresolvedBlocker: result.refreshResult.firstUnresolvedBlocker,
  nextPrompt: result.nextPrompt
}, null, 2))
