import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution.md',
  complianceClosure: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-closure.md',
  complianceRemaining: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-remaining-register.md',
  productPlan: 'product-plan.md',
  betaScorecard: 'docs/beta-readiness-scorecard.md',
  activationState: 'docs/activation-readiness-state.md',
  betaDecision: 'docs/activation-product-internal-beta-readiness-reports/internal_beta_go_no_go_decision.json',
  betaSummary: 'docs/activation-product-internal-beta-readiness-reports/internal_beta_readiness_summary.json',
  betaBlockers: 'docs/activation-product-internal-beta-readiness-reports/internal_beta_blocker_inventory.json',
  betaOwnerMap: 'docs/activation-product-internal-beta-readiness-reports/internal_beta_owner_map.json',
}

const decision = 'worker_runtime_jobs_sound_cpu_product_beta_readiness_gap_closure_completed_with_warnings_all_planning_gaps_closed_runtime_beta_blocked'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_compliance_security_gap_closure_completed_with_warnings_ready_for_product_beta_readiness_gap_closure'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-BETA-BLOCKER-RESOLUTION: resolve remaining runtime beta blockers, no execution'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseJsonFence(relativePath, label) {
  const text = read(relativePath)
  const pattern = new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  assert(match, `Missing JSON fence ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function parseJsonFile(relativePath) {
  return JSON.parse(read(relativePath))
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update classification widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment classification widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase SQL classification widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migration classification widened`)
  assert(value?.nextAction === 'none', `${label} Supabase next action widened`)
}

function assertFalseFlags(value, keys, label) {
  for (const key of keys) {
    assert(value?.[key] === false, `${label}.${key} must remain false`)
  }
}

