import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase52_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_completed_with_warnings_ready_for_precondition_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase51_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_owner_review_passed_with_warnings_ready_for_runtime_integration_precondition_plan_no_media_no_artifacts'
const phase51PlanDecision =
  'worker_runtime_jobs_sound_cpu_phase51_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_plan_completed_with_warnings_ready_for_closure_owner_review_no_media_no_artifacts'
const phase50OwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase50_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_source_integration_readiness_closure_plan_no_media_no_artifacts'
const sourceHead = '879a1ffea906ec25176262a8bcdf5fb5b1fda981'
const sourceMergeCommit = '7d4f68bd329ab12b201442d9443d54f02d277ee0'
const phase51MergeCommit = '5be5533395267eae4ef377bc6608c06ea0e4a35c'
const phase50MergeCommit = 'e01d0deba5c861646989907b0b750c44310cdd25'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE52-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-PRECONDITION-PLAN-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-source-register.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-source-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-checklist.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-checklist',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review',
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

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-result',
)
const sourceRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-source-register',
)
const checklist = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-checklist',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 52 decision mismatch')
assert(plan.sourceVerification.sourcePr === 1811, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(plan.preconditionPlanResult.phase51OwnerReviewAccepted, 'Phase 51 owner review not accepted')
assertTrue(plan.preconditionPlanResult.runtimeIntegrationPreconditionsPlanned, 'Preconditions not planned')
assert(plan.preconditionPlanResult.preconditionCount === 8, 'Precondition count mismatch')
assertTrue(plan.preconditionPlanResult.blockedStateSourceAlreadyExported, 'Blocked-state export not represented')
assertTrue(plan.preconditionPlanResult.runtimeIntegrationBlockedSourceAlreadyExported, 'Runtime integration export not represented')
for (const key of [
  'allExecutionPreconditionsSatisfiedToday',
  'runtimeIntegrationApprovedToday',
  'hookExecutionApprovedToday',
  'realMediaApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(plan.preconditionPlanResult[key], `plan.preconditionPlanResult.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(plan.supabaseClassification, 'plan')

assert(sourceRegister.decision === expectedDecision, 'Source register decision mismatch')
assert(
  sourceRegister.acceptedSources.some(
    (source) =>
      source.sourceId === 'phase51_closure_owner_review' &&
      source.sourcePr === 1811 &&
      source.mergeCommit === sourceMergeCommit &&
      source.decision === sourceDecision,
  ),
  'Phase 51 owner-review source missing',
)
assert(
  sourceRegister.acceptedSources.some(
    (source) =>
      source.sourceId === 'phase51_closure_plan' &&
      source.sourcePr === 1809 &&
      source.mergeCommit === phase51MergeCommit &&
      source.decision === phase51PlanDecision,
  ),
  'Phase 51 closure-plan source missing',
)
assert(
  sourceRegister.acceptedSources.some(
    (source) =>
      source.sourceId === 'phase50_source_integration_readiness_owner_review' &&
      source.sourcePr === 1806 &&
      source.mergeCommit === phase50MergeCommit &&
      source.decision === phase50OwnerDecision,
  ),
  'Phase 50 owner-review source missing',
)
assert(sourceRegister.sourceFilesReviewed.integrationTarget === indexPath, 'Source register target mismatch')
assert(
  sourceRegister.sourceFilesReviewed.blockedStateIntegrationSourcePath === blockedSourcePath,
  'Source register blocked-state path mismatch',
)
assert(
  sourceRegister.sourceFilesReviewed.runtimeIntegrationSourcePath === runtimeIntegrationPath,
  'Source register runtime-integration path mismatch',
)
assert(sourceRegister.sourceFilesReviewed.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assertTrue(sourceRegister.sourceUseLimits.preconditionPlanningOnly, 'Precondition-only source limit missing')
for (const key of [
  'runtimeExecutionAuthorization',
  'mediaInputAuthorization',
  'artifactOutputAuthorization',
  'workerDispatchAuthorization',
  'routeToolProviderAuthorization',
  'supabaseSqlAuthorization',
  'betaProductionAuthorization',
]) {
  assertFalse(sourceRegister.sourceUseLimits[key], `sourceRegister.sourceUseLimits.${key}`)
}

assert(checklist.runtimeIntegrationPreconditions.length === 8, 'Checklist precondition count mismatch')
for (const row of checklist.runtimeIntegrationPreconditions) {
  assertTrue(row.required, `${row.precondition} must be required`)
  assertFalse(row.satisfiedToday, `${row.precondition} must be unsatisfied today`)
  assert(typeof row.owner === 'string' && row.owner.length > 0, `${row.precondition} owner missing`)
}
assertTrue(checklist.approvalStateToday.runtimeIntegrationPreconditionsPlanned, 'Preconditions planned flag missing')
assert(checklist.approvalStateToday.preconditionCount === 8, 'Approval precondition count mismatch')
for (const key of [
  'allPreconditionsSatisfiedToday',
  'runtimeIntegrationAllowedToday',
  'realMediaAllowedToday',
  'artifactCreationAllowedToday',
  'workerDispatchAllowedToday',
  'supabaseSqlAllowedToday',
  'betaProductionAllowedToday',
]) {
  assertFalse(checklist.approvalStateToday[key], `checklist.approvalStateToday.${key}`)
}

assertTrue(boundary.allowedThisGate.docsDiagnosticsOnly, 'Docs-only boundary missing')
assertTrue(boundary.allowedThisGate.preconditionPlanning, 'Precondition planning boundary missing')
assertTrue(boundary.allowedThisGate.staticBoundaryInspection, 'Static inspection boundary missing')
for (const [key, value] of Object.entries(boundary.blockedThisGate)) {
  assertTrue(value, `Blocked gate must remain true: ${key}`)
}
assertTrue(boundary.runtimeSourceStateToday.blockedStateSourceExists, 'Blocked-state source state missing')
assertTrue(boundary.runtimeSourceStateToday.runtimeIntegrationBlockedSourceExists, 'Runtime integration source state missing')
assertTrue(boundary.runtimeSourceStateToday.indexExportsBlockedStateSource, 'Blocked-state export state missing')
assertTrue(boundary.runtimeSourceStateToday.indexExportsRuntimeIntegrationBlockedSource, 'Runtime integration export state missing')
assertTrue(boundary.runtimeSourceStateToday.blockedStatusRemainsBlockedByOwnerGate, 'Blocked status state missing')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'supabaseSqlApproved',
  'routeToolProviderApproved',
  'realUserMediaBetaApproved',
  'paidProductionApproved',
]) {
  assertFalse(boundary.runtimeSourceStateToday[key], `boundary.runtimeSourceStateToday.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase52_runtime_integration_precondition_plan_pending'),
  'Phase 52 precondition-plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase52_runtime_integration_precondition_owner_review_pending',
  ),
  'Phase 52 owner-review blocker missing',
)
assertFalse(blockers.betaProductionStatus.realUserMediaBetaAllowed, 'blockers.realUserMediaBetaAllowed')
assertFalse(blockers.betaProductionStatus.paidProductionAllowed, 'blockers.paidProductionAllowed')

assertTrue(claimPolicy.allowedClaims.phase52PreconditionPlanCreated, 'Precondition plan claim missing')
assertTrue(claimPolicy.allowedClaims.runtimeIntegrationPreconditionsPlanned, 'Preconditions planned claim missing')
assertTrue(claimPolicy.allowedClaims.phase51OwnerReviewConsumed, 'Phase 51 source claim missing')
assertTrue(claimPolicy.allowedClaims.preconditionOwnerReviewMayProceed, 'Owner-review next claim missing')
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'artifactReadiness',
  'sourceIntegrationReadinessUnlock',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(claimPolicy.forbiddenClaims[key], `claimPolicy.forbiddenClaims.${key}`)
}
for (const key of [
  'dockerBuild',
  'dockerRun',
  'dockerPush',
  'gcpCloudRun',
  'workerDispatch',
  'routeExecution',
  'toolExecution',
  'providerModelCall',
  'mediaProcessing',
  'artifactCreation',
  'supabaseSql',
]) {
  assertFalse(claimPolicy.executionClaims[key], `claimPolicy.executionClaims.${key}`)
}

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.integrationTarget === indexPath, 'Owner prompt target mismatch')
assert(ownerPrompt.blockedStateIntegrationSourcePath === blockedSourcePath, 'Owner prompt blocked-state path mismatch')
assert(ownerPrompt.runtimeIntegrationSourcePath === runtimeIntegrationPath, 'Owner prompt runtime path mismatch')
assertTrue(ownerPrompt.reviewFocus.phase51OwnerReviewConsumed, 'Owner prompt source focus missing')
assert(ownerPrompt.reviewFocus.preconditionCountAccepted === 8, 'Owner prompt precondition count mismatch')
assertTrue(ownerPrompt.reviewFocus.blockedStateSourceAlreadyExported, 'Owner prompt blocked-state export missing')
assertTrue(ownerPrompt.reviewFocus.runtimeIntegrationBlockedSourceAlreadyExported, 'Owner prompt runtime export missing')
assertFalse(ownerPrompt.reviewFocus.allExecutionPreconditionsSatisfiedToday, 'Owner prompt all preconditions widened')
assertTrue(ownerPrompt.reviewFocus.blockedStateSourceStillFailClosed, 'Owner prompt blocked-state fail-closed focus missing')
assertTrue(ownerPrompt.reviewFocus.runtimeIntegrationSourceStillFailClosed, 'Owner prompt runtime fail-closed focus missing')
assertTrue(ownerPrompt.reviewFocus.temporaryProofFileAbsent, 'Owner prompt temp absence missing')
for (const key of [
  'runtimeIntegrationAllowedToday',
  'sourceCodeChangeAllowedToday',
  'realMediaAllowed',
  'artifactCreationAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(ownerPrompt.reviewFocus[key], `ownerPrompt.reviewFocus.${key}`)
}
assertNoop(ownerPrompt.supabaseClassification, 'owner prompt')

const phase51OwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-result',
)
assert(phase51OwnerReview.decision === sourceDecision, 'Phase 51 owner-review source decision missing')
assertTrue(
  phase51OwnerReview.reviewedClosure.runtimeIntegrationPreconditionPlanningMayProceed,
  'Phase 51 source did not allow precondition planning',
)

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked-state status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Blocked-state runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Blocked-state worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Blocked-state media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Blocked-state artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Blocked-state Supabase SQL false missing')
assert(
  blockedSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Blocked-state assertion missing',
)
const runtimeSource = readText(runtimeIntegrationPath)
assert(
  runtimeSource.includes("blockedStatus: 'blocked_by_owner_gate'"),
  'Runtime integration blocked status source missing',
)
assert(runtimeSource.includes('runtimeExecutionApproved: false'), 'Runtime integration runtime execution false missing')
assert(runtimeSource.includes('workerExecutionApproved: false'), 'Runtime integration worker execution false missing')
assert(runtimeSource.includes('mediaProcessingApproved: false'), 'Runtime integration media processing false missing')
assert(runtimeSource.includes('artifactCreationApproved: false'), 'Runtime integration artifact false missing')
assert(runtimeSource.includes('supabaseSqlApproved: false'), 'Runtime integration Supabase SQL false missing')
assert(runtimeSource.includes('routeToolProviderApproved: false'), 'Runtime integration route/tool/provider false missing')
assert(runtimeSource.includes('realUserMediaBetaApproved: false'), 'Runtime integration beta false missing')
assert(runtimeSource.includes('paidProductionApproved: false'), 'Runtime integration production false missing')
assert(
  runtimeSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'),
  'Runtime integration assertion missing',
)
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index blocked-state factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index blocked-state assertion export missing')
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'), 'Index runtime integration factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'), 'Index runtime integration assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1811,
      sourceHead,
      sourceMergeCommit,
      preconditionCount: 8,
      blockedStateSourceAlreadyExported: true,
      runtimeIntegrationBlockedSourceAlreadyExported: true,
      allExecutionPreconditionsSatisfiedToday: false,
      runtimeIntegrationApprovedToday: false,
      realMediaAllowed: false,
      artifactCreationAllowed: false,
      workerDispatchAllowed: false,
      supabaseSqlAllowed: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
