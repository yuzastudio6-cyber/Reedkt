import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase61_caption_render_runtime_hook_blocked_state_source_runtime_integration_media_artifact_boundary_plan_completed_with_warnings_ready_for_media_artifact_boundary_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase60_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_owner_review_passed_with_warnings_ready_for_media_artifact_boundary_plan_no_media_no_artifacts'
const sourceHead = 'a9f59f0f125ca32f9661af9ee3df2043583d31b4'
const sourceMergeCommit = '4e5f5fd4e611ca577a5eb3f329dd9f5a497ba114'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE61-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-MEDIA-ARTIFACT-BOUNDARY-PLAN-OWNER-REVIEW'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase61_caption_render_runtime_hook_blocked_state_source_runtime_integration_media_artifact_boundary_owner_review_passed_with_warnings_ready_for_controlled_boundary_validation_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-accepted-synthetic-input-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-accepted-synthetic-input-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-rejected-media-artifact-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-rejected-media-artifact-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-future-controlled-boundary-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-future-controlled-boundary-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-owner-review',
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

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record ?? {})) {
    assertFalse(value, `${label}.${key}`)
  }
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-result',
)
const accepted = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-accepted-synthetic-input-register',
)
const rejected = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-rejected-media-artifact-boundary-register',
)
const futureValidation = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-future-controlled-boundary-validation-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-claim-policy',
)
const ownerRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-owner-review',
)

