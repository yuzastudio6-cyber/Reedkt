import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase54_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_owner_review_passed_with_warnings_ready_for_source_creation_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase54_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_completed_with_warnings_ready_for_source_plan_owner_review_no_media_no_artifacts'
const sourceHead = 'ab09bff920fc315b7b1396c4b0ec278c79c88af5'
const sourceMergeCommit = 'a1939d5d87ae89768702a6e399a3b7d1d3c8b1e6'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE55-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-CREATION-PLAN'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan',
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
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-owner-claim-policy',
)
const phase55Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-register',
)
const phase55Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1829, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedSourcePlan.phase54SourcePlanAccepted, 'Phase 54 source plan acceptance missing')
assert(review.reviewedSourcePlan.sourcePlanItemCountAccepted === 7, 'Source plan item count mismatch')
assertTrue(review.reviewedSourcePlan.existingBlockedStateSourceStillFailClosed, 'Blocked-state fail-closed evidence missing')
assertTrue(review.reviewedSourcePlan.existingRuntimeIntegrationSourceStillFailClosed, 'Runtime integration fail-closed evidence missing')
assertTrue(review.reviewedSourcePlan.sourceCreationPlanningMayProceed, 'Source creation planning may proceed missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
  'runtimeSourceModifiedToday',
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
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase54Pr === 1829, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase54Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase54MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase54Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.sourcePlanItemCount === 7, 'Acceptance source item count mismatch')
assert(acceptance.acceptedEvidence.existingBlockedStateSource === blockedSourcePath, 'Blocked source path mismatch')
assert(acceptance.acceptedEvidence.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Runtime integration path mismatch')
assertTrue(acceptance.acceptedEvidence.existingBlockedStateSourceInspected, 'Existing blocked source inspection missing')
assertTrue(acceptance.acceptedEvidence.existingRuntimeIntegrationSourceInspected, 'Existing runtime source inspection missing')
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assertTrue(acceptance.acceptedScope.sourceCreationPlanning, 'Source creation planning acceptance missing')
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

assert(safety.reviewSafety.allowedNextStep === 'source-creation plan', 'Allowed next step mismatch')
assert(safety.reviewSafety.sourcePlanItemCountMustRemain === 7, 'Safety source item count mismatch')
assertTrue(safety.reviewSafety.blockedStateSourceMustRemainFailClosed, 'Blocked-state fail-closed safety missing')
assertTrue(safety.reviewSafety.runtimeIntegrationSourceMustRemainFailClosed, 'Runtime integration fail-closed safety missing')
for (const key of [
  'sourceCodeChangesAllowedToday',
  'runtimeSourceCreationAllowedToday',
  'runtimeSourceModificationAllowedToday',
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
    (row) => row.blockerId === 'phase54_runtime_integration_source_plan_owner_review_pending',
  ),
  'Phase 54 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase55_runtime_integration_source_creation_plan_pending'),
  'Phase 55 source-creation plan blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase54OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(claimPolicy.allowedClaims.sourceCreationPlanningMayProceed, 'Source creation planning claim missing')
assertTrue(claimPolicy.allowedClaims.sourcePlanAccepted, 'Source plan acceptance claim missing')
assertTrue(claimPolicy.allowedClaims.blockedStateSourceRemainsFailClosed, 'Blocked-state fail-closed claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeIntegrationSourceRemainsFailClosed, 'Runtime integration fail-closed claim missing')
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

assert(phase55Register.sourceDecision === expectedDecision, 'Phase 55 register source mismatch')
assertTrue(phase55Register.phase55MayProceed, 'Phase 55 may proceed missing')
assertTrue(phase55Register.phase55AllowedScope.planRuntimeIntegrationSourceCreation, 'Phase 55 planning scope missing')
assertTrue(phase55Register.phase55AllowedScope.noSourceCreationYet, 'Phase 55 source creation guard missing')
assertTrue(phase55Register.phase55AllowedScope.noSourceModificationYet, 'Phase 55 source modification guard missing')
assertTrue(phase55Register.phase55AllowedScope.noIndexWiringYet, 'Phase 55 index wiring guard missing')
assertTrue(phase55Register.phase55AllowedScope.noDispatchWiringYet, 'Phase 55 dispatch wiring guard missing')
assertTrue(phase55Register.phase55StillBlocked.runtimeIntegrationExecution, 'Runtime execution blocker missing')
assertTrue(phase55Register.phase55StillBlocked.realUserMediaBeta, 'Real-user beta blocker missing')
assertTrue(phase55Register.phase55StillBlocked.paidProduction, 'Production blocker missing')
assert(phase55Register.nextPrompt === nextPrompt, 'Phase 55 next prompt mismatch')

assert(phase55Prompt.requiredSourceDecision === expectedDecision, 'Phase 55 prompt source mismatch')
assert(phase55Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 55 prompt source head mismatch')
assert(phase55Prompt.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Phase 55 prompt runtime source mismatch')
assert(phase55Prompt.existingBlockedStateSourcePath === blockedSourcePath, 'Phase 55 prompt blocked source mismatch')
assert(phase55Prompt.existingIntegrationTarget === indexPath, 'Phase 55 prompt target mismatch')
assertTrue(phase55Prompt.allowedScope.planRuntimeIntegrationSourceCreation, 'Phase 55 prompt source-creation planning missing')
for (const key of [
  'createRuntimeSourceToday',
  'modifyRuntimeSourceToday',
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
  assertFalse(phase55Prompt.allowedScope[key], `phase55Prompt.allowedScope.${key}`)
}
assertNoop(phase55Prompt.supabaseClassification, 'phase55 prompt')

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan.md',
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-result',
)
assert(sourcePlan.decision === sourceDecision, 'Phase 54 source plan decision missing')
assert(sourcePlan.sourcePlanResult.sourcePlanItemCount === 7, 'Phase 54 source plan item count mismatch')
assertFalse(sourcePlan.sourcePlanResult.runtimeSourceCreatedToday, 'Phase 54 source plan widened source creation')
assertFalse(sourcePlan.sourcePlanResult.dispatchWiringChangedToday, 'Phase 54 source plan widened dispatch wiring')
assertFalse(sourcePlan.sourcePlanResult.sourceCodeChangedToday, 'Phase 54 source plan widened source changes')

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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-owner-review-diagnostics.mjs',
  'Package script missing or mismatched',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1829,
      sourceHead,
      sourceMergeCommit,
      sourcePlanItemCountAccepted: 7,
      sourceCreationPlanningMayProceed: true,
      runtimeSourceCreatedToday: false,
      runtimeSourceModifiedToday: false,
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
