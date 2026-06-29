import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37q_caption_render_runtime_hook_blocked_state_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37q_caption_render_runtime_hook_blocked_state_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_artifacts'
const previousOwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_owner_review_passed_with_warnings_ready_for_static_validation_no_media_no_artifacts'
const sourceMergeCommit = 'f1fd561050c7735792e23cf64dc4e540a5139dc0'
const sourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.md',
    'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1671, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewDecision.phase37QStaticValidationAccepted === true, 'Phase 37Q acceptance missing')
assert(review.reviewDecision.controlledImportProofMayProceed === true, 'Controlled import proof approval missing')
assert(review.reviewDecision.integrationSourcePath === sourcePath, 'Integration source path mismatch')
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
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37QSourcePr === 1671, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37QDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37PSourceOwnerReviewDecision === previousOwnerDecision, 'Phase 37P owner-review source mismatch')
for (const key of [
  'integrationSourceExists',
  'indexExportExists',
  'factoryShapePassed',
  'blockedAssertionShapePassed',
  'prohibitedSourceScanPassed',
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

assert(readiness.sourceDecision === decision, 'Phase 37R readiness source mismatch')
assert(readiness.phase37RMayProceed === true, 'Phase 37R may proceed missing')
for (const key of [
  'controlledStaticImportProofOnly',
  'typecheckOnly',
  'temporaryProofFileAllowedOnlyIfRemovedBeforeStaging',
  'importIntegrationSymbols',
  'noHookExecution',
  'noMediaInput',
  'noArtifactOutput',
  'noWorkerDispatch',
  'noRouteToolProviderCalls',
  'noSupabaseSql',
  'noBetaUnlock',
  'noProductionUnlock',
]) {
  assert(readiness.phase37RAllowedScope[key] === true, `phase37RAllowedScope.${key} must be true`)
}
assertFalse(readiness.phase37RAllowedScope.invokeFactory, 'phase37RAllowedScope.invokeFactory')
assertFalse(readiness.phase37RAllowedScope.invokeBlockedAssertion, 'phase37RAllowedScope.invokeBlockedAssertion')
for (const key of [
  'realMediaExecution',
  'ocrInference',
  'captionRenderRuntimeExecutionOverMedia',
  'workerExecution',
  'artifactCreation',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assert(readiness.phase37RStillBlocked[key] === true, `phase37RStillBlocked.${key} must be true`)
}

assert(safety.sourceDecision === decision, 'Safety source decision mismatch')
assert(safety.sourceSafety.allowedNextStep === 'controlled static import proof', 'Allowed next step mismatch')
assert(safety.sourceSafety.integrationSourceMustRemainFailClosed === true, 'Fail-closed source flag missing')
assert(safety.sourceSafety.temporaryProofFileMustBeRemovedBeforeStaging === true, 'Temporary proof cleanup flag missing')
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
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37R-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF',
  'Next controlled import proof prompt mismatch',
)

assert(claimPolicy.allowedClaims.phase37QStaticValidationOwnerReviewPassed === true, 'Owner review claim missing')
assert(claimPolicy.allowedClaims.phase37RControlledImportProofMayProceed === true, 'Phase 37R claim missing')
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
assert(nextPrompt.integrationSourcePath === sourcePath, 'Next prompt source path mismatch')
assert(nextPrompt.integrationTarget === indexPath, 'Next prompt integration target mismatch')
assert(nextPrompt.proofRules.temporaryProofFileAllowed === true, 'Next prompt temporary proof allowance missing')
assert(nextPrompt.proofRules.temporaryProofFileMustBeRemovedBeforeStaging === true, 'Next prompt cleanup requirement missing')
assert(nextPrompt.proofRules.expectedCommand === 'npx tsc -b', 'Next prompt expected command mismatch')
assert(nextPrompt.proofRules.serverTypecheckCommand === 'npm run typecheck:server', 'Next prompt server typecheck command mismatch')
for (const key of [
  'factoryInvocationAllowed',
  'blockedAssertionInvocationAllowed',
  'runtimeExecutionAllowed',
  'mediaInputAllowed',
  'artifactOutputAllowed',
]) {
  assertFalse(nextPrompt.proofRules[key], `nextPrompt.proofRules.${key}`)
}
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37QResult = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-result.md',
  'worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-result',
)
assert(phase37QResult.decision === sourceDecision, 'Phase 37Q static validation decision missing')

const sourceText = readText(sourcePath)
assert(sourceText.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Integration factory missing')
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

const indexText = readText(indexPath)
assert(indexText.includes('./runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'), 'Index integration export missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1671,
      sourceMergeCommit,
      phase37RControlledImportProofMayProceed: true,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37R-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF',
    },
    null,
    2,
  ),
)
