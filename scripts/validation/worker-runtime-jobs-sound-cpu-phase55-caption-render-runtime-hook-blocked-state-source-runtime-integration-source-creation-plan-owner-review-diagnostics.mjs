import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase55_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_owner_review_passed_with_warnings_ready_for_runtime_source_modification_gate_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase55_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_completed_with_warnings_ready_for_source_creation_plan_owner_review_no_media_no_artifacts'
const sourceHead = '53e15598fb7819a32b4527d4714d7158145e091f'
const sourceMergeCommit = '1bfa6ea2b32636d030a2075b93b14aaf6e2824cf'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE56-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-RUNTIME-SOURCE-MODIFICATION-GATE'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-register.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate.md',
    'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate',
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
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-claim-policy',
)
const phase56Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate-register',
)
const phase56Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1835, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedSourceCreationPlan.phase55SourceCreationPlanAccepted, 'Phase 55 plan acceptance missing')
assert(review.reviewedSourceCreationPlan.plannedSourceChangeCountAccepted === 6, 'Planned source count mismatch')
assertTrue(review.reviewedSourceCreationPlan.existingBlockedStateSourceStillFailClosed, 'Blocked source fail-closed evidence missing')
assertTrue(review.reviewedSourceCreationPlan.existingRuntimeIntegrationSourceStillFailClosed, 'Runtime source fail-closed evidence missing')
assertTrue(review.reviewedSourceCreationPlan.runtimeSourceModificationGateMayProceed, 'Runtime source modification gate claim missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
  'runtimeSourceModifiedToday',
  'indexWiringChangedToday',
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
  assertFalse(review.reviewedSourceCreationPlan[key], `review.reviewedSourceCreationPlan.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase55Pr === 1835, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase55Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase55MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase55Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.plannedSourceChangeCount === 6, 'Acceptance planned count mismatch')
assert(acceptance.acceptedEvidence.existingBlockedStateSource === blockedSourcePath, 'Acceptance blocked path mismatch')
assert(acceptance.acceptedEvidence.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Acceptance runtime path mismatch')
assert(acceptance.acceptedEvidence.existingIndexTarget === indexPath, 'Acceptance index path mismatch')
assertTrue(acceptance.acceptedEvidence.existingBlockedStateSourceInspected, 'Blocked source inspection missing')
assertTrue(acceptance.acceptedEvidence.existingRuntimeIntegrationSourceInspected, 'Runtime source inspection missing')
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assertTrue(acceptance.acceptedScope.runtimeSourceModificationGatePlanning, 'Runtime source modification planning missing')
assertTrue(acceptance.acceptedScope.futureFailClosedRuntimeSourceModification, 'Future fail-closed source modification missing')
for (const key of [
  'sourceCreationToday',
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

assert(safety.reviewSafety.allowedNextStep === 'runtime source modification gate', 'Allowed next step mismatch')
assert(safety.reviewSafety.plannedSourceChangeCountMustRemain === 6, 'Safety planned count mismatch')
assertTrue(safety.reviewSafety.blockedStateSourceMustRemainFailClosed, 'Blocked-state safety missing')
assertTrue(safety.reviewSafety.runtimeIntegrationSourceMustRemainFailClosed, 'Runtime safety missing')
for (const key of [
  'sourceCodeChangesAllowedToday',
  'runtimeSourceCreationAllowedToday',
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
    (row) => row.blockerId === 'phase55_runtime_integration_source_creation_plan_owner_review_pending',
  ),
  'Phase 55 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase56_runtime_source_modification_gate_pending'),
  'Phase 56 runtime source modification blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_over_media_pending'),
  'Runtime execution blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase55OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeSourceModificationGateMayProceed, 'Runtime source modification gate claim missing')
assertTrue(claimPolicy.allowedClaims.sourceCreationPlanAccepted, 'Source creation plan acceptance claim missing')
assert(claimPolicy.allowedClaims.plannedSourceChangeCountAccepted === 6, 'Claim planned count mismatch')
assertTrue(claimPolicy.allowedClaims.blockedStateSourceRemainsFailClosed, 'Blocked state fail-closed claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeIntegrationSourceRemainsFailClosed, 'Runtime fail-closed claim missing')
assertFalse(claimPolicy.allowedClaims.runtimeSourceCreatedToday, 'Claim runtime source created must be false')
assertFalse(claimPolicy.allowedClaims.runtimeSourceModifiedToday, 'Claim runtime source modified must be false')
assertFalse(claimPolicy.allowedClaims.indexWiringChangedToday, 'Claim index wiring changed must be false')
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

assert(phase56Register.sourceDecision === expectedDecision, 'Phase 56 register source mismatch')
assertTrue(phase56Register.phase56MayProceed, 'Phase 56 may proceed missing')
assertTrue(
  phase56Register.phase56AllowedScope.modifyExistingRuntimeIntegrationSourceFailClosed,
  'Phase 56 fail-closed modification scope missing',
)
assertTrue(phase56Register.phase56AllowedScope.preserveRuntimeDisabledFlags, 'Runtime disabled flag preservation missing')
assertTrue(phase56Register.phase56AllowedScope.preserveBlockedByOwnerGateStatus, 'Blocked status preservation missing')
assertTrue(phase56Register.phase56AllowedScope.preserveNoArtifactCreated, 'No artifact preservation missing')
for (const key of [
  'createNewRuntimeSource',
  'wireIndexOrDispatch',
  'executeHook',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase56Register.phase56AllowedScope[key], `phase56Register.phase56AllowedScope.${key}`)
}
assertTrue(phase56Register.phase56StillBlocked.runtimeIntegrationExecution, 'Runtime execution blocker missing')
assertTrue(phase56Register.phase56StillBlocked.realUserMediaBeta, 'Real user beta blocker missing')
assert(phase56Register.nextPrompt === nextPrompt, 'Phase 56 next prompt mismatch')

assert(phase56Prompt.requiredSourceDecision === expectedDecision, 'Phase 56 prompt source decision mismatch')
assert(phase56Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 56 prompt source head mismatch')
assert(phase56Prompt.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Phase 56 runtime path mismatch')
assert(phase56Prompt.existingBlockedStateSourcePath === blockedSourcePath, 'Phase 56 blocked path mismatch')
assert(phase56Prompt.existingIntegrationTarget === indexPath, 'Phase 56 index path mismatch')
assertTrue(
  phase56Prompt.allowedScope.modifyExistingRuntimeIntegrationSourceFailClosed,
  'Phase 56 modify existing source scope missing',
)
for (const key of [
  'createNewRuntimeSourceToday',
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
  assertFalse(phase56Prompt.allowedScope[key], `phase56Prompt.allowedScope.${key}`)
}
assert(
  phase56Prompt.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase56_caption_render_runtime_hook_blocked_state_source_runtime_integration_runtime_source_modification_gate_completed_with_warnings_ready_for_runtime_source_modification_owner_review_no_media_no_artifacts',
  'Phase 56 expected decision mismatch',
)
assertNoop(phase56Prompt.supabaseClassification, 'phase56Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review-diagnostics.mjs',
  'Package script missing',
)

const blockedSource = readText(blockedSourcePath)
const runtimeSource = readText(runtimeIntegrationPath)
const indexSource = readText(indexPath)
assert(
  blockedSource.includes('blocked_by_owner_gate') &&
    blockedSource.includes('runtimeExecutionApproved: false') &&
    blockedSource.includes('mediaProcessingApproved: false') &&
    blockedSource.includes('artifactCreationApproved: false'),
  'Blocked-state source must remain fail-closed',
)
assert(
  runtimeSource.includes('runtime_integration_source_created_execution_blocked') &&
    runtimeSource.includes('blocked_by_owner_gate') &&
    runtimeSource.includes('runtimeExecutionApproved: false') &&
    runtimeSource.includes('workerExecutionApproved: false') &&
    runtimeSource.includes('renderExecutionApproved: false') &&
    runtimeSource.includes('mediaProcessingApproved: false') &&
    runtimeSource.includes('artifactCreationApproved: false') &&
    runtimeSource.includes('supabaseSqlApproved: false') &&
    runtimeSource.includes('realUserMediaBetaApproved: false') &&
    runtimeSource.includes('paidProductionApproved: false') &&
    runtimeSource.includes('noArtifactCreated: true') &&
    runtimeSource.includes('throw new Error'),
  'Runtime integration source must remain fail-closed',
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
      sourcePr: 1835,
      sourceHead,
      sourceMergeCommit,
      plannedSourceChangeCountAccepted: 6,
      runtimeSourceModificationGateMayProceed: true,
      runtimeSourceCreatedToday: false,
      runtimeSourceModifiedToday: false,
      indexWiringChangedToday: false,
      runtimeIntegrationApprovedToday: false,
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
