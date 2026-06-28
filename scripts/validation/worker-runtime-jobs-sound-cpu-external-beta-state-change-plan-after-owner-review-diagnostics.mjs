import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_state_change_plan_after_owner_review_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_owner_review_after_deployment_security_cost_reconciliation_passed_with_warnings_ready_for_external_beta_state_change_plan_no_unlock'
const SOURCE_COMMIT = '1b10ed3aa67f17e3e2a3a4ca49916028bbba9cc7'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-BETA-STATE-CHANGE-EXECUTION-AFTER-PLAN: execute bounded external beta scorecard state change, no runtime/no production'
const SCOPE_FIX_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'
const CONSUMER_SCOPE_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_consumer_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-state-change-plan-after-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-state-change-plan-after-owner-review'
  },
  target: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-state-change-target-register-after-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-state-change-target-register-after-owner-review'
  },
  rollback: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-rollback-stop-condition-register-after-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-rollback-stop-condition-register-after-owner-review'
  },
  support: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-support-observability-plan-after-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-support-observability-plan-after-owner-review'
  },
  verification: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-state-change-verification-plan-after-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-state-change-verification-plan-after-owner-review'
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-state-change-claim-policy-after-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-state-change-claim-policy-after-owner-review'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-execution-after-plan.md'

const FUTURE_FILES = [
  'server/beta-readiness/beta-go-no-go-policy.ts',
  'server/beta-readiness/beta-readiness-report-builder.ts',
  'server/beta-readiness/beta-readiness-checklist.ts',
  'server/smoke/beta-readiness-smoke.ts'
]

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"paidProductionAllowed": true',
  '"productionAllowedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"externalBetaLiveToday": true',
  '"stateChangeExecutedToday": true',
  '"deploymentApprovedToday": true',
  '"cloudRunApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"modelDownloadApprovedToday": true',
  '"providerModelCallApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"runtimeReadinessClaimedToday": true',
  '"generatedLocalFixturePassedClaimedToday": true',
  '"dryRunPassedClaimedToday": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://'
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return readFileSync(path, 'utf8')
}

