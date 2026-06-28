import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_owner_review_after_deployment_security_cost_reconciliation_passed_with_warnings_ready_for_external_beta_state_change_plan_no_unlock'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_deployment_security_cost_reconciliation_after_model_license_blocker_completed_with_warnings_ready_for_external_beta_owner_review_no_external_beta'
const SOURCE_COMMIT = '7b37805b8a9d0fe2218fdc5d81fbf986d0816176'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EXTERNAL-BETA-STATE-CHANGE-PLAN-AFTER-OWNER-REVIEW: plan bounded external beta state change, no execution/no production'

const FILES = {
  ownerReview: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-owner-review-after-deployment-security-cost-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-owner-review-after-deployment-security-cost-reconciliation'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-owner-review-source-register-after-deployment-security-cost.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-owner-review-source-register-after-deployment-security-cost'
  },
  prerequisiteRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-owner-review-prerequisite-register-after-deployment-security-cost.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-owner-review-prerequisite-register-after-deployment-security-cost'
  },
  liveReadiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-owner-review-live-readiness-after-deployment-security-cost.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-owner-review-live-readiness-after-deployment-security-cost'
  },
  stateChangeRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-state-change-readiness-register-after-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-state-change-readiness-register-after-owner-review'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-owner-review-claim-policy-after-deployment-security-cost.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-owner-review-claim-policy-after-deployment-security-cost'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-external-beta-state-change-plan-after-owner-review.md'

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"externalBetaAllowedToday": true',
  '"realUserMediaBetaAllowedToday": true',
  '"paidProductionAllowedToday": true',
  '"productionAllowedToday": true',
  '"externalBetaUnlockApprovedToday": true',
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
  '"workerReadinessClaimedToday": true',
  '"mediaReadinessClaimedToday": true',
  '"generatedLocalFixturePassedClaimedToday": true',
  '"dryRunPassedClaimedToday": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS'
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
}

