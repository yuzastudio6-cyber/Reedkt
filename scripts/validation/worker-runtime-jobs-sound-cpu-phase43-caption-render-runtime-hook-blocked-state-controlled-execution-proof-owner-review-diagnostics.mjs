import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase43_caption_render_runtime_hook_blocked_state_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_blocked_state_integration_readiness_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase43_caption_render_runtime_hook_blocked_state_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceHead = '6f22e569af674cee51d29db7b5093d2ecb37a9e7'
const sourceMergeCommit = '5783fd0e6db22e99671b702cf4a1a26f174f296c'
const tempProofFile =
  'server/workers/sound-cpu/phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-safety-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase44-caption-render-runtime-hook-blocked-state-integration-readiness-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1759, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewedEvidence.controlledProofPassed === true, 'Controlled proof evidence missing')
assert(review.reviewedEvidence.typecheckServerPassed === true, 'Typecheck evidence missing')
assert(review.reviewedEvidence.temporaryProofFileRemoved === true, 'Temp proof removal missing')
assert(
  review.reviewedEvidence.runtimeIntegrationBlockedResultFactoryInvoked === true,
  'Runtime integration factory evidence missing',
)
assert(
  review.reviewedEvidence.runtimeIntegrationBlockedAssertionInvoked === true,
  'Runtime integration assertion evidence missing',
)
assert(review.reviewedEvidence.blockedAssertionMatchedOwnerGate === true, 'Owner gate match missing')
assert(
  review.reviewedEvidence.nestedBlockedStateIntegrationRemainedFailClosed === true,
  'Nested blocked state fail-closed evidence missing',
)
assert(review.reviewedEvidence.syntheticNoMediaInputOnly === true, 'Synthetic no-media evidence missing')
assert(review.reviewedEvidence.noArtifactCreated === true, 'No artifact evidence missing')
for (const key of ['mediaRead', 'artifactWrite', 'workerDispatch', 'routeToolProviderCall', 'supabaseSql']) {
  assertFalse(review.reviewedEvidence[key], `review.reviewedEvidence.${key}`)
}
assert(
  review.acceptedForNextPlanning.blockedStateIntegrationReadinessPlanningMayProceed === true,
  'Next planning not accepted',
)
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
assert(review.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE44-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-INTEGRATION-READINESS-PLAN', 'next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase43Decision === sourceDecision, 'Accepted source decision mismatch')
assert(acceptance.acceptedEvidence.proofCommandPassed === true, 'Proof command pass missing')
assert(acceptance.acceptedEvidence.typecheckServerPassed === true, 'Typecheck acceptance missing')
assert(acceptance.acceptedEvidence.diagnosticsPassed === true, 'Diagnostics acceptance missing')
assert(acceptance.acceptedEvidence.temporaryProofFileRemoved === true, 'Temp removal acceptance missing')
assert(acceptance.acceptedEvidence.runtimeIntegrationBlockedResultFactoryInvoked === true, 'Factory acceptance missing')
assert(acceptance.acceptedEvidence.runtimeIntegrationBlockedAssertionInvoked === true, 'Assertion acceptance missing')
assert(acceptance.acceptedEvidence.nestedBlockedStateIntegrationRemainedFailClosed === true, 'Nested blocked-state acceptance missing')
assert(acceptance.acceptedEvidence.packageLockUnchanged === true, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be 0')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.futureBlockedStateIntegrationReadinessPlanning === true, 'Integration planning acceptance missing')
for (const key of ['runtimeExecution', 'realMediaProcessing', 'artifactDelivery', 'realUserMediaBeta', 'paidProduction']) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
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

assert(readiness.sourceDecision === expectedDecision, 'Phase 44 readiness source mismatch')
assert(readiness.phase44MayProceed === true, 'Phase 44 may proceed missing')
assert(readiness.phase44AllowedScope.planBlockedStateIntegrationReadiness === true, 'Phase 44 planning scope missing')
assert(readiness.phase44AllowedScope.noMediaInput === true, 'Phase 44 no-media scope missing')
assert(readiness.phase44StillBlocked.realMediaExecution === true, 'Real media blocker missing')
assert(readiness.phase44StillBlocked.paidProduction === true, 'Paid production blocker missing')

assert(blocker.decision === expectedDecision, 'Blocker decision mismatch')
assert(blocker.remainingBlocked.includes('real media input'), 'Real media blocker list missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker list missing')
assert(blocker.ownerReviewPassedWithWarnings === true, 'Owner review warning pass missing')

assert(claimPolicy.decision === expectedDecision, 'Claim policy decision mismatch')
assert(claimPolicy.allowedClaims.phase43ProofOwnerReviewed === true, 'Allowed owner-reviewed claim missing')
assert(
  claimPolicy.allowedClaims.blockedStateIntegrationReadinessPlanningMayProceed === true,
  'Allowed next planning claim missing',
)
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

assert(nextPrompt.owner === 'WORKER_RUNTIME_JOBS', 'Next prompt owner mismatch')
assert(nextPrompt.requiredSourceDecision === expectedDecision, 'Next prompt source decision mismatch')
assert(nextPrompt.allowedScope.docsDiagnosticsOnly === true, 'Next prompt docs-only scope missing')
assert(nextPrompt.allowedScope.noSupabaseSql === true, 'Next prompt no Supabase SQL scope missing')
assertSupabaseNoop(nextPrompt.supabaseClassification, 'nextPrompt')

const proofDoc = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.md',
  'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof',
)
assert(proofDoc.decision === sourceDecision, 'Merged Phase 43 proof decision missing')
assert(proofDoc.sourceVerification.sourcePr === 1756, 'Merged proof source PR mismatch')
assert(proofDoc.sourceVerification.sourceMergeCommit === 'f53996a5a509daf4f0ab9324f90811c4c4ad5dc8', 'Merged proof source merge mismatch')
assert(proofDoc.proof.temporaryProofFileRemovedBeforeStaging === true, 'Merged proof temp removal missing')
assert(proofDoc.proof.runtimeIntegrationBlockedResultFactoryInvoked === true, 'Merged proof factory evidence missing')
assert(proofDoc.proof.runtimeIntegrationBlockedAssertionInvoked === true, 'Merged proof assertion evidence missing')
assert(proofDoc.result.noArtifactCreated === true, 'Merged proof no-artifact evidence missing')
assertFalse(proofDoc.result.runtimeExecutionApproved, 'proofDoc.result.runtimeExecutionApproved')
assertFalse(proofDoc.result.realUserMediaBetaApproved, 'proofDoc.result.realUserMediaBetaApproved')
assertFalse(proofDoc.result.paidProductionApproved, 'proofDoc.result.paidProductionApproved')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must not exist')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1759,
      sourceMergeCommit,
      phase44BlockedStateIntegrationReadinessPlanMayProceed: true,
      realMediaExecutionToday: false,
      workerExecutionToday: false,
      artifactCreationToday: false,
      supabaseSqlToday: false,
      realUserMediaBetaToday: false,
      paidProductionToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE44-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-INTEGRATION-READINESS-PLAN',
    },
    null,
    2,
  ),
)
