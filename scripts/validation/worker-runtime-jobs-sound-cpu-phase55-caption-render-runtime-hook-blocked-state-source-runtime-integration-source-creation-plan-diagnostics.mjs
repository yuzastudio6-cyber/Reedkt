import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase55_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_completed_with_warnings_ready_for_source_creation_plan_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase54_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_plan_owner_review_passed_with_warnings_ready_for_source_creation_plan_no_media_no_artifacts'
const sourceHead = 'b74e6c44c44ba513a1e488b70fb94e8cbf7bbc3f'
const sourceMergeCommit = '6529e6f110afb1e9738ed96d1442778c3883c869'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE55-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-SOURCE-CREATION-PLAN-OWNER-REVIEW'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-path-register.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-path-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-change-plan.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-change-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-guardrail-register.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-guardrail-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review',
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
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-result',
)
const paths = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-path-register',
)
const changes = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-change-plan',
)
const guardrails = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-guardrail-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 55 decision mismatch')
assert(plan.sourceVerification.sourcePr === 1833, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(plan.sourceCreationPlanResult.phase54OwnerReviewAccepted, 'Phase 54 owner review acceptance missing')
assertTrue(plan.sourceCreationPlanResult.sourceCreationPlanCreated, 'Source creation plan flag missing')
assert(plan.sourceCreationPlanResult.plannedSourceChangeCount === 6, 'Planned source change count mismatch')
assertTrue(plan.sourceCreationPlanResult.existingBlockedSourceInspected, 'Blocked source inspection missing')
assertTrue(plan.sourceCreationPlanResult.existingRuntimeIntegrationSourceInspected, 'Runtime integration source inspection missing')
assertTrue(plan.sourceCreationPlanResult.existingIndexExportInspected, 'Index export inspection missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
  'runtimeSourceModifiedToday',
  'indexWiringChangedToday',
  'dispatchWiringChangedToday',
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
  assertFalse(plan.sourceCreationPlanResult[key], `plan.sourceCreationPlanResult.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(plan.supabaseClassification, 'plan')

assert(paths.sourcePaths.existingBlockedStateIntegrationSource === blockedSourcePath, 'Blocked source path mismatch')
assert(paths.sourcePaths.existingRuntimeIntegrationSource === runtimeIntegrationPath, 'Runtime integration path mismatch')
assert(paths.sourcePaths.existingIntegrationTarget === indexPath, 'Index path mismatch')
assert(paths.sourcePaths.futureSourceCreationCandidate === runtimeIntegrationPath, 'Future source path mismatch')
assert(paths.sourcePaths.futureExportCandidate === indexPath, 'Future export path mismatch')
assertTrue(paths.pathStatusToday.existingBlockedStateIntegrationSourceExists, 'Blocked source existence missing')
assertTrue(paths.pathStatusToday.existingRuntimeIntegrationSourceExists, 'Runtime integration existence missing')
assertTrue(paths.pathStatusToday.existingIntegrationTargetExists, 'Index target existence missing')
assertTrue(paths.pathStatusToday.existingRuntimeIntegrationSourceStillFailClosed, 'Runtime source fail-closed status missing')
for (const key of [
  'futureSourceCreationApprovedToday',
  'futureSourceModificationApprovedToday',
  'futureIndexWiringApprovedToday',
  'futureDispatchWiringApprovedToday',
]) {
  assertFalse(paths.pathStatusToday[key], `paths.pathStatusToday.${key}`)
}
assertTrue(paths.pathPolicy.allowedToInspectExistingSource, 'Path inspection policy missing')
assertTrue(paths.pathPolicy.allowedToPlanFutureSourceChanges, 'Future source planning policy missing')
for (const key of [
  'allowedToCreateOrModifySourceToday',
  'allowedToWireDispatchToday',
  'allowedToExecuteSourceToday',
]) {
  assertFalse(paths.pathPolicy[key], `paths.pathPolicy.${key}`)
}

assert(changes.plannedSourceChangeCount === 6, 'Change plan count mismatch')
assert(changes.plannedSourceChanges.length === 6, 'Change plan item length mismatch')
for (const item of changes.plannedSourceChanges) {
  assert(item.id, 'Change item id missing')
  assert(item.targetPath === runtimeIntegrationPath || item.targetPath === indexPath, `${item.id} target path mismatch`)
  assertFalse(item.sourceChangeApprovedToday, `changes.${item.id}.sourceChangeApprovedToday`)
}
assertFalse(changes.sourceChangesApprovedToday, 'changes.sourceChangesApprovedToday')

assertTrue(guardrails.guardrails.docsDiagnosticsOnlyToday, 'Docs diagnostics guardrail missing')
assertTrue(guardrails.guardrails.sourcePlanningOnlyToday, 'Source planning guardrail missing')
for (const key of [
  'sourceCodeChangedToday',
  'runtimeSourceCreatedToday',
  'runtimeSourceModifiedToday',
  'indexWiringChangedToday',
  'dispatchWiringChangedToday',
  'runtimeExecutionApprovedToday',
  'hookExecutionApprovedToday',
  'realMediaInputApprovedToday',
  'captionRenderOverMediaApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(guardrails.guardrails[key], `guardrails.guardrails.${key}`)
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
  assertFalse(guardrails.mustRemainFalse[key], `guardrails.mustRemainFalse.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase55_runtime_integration_source_creation_plan_pending'),
  'Phase 55 source-creation planning blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase55_runtime_integration_source_creation_plan_owner_review_pending',
  ),
  'Phase 55 owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_over_media_pending'),
  'Runtime execution blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase55SourceCreationPlanCompleted, 'Phase 55 claim missing')
assertTrue(claimPolicy.allowedClaims.sourceCreationPlanOwnerReviewMayProceed, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.plannedSourceChangeCount === 6, 'Claim planned count mismatch')
assertFalse(claimPolicy.allowedClaims.runtimeSourceCreatedToday, 'Claim runtime source created must be false')
assertFalse(claimPolicy.allowedClaims.runtimeSourceModifiedToday, 'Claim runtime source modified must be false')
assertFalse(claimPolicy.allowedClaims.indexWiringChangedToday, 'Claim index wiring changed must be false')
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

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(
  ownerPrompt.expectedNextDecision ===
    'worker_runtime_jobs_sound_cpu_phase55_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_owner_review_passed_with_warnings_ready_for_runtime_source_modification_gate_no_media_no_artifacts',
  'Owner prompt next decision mismatch',
)
assertTrue(ownerPrompt.allowedScope.reviewPhase55SourceCreationPlan, 'Owner prompt review scope missing')
assertTrue(ownerPrompt.allowedScope.acceptFutureRuntimeSourceModificationPlanning, 'Owner prompt future modification scope missing')
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
  assertFalse(ownerPrompt.allowedScope[key], `ownerPrompt.allowedScope.${key}`)
}
assertNoop(ownerPrompt.supabaseClassification, 'ownerPrompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase55-caption-render-runtime-hook-blocked-state-source-runtime-integration-source-creation-plan-diagnostics.mjs',
  'Package script missing',
)

