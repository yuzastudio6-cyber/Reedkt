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
  result: 'docs/reeditpro-local-validation-disk-cleanup-2-sound-cpu-beta-readiness-result.md',
  inventory: 'docs/reeditpro-local-validation-disk-cleanup-2-artifact-inventory.md',
  validation: 'docs/reeditpro-local-validation-disk-cleanup-2-validation-register.md',
  next: 'docs/reeditpro-local-validation-disk-cleanup-2-next-step-register.md',
  policy: 'docs/reeditpro-local-validation-disk-cleanup-2-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-persistent-runtime-install-readiness-plan.md',
  sourceRefresh: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-2.md',
  sourceRemaining: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-remaining-register.md',
  sourceToolCall: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation.md',
  gate2a: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'reeditpro_local_validation_disk_cleanup_2_sound_cpu_beta_readiness_completed_with_warnings_ready_for_persistent_runtime_install_readiness_plan'
const result = parseJsonBlock(files.result, 'reeditpro-local-validation-disk-cleanup-2-sound-cpu-beta-readiness-result')
const inventory = parseJsonBlock(files.inventory, 'reeditpro-local-validation-disk-cleanup-2-artifact-inventory')
const validation = parseJsonBlock(files.validation, 'reeditpro-local-validation-disk-cleanup-2-validation-register')
const next = parseJsonBlock(files.next, 'reeditpro-local-validation-disk-cleanup-2-next-step-register')
const policy = parseJsonBlock(files.policy, 'reeditpro-local-validation-disk-cleanup-2-claim-policy')
const sourceRefresh = parseJsonBlock(files.sourceRefresh, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-2')
const sourceRemaining = parseJsonBlock(files.sourceRemaining, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-remaining-register')
const sourceToolCall = parseJsonBlock(files.sourceToolCall, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation')
const gate2a = parseJsonBlock(files.gate2a, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')

assert(result.decision === decision, 'unexpected cleanup decision')
assert(result.sourceVerification.sourceHead === 'd8fdc4df04c7b7a5c94e13d0f04eb4474b8aee2a', 'unexpected source head')
assert(result.sourceVerification.pr1133.status === 'merged', 'PR #1133 must be merged')
assert(result.sourceVerification.ownerChatWaitRequired === false, 'owner chat wait must be false')
assert(result.cleanupResult.targetMet === true, 'cleanup target must be met')
assert(result.cleanupResult.postCleanupFreeGiBApprox >= result.cleanupResult.targetFreeGiB, 'post-cleanup free space must meet target')
assert(result.cleanupResult.trackedSourceDeleted === false, 'tracked source must not be deleted')
assert(result.cleanupResult.dirtyMainWorktreeTouched === false, 'dirty main worktree must not be touched')
assert(result.cleanupResult.cleanMergedDisposableWorktreesRemoved.length === 3, 'expected three removed local worktrees')
assert(result.cleanupResult.dependencyHydrationAttemptedInThisPrompt === false, 'hydration must be deferred in cleanup packet')

for (const key of [
  'acceptedSoundCpuToolCount',
  'packageProofReadyForPlanningCount',
  'syntheticToolCallProbePassedCount'
]) assert(result.currentSoundCpuReadinessCounts[key] === 15, `${key} must be 15`)

for (const key of [
  'syntheticToolCallProbeFailedCount',
  'persistentRuntimeInstallReadyCount',
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'mediaProcessingReadyCount',
  'supabaseSqlReadyCount',
  'artifactDeliveryReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) assert(result.currentSoundCpuReadinessCounts[key] === 0, `${key} must remain zero`)

assert(inventory.artifactScan.codexWorktreesTopLevelNodeModulesFound === 0, 'top-level node_modules artifacts must be zero')
assert(inventory.artifactScan.packetWorktreeMacosSidecarsFoundAndRemoved === true, 'packet sidecars must be removed')
assert(inventory.preservedTargets.dirtyMainWorktree === '/Volumes/backup/REeditpro', 'dirty main worktree must be preserved')
assert(inventory.preservedTargets.remoteBranchesDeleted === false, 'remote branches must not be deleted')
assert(inventory.preservedTargets.githubPrMetadataMutated === false, 'GitHub metadata must not be mutated')

assert(validation.dependencyHydration.attempted === false, 'validation hydration must be false')
assert(validation.packageLockStatus.changed === false, 'package lock must be unchanged')
assert(validation.validationResults.some((row) => row.command === 'df -h /Volumes/backup' && row.status === 'passed'), 'missing df validation row')

assert(next.resolvedBlocker.id === 'local_validation_disk_hydration_below_25_gib', 'wrong resolved blocker')
assert(next.resolvedBlocker.status === 'resolved_for_next_prompt', 'disk blocker must be resolved for next prompt')
assert(next.selectedNextStep.prompt.includes('PERSISTENT-RUNTIME-INSTALL-READINESS-PLAN'), 'next prompt must target persistent install readiness')
assert(next.nonSelectedNextSteps.length === 3, 'expected three non-selected next steps')

assert(policy.allowedClaims.diskCleanupTargetMet === true, 'disk cleanup claim must be allowed')
assert(policy.allowedClaims.nextSafeGateIsPersistentRuntimeInstallReadinessPlan === true, 'next gate claim mismatch')
for (const value of Object.values(policy.runtimeFlags)) assert(value === false, 'runtime flags must be false')
for (const claim of ['external beta ready', 'paid production ready', 'runtime readiness', 'product tool-call execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update required must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(sourceRefresh.decision === 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_2_completed_with_warnings_ready_for_local_validation_disk_cleanup_2', 'source refresh decision mismatch')
assert(sourceRemaining.remainingBlockers[0].id === 'local_validation_disk_hydration_below_25_gib', 'source disk blocker must be first')
assert(sourceToolCall.reconciliationResult.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceToolCall.reconciliationResult.productToolCallExecutionReadyCount === 0, 'source product-callable count must remain zero')
assert(gate2a.toolCandidateCount === 15, 'Gate 2A tool count mismatch')
assert(gate2a.probePassedCount === 15, 'Gate 2A probe count mismatch')
assert(gate2a.probeFailedCount === 0, 'Gate 2A failed probe count must be zero')

const changedText = [
  files.result,
  files.inventory,
  files.validation,
  files.next,
  files.policy,
  files.prompt
].map(read).join('\n')

for (const forbidden of [
  'externalBetaReadyCount": 1',
  'productionReadyCount": 1',
  'persistentRuntimeInstallReadyCount": 15',
  'productToolCallExecutionReadyCount": 15',
  'packageInstallAttempted": true',
  'toolCallAttempted": true',
  'workerExecutionAttempted": true',
  'routeExecutionAttempted": true',
  'sqlExecutionAttempted": true',
  'supabaseMutationAttempted": true',
  'dockerBuildAttempted": true',
  'dockerRunOrPushAttempted": true'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'reeditpro_local_validation_disk_cleanup_2_sound_cpu_beta_readiness_diagnostics_passed',
  decision,
  diskCleanupTargetMet: result.cleanupResult.targetMet,
  acceptedSoundCpuToolCount: result.currentSoundCpuReadinessCounts.acceptedSoundCpuToolCount,
  persistentRuntimeInstallReadyCount: result.currentSoundCpuReadinessCounts.persistentRuntimeInstallReadyCount,
  productToolCallExecutionReadyCount: result.currentSoundCpuReadinessCounts.productToolCallExecutionReadyCount,
  nextPrompt: result.nextPrompt
}, null, 2))
