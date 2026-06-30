import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase62_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_boundary_validation_owner_review_passed_with_warnings_ready_for_external_agent_execution_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase62_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_boundary_validation_passed_with_warnings_ready_for_controlled_boundary_validation_owner_review_no_media_no_artifacts'
const sourceHead = '9ff5610ddf70df0131e275b9fea2480058ac09cd'
const sourceMergeCommit = 'bfb3c0f8a21527aa5ce9fea88ed351fdb8773939'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE63-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-EXTERNAL-AGENT-EXECUTION-PLAN'
const phase63Decision =
  'worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_plan_owner_review_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-external-agent-execution-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-external-agent-execution-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-controlled-boundary-validation-owner-claim-policy',
)
const externalPlan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-external-agent-execution-plan-register',
)
const phase63Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1870, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedBoundaryValidation.acceptedSyntheticInputsValidated, 'Accepted synthetic validation missing')
assertTrue(review.reviewedBoundaryValidation.rejectedRealMediaInputsValidated, 'Rejected real media validation missing')
assertTrue(review.reviewedBoundaryValidation.artifactBoundaryClosedValidated, 'Artifact boundary validation missing')
assertTrue(review.reviewedBoundaryValidation.noWorkerDispatchValidated, 'No worker dispatch validation missing')
assertTrue(review.reviewedBoundaryValidation.noSupabaseSqlValidated, 'No Supabase SQL validation missing')
assert(review.reviewedBoundaryValidation.hookSource === hookSource, 'Hook source mismatch')
assertTrue(review.reviewedBoundaryValidation.externalAgentExecutionPlanMayProceed, 'External-agent plan may proceed missing')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(review.reviewedBoundaryValidation[key], `review.reviewedBoundaryValidation.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase62Pr === 1870, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase62Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase62MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase62Decision === sourceDecision, 'Acceptance source decision mismatch')
for (const key of [
  'acceptedSyntheticInputsValidated',
  'rejectedRealMediaInputsValidated',
  'artifactBoundaryClosedValidated',
  'noWorkerDispatchValidated',
  'noSupabaseSqlValidated',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assertTrue(acceptance.acceptedScope.externalAgentExecutionPlanning, 'External-agent planning scope missing')
assertTrue(acceptance.acceptedScope.futureSyntheticNoArtifactExecutionPlan, 'Future no-artifact plan scope missing')
for (const key of [
  'realMediaProcessing',
  'artifactCreation',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.reviewSafety.allowedNextStep === 'external agent execution plan', 'Safety next step mismatch')
assertTrue(safety.reviewSafety.externalAgentExecutionPlanMustRemainSyntheticOnly, 'Synthetic-only safety missing')
assertTrue(safety.reviewSafety.externalAgentExecutionPlanMustCreateNoArtifacts, 'No-artifact safety missing')
for (const key of [
  'runtimeExecutionAllowedToday',
  'realMediaInputAllowedToday',
  'artifactWriteAllowedToday',
  'workerDispatchAllowedToday',
  'routeToolProviderAllowedToday',
  'supabaseSqlAllowedToday',
  'betaUnlockAllowedToday',
  'productionUnlockAllowedToday',
]) {
  assertFalse(safety.reviewSafety[key], `safety.reviewSafety.${key}`)
}
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase62_controlled_boundary_validation_owner_review_pending',
  ),
  'Owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase63_external_agent_execution_plan_pending'),
  'Phase 63 planning blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claims.allowedClaims.phase62OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.controlledBoundaryValidationAccepted, 'Boundary validation acceptance claim missing')
assertTrue(claims.allowedClaims.externalAgentExecutionPlanMayProceed, 'External-agent plan claim missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(externalPlan.sourceDecision === expectedDecision, 'External plan source decision mismatch')
assertTrue(externalPlan.externalAgentExecutionPlanMayProceed, 'External plan may proceed missing')
assert(externalPlan.soundCpuToolSet.directPinnedPackages.length === 13, 'Direct pinned package count mismatch')
assert(externalPlan.soundCpuToolSet.aliasCoveredTools.length === 2, 'Alias-covered tool count mismatch')
assert(externalPlan.soundCpuToolSet.totalToolsInLane === 15, 'Total tool count mismatch')
assert(externalPlan.soundCpuToolSet.readyForExecutionToday === 0, 'Ready-for-execution count must remain zero')
assertTrue(externalPlan.phase63AllowedScope.planExternalAgentExecution, 'Phase 63 planning scope missing')
assertTrue(externalPlan.phase63AllowedScope.mapSyntheticInputs, 'Phase 63 synthetic scope missing')
assertTrue(externalPlan.phase63AllowedScope.mapAgentCallBoundaries, 'Phase 63 call-boundary scope missing')
assertTrue(externalPlan.phase63AllowedScope.mapNoArtifactOutputs, 'Phase 63 no-artifact scope missing')
for (const key of [
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(externalPlan.phase63AllowedScope[key], `externalPlan.phase63AllowedScope.${key}`)
}
assert(externalPlan.nextPrompt === nextPrompt, 'External plan next prompt mismatch')

assert(phase63Prompt.requiredSourceDecision === expectedDecision, 'Phase 63 prompt source decision mismatch')
assert(phase63Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 63 source head mismatch')
assert(phase63Prompt.hookSource === hookSource, 'Phase 63 hook source mismatch')
assertTrue(phase63Prompt.planScope.planExternalAgentExecution, 'Phase 63 prompt planning scope missing')
assert(phase63Prompt.planScope.coverSoundCpuToolCount === 15, 'Phase 63 prompt tool count mismatch')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase63Prompt.planScope[key], `phase63Prompt.planScope.${key}`)
}
assert(phase63Prompt.expectedDecision === phase63Decision, 'Phase 63 expected decision mismatch')
assertNoop(phase63Prompt.supabaseClassification, 'phase63Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-owner-review-diagnostics.mjs',
  'Package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1870,
      sourceHead,
      sourceMergeCommit,
      totalToolsInLane: 15,
      readyForExecutionToday: 0,
      externalAgentExecutionPlanMayProceed: true,
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
