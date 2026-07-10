import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { resetMockToolCostStore } from '../tool-cost-metering/mock-tool-cost-store'
import { resetMockToolCostWalletSettlementStore } from '../tool-cost-metering/tool-cost-wallet-settlement'
import { runBetaPlatformBillingQa } from '../beta-readiness/platform-billing-qa'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

resetMockToolCostStore()
resetMockToolCostWalletSettlementStore()

const persistentFixture = {
  workspaceId: '11111111-1111-4111-8111-111111111111',
  projectId: '22222222-2222-4222-8222-222222222222',
  creditEstimateId: 'persistent-platform-billing-qa-credit-estimate',
  creditReservationId: '33333333-3333-4333-8333-333333333333',
}

const report = await runBetaPlatformBillingQa({
  env,
  clients: { admin: null, public: null },
  requestId: 'beta-platform-billing-qa-smoke',
  auth: {
    userId: 'mock-user-runtime',
    email: 'mock-user@reeditpro.local',
    isMockUser: true,
  },
}, {
  workspaceId: 'beta-platform-billing-qa-smoke-workspace',
  projectId: 'beta-platform-billing-qa-smoke-project',
  sourceId: 'beta-platform-billing-qa-smoke',
  sourceSha: '7777777777777777777777777777777777777777',
  environment: 'local_mock',
  notes: ['Smoke validates platform billing QA without Supabase, Stripe, wallet settlement, media, or beta enablement.'],
}, 'beta-platform-billing-qa-smoke-idempotency')

assert.equal(report.persistenceMode, 'mock_memory', 'Smoke must use mock memory persistence.')
assert.equal(report.wouldClearPlatformBlocker, false, 'Platform billing QA must not clear the shared platform blocker.')
assert.ok(report.toolEventId, 'Platform billing QA should create a controlled tool-cost event.')
assert.ok(report.toolEventCredits > 0, 'Tool-cost event should have non-zero credits.')
assert.ok(report.walletSettlementId, 'Platform billing QA should create an explicit mock wallet settlement.')
assert.equal(report.walletSettlementCreditsDelta, -report.toolEventCredits, 'Explicit mock wallet settlement should spend the event credits.')
assert.equal(report.walletMutationMode, 'mock_ledger_only', 'Local billing QA must remain mock-ledger only.')
assert.ok(report.billableEventCount >= 1, 'Summary should include a billable event.')
assert.ok(report.summaryCredits >= report.toolEventCredits, 'Summary credits should include the QA event credits.')
assert.ok(report.checks.every((check) => check.status === 'passed'), 'All local QA checks should pass.')
assert.ok(report.missingPlatformEvidence.some((item) => item.includes('wallet settlement')), 'Wallet settlement should remain named missing evidence.')
assert.ok(report.notes.some((note) => note.includes('does not process media')), 'Report should preserve no-runtime/no-media boundary notes.')

const persistentEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'false',
  SUPABASE_URL: 'http://supabase.local',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
})
const fakePersistent = createFakePersistentBillingAdmin()

const blockedPersistentReport = await runBetaPlatformBillingQa({
  env: persistentEnv,
  clients: { admin: fakePersistent.admin, public: null },
  requestId: 'beta-platform-billing-qa-smoke-persistent-blocked',
  auth: {
    userId: 'persistent-user-runtime',
    email: 'persistent-user@reeditpro.local',
    isMockUser: false,
  },
}, {
  workspaceId: persistentFixture.workspaceId,
  projectId: persistentFixture.projectId,
  sourceId: 'beta-platform-billing-qa-smoke:persistent-blocked',
  sourceSha: '8888888888888888888888888888888888888888',
  environment: 'staging_persistent',
  creditEstimateId: persistentFixture.creditEstimateId,
  creditReservationId: persistentFixture.creditReservationId,
  notes: ['Smoke verifies persistent billing QA blocks without explicit confirmation.'],
}, 'beta-platform-billing-qa-smoke-persistent-blocked')

assert.equal(blockedPersistentReport.persistenceMode, 'blocked_without_explicit_persistent_qa', 'Persistent QA must block without explicit confirmation.')
assert.equal(blockedPersistentReport.walletMutationMode, 'not_attempted', 'Blocked persistent QA must not attempt wallet settlement.')
assert.equal(fakePersistent.events.length, 0, 'Blocked persistent QA must not write tool-cost events.')
assert.equal(fakePersistent.settlements.length, 0, 'Blocked persistent QA must not write wallet settlements.')

