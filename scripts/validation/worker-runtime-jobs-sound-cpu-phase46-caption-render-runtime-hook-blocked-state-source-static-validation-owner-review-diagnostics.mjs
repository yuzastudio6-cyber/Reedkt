import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_artifacts'
const previousOwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase45_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_static_validation_no_media_no_artifacts'
const sourceHead = 'f0bc0e8f6606e16c1289e609696f5876a821cf7a'
const sourceMergeCommit = '8d659c0e15a4b91ae69fc8e1a397e8755d81dee5'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const blockedStateIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.md',
    'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof',
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1780, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewDecision.phase46StaticValidationAccepted === true, 'Phase 46 acceptance missing')
assert(review.reviewDecision.controlledImportProofMayProceed === true, 'Controlled import proof approval missing')
assert(review.reviewDecision.hookSourcePath === hookSourcePath, 'Hook source path mismatch')
assert(review.reviewDecision.blockedStateIntegrationPath === blockedStateIntegrationPath, 'Blocked-state path mismatch')
assert(review.reviewDecision.runtimeIntegrationPath === runtimeIntegrationPath, 'Runtime path mismatch')
assert(review.reviewDecision.indexExportReviewed === true, 'Index export review missing')
assert(review.reviewDecision.sourceShapeReviewed === true, 'Source shape review missing')
assert(review.reviewDecision.prohibitedSourceScanReviewed === true, 'Prohibited scan review missing')
assert(review.reviewDecision.runtimeDisabledFlagsReviewed === true, 'Runtime disabled flags review missing')
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
assert(review.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE47-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF', 'Next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase46SourcePr === 1780, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase46Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase45OwnerReviewDecision === previousOwnerDecision, 'Phase 45 owner source mismatch')
for (const key of [
  'hookSourceExists',
  'blockedStateIntegrationSourceExists',
  'runtimeIntegrationSourceExists',
  'indexExportExists',
  'hookShapePassed',
  'blockedStateIntegrationShapePassed',
  'runtimeIntegrationShapePassed',
  'prohibitedSourceScanPassed',
  'sourceHashesRecorded',
]) {
  assert(acceptance.acceptedEvidence[key] === true, `acceptedEvidence.${key} must be true`)
}
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.controlledImportProofPlanning === true, 'Controlled import proof scope missing')
assert(acceptance.acceptedScope.staticValidationOwnerReviewPassed === true, 'Owner review scope missing')
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

assert(readiness.sourceDecision === decision, 'Phase 47 readiness source mismatch')
assert(readiness.phase47MayProceed === true, 'Phase 47 may proceed missing')
for (const key of [
  'controlledStaticImportProofOnly',
  'typecheckOnly',
  'temporaryProofFileAllowedOnlyIfRemovedBeforeStaging',
  'importHookSymbols',
  'importBlockedStateIntegrationSymbols',
  'importRuntimeIntegrationSymbols',
  'importIndexSymbols',
  'noHookExecution',
  'noMediaInput',
  'noArtifactOutput',
  'noWorkerDispatch',
  'noRouteToolProviderCalls',
  'noSupabaseSql',
  'noBetaUnlock',
  'noProductionUnlock',
]) {
  assert(readiness.phase47AllowedScope[key] === true, `phase47AllowedScope.${key} must be true`)
}
assertFalse(readiness.phase47AllowedScope.invokeFactory, 'phase47AllowedScope.invokeFactory')
assertFalse(readiness.phase47AllowedScope.invokeBlockedAssertion, 'phase47AllowedScope.invokeBlockedAssertion')
for (const key of [
  'realMediaExecutionBlocked',
  'ocrInferenceBlocked',
  'captionRenderRuntimeExecutionOverMediaBlocked',
  'workerExecutionBlocked',
  'artifactCreationBlocked',
  'realUserMediaBetaBlocked',
  'paidProductionBlocked',
]) {
  assert(readiness.phase47StillBlocked[key] === true, `phase47StillBlocked.${key} must be true`)
}

assert(safety.sourceDecision === decision, 'Safety source decision mismatch')
assert(safety.sourceSafety.allowedNextStep === 'controlled static import proof', 'Allowed next step mismatch')
for (const key of [
  'hookSourceMustRemainFailClosed',
  'blockedStateIntegrationSourceMustRemainFailClosed',
  'runtimeIntegrationSourceMustRemainFailClosed',
  'temporaryProofFileMustBeRemovedBeforeStaging',
]) {
  assert(safety.sourceSafety[key] === true, `sourceSafety.${key} must be true`)
}
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
  blocker.blockerPrompts.nextControlledImportProofPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE47-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF',
  'Next controlled import proof prompt mismatch',
)

