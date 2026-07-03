import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadRuntimeEnv } from '../config/env'
import { resetMockToolCostStore } from '../tool-cost-metering/mock-tool-cost-store'
import {
  resetMockToolCostWalletSettlementStore,
  settleToolCostWallet,
} from '../tool-cost-metering/tool-cost-wallet-settlement'
import { createToolCostMeteringService } from '../tool-cost-metering/tool-cost-metering-service'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const context = {
  env,
  clients: { admin: null, public: null },
  requestId: 'tool-cost-wallet-settlement-smoke',
  auth: {
    userId: 'mock-user-runtime',
    email: 'mock-user@reeditpro.local',
    isMockUser: true,
  },
}

resetMockToolCostStore()
resetMockToolCostWalletSettlementStore()

const service = createToolCostMeteringService(context)
const eventResult = await service.emitToolCostEvent({
  workspaceId: 'tool-cost-wallet-settlement-smoke-workspace',
  projectId: 'tool-cost-wallet-settlement-smoke-project',
  editPlanId: 'tool-cost-wallet-settlement-smoke-edit-plan',
  jobId: 'tool-cost-wallet-settlement-smoke-job',
  creditEstimateId: 'tool-cost-wallet-settlement-smoke-estimate',
  creditReservationId: 'tool-cost-wallet-settlement-smoke-reservation',
  toolId: 'ffmpeg',
  toolName: 'FFmpeg wallet settlement smoke',
  usageCategory: 'rendering',
  providerType: 'deterministic_renderer',
  qualityLevel: 'preview',
  startedAt: '2026-06-27T00:00:00.000Z',
  completedAt: '2026-06-27T00:00:09.000Z',
  wallClockMs: 9_000,
  billableToUser: true,
  approvedReservationRemainingCredits: 25,
  metadata: {
    smoke: 'tool-cost-wallet-settlement',
    stripeCallAttempted: false,
    serviceFeeIncluded: false,
  },
}, 'tool-cost-wallet-settlement-smoke-event')

const nonBillableEventResult = await service.emitToolCostEvent({
  workspaceId: 'tool-cost-wallet-settlement-smoke-workspace',
  projectId: 'tool-cost-wallet-settlement-smoke-project',
  editPlanId: 'tool-cost-wallet-settlement-smoke-edit-plan',
  jobId: 'tool-cost-wallet-settlement-smoke-provider-failure-job',
  creditEstimateId: 'tool-cost-wallet-settlement-smoke-estimate',
  creditReservationId: 'tool-cost-wallet-settlement-smoke-reservation',
  toolId: 'ffmpeg',
  toolName: 'FFmpeg provider failure settlement smoke',
  usageCategory: 'rendering',
  providerType: 'deterministic_renderer',
  qualityLevel: 'preview',
  startedAt: '2026-06-27T00:01:00.000Z',
  completedAt: '2026-06-27T00:01:02.000Z',
  wallClockMs: 2_000,
  billableToUser: true,
  failureCategory: 'provider_error',
  approvedReservationRemainingCredits: 25,
  metadata: {
    smoke: 'tool-cost-wallet-settlement-non-billable',
    stripeCallAttempted: false,
    serviceFeeIncluded: false,
  },
}, 'tool-cost-wallet-settlement-smoke-non-billable-event')

const settled = await settleToolCostWallet(context, {
  workspaceId: eventResult.event.workspaceId,
  projectId: eventResult.event.projectId,
  toolCostEventId: eventResult.event.id,
  creditEstimateId: eventResult.event.creditEstimateId,
  creditReservationId: eventResult.event.creditReservationId,
  toolCostCredits: eventResult.event.toolCostCredits,
  billableToUser: eventResult.event.billableToUser,
  failureCategory: eventResult.event.failureCategory,
  settlementType: 'spend',
  metadata: { smoke: 'tool-cost-wallet-settlement' },
}, 'tool-cost-wallet-settlement-smoke-settle')

const replayed = await settleToolCostWallet(context, {
  workspaceId: eventResult.event.workspaceId,
  projectId: eventResult.event.projectId,
  toolCostEventId: eventResult.event.id,
  creditEstimateId: eventResult.event.creditEstimateId,
  creditReservationId: eventResult.event.creditReservationId,
  toolCostCredits: eventResult.event.toolCostCredits,
  billableToUser: eventResult.event.billableToUser,
  failureCategory: eventResult.event.failureCategory,
  settlementType: 'spend',
}, 'tool-cost-wallet-settlement-smoke-settle')

await assert.rejects(
  settleToolCostWallet(context, {
    workspaceId: 'tool-cost-wallet-settlement-smoke-other-workspace',
    projectId: eventResult.event.projectId,
    toolCostEventId: eventResult.event.id,
    creditEstimateId: eventResult.event.creditEstimateId,
    creditReservationId: eventResult.event.creditReservationId,
    toolCostCredits: eventResult.event.toolCostCredits,
    billableToUser: eventResult.event.billableToUser,
    failureCategory: eventResult.event.failureCategory,
    settlementType: 'spend',
  }, 'tool-cost-wallet-settlement-smoke-settle'),
  /TOOL_COST_SETTLEMENT_EVENT_MISMATCH|must match the recorded tool cost event|TOOL_COST_SETTLEMENT_CONTEXT_MISMATCH|context does not match/,
  'Mock settlement replay must fail closed when the caller supplies a mismatched workspace.',
)

await assert.rejects(
  settleToolCostWallet(context, {
    workspaceId: eventResult.event.workspaceId,
    projectId: eventResult.event.projectId,
    toolCostEventId: eventResult.event.id,
    creditEstimateId: eventResult.event.creditEstimateId,
    toolCostCredits: eventResult.event.toolCostCredits,
    billableToUser: true,
    failureCategory: 'none',
    settlementType: 'spend',
  }, 'tool-cost-wallet-settlement-smoke-missing-reservation'),
  /creditReservationId|CREDITS_NOT_RESERVED/,
  'Billable mock settlement must require a caller-supplied creditReservationId.',
)

