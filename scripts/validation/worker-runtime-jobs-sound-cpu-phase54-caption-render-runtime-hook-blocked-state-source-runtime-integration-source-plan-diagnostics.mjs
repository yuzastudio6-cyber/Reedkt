import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase54_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_completed_with_warnings_ready_for_source_plan_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase53_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_source_plan_no_media_no_artifacts'
const sourceHead = '13a91902981eb4e98cfee02a3b7fe2281f823a17'
const sourceMergeCommit = 'a83a2f6c17c5dcced2c5a7ae4076c2b1599b9b3d'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE54-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-PLAN-OWNER-REVIEW'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const hookPath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const guardPath = 'server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-path-register.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-path-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-checklist.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-checklist',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review',
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
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-result',
)
const paths = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-path-register',
)
const checklist = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-checklist',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy',
)
const ownerReviewPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 54 decision mismatch')
assert(plan.sourceVerification.sourcePr === 1826, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(plan.sourcePlanResult.phase53OwnerReviewAccepted, 'Phase 53 owner review acceptance missing')
assertTrue(plan.sourcePlanResult.runtimeIntegrationSourcePlanCreated, 'Source plan creation missing')
assert(plan.sourcePlanResult.sourcePlanItemCount === 7, 'Source plan item count mismatch')
assertTrue(plan.sourcePlanResult.existingBlockedSourceInspected, 'Blocked source inspection missing')
assertTrue(plan.sourcePlanResult.existingRuntimeIntegrationSourceInspected, 'Runtime integration source inspection missing')
assertTrue(plan.sourcePlanResult.existingStaticExportInspected, 'Static export inspection missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
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
  assertFalse(plan.sourcePlanResult[key], `plan.sourcePlanResult.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(plan.supabaseClassification, 'plan')

assert(paths.sourcePaths.existingBlockedStateIntegrationSource === blockedSourcePath, 'Blocked source path mismatch')
assert(paths.sourcePaths.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Runtime integration path mismatch')
assert(paths.sourcePaths.existingStaticExportTarget === indexPath, 'Static export path mismatch')
assert(paths.sourcePaths.existingHookSource === hookPath, 'Hook path mismatch')
assert(paths.sourcePaths.existingRuntimeGuardSource === guardPath, 'Guard path mismatch')
assert(paths.sourcePaths.futureDispatchIntegrationCandidate === runtimeIntegrationPath, 'Future dispatch candidate mismatch')
assertTrue(paths.pathStatusToday.existingBlockedStateIntegrationSourceExists, 'Existing blocked source status missing')
assertTrue(paths.pathStatusToday.existingRuntimeIntegrationSourceExists, 'Existing runtime integration status missing')
assertTrue(paths.pathStatusToday.existingStaticExportPresent, 'Existing static export status missing')
assertFalse(
  paths.pathStatusToday.futureDispatchIntegrationCreationApprovedToday,
  'paths.pathStatusToday.futureDispatchIntegrationCreationApprovedToday',
)
assertFalse(paths.pathStatusToday.indexWiringChangeApprovedToday, 'paths.pathStatusToday.indexWiringChangeApprovedToday')
assertTrue(paths.sourcePlanPathPolicy.allowedToInspectExistingSource, 'Inspect existing source policy missing')
for (const key of ['allowedToCreateOrModifySourceToday', 'allowedToWireDispatchToday', 'allowedToExecuteSourceToday']) {
  assertFalse(paths.sourcePlanPathPolicy[key], `paths.sourcePlanPathPolicy.${key}`)
}

assert(checklist.sourcePlanItemCount === 7, 'Checklist item count mismatch')
assert(checklist.sourcePlanItems.length === 7, 'Checklist item list mismatch')
assertFalse(checklist.allSourceChangesApprovedToday, 'checklist.allSourceChangesApprovedToday')
for (const item of checklist.sourcePlanItems) {
  assertTrue(item.planned, `${item.id} must be planned`)
  assertFalse(item.sourceChangeApprovedToday, `checklist.${item.id}.sourceChangeApprovedToday`)
}

assertTrue(boundary.boundaryStateToday.docsDiagnosticsOnly, 'Docs diagnostics boundary missing')
assertTrue(boundary.boundaryStateToday.sourcePlanningOnly, 'Source planning boundary missing')
for (const key of [
  'runtimeSourceCreated',
  'runtimeSourceModified',
  'indexWiringChanged',
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
  boundary.ownerBoundariesStillRequired.includes('WORKER_RUNTIME_JOBS source creation owner review'),
  'Source creation owner-review boundary missing',
)

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase54_runtime_integration_source_plan_pending'),
  'Phase 54 source-plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase54_runtime_integration_source_plan_owner_review_pending',
  ),
  'Phase 54 owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase55_runtime_integration_source_creation_pending'),
  'Phase 55 source-creation blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase54SourcePlanCompleted, 'Source-plan claim missing')
assertTrue(claimPolicy.allowedClaims.sourcePlanOwnerReviewMayProceed, 'Owner-review claim missing')
assertTrue(claimPolicy.allowedClaims.existingBlockedStateSourceInspected, 'Blocked source inspection claim missing')
assertTrue(claimPolicy.allowedClaims.existingRuntimeIntegrationSourceInspected, 'Runtime source inspection claim missing')
assertFalse(claimPolicy.allowedClaims.runtimeSourceCreatedToday, 'claimPolicy.allowedClaims.runtimeSourceCreatedToday')
assertFalse(claimPolicy.allowedClaims.runtimeSourceModifiedToday, 'claimPolicy.allowedClaims.runtimeSourceModifiedToday')
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
assertTrue(
  ownerReviewPrompt.reviewScope.acceptRuntimeIntegrationSourcePlanForFutureSourceCreation,
  'Owner-review prompt source-plan acceptance missing',
)
for (const key of [
  'acceptSourceCreationToday',
  'acceptIndexWiringToday',
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
assertNoop(ownerReviewPrompt.supabaseClassification, 'owner review prompt')

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Phase 53 owner-review source decision missing')
assert(sourceReview.reviewedDesign.designItemCountAccepted === 6, 'Phase 53 design count mismatch')
assertTrue(sourceReview.reviewedDesign.runtimeIntegrationSourcePlanningMayProceed, 'Phase 53 source planning missing')
assertFalse(sourceReview.reviewedDesign.sourceCodeChangedToday, 'Phase 53 source widened source changes')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary execution proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Supabase SQL false missing')
const runtimeSource = readText(runtimeIntegrationPath)
assert(runtimeSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Runtime integration blocked status missing')
assert(runtimeSource.includes('runtimeExecutionApproved: false'), 'Runtime integration runtime execution false missing')
assert(runtimeSource.includes('workerExecutionApproved: false'), 'Runtime integration worker execution false missing')
assert(runtimeSource.includes('mediaProcessingApproved: false'), 'Runtime integration media processing false missing')
assert(runtimeSource.includes('artifactCreationApproved: false'), 'Runtime integration artifact false missing')
assert(runtimeSource.includes('supabaseSqlApproved: false'), 'Runtime integration Supabase SQL false missing')
assert(runtimeSource.includes('routeToolProviderApproved: false'), 'Runtime integration route/tool/provider false missing')
assert(runtimeSource.includes('realUserMediaBetaApproved: false'), 'Runtime integration beta false missing')
assert(runtimeSource.includes('paidProductionApproved: false'), 'Runtime integration production false missing')
const indexSource = readText(indexPath)
assert(
  indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'),
  'Static export for blocked integration result missing',
)
assert(
  indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'),
  'Static export for runtime integration result missing',
)

const pkg = JSON.parse(readText('package.json'))
assert(
  pkg.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-diagnostics.mjs',
  'Package script missing or mismatched',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1826,
      sourceHead,
      sourceMergeCommit,
      sourcePlanItemCount: checklist.sourcePlanItemCount,
      existingBlockedSourceInspected: true,
      existingRuntimeIntegrationSourceInspected: true,
      runtimeSourceCreatedToday: false,
      dispatchWiringChangedToday: false,
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
