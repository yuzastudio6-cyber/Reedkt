import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase89_caption_render_runtime_hook_private_manifest_instance_static_validation_plan_completed_with_warnings_ready_for_private_manifest_instance_static_validation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase90_caption_render_runtime_hook_private_manifest_instance_static_validation_passed_with_warnings_ready_for_private_manifest_instance_static_validation_owner_review_no_execution'
const sourceMergeCommit = '1f3300ee73f87d63027d75e4e912ad4494221c14'
const sourceHead = '544d2f121e78bfeb6e9dfba93265314bac93acee'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-runner.mjs'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE90-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-STATIC-VALIDATION-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-result.md',
  sourcePureValidator:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-existing-pure-validator-static-validation-plan.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-result.md',
  synthetic:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-synthetic-in-memory-validation-register.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-source-boundary-static-validation-register.md',
  issueCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-validation-issue-coverage-register.md',
  runtimeDefaults:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-runtime-default-static-validation-register.md',
  prohibitedScan:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-prohibited-runtime-scan-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review.md',
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
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-result',
  ),
  sourcePureValidator: parseJsonBlock(
    docs.sourcePureValidator,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-existing-pure-validator-static-validation-plan',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-instance-static-validation-plan-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-result',
  ),
  synthetic: parseJsonBlock(
    docs.synthetic,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-synthetic-in-memory-validation-register',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-source-boundary-static-validation-register',
  ),
  issueCoverage: parseJsonBlock(
    docs.issueCoverage,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-validation-issue-coverage-register',
  ),
  runtimeDefaults: parseJsonBlock(
    docs.runtimeDefaults,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-runtime-default-static-validation-register',
  ),
  prohibitedScan: parseJsonBlock(
    docs.prohibitedScan,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-prohibited-runtime-scan-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const runnerOutput = JSON.parse(execFileSync(process.execPath, [runnerPath], { encoding: 'utf8' }))
assert(runnerOutput.ok === true, 'runner output must pass')
assert(runnerOutput.sourcePath === sourcePath, 'runner source path mismatch')
assert(runnerOutput.syntheticInMemoryValidation.validCaseOk === true, 'runner valid case missing')
assert(runnerOutput.syntheticInMemoryValidation.validCaseIssueCount === 0, 'runner valid issue count mismatch')
assert(runnerOutput.syntheticInMemoryValidation.missingRequiredDetected === true, 'runner missing required detection missing')
assert(runnerOutput.syntheticInMemoryValidation.invalidWorkerDetected === true, 'runner invalid worker detection missing')
assert(runnerOutput.syntheticInMemoryValidation.invalidJobTypeDetected === true, 'runner invalid job type detection missing')
assert(
  runnerOutput.syntheticInMemoryValidation.invalidPrivateMediaAssetIdDetected === true,
  'runner invalid media asset detection missing',
)
assert(
  runnerOutput.syntheticInMemoryValidation.invalidPlannedPrivateArtifactIdDetected === true,
  'runner invalid artifact detection missing',
)
assert(
  runnerOutput.syntheticInMemoryValidation.runtimeFlagMustRemainFalseDetected === true,
  'runner runtime flag detection missing',
)
assert(runnerOutput.syntheticInMemoryValidation.runtimeDefaultsAllFalseReturned === true, 'runner runtime defaults missing')
assertFalse(
  runnerOutput.syntheticInMemoryValidation.acceptedForManifestInstanceCreationToday,
  'runner manifest creation acceptance',
)
assertFalse(runnerOutput.noExecution.openMediaFileToday, 'runner open media')
assertFalse(runnerOutput.noExecution.dispatchWorkerToday, 'runner dispatch worker')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.validationScope.runSyntheticInMemoryValidatorOnly === true, 'source prompt synthetic scope missing')
assertFalse(parsed.sourcePrompt.validationScope.createManifestToday, 'source prompt create manifest')
assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === '1562936305f7b2ba520c3ced90cf202a8ef2fd13', 'source result reviewed head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '6f3a9484e99dbdc49a3e3affea643172229aba8f', 'source result reviewed merge mismatch')
assert(parsed.sourceResult.staticValidationPlan.existingPureValidatorUsePlanned === true, 'source result pure validator missing')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result ready count must remain zero')
assert(parsed.sourcePureValidator.existingPureValidatorPlan.validatorFunction === 'validateSoundCpuPrivateMediaManifest', 'source pure validator function mismatch')
assert(parsed.sourcePureValidator.existingPureValidatorPlan.nextGateMayRunSyntheticInMemoryValidationOnly === true, 'source pure validator next scope missing')
assert(parsed.sourcePolicy.allowedClaims.privateManifestInstanceStaticValidationMayProceed === true, 'source policy next validation missing')
assertFalse(parsed.sourcePolicy.blockedClaims.realUserMediaBetaReadyClaimed, 'source policy beta readiness')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1992, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.staticValidation.runner === runnerPath, 'result runner mismatch')
assert(parsed.result.staticValidation.sourcePath === sourcePath, 'result source path mismatch')
assert(parsed.result.staticValidation.syntheticInMemoryValidationPassed === true, 'result synthetic validation missing')
assert(parsed.result.staticValidation.requiredFieldValidationPassed === true, 'result required field missing')
assert(parsed.result.staticValidation.runtimeDefaultFalseValidationPassed === true, 'result runtime defaults missing')
assertFalse(parsed.result.staticValidation.createManifestToday, 'result create manifest')
assertFalse(parsed.result.staticValidation.openMediaFileToday, 'result open media')
assertFalse(parsed.result.staticValidation.dispatchWorkerToday, 'result dispatch worker')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result ready count must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')

