import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase78_caption_render_runtime_hook_limited_fixture_instance_planning_owner_review_passed_with_warnings_ready_for_instance_static_validation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase79_caption_render_runtime_hook_fixture_instance_static_validation_passed_with_warnings_ready_for_instance_static_validation_owner_review_no_execution'
const sourceMergeCommit = '0f2422be202ce971c5abe88561f1788c9528afd9'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE79-CAPTION-RENDER-RUNTIME-HOOK-FIXTURE-INSTANCE-STATIC-VALIDATION-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-acceptance-register.md',
  sourceInstanceReview:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-review-register.md',
  sourceMappingReview:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-readiness-register.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-owner-review-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-result.md',
  idValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-static-validation-register.md',
  referenceValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-reference-static-validation-register.md',
  mappingValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-static-validation-register.md',
  prohibitedScan:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-static-scan-register.md',
  runtimeFlags:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-static-validation-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review.md',
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

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'fixtureInstancesCreatedToday": true',
    'fixtureInstanceCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesUsedToday": true',
    'realMediaBytesApprovedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreatedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
    'storageTransferToday": true',
    'signedUrlCreatedToday": true',
    'storageObjectReadToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
    'mediaOperationExecutedToday": true',
    'workerOperationExecutedToday": true',
    'supabaseOperationExecutedToday": true',
    'generatedLocalFixturePassedClaimed": true',
    'dryRunPassedClaimed": true',
    'runtimeReadinessClaimed": true',
    'realUserMediaBetaReadyClaimed": true',
    'createFixtureInstancesToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-limited-fixture-instance-planning-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-acceptance-register',
  ),
  sourceInstanceReview: parseJsonBlock(
    docs.sourceInstanceReview,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-review-register',
  ),
  sourceMappingReview: parseJsonBlock(
    docs.sourceMappingReview,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-readiness-register',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-runtime-boundary-owner-review-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-result',
  ),
  idValidation: parseJsonBlock(
    docs.idValidation,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-static-validation-register',
  ),
  referenceValidation: parseJsonBlock(
    docs.referenceValidation,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-reference-static-validation-register',
  ),
  mappingValidation: parseJsonBlock(
    docs.mappingValidation,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-static-validation-register',
  ),
  prohibitedScan: parseJsonBlock(
    docs.prohibitedScan,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-static-scan-register',
  ),
  runtimeFlags: parseJsonBlock(
    docs.runtimeFlags,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-static-validation-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.acceptedForInstanceStaticValidationOnly.fixtureInstanceStaticValidationMayProceed === true, 'source did not allow static validation')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution must be zero')
assert(parsed.sourceAcceptance.acceptedPlanningCounts.fixtureInstances === 3, 'source accepted fixture count mismatch')
assert(parsed.sourceAcceptance.acceptedPlanningCounts.privateMediaAssetMappings === 3, 'source accepted media count mismatch')
assert(parsed.sourceAcceptance.acceptedPlanningCounts.plannedPrivateArtifactMappings === 3, 'source accepted artifact count mismatch')
assert(parsed.sourceInstanceReview.acceptedFixtureInstanceIds.length === 3, 'source instance review count mismatch')
assert(parsed.sourceMappingReview.acceptedMappingCounts.privateMediaAssetMappings === 3, 'source mapping review count mismatch')
assert(parsed.sourceReadiness.fixtureInstanceStaticValidationMayProceed.validateFixtureInstanceIdUniqueness === true, 'source readiness missing static validation')
assert(parsed.sourceBoundary.readinessClaims.runtimeReadinessClaimed === false, 'source runtime readiness must be unclaimed')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.staticValidationResult.fixtureInstanceIdsPassed === true, 'fixture instance IDs did not pass')
assert(parsed.result.staticValidationResult.privateMediaAssetMappingsPassed === true, 'private media mapping did not pass')
assert(parsed.result.staticValidationResult.plannedPrivateArtifactMappingsPassed === true, 'artifact mapping did not pass')
assert(parsed.result.staticValidationResult.prohibitedReferenceScanPassed === true, 'prohibited reference scan did not pass')
assert(parsed.result.staticValidationResult.runtimeFlagStaticValidationPassed === true, 'runtime flag validation did not pass')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.staticValidationResult.fixtureInstancesCreatedToday,
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

