import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_deployment_security_cost_reconciliation_after_model_license_blocker_completed_with_warnings_ready_for_external_beta_owner_review_no_external_beta'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_model_license_blocker_reconciliation_after_launch_core_tool_readiness_closure_completed_with_warnings_ready_for_deployment_security_cost_reconciliation_no_external_beta'
const SOURCE_COMMIT = '28b03148ffc09e03593579c05935c05b03b342af'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EXTERNAL-BETA-OWNER-REVIEW-AFTER-DEPLOYMENT-SECURITY-COST-RECONCILIATION: review external beta readiness after deployment/security/cost planning closure, no external beta unlock'

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-deployment-security-cost-reconciliation-after-model-license-blocker.md',
    label: 'worker-runtime-jobs-sound-cpu-deployment-security-cost-reconciliation-after-model-license-blocker'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-deployment-security-cost-source-register-after-model-license-blocker.md',
    label: 'worker-runtime-jobs-sound-cpu-deployment-security-cost-source-register-after-model-license-blocker'
  },
  liveReadiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-deployment-security-cost-live-readiness-after-model-license-blocker.md',
    label: 'worker-runtime-jobs-sound-cpu-deployment-security-cost-live-readiness-after-model-license-blocker'
  },
  blockerRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-deployment-security-cost-blocker-register-after-model-license-blocker.md',
    label: 'worker-runtime-jobs-sound-cpu-deployment-security-cost-blocker-register-after-model-license-blocker'
  },
  ownerHandoff: {
    path: 'docs/worker-runtime-jobs-sound-cpu-operational-owner-handoff-register-after-model-license-blocker.md',
    label: 'worker-runtime-jobs-sound-cpu-operational-owner-handoff-register-after-model-license-blocker'
  },
  betaHandoff: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-owner-review-handoff-after-deployment-security-cost.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-owner-review-handoff-after-deployment-security-cost'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-deployment-security-cost-claim-policy-after-model-license-blocker.md',
    label: 'worker-runtime-jobs-sound-cpu-deployment-security-cost-claim-policy-after-model-license-blocker'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-external-beta-owner-review-after-deployment-security-cost-reconciliation.md'

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"deploymentApprovedToday": true',
  '"cloudRunApprovedToday": true',
  '"googleCloudApiCallApprovedToday": true',
  '"secretManagerApprovedToday": true',
  '"costBudgetApprovedToday": true',
  '"securityReviewApprovedToday": true',
  '"supportRunbookApprovedToday": true',
  '"rollbackPlanApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"modelDownloadApprovedToday": true',
  '"providerModelCallApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
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
assert(promptText.includes('no external beta unlock'), 'next prompt missing no-unlock scope')
assert(promptText.includes('No external beta unlock'), 'next prompt missing forbidden external beta unlock statement')

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.sourcePr === 1401, 'source PR mismatch')
assert(reconciliation.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(reconciliation.reconciliationResult.deploymentSecurityCostBlockerReconciledForPlanningOnly === true, 'planning reconciliation flag missing')
assert(reconciliation.reconciliationResult.externalBetaAllowed === false, 'external beta must remain false')
assert(reconciliation.reconciliationResult.realUserMediaBetaAllowed === false, 'real-user beta must remain false')
assert(reconciliation.reconciliationResult.productionAllowed === false, 'production must remain false')
assert(reconciliation.reconciliationResult.selectedNextBlocker === 'external_beta_unlock_owner_review_missing', 'next blocker mismatch')
assert(reconciliation.reconciliationResult.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(reconciliation.liveReadinessAtReconciliation.overallStatus === 'blocked', 'readiness status mismatch')
assert(reconciliation.liveReadinessAtReconciliation.hardBlockers === 101, 'hard blocker count mismatch')
assert(reconciliation.liveReadinessAtReconciliation.warnings === 26, 'warning count mismatch')
assertSupabaseNoop(reconciliation.supabaseClassification, 'reconciliation')
assertAllFalse(reconciliation.reconciliationResult, 'reconciliation.reconciliationResult', [
  'deploymentSecurityCostBlockerReconciledForPlanningOnly',
  'selectedNextBlocker',
  'nextPrompt'
])

const sources = parsed.sourceRegister.sources
assert(sources.length === 5, 'source register count mismatch')
assert(sources.some((entry) => entry.source === 'PR #1401' && entry.mergeCommit === SOURCE_COMMIT), 'missing PR #1401 source')
assert(parsed.sourceRegister.sourceConclusion.requiredPr1401Merged === true, 'PR #1401 source not marked merged')
assert(parsed.sourceRegister.sourceConclusion.samePurposeDuplicateFound === false, 'same-purpose duplicate must be false')
assert(parsed.sourceRegister.sourceConclusion.deploymentApprovalEvidencePresent === false, 'deployment approval evidence must be absent')
assert(parsed.sourceRegister.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence must be absent')
assert(parsed.sourceRegister.sourceConclusion.safeToProceedToExternalBetaOwnerReview === true, 'external beta owner review handoff missing')

const live = parsed.liveReadiness
assert(live.prodReadinessSummary.overallStatus === 'blocked', 'live prod status mismatch')
assert(live.prodReadinessSummary.hardBlockers === 101, 'live hard blockers mismatch')
assert(live.prodReadinessSummary.warnings === 26, 'live warnings mismatch')
assert(live.prodBetaSummary.status === 'internal_testing_ready', 'live beta mismatch')
assert(live.prodBetaSummary.externalBetaAllowed === false, 'live external beta must remain false')
assert(live.prodBetaSummary.realUserMediaBetaAllowed === false, 'live real-user media beta must remain false')
assert(live.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflicts mismatch')
assert(live.liveConclusion.deploymentSecurityCostBlockersRemainLive === true, 'deployment/security/cost blockers must remain live')
assert(live.liveConclusion.deploymentSecurityCostClosedForPlanningOnly === true, 'planning closure missing')
assert(live.liveConclusion.safeToUnlockExternalBetaInThisPrompt === false, 'must not unlock external beta')

const blockers = parsed.blockerRegister
assert(blockers.blockerGroups.length === 3, 'blocker group count mismatch')
for (const group of ['deployment_readiness', 'security_secret_management', 'cost_support_operations']) {
  const item = blockers.blockerGroups.find((entry) => entry.groupId === group)
  assert(item, `missing blocker group ${group}`)
  assert(item.approvedToday === false, `${group} must not be approved today`)
  assert(item.items.length >= 4, `${group} must list blocker items`)
}
assertAllFalse(blockers.blockedActions, 'blockers.blockedActions')
assert(blockers.registerConclusion.blockerGroupCount === 3, 'register group count mismatch')
assert(blockers.registerConclusion.deploymentSecurityCostBlockersRepresented === true, 'blocker representation missing')
assert(blockers.registerConclusion.deploymentSecurityCostClosedForPlanningOnly === true, 'blocker planning closure missing')
assert(blockers.registerConclusion.deploymentSecurityCostApprovedForExternalBeta === false, 'external beta approval must be false')

const owners = parsed.ownerHandoff
assert(owners.ownerHandoffs.length === 4, 'owner handoff count mismatch')
for (const ownerLane of ['DEPLOYMENT_OPERATIONS', 'SECURITY_COMPLIANCE', 'COST_SUPPORT_OPERATIONS', 'PRODUCT_BETA_READINESS']) {
  const item = owners.ownerHandoffs.find((entry) => entry.ownerLane === ownerLane)
  assert(item, `missing owner lane ${ownerLane}`)
  assert(item.approvedToday === false, `${ownerLane} must not be approved today`)
}
assert(owners.handoffConclusion.allRequiredOwnerLanesRepresented === true, 'owner lane representation missing')
assert(owners.handoffConclusion.ownerApprovalsGrantedToday === false, 'owner approvals must be false')
assert(owners.handoffConclusion.externalBetaOwnerReviewMayProceed === true, 'external beta owner review handoff missing')
assert(owners.handoffConclusion.externalBetaUnlockApprovedToday === false, 'external beta unlock must be false')

const beta = parsed.betaHandoff
assert(beta.externalBetaOwnerReviewHandoff.handoffReadyForReview === true, 'beta handoff ready missing')
assert(beta.externalBetaOwnerReviewHandoff.externalBetaAllowedToday === false, 'external beta allowed must be false')
assert(beta.externalBetaOwnerReviewHandoff.externalBetaUnlockApprovedToday === false, 'external beta unlock must be false')
assert(beta.externalBetaOwnerReviewHandoff.nextPrompt === NEXT_PROMPT, 'beta handoff next prompt mismatch')
assert(beta.handoffBoundaries.canReviewExternalBetaReadinessNext === true, 'can review next missing')
assertAllFalse(beta.handoffBoundaries, 'beta.handoffBoundaries', ['canReviewExternalBetaReadinessNext'])

const claim = parsed.claimPolicy
assert(claim.closedFlags.deploymentSecurityCostBlockerReconciledForPlanningOnly === true, 'planning-only reconciliation flag missing')
assertAllFalse(claim.closedFlags, 'claim.closedFlags', ['deploymentSecurityCostBlockerReconciledForPlanningOnly'])
for (const required of [
  'deployment approved',
  'Cloud Run approved',
  'security approved',
  'cost approved',
  'support approved',
  'external beta ready',
  'external beta unlocked',
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
      deploymentSecurityCostClosedForPlanningOnly: true,
      selectedNextBlocker: 'external_beta_unlock_owner_review_missing',
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
