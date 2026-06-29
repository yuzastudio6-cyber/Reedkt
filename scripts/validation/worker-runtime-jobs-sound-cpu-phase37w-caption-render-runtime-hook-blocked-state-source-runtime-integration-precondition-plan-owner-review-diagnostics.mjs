import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37w_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_design_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37w_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_completed_with_warnings_ready_for_precondition_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '67b02f33a22dd163f5cc6fc79ed6d1caf1d016a1'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37X-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-DESIGN-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan',
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
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-claim-policy',
)
const phase37XRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-register',
)
const phase37XPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1711, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedPreconditions.phase37WPreconditionPlanAccepted === true, 'Phase 37W plan acceptance missing')
assert(review.reviewedPreconditions.preconditionCountAccepted === 8, 'Precondition count mismatch')
assertFalse(
  review.reviewedPreconditions.allExecutionPreconditionsSatisfiedToday,
  'reviewedPreconditions.allExecutionPreconditionsSatisfiedToday',
)
assert(review.reviewedPreconditions.runtimeIntegrationDesignPlanningMayProceed === true, 'Design planning may proceed missing')
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
  assertFalse(review.reviewedPreconditions[key], `review.reviewedPreconditions.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37WDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37WPr === 1711, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37WMergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.preconditionCount === 8, 'Acceptance precondition count mismatch')
assertFalse(
  acceptance.acceptedEvidence.allExecutionPreconditionsSatisfiedToday,
  'acceptance.acceptedEvidence.allExecutionPreconditionsSatisfiedToday',
)
assert(acceptance.acceptedEvidence.packageLockUnchanged === true, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.runtimeIntegrationDesignPlanning === true, 'Design planning acceptance missing')
for (const key of [
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

assert(safety.reviewSafety.allowedNextStep === 'runtime-integration design plan', 'Allowed next step mismatch')
assert(safety.reviewSafety.preconditionCountMustRemain === 8, 'Safety precondition count mismatch')
assert(safety.reviewSafety.allExecutionPreconditionsMustRemainUnsatisfiedToday === true, 'Unsatisfied precondition safety missing')
assert(safety.reviewSafety.blockedStateSourceMustRemainFailClosed === true, 'Fail-closed safety missing')
assert(safety.reviewSafety.temporaryProofFileMustRemainAbsent === true, 'Temp absence safety missing')
for (const key of [
  'realMediaInputAllowed',
  'ocrInferenceAllowed',
  'captionRenderExecutionAllowed',
  'artifactWriteAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'betaUnlockAllowed',
  'productionUnlockAllowed',
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
    (row) => row.blockerId === 'phase37w_runtime_integration_precondition_owner_review_pending',
  ),
  'Phase 37W owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37x_runtime_integration_design_plan_pending'),
  'Phase 37X design-plan blocker missing',
)

assert(claimPolicy.allowedClaims.phase37WOwnerReviewPassed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.runtimeIntegrationDesignPlanningMayProceed === true, 'Design planning claim missing')
assert(claimPolicy.allowedClaims.preconditionPlanAccepted === true, 'Precondition acceptance claim missing')
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

assert(phase37XRegister.sourceDecision === expectedDecision, 'Phase 37X register source mismatch')
assert(phase37XRegister.phase37XMayProceed === true, 'Phase 37X may proceed missing')
assert(phase37XRegister.phase37XAllowedScope.planRuntimeIntegrationDesign === true, 'Phase 37X design scope missing')
assert(phase37XRegister.phase37XAllowedScope.noHookExecution === true, 'Phase 37X hook execution scope widened')
assert(phase37XRegister.phase37XStillBlocked.runtimeIntegration === true, 'Runtime blocker missing')
assert(phase37XRegister.phase37XStillBlocked.realUserMediaBeta === true, 'Real-user beta blocker missing')
assert(phase37XRegister.phase37XStillBlocked.paidProduction === true, 'Production blocker missing')
assert(phase37XRegister.nextPrompt === nextPrompt, 'Phase 37X next prompt mismatch')

assert(phase37XPrompt.requiredSourceDecision === expectedDecision, 'Phase 37X prompt source mismatch')
assert(phase37XPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 37X prompt source head mismatch')
assert(phase37XPrompt.integrationTarget === indexPath, 'Phase 37X prompt target mismatch')
assert(phase37XPrompt.integrationSourcePath === blockedSourcePath, 'Phase 37X prompt source path mismatch')
assert(phase37XPrompt.allowedScope.planRuntimeIntegrationDesign === true, 'Phase 37X prompt design scope missing')
assert(phase37XPrompt.allowedScope.noHookExecution === true, 'Phase 37X prompt no hook execution missing')
assert(phase37XPrompt.supabaseClassification.updateRequired === 'no', 'Phase 37X prompt Supabase update must be no')

const phase37WPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-result',
)
assert(phase37WPlan.decision === sourceDecision, 'Phase 37W source plan decision missing')
assert(phase37WPlan.preconditionPlanResult.preconditionCount === 8, 'Phase 37W source precondition count mismatch')
assertFalse(
  phase37WPlan.preconditionPlanResult.allExecutionPreconditionsSatisfiedToday,
  'Phase 37W source widened preconditions',
)

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Supabase SQL false missing')
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1711,
      sourceMergeCommit,
      preconditionCountAccepted: 8,
      allExecutionPreconditionsSatisfiedToday: false,
      runtimeIntegrationDesignPlanningMayProceed: true,
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
