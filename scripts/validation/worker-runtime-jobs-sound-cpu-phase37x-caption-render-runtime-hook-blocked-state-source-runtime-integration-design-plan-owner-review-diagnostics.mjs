import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37x_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_source_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37x_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_completed_with_warnings_ready_for_design_owner_review_no_media_no_artifacts'
const sourceMergeCommit = 'f0ef4a221186caafa3dab7073c003c1cf23983e8'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Y-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-PLAN'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan',
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
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-claim-policy',
)
const phase37YRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-register',
)
const phase37YPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37y-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1718, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedDesign.phase37XDesignPlanAccepted === true, 'Phase 37X design acceptance missing')
assert(review.reviewedDesign.designItemCountAccepted === 6, 'Design item count mismatch')
assert(review.reviewedDesign.staticExportAlreadyPresent === true, 'Static export evidence missing')
assert(review.reviewedDesign.runtimeIntegrationSourcePlanningMayProceed === true, 'Source planning may proceed missing')
assertFalse(review.reviewedDesign.sourceCodeChangedToday, 'review.reviewedDesign.sourceCodeChangedToday')
for (const key of [
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
  assertFalse(review.reviewedDesign[key], `review.reviewedDesign.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37XPr === 1718, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37XMergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase37XDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.designItemCount === 6, 'Acceptance design count mismatch')
assert(acceptance.acceptedEvidence.staticExportAlreadyPresent === true, 'Acceptance static export missing')
assert(acceptance.acceptedEvidence.packageLockUnchanged === true, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.runtimeIntegrationSourcePlanning === true, 'Source planning acceptance missing')
for (const key of [
  'sourceCodeChangeToday',
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

assert(safety.reviewSafety.allowedNextStep === 'runtime-integration source plan', 'Allowed next step mismatch')
assert(safety.reviewSafety.designItemCountMustRemain === 6, 'Safety design count mismatch')
assert(safety.reviewSafety.blockedStateSourceMustRemainFailClosed === true, 'Fail-closed safety missing')
for (const key of [
  'sourceCodeChangesAllowedToday',
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
    (row) => row.blockerId === 'phase37x_runtime_integration_design_owner_review_pending',
  ),
  'Phase 37X owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37y_runtime_integration_source_plan_pending'),
  'Phase 37Y source-plan blocker missing',
)

assert(claimPolicy.allowedClaims.phase37XOwnerReviewPassed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.runtimeIntegrationSourcePlanningMayProceed === true, 'Source planning claim missing')
assert(claimPolicy.allowedClaims.designPlanAccepted === true, 'Design acceptance claim missing')
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

assert(phase37YRegister.sourceDecision === expectedDecision, 'Phase 37Y register source mismatch')
assert(phase37YRegister.phase37YMayProceed === true, 'Phase 37Y may proceed missing')
assert(phase37YRegister.phase37YAllowedScope.planRuntimeIntegrationSource === true, 'Phase 37Y source-plan scope missing')
assert(phase37YRegister.phase37YAllowedScope.noSourceCreationYet === true, 'Phase 37Y source creation guard missing')
assert(phase37YRegister.phase37YAllowedScope.noHookExecution === true, 'Phase 37Y hook execution scope widened')
assert(phase37YRegister.phase37YStillBlocked.runtimeIntegrationExecution === true, 'Runtime execution blocker missing')
assert(phase37YRegister.phase37YStillBlocked.realUserMediaBeta === true, 'Real-user beta blocker missing')
assert(phase37YRegister.phase37YStillBlocked.paidProduction === true, 'Production blocker missing')
assert(phase37YRegister.nextPrompt === nextPrompt, 'Phase 37Y next prompt mismatch')

assert(phase37YPrompt.requiredSourceDecision === expectedDecision, 'Phase 37Y prompt source mismatch')
assert(phase37YPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 37Y prompt source head mismatch')
assert(phase37YPrompt.integrationSourcePath === blockedSourcePath, 'Phase 37Y prompt source path mismatch')
assert(phase37YPrompt.integrationTarget === indexPath, 'Phase 37Y prompt target mismatch')
assert(phase37YPrompt.allowedScope.planRuntimeIntegrationSource === true, 'Phase 37Y prompt source-plan scope missing')
for (const key of [
  'createRuntimeSourceToday',
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
  assertFalse(phase37YPrompt.allowedScope[key], `phase37YPrompt.allowedScope.${key}`)
}
assert(phase37YPrompt.supabaseClassification.updateRequired === 'no', 'Phase 37Y prompt Supabase update must be no')

const designPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-result',
)
assert(designPlan.decision === sourceDecision, 'Phase 37X source plan decision missing')
assert(designPlan.designResult.designItemCount === 6, 'Phase 37X source design item count mismatch')
assertFalse(designPlan.designResult.sourceCodeChangedToday, 'Phase 37X source widened source changes')
assertFalse(designPlan.designResult.runtimeIntegrationApprovedToday, 'Phase 37X source widened runtime integration')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary execution proof file must be absent')
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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-diagnostics.mjs',
  'Package script missing or mismatched',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1718,
      sourceMergeCommit,
      designItemCountAccepted: 6,
      runtimeIntegrationSourcePlanningMayProceed: true,
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
