import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_real_user_media_beta_boundary_closure_after_external_beta_reconciliation_completed_with_warnings_ready_for_external_beta_blocker_reconciliation_no_external_beta'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_readiness_reconciliation_after_beta_support_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_specific_blocker_closure'
const SOURCE_COMMIT = '096230d9fa0052cd1179639e092cb2024627e8ae'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EXTERNAL-BETA-BLOCKER-RECONCILIATION-AFTER-REAL-USER-MEDIA-BOUNDARY: reconcile remaining external beta blockers after real-user-media boundary closure, no external beta'

const FILES = {
  closure: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-closure-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-closure-after-external-beta-reconciliation'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-source-register-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-source-register-after-external-beta-reconciliation'
  },
  policy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-policy-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-policy-after-external-beta-reconciliation'
  },
  liveReadiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-live-readiness-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-live-readiness-after-external-beta-reconciliation'
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-blocker-register-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-blocker-register-after-external-beta-reconciliation'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-claim-policy-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-boundary-claim-policy-after-external-beta-reconciliation'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-real-user-media-boundary.md'

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"realUserMediaAcceptedToday": true',
  '"mediaFileOpenApprovedToday": true',
  '"uploadReadApprovedToday": true',
  '"storageObjectReadApprovedToday": true',
  '"signedUrlCreationApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
  '"runtimeReadinessClaimedToday": true',
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
assert(promptText.includes('no external beta'), 'next prompt missing no external beta scope')