assert(result.decision === expectedDecision, 'Phase 61 decision mismatch')
assert(result.sourceVerification.sourcePr === 1860, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(result.boundaryPlan.acceptedSyntheticInputsPlanned, 'Accepted synthetic input plan missing')
assertTrue(result.boundaryPlan.rejectedRealMediaInputsPlanned, 'Rejected media input plan missing')
assertTrue(result.boundaryPlan.artifactBoundaryPlanned, 'Artifact boundary plan missing')
assertTrue(result.boundaryPlan.futureControlledBoundaryValidationPlanned, 'Future boundary validation plan missing')
assert(result.boundaryPlan.hookSource === hookSource, 'Hook source mismatch')
for (const key of [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'renderExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactCreationApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(result.boundaryPlan[key], `result.boundaryPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(accepted.decision === expectedDecision, 'Accepted inputs decision mismatch')
for (const key of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey']) {
  assert(accepted.acceptedSyntheticInputs[key] === 'required_synthetic_identifier', `Accepted ${key} mismatch`)
}
assert(accepted.acceptedSyntheticInputs.hookName === 'ocrCaptionRenderSafeZonePlanningHook', 'Hook name mismatch')
assert(accepted.acceptedSyntheticInputs.captionCandidateZones === 'synthetic_metadata_only', 'Candidate zone policy mismatch')
assert(accepted.acceptedSyntheticInputs.ocrRegionHashes === 'hashed_or_synthetic_only', 'OCR hash policy mismatch')
for (const flag of [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED',
  'REEDITPRO_WORKER_EXECUTION_ENABLED',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED',
  'REEDITPRO_SUPABASE_MUTATION_ENABLED',
  'REEDITPRO_ARTIFACT_WRITE_ENABLED',
]) {
  assert(accepted.acceptedSyntheticInputs.runtimeDisabledFlags[flag] === '0', `${flag} must stay disabled`)
}
assertTrue(accepted.acceptedToday.syntheticMetadataOnly, 'Synthetic metadata allowed missing')
assertTrue(accepted.acceptedToday.hashesOnlyForOcrRegions, 'OCR hash allowance missing')
for (const key of ['realFrames', 'rawOcrText', 'mediaFilePath', 'signedUrl', 'artifactWriteTarget']) {
  assertFalse(accepted.acceptedToday[key], `accepted.acceptedToday.${key}`)
}

for (const rejectedInput of [
  'rawFrames',
  'rawOcrTextFromControlledMedia',
  'mediaFilePathsForExecution',
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloads',
  'providerOutputBlobs',
  'artifactWriteTargets',
]) {
  assert(rejected.rejectedRealMediaInputs.includes(rejectedInput), `Rejected input missing: ${rejectedInput}`)
}
assertAllFalse(
  {
    artifactCreationToday: rejected.artifactBoundary.artifactCreationToday,
    storageTransferToday: rejected.artifactBoundary.storageTransferToday,
    signedUrlCreationToday: rejected.artifactBoundary.signedUrlCreationToday,
    publicArtifactCreationToday: rejected.artifactBoundary.publicArtifactCreationToday,
    manifestWriteToday: rejected.artifactBoundary.manifestWriteToday,
    databaseWriteToday: rejected.artifactBoundary.databaseWriteToday,
    mediaFileOpenToday: rejected.mediaBoundary.mediaFileOpenToday,
    ffmpegOrFfprobeToday: rejected.mediaBoundary.ffmpegOrFfprobeToday,
    captionRenderOverRealMediaToday: rejected.mediaBoundary.captionRenderOverRealMediaToday,
    browserCaptureToday: rejected.mediaBoundary.browserCaptureToday,
    modelOrProviderCallToday: rejected.mediaBoundary.modelOrProviderCallToday,
  },
  'rejected.boundary',
)
assert(rejected.artifactBoundary.allowedEvidenceToday === 'sanitized_docs_only', 'Allowed evidence mismatch')
assertTrue(rejected.artifactBoundary.futureBoundaryProofMustVerifyNoArtifact, 'Future no-artifact proof missing')

assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.sourceOwnerReviewRequired, 'Owner review requirement missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.syntheticMetadataOnly, 'Future synthetic requirement missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.assertRejectedRealMediaInputs, 'Rejected media assertion missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.assertRejectedArtifactTargets, 'Artifact target assertion missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.assertDisabledRuntimeFlags, 'Disabled flags assertion missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.assertNoWorkerDispatch, 'No worker assertion missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.assertNoRouteToolProviderCall, 'No route/tool/provider assertion missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.assertNoSupabaseSql, 'No Supabase assertion missing')
assertTrue(futureValidation.futureControlledBoundaryValidationRequirements.assertNoBetaProductionUnlock, 'No beta/prod assertion missing')
assertFalse(futureValidation.futureControlledBoundaryValidationRequirements.temporaryProofArtifactsAllowed, 'Temporary proof artifacts must be false')
assertFalse(futureValidation.futureControlledBoundaryValidationRequirements.realMediaFixtureAllowed, 'Real media fixture must be false')
for (const value of Object.values(futureValidation.minimumExpectedFutureEvidence)) {
  assertTrue(value, 'Future evidence values must be true')
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase61_media_artifact_boundary_plan_pending'),
  'Boundary plan resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase61_media_artifact_boundary_owner_review_pending'),
  'Boundary owner review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claims.allowedClaims.phase61BoundaryPlanCompleted, 'Boundary plan claim missing')
assertTrue(claims.allowedClaims.acceptedSyntheticInputsPlanned, 'Synthetic input plan claim missing')
assertTrue(claims.allowedClaims.rejectedRealMediaInputsPlanned, 'Rejected media plan claim missing')
assertTrue(claims.allowedClaims.artifactBoundaryPlannedClosed, 'Closed artifact boundary claim missing')
assertTrue(claims.allowedClaims.futureControlledBoundaryValidationMayBeReviewed, 'Future validation review claim missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerRegister.sourceDecision === expectedDecision, 'Owner register source decision mismatch')
assertTrue(ownerRegister.ownerReviewMayProceed, 'Owner review may proceed missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewAcceptedSyntheticInputs, 'Owner review synthetic scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewRejectedRealMediaInputs, 'Owner review rejected input scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewClosedArtifactBoundary, 'Owner review artifact scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewFutureControlledBoundaryValidationRequirements, 'Owner review future validation scope missing')
for (const key of [
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(ownerRegister.ownerReviewAllowedScope[key], `ownerRegister.ownerReviewAllowedScope.${key}`)
}
assertTrue(ownerRegister.stillBlocked.externalAgentExecution, 'Owner register external execution blocker missing')
assert(ownerRegister.nextPrompt === nextPrompt, 'Owner register next prompt mismatch')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.hookSource === hookSource, 'Owner prompt hook source mismatch')
assertTrue(ownerPrompt.reviewScope.reviewAcceptedSyntheticInputs, 'Owner prompt synthetic scope missing')
assertTrue(ownerPrompt.reviewScope.reviewRejectedRealMediaInputs, 'Owner prompt rejected input scope missing')
assertTrue(ownerPrompt.reviewScope.reviewClosedArtifactBoundary, 'Owner prompt artifact scope missing')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(ownerPrompt.reviewScope[key], `ownerPrompt.reviewScope.${key}`)
}
assert(ownerPrompt.expectedDecision === ownerReviewDecision, 'Owner prompt expected decision mismatch')
assertNoop(ownerPrompt.supabaseClassification, 'ownerPrompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-diagnostics.mjs',
  'Package script missing',
)

const hookText = readText(hookSource)
for (const snippet of [
  'rawFrames',
  'rawOcrTextFromControlledMedia',
  'mediaFilePathsForExecution',
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloads',
  'providerOutputBlobs',
  'artifactWriteTargets',
  'artifactCreationApproved: false',
  'noArtifactCreated: true',
]) {
  assert(hookText.includes(snippet), `Hook source missing expected boundary snippet: ${snippet}`)
}
assert(
  !/audio_open|ffmpeg|ffprobe|pydub|writeArtifact|createSignedUrl|createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|service[_-]role/i.test(
    hookText,
  ),
  'Hook source contains prohibited runtime/media/Supabase marker',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1860,
      sourceHead,
      sourceMergeCommit,
      acceptedSyntheticInputsPlanned: true,
      rejectedRealMediaInputsPlanned: true,
      artifactBoundaryPlannedClosed: true,
      futureControlledBoundaryValidationPlanned: true,
      realMediaUsed: false,
      artifactCreated: false,
      workerDispatched: false,
      routeToolProviderCalled: false,
      supabaseSql: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