const persistentReport = await runBetaPlatformBillingQa({
  env: persistentEnv,
  clients: { admin: fakePersistent.admin, public: null },
  requestId: 'beta-platform-billing-qa-smoke-persistent',
  auth: {
    userId: 'persistent-user-runtime',
    email: 'persistent-user@reeditpro.local',
    isMockUser: false,
  },
}, {
  workspaceId: persistentFixture.workspaceId,
  projectId: persistentFixture.projectId,
  sourceId: 'beta-platform-billing-qa-smoke:persistent',
  sourceSha: '9999999999999999999999999999999999999999',
  environment: 'staging_persistent',
  allowPersistentStoreQa: true,
  editPlanId: 'persistent-platform-billing-qa-edit-plan',
  jobId: 'persistent-platform-billing-qa-job',
  creditEstimateId: persistentFixture.creditEstimateId,
  creditReservationId: persistentFixture.creditReservationId,
  notes: ['Smoke verifies explicit persistent billing QA with a fake service-role client.'],
}, 'beta-platform-billing-qa-smoke-persistent')

assert.equal(persistentReport.persistenceMode, 'supabase_service_role', 'Explicit persistent QA should use the service-role persistence path.')
assert.equal(persistentReport.walletMutationMode, 'supabase_credit_ledger', 'Explicit persistent QA should settle through the persistent wallet ledger path.')
assert.ok(persistentReport.toolEventId, 'Explicit persistent QA should record a tool-cost event.')
assert.ok(persistentReport.walletSettlementId, 'Explicit persistent QA should record a wallet settlement.')
assert.equal(persistentReport.walletSettlementCreditsDelta, -persistentReport.toolEventCredits, 'Persistent settlement should spend the event credits.')
assert.ok(persistentReport.checks.every((check) => check.status === 'passed'), 'All fake persistent QA checks should pass.')
assert.ok(fakePersistent.events.length >= 1, 'Fake persistent QA should record a tool-cost event row.')
assert.ok(fakePersistent.settlements.length >= 1, 'Fake persistent QA should record a wallet settlement row.')
assert.ok(
  persistentReport.missingPlatformEvidence.some((item) => item.includes('release and refund')),
  'Persistent QA should still require separate release/refund lifecycle evidence.',
)

console.log(JSON.stringify({
  ok: true,
  reportId: report.reportId,
  persistenceMode: report.persistenceMode,
  checkIds: report.checks.map((check) => check.id),
  walletSettlementCreditsDelta: report.walletSettlementCreditsDelta,
  persistentReportId: persistentReport.reportId,
  persistentWalletMutationMode: persistentReport.walletMutationMode,
  missingPlatformEvidence: report.missingPlatformEvidence,
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
      state.rpcCalls.push({ name, params })
      if (name !== 'settle_tool_cost_event') {
        return { data: null, error: { code: '42883', message: `unknown rpc ${name}` } }
      }

      const existing = state.settlements.find((row) => row.idempotency_key === params.p_idempotency_key)
      if (existing) return { data: existing, error: null }

      const event = state.events.find((row) => row.id === params.p_tool_cost_event_id)
      if (!event) return { data: null, error: { code: 'P0001', message: 'tool cost event not found' } }

      const credits = Number(event.tool_cost_credits)
      const settlementType = String(params.p_settlement_type ?? 'spend')
      const row = {
        id: '44444444-4444-4444-8444-444444444444',
        idempotency_key: params.p_idempotency_key,
        workspace_id: event.workspace_id,
        project_id: event.project_id,
        tool_cost_event_id: event.id,
        credit_reservation_id: event.credit_reservation_id,
        credit_ledger_entry_id: '55555555-5555-4555-8555-555555555555',
        settlement_type: settlementType,
        status: 'settled',
        credits_delta: settlementType === 'spend' ? -credits : credits,
        billable_to_user: true,
        failure_category: event.failure_category,
        metadata_json: {
          tool_cost_wallet_settlement_rpc: true,
          stripe_call_attempted: false,
          service_fee_included: false,
        },
        created_at: '2026-06-27T00:00:09.000Z',
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
  const builder = {
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
  return builder
}

function rowsForTable(state: FakeBillingAdminState, table: string): Record<string, unknown>[] {
  if (table === 'tool_cost_events') return state.events
  if (table === 'tool_cost_wallet_settlements') return state.settlements
  return []
}

function matchesFilters(row: Record<string, unknown>, filters: FakeQueryFilter[]): boolean {
  return filters.every((filter) => row[filter.column] === filter.value)
}
