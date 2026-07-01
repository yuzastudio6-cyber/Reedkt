import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase88_caption_render_runtime_hook_private_manifest_instance_owner_review_passed_with_warnings_ready_for_instance_static_validation_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase89_caption_render_runtime_hook_private_manifest_instance_static_validation_plan_completed_with_warnings_ready_for_private_manifest_instance_static_validation_no_execution'
const sourceMergeCommit = '6f3a9484e99dbdc49a3e3affea643172229aba8f'
const sourceHead = '1562936305f7b2ba520c3ced90cf202a8ef2fd13'
const existingSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const validatorFunction = 'validateSoundCpuPrivateMediaManifest'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE90-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-STATIC-VALIDATION'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-acceptance-register.md',
  sourceShapeReview:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-static-validation-planning-readiness-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-result.md',
  requiredFields:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-required-field-static-validation-plan.md',
  opaqueReferences:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-opaque-reference-static-validation-plan.md',
  disallowedFields:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-disallowed-field-static-validation-plan.md',
  runtimeDefaults:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-runtime-default-static-validation-plan.md',
  pureValidator:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-existing-pure-validator-static-validation-plan.md',
  nonExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-non-execution-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation.md',
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
    'createManifestToday": ' + 'true',
    'persistManifestToday": ' + 'true',
    'manifestInstanceCreatedToday": ' + 'true',
    'manifestInstancePersistedToday": ' + 'true',
    'staticValidationExecutedToday": ' + 'true',
    'realMediaBytesUsedToday": ' + 'true',
    'useRealMediaBytesToday": ' + 'true',
    'openMediaFileToday": ' + 'true',
    'mediaFileOpenedToday": ' + 'true',
    'createArtifactToday": ' + 'true',
    'artifactCreatedToday": ' + 'true',
    'createSignedUrlToday": ' + 'true',
    'signedUrlCreatedToday": ' + 'true',
    'publicArtifactCreatedToday": ' + 'true',
    'storageTransferCreatedToday": ' + 'true',
    'dispatchWorkerToday": ' + 'true',
    'workerDispatchedToday": ' + 'true',
    'callRouteToolProviderToday": ' + 'true',
    'routeToolProviderExecutedToday": ' + 'true',
    'providerModelCalledToday": ' + 'true',
    'touchSupabaseSqlToday": ' + 'true',
    'supabaseSqlTouchedToday": ' + 'true',
    'externalBetaUnlockedToday": ' + 'true',
    'productionUnlockedToday": ' + 'true',
    'generatedLocalFixturePassedClaimed": ' + 'true',
    'dryRunPassedClaimed": ' + 'true',
    'runtimeReadinessClaimed": ' + 'true',
    'realUserMediaBetaReadyClaimed": ' + 'true',
    'productionReadinessClaimed": ' + 'true',
    'unlockBetaToday": ' + 'true',
    'unlockProductionToday": ' + 'true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-owner-acceptance-register',
  ),
  sourceShapeReview: parseJsonBlock(
    docs.sourceShapeReview,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-owner-review-register',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-static-validation-planning-readiness-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-result',
  ),
  requiredFields: parseJsonBlock(
    docs.requiredFields,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-required-field-static-validation-plan',
  ),
  opaqueReferences: parseJsonBlock(
    docs.opaqueReferences,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-opaque-reference-static-validation-plan',
  ),
  disallowedFields: parseJsonBlock(
    docs.disallowedFields,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-disallowed-field-static-validation-plan',
  ),
  runtimeDefaults: parseJsonBlock(
    docs.runtimeDefaults,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-runtime-default-static-validation-plan',
  ),
  pureValidator: parseJsonBlock(
    docs.pureValidator,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-existing-pure-validator-static-validation-plan',
  ),
  nonExecution: parseJsonBlock(
    docs.nonExecution,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-non-execution-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const sourceText = read(existingSourcePath)
for (const required of [
  'SOUND_CPU_PRIVATE_MANIFEST_WORKER_NAMES',
  'SOUND_CPU_PRIVATE_MANIFEST_JOB_TYPES',
  'SoundCpuPrivateMediaManifest',
  'SoundCpuPrivateMediaManifestInput',
  'validateSoundCpuPrivateMediaManifest',
  'missing_required_field',
  'invalid_worker_name',
  'invalid_job_type',
  'invalid_private_media_asset_id',
  'invalid_planned_private_artifact_id',
  'runtime_flag_must_remain_false',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(sourceText.includes(required), `Existing manifest source missing ${required}`)
}

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.planningScope.planExistingPureValidatorUse === true, 'source prompt pure validator plan missing')
assertFalse(parsed.sourcePrompt.planningScope.createManifestToday, 'source prompt create manifest must be false')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === '6e758dd57c162b2f109ae7440266c9a5b4d27567', 'source result reviewed head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '4a97368b73b8abf48797689b8d5b2d8bf5086ce7', 'source result reviewed merge mismatch')
assert(parsed.sourceResult.ownerReview.staticValidationPlanningMayProceed === true, 'source result static validation planning missing')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result ready count must remain zero')
assert(parsed.sourceAcceptance.acceptedNextGateOnly.instanceStaticValidationPlanningMayProceed === true, 'source acceptance next planning missing')
assertFalse(parsed.sourceAcceptance.acceptedNextGateOnly.manifestInstanceCreationToday, 'source acceptance manifest creation must be false')
assert(parsed.sourceShapeReview.reviewedInstanceShape.runtimeDefaultsMustRemainFalse === true, 'source shape runtime default missing')
assert(parsed.sourceShapeReview.reviewedInstanceShape.signedUrlsRejectedAsSourceOfTruth === true, 'source shape signed URL rejection missing')
assertFalse(parsed.sourceShapeReview.executionState.manifestInstanceCreatedToday, 'source shape must not create instance')
assert(parsed.sourceReadiness.instanceStaticValidationPlanningMayProceed.validateRequiredInstanceFields === true, 'source readiness required fields missing')
assert(parsed.sourceReadiness.instanceStaticValidationPlanningMayProceed.validateRuntimeDefaultsRemainFalse === true, 'source readiness runtime defaults missing')
assertFalse(parsed.sourceReadiness.instanceStaticValidationPlanningMayProceed.createManifestToday, 'source readiness create manifest must be false')
assert(parsed.sourcePolicy.allowedClaims.staticValidationPlanningMayProceed === true, 'source policy static validation planning missing')
assertFalse(parsed.sourcePolicy.blockedClaims.staticValidationExecutedToday, 'source policy static validation execution must be false')
assertFalse(parsed.sourcePolicy.blockedClaims.realUserMediaBetaReadyClaimed, 'source policy beta readiness must be false')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1990, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.staticValidationPlan.requiredFieldValidationPlanned === true, 'result required field plan missing')
assert(parsed.result.staticValidationPlan.opaquePrivateReferenceValidationPlanned === true, 'result opaque reference plan missing')
assert(parsed.result.staticValidationPlan.disallowedFieldValidationPlanned === true, 'result disallowed field plan missing')
assert(parsed.result.staticValidationPlan.runtimeDefaultFalseValidationPlanned === true, 'result runtime default plan missing')
assert(parsed.result.staticValidationPlan.existingPureValidatorUsePlanned === true, 'result pure validator plan missing')
assert(parsed.result.staticValidationPlan.validatorSourcePath === existingSourcePath, 'result validator path mismatch')
assert(parsed.result.staticValidationPlan.validatorFunction === validatorFunction, 'result validator function mismatch')
assertFalse(parsed.result.staticValidationPlan.staticValidationExecutedToday, 'result static validation must be false')
assertFalse(parsed.result.staticValidationPlan.manifestInstanceCreatedToday, 'result manifest creation must be false')
assertFalse(parsed.result.staticValidationPlan.mediaFileOpenedToday, 'result media open must be false')
assertFalse(parsed.result.staticValidationPlan.artifactCreatedToday, 'result artifact creation must be false')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result ready count must be zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')

