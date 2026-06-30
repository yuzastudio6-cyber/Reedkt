import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase58_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_factory_validation_passed_with_warnings_ready_for_controlled_hook_execution_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase57_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_import_validation_passed_with_warnings_ready_for_controlled_factory_validation_no_media_no_artifacts'
const sourceHead = '5170097e34293fc38c34ea34ae4d158bab2b23e4'
const sourceMergeCommit = 'cab44662019b675623ebf1336912bcf3f42c753e'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE59-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-HOOK-EXECUTION-PLAN'
const phase59Decision =
  'worker_runtime_jobs_sound_cpu_phase59_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_plan_completed_with_warnings_ready_for_controlled_hook_execution_proof_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-result.md',
    'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-result-register.md',
    'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-result-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-report.md',
    'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-report',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan',
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
  'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-result',
)
const register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-result-register',
)
const report = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-report',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-claim-policy',
)
const phase59Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan-register',
)
const phase59Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan',
)

assert(result.owner === 'WORKER_RUNTIME_JOBS', 'result owner mismatch')
assert(result.decision === decision, 'result decision mismatch')
assert(result.sourceVerification.sourcePr === 1848, 'source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assertTrue(result.controlledFactoryValidation.factoryInvocationPassed, 'factory proof missing')
assert(result.controlledFactoryValidation.modulePath === runtimeIntegrationPath, 'module path mismatch')
assert(result.controlledFactoryValidation.factory === 'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult', 'factory mismatch')
assertTrue(result.controlledFactoryValidation.syntheticIdsOnly, 'synthetic IDs only missing')
assert(result.controlledFactoryValidation.blockedStatus === 'blocked_by_owner_gate', 'blocked status mismatch')
assert(result.controlledFactoryValidation.runtimeIntegrationSourceStatus === 'runtime_integration_source_created_execution_blocked', 'runtime status mismatch')
assert(result.controlledFactoryValidation.runtimeIntegrationSourceModificationStatus === 'phase56_runtime_source_modified_execution_blocked', 'modification status mismatch')
assert(result.controlledFactoryValidation.ownerGateRequired === 'WORKER_RUNTIME_JOBS', 'owner gate mismatch')
assertTrue(result.controlledFactoryValidation.runtimeSourceModifiedWithFailClosedGuards, 'fail-closed guard flag missing')
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
  assertFalse(result.controlledFactoryValidation[key], `result.controlledFactoryValidation.${key}`)
}
assertTrue(result.controlledFactoryValidation.noArtifactCreated, 'no artifact flag missing')
assert(result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(register.decision === decision, 'register decision mismatch')
assert(register.syntheticInput.approvedPlanSnapshotId === 'phase58-synthetic-approved-plan', 'synthetic approved plan mismatch')
assert(register.syntheticInput.runtimeIntegrationPlanId === 'phase58-synthetic-runtime-integration-plan', 'synthetic runtime plan mismatch')
assert(register.syntheticInput.blockedStateIntegrationPlanId === 'phase58-synthetic-blocked-state-plan', 'synthetic blocked-state plan mismatch')
assert(register.observedResult.blockedStatus === 'blocked_by_owner_gate', 'register blocked status mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_SUPABASE_MUTATION_ENABLED === '0', 'Supabase flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_ARTIFACT_WRITE_ENABLED === '0', 'artifact flag mismatch')
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
  assertFalse(register.observedResult[key], `register.observedResult.${key}`)
}
assertTrue(register.observedResult.noArtifactCreated, 'register no artifact missing')
assertTrue(register.observedResult.blockedStateNoArtifactCreated, 'register blocked state no artifact missing')
assertTrue(register.resultInspectionOnly, 'result inspection only missing')

assert(report.decision === decision, 'report decision mismatch')
assert(report.controlledFactoryCommand.result === 'passed', 'factory command did not pass')
assertTrue(report.controlledFactoryCommand.moduleImported, 'factory command module import missing')
assertTrue(report.controlledFactoryCommand.factoryInvokedWithSyntheticIds, 'factory synthetic invocation missing')
assertTrue(report.controlledFactoryCommand.failClosedResultInspectionPassed, 'fail-closed result inspection missing')
assertFalse(report.controlledFactoryCommand.temporaryProofFileCreated, 'temporary proof file created')
assertFalse(report.controlledFactoryCommand.temporaryProofFileStaged, 'temporary proof file staged')
assertAllFalse(report.validationBoundaries, 'report.validationBoundaries')
assertNoop(report.supabaseClassification, 'report')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase58_controlled_factory_validation_pending'),
  'Phase 58 factory blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase59_controlled_hook_execution_plan_pending'),
  'Phase 59 blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claims.allowedClaims.phase58ControlledFactoryValidationPassed, 'Phase 58 allowed claim missing')
assertTrue(claims.allowedClaims.runtimeIntegrationBlockedResultFactoryValidatedWithSyntheticIds, 'Factory validation allowed claim missing')
assertTrue(claims.allowedClaims.failClosedFactoryResultInspectable, 'Fail-closed result claim missing')
assertTrue(claims.allowedClaims.controlledHookExecutionPlanMayProceed, 'Hook plan may proceed claim missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase59Register.sourceDecision === decision, 'Phase 59 register source mismatch')
assertTrue(phase59Register.phase59MayProceed, 'Phase 59 may proceed missing')
assertTrue(phase59Register.phase59AllowedScope.planControlledHookExecution, 'Phase 59 hook planning scope missing')
assertTrue(phase59Register.phase59AllowedScope.defineSyntheticHookInputOnly, 'Phase 59 synthetic input scope missing')
assertTrue(phase59Register.phase59AllowedScope.reviewBlockedAssertionBoundary, 'Phase 59 blocked assertion boundary missing')
for (const key of [
  'executeHookToday',
  'invokeBlockedAssertionToday',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase59Register.phase59AllowedScope[key], `phase59Register.phase59AllowedScope.${key}`)
}
assertTrue(phase59Register.phase59StillBlocked.externalAgentExecution, 'External agent blocker missing')
assert(phase59Register.nextPrompt === nextPrompt, 'Phase 59 register next prompt mismatch')

assert(phase59Prompt.requiredSourceDecision === decision, 'Phase 59 prompt source mismatch')
assert(phase59Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 59 prompt source head mismatch')
assert(phase59Prompt.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Phase 59 prompt runtime path mismatch')
assertTrue(phase59Prompt.allowedScope.planControlledHookExecution, 'Phase 59 prompt hook planning scope missing')
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
  assertFalse(phase59Prompt.allowedScope[key], `phase59Prompt.allowedScope.${key}`)
}
assert(phase59Prompt.expectedDecision === phase59Decision, 'Phase 59 expected decision mismatch')
assertNoop(phase59Prompt.supabaseClassification, 'phase59Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-validation-diagnostics.mjs',
  'Package script missing',
)

const runtimeText = readText(runtimeIntegrationPath)
for (const snippet of [
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'phase56_runtime_source_modified_execution_blocked',
  'runtime_integration_source_created_execution_blocked',
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
      sourcePr: 1848,
      sourceHead,
      sourceMergeCommit,
      controlledFactoryValidationPassed: true,
      syntheticIdsOnly: true,
      blockedStatus: 'blocked_by_owner_gate',
      hookExecuted: false,
      blockedAssertionInvoked: false,
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
