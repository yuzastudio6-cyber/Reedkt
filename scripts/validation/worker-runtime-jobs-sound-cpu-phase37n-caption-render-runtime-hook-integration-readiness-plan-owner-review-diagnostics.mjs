import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37n_caption_render_runtime_hook_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37n_caption_render_runtime_hook_integration_readiness_plan_completed_with_warnings_ready_for_integration_readiness_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '4c5b3ee5517cc8ababc11ad6a301f124d924400b'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan',
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

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review')
const acceptance = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-acceptance-register')
const safety = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-safety-register')
const readiness = parsed.get('worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-readiness-register')
const blocker = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-blocker-register')
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-owner-claim-policy')
const nextPrompt = parsed.get('worker-runtime-jobs-sound-cpu-phase37o-caption-render-runtime-hook-blocked-state-source-integration-plan')

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1651, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedPlan.phase37MProofEvidenceMapped === true, 'Phase 37M proof mapping missing')
assert(review.reviewedPlan.integrationReadinessMetadataOnly === true, 'Metadata-only review missing')
assert(review.reviewedPlan.temporaryProofFileAbsent === true, 'Temp proof absence missing')
assert(review.reviewedPlan.hookSourceAndIndexExportsReviewed === true, 'Hook source review missing')
assert(review.reviewedPlan.blockedStateSourceIntegrationPlanningMayProceed === true, 'Next planning approval missing')
for (const key of [
  'realMediaAllowed',
  'artifactCreationAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(review.reviewedPlan[key], `review.reviewedPlan.${key}`)
}
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37NDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37MProofEvidenceMapped === true, 'Accepted Phase 37M proof missing')
assert(acceptance.acceptedEvidence.temporaryProofFileAbsent === true, 'Accepted temp absence missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.blockedStateSourceIntegrationPlanning === true, 'Blocked-state planning acceptance missing')
for (const key of ['runtimeExecution', 'realMediaProcessing', 'artifactDelivery', 'realUserMediaBeta', 'paidProduction']) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.sourceIntegrationSafety.allowedNextStep === 'blocked-state source integration plan', 'Allowed next step mismatch')
assert(safety.sourceIntegrationSafety.temporaryProofFileMustRemainAbsent === true, 'Temp must remain absent')
for (const key of [
  'realMediaInputAllowed',
  'ocrInferenceAllowed',
  'captionRenderExecutionAllowed',
  'artifactWriteAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'betaUnlockAllowed',
  'productionUnlockAllowed',
]) {
  assertFalse(safety.sourceIntegrationSafety[key], `safety.sourceIntegrationSafety.${key}`)
}
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(readiness.sourceDecision === expectedDecision, 'Phase 37O readiness source mismatch')
assert(readiness.phase37OMayProceed === true, 'Phase 37O may proceed missing')
assert(readiness.phase37OAllowedScope.planBlockedStateSourceIntegration === true, 'Phase 37O planning scope missing')
assert(readiness.phase37OAllowedScope.noHookExecution === true, 'Phase 37O no hook execution missing')
assert(readiness.phase37OStillBlocked.actualSourceIntegration === true, 'Actual source integration blocker missing')
assert(readiness.phase37OStillBlocked.realUserMediaBeta === true, 'Real-user media blocker missing')
assert(readiness.phase37OStillBlocked.paidProduction === true, 'Paid production blocker missing')

assert(blocker.remainingBlocked.includes('actual source integration'), 'Actual source integration blocker list missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker list missing')
assert(blocker.ownerReviewPassedWithWarnings === true, 'Owner review warning pass missing')

assert(claimPolicy.allowedClaims.phase37NOwnerReviewPassed === true, 'Owner-review claim missing')
assert(claimPolicy.allowedClaims.blockedStateSourceIntegrationPlanningMayProceed === true, 'Next planning claim missing')
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

assert(nextPrompt.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(nextPrompt.allowedScope.planBlockedStateSourceIntegration === true, 'Next prompt planning scope missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37NPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan',
)
assert(phase37NPlan.decision === sourceDecision, 'Phase 37N source plan decision missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1651,
      sourceMergeCommit,
      phase37OBlockedStateSourceIntegrationPlanningMayProceed: true,
      realMediaAllowed: false,
      artifactCreationAllowed: false,
      workerDispatchAllowed: false,
      supabaseSqlAllowed: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37O-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-PLAN',
    },
    null,
    2,
  ),
)