const closure = parsed.closure
assert(closure.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(closure.sourcePr === 1389, 'source PR mismatch')
assert(closure.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(closure.boundaryClosureResult.realUserMediaBetaBoundaryClosedForPlanning === true, 'boundary planning closure missing')
assert(closure.boundaryClosureResult.realUserMediaBetaBoundaryClosedForExecution === false, 'boundary execution closure must be false')
for (const key of [
  'noRealUserMediaEvidenceAccepted',
  'artifactDeliveryEvidenceAccepted',
  'supabaseSqlStorageEvidenceAccepted',
  'securityCostSupportEvidenceAccepted',
  'productBetaReadinessEvidenceAccepted',
  'externalBetaReadinessReconciliationAccepted'
]) {
  assert(closure.boundaryClosureResult[key] === true, `closure.${key} should be true`)
}
assert(closure.boundaryClosureResult.currentBetaReadinessStatus === 'internal_testing_ready', 'beta status mismatch')
assertAllFalse(closure.boundaryClosureResult, 'closure.boundaryClosureResult', [
  'realUserMediaBetaBoundaryClosedForPlanning',
  'realUserMediaBetaBoundaryClosedForExecution',
  'noRealUserMediaEvidenceAccepted',
  'artifactDeliveryEvidenceAccepted',
  'supabaseSqlStorageEvidenceAccepted',
  'securityCostSupportEvidenceAccepted',
  'productBetaReadinessEvidenceAccepted',
  'externalBetaReadinessReconciliationAccepted',
  'currentBetaReadinessStatus'
])
assert(closure.nextBlocker.blockerId === 'external_beta_blocker_reconciliation', 'next blocker mismatch')
assert(closure.nextBlocker.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertSupabaseNoop(closure.supabaseClassification, 'closure')

const sources = parsed.sourceRegister.sources
assert(sources.length === 9, 'source register count mismatch')
for (const [source, decision] of [
  ['PR #1389', SOURCE_DECISION],
  [
    'PR #1381',
    'worker_runtime_jobs_sound_cpu_beta_support_boundary_closure_after_worker_route_boundary_completed_with_warnings_ready_for_external_beta_readiness_reconciliation_no_external_beta'
  ],
  [
    'PR #1377',
    'worker_runtime_jobs_sound_cpu_worker_route_execution_boundary_closure_after_product_tool_call_gap_completed_with_warnings_ready_for_beta_support_boundary_closure_no_external_beta'
  ],
  [
    'PR #1373',
    'worker_runtime_jobs_sound_cpu_product_tool_call_execution_readiness_gap_closure_after_internal_dry_run_completed_with_warnings_ready_for_worker_route_execution_boundary_closure_no_external_beta'
  ],
  [
    'no real user media boundary evidence plan',
    'worker_runtime_jobs_sound_cpu_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_no_artifact_storage_delivery_evidence_plan_after_runner_boundary_execution_proof'
  ],
  [
    'artifact delivery gap closure',
    'worker_runtime_jobs_sound_cpu_artifact_delivery_gap_closure_completed_with_warnings_ready_for_billing_stripe_credits_gap_closure'
  ],
  [
    'supabase sql storage gap closure',
    'worker_runtime_jobs_sound_cpu_supabase_sql_storage_gap_closure_completed_with_warnings_ready_for_artifact_delivery_gap_closure'
  ],
  [
    'security cost support gate evidence plan',
    'worker_runtime_jobs_sound_cpu_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_reconsideration_no_unlock'
  ],
  [
    'product beta readiness gap closure',
    'worker_runtime_jobs_sound_cpu_product_beta_readiness_gap_closure_completed_with_warnings_all_planning_gaps_closed_runtime_beta_blocked'
  ]
]) {
  assert(
    sources.some((entry) => entry.source === source && entry.decision === decision),
    `missing source register entry: ${source}`
  )
}
assert(parsed.sourceRegister.sourceConclusion.requiredExternalBetaReconciliationMerged === true, 'external beta reconciliation source missing')
assert(parsed.sourceRegister.sourceConclusion.realUserMediaExecutionEvidencePresent === false, 'real-user media execution evidence must be absent')
assert(parsed.sourceRegister.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence must be absent')

assert(parsed.policy.policyConclusion.boundaryClosedForPlanning === true, 'policy planning closure missing')
assert(parsed.policy.policyConclusion.boundaryClosedForExecution === false, 'policy execution closure must be false')
assert(parsed.policy.policyConclusion.externalBetaStillBlocked === true, 'policy external beta should remain blocked')
assertAllFalse(parsed.policy.blockedToday, 'policy.blockedToday')

assert(parsed.liveReadiness.prodBetaSummary.status === 'internal_testing_ready', 'live beta status mismatch')
assert(parsed.liveReadiness.prodBetaSummary.internalDryRunAllowed === true, 'internal dry-run should remain allowed')
assert(parsed.liveReadiness.prodBetaSummary.externalBetaAllowed === false, 'external beta should remain false')
assert(parsed.liveReadiness.prodBetaSummary.realUserMediaBetaAllowed === false, 'real-user beta should remain false')
assert(parsed.liveReadiness.prodReadinessSummary.overallStatus === 'blocked', 'prod readiness should remain blocked')
assert(parsed.liveReadiness.prodReadinessSummary.hardBlockers === 101, 'hard blocker count mismatch')
assert(parsed.liveReadiness.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflict mismatch')
assert(parsed.liveReadiness.liveConclusion.safeToUnlockExternalBetaInThisPrompt === false, 'live conclusion must not unlock')

assert(parsed.blockers.closedForPlanning[0].blockerId === 'real_user_media_beta_boundary_closed', 'closed blocker mismatch')
assert(parsed.blockers.closedForPlanning[0].closedForPlanning === true, 'closed planning mismatch')
assert(parsed.blockers.closedForPlanning[0].closedForExecution === false, 'closed execution must be false')
assert(parsed.blockers.remainingExternalBetaBlockers[0].blockerId === 'external_beta_blocker_reconciliation', 'next blocker order mismatch')
assert(parsed.blockers.nextPrompt === NEXT_PROMPT, 'blocker next prompt mismatch')

for (const required of [
  'real-user media accepted',
  'real-user media beta ready',
  'external beta ready',
  'external beta unlocked',
  'worker execution ready',
  'route execution ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'production ready'
]) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assertSupabaseNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      realUserMediaBetaBoundaryClosedForPlanning: true,
      realUserMediaAcceptedToday: false,
      externalBetaAllowed: false,
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
