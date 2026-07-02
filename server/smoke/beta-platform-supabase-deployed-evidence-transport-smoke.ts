import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createBetaPlatformDeployedEvidenceProbeRunners,
  createBetaPlatformSupabaseDeployedEvidenceProbeTransport,
  runBetaPlatformDeployedEvidenceVerifier,
  type BetaPlatformDeployedEvidenceObservation,
  type BetaPlatformSupabaseAttestedProbeId,
} from '../beta-readiness'

const admin = createFakeSupabaseAdminClient()
const transport = createBetaPlatformSupabaseDeployedEvidenceProbeTransport({
  admin,
  workspaceId: 'workspace-beta-platform-supabase-transport-smoke',
  projectId: 'project-beta-platform-supabase-transport-smoke',
  sourceId: 'tool-beta-platform-evidence:supabase-deployed-transport-smoke',
  sourceSha: '8888888888888888888888888888888888888888',
  idempotencyKey: 'beta-platform-supabase-transport-smoke',
  allowPersistentProbeWrites: true,
  walletSettlementProbeToolCostEventId: 'tool-cost-event-staging-fixture-smoke',
  attestations: passingAttestations(),
})

const report = await runBetaPlatformDeployedEvidenceVerifier({
  workspaceId: 'workspace-beta-platform-supabase-transport-smoke',
  projectId: 'project-beta-platform-supabase-transport-smoke',
  sourceId: 'tool-beta-platform-evidence:supabase-deployed-transport-smoke',
  sourceSha: '8888888888888888888888888888888888888888',
  environment: 'staging',
  ownerApprovals: {
    billingOwnerStripeBoundaryApproved: true,
    deploymentApproved: true,
    securityApproved: true,
    storageApproved: true,
    legalApproved: true,
    monitoringApproved: true,
    supportApproved: true,
  },
  notes: ['Smoke fixture proves the Supabase deployed probe transport can feed the platform verifier.'],
}, createBetaPlatformDeployedEvidenceProbeRunners(transport))

assert.equal(report.evidencePacketReady, true, 'complete Supabase transport evidence should build a platform packet')
assert.equal(report.checks.length, 9, 'Supabase transport should satisfy every deployed evidence probe')
assert.equal(report.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length, 0, 'complete Supabase transport evidence should clear the shared platform blocker')
assert.equal(report.evaluatedReadiness.toolExecutionReadiness.externalBetaToolExecutionAllowed, false, 'platform evidence alone must not enable tool beta execution')
assert.equal(report.externalBetaAllowed, false, 'Supabase transport smoke must not enable external beta')
assert.equal(report.productionAllowed, false, 'Supabase transport smoke must not enable production')
assert.deepEqual(admin.calls.tables.slice(0, 2), ['tool_cost_events', 'beta_readiness_evidence_packets'], 'migration probes should read both deployed tables')
assert.equal(admin.calls.inserts.length, 2, 'service-role write and replay probes should insert only controlled evidence packets')
assert.equal(admin.calls.rpc.length, 1, 'wallet settlement probe should call exactly one RPC')
assert.deepEqual(admin.calls.rpc[0], {
  functionName: 'settle_tool_cost_event',
  params: {
    p_idempotency_key: 'beta-platform-supabase-transport-smoke:platform-supabase-probe:wallet-settlement',
    p_tool_cost_event_id: 'tool-cost-event-staging-fixture-smoke',
    p_settlement_type: 'spend',
  },
}, 'wallet settlement probe RPC call shape should match the deployed migration')

const writeBlocked = await createBetaPlatformSupabaseDeployedEvidenceProbeTransport({
  admin,
  workspaceId: 'workspace-beta-platform-supabase-transport-smoke',
  sourceId: 'tool-beta-platform-evidence:supabase-deployed-transport-smoke-write-blocked',
  idempotencyKey: 'beta-platform-supabase-transport-smoke-write-blocked',
  allowPersistentProbeWrites: false,
}).verifyServiceRoleWritePath()

