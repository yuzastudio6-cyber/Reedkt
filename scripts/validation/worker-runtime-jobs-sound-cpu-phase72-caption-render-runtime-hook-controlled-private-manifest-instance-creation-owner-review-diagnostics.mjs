import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_private_manifest_instance_static_validation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_created_with_warnings_ready_for_instance_creation_owner_review_no_media_no_artifacts'
const sourceHead = '9ca2fdd8f530c0e4b99f1c035c9b38fd9658f896'
const sourceMergeCommit = '8b99561989866a2e898eaad4c938e12a49fd589f'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const proofRunner =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-runner.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review:diagnostics'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE73-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-STATIC-VALIDATION'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-owner-instance-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-owner-instance-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-validation-evidence-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-validation-evidence-owner-review-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation.md',
    'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation',
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
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-acceptance-register',
)
const instanceReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-owner-instance-review-register',
)
const validationReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-validation-evidence-owner-review-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-claim-policy',
)
const next = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation',
)

const phase72 = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-result.md',
  'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-result',
)
assert(phase72.decision === sourceDecision, 'Source Phase 72 decision mismatch')
assert(phase72.sourceVerification.sourceMergeCommit === '6252f9b5643a102a43ebd609d5e3a70f0b44cb41', 'Phase 72 source merge mismatch')
assertTrue(phase72.controlledProof.controlledPrivateManifestInstanceCreated, 'Phase 72 did not create controlled instance')
assertTrue(phase72.controlledProof.inMemoryOnly, 'Phase 72 instance must be in memory only')
assertTrue(phase72.controlledProof.validationOk, 'Phase 72 validation must pass')
assert(phase72.controlledProof.issueCount === 0, 'Phase 72 issue count must be zero')
assertTrue(phase72.controlledProof.runtimeFlagsAllFalse, 'Phase 72 runtime flags must remain false')
assert(phase72.soundCpuTools.readyForRealExecutionToday === 0, 'Phase 72 ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1915, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.reviewedEvidence.sourcePath === sourcePath, 'Reviewed source path mismatch')
assert(result.reviewedEvidence.proofRunner === proofRunner, 'Reviewed proof runner mismatch')
for (const key of [
  'controlledPrivateManifestInstanceAccepted',
  'inMemoryOnlyAccepted',
  'noMediaNoArtifactFixtureInputsAccepted',
  'validationFunctionCallAccepted',
  'sanitizedValidationEvidenceAccepted',
  'runtimeFlagsFalseAccepted',
  'acceptedForStaticPrivateManifestInstanceValidationOnly',
]) {
  assertTrue(result.reviewedEvidence[key], `result.reviewedEvidence.${key}`)
}
for (const key of [
  'persistedManifestInstanceToday',
  'realMediaUsedToday',
  'artifactCreatedToday',
  'workerDispatchedToday',
  'routeToolProviderCalledToday',
  'supabaseSqlTouchedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday',
]) {
  assertFalse(result.reviewedEvidence[key], `result.reviewedEvidence.${key}`)
}
assert(result.soundCpuTools.covered === 15, 'Tool count mismatch')
assert(result.soundCpuTools.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase72Pr === 1915, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase72Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase72MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.sourcePath === sourcePath, 'Acceptance source path mismatch')
assert(acceptance.acceptedEvidence.proofRunner === proofRunner, 'Acceptance proof runner mismatch')
for (const key of [
  'controlledPrivateManifestInstanceCreated',
  'inMemoryOnly',
  'validationOk',
  'runtimeFlagsAllFalse',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.issueCount === 0, 'Acceptance issue count mismatch')
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real mismatch')
assertTrue(acceptance.acceptedScope.staticPrivateManifestInstanceValidation, 'Static validation scope must be accepted')
for (const key of [
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

assert(instanceReview.decision === expectedDecision, 'Instance-review decision mismatch')
assert(instanceReview.reviewedInstance.sourcePath === sourcePath, 'Instance-review source path mismatch')
assert(instanceReview.reviewedInstance.workerName === 'sound-cpu-analysis-worker', 'Instance-review worker mismatch')
assert(instanceReview.reviewedInstance.jobType === 'sound.package_import_smoke', 'Instance-review job mismatch')
assertTrue(instanceReview.reviewedInstance.usesOpaqueFixtureIdsOnly, 'Instance-review opaque id policy missing')
assertTrue(instanceReview.reviewedInstance.inMemoryOnly, 'Instance-review in-memory policy missing')
for (const key of ['persistedManifestInstance', 'storageObjectCreated', 'artifactRecordCreated']) {
  assertFalse(instanceReview.reviewedInstance[key], `instanceReview.reviewedInstance.${key}`)
}
for (const key of ['staticShapeValidation', 'staticRuntimeFlagValidation', 'staticSanitizedEvidenceValidation']) {
  assertTrue(instanceReview.acceptedForNextGate[key], `instanceReview.acceptedForNextGate.${key}`)
}
for (const key of ['realMediaRead', 'artifactWrite', 'workerDispatch']) {
  assertFalse(instanceReview.acceptedForNextGate[key], `instanceReview.acceptedForNextGate.${key}`)
}

assert(validationReview.decision === expectedDecision, 'Validation-review decision mismatch')
for (const key of ['validationCalled', 'validationOk', 'runtimeFlagsAllFalse']) {
  assertTrue(validationReview.reviewedValidationEvidence[key], `validationReview.reviewedValidationEvidence.${key}`)
}
assert(validationReview.reviewedValidationEvidence.issueCount === 0, 'Validation-review issue count mismatch')
assert(Array.isArray(validationReview.reviewedValidationEvidence.sanitizedErrors), 'Sanitized errors must be array')
assert(validationReview.reviewedValidationEvidence.sanitizedErrors.length === 0, 'Sanitized errors must be empty')
for (const key of [
  'acceptedForManifestInstanceCreationToday',
  'acceptedForMediaProcessingToday',
  'acceptedForArtifactCreationToday',
  'acceptedForWorkerDispatchToday',
]) {
  assertFalse(validationReview.reviewedValidationEvidence[key], `validationReview.reviewedValidationEvidence.${key}`)
}
assertAllFalse(validationReview.reviewedSanitization, 'validationReview.reviewedSanitization')

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.allowedNextStep === 'private manifest instance static validation without media or artifacts', 'Safety next step mismatch')
assertTrue(safety.nextStepMustRemainNoMediaNoArtifact, 'Safety no-media/no-artifact policy missing')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')
assertNoop(safety.supabaseClassification, 'safety')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'controlled_private_manifest_instance_creation_owner_review_pending',
  ),
  'Owner-review blocker resolution missing',
)
for (const blockerId of [
  'private_manifest_instance_static_validation_pending',
  'real_media_artifact_execution_pending',
  'external_beta_runtime_readiness_pending',
]) {
  assert(blockers.remainingBlockers.some((row) => row.blockerId === blockerId), `Missing remaining blocker: ${blockerId}`)
}

for (const key of [
  'phase72OwnerReviewPassed',
  'controlledPrivateManifestInstanceAccepted',
  'inMemoryOnlyAccepted',
  'noMediaNoArtifactFixtureInputsAccepted',
  'validationEvidenceAccepted',
  'runtimeFlagsFalseAccepted',
  'privateManifestInstanceStaticValidationMayProceed',
]) {
  assertTrue(claims.allowedClaims[key], `claims.allowedClaims.${key}`)
}
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assert(claims.allowedClaims.readyForRealExecutionToday === 0, 'Claim ready-for-real mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(next.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(next.validationScope.sourcePath === sourcePath, 'Next prompt source path mismatch')
assert(next.validationScope.proofRunner === proofRunner, 'Next prompt proof runner mismatch')
for (const key of [
  'staticValidateControlledInstanceEvidence',
  'staticValidateRunnerUsesValidator',
  'staticValidateRuntimeFlagsRemainFalse',
  'staticValidateNoMediaNoArtifactClaims',
]) {
  assertTrue(next.validationScope[key], `next.validationScope.${key}`)
}
for (const key of [
  'runRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(next.validationScope[key], `next.validationScope.${key}`)
}
assertNoop(next.supabaseClassification, 'next')

const sourceText = readText(sourcePath)
for (const requiredText of [
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
assert(
  packageJson.scripts?.[packageScript]?.includes(
    'worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-owner-review-diagnostics.mjs',
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
      staticPrivateManifestInstanceValidationMayProceed: true,
      soundCpuToolCountCovered: claims.allowedClaims.soundCpuToolCountCovered,
      readyForRealExecutionToday: claims.allowedClaims.readyForRealExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
