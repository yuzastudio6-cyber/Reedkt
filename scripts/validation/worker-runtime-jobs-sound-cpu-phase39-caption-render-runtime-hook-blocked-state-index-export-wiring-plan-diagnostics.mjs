import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase39_caption_render_runtime_hook_blocked_state_index_export_wiring_plan_completed_with_warnings_ready_for_index_export_source_gate_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_source_owner_review_passed_with_warnings_ready_for_index_export_wiring_plan_no_media_no_artifacts'
const sourceMergeCommit = 'b42d66ab886ddf46bad0f8e7c96444df46b32e41'
const sourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE40-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-INDEX-EXPORT-SOURCE-GATE'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan:diagnostics'

const plannedExports = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult',
]

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-symbol-register.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-symbol-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-target-register.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-target-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-register.md',
    'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate.md',
    'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate',
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
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan-result',
)
const symbols = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-symbol-register',
)
const target = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-target-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-claim-policy',
)
const phase40Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-register',
)
const phase40Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate',
)

assert(result.decision === expectedDecision, 'Phase 39 decision mismatch')
assert(result.sourceVerification.sourcePr === 1741, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.plannedIndexExport.indexPath === indexPath, 'Index path mismatch')
assert(result.plannedIndexExport.runtimeIntegrationSourcePath === sourcePath, 'Source path mismatch')
assert(result.plannedIndexExport.indexExportPlanCreated === true, 'Index export plan missing')
assert(result.plannedIndexExport.exportFailClosedSymbolsOnly === true, 'Fail-closed export scope missing')
assert(result.plannedIndexExport.plannedExportSymbolCount === plannedExports.length, 'Planned export count mismatch')
for (const key of [
  'actualIndexSourceChangedToday',
  'dispatchWiredToday',
  'hookExecutedToday',
  'realMediaApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(result.plannedIndexExport[key], `result.plannedIndexExport.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(result.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(result.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(symbols.sourcePath === sourcePath, 'Symbol register source path mismatch')
assert(symbols.targetIndexPath === indexPath, 'Symbol register index path mismatch')
assert(Array.isArray(symbols.plannedExports), 'Planned exports must be an array')
assert(symbols.plannedExportCount === plannedExports.length, 'Symbol register export count mismatch')
for (const plannedExport of plannedExports) {
  assert(symbols.plannedExports.includes(plannedExport), `Missing planned export ${plannedExport}`)
}
assert(symbols.exportPolicy.constantsAllowed === true, 'Constants export policy missing')
assert(symbols.exportPolicy.blockedResultFactoryAllowed === true, 'Factory export policy missing')
assert(symbols.exportPolicy.blockedAssertionAllowed === true, 'Assertion export policy missing')
assert(symbols.exportPolicy.typesAllowed === true, 'Types export policy missing')
for (const key of [
  'runtimeExecutionEntrypointAllowed',
  'dispatchResolverAllowed',
  'mediaArtifactEntrypointAllowed',
]) {
  assertFalse(symbols.exportPolicy[key], `symbols.exportPolicy.${key}`)
}

assert(target.targetIndex.path === indexPath, 'Target index path mismatch')
assert(target.targetIndex.existingHookExportPresent === true, 'Existing hook export not represented')
assert(target.targetIndex.existingBlockedStateIntegrationExportPresent === true, 'Existing blocked-state export not represented')
assertFalse(target.targetIndex.runtimeIntegrationExportPresentToday, 'target.targetIndex.runtimeIntegrationExportPresentToday')
assert(target.targetIndex.futureRuntimeIntegrationExportMayProceed === true, 'Future export permission missing')
for (const key of [
  'appendFailClosedExportBlockOnly',
  'preserveExistingExports',
  'doNotWireSyntheticRouteDecision',
  'doNotWireWorkerDispatch',
  'doNotAddMediaOrArtifactEntrypoints',
  'doNotTouchSupabaseSql',
  'doNotClaimReadiness',
]) {
  assert(target.futureSourceChangeConstraints[key] === true, `target.futureSourceChangeConstraints.${key} missing`)
}

for (const key of [
  'actualIndexSourceChangedToday',
  'runtimeSourceChangedToday',
  'dispatchWiringChangedToday',
  'hookExecutedToday',
  'mediaProcessedToday',
  'artifactCreatedToday',
  'supabaseSqlExecutedToday',
  'readinessUnlockedToday',
]) {
  assertFalse(safety.planSafety[key], `safety.planSafety.${key}`)
}
assert(safety.futureExportSafety.exportFailClosedSymbolsOnly === true, 'Future fail-closed export safety missing')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'supabaseSqlApproved',
  'routeToolProviderApproved',
  'realUserMediaBetaApproved',
  'paidProductionApproved',
]) {
  assertFalse(safety.futureExportSafety[key], `safety.futureExportSafety.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'index_export_wiring_plan_pending'),
  'Index export planning blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'index_export_wiring_source_change_pending'),
  'Index export source-change blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_user_media_beta_and_paid_production_pending'),
  'Product readiness blocker missing',
)

assert(claimPolicy.allowedClaims.phase39IndexExportWiringPlanCompleted === true, 'Phase 39 claim missing')
assert(claimPolicy.allowedClaims.plannedFailClosedExportSymbols === true, 'Planned symbols claim missing')
assert(claimPolicy.allowedClaims.indexExportSourceGateMayProceed === true, 'Source gate claim missing')
assertFalse(claimPolicy.allowedClaims.indexSourceChangedToday, 'claimPolicy.allowedClaims.indexSourceChangedToday')
assertFalse(claimPolicy.allowedClaims.dispatchWiringChangedToday, 'claimPolicy.allowedClaims.dispatchWiringChangedToday')
assertFalse(claimPolicy.allowedClaims.hookExecutionApprovedToday, 'claimPolicy.allowedClaims.hookExecutionApprovedToday')
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'artifactReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(claimPolicy.forbiddenClaims[key], `claimPolicy.forbiddenClaims.${key}`)
}
for (const key of [
  'dockerBuild',
  'dockerRun',
  'dockerPush',
  'gcpCloudRun',
  'workerDispatch',
  'routeExecution',
  'toolExecution',
  'providerModelCall',
  'mediaProcessing',
  'artifactCreation',
  'supabaseSql',
]) {
  assertFalse(claimPolicy.executionClaims[key], `claimPolicy.executionClaims.${key}`)
}

assert(phase40Register.sourceDecision === expectedDecision, 'Phase 40 register source mismatch')
assert(phase40Register.phase40MayProceed === true, 'Phase 40 may proceed missing')
assert(phase40Register.targetIndexPath === indexPath, 'Phase 40 index path mismatch')
assert(phase40Register.runtimeIntegrationSourcePath === sourcePath, 'Phase 40 source path mismatch')
assert(phase40Register.nextPrompt === nextPrompt, 'Phase 40 next prompt mismatch')
assert(phase40Register.allowedFutureSourceChange.addIndexExportBlock === true, 'Phase 40 index export scope missing')
assert(phase40Register.allowedFutureSourceChange.exportFailClosedSymbolsOnly === true, 'Phase 40 fail-closed scope missing')
assert(phase40Register.allowedFutureSourceChange.preserveExistingExports === true, 'Phase 40 preserve exports missing')
for (const key of [
  'dispatchWiring',
  'hookExecution',
  'realMedia',
  'artifactCreation',
  'supabaseSql',
  'betaUnlock',
  'productionUnlock',
]) {
  assertFalse(phase40Register.allowedFutureSourceChange[key], `phase40Register.allowedFutureSourceChange.${key}`)
}

assert(phase40Prompt.requiredSourceDecision === expectedDecision, 'Phase 40 prompt source mismatch')
assert(phase40Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 40 prompt source head mismatch')
assert(phase40Prompt.owner === 'WORKER_RUNTIME_JOBS', 'Phase 40 owner mismatch')
assert(phase40Prompt.sourceChangeScope.targetIndexPath === indexPath, 'Phase 40 prompt index path mismatch')
assert(phase40Prompt.sourceChangeScope.runtimeIntegrationSourcePath === sourcePath, 'Phase 40 prompt source path mismatch')
assert(phase40Prompt.sourceChangeScope.addIndexExportBlock === true, 'Phase 40 prompt source scope missing')
assert(phase40Prompt.sourceChangeScope.exportFailClosedSymbolsOnly === true, 'Phase 40 prompt fail-closed scope missing')
assert(phase40Prompt.sourceChangeScope.preserveExistingExports === true, 'Phase 40 prompt preserve exports missing')
for (const key of [
  'dispatchWiringToday',
  'hookExecutionToday',
  'realMediaToday',
  'artifactCreationToday',
  'supabaseSqlToday',
  'betaUnlockToday',
  'productionUnlockToday',
]) {
  assertFalse(phase40Prompt.sourceChangeScope[key], `phase40Prompt.sourceChangeScope.${key}`)
}
assert(
  phase40Prompt.expectedNextDecision ===
    'worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts',
  'Phase 40 prompt next decision mismatch',
)

const sourceText = readText(sourcePath)
for (const plannedExport of plannedExports) {
  assert(sourceText.includes(plannedExport), `Source missing planned export ${plannedExport}`)
}
for (const expected of [
  "blockedStatus: 'blocked_by_owner_gate'",
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'realUserMediaBetaApproved: false',
  'paidProductionApproved: false',
]) {
  assert(sourceText.includes(expected), `Source missing fail-closed text ${expected}`)
}

const indexText = readText(indexPath)
for (const existing of [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS',
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS',
  'createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult',
]) {
  assert(indexText.includes(existing), `Index missing existing export ${existing}`)
}
for (const plannedExport of plannedExports) {
  assert(!indexText.includes(plannedExport), `Index must not export planned symbol yet: ${plannedExport}`)
}
for (const forbidden of [
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult(',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked()',
  'workerDispatch',
  'mediaProcessingApproved: true',
  'artifactCreationApproved: true',
  'realUserMediaBetaApproved: true',
  'paidProductionApproved: true',
]) {
  assert(!indexText.includes(forbidden), `Index contains forbidden text: ${forbidden}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript], 'Package script missing')
assert(
  packageJson.scripts[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan-diagnostics.mjs',
  'Package script command mismatch',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1741,
      sourceMergeCommit,
      plannedExportSymbolCount: plannedExports.length,
      indexSourceChangedToday: false,
      dispatchWiredToday: false,
      hookExecutedToday: false,
      mediaProcessingApproved: false,
      artifactCreationApproved: false,
      supabaseSqlApproved: false,
      realUserMediaBetaApproved: false,
      paidProductionApproved: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
