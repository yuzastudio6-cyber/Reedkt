import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37v_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_plan_completed_with_warnings_ready_for_closure_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37u_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_integration_readiness_closure_plan_no_media_no_artifacts'
const phase37UPlanDecision =
  'worker_runtime_jobs_sound_cpu_phase37u_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_completed_with_warnings_ready_for_integration_readiness_owner_review_no_media_no_artifacts'
const sourceMergeCommit = 'f3b7945c8387a444655bf7c75719df761f0f07a0'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37V-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-CLOSURE-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-source-register.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-source-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-boundary-checklist.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-boundary-checklist',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-result',
)
const sourceRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-source-register',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-boundary-checklist',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 37V decision mismatch')
assert(plan.sourceVerification.sourcePr === 1698, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.closureResult.phase37UOwnerReviewAccepted === true, 'Phase 37U owner review missing')
assert(plan.closureResult.phase37VClosureRegisterConsumed === true, 'Phase 37V register not consumed')
assert(plan.closureResult.blockedStateSourceExists === true, 'Blocked-state source missing')
assert(plan.closureResult.indexExportsExist === true, 'Index exports missing')
assert(plan.closureResult.temporaryProofFileAbsent === true, 'Temporary proof absence missing')
assert(plan.closureResult.failClosedFactoryPresent === true, 'Fail-closed factory missing')
assert(plan.closureResult.failClosedAssertionPresent === true, 'Fail-closed assertion missing')
assert(plan.closureResult.integrationReadinessClosureEvidenceComplete === true, 'Closure evidence incomplete')
assert(plan.closureResult.closureOwnerReviewMayProceed === true, 'Owner review may proceed missing')
for (const key of [
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
assert(plan.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(plan.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(sourceRegister.decision === expectedDecision, 'Source register decision mismatch')
assert(
  sourceRegister.acceptedSources.some(
    (source) => source.sourceId === 'phase37u_owner_review' && source.decision === sourceDecision,
  ),
  'Phase 37U owner-review source missing',
)
assert(
  sourceRegister.acceptedSources.some((source) => source.sourceId === 'phase37v_prompt_register'),
  'Phase 37V prompt register source missing',
)
assert(sourceRegister.sourceFilesReviewed.integrationTarget === indexPath, 'Source register target mismatch')
assert(sourceRegister.sourceFilesReviewed.integrationSourcePath === blockedSourcePath, 'Source register path mismatch')
assert(sourceRegister.sourceFilesReviewed.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assert(sourceRegister.sourceFilesReviewed.temporaryProofFileExpectedAbsent === true, 'Temp proof absence expectation missing')
assert(sourceRegister.sourceUseLimits.staticBoundaryInspection === true, 'Static boundary inspection missing')
assert(sourceRegister.sourceUseLimits.metadataClosureOnly === true, 'Metadata closure limit missing')
for (const key of [
  'runtimeExecutionAuthorization',
  'mediaInputAuthorization',
  'artifactOutputAuthorization',
  'workerDispatchAuthorization',
  'supabaseSqlAuthorization',
  'betaProductionAuthorization',
]) {
  assertFalse(sourceRegister.sourceUseLimits[key], `sourceRegister.sourceUseLimits.${key}`)
}

for (const [key, value] of Object.entries(boundary.closureChecklist)) {
  assert(value === true, `Closure checklist item must be true: ${key}`)
}
for (const [key, value] of Object.entries(boundary.notClosedByThisPacket)) {
  assert(value === true, `Not-closed item must remain true: ${key}`)
}
assert(boundary.closureOwnerReviewFocus.length === 3, 'Owner-review focus must list three items')

assert(safety.allowedActions.docsDiagnosticsOnly === true, 'Docs diagnostics scope missing')
assert(safety.allowedActions.staticBoundaryInspection === true, 'Static inspection scope missing')
assert(safety.allowedActions.integrationReadinessClosurePlanning === true, 'Closure planning scope missing')
for (const [key, value] of Object.entries(safety.blockedActions)) {
  assert(value === true, `Blocked action must remain true: ${key}`)
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
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37v_integration_readiness_closure_plan_pending'),
  'Phase 37V closure-plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37v_integration_readiness_closure_owner_review_pending'),
  'Phase 37V owner-review blocker missing',
)
assertFalse(blockers.betaProductionStatus.realUserMediaBetaAllowed, 'blockers.realUserMediaBetaAllowed')
assertFalse(blockers.betaProductionStatus.paidProductionAllowed, 'blockers.paidProductionAllowed')

assert(claimPolicy.allowedClaims.phase37VClosurePlanCreated === true, 'Closure plan claim missing')
assert(claimPolicy.allowedClaims.staticBoundaryChecklistCreated === true, 'Boundary checklist claim missing')
assert(claimPolicy.allowedClaims.phase37UOwnerReviewConsumed === true, 'Phase 37U source claim missing')
assert(claimPolicy.allowedClaims.closureOwnerReviewMayProceed === true, 'Owner-review next claim missing')
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
assert(claimPolicy.noScopeStatement.includes('no real media'), 'No-scope statement must mention no real media')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.integrationTarget === indexPath, 'Owner prompt target mismatch')
assert(ownerPrompt.integrationSourcePath === blockedSourcePath, 'Owner prompt source path mismatch')
assert(ownerPrompt.reviewFocus.phase37UOwnerReviewConsumed === true, 'Owner prompt source focus missing')
assert(ownerPrompt.reviewFocus.staticBoundaryChecklistAccepted === true, 'Owner prompt checklist focus missing')
assert(ownerPrompt.reviewFocus.blockedStateSourceStillFailClosed === true, 'Owner prompt fail-closed focus missing')
assert(ownerPrompt.reviewFocus.temporaryProofFileAbsent === true, 'Owner prompt temp absence missing')
assert(ownerPrompt.reviewFocus.closurePlanMetadataOnly === true, 'Owner prompt metadata-only focus missing')
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

const phase37UOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)
assert(phase37UOwnerReview.decision === sourceDecision, 'Phase 37U owner-review decision missing')
assert(
  phase37UOwnerReview.reviewedPlan.integrationReadinessClosurePlanningMayProceed === true,
  'Phase 37U did not allow closure planning',
)

const phase37UPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)
assert(phase37UPlan.decision === phase37UPlanDecision, 'Phase 37U plan decision missing')
assertFalse(phase37UPlan.integrationReadinessPlan.runtimeIntegrationApprovedToday, 'Phase 37U widened runtime')

const phase37VRegister = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register.md',
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register',
)
assert(phase37VRegister.sourceDecision === sourceDecision, 'Phase 37V source register mismatch')
assert(phase37VRegister.phase37VMayProceed === true, 'Phase 37V register does not allow planning')
assert(phase37VRegister.phase37VAllowedScope.noHookExecution === true, 'Phase 37V hook execution scope widened')
assert(phase37VRegister.phase37VStillBlocked.realUserMediaBeta === true, 'Phase 37V real-user beta blocker missing')
assert(phase37VRegister.phase37VStillBlocked.paidProduction === true, 'Phase 37V production blocker missing')

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
assert(blockedSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Blocked-state factory missing')
assert(blockedSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Blocked assertion missing')
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1698,
      sourceMergeCommit,
      closureOwnerReviewMayProceed: true,
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
