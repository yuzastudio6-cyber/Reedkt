import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase70_caption_render_runtime_hook_private_manifest_instance_owner_review_passed_with_warnings_ready_for_private_manifest_instance_creation_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase70_caption_render_runtime_hook_private_manifest_instance_plan_completed_with_warnings_ready_for_private_manifest_instance_owner_review_no_media_no_artifacts'
const sourceHead = '00fb0e242792e82cc97d9b7638e55477c91ea4bd'
const sourceMergeCommit = 'e511b74283c9e6ede32d0adf895316ae158d0b1b'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE71-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-CREATION-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-shape-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-shape-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-policy-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-policy-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan.md',
    'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan',
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
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-acceptance-register',
)
const shape = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-shape-review-register',
)
const policy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-policy-review-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-claim-policy',
)
const next = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-plan',
)

const phase70 = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan-result.md',
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan-result',
)
assert(phase70.decision === sourceDecision, 'Source Phase 70 decision mismatch')
assert(phase70.sourceVerification.sourceMergeCommit === 'b92490f0ee87fd1b012f0b58d746929998fdacbc', 'Phase 70 source merge mismatch')
assertTrue(phase70.plannedManifestInstance.shapePlanned, 'Phase 70 shape was not planned')
assertTrue(phase70.plannedManifestInstance.privateAssetIdPolicyPlanned, 'Phase 70 asset policy was not planned')
assertTrue(phase70.plannedManifestInstance.privateArtifactIdPolicyPlanned, 'Phase 70 artifact policy was not planned')
assert(phase70.soundCpuTools.readyForRealExecutionToday === 0, 'Phase 70 ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1909, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.reviewedPlan.sourcePath === sourcePath, 'Reviewed source path mismatch')
for (const key of [
  'manifestInstanceShapeAccepted',
  'privateAssetIdPolicyAccepted',
  'privateArtifactIdPolicyAccepted',
  'runtimeDefaultsFalseAccepted',
  'privateManifestInstanceCreationPlanMayProceed',
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
assert(acceptance.acceptedEvidence.phase70Pr === 1909, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase70Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase70MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.sourcePath === sourcePath, 'Acceptance source path mismatch')
for (const key of [
  'manifestInstanceShapePlanned',
  'privateAssetIdPolicyPlanned',
  'privateArtifactIdPolicyPlanned',
  'runtimeDefaultsFalsePlanned',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real mismatch')
assertTrue(acceptance.acceptedScope.privateManifestInstanceCreationPlanning, 'Creation planning must be accepted')
for (const key of [
  'manifestInstanceCreationToday',
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
assert(shape.acceptedSchemaVersion === 'sound-cpu-private-media-manifest-v1', 'Schema version mismatch')
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
  assert(shape.acceptedRequiredFields.includes(field), `Missing accepted field: ${field}`)
}
assert(shape.acceptedWorkerNames.length === 2, 'Accepted worker count mismatch')
assert(shape.acceptedJobTypes.length === 4, 'Accepted job type count mismatch')
assertAllFalse(shape.runtimeDefaultsMustRemainFalse, 'shape.runtimeDefaultsMustRemainFalse')
assertTrue(shape.todayAllowed.ownerReview, 'Owner review must be allowed')
assertTrue(shape.todayAllowed.creationPlanningNext, 'Creation planning next must be allowed')
for (const key of ['manifestInstanceCreation', 'workerDispatch', 'mediaProcessing', 'artifactCreation', 'supabaseSql']) {
  assertFalse(shape.todayAllowed[key], `shape.todayAllowed.${key}`)
}

assert(policy.decision === expectedDecision, 'Policy decision mismatch')
assert(policy.acceptedPrivateAssetIdPolicy.field === 'privateMediaAssetIds', 'Asset policy field mismatch')
assertTrue(policy.acceptedPrivateAssetIdPolicy.idsOnly, 'Asset IDs must be ids-only')
assertTrue(policy.acceptedPrivateAssetIdPolicy.nonEmptyStringsRequired, 'Asset IDs must be non-empty')
for (const key of [
  'rawFilePathsAllowed',
  'signedUrlsAllowedAsSourceOfTruth',
  'publicUrlsAllowedAsSourceOfTruth',
  'providerOutputBlobsAllowed',
  'secretValuesAllowed',
  'serviceRolePayloadsAllowed',
  'modelWeightLocationsAllowed',
]) {
  assertFalse(policy.acceptedPrivateAssetIdPolicy[key], `policy.acceptedPrivateAssetIdPolicy.${key}`)
}
assert(policy.acceptedPrivateArtifactIdPolicy.field === 'plannedPrivateArtifactIds', 'Artifact policy field mismatch')
for (const key of ['idsOnly', 'nonEmptyStringsRequired', 'plannedPlaceholdersOnly']) {
  assertTrue(policy.acceptedPrivateArtifactIdPolicy[key], `policy.acceptedPrivateArtifactIdPolicy.${key}`)
}
for (const key of [
  'artifactWritesAllowedToday',
  'storageTransferAllowedToday',
  'signedUrlCreationAllowedToday',
  'publicArtifactCreationAllowedToday',
  'externalArtifactPublicationAllowedToday',
]) {
  assertFalse(policy.acceptedPrivateArtifactIdPolicy[key], `policy.acceptedPrivateArtifactIdPolicy.${key}`)
}
for (const key of [
  'approvedPlanSnapshotIdRequired',
  'workspaceIdRequired',
  'projectIdRequired',
  'jobIdRequired',
  'idempotencyKeyRequired',
  'signedUrlsAreNeverSourceOfTruth',
]) {
  assertTrue(policy.acceptedSourceOfTruthPolicy[key], `policy.acceptedSourceOfTruthPolicy.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.allowedNextStep === 'private manifest instance creation plan', 'Safety next step mismatch')
assertTrue(safety.nextStepMustRemainPlanningOnly, 'Next step must remain planning-only')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')
assertNoop(safety.supabaseClassification, 'safety')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_instance_owner_review_pending'),
  'Owner-review blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_instance_creation_plan_pending',
  'private_manifest_instance_creation_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase70OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.privateManifestInstanceShapeAccepted, 'Instance shape claim missing')
assertTrue(claims.allowedClaims.privateAssetIdPolicyAccepted, 'Asset policy claim missing')
assertTrue(claims.allowedClaims.privateArtifactIdPolicyAccepted, 'Artifact policy claim missing')
assertTrue(claims.allowedClaims.runtimeDefaultsFalseAccepted, 'Runtime defaults claim missing')
assertTrue(claims.allowedClaims.privateManifestInstanceCreationPlanMayProceed, 'Creation plan may proceed claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(next.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(next.planningScope.sourcePath === sourcePath, 'Next prompt source path mismatch')
for (const key of [
  'planManifestInstanceCreationShape',
  'planValidationCallBoundary',
  'planNoMediaNoArtifactFixtureInputs',
  'planRuntimeDefaultsFalse',
]) {
  assertTrue(next.planningScope[key], `next.planningScope.${key}`)
}
for (const key of [
  'createManifestInstanceToday',
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
assert(!/^import\s/m.test(sourceText), 'Private manifest source must not import anything')
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

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript]?.includes(
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review-diagnostics.mjs',
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
      privateManifestInstanceCreationPlanMayProceed: true,
      soundCpuToolCountCovered: claims.allowedClaims.soundCpuToolCountCovered,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