assert(parsed.synthetic.runnerOutput.ok === true, 'synthetic ok missing')
assert(parsed.synthetic.runnerOutput.validCaseOk === runnerOutput.syntheticInMemoryValidation.validCaseOk, 'synthetic valid case mismatch')
assert(
  parsed.synthetic.runnerOutput.runtimeFlagMustRemainFalseDetected ===
    runnerOutput.syntheticInMemoryValidation.runtimeFlagMustRemainFalseDetected,
  'synthetic runtime flag mismatch',
)
assertFalse(parsed.synthetic.runnerOutput.acceptedForManifestInstanceCreationToday, 'synthetic manifest creation')
assert(parsed.synthetic.executionState.syntheticInMemoryValidationExecuted === true, 'synthetic execution evidence missing')
assertFalse(parsed.synthetic.executionState.realMediaBytesUsedToday, 'synthetic real media')
assertFalse(parsed.synthetic.executionState.workerDispatchedToday, 'synthetic worker dispatch')

assert(parsed.sourceBoundary.sourceBoundary.validatorFunctionPresent === true, 'source boundary validator missing')
assert(parsed.sourceBoundary.sourceBoundary.workerNames.length === 2, 'source boundary worker names mismatch')
assert(parsed.sourceBoundary.sourceBoundary.jobTypes.length === 4, 'source boundary job type count mismatch')
assertFalse(parsed.sourceBoundary.executionState.sourceChangedToday, 'source changed')
assertFalse(parsed.sourceBoundary.executionState.workerDispatchedToday, 'source boundary dispatch')

for (const issueCode of [
  'missing_required_field',
  'invalid_worker_name',
  'invalid_job_type',
  'invalid_private_media_asset_id',
  'invalid_planned_private_artifact_id',
  'runtime_flag_must_remain_false',
]) {
  assert(parsed.issueCoverage.validatedIssueCodes.includes(issueCode), `issue coverage missing ${issueCode}`)
}
assert(parsed.issueCoverage.validatedDisallowedFieldPolicy.signedUrlAbsentFromValidInput === true, 'signed URL absence missing')
assertFalse(parsed.issueCoverage.executionState.createManifestToday, 'issue coverage create manifest')

assert(parsed.runtimeDefaults.runtimeDefaultsValidatedFalse.includes('workerExecutionEnabled'), 'runtime defaults worker missing')
assert(parsed.runtimeDefaults.runtimeDefaultsValidatedFalse.includes('sqlExecutionEnabled'), 'runtime defaults SQL missing')
assertFalse(parsed.runtimeDefaults.acceptedForToday.manifestInstanceCreation, 'runtime defaults manifest creation')
assertFalse(parsed.runtimeDefaults.acceptedForToday.realUserMediaBetaReadiness, 'runtime defaults real beta')

assert(parsed.prohibitedScan.prohibitedRuntimeScan.scanPassed === true, 'prohibited scan must pass')
for (const [key, value] of Object.entries(parsed.prohibitedScan.prohibitedRuntimeScan)) {
  if (key.endsWith('Detected')) assertFalse(value, `prohibited scan ${key}`)
}

assert(
  parsed.blockers.resolvedForThisGate.includes('privateManifestInstanceStaticValidationPassed'),
  'blocker static validation resolution missing',
)
assert(
  parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.privateManifestInstanceStaticValidationOwnerReview ===
    'required_next',
  'blocker next owner review mismatch',
)
assert(parsed.blockers.executionApprovalsToday === 'none', 'execution approvals must be none')
assert(parsed.policy.allowedClaims.privateManifestInstanceStaticValidationPassed === true, 'policy static validation claim missing')
assert(parsed.policy.allowedClaims.syntheticInMemoryValidationPassed === true, 'policy synthetic claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count mismatch')
assertFalse(parsed.policy.blockedClaims.manifestInstanceCreatedToday, 'policy manifest creation')
assertFalse(parsed.policy.blockedClaims.realUserMediaBetaReadyClaimed, 'policy real beta readiness')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals must be none')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase90_caption_render_runtime_hook_private_manifest_instance_static_validation_owner_review_passed_with_warnings_ready_for_controlled_manifest_instance_creation_planning_no_execution',
  'next prompt expected decision mismatch',
)
assert(parsed.next.reviewScope.reviewStaticValidationResult === true, 'next prompt static review missing')
assert(parsed.next.reviewScope.acceptForControlledManifestInstanceCreationPlanningOnly === true, 'next prompt planning scope missing')
assertFalse(parsed.next.reviewScope.createManifestToday, 'next prompt create manifest')
assertFalse(parsed.next.reviewScope.openMediaFileToday, 'next prompt open media')
assertFalse(parsed.next.reviewScope.dispatchWorkerToday, 'next prompt dispatch worker')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      sourcePath,
      syntheticInMemoryValidationPassed: true,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
