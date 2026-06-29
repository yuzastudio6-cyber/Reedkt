import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37z_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_completed_with_warnings_ready_for_source_creation_plan_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37y_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_owner_review_passed_with_warnings_ready_for_source_creation_plan_no_media_no_artifacts'
const sourceMergeCommit = '7d94528657ef094fa8888b6a8e83e8dec178c474'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Z-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-CREATION-PLAN-OWNER-REVIEW'
const futureRuntimeSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const guardSourcePath = 'server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-checklist.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-checklist',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-path-register.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-path-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-content-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-content-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-result',
)
const checklist = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-checklist',
)
const paths = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-path-register',
)
const contentPlan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-content-plan',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy',
)
const ownerReviewPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review',
)

assert(result.decision === expectedDecision, 'Phase 37Z decision mismatch')
assert(result.sourceVerification.sourcePr === 1727, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.sourceCreationPlanResult.phase37YOwnerReviewAccepted === true, 'Phase 37Y owner review missing')
assert(result.sourceCreationPlanResult.sourceCreationPlanCreated === true, 'Source creation plan missing')
assert(result.sourceCreationPlanResult.sourceCreationPlanItemCount === 8, 'Source creation plan item count mismatch')
assert(result.sourceCreationPlanResult.existingBlockedSourceInspected === true, 'Blocked source inspection missing')
assert(result.sourceCreationPlanResult.existingStaticExportInspected === true, 'Static export inspection missing')
assert(result.sourceCreationPlanResult.futureRuntimeIntegrationSourcePathPlanned === true, 'Future source path planning missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
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
  assertFalse(result.sourceCreationPlanResult[key], `result.sourceCreationPlanResult.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(result.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(result.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(checklist.sourceCreationPlanItemCount === 8, 'Checklist item count mismatch')
assert(checklist.sourceCreationPlanItems.length === 8, 'Checklist item length mismatch')
assertFalse(checklist.allSourceChangesApprovedToday, 'checklist.allSourceChangesApprovedToday')
for (const item of checklist.sourceCreationPlanItems) {
  assert(item.planned === true, `${item.id} must be planned`)
  assertFalse(item.sourceChangeApprovedToday, `checklist.${item.id}.sourceChangeApprovedToday`)
}

assert(paths.sourcePaths.futureRuntimeIntegrationSourceCandidate === futureRuntimeSourcePath, 'Future source path mismatch')
assert(paths.sourcePaths.existingBlockedStateIntegrationSource === blockedSourcePath, 'Blocked source path mismatch')
assert(paths.sourcePaths.existingHookSource === hookSourcePath, 'Hook source path mismatch')
assert(paths.sourcePaths.existingRuntimeGuardSource === guardSourcePath, 'Guard source path mismatch')
assert(paths.sourcePaths.existingStaticExportTarget === indexPath, 'Index path mismatch')
assert(paths.pathStatusToday.existingBlockedStateIntegrationSourceExists === true, 'Existing blocked source status missing')
assert(paths.pathStatusToday.existingHookSourceExists === true, 'Existing hook source status missing')
assert(paths.pathStatusToday.existingRuntimeGuardSourceExists === true, 'Existing guard source status missing')
assert(paths.pathStatusToday.existingStaticExportPresent === true, 'Existing static export status missing')
for (const key of [
  'futureRuntimeIntegrationSourceExistsToday',
  'futureRuntimeIntegrationSourceCreationApprovedToday',
  'indexWiringChangeApprovedToday',
  'dispatchWiringChangeApprovedToday',
]) {
  assertFalse(paths.pathStatusToday[key], `paths.pathStatusToday.${key}`)
}
assert(paths.sourceCreationPathPolicy.allowedToInspectExistingSource === true, 'Inspect source policy missing')
for (const key of [
  'allowedToCreateOrModifySourceToday',
  'allowedToWireIndexToday',
  'allowedToWireDispatchToday',
  'allowedToExecuteSourceToday',
]) {
  assertFalse(paths.sourceCreationPathPolicy[key], `paths.sourceCreationPathPolicy.${key}`)
}

assert(contentPlan.futureSourceContract.exportName === 'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedState', 'Export plan mismatch')
assert(contentPlan.futureSourceContract.resultStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
for (const key of [
  'runtimeExecutionApprovedDefault',
  'workerExecutionApprovedDefault',
  'mediaProcessingApprovedDefault',
  'artifactCreationApprovedDefault',
  'supabaseSqlApprovedDefault',
  'routeToolProviderApprovedDefault',
  'realUserMediaBetaApprovedDefault',
  'paidProductionApprovedDefault',
]) {
  assertFalse(contentPlan.futureSourceContract[key], `contentPlan.futureSourceContract.${key}`)
}
for (const key of [
  'blockedStateResultShape',
  'staticOnlyInputs',
  'deterministicNoMediaBehavior',
  'noFileOpen',
  'noArtifactWrite',
  'noRuntimeDispatch',
  'noRouteToolProviderCall',
  'noSupabaseSql',
  'noReadinessWidening',
]) {
  assert(contentPlan.futureSourceMustPreserve[key] === true, `contentPlan.futureSourceMustPreserve.${key} missing`)
}
for (const key of ['sourceCreated', 'sourceWired', 'sourceExecuted', 'runtimeReadinessClaimed', 'mediaReadinessClaimed', 'artifactReadinessClaimed']) {
  assertFalse(contentPlan.implementationToday[key], `contentPlan.implementationToday.${key}`)
}

assert(boundary.boundaryStateToday.docsDiagnosticsOnly === true, 'Docs diagnostics boundary missing')
assert(boundary.boundaryStateToday.sourceCreationPlanningOnly === true, 'Source creation planning boundary missing')
for (const key of [
  'runtimeSourceCreated',
  'indexWiringChanged',
  'dispatchWiringChanged',
  'workerDispatchEnabled',
  'routeExecutionEnabled',
  'toolExecutionEnabled',
  'providerModelCallEnabled',
  'realMediaInputEnabled',
  'captionRenderOverMediaEnabled',
  'artifactCreationEnabled',
  'supabaseSqlEnabled',
  'realUserMediaBetaEnabled',
  'paidProductionEnabled',
]) {
  assertFalse(boundary.boundaryStateToday[key], `boundary.boundaryStateToday.${key}`)
}
assert(
  boundary.ownerBoundariesStillRequired.includes('WORKER_RUNTIME_JOBS source creation plan owner review'),
  'Owner-review boundary missing',
)

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37z_runtime_integration_source_creation_plan_pending'),
  'Phase 37Z source-creation plan resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase37z_runtime_integration_source_creation_plan_owner_review_pending',
  ),
  'Phase 37Z owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase38_actual_runtime_integration_source_creation_pending'),
  'Phase 38 actual source blocker missing',
)

assert(claimPolicy.allowedClaims.phase37ZSourceCreationPlanCompleted === true, 'Phase 37Z allowed claim missing')
assert(claimPolicy.allowedClaims.sourceCreationPlanOwnerReviewMayProceed === true, 'Owner-review allowed claim missing')
assert(claimPolicy.allowedClaims.futureRuntimeIntegrationSourcePathPlanned === true, 'Path planned claim missing')
assert(claimPolicy.allowedClaims.existingBlockedStateSourceInspected === true, 'Source inspected claim missing')
assertFalse(claimPolicy.allowedClaims.runtimeSourceCreatedToday, 'claimPolicy.allowedClaims.runtimeSourceCreatedToday')
assertFalse(claimPolicy.allowedClaims.indexWiringChangedToday, 'claimPolicy.allowedClaims.indexWiringChangedToday')
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

assert(ownerReviewPrompt.requiredSourceDecision === expectedDecision, 'Owner-review prompt source mismatch')
assert(ownerReviewPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner-review prompt source head mismatch')
assert(ownerReviewPrompt.reviewOwner === 'WORKER_RUNTIME_JOBS', 'Owner-review prompt owner mismatch')
assert(
  ownerReviewPrompt.reviewScope.acceptRuntimeIntegrationSourceCreationPlanForFutureSourceCreation === true,
  'Owner-review prompt source-creation plan acceptance missing',
)
for (const key of [
  'acceptSourceCreationToday',
  'acceptIndexWiringToday',
  'acceptDispatchWiringToday',
  'acceptHookExecutionToday',
  'acceptRealMediaToday',
  'acceptArtifactCreationToday',
  'acceptWorkerDispatchToday',
  'acceptRouteToolProviderCallsToday',
  'acceptSupabaseSqlToday',
  'acceptBetaUnlockToday',
  'acceptProductionUnlockToday',
]) {
  assertFalse(ownerReviewPrompt.reviewScope[key], `ownerReviewPrompt.reviewScope.${key}`)
}
assert(ownerReviewPrompt.supabaseClassification.updateRequired === 'no', 'Owner-review prompt Supabase update must be no')

const sourceOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review-result',
)
assert(sourceOwnerReview.decision === sourceDecision, 'Phase 37Y owner-review source decision missing')
assert(sourceOwnerReview.sourceVerification.sourceMergeCommit === '88ce39bc696bf93e094d1e382b18b1cc529352c3', 'Phase 37Y owner-review merge mismatch')
assert(sourceOwnerReview.reviewedSourcePlan.sourceCreationPlanningMayProceed === true, 'Phase 37Y source creation planning missing')
assertFalse(sourceOwnerReview.reviewedSourcePlan.sourceCodeChangedToday, 'Phase 37Y source change widened')

assert(fs.existsSync(path.join(repoRoot, blockedSourcePath)), 'Existing blocked source must exist')
assert(fs.existsSync(path.join(repoRoot, hookSourcePath)), 'Existing hook source must exist')
assert(fs.existsSync(path.join(repoRoot, guardSourcePath)), 'Existing guard source must exist')
assert(!fs.existsSync(path.join(repoRoot, futureRuntimeSourcePath)), 'Future runtime source must not exist yet')
const indexText = readText(indexPath)
assert(indexText.includes('soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration'), 'Existing blocked-state export missing')
assert(!indexText.includes('soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration'), 'Future runtime integration export must not exist')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript], 'Package script missing')
assert(
  packageJson.scripts[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-diagnostics.mjs',
  'Package script command mismatch',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1727,
      sourceMergeCommit,
      sourceCreationPlanItemCount: checklist.sourceCreationPlanItemCount,
      futureRuntimeIntegrationSourcePath: futureRuntimeSourcePath,
      runtimeSourceCreatedToday: false,
      indexWiringChangedToday: false,
      hookExecutionApprovedToday: false,
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
