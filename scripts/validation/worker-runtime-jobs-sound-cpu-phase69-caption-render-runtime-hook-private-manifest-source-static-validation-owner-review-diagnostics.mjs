import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_private_manifest_source_static_validation_owner_review_passed_with_warnings_ready_for_private_manifest_instance_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_actual_private_manifest_source_created_with_warnings_ready_for_private_manifest_source_static_validation_owner_review_no_media_no_artifacts'
const sourceHead = 'df42c2d2682949013cac31434756cc93d38b3a8d'
const sourceMergeCommit = 'a2277d6bd506b9f004b92b2f365b636b93fd6955'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE70-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-source-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-source-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan.md',
    'worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan',
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
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-acceptance-register',
)
const sourceReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-source-review-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-claim-policy',
)
const next = parsed.get('worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-plan')

const phase69 = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result.md',
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-result',
)
assert(phase69.decision === sourceDecision, 'Source Phase 69 decision mismatch')
assert(phase69.sourceVerification.sourceMergeCommit === 'dbe3818325ebada7bb36eb68b257bbfd2ed75db3', 'Phase 69 source merge mismatch')
assertTrue(phase69.createdSource.created, 'Phase 69 source was not created')
assert(phase69.createdSource.path === sourcePath, 'Phase 69 source path mismatch')
assert(phase69.soundCpuTools.readyForRealExecutionToday === 0, 'Phase 69 ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1906, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.reviewedSource.path === sourcePath, 'Reviewed source path mismatch')
for (const key of [
  'staticTypesConfirmed',
  'pureValidationFunctionConfirmed',
  'runtimeDefaultsFalseConfirmed',
  'noImportsConfirmed',
  'noMediaArtifactRuntimeExecutionConfirmed',
  'manifestInstancePlanMayProceed',
]) {
  assertTrue(result.reviewedSource[key], `result.reviewedSource.${key}`)
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
  assertFalse(result.reviewedSource[key], `result.reviewedSource.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase69Pr === 1906, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase69Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase69MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.sourcePath === sourcePath, 'Acceptance source path mismatch')
for (const key of [
  'staticTypesCreated',
  'pureValidationFunctionCreated',
  'runtimeDefaultsFalse',
  'noImports',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real mismatch')
assertTrue(acceptance.acceptedScope.privateManifestInstancePlanning, 'Instance planning must be accepted')
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

assert(sourceReview.decision === expectedDecision, 'Source-review register decision mismatch')
assert(sourceReview.sourcePath === sourcePath, 'Source-review path mismatch')
for (const exportName of [
  'SoundCpuPrivateMediaManifest',
  'SoundCpuPrivateMediaManifestInput',
  'SoundCpuPrivateMediaManifestValidationIssue',
  'SoundCpuPrivateMediaManifestValidationResult',
  'SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'validateSoundCpuPrivateMediaManifest',
]) {
  assert(sourceReview.requiredExports.includes(exportName), `Missing required export: ${exportName}`)
}
for (const [key, value] of Object.entries(sourceReview.validatedContract)) {
  if (Array.isArray(value)) assert(value.length > 0, `sourceReview.validatedContract.${key} must not be empty`)
  else assertTrue(value, `sourceReview.validatedContract.${key}`)
}
for (const [key, value] of Object.entries(sourceReview.prohibitedSourceFeatures)) {
  assertTrue(value, `sourceReview.prohibitedSourceFeatures.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.allowedNextStep === 'private manifest instance plan', 'Safety next step mismatch')
assertTrue(safety.nextStepMustRemainPlanningOnly, 'Next step must remain planning-only')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_source_static_validation_owner_review_pending'),
  'Owner-review blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_instance_plan_pending',
  'private_manifest_instance_creation_pending',
  'real_media_artifact_execution_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase69StaticValidationOwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.privateManifestSourceAccepted, 'Source accepted claim missing')
assertTrue(claims.allowedClaims.privateManifestInstancePlanMayProceed, 'Instance plan may proceed claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(next.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(next.planningScope.sourcePath === sourcePath, 'Next prompt source path mismatch')
for (const key of [
  'planManifestInstanceShape',
  'planPrivateAssetIdPolicy',
  'planPrivateArtifactIdPolicy',
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
  'export type SoundCpuPrivateMediaManifestValidationIssue',
  'export type SoundCpuPrivateMediaManifestValidationResult',
  'export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'export function validateSoundCpuPrivateMediaManifest',
  'soundCpuRuntimeEnabled: false',
  'workerExecutionEnabled: false',
  'mediaProcessingEnabled: false',
  'artifactWriteEnabled: false',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(requiredText), `Private manifest source missing: ${requiredText}`)
}
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

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-review-diagnostics.mjs'), 'Package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourceMergeCommit,
      sourcePath,
      privateManifestInstancePlanMayProceed: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
