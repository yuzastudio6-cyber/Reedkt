import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase73_caption_render_runtime_hook_private_manifest_instance_static_validation_owner_review_passed_with_warnings_ready_for_real_media_artifact_boundary_plan_no_execution'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase73_caption_render_runtime_hook_private_manifest_instance_static_validation_passed_with_warnings_ready_for_private_manifest_instance_static_validation_owner_review_no_media_no_artifacts'
const sourceHead = '1b6dfa9f56074156dc5ef59548eea770ce7c52fc'
const sourceMergeCommit = '01e915e966dd7ad651a634367df6aa70a634bb45'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const proofRunner =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-runner.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review:diagnostics'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE74-CAPTION-RENDER-RUNTIME-HOOK-REAL-MEDIA-ARTIFACT-BOUNDARY-PLAN'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-owner-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-proof-runner-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-proof-runner-owner-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-real-media-artifact-boundary-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-real-media-artifact-boundary-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-plan.md',
    'worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-plan',
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
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-acceptance-register',
)
const sourceReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-owner-review-register',
)
const runnerReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-proof-runner-owner-review-register',
)
const boundaryReadiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-real-media-artifact-boundary-readiness-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-claim-policy',
)
const next = parsed.get('worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-real-media-artifact-boundary-plan')

