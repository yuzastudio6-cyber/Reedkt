import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase90_caption_render_runtime_hook_private_manifest_instance_static_validation_passed_with_warnings_ready_for_private_manifest_instance_static_validation_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase90_caption_render_runtime_hook_private_manifest_instance_static_validation_owner_review_passed_with_warnings_ready_for_controlled_manifest_instance_creation_planning_no_execution'
const sourceMergeCommit = '9af585b5d375277a7c946011c65fdcf8cb1a4424'
const sourceHead = 'd2929a074bf9b6641b7802fe73e09553c9ec4471'
const runnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-runner.mjs'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE91-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-MANIFEST-INSTANCE-CREATION-PLANNING'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-result.md',
  sourceSynthetic:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-synthetic-in-memory-validation-register.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-source-boundary-static-validation-register.md',
  sourceIssueCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-validation-issue-coverage-register.md',
  sourceRuntimeDefaults:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-runtime-default-static-validation-register.md',
  sourceProhibitedScan:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-prohibited-runtime-scan-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-acceptance-register.md',
  syntheticReview:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-synthetic-validation-owner-review-register.md',
  boundaryReview:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-source-boundary-owner-review-register.md',
  issueReview:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-issue-coverage-owner-review-register.md',
  runtimeReview:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-runtime-default-owner-review-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning.md',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) assertFalse(value, `${label}.${key} must be false`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-result',
  ),
  sourceSynthetic: parseJsonBlock(
    docs.sourceSynthetic,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-synthetic-in-memory-validation-register',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-source-boundary-static-validation-register',
  ),
  sourceIssueCoverage: parseJsonBlock(
    docs.sourceIssueCoverage,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-validation-issue-coverage-register',
  ),
  sourceRuntimeDefaults: parseJsonBlock(
    docs.sourceRuntimeDefaults,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-runtime-default-static-validation-register',
  ),
  sourceProhibitedScan: parseJsonBlock(
    docs.sourceProhibitedScan,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-prohibited-runtime-scan-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-acceptance-register',
  ),
  syntheticReview: parseJsonBlock(
    docs.syntheticReview,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-synthetic-validation-owner-review-register',
  ),
  boundaryReview: parseJsonBlock(
    docs.boundaryReview,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-source-boundary-owner-review-register',
  ),
  issueReview: parseJsonBlock(
    docs.issueReview,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-issue-coverage-owner-review-register',
  ),
  runtimeReview: parseJsonBlock(
    docs.runtimeReview,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-runtime-default-owner-review-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning',
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
  'runner invalid private media asset detection missing',
)
assert(
  runnerOutput.syntheticInMemoryValidation.invalidPlannedPrivateArtifactIdDetected === true,
  'runner invalid private artifact detection missing',
)
assert(
  runnerOutput.syntheticInMemoryValidation.runtimeFlagMustRemainFalseDetected === true,
  'runner runtime false flag detection missing',
)
assert(runnerOutput.syntheticInMemoryValidation.runtimeDefaultsAllFalseReturned === true, 'runner defaults missing')
assertFalse(runnerOutput.syntheticInMemoryValidation.acceptedForManifestInstanceCreationToday, 'runner manifest creation')
assertFalse(runnerOutput.noExecution.openMediaFileToday, 'runner media open')
assertFalse(runnerOutput.noExecution.dispatchWorkerToday, 'runner dispatch')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.reviewStaticValidationResult === true, 'source prompt static review missing')
assert(parsed.sourcePrompt.reviewScope.acceptForControlledManifestInstanceCreationPlanningOnly === true, 'source prompt planning-only missing')
assertFalse(parsed.sourcePrompt.reviewScope.createManifestToday, 'source prompt create manifest')
assertFalse(parsed.sourcePrompt.reviewScope.persistManifestToday, 'source prompt persist manifest')
assertFalse(parsed.sourcePrompt.reviewScope.dispatchWorkerToday, 'source prompt worker dispatch')
assertFalse(parsed.sourcePrompt.reviewScope.touchSupabaseSqlToday, 'source prompt Supabase')

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1992, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === '544d2f121e78bfeb6e9dfba93265314bac93acee', 'source result parent head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '1f3300ee73f87d63027d75e4e912ad4494221c14', 'source result parent merge mismatch')
assert(parsed.sourceResult.staticValidation.runner === runnerPath, 'source result runner mismatch')
assert(parsed.sourceResult.staticValidation.sourcePath === sourcePath, 'source result source path mismatch')
assert(parsed.sourceResult.staticValidation.syntheticInMemoryValidationPassed === true, 'source result synthetic pass missing')
assert(parsed.sourceResult.staticValidation.runtimeDefaultFalseValidationPassed === true, 'source result runtime defaults missing')
assertFalse(parsed.sourceResult.staticValidation.createManifestToday, 'source result create manifest')
assertFalse(parsed.sourceResult.staticValidation.dispatchWorkerToday, 'source result worker dispatch')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tool count mismatch')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result ready count must be zero')

