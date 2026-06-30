import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase50_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_source_integration_readiness_closure_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase50_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_completed_with_warnings_ready_for_source_integration_readiness_owner_review_no_media_no_artifacts'
const sourceHead = 'f0fc70d6fbe9734427baea3afd6be175970623e5'
const sourceMergeCommit = '3e48ca898f66694e23c7ef1a2bac94c0a8ee51ae'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const blockedStateIntegrationSource =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationSource =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexExportSource = 'server/workers/sound-cpu/index.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE51-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-CLOSURE-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-safety-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-owner-claim-policy',
)
const phase51Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1801, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'phase49ProofEvidenceMapped',
  'phase49OwnerReviewMapped',
  'phase50SourceEvidenceMapAccepted',
  'phase50SourceBoundaryRegisterAccepted',
  'phase50BetaBlockersAccepted',
  'phase50ClaimPolicyAccepted',
  'staticHookSourceBoundaryReviewed',
  'staticBlockedStateSourceBoundaryReviewed',
  'staticRuntimeIntegrationSourceBoundaryReviewed',
  'indexExportsReviewed',
  'temporaryProofFileAbsent',
  'sourceIntegrationReadinessClosurePlanningMayProceed',
]) {
  assertTrue(review.reviewedPlan[key], `review.reviewedPlan.${key}`)
}
for (const key of [
  'sourceIntegrationApprovedToday',
  'runtimeIntegrationApprovedToday',
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
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase50Decision === sourceDecision, 'Acceptance source decision mismatch')
for (const key of [
  'phase49ProofEvidenceMapped',
  'phase49OwnerReviewMapped',
  'sourceEvidenceMapAccepted',
  'sourceBoundaryRegisterAccepted',
  'betaReadinessBlockersAccepted',
  'temporaryProofFileAbsent',
  'diagnosticsPassed',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assertTrue(
  acceptance.acceptedScope.sourceIntegrationReadinessClosurePlanning,
  'Closure planning acceptance missing',
)
assertTrue(
  acceptance.acceptedScope.sourceIntegrationReadinessMetadataOnly,
  'Metadata-only acceptance missing',
)
for (const key of ['runtimeExecution', 'realMediaProcessing', 'artifactDelivery', 'realUserMediaBeta', 'paidProduction']) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(
  safety.sourceIntegrationReadinessSafety.allowedNextStep === 'source integration readiness closure plan',
  'Allowed next step mismatch',
)
assertTrue(safety.sourceIntegrationReadinessSafety.temporaryProofFileMustRemainAbsent, 'Temp must remain absent')
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
  assertFalse(safety.sourceIntegrationReadinessSafety[key], `safety.sourceIntegrationReadinessSafety.${key}`)
}
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'sourceIntegrationReadinessUnlock',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(readiness.sourceDecision === expectedDecision, 'Phase 51 readiness source mismatch')
assertTrue(readiness.phase51MayProceed, 'Phase 51 may proceed missing')
assertTrue(readiness.phase51AllowedScope.planSourceIntegrationReadinessClosure, 'Phase 51 planning scope missing')
assertTrue(readiness.phase51AllowedScope.noHookExecution, 'Phase 51 no hook execution missing')
assertTrue(readiness.phase51StillBlocked.actualSourceIntegration, 'Actual source integration blocker missing')
assertTrue(readiness.phase51StillBlocked.realUserMediaBeta, 'Real-user media blocker missing')
assertTrue(readiness.phase51StillBlocked.paidProduction, 'Paid production blocker missing')
assert(readiness.nextPrompt === nextPrompt, 'Readiness next prompt mismatch')

assert(blocker.remainingBlocked.includes('actual source integration'), 'Actual source integration blocker list missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker list missing')
assertTrue(blocker.ownerReviewPassedWithWarnings, 'Owner review warning pass missing')

assertTrue(claimPolicy.allowedClaims.phase50OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(
  claimPolicy.allowedClaims.sourceIntegrationReadinessClosurePlanningMayProceed,
  'Next planning claim missing',
)
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'dockerImageReadiness',
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

assert(phase51Prompt.requiredSourceDecision === expectedDecision, 'Phase 51 prompt source decision mismatch')
assert(phase51Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 51 prompt source head mismatch')
assertTrue(
  phase51Prompt.allowedScope.planSourceIntegrationReadinessClosure,
  'Phase 51 prompt closure planning scope missing',
)
assertTrue(phase51Prompt.allowedScope.noHookExecution, 'Phase 51 prompt no hook execution missing')
assertNoop(phase51Prompt.supabaseClassification, 'phase51 prompt')

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)
assert(sourcePlan.decision === sourceDecision, 'Phase 50 source plan decision missing')
assert(sourcePlan.selectedNextPrompt.includes('PHASE50'), 'Phase 50 source plan owner prompt missing')

for (const sourcePath of [hookSource, blockedStateIntegrationSource, runtimeIntegrationSource, indexExportSource]) {
  assert(fs.existsSync(path.join(repoRoot, sourcePath)), `Missing source file: ${sourcePath}`)
}
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1801,
      sourceHead,
      sourceMergeCommit,
      phase51SourceIntegrationReadinessClosurePlanningMayProceed: true,
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
