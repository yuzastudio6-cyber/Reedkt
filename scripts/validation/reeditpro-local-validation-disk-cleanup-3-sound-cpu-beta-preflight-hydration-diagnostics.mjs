import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  result: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-hydration.md',
  cleanup: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-cleanup-register.md',
  validation: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-validation-register.md',
  readiness: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-readiness-register.md',
  duplicate: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-duplicate-register.md',
  next: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-next-step-register.md',
  policy: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof.md',
  sourceBlocker: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof.md',
  sourceReconciliation: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof.md'
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

const result = parseBlock(files.result, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-hydration')
const cleanup = parseBlock(files.cleanup, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-cleanup-register')
const validation = parseBlock(files.validation, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-validation-register')
const readiness = parseBlock(files.readiness, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-readiness-register')
const duplicate = parseBlock(files.duplicate, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-duplicate-register')
const next = parseBlock(files.next, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-next-step-register')
const policy = parseBlock(files.policy, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-claim-policy')
const sourceBlocker = parseBlock(files.sourceBlocker, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof')
const sourceReconciliation = parseBlock(files.sourceReconciliation, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof')

const expectedDecision =
  'reeditpro_local_validation_disk_cleanup_3_sound_cpu_beta_preflight_hydration_passed_with_warnings_ready_for_runtime_execution_approval_gate_refresh_after_image_import_proof'

assert(result.decision === expectedDecision, 'unexpected decision')
assert(result.sourceMergeCommit === 'debe7ae675d516c245e3f5f2a2b379477b82f658', 'source merge commit mismatch')
assert(result.dependencyHydrationPassed === true, 'dependency hydration should pass')
assert(result.runtimeExecutionStarted === false, 'runtime execution widened')
assert(result.dockerBuildStarted === false && result.dockerRunStarted === false && result.dockerPushStarted === false, 'docker widened')
assert(result.externalBetaUnlocked === false && result.productionUnlocked === false, 'beta/production widened')

assert(cleanup.cleanupActions.length === 2, 'cleanup action count mismatch')
assert(cleanup.cleanupActions.every((row) => row.statusBeforeRemoval === 'clean' && row.mergedBeforeRemoval === true), 'cleanup must only remove clean merged worktrees')
assert(cleanup.unsafeTargetsTouched === false, 'unsafe cleanup target touched')
assert(cleanup.dirtyMainWorktreeTouched === false, 'dirty main worktree touched')
assert(cleanup.freeSpaceAfterCleanupGiBApprox >= 25, 'cleanup did not reach threshold')

assert(validation.packageJsonSha256 === '6742010d333b11ad0a7fea8c335bb2b88edde55b48bd7ee9e1dec35c17a41786', 'package json hash mismatch')
assert(validation.packageLockSha256 === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'package lock hash mismatch')
assert(validation.packageFilesUnchangedAfterHydration === true, 'package files changed')
assert(validation.nodeModulesUnstaged === true, 'node_modules staging widened')
assert(validation.buildOutputsRemovedAfterValidation === true, 'build outputs not removed')
for (const [command, status] of Object.entries(validation.commands)) {
  assert(status.startsWith('passed'), `${command} did not pass`)
}

assert(readiness.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(readiness.containerImportBlockerCleared === true, 'container import blocker not cleared')
assert(readiness.containerImportsPassed === 14 && readiness.containerImportsFailed === 0, 'container import counts mismatch')
assert(readiness.dependencyBackedStaticPreflightPassed === true, 'preflight should pass')
assert(readiness.internalDryRunAllowed === true, 'internal dry-run summary should be allowed')
for (const key of [
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'mediaProcessingReadyCount',
  'supabaseSqlReadyCount',
  'artifactDeliveryReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) {
  assert(readiness[key] === 0, `${key} must be zero`)
}

assert(duplicate.sameHeadOpenPrFound === false, 'same-head duplicate found')
assert(duplicate.samePurposeOpenPrFound === false, 'same-purpose duplicate found')
assert(duplicate.ownershipConflictFound === false, 'ownership conflict found')

assert(next.selectedNextPrompt.includes('RUNTIME-EXECUTION-APPROVAL-GATE-REFRESH-AFTER-IMAGE-IMPORT-PROOF'), 'next prompt mismatch')
assert(next.separatePromptRequired === true, 'next step must be separate prompt')
read(files.prompt)

assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')
for (const forbidden of policy.forbiddenClaims) {
  assert(!readiness[forbidden], `forbidden readiness key truthy: ${forbidden}`)
}

assert(
  sourceBlocker.decision ===
    'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_image_import_proof_blocked_dependency_hydration_disk_risk',
  'source blocker decision mismatch'
)
assert(
  sourceReconciliation.decision ===
    'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_after_image_import_proof_completed_with_warnings_ready_for_controlled_runtime_beta_preflight_refresh',
  'source reconciliation decision mismatch'
)

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['reeditpro:local-validation-disk-cleanup-3:sound-cpu-beta-preflight-hydration:diagnostics'] ===
    'node scripts/validation/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-hydration-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbiddenPattern of [
  '"externalBetaReadyCount": 15',
  '"productionReadyCount": 15',
  '"productToolCallExecutionReadyCount": 15',
  '"workerExecutionReadyCount": 15',
  '"routeExecutionReadyCount": 15',
  '"mediaProcessingReadyCount": 15',
  '"supabaseSqlReadyCount": 15',
  'external beta ready true',
  'production ready true',
  'SQL executed yes'
]) {
  assert(!changedText.includes(forbiddenPattern), `forbidden widened claim found: ${forbiddenPattern}`)
}

console.log(
  JSON.stringify(
    {
      status: 'reeditpro_local_validation_disk_cleanup_3_sound_cpu_beta_preflight_hydration_diagnostics_passed',
      decision: result.decision,
      sourceMergeCommit: result.sourceMergeCommit,
      dependencyHydrationPassed: result.dependencyHydrationPassed,
      dependencyBackedStaticPreflightPassed: readiness.dependencyBackedStaticPreflightPassed,
      externalBetaReadyCount: readiness.externalBetaReadyCount,
      productionReadyCount: readiness.productionReadyCount,
      nextPrompt: next.selectedNextPrompt
    },
    null,
    2
  )
)
