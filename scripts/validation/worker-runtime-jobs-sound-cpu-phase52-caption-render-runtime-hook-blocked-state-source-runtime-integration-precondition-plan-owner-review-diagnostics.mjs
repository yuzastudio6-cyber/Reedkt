import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase52_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_design_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase52_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_completed_with_warnings_ready_for_precondition_owner_review_no_media_no_artifacts'
const sourceHead = '6b766e4875f6507aa9b9fee883951ae6648552e8'
const sourceMergeCommit = 'f95c7bd426c9d67d62c7613b676c5f2da0900e95'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE53-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-DESIGN-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-register.md',
    'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan.md',
    'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan',
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
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-owner-claim-policy',
)
const phase53Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-register',
)
const phase53Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1816, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedPreconditions.phase52PreconditionPlanAccepted, 'Phase 52 plan acceptance missing')
assert(review.reviewedPreconditions.preconditionCountAccepted === 8, 'Precondition count mismatch')
assertTrue(review.reviewedPreconditions.blockedStateSourceAlreadyExported, 'Blocked-state export acceptance missing')
assertTrue(review.reviewedPreconditions.runtimeIntegrationBlockedSourceAlreadyExported, 'Runtime integration export acceptance missing')
assertFalse(
  review.reviewedPreconditions.allExecutionPreconditionsSatisfiedToday,
  'reviewedPreconditions.allExecutionPreconditionsSatisfiedToday',
)
assertTrue(review.reviewedPreconditions.runtimeIntegrationDesignPlanningMayProceed, 'Design planning may proceed missing')
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
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase52Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase52Pr === 1816, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase52MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.preconditionCount === 8, 'Acceptance precondition count mismatch')
assertTrue(acceptance.acceptedEvidence.blockedStateSourceAlreadyExported, 'Blocked-state acceptance missing')
assertTrue(acceptance.acceptedEvidence.runtimeIntegrationBlockedSourceAlreadyExported, 'Runtime integration acceptance missing')
assertFalse(
  acceptance.acceptedEvidence.allExecutionPreconditionsSatisfiedToday,
  'acceptance.acceptedEvidence.allExecutionPreconditionsSatisfiedToday',
)
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assertTrue(acceptance.acceptedScope.runtimeIntegrationDesignPlanning, 'Design planning acceptance missing')
for (const key of [
  'sourceCodeChange',
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
assertTrue(
  safety.reviewSafety.allExecutionPreconditionsMustRemainUnsatisfiedToday,
  'Unsatisfied precondition safety missing',
)
assertTrue(safety.reviewSafety.blockedStateSourceMustRemainFailClosed, 'Blocked-state fail-closed safety missing')
assertTrue(
  safety.reviewSafety.runtimeIntegrationSourceMustRemainFailClosed,
  'Runtime integration fail-closed safety missing',
)
assertTrue(safety.reviewSafety.temporaryProofFileMustRemainAbsent, 'Temp absence safety missing')
for (const key of [
  'sourceCodeChangeAllowed',
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
    (row) => row.blockerId === 'phase52_runtime_integration_precondition_owner_review_pending',
  ),
  'Phase 52 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase53_runtime_integration_design_plan_pending'),
  'Phase 53 design-plan blocker missing',
)
assertFalse(blockers.betaProductionStatus.realUserMediaBetaAllowed, 'blockers.realUserMediaBetaAllowed')
assertFalse(blockers.betaProductionStatus.paidProductionAllowed, 'blockers.paidProductionAllowed')

assertTrue(claimPolicy.allowedClaims.phase52OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeIntegrationDesignPlanningMayProceed, 'Design planning claim missing')
assertTrue(claimPolicy.allowedClaims.preconditionPlanAccepted, 'Precondition acceptance claim missing')
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

assert(phase53Register.sourceDecision === expectedDecision, 'Phase 53 register source mismatch')
assertTrue(phase53Register.phase53MayProceed, 'Phase 53 may proceed missing')
assertTrue(phase53Register.phase53AllowedScope.planRuntimeIntegrationDesign, 'Phase 53 design scope missing')
assertTrue(phase53Register.phase53AllowedScope.noSourceCodeChange, 'Phase 53 source-change scope missing')
assertTrue(phase53Register.phase53AllowedScope.noHookExecution, 'Phase 53 hook execution scope widened')
assertTrue(phase53Register.phase53StillBlocked.runtimeIntegration, 'Runtime blocker missing')
assertTrue(phase53Register.phase53StillBlocked.realUserMediaBeta, 'Real-user beta blocker missing')
assertTrue(phase53Register.phase53StillBlocked.paidProduction, 'Production blocker missing')
assert(phase53Register.nextPrompt === nextPrompt, 'Phase 53 next prompt mismatch')

assert(phase53Prompt.requiredSourceDecision === expectedDecision, 'Phase 53 prompt source mismatch')
assert(phase53Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 53 prompt source head mismatch')
assert(phase53Prompt.integrationTarget === indexPath, 'Phase 53 prompt target mismatch')
assert(phase53Prompt.blockedStateIntegrationSourcePath === blockedSourcePath, 'Phase 53 prompt blocked-state path mismatch')
assert(phase53Prompt.runtimeIntegrationSourcePath === runtimeIntegrationPath, 'Phase 53 prompt runtime path mismatch')
assertTrue(phase53Prompt.allowedScope.planRuntimeIntegrationDesign, 'Phase 53 prompt design scope missing')
assertTrue(phase53Prompt.allowedScope.noSourceCodeChange, 'Phase 53 prompt source-change scope missing')
assertTrue(phase53Prompt.allowedScope.noHookExecution, 'Phase 53 prompt no hook execution missing')
assertNoop(phase53Prompt.supabaseClassification, 'phase53 prompt')

const phase52Plan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan.md',
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-result',
)
assert(phase52Plan.decision === sourceDecision, 'Phase 52 source plan decision missing')
assertTrue(
  phase52Plan.preconditionPlanResult.runtimeIntegrationPreconditionsPlanned,
  'Phase 52 source preconditions missing',
)
assertFalse(
  phase52Plan.preconditionPlanResult.runtimeIntegrationApprovedToday,
  'Phase 52 source widened runtime integration',
)

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked-state status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Blocked-state runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Blocked-state worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Blocked-state media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Blocked-state artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Blocked-state Supabase SQL false missing')
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
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index blocked-state factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index blocked-state assertion export missing')
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'), 'Index runtime integration factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'), 'Index runtime integration assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1816,
      sourceHead,
      sourceMergeCommit,
      runtimeIntegrationDesignPlanningMayProceed: true,
      allExecutionPreconditionsSatisfiedToday: false,
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
