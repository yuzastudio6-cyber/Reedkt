import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_next_scope_review_after_dry_run_passed_with_warnings_ready_for_tool_call_runtime_readiness_refresh_no_external_beta'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-TOOL-CALL-RUNTIME-READINESS-REFRESH-AFTER-INTERNAL-DRY-RUN: refresh product tool-call/runtime readiness after bounded internal dry-run, no external beta'
const descriptorDigest = '278afb2895eeebdbb433b858fa6df87e966d2dcf4d21826380e11956121ce81a'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-review-after-dry-run.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-source-register-after-dry-run.md',
  laneReview: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-existing-lane-review-after-dry-run.md',
  selectedAction: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-selected-action-after-dry-run.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-blocker-register-after-dry-run.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-claim-policy-after-dry-run.md',
  nextPromptFile:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-after-internal-dry-run.md',
  sourceOwnerReview:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-after-execution.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-acceptance-register-after-execution.md',
  sourceDryRun: 'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-result-after-plan-review.md',
  productBetaGap: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  toolCallProof:
    'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  toolCallOwnerReview:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  packageJson: 'package.json'
}

const labels = {
  review: 'worker-runtime-jobs-sound-cpu-internal-beta-next-scope-review-after-dry-run',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-internal-beta-next-scope-source-register-after-dry-run',
  laneReview:
    'worker-runtime-jobs-sound-cpu-internal-beta-next-scope-existing-lane-review-after-dry-run',
  selectedAction:
    'worker-runtime-jobs-sound-cpu-internal-beta-next-scope-selected-action-after-dry-run',
  blocker: 'worker-runtime-jobs-sound-cpu-internal-beta-next-scope-blocker-register-after-dry-run',
  claimPolicy: 'worker-runtime-jobs-sound-cpu-internal-beta-next-scope-claim-policy-after-dry-run'
}

const expectedToolIds = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm'
]

const forbiddenText = [
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"acceptedForExternalBeta": true',
  '"acceptedForProductToolCallExecution": true',
  '"acceptedForRuntimeReadiness": true',
  '"mayUnlockExternalBetaToday": true',
  '"mayClaimProductToolCallExecutionReadyToday": true',
  '"mayClaimRuntimeReadinessToday": true',
  '"mayClaimBroadDryRunPassedToday": true',
  '"productToolCallExecutionReady": true',
  '"workerExecutionReady": true',
  '"routeExecutionReady": true',
  '"runtimeReadinessClaimed": true',
  '"mediaReadinessClaimed": true',
  '"generatedLocalFixturePassedClaimed": true',
  '"dryRunPassedClaimed": true',
  '"supabaseTouched": true',
  '"sqlExecuted": true',
  '"artifactWritten": true',
  '"creditMutated": true',
  '"stripeProcessed": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'BEGIN RSA',
  'BEGIN OPENSSH'
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonFence(markdown, label) {
  const fence = '```json ' + label
  const start = markdown.indexOf(fence)
  assert(start !== -1, `Missing JSON fence: ${label}`)
  const jsonStart = markdown.indexOf('\n', start)
  const end = markdown.indexOf('```', jsonStart + 1)
  assert(jsonStart !== -1 && end !== -1, `Unclosed JSON fence: ${label}`)
  return JSON.parse(markdown.slice(jsonStart + 1, end).trim())
}

function assertFalseObject(value, label) {
  for (const [key, entry] of Object.entries(value)) {
    assert(entry === false, `${label}.${key} must remain false`)
  }
}

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value.nextAction === 'none', `${label}.nextAction must be none`)
}

const docs = Object.fromEntries(Object.entries(files).map(([key, relativePath]) => [key, read(relativePath)]))

for (const [key, text] of Object.entries(docs)) {
  for (const forbidden of forbiddenText) {
    assert(!text.includes(forbidden), `Forbidden widened claim or secret marker found in ${key}: ${forbidden}`)
  }
}

