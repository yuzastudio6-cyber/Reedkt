import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37z_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_source_creation_gate_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37z_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_completed_with_warnings_ready_for_source_creation_plan_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '662b396021a66a9912d2fb8f7cf5c71b37277a55'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE38-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-ACTUAL-SOURCE-CREATION-GATE'
const futureRuntimeSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate-register.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate',
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
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-owner-claim-policy',
)
const phase38Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate-register',
)
const phase38Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate',
)

assert(review.decision === expectedDecision, 'Phase 37Z owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1730, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedSourceCreationPlan.phase37ZSourceCreationPlanAccepted === true, 'Source creation plan acceptance missing')
assert(review.reviewedSourceCreationPlan.sourceCreationPlanItemCountAccepted === 8, 'Source creation plan item count mismatch')
assert(review.reviewedSourceCreationPlan.futureRuntimeIntegrationSourceCandidateAccepted === true, 'Future source path acceptance missing')
assert(review.reviewedSourceCreationPlan.futureRuntimeIntegrationSourceCreationMayProceed === true, 'Future source creation gate missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
  'indexWiringApprovedToday',
  'dispatchWiringApprovedToday',
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
  assertFalse(review.reviewedSourceCreationPlan[key], `review.reviewedSourceCreationPlan.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedSourcePlan.phase37ZDecision === sourceDecision, 'Accepted source decision mismatch')
assert(acceptance.acceptedSourcePlan.sourceCreationPlanAccepted === true, 'Source creation plan not accepted')
assert(acceptance.acceptedSourcePlan.sourceCreationPlanItemCountAccepted === 8, 'Accepted item count mismatch')
assert(acceptance.acceptedSourcePlan.futureRuntimeIntegrationSourcePath === futureRuntimeSourcePath, 'Accepted path mismatch')
assert(acceptance.acceptedSourcePlan.actualSourceCreationMayProceedInNextGate === true, 'Next gate acceptance missing')
for (const key of [
  'sourceCreation',
  'indexExportWiring',
  'dispatchWiring',
  'runtimeExecution',
  'mediaExecution',
  'artifactCreation',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedForToday[key], `acceptance.acceptedForToday.${key}`)
}

for (const key of [
  'futureSourceMustRemainFailClosed',
  'futureSourceMustUseStaticOnlyInputs',
  'futureSourceMustAvoidFileOpen',
  'futureSourceMustAvoidArtifactWrite',
  'futureSourceMustAvoidRouteToolProviderCalls',
  'futureSourceMustAvoidSupabaseSql',
  'futureSourceMustAvoidWorkerDispatch',
  'futureSourceMustAvoidReadinessWidening',
]) {
  assert(safety.sourceCreationSafety[key] === true, `safety.sourceCreationSafety.${key} missing`)
}
for (const key of [
  'sourceCreatedToday',
  'sourceWiredToday',
  'sourceExecutedToday',
  'mediaProcessedToday',
  'artifactCreatedToday',
  'supabaseSqlExecutedToday',
  'readinessUnlockedToday',
]) {
  assertFalse(safety.currentPacketSafety[key], `safety.currentPacketSafety.${key}`)
}

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase37z_runtime_integration_source_creation_plan_owner_review_pending',
  ),
  'Phase 37Z owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase38_actual_runtime_integration_source_creation_pending'),
  'Phase 38 actual source blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_user_media_beta_and_paid_production_pending'),
  'Product readiness blocker missing',
)

assert(claimPolicy.allowedClaims.phase37ZSourceCreationPlanOwnerReviewPassed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.actualSourceCreationGateMayProceed === true, 'Actual source gate claim missing')
assert(claimPolicy.allowedClaims.futureRuntimeIntegrationSourcePathAccepted === true, 'Future source path claim missing')
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

assert(phase38Register.sourceDecision === expectedDecision, 'Phase 38 register source mismatch')
assert(phase38Register.phase38MayProceed === true, 'Phase 38 may proceed missing')
assert(phase38Register.futureSourcePath === futureRuntimeSourcePath, 'Phase 38 future source path mismatch')
assert(phase38Register.nextPrompt === nextPrompt, 'Phase 38 register prompt mismatch')
assert(phase38Register.phase38AllowedScope.createFailClosedRuntimeIntegrationSource === true, 'Phase 38 source scope missing')
for (const key of [
  'keepIndexWiringBlocked',
  'keepDispatchWiringBlocked',
  'noHookExecution',
  'noMediaInput',
  'noArtifactOutput',
  'noWorkerDispatch',
  'noRouteToolProviderCalls',
  'noSupabaseSql',
  'noBetaUnlock',
  'noProductionUnlock',
]) {
  assert(phase38Register.phase38AllowedScope[key] === true, `phase38Register.phase38AllowedScope.${key} missing`)
}

assert(phase38Prompt.requiredSourceDecision === expectedDecision, 'Phase 38 prompt source mismatch')
assert(phase38Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 38 prompt source head mismatch')
assert(phase38Prompt.futureSourcePath === futureRuntimeSourcePath, 'Phase 38 prompt future path mismatch')
assert(phase38Prompt.allowedScope.createFailClosedRuntimeIntegrationSource === true, 'Phase 38 prompt creation scope missing')
for (const key of [
  'modifyIndexExportToday',
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
  assertFalse(phase38Prompt.allowedScope[key], `phase38Prompt.allowedScope.${key}`)
}
assert(phase38Prompt.supabaseClassification.updateRequired === 'no', 'Phase 38 prompt Supabase update must be no')

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-result',
)
assert(sourcePlan.decision === sourceDecision, 'Phase 37Z source-plan source decision missing')
assert(sourcePlan.sourceCreationPlanResult.sourceCreationPlanItemCount === 8, 'Phase 37Z source-plan count mismatch')
assert(sourcePlan.sourceCreationPlanResult.futureRuntimeIntegrationSourcePathPlanned === true, 'Phase 37Z path plan missing')
assertFalse(sourcePlan.sourceCreationPlanResult.runtimeSourceCreatedToday, 'Phase 37Z source-plan widened source creation')

assert(!fs.existsSync(path.join(repoRoot, futureRuntimeSourcePath)), 'Future runtime source must not exist in owner review')
const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript], 'Package script missing')
assert(
  packageJson.scripts[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37z-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review-diagnostics.mjs',
  'Package script command mismatch',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1730,
      sourceMergeCommit,
      acceptedSourceCreationPlanItemCount: acceptance.acceptedSourcePlan.sourceCreationPlanItemCountAccepted,
      futureRuntimeIntegrationSourcePath: futureRuntimeSourcePath,
      actualSourceCreationGateMayProceed: true,
      runtimeSourceCreatedToday: false,
      indexWiringApprovedToday: false,
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
