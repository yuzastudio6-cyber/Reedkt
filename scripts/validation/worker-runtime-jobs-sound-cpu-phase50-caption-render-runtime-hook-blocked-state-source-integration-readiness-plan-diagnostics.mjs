import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase50_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_completed_with_warnings_ready_for_source_integration_readiness_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase49_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_readiness_plan_no_media_no_artifacts'
const sourceHead = '893a8feabae4f5ceedf4bde711b456de2604639e'
const sourceMergeCommit = 'fcda9a1656a3e9518bc52f80aa17f1815e81fdec'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const blockedStateIntegrationSource =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationSource =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexExportSource = 'server/workers/sound-cpu/index.ts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan:diagnostics'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE50-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-PLAN-OWNER-REVIEW'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-evidence-map.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-evidence-map',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-beta-readiness-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-beta-readiness-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
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

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
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
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)
const evidence = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-evidence-map',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-boundary-register',
)
const betaBlockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-beta-readiness-blocker-register',
)
const ownerReadiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-owner-review-readiness-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 50 decision mismatch')
assert(plan.sourceVerification.sourcePr === 1799, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'consumePhase49ProofEvidence',
  'consumePhase49OwnerReview',
  'staticHookSourceBoundaryReviewed',
  'staticBlockedStateSourceBoundaryReviewed',
  'staticRuntimeIntegrationSourceBoundaryReviewed',
  'indexExportsReviewed',
]) {
  assertTrue(plan.sourceIntegrationReadinessPlan[key], `plan.sourceIntegrationReadinessPlan.${key}`)
}
for (const key of [
  'sourceIntegrationApprovedToday',
  'runtimeIntegrationApprovedToday',
  'realMediaIntegrationApprovedToday',
  'artifactIntegrationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(plan.sourceIntegrationReadinessPlan[key], `plan.sourceIntegrationReadinessPlan.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoop(plan.supabaseClassification, 'plan')

for (const key of [
  'phase47ControlledImportProof',
  'phase47OwnerReview',
  'phase48ControlledExecutionPlan',
  'phase48OwnerReview',
  'phase49ControlledExecutionProof',
  'phase49OwnerReview',
]) {
  assert(typeof evidence.sourceEvidence[key] === 'string', `Missing evidence source: ${key}`)
}
assert(evidence.sourceFiles.hookSourcePath === hookSource, 'Hook source path mismatch')
assert(evidence.sourceFiles.blockedStateIntegrationSourcePath === blockedStateIntegrationSource, 'Blocked-state source path mismatch')
assert(evidence.sourceFiles.runtimeIntegrationSourcePath === runtimeIntegrationSource, 'Runtime source path mismatch')
assert(evidence.sourceFiles.indexExportPath === indexExportSource, 'Index path mismatch')
assert(evidence.sourceFiles.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assertTrue(
  evidence.evidenceUse.mayInformBlockedStateSourceIntegrationReadinessMetadata,
  'Metadata evidence use missing',
)
assertTrue(evidence.evidenceUse.mayInformFailClosedSourceBoundaryChecks, 'Fail-closed source checks missing')
assertTrue(evidence.evidenceUse.mayInformIndexExportReadinessChecks, 'Index export checks missing')
for (const key of [
  'mayAuthorizeRuntimeExecution',
  'mayAuthorizeRealMediaInput',
  'mayAuthorizeArtifactCreation',
  'mayAuthorizeBetaUnlock',
  'mayAuthorizeProductionUnlock',
]) {
  assertFalse(evidence.evidenceUse[key], `evidence.evidenceUse.${key}`)
}

for (const value of Object.values(boundary.allowedSourceIntegrationReadinessChecks)) {
  assertTrue(value, 'allowed source integration readiness check')
}
for (const value of Object.values(boundary.blockedIntegrationActions)) {
  assertTrue(value, 'blocked integration action')
}
for (const value of Object.values(boundary.integrationStateToday)) {
  assertFalse(value, 'integration state today')
}

assert(betaBlockers.remainingBetaBlockers.includes('real-user media beta remains blocked'), 'Real-user beta blocker missing')
assert(betaBlockers.remainingBetaBlockers.includes('paid production remains blocked'), 'Paid production blocker missing')
assertTrue(betaBlockers.boundedExternalBetaStatus.noRuntimeNoRealUserMediaScopeAllowed, 'Bounded beta scope missing')
assertFalse(betaBlockers.boundedExternalBetaStatus.realUserMediaBetaAllowed, 'Real-user beta must be false')
assertFalse(betaBlockers.boundedExternalBetaStatus.paidProductionAllowed, 'Paid production must be false')
for (const value of Object.values(betaBlockers.readinessClaims)) {
  assert(value === 'unclaimed', 'readiness claims must remain unclaimed')
}

assert(ownerReadiness.decision === expectedDecision, 'Owner readiness decision mismatch')
assertTrue(ownerReadiness.ownerReviewMayProceed, 'Owner review may proceed missing')
assert(ownerReadiness.mustRejectIf.includes('any PR claims runtime readiness'), 'Runtime readiness rejection missing')
assert(
  ownerReadiness.mustRejectIf.includes('any PR unlocks real-user media beta or paid production'),
  'Beta/production rejection missing',
)
assert(ownerReadiness.selectedNextPrompt === nextPrompt, 'Owner readiness next prompt mismatch')

for (const value of Object.values(claimPolicy.allowedClaims)) assertTrue(value, 'Allowed claim')
for (const value of Object.values(claimPolicy.forbiddenClaims)) assertFalse(value, 'Forbidden claim')
for (const value of Object.values(claimPolicy.forbiddenExecution)) assertFalse(value, 'Forbidden execution')
assertNoop(claimPolicy.supabaseClassification, 'claim policy')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
for (const value of Object.values(ownerPrompt.allowedScope)) assertTrue(value, 'Owner prompt allowed scope')
assert(ownerPrompt.blocked.includes('real media input'), 'Owner prompt real media blocker missing')
assert(ownerPrompt.blocked.includes('paid production unlock'), 'Owner prompt production blocker missing')
assertNoop(ownerPrompt.supabaseClassification, 'owner prompt')

for (const sourcePath of [hookSource, blockedStateIntegrationSource, runtimeIntegrationSource, indexExportSource]) {
  assert(fs.existsSync(path.join(repoRoot, sourcePath)), `Missing source file: ${sourcePath}`)
}
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'temporary proof file must not exist')

const phase49Owner = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
)
assert(phase49Owner.decision === sourceDecision, 'Phase 49 owner decision mismatch')
assert(phase49Owner.sourceVerification.sourceMergeCommit === '120c97f650f59e7e26a86037a7a398f59a2fb833', 'Phase 49 owner merge mismatch')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-diagnostics.mjs',
  'package script mismatch',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourcePr: 1799,
      sourceMergeCommit,
      nextPrompt,
      realUserMediaBetaAllowed: betaBlockers.boundedExternalBetaStatus.realUserMediaBetaAllowed,
      paidProductionAllowed: betaBlockers.boundedExternalBetaStatus.paidProductionAllowed,
      supabaseClassification: plan.supabaseClassification,
    },
    null,
    2,
  ),
)