for (const key of [
  'phase46StaticValidationOwnerReviewPassed',
  'phase47ControlledImportProofMayProceed',
  'hookSourceStaticallyValidated',
  'blockedStateIntegrationSourceStaticallyValidated',
  'runtimeIntegrationSourceStaticallyValidated',
  'runtimeRemainsFailClosed',
]) {
  assert(claimPolicy.allowedClaims[key] === true, `claimPolicy.allowedClaims.${key} missing`)
}
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
assert(nextPrompt.hookSourcePath === hookSourcePath, 'Next prompt hook path mismatch')
assert(nextPrompt.blockedStateIntegrationPath === blockedStateIntegrationPath, 'Next prompt blocked path mismatch')
assert(nextPrompt.runtimeIntegrationPath === runtimeIntegrationPath, 'Next prompt runtime path mismatch')
assert(nextPrompt.integrationTarget === indexPath, 'Next prompt index target mismatch')
assert(nextPrompt.proofRules.temporaryProofFile === tempProofFile, 'Next prompt temporary file mismatch')
assert(nextPrompt.proofRules.temporaryProofFileAllowed === true, 'Next prompt temporary proof allowance missing')
assert(nextPrompt.proofRules.temporaryProofFileMustBeRemovedBeforeStaging === true, 'Next prompt cleanup requirement missing')
assert(nextPrompt.proofRules.expectedCommand === 'npx tsc -b', 'Next prompt expected command mismatch')
assert(nextPrompt.proofRules.serverTypecheckCommand === 'npm run typecheck:server', 'Next prompt server typecheck command mismatch')
for (const key of [
  'importHookSymbols',
  'importBlockedStateIntegrationSymbols',
  'importRuntimeIntegrationSymbols',
  'importIndexSymbols',
]) {
  assert(nextPrompt.proofRules[key] === true, `nextPrompt.proofRules.${key} must be true`)
}
for (const key of [
  'factoryInvocationAllowed',
  'blockedAssertionInvocationAllowed',
  'runtimeExecutionAllowed',
  'mediaInputAllowed',
  'artifactOutputAllowed',
]) {
  assertFalse(nextPrompt.proofRules[key], `nextPrompt.proofRules.${key}`)
}
assertSupabaseNoop(nextPrompt.supabaseClassification, 'nextPrompt')

const phase46Result = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-result.md',
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-result',
)
assert(phase46Result.decision === sourceDecision, 'Phase 46 static validation decision missing')

for (const requiredPath of [hookSourcePath, blockedStateIntegrationPath, runtimeIntegrationPath, indexPath]) {
  assert(fs.existsSync(path.join(repoRoot, requiredPath)), `Required source path missing: ${requiredPath}`)
}
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const hookText = readText(hookSourcePath)
const blockedText = readText(blockedStateIntegrationPath)
const runtimeText = readText(runtimeIntegrationPath)
for (const text of [hookText, blockedText, runtimeText]) {
  for (const snippet of [
    'runtimeExecutionApproved: false',
    'workerExecutionApproved: false',
    'mediaProcessingApproved: false',
    'artifactCreationApproved: false',
    'noArtifactCreated: true',
  ]) {
    assert(text.includes(snippet), `Missing fail-closed snippet: ${snippet}`)
  }
  assertAbsent(text, /\bfs\./, 'Filesystem operation')
  assertAbsent(text, /fs\/promises|node:fs|readFile|writeFile|createReadStream|createWriteStream/, 'Filesystem import or helper')
  assertAbsent(text, /fetch\s*\(/, 'fetch call')
  assertAbsent(text, /child_process|exec\s*\(|spawn\s*\(/, 'process spawn')
  assertAbsent(text, /audio_open|ffmpeg|ffprobe|pydub|ocrInference|renderCaption|writeArtifact|createSignedUrl/, 'media or artifact operation')
  assertAbsent(
    text,
    /createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|sql`|executeSql|service[_-]role/i,
    'Supabase or SQL-like operation',
  )
}
assert(runtimeText.includes('realUserMediaBetaApproved: false'), 'Real-user beta approval must remain false')
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
  'worker-runtime-jobs:sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1780,
      sourceHead,
      sourceMergeCommit,
      phase47ControlledImportProofMayProceed: true,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE47-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF',
    },
    null,
    2,
  ),
)
