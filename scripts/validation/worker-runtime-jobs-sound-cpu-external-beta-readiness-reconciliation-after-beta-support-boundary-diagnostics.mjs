import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_readiness_reconciliation_after_beta_support_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_specific_blocker_closure'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_beta_support_boundary_closure_after_worker_route_boundary_completed_with_warnings_ready_for_external_beta_readiness_reconciliation_no_external_beta'
const SOURCE_COMMIT = '734a4c10ec5b1a00fd51a59e6ad7e056ef5366fb'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-REAL-USER-MEDIA-BETA-BOUNDARY-CLOSURE-AFTER-EXTERNAL-BETA-RECONCILIATION: close real-user media beta boundary for planning only, no media execution/no external beta'

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-readiness-reconciliation-after-beta-support-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-readiness-reconciliation-after-beta-support-boundary'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-readiness-source-register-after-beta-support-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-readiness-source-register-after-beta-support-boundary'
  },
  liveSnapshot: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-live-readiness-snapshot-after-beta-support-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-live-readiness-snapshot-after-beta-support-boundary'
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-classification-after-beta-support-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-blocker-classification-after-beta-support-boundary'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-claim-policy-after-beta-support-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-claim-policy-after-beta-support-boundary'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-closure-after-external-beta-reconciliation.md'

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"externalBetaUnlockedToday": true',
  '"realUserMediaBetaUnlockedToday": true',
  '"externalBetaApprovedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"creditMutationApprovedToday": true',
  '"stripePaymentProcessingApprovedToday": true',
  '"deploymentApprovedToday": true',
  '"productionUnlockedToday": true',
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

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function assertAllFalse(value, label, exceptions = []) {
  for (const [key, actual] of Object.entries(value)) {
    if (exceptions.includes(key)) continue
    assert(actual === false, `${label}.${key} must be false`)
  }
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no media execution/no external beta'), 'next prompt missing no-execution scope')

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.sourcePr === 1381, 'source PR mismatch')
assert(reconciliation.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(reconciliation.reconciliationResult.externalBetaReadinessReconciled === true, 'reconciliation flag missing')
assert(reconciliation.reconciliationResult.currentProdReadinessOverallStatus === 'blocked', 'prod readiness should be blocked')
assert(reconciliation.reconciliationResult.currentHardBlockerCount === 101, 'hard blocker count mismatch')
assert(reconciliation.reconciliationResult.currentWarningCount === 26, 'warning count mismatch')
assert(reconciliation.reconciliationResult.currentBetaReadinessStatus === 'internal_testing_ready', 'beta status mismatch')
assert(reconciliation.reconciliationResult.internalDryRunAllowed === true, 'internal dry-run should remain allowed')
assert(reconciliation.reconciliationResult.externalBetaAllowed === false, 'external beta must remain false')
assert(reconciliation.reconciliationResult.realUserMediaBetaAllowed === false, 'real-user media beta must remain false')
assert(reconciliation.reconciliationResult.paidProductionAllowed === false, 'paid production must remain false')
assert(reconciliation.reconciliationResult.productionAllowed === false, 'production must remain false')
assert(reconciliation.reconciliationResult.crossChatOwnershipConflicts === 0, 'ownership conflicts mismatch')
assert(reconciliation.reconciliationResult.selectedSmallestBlocker === 'real_user_media_beta_boundary_closed', 'selected blocker mismatch')
assert(reconciliation.reconciliationResult.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertAllFalse(reconciliation.scopeResult, 'scopeResult')
assertSupabaseNoop(reconciliation.supabaseClassification, 'reconciliation')

const sources = parsed.sourceRegister.sources
assert(sources.length === 11, 'source register count mismatch')
for (const [source, decision] of [
  ['PR #1381', SOURCE_DECISION],
  [
    'PR #1377',
    'worker_runtime_jobs_sound_cpu_worker_route_execution_boundary_closure_after_product_tool_call_gap_completed_with_warnings_ready_for_beta_support_boundary_closure_no_external_beta'
  ],
  [
    'PR #1373',
    'worker_runtime_jobs_sound_cpu_product_tool_call_execution_readiness_gap_closure_after_internal_dry_run_completed_with_warnings_ready_for_worker_route_execution_boundary_closure_no_external_beta'
  ],
  [
    'product beta readiness gap closure',
    'worker_runtime_jobs_sound_cpu_product_beta_readiness_gap_closure_completed_with_warnings_all_planning_gaps_closed_runtime_beta_blocked'
  ],
  [
    'artifact delivery gap closure',
    'worker_runtime_jobs_sound_cpu_artifact_delivery_gap_closure_completed_with_warnings_ready_for_billing_stripe_credits_gap_closure'
  ],
  [
    'billing Stripe credits gap closure',
    'worker_runtime_jobs_sound_cpu_billing_stripe_credits_gap_closure_completed_with_warnings_ready_for_compliance_security_gap_closure'
  ],
  [
    'compliance security gap closure',
    'worker_runtime_jobs_sound_cpu_compliance_security_gap_closure_completed_with_warnings_ready_for_product_beta_readiness_gap_closure'
  ],
  [
    'security cost support gate evidence plan',
    'worker_runtime_jobs_sound_cpu_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_reconsideration_no_unlock'
  ],
  [
    'no real user media boundary evidence plan',
    'worker_runtime_jobs_sound_cpu_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_no_artifact_storage_delivery_evidence_plan_after_runner_boundary_execution_proof'
  ]
]) {
  assert(
    sources.some((entry) => entry.source === source && entry.decision === decision),
    `missing source register entry: ${source}`
  )
}
assert(parsed.sourceRegister.sourceConclusion.requiredSourcePr1381Merged === true, 'PR #1381 source not marked merged')
assert(parsed.sourceRegister.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence must be absent')

const live = parsed.liveSnapshot
assert(live.prodReadinessSummary.overallStatus === 'blocked', 'live prod status mismatch')
assert(live.prodReadinessSummary.hardBlockers === 101, 'live hard blockers mismatch')
assert(live.prodReadinessSummary.warnings === 26, 'live warnings mismatch')
assert(live.prodReadinessSummary.toolStatuses.missing === 10, 'missing tool count mismatch')
assert(live.prodReadinessSummary.toolStatuses.notInstalled === 17, 'not-installed tool count mismatch')
assert(live.prodBetaSummary.status === 'internal_testing_ready', 'live beta status mismatch')
assert(live.prodBetaSummary.internalDryRunAllowed === true, 'live internal dry run mismatch')
assert(live.prodBetaSummary.externalBetaAllowed === false, 'live external beta must remain false')
assert(live.prodBetaSummary.realUserMediaBetaAllowed === false, 'live real-user beta must remain false')
assert(live.prodBetaSummary.paidProductionAllowed === false, 'live paid production must remain false')
assert(live.prodBetaSummary.productionAllowed === false, 'live production must remain false')
assert(live.crossChatOwnershipDiagnostics.status === 'passed', 'ownership diagnostics status mismatch')
assert(live.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflict count mismatch')
assert(live.snapshotConclusion.externalBetaStillBlocked === true, 'snapshot should block external beta')
assert(live.snapshotConclusion.realUserMediaBetaStillBlocked === true, 'snapshot should block real-user media')
assert(live.snapshotConclusion.safeToUnlockExternalBetaInThisPrompt === false, 'snapshot must not allow unlock')

const blocker = parsed.blockers
assert(blocker.closedPlanningBoundaries.length >= 10, 'closed boundary count too low')
const selected = blocker.stillBlockedForExternalBeta.find((item) => item.smallestNextBlocker === true)
assert(selected?.blockerId === 'real_user_media_beta_boundary_closed', 'selected blocker entry mismatch')
assert(selected.nextPrompt === NEXT_PROMPT, 'selected blocker prompt mismatch')
assert(blocker.stillBlockedForExternalBeta.some((item) => item.blockerId === 'launch_core_tool_readiness_missing'), 'launch-core blocker missing')
assert(blocker.stillBlockedForExternalBeta.some((item) => item.blockerId === 'model_weight_and_license_reviews_pending'), 'model/license blocker missing')
assert(blocker.stillBlockedForExternalBeta.some((item) => item.blockerId === 'deployment_security_cost_approval_pending'), 'deployment/security/cost blocker missing')
assert(blocker.classificationConclusion.externalBetaStillBlocked === true, 'classification should block external beta')
assert(blocker.classificationConclusion.selectedFollowUpCreated === true, 'follow-up flag missing')
assert(blocker.classificationConclusion.safeToForceExternalBeta === false, 'must not force external beta')

const claim = parsed.claimPolicy
for (const required of [
  'external beta ready',
  'external beta unlocked',
  'real-user media beta ready',
  'worker execution ready',
  'route execution ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'production ready'
]) {
  assert(claim.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assert(claim.closedFlags.externalBetaReconciledToday === true, 'external beta reconciliation flag missing')
assertAllFalse(claim.closedFlags, 'claim.closedFlags', ['externalBetaReconciledToday'])
assertSupabaseNoop(claim.supabaseClassification, 'claimPolicy')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      externalBetaAllowed: false,
      realUserMediaBetaAllowed: false,
      selectedSmallestBlocker: 'real_user_media_beta_boundary_closed',
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
