import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { runBetaPlatformWalletLifecycleQa } from '../beta-readiness/platform-wallet-lifecycle-qa'
import { resetMockToolCostStore } from '../tool-cost-metering/mock-tool-cost-store'
import { resetMockToolCostWalletSettlementStore } from '../tool-cost-metering/tool-cost-wallet-settlement'

resetMockToolCostStore()
resetMockToolCostWalletSettlementStore()

const localEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const persistentEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'false',
  SUPABASE_URL: 'http://supabase.local',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
})

const persistentFixture = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  creditEstimateId: 'persistent-wallet-lifecycle-qa-credit-estimate',
  creditReservationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
}

const localReport = await runBetaPlatformWalletLifecycleQa({
  env: localEnv,
  clients: { admin: null, public: null },
  requestId: 'platform-wallet-lifecycle-qa-smoke-local',
  auth: {
    userId: 'mock-user-runtime',
    email: 'mock-user@reeditpro.local',
    isMockUser: true,
  },
}, {
  workspaceId: 'platform-wallet-lifecycle-qa-smoke-workspace',
  projectId: 'platform-wallet-lifecycle-qa-smoke-project',
  sourceId: 'platform-wallet-lifecycle-qa-smoke:local',
  sourceSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  environment: 'local_mock',
  notes: ['Smoke validates wallet lifecycle QA without Supabase, Stripe, media, or beta enablement.'],
}, 'platform-wallet-lifecycle-qa-smoke-local')

assert.equal(localReport.persistenceMode, 'mock_memory', 'Local wallet lifecycle QA must use mock memory persistence.')
assert.equal(localReport.spendVerified, true, 'Local wallet lifecycle QA should verify spend settlement.')
assert.equal(localReport.releaseVerified, true, 'Local wallet lifecycle QA should verify release settlement.')
assert.equal(localReport.refundVerified, true, 'Local wallet lifecycle QA should verify refund settlement.')
assert.equal(localReport.idempotentReplayVerified, true, 'Local wallet lifecycle QA should prove idempotent replay.')
assert.equal(localReport.stripeBoundaryPreserved, true, 'Local wallet lifecycle QA must preserve Stripe boundary.')
assert.equal(localReport.serviceFeeExcluded, true, 'Local wallet lifecycle QA must exclude service fees.')
assert.ok(localReport.settlementEvidence.every((item) => item.walletMutationMode === 'mock_ledger_only'), 'Local lifecycle settlements must be mock-ledger only.')
assert.ok(localReport.settlementEvidence.some((item) => item.settlementType === 'spend' && item.creditsDelta < 0), 'Spend should debit credits.')
assert.ok(localReport.settlementEvidence.some((item) => item.settlementType === 'release' && item.creditsDelta > 0), 'Release should return credits.')
assert.ok(localReport.settlementEvidence.some((item) => item.settlementType === 'refund' && item.creditsDelta > 0), 'Refund should return credits.')

const fakePersistent = createFakePersistentBillingAdmin()
const blockedPersistentReport = await runBetaPlatformWalletLifecycleQa({
  env: persistentEnv,
  clients: { admin: fakePersistent.admin, public: null },
  requestId: 'platform-wallet-lifecycle-qa-smoke-persistent-blocked',
  auth: {
    userId: 'persistent-user-runtime',
    email: 'persistent-user@reeditpro.local',
    isMockUser: false,
  },
}, {
  workspaceId: persistentFixture.workspaceId,
  projectId: persistentFixture.projectId,
  sourceId: 'platform-wallet-lifecycle-qa-smoke:persistent-blocked',
  sourceSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  environment: 'staging_persistent',
  creditEstimateId: persistentFixture.creditEstimateId,
  creditReservationId: persistentFixture.creditReservationId,
  notes: ['Smoke verifies persistent wallet lifecycle QA blocks without explicit confirmation.'],
}, 'platform-wallet-lifecycle-qa-smoke-persistent-blocked')

assert.equal(blockedPersistentReport.persistenceMode, 'blocked_without_explicit_persistent_qa', 'Persistent wallet lifecycle QA must block without explicit confirmation.')
assert.equal(blockedPersistentReport.settlementEvidence.length, 0, 'Blocked persistent wallet lifecycle QA must not produce settlement evidence.')
assert.equal(fakePersistent.events.length, 0, 'Blocked persistent wallet lifecycle QA must not write tool-cost events.')
assert.equal(fakePersistent.settlements.length, 0, 'Blocked persistent wallet lifecycle QA must not write wallet settlements.')

const persistentReport = await runBetaPlatformWalletLifecycleQa({
  env: persistentEnv,
  clients: { admin: fakePersistent.admin, public: null },
  requestId: 'platform-wallet-lifecycle-qa-smoke-persistent',
  auth: {
    userId: 'persistent-user-runtime',
    email: 'persistent-user@reeditpro.local',
    isMockUser: false,
  },
}, {
  workspaceId: persistentFixture.workspaceId,
  projectId: persistentFixture.projectId,
  sourceId: 'platform-wallet-lifecycle-qa-smoke:persistent',
  sourceSha: 'cccccccccccccccccccccccccccccccccccccccc',
  environment: 'staging_persistent',
  allowPersistentWalletLifecycleQa: true,
  editPlanId: 'persistent-wallet-lifecycle-qa-edit-plan',
  jobIdPrefix: 'persistent-wallet-lifecycle-qa-job',
  creditEstimateId: persistentFixture.creditEstimateId,
  creditReservationId: persistentFixture.creditReservationId,
  notes: ['Smoke verifies explicit persistent wallet lifecycle QA with a fake service-role client.'],
}, 'platform-wallet-lifecycle-qa-smoke-persistent')