const ids = parsed.idValidation.validatedFixtureInstanceIds
const sourceIds = parsed.referenceValidation.validatedSourceFixtureIds
const mappings = parsed.mappingValidation.validatedMappings
assert(ids.length === 3, 'expected three fixture instance IDs')
assert(sourceIds.length === 3, 'expected three source fixture IDs')
assert(mappings.length === 3, 'expected three mapping entries')
assertUnique(ids, 'fixture instance IDs must be unique')
assertUnique(sourceIds, 'source fixture IDs must be unique')
assertUnique(mappings.map((item) => item.privateMediaAssetId), 'private media asset IDs must be unique')
assertUnique(mappings.map((item) => item.plannedPrivateArtifactId), 'planned artifact IDs must be unique')

for (const id of ids) {
  assert(/^sound-cpu-caption-render-fixture-instance-\d{3}$/.test(id), `bad fixture instance ID ${id}`)
}
for (const id of sourceIds) {
  assert(/^sound-cpu-caption-render-fixture-audio-\d{3}$/.test(id), `bad source fixture ID ${id}`)
}
for (const mapping of mappings) {
  assert(ids.includes(mapping.fixtureInstanceId), `mapping uses unknown fixture instance ${mapping.fixtureInstanceId}`)
  assert(sourceIds.includes(mapping.sourceFixtureId), `mapping uses unknown source fixture ${mapping.sourceFixtureId}`)
  assert(
    /^private-media-asset:sound-cpu:caption-render:fixture-audio-\d{3}$/.test(mapping.privateMediaAssetId),
    `bad private media asset ID ${mapping.privateMediaAssetId}`,
  )
  assert(
    /^planned-private-artifact:sound-cpu:caption-render:fixture-audio-\d{3}:(caption-json|caption-vtt|render-manifest)$/.test(
      mapping.plannedPrivateArtifactId,
    ),
    `bad planned artifact ID ${mapping.plannedPrivateArtifactId}`,
  )
  const instanceOrdinal = mapping.fixtureInstanceId.match(/(\d{3})$/)[1]
  const sourceOrdinal = mapping.sourceFixtureId.match(/(\d{3})$/)[1]
  const mediaOrdinal = mapping.privateMediaAssetId.match(/(\d{3})$/)[1]
  const artifactOrdinal = mapping.plannedPrivateArtifactId.match(/fixture-audio-(\d{3}):/)[1]
  assert(instanceOrdinal === sourceOrdinal, `source ordinal mismatch for ${mapping.fixtureInstanceId}`)
  assert(instanceOrdinal === mediaOrdinal, `media ordinal mismatch for ${mapping.fixtureInstanceId}`)
  assert(instanceOrdinal === artifactOrdinal, `artifact ordinal mismatch for ${mapping.fixtureInstanceId}`)
}

assert(parsed.idValidation.staticChecks.idsAreUnique === true, 'ID uniqueness static check missing')
assertFalse(parsed.idValidation.executionState.fixtureInstanceCreatedToday, 'fixture instance must not be created')
assert(parsed.referenceValidation.sourceReferenceChecks.referencesPreservePhase77ValidatedOrder === true, 'source order static check missing')
assertFalse(parsed.referenceValidation.executionState.mediaFileOpenedToday, 'media file must not be opened')
assert(parsed.mappingValidation.staticChecks.mappingOrdinalsMatch === true, 'mapping ordinal static check missing')
assertFalse(parsed.mappingValidation.executionState.artifactCreatedToday, 'artifact must not be created')
assert(parsed.prohibitedScan.scanPassed.filesystemPaths === true, 'filesystem path scan missing')
assert(parsed.prohibitedScan.scanPassed.signedUrls === true, 'signed URL scan missing')
assertFalse(parsed.prohibitedScan.executionState.providerModelCalledToday, 'provider model call must not run')
assert(parsed.runtimeFlags.validatedRuntimeDisabledDefaults.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime disabled flag missing')
assert(parsed.runtimeFlags.readinessClaims.runtimeReadinessClaimed === false, 'runtime readiness must be unclaimed')
assert(parsed.blockers.remainingBlockersBeforeExecution.fixtureInstanceStaticValidationOwnerReview === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.reviewScope.reviewFixtureInstanceStaticValidation === true, 'next prompt missing static validation review')
assertFalse(parsed.next.reviewScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.reviewScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureInstanceIdsValidated: ids.length,
      privateMediaMappingsValidated: mappings.length,
      plannedPrivateArtifactMappingsValidated: mappings.length,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
