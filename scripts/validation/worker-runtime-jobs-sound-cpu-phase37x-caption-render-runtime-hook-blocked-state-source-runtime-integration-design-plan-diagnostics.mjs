import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37x_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_completed_with_warnings_ready_for_design_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37w_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_design_plan_no_media_no_artifacts'
const sourceMergeCommit = '282c02a65151048470f556c2029e83811825fb7d'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37X-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-DESIGN-PLAN-OWNER-REVIEW'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-target-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-target-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-contract-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-contract-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-owner-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-owner-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-result',
)
const targets = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-target-register',
)
const contract = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-contract-register',
)
const ownerBoundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-owner-boundary-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-claim-policy',
)
const ownerReviewPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 37X decision mismatch')
assert(plan.sourceVerification.sourcePr === 1715, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.designResult.phase37WOwnerReviewAccepted === true, 'Phase 37W owner review acceptance missing')
assert(plan.designResult.runtimeIntegrationDesignPlanned === true, 'Runtime integration design was not planned')
assert(plan.designResult.designItemCount === 6, 'Design item count mismatch')
assert(plan.designResult.staticExportAlreadyPresent === true, 'Static export evidence missing')
assertFalse(plan.designResult.sourceCodeChangedToday, 'plan.designResult.sourceCodeChangedToday')
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
  assertFalse(plan.designResult[key], `plan.designResult.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(plan.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(plan.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(targets.integrationDesignTargets.blockedStateSourcePath === blockedSourcePath, 'Blocked source target mismatch')
assert(targets.integrationDesignTargets.staticExportTarget === indexPath, 'Static export target mismatch')
assert(targets.designTargetsStatus.blockedStateSourceExists === true, 'Blocked source status missing')
assert(targets.designTargetsStatus.staticExportAlreadyPresent === true, 'Static export status missing')
assert(targets.designTargetsStatus.futureRuntimeDispatchIntegrationRequired === true, 'Future dispatch requirement missing')
assertFalse(targets.designTargetsStatus.sourceChangeRequiredInPhase37X, 'targets.designTargetsStatus.sourceChangeRequiredInPhase37X')
assert(targets.forbiddenTargetsToday.includes('Supabase clients or SQL'), 'Supabase forbidden target missing')

assert(contract.designItemCount === 6, 'Contract design item count mismatch')
assert(contract.designItems.length === 6, 'Contract design item list mismatch')
assertFalse(contract.allDesignItemsExecutionApprovedToday, 'contract.allDesignItemsExecutionApprovedToday')
for (const item of contract.designItems) {
  assert(item.status === 'planned', `Design item ${item.id} must be planned`)
  assertFalse(item.executionApprovedToday, `contract.designItems.${item.id}.executionApprovedToday`)
}

assert(ownerBoundary.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(
  ownerBoundary.ownerBoundaries.some(
    (row) => row.owner === 'WORKER_RUNTIME_JOBS' && row.acceptedToday === 'design planning only',
  ),
  'WORKER_RUNTIME_JOBS design boundary missing',
)
for (const owner of [
  'TRACK_B_MEDIA_PROCESSING',
  'PUBLIC_ARTIFACT_DELIVERY_POLICY',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PROVIDER_GATEWAY_MODELS',
  'PRODUCT_BETA_READINESS',
]) {
  assert(
    ownerBoundary.ownerBoundaries.some((row) => row.owner === owner && row.acceptedToday === 'no'),
    `${owner} boundary must stay closed`,
  )
}

assert(safety.safetyRules.allowedNextStep === 'design owner review', 'Allowed next step mismatch')
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
  assertFalse(safety.safetyRules[key], `safety.safetyRules.${key}`)
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
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37x_runtime_integration_design_plan_pending'),
  'Phase 37X design blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase37x_runtime_integration_design_owner_review_pending',
  ),
  'Phase 37X owner review blocker missing',
)

assert(claimPolicy.allowedClaims.phase37XDesignPlanCompleted === true, 'Phase 37X design claim missing')
assert(claimPolicy.allowedClaims.designOwnerReviewMayProceed === true, 'Design owner-review claim missing')
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
assert(ownerReviewPrompt.reviewScope.acceptRuntimeIntegrationDesignForFuturePlanning === true, 'Owner-review prompt design acceptance missing')
for (const key of [
  'acceptSourceCodeChangesToday',
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
  'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Phase 37W owner-review source decision missing')
assert(sourceReview.reviewedPreconditions.preconditionCountAccepted === 8, 'Phase 37W precondition count mismatch')
assertFalse(
  sourceReview.reviewedPreconditions.allExecutionPreconditionsSatisfiedToday,
  'Phase 37W owner-review source widened preconditions',
)

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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan-diagnostics.mjs',
  'Package script missing or mismatched',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1715,
      sourceMergeCommit,
      designItemCount: contract.designItemCount,
      staticExportAlreadyPresent: targets.designTargetsStatus.staticExportAlreadyPresent,
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
