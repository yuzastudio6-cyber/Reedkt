import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_created_with_warnings_ready_for_instance_creation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_controlled_private_manifest_instance_creation_no_media_no_artifacts'
const sourceHead = '289fd743f36c52255ba21eac6cbc42c687cd333f'
const sourceMergeCommit = '6252f9b5643a102a43ebd609d5e3a70f0b44cb41'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const proofScript =
  'worker-runtime-jobs:sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation:proof'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation:diagnostics'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE72-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-PRIVATE-MANIFEST-INSTANCE-CREATION-OWNER-REVIEW'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-result.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-validation-evidence-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-validation-evidence-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-no-media-no-artifact-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-no-media-no-artifact-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-result',
)
const instance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-register',
)
const validation = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-validation-evidence-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-no-media-no-artifact-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-claim-policy',
)
const next = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review',
)

const phase71OwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-review-result',
)
assert(phase71OwnerReview.decision === sourceDecision, 'Source Phase 71 owner-review decision mismatch')
assert(phase71OwnerReview.sourceVerification.sourceMergeCommit === '09d0f29d74618128730c3c493f6073721c937745', 'Phase 71 owner-review source merge mismatch')
assertTrue(
  phase71OwnerReview.reviewedPlan.controlledPrivateManifestInstanceCreationMayProceed,
  'Phase 71 owner review did not allow controlled instance creation',
)
assert(phase71OwnerReview.soundCpuTools.readyForRealExecutionToday === 0, 'Phase 71 ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Result decision mismatch')
assert(result.sourceVerification.sourcePr === 1913, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.controlledProof.sourcePath === sourcePath, 'Result source path mismatch')
assert(result.controlledProof.proofRunner.endsWith('controlled-private-manifest-instance-creation-runner.ts'), 'Proof runner mismatch')
for (const key of [
  'controlledPrivateManifestInstanceCreated',
  'inMemoryOnly',
  'validationCalled',
  'validationOk',
  'runtimeFlagsAllFalse',
  'noMediaNoArtifactFixtureInputs',
  'sanitizedValidationEvidenceRecorded',
]) {
  assertTrue(result.controlledProof[key], `result.controlledProof.${key}`)
}
assert(result.controlledProof.issueCount === 0, 'Result issue count must be zero')
for (const key of [
  'persistedManifestInstance',
  'realMediaUsedToday',
  'artifactCreatedToday',
  'workerDispatchedToday',
  'routeToolProviderCalledToday',
  'supabaseSqlTouchedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday',
]) {
  assertFalse(result.controlledProof[key], `result.controlledProof.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(instance.decision === expectedDecision, 'Instance decision mismatch')
assert(instance.controlledInstance.sourcePath === sourcePath, 'Instance source path mismatch')
assert(instance.controlledInstance.workerName === 'sound-cpu-analysis-worker', 'Instance worker mismatch')
assert(instance.controlledInstance.jobType === 'sound.package_import_smoke', 'Instance job type mismatch')
assert(instance.controlledInstance.privateMediaAssetIdCount === 1, 'Private media id count mismatch')
assert(instance.controlledInstance.plannedPrivateArtifactIdCount === 1, 'Planned private artifact id count mismatch')
assertTrue(instance.controlledInstance.usesOpaqueFixtureIdsOnly, 'Opaque fixture id policy mismatch')
assertTrue(instance.controlledInstance.inMemoryOnly, 'Instance must be in memory only')
for (const key of ['persistedManifestInstance', 'storageObjectCreated', 'artifactRecordCreated']) {
  assertFalse(instance.controlledInstance[key], `instance.controlledInstance.${key}`)
}
assertAllFalse(instance.runtimeDefaults, 'instance.runtimeDefaults')

assert(validation.decision === expectedDecision, 'Validation decision mismatch')
for (const key of ['validationCalled', 'validationOk', 'runtimeFlagsAllFalse']) {
  assertTrue(validation.validationEvidence[key], `validation.validationEvidence.${key}`)
}
assert(validation.validationEvidence.issueCount === 0, 'Validation issue count must be zero')
assert(Array.isArray(validation.validationEvidence.sanitizedErrors), 'Sanitized errors must be an array')
assert(validation.validationEvidence.sanitizedErrors.length === 0, 'Sanitized errors must be empty')
for (const key of [
  'acceptedForManifestInstanceCreationToday',
  'acceptedForMediaProcessingToday',
  'acceptedForArtifactCreationToday',
  'acceptedForWorkerDispatchToday',
]) {
  assertFalse(validation.validationEvidence[key], `validation.validationEvidence.${key}`)
}
assertAllFalse(validation.evidenceSanitization, 'validation.evidenceSanitization')

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
for (const key of Object.keys(safety.allowedInThisGate)) {
  assertTrue(safety.allowedInThisGate[key], `safety.allowedInThisGate.${key}`)
}
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')
assertNoop(safety.supabaseClassification, 'safety')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'controlled_private_manifest_instance_creation_pending'),
  'Controlled instance creation resolution missing',
)
for (const blockerId of [
  'controlled_private_manifest_instance_creation_owner_review_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

for (const key of [
  'phase72ControlledPrivateManifestInstanceCreated',
  'inMemoryOnly',
  'noMediaNoArtifactFixtureInputsUsed',
  'validateSoundCpuPrivateMediaManifestCalled',
  'sanitizedValidationEvidenceRecorded',
  'validationOk',
  'runtimeFlagsAllFalse',
]) {
  assertTrue(claims.allowedClaims[key], `claims.allowedClaims.${key}`)
}
assert(claims.allowedClaims.issueCount === 0, 'Claim issue count mismatch')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(next.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
for (const key of [
  'reviewControlledPrivateManifestInstance',
  'reviewNoMediaNoArtifactFixtureInputs',
  'reviewSanitizedValidationEvidence',
  'reviewRuntimeFlagsRemainFalse',
  'acceptForStaticPrivateManifestInstanceValidationOnly',
]) {
  assertTrue(next.reviewScope[key], `next.reviewScope.${key}`)
}
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(next.reviewScope[key], `next.reviewScope.${key}`)
}
assertNoop(next.supabaseClassification, 'next')

const sourceText = readText(sourcePath)
for (const requiredText of [
  'export type SoundCpuPrivateMediaManifest',
  'export function validateSoundCpuPrivateMediaManifest',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(requiredText), `Source missing: ${requiredText}`)
}

const proofText = readText(
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-runner.ts',
)
for (const requiredText of [
  'validateSoundCpuPrivateMediaManifest(controlledInput)',
  'controlledPrivateManifestInstanceCreated: true',
  'persistedManifestInstance: false',
  'realMediaUsed: false',
  'artifactCreated: false',
  'workerDispatched: false',
  'supabaseSqlTouched: false',
]) {
  assert(proofText.includes(requiredText), `Proof runner missing: ${requiredText}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[proofScript]?.includes('controlled-private-manifest-instance-creation-runner.ts'), 'Package proof script missing')
assert(packageJson.scripts?.[packageScript]?.includes('controlled-private-manifest-instance-creation-diagnostics.mjs'), 'Package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourceMergeCommit,
      sourcePath,
      controlledPrivateManifestInstanceCreated: true,
      validationOk: true,
      soundCpuToolCountCovered: claims.allowedClaims.soundCpuToolCountCovered,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
