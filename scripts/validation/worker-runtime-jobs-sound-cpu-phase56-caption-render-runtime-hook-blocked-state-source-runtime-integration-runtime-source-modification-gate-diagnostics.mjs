import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase56_caption_render_runtime_hook_blocked_state_source_runtime_integration_runtime_source_modification_gate_completed_with_warnings_ready_for_runtime_source_modification_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase55_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_owner_review_passed_with_warnings_ready_for_runtime_source_modification_gate_no_media_no_artifacts'
const sourceHead = 'dafd075aab1b553c6b61d071488741963fb90901'
const sourceMergeCommit = '7f10466e95bb2af771c414aca673efa8fe59ff71'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE56-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-RUNTIME-SOURCE-MODIFICATION-GATE-OWNER-REVIEW'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-diff-register.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-diff-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-fail-closed-verification.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-fail-closed-verification',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  try {
    return JSON.parse(match[1])
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-result',
)
const diffRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-diff-register',
)
const failClosed = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-fail-closed-verification',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review',
)

assert(result.decision === expectedDecision, 'Phase 56 decision mismatch')
assert(result.sourceVerification.sourcePr === 1839, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(result.runtimeSourceModificationResult.modifiedExistingRuntimeIntegrationSource, 'Runtime source modification missing')
assertFalse(result.runtimeSourceModificationResult.createdNewRuntimeSource, 'createdNewRuntimeSource')
assertFalse(result.runtimeSourceModificationResult.modifiedIndexExports, 'modifiedIndexExports')
assertFalse(result.runtimeSourceModificationResult.modifiedDispatchWiring, 'modifiedDispatchWiring')
assert(result.runtimeSourceModificationResult.modificationStatusAdded === 'phase56_runtime_source_modified_execution_blocked', 'Modification status mismatch')
assertTrue(result.runtimeSourceModificationResult.nextOwnerReviewAdded, 'Next owner review missing')
assertTrue(result.runtimeSourceModificationResult.runtimeDisabledFlagsPreserved, 'Runtime disabled flags not preserved')
assertTrue(result.runtimeSourceModificationResult.blockedByOwnerGatePreserved, 'Blocked owner gate not preserved')
assertTrue(result.runtimeSourceModificationResult.noArtifactCreatedPreserved, 'No artifact preservation missing')
for (const key of [
  'runtimeExecutionApprovedToday',
  'hookExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'renderExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactCreationApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(result.runtimeSourceModificationResult[key], `result.runtimeSourceModificationResult.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(diffRegister.modifiedFiles.length === 1, 'Expected one modified runtime file')
assert(diffRegister.modifiedFiles[0].path === runtimeIntegrationPath, 'Modified file path mismatch')
assert(diffRegister.modifiedFiles[0].changeType === 'fail_closed_metadata_only', 'Change type mismatch')
assertFalse(diffRegister.modifiedFiles[0].executionEnabled, 'Modified file execution must remain disabled')
assert(diffRegister.unchangedRuntimePaths.includes(blockedSourcePath), 'Blocked source must remain unchanged')
assert(diffRegister.unchangedRuntimePaths.includes(indexPath), 'Index must remain unchanged')
for (const value of Object.values(diffRegister.forbiddenChangesAbsent)) {
  assertTrue(value, 'Forbidden change must be absent')
}

assert(failClosed.requiredSourceSignals.blockedStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(
  failClosed.requiredSourceSignals.runtimeIntegrationSourceModificationStatus ===
    'phase56_runtime_source_modified_execution_blocked',
  'Fail-closed modification status mismatch',
)
assertTrue(failClosed.requiredSourceSignals.runtimeSourceModifiedWithFailClosedGuards, 'Fail-closed guard flag missing')
assert(failClosed.requiredSourceSignals.ownerReviewRequired === nextPrompt, 'Owner review required mismatch')
assertTrue(failClosed.requiredSourceSignals.throwingExecutionGuardPresent, 'Throwing execution guard missing')
for (const value of Object.values(failClosed.mustRemainFalse)) {
  assertFalse(value, 'Fail-closed false value must remain false')
}
assertTrue(failClosed.mustRemainTrue.noArtifactCreated, 'No artifact created must remain true')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase56_runtime_source_modification_gate_pending'),
  'Phase 56 source modification blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase56_runtime_source_modification_owner_review_pending'),
  'Phase 56 owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_over_media_pending'),
  'Runtime execution blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase56RuntimeSourceModificationCompleted, 'Phase 56 completion claim missing')
assertTrue(claimPolicy.allowedClaims.modifiedExistingRuntimeIntegrationSource, 'Modified source claim missing')
assertTrue(claimPolicy.allowedClaims.failClosedMetadataAdded, 'Fail-closed metadata claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeSourceModificationOwnerReviewMayProceed, 'Owner review may proceed missing')
assertFalse(claimPolicy.allowedClaims.runtimeSourceCreatedToday, 'Runtime source created claim must be false')
assertFalse(claimPolicy.allowedClaims.indexWiringChangedToday, 'Index wiring claim must be false')
assertFalse(claimPolicy.allowedClaims.dispatchWiringChangedToday, 'Dispatch wiring claim must be false')
for (const value of Object.values(claimPolicy.forbiddenClaims)) {
  assertFalse(value, 'Forbidden readiness claim must remain false')
}
for (const value of Object.values(claimPolicy.executionClaims)) {
  assertFalse(value, 'Execution claim must remain false')
}

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assertTrue(ownerPrompt.allowedScope.reviewPhase56RuntimeSourceModification, 'Owner prompt review scope missing')
assertTrue(ownerPrompt.allowedScope.acceptControlledImportValidationPlanning, 'Owner prompt import validation scope missing')
for (const key of [
  'modifyRuntimeSourceToday',
  'wireIndexToday',
  'wireDispatchToday',
  'executeHookToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(ownerPrompt.allowedScope[key], `ownerPrompt.allowedScope.${key}`)
}
assertNoop(ownerPrompt.supabaseClassification, 'ownerPrompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-diagnostics.mjs',
  'Package script missing',
)

const runtimeSource = readText(runtimeIntegrationPath)
const blockedSource = readText(blockedSourcePath)
const indexSource = readText(indexPath)
assert(runtimeSource.includes('SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_MODIFICATION_STATUS'), 'Modification status constant missing')
assert(runtimeSource.includes('phase56_runtime_source_modified_execution_blocked'), 'Modification status string missing')
assert(runtimeSource.includes('SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NEXT_OWNER_REVIEW'), 'Next owner review constant missing')
assert(runtimeSource.includes('runtimeIntegrationSourceModificationStatus'), 'Result modification field missing')
assert(runtimeSource.includes('runtimeSourceModifiedWithFailClosedGuards: true'), 'Fail-closed guard field missing')
assert(runtimeSource.includes('runtimeSourceModificationOwnerReviewRequired'), 'Owner review result field missing')
for (const needle of [
  'blocked_by_owner_gate',
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'routeToolProviderApproved: false',
  'realUserMediaBetaApproved: false',
  'paidProductionApproved: false',
  'noArtifactCreated: true',
  'throw new Error',
]) {
  assert(runtimeSource.includes(needle), `Runtime source missing fail-closed signal: ${needle}`)
}
assert(
  blockedSource.includes('blocked_by_owner_gate') &&
    blockedSource.includes('runtimeExecutionApproved: false') &&
    blockedSource.includes('artifactCreationApproved: false'),
  'Blocked-state source must remain fail-closed',
)
assert(
  indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult') &&
    !indexSource.includes('dispatchSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegration'),
  'Index must not gain dispatch wiring',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1839,
      sourceHead,
      sourceMergeCommit,
      modifiedExistingRuntimeIntegrationSource: true,
      modifiedIndexExports: false,
      modifiedDispatchWiring: false,
      runtimeExecutionApprovedToday: false,
      realMediaAllowed: false,
      artifactCreationAllowed: false,
      workerDispatchAllowed: false,
      supabaseSqlAllowed: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
