import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase90_caption_render_runtime_hook_private_manifest_instance_static_validation_owner_review_passed_with_warnings_ready_for_controlled_manifest_instance_creation_planning_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase91_caption_render_runtime_hook_controlled_manifest_instance_creation_planning_completed_with_warnings_ready_for_controlled_manifest_instance_creation_owner_review_no_execution'
const sourceMergeCommit = '6a680abf9182c49da409af708e5cdacea9524def'
const sourceHead = 'd52a6e76ef95e220553597f3f37bcadda8a121cf'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE91-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-MANIFEST-INSTANCE-CREATION-PLANNING-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-acceptance-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-result.md',
  fieldMap:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-field-map.md',
  procedure:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-creation-procedure-plan.md',
  syntheticInput:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-synthetic-private-reference-input-plan.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-no-persistence-runtime-boundary.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-owner-review-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review.md',
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
    'createManifestToday": ' + 'true',
    'persistManifestToday": ' + 'true',
    'manifestInstanceCreatedToday": ' + 'true',
    'manifestInstancePersistedToday": ' + 'true',
    'syntheticInputCreatedToday": ' + 'true',
    'realMediaBytesUsedToday": ' + 'true',
    'useRealMediaBytesToday": ' + 'true',
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
    'realUserMediaBetaReadyClaimed": ' + 'true',
    'productionReadinessClaimed": ' + 'true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-acceptance-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-result',
  ),
  fieldMap: parseJsonBlock(
    docs.fieldMap,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-field-map',
  ),
  procedure: parseJsonBlock(
    docs.procedure,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-creation-procedure-plan',
  ),
  syntheticInput: parseJsonBlock(
    docs.syntheticInput,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-synthetic-private-reference-input-plan',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-no-persistence-runtime-boundary',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-owner-review-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const sourceText = read(sourcePath)
for (const token of [
  'validateSoundCpuPrivateMediaManifest',
  'approvedPlanSnapshotId',
  'privateMediaAssetIds',
  'plannedPrivateArtifactIds',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(token), `private manifest source missing ${token}`)
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.planningScope.planControlledManifestInstanceCreation === true, 'source prompt planning scope missing')
assert(parsed.sourcePrompt.planningScope.preserveWorkerNames.length === 2, 'source prompt worker count')
assert(parsed.sourcePrompt.planningScope.preserveJobTypes.length === 4, 'source prompt job type count')
assertFalse(parsed.sourcePrompt.planningScope.createManifestToday, 'source prompt create manifest')
assertFalse(parsed.sourcePrompt.planningScope.persistManifestToday, 'source prompt persist manifest')
assertFalse(parsed.sourcePrompt.planningScope.dispatchWorkerToday, 'source prompt dispatch')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1994, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === 'd2929a074bf9b6641b7802fe73e09553c9ec4471', 'source result reviewed head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '9af585b5d375277a7c946011c65fdcf8cb1a4424', 'source result reviewed merge')
assert(parsed.sourceResult.ownerReview.controlledManifestInstanceCreationPlanningMayProceed === true, 'source result planning may proceed')
assertFalse(parsed.sourceResult.ownerReview.createManifestToday, 'source result create manifest')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tool count')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result real execution count')
assert(parsed.sourceAcceptance.acceptedEvidence.privateManifestInstanceStaticValidationPassed === true, 'source acceptance static validation')
assert(parsed.sourceAcceptance.acceptedForPlanningOnly.controlledManifestInstanceCreationPlanningMayProceed === true, 'source acceptance planning')
assert(parsed.sourceAcceptance.acceptedForExecutionToday === 'none', 'source acceptance execution approvals')
assert(
  parsed.sourceBlockers.remainingBlockersBeforeExternalAgentRealMediaExecution.controlledManifestInstanceCreationPlanning ===
    'required_next',
  'source blockers next planning',
)
assert(parsed.sourcePolicy.allowedClaims.controlledManifestInstanceCreationPlanningMayProceed === true, 'source policy planning claim')
assertAllFalse(parsed.sourcePolicy.blockedClaims, 'sourcePolicy.blockedClaims')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1995, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.planningResult.controlledManifestInstanceCreationPlanned === true, 'result controlled planning missing')
assert(parsed.result.planningResult.plannedSourcePath === sourcePath, 'result source path mismatch')
assert(parsed.result.planningResult.plannedValidatorFunction === 'validateSoundCpuPrivateMediaManifest', 'result validator mismatch')
assert(parsed.result.planningResult.runtimeDefaultsMustRemainFalse === true, 'result runtime defaults policy missing')
for (const key of [
  'createManifestToday',
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
  assertFalse(parsed.result.planningResult[key], `result.planningResult.${key}`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution count')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')

for (const field of [
  'schemaVersion',
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'jobType',
  'privateMediaAssetIds',
  'plannedPrivateArtifactIds',
  'runtimeDefaults',
]) {
  assert(parsed.fieldMap.requiredFields.includes(field), `field map missing ${field}`)
}
assert(parsed.fieldMap.acceptedWorkerNames.length === 2, 'field map worker count')
assert(parsed.fieldMap.acceptedJobTypes.length === 4, 'field map job type count')
assert(parsed.fieldMap.referencePolicy.signedUrlsRejectedAsSourceOfTruth === true, 'field map signed URL rejection')
assertAllFalse(parsed.fieldMap.executionState, 'fieldMap.executionState')

assert(parsed.procedure.plannedProcedure.includes('validate_with_existing_pure_validator'), 'procedure validator step')
assert(parsed.procedure.requiredPreconditionsForFutureCreation.runtimeFlagsAllFalse === true, 'procedure runtime flag precondition')
assertAllFalse(parsed.procedure.blockedProcedureStepsToday, 'procedure.blockedProcedureStepsToday')

assert(parsed.syntheticInput.syntheticInputPlan.rawPromptIncluded === false, 'synthetic raw prompt')
assert(parsed.syntheticInput.syntheticInputPlan.signedUrlIncluded === false, 'synthetic signed URL')
assert(parsed.syntheticInput.syntheticInputPlan.serviceRolePayloadIncluded === false, 'synthetic service role')
assertAllFalse(parsed.syntheticInput.executionState, 'syntheticInput.executionState')

assertAllFalse(parsed.boundary.closedRuntimeBoundaries, 'boundary.closedRuntimeBoundaries')
assertAllFalse(parsed.boundary.readinessClaims, 'boundary.readinessClaims')

assert(parsed.readiness.ownerReviewReadiness.controlledCreationOwnerReviewMayProceed === true, 'readiness owner review')
assert(parsed.readiness.ownerReviewMustReject.includes('supabase_sql'), 'readiness Supabase rejection')
assert(parsed.readiness.executionApprovalsToday === 'none', 'readiness execution approvals')

assert(
  parsed.blockers.resolvedForThisGate.includes('controlledManifestInstanceCreationPlanningCompleted'),
  'blockers planning resolution',
)
assert(
  parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution
    .controlledManifestInstanceCreationPlanningOwnerReview === 'required_next',
  'blockers owner review next',
)
assert(parsed.blockers.executionApprovalsToday === 'none', 'blockers execution approvals')

assert(parsed.policy.allowedClaims.controlledManifestInstanceCreationPlanningCompleted === true, 'policy planning claim')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase91_caption_render_runtime_hook_controlled_manifest_instance_creation_planning_owner_review_passed_with_warnings_ready_for_controlled_manifest_instance_creation_no_execution',
  'next prompt expected decision mismatch',
)
assert(parsed.next.reviewScope.acceptForControlledManifestInstanceCreationProofOnly === true, 'next prompt proof-only acceptance')
for (const key of [
  'createManifestToday',
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
  assertFalse(parsed.next.reviewScope[key], `next.reviewScope.${key}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      reviewedSourcePr: parsed.result.sourceVerification.sourcePr,
      controlledManifestInstanceCreationPlanningCompleted:
        parsed.result.planningResult.controlledManifestInstanceCreationPlanned,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      executionApprovalsToday: parsed.policy.executionApprovalsToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
