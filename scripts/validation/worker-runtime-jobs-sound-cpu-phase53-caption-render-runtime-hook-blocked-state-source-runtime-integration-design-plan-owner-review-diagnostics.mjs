import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase53_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_source_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase53_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_completed_with_warnings_ready_for_design_owner_review_no_media_no_artifacts'
const sourceHead = 'bcc7b600a75aa9b56c02954966d8ce4e45710740'
const sourceMergeCommit = 'dd35985d11439435eab0c1c9482c275c2a67f117'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE54-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-PLAN'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan.md',
    'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan',
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
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-owner-claim-policy',
)
const phase54Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan-register',
)
const phase54Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase54-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1822, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedDesign.phase53DesignPlanAccepted, 'Phase 53 design acceptance missing')
assert(review.reviewedDesign.designItemCountAccepted === 6, 'Design item count mismatch')
assertTrue(review.reviewedDesign.blockedStateStaticExportAlreadyPresent, 'Blocked-state static export evidence missing')
assertTrue(review.reviewedDesign.runtimeIntegrationStaticExportAlreadyPresent, 'Runtime-integration static export evidence missing')
assertTrue(review.reviewedDesign.runtimeIntegrationSourcePlanningMayProceed, 'Source planning may proceed missing')
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
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase53Pr === 1822, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase53Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase53MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase53Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.designItemCount === 6, 'Acceptance design count mismatch')
assertTrue(acceptance.acceptedEvidence.blockedStateStaticExportAlreadyPresent, 'Acceptance blocked-state export missing')
assertTrue(acceptance.acceptedEvidence.runtimeIntegrationStaticExportAlreadyPresent, 'Acceptance runtime export missing')
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assertTrue(acceptance.acceptedScope.runtimeIntegrationSourcePlanning, 'Source planning acceptance missing')
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
assertTrue(safety.reviewSafety.blockedStateSourceMustRemainFailClosed, 'Blocked-state fail-closed safety missing')
assertTrue(safety.reviewSafety.runtimeIntegrationSourceMustRemainFailClosed, 'Runtime integration fail-closed safety missing')
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
    (row) => row.blockerId === 'phase53_runtime_integration_design_owner_review_pending',
  ),
  'Phase 53 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase54_runtime_integration_source_plan_pending'),
  'Phase 54 source-plan blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase53OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeIntegrationSourcePlanningMayProceed, 'Source planning claim missing')
assertTrue(claimPolicy.allowedClaims.designPlanAccepted, 'Design acceptance claim missing')
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

assert(phase54Register.sourceDecision === expectedDecision, 'Phase 54 register source mismatch')
assertTrue(phase54Register.phase54MayProceed, 'Phase 54 may proceed missing')
assertTrue(phase54Register.phase54AllowedScope.planRuntimeIntegrationSource, 'Phase 54 source-plan scope missing')
assertTrue(phase54Register.phase54AllowedScope.noSourceCreationYet, 'Phase 54 source creation guard missing')
assertTrue(phase54Register.phase54AllowedScope.noDispatchWiring, 'Phase 54 dispatch wiring guard missing')
assertTrue(phase54Register.phase54AllowedScope.noHookExecution, 'Phase 54 hook execution scope widened')
assertTrue(phase54Register.phase54StillBlocked.runtimeIntegrationExecution, 'Runtime execution blocker missing')
assertTrue(phase54Register.phase54StillBlocked.realUserMediaBeta, 'Real-user beta blocker missing')
assertTrue(phase54Register.phase54StillBlocked.paidProduction, 'Production blocker missing')
assert(phase54Register.nextPrompt === nextPrompt, 'Phase 54 next prompt mismatch')

assert(phase54Prompt.requiredSourceDecision === expectedDecision, 'Phase 54 prompt source mismatch')
assert(phase54Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 54 prompt source head mismatch')
assert(phase54Prompt.integrationSourcePath === blockedSourcePath, 'Phase 54 prompt source path mismatch')
assert(phase54Prompt.runtimeIntegrationSourcePath === runtimeIntegrationPath, 'Phase 54 prompt runtime path mismatch')
assert(phase54Prompt.integrationTarget === indexPath, 'Phase 54 prompt target mismatch')
assertTrue(phase54Prompt.allowedScope.planRuntimeIntegrationSource, 'Phase 54 prompt source-plan scope missing')
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
  assertFalse(phase54Prompt.allowedScope[key], `phase54Prompt.allowedScope.${key}`)
}
assertNoop(phase54Prompt.supabaseClassification, 'phase54 prompt')

const designPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan.md',
  'worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-result',
)
assert(designPlan.decision === sourceDecision, 'Phase 53 source plan decision missing')
assert(designPlan.designResult.designItemCount === 6, 'Phase 53 source design item count mismatch')
assertFalse(designPlan.designResult.sourceCodeChangedToday, 'Phase 53 source widened source changes')
assertFalse(designPlan.designResult.runtimeIntegrationApprovedToday, 'Phase 53 source widened runtime integration')

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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review-diagnostics.mjs',
  'Package script missing or mismatched',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1822,
      sourceHead,
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
