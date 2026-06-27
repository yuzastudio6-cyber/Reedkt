import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_owner_review_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_execution_completion_decision_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_internal_runner_boundary_execution_proof_owner_review_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-acceptance-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-evidence-review-register-after-image-import-proof.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-boundary-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-evidence-register-after-image-import-proof.md',
  sourcePayload: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-payload-register-after-image-import-proof.md',
  sourceResult: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-result-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-claim-policy-after-image-import-proof.md'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-acceptance-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-evidence-review-register-after-image-import-proof')
const boundary = parseBlock(files.boundary, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-boundary-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-claim-policy-after-image-import-proof')
const sourceProof = parseBlock(files.sourceProof, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-evidence-register-after-image-import-proof')
const sourcePayload = parseBlock(files.sourcePayload, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-payload-register-after-image-import-proof')
const sourceResult = parseBlock(files.sourceResult, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-result-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-claim-policy-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [review, acceptance, evidence, boundary, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'controlled execution proof no longer passes')
assert(liveProof.acceptedToolCount === 15, 'live tool count mismatch')
assert(liveProof.allowPassedCount === 15, 'live allow count mismatch')
assert(liveProof.blockedPassedCount === 14, 'live blocked count mismatch')
assert(liveProof.failedFixtures.length === 0, 'live failed fixtures present')
assert(liveProof.productToolCallExecution === 'no', 'live product execution widened')
assert(liveProof.workerExecution === 'no', 'live worker execution widened')
assert(liveProof.internalBetaUnlock === 'no', 'live internal beta widened')

assert(review.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourcePr === 1228, 'source PR mismatch')
assert(review.sourceMergeCommit === '7c054acdb5dac6e91d4599dbc852ecd34dddedd5', 'source merge mismatch')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'review tool count mismatch')
assert(review.acceptedEvidence.allowPassedCount === 15, 'review allow count mismatch')
assert(review.acceptedEvidence.blockedPassedCount === 14, 'review blocked count mismatch')
assert(review.acceptedEvidence.failedFixtureCount === 0, 'review failed count widened')
assert(review.acceptedEvidence.requiredFieldCount === 9, 'review required count mismatch')
assert(review.acceptedEvidence.runtimeFlagsRequiredFalseCount === 3, 'review false flags mismatch')
assert(review.acceptedEvidence.productExecutionAuthorizedCount === 0, 'product execution widened')
assert(review.acceptedEvidence.workerExecutionAuthorizedCount === 0, 'worker execution widened')
assert(review.acceptedEvidence.internalBetaUnlockCount === 0, 'internal beta widened')
assert(review.acceptedEvidence.externalBetaReadyCount === 0, 'external beta widened')
assert(review.acceptedEvidence.productionReadyCount === 0, 'production widened')
assert(review.acceptedForToday.limitedInternalRunnerBoundaryExecutionCompletionDecisionPlanning === 'yes', 'completion decision planning not accepted')

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
  assert(review.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(acceptance.counts.acceptedCompletionDecisionPlanningItemCount === 9, 'acceptance count mismatch')
assert(acceptance.counts.notAcceptedForExecutionTodayCount === 22, 'non-acceptance count mismatch')
assert(acceptance.counts.acceptedForProductExecutionTodayCount === 0, 'product execution count widened')
assert(acceptance.counts.acceptedForWorkerExecutionTodayCount === 0, 'worker execution count widened')
assert(acceptance.counts.acceptedForInternalBetaTodayCount === 0, 'internal beta count widened')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta count widened')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production count widened')

assert(evidence.sourceEvidence.controlledExecutionProofPr === 1228, 'evidence source PR mismatch')
assert(evidence.reviewedProofEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.reviewedProofEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.reviewedProofEvidence.blockedPassedCount === 14, 'evidence blocked count mismatch')
assert(evidence.reviewedProofEvidence.failedFixtureCount === 0, 'evidence failed count widened')
assert(evidence.notEvidenceFor.includes('generated_local_fixture_passed'), 'generated fixture non-evidence missing')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run non-evidence missing')
assert(evidence.evidenceStatus === 'accepted_for_limited_internal_runner_boundary_execution_completion_decision_planning_only', 'evidence status widened')

assert(boundary.boundary.limitedInternalRunnerBoundaryExecutionCompletionDecisionPlanningMayProceed === true, 'completion planning boundary missing')
for (const key of [
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

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 4, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product blocker widened')
assert(blockers.nextBlocker.recommendedPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-LIMITED-INTERNAL-RUNNER-BOUNDARY-EXECUTION-COMPLETION-DECISION-AFTER-IMAGE-IMPORT-PROOF', 'next prompt mismatch')

assert(policy.allowedClaims.limitedInternalRunnerBoundaryExecutionCompletionDecisionMayProceed === true, 'allowed completion decision claim missing')
assert(policy.allowedClaims.controlledLimitedInternalRunnerBoundaryExecutionProofPassed === true, 'allowed proof claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.allowPassedCount === 15, 'allowed allow count mismatch')
assert(policy.allowedClaims.forbiddenPayloadStopCount === 14, 'allowed stop count mismatch')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count widened')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(sourceProof.sourcePr === 1224, 'source proof upstream PR mismatch')
assert(sourceProof.sourceMergeCommit === 'b04e7f27520ed7c860690f709d54385c1ebb009f', 'source proof upstream merge mismatch')
assert(sourceProof.result.allowPassedCount === 15, 'source proof allow count mismatch')
assert(sourceProof.result.blockedPassedCount === 14, 'source proof blocked count mismatch')
assert(sourceProof.result.failedFixtureCount === 0, 'source proof failed count widened')
assert(sourceProof.scope.productToolCallExecution === 'no', 'source product execution widened')
assert(sourceEvidence.proofEvidence.failedFixtureCount === 0, 'source evidence failed widened')
assert(sourcePayload.counts.permittedProductPayloadFamilyCountToday === 0, 'source payload product count widened')
assert(sourceResult.toolResultCounts.productExecutionReadyCount === 0, 'source result product execution widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof-diagnostics.mjs',
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
  '"acceptedForWorkerExecutionTodayCount": 15',
  '"acceptedForInternalBetaTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"acceptedForProductionTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled',
  'production ready'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_limited_internal_runner_boundary_execution_proof_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.acceptedEvidence.acceptedSoundCpuToolCount,
      allowPassedCount: review.acceptedEvidence.allowPassedCount,
      blockedPassedCount: review.acceptedEvidence.blockedPassedCount,
      failedFixtureCount: review.acceptedEvidence.failedFixtureCount,
      productExecutionAuthorizedCount: review.acceptedEvidence.productExecutionAuthorizedCount,
      workerExecutionAuthorizedCount: review.acceptedEvidence.workerExecutionAuthorizedCount,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
