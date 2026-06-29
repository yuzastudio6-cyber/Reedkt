import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37o_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_source_creation_no_media_no_artifacts'
const sourceMergeCommit = 'a2ebc7ae9160e319c6196631690351b36e532374'
const sourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-result.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-content-register.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-content-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-no-execution-validation.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-no-execution-validation',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review',
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
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-result',
)
const content = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-content-register',
)
const noExecution = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-no-execution-validation',
)
const ownerReadiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review',
)

assert(result.decision === decision, 'Phase 37P decision mismatch')
assert(result.sourceVerification.sourcePr === 1661, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.sourceCreated.integrationSourcePath === sourcePath, 'Source path mismatch')
assert(result.sourceCreated.indexExportUpdated === true, 'Index export update missing')
assert(result.sourceCreated.sourceStatus === 'blocked_state_source_created_execution_blocked', 'Source status mismatch')
assert(result.sourceCreated.factoryCreated === true, 'Factory creation missing')
assert(result.sourceCreated.blockedAssertionCreated === true, 'Blocked assertion creation missing')
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
  assertFalse(result.sourceCreated[key], `result.sourceCreated.${key}`)
}
assert(result.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(result.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(content.sourcePath === sourcePath, 'Content source path mismatch')
assert(content.indexPath === indexPath, 'Content index path mismatch')
assert(content.exports.factory === 'createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult', 'Factory export mismatch')
assert(
  content.exports.blockedAssertion ===
    'assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked',
  'Blocked assertion export mismatch',
)
assert(content.failClosedResultFields.blockedStatus === 'blocked_by_owner_gate', 'Fail-closed blocked status mismatch')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'supabaseSqlApproved',
]) {
  assertFalse(content.failClosedResultFields[key], `content.failClosedResultFields.${key}`)
}
assert(content.failClosedResultFields.noArtifactCreated === true, 'noArtifactCreated must be true')

assert(noExecution.validated.sourceCreated === true, 'No-execution sourceCreated missing')
assert(noExecution.validated.staticExportOnly === true, 'Static export only missing')
for (const key of [
  'mediaFileOpened',
  'ocrInferenceExecuted',
  'captionRenderExecutionExecuted',
  'artifactWritten',
  'workerDispatched',
  'routeToolProviderCalled',
  'supabaseSqlExecuted',
  'storageObjectCreated',
]) {
  assertFalse(noExecution.validated[key], `noExecution.validated.${key}`)
}
assert(noExecution.validated.hookFactoryNotExecuted === true, 'Hook factory no-execution proof missing')
assert(noExecution.validated.blockedAssertionNotExecuted === true, 'Blocked assertion no-execution proof missing')

assert(ownerReadiness.decision === decision, 'Owner-readiness decision mismatch')
assert(ownerReadiness.ownerReviewReady === true, 'Owner review readiness missing')
assert(ownerReadiness.ownerReviewScope.reviewIntegrationSource === true, 'Owner review source scope missing')
assert(ownerReadiness.ownerReviewScope.reviewIndexExport === true, 'Owner review index scope missing')
assertFalse(ownerReadiness.ownerReviewScope.approveRuntimeExecution, 'approveRuntimeExecution')
assertFalse(ownerReadiness.ownerReviewScope.approveMediaExecution, 'approveMediaExecution')
assert(ownerReadiness.sourceEvidence.phase37OOwnerReviewPr === 1661, 'Owner-readiness source PR mismatch')
assert(ownerReadiness.sourceEvidence.phase37OOwnerReviewMergeCommit === sourceMergeCommit, 'Owner-readiness source merge mismatch')

assert(claimPolicy.allowedClaims.phase37PSourceCreated === true, 'Phase 37P source claim missing')
assert(claimPolicy.allowedClaims.blockedStateIntegrationSourceCreated === true, 'Blocked-state source claim missing')
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
assert(nextPrompt.allowedScope.reviewBlockedStateIntegrationSource === true, 'Next prompt source review scope missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const sourceText = readText(sourcePath)
assert(
  sourceText.includes('SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS'),
  'Integration status constant missing',
)
assert(
  sourceText.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'),
  'Integration factory missing',
)
assert(
  sourceText.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Integration blocked assertion missing',
)
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
assert(!sourceText.includes('fs.readFile'), 'Source must not read files')
assert(!sourceText.includes('fetch('), 'Source must not fetch')
assert(!sourceText.includes('child_process'), 'Source must not spawn processes')

const indexText = readText(indexPath)
assert(indexText.includes('./runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'), 'Index integration export missing')
assert(readText(hookSourcePath).includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'Original hook factory missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const ownerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
)
assert(ownerReview.decision === sourceDecision, 'Phase 37O owner-review decision missing')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-creation:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-creation-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1661,
      sourceMergeCommit,
      integrationSourcePath: sourcePath,
      indexExportUpdated: true,
      hookExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37P-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
