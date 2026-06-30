import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_actual_private_manifest_source_created_with_warnings_ready_for_private_manifest_source_static_validation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase68_caption_render_runtime_hook_private_manifest_source_creation_owner_review_passed_with_warnings_ready_for_actual_private_manifest_source_creation_no_media_no_artifacts'
const sourceHead = 'd81555ee906fd7e67732520d1529777ff30b0efc'
const sourceMergeCommit = 'dbe3818325ebada7bb36eb68b257bbfd2ed75db3'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE69-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-SOURCE-STATIC-VALIDATION-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-content-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-content-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result',
)
const content = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-content-register',
)
const validation = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-validation-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review',
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Source Phase 68 owner-review decision mismatch')
assert(sourceReview.sourceVerification.sourceMergeCommit === 'dc8813adc1bd43c6771d4c0ada35f21d68b94645', 'Source plan merge mismatch')
assertTrue(sourceReview.reviewedCreationPlan.actualPrivateManifestSourceCreationMayProceed, 'Actual source creation was not approved')
assert(sourceReview.reviewedCreationPlan.futureSourcePathAccepted === sourcePath, 'Source review path mismatch')
assert(sourceReview.reviewedCreationPlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Phase 69 decision mismatch')
assert(result.sourceVerification.sourcePr === 1903, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.createdSource.path === sourcePath, 'Created source path mismatch')
for (const key of ['created', 'staticTypesCreated', 'pureValidationFunctionCreated', 'runtimeDefaultsFalse']) {
  assertTrue(result.createdSource[key], `result.createdSource.${key}`)
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
  assertFalse(result.createdSource[key], `result.createdSource.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(content.decision === expectedDecision, 'Content decision mismatch')
assert(content.sourcePath === sourcePath, 'Content source path mismatch')
for (const exportName of [
  'SoundCpuPrivateMediaManifest',
  'SoundCpuPrivateMediaManifestInput',
  'SoundCpuPrivateMediaManifestValidationIssue',
  'SoundCpuPrivateMediaManifestValidationResult',
  'SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'validateSoundCpuPrivateMediaManifest',
]) {
  assert(content.exports.includes(exportName), `Missing content export: ${exportName}`)
}
assert(content.acceptedWorkers.length === 2, 'Accepted worker count mismatch')
assert(content.acceptedJobTypes.length === 4, 'Accepted job type count mismatch')
for (const [key, value] of Object.entries(content.runtimeDefaults)) {
  assertFalse(value, `content.runtimeDefaults.${key}`)
}
assert(content.allowedImports.length === 0, 'Source must have no allowed imports')

assert(validation.decision === expectedDecision, 'Validation decision mismatch')
for (const [key, value] of Object.entries(validation.validationScope)) {
  assertTrue(value, `validation.validationScope.${key}`)
}
assertTrue(validation.todayAllowed.sourceStaticValidation, 'Static validation should be allowed')
for (const key of [
  'manifestInstanceCreation',
  'realMediaProcessing',
  'artifactCreation',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  assertFalse(validation.todayAllowed[key], `validation.todayAllowed.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
for (const [key, value] of Object.entries(safety.safetyChecks)) {
  assertTrue(value, `safety.safetyChecks.${key}`)
}
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'actual_private_manifest_source_creation_pending'),
  'Actual source creation blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_source_static_validation_owner_review_pending',
  'private_manifest_instance_creation_pending',
  'real_media_artifact_execution_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase69SourceCreated, 'Phase 69 source-created claim missing')
assertTrue(claims.allowedClaims.staticTypesCreated, 'Static types claim missing')
assertTrue(claims.allowedClaims.pureValidationFunctionCreated, 'Pure validation claim missing')
assertTrue(claims.allowedClaims.runtimeDefaultsFalse, 'False defaults claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.reviewScope.reviewSourcePath === sourcePath, 'Owner prompt source path mismatch')
for (const key of [
  'confirmStaticTypes',
  'confirmPureValidationFunction',
  'confirmRuntimeDefaultsFalse',
  'confirmNoImports',
  'confirmNoMediaArtifactRuntimeExecution',
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
  'export type SoundCpuPrivateMediaManifestValidationIssue',
  'export type SoundCpuPrivateMediaManifestValidationResult',
  'export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'export function validateSoundCpuPrivateMediaManifest',
]) {
  assert(sourceText.includes(requiredText), `Source missing: ${requiredText}`)
}
assert(!/^import\s/m.test(sourceText), 'Private manifest source must not import anything')
for (const prohibited of [
  'node:fs',
  'child_process',
  'node:child_process',
  '@supabase/supabase-js',
  'axios',
  'fetch(',
  'create' + 'SignedUrl',
  'publicUrl',
]) {
  assert(!sourceText.includes(prohibited), `Private manifest source contains prohibited text: ${prohibited}`)
}
for (const requiredFalse of [
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
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(requiredFalse), `Source missing false guard: ${requiredFalse}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-diagnostics.mjs'), 'Package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourceMergeCommit,
      sourcePath,
      sourceCreatedToday: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
