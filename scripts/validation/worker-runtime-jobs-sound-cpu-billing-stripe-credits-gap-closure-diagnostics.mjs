import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  closure: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-source-register.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-acceptance-register.md',
  remaining: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-remaining-register.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-readiness-boundary.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-compliance-security-gap-closure.md',
  artifactClosure: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure.md',
  artifactRemaining: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-remaining-register.md',
  pricingAndCredits: 'pricing-and-credits.md',
  creditRuntimeApprovalGate: 'docs/credit-runtime-approval-gate.md',
  creditReservationSpendRefundFlow: 'docs/credit-reservation-spend-refund-flow.md',
  creditLedgerArchitecture: 'credit-ledger-architecture.md',
  generationCreditGate: 'docs/generation-credit-gate.md',
  creditRuntimeSchemaAudit: 'docs/credit-runtime-schema-audit.md',
  billingOwnerEvidence: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-submission-billing-credits.md',
  toolRouteBillingOwnerStatus: 'docs/activation-tool-route-execution-unlock-4-owner-approval-reports/tool_route_billing_credit_owner_status.json',
  workerNoopBillingMetadata: 'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_billing_credit_placeholder_metadata.json',
}

const decision = 'worker_runtime_jobs_sound_cpu_billing_stripe_credits_gap_closure_completed_with_warnings_ready_for_compliance_security_gap_closure'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_artifact_delivery_gap_closure_completed_with_warnings_ready_for_billing_stripe_credits_gap_closure'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-COMPLIANCE-SECURITY-GAP-CLOSURE: close compliance/security gap, no execution'

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
    'complianceSecurityGapClosureMayBePlanned',
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

