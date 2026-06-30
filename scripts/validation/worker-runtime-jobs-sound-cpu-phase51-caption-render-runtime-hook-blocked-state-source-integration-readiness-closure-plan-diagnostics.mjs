import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase51_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_plan_completed_with_warnings_ready_for_closure_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase50_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_source_integration_readiness_closure_plan_no_media_no_artifacts'
const phase50PlanDecision =
  'worker_runtime_jobs_sound_cpu_phase50_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_completed_with_warnings_ready_for_source_integration_readiness_owner_review_no_media_no_artifacts'
const sourceHead = '35d821603b4eca058d5843b2f9e52ac0e4e2be70'
const sourceMergeCommit = 'e01d0deba5c861646989907b0b750c44310cdd25'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE51-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-CLOSURE-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-source-register.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-source-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-boundary-checklist.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-boundary-checklist',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review',
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

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
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
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-result',
)
const sourceRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-source-register',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-boundary-checklist',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 51 decision mismatch')
assert(plan.sourceVerification.sourcePr === 1806, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'phase50OwnerReviewAccepted',
  'phase51ClosureRegisterConsumed',
  'blockedStateSourceExists',
  'indexExportsExist',
  'temporaryProofFileAbsent',
  'failClosedFactoryPresent',
  'failClosedAssertionPresent',
  'runtimeDisabledFlagsStillRequired',
  'sourceIntegrationReadinessClosureEvidenceComplete',
  'closureOwnerReviewMayProceed',
]) {
  assertTrue(plan.closureResult[key], `plan.closureResult.${key}`)
}
for (const key of [
  'sourceIntegrationApprovedToday',
  'runtimeIntegrationApprovedToday',
  'realMediaIntegrationApprovedToday',
  'artifactIntegrationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(plan.closureResult[key], `plan.closureResult.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(plan.supabaseClassification, 'plan')

assert(sourceRegister.decision === expectedDecision, 'Source register decision mismatch')
assert(
  sourceRegister.acceptedSources.some(
    (source) => source.sourceId === 'phase50_owner_review' && source.decision === sourceDecision,
  ),
  'Phase 50 owner-review source missing',
)
assert(
  sourceRegister.acceptedSources.some(
    (source) => source.sourceId === 'phase50_source_readiness_plan' && source.decision === phase50PlanDecision,
  ),
  'Phase 50 source-readiness plan source missing',
)
assert(
  sourceRegister.acceptedSources.some((source) => source.sourceId === 'phase51_prompt_register'),
  'Phase 51 prompt register source missing',
)
assert(sourceRegister.sourceFilesReviewed.integrationTarget === indexPath, 'Source register target mismatch')
assert(sourceRegister.sourceFilesReviewed.integrationSourcePath === blockedSourcePath, 'Source register path mismatch')
assert(
  sourceRegister.sourceFilesReviewed.runtimeIntegrationSourcePath === runtimeIntegrationSourcePath,
  'Runtime source path mismatch',
)
assert(sourceRegister.sourceFilesReviewed.hookSourcePath === hookSourcePath, 'Hook source path mismatch')
assert(sourceRegister.sourceFilesReviewed.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assertTrue(sourceRegister.sourceFilesReviewed.temporaryProofFileExpectedAbsent, 'Temp proof absence expectation missing')
assertTrue(sourceRegister.sourceUseLimits.staticBoundaryInspection, 'Static boundary inspection missing')
assertTrue(sourceRegister.sourceUseLimits.metadataClosureOnly, 'Metadata closure limit missing')
for (const key of [
  'runtimeExecutionAuthorization',
  'sourceIntegrationAuthorization',
  'mediaInputAuthorization',
  'artifactOutputAuthorization',
  'workerDispatchAuthorization',
  'supabaseSqlAuthorization',
  'betaProductionAuthorization',
]) {
  assertFalse(sourceRegister.sourceUseLimits[key], `sourceRegister.sourceUseLimits.${key}`)
}

for (const [key, value] of Object.entries(boundary.closureChecklist)) {
  assertTrue(value, `Closure checklist item: ${key}`)
}
for (const [key, value] of Object.entries(boundary.notClosedByThisPacket)) {
  assertTrue(value, `Not-closed item: ${key}`)
}
assert(boundary.closureOwnerReviewFocus.length === 3, 'Owner-review focus must list three items')

assertTrue(safety.allowedActions.docsDiagnosticsOnly, 'Docs diagnostics scope missing')
assertTrue(safety.allowedActions.staticBoundaryInspection, 'Static inspection scope missing')
assertTrue(safety.allowedActions.sourceIntegrationReadinessClosurePlanning, 'Closure planning scope missing')
for (const [key, value] of Object.entries(safety.blockedActions)) {
  assertTrue(value, `Blocked action must remain true: ${key}`)
}
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'artifactReadiness',
  'sourceIntegrationReadinessUnlock',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase51_source_integration_readiness_closure_plan_pending'),
  'Phase 51 closure-plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase51_source_integration_readiness_closure_owner_review_pending',
  ),
  'Phase 51 owner-review blocker missing',
)
assertFalse(blockers.betaProductionStatus.realUserMediaBetaAllowed, 'blockers.realUserMediaBetaAllowed')
assertFalse(blockers.betaProductionStatus.paidProductionAllowed, 'blockers.paidProductionAllowed')

assertTrue(claimPolicy.allowedClaims.phase51ClosurePlanCreated, 'Closure plan claim missing')
assertTrue(claimPolicy.allowedClaims.staticBoundaryChecklistCreated, 'Boundary checklist claim missing')
assertTrue(claimPolicy.allowedClaims.phase50OwnerReviewConsumed, 'Phase 50 source claim missing')
assertTrue(claimPolicy.allowedClaims.closureOwnerReviewMayProceed, 'Owner-review next claim missing')
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'artifactReadiness',
  'sourceIntegrationReadinessUnlock',
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
assert(claimPolicy.noScopeStatement.includes('no real media'), 'No-scope statement must mention no real media')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.integrationTarget === indexPath, 'Owner prompt target mismatch')
assert(ownerPrompt.integrationSourcePath === blockedSourcePath, 'Owner prompt source path mismatch')
assertTrue(ownerPrompt.reviewFocus.phase50OwnerReviewConsumed, 'Owner prompt source focus missing')
assertTrue(ownerPrompt.reviewFocus.staticBoundaryChecklistAccepted, 'Owner prompt checklist focus missing')
assertTrue(ownerPrompt.reviewFocus.blockedStateSourceStillFailClosed, 'Owner prompt fail-closed focus missing')
assertTrue(ownerPrompt.reviewFocus.temporaryProofFileAbsent, 'Owner prompt temp absence missing')
assertTrue(ownerPrompt.reviewFocus.closurePlanMetadataOnly, 'Owner prompt metadata-only focus missing')
for (const key of [
  'realMediaAllowed',
  'artifactCreationAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(ownerPrompt.reviewFocus[key], `ownerPrompt.reviewFocus.${key}`)
}
assertNoop(ownerPrompt.supabaseClassification, 'owner prompt')

const phase50OwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)
assert(phase50OwnerReview.decision === sourceDecision, 'Phase 50 owner-review decision missing')
assertTrue(
  phase50OwnerReview.reviewedPlan.sourceIntegrationReadinessClosurePlanningMayProceed,
  'Phase 50 did not allow closure planning',
)

