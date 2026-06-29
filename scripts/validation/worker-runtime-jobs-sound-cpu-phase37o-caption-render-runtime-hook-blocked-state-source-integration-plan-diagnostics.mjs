import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37o_caption_render_runtime_hook_blocked_state_source_integration_plan_completed_with_warnings_ready_for_blocked_state_source_integration_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37n_caption_render_runtime_hook_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_plan_no_media_no_artifacts'
const sourceMergeCommit = '984d7dfcaf7d1b2a288d90cc6628f9b4a347a4a9'
const phase37PDecision =
  'worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const futureIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-file-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-file-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
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
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-boundary-register',
)
const filePlan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-file-plan',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-safety-register',
)
const ownerReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
)
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-claim-policy')
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
)

assert(plan.decision === decision, 'Phase 37O decision mismatch')
assert(plan.sourceVerification.sourcePr === 1652, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.blockedStateSourceIntegrationPlan.planOnly === true, 'Plan-only flag missing')
assert(
  plan.blockedStateSourceIntegrationPlan.futureHookSourcePath === hookSourcePath,
  'Future hook source path mismatch',
)
assert(plan.blockedStateSourceIntegrationPlan.futureIndexExportPath === indexPath, 'Future index path mismatch')
assert(
  plan.blockedStateSourceIntegrationPlan.futureBlockedStateIntegrationPath === futureIntegrationPath,
  'Future integration path mismatch',
)
assertFalse(
  plan.blockedStateSourceIntegrationPlan.futureIntegrationFileCreatedInThisGate,
  'Future integration file created flag',
)
for (const key of [
  'actualSourceIntegrationApprovedToday',
  'hookExecutionApprovedToday',
  'realMediaInputApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(plan.blockedStateSourceIntegrationPlan[key], `plan.blockedStateSourceIntegrationPlan.${key}`)
}
assert(plan.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(plan.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(boundary.sourceDecision === sourceDecision, 'Boundary source mismatch')
assert(boundary.boundaryReviewed.hookSourcePath === hookSourcePath, 'Boundary hook source mismatch')
assert(boundary.boundaryReviewed.indexExportPath === indexPath, 'Boundary index mismatch')
assert(boundary.boundaryReviewed.hookFactoryExported === true, 'Hook factory export missing')
assert(boundary.boundaryReviewed.blockedAssertionExported === true, 'Blocked assertion export missing')
assert(boundary.boundaryReviewed.blockedResultStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(boundary.boundaryReviewed.sourceStatus === 'source_created_execution_blocked', 'Source status mismatch')
assert(boundary.futureBoundary.plannedIntegrationPath === futureIntegrationPath, 'Future boundary path mismatch')
assertFalse(boundary.futureBoundary.createdInThisGate, 'boundary.futureBoundary.createdInThisGate')
assertFalse(boundary.futureBoundary.runtimeEntrypointWiredInThisGate, 'runtimeEntrypointWiredInThisGate')
assertFalse(boundary.futureBoundary.workerDispatchWiredInThisGate, 'workerDispatchWiredInThisGate')
assertFalse(boundary.futureBoundary.routeOrToolWiredInThisGate, 'routeOrToolWiredInThisGate')

assert(filePlan.planOnly === true, 'File plan must be plan-only')
assert(filePlan.existingFiles.some((file) => file.path === hookSourcePath && file.modifiedInThisGate === false), 'Hook file plan missing')
assert(filePlan.existingFiles.some((file) => file.path === indexPath && file.modifiedInThisGate === false), 'Index file plan missing')
assert(
  filePlan.futureFiles.some((file) => file.path === futureIntegrationPath && file.createdInThisGate === false),
  'Future integration file plan missing',
)
for (const key of [
  'runtimeSourceCreated',
  'runtimeSourceModified',
  'indexExportModified',
  'temporaryProofFileCreated',
  'packageRuntimeWiringCreated',
]) {
  assertFalse(filePlan.sourceChangesInThisGate[key], `filePlan.sourceChangesInThisGate.${key}`)
}

assert(safety.sourceDecision === decision, 'Safety decision mismatch')
assert(safety.safetyControls.docsDiagnosticsOnly === true, 'Docs diagnostics flag missing')
assert(safety.safetyControls.futureIntegrationSourceMustRemainAbsentUntilOwnerReview === true, 'Future source absent flag missing')
for (const key of [
  'hookExecutionAllowed',
  'mediaInputAllowed',
  'ocrInferenceAllowed',
  'captionRenderExecutionAllowed',
  'artifactWriteAllowed',
  'workerDispatchAllowed',
  'routeExecutionAllowed',
  'toolExecutionAllowed',
  'providerModelAllowed',
  'supabaseSqlAllowed',
  'storageAllowed',
  'betaUnlockAllowed',
  'productionUnlockAllowed',
]) {
  assertFalse(safety.safetyControls[key], `safety.safetyControls.${key}`)
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

assert(ownerReview.decision === decision, 'Owner-review readiness decision mismatch')
assert(ownerReview.ownerReviewReady === true, 'Owner review must be ready')
assert(ownerReview.ownerReviewScope.reviewFutureBlockedStateIntegrationPath === true, 'Owner review path scope missing')
assertFalse(ownerReview.ownerReviewScope.approveActualSourceCreation, 'approveActualSourceCreation')
assertFalse(ownerReview.ownerReviewScope.approveRuntimeExecution, 'approveRuntimeExecution')
assert(ownerReview.sourceEvidence.phase37NOwnerReviewPr === 1652, 'Owner-review source PR mismatch')
assert(ownerReview.sourceEvidence.phase37NOwnerReviewMergeCommit === sourceMergeCommit, 'Owner-review source merge mismatch')
assert(ownerReview.sourceEvidence.phase37NOwnerReviewDecision === sourceDecision, 'Owner-review source decision mismatch')

assert(claimPolicy.allowedClaims.phase37OPlanCompleted === true, 'Allowed Phase 37O claim missing')
assert(claimPolicy.allowedClaims.blockedStateSourceIntegrationPlanningReadyForOwnerReview === true, 'Allowed owner-review claim missing')
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
assert(nextPrompt.allowedScope.ownerReviewOnly === true, 'Next prompt owner-review scope missing')
assert(nextPrompt.allowedScope.noActualSourceCreation === true, 'Next prompt no source creation scope missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution scope missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37NReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review',
)
assert(phase37NReview.decision === sourceDecision, 'Phase 37N owner-review source decision missing')

const phase37OReadiness = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-readiness-register.md',
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-readiness-register',
)
assert(phase37OReadiness.phase37OMayProceed === true, 'Phase 37O inherited readiness missing')
assert(phase37OReadiness.sourceDecision === sourceDecision, 'Phase 37O inherited readiness source mismatch')

const hookSource = readText(hookSourcePath)
assert(
  hookSource.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'),
  'Hook blocked-result factory missing',
)
assert(
  hookSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'),
  'Hook blocked assertion missing',
)
assert(hookSource.includes('blocked_by_owner_gate'), 'Hook blocked owner-gate status missing')
const indexSource = readText(indexPath)
assert(indexSource.includes('./runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'), 'Index export missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
if (fs.existsSync(path.join(repoRoot, futureIntegrationPath))) {
  const phase37PResult = parseJsonBlock(
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-result.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-result',
  )
  assert(phase37PResult.decision === phase37PDecision, 'Phase 37P decision required when future source exists')
  assert(
    phase37PResult.sourceCreated.integrationSourcePath === futureIntegrationPath,
    'Phase 37P integration source path mismatch',
  )
  assertFalse(phase37PResult.sourceCreated.hookExecutionApprovedToday, 'Phase 37P hook execution approval')
  assertFalse(phase37PResult.sourceCreated.realMediaInputApprovedToday, 'Phase 37P media input approval')
  assertFalse(phase37PResult.sourceCreated.artifactCreationApprovedToday, 'Phase 37P artifact approval')
}

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1652,
      sourceMergeCommit,
      futureIntegrationPath,
      futureIntegrationFileCreatedInThisGate: false,
      hookExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37O-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-PLAN-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
