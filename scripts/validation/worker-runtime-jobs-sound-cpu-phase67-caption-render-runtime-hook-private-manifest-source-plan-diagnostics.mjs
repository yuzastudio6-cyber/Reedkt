import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase67_caption_render_runtime_hook_private_manifest_source_plan_completed_with_warnings_ready_for_private_manifest_source_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase66_caption_render_runtime_hook_private_manifest_artifact_policy_owner_review_passed_with_warnings_ready_for_private_manifest_source_plan_no_media_no_artifacts'
const sourceHead = '808829b39bd259ea4c53caf4d26757981c2e6f1c'
const sourceMergeCommit = '851f8f4bb1ff7d383d15e4bae0eb663fbbb5bdf6'
const futureSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE67-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-SOURCE-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-type-plan.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-type-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-validation-schema-plan.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-validation-schema-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-no-media-no-storage-defaults-plan.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-no-media-no-storage-defaults-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review',
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

function assertFutureSourcePathState(phaseLabel) {
  if (!fs.existsSync(path.join(repoRoot, futureSourcePath))) return

  const phase69 = parseJsonBlock(
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result',
  )
  assert(
    phase69.decision ===
      'worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_actual_private_manifest_source_created_with_warnings_ready_for_private_manifest_source_static_validation_owner_review_no_media_no_artifacts',
    `${futureSourcePath} exists after ${phaseLabel}, but Phase 69 source-creation decision is missing`,
  )
  assertTrue(phase69.createdSource?.created, 'Phase 69 source creation evidence missing')
  assert(phase69.createdSource?.path === futureSourcePath, 'Phase 69 source path mismatch')
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record ?? {})) {
    assertFalse(value, `${label}.${key}`)
  }
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-result',
)
const sourceTypes = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-type-plan',
)
const schema = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-validation-schema-plan',
)
const defaults = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-no-media-no-storage-defaults-plan',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-claim-policy',
)
const ownerReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review',
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-result',
)
const sourceRegister = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-register.md',
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-register',
)

