import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase44_caption_render_runtime_hook_blocked_state_integration_readiness_plan_completed_with_warnings_ready_for_blocked_state_integration_readiness_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase43_caption_render_runtime_hook_blocked_state_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_blocked_state_integration_readiness_plan_no_media_no_artifacts'
const sourceHead = '339d54db9059ff1420dcf38ebbeff16265e865c8'
const sourceMergeCommit = 'accef34546c41955aa997c294410cb6dbbc325e5'
const tempProofFile =
  'server/workers/sound-cpu/phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.tmp.ts'
const runtimeIntegrationSource =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const blockedStateIntegrationSource =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexExportSource = 'server/workers/sound-cpu/index.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-evidence-map.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-evidence-map',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-beta-readiness-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-beta-readiness-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan-owner-review',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) {
    throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  }
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan',
)
const evidence = parsed.get('worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-evidence-map')
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-boundary-register',
)
const betaBlockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-beta-readiness-blocker-register',
)
const ownerReadiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-owner-review-readiness-register',
)
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-claim-policy')
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 44 decision mismatch')
assert(plan.sourceVerification.sourcePr === 1762, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.integrationReadinessPlan.consumePhase43ProofEvidence === true, 'Phase43 proof evidence not consumed')
assert(plan.integrationReadinessPlan.consumePhase43OwnerReview === true, 'Phase43 owner review not consumed')
assert(
  plan.integrationReadinessPlan.staticRuntimeIntegrationSourceBoundaryReviewed === true,
  'Static runtime integration boundary not reviewed',
)
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
assert(plan.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE44-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-INTEGRATION-READINESS-PLAN-OWNER-REVIEW', 'next prompt mismatch')
assertSupabaseNoop(plan.supabaseClassification, 'plan')

for (const key of [
  'phase41StaticImportProof',
  'phase41OwnerReview',
  'phase42ExecutionPlan',
  'phase42OwnerReview',
  'phase43Proof',
  'phase43OwnerReview',
]) {
  assert(typeof evidence.sourceEvidence[key] === 'string', `Missing evidence source: ${key}`)
}
assert(evidence.sourceFiles.runtimeIntegrationSourcePath === runtimeIntegrationSource, 'Runtime integration path mismatch')
assert(evidence.sourceFiles.blockedStateIntegrationSourcePath === blockedStateIntegrationSource, 'Blocked-state integration path mismatch')
assert(evidence.sourceFiles.indexExportPath === indexExportSource, 'Index path mismatch')
assert(evidence.sourceFiles.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assert(
  evidence.evidenceUse.mayInformBlockedStateIntegrationReadinessMetadata === true,
  'Metadata use missing',
)
assert(evidence.evidenceUse.mayInformFailClosedRuntimeIntegrationChecks === true, 'Fail-closed checks missing')
assertFalse(evidence.evidenceUse.mayAuthorizeRuntimeExecution, 'evidenceUse.mayAuthorizeRuntimeExecution')
assertFalse(evidence.evidenceUse.mayAuthorizeRealMediaInput, 'evidenceUse.mayAuthorizeRealMediaInput')
assertFalse(evidence.evidenceUse.mayAuthorizeArtifactCreation, 'evidenceUse.mayAuthorizeArtifactCreation')
assertFalse(evidence.evidenceUse.mayAuthorizeBetaUnlock, 'evidenceUse.mayAuthorizeBetaUnlock')
assertFalse(evidence.evidenceUse.mayAuthorizeProductionUnlock, 'evidenceUse.mayAuthorizeProductionUnlock')

assert(
  boundary.allowedIntegrationReadinessChecks.confirmRuntimeIntegrationSourceExists === true,
  'Runtime integration source check missing',
)
assert(boundary.allowedIntegrationReadinessChecks.confirmIndexExportsExist === true, 'Index export check missing')
assert(boundary.allowedIntegrationReadinessChecks.confirmTemporaryProofFileAbsent === true, 'Temp absence check missing')
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

assert(ownerReadiness.decision === expectedDecision, 'Owner readiness decision mismatch')
assert(ownerReadiness.ownerReviewMayProceed === true, 'Owner review may proceed missing')
assert(ownerReadiness.mustRejectIf.includes('any PR claims runtime readiness'), 'Runtime readiness rejection missing')
assert(ownerReadiness.mustRejectIf.includes('any PR unlocks real-user media beta or paid production'), 'Beta/production rejection missing')

assert(
  claimPolicy.allowedClaims.blockedStateIntegrationReadinessPlanCreated === true,
  'Allowed integration plan claim missing',
)
assert(claimPolicy.allowedClaims.phase43ProofEvidenceMapped === true, 'Phase43 evidence mapping claim missing')
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
assert(
  ownerPrompt.reviewFocus.blockedStateIntegrationReadinessMetadataOnly === true,
  'Owner prompt metadata-only focus missing',
)
assertFalse(ownerPrompt.reviewFocus.realMediaAllowed, 'ownerPrompt.realMediaAllowed')
assertFalse(ownerPrompt.reviewFocus.artifactCreationAllowed, 'ownerPrompt.artifactCreationAllowed')
assertFalse(ownerPrompt.reviewFocus.workerDispatchAllowed, 'ownerPrompt.workerDispatchAllowed')
assertFalse(ownerPrompt.reviewFocus.supabaseSqlAllowed, 'ownerPrompt.supabaseSqlAllowed')
assertFalse(ownerPrompt.reviewFocus.realUserMediaBetaAllowed, 'ownerPrompt.realUserMediaBetaAllowed')
assertFalse(ownerPrompt.reviewFocus.paidProductionAllowed, 'ownerPrompt.paidProductionAllowed')
assertSupabaseNoop(ownerPrompt.supabaseClassification, 'ownerPrompt')

const proofOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-review',
)
assert(proofOwnerReview.decision === sourceDecision, 'Phase 43 owner review source doc missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const runtimeText = readText(runtimeIntegrationSource)
assert(
  runtimeText.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'),
  'Runtime integration factory missing',
)
assert(
  runtimeText.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'),
  'Runtime integration blocked assertion missing',
)
assert(runtimeText.includes("runtimeExecutionApproved: false"), 'Runtime execution must remain false')
assert(runtimeText.includes("artifactCreationApproved: false"), 'Artifact creation must remain false')
assert(runtimeText.includes("realUserMediaBetaApproved: false"), 'Real-user beta must remain false')

const indexText = readText(indexExportSource)
assert(
  indexText.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'),
  'Index factory export missing',
)
assert(
  indexText.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'),
  'Index assertion export missing',
)

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1762,
      sourceMergeCommit,
      blockedStateIntegrationReadinessPlanCreated: true,
      realMediaIntegrationApprovedToday: false,
      workerDispatchApprovedToday: false,
      artifactCreationToday: false,
      supabaseSqlToday: false,
      realUserMediaBetaToday: false,
      paidProductionToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE44-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-INTEGRATION-READINESS-PLAN-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
