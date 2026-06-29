import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37m_caption_render_runtime_hook_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_integration_readiness_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37m_caption_render_runtime_hook_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '5a5896faa8eeb0122531be26ff587cb4bcb0fef5'
const tempProofFile =
  'server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-safety-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37n-caption-render-runtime-hook-integration-readiness-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1645, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedEvidence.controlledProofPassed === true, 'Controlled proof evidence missing')
assert(review.reviewedEvidence.temporaryProofFileRemoved === true, 'Temp proof removal missing')
assert(review.reviewedEvidence.hookFactoryInvoked === true, 'Hook factory evidence missing')
assert(review.reviewedEvidence.blockedAssertionInvoked === true, 'Blocked assertion evidence missing')
assert(review.reviewedEvidence.blockedAssertionMatchedOwnerGate === true, 'Owner gate match missing')
assert(review.reviewedEvidence.syntheticNoMediaInputOnly === true, 'Synthetic no-media evidence missing')
assert(review.reviewedEvidence.noArtifactCreated === true, 'No artifact evidence missing')
for (const key of ['mediaRead', 'artifactWrite', 'workerDispatch', 'routeToolProviderCall', 'supabaseSql']) {
  assertFalse(review.reviewedEvidence[key], `review.reviewedEvidence.${key}`)
}
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
assert(review.acceptedForNextPlanning.integrationReadinessPlanningMayProceed === true, 'Next planning not accepted')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37MDecision === sourceDecision, 'Accepted source decision mismatch')
assert(acceptance.acceptedEvidence.proofCommandPassed === true, 'Proof command pass missing')
assert(acceptance.acceptedEvidence.temporaryProofFileRemoved === true, 'Temp removal acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be 0')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.futureIntegrationReadinessPlanning === true, 'Integration planning acceptance missing')
for (const key of ['runtimeExecution', 'realMediaProcessing', 'artifactDelivery', 'realUserMediaBeta', 'paidProduction']) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.proofBoundary.syntheticNoMediaInputOnly === true, 'Safety synthetic no-media missing')
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

assert(readiness.sourceDecision === expectedDecision, 'Phase 37N readiness source mismatch')
assert(readiness.phase37NMayProceed === true, 'Phase 37N may proceed missing')
assert(readiness.phase37NAllowedScope.planIntegrationReadiness === true, 'Phase 37N planning scope missing')
assert(readiness.phase37NAllowedScope.noMediaInput === true, 'Phase 37N no-media scope missing')
assert(readiness.phase37NStillBlocked.realMediaExecution === true, 'Real media blocker missing')
assert(readiness.phase37NStillBlocked.paidProduction === true, 'Paid production blocker missing')

assert(blocker.remainingBlocked.includes('real media input'), 'Real media blocker list missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker list missing')
assert(blocker.ownerReviewPassedWithWarnings === true, 'Owner review warning pass missing')

assert(claimPolicy.allowedClaims.phase37MProofOwnerReviewed === true, 'Allowed owner-reviewed claim missing')
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

assert(nextPrompt.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(nextPrompt.allowedScope.docsDiagnosticsOnly === true, 'Next prompt docs-only scope missing')
assert(nextPrompt.allowedScope.noSupabaseSql === true, 'Next prompt no Supabase SQL scope missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const proofDoc = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof.md',
  'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof',
)
assert(proofDoc.decision === sourceDecision, 'Merged Phase 37M proof decision missing')
assert(proofDoc.proof.temporaryProofFileRemovedBeforeStaging === true, 'Merged proof temp removal missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must not exist')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1645,
      sourceMergeCommit,
      phase37NIntegrationReadinessPlanMayProceed: true,
      realMediaExecutionToday: false,
      workerExecutionToday: false,
      artifactCreationToday: false,
      supabaseSqlToday: false,
      realUserMediaBetaToday: false,
      paidProductionToday: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37N-CAPTION-RENDER-RUNTIME-HOOK-INTEGRATION-READINESS-PLAN',
    },
    null,
    2,
  ),
)
