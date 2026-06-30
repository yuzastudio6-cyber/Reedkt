import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_plan_completed_with_warnings_ready_for_private_manifest_instance_creation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase70_caption_render_runtime_hook_private_manifest_instance_owner_review_passed_with_warnings_ready_for_private_manifest_instance_creation_plan_no_media_no_artifacts'
const sourceHead = '05ca661d202120fc62f6abdde1f6015865c172da'
const sourceMergeCommit = '6d198fca587cfcdebed2c1700fafd3d98f0b3a1b'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE71-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-CREATION-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-shape-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-shape-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-call-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-call-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-no-media-no-artifact-fixture-input-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-no-media-no-artifact-fixture-input-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-runtime-defaults-policy-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-runtime-defaults-policy-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan-result',
)
const shape = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-shape-register',
)
const validation = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-call-boundary-register',
)
const fixture = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-no-media-no-artifact-fixture-input-register',
)
const runtimeDefaults = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-runtime-defaults-policy-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review',
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Source Phase 70 owner-review decision mismatch')
assert(sourceReview.sourceVerification.sourceMergeCommit === 'e511b74283c9e6ede32d0adf895316ae158d0b1b', 'Phase 70 owner-review merge mismatch')
assertTrue(sourceReview.reviewedPlan.privateManifestInstanceCreationPlanMayProceed, 'Creation plan was not approved')
assert(sourceReview.reviewedPlan.sourcePath === sourcePath, 'Source review path mismatch')
assert(sourceReview.soundCpuTools.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Phase 71 decision mismatch')
assert(result.sourceVerification.sourcePr === 1910, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.creationPlan.sourcePath === sourcePath, 'Creation plan source path mismatch')
for (const key of [
  'manifestInstanceCreationShapePlanned',
  'validationCallBoundaryPlanned',
  'noMediaNoArtifactFixtureInputsPlanned',
  'runtimeDefaultsFalsePlanned',
]) {
  assertTrue(result.creationPlan[key], `result.creationPlan.${key}`)
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
  assertFalse(result.creationPlan[key], `result.creationPlan.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

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
  assert(shape.plannedCreationInputs.includes(field), `Missing planned creation input: ${field}`)
}
for (const [key, value] of Object.entries(shape.plannedOutputCategories)) {
  if (['persistedManifestInstance', 'artifactRecord', 'storageObject'].includes(key)) {
    assertFalse(value, `shape.plannedOutputCategories.${key}`)
  } else {
    assertTrue(value, `shape.plannedOutputCategories.${key}`)
  }
}
assertTrue(shape.todayAllowed.creationShapePlanning, 'Creation shape planning must be allowed')
for (const key of ['manifestInstanceCreation', 'workerDispatch', 'mediaProcessing', 'artifactCreation', 'supabaseSql']) {
  assertFalse(shape.todayAllowed[key], `shape.todayAllowed.${key}`)
}

assert(validation.decision === expectedDecision, 'Validation decision mismatch')
for (const key of [
  'callValidationBeforeExecution',
  'validationIsPure',
  'validationRunsOnInMemoryInputOnly',
  'validationMayReturnIssues',
  'validationMayNotOpenMedia',
  'validationMayNotWriteArtifacts',
  'validationMayNotDispatchWorkers',
  'validationMayNotTouchSupabase',
  'validationMayNotCreateSignedUrls',
]) {
  assertTrue(validation.plannedBoundary[key], `validation.plannedBoundary.${key}`)
}
for (const value of Object.values(validation.plannedFailureHandling)) assertTrue(value, 'Every failure handling rule must be true')
assertTrue(validation.todayAllowed.boundaryPlanning, 'Boundary planning must be allowed')
for (const key of ['validationExecutionWithFixture', 'manifestInstanceCreation', 'mediaProcessing', 'artifactCreation']) {
  assertFalse(validation.todayAllowed[key], `validation.todayAllowed.${key}`)
}

assert(fixture.decision === expectedDecision, 'Fixture decision mismatch')
assertTrue(fixture.plannedFixturePolicy.fixtureInputsAllowedInFutureGate, 'Future fixture inputs should be planned')
assertFalse(fixture.plannedFixturePolicy.concreteFixtureCreatedToday, 'Concrete fixture must not be created')
for (const key of [
  'privateMediaAssetIdsAreOpaqueIdsOnly',
  'plannedPrivateArtifactIdsAreOpaqueIdsOnly',
]) {
  assertTrue(fixture.plannedFixturePolicy[key], `fixture.plannedFixturePolicy.${key}`)
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
  assertFalse(fixture.plannedFixturePolicy[key], `fixture.plannedFixturePolicy.${key}`)
}
assertTrue(fixture.todayAllowed.fixturePolicyPlanning, 'Fixture policy planning must be allowed')
for (const key of ['fixtureFileCreation', 'manifestInstanceCreation', 'mediaRead', 'artifactWrite']) {
  assertFalse(fixture.todayAllowed[key], `fixture.todayAllowed.${key}`)
}

assert(runtimeDefaults.decision === expectedDecision, 'Runtime defaults decision mismatch')
assertAllFalse(runtimeDefaults.requiredRuntimeDefaults, 'runtimeDefaults.requiredRuntimeDefaults')
assert(runtimeDefaults.plannedEnforcement.reuseSourceConstant === 'SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS', 'Runtime constant mismatch')
for (const key of ['rejectTrueRuntimeFlags', 'rejectMissingRequiredFieldsBeforeExecution', 'keepExecutionFlagsFalseAfterValidation']) {
  assertTrue(runtimeDefaults.plannedEnforcement[key], `runtimeDefaults.plannedEnforcement.${key}`)
}
assertTrue(runtimeDefaults.todayAllowed.runtimeDefaultPlanning, 'Runtime default planning must be allowed')
for (const key of ['runtimeEnablement', 'workerExecution', 'mediaProcessing', 'artifactWrite', 'supabaseSql']) {
  assertFalse(runtimeDefaults.todayAllowed[key], `runtimeDefaults.todayAllowed.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_instance_creation_plan_pending'),
  'Creation plan blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_instance_creation_owner_review_pending',
  'private_manifest_instance_creation_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}
assertAllFalse(blockers.blockedStatusClaims, 'blockers.blockedStatusClaims')

assertTrue(claims.allowedClaims.phase71CreationPlanCompleted, 'Phase 71 plan claim missing')
assertTrue(claims.allowedClaims.manifestInstanceCreationShapePlanned, 'Creation shape claim missing')
assertTrue(claims.allowedClaims.validationCallBoundaryPlanned, 'Validation boundary claim missing')
assertTrue(claims.allowedClaims.noMediaNoArtifactFixtureInputsPlanned, 'Fixture input claim missing')
assertTrue(claims.allowedClaims.runtimeDefaultsFalsePlanned, 'Runtime defaults claim missing')
assertTrue(claims.allowedClaims.privateManifestInstanceCreationOwnerReviewMayProceed, 'Owner review may proceed claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.reviewScope.reviewSourcePath === sourcePath, 'Owner prompt source path mismatch')
for (const key of [
  'reviewManifestInstanceCreationShape',
  'reviewValidationCallBoundary',
  'reviewNoMediaNoArtifactFixtureInputs',
  'reviewRuntimeDefaultsFalse',
]) {
  assertTrue(ownerPrompt.reviewScope[key], `ownerPrompt.reviewScope.${key}`)
}
for (const key of [
  'approveManifestInstanceCreationToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(ownerPrompt.reviewScope[key], `ownerPrompt.reviewScope.${key}`)
}
assertNoop(ownerPrompt.supabaseClassification, 'ownerPrompt')

const sourceText = readText(sourcePath)
for (const requiredText of [
  'export type SoundCpuPrivateMediaManifest',
  'export type SoundCpuPrivateMediaManifestInput',
  'export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'export function validateSoundCpuPrivateMediaManifest',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(requiredText), `Source missing: ${requiredText}`)
}
for (const forbiddenPath of [
  'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance.json',
  'server/workers/sound-cpu/runtime/privateManifestInstance.ts',
]) {
  assert(!fs.existsSync(path.join(repoRoot, forbiddenPath)), `Forbidden manifest instance artifact exists: ${forbiddenPath}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript]?.includes(
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan-diagnostics.mjs',
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
      validationCallBoundaryPlanned: true,
      soundCpuToolCountCovered: claims.allowedClaims.soundCpuToolCountCovered,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
