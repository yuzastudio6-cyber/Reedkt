import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_controlled_private_manifest_instance_creation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_plan_completed_with_warnings_ready_for_private_manifest_instance_creation_owner_review_no_media_no_artifacts'
const sourceHead = '417a90b9cf508a2d22a3e3b5eb3a2af87a0bb491'
const sourceMergeCommit = '09d0f29d74618128730c3c493f6073721c937745'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE72-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-PRIVATE-MANIFEST-INSTANCE-CREATION'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-shape-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-shape-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-boundary-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-boundary-owner-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-fixture-input-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-fixture-input-owner-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation',
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
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-acceptance-register',
)
const shape = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-shape-review-register',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-boundary-owner-review-register',
)
const fixture = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-fixture-input-owner-review-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-claim-policy',
)
const next = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation',
)

const phase71 = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan-result.md',
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan-result',
)
assert(phase71.decision === sourceDecision, 'Source Phase 71 decision mismatch')
assert(phase71.sourceVerification.sourceMergeCommit === '6d198fca587cfcdebed2c1700fafd3d98f0b3a1b', 'Phase 71 source merge mismatch')
assertTrue(phase71.creationPlan.manifestInstanceCreationShapePlanned, 'Creation shape was not planned')
assertTrue(phase71.creationPlan.validationCallBoundaryPlanned, 'Validation boundary was not planned')
assertTrue(phase71.creationPlan.noMediaNoArtifactFixtureInputsPlanned, 'Fixture inputs were not planned')
assert(phase71.soundCpuTools.readyForRealExecutionToday === 0, 'Phase 71 ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1912, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.reviewedPlan.sourcePath === sourcePath, 'Reviewed source path mismatch')
for (const key of [
  'manifestInstanceCreationShapeAccepted',
  'validationCallBoundaryAccepted',
  'noMediaNoArtifactFixtureInputsAccepted',
  'runtimeDefaultsFalseAccepted',
  'controlledPrivateManifestInstanceCreationMayProceed',
]) {
  assertTrue(result.reviewedPlan[key], `result.reviewedPlan.${key}`)
}
for (const key of [
  'manifestInstanceCreatedToday',
  'realMediaUsedToday',
  'artifactCreatedToday',
  'workerDispatchedToday',
  'routeToolProviderCalledToday',
  'supabaseSqlTouchedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday',
]) {
  assertFalse(result.reviewedPlan[key], `result.reviewedPlan.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase71Pr === 1912, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase71Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase71MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.sourcePath === sourcePath, 'Acceptance source path mismatch')
for (const key of [
  'manifestInstanceCreationShapePlanned',
  'validationCallBoundaryPlanned',
  'noMediaNoArtifactFixtureInputsPlanned',
  'runtimeDefaultsFalsePlanned',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real mismatch')
assertTrue(acceptance.acceptedScope.controlledPrivateManifestInstanceCreation, 'Controlled instance creation must be accepted')
for (const key of [
  'realMediaProcessing',
  'artifactCreation',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(shape.decision === expectedDecision, 'Shape decision mismatch')
assert(shape.sourcePath === sourcePath, 'Shape source path mismatch')
for (const field of [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'jobType',
  'privateMediaAssetIds',
  'plannedPrivateArtifactIds',
  'runtimeDefaults',
]) {
  assert(shape.acceptedCreationInputs.includes(field), `Missing accepted creation input: ${field}`)
}
for (const [key, value] of Object.entries(shape.acceptedOutputCategories)) {
  if (['persistedManifestInstance', 'artifactRecord', 'storageObject'].includes(key)) {
    assertFalse(value, `shape.acceptedOutputCategories.${key}`)
  } else {
    assertTrue(value, `shape.acceptedOutputCategories.${key}`)
  }
}
assertTrue(shape.todayAllowed.ownerReview, 'Owner review must be allowed')
assertTrue(shape.todayAllowed.controlledInstanceCreationNext, 'Controlled instance creation next must be allowed')
for (const key of ['realMediaProcessing', 'artifactCreation', 'workerDispatch', 'supabaseSql']) {
  assertFalse(shape.todayAllowed[key], `shape.todayAllowed.${key}`)
}

assert(boundary.decision === expectedDecision, 'Boundary decision mismatch')
assert(boundary.acceptedValidationFunction === 'validateSoundCpuPrivateMediaManifest', 'Validation function mismatch')
for (const value of Object.values(boundary.acceptedBoundary)) assertTrue(value, 'Every boundary rule must be true')
for (const value of Object.values(boundary.acceptedFailureHandling)) assertTrue(value, 'Every failure handling rule must be true')
assertTrue(boundary.todayAllowed.ownerReview, 'Boundary owner review must be allowed')
assertTrue(boundary.todayAllowed.controlledValidationCallNext, 'Controlled validation call next must be allowed')
for (const key of ['workerExecution', 'mediaProcessing', 'artifactCreation', 'supabaseSql']) {
  assertFalse(boundary.todayAllowed[key], `boundary.todayAllowed.${key}`)
}

assert(fixture.decision === expectedDecision, 'Fixture decision mismatch')
assertTrue(fixture.acceptedFixturePolicy.fixtureInputsAllowedInFutureGate, 'Future fixture inputs must be accepted')
assertFalse(fixture.acceptedFixturePolicy.concreteFixtureCreatedToday, 'Concrete fixture must not be created')
for (const key of [
  'privateMediaAssetIdsAreOpaqueIdsOnly',
  'plannedPrivateArtifactIdsAreOpaqueIdsOnly',
]) {
  assertTrue(fixture.acceptedFixturePolicy[key], `fixture.acceptedFixturePolicy.${key}`)
}
for (const key of [
  'realMediaPathsAllowed',
  'signedUrlsAllowed',
  'publicUrlsAllowed',
  'storageObjectWritesAllowed',
  'providerOutputAllowed',
  'modelWeightReferencesAllowed',
  'secretsAllowed',
]) {
  assertFalse(fixture.acceptedFixturePolicy[key], `fixture.acceptedFixturePolicy.${key}`)
}
assertTrue(fixture.todayAllowed.ownerReview, 'Fixture owner review must be allowed')
assertTrue(fixture.todayAllowed.controlledNoMediaFixtureInputNext, 'Controlled fixture input next must be allowed')
for (const key of ['realMediaRead', 'artifactWrite', 'supabaseSql']) {
  assertFalse(fixture.todayAllowed[key], `fixture.todayAllowed.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.allowedNextStep === 'controlled private manifest instance creation without media or artifacts', 'Safety next step mismatch')
assertTrue(safety.nextStepMustRemainNoMediaNoArtifact, 'Next step must remain no-media/no-artifact')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')
assertNoop(safety.supabaseClassification, 'safety')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_instance_creation_owner_review_pending'),
  'Owner-review blocker resolution missing',
)
for (const blockerId of [
  'controlled_private_manifest_instance_creation_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase71OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.manifestInstanceCreationShapeAccepted, 'Creation shape claim missing')
assertTrue(claims.allowedClaims.validationCallBoundaryAccepted, 'Validation boundary claim missing')
assertTrue(claims.allowedClaims.noMediaNoArtifactFixtureInputsAccepted, 'Fixture input claim missing')
assertTrue(claims.allowedClaims.runtimeDefaultsFalseAccepted, 'Runtime defaults claim missing')
assertTrue(claims.allowedClaims.controlledPrivateManifestInstanceCreationMayProceed, 'Controlled creation may proceed claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(next.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(next.creationScope.sourcePath === sourcePath, 'Next prompt source path mismatch')
for (const key of [
  'createControlledPrivateManifestInstance',
  'useNoMediaNoArtifactFixtureInputs',
  'callValidateSoundCpuPrivateMediaManifest',
  'recordSanitizedValidationEvidence',
]) {
  assertTrue(next.creationScope[key], `next.creationScope.${key}`)
}
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(next.creationScope[key], `next.creationScope.${key}`)
}
assertNoop(next.supabaseClassification, 'next')

const sourceText = readText(sourcePath)
for (const requiredText of [
  'export type SoundCpuPrivateMediaManifest',
  'export type SoundCpuPrivateMediaManifestInput',
  'export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
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
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review-diagnostics.mjs',
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
      controlledPrivateManifestInstanceCreationMayProceed: true,
      soundCpuToolCountCovered: claims.allowedClaims.soundCpuToolCountCovered,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
