import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37u_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_completed_with_warnings_ready_for_integration_readiness_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37t_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_integration_readiness_plan_no_media_no_artifacts'
const proofDecision =
  'worker_runtime_jobs_sound_cpu_phase37t_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '4a48f23200595bb7dc05f83f638e086129a5caf8'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37U-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-PLAN-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-evidence-map.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-evidence-map',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-beta-readiness-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-beta-readiness-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
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
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)
const evidence = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-evidence-map',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-boundary-register',
)
const betaBlockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-beta-readiness-blocker-register',
)
const ownerReadiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-owner-review-readiness-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 37U decision mismatch')
assert(plan.sourceVerification.sourcePr === 1694, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.integrationReadinessPlan.consumePhase37TProofEvidence === true, 'Phase 37T proof evidence not consumed')
assert(plan.integrationReadinessPlan.consumePhase37TOwnerReview === true, 'Phase 37T owner review not consumed')
assert(plan.integrationReadinessPlan.staticBlockedStateSourceBoundaryReviewed === true, 'Blocked-state source boundary not reviewed')
assert(plan.integrationReadinessPlan.indexExportsReviewed === true, 'Index exports not reviewed')
for (const key of [
  'runtimeIntegrationApprovedToday',
  'realMediaIntegrationApprovedToday',
  'artifactIntegrationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(plan.integrationReadinessPlan[key], `plan.integrationReadinessPlan.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'Next prompt mismatch')
assert(plan.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(plan.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

for (const key of [
  'phase37PSourceCreation',
  'phase37QStaticValidation',
  'phase37RImportProof',
  'phase37SExecutionPlan',
  'phase37TProof',
  'phase37TOwnerReview',
]) {
  assert(typeof evidence.sourceEvidence[key] === 'string', `Missing evidence source: ${key}`)
}
assert(evidence.sourceEvidence.phase37TProof === proofDecision, 'Phase 37T proof evidence mismatch')
assert(evidence.sourceEvidence.phase37TOwnerReview === sourceDecision, 'Phase 37T owner evidence mismatch')
assert(evidence.sourceFiles.blockedStateIntegrationSourcePath === blockedSourcePath, 'Blocked-state source path mismatch')
assert(evidence.sourceFiles.indexExportPath === indexPath, 'Index path mismatch')
assert(evidence.sourceFiles.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assert(evidence.evidenceUse.mayInformIntegrationReadinessMetadata === true, 'Metadata use missing')
assert(evidence.evidenceUse.mayInformOwnerReviewReadiness === true, 'Owner review use missing')
assertFalse(evidence.evidenceUse.mayAuthorizeRuntimeExecution, 'evidenceUse.mayAuthorizeRuntimeExecution')
assertFalse(evidence.evidenceUse.mayAuthorizeRealMediaInput, 'evidenceUse.mayAuthorizeRealMediaInput')
assertFalse(evidence.evidenceUse.mayAuthorizeArtifactCreation, 'evidenceUse.mayAuthorizeArtifactCreation')
assertFalse(evidence.evidenceUse.mayAuthorizeBetaUnlock, 'evidenceUse.mayAuthorizeBetaUnlock')
assertFalse(evidence.evidenceUse.mayAuthorizeProductionUnlock, 'evidenceUse.mayAuthorizeProductionUnlock')

assert(boundary.allowedIntegrationReadinessChecks.confirmBlockedStateSourceExists === true, 'Blocked-state source check missing')
assert(boundary.allowedIntegrationReadinessChecks.confirmIndexExportsExist === true, 'Index export check missing')
assert(boundary.allowedIntegrationReadinessChecks.confirmTemporaryProofFileAbsent === true, 'Temp absence check missing')
assert(boundary.allowedIntegrationReadinessChecks.confirmRuntimeDisabledFlagsRemainFalse === true, 'Runtime disabled check missing')
assert(boundary.allowedIntegrationReadinessChecks.confirmFailClosedBlockedAssertionExists === true, 'Fail-closed assertion check missing')
for (const key of Object.keys(boundary.blockedIntegrationActions)) {
  assert(boundary.blockedIntegrationActions[key] === true, `Blocked integration action must be true: ${key}`)
}
for (const key of [
  'runtimeIntegrated',
  'mediaIntegrated',
  'artifactIntegrated',
  'workerDispatchIntegrated',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assertFalse(boundary.integrationStateToday[key], `boundary.integrationStateToday.${key}`)
}

assert(betaBlockers.remainingBetaBlockers.includes('real-user media beta remains blocked'), 'Real-user beta blocker missing')
assert(betaBlockers.remainingBetaBlockers.includes('paid production remains blocked'), 'Paid production blocker missing')
assert(betaBlockers.boundedExternalBetaStatus.noRuntimeNoRealUserMediaScopeAllowed === true, 'Bounded beta scope missing')
assertFalse(betaBlockers.boundedExternalBetaStatus.realUserMediaBetaAllowed, 'betaBlockers.realUserMediaBetaAllowed')
assertFalse(betaBlockers.boundedExternalBetaStatus.paidProductionAllowed, 'betaBlockers.paidProductionAllowed')
assert(betaBlockers.phase37UContributes.integrationReadinessMetadata === true, 'Integration metadata contribution missing')
assertFalse(betaBlockers.phase37UContributes.runtimeReadiness, 'betaBlockers.phase37UContributes.runtimeReadiness')
assertFalse(betaBlockers.phase37UContributes.betaUnlock, 'betaBlockers.phase37UContributes.betaUnlock')

assert(ownerReadiness.decision === expectedDecision, 'Owner readiness decision mismatch')
assert(ownerReadiness.ownerReviewMayProceed === true, 'Owner review may proceed missing')
assert(ownerReadiness.mustRejectIf.includes('any PR claims runtime readiness'), 'Runtime readiness rejection missing')
assert(ownerReadiness.mustRejectIf.includes('any PR unlocks real-user media beta or paid production'), 'Beta/production rejection missing')

assert(claimPolicy.allowedClaims.integrationReadinessPlanCreated === true, 'Allowed integration plan claim missing')
assert(claimPolicy.allowedClaims.phase37TProofEvidenceConsumed === true, 'Phase 37T proof claim missing')
assert(claimPolicy.allowedClaims.phase37TOwnerReviewConsumed === true, 'Phase 37T owner claim missing')
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

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.integrationTarget === indexPath, 'Owner prompt integration target mismatch')
assert(ownerPrompt.integrationSourcePath === blockedSourcePath, 'Owner prompt source path mismatch')
assert(ownerPrompt.reviewFocus.integrationReadinessMetadataOnly === true, 'Owner prompt metadata-only focus missing')
assert(ownerPrompt.reviewFocus.phase37TProofEvidenceConsumed === true, 'Owner prompt proof evidence focus missing')
assert(ownerPrompt.reviewFocus.temporaryProofFileAbsent === true, 'Owner prompt temp absence missing')
assertFalse(ownerPrompt.reviewFocus.realMediaAllowed, 'ownerPrompt.realMediaAllowed')
assertFalse(ownerPrompt.reviewFocus.artifactCreationAllowed, 'ownerPrompt.artifactCreationAllowed')
assertFalse(ownerPrompt.reviewFocus.workerDispatchAllowed, 'ownerPrompt.workerDispatchAllowed')
assertFalse(ownerPrompt.reviewFocus.supabaseSqlAllowed, 'ownerPrompt.supabaseSqlAllowed')
assertFalse(ownerPrompt.reviewFocus.realUserMediaBetaAllowed, 'ownerPrompt.realUserMediaBetaAllowed')
assertFalse(ownerPrompt.reviewFocus.paidProductionAllowed, 'ownerPrompt.paidProductionAllowed')

const sourceOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
)
assert(sourceOwnerReview.decision === sourceDecision, 'Phase 37T owner review source doc missing')
assert(sourceOwnerReview.reviewedEvidence.controlledProofPassed === true, 'Phase 37T proof source evidence missing')
assert(sourceOwnerReview.acceptedForNextPlanning.integrationReadinessPlanningMayProceed === true, 'Phase 37T did not permit Phase 37U')

const proofDoc = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.md',
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof',
)
assert(proofDoc.decision === proofDecision, 'Merged Phase 37T proof decision missing')
assert(proofDoc.controlledProof.temporaryProofFileRemovedBeforeStaging === true, 'Merged proof temp removal missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Blocked-state factory missing')
assert(blockedSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Blocked assertion missing')
for (const field of [
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'noArtifactCreated: true',
]) {
  assert(blockedSource.includes(field), `Fail-closed source field missing: ${field}`)
}
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1694,
      sourceMergeCommit,
      integrationReadinessPlanCreated: true,
      realMediaIntegrationApprovedToday: false,
      workerDispatchApprovedToday: false,
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
