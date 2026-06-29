import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37y_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_owner_review_passed_with_warnings_ready_for_source_creation_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37y_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_completed_with_warnings_ready_for_source_plan_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '88ce39bc696bf93e094d1e382b18b1cc529352c3'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Z-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-CREATION-PLAN'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const futureRuntimeSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-claim-policy',
)
const phase37ZRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-register',
)
const phase37ZPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1725, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedSourcePlan.phase37YSourcePlanAccepted === true, 'Phase 37Y source plan acceptance missing')
assert(review.reviewedSourcePlan.sourcePlanItemCountAccepted === 7, 'Source plan item count mismatch')
assert(review.reviewedSourcePlan.futureRuntimeIntegrationSourceCandidateAccepted === true, 'Future source candidate acceptance missing')
assert(review.reviewedSourcePlan.existingBlockedStateSourceStillFailClosed === true, 'Fail-closed source evidence missing')
assert(review.reviewedSourcePlan.sourceCreationPlanningMayProceed === true, 'Source creation planning may proceed missing')
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
  assertFalse(review.reviewedSourcePlan[key], `review.reviewedSourcePlan.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37YPr === 1725, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37YMergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase37YDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.sourcePlanItemCount === 7, 'Acceptance source item count mismatch')
assert(acceptance.acceptedEvidence.futureRuntimeIntegrationSourceCandidate === futureRuntimeSourcePath, 'Future source candidate mismatch')
assert(acceptance.acceptedEvidence.existingBlockedStateSourceInspected === true, 'Existing source inspection missing')
assert(acceptance.acceptedEvidence.packageLockUnchanged === true, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.sourceCreationPlanning === true, 'Source creation planning acceptance missing')
for (const key of [
  'sourceCreationToday',
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

assert(safety.reviewSafety.allowedNextStep === 'source-creation plan', 'Allowed next step mismatch')
assert(safety.reviewSafety.sourcePlanItemCountMustRemain === 7, 'Safety source item count mismatch')
assert(safety.reviewSafety.blockedStateSourceMustRemainFailClosed === true, 'Fail-closed safety missing')
for (const key of [
  'sourceCodeChangesAllowedToday',
  'runtimeSourceCreationAllowedToday',
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
    (row) => row.blockerId === 'phase37y_runtime_integration_source_plan_owner_review_pending',
  ),
  'Phase 37Y owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37z_runtime_integration_source_creation_plan_pending'),
  'Phase 37Z source-creation plan blocker missing',
)

assert(claimPolicy.allowedClaims.phase37YOwnerReviewPassed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.sourceCreationPlanningMayProceed === true, 'Source creation planning claim missing')
assert(claimPolicy.allowedClaims.sourcePlanAccepted === true, 'Source plan acceptance claim missing')
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

assert(phase37ZRegister.sourceDecision === expectedDecision, 'Phase 37Z register source mismatch')
assert(phase37ZRegister.phase37ZMayProceed === true, 'Phase 37Z may proceed missing')
assert(phase37ZRegister.phase37ZAllowedScope.planRuntimeIntegrationSourceCreation === true, 'Phase 37Z source-creation planning scope missing')
assert(phase37ZRegister.phase37ZAllowedScope.noSourceCreationYet === true, 'Phase 37Z source creation guard missing')
assert(phase37ZRegister.phase37ZAllowedScope.noIndexWiringYet === true, 'Phase 37Z index wiring guard missing')
assert(phase37ZRegister.phase37ZStillBlocked.runtimeIntegrationExecution === true, 'Runtime execution blocker missing')
assert(phase37ZRegister.phase37ZStillBlocked.realUserMediaBeta === true, 'Real-user beta blocker missing')
assert(phase37ZRegister.phase37ZStillBlocked.paidProduction === true, 'Production blocker missing')
assert(phase37ZRegister.nextPrompt === nextPrompt, 'Phase 37Z next prompt mismatch')

assert(phase37ZPrompt.requiredSourceDecision === expectedDecision, 'Phase 37Z prompt source mismatch')
assert(phase37ZPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 37Z prompt source head mismatch')
assert(phase37ZPrompt.futureRuntimeIntegrationSourceCandidate === futureRuntimeSourcePath, 'Phase 37Z prompt future source mismatch')
assert(phase37ZPrompt.existingBlockedStateSourcePath === blockedSourcePath, 'Phase 37Z prompt blocked source mismatch')
assert(phase37ZPrompt.existingIntegrationTarget === indexPath, 'Phase 37Z prompt target mismatch')
assert(phase37ZPrompt.allowedScope.planRuntimeIntegrationSourceCreation === true, 'Phase 37Z prompt source-creation planning missing')
for (const key of [
  'createRuntimeSourceToday',
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
  assertFalse(phase37ZPrompt.allowedScope[key], `phase37ZPrompt.allowedScope.${key}`)
}
assert(phase37ZPrompt.supabaseClassification.updateRequired === 'no', 'Phase 37Z prompt Supabase update must be no')

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-result',
)
assert(sourcePlan.decision === sourceDecision, 'Phase 37Y source plan decision missing')
assert(sourcePlan.sourcePlanResult.sourcePlanItemCount === 7, 'Phase 37Y source plan item count mismatch')
assertFalse(sourcePlan.sourcePlanResult.runtimeSourceCreatedToday, 'Phase 37Y source plan widened source creation')
assertFalse(sourcePlan.sourcePlanResult.sourceCodeChangedToday, 'Phase 37Y source plan widened source changes')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary execution proof file must be absent')
assert(!fs.existsSync(path.join(repoRoot, futureRuntimeSourcePath)), 'Future runtime source must not exist yet')
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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review-diagnostics.mjs',
  'Package script missing or mismatched',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1725,
      sourceMergeCommit,
      sourcePlanItemCountAccepted: 7,
      sourceCreationPlanningMayProceed: true,
      runtimeSourceCreatedToday: false,
      sourceCodeChangedToday: false,
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