function parseBlock({ path, label }) {
  const text = read(path)
  for (const forbidden of FORBIDDEN_STRINGS) {
    assert(!text.includes(forbidden), `${path} contains forbidden string: ${forbidden}`)
  }
  const marker = '```json ' + label
  const start = text.indexOf(marker)
  assert(start >= 0, `${path} missing fenced JSON label ${label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertDecision(doc, label) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${label} owner mismatch`)
  assert(doc.decision === DECISION, `${label} decision mismatch`)
  assert(doc.sourcePr === 1408, `${label} source PR mismatch`)
  assert(doc.sourceMergeCommit === SOURCE_COMMIT, `${label} source merge commit mismatch`)
}

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value.nextAction === 'none', `${label} Supabase next action mismatch`)
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const plan = parsed.plan
assert(plan.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(plan.stateChangePlan.planCreated === true, 'plan flag missing')
assert(plan.stateChangePlan.stateChangeExecutedToday === false, 'state change must not be executed today')
assert(plan.stateChangePlan.boundedExternalBetaExecutionMayProceedNext === true, 'future execution handoff missing')
assert(plan.stateChangePlan.externalBetaUnlockApprovedToday === false, 'external beta unlock must be false')
assert(plan.stateChangePlan.realUserMediaBetaAllowedToday === false, 'real-user beta must be false')
assert(plan.stateChangePlan.paidProductionAllowedToday === false, 'paid production must be false')
assert(plan.stateChangePlan.runtimeExecutionApprovedToday === false, 'runtime execution must be false')
assert(plan.stateChangePlan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
for (const file of FUTURE_FILES) {
  assert(plan.exactFutureFiles.includes(file), `exact future file missing ${file}`)
}
assertSupabaseNoop(plan.supabaseClassification, 'plan')

const target = parsed.target
assert(target.currentLiveState.externalBetaAllowed === false, 'current external beta must be false')
assert(target.currentLiveState.realUserMediaBetaAllowed === false, 'current real-user beta must be false')
assert(target.currentLiveState.paidProductionAllowed === false, 'current paid production must be false')
assert(target.currentLiveState.prodReadinessOverallStatus === 'blocked', 'prod readiness status mismatch')
assert(target.futureBoundedTarget.externalBetaScorecardTarget === 'enable_after_future_execution_only', 'future target mismatch')
assert(target.futureBoundedTarget.realUserMediaBetaTarget === 'remain_blocked', 'real-user target mismatch')
assert(target.futureBoundedTarget.paidProductionTarget === 'remain_blocked', 'paid production target mismatch')
assert(target.futureCodeTouchPlan.length === FUTURE_FILES.length, 'future code file count mismatch')
for (const file of FUTURE_FILES) {
  assert(target.futureCodeTouchPlan.some((entry) => entry.path === file), `future touch plan missing ${file}`)
}
assert(target.targetConclusion.planOnlyToday === true, 'plan-only target missing')
assert(target.targetConclusion.stateChangeExecutedToday === false, 'target state change must be false')
assert(target.targetConclusion.safeToProceedToFutureExecutionPrompt === true, 'future execution target missing')

const rollback = parsed.rollback
assert(rollback.rollbackPlan.rollbackFiles.length === FUTURE_FILES.length, 'rollback file count mismatch')
for (const command of ['npm run prod:beta:summary', 'npm run prod:readiness:summary', 'npm run cross-chat-tool-ownership:diagnostics']) {
  assert(rollback.rollbackPlan.rollbackVerification.includes(command), `rollback verification missing ${command}`)
}
assert(rollback.rollbackPlan.supabaseRollbackRequired === false, 'Supabase rollback must be false')
assert(rollback.rollbackPlan.cloudRollbackRequired === false, 'cloud rollback must be false')
assert(rollback.rollbackPlan.artifactRollbackRequired === false, 'artifact rollback must be false')
assert(rollback.stopConditions.length >= 7, 'stop conditions incomplete')
assert(rollback.rollbackStopConclusion.stopConditionsDefined === true, 'stop conditions conclusion missing')
assert(rollback.rollbackStopConclusion.rollbackDefined === true, 'rollback conclusion missing')
assert(rollback.rollbackStopConclusion.stateChangeExecutedToday === false, 'rollback state change must be false')

const support = parsed.support
assert(support.supportPlan.supportMode === 'planning_only_manual_review_required_before_live_users', 'support mode mismatch')
assert(support.supportPlan.incidentRunbookRequiredBeforeLiveUsers === true, 'incident runbook requirement missing')
assert(support.supportPlan.userFacingClaimsAllowedToday.length === 0, 'user-facing claims must be empty')
assert(support.observabilityPlan.observabilityDeploymentToday === false, 'observability deployment must be false')
assert(support.observabilityPlan.alertCreationToday === false, 'alert creation must be false')
assert(support.supportObservabilityConclusion.supportPlanCreated === true, 'support plan conclusion missing')
assert(support.supportObservabilityConclusion.supportOrAlertingEnabledToday === false, 'support enablement must be false')

const verification = parsed.verification
for (const command of ['npm run prod:beta:summary', 'npm run prod:readiness:summary', 'npm run cross-chat-tool-ownership:diagnostics']) {
  assert(verification.verificationBeforeFutureExecution.includes(command), `pre verification missing ${command}`)
  assert(verification.verificationAfterFutureExecution.includes(command), `post verification missing ${command}`)
}
assert(verification.futureExpectedBoundaries.boundedExternalBetaScorecardMayChange === true, 'bounded scorecard boundary missing')
assert(verification.futureExpectedBoundaries.realUserMediaBetaMustRemainBlocked === true, 'real-user boundary missing')
assert(verification.futureExpectedBoundaries.paidProductionMustRemainBlocked === true, 'paid production boundary missing')
assert(verification.futureExpectedBoundaries.runtimeExecutionMustRemainBlocked === true, 'runtime boundary missing')
assert(verification.futureExpectedBoundaries.supabaseSqlMustRemainNoop === true, 'Supabase boundary missing')
assert(verification.verificationConclusion.stateChangeExecutedToday === false, 'verification state change must be false')

const claim = parsed.claim
for (const allowed of [
  'external beta state-change plan created',
  'future bounded state-change execution prompt may proceed'
]) {
  assert(claim.allowedClaimsToday.includes(allowed), `allowed claim missing ${allowed}`)
}
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
for (const required of [
  'external beta is live',
  'real user media beta is live',
  'paid production ready',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(claim.forbiddenClaims.includes(required), `forbidden claim missing ${required}`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claim')

const prompt = read(PROMPT)
assert(
  prompt.includes(DECISION) || prompt.includes(SCOPE_FIX_DECISION) || prompt.includes(CONSUMER_SCOPE_DECISION),
  'future execution prompt missing state-change, scope-fix, or consumer-scope source decision'
)
assert(prompt.includes('no runtime/no production'), 'future execution prompt missing no runtime/no production scope')
for (const file of FUTURE_FILES) {
  assert(prompt.includes(file), `future execution prompt missing exact file ${file}`)
}
assert(prompt.includes('No runtime execution'), 'future execution prompt missing forbidden runtime statement')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      planCreated: true,
      stateChangeExecutedToday: false,
      futureExecutionMayProceed: true,
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