const parsed = Object.fromEntries(
  Object.entries(labels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
)

for (const key of ['review', 'sourceRegister', 'laneReview', 'selectedAction', 'blocker', 'claimPolicy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`)
}

assert(
  docs.packageJson.includes(
    '"worker-runtime-jobs:sound-cpu-internal-beta-next-scope-review-after-dry-run:diagnostics": "node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-review-after-dry-run-diagnostics.mjs"'
  ),
  'package script missing'
)
assert(docs.nextPromptFile.includes('Expected decision if the refresh can advance planning only'), 'next prompt missing expected decision')

assert(parsed.review.sourceVerification.sourceHead === 'a790cad3ecd82a5de715cd2251fe5f1862a29d32', 'source head mismatch')
assert(parsed.review.sourceVerification.pr1357.merged === true, 'PR #1357 merge evidence missing')
assert(parsed.review.sourceVerification.pr1357.mergeCommit === 'a790cad3ecd82a5de715cd2251fe5f1862a29d32', 'PR #1357 merge commit mismatch')
assert(parsed.review.sourceVerification.pr1353.mergeCommit === '2b61263c4db72712e02c59951b2861ecd2947964', 'PR #1353 merge commit mismatch')
assert(parsed.review.acceptedDryRunEvidence.soundCpuToolCount === 15, 'SOUND CPU tool count mismatch')
assert(parsed.review.acceptedDryRunEvidence.syntheticDescriptorCount === 15, 'descriptor count mismatch')
assert(parsed.review.acceptedDryRunEvidence.passed === 15, 'passed count mismatch')
assert(parsed.review.acceptedDryRunEvidence.failed === 0, 'failed count mismatch')
assert(parsed.review.acceptedDryRunEvidence.descriptorDigest === descriptorDigest, 'descriptor digest mismatch')
assert(parsed.review.acceptedDryRunEvidence.acceptedForNextInternalScopeReview === true, 'next internal scope acceptance missing')
for (const key of [
  'acceptedForExternalBeta',
  'acceptedForProduction',
  'acceptedForProductToolCallExecution',
  'acceptedForRuntimeReadiness'
]) {
  assert(parsed.review.acceptedDryRunEvidence[key] === false, `Dry-run evidence widened ${key}`)
}
assert(parsed.review.currentReadinessSnapshot.productBetaPlanningGapsClosed === 8, 'closed planning gap count mismatch')
assert(parsed.review.currentReadinessSnapshot.productBetaPlanningGapsRemaining === 0, 'remaining planning gap count mismatch')
assert(parsed.review.currentReadinessSnapshot.existingNoMediaNoArtifactToolCallProofPassedCount === 15, 'tool-call proof count mismatch')
for (const key of [
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'mediaReadinessReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) {
  assert(parsed.review.currentReadinessSnapshot[key] === 0, `Readiness count widened ${key}`)
}
assert(parsed.review.currentReadinessSnapshot.prodBetaExternalBetaAllowed === false, 'external beta widened')
assert(parsed.review.reviewOutcome.nextPrompt === nextPrompt, 'next prompt mismatch')
assert(parsed.review.reviewOutcome.mayProceedToNextBlockerClosure === true, 'next blocker closure not allowed')
assert(parsed.review.reviewOutcome.mayUnlockExternalBetaToday === false, 'external beta unlock widened')
assert(parsed.review.reviewOutcome.mayClaimProductToolCallExecutionReadyToday === false, 'tool-call readiness widened')
assert(parsed.review.reviewOutcome.mayClaimRuntimeReadinessToday === false, 'runtime readiness widened')
assert(parsed.review.reviewOutcome.mayClaimBroadDryRunPassedToday === false, 'dry-run claim widened')
assertSupabaseNoop(parsed.review.supabaseClassification, 'review')

const sourceEntries = parsed.sourceRegister.sourceRegister
assert(sourceEntries.length === 6, 'source register count mismatch')
assert(sourceEntries.some((entry) => entry.source === 'PR #1357' && entry.mergeCommit === 'a790cad3ecd82a5de715cd2251fe5f1862a29d32'), 'PR #1357 source missing')
assert(sourceEntries.some((entry) => entry.source === 'PR #1353' && entry.mergeCommit === '2b61263c4db72712e02c59951b2861ecd2947964'), 'PR #1353 source missing')
for (const entry of sourceEntries) assert(entry.executionAuthorizedByThisPacket === false, `source execution widened: ${entry.source}`)
assert(parsed.sourceRegister.sourceConclusion.soundCpuToolsWithEvidence === 15, 'source conclusion tool count mismatch')
assert(parsed.sourceRegister.sourceConclusion.productToolCallExecutionApprovedToday === false, 'product execution widened')
assert(parsed.sourceRegister.sourceConclusion.externalBetaApprovedToday === false, 'external beta widened in source conclusion')

const laneReview = parsed.laneReview.laneReview
assert(laneReview.some((lane) => lane.selectedAsNext === true && lane.lane === 'controlled_no_media_no_artifact_tool_call_readiness_proof_after_image_import_proof'), 'selected lane mismatch')
assert(parsed.laneReview.laneReviewConclusion.samePurposeDuplicateFound === false, 'duplicate risk widened')
assert(parsed.laneReview.laneReviewConclusion.otherChatWorkAcknowledged === true, 'other chat review missing')

assert(parsed.selectedAction.selectedAction.promptId === 'WORKER_RUNTIME_JOBS-SOUND-CPU-TOOL-CALL-RUNTIME-READINESS-REFRESH-AFTER-INTERNAL-DRY-RUN', 'selected prompt id mismatch')
assert(parsed.selectedAction.selectedAction.mayProceed === true, 'selected action mayProceed missing')
assert(parsed.selectedAction.selectedAction.executionAllowed === false, 'selected action execution widened')
assert(parsed.selectedAction.selectedAction.externalBetaAllowed === false, 'selected action beta widened')
assert(parsed.selectedAction.notSelectedActions.length === 4, 'not selected action count mismatch')
for (const action of parsed.selectedAction.notSelectedActions) assert(action.mayProceed === false, `not selected action widened: ${action.action}`)

assert(parsed.blocker.blockers.length === 5, 'blocker count mismatch')
assert(parsed.blocker.blockerSummary.selectedFirstBlocker === 'product_tool_call_runtime_readiness_refresh_needed', 'selected blocker mismatch')
assert(parsed.blocker.blockerSummary.externalBetaRemainsBlocked === true, 'external beta blocker missing')
assert(parsed.blocker.blockerSummary.productionRemainsBlocked === true, 'production blocker missing')

assert(parsed.claimPolicy.allowedClaims.length === 5, 'allowed claim count mismatch')
for (const required of [
  'external beta ready',
  'product tool-call execution ready',
  'runtime readiness',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assertFalseObject(parsed.claimPolicy.closedFlags, 'claimPolicy.closedFlags')
assertSupabaseNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy')

for (const toolId of expectedToolIds) {
  assert(docs.sourceAcceptance.includes(toolId), `source acceptance register missing tool id ${toolId}`)
}
assert(docs.sourceOwnerReview.includes(descriptorDigest), 'source owner review digest missing')
assert(docs.sourceDryRun.includes(descriptorDigest), 'source dry-run digest missing')
assert(
  docs.productBetaGap.includes(
    'worker_runtime_jobs_sound_cpu_product_beta_readiness_gap_closure_completed_with_warnings_all_planning_gaps_closed_runtime_beta_blocked'
  ),
  'product beta gap decision missing'
)
assert(
  docs.toolCallProof.includes(
    'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_tool_call_readiness_proof_after_image_import_proof_passed_with_warnings_ready_for_tool_call_readiness_owner_review_after_image_import_proof'
  ),
  'tool call proof decision missing'
)
assert(docs.toolCallOwnerReview.includes('"productToolCallExecution": "no"'), 'tool-call owner product execution boundary widened or missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceHead: parsed.review.sourceVerification.sourceHead,
      soundCpuToolsWithEvidence: parsed.review.acceptedDryRunEvidence.soundCpuToolCount,
      selectedNextPrompt: parsed.review.reviewOutcome.nextPrompt,
      productToolCallExecutionReadyCount: parsed.review.currentReadinessSnapshot.productToolCallExecutionReadyCount,
      externalBetaAllowed: parsed.review.currentReadinessSnapshot.prodBetaExternalBetaAllowed
    },
    null,
    2
  )
)
