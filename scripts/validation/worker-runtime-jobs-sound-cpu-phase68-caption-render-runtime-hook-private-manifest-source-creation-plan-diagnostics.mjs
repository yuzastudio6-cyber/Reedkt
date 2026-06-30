import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase68_caption_render_runtime_hook_private_manifest_source_creation_plan_completed_with_warnings_ready_for_private_manifest_source_creation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase67_caption_render_runtime_hook_private_manifest_source_owner_review_passed_with_warnings_ready_for_private_manifest_source_creation_plan_no_media_no_artifacts'
const sourceHead = 'efb149b6853d2fb5f34e1718d57dd334dfe5d558'
const sourceMergeCommit = '0cecfc7739ad4175b186185b82ad1c09dad32013'
const futureSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE68-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-SOURCE-CREATION-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-file-content-plan.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-file-content-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-static-validation-plan.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-static-validation-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-result',
)
const filePlan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-file-content-plan',
)
const validationPlan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-static-validation-plan',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-claim-policy',
)
const ownerReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review',
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Source Phase 67 owner-review decision mismatch')
assert(sourceReview.sourceVerification.sourceMergeCommit === '350d93a009d61cd8e932f588cfa409af104b2351', 'Source plan merge mismatch')
assertTrue(sourceReview.reviewedSourcePlan.privateManifestSourceCreationPlanMayProceed, 'Source creation planning was not approved')
assert(sourceReview.reviewedSourcePlan.futureSourcePathAccepted === futureSourcePath, 'Source review path mismatch')
assert(sourceReview.reviewedSourcePlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Phase 68 decision mismatch')
assert(result.sourceVerification.sourcePr === 1899, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.creationPlan.futureSourcePath === futureSourcePath, 'Future source path mismatch')
for (const key of ['sourceFileContentsPlanned', 'staticValidationPlanned', 'ownerReviewBeforeActualCreationRequired']) {
  assertTrue(result.creationPlan[key], `result.creationPlan.${key}`)
}
assert(result.creationPlan.soundCpuToolCountConfirmed === 15, 'Tool count mismatch')
assert(result.creationPlan.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
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
  assertFalse(result.creationPlan[key], `result.creationPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(filePlan.decision === expectedDecision, 'File content plan decision mismatch')
assert(filePlan.futureSourceFile.path === futureSourcePath, 'File plan path mismatch')
assertFalse(filePlan.futureSourceFile.createToday, 'Future source must not be created today')
for (const exportName of [
  'SoundCpuPrivateMediaManifest',
  'SoundCpuPrivateMediaManifestInput',
  'SoundCpuPrivateMediaManifestValidationIssue',
  'SoundCpuPrivateMediaManifestValidationResult',
  'SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'validateSoundCpuPrivateMediaManifest',
]) {
  assert(filePlan.futureSourceFile.plannedExports.includes(exportName), `Missing planned export: ${exportName}`)
}
for (const prohibitedImport of ['fs', 'node:fs', 'child_process', 'node:child_process', '@supabase/supabase-js', 'axios', 'fetch']) {
  assert(filePlan.futureSourceFile.prohibitedImports.includes(prohibitedImport), `Missing prohibited import: ${prohibitedImport}`)
}
for (const [key, value] of Object.entries(filePlan.plannedSourceGuards)) {
  assertTrue(value, `filePlan.plannedSourceGuards.${key}`)
}

assert(validationPlan.decision === expectedDecision, 'Static validation plan decision mismatch')
assertFalse(validationPlan.staticValidationPlan.createToday, 'Future diagnostics must not be created today')
for (const [key, value] of Object.entries(validationPlan.staticValidationPlan)) {
  if (key !== 'futureDiagnosticsScript' && key !== 'createToday') assertTrue(value, `validationPlan.staticValidationPlan.${key}`)
}
for (const key of ['diagnosticsSourceCreation', 'sourceFileCreation', 'runtimeValidationExecution', 'mediaValidationExecution']) {
  assertFalse(validationPlan.allowedToday[key], `validationPlan.allowedToday.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_source_creation_plan_pending'),
  'Source creation plan blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_source_creation_owner_review_pending',
  'private_manifest_source_creation_pending',
  'real_media_artifact_execution_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase68SourceCreationPlanCompleted, 'Phase 68 plan claim missing')
assertTrue(claims.allowedClaims.futurePrivateManifestSourceContentsPlanned, 'Future contents claim missing')
assertTrue(claims.allowedClaims.futureStaticValidationPlanned, 'Future validation claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerReview.sourceDecision === expectedDecision, 'Owner review source decision mismatch')
assertTrue(ownerReview.ownerReviewMayProceed, 'Owner review may proceed missing')
assert(ownerReview.ownerReviewScope.reviewFutureSourcePath === futureSourcePath, 'Owner review source path mismatch')
assertFalse(ownerReview.ownerReviewScope.approveActualSourceCreationToday, 'Owner review must not approve source creation today')
assertFalse(ownerReview.ownerReviewScope.approveRealMediaExecutionToday, 'Owner review must not approve media today')
assertFalse(ownerReview.ownerReviewScope.approveArtifactCreationToday, 'Owner review must not approve artifact today')
assertFalse(ownerReview.ownerReviewScope.approveBetaUnlockToday, 'Owner review must not approve beta today')
assert(ownerReview.nextPrompt === nextPrompt, 'Owner review next prompt mismatch')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.ownerReviewScope.reviewFutureSourcePath === futureSourcePath, 'Owner prompt path mismatch')
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

assertFutureSourcePathState('Phase 68')

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-diagnostics.mjs'), 'Package diagnostics script missing')

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
