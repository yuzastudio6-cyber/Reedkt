import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_beta_support_boundary_closure_after_worker_route_boundary_completed_with_warnings_ready_for_external_beta_readiness_reconciliation_no_external_beta'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_worker_route_execution_boundary_closure_after_product_tool_call_gap_completed_with_warnings_ready_for_beta_support_boundary_closure_no_external_beta'
const SOURCE_HEAD = 'c871c59d05d3d2cd639ae9dfd2d12abfbcdfa7cb'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EXTERNAL-BETA-READINESS-RECONCILIATION-AFTER-BETA-SUPPORT-BOUNDARY: reconcile external beta readiness after beta/support boundary closure, no external beta'

const FILES = {
  closure: {
    path: 'docs/worker-runtime-jobs-sound-cpu-beta-support-boundary-closure-after-worker-route-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-beta-support-boundary-closure-after-worker-route-boundary'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-beta-support-boundary-source-register-after-worker-route-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-beta-support-boundary-source-register-after-worker-route-boundary'
  },
  evidenceCoverage: {
    path: 'docs/worker-runtime-jobs-sound-cpu-beta-support-boundary-evidence-coverage-after-worker-route-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-beta-support-boundary-evidence-coverage-after-worker-route-boundary'
  },
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-beta-support-boundary-reconciliation-after-worker-route-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-beta-support-boundary-reconciliation-after-worker-route-boundary'
  },
  blocker: {
    path: 'docs/worker-runtime-jobs-sound-cpu-beta-support-boundary-blocker-register-after-worker-route-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-beta-support-boundary-blocker-register-after-worker-route-boundary'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-beta-support-boundary-claim-policy-after-worker-route-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-beta-support-boundary-claim-policy-after-worker-route-boundary'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-external-beta-readiness-reconciliation-after-beta-support-boundary.md'

const FORBIDDEN_STRINGS = [
  '"betaSupportBoundaryClosedForExecution": true',
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"productToolCallExecutionReady": true',
  '"workerExecutionReady": true',
  '"routeExecutionReady": true',
  '"runtimeReadinessClaimed": true',
  '"mediaReadinessClaimed": true',
  '"artifactReadinessClaimed": true',
  '"billingReadinessClaimed": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"runtimeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"creditMutationApprovedToday": true',
  '"stripePaymentProcessingApprovedToday": true',
  '"externalBetaApprovedToday": true',
  '"productionApprovedToday": true',
  '"realUserMediaApprovedToday": true',
  '"supabaseTouched": true',
  '"sqlExecuted": true',
  '"creditMutated": true',
  '"stripeProcessed": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'service_role',
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

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function assertAllFalse(value, label) {
  for (const [key, actual] of Object.entries(value)) {
    assert(actual === false, `${label}.${key} should be false`)
  }
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no external beta'), 'next prompt missing no external beta scope')

const closure = parsed.closure
assert(closure.sourceVerification.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(closure.sourceVerification.pr1377.merged === true, 'PR #1377 merge evidence missing')
assert(closure.sourceVerification.pr1377.mergeCommit === SOURCE_HEAD, 'PR #1377 merge mismatch')
assert(closure.sourceVerification.pr1377.decision === SOURCE_DECISION, 'PR #1377 decision mismatch')
assert(closure.sourceVerification.pr1373.mergeCommit === 'b736b0e2423ca0c3f8f53515810dc6a90f0b6a8d', 'PR #1373 merge mismatch')
assert(closure.boundaryClosureResult.closedForPlanning === true, 'boundary should close for planning')
assert(closure.boundaryClosureResult.closedForExecution === false, 'boundary must not close for execution')
for (const key of [
  'workerRouteBoundaryClosedForPlanning',
  'artifactDeliveryPlanningGapClosed',
  'billingStripeCreditsPlanningGapClosed',
  'complianceSecurityPlanningGapClosed',
  'productBetaReadinessPlanningGapClosed',
  'operatorRunbookPresent',
  'rollbackPolicyPresent',
  'observabilityEvidenceRepresented',
  'supportEvidenceRepresented',
  'incidentResponseEvidenceRepresented',
  'costEvidenceRepresented',
  'securityEvidenceRepresented',
  'realUserMediaBoundaryRepresented'
]) {
  assert(closure.boundaryClosureResult[key] === true, `closure.${key} should be true`)
}
for (const [key, value] of Object.entries(closure.boundaryClosureResult)) {
  if (key.endsWith('ApprovedToday') || key === 'realUserMediaApprovedToday') {
    assert(value === false, `closure.${key} must remain false`)
  }
}
assert(closure.selectedNextClosure.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(closure.selectedNextClosure.mayUnlockExternalBetaToday === false, 'external beta must remain closed')
assertSupabaseNoop(closure.supabaseClassification, 'closure')

const sourceEntries = parsed.sourceRegister.sources
assert(sourceEntries.length === 9, 'source register count mismatch')
for (const [source, decision] of [
  ['PR #1377', SOURCE_DECISION],
  ['PR #1373', 'worker_runtime_jobs_sound_cpu_product_tool_call_execution_readiness_gap_closure_after_internal_dry_run_completed_with_warnings_ready_for_worker_route_execution_boundary_closure_no_external_beta'],
  ['product beta readiness gap closure', 'worker_runtime_jobs_sound_cpu_product_beta_readiness_gap_closure_completed_with_warnings_all_planning_gaps_closed_runtime_beta_blocked'],
  ['artifact delivery gap closure', 'worker_runtime_jobs_sound_cpu_artifact_delivery_gap_closure_completed_with_warnings_ready_for_billing_stripe_credits_gap_closure'],
  ['billing Stripe credits gap closure', 'worker_runtime_jobs_sound_cpu_billing_stripe_credits_gap_closure_completed_with_warnings_ready_for_compliance_security_gap_closure'],
  ['compliance security gap closure', 'worker_runtime_jobs_sound_cpu_compliance_security_gap_closure_completed_with_warnings_ready_for_product_beta_readiness_gap_closure'],
  ['security cost support gate evidence plan', 'worker_runtime_jobs_sound_cpu_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_reconsideration_no_unlock'],
  ['bounded internal beta operator runbook', 'worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_runbook_after_owner_confirmation_completed_with_warnings_ready_for_internal_operator_review_no_execution'],
  ['no real user media boundary evidence plan', 'worker_runtime_jobs_sound_cpu_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_no_artifact_storage_delivery_evidence_plan_after_runner_boundary_execution_proof']
]) {
  assert(
    sourceEntries.some((entry) => entry.source === source && entry.decision === decision),
    `missing source register entry: ${source}`
  )
}

assert(parsed.evidenceCoverage.coverageConclusion.betaSupportBoundaryClosedForPlanning === true, 'coverage planning closure missing')
assert(parsed.evidenceCoverage.coverageConclusion.betaSupportBoundaryClosedForExecution === false, 'coverage execution closure must be false')
assert(parsed.evidenceCoverage.coverageConclusion.externalBetaReadinessStillUnproven === true, 'external beta unproven flag missing')
assert(parsed.evidenceCoverage.coverageConclusion.nextUnclosedBoundary === 'external_beta_readiness_reconciliation', 'coverage next boundary mismatch')
assert(parsed.evidenceCoverage.coverage.some((item) => item.boundary === 'external beta readiness' && item.coveredForPlanning === false), 'external beta blocker missing')

const planning = parsed.reconciliation.reconciliation.planningEvidence
for (const [key, value] of Object.entries(planning)) {
  assert(value === true, `planningEvidence.${key} should be true`)
}
assertAllFalse(parsed.reconciliation.reconciliation.executionState, 'executionState')
assert(parsed.reconciliation.reconciliation.readinessStateExpectedToRemainBlocked.prodReadinessOverallStatus === 'blocked', 'prod readiness should remain blocked')
assert(parsed.reconciliation.reconciliation.readinessStateExpectedToRemainBlocked.prodBetaStatus === 'internal_testing_ready', 'beta status mismatch')
assert(parsed.reconciliation.reconciliation.readinessStateExpectedToRemainBlocked.externalBetaAllowed === false, 'external beta should remain false')
assert(parsed.reconciliation.reconciliation.readinessStateExpectedToRemainBlocked.realUserMediaBetaAllowed === false, 'real user media beta should remain false')

assert(parsed.blocker.closedBlockers.length === 1, 'closed blocker count mismatch')
assert(parsed.blocker.closedBlockers[0].closedForPlanning === true, 'closed blocker planning mismatch')
assert(parsed.blocker.closedBlockers[0].closedForExecution === false, 'closed blocker execution mismatch')
assert(parsed.blocker.remainingBlockers.some((item) => item.blockerId === 'external_beta_readiness_reconciliation'), 'external beta reconciliation blocker missing')
assert(parsed.blocker.remainingBlockers.some((item) => item.blockerId === 'real_user_media_beta_closed'), 'real-user media blocker missing')
assert(parsed.blocker.remainingBlockers.some((item) => item.blockerId === 'production_readiness_blocked'), 'production blocker missing')

assert(parsed.claimPolicy.allowedClaims.length === 4, 'allowed claim count mismatch')
for (const required of [
  'external beta ready',
  'real-user media beta ready',
  'worker execution ready',
  'route execution ready',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assert(parsed.claimPolicy.closedFlags.betaSupportBoundaryClosedForPlanning === true, 'planning flag should be true')
const flagsToRemainFalse = { ...parsed.claimPolicy.closedFlags }
delete flagsToRemainFalse.betaSupportBoundaryClosedForPlanning
assertAllFalse(flagsToRemainFalse, 'claimPolicy.closedFlags')
assertSupabaseNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      betaSupportBoundaryClosedForPlanning: true,
      betaSupportBoundaryClosedForExecution: false,
      selectedNextPrompt: NEXT_PROMPT,
      externalBetaApprovedToday: false
    },
    null,
    2
  )
)