assert.equal(writeBlocked.ok, false, 'persistent probe writes should fail closed unless explicitly allowed')
assert.ok(writeBlocked.nextAction.includes('allowPersistentProbeWrites=true'), 'write-blocked probe should name the explicit confirmation required')

const missingAdmin = await createBetaPlatformSupabaseDeployedEvidenceProbeTransport({
  admin: null,
  workspaceId: 'workspace-beta-platform-supabase-transport-smoke',
  sourceId: 'tool-beta-platform-evidence:supabase-deployed-transport-smoke-missing-admin',
  idempotencyKey: 'beta-platform-supabase-transport-smoke-missing-admin',
  allowPersistentProbeWrites: true,
}).verifyToolCostEventsMigration()

assert.equal(missingAdmin.ok, false, 'missing service-role admin client should fail closed')
assert.ok(missingAdmin.evidence[0]?.includes('service-role admin client is unavailable'), 'missing-admin probe should explain backend service-role requirement')

console.log(JSON.stringify({
  ok: true,
  evidencePacketReady: report.evidencePacketReady,
  platformBlockers: report.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length,
  externalBetaAllowed: report.externalBetaAllowed,
  productionAllowed: report.productionAllowed,
  tableReads: admin.calls.tables.length,
  controlledInserts: admin.calls.inserts.length,
  walletSettlementRpcCalls: admin.calls.rpc.length,
  writeBlockedWithoutConfirmation: !writeBlocked.ok,
  missingAdminFailsClosed: !missingAdmin.ok,
}, null, 2))

function passingAttestations(): Partial<Record<BetaPlatformSupabaseAttestedProbeId, BetaPlatformDeployedEvidenceObservation>> {
  return {
    authenticated_rls_member_readback_verified: passed('authenticated RLS member/non-member readback passed in staging fixture.'),
    stripe_boundary_owner_verified: passed('Billing owner approved Stripe-boundary evidence for tool-cost surfaces.'),
    monitoring_deployment_verified: passed('Monitoring dashboards and alert routes were verified in staging.'),
    staging_billing_qa_verified: passed('Staging billing QA passed event write, replay, summary readback, settlement, and non-billable failure cases.'),
  }
}

function passed(evidence: string): BetaPlatformDeployedEvidenceObservation {
  return {
    ok: true,
    evidence: [evidence],
    nextAction: 'No action for smoke fixture.',
  }
}

interface FakeSupabaseAdminClient extends SupabaseClient {
  calls: {
    tables: string[]
    inserts: unknown[]
    rpc: Array<{ functionName: string; params: Record<string, unknown> }>
  }
}

function createFakeSupabaseAdminClient(): FakeSupabaseAdminClient {
  const rows = new Map<string, Record<string, unknown>>()
  const calls = {
    tables: [] as string[],
    inserts: [] as unknown[],
    rpc: [] as Array<{ functionName: string; params: Record<string, unknown> }>,
  }

  return {
    calls,
    from(tableName: string) {
      calls.tables.push(tableName)
      const filters: Record<string, string> = {}
      const selectBuilder = {
        limit: async () => ({ data: [], error: null }),
        eq(column: string, value: string) {
          filters[column] = value
          return selectBuilder
        },
        async maybeSingle() {
          const row = rows.get(`${filters.workspace_id}:${filters.idempotency_key}`) ?? null
          return { data: row, error: null }
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
    async rpc(functionName: string, params: Record<string, unknown>) {
      calls.rpc.push({ functionName, params })
      return {
        data: {
          id: 'wallet-settlement-smoke-row',
          tool_cost_event_id: params.p_tool_cost_event_id,
          idempotency_key: params.p_idempotency_key,
          status: 'not_billable',
        },
        error: null,
      }
    },
  } as unknown as FakeSupabaseAdminClient
}