assert(parsed.sourceSynthetic.runnerOutput.ok === true, 'source synthetic ok missing')
assert(parsed.sourceSynthetic.runnerOutput.validCaseIssueCount === 0, 'source synthetic issue count mismatch')
assertFalse(
  parsed.sourceSynthetic.runnerOutput.acceptedForManifestInstanceCreationToday,
  'source synthetic manifest creation',
)
assertFalse(parsed.sourceSynthetic.runnerOutput.acceptedForMediaProcessingToday, 'source synthetic media')
assertFalse(parsed.sourceSynthetic.runnerOutput.acceptedForArtifactCreationToday, 'source synthetic artifact')
assertFalse(parsed.sourceSynthetic.runnerOutput.acceptedForWorkerDispatchToday, 'source synthetic dispatch')
assertFalse(parsed.sourceSynthetic.executionState.realMediaBytesUsedToday, 'source synthetic real media')

assert(parsed.sourceBoundary.sourceBoundary.workerNames.length === 2, 'source boundary worker count')
assert(parsed.sourceBoundary.sourceBoundary.jobTypes.length === 4, 'source boundary job type count')
assert(parsed.sourceBoundary.sourceBoundary.validatorFunctionPresent === true, 'source boundary validator missing')
assertFalse(parsed.sourceBoundary.executionState.sourceChangedToday, 'source boundary source changed')

for (const issue of [
  'missing_required_field',
  'invalid_worker_name',
  'invalid_job_type',
  'invalid_private_media_asset_id',
  'invalid_planned_private_artifact_id',
  'runtime_flag_must_remain_false',
]) {
  assert(parsed.sourceIssueCoverage.validatedIssueCodes.includes(issue), `source issue coverage missing ${issue}`)
  assert(parsed.issueReview.reviewedIssueCodes.includes(issue), `owner issue coverage missing ${issue}`)
}
assert(parsed.sourceIssueCoverage.validatedDisallowedFieldPolicy.signedUrlAbsentFromValidInput === true, 'source signed URL policy missing')
assertFalse(parsed.sourceIssueCoverage.executionState.createManifestToday, 'source issue create manifest')

assert(parsed.sourceRuntimeDefaults.runtimeDefaultsValidatedFalse.length === 11, 'source runtime default count mismatch')
assert(parsed.sourceRuntimeDefaults.runtimeDefaultsValidatedFalse.includes('workerExecutionEnabled'), 'source runtime worker missing')
assert(parsed.sourceRuntimeDefaults.runtimeDefaultsValidatedFalse.includes('sqlExecutionEnabled'), 'source runtime SQL missing')
assertFalse(parsed.sourceRuntimeDefaults.acceptedForToday.runtimeReadiness, 'source runtime readiness')
assertFalse(parsed.sourceRuntimeDefaults.acceptedForToday.realUserMediaBetaReadiness, 'source real media beta')

assert(parsed.sourceProhibitedScan.prohibitedRuntimeScan.scanPassed === true, 'source prohibited scan failed')
for (const [key, value] of Object.entries(parsed.sourceProhibitedScan.prohibitedRuntimeScan)) {
  if (key.endsWith('Detected')) assertFalse(value, `source prohibited scan ${key}`)
}