function assertBoundary(value) {
  const allowedTrue = new Set([
    'workerDispatchContractPlanningGapClosed',
    'claimLeaseLifecyclePlanningGapClosed',
    'soundRuntimeMediaPlanningGapClosed',
    'supabaseSqlStoragePlanningGapClosed',
    'artifactDeliveryPlanningGapClosed',
    'billingStripeCreditsPlanningGapClosed',
    'complianceSecurityPlanningGapClosed',
    'productBetaReadinessPlanningGapClosed',
    'allPlanningGapsClosedToday',
    'runtimeBetaBlockerResolutionMayBePlanned',
    'restrictedInternalTestingCandidateEvidenceAccepted',
    'internalSyntheticToolCallPlanningMayContinue',
  ])
  for (const [key, entry] of Object.entries(value)) {
    if (allowedTrue.has(key)) {
      assert(entry === true, `${key} should be true`)
    } else if (key === 'toolCandidateCount') {
      assert(entry === 15, 'boundary tool count mismatch')
    } else {
      assert(entry === false, `${key} must remain false`)
    }
  }
}

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-claim-policy')
const complianceClosure = parseJsonFence(files.complianceClosure, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-closure')
const complianceRemaining = parseJsonFence(files.complianceRemaining, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-remaining-register')
const betaDecision = parseJsonFile(files.betaDecision)
const betaSummary = parseJsonFile(files.betaSummary)
const betaBlockers = parseJsonFile(files.betaBlockers)
const betaOwnerMap = parseJsonFile(files.betaOwnerMap)
const promptText = read(files.nextPrompt)

read(files.productPlan)
read(files.betaScorecard)
read(files.activationState)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === 'f95f77aeb5602dc62e5b6659716721560601f163', 'source head mismatch')
assert(closure.sourceVerification.pr1085.mergeCommit === 'f95f77aeb5602dc62e5b6659716721560601f163', 'PR #1085 merge commit mismatch')
assert(closure.sourceVerification.pr1085.decision === sourceDecision, 'PR #1085 decision mismatch')
assert(complianceClosure.decision === sourceDecision, 'source compliance decision mismatch')
assert(complianceRemaining.summary.closedGapCountToday === 7, 'source closed gap count mismatch')
assert(complianceRemaining.summary.remainingGapCount === 1, 'source remaining gap count mismatch')

for (const key of [
  'productPlanRead',
  'betaReadinessScorecardRead',
  'activationReadinessStateRead',
  'internalBetaGoNoGoDecisionRead',
  'internalBetaReadinessSummaryRead',
  'internalBetaBlockerInventoryRead',
  'internalBetaOwnerMapRead',
  'restrictedInternalTestingCandidateEvidenceAccepted',
  'externalBetaBlockedBySourceEvidence',
  'productionBlockedBySourceEvidence',
]) {
  assert(closure.sourceVerification.productBetaEvidence[key] === true, `${key} should be true`)
}

assert(betaDecision.decision === 'restricted_internal_testing_candidate', 'internal beta decision mismatch')
assert(betaDecision.restrictedInternalTestingCandidate === true, 'restricted internal testing candidate missing')
assert(betaDecision.externalBetaAllowed === false, 'external beta must remain false')
assert(betaDecision.paidProductionAllowed === false, 'paid production must remain false')
assert(betaDecision.productionAllowed === false, 'production must remain false')
assert(betaDecision.runtimeExecutionAllowed === false, 'runtime execution must remain false')
assert(betaDecision.providerCallsAllowed === false, 'provider calls must remain false')
assert(betaDecision.supabaseWritesAllowedInThisPhase === false, 'Supabase writes must remain false')

assert(betaSummary.decision === 'restricted_internal_testing_candidate', 'summary decision mismatch')
assert(betaSummary.trackBCleanStagingSync === 'completed', 'Track B clean staging evidence missing')
for (const scope of [
  'production',
  'external_beta',
  'paid_production',
  'provider_calls',
  'live_tool_execution',
  'worker_execution',
  'route_execution',
  'public_artifacts',
  'signed_urls_as_source_of_truth',
  'broad_media_processing',
  'raw_prompt_execution',
]) {
  assert(betaSummary.blockedScope.includes(scope), `blocked scope missing: ${scope}`)
}
for (const key of ['runtimeToolsWorkersRoutes', 'providers', 'publicArtifacts', 'production', 'supabaseWrites', 'secretsPrintedOrCommitted']) {
  assert(betaSummary[key] === false, `beta summary ${key} must remain false`)
}

assert(betaBlockers.productionBlocked === true, 'production blocker missing')
assert(betaBlockers.externalBetaBlocked === true, 'external beta blocker missing')
assert(betaBlockers.paidProductionBlocked === true, 'paid production blocker missing')
assert(betaBlockers.runtimeExecutionBlocked === true, 'runtime execution blocker missing')
assert(betaBlockers.providerCallsBlocked === true, 'provider blocker missing')
assert(betaBlockers.publicArtifactsBlocked === true, 'public artifact blocker missing')
assert(betaBlockers.supabaseProductionPromotionBlocked === true, 'Supabase production blocker missing')
assert(betaOwnerMap.owners.some((owner) => owner.ownerId === 'WORKER_RUNTIME_JOBS'), 'WORKER_RUNTIME_JOBS owner missing')
assert(betaOwnerMap.owners.some((owner) => owner.ownerId === 'PUBLIC_ARTIFACT_DELIVERY'), 'PUBLIC_ARTIFACT_DELIVERY owner missing')
assert(betaOwnerMap.owners.some((owner) => owner.ownerId === 'SUPABASE_RLS_STORAGE_DATABASE'), 'SUPABASE owner missing')

assert(closure.gapClosureResult.closedGapId === 'product_beta_readiness', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 8, 'closed gap count should be eight')
assert(closure.gapClosureResult.remainingGapCount === 0, 'remaining gap count should be zero')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
for (const key of [
  'workerDispatchContractPlanningGapClosed',
  'claimLeaseLifecyclePlanningGapClosed',
  'soundRuntimeMediaPlanningGapClosed',
  'supabaseSqlStoragePlanningGapClosed',
  'artifactDeliveryPlanningGapClosed',
  'billingStripeCreditsPlanningGapClosed',
  'complianceSecurityPlanningGapClosed',
  'productBetaReadinessPlanningGapClosed',
  'allPlanningGapsClosedToday',
  'restrictedInternalTestingCandidateEvidenceAccepted',
]) {
  assert(closure.gapClosureResult[key] === true, `${key} should be true`)
}
assertFalseFlags(
  closure.gapClosureResult,
  [
    'productWideBetaApprovedToday',
    'internalBetaUnlockApprovedToday',
    'externalBetaUnlockApprovedToday',
    'paidProductionApprovedToday',
    'productionApprovedToday',
    'workerExecutionApprovedToday',
    'routeExecutionApprovedToday',
    'toolExecutionApprovedToday',
    'runtimeExecutionApprovedToday',
    'mediaProcessingApprovedToday',
    'providerCallsApprovedToday',
    'publicArtifactsApprovedToday',
    'signedUrlsApprovedToday',
    'supabaseWritesApprovedToday',
    'sqlExecutionApprovedToday',
    'creditMutationApprovedToday',
    'stripePaymentProcessingApprovedToday',
    'generatedLocalFixturePassedClaimedToday',
    'dryRunPassedClaimedToday',
    'runtimeReadinessClaimedToday',
    'workerReadinessClaimedToday',
    'mediaReadinessClaimedToday',
    'realUserMediaBetaAllowed',
    'internalBetaAllowed',
    'externalBetaAllowed',
    'productionAllowed',
  ],
  'closure.gapClosureResult',
)
assert(closure.gapClosureResult.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')
assert(closure.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(sourceRegister.decision === decision, 'source register decision mismatch')
assert(sourceRegister.sourceRows.length === 10, 'source row count mismatch')
for (const row of sourceRegister.sourceRows) {
  read(row.file)
  assert(row.acceptedForGapClosure === true, `${row.sourceId} not accepted`)
  assert(row.acceptedForExecution === false, `${row.sourceId} must not approve execution`)
}
assert(sourceRegister.summary.sourceRowCount === 10, 'source row summary mismatch')
assert(sourceRegister.summary.acceptedSourceRowCount === 10, 'accepted source row summary mismatch')
assertFalseFlags(
  sourceRegister.summary,
  [
    'acceptedForExecution',
    'acceptedForInternalBetaUnlock',
    'acceptedForExternalBetaUnlock',
    'acceptedForProductionUnlock',
    'acceptedForWorkerExecution',
    'acceptedForRouteExecution',
    'acceptedForToolExecution',
    'acceptedForMediaProcessing',
    'acceptedForSupabaseMutation',
    'acceptedForSqlExecution',
    'acceptedForPublicArtifacts',
  ],
  'sourceRegister.summary',
)

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'product_beta_readiness', 'acceptance gap mismatch')
for (const key of [
  'acceptedForPlanningGapClosure',
  'acceptedForRestrictedInternalTestingEvidence',
  'acceptedForProductBetaReadinessBoundaryPlanning',
  'acceptedForRuntimeBetaBlockerResolutionPlanning',
]) {
  assert(acceptance.acceptedClosure[key] === true, `${key} should be true`)
}
assertFalseFlags(
  acceptance.acceptedClosure,
  [
    'acceptedForInternalBetaUnlock',
    'acceptedForExternalBetaUnlock',
    'acceptedForPaidProductionUnlock',
    'acceptedForProductionUnlock',
    'acceptedForWorkerExecution',
    'acceptedForRouteExecution',
    'acceptedForToolExecution',
    'acceptedForMediaProcessing',
    'acceptedForProviderCalls',
    'acceptedForPublicArtifacts',
    'acceptedForSignedUrls',
    'acceptedForSupabaseMutation',
    'acceptedForSqlExecution',
    'acceptedForCreditMutation',
    'acceptedForStripePaymentProcessing',
    'acceptedForRuntimeReadiness',
  ],
  'acceptance.acceptedClosure',
)
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 8, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 0, 'accepted remaining gap count mismatch')
assert(acceptance.acceptedCounts.sourceRowCount === 10, 'accepted source count mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 8, 'closed gap list count mismatch')
for (const gap of remaining.closedGaps) {
  assert(gap.closedForPlanningToday === true, `${gap.gapId} should close for planning`)
  assert(gap.executionApprovedToday === false, `${gap.gapId} must not approve execution`)
}
assert(remaining.remainingPlanningGaps.length === 0, 'remaining planning gaps should be zero')
assert(remaining.remainingRuntimeBlockers.length === 15, 'runtime blocker count mismatch')
assert(remaining.summary.closedGapCountToday === 8, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 0, 'remaining summary count mismatch')
assert(remaining.summary.nextPrompt === nextPrompt, 'remaining next prompt mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('all eight SOUND CPU planning evidence gaps are closed'), 'allowed all-gaps claim missing')
assert(claims.allowedClaims.includes('runtime beta blocker resolution may be planned next'), 'allowed next prompt claim missing')
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'live tool-call readiness',
  'runtime readiness',
  'internal beta readiness',
  'external beta readiness',
  'production readiness',
  'real user media beta readiness',
]) {
  assert(claims.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims')

assert(promptText.includes(decision), 'next prompt missing product beta decision')
assert(promptText.includes('Duplicate guard is mandatory'), 'next prompt missing duplicate guard')
for (const phrase of [
  'workerExecutionAllowed: false',
  'mediaProcessingAllowed: false',
  'internalBetaAllowed: false',
  'externalBetaAllowed: false',
  'productionAllowed: false',
]) {
  assert(promptText.includes(phrase), `next prompt missing boundary phrase: ${phrase}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-product-beta-readiness-gap-closure:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_product_beta_readiness_gap_closure_diagnostics_passed',
  decision,
  toolCandidateCount: closure.gapClosureResult.toolCandidateCount,
  closedGapCountToday: closure.gapClosureResult.closedGapCountToday,
  remainingGapCount: closure.gapClosureResult.remainingGapCount,
  runtimeReadinessClaimedToday: closure.gapClosureResult.runtimeReadinessClaimedToday,
  internalBetaAllowed: closure.gapClosureResult.internalBetaAllowed,
  externalBetaAllowed: closure.gapClosureResult.externalBetaAllowed,
  productionAllowed: closure.gapClosureResult.productionAllowed,
  nextPrompt,
}, null, 2))
