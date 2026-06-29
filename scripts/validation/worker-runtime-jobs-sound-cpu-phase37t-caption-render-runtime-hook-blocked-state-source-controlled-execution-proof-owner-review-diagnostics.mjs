#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37t_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_integration_readiness_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37t_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '2bb5d73bdd5b26185321ca06c4bc6a29615b5628'
const previousOwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase37s_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const integrationTarget = 'server/workers/sound-cpu/index.ts'
const integrationSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37U-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
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
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-safety-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-claim-policy',
)
const phase37UPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1689, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedEvidence.controlledProofPassed === true, 'Controlled proof evidence missing')
assert(review.reviewedEvidence.factoryInvoked === true, 'Factory invocation evidence missing')
assert(review.reviewedEvidence.blockedAssertionInvoked === true, 'Blocked assertion evidence missing')
assert(review.reviewedEvidence.blockedAssertionMatchedOwnerGate === true, 'Owner-gate match missing')
assert(review.reviewedEvidence.syntheticNoMediaInputOnly === true, 'Synthetic no-media evidence missing')
assert(review.reviewedEvidence.temporaryProofFileRemoved === true, 'Temporary proof removal missing')
assert(review.reviewedEvidence.typecheckServerPassed === true, 'Server typecheck evidence missing')
assert(review.reviewedEvidence.diagnosticsPassed === true, 'Diagnostics evidence missing')
assert(review.reviewedEvidence.noArtifactCreated === true, 'No artifact evidence missing')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'routeToolProviderApproved',
  'supabaseSqlApproved',
]) {
  assertFalse(review.reviewedEvidence[key], `review.reviewedEvidence.${key}`)
}
assert(review.acceptedForNextPlanning.integrationReadinessPlanningMayProceed === true, 'Next planning acceptance missing')
for (const key of [
  'realMediaExecutionToday',
  'captionRenderRuntimeExecutionToday',
  'workerExecutionToday',
  'routeExecutionToday',
  'toolExecutionToday',
  'providerModelCallToday',
  'artifactCreationToday',
  'supabaseSqlToday',
  'realUserMediaBetaToday',
  'paidProductionToday',
]) {
  assertFalse(review.acceptedForNextPlanning[key], `review.acceptedForNextPlanning.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37TDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37TPr === 1689, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37TMergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.controlledProofCommandPassed === true, 'Proof command acceptance missing')
assert(acceptance.acceptedEvidence.typecheckServerPassed === true, 'Typecheck acceptance missing')
assert(acceptance.acceptedEvidence.diagnosticsPassed === true, 'Diagnostics acceptance missing')
assert(acceptance.acceptedEvidence.factoryInvokedInControlledProof === true, 'Factory acceptance missing')
assert(acceptance.acceptedEvidence.blockedAssertionInvokedInControlledProof === true, 'Blocked assertion acceptance missing')
assert(acceptance.acceptedEvidence.temporaryProofFileRemoved === true, 'Temp removal acceptance missing')
assert(acceptance.acceptedEvidence.packageLockUnchanged === true, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be 0')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.futureIntegrationReadinessPlanning === true, 'Integration planning acceptance missing')
for (const key of ['runtimeExecution', 'realMediaProcessing', 'artifactDelivery', 'realUserMediaBeta', 'paidProduction']) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.proofBoundary.syntheticNoMediaInputOnly === true, 'Safety synthetic no-media missing')
assert(safety.proofBoundary.factoryInvocationBoundedToProof === true, 'Safety factory bound missing')
assert(safety.proofBoundary.blockedAssertionInvocationBoundedToProof === true, 'Safety assertion bound missing')
for (const key of [
  'temporaryProofFileCommitted',
  'mediaInputObserved',
  'mediaOutputObserved',
  'artifactOutputObserved',
  'providerOutputObserved',
  'serviceRolePayloadObserved',
  'signedUrlObserved',
]) {
  assertFalse(safety.proofBoundary[key], `safety.proofBoundary.${key}`)
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
  assertFalse(safety.executionBlocks[key], `safety.executionBlocks.${key}`)
}
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'dockerImageReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.readinessClaimsRemainUnclaimed[key], `safety.readinessClaimsRemainUnclaimed.${key}`)
}

assert(readiness.sourceDecision === expectedDecision, 'Phase 37U readiness source mismatch')
assert(readiness.phase37UMayProceed === true, 'Phase 37U may proceed missing')
assert(readiness.phase37UAllowedScope.docsDiagnosticsOnly === true, 'Phase 37U docs-only scope missing')
assert(readiness.phase37UAllowedScope.planIntegrationReadinessFromPhase37TProof === true, 'Phase 37U proof-planning scope missing')
assert(readiness.phase37UAllowedScope.noHookExecution === true, 'Phase 37U no-hook-execution scope missing')
assert(readiness.phase37UStillBlocked.realMediaExecution === true, 'Real media blocker missing')
assert(readiness.phase37UStillBlocked.paidProduction === true, 'Paid production blocker missing')
assert(readiness.nextPrompt === nextPrompt, 'Phase 37U next prompt mismatch')

assert(
  blocker.resolvedForThisGate.some((row) => row.blockerId === 'phase37t_controlled_execution_proof_owner_review_pending'),
  'Owner-review blocker resolution missing',
)
assert(
  blocker.remainingBlockers.some((row) => row.blockerId === 'phase37u_integration_readiness_plan_pending'),
  'Phase 37U planning blocker missing',
)

assert(claimPolicy.allowedClaims.phase37TProofOwnerReviewed === true, 'Allowed owner-reviewed claim missing')
assert(claimPolicy.allowedClaims.controlledSyntheticFailClosedProofAccepted === true, 'Allowed proof acceptance claim missing')
assert(claimPolicy.allowedClaims.integrationReadinessPlanningMayProceed === true, 'Allowed next planning claim missing')
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'dockerImageReadiness',
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

assert(phase37UPrompt.requiredSourceDecision === expectedDecision, 'Phase 37U prompt source decision mismatch')
assert(phase37UPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 37U prompt source head mismatch')
assert(phase37UPrompt.integrationTarget === integrationTarget, 'Phase 37U prompt integration target mismatch')
assert(phase37UPrompt.integrationSourcePath === integrationSourcePath, 'Phase 37U prompt integration source mismatch')
assert(phase37UPrompt.allowedScope.docsDiagnosticsOnly === true, 'Phase 37U prompt docs-only scope missing')
assert(phase37UPrompt.allowedScope.noSupabaseSql === true, 'Phase 37U prompt no Supabase SQL scope missing')

const proofDoc = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.md',
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof',
)
assert(proofDoc.decision === sourceDecision, 'Merged Phase 37T proof decision missing')
assert(proofDoc.sourceVerification.sourceDecision === previousOwnerDecision, 'Phase 37T source owner decision mismatch')
assert(proofDoc.controlledProof.factoryInvoked === true, 'Merged proof factory evidence missing')
assert(proofDoc.controlledProof.blockedAssertionInvoked === true, 'Merged proof blocked assertion evidence missing')
assert(proofDoc.controlledProof.temporaryProofFileRemovedBeforeStaging === true, 'Merged proof temp removal missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must not exist')

const sourceText = readText(integrationSourcePath)
const indexText = readText(integrationTarget)
assert(sourceText.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(sourceText.includes('runtimeExecutionApproved: false'), 'Runtime disabled source field missing')
assert(sourceText.includes('artifactCreationApproved: false'), 'Artifact disabled source field missing')
assert(indexText.includes("} from './runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'"), 'Index export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1689,
      sourceMergeCommit,
      phase37UIntegrationReadinessPlanMayProceed: true,
      realMediaExecutionToday: false,
      workerExecutionToday: false,
      artifactCreationToday: false,
      supabaseSqlToday: false,
      realUserMediaBetaToday: false,
      paidProductionToday: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
