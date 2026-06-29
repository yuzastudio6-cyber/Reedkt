import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37o_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_source_creation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37o_caption_render_runtime_hook_blocked_state_source_integration_plan_completed_with_warnings_ready_for_blocked_state_source_integration_owner_review_no_media_no_artifacts'
const inheritedDecision =
  'worker_runtime_jobs_sound_cpu_phase37n_caption_render_runtime_hook_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_plan_no_media_no_artifacts'
const sourceMergeCommit = '96782b19f331918f8751ad445f669620c83f9f44'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const futureIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-creation-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-creation-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-creation.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-creation',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) {
    throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  }
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

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-creation-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-creation',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1657, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewDecision.phase37OPlanAccepted === true, 'Phase 37O plan acceptance missing')
assert(review.reviewDecision.futureBlockedStateSourceCreationMayProceed === true, 'Future source creation approval missing')
assert(review.reviewDecision.futureSourcePathAccepted === futureIntegrationPath, 'Future source path mismatch')
assert(review.reviewDecision.existingHookSourcePathAccepted === hookSourcePath, 'Hook source path mismatch')
assert(review.reviewDecision.existingIndexExportPathAccepted === indexPath, 'Index path mismatch')
for (const key of [
  'actualSourceCreationApprovedToday',
  'runtimeExecutionApprovedToday',
  'realMediaInputApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(review.reviewDecision[key], `review.reviewDecision.${key}`)
}
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37OSourcePr === 1657, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37OSourceDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37NSourceDecision === inheritedDecision, 'Inherited source decision mismatch')
assert(acceptance.acceptedEvidence.futureIntegrationPathPlanned === true, 'Future path planning acceptance missing')
assert(acceptance.acceptedEvidence.temporaryProofFileAbsent === true, 'Temp proof absence missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.futureBlockedStateSourceCreationGate === true, 'Future source gate acceptance missing')
for (const key of ['runtimeExecution', 'realMediaProcessing', 'artifactDelivery', 'supabaseSql', 'realUserMediaBeta', 'paidProduction']) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(readiness.sourceDecision === decision, 'Phase 37P readiness source mismatch')
assert(readiness.phase37PMayProceed === true, 'Phase 37P may proceed missing')
assert(readiness.phase37PAllowedScope.sourceCreationOnly === true, 'Source creation scope missing')
assert(readiness.phase37PAllowedScope.createBlockedStateIntegrationSource === true, 'Blocked-state source creation missing')
assert(readiness.phase37PAllowedScope.noHookExecution === true, 'No hook execution flag missing')
for (const key of [
  'realMediaExecution',
  'ocrInference',
  'captionRenderRuntimeExecutionOverMedia',
  'workerExecution',
  'artifactCreation',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assert(readiness.phase37PStillBlocked[key] === true, `readiness.phase37PStillBlocked.${key} must be true`)
}

assert(safety.sourceDecision === decision, 'Safety source decision mismatch')
assert(safety.sourceCreationSafety.allowedNextStep === 'blocked-state integration source creation', 'Allowed next step mismatch')
assert(safety.sourceCreationSafety.futureIntegrationSourceMustRemainFailClosed === true, 'Future integration fail-closed flag missing')
for (const key of [
  'actualRuntimeWiringAllowed',
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
  assertFalse(safety.sourceCreationSafety[key], `safety.sourceCreationSafety.${key}`)
}
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(blocker.ownerReviewPassedWithWarnings === true, 'Owner review warning pass missing')
assert(blocker.remainingBlocked.includes('runtime hook execution'), 'Runtime hook blocker missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker missing')
assert(
  blocker.blockerPrompts.nextSourceCreationPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37P-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-SOURCE-CREATION',
  'Next source creation prompt mismatch',
)

assert(claimPolicy.allowedClaims.phase37OPlanOwnerReviewPassed === true, 'Owner review claim missing')
assert(claimPolicy.allowedClaims.phase37PSourceCreationMayProceed === true, 'Phase 37P claim missing')
for (const key of [
  'actualSourceIntegrationCreated',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'dockerImageReadiness',
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

assert(nextPrompt.requiredSourceDecision === decision, 'Next prompt source decision mismatch')
assert(nextPrompt.allowedScope.sourceCreationOnly === true, 'Next prompt source creation scope missing')
assert(nextPrompt.allowedScope.createBlockedStateIntegrationSource === true, 'Next prompt integration creation scope missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assert(nextPrompt.allowedScope.noMediaInput === true, 'Next prompt no media missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37OPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan',
)
assert(phase37OPlan.decision === sourceDecision, 'Phase 37O source plan decision missing')
assert(phase37OPlan.blockedStateSourceIntegrationPlan.futureBlockedStateIntegrationPath === futureIntegrationPath, 'Source plan future path mismatch')
assert(phase37OPlan.blockedStateSourceIntegrationPlan.futureIntegrationFileCreatedInThisGate === false, 'Source plan must not have created future file')

const phase37OReadiness = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register.md',
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
)
assert(phase37OReadiness.ownerReviewReady === true, 'Phase 37O owner-review readiness missing')

const hookSource = readText(hookSourcePath)
assert(hookSource.includes('blocked_by_owner_gate'), 'Hook blocked owner-gate status missing')
const indexSource = readText(indexPath)
assert(indexSource.includes('./runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'), 'Index export missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
assert(!fs.existsSync(path.join(repoRoot, futureIntegrationPath)), 'Future integration source must not exist before Phase 37P')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1657,
      sourceMergeCommit,
      phase37PSourceCreationMayProceed: true,
      actualSourceCreationApprovedToday: false,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37P-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