assert(
  parsed.sourceBlockers.remainingBlockersBeforeExternalAgentRealMediaExecution
    .privateManifestInstanceStaticValidationOwnerReview === 'required_next',
  'source blockers owner review next mismatch',
)
assert(parsed.sourceBlockers.executionApprovalsToday === 'none', 'source blockers execution approvals')
assert(parsed.sourcePolicy.allowedClaims.privateManifestInstanceStaticValidationOwnerReviewMayProceed === true, 'source policy owner review missing')
assertFalse(parsed.sourcePolicy.blockedClaims.manifestInstanceCreatedToday, 'source policy manifest creation')
assertFalse(parsed.sourcePolicy.blockedClaims.realUserMediaBetaReadyClaimed, 'source policy beta readiness')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 1994, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.acceptedForControlledManifestInstanceCreationPlanningOnly === true, 'result planning-only acceptance missing')
assert(parsed.result.ownerReview.controlledManifestInstanceCreationPlanningMayProceed === true, 'result next planning missing')
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
  assertFalse(parsed.result.ownerReview[key], `result ownerReview.${key}`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result ready count must be zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assert(parsed.result.supabaseClassification.nextAction === 'none', 'result Supabase next action')

assert(parsed.acceptance.acceptedEvidence.privateManifestInstanceStaticValidationPassed === true, 'acceptance static evidence')
assert(parsed.acceptance.acceptedEvidence.runtimeDefaultsFalseValidated === true, 'acceptance runtime defaults')
assert(parsed.acceptance.acceptedForPlanningOnly.controlledManifestInstanceCreationPlanningMayProceed === true, 'acceptance next planning')
assert(parsed.acceptance.acceptedForExecutionToday === 'none', 'acceptance execution approvals')
for (const [key, value] of Object.entries(parsed.acceptance.acceptedForPlanningOnly)) {
  if (key !== 'controlledManifestInstanceCreationPlanningMayProceed') assertFalse(value, `acceptance.${key}`)
}

assert(parsed.syntheticReview.reviewedRunnerOutput.ok === true, 'synthetic review ok')
assert(parsed.syntheticReview.reviewedRunnerOutput.validCaseIssueCount === 0, 'synthetic review issue count')
assertFalse(parsed.syntheticReview.reviewedRunnerOutput.acceptedForManifestInstanceCreationToday, 'synthetic review create')
assert(parsed.syntheticReview.ownerDecision.syntheticInMemoryValidationAccepted === true, 'synthetic review acceptance')
assertFalse(parsed.syntheticReview.ownerDecision.realMediaBytesUsedToday, 'synthetic review real media')

assert(parsed.boundaryReview.reviewedSourceBoundary.sourcePath === sourcePath, 'boundary review path')
assert(parsed.boundaryReview.reviewedSourceBoundary.workerNames.length === 2, 'boundary review worker count')
assert(parsed.boundaryReview.reviewedSourceBoundary.jobTypes.length === 4, 'boundary review job count')
assert(parsed.boundaryReview.ownerDecision.sourceBoundaryAcceptedForControlledPlanningOnly === true, 'boundary review acceptance')
assertFalse(parsed.boundaryReview.ownerDecision.workerDispatchedToday, 'boundary review dispatch')

assert(parsed.issueReview.reviewedDisallowedFieldPolicy.serviceRolePayloadAbsentFromValidInput === true, 'issue review service-role policy')
assert(parsed.issueReview.ownerDecision.issueCoverageAccepted === true, 'issue review acceptance')
assertFalse(parsed.issueReview.ownerDecision.createManifestToday, 'issue review create')

assert(parsed.runtimeReview.reviewedRuntimeDefaultsValidatedFalse.length === 11, 'runtime review default count')
assert(parsed.runtimeReview.ownerDecision.runtimeDefaultsAcceptedForControlledPlanningOnly === true, 'runtime review acceptance')
assertAllFalse(parsed.runtimeReview.acceptedForToday, 'runtimeReview.acceptedForToday')
assertFalse(parsed.runtimeReview.ownerDecision.runtimeReadinessClaimed, 'runtime review runtime readiness')

assert(
  parsed.blockers.resolvedForThisGate.includes('privateManifestInstanceStaticValidationOwnerReviewPassed'),
  'blockers owner review resolution',
)
assert(
  parsed.blockers.remainingBlockersBeforeExternalAgentRealMediaExecution.controlledManifestInstanceCreationPlanning ===
    'required_next',
  'blockers next planning mismatch',
)
assert(parsed.blockers.executionApprovalsToday === 'none', 'blockers execution approvals')
assert(parsed.policy.allowedClaims.privateManifestInstanceStaticValidationOwnerReviewPassed === true, 'policy owner review claim')
assert(parsed.policy.allowedClaims.controlledManifestInstanceCreationPlanningMayProceed === true, 'policy next planning claim')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tool count')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assert(parsed.policy.executionApprovalsToday === 'none', 'policy execution approvals')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase91_caption_render_runtime_hook_controlled_manifest_instance_creation_planning_completed_with_warnings_ready_for_controlled_manifest_instance_creation_owner_review_no_execution',
  'next prompt expected decision mismatch',
)
assert(parsed.next.planningScope.planControlledManifestInstanceCreation === true, 'next prompt planning missing')
assert(parsed.next.planningScope.preserveWorkerNames.length === 2, 'next prompt worker count')
assert(parsed.next.planningScope.preserveJobTypes.length === 4, 'next prompt job count')
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
  assertFalse(parsed.next.planningScope[key], `next planningScope.${key}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      reviewedSourcePr: parsed.result.sourceVerification.sourcePr,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      controlledManifestInstanceCreationPlanningMayProceed:
        parsed.result.ownerReview.controlledManifestInstanceCreationPlanningMayProceed,
      executionApprovalsToday: parsed.policy.executionApprovalsToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
