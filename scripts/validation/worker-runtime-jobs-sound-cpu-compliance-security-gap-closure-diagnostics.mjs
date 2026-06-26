import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  billingClosure: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure.md',
  billingRemaining: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-remaining-register.md',
  migrationReview: 'migration-review-and-rls-hardening.md',
  rlsMatrix: 'rls-hardening-matrix.md',
  dataPrivacy: 'data-privacy-retention-plan.md',
  productionSecurity: 'docs/production-security-review-policy.md',
  productionPrivacy: 'docs/production-privacy-retention-policy.md',
  complianceOwnerEvidence: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-compliance-security.md',
  phase44lReview: 'docs/activation-phase-44l-route-dry-run-security-review.md',
  phase44lReport: 'docs/activation-phase-44l-route-dry-run-approval-reports/phase_44l_route_dry_run_security_review.json',
}

const decision = 'worker_runtime_jobs_sound_cpu_compliance_security_gap_closure_completed_with_warnings_ready_for_product_beta_readiness_gap_closure'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_billing_stripe_credits_gap_closure_completed_with_warnings_ready_for_compliance_security_gap_closure'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PRODUCT-BETA-READINESS-GAP-CLOSURE: close product beta readiness gap, no execution'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
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

function assertTextIncludes(relativePath, phrases) {
  const text = read(relativePath)
  for (const phrase of phrases) {
    assert(text.includes(phrase), `${relativePath} missing phrase: ${phrase}`)
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
    'productBetaReadinessGapClosureMayBePlanned',
    'securityReviewRequiredBeforeExternalBeta',
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

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-compliance-security-gap-claim-policy')
const billingClosure = parseJsonFence(files.billingClosure, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure')
const billingRemaining = parseJsonFence(files.billingRemaining, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-remaining-register')
const complianceOwnerEvidence = parseJsonFence(files.complianceOwnerEvidence, 'worker-runtime-jobs-sound-cpu-owner-evidence-submission-compliance-security')
const phase44lReport = parseJsonFile(files.phase44lReport)
const promptText = read(files.nextPrompt)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === 'c09e08bccacf9a1ca820a6006a5a8c241627ac51', 'source head mismatch')
assert(closure.sourceVerification.pr1081.mergeCommit === 'c09e08bccacf9a1ca820a6006a5a8c241627ac51', 'PR #1081 merge commit mismatch')
assert(closure.sourceVerification.pr1081.decision === sourceDecision, 'PR #1081 decision mismatch')
assert(closure.sourceVerification.complianceEvidence.migrationReviewRead === true, 'migration review not read')
assert(closure.sourceVerification.complianceEvidence.rlsHardeningMatrixRead === true, 'RLS matrix not read')
assert(closure.sourceVerification.complianceEvidence.dataPrivacyRetentionPlanRead === true, 'data privacy plan not read')
assert(closure.sourceVerification.complianceEvidence.productionSecurityPolicyRead === true, 'production security policy not read')
assert(closure.sourceVerification.complianceEvidence.productionPrivacyRetentionPolicyRead === true, 'production privacy policy not read')
assert(closure.sourceVerification.complianceEvidence.complianceOwnerEvidenceDecision === complianceOwnerEvidence.decision, 'compliance owner evidence decision mismatch')
assert(closure.gapClosureResult.closedGapId === 'compliance_security', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 7, 'closed gap count should be seven')
assert(closure.gapClosureResult.remainingGapCount === 1, 'remaining gap count mismatch')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
for (const key of [
  'workerDispatchContractPlanningGapClosed',
  'claimLeaseLifecyclePlanningGapClosed',
  'soundRuntimeMediaPlanningGapClosed',
  'supabaseSqlStoragePlanningGapClosed',
  'artifactDeliveryPlanningGapClosed',
  'billingStripeCreditsPlanningGapClosed',
  'complianceSecurityPlanningGapClosed',
  'rlsBoundaryEvidenceAccepted',
  'privacyRetentionBoundaryEvidenceAccepted',
  'secretBoundaryEvidenceAccepted',
  'serviceRoleBoundaryEvidenceAccepted',
  'securityReviewBoundaryEvidenceAccepted',
  'securityReviewRequiredBeforeExternalBeta',
]) {
  assert(closure.gapClosureResult[key] === true, `${key} should be true`)
}
assertFalseFlags(
  closure.gapClosureResult,
  [
    'secretMaterialApprovedToday',
    'serviceAccountApprovedToday',
    'secretManagerApprovedToday',
    'rawPromptExecutionApprovedToday',
    'providerOutputBlobApprovedToday',
    'publicArtifactCreationApprovedToday',
    'browserCaptureApprovedToday',
    'retentionPolicyEnforcedToday',
    'rlsExecutionApprovedToday',
    'supabaseMutationApprovedToday',
    'serviceRoleMutationApprovedToday',
    'sqlExecutionApprovedToday',
    'storageWriteApprovedToday',
    'creditMutationApprovedToday',
    'stripeCheckoutApprovedToday',
    'stripeWebhookApprovedToday',
    'paymentProcessingApprovedToday',
    'workerExecutionApprovedToday',
    'runtimeExecutionApprovedToday',
    'mediaProcessingApprovedToday',
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
}
assert(sourceRegister.summary.sourceRowCount === 10, 'source row summary mismatch')
assert(sourceRegister.summary.acceptedSourceRowCount === 10, 'accepted row summary mismatch')
assertFalseFlags(
  sourceRegister.summary,
  [
    'acceptedForExecution',
    'acceptedForSecretMaterial',
    'acceptedForServiceAccount',
    'acceptedForSecretManager',
    'acceptedForRawPromptExecution',
    'acceptedForProviderOutputBlob',
    'acceptedForPublicArtifactCreation',
    'acceptedForExternalBeta',
    'acceptedForProduction',
  ],
  'sourceRegister.summary',
)

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'compliance_security', 'acceptance gap mismatch')
for (const key of [
  'acceptedForPlanningGapClosure',
  'acceptedForRlsBoundaryPlanning',
  'acceptedForPrivacyRetentionBoundaryPlanning',
  'acceptedForSecretBoundaryPlanning',
  'acceptedForServiceRoleBoundaryPlanning',
  'acceptedForSecurityReviewPlanning',
]) {
  assert(acceptance.acceptedClosure[key] === true, `${key} should be true`)
}
assertFalseFlags(
  acceptance.acceptedClosure,
  [
    'acceptedForSecretMaterial',
    'acceptedForServiceAccount',
    'acceptedForSecretManagerApiCall',
    'acceptedForRawPromptExecution',
    'acceptedForProviderOutputBlob',
    'acceptedForBrowserCapture',
    'acceptedForPublicArtifactCreation',
    'acceptedForWorkerExecution',
    'acceptedForRouteExecution',
    'acceptedForRuntimeReadiness',
    'acceptedForExternalBeta',
    'acceptedForProduction',
  ],
  'acceptance.acceptedClosure',
)
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 7, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 1, 'accepted remaining gap count mismatch')
assert(acceptance.acceptedCounts.sourceRowCount === 10, 'accepted source row count mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 7, 'closed gap list count mismatch')
assert(remaining.closedGaps[6].gapId === 'compliance_security', 'closed compliance gap missing')
for (const gap of remaining.closedGaps) {
  assert(gap.closedForPlanningToday === true, `${gap.gapId} should close for planning`)
  assert(gap.executionApprovedToday === false, `${gap.gapId} must not approve execution`)
}
assert(remaining.remainingGaps.length === 1, 'remaining gap count mismatch')
assert(remaining.remainingGaps[0].gapId === 'product_beta_readiness', 'next/final gap mismatch')
assert(remaining.remainingGaps[0].nextPromptMayProceed === true, 'product beta readiness should be next')
assert(remaining.summary.closedGapCountToday === 7, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 1, 'remaining summary count mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('compliance/security planning evidence gap closed'), 'allowed compliance closure claim missing')
assert(claims.allowedClaims.includes('product beta readiness gap closure may be planned next'), 'allowed beta handoff claim missing')
for (const claim of [
  'browser capture readiness',
  'RLS readiness',
  'Secret Manager readiness',
  'service account readiness',
  'raw prompt execution readiness',
  'provider output blob readiness',
  'compliance/security readiness',
  'external beta readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(claim), `${claim} must be forbidden`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(billingClosure.decision === sourceDecision, 'source closure decision mismatch')
assert(billingClosure.sourceVerification.sourceHead === 'a1f0e861427127a795fb0bac8003ff52a41c13ca', 'source closure source head mismatch')
assert(billingClosure.gapClosureResult.closedGapCountToday === 6, 'source closure closed count mismatch')
assert(billingClosure.gapClosureResult.remainingGapCount === 2, 'source closure remaining count mismatch')
assert(billingClosure.gapClosureResult.complianceSecurityApprovedToday === false, 'source compliance widened')
assert(billingRemaining.remainingGaps[0].gapId === 'compliance_security', 'source next gap mismatch')
assert(billingRemaining.remainingGaps[0].nextPromptMayProceed === true, 'source compliance gap should have been next')

assertTextIncludes(files.migrationReview, [
  'service-role boundaries',
  'any SQL is run or applied during this draft review task',
  'no active Supabase migration path is used',
])
assertTextIncludes(files.rlsMatrix, [
  'service_only',
  'Future credit ledger and reservation tables should be service-only and append-only.',
])
assertTextIncludes(files.dataPrivacy, [
  'Source media is private.',
  'Browser capture artifacts are private by default.',
  'No real retention policy is enforced in this task.',
])
assertTextIncludes(files.productionSecurity, [
  'not a substitute for human security review before external beta',
])
assertTextIncludes(files.productionPrivacy, [
  'All classes default to private storage.',
  'Worker temp data must be cleaned',
])

assert(complianceOwnerEvidence.ownerArea === 'COMPLIANCE_SECURITY', 'compliance owner area mismatch')
assert(complianceOwnerEvidence.packetShell.evidenceCollectedToday === false, 'owner evidence collected unexpectedly')
assert(complianceOwnerEvidence.packetShell.evidenceAcceptedToday === false, 'owner evidence accepted unexpectedly')
assert(complianceOwnerEvidence.packetShell.executionApprovalsGrantedToday === 'none', 'owner evidence approvals widened')
assertFalseFlags(
  complianceOwnerEvidence.closedGates,
  [
    'secretMaterialApprovedToday',
    'serviceAccountApprovedToday',
    'secretManagerApprovedToday',
    'rawPromptExecutionApprovedToday',
    'providerOutputBlobApprovedToday',
    'publicArtifactCreationApprovedToday',
    'runtimeReadinessClaimedToday',
  ],
  'complianceOwnerEvidence.closedGates',
)
assertSupabaseNoop(complianceOwnerEvidence.supabaseClassification, 'compliance owner evidence')

assertTextIncludes(files.phase44lReview, [
  'Route execution.',
  'Worker execution.',
  'Raw chat execution.',
  'Public artifacts.',
  'Provider calls.',
])
assert(phase44lReport.status === 'passed', 'Phase 44L report status mismatch')
assert(phase44lReport.noExecutionPerformed === true, 'Phase 44L no execution flag missing')
for (const check of phase44lReport.checks) {
  assert(check.passed === true, `Phase 44L check failed: ${check.checkId}`)
}

for (const phrase of [
  'Do not run workers',
  'run routes',
  'run tools',
  'dispatch jobs',
  'claim leases',
  'call GCP/Cloud Run/Secret Manager',
  'touch Supabase',
  'execute SQL',
  'create signed/public URLs',
  'mutate credits/Stripe',
  'unlock beta',
  'unlock production',
  'same-head and same-purpose open PRs',
]) {
  assert(promptText.includes(phrase), `next prompt missing phrase: ${phrase}`)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      closedGapCountToday: closure.gapClosureResult.closedGapCountToday,
      remainingGapCount: closure.gapClosureResult.remainingGapCount,
      nextPrompt,
      complianceSecurityReadinessClaimed: boundary.readinessBoundary.complianceSecurityReadinessClaimed,
      externalBetaAllowed: boundary.readinessBoundary.externalBetaAllowed,
      executionApprovalsGrantedToday: closure.gapClosureResult.executionApprovalsGrantedToday,
    },
    null,
    2,
  ),
)
