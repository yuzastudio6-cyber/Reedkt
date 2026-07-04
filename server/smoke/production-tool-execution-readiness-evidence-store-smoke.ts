import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  evaluateProductionToolExecutionReadinessGate,
  type ProductionToolExecutionReadinessGateInput,
} from '../beta-readiness'
import { createProductionToolExecutionReadinessEvidenceService } from '../beta-readiness/production-tool-execution-readiness-evidence-service'
import {
  listMockProductionToolExecutionReadinessEvidencePackets,
  listPersistentProductionToolExecutionReadinessEvidencePackets,
  recordMockProductionToolExecutionReadinessEvidencePacket,
  recordPersistentProductionToolExecutionReadinessEvidencePacket,
} from '../beta-readiness/production-tool-execution-readiness-evidence-store'
import type { ServiceContext } from '../types'

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

const mockService = createProductionToolExecutionReadinessEvidenceService(createMockProductionReadinessEvidenceServiceContext())
const mockServiceReadback = await mockService.listEvidence(readinessInput.workspaceId)
assert.equal(mockServiceReadback.evidencePacketCount, 1, 'mock service should read back the mock production evidence packet')
assert.equal(mockServiceReadback.readinessSummary.latestEvidencePacketId, mockRecord.packet.id, 'mock readback summary should expose the latest mock packet id')
assert.equal(mockServiceReadback.readinessSummary.backendPersistenceMode, 'mock_memory', 'mock service readback should report mock-memory mode')
assert.equal(mockServiceReadback.readinessSummary.durableEvidenceStored, false, 'mock-memory evidence must not be reported as durable production evidence')

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
assert.deepEqual(admin.calls.orderColumns, ['created_at', 'id'], 'persistent evidence readback should request deterministic latest-packet ordering')

const tieBreakRows = await listPersistentProductionToolExecutionReadinessEvidencePackets(
  createFakeProductionReadinessAdminClient([
    productionEvidenceRowFixture('production-tool-execution-readiness-evidence-b', '2026-07-04T00:00:00.000Z'),
    productionEvidenceRowFixture('production-tool-execution-readiness-evidence-a', '2026-07-04T00:00:00.000Z'),
    productionEvidenceRowFixture('production-tool-execution-readiness-evidence-c', '2026-07-04T00:00:01.000Z'),
  ]),
  readinessInput.workspaceId,
)
assert.deepEqual(
  tieBreakRows.map((packet) => packet.id),
  [
    'production-tool-execution-readiness-evidence-a',
    'production-tool-execution-readiness-evidence-b',
    'production-tool-execution-readiness-evidence-c',
  ],
  'persistent evidence packets should sort deterministically by created_at and id',
)

await assert.rejects(
  () => recordPersistentProductionToolExecutionReadinessEvidencePacket(
    createMissingMigrationAdminClient(),
    'production-readiness-evidence-store-missing-migration',
    { readinessInput, readinessReport },
  ),
  /production_tool_execution_readiness_evidence_packets migration/,
  'missing production evidence migration should fail closed',
)

const ownerServiceContext = createProductionReadinessEvidenceServiceContext('owner')
const ownerService = createProductionToolExecutionReadinessEvidenceService(ownerServiceContext)
const ownerRecord = await ownerService.recordEvidence(readinessInput, 'production-readiness-evidence-service-owner-record')
const ownerReadback = await ownerService.listEvidence(readinessInput.workspaceId)
assert.equal(ownerRecord.replayed, false, 'workspace owner should record persistent production evidence')
assert.equal(ownerRecord.packet.createdByUserId, ownerServiceContext.auth?.userId, 'recorded packet should keep the authenticated owner user id')
assert.equal(ownerReadback.evidencePacketCount, 1, 'workspace owner should read back recorded production evidence')
assert.equal(ownerReadback.latestPacket?.id, ownerRecord.packet.id, 'readback should expose the latest production evidence packet')
assert.equal(ownerReadback.readinessSummary.latestEvidencePacketId, ownerRecord.packet.id, 'readback summary should expose the latest packet id')
assert.equal(ownerReadback.readinessSummary.latestProductionToolExecutionAllowed, true, 'readback summary should preserve production execution readiness')
assert.equal(ownerReadback.readinessSummary.latestPaidProductionAllowed, true, 'readback summary should preserve paid-production readiness')
assert.equal(ownerReadback.readinessSummary.durableEvidenceStored, true, 'readback summary should identify durable stored evidence')
assert.equal(ownerReadback.readinessSummary.backendPersistenceMode, 'persistent_supabase', 'persistent service readback should report Supabase-backed mode')
assert.equal(ownerReadback.readinessSummary.productionActivationAttempted, false, 'evidence readback must not imply production activation')

