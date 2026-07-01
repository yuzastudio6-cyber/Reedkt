import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase79_caption_render_runtime_hook_fixture_instance_static_validation_passed_with_warnings_ready_for_instance_static_validation_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase79_caption_render_runtime_hook_fixture_instance_static_validation_owner_review_passed_with_warnings_ready_for_limited_fixture_instance_creation_planning_no_execution'
const sourceMergeCommit = '1fbfa1d2b322f98a05302134898c7a496eedf5d3'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE80-CAPTION-RENDER-RUNTIME-HOOK-LIMITED-FIXTURE-INSTANCE-CREATION-PLANNING'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-result.md',
  sourceIdValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-static-validation-register.md',
  sourceReferenceValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-reference-static-validation-register.md',
  sourceMappingValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-static-validation-register.md',
  sourceProhibitedScan:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-static-scan-register.md',
  sourceRuntimeFlags:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-static-validation-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-acceptance-register.md',
  idReview:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-owner-review-register.md',
  mappingReview:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register.md',
  prohibitedReview:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-owner-review-register.md',
  runtimeReview:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-limited-fixture-instance-creation-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning.md',
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

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'fixtureInstanceCreationApprovedToday": true',
    'fixtureInstanceCreatedToday": true',
    'fixtureInstancesCreatedToday": true',
    'fixtureManifestPersistedToday": true',
    'realMediaBytesApprovedToday": true',
    'realMediaBytesUsedToday": true',
    'mediaFileOpenApprovedToday": true',
    'mediaFileOpenedToday": true',
    'artifactCreationApprovedToday": true',
    'artifactCreatedToday": true',
    'storageTransferApprovedToday": true',
    'signedUrlCreationApprovedToday": true',
    'storageObjectReadToday": true',
    'signedUrlCreatedToday": true',
    'publicArtifactCreatedToday": true',
    'providerModelCalledToday": true',
    'workerDispatchApprovedToday": true',
    'workerDispatchedToday": true',
    'routeToolProviderExecutionApprovedToday": true',
    'routeToolProviderExecutedToday": true',
    'supabaseSqlApprovedToday": true',
    'supabaseSqlTouchedToday": true',
    'externalBetaUnlockedToday": true',
    'productionUnlockedToday": true',
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
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-result',
  ),
  sourceIdValidation: parseJsonBlock(
    docs.sourceIdValidation,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-static-validation-register',
  ),
  sourceReferenceValidation: parseJsonBlock(
    docs.sourceReferenceValidation,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-reference-static-validation-register',
  ),
  sourceMappingValidation: parseJsonBlock(
    docs.sourceMappingValidation,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-static-validation-register',
  ),
  sourceProhibitedScan: parseJsonBlock(
    docs.sourceProhibitedScan,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-static-scan-register',
  ),
  sourceRuntimeFlags: parseJsonBlock(
    docs.sourceRuntimeFlags,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-static-validation-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-acceptance-register',
  ),
  idReview: parseJsonBlock(
    docs.idReview,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-id-owner-review-register',
  ),
  mappingReview: parseJsonBlock(
    docs.mappingReview,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-owner-review-register',
  ),
  prohibitedReview: parseJsonBlock(
    docs.prohibitedReview,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-owner-review-register',
  ),
  runtimeReview: parseJsonBlock(
    docs.runtimeReview,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-runtime-flag-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-limited-fixture-instance-creation-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-static-validation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-limited-fixture-instance-creation-planning',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'expected decision mismatch')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.staticValidationResult.fixtureInstanceIdsPassed === true, 'source fixture IDs did not pass')
assert(parsed.sourceResult.staticValidationResult.prohibitedReferenceScanPassed === true, 'source prohibited scan did not pass')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution must be zero')
assert(parsed.sourceIdValidation.validatedFixtureInstanceIds.length === 3, 'source ID count mismatch')
assert(parsed.sourceReferenceValidation.validatedSourceFixtureIds.length === 3, 'source reference count mismatch')
assert(parsed.sourceMappingValidation.validatedMappings.length === 3, 'source mapping count mismatch')
assert(parsed.sourceProhibitedScan.scanPassed.signedUrls === true, 'source signed URL scan missing')
assert(parsed.sourceRuntimeFlags.readinessClaims.runtimeReadinessClaimed === false, 'source runtime readiness must be unclaimed')
assert(parsed.result.decision === decision, 'owner-review decision mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge commit mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.acceptedForLimitedCreationPlanningOnly.limitedFixtureInstanceCreationPlanningMayProceed === true, 'creation planning not allowed')
assert(parsed.result.soundCpuTools.covered === 15, 'expected 15 SOUND CPU tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
for (const value of [
  parsed.result.acceptedForLimitedCreationPlanningOnly.fixtureInstanceCreationApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.realMediaBytesApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.mediaFileOpenApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.artifactCreationApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.fixtureManifestPersistenceApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.workerDispatchApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.routeToolProviderExecutionApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.supabaseSqlApprovedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.externalBetaUnlockedToday,
  parsed.result.acceptedForLimitedCreationPlanningOnly.productionUnlockedToday,
]) {
  assertFalse(value, 'execution approval must remain false')
}

assert(parsed.acceptance.acceptedStaticValidationEvidence.fixtureInstanceIdCount === 3, 'acceptance fixture ID count mismatch')
assert(parsed.acceptance.acceptedNextGateOnly.limitedFixtureInstanceCreationPlanning === true, 'next planning gate not accepted')
assertFalse(parsed.acceptance.acceptedNextGateOnly.fixtureInstanceCreation, 'fixture instance creation must remain blocked')
assert(parsed.idReview.acceptedFixtureInstanceIds.length === 3, 'ID review count mismatch')
assertFalse(parsed.idReview.executionState.fixtureInstanceCreatedToday, 'fixture instance must not be created')
assert(parsed.mappingReview.acceptedMappingCounts.privateMediaAssetMappings === 3, 'mapping review media count mismatch')
assert(parsed.mappingReview.acceptedMappingProperties.mappingOrdinalsMatch === true, 'mapping ordinal review missing')
assertFalse(parsed.mappingReview.executionState.artifactCreationApprovedToday, 'artifact creation must remain blocked')
assert(parsed.prohibitedReview.acceptedScanPassed.serviceRolePayloads === true, 'service-role scan acceptance missing')
assertFalse(parsed.prohibitedReview.executionState.providerModelCalledToday, 'provider model call must not run')
assert(parsed.runtimeReview.acceptedRuntimeDisabledDefaults.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime flag missing')
assert(parsed.runtimeReview.readinessClaims.runtimeReadinessClaimed === false, 'runtime readiness must be unclaimed')
assert(parsed.readiness.limitedFixtureInstanceCreationPlanningMayProceed.planFixtureInstanceCreationPreconditions === true, 'creation planning readiness missing')
assertFalse(parsed.readiness.limitedFixtureInstanceCreationPlanningMayProceed.createFixtureInstancesToday, 'readiness must block instance creation')
assert(parsed.blockers.remainingBlockersBeforeExecution.limitedFixtureInstanceCreationPlanning === 'required_next', 'next blocker mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')
assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.planningScope.planFixtureInstanceCreationPreconditions === true, 'next prompt missing creation planning')
assertFalse(parsed.next.planningScope.createFixtureInstancesToday, 'next prompt must block fixture instance creation')
assertFalse(parsed.next.planningScope.openMediaFileToday, 'next prompt must block media open')
assertFalse(parsed.next.planningScope.createArtifactToday, 'next prompt must block artifact creation')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      fixtureInstanceStaticValidationAccepted: true,
      limitedFixtureInstanceCreationPlanningMayProceed: true,
      soundCpuToolCountCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