for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'workerName', 'jobType']) {
  assert(parsed.requiredFields.requiredFieldsToValidate.includes(field), `required field plan missing ${field}`)
}
assert(parsed.requiredFields.acceptedWorkerNames.includes('sound-cpu-analysis-worker'), 'required field worker missing')
assert(parsed.requiredFields.acceptedJobTypes.includes('sound.numeric_array_analysis'), 'required field job type missing')
assert(parsed.requiredFields.validationIssuesPlanned.includes('missing_required_field'), 'required field issue missing')
assertFalse(parsed.requiredFields.executionState.staticValidationExecutedToday, 'required field execution must be false')

assert(parsed.opaqueReferences.opaqueReferenceValidation.privateMediaAssetIdsMustBeNonEmptyStrings === true, 'opaque media validation missing')
assert(parsed.opaqueReferences.opaqueReferenceValidation.plannedPrivateArtifactIdsMustBeNonEmptyStrings === true, 'opaque artifact validation missing')
assert(parsed.opaqueReferences.opaqueReferenceValidation.signedUrlsRejected === true, 'opaque signed URL rejection missing')
assert(parsed.opaqueReferences.opaqueReferenceValidation.validationIssuesPlanned.includes('invalid_private_media_asset_id'), 'opaque media issue missing')
assertFalse(parsed.opaqueReferences.executionState.openMediaFileToday, 'opaque open media must be false')
assertFalse(parsed.opaqueReferences.executionState.createArtifactToday, 'opaque artifact creation must be false')

