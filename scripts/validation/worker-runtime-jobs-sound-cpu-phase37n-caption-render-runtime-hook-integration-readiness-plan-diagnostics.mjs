import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37n_caption_render_runtime_hook_integration_readiness_plan_completed_with_warnings_ready_for_integration_readiness_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37m_caption_render_runtime_hook_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_integration_readiness_plan_no_media_no_artifacts'
const sourceMergeCommit = '728d94bd3339c43469482f392ba523cdee9228e5'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-evidence-map.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-evidence-map',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-beta-readiness-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-beta-readiness-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review',
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
  if (!condition) {
    throw new Error(message)
  }
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const plan = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan')
const evidence = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-evidence-map')
const boundary = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-boundary-register')
const betaBlockers = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-beta-readiness-blocker-register')
const ownerReadiness = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-owner-review-readiness-register')
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-claim-policy')
const ownerPrompt = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review')

assert(plan.decision === expectedDecision, 'Phase 37N decision mismatch')
assert(plan.sourceVerification.sourcePr === 1647, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.integrationReadinessPlan.consumePhase37MProofEvidence === true, 'Phase37M proof evidence not consumed')
assert(plan.integrationReadinessPlan.consumePhase37MOwnerReview === true, 'Phase37M owner review not consumed')
assert(plan.integrationReadinessPlan.staticHookSourceBoundaryReviewed === true, 'Static boundary not reviewed')
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
assert(plan.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(plan.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

for (const key of [
  'phase37KImportProof',
  'phase37KOwnerReview',
  'phase37LExecutionPlan',
  'phase37LOwnerReview',
  'phase37MProof',
  'phase37MOwnerReview',
]) {
  assert(typeof evidence.sourceEvidence[key] === 'string', `Missing evidence source: ${key}`)
}
assert(evidence.sourceFiles.hookSourcePath === 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts', 'Hook path mismatch')
assert(evidence.sourceFiles.indexExportPath === 'server/workers/sound-cpu/index.ts', 'Index path mismatch')
assert(evidence.sourceFiles.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assert(evidence.evidenceUse.mayInformIntegrationReadinessMetadata === true, 'Metadata use missing')
assertFalse(evidence.evidenceUse.mayAuthorizeRuntimeExecution, 'evidenceUse.mayAuthorizeRuntimeExecution')
assertFalse(evidence.evidenceUse.mayAuthorizeRealMediaInput, 'evidenceUse.mayAuthorizeRealMediaInput')
assertFalse(evidence.evidenceUse.mayAuthorizeArtifactCreation, 'evidenceUse.mayAuthorizeArtifactCreation')
assertFalse(evidence.evidenceUse.mayAuthorizeBetaUnlock, 'evidenceUse.mayAuthorizeBetaUnlock')
assertFalse(evidence.evidenceUse.mayAuthorizeProductionUnlock, 'evidenceUse.mayAuthorizeProductionUnlock')

assert(boundary.allowedIntegrationReadinessChecks.confirmHookSourceExists === true, 'Hook source check missing')
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

assert(claimPolicy.allowedClaims.integrationReadinessPlanCreated === true, 'Allowed integration plan claim missing')
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
assert(ownerPrompt.reviewFocus.integrationReadinessMetadataOnly === true, 'Owner prompt metadata-only focus missing')
assertFalse(ownerPrompt.reviewFocus.realMediaAllowed, 'ownerPrompt.realMediaAllowed')
assertFalse(ownerPrompt.reviewFocus.artifactCreationAllowed, 'ownerPrompt.artifactCreationAllowed')
assertFalse(ownerPrompt.reviewFocus.workerDispatchAllowed, 'ownerPrompt.workerDispatchAllowed')
assertFalse(ownerPrompt.reviewFocus.supabaseSqlAllowed, 'ownerPrompt.supabaseSqlAllowed')
assertFalse(ownerPrompt.reviewFocus.realUserMediaBetaAllowed, 'ownerPrompt.realUserMediaBetaAllowed')
assertFalse(ownerPrompt.reviewFocus.paidProductionAllowed, 'ownerPrompt.paidProductionAllowed')

const proofOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review',
)
assert(proofOwnerReview.decision === sourceDecision, 'Phase 37M owner review source doc missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const hookSource = readText('server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts')
assert(hookSource.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'Hook factory missing')
assert(hookSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'Blocked assertion missing')
const indexSource = readText('server/workers/sound-cpu/index.ts')
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1647,
      sourceMergeCommit,
      integrationReadinessPlanCreated: true,
      realMediaIntegrationApprovedToday: false,
      workerDispatchApprovedToday: false,
      artifactCreationToday: false,
      supabaseSqlToday: false,
      realUserMediaBetaToday: false,
      paidProductionToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37N-CAPTION-RENDER-RUNTIME-HOOK-INTEGRATION-READINESS-PLAN-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