const phase73 = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-result.md',
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-result',
)
assert(phase73.decision === sourceDecision, 'Source Phase 73 decision mismatch')
assert(phase73.sourceVerification.sourceMergeCommit === 'c208b5a460e1fc954cadf7ab3937efdd734f1fa5', 'Phase 73 source merge mismatch')
assertTrue(phase73.staticValidation.controlledInstanceEvidenceValidated, 'Controlled instance static validation missing')
assertTrue(phase73.staticValidation.prohibitedRuntimeInstructionScanPassed, 'Prohibited runtime scan missing')
assert(phase73.soundCpuTools.readyForRealExecutionToday === 0, 'Phase 73 ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1920, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.reviewedEvidence.sourcePath === sourcePath, 'Reviewed source path mismatch')
assert(result.reviewedEvidence.proofRunner === proofRunner, 'Reviewed proof runner mismatch')
for (const key of [
  'staticValidationResultAccepted',
  'manifestSourceBoundaryAccepted',
  'proofRunnerBoundaryAccepted',
  'controlledInstanceEvidenceAccepted',
  'prohibitedRuntimeScanAccepted',
  'acceptedForRealMediaArtifactBoundaryPlanningOnly',
]) {
  assertTrue(result.reviewedEvidence[key], `result.reviewedEvidence.${key}`)
}
for (const key of [
  'realMediaUsedToday',
  'artifactCreatedToday',
  'workerDispatchedToday',
  'routeToolProviderCalledToday',
  'supabaseSqlTouchedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday',
]) {
  assertFalse(result.reviewedEvidence[key], `result.reviewedEvidence.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase73Pr === 1920, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase73Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase73MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
for (const key of [
  'sourceBoundaryValidated',
  'proofRunnerBoundaryValidated',
  'controlledInstanceEvidenceValidated',
  'prohibitedRuntimeScanPassed',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real mismatch')
assertTrue(acceptance.acceptedScope.realMediaArtifactBoundaryPlanning, 'Boundary planning must be accepted')
for (const key of [
  'realMediaProcessingToday',
  'artifactCreationToday',
  'workerDispatchToday',
  'routeToolProviderExecutionToday',
  'supabaseSqlToday',
  'realUserMediaBetaToday',
  'paidProductionToday',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(sourceReview.decision === expectedDecision, 'Source-review decision mismatch')
assert(sourceReview.reviewedSourceBoundary.sourcePath === sourcePath, 'Source-review path mismatch')
assert(sourceReview.reviewedSourceBoundary.acceptedWorkerNames === 2, 'Source-review worker count mismatch')
assert(sourceReview.reviewedSourceBoundary.acceptedJobTypes === 4, 'Source-review job count mismatch')
for (const key of [
  'manifestTypesPresent',
  'runtimeDefaultsFalsePresent',
  'validatorFunctionPresent',
  'acceptedForMediaProcessingTodayFalse',
  'acceptedForArtifactCreationTodayFalse',
  'acceptedForWorkerDispatchTodayFalse',
]) {
  assertTrue(sourceReview.reviewedSourceBoundary[key], `sourceReview.reviewedSourceBoundary.${key}`)
}
assertTrue(sourceReview.acceptedForNextGate.realMediaArtifactBoundaryPlanning, 'Boundary planning next gate missing')
for (const key of ['realMediaRead', 'artifactWrite', 'workerDispatch', 'supabaseSql']) {
  assertFalse(sourceReview.acceptedForNextGate[key], `sourceReview.acceptedForNextGate.${key}`)
}

assert(runnerReview.decision === expectedDecision, 'Runner-review decision mismatch')
assert(runnerReview.reviewedProofRunner.proofRunner === proofRunner, 'Runner-review path mismatch')
for (const key of [
  'usesValidator',
  'usesOpaqueFixtureIds',
  'recordsSanitizedCountsOnly',
  'marksPersistedManifestInstanceFalse',
  'marksRealMediaUsedFalse',
  'marksArtifactCreatedFalse',
  'marksWorkerDispatchedFalse',
  'marksSupabaseSqlTouchedFalse',
]) {
  assertTrue(runnerReview.reviewedProofRunner[key], `runnerReview.reviewedProofRunner.${key}`)
}

assert(boundaryReadiness.decision === expectedDecision, 'Boundary readiness decision mismatch')
for (const key of [
  'privateManifestSourceReviewed',
  'controlledInstanceEvidenceReviewed',
  'staticValidationReviewed',
  'realMediaArtifactBoundaryPlanMayProceed',
]) {
  assertTrue(boundaryReadiness.boundaryPlanningReadiness[key], `boundaryReadiness.boundaryPlanningReadiness.${key}`)
}
for (const key of [
  'realMediaExecutionMayProceedToday',
  'artifactCreationMayProceedToday',
  'workerDispatchMayProceedToday',
  'externalBetaMayProceedToday',
  'paidProductionMayProceedToday',
]) {
  assertFalse(boundaryReadiness.boundaryPlanningReadiness[key], `boundaryReadiness.boundaryPlanningReadiness.${key}`)
}
assert(boundaryReadiness.mustPlanBeforeExecution.length >= 7, 'Boundary planning checklist incomplete')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'private_manifest_instance_static_validation_owner_review_pending',
  ),
  'Owner-review blocker resolution missing',
)
for (const blockerId of [
  'real_media_artifact_boundary_plan_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

for (const key of [
  'phase73OwnerReviewPassed',
  'staticValidationResultAccepted',
  'manifestSourceBoundaryAccepted',
  'proofRunnerBoundaryAccepted',
  'controlledInstanceEvidenceAccepted',
  'realMediaArtifactBoundaryPlanMayProceed',
]) {
  assertTrue(claims.allowedClaims[key], `claims.allowedClaims.${key}`)
}
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(next.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
for (const key of [
  'planPrivateMediaReadBoundary',
  'planPrivateArtifactWriteBoundary',
  'planManifestBackedIdempotencyAndOwnership',
  'planStorageTransferAndSignedUrlProhibitions',
  'planWorkerDispatchPreflightWithoutDispatch',
  'planSupabaseNoOpOrFutureMigrationBoundary',
  'planRealUserMediaBetaGate',
]) {
  assertTrue(next.planningScope[key], `next.planningScope.${key}`)
}
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(next.planningScope[key], `next.planningScope.${key}`)
}
assertNoop(next.supabaseClassification, 'next')

const sourceText = readText(sourcePath)
for (const requiredText of [
  'export type SoundCpuPrivateMediaManifest',
  'export function validateSoundCpuPrivateMediaManifest',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(requiredText), `Source missing: ${requiredText}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript]?.includes(
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-diagnostics.mjs',
  ),
  'Package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourceMergeCommit,
      sourcePath,
      realMediaArtifactBoundaryPlanMayProceed: true,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
