import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37y_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_completed_with_warnings_ready_for_source_plan_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37x_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_source_plan_no_media_no_artifacts'
const sourceMergeCommit = '74c7efb39bb98832df620d5b8bc1a0c0547eb4a7'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Y-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-PLAN-OWNER-REVIEW'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const futureRuntimeSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-path-register.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-path-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-checklist.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-checklist',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review',
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
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-result',
)
const paths = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-path-register',
)
const checklist = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-checklist',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-claim-policy',
)
const ownerReviewPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 37Y decision mismatch')
assert(plan.sourceVerification.sourcePr === 1722, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.sourcePlanResult.phase37XOwnerReviewAccepted === true, 'Phase 37X owner review acceptance missing')
assert(plan.sourcePlanResult.runtimeIntegrationSourcePlanCreated === true, 'Source plan creation missing')
assert(plan.sourcePlanResult.sourcePlanItemCount === 7, 'Source plan item count mismatch')
assert(plan.sourcePlanResult.existingBlockedSourceInspected === true, 'Blocked source inspection missing')
assert(plan.sourcePlanResult.existingStaticExportInspected === true, 'Static export inspection missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
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
assert(plan.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(plan.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(paths.sourcePaths.existingBlockedStateIntegrationSource === blockedSourcePath, 'Blocked source path mismatch')
assert(paths.sourcePaths.existingStaticExportTarget === indexPath, 'Static export path mismatch')
assert(paths.sourcePaths.futureRuntimeIntegrationSourceCandidate === futureRuntimeSourcePath, 'Future source path mismatch')
assert(paths.pathStatusToday.existingBlockedStateIntegrationSourceExists === true, 'Existing blocked source status missing')
assert(paths.pathStatusToday.existingStaticExportPresent === true, 'Existing static export status missing')
assertFalse(paths.pathStatusToday.futureRuntimeIntegrationSourceExistsToday, 'paths.pathStatusToday.futureRuntimeIntegrationSourceExistsToday')
assertFalse(
  paths.pathStatusToday.futureRuntimeIntegrationSourceCreationApprovedToday,
  'paths.pathStatusToday.futureRuntimeIntegrationSourceCreationApprovedToday',
)
assertFalse(paths.pathStatusToday.indexWiringChangeApprovedToday, 'paths.pathStatusToday.indexWiringChangeApprovedToday')
assert(paths.sourcePlanPathPolicy.allowedToInspectExistingSource === true, 'Inspect existing source policy missing')
for (const key of ['allowedToCreateOrModifySourceToday', 'allowedToWireDispatchToday', 'allowedToExecuteSourceToday']) {
  assertFalse(paths.sourcePlanPathPolicy[key], `paths.sourcePlanPathPolicy.${key}`)
}

assert(checklist.sourcePlanItemCount === 7, 'Checklist item count mismatch')
assert(checklist.sourcePlanItems.length === 7, 'Checklist item list mismatch')
assertFalse(checklist.allSourceChangesApprovedToday, 'checklist.allSourceChangesApprovedToday')
for (const item of checklist.sourcePlanItems) {
  assert(item.planned === true, `${item.id} must be planned`)
  assertFalse(item.sourceChangeApprovedToday, `checklist.${item.id}.sourceChangeApprovedToday`)
}

assert(boundary.boundaryStateToday.docsDiagnosticsOnly === true, 'Docs diagnostics boundary missing')
assert(boundary.boundaryStateToday.sourcePlanningOnly === true, 'Source planning boundary missing')
for (const key of [
  'runtimeSourceCreated',
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
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37y_runtime_integration_source_plan_pending'),
  'Phase 37Y source-plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase37y_runtime_integration_source_plan_owner_review_pending',
  ),
  'Phase 37Y owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37z_runtime_integration_source_creation_pending'),
  'Phase 37Z source-creation blocker missing',
)

assert(claimPolicy.allowedClaims.phase37YSourcePlanCompleted === true, 'Source-plan claim missing')
assert(claimPolicy.allowedClaims.sourcePlanOwnerReviewMayProceed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.existingBlockedStateSourceInspected === true, 'Source inspection claim missing')
assertFalse(claimPolicy.allowedClaims.runtimeSourceCreatedToday, 'claimPolicy.allowedClaims.runtimeSourceCreatedToday')
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
  ownerReviewPrompt.reviewScope.acceptRuntimeIntegrationSourcePlanForFutureSourceCreation === true,
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
assert(ownerReviewPrompt.supabaseClassification.updateRequired === 'no', 'Owner-review prompt Supabase update must be no')

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Phase 37X owner-review source decision missing')
assert(sourceReview.reviewedDesign.designItemCountAccepted === 6, 'Phase 37X design count mismatch')
assert(sourceReview.reviewedDesign.runtimeIntegrationSourcePlanningMayProceed === true, 'Phase 37X source planning missing')
assertFalse(sourceReview.reviewedDesign.sourceCodeChangedToday, 'Phase 37X source widened source changes')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary execution proof file must be absent')
const futureRuntimeSourceExists = fs.existsSync(path.join(repoRoot, futureRuntimeSourcePath))
if (futureRuntimeSourceExists) {
  const phase38Result = parseJsonBlock(
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-result.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-result',
  )
  assert(
    phase38Result.decision ===
      'worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_actual_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts',
    'Future runtime source requires Phase 38 source-creation result',
  )
  assert(
    phase38Result.sourceCreationResult.runtimeIntegrationSourceCreated === true,
    'Phase 38 source-creation result must mark source created',
  )
} else {
  assert(!futureRuntimeSourceExists, 'Future runtime source must not exist yet')
}
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Supabase SQL false missing')
const indexSource = readText(indexPath)
assert(
  indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'),
  'Static export for blocked integration result missing',
)

const pkg = JSON.parse(readText('package.json'))
assert(
  pkg.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-diagnostics.mjs',
  'Package script missing or mismatched',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1722,
      sourceMergeCommit,
      sourcePlanItemCount: checklist.sourcePlanItemCount,
      existingBlockedSourceInspected: true,
      runtimeSourceCreatedToday: false,
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