const adminService = createProductionToolExecutionReadinessEvidenceService(createProductionReadinessEvidenceServiceContext('admin'))
const adminReadback = await adminService.listEvidence(readinessInput.workspaceId)
assert.equal(adminReadback.evidencePacketCount, 0, 'workspace admin membership should be authorized for persistent readback')

const viewerService = createProductionToolExecutionReadinessEvidenceService(createProductionReadinessEvidenceServiceContext('viewer'))
const viewerReadback = await viewerService.listEvidence(readinessInput.workspaceId)
assert.equal(viewerReadback.evidencePacketCount, 0, 'workspace viewer membership should be authorized for persistent readback')
await assert.rejects(
  () => viewerService.recordEvidence(readinessInput, 'production-readiness-evidence-service-viewer-record'),
  /owner\/admin authorization/,
  'workspace viewer must not record production readiness evidence',
)

const outsiderService = createProductionToolExecutionReadinessEvidenceService(createProductionReadinessEvidenceServiceContext('none'))
await assert.rejects(
  () => outsiderService.listEvidence(readinessInput.workspaceId),
  /workspace membership/,
  'non-member must not read production readiness evidence',
)
await assert.rejects(
  () => outsiderService.recordEvidence(readinessInput, 'production-readiness-evidence-service-outsider-record'),
  /owner\/admin authorization|accessible project|workspace membership/i,
  'non-member must not record production readiness evidence',
)

