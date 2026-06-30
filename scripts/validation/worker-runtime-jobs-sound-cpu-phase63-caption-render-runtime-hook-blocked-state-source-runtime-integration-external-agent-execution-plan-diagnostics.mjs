import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_plan_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase62_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_boundary_validation_owner_review_passed_with_warnings_ready_for_external_agent_execution_plan_no_media_no_artifacts'
const sourceHead = '2ce1859b92f23689873274caa7078f12df81db61'
const sourceMergeCommit = '20c51f3779e4b67ab7b6b8d25139c4afd6bb3cc3'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE63-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-EXTERNAL-AGENT-EXECUTION-PLAN-OWNER-REVIEW'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-agent-call-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-agent-call-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-synthetic-input-map-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-synthetic-input-map-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-no-artifact-output-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-no-artifact-output-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-tool-coverage-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-tool-coverage-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-result',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-agent-call-boundary-register',
)
const syntheticInputs = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-synthetic-input-map-register',
)
const noArtifact = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-no-artifact-output-register',
)
const toolCoverage = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-tool-coverage-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-claim-policy',
)
const ownerRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan-owner-review',
)

assert(result.decision === expectedDecision, 'Phase 63 decision mismatch')
assert(result.sourceVerification.sourcePr === 1872, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.executionPlan.hookSource === hookSource, 'Hook source mismatch')
assertTrue(result.executionPlan.externalAgentBoundaryPlanned, 'External-agent boundary plan missing')
assertTrue(result.executionPlan.syntheticInputsMapped, 'Synthetic inputs missing')
assertTrue(result.executionPlan.agentCallBoundariesMapped, 'Agent call boundary missing')
assertTrue(result.executionPlan.noArtifactOutputsMapped, 'No-artifact output missing')
assert(result.executionPlan.soundCpuToolCountCovered === 15, 'Tool count coverage mismatch')
for (const key of [
  'realMediaUsed',
  'artifactCreated',
  'workerDispatched',
  'routeToolProviderCalled',
  'supabaseSqlTouched',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assertFalse(result.executionPlan[key], `result.executionPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(boundary.decision === expectedDecision, 'Boundary decision mismatch')
assert(boundary.plannedAgentCallContract.hookSource === hookSource, 'Boundary hook source mismatch')
for (const key of [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
]) {
  assert(boundary.plannedAgentCallContract[key] === 'required_future_static_field', `Boundary ${key} mismatch`)
}
assert(boundary.plannedAgentCallContract.inputBundleKind === 'synthetic_no_media_no_artifact_caption_boundary_bundle', 'Input bundle kind mismatch')
assert(boundary.plannedAgentCallContract.outputKind === 'blocked_result_metadata_only', 'Output kind mismatch')
for (const key of ['artifactWriteTarget', 'signedUrlInput', 'serviceRolePayload']) {
  assert(boundary.plannedAgentCallContract[key] === 'forbidden', `Boundary ${key} must be forbidden`)
}
assertAllFalse(boundary.runtimeFlagsMustRemainFalse, 'boundary.runtimeFlagsMustRemainFalse')
assertAllFalse(boundary.executionToday, 'boundary.executionToday')

for (const key of [
  'syntheticCaptionBoxes',
  'syntheticSafeZoneBounds',
  'syntheticFrameDimensions',
  'syntheticToolInvocationMetadata',
  'syntheticNoArtifactManifest',
]) {
  assertTrue(syntheticInputs.acceptedSyntheticInputs[key], `syntheticInputs.${key}`)
}
for (const rejected of [
  'rawFrames',
  'rawOcrTextFromControlledMedia',
  'mediaFilePathsForExecution',
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloads',
  'providerOutputBlobs',
  'artifactWriteTargets',
  'modelWeightLocations',
  'secretPayloads',
]) {
  assert(syntheticInputs.rejectedInputs.includes(rejected), `Rejected input missing: ${rejected}`)
}
assertAllFalse(syntheticInputs.inputPolicy, 'syntheticInputs.inputPolicy')

assertTrue(noArtifact.plannedOutput.blockedResultMetadataOnly, 'Blocked result metadata-only output missing')
assert(noArtifact.plannedOutput.status === 'blocked_by_owner_gate', 'Output status mismatch')
assertFalse(noArtifact.plannedOutput.artifactCreationApproved, 'Artifact creation must be false')
assertTrue(noArtifact.plannedOutput.noArtifactCreated, 'No-artifact flag missing')
assertTrue(noArtifact.plannedOutput.safeZoneSummaryAllowed, 'Safe-zone summary allowance missing')
assertTrue(noArtifact.plannedOutput.diagnosticCountersAllowed, 'Diagnostic counters allowance missing')
assertAllFalse(noArtifact.forbiddenOutputs, 'noArtifact.forbiddenOutputs')

assert(toolCoverage.soundCpuToolSet.directPinnedPackages.length === 13, 'Direct pinned tool count mismatch')
assert(toolCoverage.soundCpuToolSet.aliasCoveredTools.length === 2, 'Alias-covered tool count mismatch')
assert(toolCoverage.soundCpuToolSet.totalToolsInLane === 15, 'Total tool count mismatch')
assertTrue(toolCoverage.soundCpuToolSet.packageImportProofComplete, 'Package import proof missing')
assertTrue(toolCoverage.soundCpuToolSet.dockerBuildProofComplete, 'Docker build proof missing')
assertTrue(toolCoverage.soundCpuToolSet.externalAgentExecutionPlanComplete, 'External-agent plan completion missing')
assert(toolCoverage.soundCpuToolSet.readyForExecutionToday === 0, 'Ready for execution must remain zero')
assertTrue(toolCoverage.executionReadinessPolicy.mayPlanControlledSyntheticProof, 'Controlled proof planning missing')
for (const key of [
  'mayExecuteExternalAgentToday',
  'mayUseRealMediaToday',
  'mayCreateArtifactsToday',
  'mayUnlockRealUserMediaBetaToday',
]) {
  assertFalse(toolCoverage.executionReadinessPolicy[key], `toolCoverage.executionReadinessPolicy.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase63_external_agent_execution_plan_pending'),
  'Phase 63 plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase63_external_agent_execution_plan_owner_review_pending'),
  'Phase 63 owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'controlled_external_agent_execution_proof_pending'),
  'Controlled proof blocker missing',
)

assertTrue(claims.allowedClaims.phase63ExternalAgentExecutionPlanComplete, 'Phase 63 plan claim missing')
assertTrue(claims.allowedClaims.syntheticInputMapPlanned, 'Synthetic input claim missing')
assertTrue(claims.allowedClaims.agentCallBoundaryPlanned, 'Agent boundary claim missing')
assertTrue(claims.allowedClaims.noArtifactOutputPlanned, 'No-artifact output claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerRegister.sourceDecision === expectedDecision, 'Owner register source decision mismatch')
assertTrue(ownerRegister.ownerReviewMayProceed, 'Owner review may proceed missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewSyntheticInputMap, 'Owner review synthetic map scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewAgentCallBoundary, 'Owner review agent boundary scope missing')
assertTrue(ownerRegister.ownerReviewAllowedScope.reviewNoArtifactOutputPlan, 'Owner review no-artifact scope missing')
assertTrue(
  ownerRegister.ownerReviewAllowedScope.considerControlledExternalAgentExecutionProof,
  'Owner review controlled proof scope missing',
)
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
assertTrue(ownerRegister.stillBlocked.controlledExternalAgentExecutionProof, 'Controlled proof blocker missing')
assert(ownerRegister.nextPrompt === nextPrompt, 'Owner register next prompt mismatch')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.hookSource === hookSource, 'Owner prompt hook source mismatch')
assertTrue(ownerPrompt.reviewScope.reviewSyntheticInputMap, 'Owner prompt synthetic map scope missing')
assertTrue(ownerPrompt.reviewScope.reviewAgentCallBoundary, 'Owner prompt agent boundary scope missing')
assertTrue(ownerPrompt.reviewScope.reviewNoArtifactOutputPlan, 'Owner prompt no-artifact scope missing')
assert(ownerPrompt.reviewScope.reviewSoundCpuToolCount === 15, 'Owner prompt tool count mismatch')
assertTrue(ownerPrompt.reviewScope.considerControlledExternalAgentExecutionProof, 'Owner prompt proof scope missing')
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

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan-diagnostics.mjs',
  'Package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1872,
      sourceHead,
      sourceMergeCommit,
      totalToolsInLane: 15,
      readyForExecutionToday: 0,
      externalAgentExecutionPlanComplete: true,
      controlledProofStillPending: true,
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
