import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37u_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_integration_readiness_closure_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37u_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_completed_with_warnings_ready_for_integration_readiness_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '86e0b8ba438a65adec615d60496a015d3174977e'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37V-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-CLOSURE-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan',
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
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-safety-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-claim-policy',
)
const nextPromptDoc = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1696, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedPlan.phase37TProofEvidenceMapped === true, 'Phase 37T proof mapping missing')
assert(review.reviewedPlan.phase37TOwnerReviewMapped === true, 'Phase 37T owner-review mapping missing')
assert(review.reviewedPlan.integrationReadinessMetadataOnly === true, 'Metadata-only review missing')
assert(review.reviewedPlan.blockedStateSourceStillFailClosed === true, 'Fail-closed source review missing')
assert(review.reviewedPlan.temporaryProofFileAbsent === true, 'Temp proof absence missing')
assert(review.reviewedPlan.sourceAndIndexExportsReviewed === true, 'Source/index review missing')
assert(review.reviewedPlan.integrationReadinessClosurePlanningMayProceed === true, 'Closure planning approval missing')
for (const key of [
  'realMediaAllowed',
  'artifactCreationAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(review.reviewedPlan[key], `review.reviewedPlan.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37UDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37UPr === 1696, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37UMergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase37TProofEvidenceMapped === true, 'Accepted Phase 37T proof missing')
assert(acceptance.acceptedEvidence.phase37TOwnerReviewMapped === true, 'Accepted Phase 37T owner review missing')
assert(acceptance.acceptedEvidence.temporaryProofFileAbsent === true, 'Accepted temp absence missing')
assert(acceptance.acceptedEvidence.packageLockUnchanged === true, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.integrationReadinessClosurePlanning === true, 'Closure planning acceptance missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'workerDispatch',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.sourceIntegrationSafety.allowedNextStep === 'integration-readiness closure plan', 'Allowed next step mismatch')
assert(safety.sourceIntegrationSafety.blockedStateSourceMustRemainFailClosed === true, 'Fail-closed requirement missing')
assert(safety.sourceIntegrationSafety.temporaryProofFileMustRemainAbsent === true, 'Temp must remain absent')
for (const key of [
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
  assertFalse(safety.sourceIntegrationSafety[key], `safety.sourceIntegrationSafety.${key}`)
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

assert(readiness.sourceDecision === expectedDecision, 'Phase 37V readiness source mismatch')
assert(readiness.phase37VMayProceed === true, 'Phase 37V may proceed missing')
assert(readiness.phase37VAllowedScope.planIntegrationReadinessClosure === true, 'Phase 37V closure scope missing')
assert(readiness.phase37VAllowedScope.noHookExecution === true, 'Phase 37V no hook execution missing')
assert(readiness.phase37VStillBlocked.runtimeIntegration === true, 'Runtime integration blocker missing')
assert(readiness.phase37VStillBlocked.realUserMediaBeta === true, 'Real-user media blocker missing')
assert(readiness.phase37VStillBlocked.paidProduction === true, 'Paid production blocker missing')
assert(readiness.nextPrompt === nextPrompt, 'Phase 37V next prompt mismatch')

assert(
  blocker.resolvedForThisGate.some((row) => row.blockerId === 'phase37u_integration_readiness_owner_review_pending'),
  'Phase 37U owner-review blocker resolution missing',
)
assert(
  blocker.remainingBlockers.some((row) => row.blockerId === 'phase37v_integration_readiness_closure_plan_pending'),
  'Phase 37V closure blocker missing',
)

assert(claimPolicy.allowedClaims.phase37UOwnerReviewPassed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.integrationReadinessClosurePlanningMayProceed === true, 'Closure planning claim missing')
for (const key of [
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

assert(nextPromptDoc.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(nextPromptDoc.sourceHeadAtPromptCreation === sourceMergeCommit, 'Next prompt source head mismatch')
assert(nextPromptDoc.integrationTarget === indexPath, 'Next prompt target mismatch')
assert(nextPromptDoc.integrationSourcePath === blockedSourcePath, 'Next prompt source mismatch')
assert(nextPromptDoc.allowedScope.planIntegrationReadinessClosure === true, 'Next prompt closure scope missing')
assert(nextPromptDoc.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assert(nextPromptDoc.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37UPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)
assert(phase37UPlan.decision === sourceDecision, 'Phase 37U source plan decision missing')
assert(phase37UPlan.integrationReadinessPlan.consumePhase37TProofEvidence === true, 'Phase 37U source proof evidence missing')
assert(phase37UPlan.integrationReadinessPlan.runtimeIntegrationApprovedToday === false, 'Phase 37U source widened runtime')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Blocked-state factory missing')
assert(blockedSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Blocked assertion missing')
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1696,
      sourceMergeCommit,
      phase37VIntegrationReadinessClosurePlanningMayProceed: true,
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
