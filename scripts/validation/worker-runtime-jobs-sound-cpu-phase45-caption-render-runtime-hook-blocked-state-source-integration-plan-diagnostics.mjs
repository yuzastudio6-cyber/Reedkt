import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase45_caption_render_runtime_hook_blocked_state_source_integration_plan_completed_with_warnings_ready_for_blocked_state_source_integration_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase44_caption_render_runtime_hook_blocked_state_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_plan_no_media_no_artifacts'
const sourceHead = '750b58bfa0f1c74c029ae0d311cf9cb916a31947'
const sourceMergeCommit = 'dd15108e1dbfbdf9e5e4cb30fb8b6093ec6dd8d5'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const blockedStateIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-file-plan.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-file-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-boundary-register',
)
const filePlan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-file-plan',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-safety-register',
)
const ownerReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
)
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-claim-policy')
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
)

assert(plan.decision === decision, 'Phase 45 decision mismatch')
assert(plan.sourceVerification.sourcePr === 1768, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.blockedStateSourceIntegrationPlan.planOnly === true, 'Plan-only flag missing')
assert(plan.blockedStateSourceIntegrationPlan.existingHookSourcePath === hookSourcePath, 'Hook source path mismatch')
assert(
  plan.blockedStateSourceIntegrationPlan.existingBlockedStateIntegrationPath === blockedStateIntegrationPath,
  'Blocked-state integration path mismatch',
)
assert(
  plan.blockedStateSourceIntegrationPlan.existingRuntimeIntegrationPath === runtimeIntegrationPath,
  'Runtime integration path mismatch',
)
assert(plan.blockedStateSourceIntegrationPlan.existingIndexExportPath === indexPath, 'Index path mismatch')
assert(
  plan.blockedStateSourceIntegrationPlan.existingBlockedStateIntegrationSourceReviewed === true,
  'Blocked-state integration source review missing',
)
assert(
  plan.blockedStateSourceIntegrationPlan.existingRuntimeIntegrationSourceReviewed === true,
  'Runtime integration source review missing',
)
assert(plan.blockedStateSourceIntegrationPlan.existingIndexExportsReviewed === true, 'Index review missing')
for (const key of [
  'newSourceCreatedInThisGate',
  'sourceModifiedInThisGate',
  'runtimeWiringCreatedInThisGate',
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
assert(plan.blockedStateSourceIntegrationPlan.ownerReviewRequiredBeforeAnySourceChange === true, 'Owner review requirement missing')
assertSupabaseNoop(plan.supabaseClassification, 'plan')

assert(boundary.sourceDecision === sourceDecision, 'Boundary source mismatch')
assert(boundary.boundaryReviewed.hookSourcePath === hookSourcePath, 'Boundary hook source mismatch')
assert(
  boundary.boundaryReviewed.blockedStateIntegrationSourcePath === blockedStateIntegrationPath,
  'Boundary blocked-state path mismatch',
)
assert(boundary.boundaryReviewed.runtimeIntegrationSourcePath === runtimeIntegrationPath, 'Boundary runtime path mismatch')
assert(boundary.boundaryReviewed.indexExportPath === indexPath, 'Boundary index mismatch')
for (const key of [
  'hookFactoryExported',
  'hookBlockedAssertionExported',
  'blockedStateIntegrationFactoryExported',
  'blockedStateIntegrationAssertionExported',
  'runtimeIntegrationFactoryExported',
  'runtimeIntegrationAssertionExported',
  'runtimeDisabledFlagsRequired',
  'noArtifactCreatedFlagRequired',
]) {
  assert(boundary.boundaryReviewed[key] === true, `Boundary flag missing: ${key}`)
}
assert(boundary.boundaryReviewed.blockedResultStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(boundary.boundaryReviewed.hookSourceStatus === 'source_created_execution_blocked', 'Hook source status mismatch')
assert(
  boundary.boundaryReviewed.blockedStateIntegrationStatus === 'blocked_state_source_created_execution_blocked',
  'Blocked-state status mismatch',
)
assert(
  boundary.boundaryReviewed.runtimeIntegrationStatus === 'runtime_integration_source_created_execution_blocked',
  'Runtime integration status mismatch',
)
assert(boundary.boundaryReviewed.ownerGateRequired === 'sound_cpu_runtime_owner_gate', 'Owner gate mismatch')
assertFalse(boundary.futureBoundary.newSourceCreatedInThisGate, 'futureBoundary.newSourceCreatedInThisGate')
assertFalse(boundary.futureBoundary.sourceModifiedInThisGate, 'futureBoundary.sourceModifiedInThisGate')
assertFalse(boundary.futureBoundary.runtimeEntrypointWiredInThisGate, 'runtimeEntrypointWiredInThisGate')
assertFalse(boundary.futureBoundary.workerDispatchWiredInThisGate, 'workerDispatchWiredInThisGate')
assertFalse(boundary.futureBoundary.routeOrToolWiredInThisGate, 'routeOrToolWiredInThisGate')

assert(filePlan.planOnly === true, 'File plan must be plan-only')
for (const expectedPath of [hookSourcePath, blockedStateIntegrationPath, runtimeIntegrationPath, indexPath]) {
  assert(
    filePlan.existingFiles.some((file) => file.path === expectedPath && file.modifiedInThisGate === false),
    `File plan missing unchanged file: ${expectedPath}`,
  )
}
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
assert(safety.safetyControls.staticBoundaryInspectionOnly === true, 'Static boundary flag missing')
assert(safety.safetyControls.temporaryProofFileMustRemainAbsent === true, 'Temp proof absence flag missing')
assert(safety.safetyControls.ownerReviewRequiredBeforeAnySourceChange === true, 'Owner review requirement missing')
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
assert(ownerReview.ownerReviewScope.reviewExistingHookSource === true, 'Owner review hook scope missing')
assert(
  ownerReview.ownerReviewScope.reviewExistingBlockedStateIntegrationSource === true,
  'Owner review blocked-state scope missing',
)
assert(
  ownerReview.ownerReviewScope.reviewExistingRuntimeIntegrationSource === true,
  'Owner review runtime integration scope missing',
)
assertFalse(ownerReview.ownerReviewScope.approveActualSourceChange, 'approveActualSourceChange')
assertFalse(ownerReview.ownerReviewScope.approveRuntimeExecution, 'approveRuntimeExecution')
assert(ownerReview.sourceEvidence.phase44OwnerReviewPr === 1768, 'Owner-review source PR mismatch')
assert(ownerReview.sourceEvidence.phase44OwnerReviewMergeCommit === sourceMergeCommit, 'Owner-review source merge mismatch')
assert(ownerReview.sourceEvidence.phase44OwnerReviewDecision === sourceDecision, 'Owner-review source decision mismatch')

assert(claimPolicy.allowedClaims.phase45PlanCompleted === true, 'Allowed Phase 45 claim missing')
assert(
  claimPolicy.allowedClaims.blockedStateSourceIntegrationPlanningReadyForOwnerReview === true,
  'Allowed owner-review readiness claim missing',
)
for (const key of [
  'actualSourceIntegrationCreated',
  'sourceModifiedInThisGate',
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
assert(nextPrompt.allowedScope.reviewExistingBlockedStateSourceIntegration === true, 'Next prompt source review scope missing')
assert(nextPrompt.allowedScope.noActualSourceCreation === true, 'Next prompt no source creation scope missing')
assert(nextPrompt.allowedScope.noSourceModification === true, 'Next prompt no source modification scope missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution scope missing')
assertSupabaseNoop(nextPrompt.supabaseClassification, 'nextPrompt')

const phase44Review = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan-owner-review',
)
assert(phase44Review.decision === sourceDecision, 'Phase 44 owner-review source decision missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

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
assert(hookSource.includes('runtimeExecutionApproved: false'), 'Hook runtime approval must remain false')
assert(hookSource.includes('artifactCreationApproved: false'), 'Hook artifact approval must remain false')

const blockedStateSource = readText(blockedStateIntegrationPath)
assert(
  blockedStateSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'),
  'Blocked-state integration factory missing',
)
assert(
  blockedStateSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Blocked-state integration blocked assertion missing',
)
assert(
  blockedStateSource.includes('blocked_state_source_created_execution_blocked'),
  'Blocked-state source status missing',
)
assert(blockedStateSource.includes('runtimeExecutionApproved: false'), 'Blocked-state runtime approval must remain false')
assert(blockedStateSource.includes('artifactCreationApproved: false'), 'Blocked-state artifact approval must remain false')
assert(blockedStateSource.includes('supabaseSqlApproved: false'), 'Blocked-state Supabase approval must remain false')

const runtimeSource = readText(runtimeIntegrationPath)
assert(
  runtimeSource.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'),
  'Runtime integration factory missing',
)
assert(
  runtimeSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'),
  'Runtime integration blocked assertion missing',
)
assert(
  runtimeSource.includes('runtime_integration_source_created_execution_blocked'),
  'Runtime integration source status missing',
)
assert(runtimeSource.includes('runtimeExecutionApproved: false'), 'Runtime execution must remain false')
assert(runtimeSource.includes('artifactCreationApproved: false'), 'Runtime artifact approval must remain false')
assert(runtimeSource.includes('realUserMediaBetaApproved: false'), 'Real-user beta must remain false')
assert(runtimeSource.includes('paidProductionApproved: false'), 'Paid production must remain false')

const indexSource = readText(indexPath)
for (const expected of [
  './runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts',
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
]) {
  assert(indexSource.includes(expected), `Index export missing: ${expected}`)
}

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1768,
      sourceHead,
      sourceMergeCommit,
      existingBlockedStateIntegrationPath: blockedStateIntegrationPath,
      existingRuntimeIntegrationPath: runtimeIntegrationPath,
      newSourceCreatedInThisGate: false,
      sourceModifiedInThisGate: false,
      hookExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE45-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-PLAN-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
