import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_decision_plan_after_runner_boundary_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-acceptance-register-after-runner-boundary-execution-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-evidence-review-register-after-runner-boundary-execution-proof.md',
  internalBeta: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-internal-beta-decision-readiness-register-after-runner-boundary-execution-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-blocker-register-after-runner-boundary-execution-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-after-runner-boundary-execution-proof.md',
  sourcePreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof.md',
  sourceValidation: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-dependency-validation-register.md',
  sourceTools: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-tool-boundary-register.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-blocker-register.md',
  sourceDuplicates: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-duplicate-register.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-claim-policy.md'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-acceptance-register-after-runner-boundary-execution-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-evidence-review-register-after-runner-boundary-execution-proof')
const internalBeta = parseBlock(files.internalBeta, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-internal-beta-decision-readiness-register-after-runner-boundary-execution-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-blocker-register-after-runner-boundary-execution-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-claim-policy-after-runner-boundary-execution-proof')
const sourcePreflight = parseBlock(files.sourcePreflight, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof')
const sourceValidation = parseBlock(files.sourceValidation, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-dependency-validation-register')
const sourceTools = parseBlock(files.sourceTools, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-tool-boundary-register')
const sourceBlockers = parseBlock(files.sourceBlockers, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-blocker-register')
const sourceDuplicates = parseBlock(files.sourceDuplicates, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-duplicate-register')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof-claim-policy')

read(files.nextPrompt)

for (const row of [review, acceptance, evidence, internalBeta, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(review.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourcePr === 1258, 'source PR mismatch')
assert(review.sourceMergeCommit === '119f843f088833e4ee9e875db0b638585b6c21c3', 'source merge mismatch')
assert(review.ownerReviewResult.controlledRuntimeBetaPreflightAccepted === true, 'preflight not accepted')
assert(review.ownerReviewResult.dependencyBackedStaticValidationAccepted === true, 'dependency validation not accepted')
assert(review.ownerReviewResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.ownerReviewResult.duplicateToolCallReadinessLaneCreated === false, 'duplicate lane widened')
assert(review.ownerReviewResult.internalBetaDecisionPlanningMayProceed === true, 'internal beta planning not allowed')

for (const key of [
  'internalBetaUnlockedToday',
  'externalBetaUnlockedToday',
  'productionUnlockedToday',
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'dockerGcpApprovedToday'
]) {
  assert(review.ownerReviewResult[key] === false, `${key} widened`)
}

assert(acceptance.acceptedForNextPlanning.internalBetaDecisionPlanning === 'yes', 'internal beta planning acceptance missing')
for (const value of Object.values(acceptance.acceptedForToday)) assert(value === 'no', 'today acceptance widened')
assert(acceptance.counts.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(acceptance.counts.acceptedForInternalBetaDecisionPlanningCount === 15, 'internal beta planning count mismatch')
assert(acceptance.counts.acceptedForInternalBetaTodayCount === 0, 'internal beta count widened')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta count widened')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production count widened')

assert(evidence.sourceEvidence.sourcePr === 1258, 'evidence source PR mismatch')
assert(evidence.sourceEvidence.sourceMergeCommit === '119f843f088833e4ee9e875db0b638585b6c21c3', 'evidence source merge mismatch')
assert(evidence.sourceEvidence.sourcePreflightDependencyBacked === true, 'source dependency evidence missing')
assert(evidence.sourceEvidence.sourceAcceptedToolCount === 15, 'source tool count mismatch')
assert(evidence.sourceEvidence.sourceDuplicateLaneCreated === false, 'source duplicate widened')
assert(evidence.sourceEvidence.sourceProductExecutionPerformed === false, 'source product execution widened')
assert(evidence.validationHandoffAccepted.diagnosticsPassed === true, 'diagnostics handoff missing')
assert(evidence.validationHandoffAccepted.readinessSummariesPreservedBlockedStatus === true, 'readiness handoff missing')

assert(internalBeta.internalBetaDecisionPlanning.mayProceed === true, 'internal beta decision planning not ready')
assert(internalBeta.externalBetaDecisionPlanning.mayProceedToday === false, 'external beta planning widened')
assert(internalBeta.counts.internalBetaPlanningReadyCount === 1, 'internal beta planning count mismatch')
assert(internalBeta.counts.internalBetaUnlockedCount === 0, 'internal beta unlocked count widened')
assert(internalBeta.counts.externalBetaUnlockedCount === 0, 'external beta unlocked count widened')

assert(blockers.resolvedForPlanning.length === 3, 'resolved blocker count mismatch')
assert(blockers.remainingBeforeInternalBetaUnlock.includes('internal_beta_decision_plan_after_runner_boundary_execution_proof'), 'internal beta decision blocker missing')
assert(blockers.remainingBeforeExternalBeta.includes('production_readiness_gate'), 'production blocker missing')
assert(blockers.counts.internalBetaBlockingCount === 5, 'internal beta blocker count mismatch')
assert(blockers.counts.externalBetaBlockingCount === 5, 'external beta blocker count mismatch')

for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'product tool-call execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourcePreflight.decision === sourceDecision, 'source preflight decision mismatch')
assert(sourcePreflight.sourcePr === 1250, 'source preflight source PR mismatch')
assert(sourcePreflight.preflightResult.dependencyBackedPreflightPassed === true, 'source preflight not dependency-backed')
assert(sourcePreflight.preflightResult.acceptedSoundCpuToolCount === 15, 'source preflight tool count mismatch')
assert(sourcePreflight.preflightResult.productToolCallExecutionPerformed === false, 'source product execution widened')
assert(sourcePreflight.preflightResult.internalBetaUnlockedToday === false, 'source internal beta widened')
assert(sourcePreflight.preflightResult.externalBetaUnlockedToday === false, 'source external beta widened')
assert(sourceValidation.packageLockHash === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'source package lock mismatch')
assert(sourceTools.counts.acceptedForControlledRuntimeBetaPreflightPlanningCount === 15, 'source tool planning count mismatch')
assert(sourceTools.counts.acceptedForProductExecutionTodayCount === 0, 'source product count widened')
assert(sourceBlockers.remainingBeforeInternalBeta.includes('runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof'), 'source owner review blocker missing')
assert(sourceDuplicates.counts.duplicateLaneCreatedCount === 0, 'source duplicate count widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"internalBetaUnlockedToday": true',
  '"externalBetaUnlockedToday": true',
  '"productionUnlockedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"dockerGcpApprovedToday": true',
  '"acceptedForInternalBetaTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"sqlExecuted": "yes"',
  'external beta ready true',
  'production ready true'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.ownerReviewResult.acceptedSoundCpuToolCount,
      internalBetaDecisionPlanningMayProceed: review.ownerReviewResult.internalBetaDecisionPlanningMayProceed,
      internalBetaUnlockedToday: review.ownerReviewResult.internalBetaUnlockedToday,
      externalBetaUnlockedToday: review.ownerReviewResult.externalBetaUnlockedToday,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
