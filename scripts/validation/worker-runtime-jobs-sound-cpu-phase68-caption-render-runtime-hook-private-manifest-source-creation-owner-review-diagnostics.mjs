import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase68_caption_render_runtime_hook_private_manifest_source_creation_owner_review_passed_with_warnings_ready_for_actual_private_manifest_source_creation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase68_caption_render_runtime_hook_private_manifest_source_creation_plan_completed_with_warnings_ready_for_private_manifest_source_creation_owner_review_no_media_no_artifacts'
const sourceHead = '50deaf37c9fd7bbd8c2e4709255a401018d3ec90'
const sourceMergeCommit = 'dc8813adc1bd43c6771d4c0ada35f21d68b94645'
const futureSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE69-CAPTION-RENDER-RUNTIME-HOOK-ACTUAL-PRIVATE-MANIFEST-SOURCE-CREATION'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-register.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation.md',
    'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation',
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
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-claim-policy',
)
const phase69 = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation-register',
)
const phase69Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-actual-private-manifest-source-creation',
)

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-result.md',
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-result',
)
assert(sourcePlan.decision === sourceDecision, 'Source Phase 68 plan decision mismatch')
assert(sourcePlan.sourceVerification.sourceMergeCommit === '0cecfc7739ad4175b186185b82ad1c09dad32013', 'Source plan merge mismatch')
assertTrue(sourcePlan.creationPlan.sourceFileContentsPlanned, 'Source file contents were not planned')
assertTrue(sourcePlan.creationPlan.staticValidationPlanned, 'Static validation was not planned')
assert(sourcePlan.creationPlan.futureSourcePath === futureSourcePath, 'Source plan path mismatch')
assert(sourcePlan.creationPlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1901, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of ['sourceFileContentsAccepted', 'staticValidationAccepted', 'actualPrivateManifestSourceCreationMayProceed']) {
  assertTrue(result.reviewedCreationPlan[key], `result.reviewedCreationPlan.${key}`)
}
assert(result.reviewedCreationPlan.futureSourcePathAccepted === futureSourcePath, 'Accepted source path mismatch')
assert(result.reviewedCreationPlan.soundCpuToolCountAccepted === 15, 'Accepted tool count mismatch')
assert(result.reviewedCreationPlan.readyForRealExecutionToday === 0, 'Ready-for-real count must be zero')
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
  assertFalse(result.reviewedCreationPlan[key], `result.reviewedCreationPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase68Pr === 1901, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase68Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase68MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.futureSourcePath === futureSourcePath, 'Acceptance source path mismatch')
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real count must be zero')
for (const key of ['sourceFileContentsPlanned', 'staticValidationPlanned', 'packageLockUnchanged']) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assertTrue(acceptance.acceptedScope.actualPrivateManifestSourceCreationMayProceed, 'Actual source creation next scope missing')
for (const key of [
  'manifestInstanceCreation',
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

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.allowedNextStep === 'actual private manifest source creation', 'Safety next step mismatch')
assertTrue(safety.nextStepMayCreateOnlySource, 'Next step source-only guard missing')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_source_creation_owner_review_pending'),
  'Owner review blocker resolution missing',
)
for (const blockerId of [
  'actual_private_manifest_source_creation_pending',
  'private_manifest_static_validation_owner_review_pending',
  'real_media_artifact_execution_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase68OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.actualPrivateManifestSourceCreationMayProceed, 'Actual source creation may proceed claim missing')
assertTrue(claims.allowedClaims.sourceOnlyCreationScopeAccepted, 'Source-only scope claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase69.sourceDecision === expectedDecision, 'Phase 69 source decision mismatch')
assertTrue(phase69.actualSourceCreationMayProceed, 'Phase 69 may proceed missing')
assert(phase69.actualSourceCreationScope.sourcePath === futureSourcePath, 'Phase 69 source path mismatch')
assert(phase69.actualSourceCreationScope.confirmSoundCpuToolCount === 15, 'Phase 69 tool count mismatch')
for (const key of [
  'createManifestInstance',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase69.actualSourceCreationScope[key], `phase69.actualSourceCreationScope.${key}`)
}
assert(phase69.nextPrompt === nextPrompt, 'Phase 69 next prompt mismatch')

assert(phase69Prompt.requiredSourceDecision === expectedDecision, 'Phase 69 prompt source decision mismatch')
assert(phase69Prompt.creationScope.createSourcePath === futureSourcePath, 'Phase 69 prompt source path mismatch')
for (const key of [
  'createManifestInstanceToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase69Prompt.creationScope[key], `phase69Prompt.creationScope.${key}`)
}
assertNoop(phase69Prompt.supabaseClassification, 'phase69Prompt')

assert(!fs.existsSync(path.join(repoRoot, futureSourcePath)), `${futureSourcePath} must not exist in Phase 68 owner review`)

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-owner-review-diagnostics.mjs'), 'Package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourceMergeCommit,
      futureSourcePath,
      sourceCreatedInThisGate: false,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
