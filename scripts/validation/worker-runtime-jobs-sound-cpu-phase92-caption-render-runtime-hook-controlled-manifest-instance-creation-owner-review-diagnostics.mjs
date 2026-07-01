import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase92_caption_render_runtime_hook_controlled_manifest_instance_creation_passed_with_warnings_ready_for_controlled_manifest_instance_creation_owner_review_no_persistence_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase92_caption_render_runtime_hook_controlled_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_planning_no_execution'
const sourceMergeCommit = '7ee7c1edf4068f3b07b070e70c8e68e1333f015a'
const sourceHead = 'c13219c9933d3d826f674b60c8ae432e910334f3'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE93-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-PLANNING'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-result.md',
  sourceRunnerOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-runner-output-register.md',
  sourceContent:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-manifest-instance-content-register.md',
  sourcePersistence:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-no-persistence-proof-register.md',
  sourceScan:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-prohibited-runtime-scan-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-acceptance-register.md',
  validationReview:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-validation-owner-review-register.md',
  persistenceReview:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-no-persistence-owner-review-register.md',
  prohibitedReview:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-prohibited-runtime-owner-review-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-private-manifest-persistence-planning-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning.md',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) assertFalse(value, `${label}.${key} must be false`)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'persistManifestToday": ' + 'true',
    'actualManifestPersistenceMayProceed": ' + 'true',
    'manifestInstancePersistedToday": ' + 'true',
    'useRealMediaBytesToday": ' + 'true',
    'realMediaBytesUsedToday": ' + 'true',
    'openMediaFileToday": ' + 'true',
    'mediaFileOpenedToday": ' + 'true',
    'createArtifactToday": ' + 'true',
    'artifactCreatedToday": ' + 'true',
    'createSignedUrlToday": ' + 'true',
    'signedUrlCreatedToday": ' + 'true',
    'dispatchWorkerToday": ' + 'true',
    'workerDispatchedToday": ' + 'true',
    'callRouteToolProviderToday": ' + 'true',
    'routeToolProviderExecutedToday": ' + 'true',
    'touchSupabaseSqlToday": ' + 'true',
    'supabaseSqlTouchedToday": ' + 'true',
    'unlockBetaToday": ' + 'true',
    'unlockProductionToday": ' + 'true',
    'generatedLocalFixturePassedClaimed": ' + 'true',
    'dryRunPassedClaimed": ' + 'true',
    'runtimeReadinessClaimed": ' + 'true',
    'workerReadinessClaimed": ' + 'true',
    'realUserMediaBetaReadyClaimed": ' + 'true',
    'productionReadinessClaimed": ' + 'true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-result',
  ),
  sourceRunnerOutput: parseJsonBlock(
    docs.sourceRunnerOutput,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-runner-output-register',
  ),
  sourceContent: parseJsonBlock(
    docs.sourceContent,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-manifest-instance-content-register',
  ),
  sourcePersistence: parseJsonBlock(
    docs.sourcePersistence,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-no-persistence-proof-register',
  ),
  sourceScan: parseJsonBlock(
    docs.sourceScan,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-prohibited-runtime-scan-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-acceptance-register',
  ),
  validationReview: parseJsonBlock(
    docs.validationReview,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-validation-owner-review-register',
  ),
  persistenceReview: parseJsonBlock(
    docs.persistenceReview,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-no-persistence-owner-review-register',
  ),
  prohibitedReview: parseJsonBlock(
    docs.prohibitedReview,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-prohibited-runtime-owner-review-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-private-manifest-persistence-planning-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.acceptForPersistencePlanningOnly === true, 'source prompt persistence planning')
for (const key of [
  'persistManifestToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.sourcePrompt.reviewScope[key], `sourcePrompt.reviewScope.${key}`)
}

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1998, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === 'c76ac8170bdd629053ea1e1e174e16b4bc8d24bf', 'source result reviewed head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '1f271f9fd7c7e9dab34e6e2063d16bedc90fdd83', 'source result reviewed merge')
assert(parsed.sourceResult.controlledInMemoryProof.controlledInMemoryManifestInstanceCreated === true, 'source proof missing')
assert(parsed.sourceResult.controlledInMemoryProof.validationOk === true, 'source proof validation')
assert(parsed.sourceResult.controlledInMemoryProof.validationIssueCount === 0, 'source proof issues')
assert(parsed.sourceResult.controlledInMemoryProof.discardedAfterValidation === true, 'source proof discarded')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tool count')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result real execution count')