const blockedSource = readText(blockedSourcePath)
const runtimeSource = readText(runtimeIntegrationPath)
const indexSource = readText(indexPath)
assert(
  blockedSource.includes('blocked_by_owner_gate') &&
    blockedSource.includes('runtimeExecutionApproved: false') &&
    blockedSource.includes('mediaProcessingApproved: false') &&
    blockedSource.includes('artifactCreationApproved: false'),
  'Blocked-state source must remain fail-closed',
)
assert(
  runtimeSource.includes('runtime_integration_source_created_execution_blocked') &&
    runtimeSource.includes('blocked_by_owner_gate') &&
    runtimeSource.includes('runtimeExecutionApproved: false') &&
    runtimeSource.includes('workerExecutionApproved: false') &&
    runtimeSource.includes('renderExecutionApproved: false') &&
    runtimeSource.includes('mediaProcessingApproved: false') &&
    runtimeSource.includes('artifactCreationApproved: false') &&
    runtimeSource.includes('supabaseSqlApproved: false') &&
    runtimeSource.includes('realUserMediaBetaApproved: false') &&
    runtimeSource.includes('paidProductionApproved: false') &&
    runtimeSource.includes('noArtifactCreated: true') &&
    runtimeSource.includes('throw new Error'),
  'Runtime integration source must remain fail-closed',
)
assert(
  indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult') &&
    !indexSource.includes('dispatchSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegration'),
  'Index must export static fail-closed helpers without dispatch wiring',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1833,
      sourceHead,
      sourceMergeCommit,
      plannedSourceChangeCount: changes.plannedSourceChangeCount,
      sourceChangesApprovedToday: false,
      runtimeSourceCreatedToday: false,
      runtimeSourceModifiedToday: false,
      indexWiringChangedToday: false,
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
