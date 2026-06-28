import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { settleToolCostWallet } from '../tool-cost-metering/tool-cost-wallet-settlement'

const settlementRow = {
  id: 'persistent-settlement-row-1',
  workspace_id: 'workspace-service-role-smoke',
  project_id: 'project-service-role-smoke',
  tool_cost_event_id: 'tool-cost-event-service-role-smoke',
  credit_reservation_id: 'credit-reservation-service-role-smoke',
  credit_ledger_entry_id: 'credit-ledger-entry-service-role-smoke',
  settlement_type: 'spend',
  status: 'settled',
  credits_delta: '-3',
  billable_to_user: true,
  failure_category: 'none',
  metadata_json: {
    tool_cost_wallet_settlement_rpc: true,
    stripe_call_attempted: false,
    service_fee_included: false,
  },
  created_at: '2026-06-27T00:00:00.000Z',
}

const admin = createFakeAdminClient({
  existingRows: new Map(),
  rpcRows: new Map([['service-role-smoke-settle', settlementRow]]),
})

const context = buildPersistentContext(admin)

const settled = await settleToolCostWallet(context, {
  workspaceId: 'workspace-service-role-smoke',
  projectId: 'project-service-role-smoke',
  toolCostEventId: 'tool-cost-event-service-role-smoke',
  creditReservationId: 'credit-reservation-service-role-smoke',
  toolCostCredits: 3,
  billableToUser: true,
  settlementType: 'spend',
}, 'service-role-smoke-settle')

const replayAdmin = createFakeAdminClient({
  existingRows: new Map([['service-role-smoke-replay', settlementRow]]),
  rpcRows: new Map(),
})

const replayed = await settleToolCostWallet(buildPersistentContext(replayAdmin), {
  workspaceId: 'workspace-service-role-smoke',
  projectId: 'project-service-role-smoke',
  toolCostEventId: 'tool-cost-event-service-role-smoke',
  creditReservationId: 'credit-reservation-service-role-smoke',
  toolCostCredits: 3,
  billableToUser: true,
  settlementType: 'spend',
}, 'service-role-smoke-replay')

const missingRpcAdmin = createFakeAdminClient({
  existingRows: new Map(),
  rpcRows: new Map(),
  rpcError: { code: '42883', message: 'function settle_tool_cost_event does not exist' },
})

await assert.rejects(
  settleToolCostWallet(buildPersistentContext(missingRpcAdmin), {
    workspaceId: 'workspace-service-role-smoke',
    projectId: 'project-service-role-smoke',
    toolCostEventId: 'tool-cost-event-service-role-smoke-missing-rpc',
    creditReservationId: 'credit-reservation-service-role-smoke',
    toolCostCredits: 3,
    billableToUser: true,
    settlementType: 'spend',
  }, 'service-role-smoke-missing-rpc'),
  (error) => error instanceof ApiError && error.code === 'TOOL_COST_BACKEND_REQUIRED',
  'missing settlement RPC should fail closed with TOOL_COST_BACKEND_REQUIRED',
)

assert.equal(settled.replayed, false, 'first persistent settlement should not replay')
assert.equal(settled.settlement.status, 'settled_persistent', 'RPC settlement should map to persistent status')
assert.equal(settled.settlement.walletMutationMode, 'supabase_credit_ledger', 'RPC settlement should use Supabase credit ledger mode')
assert.equal(settled.settlement.creditsDelta, -3, 'RPC settlement should preserve credit delta')
assert.equal(settled.settlement.stripeCallAttempted, false, 'RPC settlement must not call Stripe')
assert.equal(settled.settlement.serviceFeeIncluded, false, 'RPC settlement must exclude service fees')
assert.equal(admin.calls.rpc.length, 1, 'first settlement should call exactly one RPC')
assert.deepEqual(admin.calls.rpc[0], {
  functionName: 'settle_tool_cost_event',
  params: {
    p_idempotency_key: 'service-role-smoke-settle',
    p_tool_cost_event_id: 'tool-cost-event-service-role-smoke',
    p_settlement_type: 'spend',
  },
}, 'service-role RPC call shape should match migration function parameters')

assert.equal(replayed.replayed, true, 'existing persistent settlement should replay idempotently')
assert.equal(replayed.settlement.id, settlementRow.id, 'replay should return existing persistent row')
assert.equal(replayAdmin.calls.rpc.length, 0, 'persistent replay should not call RPC again')

console.log(JSON.stringify({
  ok: true,
  persistentSettlementStatus: settled.settlement.status,
  replayed: replayed.replayed,
  rpcCalls: admin.calls.rpc.length,
  replayRpcCalls: replayAdmin.calls.rpc.length,
  missingRpcFailsClosed: true,
  stripeCallAttempted: false,
  serviceFeeIncluded: false,
  remoteSupabaseTouched: false,
}, null, 2))

function buildPersistentContext(adminClient: SupabaseClient): ServiceContext {
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      SUPABASE_URL: 'https://example.supabase.local',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder-for-fake-client',
    }),
    clients: { admin: adminClient, public: null },
    requestId: 'tool-cost-wallet-settlement-service-role-smoke',
    auth: {
      userId: 'service-role-smoke-user',
      email: 'service-role-smoke@reeditpro.local',
      isMockUser: true,
    },
  }
}

interface FakeAdminClientOptions {
  existingRows: Map<string, typeof settlementRow>
  rpcRows: Map<string, typeof settlementRow>
  rpcError?: { code?: string; message?: string; hint?: string }
}

function createFakeAdminClient(options: FakeAdminClientOptions): SupabaseClient & {
  calls: { from: string[]; rpc: Array<{ functionName: string; params: Record<string, unknown> }> }
} {
  const calls = {
    from: [] as string[],
    rpc: [] as Array<{ functionName: string; params: Record<string, unknown> }>,
  }

  return {
    calls,
    from(tableName: string) {
      calls.from.push(tableName)
      assert.equal(tableName, 'tool_cost_wallet_settlements', 'settlement path should query the wallet settlement table')
      return {
        select() {
          return {
            eq(column: string, value: string) {
              assert.equal(column, 'idempotency_key', 'replay lookup should use idempotency key')
              return {
                async maybeSingle() {
                  return { data: options.existingRows.get(value) ?? null, error: null }
                },
              }
            },
          }
        },
      }
    },
    async rpc(functionName: string, params: Record<string, unknown>) {
      calls.rpc.push({ functionName, params })
      if (options.rpcError) {
        return { data: null, error: options.rpcError }
      }
      return {
        data: options.rpcRows.get(String(params.p_idempotency_key)) ?? null,
        error: null,
      }
    },
  } as unknown as SupabaseClient & {
    calls: { from: string[]; rpc: Array<{ functionName: string; params: Record<string, unknown> }> }
  }
}
