import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase57_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_import_validation_passed_with_warnings_ready_for_controlled_factory_validation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase56_caption_render_runtime_hook_blocked_state_source_runtime_integration_runtime_source_modification_owner_review_passed_with_warnings_ready_for_controlled_import_validation_no_media_no_artifacts'
const sourceHead = 'c31bbce56aa72460dbdf6bd75d0564bbe42a09c7'
const sourceMergeCommit = 'b7066e2237d0a22e8ae53b26256e345c4bd7ae78'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation:diagnostics'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE58-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-FACTORY-VALIDATION'
const phase58Decision =
  'worker_runtime_jobs_sound_cpu_phase58_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_factory_validation_passed_with_warnings_ready_for_controlled_hook_execution_plan_no_media_no_artifacts'

const expectedExports = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_MODIFICATION_STATUS',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NEXT_OWNER_REVIEW',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
]

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-result.md',
    'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-symbol-register.md',
    'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-symbol-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-report.md',
    'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-report',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation.md',
    'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record ?? {})) {
    assertFalse(value, `${label}.${key}`)
  }
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))

const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-result',
)
const symbols = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-symbol-register',
)
const report = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-report',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-claim-policy',
)
const phase58Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-register',
)
const phase58Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation',
)

assert(result.owner === 'WORKER_RUNTIME_JOBS', 'result owner mismatch')
assert(result.decision === decision, 'result decision mismatch')
assert(result.sourceVerification.sourcePr === 1846, 'source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(result.sourceVerification.phase56SourceModificationPr === 1842, 'Phase 56 source modification PR mismatch')
assert(result.sourceVerification.phase56SourceModificationMergeCommit === '1ba15d0bc90477825293b7766600589b278e20aa', 'Phase 56 source modification merge mismatch')
assertTrue(result.controlledImportValidation.runtimeIntegrationModuleImported, 'runtime integration import missing')
assert(result.controlledImportValidation.modulePath === runtimeIntegrationPath, 'runtime module path mismatch')
assertTrue(result.controlledImportValidation.expectedRuntimeExportsPresent, 'expected exports proof missing')
assert(result.controlledImportValidation.runtimeStatus === 'runtime_integration_source_created_execution_blocked', 'runtime status mismatch')
assert(result.controlledImportValidation.modificationStatus === 'phase56_runtime_source_modified_execution_blocked', 'modification status mismatch')
assert(result.controlledImportValidation.factoryType === 'function', 'factory type mismatch')
assert(result.controlledImportValidation.blockedAssertionType === 'function', 'blocked assertion type mismatch')
for (const key of [
  'factoryInvoked',
  'blockedAssertionInvoked',
  'hookExecuted',
  'mediaProcessed',
  'artifactCreated',
  'workerDispatched',
  'routeToolProviderCalled',
  'supabaseSql',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assertFalse(result.controlledImportValidation[key], `result.controlledImportValidation.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(symbols.decision === decision, 'symbols decision mismatch')
assert(symbols.modulePath === runtimeIntegrationPath, 'symbols runtime path mismatch')
const symbolNames = symbols.exportedSymbols.map((entry) => entry.symbol).sort()
assert(JSON.stringify(symbolNames) === JSON.stringify(expectedExports), 'exported symbols mismatch')
for (const entry of symbols.exportedSymbols) {
  assertTrue(entry.imported, `${entry.symbol} not imported`)
  assertFalse(entry.invoked, `${entry.symbol} invoked`)
}
assertAllFalse(symbols.proofBoundaries, 'symbols.proofBoundaries')
assertNoop(symbols.supabaseClassification, 'symbols')

assert(report.decision === decision, 'report decision mismatch')
assert(report.controlledImportCommand.result === 'passed', 'controlled import did not pass')
assertTrue(report.controlledImportCommand.moduleImported, 'controlled import module missing')
assertTrue(report.controlledImportCommand.exportInspectionPassed, 'controlled import export inspection missing')
assertTrue(report.controlledImportCommand.topLevelAwaitHarnessFailureCorrected, 'harness correction not recorded')
assertFalse(report.controlledImportCommand.temporaryProofFileCreated, 'temporary proof file created')
assertFalse(report.controlledImportCommand.temporaryProofFileStaged, 'temporary proof file staged')
for (const key of [
  'packageLockChanged',
  'nodeModulesStaged',
  'distStaged',
  'distServerStaged',
  'factoryInvoked',
  'blockedAssertionInvoked',
  'hookExecuted',
  'runtimeExecution',
  'workerExecution',
  'routeToolProviderExecution',
  'mediaProcessing',
  'artifactCreation',
  'dockerOrGcpExecution',
  'supabaseMutation',
  'sqlExecution',
  'betaUnlock',
  'productionUnlock',
]) {
  assertFalse(report.validationBoundaries[key], `report.validationBoundaries.${key}`)
}
assertNoop(report.supabaseClassification, 'report')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase57_controlled_import_validation_pending'),
  'Phase 57 import blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase58_controlled_factory_validation_pending'),
  'Phase 58 blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claims.allowedClaims.phase57ControlledImportValidationPassed, 'Phase 57 allowed claim missing')
assertTrue(claims.allowedClaims.runtimeIntegrationModuleImportable, 'Runtime module importable claim missing')
assertTrue(claims.allowedClaims.failClosedRuntimeExportsInspectable, 'Export inspection claim missing')
assertTrue(claims.allowedClaims.controlledFactoryValidationMayProceed, 'Factory validation may proceed claim missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase58Register.sourceDecision === decision, 'Phase 58 register source mismatch')
assertTrue(phase58Register.phase58MayProceed, 'Phase 58 may proceed missing')
assertTrue(phase58Register.phase58AllowedScope.controlledFactoryValidation, 'Factory validation scope missing')
assertTrue(phase58Register.phase58AllowedScope.invokeRuntimeIntegrationBlockedResultFactoryWithSyntheticIds, 'Synthetic factory scope missing')
assertTrue(phase58Register.phase58AllowedScope.inspectFailClosedResultOnly, 'Fail-closed result scope missing')
for (const key of [
  'executeHook',
  'invokeBlockedAssertion',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase58Register.phase58AllowedScope[key], `phase58Register.phase58AllowedScope.${key}`)
}
assertTrue(phase58Register.phase58StillBlocked.externalAgentExecution, 'External agent execution blocker missing')
assert(phase58Register.nextPrompt === nextPrompt, 'Phase 58 register next prompt mismatch')

assert(phase58Prompt.requiredSourceDecision === decision, 'Phase 58 prompt source mismatch')
assert(phase58Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 58 prompt source head mismatch')
assert(phase58Prompt.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Phase 58 prompt runtime path mismatch')
assertTrue(phase58Prompt.allowedScope.controlledFactoryValidation, 'Phase 58 prompt factory scope missing')
assertTrue(phase58Prompt.allowedScope.invokeRuntimeIntegrationBlockedResultFactoryWithSyntheticIds, 'Phase 58 prompt synthetic invocation scope missing')
assertTrue(phase58Prompt.allowedScope.inspectFailClosedResultOnly, 'Phase 58 prompt inspect scope missing')
for (const key of [
  'executeHookToday',
  'invokeBlockedAssertionToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase58Prompt.allowedScope[key], `phase58Prompt.allowedScope.${key}`)
}
assert(phase58Prompt.expectedDecision === phase58Decision, 'Phase 58 expected decision mismatch')
assertNoop(phase58Prompt.supabaseClassification, 'phase58Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-diagnostics.mjs',
  'Package script missing',
)

const runtimeText = readText(runtimeIntegrationPath)
for (const snippet of [
  'phase56_runtime_source_modified_execution_blocked',
  'runtime_integration_source_created_execution_blocked',
  'runtimeSourceModifiedWithFailClosedGuards: true',
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
]) {
  assert(runtimeText.includes(snippet), `Runtime source missing fail-closed snippet: ${snippet}`)
}
assert(!/audio_open|ffmpeg|ffprobe|pydub|writeArtifact|createSignedUrl|createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|service[_-]role/i.test(runtimeText), 'Runtime source contains prohibited runtime/media/Supabase marker')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1846,
      sourceHead,
      sourceMergeCommit,
      runtimeIntegrationModuleImported: true,
      expectedRuntimeExportsPresent: true,
      controlledFactoryValidationMayProceed: true,
      factoryInvoked: false,
      blockedAssertionInvoked: false,
      hookExecuted: false,
      mediaProcessed: false,
      artifactCreated: false,
      workerDispatched: false,
      supabaseSql: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
