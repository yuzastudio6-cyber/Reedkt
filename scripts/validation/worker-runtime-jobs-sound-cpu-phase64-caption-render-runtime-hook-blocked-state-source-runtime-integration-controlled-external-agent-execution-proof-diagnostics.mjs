import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase64_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_external_agent_execution_proof_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_no_media_no_artifacts'
const sourceHead = 'd40b7daa0668a8f66a208108de8a650b84f86db3'
const sourceMergeCommit = 'ea21bf611e56a31fe1f9bea0cfec1028d3b683e8'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const proofRunner =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-runner.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE64-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-EXTERNAL-AGENT-EXECUTION-PROOF-OWNER-REVIEW'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase64_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_real_media_artifact_readiness_plan_no_media_no_artifacts'
const proofScript =
  'worker-runtime-jobs:sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof:proof'
const diagnosticsScript =
  'worker-runtime-jobs:sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-result.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-proof-output-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-proof-output-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-metadata-result-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-metadata-result-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-no-artifact-worker-supabase-verification-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-no-artifact-worker-supabase-verification-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-tool-coverage-proof-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-tool-coverage-proof-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof-owner-review',
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
  try {
    return JSON.parse(match[1])
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`)
  }
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
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-result',
)
const output = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-proof-output-register',
)
const blockedMetadata = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-metadata-result-register',
)
const noArtifactVerification = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-no-artifact-worker-supabase-verification-register',
)
const toolCoverage = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-tool-coverage-proof-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-claim-policy',
)
const ownerRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof-owner-review',
)

assert(result.decision === expectedDecision, 'Phase 64 decision mismatch')
assert(result.sourceVerification.sourcePr === 1877, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.proofResult.proofKind === 'controlled_synthetic_external_agent_boundary', 'Proof kind mismatch')
assert(result.proofResult.hookName === 'ocrCaptionRenderSafeZonePlanningHook', 'Hook name mismatch')
assert(result.proofResult.blockedStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(result.proofResult.sourceStatus === 'source_created_execution_blocked', 'Source status mismatch')
assert(result.proofResult.ownerGateRequired === 'WORKER_RUNTIME_JOBS', 'Owner gate mismatch')
assertTrue(result.proofResult.manualCaptionLayoutReviewRequired, 'Manual review flag missing')
assert(result.proofResult.candidateZoneCount === 3, 'Candidate zone count mismatch')
assert(result.proofResult.ocrRegionCount === 2, 'OCR region count mismatch')
assert(result.proofResult.blockedCandidateZoneCount === 2, 'Blocked candidate count mismatch')
assert(result.proofResult.saferCandidateZoneCount === 1, 'Safer candidate count mismatch')
assert(result.proofResult.soundCpuToolCountCovered === 15, 'Tool count mismatch')
for (const key of [
  'realMediaUsed',
  'artifactCreated',
  'workerDispatched',
  'routeToolProviderCalled',
  'supabaseSqlTouched',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assertFalse(result.proofResult[key], `result.proofResult.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(output.decision === expectedDecision, 'Output decision mismatch')
assert(output.proofCommand === `npm run ${proofScript}`, 'Proof command mismatch')
assert(output.sanitizedProofOutput.status === 'passed', 'Proof status mismatch')
assert(output.sanitizedProofOutput.candidateZoneCount === 3, 'Output candidate count mismatch')
assert(output.sanitizedProofOutput.ocrRegionCount === 2, 'Output OCR count mismatch')
assert(output.sanitizedProofOutput.hashedOcrRegionIdCount === 2, 'Output hash count mismatch')
assert(output.sanitizedProofOutput.lowerThirdCollisionFlagCount === 1, 'Output lower-third count mismatch')
assert(output.sanitizedProofOutput.manualReviewRequiredFlagCount === 1, 'Output review flag count mismatch')
assert(output.sanitizedProofOutput.blockedCandidateZoneCount === 2, 'Output blocked count mismatch')
assert(output.sanitizedProofOutput.saferCandidateZoneCount === 1, 'Output safer count mismatch')
assertFalse(output.tempProofArtifactsCreated, 'Temporary proof artifacts must be false')
assertFalse(output.proofOutputWrittenToDisk, 'Proof output written-to-disk must be false')

assert(blockedMetadata.decision === expectedDecision, 'Blocked metadata decision mismatch')
assert(blockedMetadata.blockedResult.blockedStatus === 'blocked_by_owner_gate', 'Blocked metadata status mismatch')
assertTrue(blockedMetadata.blockedResult.blockedReasonPresent, 'Blocked reason flag missing')
assert(blockedMetadata.blockedResult.ownerGateRequired === 'WORKER_RUNTIME_JOBS', 'Blocked metadata owner mismatch')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
]) {
  assertFalse(blockedMetadata.blockedResult[key], `blockedMetadata.blockedResult.${key}`)
}
assertTrue(blockedMetadata.blockedResult.noArtifactCreated, 'No artifact created flag missing')
for (const [key, value] of Object.entries(blockedMetadata.runtimeDisabledFlags)) {
  assert(value === '0', `${key} must remain 0`)
}