await assert.rejects(
  settleToolCostWallet(context, {
    workspaceId: eventResult.event.workspaceId,
    projectId: eventResult.event.projectId,
    toolCostEventId: eventResult.event.id,
    creditEstimateId: eventResult.event.creditEstimateId,
    toolCostCredits: 1,
    billableToUser: false,
    failureCategory: 'provider_error',
    settlementType: 'release',
  }, 'tool-cost-wallet-settlement-smoke-release-missing-reservation'),
  /creditReservationId|CREDITS_NOT_RESERVED/,
  'Release mock settlement must require a caller-supplied creditReservationId.',
)

await assert.rejects(
  settleToolCostWallet(context, {
    workspaceId: eventResult.event.workspaceId,
    projectId: eventResult.event.projectId,
    toolCostEventId: 'tool-cost-wallet-settlement-smoke-unknown-event',
    creditEstimateId: eventResult.event.creditEstimateId,
    creditReservationId: eventResult.event.creditReservationId,
    toolCostCredits: eventResult.event.toolCostCredits,
    billableToUser: eventResult.event.billableToUser,
    failureCategory: eventResult.event.failureCategory,
    settlementType: 'spend',
  }, 'tool-cost-wallet-settlement-smoke-unknown-event'),
  /TOOL_COST_EVENT_NOT_FOUND|recorded tool cost event/,
  'Mock settlement must require a previously recorded tool-cost event.',
)

await assert.rejects(
  settleToolCostWallet(context, {
    workspaceId: eventResult.event.workspaceId,
    projectId: eventResult.event.projectId,
    toolCostEventId: eventResult.event.id,
    creditEstimateId: eventResult.event.creditEstimateId,
    creditReservationId: eventResult.event.creditReservationId,
    toolCostCredits: eventResult.event.toolCostCredits + 1,
    billableToUser: eventResult.event.billableToUser,
    failureCategory: eventResult.event.failureCategory,
    settlementType: 'spend',
  }, 'tool-cost-wallet-settlement-smoke-mismatched-credits'),
  /TOOL_COST_SETTLEMENT_EVENT_MISMATCH|must match the recorded tool cost event/,
  'Mock settlement must reject caller-supplied credits that do not match the recorded event.',
)

const nonBillable = await settleToolCostWallet(context, {
  workspaceId: nonBillableEventResult.event.workspaceId,
  projectId: nonBillableEventResult.event.projectId,
  toolCostEventId: nonBillableEventResult.event.id,
  creditEstimateId: nonBillableEventResult.event.creditEstimateId,
  creditReservationId: nonBillableEventResult.event.creditReservationId,
  toolCostCredits: nonBillableEventResult.event.toolCostCredits,
  billableToUser: nonBillableEventResult.event.billableToUser,
  failureCategory: 'provider_error',
  settlementType: 'spend',
}, 'tool-cost-wallet-settlement-smoke-nonbillable')

assert.equal(settled.replayed, false, 'First settlement should not replay.')
assert.equal(settled.settlement.status, 'settled_mock', 'Billable event should create mock settlement.')
assert.equal(settled.settlement.creditsDelta, -eventResult.event.toolCostCredits, 'Spend settlement should debit event credits.')
assert.equal(settled.settlement.stripeCallAttempted, false, 'Settlement must not call Stripe.')
assert.equal(settled.settlement.serviceFeeIncluded, false, 'Settlement must not include service/edit fees.')
assert.equal(replayed.replayed, true, 'Duplicate idempotency key should replay settlement.')
assert.equal(replayed.settlement.id, settled.settlement.id, 'Replay should return the original settlement.')
assert.equal(nonBillable.settlement.status, 'not_billable', 'Provider failure should not bill the user.')
assert.equal(nonBillable.settlement.creditsDelta, 0, 'Non-billable settlement should have no credit delta.')

const migrationSource = readFileSync('supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql', 'utf8')
assert.ok(migrationSource.includes('create table if not exists public.tool_cost_wallet_settlements'), 'Settlement migration should create the settlement table.')
assert.ok(migrationSource.includes('create or replace function public.settle_tool_cost_event'), 'Settlement migration should define the settlement RPC.')
assert.ok(migrationSource.includes('credit_ledger_entries'), 'Settlement RPC should write to the credit ledger.')
assert.ok(migrationSource.includes('stripe_call_attempted'), 'Settlement RPC should preserve Stripe isolation metadata.')
assert.ok(migrationSource.includes('service_fee_included'), 'Settlement RPC should preserve service-fee exclusion metadata.')

await assert.rejects(settleToolCostWallet(context, {
    workspaceId: eventResult.event.workspaceId,
    projectId: eventResult.event.projectId,
    toolCostEventId: 'tool-cost-wallet-settlement-smoke-secret',
    creditEstimateId: eventResult.event.creditEstimateId,
    creditReservationId: eventResult.event.creditReservationId,
    toolCostCredits: 1,
    billableToUser: true,
    metadata: { apiKey: 'sk-secret-value' },
  }, 'tool-cost-wallet-settlement-smoke-secret'), /secret-like/, 'Settlement metadata must reject secret-like payloads.')

console.log(JSON.stringify({
  ok: true,
  eventCredits: eventResult.event.toolCostCredits,
  settlementId: settled.settlement.id,
  creditsDelta: settled.settlement.creditsDelta,
  replayed: replayed.replayed,
  nonBillableStatus: nonBillable.settlement.status,
  migrationSourcePresent: true,
}, null, 2))
