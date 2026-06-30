import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_actual_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37z_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_source_creation_gate_no_media_no_artifacts'
const sourceMergeCommit = '6d9745e125365e8d9e18d7f3b660cfcd9bb0822e'
const sourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE38-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate:diagnostics'
const phase40ResultPath =
  'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate.md'
const phase40ResultLabel =
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-result'
const phase40Decision =
  'worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-result.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-register.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-index-wiring-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-index-wiring-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review',
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
const result = parsed.get('worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-result')
const sourceRegister = parsed.get('worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-register')
const safety = parsed.get('worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-safety-register')
const blockers = parsed.get('worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-index-wiring-blocker-register')
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-claim-policy')
const ownerReviewPrompt = parsed.get('worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review')

assert(result.decision === expectedDecision, 'Phase 38 decision mismatch')
assert(result.sourceVerification.sourcePr === 1733, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.sourceCreationResult.runtimeIntegrationSourceCreated === true, 'Source creation missing')
assert(result.sourceCreationResult.runtimeIntegrationSourcePath === sourcePath, 'Source path mismatch')
assert(result.sourceCreationResult.sourceCreatedFailClosed === true, 'Fail-closed source claim missing')
assert(result.sourceCreationResult.sourceExportsLocalSymbolsOnly === true, 'Local symbols claim missing')
for (const key of [
  'indexExportWiredToday',
  'dispatchWiredToday',
  'hookExecutedToday',
  'realMediaApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(result.sourceCreationResult[key], `result.sourceCreationResult.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(result.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(result.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(sourceRegister.createdSource.path === sourcePath, 'Created source path mismatch')
assert(sourceRegister.createdSource.status === 'source_created_execution_blocked', 'Created source status mismatch')
assert(sourceRegister.createdSource.exportedFromIndexToday === false, 'Source must not be index-exported')
assert(sourceRegister.createdSource.wiredToDispatchToday === false, 'Source must not be dispatch-wired')
assert(sourceRegister.createdSource.executedToday === false, 'Source must not execute')
assert(sourceRegister.sourceSymbols.blockedResultFactory === 'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult', 'Factory symbol missing')
assert(sourceRegister.sourceSymbols.blockedAssertion === 'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked', 'Blocked assertion symbol missing')

for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'supabaseSqlApproved',
  'routeToolProviderApproved',
  'realUserMediaBetaApproved',
  'paidProductionApproved',
]) {
  assertFalse(safety.sourceSafety[key], `safety.sourceSafety.${key}`)
}
assert(safety.sourceSafety.failClosedBlockedStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(safety.sourceSafety.noArtifactCreated === true, 'No artifact claim missing')
for (const key of [
  'fileSystemReadWrite',
  'childProcess',
  'networkCall',
  'dockerOrGcpCall',
  'supabaseClient',
  'signedUrl',
  'artifactWrite',
  'mediaDecodeOrRender',
  'providerModelCall',
]) {
  assert(safety.prohibitedSourceBehaviorAbsent[key] === true, `safety.prohibitedSourceBehaviorAbsent.${key} missing`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase38_actual_runtime_integration_source_creation_pending'),
  'Phase 38 source creation resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase38_actual_source_owner_review_pending'),
  'Phase 38 source owner review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'index_export_wiring_pending'),
  'Index export blocker missing',
)

assert(claimPolicy.allowedClaims.phase38ActualSourceCreated === true, 'Phase 38 source created claim missing')
assert(claimPolicy.allowedClaims.createdSourceIsFailClosed === true, 'Fail-closed claim missing')
assert(claimPolicy.allowedClaims.sourceOwnerReviewMayProceed === true, 'Source owner review claim missing')
assertFalse(claimPolicy.allowedClaims.indexWiringChangedToday, 'claimPolicy.allowedClaims.indexWiringChangedToday')
assertFalse(claimPolicy.allowedClaims.dispatchWiringChangedToday, 'claimPolicy.allowedClaims.dispatchWiringChangedToday')
assertFalse(claimPolicy.allowedClaims.hookExecutionApprovedToday, 'claimPolicy.allowedClaims.hookExecutionApprovedToday')
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

assert(ownerReviewPrompt.requiredSourceDecision === expectedDecision, 'Owner-review prompt source mismatch')
assert(ownerReviewPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner-review prompt source head mismatch')
assert(ownerReviewPrompt.reviewOwner === 'WORKER_RUNTIME_JOBS', 'Owner-review prompt owner mismatch')
assert(ownerReviewPrompt.reviewScope.acceptFailClosedRuntimeIntegrationSourceForFutureExportReview === true, 'Owner-review prompt acceptance missing')
for (const key of [
  'acceptIndexWiringToday',
  'acceptDispatchWiringToday',
  'acceptHookExecutionToday',
  'acceptRealMediaToday',
  'acceptArtifactCreationToday',
  'acceptWorkerDispatchToday',
  'acceptRouteToolProviderCallsToday',
  'acceptSupabaseSqlToday',
  'acceptBetaUnlockToday',
  'acceptProductionUnlockToday',
]) {
  assertFalse(ownerReviewPrompt.reviewScope[key], `ownerReviewPrompt.reviewScope.${key}`)
}

const sourceText = readText(sourcePath)
for (const expected of [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS',
  "'runtime_integration_source_created_execution_blocked'",
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
  "blockedStatus: 'blocked_by_owner_gate'",
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'routeToolProviderApproved: false',
  'realUserMediaBetaApproved: false',
  'paidProductionApproved: false',
  'noArtifactCreated: true',
]) {
  assert(sourceText.includes(expected), `Source missing ${expected}`)
}
for (const forbidden of [
  "from 'node:fs'",
  "from 'node:child_process'",
  "from 'node:http'",
  "from 'node:https'",
  'createClient',
  'signedUrl',
  'signed URL',
  'artifactWrite',
  'docker build',
  'Cloud Run',
  'runtimeExecutionApproved: true',
  'workerExecutionApproved: true',
  'mediaProcessingApproved: true',
  'artifactCreationApproved: true',
  'realUserMediaBetaApproved: true',
  'paidProductionApproved: true',
]) {
  assert(!sourceText.includes(forbidden), `Source contains forbidden text: ${forbidden}`)
}

const indexText = readText(indexPath)
if (fs.existsSync(path.join(repoRoot, phase40ResultPath))) {
  const phase40Result = parseJsonBlock(phase40ResultPath, phase40ResultLabel)
  assert(phase40Result.decision === phase40Decision, 'Phase 40 result decision mismatch')
  assert(
    indexText.includes('soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration'),
    'Index must export runtime integration source after Phase 40',
  )
} else {
  assert(!indexText.includes('soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration'), 'Index must not export runtime integration source yet')
}

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript], 'Package script missing')
assert(
  packageJson.scripts[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-creation-gate-diagnostics.mjs',
  'Package script command mismatch',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1733,
      sourceMergeCommit,
      runtimeIntegrationSourceCreated: true,
      runtimeIntegrationSourcePath: sourcePath,
      indexExportWiredToday: false,
      dispatchWiredToday: false,
      hookExecutedToday: false,
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
