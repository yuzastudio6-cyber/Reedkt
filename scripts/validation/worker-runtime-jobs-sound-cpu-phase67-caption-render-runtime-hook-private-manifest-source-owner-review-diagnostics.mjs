import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase67_caption_render_runtime_hook_private_manifest_source_owner_review_passed_with_warnings_ready_for_private_manifest_source_creation_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase67_caption_render_runtime_hook_private_manifest_source_plan_completed_with_warnings_ready_for_private_manifest_source_owner_review_no_media_no_artifacts'
const sourceHead = '5141b65f08c01af8040d3c92c84ab9886693f4b5'
const sourceMergeCommit = '350d93a009d61cd8e932f588cfa409af104b2351'
const futureSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE68-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-SOURCE-CREATION-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan.md',
    'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan',
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
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-claim-policy',
)
const phase68 = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan-register',
)
const phase68Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-creation-plan',
)

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-result.md',
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-result',
)
assert(sourcePlan.decision === sourceDecision, 'Source Phase 67 plan decision mismatch')
assert(sourcePlan.sourceVerification.sourceMergeCommit === '851f8f4bb1ff7d383d15e4bae0eb663fbbb5bdf6', 'Source plan merge mismatch')
assertTrue(sourcePlan.sourcePlan.privateManifestSourceTypesPlanned, 'Source types were not planned')
assertTrue(sourcePlan.sourcePlan.privateManifestValidationSchemaPlanned, 'Validation schema was not planned')
assertTrue(sourcePlan.sourcePlan.noMediaNoStorageDefaultsPlanned, 'No-media/no-storage defaults were not planned')
assert(sourcePlan.sourcePlan.futureSourcePathPlanned === futureSourcePath, 'Source plan path mismatch')
assert(sourcePlan.sourcePlan.soundCpuToolCountConfirmed === 15, 'Source plan tool count mismatch')
assert(sourcePlan.sourcePlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1897, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'privateManifestSourceTypesAccepted',
  'privateManifestValidationSchemaAccepted',
  'noMediaNoStorageDefaultsAccepted',
  'privateManifestSourceCreationPlanMayProceed',
]) {
  assertTrue(result.reviewedSourcePlan[key], `result.reviewedSourcePlan.${key}`)
}
assert(result.reviewedSourcePlan.futureSourcePathAccepted === futureSourcePath, 'Accepted source path mismatch')
assert(result.reviewedSourcePlan.soundCpuToolCountAccepted === 15, 'Accepted tool count mismatch')
assert(result.reviewedSourcePlan.readyForRealExecutionToday === 0, 'Owner-review ready-for-real count must remain zero')
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
  assertFalse(result.reviewedSourcePlan[key], `result.reviewedSourcePlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase67Pr === 1897, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase67Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase67MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.futureSourcePath === futureSourcePath, 'Acceptance source path mismatch')
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real count must be zero')
for (const key of ['sourceTypesPlanned', 'validationSchemaPlanned', 'noMediaNoStorageDefaultsPlanned', 'packageLockUnchanged']) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assertTrue(acceptance.acceptedScope.privateManifestSourceCreationPlanning, 'Source creation planning scope missing')
for (const key of [
  'sourceFileCreation',
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
assert(safety.allowedNextStep === 'private manifest source creation plan', 'Safety next step mismatch')
assertTrue(safety.nextStepMustRemainPlanningOnly, 'Next step planning-only guard missing')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_source_owner_review_pending'),
  'Owner review blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_source_creation_plan_pending',
  'private_manifest_source_creation_pending',
  'real_media_artifact_execution_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

assertTrue(claims.allowedClaims.phase67OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.privateManifestSourcePlanAccepted, 'Source plan accepted claim missing')
assertTrue(claims.allowedClaims.privateManifestSourceCreationPlanMayProceed, 'Creation plan may proceed claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase68.sourceDecision === expectedDecision, 'Phase 68 source decision mismatch')
assertTrue(phase68.sourceCreationPlanMayProceed, 'Phase 68 may proceed missing')
assert(phase68.sourceCreationPlanScope.futureSourcePath === futureSourcePath, 'Phase 68 future source path mismatch')
assert(phase68.sourceCreationPlanScope.confirmSoundCpuToolCount === 15, 'Phase 68 tool count mismatch')
for (const key of [
  'createManifestSource',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase68.sourceCreationPlanScope[key], `phase68.sourceCreationPlanScope.${key}`)
}
assert(phase68.nextPrompt === nextPrompt, 'Phase 68 next prompt mismatch')

assert(phase68Prompt.requiredSourceDecision === expectedDecision, 'Phase 68 prompt source decision mismatch')
assert(phase68Prompt.planningScope.futureSourcePath === futureSourcePath, 'Phase 68 prompt source path mismatch')
for (const key of [
  'createManifestSourceToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase68Prompt.planningScope[key], `phase68Prompt.planningScope.${key}`)
}
assertNoop(phase68Prompt.supabaseClassification, 'phase68Prompt')

assertFutureSourcePathState('Phase 67 owner review')

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-owner-review-diagnostics.mjs'), 'Package diagnostics script missing')

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