assert(sourceReview.decision === sourceDecision, 'Source Phase 66 owner-review decision mismatch')
assert(sourceReview.sourceVerification.sourceMergeCommit === 'e96d415d4a149a1c74683801366353faa28f0640', 'Phase 66 policy merge mismatch')
assertTrue(sourceReview.reviewedPolicyPlan.privateManifestSourcePlanMayProceed, 'Source did not allow Phase 67 source planning')
assert(sourceReview.reviewedPolicyPlan.soundCpuToolCountAccepted === 15, 'Source tool count mismatch')
assert(sourceReview.reviewedPolicyPlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(sourceRegister.sourceDecision === sourceDecision, 'Source register decision mismatch')
assertTrue(sourceRegister.sourcePlanMayProceed, 'Source register did not allow planning')
assert(sourceRegister.sourcePlanScope.confirmSoundCpuToolCount === 15, 'Source register tool count mismatch')
for (const key of [
  'createManifestSource',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(sourceRegister.sourcePlanScope[key], `sourceRegister.sourcePlanScope.${key}`)
}

assert(result.decision === expectedDecision, 'Phase 67 decision mismatch')
assert(result.sourceVerification.sourcePr === 1893, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'privateManifestSourceTypesPlanned',
  'privateManifestValidationSchemaPlanned',
  'noMediaNoStorageDefaultsPlanned',
  'ownerReviewBeforeSourceCreationRequired',
]) {
  assertTrue(result.sourcePlan[key], `result.sourcePlan.${key}`)
}
assert(result.sourcePlan.futureSourcePathPlanned === futureSourcePath, 'Future source path mismatch')
assert(result.sourcePlan.soundCpuToolCountConfirmed === 15, 'Tool count mismatch')
assert(result.sourcePlan.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
for (const key of [
  'createManifestSourceToday',
  'createManifestInstanceToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(result.sourcePlan[key], `result.sourcePlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(sourceTypes.decision === expectedDecision, 'Source type decision mismatch')
assert(sourceTypes.futureSource.path === futureSourcePath, 'Future source path mismatch')
assertFalse(sourceTypes.futureSource.createToday, 'Future source must not be created today')
for (const field of [
  'manifestId',
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'phase37eRunId',
  'workerName',
  'imageName',
  'jobType',
  'mediaAssetRefs',
  'artifactOutputPolicy',
  'runtimeFlags',
]) {
  assert(sourceTypes.plannedRequiredFields.includes(field), `Missing required field plan: ${field}`)
}
for (const field of [
  'rawPrompt',
  'signedUrlAsSourceOfTruth',
  'serviceRolePayload',
  'rawFrameBytes',
  'rawOcrText',
  'providerOutputBlob',
  'modelWeightLocation',
  'artifactWriteTarget',
]) {
  assert(sourceTypes.plannedBlockedPayloadFields.includes(field), `Missing blocked field plan: ${field}`)
}
for (const key of [
  'sourceFileCreation',
  'manifestCreation',
  'mediaReferenceCreation',
  'artifactReferenceCreation',
  'supabaseReadOrWrite',
]) {
  assertFalse(sourceTypes.allowedToday[key], `sourceTypes.allowedToday.${key}`)
}

assert(schema.decision === expectedDecision, 'Schema decision mismatch')
assertFalse(schema.validationSchemaPlan.createToday, 'Validator source must not be created today')
for (const [key, value] of Object.entries(schema.validationSchemaPlan)) {
  if (key !== 'futureValidatorName' && key !== 'createToday') assertTrue(value, `schema.validationSchemaPlan.${key}`)
}
for (const outcome of [
  'valid_planning_manifest',
  'blocked_missing_required_identity',
  'blocked_public_artifact_scope',
  'blocked_signed_url_source_of_truth',
  'blocked_service_role_payload',
  'blocked_raw_media_payload',
  'blocked_runtime_flag_enabled',
  'blocked_supabase_or_storage_claim',
]) {
  assert(schema.plannedValidationOutcomes.includes(outcome), `Missing planned outcome: ${outcome}`)
}
for (const key of [
  'validatorSourceCreation',
  'runtimeValidationExecution',
  'mediaValidationExecution',
  'artifactValidationExecution',
]) {
  assertFalse(schema.allowedToday[key], `schema.allowedToday.${key}`)
}

assert(defaults.decision === expectedDecision, 'Defaults decision mismatch')
assertAllFalse(defaults.defaults, 'defaults.defaults')
for (const value of Object.values(defaults.futureRuntimeFlags)) {
  assert(value === '0', 'Future runtime flags must stay disabled')
}
for (const key of [
  'flagWiring',
  'workerRuntimeWiring',
  'storagePolicyMutation',
  'supabasePolicyMutation',
]) {
  assertFalse(defaults.allowedToday[key], `defaults.allowedToday.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_source_plan_pending'),
  'Source plan blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_source_owner_review_pending',
  'private_manifest_source_creation_pending',
  'real_media_artifact_execution_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase67SourcePlanCompleted, 'Phase 67 source plan claim missing')
assertTrue(claims.allowedClaims.privateManifestSourceTypesPlanned, 'Source types claim missing')
assertTrue(claims.allowedClaims.privateManifestValidationSchemaPlanned, 'Schema claim missing')
assertTrue(claims.allowedClaims.noMediaNoStorageDefaultsPlanned, 'Defaults claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerReview.sourceDecision === expectedDecision, 'Owner review source decision mismatch')
assertTrue(ownerReview.ownerReviewMayProceed, 'Owner review may proceed missing')
assert(ownerReview.nextPrompt === nextPrompt, 'Owner review next prompt mismatch')
assertFalse(ownerReview.ownerReviewScope.approveSourceCreationToday, 'Owner review must not approve source creation today')
assertFalse(ownerReview.ownerReviewScope.approveRealMediaExecutionToday, 'Owner review must not approve media today')
assertFalse(ownerReview.ownerReviewScope.approveArtifactCreationToday, 'Owner review must not approve artifact today')
assertFalse(ownerReview.ownerReviewScope.approveBetaUnlockToday, 'Owner review must not approve beta today')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt required source decision mismatch')
assert(ownerPrompt.ownerReviewScope.reviewFutureSourcePath === futureSourcePath, 'Owner prompt future source path mismatch')
for (const key of [
  'createManifestSourceToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(ownerPrompt.ownerReviewScope[key], `ownerPrompt.ownerReviewScope.${key}`)
}
assertNoop(ownerPrompt.supabaseClassification, 'ownerPrompt')

assertFutureSourcePathState('Phase 67')

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-diagnostics.mjs'), 'Package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourceMergeCommit,
      futureSourcePath,
      sourceCreatedToday: false,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
