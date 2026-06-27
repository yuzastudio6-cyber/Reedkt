import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_preflight_proof_owner_review_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_completion_decision_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_preflight_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_preflight_proof_owner_review_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-acceptance-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-evidence-review-register-after-image-import-proof.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-boundary-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-review-after-image-import-proof.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-after-image-import-proof.md',
  sourceAllowlist: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-allowlist-register-after-image-import-proof.md',
  sourceStops: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-stop-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-evidence-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-claim-policy-after-image-import-proof.md'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-acceptance-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-evidence-review-register-after-image-import-proof')
const boundary = parseBlock(files.boundary, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-boundary-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-claim-policy-after-image-import-proof')
const sourceProof = parseBlock(files.sourceProof, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-after-image-import-proof')
const sourceAllowlist = parseBlock(files.sourceAllowlist, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-allowlist-register-after-image-import-proof')
const sourceStops = parseBlock(files.sourceStops, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-stop-register-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-evidence-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-claim-policy-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [review, acceptance, evidence, boundary, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'source live proof did not pass')
assert(liveProof.decision === sourceDecision, 'source live proof decision mismatch')
assert(liveProof.acceptedToolCount === 15, 'source live proof tool count mismatch')
assert(liveProof.allowPassedCount === 15, 'source live proof allow count mismatch')
assert(liveProof.blockedPassedCount === 14, 'source live proof block count mismatch')
assert(liveProof.failedFixtures.length === 0, 'source live proof failures present')

for (const key of [
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaFileOpen',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(liveProof[key] === 'no', `source live proof ${key} widened`)
}

assert(review.sourceDecision === sourceDecision, 'review source decision mismatch')
assert(review.sourcePr === 1213, 'review source PR mismatch')
assert(review.sourceMergeCommit === 'aac504bb722af8af0833823b4eb7d75ba7e0df17', 'review source merge mismatch')
assert(review.acceptedEvidence.controlledSyntheticProof === 'accepted_for_limited_internal_completion_decision_planning_only', 'review evidence widened')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'review tool count mismatch')
assert(review.acceptedEvidence.allowPassedCount === 15, 'review allow count mismatch')
assert(review.acceptedEvidence.blockedPassedCount === 14, 'review block count mismatch')
assert(review.acceptedEvidence.failedFixtureCount === 0, 'review failed count mismatch')
assert(review.acceptedEvidence.productExecutionAuthorizedCount === 0, 'review product execution widened')
assert(review.acceptedEvidence.internalBetaUnlockCount === 0, 'review internal beta widened')
assert(review.acceptedEvidence.externalBetaReadyCount === 0, 'review external beta widened')
assert(review.acceptedEvidence.productionReadyCount === 0, 'review production widened')
assert(review.acceptedForToday.limitedInternalRunnerBoundaryPreflightCompletionDecisionPlanning === 'yes', 'completion decision planning not accepted')

for (const key of [
  'limitedInternalRunnerBoundaryPreflightExecution',
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaFileOpen',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(review.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(acceptance.acceptedForCompletionDecisionPlanning.length === 8, 'accepted completion item count mismatch')
assert(acceptance.counts.acceptedCompletionDecisionPlanningItemCount === 8, 'accepted completion count mismatch')
assert(acceptance.counts.acceptedForProductExecutionTodayCount === 0, 'product execution accepted')
assert(acceptance.counts.acceptedForInternalBetaTodayCount === 0, 'internal beta accepted')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta accepted')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production accepted')

assert(evidence.sourceEvidence.controlledProofPr === 1213, 'evidence source PR mismatch')
assert(evidence.reviewedProofEvidence.proofStatus === 'passed', 'evidence proof status mismatch')
assert(evidence.reviewedProofEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.reviewedProofEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.reviewedProofEvidence.blockedPassedCount === 14, 'evidence block count mismatch')
assert(evidence.reviewedProofEvidence.failedFixtureCount === 0, 'evidence failed count mismatch')
assert(evidence.evidenceStatus === 'accepted_for_limited_internal_completion_decision_planning_only', 'evidence status widened')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run not-evidence missing')

assert(boundary.boundary.limitedInternalCompletionDecisionPlanningMayProceed === true, 'completion planning boundary missing')
for (const key of [
  'limitedInternalRunnerBoundaryPreflightExecutionReadyToday',
  'productToolCallExecutionReadyToday',
  'workerExecutionReadyToday',
  'routeExecutionReadyToday',
  'mediaFileOpenReadyToday',
  'mediaProcessingReadyToday',
  'artifactDeliveryReadyToday',
  'supabaseSqlReadyToday',
  'providerModelCallReadyToday',
  'dockerGcpReadyToday',
  'internalBetaUnlockedToday',
  'externalBetaReadyToday',
  'productionReadyToday'
]) {
  assert(boundary.boundary[key] === false, `${key} widened`)
}
assert(boundary.counts.readyForExecutionTodayCount === 0, 'execution readiness widened')
assert(boundary.counts.readyForInternalBetaTodayCount === 0, 'internal beta readiness widened')
assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 4, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product execution blocker count widened')

assert(policy.allowedClaims.controlledSyntheticProofOwnerReviewPassed === true, 'allowed review claim missing')
assert(policy.allowedClaims.completionDecisionPlanningMayProceed === true, 'completion planning claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(sourceProof.result.allowPassedCount === 15, 'source proof allow pass mismatch')
assert(sourceProof.result.blockedPassedCount === 14, 'source proof block pass mismatch')
assert(sourceProof.result.failedFixtures.length === 0, 'source proof failed fixtures widened')
assert(sourceProof.scope.productToolCallExecution === 'no', 'source proof product execution widened')
assert(sourceProof.scope.internalBetaUnlock === 'no', 'source proof internal beta widened')
assert(sourceAllowlist.productToolCallExecutionApprovedToday === false, 'source allowlist product execution widened')
assert(sourceStops.blockedFixtureResult.blockedPassedCount === 14, 'source stops block count mismatch')
assert(sourceEvidence.evidenceStatus === 'accepted_for_owner_review_only', 'source evidence status mismatch')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-review-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-preflight-proof-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"mediaFileOpen": "yes"',
  '"mediaProcessing": "yes"',
  '"artifactWrites": "yes"',
  '"supabaseSql": "yes"',
  '"internalBetaUnlock": "yes"',
  '"externalBetaUnlock": "yes"',
  '"productionUnlock": "yes"',
  '"acceptedForProductExecutionTodayCount": 15',
  '"acceptedForInternalBetaTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"acceptedForProductionTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_preflight_proof_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      allowPassedCount: review.acceptedEvidence.allowPassedCount,
      blockedPassedCount: review.acceptedEvidence.blockedPassedCount,
      failedFixtureCount: review.acceptedEvidence.failedFixtureCount,
      productExecutionAuthorizedCount: review.acceptedEvidence.productExecutionAuthorizedCount,
      internalBetaUnlockedToday: boundary.boundary.internalBetaUnlockedToday,
      externalBetaReadyToday: boundary.boundary.externalBetaReadyToday,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
