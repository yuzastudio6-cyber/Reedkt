import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_source_owner_review_passed_with_warnings_ready_for_index_export_wiring_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_actual_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts'
const sourceMergeCommit = 'c771d7362a794e0923b1274768f5a5f72144966d'
const sourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE39-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-INDEX-EXPORT-WIRING-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review:diagnostics'
const phase40ResultPath =
  'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate.md'
const phase40ResultLabel =
  'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-result'
const phase40Decision =
  'worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan.md',
    'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan',
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
  'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-claim-policy',
)
const phase39Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan-register',
)
const phase39Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase39-caption-render-runtime-hook-blocked-state-index-export-wiring-plan',
)

assert(review.decision === expectedDecision, 'Phase 38 source owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1735, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedSource.runtimeIntegrationSourcePath === sourcePath, 'Reviewed source path mismatch')
assert(review.reviewedSource.runtimeIntegrationSourceExists === true, 'Reviewed source existence missing')
assert(review.reviewedSource.failClosedBlockedStatusAccepted === true, 'Fail-closed acceptance missing')
assert(review.reviewedSource.localBlockedResultFactoryAccepted === true, 'Blocked factory acceptance missing')
assert(review.reviewedSource.localBlockedAssertionAccepted === true, 'Blocked assertion acceptance missing')
assert(review.reviewedSource.indexExportWiringMayProceedInNextGate === true, 'Index export planning acceptance missing')
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
  assertFalse(review.reviewedSource[key], `review.reviewedSource.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedSource.sourceDecision === sourceDecision, 'Accepted source decision mismatch')
assert(acceptance.acceptedSource.runtimeIntegrationSourcePath === sourcePath, 'Accepted source path mismatch')
assert(acceptance.acceptedSource.blockedResultFactory === 'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult', 'Accepted factory mismatch')
assert(acceptance.acceptedSource.blockedAssertion === 'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked', 'Accepted assertion mismatch')
assert(acceptance.acceptedSource.failClosedResultAcceptedForFutureExport === true, 'Future export acceptance missing')
assert(acceptance.acceptedForNextGate.indexExportWiringPlanMayProceed === true, 'Index export plan missing')
assert(acceptance.acceptedForNextGate.indexExportWiringSourcePath === indexPath, 'Index path mismatch')
assert(acceptance.acceptedForNextGate.exportOnlyFailClosedSymbols === true, 'Fail-closed export scope missing')
assert(acceptance.acceptedForNextGate.preserveNoDispatchWiring === true, 'No dispatch preservation missing')
assert(acceptance.acceptedForNextGate.preserveNoHookExecution === true, 'No hook execution preservation missing')
for (const key of [
  'indexExportWiring',
  'dispatchWiring',
  'runtimeExecution',
  'mediaExecution',
  'artifactCreation',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedForToday[key], `acceptance.acceptedForToday.${key}`)
}

assert(safety.reviewedSourceSafety.failClosedBlockedStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
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
  assertFalse(safety.reviewedSourceSafety[key], `safety.reviewedSourceSafety.${key}`)
}
assert(safety.reviewedSourceSafety.noArtifactCreated === true, 'No artifact claim missing')
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
  assert(safety.sourceBehaviorReviewedAbsent[key] === true, `safety.sourceBehaviorReviewedAbsent.${key} missing`)
}
for (const key of [
  'sourceCodeChangedToday',
  'indexWiringChangedToday',
  'dispatchWiringChangedToday',
  'hookExecutedToday',
  'mediaProcessedToday',
  'artifactCreatedToday',
  'supabaseSqlExecutedToday',
  'readinessUnlockedToday',
]) {
  assertFalse(safety.packetSafety[key], `safety.packetSafety.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase38_actual_source_owner_review_pending'),
  'Phase 38 source owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'index_export_wiring_plan_pending'),
  'Index export plan blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_user_media_beta_and_paid_production_pending'),
  'Product readiness blocker missing',
)

assert(claimPolicy.allowedClaims.phase38ActualSourceOwnerReviewPassed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.failClosedRuntimeIntegrationSourceAccepted === true, 'Fail-closed source claim missing')
assert(claimPolicy.allowedClaims.indexExportWiringPlanMayProceed === true, 'Index export planning claim missing')
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

assert(phase39Register.sourceDecision === expectedDecision, 'Phase 39 register source mismatch')
assert(phase39Register.phase39MayProceed === true, 'Phase 39 may proceed missing')
assert(phase39Register.futureIndexPath === indexPath, 'Phase 39 index path mismatch')
assert(phase39Register.futureSourcePath === sourcePath, 'Phase 39 source path mismatch')
assert(phase39Register.nextPrompt === nextPrompt, 'Phase 39 next prompt mismatch')
assert(phase39Register.futureAllowedScope.planIndexExportWiring === true, 'Phase 39 plan scope missing')
assert(phase39Register.futureAllowedScope.exportFailClosedSymbolsOnly === true, 'Phase 39 fail-closed scope missing')
for (const key of [
  'sourceChangeInThisPacket',
  'dispatchWiring',
  'hookExecution',
  'realMedia',
  'artifactCreation',
  'supabaseSql',
  'betaUnlock',
  'productionUnlock',
]) {
  assertFalse(phase39Register.futureAllowedScope[key], `phase39Register.futureAllowedScope.${key}`)
}

assert(phase39Prompt.requiredSourceDecision === expectedDecision, 'Phase 39 prompt source mismatch')
assert(phase39Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 39 prompt source head mismatch')
assert(phase39Prompt.owner === 'WORKER_RUNTIME_JOBS', 'Phase 39 owner mismatch')
assert(phase39Prompt.planningScope.futureIndexPath === indexPath, 'Phase 39 prompt index path mismatch')
assert(phase39Prompt.planningScope.futureRuntimeIntegrationSourcePath === sourcePath, 'Phase 39 prompt source path mismatch')
assert(phase39Prompt.planningScope.planIndexExportWiring === true, 'Phase 39 prompt planning scope missing')
for (const key of [
  'actualIndexSourceChangeToday',
  'dispatchWiringToday',
  'hookExecutionToday',
  'realMediaToday',
  'artifactCreationToday',
  'supabaseSqlToday',
  'betaUnlockToday',
  'productionUnlockToday',
]) {
  assertFalse(phase39Prompt.planningScope[key], `phase39Prompt.planningScope.${key}`)
}
assert(
  phase39Prompt.expectedNextDecision ===
    'worker_runtime_jobs_sound_cpu_phase39_caption_render_runtime_hook_blocked_state_index_export_wiring_plan_completed_with_warnings_ready_for_index_export_source_gate_no_media_no_artifacts',
  'Phase 39 prompt next decision mismatch',
)

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
  assert(!indexText.includes('soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration'), 'Index must not export runtime integration source in this gate')
}

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript], 'Package script missing')
assert(
  packageJson.scripts[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-review-diagnostics.mjs',
  'Package script command mismatch',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      reviewedSourcePath: sourcePath,
      nextPrompt,
      acceptedForIndexExportWiringPlan: true,
      indexExportWiredToday: false,
      dispatchWiredToday: false,
      hookExecutedToday: false,
      mediaProcessingApproved: false,
      artifactCreationApproved: false,
      supabaseSqlApproved: false,
      realUserMediaBetaApproved: false,
      paidProductionApproved: false,
    },
    null,
    2,
  ),
)
