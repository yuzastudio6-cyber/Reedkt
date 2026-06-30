import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase56_caption_render_runtime_hook_blocked_state_source_runtime_integration_runtime_source_modification_owner_review_passed_with_warnings_ready_for_controlled_import_validation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase56_caption_render_runtime_hook_blocked_state_source_runtime_integration_runtime_source_modification_gate_completed_with_warnings_ready_for_runtime_source_modification_owner_review_no_media_no_artifacts'
const sourceHead = '8b988cc959ccda4208813761fba7ceb43d99cb99'
const sourceMergeCommit = '1ba15d0bc90477825293b7766600589b278e20aa'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE57-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-IMPORT-VALIDATION'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation.md',
    'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-owner-claim-policy',
)
const phase57Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation-register',
)
const phase57Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase57-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-import-validation',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1842, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedRuntimeSourceModification.phase56RuntimeSourceModificationAccepted, 'Phase 56 source modification acceptance missing')
assertTrue(review.reviewedRuntimeSourceModification.modifiedExistingRuntimeIntegrationSourceAccepted, 'Modified runtime source acceptance missing')
assertTrue(review.reviewedRuntimeSourceModification.failClosedMetadataAccepted, 'Fail-closed metadata acceptance missing')
assertTrue(review.reviewedRuntimeSourceModification.controlledImportValidationMayProceed, 'Controlled import validation may proceed missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceModifiedToday',
  'indexWiringChangedToday',
  'dispatchWiringChangedToday',
  'runtimeIntegrationApprovedToday',
  'hookExecutionApprovedToday',
  'realMediaApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(review.reviewedRuntimeSourceModification[key], `review.reviewedRuntimeSourceModification.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase56Pr === 1842, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase56Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase56MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase56Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.modifiedRuntimeIntegrationSource === runtimeIntegrationPath, 'Acceptance runtime path mismatch')
assert(acceptance.acceptedEvidence.modificationStatus === 'phase56_runtime_source_modified_execution_blocked', 'Acceptance modification status mismatch')
assertTrue(acceptance.acceptedEvidence.nextOwnerReviewConstantPresent, 'Next owner review constant missing')
assertTrue(acceptance.acceptedEvidence.runtimeDisabledFlagsPreserved, 'Runtime disabled flags missing')
assertTrue(acceptance.acceptedEvidence.blockedByOwnerGatePreserved, 'Blocked owner gate missing')
assertTrue(acceptance.acceptedEvidence.noArtifactCreatedPreserved, 'No artifact preservation missing')
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assertTrue(acceptance.acceptedScope.controlledImportValidationPlanning, 'Controlled import validation planning missing')
assertTrue(acceptance.acceptedScope.futureImportOnlyValidation, 'Future import-only validation missing')
for (const key of [
  'sourceModificationToday',
  'indexWiringToday',
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.reviewSafety.allowedNextStep === 'controlled import validation', 'Allowed next step mismatch')
assertTrue(safety.reviewSafety.sourceModificationMustRemainFailClosed, 'Source modification fail-closed safety missing')
assertTrue(safety.reviewSafety.controlledImportMayLoadModuleOnly, 'Import module-only safety missing')
for (const key of [
  'sourceCodeChangesAllowedToday',
  'runtimeSourceModificationAllowedToday',
  'indexWiringAllowedToday',
  'runtimeIntegrationAllowedToday',
  'hookExecutionAllowedToday',
  'realMediaInputAllowedToday',
  'captionRenderExecutionAllowedToday',
  'artifactWriteAllowedToday',
  'workerDispatchAllowedToday',
  'routeToolProviderAllowedToday',
  'supabaseSqlAllowedToday',
  'betaUnlockAllowedToday',
  'productionUnlockAllowedToday',
]) {
  assertFalse(safety.reviewSafety[key], `safety.reviewSafety.${key}`)
}
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
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase56_runtime_source_modification_owner_review_pending',
  ),
  'Phase 56 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase57_controlled_import_validation_pending'),
  'Phase 57 import validation blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'controlled_execution_pending'),
  'Controlled execution blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase56OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(claimPolicy.allowedClaims.controlledImportValidationMayProceed, 'Controlled import validation claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeSourceModificationAccepted, 'Runtime source modification acceptance claim missing')