const closure = parseJsonFence(files.closure, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure')
const sourceRegister = parseJsonFence(files.sourceRegister, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-source-register')
const acceptance = parseJsonFence(files.acceptance, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-acceptance-register')
const remaining = parseJsonFence(files.remaining, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-remaining-register')
const boundary = parseJsonFence(files.boundary, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-readiness-boundary')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-claim-policy')
const artifactClosure = parseJsonFence(files.artifactClosure, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure')
const artifactRemaining = parseJsonFence(files.artifactRemaining, 'worker-runtime-jobs-sound-cpu-artifact-delivery-gap-remaining-register')
const billingOwnerEvidence = parseJsonFence(files.billingOwnerEvidence, 'worker-runtime-jobs-sound-cpu-owner-evidence-submission-billing-credits')
const toolRouteBillingOwnerStatus = parseJsonFile(files.toolRouteBillingOwnerStatus)
const workerNoopBillingMetadata = parseJsonFile(files.workerNoopBillingMetadata)
const promptText = read(files.nextPrompt)

assert(closure.owner === 'WORKER_RUNTIME_JOBS', 'closure owner mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(closure.sourceVerification.sourceHead === 'a1f0e861427127a795fb0bac8003ff52a41c13ca', 'source head mismatch')
assert(closure.sourceVerification.pr1079.mergeCommit === 'a1f0e861427127a795fb0bac8003ff52a41c13ca', 'PR #1079 merge commit mismatch')
assert(closure.sourceVerification.pr1079.decision === sourceDecision, 'PR #1079 decision mismatch')
assert(closure.sourceVerification.billingEvidence.pricingAndCreditsPolicyRead === true, 'pricing policy not read')
assert(closure.sourceVerification.billingEvidence.creditRuntimeApprovalGateRead === true, 'credit gate not read')
assert(closure.sourceVerification.billingEvidence.creditReservationSpendRefundFlowRead === true, 'credit flow not read')
assert(closure.sourceVerification.billingEvidence.creditLedgerArchitectureRead === true, 'credit ledger not read')
assert(closure.sourceVerification.billingEvidence.billingOwnerEvidenceDecision === billingOwnerEvidence.decision, 'billing owner evidence decision mismatch')
assert(closure.gapClosureResult.closedGapId === 'billing_stripe_credits', 'closed gap mismatch')
assert(closure.gapClosureResult.closedGapCountToday === 6, 'closed gap count should be six')
assert(closure.gapClosureResult.remainingGapCount === 2, 'remaining gap count mismatch')
assert(closure.gapClosureResult.toolCandidateCount === 15, 'tool count mismatch')
for (const key of [
  'workerDispatchContractPlanningGapClosed',
  'claimLeaseLifecyclePlanningGapClosed',
  'soundRuntimeMediaPlanningGapClosed',
  'supabaseSqlStoragePlanningGapClosed',
  'artifactDeliveryPlanningGapClosed',
  'billingStripeCreditsPlanningGapClosed',
  'creditEstimateBoundaryEvidenceAccepted',
  'creditApprovalBoundaryEvidenceAccepted',
  'creditReservationBoundaryEvidenceAccepted',
  'creditSpendReleaseRefundBoundaryEvidenceAccepted',
  'stripeCheckoutWebhookPaymentBoundaryEvidenceAccepted',
]) {
  assert(closure.gapClosureResult[key] === true, `${key} should be true`)
}
assertFalseFlags(
  closure.gapClosureResult,
  [
    'creditMutationApprovedToday',
    'creditReservationApprovedToday',
    'creditSpendApprovedToday',
    'creditRefundApprovedToday',
    'stripeCheckoutApprovedToday',
    'stripeWebhookApprovedToday',
    'paymentProcessingApprovedToday',
    'billingReadinessClaimedToday',
    'privateArtifactWriteApprovedToday',
    'publicArtifactCreationApprovedToday',
    'storageTransferApprovedToday',
    'signedUrlCreationApprovedToday',
    'supabaseMutationApprovedToday',
    'serviceRoleMutationApprovedToday',
    'sqlExecutionApprovedToday',
    'workerDispatchApprovedToday',
    'claimLeaseApprovedToday',
    'workerExecutionApprovedToday',
    'runtimeExecutionApprovedToday',
    'mediaProcessingApprovedToday',
    'complianceSecurityApprovedToday',
    'internalBetaAllowed',
    'externalBetaAllowed',
    'productionAllowed',
  ],
  'closure.gapClosureResult',
)
assert(closure.gapClosureResult.executionApprovalsGrantedToday === 'none', 'execution approvals must be none')
assert(closure.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(sourceRegister.decision === decision, 'source register decision mismatch')
assert(sourceRegister.sourceRows.length === 11, 'source row count mismatch')
for (const row of sourceRegister.sourceRows) {
  read(row.file)
  assert(row.acceptedForGapClosure === true, `${row.sourceId} not accepted`)
}
assert(sourceRegister.summary.sourceRowCount === 11, 'source row summary mismatch')
assert(sourceRegister.summary.acceptedSourceRowCount === 11, 'accepted row summary mismatch')
assertFalseFlags(
  sourceRegister.summary,
  [
    'acceptedForExecution',
    'acceptedForCreditMutation',
    'acceptedForCreditReservation',
    'acceptedForCreditSpend',
    'acceptedForCreditRefund',
    'acceptedForStripeCheckout',
    'acceptedForStripeWebhook',
    'acceptedForPaymentProcessing',
  ],
  'sourceRegister.summary',
)

assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(acceptance.acceptedClosure.gapId === 'billing_stripe_credits', 'acceptance gap mismatch')
assert(acceptance.acceptedClosure.acceptedForPlanningGapClosure === true, 'planning closure missing')
assert(acceptance.acceptedClosure.acceptedForCreditEstimatePlanning === true, 'credit estimate planning missing')
assert(acceptance.acceptedClosure.acceptedForApprovalGatePlanning === true, 'approval gate planning missing')
assert(acceptance.acceptedClosure.acceptedForReservationBoundaryPlanning === true, 'reservation boundary planning missing')
assertFalseFlags(
  acceptance.acceptedClosure,
  [
    'acceptedForCreditMutation',
    'acceptedForCreditReservationMutation',
    'acceptedForCreditSpendMutation',
    'acceptedForCreditRefundMutation',
    'acceptedForStripeCheckout',
    'acceptedForStripeWebhook',
    'acceptedForPaymentProcessing',
    'acceptedForWorkerExecution',
    'acceptedForRouteExecution',
    'acceptedForRuntimeReadiness',
  ],
  'acceptance.acceptedClosure',
)
assert(acceptance.acceptedCounts.toolCandidateCount === 15, 'accepted tool count mismatch')
assert(acceptance.acceptedCounts.closedGapCountToday === 6, 'accepted closed gap count mismatch')
assert(acceptance.acceptedCounts.remainingGapCount === 2, 'accepted remaining gap count mismatch')
assert(acceptance.acceptedCounts.sourceRowCount === 11, 'accepted source row count mismatch')
assert(acceptance.acceptedCounts.acceptedSourceRowCount === 11, 'accepted source row summary mismatch')
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance')

assert(remaining.decision === decision, 'remaining decision mismatch')
assert(remaining.closedGaps.length === 6, 'closed gap list count mismatch')
assert(remaining.closedGaps.map((gap) => gap.gapId).join(',') === 'worker_dispatch_contract,claim_lease_lifecycle,sound_runtime_media,supabase_sql_storage,artifact_delivery,billing_stripe_credits', 'closed gap order mismatch')
for (const gap of remaining.closedGaps) {
  assert(gap.closedForPlanningToday === true, `${gap.gapId} should close for planning`)
  assert(gap.executionApprovedToday === false, `${gap.gapId} must not approve execution`)
}
assert(remaining.remainingGaps.length === 2, 'remaining gap count mismatch')
assert(remaining.remainingGaps[0].gapId === 'compliance_security', 'next gap mismatch')
assert(remaining.remainingGaps[0].nextPromptMayProceed === true, 'compliance/security should be next')
assert(remaining.remainingGaps[1].gapId === 'product_beta_readiness', 'final gap mismatch')
assert(remaining.remainingGaps[1].nextPromptMayProceed === false, 'product beta should wait')
assert(remaining.summary.closedGapCountToday === 6, 'remaining summary closed count mismatch')
assert(remaining.summary.remainingGapCount === 2, 'remaining summary count mismatch')
assert(remaining.summary.nextPromptMayProceedCount === 1, 'next prompt count mismatch')

assert(boundary.decision === decision, 'boundary decision mismatch')
assertBoundary(boundary.readinessBoundary)

assert(claims.decision === decision, 'claim policy decision mismatch')
assert(claims.allowedClaims.includes('billing Stripe credits planning evidence gap closed'), 'allowed billing closure claim missing')
assert(claims.allowedClaims.includes('compliance/security gap closure may be planned next'), 'allowed compliance handoff claim missing')
for (const claim of [
  'credit mutation readiness',
  'credit reservation readiness',
  'credit spend readiness',
  'credit refund readiness',
  'Stripe checkout readiness',
  'Stripe webhook readiness',
  'payment processing readiness',
  'billing readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(claim), `${claim} must be forbidden`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy')

assert(artifactClosure.decision === sourceDecision, 'source closure decision mismatch')
assert(artifactClosure.sourceVerification.sourceHead === '22936001c5b5348ed7b28b7798b557eea8c029a7', 'source closure source head mismatch')
assert(artifactClosure.gapClosureResult.closedGapCountToday === 5, 'source closure closed count mismatch')
assert(artifactClosure.gapClosureResult.remainingGapCount === 3, 'source closure remaining count mismatch')
assert(artifactClosure.gapClosureResult.billingStripeApprovedToday === false, 'source billing widened')
assert(artifactRemaining.remainingGaps[0].gapId === 'billing_stripe_credits', 'source next gap mismatch')
assert(artifactRemaining.remainingGaps[0].nextPromptMayProceed === true, 'source billing gap should have been next')

assertTextIncludes(files.pricingAndCredits, [
  'Do not treat `$10/week` or `$20/week` as unlimited AI editing.',
  'Credits should be deducted only after the user approves the edit plan and credit estimate.',
  'Real credit reservation, spend, refund, Stripe purchase handling, and transactional ledger enforcement still require a deployed backend runtime.',
])
assertTextIncludes(files.creditRuntimeApprovalGate, [
  'Frontend code may display estimates and mock gate results.',
  'Real ledger mutation remains backend-required.',
  'It does not call Stripe, provider APIs, workers, rendering, or remote Supabase.',
])
assertTextIncludes(files.creditReservationSpendRefundFlow, [
  'The mock services update in-memory records only.',
  'No Stripe checkout, webhook, subscription, purchase, or money refund flow is implemented.',
])
assertTextIncludes(files.creditLedgerArchitecture, [
  'documentation only and does not integrate Stripe',
  'The skeleton does not add migrations, integrate Stripe, deploy backend code, or mutate remote data.',
])
assertTextIncludes(files.generationCreditGate, [
  'Real provider calls, render execution, queue creation, and spend/refund writes remain disabled',
])
assertTextIncludes(files.creditRuntimeSchemaAudit, [
  'No deployed backend runtime exists for real transactional reservation, spend, release, or refund.',
  'No Stripe purchase/checkout/webhook flow exists.',
])

assert(billingOwnerEvidence.ownerArea === 'BILLING_STRIPE_CREDITS', 'billing owner area mismatch')
assert(billingOwnerEvidence.packetShell.evidenceCollectedToday === false, 'owner evidence collected unexpectedly')
assert(billingOwnerEvidence.packetShell.evidenceAcceptedToday === false, 'owner evidence accepted unexpectedly')
assert(billingOwnerEvidence.packetShell.executionApprovalsGrantedToday === 'none', 'owner evidence approvals widened')
assertFalseFlags(
  billingOwnerEvidence.closedGates,
  [
    'creditMutationApprovedToday',
    'stripeCheckoutApprovedToday',
    'stripeWebhookApprovedToday',
    'paymentProcessingApprovedToday',
    'billingReadinessClaimedToday',
    'betaProductionReadinessClaimedToday',
  ],
  'billingOwnerEvidence.closedGates',
)
assertSupabaseNoop(billingOwnerEvidence.supabaseClassification, 'billing owner evidence')

assert(toolRouteBillingOwnerStatus.owner === 'BILLING_STRIPE_CREDITS', 'tool route billing owner mismatch')
assert(toolRouteBillingOwnerStatus.status === 'placeholder_only_credit_mutation_blocked', 'tool route billing status mismatch')
assert(toolRouteBillingOwnerStatus.billingMetadataAccepted === true, 'tool route billing metadata not accepted')
assertFalseFlags(
  toolRouteBillingOwnerStatus,
  ['creditReservationAllowed', 'creditSpendAllowed', 'stripeMutationAllowed'],
  'toolRouteBillingOwnerStatus',
)
assertFalseFlags(
  toolRouteBillingOwnerStatus.runtimeFlags,
  [
    'creditMutationAllowed',
    'stripeMutationAllowed',
    'paidProductionUnlockAllowed',
    'productionUnlockAllowed',
    'generatedLocalFixturePassedClaimed',
  ],
  'toolRouteBillingOwnerStatus.runtimeFlags',
)

assert(workerNoopBillingMetadata.status === 'passed', 'worker noop billing status mismatch')
assert(workerNoopBillingMetadata.creditEstimateMetadataOnly === true, 'credit estimate metadata-only flag missing')
assertFalseFlags(
  workerNoopBillingMetadata,
  [
    'creditReservationCreated',
    'creditSpendCreated',
    'creditRefundCreated',
    'stripeCheckoutCreated',
    'stripeWebhookProcessed',
    'billingMutation',
    'workerExecution',
    'workerRuntimeExecutionReady',
    'workerExecutionReady',
    'jobDispatch',
    'queueEnqueue',
    'jobClaim',
    'jobLease',
    'toolExecution',
    'routeExecution',
    'providerCalls',
    'mediaProcessing',
    'supabaseWrites',
    'sqlExecuted',
    'migrationDeployed',
    'publicArtifacts',
    'signedUrls',
    'productionAffected',
    'externalBeta',
    'paidProduction',
    'generatedLocalFixturePassedClaimed',
    'creditSpendOrReservation',
    'stripeOrBilling',
    'storageObjectsCreated',
  ],
  'workerNoopBillingMetadata',
)

for (const phrase of [
  'Do not run workers',
  'run routes',
  'run tools',
  'dispatch jobs',
  'claim leases',
  'touch Supabase',
  'execute SQL',
  'mutate credits/Stripe',
  'run Stripe checkout/webhooks/payment processing',
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
      creditMutationAllowed: boundary.readinessBoundary.creditMutationAllowed,
      stripeCheckoutAllowed: boundary.readinessBoundary.stripeCheckoutAllowed,
      executionApprovalsGrantedToday: closure.gapClosureResult.executionApprovalsGrantedToday,
    },
    null,
    2,
  ),
)
