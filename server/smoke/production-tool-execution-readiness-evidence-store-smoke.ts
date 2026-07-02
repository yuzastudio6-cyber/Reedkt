import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  evaluateProductionToolExecutionReadinessGate,
  type ProductionToolExecutionReadinessGateInput,
} from '../beta-readiness'
import {
  listMockProductionToolExecutionReadinessEvidencePackets,
  listPersistentProductionToolExecutionReadinessEvidencePackets,
  recordMockProductionToolExecutionReadinessEvidencePacket,
  recordPersistentProductionToolExecutionReadinessEvidencePacket,
} from '../beta-readiness/production-tool-execution-readiness-evidence-store'

const readinessInput = productionEvidenceFixture()
const readinessReport = evaluateProductionToolExecutionReadinessGate(readinessInput)
assert.equal(readinessReport.productionToolExecutionAllowed, true, 'fixture should pass production gate before store smoke')

const mockRecord = recordMockProductionToolExecutionReadinessEvidencePacket(
  'production-readiness-evidence-store-smoke',
  { readinessInput, readinessReport },
  'user-production-readiness-smoke',
)
const mockReplay = recordMockProductionToolExecutionReadinessEvidencePacket(
  'production-readiness-evidence-store-smoke',
  { readinessInput, readinessReport },
  'user-production-readiness-smoke',
)
const mockList = listMockProductionToolExecutionReadinessEvidencePackets(readinessInput.workspaceId)
assert.equal(mockRecord.replayed, false, 'first mock record should not be replayed')
assert.equal(mockReplay.replayed, true, 'second mock record should replay')
assert.equal(mockReplay.packet.id, mockRecord.packet.id, 'mock replay should return original packet')
assert.equal(mockList.length, 1, 'mock list should include one idempotent packet')

const admin = createFakeProductionReadinessAdminClient()
const persistentRecord = await recordPersistentProductionToolExecutionReadinessEvidencePacket(
  admin,
  'production-readiness-evidence-store-smoke-persistent',
  { readinessInput, readinessReport },
  'user-production-readiness-smoke',
)
const persistentReplay = await recordPersistentProductionToolExecutionReadinessEvidencePacket(
  admin,
  'production-readiness-evidence-store-smoke-persistent',
  { readinessInput, readinessReport },
  'user-production-readiness-smoke',
)
const persistentList = await listPersistentProductionToolExecutionReadinessEvidencePackets(admin, readinessInput.workspaceId)

assert.equal(persistentRecord.replayed, false, 'first persistent record should not be replayed')
assert.equal(persistentReplay.replayed, true, 'persistent duplicate should replay')
assert.equal(persistentReplay.packet.id, persistentRecord.packet.id, 'persistent replay should return original packet')
assert.equal(persistentList.length, 1, 'persistent list should include one idempotent packet')
assert.equal(admin.calls.inserts.length, 1, 'persistent idempotent replay should not insert twice')

await assert.rejects(
  () => recordPersistentProductionToolExecutionReadinessEvidencePacket(
    createMissingMigrationAdminClient(),
    'production-readiness-evidence-store-missing-migration',
    { readinessInput, readinessReport },
  ),
  /production_tool_execution_readiness_evidence_packets migration/,
  'missing production evidence migration should fail closed',
)

console.log(JSON.stringify({
  ok: true,
  mockPacketId: mockRecord.packet.id,
  mockReplay: mockReplay.replayed,
  persistentPacketId: persistentRecord.packet.id,
  persistentReplay: persistentReplay.replayed,
  persistentRows: persistentList.length,
  missingMigrationFailsClosed: true,
}, null, 2))

function productionEvidenceFixture(): ProductionToolExecutionReadinessGateInput {
  return {
    sourceId: 'production-tool-execution-readiness-evidence-store-smoke:complete-fixture',
    sourceSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    workspaceId: 'workspace-production-readiness-evidence-store-smoke',
    projectId: 'project-production-readiness-evidence-store-smoke',
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
      incidentRunbookApproved: true,
    },
    toolEvidence: {
      ...reviewedEvidence('Production tool evidence'),
      sourceId: 'production-tool-execution-readiness-evidence-store-smoke:tools',
      sourceSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
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
    evidenceArtifactId: `prod-evidence-store-artifact:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    reviewedBy: 'production-evidence-store-smoke-reviewer',
    reviewedAt: '2026-07-02T00:00:00.000Z',
    notes: [`${label} verified in production evidence store smoke fixture.`],
  }
}

interface FakeProductionReadinessAdminClient extends SupabaseClient {
  calls: {
    inserts: unknown[]
  }
}

function createFakeProductionReadinessAdminClient(): FakeProductionReadinessAdminClient {
  const rows = new Map<string, Record<string, unknown>>()
  const calls = { inserts: [] as unknown[] }

  return {
    calls,
    from() {
      const filters: Record<string, string> = {}
      const selectBuilder = {
        eq(column: string, value: string) {
          filters[column] = value
          return selectBuilder
        },
        order: async () => ({
          data: [...rows.values()].filter((row) => row.workspace_id === filters.workspace_id),
          error: null,
        }),
        async maybeSingle() {
          return {
            data: rows.get(`${filters.workspace_id}:${filters.idempotency_key}`) ?? null,
            error: null,
          }
        },
      }

      return {
        select() {
          return selectBuilder
        },
        insert(row: Record<string, unknown>) {
          calls.inserts.push(row)
          return {
            select() {
              return {
                async single() {
                  rows.set(`${row.workspace_id}:${row.idempotency_key}`, row)
                  return { data: row, error: null }
                },
              }
            },
          }
        },
      }
    },
  } as unknown as FakeProductionReadinessAdminClient
}

function createMissingMigrationAdminClient(): SupabaseClient {
  return {
    from() {
      const selectBuilder = {
        eq() {
          return selectBuilder
        },
        async maybeSingle() {
          return {
            data: null,
            error: {
              code: '42P01',
              message: 'relation "production_tool_execution_readiness_evidence_packets" does not exist',
            },
          }
        },
      }
      return {
        select() {
          return selectBuilder
        },
      }
    },
  } as unknown as SupabaseClient
}