const phase50Plan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)
assert(phase50Plan.decision === phase50PlanDecision, 'Phase 50 plan decision missing')
assertFalse(phase50Plan.sourceIntegrationReadinessPlan.runtimeIntegrationApprovedToday, 'Phase 50 widened runtime')

const phase51Register = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register.md',
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register',
)
assert(phase51Register.sourceDecision === sourceDecision, 'Phase 51 register source mismatch')
assertTrue(phase51Register.phase51MayProceed, 'Phase 51 register does not allow planning')
assertTrue(phase51Register.phase51AllowedScope.noHookExecution, 'Phase 51 hook execution scope widened')
assertTrue(phase51Register.phase51StillBlocked.realUserMediaBeta, 'Phase 51 real-user beta blocker missing')
assertTrue(phase51Register.phase51StillBlocked.paidProduction, 'Phase 51 production blocker missing')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('renderExecutionApproved: false'), 'Render execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Supabase SQL false missing')
assert(blockedSource.includes('noArtifactCreated: true'), 'No artifact created flag missing')
assert(
  blockedSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'),
  'Blocked-state factory missing',
)
assert(
  blockedSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Blocked assertion missing',
)
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1806,
      sourceHead,
      sourceMergeCommit,
      closureOwnerReviewMayProceed: true,
      sourceIntegrationApprovedToday: false,
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
