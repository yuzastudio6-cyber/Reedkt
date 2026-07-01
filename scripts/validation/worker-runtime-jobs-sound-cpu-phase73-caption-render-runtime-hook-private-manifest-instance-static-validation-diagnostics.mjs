import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase73_caption_render_runtime_hook_private_manifest_instance_static_validation_passed_with_warnings_ready_for_private_manifest_instance_static_validation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_private_manifest_instance_static_validation_no_media_no_artifacts'
const sourceHead = '5f7815184963f8388bd7b0bb1dbdef41949bcb5b'
const sourceMergeCommit = 'c208b5a460e1fc954cadf7ab3937efdd734f1fa5'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const proofRunner =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-runner.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation:diagnostics'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE73-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-STATIC-VALIDATION-OWNER-REVIEW'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-result.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-static-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-static-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-proof-runner-static-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-proof-runner-static-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-controlled-instance-evidence-static-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-controlled-instance-evidence-static-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-prohibited-runtime-scan-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-prohibited-runtime-scan-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-result',
)
const sourceBoundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-static-validation-register',
)
const runnerValidation = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-proof-runner-static-validation-register',
)
const evidenceValidation = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-controlled-instance-evidence-static-validation-register',
)
const prohibitedScan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-prohibited-runtime-scan-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy',
)
const next = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review',
)

const phase72OwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review-result',
)
assert(phase72OwnerReview.decision === sourceDecision, 'Source Phase 72 owner-review decision mismatch')
assert(
  phase72OwnerReview.sourceVerification.sourceMergeCommit === '8b99561989866a2e898eaad4c938e12a49fd589f',
  'Phase 72 owner-review source merge mismatch',
)
assertTrue(
  phase72OwnerReview.reviewedEvidence.acceptedForStaticPrivateManifestInstanceValidationOnly,
  'Phase 72 owner review did not allow static validation',
)
assert(phase72OwnerReview.soundCpuTools.readyForRealExecutionToday === 0, 'Phase 72 ready-for-real count must be zero')

const phase72Result = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-result.md',
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-result',
)
assertTrue(phase72Result.controlledProof.controlledPrivateManifestInstanceCreated, 'Phase 72 controlled instance missing')
assertTrue(phase72Result.controlledProof.validationOk, 'Phase 72 validation must pass')
assert(phase72Result.controlledProof.issueCount === 0, 'Phase 72 issue count must be zero')
assertTrue(phase72Result.controlledProof.runtimeFlagsAllFalse, 'Phase 72 runtime flags must be false')

