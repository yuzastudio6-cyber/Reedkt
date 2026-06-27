import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_decision_owner_review_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_required_evidence_plan_after_runner_boundary_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_decision_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_decision_owner_review_after_runner_boundary_execution_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-review-after-runner-boundary-execution-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-acceptance-register-after-runner-boundary-execution-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-required-evidence-review-register-after-runner-boundary-execution-proof.md',
  stopConditions: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-stop-condition-review-after-runner-boundary-execution-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-blocker-register-after-runner-boundary-execution-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-plan-after-runner-boundary-execution-proof.md',
  sourcePlan: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-after-runner-boundary-execution-proof.md',
  sourceScope: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-scope-register-after-runner-boundary-execution-proof.md',
  sourceRequiredEvidence: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-required-evidence-register-after-runner-boundary-execution-proof.md',
  sourceStopConditions: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-stop-condition-register-after-runner-boundary-execution-proof.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-blocker-register-after-runner-boundary-execution-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-claim-policy-after-runner-boundary-execution-proof'
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

const review = parseBlock(files.review, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-review-after-runner-boundary-execution-proof')
const acceptance = parseBlock(files.acceptance, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-acceptance-register-after-runner-boundary-execution-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-required-evidence-review-register-after-runner-boundary-execution-proof')
const stopConditions = parseBlock(files.stopConditions, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-stop-condition-review-after-runner-boundary-execution-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-blocker-register-after-runner-boundary-execution-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-claim-policy-after-runner-boundary-execution-proof')
const sourcePlan = parseBlock(files.sourcePlan, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-after-runner-boundary-execution-proof')
const sourceScope = parseBlock(files.sourceScope, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-scope-register-after-runner-boundary-execution-proof')
const sourceRequiredEvidence = parseBlock(files.sourceRequiredEvidence, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-required-evidence-register-after-runner-boundary-execution-proof')
const sourceStopConditions = parseBlock(files.sourceStopConditions, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-stop-condition-register-after-runner-boundary-execution-proof')
const sourceBlockers = parseBlock(files.sourceBlockers, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-blocker-register-after-runner-boundary-execution-proof')
const sourcePolicy = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-claim-policy-after-runner-boundary-execution-proof.md',
  'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-claim-policy-after-runner-boundary-execution-proof'
)

read(files.nextPrompt)

for (const row of [review, acceptance, evidence, stopConditions, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(review.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourcePr === 1271, 'source PR mismatch')
assert(review.sourceMergeCommit === '1cec24ea7806080b3ec4a9e45dac96c74633fca6', 'source merge mismatch')
assert(review.ownerReviewResult.internalBetaDecisionPlanAccepted === true, 'decision plan not accepted')
assert(review.ownerReviewResult.controlledInternalDryRunScopeAcceptedForEvidencePlanning === true, 'scope not accepted')
assert(review.ownerReviewResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.ownerReviewResult.requiredEvidenceCount === 7, 'required evidence count mismatch')
assert(review.ownerReviewResult.passedEvidenceCountAfterReview === 1, 'passed evidence count mismatch')
assert(review.ownerReviewResult.pendingEvidenceCountAfterReview === 6, 'pending evidence count mismatch')
assert(review.ownerReviewResult.internalBetaRequiredEvidencePlanningMayProceed === true, 'evidence planning not allowed')

for (const key of [
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'productionUnlockApprovedToday',
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'dockerGcpApprovedToday',
  'billingStripeApprovedToday'
]) {
  assert(review.ownerReviewResult[key] === false, `${key} widened`)
}

assert(acceptance.acceptedForNextPlanning.internalBetaRequiredEvidencePlanning === 'yes', 'required evidence planning acceptance missing')
for (const value of Object.values(acceptance.acceptedForToday)) assert(value === 'no', 'today acceptance widened')
assert(acceptance.counts.acceptedForEvidencePlanningCount === 15, 'evidence planning count mismatch')
assert(acceptance.counts.acceptedForInternalBetaTodayCount === 0, 'internal beta count widened')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta count widened')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production count widened')

const acceptedEvidence = evidence.requiredBeforeInternalBetaUnlock.filter((item) => item.status === 'accepted_by_this_review')
const pendingEvidence = evidence.requiredBeforeInternalBetaUnlock.filter((item) => item.status === 'pending')
assert(acceptedEvidence.length === 1, 'accepted evidence count mismatch')
assert(acceptedEvidence[0].id === 'owner_review_accepts_internal_beta_scope', 'wrong accepted evidence item')
assert(pendingEvidence.length === 6, 'pending evidence count mismatch')
assert(evidence.counts.requiredEvidenceCount === 7, 'evidence required count mismatch')
assert(evidence.counts.acceptedEvidenceCount === 1, 'evidence accepted count mismatch')
assert(evidence.counts.pendingEvidenceCount === 6, 'evidence pending count mismatch')
assert(evidence.counts.unlockBlockingEvidenceCount === 6, 'unlock blocker count mismatch')

assert(stopConditions.counts.stopConditionTriggeredCount === 0, 'stop condition triggered')
for (const value of Object.values(stopConditions.stopConditionReview)) assert(value === false, 'stop condition widened')

assert(blockers.resolvedForPlanning.includes('owner_review_accepts_internal_beta_scope'), 'owner scope blocker not resolved')
assert(blockers.remainingBeforeInternalBetaUnlock.length === 6, 'remaining internal beta blockers mismatch')
assert(blockers.remainingBeforeInternalBetaUnlock.includes('worker_route_dispatch_gate'), 'worker route blocker missing')
assert(blockers.remainingBeforeExternalBeta.includes('production_readiness_gate'), 'external beta blocker missing')
assert(blockers.counts.internalBetaBlockingCount === 6, 'internal beta blocker count mismatch')
assert(blockers.counts.externalBetaBlockingCount === 5, 'external beta blocker count mismatch')

for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'product tool-call execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourcePlan.sourcePr === 1262, 'source plan source PR mismatch')
assert(sourcePlan.decisionPlanResult.internalBetaOwnerReviewMayProceed === true, 'source owner review not ready')
assert(sourcePlan.decisionPlanResult.internalBetaUnlockApprovedToday === false, 'source internal beta widened')
assert(sourcePlan.decisionPlanResult.externalBetaUnlockApprovedToday === false, 'source external beta widened')
assert(sourceScope.plannedInternalBetaScope.sanitizedFixtureOnly === true, 'source sanitized fixture boundary missing')
assert(sourceScope.acceptedPlanningSurface.toolCount === 15, 'source tool count mismatch')
assert(sourceRequiredEvidence.counts.requiredEvidenceCount === 7, 'source required evidence count mismatch')
assert(sourceRequiredEvidence.counts.pendingEvidenceCount === 7, 'source pending evidence count mismatch')
assert(sourceRequiredEvidence.counts.passedEvidenceCount === 0, 'source passed evidence unexpectedly widened')
assert(sourceStopConditions.counts.stopConditionTriggeredCount === 0, 'source stop condition triggered')
assert(sourceBlockers.counts.internalBetaBlockingCount === 5, 'source blocker count mismatch')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-decision-owner-review-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-review-after-runner-boundary-execution-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = [
  files.review,
  files.acceptance,
  files.evidence,
  files.stopConditions,
  files.blockers,
  files.policy,
  files.nextPrompt
].map(read).join('\n')
for (const forbidden of [
  '"internalBetaUnlockApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"dockerGcpApprovedToday": true',
  '"billingStripeApprovedToday": true',
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
      status: 'worker_runtime_jobs_sound_cpu_internal_beta_decision_owner_review_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.ownerReviewResult.acceptedSoundCpuToolCount,
      internalBetaRequiredEvidencePlanningMayProceed: review.ownerReviewResult.internalBetaRequiredEvidencePlanningMayProceed,
      internalBetaUnlockApprovedToday: review.ownerReviewResult.internalBetaUnlockApprovedToday,
      externalBetaUnlockApprovedToday: review.ownerReviewResult.externalBetaUnlockApprovedToday,
      pendingEvidenceCountAfterReview: review.ownerReviewResult.pendingEvidenceCountAfterReview,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
