import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_decision_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_decision_owner_review_after_runner_boundary_execution_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_runtime_beta_preflight_owner_review_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_decision_plan_after_runner_boundary_execution_proof'

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-after-runner-boundary-execution-proof.md',
  scope: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-scope-register-after-runner-boundary-execution-proof.md',
  requiredEvidence: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-required-evidence-register-after-runner-boundary-execution-proof.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-stop-condition-register-after-runner-boundary-execution-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-blocker-register-after-runner-boundary-execution-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-decision-owner-review-after-runner-boundary-execution-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-acceptance-register-after-runner-boundary-execution-proof.md',
  sourceInternalBeta: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-internal-beta-decision-readiness-register-after-runner-boundary-execution-proof.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-blocker-register-after-runner-boundary-execution-proof.md',
  sourcePreflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof.md'
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

const plan = parseBlock(files.plan, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-after-runner-boundary-execution-proof')
const scope = parseBlock(files.scope, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-scope-register-after-runner-boundary-execution-proof')
const requiredEvidence = parseBlock(files.requiredEvidence, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-required-evidence-register-after-runner-boundary-execution-proof')
const stops = parseBlock(files.stops, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-stop-condition-register-after-runner-boundary-execution-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-blocker-register-after-runner-boundary-execution-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-claim-policy-after-runner-boundary-execution-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof')
const sourceAcceptance = parseBlock(files.sourceAcceptance, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-acceptance-register-after-runner-boundary-execution-proof')
const sourceInternalBeta = parseBlock(files.sourceInternalBeta, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-internal-beta-decision-readiness-register-after-runner-boundary-execution-proof')
const sourceBlockers = parseBlock(files.sourceBlockers, 'worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-blocker-register-after-runner-boundary-execution-proof')
const sourcePreflight = parseBlock(files.sourcePreflight, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-runner-boundary-execution-proof')

read(files.nextPrompt)

for (const row of [plan, scope, requiredEvidence, stops, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(plan.sourceDecision === sourceDecision, 'source decision mismatch')
assert(plan.sourcePr === 1262, 'source PR mismatch')
assert(plan.sourceMergeCommit === '9f19a7f78bdbf42b3e0f2cdd748e48f322ea08cf', 'source merge mismatch')
assert(plan.decisionPlanResult.internalBetaDecisionPlanCreated === true, 'plan not created')
assert(plan.decisionPlanResult.controlledRuntimeBetaPreflightAccepted === true, 'preflight not accepted')
assert(plan.decisionPlanResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(plan.decisionPlanResult.internalBetaOwnerReviewMayProceed === true, 'owner review not enabled')
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
  assert(plan.decisionPlanResult[key] === false, `${key} widened`)
}

assert(scope.plannedInternalBetaScope.scopeType === 'controlled_internal_dry_run_only', 'scope type mismatch')
for (const key of ['realUserMediaAllowed', 'publicUsersAllowed', 'paidProductionAllowed']) {
  assert(scope.plannedInternalBetaScope[key] === false, `${key} widened`)
}
assert(scope.plannedInternalBetaScope.approvedPlanSnapshotRequired === true, 'approved snapshot requirement missing')
assert(scope.plannedInternalBetaScope.creditEstimateApprovalRequired === true, 'credit estimate requirement missing')
assert(scope.acceptedPlanningSurface.toolCount === 15, 'scope tool count mismatch')
assert(scope.counts.internalBetaUnlockedToolCount === 0, 'internal beta tool count widened')
assert(scope.counts.externalBetaUnlockedToolCount === 0, 'external beta tool count widened')
assert(scope.counts.productionUnlockedToolCount === 0, 'production tool count widened')

assert(requiredEvidence.requiredBeforeInternalBetaUnlock.length === 7, 'required evidence count mismatch')
for (const row of requiredEvidence.requiredBeforeInternalBetaUnlock) assert(row.status === 'pending', `evidence should remain pending: ${row.id}`)
assert(requiredEvidence.counts.requiredEvidenceCount === 7, 'required count mismatch')
assert(requiredEvidence.counts.pendingEvidenceCount === 7, 'pending count mismatch')
assert(requiredEvidence.counts.passedEvidenceCount === 0, 'passed evidence widened')

assert(stops.stopConditions.length === 11, 'stop condition count mismatch')
assert(stops.requiredResponseIfStopped.doNotUnlockBeta === true, 'stop response must block unlock')
assert(stops.counts.stopConditionTriggeredCount === 0, 'stop condition unexpectedly triggered')

assert(blockers.resolvedForPlanning.length === 3, 'resolved planning count mismatch')
assert(blockers.remainingBeforeInternalBetaUnlock.includes('internal_beta_decision_owner_review_after_runner_boundary_execution_proof'), 'owner-review blocker missing')
assert(blockers.remainingBeforeExternalBeta.includes('production_readiness_gate'), 'production blocker missing')
assert(blockers.counts.internalBetaBlockingCount === 5, 'internal beta blocker count mismatch')
assert(blockers.counts.externalBetaBlockingCount === 5, 'external beta blocker count mismatch')

for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'product tool-call execution ready']) {
  assert(policy.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceReview.decision === sourceDecision, 'source review decision mismatch')
assert(sourceReview.sourcePr === 1258, 'source review source PR mismatch')
assert(sourceReview.ownerReviewResult.internalBetaDecisionPlanningMayProceed === true, 'source owner review did not allow planning')
assert(sourceReview.ownerReviewResult.internalBetaUnlockedToday === false, 'source internal beta widened')
assert(sourceReview.ownerReviewResult.externalBetaUnlockedToday === false, 'source external beta widened')
assert(sourceAcceptance.counts.acceptedSoundCpuToolCount === 15, 'source acceptance tool count mismatch')
assert(sourceAcceptance.counts.acceptedForInternalBetaTodayCount === 0, 'source internal beta today widened')
assert(sourceInternalBeta.internalBetaDecisionPlanning.mayProceed === true, 'source internal beta planning mismatch')
assert(sourceInternalBeta.externalBetaDecisionPlanning.mayProceedToday === false, 'source external beta widened')
assert(sourceBlockers.remainingBeforeInternalBetaUnlock.includes('internal_beta_decision_plan_after_runner_boundary_execution_proof'), 'source blocker missing')
assert(sourcePreflight.preflightResult.dependencyBackedPreflightPassed === true, 'source preflight missing')
assert(sourcePreflight.preflightResult.productToolCallExecutionPerformed === false, 'source product execution widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-decision-plan-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-decision-plan-after-runner-boundary-execution-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
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
  '"internalBetaUnlockedToolCount": 15',
  '"externalBetaUnlockedToolCount": 15',
  '"passedEvidenceCount": 7',
  '"sqlExecuted": "yes"',
  'external beta ready true',
  'production ready true'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_internal_beta_decision_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: plan.sourcePr,
      sourceMergeCommit: plan.sourceMergeCommit,
      acceptedSoundCpuToolCount: plan.decisionPlanResult.acceptedSoundCpuToolCount,
      internalBetaOwnerReviewMayProceed: plan.decisionPlanResult.internalBetaOwnerReviewMayProceed,
      internalBetaUnlockApprovedToday: plan.decisionPlanResult.internalBetaUnlockApprovedToday,
      externalBetaUnlockApprovedToday: plan.decisionPlanResult.externalBetaUnlockApprovedToday,
      nextPrompt: plan.nextPrompt
    },
    null,
    2
  )
)
