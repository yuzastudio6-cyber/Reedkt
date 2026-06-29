import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37q_caption_render_runtime_hook_blocked_state_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_owner_review_passed_with_warnings_ready_for_static_validation_no_media_no_artifacts'
const sourceMergeCommit = 'd8296d481d699d965231f439444346cf990dff39'
const sourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-result.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-shape-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-shape-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-prohibited-source-scan-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-prohibited-source-scan-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
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

function assertAbsent(text, pattern, label) {
  assert(!pattern.test(text), `${label} must be absent`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-result',
)
const shape = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-shape-validation-register',
)
const prohibited = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-prohibited-source-scan-register',
)
const ownerReadiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-readiness-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
)

assert(result.decision === decision, 'Phase 37Q decision mismatch')
assert(result.sourceVerification.sourcePr === 1667, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.staticValidation.integrationSourcePath === sourcePath, 'Static validation source path mismatch')
assert(result.staticValidation.indexPath === indexPath, 'Static validation index path mismatch')
assert(result.staticValidation.sourceExists === true, 'Source existence evidence missing')
assert(result.staticValidation.indexExportExists === true, 'Index export evidence missing')
assert(result.staticValidation.factoryShapePassed === true, 'Factory shape evidence missing')
assert(result.staticValidation.blockedAssertionShapePassed === true, 'Blocked assertion evidence missing')
assert(result.staticValidation.disabledRuntimeFlagsPassed === true, 'Disabled flags evidence missing')
assert(result.staticValidation.prohibitedSourceScanPassed === true, 'Prohibited scan evidence missing')
for (const key of [
  'hookExecutionApprovedToday',
  'realMediaInputApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(result.staticValidation[key], `result.staticValidation.${key}`)
}
assert(result.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(result.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(shape.sourceDecision === decision, 'Shape source decision mismatch')
assert(shape.validatedSource.integrationSourcePath === sourcePath, 'Shape source path mismatch')
assert(shape.validatedSource.indexPath === indexPath, 'Shape index path mismatch')
assert(shape.validatedSource.statusConstant === 'blocked_state_source_created_execution_blocked', 'Status constant mismatch')
assert(shape.validatedSource.integrationName === 'ocrCaptionRenderSafeZoneBlockedStateIntegration', 'Integration name mismatch')
assert(
  shape.validatedSource.factory === 'createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult',
  'Factory name mismatch',
)
assert(
  shape.validatedSource.blockedAssertion ===
    'assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked',
  'Blocked assertion name mismatch',
)
for (const key of [
  'requiresApprovedPlanSnapshotId',
  'requiresIntegrationPlanId',
  'usesRuntimeDisabledFlagsGuard',
  'returnsBlockedByOwnerGate',
  'returnsOwnerGateRequired',
  'returnsNoArtifactCreated',
]) {
  assert(shape.validatedSource[key] === true, `shape.validatedSource.${key} must be true`)
}
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'supabaseSqlApproved',
]) {
  assertFalse(shape.requiredFalseResultFields[key], `shape.requiredFalseResultFields.${key}`)
}

assert(prohibited.sourceDecision === decision, 'Prohibited scan source decision mismatch')
assert(prohibited.scanScope.integrationSourcePath === sourcePath, 'Prohibited scan source path mismatch')
assert(prohibited.scanScope.indexPath === indexPath, 'Prohibited scan index path mismatch')
assert(prohibited.scanScope.temporaryProofFile === tempProofFile, 'Temporary proof file path mismatch')
for (const key of [
  'fsReadOrWrite',
  'fetch',
  'childProcess',
  'mediaFileOpen',
  'ocrInference',
  'captionRenderExecution',
  'artifactWrite',
  'workerDispatch',
  'routeToolProviderCall',
  'supabaseSql',
  'storageObjectCreation',
  'dockerOrGcpAction',
]) {
  assert(prohibited.prohibitedPatternsAbsent[key] === true, `prohibitedPatternsAbsent.${key} must be true`)
}
assertFalse(prohibited.prohibitedPatternsAbsent.temporaryProofFilePresent, 'temporaryProofFilePresent')

assert(ownerReadiness.decision === decision, 'Owner-readiness decision mismatch')
assert(ownerReadiness.ownerReviewReady === true, 'Owner review readiness missing')
for (const key of ['reviewStaticValidationEvidence', 'reviewSourceShape', 'reviewProhibitedSourceScan']) {
  assert(ownerReadiness.ownerReviewScope[key] === true, `ownerReviewScope.${key} must be true`)
}
for (const key of [
  'approveRuntimeExecution',
  'approveMediaExecution',
  'approveArtifactCreation',
  'approveWorkerDispatch',
  'approveSupabaseSql',
  'approveBetaUnlock',
  'approveProductionUnlock',
]) {
  assertFalse(ownerReadiness.ownerReviewScope[key], `ownerReadiness.ownerReviewScope.${key}`)
}
assert(ownerReadiness.sourceEvidence.phase37PSourceOwnerReviewPr === 1667, 'Owner-readiness source PR mismatch')
assert(
  ownerReadiness.sourceEvidence.phase37PSourceOwnerReviewMergeCommit === sourceMergeCommit,
  'Owner-readiness source merge mismatch',
)
assert(ownerReadiness.sourceEvidence.phase37PSourceOwnerReviewDecision === sourceDecision, 'Owner-readiness source decision mismatch')

assert(blocker.staticValidationPassedWithWarnings === true, 'Static validation warning pass missing')
assert(blocker.remainingBlocked.includes('runtime hook execution'), 'Runtime hook blocker missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker missing')
assert(
  blocker.blockerPrompts.nextOwnerReviewPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Q-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION-OWNER-REVIEW',
  'Next owner-review prompt mismatch',
)

assert(claimPolicy.allowedClaims.phase37QStaticValidationPassed === true, 'Phase 37Q claim missing')
assert(claimPolicy.allowedClaims.phase37QOwnerReviewMayProceed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.blockedStateIntegrationSourceStaticallyValidated === true, 'Static source claim missing')
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
assert(nextPrompt.allowedScope.ownerReviewOnly === true, 'Next prompt owner-review scope missing')
assert(nextPrompt.allowedScope.reviewStaticValidationEvidence === true, 'Next prompt static validation scope missing')
assert(nextPrompt.allowedScope.reviewIntegrationSourceShape === true, 'Next prompt source shape scope missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assert(nextPrompt.allowedScope.noMediaInput === true, 'Next prompt no media missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37POwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review',
)
assert(phase37POwnerReview.decision === sourceDecision, 'Phase 37P owner-review decision missing')

const sourceText = readText(sourcePath)
assert(sourceText.includes('SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS'), 'Integration status constant missing')
assert(sourceText.includes('blocked_state_source_created_execution_blocked'), 'Blocked source status string missing')
assert(sourceText.includes('ocrCaptionRenderSafeZoneBlockedStateIntegration'), 'Integration name string missing')
assert(sourceText.includes('approvedPlanSnapshotId: string'), 'Approved plan snapshot input missing')
assert(sourceText.includes('integrationPlanId: string'), 'Integration plan input missing')
assert(sourceText.includes('assertSoundCpuRuntimeDisabledFlags'), 'Runtime disabled flags guard missing')
assert(sourceText.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Factory missing')
assert(
  sourceText.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Blocked assertion missing',
)
assert(sourceText.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked owner-gate status missing')
assert(sourceText.includes('ownerGateRequired: typeof SOUND_CPU_RUNTIME_OWNER_GATE'), 'Owner gate result type missing')
for (const snippet of [
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'noArtifactCreated: true',
]) {
  assert(sourceText.includes(snippet), `Missing fail-closed snippet: ${snippet}`)
}
assert(sourceText.includes('throw new Error('), 'Blocked assertion must throw')
assertAbsent(sourceText, /\bfs\./, 'Filesystem operation')
assertAbsent(sourceText, /fs\/promises|node:fs|readFile|writeFile|createReadStream|createWriteStream/, 'Filesystem import or helper')
assertAbsent(sourceText, /fetch\s*\(/, 'fetch call')
assertAbsent(sourceText, /child_process|exec\s*\(|spawn\s*\(/, 'process spawn')
assertAbsent(sourceText, /audio_open|ffmpeg|ffprobe|pydub|ocrInference|renderCaption|writeArtifact|createSignedUrl/, 'media or artifact operation')
assertAbsent(
  sourceText,
  /createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|sql`|executeSql|service_role/i,
  'Supabase or SQL-like operation',
)
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const indexText = readText(indexPath)
assert(indexText.includes('./runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'), 'Index integration export missing')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1667,
      sourceMergeCommit,
      staticValidationPassed: true,
      hookExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Q-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
