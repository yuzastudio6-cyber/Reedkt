import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase45_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_static_validation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase45_caption_render_runtime_hook_blocked_state_source_integration_plan_completed_with_warnings_ready_for_blocked_state_source_integration_owner_review_no_media_no_artifacts'
const inheritedDecision =
  'worker_runtime_jobs_sound_cpu_phase44_caption_render_runtime_hook_blocked_state_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_plan_no_media_no_artifacts'
const sourceHead = 'afa78e61ed647e808bf2cbb02c35ea38d31d9a7f'
const sourceMergeCommit = '0e0d996bb8e1fbc9693494c7d440515ad0ec1915'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const blockedStateIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1773, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewDecision.phase45PlanAccepted === true, 'Phase 45 plan acceptance missing')
assert(
  review.reviewDecision.existingBlockedStateSourceAcceptedForStaticValidation === true,
  'Static validation acceptance missing',
)
assert(review.reviewDecision.existingHookSourcePathAccepted === hookSourcePath, 'Hook source path mismatch')
assert(
  review.reviewDecision.existingBlockedStateIntegrationPathAccepted === blockedStateIntegrationPath,
  'Blocked-state integration path mismatch',
)
assert(
  review.reviewDecision.existingRuntimeIntegrationPathAccepted === runtimeIntegrationPath,
  'Runtime integration path mismatch',
)
assert(review.reviewDecision.existingIndexExportPathAccepted === indexPath, 'Index path mismatch')
for (const key of [
  'actualSourceCreationApprovedToday',
  'sourceModificationApprovedToday',
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
assert(review.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE46-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION', 'Next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase45SourcePr === 1773, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase45SourceDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase44OwnerReviewDecision === inheritedDecision, 'Inherited source decision mismatch')
assert(acceptance.acceptedEvidence.existingHookSourceReviewed === true, 'Hook review acceptance missing')
assert(
  acceptance.acceptedEvidence.existingBlockedStateIntegrationSourceReviewed === true,
  'Blocked-state review acceptance missing',
)
assert(acceptance.acceptedEvidence.existingRuntimeIntegrationSourceReviewed === true, 'Runtime review acceptance missing')
assert(acceptance.acceptedEvidence.temporaryProofFileAbsent === true, 'Temp proof absence missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.futureBlockedStateSourceStaticValidationGate === true, 'Future static validation acceptance missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'sourceModification',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(readiness.sourceDecision === decision, 'Phase 46 readiness source mismatch')
assert(readiness.phase46MayProceed === true, 'Phase 46 may proceed missing')
assert(readiness.phase46AllowedScope.staticValidationOnly === true, 'Static validation scope missing')
assert(readiness.phase46AllowedScope.inspectExistingHookSource === true, 'Hook inspection scope missing')
assert(readiness.phase46AllowedScope.inspectExistingBlockedStateIntegrationSource === true, 'Blocked-state inspection scope missing')
assert(readiness.phase46AllowedScope.inspectExistingRuntimeIntegrationSource === true, 'Runtime inspection scope missing')
assert(readiness.phase46AllowedScope.noSourceCreation === true, 'No source creation flag missing')
assert(readiness.phase46AllowedScope.noSourceModification === true, 'No source modification flag missing')
assert(readiness.phase46AllowedScope.noHookExecution === true, 'No hook execution flag missing')
for (const key of [
  'runtimeHookExecution',
  'realMediaExecution',
  'ocrInference',
  'captionRenderRuntimeExecutionOverMedia',
  'workerExecution',
  'artifactCreationBlocked',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assert(readiness.phase46StillBlocked[key] === true, `readiness.phase46StillBlocked.${key} must be true`)
}

assert(safety.sourceDecision === decision, 'Safety source decision mismatch')
assert(safety.sourceValidationSafety.allowedNextStep === 'blocked-state source static validation', 'Allowed next step mismatch')
assert(safety.sourceValidationSafety.temporaryProofFileMustRemainAbsent === true, 'Temp proof absence missing')
for (const key of [
  'sourceModificationAllowed',
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
  assertFalse(safety.sourceValidationSafety[key], `safety.sourceValidationSafety.${key}`)
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
assert(blocker.remainingBlocked.includes('source modification'), 'Source modification blocker missing')
assert(blocker.remainingBlocked.includes('runtime hook execution'), 'Runtime hook blocker missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker missing')
assert(
  blocker.blockerPrompts.nextStaticValidationPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE46-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION',
  'Next static validation prompt mismatch',
)

assert(claimPolicy.allowedClaims.phase45PlanOwnerReviewPassed === true, 'Owner review claim missing')
assert(claimPolicy.allowedClaims.phase46StaticValidationMayProceed === true, 'Phase 46 claim missing')
assert(
  claimPolicy.allowedClaims.existingFailClosedSourceAcceptedForStaticValidation === true,
  'Existing source static validation claim missing',
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
assert(nextPrompt.allowedScope.staticValidationOnly === true, 'Next prompt static validation scope missing')
assert(nextPrompt.allowedScope.inspectExistingBlockedStateIntegrationSource === true, 'Next prompt integration inspection scope missing')
assert(nextPrompt.allowedScope.noSourceCreation === true, 'Next prompt no source creation missing')
assert(nextPrompt.allowedScope.noSourceModification === true, 'Next prompt no source modification missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assertSupabaseNoop(nextPrompt.supabaseClassification, 'nextPrompt')

const phase45Plan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan.md',
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan',
)
assert(phase45Plan.decision === sourceDecision, 'Phase 45 source plan decision missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

for (const requiredPath of [hookSourcePath, blockedStateIntegrationPath, runtimeIntegrationPath, indexPath]) {
  assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Required source path missing: ${requiredPath}`)
}

const hookText = readText(hookSourcePath)
assert(hookText.includes('runtimeExecutionApproved: false'), 'Hook runtime approval must remain false')
assert(hookText.includes('artifactCreationApproved: false'), 'Hook artifact approval must remain false')
const blockedText = readText(blockedStateIntegrationPath)
assert(blockedText.includes('blocked_state_source_created_execution_blocked'), 'Blocked-state status missing')
assert(blockedText.includes('runtimeExecutionApproved: false'), 'Blocked-state runtime approval must remain false')
assert(blockedText.includes('supabaseSqlApproved: false'), 'Blocked-state Supabase approval must remain false')
const runtimeText = readText(runtimeIntegrationPath)
assert(runtimeText.includes('runtime_integration_source_created_execution_blocked'), 'Runtime status missing')
assert(runtimeText.includes('realUserMediaBetaApproved: false'), 'Real-user media beta must remain false')
assert(runtimeText.includes('paidProductionApproved: false'), 'Paid production must remain false')
const indexText = readText(indexPath)
for (const expected of [
  './runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts',
]) {
  assert(indexText.includes(expected), `Index export missing: ${expected}`)
}

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1773,
      sourceHead,
      sourceMergeCommit,
      phase46StaticValidationMayProceed: true,
      sourceModificationApprovedToday: false,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE46-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
