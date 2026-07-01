import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase76_caption_render_runtime_hook_limited_real_media_fixture_planning_owner_review_passed_with_warnings_ready_for_fixture_static_validation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase77_caption_render_runtime_hook_limited_real_media_fixture_static_validation_passed_with_warnings_ready_for_fixture_static_validation_owner_review_no_execution'
const sourceMergeCommit = 'd5d8dcd681c0cbd26d2c1bc065e6d5f997669a40'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE77-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-REAL-MEDIA-FIXTURE-STATIC-VALIDATION-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review-result.md',
  sourceFixtureIds:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-identifier-register.md',
  sourcePrivateMedia:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-asset-example-register.md',
  sourcePlannedArtifacts:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-planned-private-artifact-example-register.md',
  sourceStaticPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-result.md',
  fixtureValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-identifier-static-validation-register.md',
  privateMediaValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-private-media-asset-static-validation-register.md',
  plannedArtifactValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-planned-private-artifact-static-validation-register.md',
  prohibitedScan:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-static-scan-register.md',
  runtimeFlags:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-runtime-flag-static-validation-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, message) {
  assert(value === false, message)
}

function assertUnique(values, message) {
  assert(new Set(values).size === values.length, message)
}

function assertOpaqueId(value, pattern, message) {
  assert(pattern.test(value), message)
  assert(!value.includes('/'), `${message}: contains slash`)
  assert(!value.includes('://'), `${message}: contains protocol`)
  assert(!/\s/.test(value), `${message}: contains whitespace`)
  assert(!/https?:/i.test(value), `${message}: contains url`)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'realMediaBytesUsedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'fixtureRecordsPersistedToday": true',
    'realMediaBytesAttachedToday": true',
    'storageObjectReadToday": true',
    'signedUrlCreatedToday": true',
    'privateArtifactWrittenToday": true',
    'storageTransferToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
    'mediaOperationExecutedToday": true',
    'workerOperationExecutedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseOperationExecutedToday": true',
    'generatedLocalFixturePassedClaimed": true',
    'dryRunPassedClaimed": true',
    'runtimeReadinessClaimed": true',
    'realUserMediaBetaReadyClaimed": true',
    'useRealMediaBytesToday": true',
    'openMediaFileToday": true',
    'createArtifactToday": true',
    'persistFixtureManifestToday": true',
    'dispatchWorkerToday": true',
    'touchSupabaseSqlToday": true',
    'unlockBetaToday": true',
    'unlockProductionToday": true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-limited-real-media-fixture-planning-owner-review-result',
  ),
  sourceFixtureIds: parseJsonBlock(
    docs.sourceFixtureIds,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-identifier-register',
  ),
  sourcePrivateMedia: parseJsonBlock(
    docs.sourcePrivateMedia,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-asset-example-register',
  ),
  sourcePlannedArtifacts: parseJsonBlock(
    docs.sourcePlannedArtifacts,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-planned-private-artifact-example-register',
  ),
  sourceStaticPlan: parseJsonBlock(
    docs.sourceStaticPlan,
    'worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-fixture-static-validation-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-result',
  ),
  fixtureValidation: parseJsonBlock(
    docs.fixtureValidation,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-identifier-static-validation-register',
  ),
  privateMediaValidation: parseJsonBlock(
    docs.privateMediaValidation,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-private-media-asset-static-validation-register',
  ),
  plannedArtifactValidation: parseJsonBlock(
    docs.plannedArtifactValidation,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-planned-private-artifact-static-validation-register',
  ),
  prohibitedScan: parseJsonBlock(
    docs.prohibitedScan,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-static-scan-register',
  ),
  runtimeFlags: parseJsonBlock(
    docs.runtimeFlags,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-runtime-flag-static-validation-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-fixture-static-validation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-limited-real-media-fixture-static-validation-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.acceptedForStaticValidationOnly.fixtureStaticValidationMayProceed === true, 'source did not approve static validation')
assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.staticValidationResult.staticValidationExecuted === true, 'static validation result missing')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.staticValidationResult.realMediaBytesUsedToday,
  parsed.result.staticValidationResult.mediaFileOpenedToday,
  parsed.result.staticValidationResult.artifactCreatedToday,
  parsed.result.staticValidationResult.fixtureManifestPersistedToday,
  parsed.result.staticValidationResult.workerDispatchedToday,
  parsed.result.staticValidationResult.routeToolProviderExecutedToday,
  parsed.result.staticValidationResult.supabaseSqlTouchedToday,
  parsed.result.staticValidationResult.externalBetaUnlockedToday,
  parsed.result.staticValidationResult.productionUnlockedToday,
]) {
  assertFalse(value, 'execution state must remain false')
}

const fixtureIds = parsed.sourceFixtureIds.plannedFixtureIds
assert(fixtureIds.length === 3, 'expected three fixture IDs')
assertUnique(fixtureIds, 'fixture IDs must be unique')
for (const id of fixtureIds) {
  assertOpaqueId(id, /^sound-cpu-caption-render-fixture-audio-\d{3}$/, `invalid fixture ID ${id}`)
}
assert(parsed.fixtureValidation.validatedFixtureSet.plannedFixtureIds.length === fixtureIds.length, 'validated fixture count mismatch')
assert(parsed.fixtureValidation.validationChecks.allIdsAreUnique === true, 'fixture uniqueness validation missing')
assertFalse(parsed.fixtureValidation.executionState.mediaFileOpenedToday, 'media open must remain blocked')

const mediaIds = parsed.sourcePrivateMedia.privateMediaAssetIdExamples
assert(mediaIds.length === 3, 'expected three private media IDs')
assertUnique(mediaIds, 'private media IDs must be unique')
for (const id of mediaIds) {
  assertOpaqueId(id, /^private-media-asset:sound-cpu:caption-render:fixture-audio-\d{3}$/, `invalid private media ID ${id}`)
}
assert(parsed.privateMediaValidation.validationChecks.noProviderBlob === true, 'provider blob scan missing')
assertFalse(parsed.privateMediaValidation.executionState.signedUrlCreatedToday, 'signed URL must not be created')

const artifactIds = parsed.sourcePlannedArtifacts.plannedPrivateArtifactIdExamples
assert(artifactIds.length === 3, 'expected three planned artifact IDs')
assertUnique(artifactIds, 'planned artifact IDs must be unique')
for (const id of artifactIds) {
  assertOpaqueId(
    id,
    /^planned-private-artifact:sound-cpu:caption-render:fixture-audio-\d{3}:(caption-json|caption-vtt|render-manifest)$/,
    `invalid planned artifact ID ${id}`,
  )
}
assert(parsed.plannedArtifactValidation.validationChecks.allIdsUseApprovedArtifactKinds === true, 'artifact kind validation missing')
assertFalse(parsed.plannedArtifactValidation.executionState.artifactCreatedToday, 'artifact must not be created')

assert(parsed.sourceStaticPlan.runtimeDisabledDefaults.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'source runtime flag mismatch')
assert(parsed.runtimeFlags.validatedRuntimeDisabledDefaults.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime enabled flag mismatch')
assertFalse(parsed.runtimeFlags.validatedBlockedExecution.mediaOperationExecutedToday, 'media operation must remain blocked')
assertFalse(parsed.runtimeFlags.readinessClaims.generatedLocalFixturePassedClaimed, 'generated fixture claim must remain false')
assert(parsed.prohibitedScan.allowedReferenceTypes.length === 3, 'allowed reference type count mismatch')
assert(parsed.prohibitedScan.scanPassed.rawFilesystemPathReferences === true, 'path scan missing')
assertFalse(parsed.prohibitedScan.executionState.providerModelCalledToday, 'provider call must remain blocked')
assert(parsed.blockers.remainingBlockersBeforeExecution.fixtureStaticValidationOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewFixtureIdentifierStaticValidation === true, 'next prompt missing fixture review')
assertFalse(parsed.next.reviewScope.useRealMediaBytesToday, 'next prompt must block real media bytes')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureIdentifiersValidated: fixtureIds.length,
      privateMediaAssetIdsValidated: mediaIds.length,
      plannedPrivateArtifactIdsValidated: artifactIds.length,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