assertTrue(claimPolicy.allowedClaims.failClosedMetadataAccepted, 'Fail-closed metadata claim missing')
assertFalse(claimPolicy.allowedClaims.sourceModifiedToday, 'Source modified today claim must be false')
assertFalse(claimPolicy.allowedClaims.indexWiringChangedToday, 'Index wiring claim must be false')
assertFalse(claimPolicy.allowedClaims.dispatchWiringChangedToday, 'Dispatch wiring claim must be false')
for (const value of Object.values(claimPolicy.forbiddenClaims)) {
  assertFalse(value, 'Forbidden readiness claim must remain false')
}
for (const value of Object.values(claimPolicy.executionClaims)) {
  assertFalse(value, 'Execution claim must remain false')
}

assert(phase57Register.sourceDecision === expectedDecision, 'Phase 57 register source mismatch')
assertTrue(phase57Register.phase57MayProceed, 'Phase 57 may proceed missing')
assertTrue(phase57Register.phase57AllowedScope.controlledImportValidation, 'Controlled import validation scope missing')
assertTrue(phase57Register.phase57AllowedScope.importRuntimeIntegrationModule, 'Import runtime module scope missing')
assertTrue(phase57Register.phase57AllowedScope.inspectFailClosedExports, 'Inspect fail-closed exports scope missing')
for (const key of [
  'invokeFactoryWithSyntheticIds',
  'executeHook',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase57Register.phase57AllowedScope[key], `phase57Register.phase57AllowedScope.${key}`)
}
assertTrue(phase57Register.phase57StillBlocked.runtimeIntegrationExecution, 'Runtime execution blocker missing')
assertTrue(phase57Register.phase57StillBlocked.realUserMediaBeta, 'Real user beta blocker missing')
assert(phase57Register.nextPrompt === nextPrompt, 'Phase 57 next prompt mismatch')

assert(phase57Prompt.requiredSourceDecision === expectedDecision, 'Phase 57 prompt source decision mismatch')
assert(phase57Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 57 prompt source head mismatch')
assert(phase57Prompt.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Phase 57 runtime path mismatch')
assertTrue(phase57Prompt.allowedScope.controlledImportValidation, 'Phase 57 controlled import scope missing')
assertTrue(phase57Prompt.allowedScope.inspectFailClosedExports, 'Phase 57 inspect exports scope missing')
for (const key of [
  'invokeFactoryWithSyntheticIdsToday',
  'executeHookToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase57Prompt.allowedScope[key], `phase57Prompt.allowedScope.${key}`)
}
assert(
  phase57Prompt.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase57_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_import_validation_passed_with_warnings_ready_for_controlled_factory_validation_no_media_no_artifacts',
  'Phase 57 expected decision mismatch',
)
assertNoop(phase57Prompt.supabaseClassification, 'phase57Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-owner-review-diagnostics.mjs',
  'Package script missing',
)

const runtimeSource = readText(runtimeIntegrationPath)
const indexSource = readText(indexPath)
for (const needle of [
  'phase56_runtime_source_modified_execution_blocked',
  'runtimeSourceModifiedWithFailClosedGuards: true',
  'runtimeSourceModificationOwnerReviewRequired',
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
  assert(runtimeSource.includes(needle), `Runtime source missing accepted signal: ${needle}`)
}
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
      sourcePr: 1842,
      sourceHead,
      sourceMergeCommit,
      controlledImportValidationMayProceed: true,
      sourceModifiedToday: false,
      indexWiringChangedToday: false,
      dispatchWiringChangedToday: false,
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