assert(parsed.disallowedFields.disallowedFieldsToReject.includes('rawPrompt'), 'disallowed rawPrompt missing')
assert(parsed.disallowedFields.disallowedFieldsToReject.includes('signedUrl'), 'disallowed signedUrl missing')
assert(parsed.disallowedFields.disallowedFieldPolicy.serviceRolePayloadsRejected === true, 'service role rejection missing')
assertFalse(parsed.disallowedFields.executionState.touchSupabaseSqlToday, 'disallowed Supabase touch must be false')

assert(parsed.runtimeDefaults.runtimeDefaultsToValidateFalse.includes('workerExecutionEnabled'), 'runtime worker flag missing')
assert(parsed.runtimeDefaults.runtimeDefaultsToValidateFalse.includes('sqlExecutionEnabled'), 'runtime sql flag missing')
assert(parsed.runtimeDefaults.validationIssuePlanned === 'runtime_flag_must_remain_false', 'runtime issue mismatch')
assertFalse(parsed.runtimeDefaults.executionState.runtimeReadinessClaimed, 'runtime readiness must be false')
assertFalse(parsed.runtimeDefaults.executionState.realUserMediaBetaReadyClaimed, 'real media beta readiness must be false')

assert(parsed.pureValidator.existingPureValidatorPlan.sourcePath === existingSourcePath, 'pure validator path mismatch')
assert(parsed.pureValidator.existingPureValidatorPlan.validatorFunction === validatorFunction, 'pure validator function mismatch')
assert(parsed.pureValidator.existingPureValidatorPlan.validatorIsPureStaticShapeCheck === true, 'pure validator purity missing')
assert(parsed.pureValidator.existingPureValidatorPlan.nextGateMayRunSyntheticInMemoryValidationOnly === true, 'pure validator next scope missing')
assertFalse(parsed.pureValidator.executionState.runValidatorWithRealPayloadToday, 'pure validator real payload must be false')
assertFalse(parsed.pureValidator.executionState.dispatchWorkerToday, 'pure validator dispatch must be false')

assertFalse(parsed.nonExecution.closedExecutionGates.staticValidationExecutedToday, 'non-execution static validation must be false')
assertFalse(parsed.nonExecution.closedExecutionGates.manifestInstanceCreatedToday, 'non-execution manifest creation must be false')
assertFalse(parsed.nonExecution.closedExecutionGates.realMediaBytesUsedToday, 'non-execution media bytes must be false')
assertFalse(parsed.nonExecution.readinessClaims.runtimeReadinessClaimed, 'non-execution runtime readiness must be false')
assertFalse(parsed.nonExecution.readinessClaims.realUserMediaBetaReadyClaimed, 'non-execution real beta readiness must be false')

assert(parsed.blockers.resolvedForThisGate.includes('existingPureValidatorUsePlanned'), 'blocker pure validator resolution missing')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.privateManifestInstanceStaticValidation === 'required_next', 'blocker next mismatch')
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.staticValidationPlanCompleted === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.privateManifestInstanceStaticValidationMayProceed === true, 'policy next static validation claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assertFalse(parsed.policy.blockedClaims.staticValidationExecutedToday, 'policy static validation execution must be false')
assertFalse(parsed.policy.blockedClaims.realUserMediaBetaReadyClaimed, 'policy real beta readiness must be false')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase90_caption_render_runtime_hook_private_manifest_instance_static_validation_passed_with_warnings_ready_for_private_manifest_instance_static_validation_owner_review_no_execution', 'next prompt expected decision mismatch')
assert(parsed.next.validationScope.runSyntheticInMemoryValidatorOnly === true, 'next prompt synthetic validation scope missing')
assertFalse(parsed.next.validationScope.createManifestToday, 'next prompt create manifest must be false')
assertFalse(parsed.next.validationScope.openMediaFileToday, 'next prompt open media must be false')
assertFalse(parsed.next.validationScope.createArtifactToday, 'next prompt artifact creation must be false')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      existingSourcePath,
      validatorFunction,
      staticValidationPlanCompleted: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
