import assert from 'node:assert/strict'
import type {
  BetaPlatformDeployedEvidenceVerificationReport,
  BetaPlatformDeployedProbeId,
} from '../beta-readiness'
import {
  buildProductionToolExecutionDeployedEvidenceBridge,
  runProductionToolExecutionDeployedEvidenceBridgeFromEnv,
} from '../cli/production-tool-execution-deployed-evidence-bridge'

const completePlatformReport = deployedReportFixture()
const bridged = buildProductionToolExecutionDeployedEvidenceBridge(completePlatformReport)

assert.equal(bridged.ok, true, 'bridge should build from a complete deployed platform report')
assert.equal(bridged.mode, 'dry_run', 'bridge should be dry-run only')
assert.equal(bridged.sourceEnvironment, 'production', 'fixture should represent production deployed evidence')
assert.equal(bridged.productionGateStatus, 'blocked', 'platform probes alone must not pass paid-production gate')
assert.equal(bridged.productionToolExecutionAllowed, false, 'bridge must not allow production tool execution by itself')
assert.equal(bridged.paidProductionAllowed, false, 'bridge must not allow paid production by itself')
assert.ok(bridged.mappedFieldCount > 0, 'bridge should map deployed facts into production evidence draft')
assert.ok(bridged.missingFieldCount > 0, 'bridge should preserve missing production-only blockers')
assert.ok(
  bridged.mappedFields.includes('supabasePersistence.toolCostEventsMigrationDeployed'),
  'tool_cost_events migration probe should map into Supabase production persistence draft',
)
assert.ok(
  bridged.mappedFields.includes('walletSettlement.spendVerified'),
  'wallet settlement probe should map only the spend fixture proof',
)
assert.ok(
  bridged.mappedFields.includes('observability.dashboardsDeployed'),
  'monitoring probe should map deployed observability evidence',
)
assert.ok(
  bridged.mappedFields.includes('finalOwnerSignoff.deploymentOwnerApproved'),
  'deployment owner approval from platform evidence should map into the draft',
)
assert.ok(
  bridged.missingFields.includes('supabasePersistence.workerRuntimeArtifactManifestMigrationDeployed'),
  'worker artifact manifest deployment must remain an explicit production blocker',
)
assert.ok(
  bridged.missingFields.includes('walletSettlement.releaseVerified') &&
  bridged.missingFields.includes('walletSettlement.refundVerified') &&
  bridged.missingFields.includes('walletSettlement.reservationVerified'),
  'wallet reservation/release/refund cannot be inferred from the spend-only deployed probe',
)
assert.ok(
  bridged.missingFields.includes('stripeBoundary.noStripeFromToolCostSurface') &&
  bridged.missingFields.includes('stripeBoundary.serviceFeeExcludedFromToolEvents'),
  'Stripe owner attestation alone must not infer every production Stripe-boundary field',
)
assert.ok(
  bridged.missingFields.includes('operationsControls.killSwitchBlockVerified') &&
  bridged.missingFields.includes('operationsControls.concurrencyLimitBlockVerified'),
  'deployed negative-control ops evidence must remain explicit',
)
assert.ok(
  bridged.missingFields.includes('hardSafety.approvedPlanSnapshotRequired') &&
  bridged.missingFields.includes('hardSafety.silentBillingBlocked'),
  'hard safety invariants must remain explicit production evidence',
)
assert.ok(
  bridged.missingFields.includes('finalOwnerSignoff.paidProductionApproved') &&
  bridged.missingFields.includes('finalOwnerSignoff.finalDeliveryShareApproved'),
  'final paid-production and delivery/share signoff must remain explicit',
)

const wrapped = runProductionToolExecutionDeployedEvidenceBridgeFromEnv({
  REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_JSON: JSON.stringify({ data: { report: completePlatformReport } }),
})
assert.equal(wrapped.sourceReportId, completePlatformReport.reportId, 'env runner should unwrap API-style report payloads')
assert.deepEqual(wrapped.missingFields, bridged.missingFields, 'env runner should preserve bridge blocker set')