console.log(JSON.stringify({
  ok: true,
  mockPacketId: mockRecord.packet.id,
  mockReplay: mockReplay.replayed,
  persistentPacketId: persistentRecord.packet.id,
  persistentReplay: persistentReplay.replayed,
  persistentRows: persistentList.length,
  missingMigrationFailsClosed: true,
  ownerRecordAuthorized: true,
  memberReadbackAuthorized: true,
  viewerRecordBlocked: true,
  outsiderAccessBlocked: true,
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
      walletSettlementStateMigrationDeployed: true,
      productionReadinessEvidenceMigrationDeployed: true,
      workerRuntimeArtifactManifestMigrationDeployed: true,
      workerRuntimeArtifactManifestServiceRoleOnlyVerified: true,
      workerRuntimeArtifactManifestReadbackVerified: true,
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
      walletBalanceBeforeAfterReadbackVerified: true,
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
      killSwitchBlockVerified: true,
      rateLimitsVerified: true,
      rateLimitBlockVerified: true,
      concurrencyLimitsVerified: true,
      concurrencyLimitBlockVerified: true,
      opsAdmissionRpcDeployed: true,
      opsAdmissionRpcServiceRoleOnlyVerified: true,
      opsAdmissionRpcReadbackVerified: true,
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
    orderColumns: string[]
  }
}

function createFakeProductionReadinessAdminClient(initialRows: Record<string, unknown>[] = []): FakeProductionReadinessAdminClient {
  const rows = new Map<string, Record<string, unknown>>()
  for (const row of initialRows) {
    rows.set(`${row.workspace_id}:${row.idempotency_key}`, row)
  }
  const calls = { inserts: [] as unknown[], orderColumns: [] as string[] }

  return {
    calls,
    from() {
      const filters: Record<string, string> = {}
      const selectBuilder = {
        eq(column: string, value: string) {
          filters[column] = value
          return selectBuilder
        },
        order(column: string) {
          calls.orderColumns.push(column)
          return selectBuilder
        },
        then(resolve: (value: { data: Record<string, unknown>[]; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve({
            data: [...rows.values()]
              .filter((row) => row.workspace_id === filters.workspace_id)
              .sort(compareProductionEvidenceRows),
            error: null,
          }).then(resolve, reject)
        },
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

function productionEvidenceRowFixture(id: string, createdAt: string): Record<string, unknown> {
  return {
    id,
    workspace_id: readinessInput.workspaceId,
    project_id: readinessInput.projectId,
    idempotency_key: `${id}:idempotency`,
    source_id: readinessInput.sourceId,
    source_sha: readinessInput.sourceSha ?? null,
    created_at: createdAt,
    created_by_user_id: 'user-production-readiness-smoke',
    readiness_input: readinessInput,
    readiness_report: readinessReport,
  }
}

function compareProductionEvidenceRows(left: Record<string, unknown>, right: Record<string, unknown>): number {
  return String(left.created_at).localeCompare(String(right.created_at)) || String(left.id).localeCompare(String(right.id))
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

function createProductionReadinessEvidenceServiceContext(
  role: 'owner' | 'admin' | 'viewer' | 'none',
): ServiceContext {
  return {
    env: {
      mockOnly: false,
      allowMockWithoutSupabase: false,
      hasSupabaseAdmin: true,
    } as never,
    clients: {
      admin: createFakeProductionReadinessServiceAdminClient(role),
      public: null,
    },
    requestId: `production-readiness-evidence-store-smoke:${role}`,
    auth: {
      userId: `user-production-readiness-${role}`,
      email: `${role}@reeditpro.local`,
      isMockUser: false,
    },
  }
}

function createMockProductionReadinessEvidenceServiceContext(): ServiceContext {
  return {
    env: {
      mockOnly: true,
      allowMockWithoutSupabase: true,
      hasSupabaseAdmin: false,
    } as never,
    clients: {
      admin: null,
      public: null,
    },
    requestId: 'production-readiness-evidence-store-smoke:mock',
    auth: {
      userId: 'user-production-readiness-mock',
      email: 'mock@reeditpro.local',
      isMockUser: true,
    },
  }
}

function createFakeProductionReadinessServiceAdminClient(
  role: 'owner' | 'admin' | 'viewer' | 'none',
): SupabaseClient {
  const rows = new Map<string, Record<string, unknown>>()

  return {
    from(table: string) {
      const filters: Record<string, string> = {}
      const builder = {
        select() {
          return builder
        },
        eq(column: string, value: string) {
          filters[column] = value
          return builder
        },
        order() {
          return builder
        },
        then(resolve: (value: { data: Record<string, unknown>[]; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve({
            data: table === 'production_tool_execution_readiness_evidence_packets'
              ? [...rows.values()]
                  .filter((row) => row.workspace_id === filters.workspace_id)
                  .sort(compareProductionEvidenceRows)
              : [],
            error: null,
          }).then(resolve, reject)
        },
        async maybeSingle() {
          return {
            data: fakeProductionReadinessServiceRow(table, filters, rows, role),
            error: null,
          }
        },
        insert(row: Record<string, unknown>) {
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
      return builder
    },
  } as unknown as SupabaseClient
}

function fakeProductionReadinessServiceRow(
  table: string,
  filters: Record<string, string>,
  rows: Map<string, Record<string, unknown>>,
  role: 'owner' | 'admin' | 'viewer' | 'none',
) {
  if (
    table === 'projects' &&
    filters.id === readinessInput.projectId &&
    filters.workspace_id === readinessInput.workspaceId
  ) {
    return {
      id: readinessInput.projectId,
      workspace_id: readinessInput.workspaceId,
    }
  }

  if (
    table === 'workspace_members' &&
    filters.workspace_id === readinessInput.workspaceId &&
    role !== 'none'
  ) {
    return {
      user_id: filters.user_id,
      role,
    }
  }

  if (table === 'production_tool_execution_readiness_evidence_packets') {
    return rows.get(`${filters.workspace_id}:${filters.idempotency_key}`) ?? null
  }

  return null
}
