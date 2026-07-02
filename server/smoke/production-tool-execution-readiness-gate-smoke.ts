import assert from 'node:assert/strict'
import {
  evaluateProductionToolExecutionReadinessGate,
  type ProductionToolExecutionReadinessGateInput,
} from '../beta-readiness'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

const completeEvidence = productionEvidenceFixture()
const passingReport = evaluateProductionToolExecutionReadinessGate(completeEvidence)

assert.equal(passingReport.status, 'ready_for_paid_production', 'complete production evidence should pass')
assert.equal(passingReport.productionToolExecutionAllowed, true, 'complete evidence should allow production tool execution')
assert.equal(passingReport.paidProductionAllowed, true, 'complete evidence should allow paid production')
assert.equal(passingReport.supabaseProductionPersistenceReady, true, 'Supabase production persistence should be ready')
assert.equal(passingReport.toolCostLedgerWritesReady, true, 'tool cost ledger writes should be ready')
assert.equal(passingReport.walletReserveSpendReleaseRefundReady, true, 'wallet settlement should be ready')
assert.equal(passingReport.stripeBoundaryConfirmed, true, 'Stripe boundary should be confirmed')
assert.equal(passingReport.observabilityAlertsReady, true, 'observability alerts should be ready')
assert.equal(passingReport.rollbackKillSwitchesReady, true, 'rollback and kill switches should be ready')
assert.equal(passingReport.rateConcurrencyLimitsReady, true, 'rate/concurrency limits should be ready')
assert.equal(passingReport.finalOwnerSignoffReady, true, 'final owner signoff should be ready')
assert.equal(passingReport.productionToolCount, PRODUCTION_TOOL_IDS.length, 'report should include every production tool')
assert.equal(passingReport.acceptedProductionToolCount, PRODUCTION_TOOL_IDS.length, 'complete fixture should accept every production tool')
assert.equal(passingReport.productReadyLocalOssCount, PRODUCTION_TOOL_IDS.length, 'complete fixture should mark every tool product-ready for the supplied production evidence')
assert.deepEqual(passingReport.checks.map((check) => check.status), passingReport.checks.map(() => 'passed'), 'all checks should pass')
assert.equal(passingReport.betaReadiness.productionReady, true, 'beta readiness productionReady should become true with complete evidence')

const defaultBlocked = evaluateProductionToolExecutionReadinessGate({
  sourceId: 'production-tool-execution-readiness-gate:missing-evidence-smoke',
  workspaceId: 'workspace-production-readiness-smoke',
  projectId: 'project-production-readiness-smoke',
})
assert.equal(defaultBlocked.productionToolExecutionAllowed, false, 'missing evidence should block production execution')
assert.ok(defaultBlocked.blockers.some((blocker) => blocker.includes('Supabase production persistence')), 'missing evidence should name Supabase blocker')
assert.ok(defaultBlocked.blockers.some((blocker) => blocker.includes('Wallet settlement')), 'missing evidence should name wallet blocker')
assert.equal(defaultBlocked.paidProductionAllowed, false, 'missing evidence must keep paid production false')

const stagingBlocked = evaluateProductionToolExecutionReadinessGate({
  ...completeEvidence,
  supabasePersistence: {
    ...completeEvidence.supabasePersistence!,
    environment: 'staging',
  },
})
assert.equal(stagingBlocked.productionToolExecutionAllowed, false, 'staging evidence must not clear paid production')
assert.ok(stagingBlocked.blockers.some((blocker) => blocker.includes('Evidence environment is not production')), 'staging evidence should name production environment blocker')

const refundBlocked = evaluateProductionToolExecutionReadinessGate({
  ...completeEvidence,
  walletSettlement: {
    ...completeEvidence.walletSettlement!,
    refundVerified: false,
  },
})
assert.equal(refundBlocked.productionToolExecutionAllowed, false, 'missing refund proof should block production')
assert.ok(refundBlocked.blockers.some((blocker) => blocker.includes('wallet refund')), 'missing refund proof should be named')

assert.throws(
  () => evaluateProductionToolExecutionReadinessGate({
    ...completeEvidence,
    supabasePersistence: {
      ...completeEvidence.supabasePersistence!,
      notes: ['operator pasted service_role_key by accident'],
    },
  }),
  /secret-like/,
  'secret-like evidence notes should be rejected',
)