assert.equal(persistentReport.persistenceMode, 'supabase_service_role', 'Explicit persistent wallet lifecycle QA should use service-role persistence.')
assert.equal(persistentReport.spendVerified, true, 'Explicit persistent wallet lifecycle QA should verify spend settlement.')
assert.equal(persistentReport.releaseVerified, true, 'Explicit persistent wallet lifecycle QA should verify release settlement.')
assert.equal(persistentReport.refundVerified, true, 'Explicit persistent wallet lifecycle QA should verify refund settlement.')
assert.equal(persistentReport.idempotentReplayVerified, true, 'Explicit persistent wallet lifecycle QA should prove replay.')
assert.ok(persistentReport.settlementEvidence.every((item) => item.walletMutationMode === 'supabase_credit_ledger'), 'Persistent lifecycle settlements should use Supabase credit ledger mode.')
assert.equal(fakePersistent.events.length, 3, 'Explicit persistent wallet lifecycle QA should write one tool-cost event per settlement type.')
assert.equal(fakePersistent.settlements.length, 3, 'Explicit persistent wallet lifecycle QA should write one wallet settlement per settlement type.')
assert.equal(fakePersistent.rpcCalls.length, 3, 'Explicit persistent wallet lifecycle QA should call the settlement RPC once per settlement type.')
assert.ok(
  persistentReport.missingProductionEvidence.some((item) => item.includes('credit reservation creation')),
  'Persistent wallet lifecycle QA should still require separate reservation creation evidence.',
)

console.log(JSON.stringify({
  ok: true,
  localPersistenceMode: localReport.persistenceMode,
  localSettlementTypes: localReport.settlementEvidence.map((item) => item.settlementType),
  persistentPersistenceMode: persistentReport.persistenceMode,
  persistentSettlementTypes: persistentReport.settlementEvidence.map((item) => item.settlementType),
  persistentRpcCalls: fakePersistent.rpcCalls.length,
  remoteSupabaseTouched: false,
}, null, 2))

interface FakeQueryFilter {
  column: string
  value: unknown
}

interface FakeBillingAdminState {
  events: Record<string, unknown>[]
  settlements: Record<string, unknown>[]
  rpcCalls: { name: string; params: Record<string, unknown> }[]
}

function createFakePersistentBillingAdmin(): FakeBillingAdminState & { admin: any } {
  const state: FakeBillingAdminState = {
    events: [],
    settlements: [],
    rpcCalls: [],
  }

  const admin = {
    from(table: string) {
      return createTableBuilder(state, table)
    },
    async rpc(name: string, params: Record<string, unknown>) {
      if (name !== 'settle_tool_cost_event') {
        return { data: null, error: { code: '42883', message: `unknown rpc ${name}` } }
      }

      const existing = state.settlements.find((row) => row.idempotency_key === params.p_idempotency_key)
      if (existing) return { data: existing, error: null }

      state.rpcCalls.push({ name, params })
      const event = state.events.find((row) => row.id === params.p_tool_cost_event_id)
      if (!event) return { data: null, error: { code: 'P0001', message: 'tool cost event not found' } }

      const credits = Number(event.tool_cost_credits)
      const settlementType = String(params.p_settlement_type ?? 'spend')
      const row = {
        id: `dddddddd-dddd-4ddd-8ddd-${String(state.settlements.length + 1).padStart(12, '0')}`,
        idempotency_key: params.p_idempotency_key,
        workspace_id: event.workspace_id,
        project_id: event.project_id,
        tool_cost_event_id: event.id,
        credit_reservation_id: event.credit_reservation_id,
        credit_ledger_entry_id: `eeeeeeee-eeee-4eee-8eee-${String(state.settlements.length + 1).padStart(12, '0')}`,
        settlement_type: settlementType,
        status: 'settled',
        credits_delta: settlementType === 'spend' ? -credits : credits,
        billable_to_user: true,
        failure_category: event.failure_category,
        metadata_json: {
          tool_cost_wallet_settlement_rpc: true,
          settlement_type: settlementType,
          stripe_call_attempted: false,
          service_fee_included: false,
        },
        created_at: '2026-06-27T00:02:08.000Z',
      }
      state.settlements.push(row)
      return { data: row, error: null }
    },
  }

  return { ...state, admin }
}

function createTableBuilder(state: FakeBillingAdminState, table: string) {
  return {
    select() {
      return createSelectBuilder(state, table)
    },
    insert(row: Record<string, unknown>) {
      return {
        select() {
          return {
            async single() {
              if (table !== 'tool_cost_events') {
                return { data: null, error: { code: '42P01', message: `unsupported insert table ${table}` } }
              }
              state.events.push(row)
              return { data: row, error: null }
            },
          }
        },
      }
    },
  }
}

function createSelectBuilder(state: FakeBillingAdminState, table: string, filters: FakeQueryFilter[] = []) {
  return {
    eq(column: string, value: unknown) {
      return createSelectBuilder(state, table, [...filters, { column, value }])
    },
    async maybeSingle() {
      const rows = rowsForTable(state, table).filter((row) => matchesFilters(row, filters))
      return { data: rows[0] ?? null, error: null }
    },
    async order() {
      return { data: rowsForTable(state, table).filter((row) => matchesFilters(row, filters)), error: null }
    },
  }
}

function rowsForTable(state: FakeBillingAdminState, table: string): Record<string, unknown>[] {
  if (table === 'tool_cost_events') return state.events
  if (table === 'tool_cost_wallet_settlements') return state.settlements
  return []
}

function matchesFilters(row: Record<string, unknown>, filters: FakeQueryFilter[]): boolean {
  return filters.every((filter) => row[filter.column] === filter.value)
}