assert.throws(
  () => buildProductionToolExecutionDeployedEvidenceBridge({
    ...completePlatformReport,
    checks: [
      ...completePlatformReport.checks,
      {
        id: 'tool_cost_events_migration_deployed',
        status: 'passed',
        evidence: ['Bearer should-not-appear-in-evidence'],
        nextAction: 'No action.',
      },
    ],
  }),
  /secret-like/i,
  'bridge should reject secret-like deployed evidence strings',
)

console.log(JSON.stringify({
  ok: true,
  version: bridged.version,
  mappedFieldCount: bridged.mappedFieldCount,
  missingFieldCount: bridged.missingFieldCount,
  productionGateStatus: bridged.productionGateStatus,
  productionToolExecutionAllowed: bridged.productionToolExecutionAllowed,
  paidProductionAllowed: bridged.paidProductionAllowed,
  sampleMappedFields: bridged.mappedFields.slice(0, 6),
  sampleMissingFields: bridged.missingFields.slice(0, 8),
}, null, 2))

function deployedReportFixture(): BetaPlatformDeployedEvidenceVerificationReport {
  const checkIds: BetaPlatformDeployedProbeId[] = [
    'tool_cost_events_migration_deployed',
    'beta_readiness_evidence_migration_deployed',
    'production_readiness_evidence_migration_deployed',
    'service_role_write_path_verified',
    'authenticated_rls_member_readback_verified',
    'idempotent_replay_verified',
    'wallet_settlement_verified',
    'stripe_boundary_owner_verified',
    'monitoring_deployment_verified',
    'staging_billing_qa_verified',
  ]
  const checks = checkIds.map((id) => ({
    id,
    status: 'passed' as const,
    evidence: [`${id} passed in deployed production probe fixture.`],
    nextAction: 'No action for smoke fixture.',
  }))

  return {
    reportId: 'beta-platform-deployed-evidence-verifier-smoke-production',
    createdAt: '2026-07-04T02:30:00.000Z',
    environment: 'production',
    workspaceId: 'workspace-production-deployed-evidence-bridge-smoke',
    projectId: 'project-production-deployed-evidence-bridge-smoke',
    sourceId: 'beta-platform-deployed-evidence:production-bridge-smoke',
    sourceSha: '9ad06a1e1e74cc720c99ca71402d108fd9352386',
    checks,
    missingEvidence: [],
    ownerApprovalGaps: [],
    evidencePacketReady: true,
    evidencePacket: {
      workspaceId: 'workspace-production-deployed-evidence-bridge-smoke',
      projectId: 'project-production-deployed-evidence-bridge-smoke',
      platformEvidence: {
        sourceId: 'beta-platform-deployed-evidence:production-bridge-smoke',
        sourceSha: '9ad06a1e1e74cc720c99ca71402d108fd9352386',
        environment: 'production',
        toolCostEventsMigrationDeployed: true,
        productionReadinessEvidenceMigrationDeployed: true,
        serviceRoleWritePathVerified: true,
        rlsMemberReadPathVerified: true,
        idempotentReplayVerified: true,
        walletSettlementVerified: true,
        stripeBoundaryVerified: true,
        monitoringVerified: true,
        billingQaVerified: true,
        deploymentApproved: true,
        securityApproved: true,
        storageApproved: true,
        legalApproved: true,
        supportApproved: true,
        notes: ['Smoke fixture platform evidence ready.'],
      },
      approvals: {
        deploymentApproved: true,
        securityApproved: true,
        storageApproved: true,
        legalApproved: true,
        monitoringApproved: true,
        supportApproved: true,
      },
    },
    evaluatedReadiness: {
      goNoGo: {
        externalBetaAllowed: false,
        paidProductionAllowed: false,
      },
    } as BetaPlatformDeployedEvidenceVerificationReport['evaluatedReadiness'],
    externalBetaAllowed: false,
    productionAllowed: false,
    warnings: [
      'Smoke fixture does not enable production.',
    ],
  }
}
