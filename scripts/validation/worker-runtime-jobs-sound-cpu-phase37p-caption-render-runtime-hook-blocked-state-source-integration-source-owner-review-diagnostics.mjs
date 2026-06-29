import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_owner_review_passed_with_warnings_ready_for_static_validation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts'
const ownerReviewSourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37o_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_source_creation_no_media_no_artifacts'
const sourceMergeCommit = 'bdd36333a35f2c6640cb0515639b8a46e2319ff3'
const sourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation',
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

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1665, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewDecision.phase37PSourceAccepted === true, 'Phase 37P source acceptance missing')
assert(review.reviewDecision.staticValidationMayProceed === true, 'Static validation approval missing')
assert(review.reviewDecision.integrationSourcePath === sourcePath, 'Integration source path mismatch')
assert(review.reviewDecision.indexExportReviewed === true, 'Index export review missing')
assert(review.reviewDecision.failClosedResultShapeReviewed === true, 'Fail-closed result review missing')
for (const key of [
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

assert(acceptance.acceptedEvidence.phase37PSourcePr === 1665, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37PSourceDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37OOwnerReviewDecision === ownerReviewSourceDecision, 'Phase 37O owner-review source mismatch')
assert(acceptance.acceptedEvidence.integrationSourceExists === true, 'Integration source evidence missing')
assert(acceptance.acceptedEvidence.indexExportExists === true, 'Index export evidence missing')
assert(acceptance.acceptedEvidence.failClosedFactoryExists === true, 'Factory evidence missing')
assert(acceptance.acceptedEvidence.blockedAssertionExists === true, 'Blocked assertion evidence missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.staticValidationPlanning === true, 'Static validation scope missing')
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

assert(readiness.sourceDecision === decision, 'Phase 37Q readiness source mismatch')
assert(readiness.phase37QMayProceed === true, 'Phase 37Q may proceed missing')
assert(readiness.phase37QAllowedScope.staticValidationOnly === true, 'Static validation scope missing')
assert(readiness.phase37QAllowedScope.inspectIntegrationSource === true, 'Source inspection scope missing')
assert(readiness.phase37QAllowedScope.noHookExecution === true, 'No hook execution flag missing')
for (const key of [
  'realMediaExecution',
  'ocrInference',
  'captionRenderRuntimeExecutionOverMedia',
  'workerExecution',
  'artifactCreation',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assert(readiness.phase37QStillBlocked[key] === true, `readiness.phase37QStillBlocked.${key} must be true`)
}

assert(safety.sourceDecision === decision, 'Safety source decision mismatch')
assert(safety.sourceSafety.allowedNextStep === 'blocked-state source static validation', 'Allowed next step mismatch')
assert(safety.sourceSafety.integrationSourceMustRemainFailClosed === true, 'Fail-closed source flag missing')
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
  assertFalse(safety.sourceSafety[key], `safety.sourceSafety.${key}`)
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
  blocker.blockerPrompts.nextStaticValidationPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Q-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION',
  'Next static validation prompt mismatch',
)

assert(claimPolicy.allowedClaims.phase37PSourceOwnerReviewPassed === true, 'Owner review claim missing')
assert(claimPolicy.allowedClaims.phase37QStaticValidationMayProceed === true, 'Phase 37Q claim missing')
assert(claimPolicy.allowedClaims.runtimeRemainsFailClosed === true, 'Fail-closed claim missing')
for (const key of [
  'hookExecuted',
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
assert(nextPrompt.allowedScope.inspectIntegrationSource === true, 'Next prompt source inspection missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assert(nextPrompt.allowedScope.noMediaInput === true, 'Next prompt no media missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37PResult = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-result.md',
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-result',
)
assert(phase37PResult.decision === sourceDecision, 'Phase 37P source result decision missing')

const sourceText = readText(sourcePath)
assert(
  sourceText.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'),
  'Integration factory missing',
)
assert(
  sourceText.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Integration blocked assertion missing',
)
assert(sourceText.includes('runtimeExecutionApproved: false'), 'Runtime approval false missing')
assert(sourceText.includes('mediaProcessingApproved: false'), 'Media approval false missing')
assert(sourceText.includes('supabaseSqlApproved: false'), 'Supabase approval false missing')
assert(!sourceText.includes('fs.readFile'), 'Source must not read files')
assert(!sourceText.includes('fetch('), 'Source must not fetch')
assert(!sourceText.includes('child_process'), 'Source must not spawn processes')

const indexText = readText(indexPath)
assert(indexText.includes('./runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'), 'Index integration export missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1665,
      sourceMergeCommit,
      phase37QStaticValidationMayProceed: true,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Q-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
