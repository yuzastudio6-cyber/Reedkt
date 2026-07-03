import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { runBetaPlatformCreditReservationHoldQa } from '../beta-readiness/platform-credit-reservation-hold-qa'

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
  creditWalletId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  creditApprovalId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  creditEstimateId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
}

const localReport = await runBetaPlatformCreditReservationHoldQa({
  env: localEnv,
  clients: { admin: null, public: null },
  requestId: 'platform-credit-reservation-hold-qa-smoke-local',
  auth: {
    userId: 'mock-user-runtime',
    email: 'mock-user@reeditpro.local',
    isMockUser: true,
  },
}, {
  workspaceId: 'platform-credit-reservation-hold-qa-smoke-workspace',
  projectId: 'platform-credit-reservation-hold-qa-smoke-project',
  sourceId: 'platform-credit-reservation-hold-qa-smoke:local',
  sourceSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  environment: 'local_mock',
  reservedCredits: 12,
  notes: ['Smoke validates reservation hold QA without Supabase, Stripe, media, or beta enablement.'],
}, 'platform-credit-reservation-hold-qa-smoke-local')

assert.equal(localReport.persistenceMode, 'mock_memory', 'Local reservation hold QA must use mock memory persistence.')
assert.equal(localReport.reservationHoldVerified, true, 'Local reservation hold QA should verify a positive reservation hold.')
assert.equal(localReport.idempotentReplayVerified, true, 'Local reservation hold QA should prove idempotent replay.')
assert.equal(localReport.stripeBoundaryPreserved, true, 'Local reservation hold QA must preserve Stripe boundary.')
assert.equal(localReport.serviceFeeExcluded, true, 'Local reservation hold QA must exclude service fees.')
assert.equal(localReport.reservationEvidence?.reservedCredits, 12, 'Local reservation hold QA should preserve the requested credit amount.')

const fakePersistent = createFakePersistentCreditAdmin()
const blockedPersistentReport = await runBetaPlatformCreditReservationHoldQa({
  env: persistentEnv,
  clients: { admin: fakePersistent.admin, public: null },
  requestId: 'platform-credit-reservation-hold-qa-smoke-persistent-blocked',
  auth: {
    userId: 'persistent-user-runtime',
    email: 'persistent-user@reeditpro.local',
    isMockUser: false,
  },
}, {
  ...persistentFixture,
  sourceId: 'platform-credit-reservation-hold-qa-smoke:persistent-blocked',
  sourceSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  environment: 'staging_persistent',
  reservedCredits: 14,
  notes: ['Smoke verifies persistent reservation hold QA blocks without explicit confirmation.'],
}, 'platform-credit-reservation-hold-qa-smoke-persistent-blocked')

assert.equal(blockedPersistentReport.persistenceMode, 'blocked_without_explicit_persistent_qa', 'Persistent reservation hold QA must block without explicit confirmation.')
assert.equal(blockedPersistentReport.reservationEvidence, undefined, 'Blocked persistent reservation hold QA must not produce reservation evidence.')
assert.equal(fakePersistent.reservations.length, 0, 'Blocked persistent reservation hold QA must not write credit reservations.')

const persistentReport = await runBetaPlatformCreditReservationHoldQa({
  env: persistentEnv,
  clients: { admin: fakePersistent.admin, public: null },
  requestId: 'platform-credit-reservation-hold-qa-smoke-persistent',
  auth: {
    userId: 'persistent-user-runtime',
    email: 'persistent-user@reeditpro.local',
    isMockUser: false,
  },
}, {
  ...persistentFixture,
  sourceId: 'platform-credit-reservation-hold-qa-smoke:persistent',
  sourceSha: 'cccccccccccccccccccccccccccccccccccccccc',
  environment: 'staging_persistent',
  allowPersistentReservationHoldQa: true,
  editPlanId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  reservedCredits: 14,
  notes: ['Smoke verifies explicit persistent reservation hold QA with a fake service-role client.'],
}, 'platform-credit-reservation-hold-qa-smoke-persistent')

assert.equal(persistentReport.persistenceMode, 'supabase_service_role', 'Explicit persistent reservation hold QA should use service-role persistence.')
assert.equal(persistentReport.reservationHoldVerified, true, 'Explicit persistent reservation hold QA should verify a positive reservation hold.')
assert.equal(persistentReport.idempotentReplayVerified, true, 'Explicit persistent reservation hold QA should prove replay.')
assert.equal(persistentReport.reservationEvidence?.reservedCredits, 14, 'Persistent reservation should preserve the held credit amount.')
assert.equal(persistentReport.reservationEvidence?.creditWalletId, persistentFixture.creditWalletId, 'Persistent reservation should preserve wallet fixture.')
assert.equal(persistentReport.reservationEvidence?.creditApprovalId, persistentFixture.creditApprovalId, 'Persistent reservation should preserve approval fixture.')
assert.equal(fakePersistent.reservations.length, 1, 'Explicit persistent reservation hold QA should write exactly one reservation because replay is idempotent.')
assert.ok(
  persistentReport.missingProductionEvidence.some((item) => item.includes('transactional reservation RPC')),
  'Persistent reservation hold QA should still require separate transactional reservation RPC evidence.',
)

console.log(JSON.stringify({
  ok: true,
  localPersistenceMode: localReport.persistenceMode,
  localReservedCredits: localReport.reservationEvidence?.reservedCredits,
  persistentPersistenceMode: persistentReport.persistenceMode,
  persistentReservedCredits: persistentReport.reservationEvidence?.reservedCredits,
  persistentReservationRows: fakePersistent.reservations.length,
  remoteSupabaseTouched: false,
}, null, 2))

interface FakeQueryFilter {
  column: string
  value: unknown
}

interface FakeCreditAdminState {
  reservations: Record<string, unknown>[]
}

function createFakePersistentCreditAdmin(): FakeCreditAdminState & { admin: any } {
  const state: FakeCreditAdminState = {
    reservations: [],
  }

  const admin = {
    from(table: string) {
      return createTableBuilder(state, table)
    },
  }

  return { ...state, admin }
}

function createTableBuilder(state: FakeCreditAdminState, table: string) {
  return {
    select() {
      return createSelectBuilder(state, table)
    },
    insert(row: Record<string, unknown>) {
      return {
        select() {
          return {
            async single() {
              if (table !== 'credit_reservations') {
                return { data: null, error: { code: '42P01', message: `unsupported insert table ${table}` } }
              }
              const saved = {
                id: `99999999-9999-4999-8999-${String(state.reservations.length + 1).padStart(12, '0')}`,
                ...row,
                created_at: '2026-06-27T00:04:00.000Z',
              }
              state.reservations.push(saved)
              return { data: saved, error: null }
            },
          }
        },
      }
    },
  }
}

function createSelectBuilder(state: FakeCreditAdminState, table: string, filters: FakeQueryFilter[] = []) {
  return {
    eq(column: string, value: unknown) {
      return createSelectBuilder(state, table, [...filters, { column, value }])
    },
    async maybeSingle() {
      const rows = rowsForTable(state, table).filter((row) => matchesFilters(row, filters))
      return { data: rows[0] ?? null, error: null }
    },
  }
}

function rowsForTable(state: FakeCreditAdminState, table: string): Record<string, unknown>[] {
  if (table === 'credit_reservations') return state.reservations
  return []
}

function matchesFilters(row: Record<string, unknown>, filters: FakeQueryFilter[]): boolean {
  return filters.every((filter) => row[filter.column] === filter.value)
}