assert(result.decision === expectedDecision, 'Result decision mismatch')
assert(result.sourceVerification.sourcePr === 1917, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.staticValidation.sourcePath === sourcePath, 'Static source path mismatch')
assert(result.staticValidation.proofRunner === proofRunner, 'Static proof runner mismatch')
for (const key of [
  'controlledInstanceEvidenceValidated',
  'runnerUsesValidateSoundCpuPrivateMediaManifest',
  'runtimeFlagsRemainFalseValidated',
  'noMediaNoArtifactClaimsValidated',
  'prohibitedRuntimeInstructionScanPassed',
  'staticValidationOnly',
]) {
  assertTrue(result.staticValidation[key], `result.staticValidation.${key}`)
}
for (const key of [
  'realMediaUsedToday',
  'artifactCreatedToday',
  'workerDispatchedToday',
  'routeToolProviderCalledToday',
  'supabaseSqlTouchedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday',
]) {
  assertFalse(result.staticValidation[key], `result.staticValidation.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(sourceBoundary.decision === expectedDecision, 'Source boundary decision mismatch')
assert(sourceBoundary.sourceBoundary.sourcePath === sourcePath, 'Source boundary path mismatch')
assert(sourceBoundary.sourceBoundary.acceptedWorkerNames.length === 2, 'Worker name count mismatch')
assert(sourceBoundary.sourceBoundary.acceptedJobTypes.length === 4, 'Job type count mismatch')
for (const key of [
  'manifestTypePresent',
  'manifestInputTypePresent',
  'runtimeDefaultsFalsePresent',
  'validatorFunctionPresent',
  'acceptedForMediaProcessingTodayFalse',
  'acceptedForArtifactCreationTodayFalse',
  'acceptedForWorkerDispatchTodayFalse',
]) {
  assertTrue(sourceBoundary.sourceBoundary[key], `sourceBoundary.sourceBoundary.${key}`)
}

assert(runnerValidation.decision === expectedDecision, 'Runner validation decision mismatch')
assert(runnerValidation.proofRunnerValidation.proofRunner === proofRunner, 'Runner path mismatch')
for (const value of Object.values(runnerValidation.proofRunnerValidation)) {
  if (typeof value === 'boolean') assertTrue(value, 'Every runner validation boolean must be true')
}

assert(evidenceValidation.decision === expectedDecision, 'Evidence validation decision mismatch')
assert(evidenceValidation.validatedEvidence.phase72OwnerReviewDecision === sourceDecision, 'Evidence source decision mismatch')
assertTrue(evidenceValidation.validatedEvidence.controlledPrivateManifestInstanceCreated, 'Evidence controlled instance missing')
assertTrue(evidenceValidation.validatedEvidence.inMemoryOnly, 'Evidence in-memory flag missing')
assertTrue(evidenceValidation.validatedEvidence.validationOk, 'Evidence validation flag missing')
assert(evidenceValidation.validatedEvidence.issueCount === 0, 'Evidence issue count mismatch')
assertTrue(evidenceValidation.validatedEvidence.runtimeFlagsAllFalse, 'Evidence runtime flags mismatch')
assert(evidenceValidation.validatedEvidence.readyForRealExecutionToday === 0, 'Evidence ready-for-real mismatch')

assert(prohibitedScan.decision === expectedDecision, 'Prohibited scan decision mismatch')
assert(prohibitedScan.prohibitedRuntimeScan.scanTargets.includes(sourcePath), 'Prohibited scan source target missing')
assert(prohibitedScan.prohibitedRuntimeScan.scanTargets.includes(proofRunner), 'Prohibited scan runner target missing')
assertTrue(prohibitedScan.prohibitedRuntimeScan.scanPassed, 'Prohibited scan must pass')
for (const [key, value] of Object.entries(prohibitedScan.prohibitedRuntimeScan)) {
  if (key.endsWith('Detected')) assertFalse(value, `prohibitedScan.prohibitedRuntimeScan.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_instance_static_validation_pending'),
  'Static validation resolution missing',
)
for (const blockerId of [
  'private_manifest_instance_static_validation_owner_review_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

for (const key of [
  'phase73StaticValidationPassed',
  'privateManifestSourceBoundaryValidated',
  'proofRunnerBoundaryValidated',
  'controlledInstanceEvidenceValidated',
  'prohibitedRuntimeScanPassed',
  'privateManifestInstanceStaticValidationOwnerReviewMayProceed',
]) {
  assertTrue(claims.allowedClaims[key], `claims.allowedClaims.${key}`)
}
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(next.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
for (const key of [
  'reviewStaticValidationResult',
  'reviewManifestSourceBoundary',
  'reviewProofRunnerBoundary',
  'reviewControlledInstanceEvidence',
  'reviewProhibitedRuntimeScan',
  'acceptForRealMediaArtifactBoundaryPlanningOnly',
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
  'export type SoundCpuPrivateMediaManifestInput',
  'export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'export function validateSoundCpuPrivateMediaManifest',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(requiredText), `Source missing: ${requiredText}`)
}

const proofText = readText(proofRunner)
for (const requiredText of [
  'validateSoundCpuPrivateMediaManifest(controlledInput)',
  'privateMediaAssetIdCount',
  'plannedPrivateArtifactIdCount',
  'persistedManifestInstance: false',
  'realMediaUsed: false',
  'artifactCreated: false',
  'workerDispatched: false',
  'supabaseSqlTouched: false',
]) {
  assert(proofText.includes(requiredText), `Proof runner missing: ${requiredText}`)
}

for (const [target, text] of [
  [sourcePath, sourceText],
  [proofRunner, proofText],
]) {
  for (const pattern of [
    /audio_open/,
    /ffmpeg/i,
    /ffprobe/i,
    /writeFile/,
    /createSignedUrl/,
    /docker build/i,
    /Cloud Run/,
    /service_role/,
  ]) {
    assert(!pattern.test(text), `Prohibited runtime pattern ${pattern} found in ${target}`)
  }
}

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript]?.includes(
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation-diagnostics.mjs',
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
      staticValidationOnly: true,
      soundCpuToolCountCovered: claims.allowedClaims.soundCpuToolCountCovered,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