assertAllFalse(noArtifactVerification.verifiedFalse, 'noArtifactVerification.verifiedFalse')
assert(noArtifactVerification.verificationMethod === 'controlled proof output plus changed-file safety scan', 'Verification method mismatch')

assert(toolCoverage.soundCpuToolSet.directPinnedPackages.length === 13, 'Direct pinned tool count mismatch')
assert(toolCoverage.soundCpuToolSet.aliasCoveredTools.length === 2, 'Alias-covered tool count mismatch')
assert(toolCoverage.soundCpuToolSet.totalToolsInLane === 15, 'Total tool count mismatch')
assertTrue(toolCoverage.soundCpuToolSet.packageImportProofComplete, 'Package proof missing')
assertTrue(toolCoverage.soundCpuToolSet.dockerBuildProofComplete, 'Docker proof missing')
assertTrue(toolCoverage.soundCpuToolSet.externalAgentExecutionPlanComplete, 'Execution plan missing')
assertTrue(toolCoverage.soundCpuToolSet.controlledSyntheticExternalAgentProofPassed, 'Controlled proof missing')
assert(toolCoverage.soundCpuToolSet.readyForRealExecutionToday === 0, 'Ready for real execution must remain zero')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase64_controlled_external_agent_execution_proof_pending',
  ),
  'Phase 64 proof blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase64_controlled_external_agent_execution_proof_owner_review_pending',
  ),
  'Phase 64 owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_media_artifact_readiness_plan_pending'),
  'Real media artifact readiness blocker missing',
)

assertTrue(claims.allowedClaims.phase64ControlledSyntheticExternalAgentProofPassed, 'Phase 64 proof claim missing')
assertTrue(claims.allowedClaims.blockedMetadataResultReturned, 'Blocked metadata claim missing')
assertTrue(claims.allowedClaims.noArtifactCreated, 'No artifact claim missing')
assertTrue(claims.allowedClaims.noWorkerDispatch, 'No worker claim missing')
assertTrue(claims.allowedClaims.noSupabaseSql, 'No Supabase claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerRegister.sourceDecision === expectedDecision, 'Owner register source decision mismatch')
assertTrue(ownerRegister.ownerReviewMayProceed, 'Owner review may proceed missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewControlledSyntheticProof, 'Owner review proof scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewBlockedMetadataResult, 'Owner review metadata scope missing')
assertTrue(
  ownerRegister.ownerReviewAllowedScope.reviewNoArtifactWorkerSupabaseVerification,
  'Owner review verification scope missing',
)
assertTrue(ownerRegister.ownerReviewAllowedScope.considerRealMediaArtifactReadinessPlan, 'Owner review next planning scope missing')
for (const key of [
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(ownerRegister.ownerReviewAllowedScope[key], `ownerRegister.ownerReviewAllowedScope.${key}`)
}
assertTrue(ownerRegister.stillBlocked.realMediaExecution, 'Real media blocker missing')
assert(ownerRegister.nextPrompt === nextPrompt, 'Owner register next prompt mismatch')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.hookSource === hookSource, 'Owner prompt hook source mismatch')
assertTrue(ownerPrompt.reviewScope.reviewControlledSyntheticProof, 'Owner prompt proof scope missing')
assertTrue(ownerPrompt.reviewScope.reviewBlockedMetadataResult, 'Owner prompt metadata scope missing')
assertTrue(ownerPrompt.reviewScope.reviewNoArtifactWorkerSupabaseVerification, 'Owner prompt verification scope missing')
assert(ownerPrompt.reviewScope.reviewSoundCpuToolCount === 15, 'Owner prompt tool count mismatch')
assertTrue(ownerPrompt.reviewScope.considerRealMediaArtifactReadinessPlan, 'Owner prompt next planning scope missing')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(ownerPrompt.reviewScope[key], `ownerPrompt.reviewScope.${key}`)
}
assert(ownerPrompt.expectedDecision === ownerReviewDecision, 'Owner prompt expected decision mismatch')
assertNoop(ownerPrompt.supabaseClassification, 'ownerPrompt')

const runnerText = readText(proofRunner)
assert(runnerText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'Proof runner must invoke hook factory')
assert(runnerText.includes('controlled_synthetic_external_agent_boundary'), 'Proof runner proof kind missing')
assert(!/fs\.|writeFile|appendFile|audio_open|ffmpeg|ffprobe|createSignedUrl|createClient\(|\.insert\(|\.update\(|\.delete\(/i.test(runnerText), 'Proof runner contains prohibited side-effect marker')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[proofScript] ===
    'tsx scripts/validation/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-runner.ts',
  'Proof package script missing',
)
assert(
  packageJson.scripts?.[diagnosticsScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof-diagnostics.mjs',
  'Diagnostics package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1877,
      sourceHead,
      sourceMergeCommit,
      totalToolsInLane: 15,
      controlledSyntheticExternalAgentProofPassed: true,
      readyForRealExecutionToday: 0,
      realMediaUsed: false,
      artifactCreated: false,
      workerDispatched: false,
      routeToolProviderCalled: false,
      supabaseSql: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
