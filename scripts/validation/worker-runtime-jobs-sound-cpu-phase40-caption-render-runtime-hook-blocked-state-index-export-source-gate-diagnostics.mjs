import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase39_caption_render_runtime_hook_blocked_state_index_export_wiring_plan_completed_with_warnings_ready_for_index_export_source_gate_no_media_no_artifacts'
const sourceMergeCommit = 'b223fce0e319ebdb8bcf8022dccc9c661f31129d'
const sourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE41-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-STATIC-IMPORT-PROOF'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate:diagnostics'

const exportedSymbols = [
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
    'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate.md',
    'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-register.md',
    'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-register.md',
    'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof.md',
    'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof',
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
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-result',
)
const sourceRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-claim-policy',
)
const phase41Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-register',
)
const phase41Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof',
)

assert(result.decision === expectedDecision, 'Phase 40 decision mismatch')
assert(result.sourceVerification.sourcePr === 1743, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.sourceChange.targetIndexPath === indexPath, 'Index path mismatch')
assert(result.sourceChange.runtimeIntegrationSourcePath === sourcePath, 'Source path mismatch')
assert(result.sourceChange.indexExportBlockAdded === true, 'Index export block missing')
assert(result.sourceChange.exportFailClosedSymbolsOnly === true, 'Fail-closed export scope missing')
assert(result.sourceChange.exportedSymbolCount === exportedSymbols.length, 'Exported symbol count mismatch')
for (const key of [
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
  assertFalse(result.sourceChange[key], `result.sourceChange.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(result.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(result.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(sourceRegister.changedSource.path === indexPath, 'Changed source path mismatch')
assert(sourceRegister.changedSource.changeType === 'fail_closed_index_export_block_added', 'Change type mismatch')
assert(sourceRegister.changedSource.preservedExistingExports === true, 'Existing export preservation missing')
assertFalse(sourceRegister.changedSource.sourceRuntimeImplementationChanged, 'sourceRegister.changedSource.sourceRuntimeImplementationChanged')
assertFalse(sourceRegister.changedSource.dispatchWiringChanged, 'sourceRegister.changedSource.dispatchWiringChanged')
assert(sourceRegister.exportedSymbolCount === exportedSymbols.length, 'Source register exported count mismatch')
for (const exportedSymbol of exportedSymbols) {
  assert(sourceRegister.exportedSymbols.includes(exportedSymbol), `Missing exported symbol ${exportedSymbol}`)
}

assert(safety.sourceSafety.indexExportBlockAdded === true, 'Safety index export missing')
assert(safety.sourceSafety.exportFailClosedSymbolsOnly === true, 'Safety fail-closed scope missing')
for (const key of [
  'runtimeSourceChangedToday',
  'dispatchWiringChangedToday',
  'hookExecutedToday',
  'mediaProcessedToday',
  'artifactCreatedToday',
  'supabaseSqlExecutedToday',
  'readinessUnlockedToday',
]) {
  assertFalse(safety.sourceSafety[key], `safety.sourceSafety.${key}`)
}
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
  assertFalse(safety.exportedRuntimeSafety[key], `safety.exportedRuntimeSafety.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'index_export_wiring_source_change_pending'),
  'Index source-change blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'static_import_proof_pending'),
  'Static import proof blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_user_media_beta_and_paid_production_pending'),
  'Product readiness blocker missing',
)

assert(claimPolicy.allowedClaims.phase40IndexExportSourceGateCompleted === true, 'Phase 40 claim missing')
assert(claimPolicy.allowedClaims.failClosedIndexExportsAdded === true, 'Fail-closed export claim missing')
assert(claimPolicy.allowedClaims.staticImportProofMayProceed === true, 'Static import proof claim missing')
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

assert(phase41Register.sourceDecision === expectedDecision, 'Phase 41 register source mismatch')
assert(phase41Register.phase41MayProceed === true, 'Phase 41 may proceed missing')
assert(phase41Register.importTarget === indexPath, 'Phase 41 import target mismatch')
assert(phase41Register.nextPrompt === nextPrompt, 'Phase 41 next prompt mismatch')
assert(phase41Register.proofScope.staticImportOnly === true, 'Phase 41 static import scope missing')
assert(phase41Register.proofScope.importFailClosedSymbolsOnly === true, 'Phase 41 fail-closed import scope missing')
for (const key of [
  'invokeBlockedResultFactory',
  'invokeBlockedAssertion',
  'dispatchWiring',
  'hookExecution',
  'realMedia',
  'artifactCreation',
  'supabaseSql',
  'betaUnlock',
  'productionUnlock',
]) {
  assertFalse(phase41Register.proofScope[key], `phase41Register.proofScope.${key}`)
}

assert(phase41Prompt.requiredSourceDecision === expectedDecision, 'Phase 41 prompt source mismatch')
assert(phase41Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 41 prompt source head mismatch')
assert(phase41Prompt.owner === 'WORKER_RUNTIME_JOBS', 'Phase 41 owner mismatch')
assert(phase41Prompt.proofScope.staticImportOnly === true, 'Phase 41 prompt static import scope missing')
assert(phase41Prompt.proofScope.importTarget === indexPath, 'Phase 41 prompt import target mismatch')
for (const key of [
  'invokeBlockedResultFactory',
  'invokeBlockedAssertion',
  'dispatchWiringToday',
  'hookExecutionToday',
  'realMediaToday',
  'artifactCreationToday',
  'supabaseSqlToday',
  'betaUnlockToday',
  'productionUnlockToday',
]) {
  assertFalse(phase41Prompt.proofScope[key], `phase41Prompt.proofScope.${key}`)
}
assert(
  phase41Prompt.expectedNextDecision ===
    'worker_runtime_jobs_sound_cpu_phase41_caption_render_runtime_hook_blocked_state_static_import_proof_passed_with_warnings_ready_for_static_import_proof_owner_review_no_media_no_artifacts',
  'Phase 41 prompt next decision mismatch',
)

const sourceText = readText(sourcePath)
for (const exportedSymbol of exportedSymbols) {
  assert(sourceText.includes(exportedSymbol), `Runtime source missing exported symbol ${exportedSymbol}`)
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
assert(indexText.includes("from './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'"), 'Index missing runtime integration export source')
for (const exportedSymbol of exportedSymbols) {
  assert(indexText.includes(exportedSymbol), `Index missing exported symbol ${exportedSymbol}`)
}
for (const forbidden of [
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult(',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked()',
  'resolveSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegration',
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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-diagnostics.mjs',
  'Package script command mismatch',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1743,
      sourceMergeCommit,
      exportedSymbolCount: exportedSymbols.length,
      indexExportBlockAdded: true,
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