console.log(JSON.stringify({
  ok: true,
  passingStatus: passingReport.status,
  productionToolCount: passingReport.productionToolCount,
  defaultBlocked: defaultBlocked.blockers.length,
  stagingBlocked: stagingBlocked.blockers.length,
  refundBlocked: refundBlocked.blockers.length,
  paidProductionAllowed: passingReport.paidProductionAllowed,
}, null, 2))

function productionEvidenceFixture(): ProductionToolExecutionReadinessGateInput {
  const notes = (label: string) => [`${label} verified in production evidence fixture.`]

  return {
    sourceId: 'production-tool-execution-readiness-gate:complete-fixture',
    sourceSha: 'd34e82ea64822dbbda2b14e47563eb201f1962d6',
    workspaceId: 'workspace-production-readiness-smoke',
    projectId: 'project-production-readiness-smoke',
    supabasePersistence: {
      environment: 'production',
      toolCostEventsMigrationDeployed: true,
      betaReadinessEvidenceMigrationDeployed: true,
      serviceRoleWritePathVerified: true,
      rlsMemberReadPathVerified: true,
      explicitDataApiGrantsVerified: true,
      betaEvidenceBackendOnlyAccessVerified: true,
      backupPitrApproved: true,
      securityAdvisorReviewed: true,
      performanceAdvisorReviewed: true,
      storagePoliciesVerified: true,
      notes: notes('Supabase persistence'),
    },
    toolCostLedger: {
      toolCostEventWriteVerified: true,
      ledgerAppendOnlyVerified: true,
      idempotentReplayVerified: true,
      projectSummaryReadbackVerified: true,
      notes: notes('Tool cost ledger'),
    },
    walletSettlement: {
      reservationVerified: true,
      spendVerified: true,
      releaseVerified: true,
      refundVerified: true,
      settlementRpcVerified: true,
      settlementRpcServiceRoleOnlyVerified: true,
      idempotentSettlementReplayVerified: true,
      noSilentChargeVerified: true,
      notes: notes('Wallet settlement'),
    },
    stripeBoundary: {
      billingOwnerApproved: true,
      noStripeFromToolCostSurface: true,
      serviceFeeExcludedFromToolEvents: true,
      stripeWebhookSeparatedFromToolLedger: true,
      notes: notes('Stripe boundary'),
    },
    observability: {
      dashboardsDeployed: true,
      alertsDeployed: true,
      alertRoutingVerified: true,
      billingQaMonitoringVerified: true,
      notes: notes('Observability and alerts'),
    },
    operationsControls: {
      rollbackPlanApproved: true,
      killSwitchesVerified: true,
      rateLimitsVerified: true,
      concurrencyLimitsVerified: true,
      incidentRunbookApproved: true,
      notes: notes('Operations controls'),
    },
    toolEvidence: {
      sourceId: 'production-tool-execution-readiness-gate:tool-evidence-fixture',
      sourceSha: 'd34e82ea64822dbbda2b14e47563eb201f1962d6',
      allProductionToolsAccepted: true,
      modelWeightLicenseReviewApproved: true,
      notes: notes('Production tool evidence'),
    },
    hardSafety: {
      approvedPlanSnapshotRequired: true,
      creditEstimateAndReservationRequired: true,
      idempotencyRequired: true,
      rawPromptsRejected: true,
      secretsRejected: true,
      temporaryAccessLinksRejectedAsSourceTruth: true,
      frontendHeavyExecutionBlocked: true,
      licenseAndModelWeightReviewRequired: true,
      silentBillingBlocked: true,
      notes: notes('Hard safety invariants'),
    },
    finalOwnerSignoff: {
      deploymentOwnerApproved: true,
      securityOwnerApproved: true,
      storagePrivacyOwnerApproved: true,
      legalOwnerApproved: true,
      supportOwnerApproved: true,
      billingOwnerApproved: true,
      operationsOwnerApproved: true,
      realUserMediaBetaApproved: true,
      privateMediaApproval: true,
      artifactPrivacyEvidenceReady: true,
      paidProductionApproved: true,
      finalDeliveryShareApproved: true,
      notes: notes('Final owner signoff'),
    },
  }
}