function assertAllFalse(value, label, exceptions = []) {
  for (const [key, actual] of Object.entries(value)) {
    if (exceptions.includes(key)) continue
    assert(actual === false, `${label}.${key} must be false`)
  }
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

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no execution/no production'), 'next prompt missing no-execution/no-production scope')
assert(promptText.includes('No runtime execution'), 'next prompt missing forbidden runtime execution statement')

const ownerReview = parsed.ownerReview
assert(ownerReview.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(ownerReview.sourcePr === 1405, 'source PR mismatch')
assert(ownerReview.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(ownerReview.ownerReviewResult.externalBetaOwnerReviewPassedWithWarnings === true, 'owner review pass missing')
assert(ownerReview.ownerReviewResult.allPriorBlockerPacketsRepresented === true, 'prior blocker representation missing')
assert(ownerReview.ownerReviewResult.stateChangePlanMayProceed === true, 'state-change handoff missing')
assert(ownerReview.ownerReviewResult.externalBetaUnlockApprovedToday === false, 'external beta unlock must be false')
assert(ownerReview.ownerReviewResult.externalBetaAllowedToday === false, 'external beta allowed must be false')
assert(ownerReview.ownerReviewResult.realUserMediaBetaAllowedToday === false, 'real-user beta must be false')
assert(ownerReview.ownerReviewResult.selectedNextStep === 'external_beta_state_change_plan', 'next step mismatch')
assert(ownerReview.ownerReviewResult.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(ownerReview.liveReadinessAtReview.overallStatus === 'blocked', 'live readiness status mismatch')
assert(ownerReview.liveReadinessAtReview.hardBlockers === 101, 'hard blocker count mismatch')
assert(ownerReview.liveReadinessAtReview.warnings === 26, 'warning count mismatch')
assertSupabaseNoop(ownerReview.supabaseClassification, 'ownerReview')
assertAllFalse(ownerReview.ownerReviewResult, 'ownerReview.ownerReviewResult', [
  'externalBetaOwnerReviewPassedWithWarnings',
  'allPriorBlockerPacketsRepresented',
  'stateChangePlanMayProceed',
  'selectedNextStep',
  'nextPrompt'
])

const sources = parsed.sourceRegister.sources
assert(sources.length === 7, 'source register count mismatch')
for (const pr of ['PR #1405', 'PR #1401', 'PR #1399', 'PR #1396']) {
  assert(sources.some((entry) => entry.source === pr), `missing source ${pr}`)
}
assert(parsed.sourceRegister.sourceConclusion.requiredPr1405Merged === true, 'PR #1405 source not marked merged')
assert(parsed.sourceRegister.sourceConclusion.samePurposeDuplicateFound === false, 'same-purpose duplicate must be false')
assert(parsed.sourceRegister.sourceConclusion.allPriorBlockerPacketsRepresented === true, 'prior blocker packets missing')
assert(parsed.sourceRegister.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence must be absent')
assert(parsed.sourceRegister.sourceConclusion.safeToProceedToStateChangePlanning === true, 'state-change planning handoff missing')

const prereqs = parsed.prerequisiteRegister
assert(prereqs.prerequisites.length === 4, 'prerequisite count mismatch')
for (const blocker of [
  'real_user_media_beta_boundary_closed',
  'launch_core_tool_readiness_missing',
  'model_weight_and_license_reviews_pending',
  'deployment_security_cost_approval_pending'
]) {
  assert(prereqs.prerequisites.some((entry) => entry.blocker === blocker), `missing prerequisite ${blocker}`)
}
assert(prereqs.prerequisiteConclusion.allKnownExternalBetaBlockerClassesRepresented === true, 'known blocker classes missing')
assert(prereqs.prerequisiteConclusion.representedForPlanningOnly === true, 'planning-only prerequisite flag missing')
assert(prereqs.prerequisiteConclusion.runtimeReadinessClaimed === false, 'runtime readiness must be false')
assert(prereqs.prerequisiteConclusion.externalBetaUnlocked === false, 'external beta unlocked must be false')

const live = parsed.liveReadiness
assert(live.prodReadinessSummary.overallStatus === 'blocked', 'live prod status mismatch')
assert(live.prodReadinessSummary.hardBlockers === 101, 'live hard blockers mismatch')
assert(live.prodBetaSummary.status === 'internal_testing_ready', 'live beta mismatch')
assert(live.prodBetaSummary.externalBetaAllowed === false, 'live external beta must remain false')
assert(live.reviewConclusion.externalBetaOwnerReviewPassedWithWarnings === true, 'review conclusion missing')
assert(live.reviewConclusion.stateChangePlanMayProceed === true, 'state-change conclusion missing')
assert(live.reviewConclusion.externalBetaStillLockedToday === true, 'external beta lock conclusion missing')
assert(live.reviewConclusion.safeToUnlockExternalBetaInThisPrompt === false, 'must not unlock external beta')

const stateChange = parsed.stateChangeRegister.stateChangeReadiness
assert(stateChange.stateChangePlanMayProceed === true, 'state-change planning flag missing')
assert(stateChange.stateChangeExecutedToday === false, 'state change execution must be false')
assert(stateChange.externalBetaUnlockApprovedToday === false, 'external beta unlock must be false')
assert(stateChange.nextPrompt === NEXT_PROMPT, 'state-change next prompt mismatch')
assertAllFalse(stateChange, 'stateChange', ['stateChangePlanMayProceed', 'nextPrompt'])
for (const required of ['bounded_external_beta_scope', 'rollback_and_stop_conditions', 'no_paid_production_unlock']) {
  assert(parsed.stateChangeRegister.requiredFutureProof.includes(required), `future proof missing ${required}`)
}

const claim = parsed.claimPolicy
assert(claim.closedFlags.externalBetaOwnerReviewPassedWithWarnings === true, 'owner review flag missing')
assert(claim.closedFlags.stateChangePlanMayProceed === true, 'state-change planning flag missing')
assertAllFalse(claim.closedFlags, 'claim.closedFlags', [
  'externalBetaOwnerReviewPassedWithWarnings',
  'stateChangePlanMayProceed'
])
for (const required of [
  'external beta unlocked',
  'external beta live',
  'real user media beta live',
  'paid production ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'production ready'
]) {
  assert(claim.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claimPolicy')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      externalBetaAllowed: false,
      externalBetaOwnerReviewPassedWithWarnings: true,
      stateChangePlanMayProceed: true,
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
