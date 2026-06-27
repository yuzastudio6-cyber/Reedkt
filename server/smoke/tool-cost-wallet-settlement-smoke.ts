import assert from 'node:assert/strict'
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

const nonBillable = await settleToolCostWallet(context, {
  workspaceId: eventResult.event.workspaceId,
  projectId: eventResult.event.projectId,
  toolCostEventId: 'tool-cost-wallet-settlement-smoke-provider-failure',
  creditEstimateId: eventResult.event.creditEstimateId,
  creditReservationId: eventResult.event.creditReservationId,
  toolCostCredits: 3,
  billableToUser: true,
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
}, null, 2))
