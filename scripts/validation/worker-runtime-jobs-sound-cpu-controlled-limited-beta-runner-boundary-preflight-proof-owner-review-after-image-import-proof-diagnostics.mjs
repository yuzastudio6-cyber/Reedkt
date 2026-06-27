import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_beta_runner_boundary_preflight_proof_owner_review_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_decision_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_beta_runner_boundary_preflight_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_beta_runner_boundary_preflight_proof_owner_review_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-acceptance-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-evidence-review-register-after-image-import-proof.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-boundary-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof.md',
  sourceProof: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof.md',
  sourceAllowlist: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-allowlist-register-after-image-import-proof.md',
  sourceStops: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-stop-register-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-evidence-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-claim-policy-after-image-import-proof.md'
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

const review = parseBlock(
  files.review,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof'
)
const acceptance = parseBlock(
  files.acceptance,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-acceptance-register-after-image-import-proof'
)
const evidence = parseBlock(
  files.evidence,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-evidence-review-register-after-image-import-proof'
)
const boundary = parseBlock(
  files.boundary,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-boundary-register-after-image-import-proof'
)
const blockers = parseBlock(
  files.blockers,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-blocker-register-after-image-import-proof'
)
const policy = parseBlock(
  files.policy,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-claim-policy-after-image-import-proof'
)
const sourceProof = parseBlock(
  files.sourceProof,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof'
)
const sourceAllowlist = parseBlock(
  files.sourceAllowlist,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-allowlist-register-after-image-import-proof'
)
const sourceStops = parseBlock(
  files.sourceStops,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-stop-register-after-image-import-proof'
)
const sourceEvidence = parseBlock(
  files.sourceEvidence,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-evidence-register-after-image-import-proof'
)
const sourcePolicy = parseBlock(
  files.sourcePolicy,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-claim-policy-after-image-import-proof'
)

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [review, acceptance, evidence, boundary, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'source live proof did not pass')
assert(liveProof.allowPassedCount === 15, 'source live proof allow count mismatch')
assert(liveProof.blockedPassedCount === 14, 'source live proof block count mismatch')
assert(liveProof.failedFixtures.length === 0, 'source live proof failures present')

assert(review.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourcePr === 1199, 'source PR mismatch')
assert(review.sourceMergeCommit === '7fd1d20a6649b807bebcae14342f0ba202baaa06', 'source merge mismatch')
assert(review.acceptedEvidence.controlledSyntheticProof === 'accepted_for_limited_internal_decision_planning_only', 'review acceptance widened')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.acceptedEvidence.allowPassedCount === 15, 'allow pass count mismatch')
assert(review.acceptedEvidence.blockedPassedCount === 14, 'block pass count mismatch')
assert(review.acceptedEvidence.failedFixtureCount === 0, 'failed fixture count widened')
assert(review.acceptedEvidence.productExecutionAuthorizedCount === 0, 'product execution widened')
assert(review.acceptedEvidence.externalBetaReadyCount === 0, 'external beta widened')
assert(review.acceptedEvidence.productionReadyCount === 0, 'production widened')
assert(review.acceptedEvidence.sanitizedEvidenceOnly === true, 'sanitized evidence missing')
assert(review.acceptedForToday.limitedInternalRunnerBoundaryPreflightDecisionPlanning === 'yes', 'decision planning not accepted')

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
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(review.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(acceptance.acceptedForDecisionPlanning.length === 7, 'accepted decision planning count mismatch')
assert(acceptance.counts.acceptedDecisionPlanningItemCount === 7, 'accepted decision planning count mismatch')
assert(acceptance.counts.notAcceptedForExecutionTodayCount === 17, 'not accepted execution count mismatch')
assert(acceptance.counts.acceptedForProductExecutionTodayCount === 0, 'product execution accepted')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta accepted')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production accepted')

assert(evidence.sourceEvidence.controlledProofPr === 1199, 'evidence source PR mismatch')
assert(evidence.reviewedProofEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.reviewedProofEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.reviewedProofEvidence.blockedPassedCount === 14, 'evidence block count mismatch')
assert(evidence.reviewedProofEvidence.failedFixtureCount === 0, 'evidence failed count mismatch')
assert(evidence.reviewedProofEvidence.syntheticPayloadFixturesOnly === true, 'synthetic evidence missing')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run not-evidence missing')
assert(evidence.evidenceStatus === 'accepted_for_limited_internal_decision_planning_only', 'evidence status widened')

assert(boundary.boundary.limitedInternalDecisionPlanningMayProceed === true, 'decision planning boundary missing')
for (const key of [
  'limitedInternalRunnerBoundaryPreflightReadyToday',
  'productToolCallExecutionReadyToday',
  'workerExecutionReadyToday',
  'routeExecutionReadyToday',
  'mediaFileOpenReadyToday',
  'mediaProcessingReadyToday',
  'artifactDeliveryReadyToday',
  'supabaseSqlReadyToday',
  'providerModelCallReadyToday',
  'dockerGcpReadyToday',
  'externalBetaReadyToday',
  'productionReadyToday'
]) {
  assert(boundary.boundary[key] === false, `${key} widened`)
}
assert(boundary.counts.decisionPrerequisiteCount === 7, 'decision prerequisite count mismatch')
assert(boundary.counts.readyForExecutionTodayCount === 0, 'execution readiness widened')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product execution blocker count widened')

assert(policy.allowedClaims.controlledSyntheticProofOwnerReviewPassed === true, 'allowed review claim missing')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count mismatch')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(sourceProof.sourcePr === 1198, 'source proof upstream PR mismatch')
assert(sourceProof.result.allowPassedCount === 15, 'source proof allow pass mismatch')
assert(sourceProof.result.blockedPassedCount === 14, 'source proof block pass mismatch')
assert(sourceProof.result.failedFixtures.length === 0, 'source proof failed fixtures widened')
assert(sourceProof.scope.productToolCallExecution === 'no', 'source proof product execution widened')
assert(sourceAllowlist.productToolCallExecutionApprovedToday === false, 'source allowlist product execution widened')
assert(sourceStops.blockedFixtureResult.blockedPassedCount === 14, 'source stops block count mismatch')
assert(sourceEvidence.evidenceStatus === 'accepted_for_owner_review_only', 'source evidence status mismatch')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const jsonTrue = (key) => `"${key}"` + ': true'
const jsonYes = (key) => `"${key}"` + ': "yes"'
const jsonCount = (key, count) => `"${key}"` + `: ${count}`
const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  jsonTrue('productToolCallExecutionReadyToday'),
  jsonTrue('workerExecutionReadyToday'),
  jsonTrue('externalBetaReadyToday'),
  jsonTrue('productionReadyToday'),
  jsonYes('productToolCallExecution'),
  jsonYes('workerExecution'),
  jsonYes('mediaFileOpen'),
  jsonYes('supabaseSql'),
  jsonCount('acceptedForProductExecutionTodayCount', 15),
  jsonCount('acceptedForExternalBetaTodayCount', 15),
  jsonCount('acceptedForProductionTodayCount', 15),
  jsonYes('sqlExecuted'),
  'Docker push ' + 'enabled',
  'Docker run ' + 'enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_limited_beta_runner_boundary_preflight_proof_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      allowPassedCount: review.acceptedEvidence.allowPassedCount,
      blockedPassedCount: review.acceptedEvidence.blockedPassedCount,
      failedFixtureCount: review.acceptedEvidence.failedFixtureCount,
      productExecutionAuthorizedCount: review.acceptedEvidence.productExecutionAuthorizedCount,
      externalBetaReadyToday: boundary.boundary.externalBetaReadyToday,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