assert(parsed.sourceRunnerOutput.runnerOutput.ok === true, 'source runner output')
assert(parsed.sourceRunnerOutput.runnerOutput.validationOk === true, 'source runner validation')
assert(parsed.sourceRunnerOutput.runnerOutput.discardedAfterValidation === true, 'source runner discard')
assertAllFalse(parsed.sourceRunnerOutput.noPersistenceNoExecution, 'sourceRunnerOutput.noPersistenceNoExecution')
assert(parsed.sourceContent.manifestShapeValidated.workerNamesAllowed.includes('sound-cpu-analysis-worker'), 'source content worker')
assert(parsed.sourceContent.manifestShapeValidated.jobTypesAllowed.includes('sound.package_import_smoke'), 'source content job')
assert(parsed.sourceContent.manifestShapeValidated.privateMediaAssetIdCount === 1, 'source content private media count')
assert(parsed.sourceContent.manifestShapeValidated.plannedPrivateArtifactIdCount === 1, 'source content artifact count')
assert(parsed.sourceContent.manifestShapeValidated.runtimeDefaultFalseKeyCount === 11, 'source content runtime default count')
assert(parsed.sourceContent.manifestShapeValidated.signedUrlAbsent === true, 'source content signed URL absent')
assertAllFalse(parsed.sourceContent.executionState, 'sourceContent.executionState')
assertAllFalse(parsed.sourcePersistence.closedBoundaries, 'sourcePersistence.closedBoundaries')
assert(parsed.sourcePersistence.proofCleanup.discardedAfterValidation === true, 'source persistence cleanup discard')
assertFalse(parsed.sourcePersistence.proofCleanup.temporaryFilesCreated, 'source persistence cleanup temp files')
assertFalse(parsed.sourcePersistence.proofCleanup.artifactsCreated, 'source persistence cleanup artifacts')
assertFalse(parsed.sourcePersistence.proofCleanup.storageObjectsCreated, 'source persistence cleanup storage')
assert(parsed.sourceScan.prohibitedRuntimeScan.scanPassed === true, 'source scan passed')
for (const key of [
  'mediaOpenDetected',
  'artifactWriteDetected',
  'signedUrlCreationDetected',
  'workerDispatchDetected',
  'routeToolProviderCallDetected',
  'supabaseSqlDetected',
  'gcpCloudRunDetected',
  'providerModelCallDetected',
]) {
  assertFalse(parsed.sourceScan.prohibitedRuntimeScan[key], `sourceScan.prohibitedRuntimeScan.${key}`)
}
assert(
  parsed.sourceBlockers.remainingBlockersBeforeExternalAgentRealMediaExecution
    .controlledManifestInstanceCreationOwnerReview === 'required_next',
  'source blockers owner review',
)
assert(parsed.sourcePolicy.allowedClaims.controlledInMemoryManifestInstanceCreationPassed === true, 'source policy proof claim')
assertAllFalse(parsed.sourcePolicy.blockedClaims, 'sourcePolicy.blockedClaims')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1999, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.acceptForPersistencePlanningOnly === true, 'result persistence planning')
assert(parsed.result.ownerReview.privateManifestPersistencePlanningMayProceed === true, 'result planning may proceed')
for (const key of [
  'persistManifestToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.result.ownerReview[key], `result.ownerReview.${key}`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution count')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt')

assert(parsed.acceptance.acceptedEvidence.controlledInMemoryManifestInstanceCreated === true, 'acceptance proof')
assert(parsed.acceptance.acceptedForNextGateOnly.privateManifestPersistencePlanningMayProceed === true, 'acceptance planning')
assertFalse(parsed.acceptance.acceptedForNextGateOnly.actualManifestPersistenceMayProceed, 'acceptance actual persistence')
assert(parsed.validationReview.validator.validationOk === true, 'validation review ok')
assert(parsed.validationReview.validator.validationIssueCount === 0, 'validation review issues')
assert(parsed.validationReview.manifestContentReviewed.rawPromptsAbsent === true, 'validation raw prompts')
assertAllFalse(parsed.persistenceReview.reviewedNoPersistenceProof, 'persistenceReview.reviewedNoPersistenceProof')
assert(parsed.persistenceReview.nextPlanningScope.planPrivateManifestPersistenceBoundary === true, 'persistence planning scope')
assertFalse(parsed.persistenceReview.nextPlanningScope.persistManifestToday, 'persistence planning no persist')
assertAllFalse(parsed.prohibitedReview.prohibitedRuntimeReview, 'prohibitedReview.prohibitedRuntimeReview')
assertAllFalse(parsed.prohibitedReview.readinessClaims, 'prohibitedReview.readinessClaims')
assert(parsed.readiness.readinessForNextPlanningGate.privateManifestPersistencePlanningMayProceed === true, 'readiness planning')
assert(parsed.readiness.stillBlockedBeforeRealExecution.actualManifestPersistence === true, 'actual persistence still blocked')
assert(parsed.blockers.ownerReviewPassedWithWarnings === true, 'blockers owner review pass')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentExecution.privateManifestPersistencePlanning === 'required_next', 'blockers next')
assert(parsed.policy.allowedClaims.privateManifestPersistencePlanningMayProceed === true, 'policy planning allowed')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.planningScope.planPrivateManifestPersistenceBoundary === true, 'next planning scope')
for (const key of [
  'persistManifestToday',
  'selectStorageBackendToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.next.planningScope[key], `next.planningScope.${key}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      reviewedSourcePr: parsed.result.sourceVerification.sourcePr,
      privateManifestPersistencePlanningMayProceed: true,
      persistManifestToday: false,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      executionApprovalsToday: 'none',
      nextPrompt,
    },
    null,
    2,
  ),
)
