import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase70_caption_render_runtime_hook_private_manifest_instance_plan_completed_with_warnings_ready_for_private_manifest_instance_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_private_manifest_source_static_validation_owner_review_passed_with_warnings_ready_for_private_manifest_instance_plan_no_media_no_artifacts'
const sourceHead = '6c89754d92d5d47a4b5457954bcaf4e4ec21ae6f'
const sourceMergeCommit = 'b92490f0ee87fd1b012f0b58d746929998fdacbc'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE70-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-shape-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-shape-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-asset-id-policy-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-asset-id-policy-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-artifact-id-policy-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-artifact-id-policy-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan-result',
)
const shape = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-shape-register',
)
const assetPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-asset-id-policy-register',
)
const artifactPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-artifact-id-policy-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-review',
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Source Phase 69 owner-review decision mismatch')
assert(sourceReview.sourceVerification.sourceMergeCommit === 'a2277d6bd506b9f004b92b2f365b636b93fd6955', 'Phase 69 source merge mismatch')
assertTrue(sourceReview.reviewedSource.manifestInstancePlanMayProceed, 'Manifest instance plan was not approved')
assert(sourceReview.reviewedSource.path === sourcePath, 'Source review path mismatch')
assert(sourceReview.soundCpuTools.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Phase 70 decision mismatch')
assert(result.sourceVerification.sourcePr === 1907, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.plannedManifestInstance.sourcePath === sourcePath, 'Planned source path mismatch')
for (const key of [
  'shapePlanned',
  'privateAssetIdPolicyPlanned',
  'privateArtifactIdPolicyPlanned',
  'runtimeDefaultsFalsePlanned',
]) {
  assertTrue(result.plannedManifestInstance[key], `result.plannedManifestInstance.${key}`)
}
for (const key of [
  'instanceCreationToday',
  'realMediaUsedToday',
  'artifactCreatedToday',
  'workerDispatchedToday',
  'routeToolProviderCalledToday',
  'supabaseSqlTouchedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday',
]) {
  assertFalse(result.plannedManifestInstance[key], `result.plannedManifestInstance.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(shape.decision === expectedDecision, 'Shape decision mismatch')
assert(shape.sourcePath === sourcePath, 'Shape source path mismatch')
assert(shape.plannedSchemaVersion === 'sound-cpu-private-media-manifest-v1', 'Schema version mismatch')
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
  assert(shape.requiredFields.includes(field), `Missing required manifest field: ${field}`)
}
assert(shape.acceptedWorkerNames.length === 2, 'Accepted worker count mismatch')
assert(shape.acceptedJobTypes.length === 4, 'Accepted job type count mismatch')
assertAllFalse(shape.requiredRuntimeDefaults, 'shape.requiredRuntimeDefaults')
assertTrue(shape.todayAllowed.shapePlanning, 'Shape planning must be allowed')
for (const key of ['manifestInstanceCreation', 'workerDispatch', 'mediaProcessing', 'artifactCreation', 'supabaseSql']) {
  assertFalse(shape.todayAllowed[key], `shape.todayAllowed.${key}`)
}

assert(assetPolicy.decision === expectedDecision, 'Asset policy decision mismatch')
assert(assetPolicy.field === 'privateMediaAssetIds', 'Asset field mismatch')
for (const key of ['idsOnly', 'nonEmptyStringsRequired']) {
  assertTrue(assetPolicy.policy[key], `assetPolicy.policy.${key}`)
}
for (const key of [
  'rawFilePathsAllowed',
  'signedUrlsAllowedAsSourceOfTruth',
  'publicUrlsAllowedAsSourceOfTruth',
  'providerOutputBlobsAllowed',
  'secretValuesAllowed',
  'serviceRolePayloadsAllowed',
  'modelWeightLocationsAllowed',
]) {
  assertFalse(assetPolicy.policy[key], `assetPolicy.policy.${key}`)
}
for (const key of [
  'approvedPlanSnapshotIdRequired',
  'workspaceIdRequired',
  'projectIdRequired',
  'jobIdRequired',
  'idempotencyKeyRequired',
  'privateStorageResolutionDeferred',
]) {
  assertTrue(assetPolicy.sourceOfTruth[key], `assetPolicy.sourceOfTruth.${key}`)
}
assertTrue(assetPolicy.todayAllowed.policyPlanning, 'Asset policy planning must be allowed')
for (const key of [
  'readMediaBytes',
  'openMediaFile',
  'createSignedUrl',
  'createPublicUrl',
  'storageTransfer',
  'workerExecution',
]) {
  assertFalse(assetPolicy.todayAllowed[key], `assetPolicy.todayAllowed.${key}`)
}

assert(artifactPolicy.decision === expectedDecision, 'Artifact policy decision mismatch')
assert(artifactPolicy.field === 'plannedPrivateArtifactIds', 'Artifact field mismatch')
for (const key of ['idsOnly', 'nonEmptyStringsRequired', 'plannedPlaceholdersOnly']) {
  assertTrue(artifactPolicy.policy[key], `artifactPolicy.policy.${key}`)
}
for (const key of [
  'artifactWritesAllowedToday',
  'storageTransferAllowedToday',
  'signedUrlCreationAllowedToday',
  'publicArtifactCreationAllowedToday',
  'externalArtifactPublicationAllowedToday',
]) {
  assertFalse(artifactPolicy.policy[key], `artifactPolicy.policy.${key}`)
}
assertTrue(artifactPolicy.todayAllowed.artifactIdPolicyPlanning, 'Artifact policy planning must be allowed')
for (const key of ['artifactCreation', 'artifactWrite', 'artifactUpload', 'publicArtifact']) {
  assertFalse(artifactPolicy.todayAllowed[key], `artifactPolicy.todayAllowed.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_instance_plan_pending'),
  'Instance plan blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_instance_owner_review_pending',
  'private_manifest_instance_creation_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}
assertAllFalse(blockers.blockedStatusClaims, 'blockers.blockedStatusClaims')

assertTrue(claims.allowedClaims.phase70InstancePlanCompleted, 'Phase 70 plan claim missing')
assertTrue(claims.allowedClaims.privateManifestInstanceShapePlanned, 'Instance shape claim missing')
assertTrue(claims.allowedClaims.privateAssetIdPolicyPlanned, 'Asset ID policy claim missing')
assertTrue(claims.allowedClaims.privateArtifactIdPolicyPlanned, 'Artifact ID policy claim missing')
assertTrue(claims.allowedClaims.runtimeDefaultsFalsePlanned, 'Runtime defaults claim missing')
assertTrue(claims.allowedClaims.privateManifestInstanceOwnerReviewMayProceed, 'Owner review may proceed claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.reviewScope.reviewSourcePath === sourcePath, 'Owner prompt source path mismatch')
for (const key of [
  'reviewManifestInstanceShape',
  'reviewPrivateAssetIdPolicy',
  'reviewPrivateArtifactIdPolicy',
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
assert(!/^import\s/m.test(sourceText), 'Private manifest source must not import anything')
for (const requiredText of [
  'export type SoundCpuPrivateMediaManifest',
  'export type SoundCpuPrivateMediaManifestInput',
  'export type SoundCpuPrivateMediaManifestValidationIssue',
  'export type SoundCpuPrivateMediaManifestValidationResult',
  'export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'export function validateSoundCpuPrivateMediaManifest',
  'soundCpuRuntimeEnabled: false',
  'workerExecutionEnabled: false',
  'mediaProcessingEnabled: false',
  'artifactWriteEnabled: false',
  'storageTransferEnabled: false',
  'signedUrlCreationEnabled: false',
  'publicArtifactCreationEnabled: false',
  'databaseMutationEnabled: false',
  'sqlExecutionEnabled: false',
  'providerCallEnabled: false',
  'modelCallEnabled: false',
]) {
  assert(sourceText.includes(requiredText), `Source missing: ${requiredText}`)
}
for (const prohibited of [
  'node:fs',
  'child_process',
  '@supabase/supabase-js',
  'create' + 'SignedUrl',
  'publicUrl',
  'docker build',
  'docker run',
  'generated_local_fixture_passed: true',
  'dry_run_passed: true',
]) {
  assert(!sourceText.includes(prohibited), `Private manifest source contains prohibited text: ${prohibited}`)
}

for (const forbiddenPath of [
  'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-source.ts',
  'docs/worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance.json',
]) {
  assert(!fs.existsSync(path.join(repoRoot, forbiddenPath)), `Forbidden manifest instance artifact exists: ${forbiddenPath}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript]?.includes(
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan-diagnostics.mjs',
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
      plannedInstanceFields: shape.requiredFields.length,
      soundCpuToolCountCovered: claims.allowedClaims.soundCpuToolCountCovered,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
