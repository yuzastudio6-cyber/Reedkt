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

const productionEvidenceMigrationBlocked = evaluateProductionToolExecutionReadinessGate({
  ...completeEvidence,
  supabasePersistence: {
    ...completeEvidence.supabasePersistence!,
    productionReadinessEvidenceMigrationDeployed: false,
  },
})
assert.equal(productionEvidenceMigrationBlocked.productionToolExecutionAllowed, false, 'missing production evidence packet migration proof should block production')
assert.ok(
  productionEvidenceMigrationBlocked.blockers.some((blocker) => blocker.includes('production_tool_execution_readiness_evidence_packets')),
  'missing production evidence packet migration proof should name the durable production evidence table',
)

const productionEvidenceBackendOnlyBlocked = evaluateProductionToolExecutionReadinessGate({
  ...completeEvidence,
  supabasePersistence: {
    ...completeEvidence.supabasePersistence!,
    productionEvidenceBackendOnlyAccessVerified: false,
  },
})
assert.equal(productionEvidenceBackendOnlyBlocked.productionToolExecutionAllowed, false, 'missing production evidence backend-only proof should block production')
assert.ok(
  productionEvidenceBackendOnlyBlocked.blockers.some((blocker) => blocker.includes('backend-only production readiness evidence access')),
  'missing production evidence backend-only proof should name the production readiness evidence access gap',
)

const opsAdmissionRpcBlocked = evaluateProductionToolExecutionReadinessGate({
  ...completeEvidence,
  operationsControls: {
    ...completeEvidence.operationsControls!,
    opsAdmissionRpcDeployed: false,
  },
})
assert.equal(opsAdmissionRpcBlocked.productionToolExecutionAllowed, false, 'missing ops admission RPC deployment proof should block production')
assert.ok(
  opsAdmissionRpcBlocked.blockers.some((blocker) => blocker.includes('claim_production_gateway_worker_lease RPC deployment')),
  'missing ops admission RPC proof should name the exact RPC deployment gap',
)

const refundBlocked = evaluateProductionToolExecutionReadinessGate({
  ...completeEvidence,
  walletSettlement: {
    ...completeEvidence.walletSettlement!,
    refundVerified: false,
  },
})
assert.equal(refundBlocked.productionToolExecutionAllowed, false, 'missing refund proof should block production')
assert.ok(refundBlocked.blockers.some((blocker) => blocker.includes('wallet refund')), 'missing refund proof should be named')

const provenanceBlocked = evaluateProductionToolExecutionReadinessGate({
  ...completeEvidence,
  observability: {
    ...completeEvidence.observability!,
    evidenceArtifactId: '',
  },
})
assert.equal(provenanceBlocked.productionToolExecutionAllowed, false, 'missing provenance should block production')
assert.ok(
  provenanceBlocked.blockers.some((blocker) => blocker.includes('Observability evidence artifact ID')),
  'missing provenance should name the missing artifact ID',
)

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
  productionEvidenceMigrationBlocked: productionEvidenceMigrationBlocked.blockers.length,
  productionEvidenceBackendOnlyBlocked: productionEvidenceBackendOnlyBlocked.blockers.length,
  opsAdmissionRpcBlocked: opsAdmissionRpcBlocked.blockers.length,
  refundBlocked: refundBlocked.blockers.length,
  provenanceBlocked: provenanceBlocked.blockers.length,
  paidProductionAllowed: passingReport.paidProductionAllowed,
}, null, 2))

function productionEvidenceFixture(): ProductionToolExecutionReadinessGateInput {
  return {
    sourceId: 'production-tool-execution-readiness-gate:complete-fixture',
    sourceSha: 'd34e82ea64822dbbda2b14e47563eb201f1962d6',
    workspaceId: 'workspace-production-readiness-smoke',
    projectId: 'project-production-readiness-smoke',
    supabasePersistence: {
      ...reviewedEvidence('Supabase persistence'),
      environment: 'production',
      toolCostEventsMigrationDeployed: true,
      betaReadinessEvidenceMigrationDeployed: true,
      productionReadinessEvidenceMigrationDeployed: true,
      serviceRoleWritePathVerified: true,
      rlsMemberReadPathVerified: true,
      explicitDataApiGrantsVerified: true,
      betaEvidenceBackendOnlyAccessVerified: true,
      productionEvidenceBackendOnlyAccessVerified: true,
      backupPitrApproved: true,
      securityAdvisorReviewed: true,
      performanceAdvisorReviewed: true,
      storagePoliciesVerified: true,
    },
    toolCostLedger: {
      ...reviewedEvidence('Tool cost ledger'),
      toolCostEventWriteVerified: true,
      ledgerAppendOnlyVerified: true,
      idempotentReplayVerified: true,
      projectSummaryReadbackVerified: true,
    },
    walletSettlement: {
      ...reviewedEvidence('Wallet settlement'),
      reservationVerified: true,
      spendVerified: true,
      releaseVerified: true,
      refundVerified: true,
      settlementRpcVerified: true,
      settlementRpcServiceRoleOnlyVerified: true,
      idempotentSettlementReplayVerified: true,
      noSilentChargeVerified: true,
    },
    stripeBoundary: {
      ...reviewedEvidence('Stripe boundary'),
      billingOwnerApproved: true,
      noStripeFromToolCostSurface: true,
      serviceFeeExcludedFromToolEvents: true,
      stripeWebhookSeparatedFromToolLedger: true,
    },
    observability: {
      ...reviewedEvidence('Observability and alerts'),
      dashboardsDeployed: true,
      alertsDeployed: true,
      alertRoutingVerified: true,
      billingQaMonitoringVerified: true,
    },
    operationsControls: {
      ...reviewedEvidence('Operations controls'),
      rollbackPlanApproved: true,
      killSwitchesVerified: true,
      rateLimitsVerified: true,
      concurrencyLimitsVerified: true,
      opsAdmissionRpcDeployed: true,
      opsAdmissionRpcServiceRoleOnlyVerified: true,
      opsAdmissionRpcReadbackVerified: true,
      incidentRunbookApproved: true,
    },
    toolEvidence: {
      ...reviewedEvidence('Production tool evidence'),
      sourceId: 'production-tool-execution-readiness-gate:tool-evidence-fixture',
      sourceSha: 'd34e82ea64822dbbda2b14e47563eb201f1962d6',
      allProductionToolsAccepted: true,
      modelWeightLicenseReviewApproved: true,
    },
    hardSafety: {
      ...reviewedEvidence('Hard safety invariants'),
      approvedPlanSnapshotRequired: true,
      creditEstimateAndReservationRequired: true,
      idempotencyRequired: true,
      rawPromptsRejected: true,
      secretsRejected: true,
      temporaryAccessLinksRejectedAsSourceTruth: true,
      frontendHeavyExecutionBlocked: true,
      licenseAndModelWeightReviewRequired: true,
      silentBillingBlocked: true,
    },
    finalOwnerSignoff: {
      ...reviewedEvidence('Final owner signoff'),
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
    },
  }
}

function reviewedEvidence(label: string) {
  return {
    evidenceArtifactId: `prod-readiness-artifact:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    reviewedBy: 'production-readiness-smoke-reviewer',
    reviewedAt: '2026-07-02T00:00:00.000Z',
    notes: [`${label} verified in production evidence fixture.`],
  }
}
