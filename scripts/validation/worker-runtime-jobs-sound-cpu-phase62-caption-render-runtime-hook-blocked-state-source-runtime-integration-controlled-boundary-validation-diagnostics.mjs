import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase62_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_boundary_validation_passed_with_warnings_ready_for_controlled_boundary_validation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase61_caption_render_runtime_hook_blocked_state_source_runtime_integration_media_artifact_boundary_owner_review_passed_with_warnings_ready_for_controlled_boundary_validation_no_media_no_artifacts'
const sourceHead = 'baea7405d0bca45be5712eb66e841931b4b96601'
const sourceMergeCommit = '436912ba136a9fc95afec1268c8f89dcb1a4bb3e'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE62-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-BOUNDARY-VALIDATION-OWNER-REVIEW'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase62_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_boundary_validation_owner_review_passed_with_warnings_ready_for_external_agent_execution_plan_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-result.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-report.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-report',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-rejected-input-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-rejected-input-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-artifact-boundary-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-artifact-boundary-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-result',
)
const report = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-report',
)
const rejected = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-rejected-input-validation-register',
)
const artifact = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-artifact-boundary-validation-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-claim-policy',
)
const ownerRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-owner-review',
)

assert(result.decision === expectedDecision, 'Phase 62 decision mismatch')
assert(result.sourceVerification.sourcePr === 1866, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(result.controlledBoundaryValidation.acceptedSyntheticInputsValidated, 'Accepted synthetic validation missing')
assertTrue(result.controlledBoundaryValidation.rejectedRealMediaInputsValidated, 'Rejected media validation missing')
assertTrue(result.controlledBoundaryValidation.artifactBoundaryClosedValidated, 'Artifact boundary validation missing')
assertTrue(result.controlledBoundaryValidation.noWorkerDispatchValidated, 'No worker validation missing')
assertTrue(result.controlledBoundaryValidation.noSupabaseSqlValidated, 'No Supabase validation missing')
assert(result.controlledBoundaryValidation.hookSource === hookSource, 'Hook source mismatch')
for (const key of [
  'temporaryProofArtifactsCreated',
  'realMediaUsed',
  'artifactCreated',
  'workerDispatched',
  'routeToolProviderCalled',
  'supabaseSqlTouched',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assertFalse(result.controlledBoundaryValidation[key], `result.controlledBoundaryValidation.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(report.decision === expectedDecision, 'Report decision mismatch')
for (const file of [
  'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-accepted-synthetic-input-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-rejected-media-artifact-boundary-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-future-controlled-boundary-validation-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-review-result.md',
]) {
  assert(report.validatedSourceDocuments.includes(file), `Validated source document missing: ${file}`)
}
for (const value of Object.values(report.validationResults)) assertTrue(value, 'Validation result must be true')
assertTrue(report.validationExecution.diagnosticsOnly, 'Diagnostics-only flag missing')
for (const key of [
  'realMediaFixtureUsed',
  'temporaryProofFileCreated',
  'artifactCreated',
  'workerDispatched',
  'supabaseSqlTouched',
]) {
  assertFalse(report.validationExecution[key], `report.validationExecution.${key}`)
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
  assert(rejected.validatedRejectedInputs.includes(rejectedInput), `Rejected input missing: ${rejectedInput}`)
}
for (const value of Object.values(rejected.validationStatus)) assertTrue(value, 'Rejected validation must be true')

assertAllFalse(
  {
    artifactCreationToday: artifact.validatedArtifactBoundary.artifactCreationToday,
    storageTransferToday: artifact.validatedArtifactBoundary.storageTransferToday,
    signedUrlCreationToday: artifact.validatedArtifactBoundary.signedUrlCreationToday,
    publicArtifactCreationToday: artifact.validatedArtifactBoundary.publicArtifactCreationToday,
    manifestWriteToday: artifact.validatedArtifactBoundary.manifestWriteToday,
    databaseWriteToday: artifact.validatedArtifactBoundary.databaseWriteToday,
    temporaryProofArtifactCreated: artifact.validatedArtifactBoundary.temporaryProofArtifactCreated,
    workerDispatchToday: artifact.validatedExecutionBoundary.workerDispatchToday,
    routeToolProviderCallToday: artifact.validatedExecutionBoundary.routeToolProviderCallToday,
    supabaseSqlToday: artifact.validatedExecutionBoundary.supabaseSqlToday,
    realMediaInputToday: artifact.validatedExecutionBoundary.realMediaInputToday,
    browserCaptureToday: artifact.validatedExecutionBoundary.browserCaptureToday,
  },
  'artifact.boundary',
)
assertTrue(artifact.validatedArtifactBoundary.noArtifactCreated, 'No artifact created flag missing')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase62_controlled_boundary_validation_pending'),
  'Controlled boundary validation blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase62_controlled_boundary_validation_owner_review_pending',
  ),
  'Boundary validation owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_plan_pending'),
  'External execution plan blocker missing',
)

assertTrue(claims.allowedClaims.phase62ControlledBoundaryValidationPassed, 'Phase 62 validation claim missing')
assertTrue(claims.allowedClaims.acceptedSyntheticInputsValidated, 'Accepted synthetic validation claim missing')
assertTrue(claims.allowedClaims.rejectedRealMediaInputsValidated, 'Rejected media validation claim missing')
assertTrue(claims.allowedClaims.artifactBoundaryValidatedClosed, 'Artifact closed validation claim missing')
assertTrue(claims.allowedClaims.controlledBoundaryValidationOwnerReviewMayProceed, 'Owner review claim missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerRegister.sourceDecision === expectedDecision, 'Owner register source decision mismatch')
assertTrue(ownerRegister.ownerReviewMayProceed, 'Owner review may proceed missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewAcceptedSyntheticInputValidation, 'Owner review synthetic validation scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewRejectedRealMediaInputValidation, 'Owner review rejected validation scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewArtifactBoundaryValidation, 'Owner review artifact validation scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.considerExternalAgentExecutionPlan, 'External execution plan consideration missing')
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

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.hookSource === hookSource, 'Owner prompt hook source mismatch')
assertTrue(ownerPrompt.reviewScope.reviewAcceptedSyntheticInputValidation, 'Owner prompt synthetic validation scope missing')
assertTrue(ownerPrompt.reviewScope.reviewRejectedRealMediaInputValidation, 'Owner prompt rejected validation scope missing')
assertTrue(ownerPrompt.reviewScope.reviewArtifactBoundaryValidation, 'Owner prompt artifact validation scope missing')
assertTrue(ownerPrompt.reviewScope.considerExternalAgentExecutionPlan, 'Owner prompt external plan scope missing')
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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-diagnostics.mjs',
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
      sourcePr: 1866,
      sourceHead,
      sourceMergeCommit,
      acceptedSyntheticInputsValidated: true,
      rejectedRealMediaInputsValidated: true,
      artifactBoundaryClosedValidated: true,
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
