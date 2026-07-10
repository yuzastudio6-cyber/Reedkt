import assert from 'node:assert/strict'
import {
  runProductionBillingEvidenceCollectorFromEnv,
  type ProductionBillingEvidenceCollectorEnv,
  type ProductionBillingEvidenceCollectorFetch,
} from '../cli/production-billing-evidence-collector'

const dryRunEnv = completeEnv(false)
let dryRunFetchCalled = false
const dryRun = await runProductionBillingEvidenceCollectorFromEnv(dryRunEnv, async () => {
  dryRunFetchCalled = true
  throw new Error('fetch must not run in dry-run mode')
})
assert.equal(dryRun.ok, true, 'dry-run should pass as a request plan')
assert.equal(dryRun.mode, 'dry_run', 'collector should default to dry-run mode')
assert.equal(dryRun.readyForRouteEvidence, true, 'dry-run should be ready for explicit route evidence confirmation')
assert.equal(dryRun.routeEvidenceConfirmationRequired, true, 'dry-run should require explicit route evidence confirmation')
assert.equal(dryRunFetchCalled, false, 'dry-run must not call fetch')

await assert.rejects(
  () => runProductionBillingEvidenceCollectorFromEnv({
    ...completeEnv(false),
    REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE: 'true',
    REEDITPRO_PRODUCTION_BILLING_API_BASE_URL: '',
  }, async () => {
    throw new Error('fetch must not run with missing confirmed route configuration')
  }),
  /API_BASE_URL/,
  'confirmed collector should require API route configuration before fetch',
)

await assert.rejects(
  () => runProductionBillingEvidenceCollectorFromEnv({
    ...completeEnv(true),
    REEDITPRO_PRODUCTION_BILLING_EVENT_IDEMPOTENCY_KEY: 'sk-secret-event-key',
  }, async () => {
    throw new Error('fetch must not run with secret-like event idempotency key')
  }),
  /secret-like|EVENT_IDEMPOTENCY/,
  'collector should reject secret-like route configuration before backend calls',
)

const calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }> = []
const recorded = await runProductionBillingEvidenceCollectorFromEnv(completeEnv(true), fakeFetch(calls))
assert.equal(recorded.ok, true, 'confirmed collector should verify billing route evidence')
assert.equal(recorded.mode, 'recorded', 'confirmed collector should report recorded mode')
assert.equal(recorded.checks.toolCostEventWriteVerified, true, 'collector should verify tool-cost event write')
assert.equal(recorded.checks.toolCostEventIdempotentReplayVerified, true, 'collector should verify event replay')
assert.equal(recorded.checks.walletSettlementVerified, true, 'collector should verify wallet settlement')
assert.equal(recorded.checks.walletSettlementReplayVerified, true, 'collector should verify settlement replay')
assert.equal(recorded.checks.projectSummaryReadbackVerified, true, 'collector should verify project summary readback')
assert.equal(recorded.checks.creditReservationRequired, true, 'collector should prove credit reservation context')
assert.equal(recorded.checks.stripeBoundaryPreserved, true, 'collector should preserve Stripe boundary')
assert.equal(recorded.checks.serviceFeeExcluded, true, 'collector should keep service fee out of tool events')
assert.equal(recorded.checks.noSilentChargeVerified, true, 'collector should prove approved reservation context before settlement')
assert.equal(recorded.evidence?.event.eventId, 'tool-cost-production-billing-evidence-smoke')
assert.equal(recorded.evidence?.eventReplay.replayed, true)
assert.equal(recorded.evidence?.settlement.creditsDelta, -2)
assert.equal(recorded.evidence?.settlementReplay.replayed, true)
assert.equal(calls.length, 5, 'collector should write event, replay event, settle, replay settlement, then read summary')
assert.equal(calls[0]?.method, 'POST')
assert.equal(calls[1]?.method, 'POST')
assert.equal(calls[2]?.method, 'POST')
assert.equal(calls[3]?.method, 'POST')
assert.equal(calls[4]?.method, 'GET')
assert.equal(calls[0]?.idempotencyKey, 'production-billing-event-smoke')
assert.equal(calls[1]?.idempotencyKey, 'production-billing-event-smoke')
assert.equal(calls[2]?.idempotencyKey, 'production-billing-settlement-smoke')
assert.equal(calls[3]?.idempotencyKey, 'production-billing-settlement-smoke')
assert.equal(calls[0]?.body?.creditReservationId, 'production-billing-credit-reservation-smoke')
assert.equal(calls[2]?.body?.creditReservationId, 'production-billing-credit-reservation-smoke')
assert.equal(JSON.stringify(recorded).includes('production-billing-secret-token'), false, 'result must not expose bearer token')
assert.equal(JSON.stringify(recorded).includes('service_role_key'), false, 'result must not expose secret-like text')

await assert.rejects(
  () => runProductionBillingEvidenceCollectorFromEnv(completeEnv(true), fakeFetch([], { summaryReady: false })),
  /did not verify every required event, settlement, replay, and summary check/,
  'collector should fail closed when project summary readback does not prove event persistence',
)

console.log(JSON.stringify({
  ok: true,
  dryRunMode: dryRun.mode,
  recordedMode: recorded.mode,
  checks: recorded.checks,
  calls: calls.map((call) => ({
    method: call.method,
    url: call.url,
    idempotencyKey: call.idempotencyKey,
  })),
  tokenInSummary: JSON.stringify(recorded).includes('production-billing-secret-token'),
}, null, 2))

function fakeFetch(
  calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }>,
  options: { summaryReady?: boolean } = {},
): ProductionBillingEvidenceCollectorFetch {
  const summaryReady = options.summaryReady !== false
  let eventPostCount = 0
  let settlementPostCount = 0
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({ url, method: init.method, idempotencyKey: init.headers['idempotency-key'], body })

    if (init.method === 'POST' && url.endsWith('/v1/tool-costs/events')) {
      eventPostCount += 1
      return jsonResponse(eventPostCount === 1 ? 201 : 200, {
        ok: true,
        data: {
          replayed: eventPostCount > 1,
          event: {
            id: 'tool-cost-production-billing-evidence-smoke',
            workspaceId: body?.workspaceId,
            projectId: body?.projectId,
            creditEstimateId: body?.creditEstimateId,
            creditReservationId: body?.creditReservationId,
            toolCostCredits: 2,
            billableToUser: true,
            metadata: {
              stripeCallAttempted: false,
              serviceFeeIncluded: false,
            },
          },
        },
        warnings: ['Tool cost event route smoke response.'],
      })
    }

    if (init.method === 'POST' && /\/v1\/tool-costs\/events\/[^/]+\/settle$/.test(url)) {
      settlementPostCount += 1
      return jsonResponse(settlementPostCount === 1 ? 201 : 200, {
        ok: true,
        data: {
          replayed: settlementPostCount > 1,
          settlement: {
            id: 'tool-cost-wallet-settlement-production-billing-smoke',
            walletMutationMode: 'supabase_credit_ledger',
            status: 'settled_persistent',
            creditsDelta: -2,
            creditReservationId: body?.creditReservationId,
            stripeCallAttempted: false,
            serviceFeeIncluded: false,
          },
        },
        warnings: ['Wallet settlement route smoke response.'],
      })
    }

    if (init.method === 'GET' && url.includes('/v1/projects/production-billing-project-smoke/tool-cost-summary')) {
      return jsonResponse(200, {
        ok: true,
        data: {
          summary: {
            billableEventCount: summaryReady ? 1 : 0,
            actualToolCostCredits: summaryReady ? 2 : 0,
            events: summaryReady ? [{ id: 'tool-cost-production-billing-evidence-smoke' }] : [],
          },
        },
        warnings: ['Tool cost summary route smoke response.'],
      })
    }

    throw new Error(`unexpected fetch ${init.method} ${url}`)
  }
}

function jsonResponse(status: number, payload: unknown): Promise<{ status: number; json(): Promise<unknown> }> {
  return Promise.resolve({
    status,
    async json() {
      return payload
    },
  })
}

function completeEnv(confirmed: boolean): ProductionBillingEvidenceCollectorEnv {
  return {
    REEDITPRO_PRODUCTION_BILLING_API_BASE_URL: 'https://api.production.reeditpro.example',
    REEDITPRO_PRODUCTION_BILLING_BEARER_TOKEN: 'production-billing-secret-token',
    REEDITPRO_PRODUCTION_BILLING_WORKSPACE_ID: 'production-billing-workspace-smoke',
    REEDITPRO_PRODUCTION_BILLING_PROJECT_ID: 'production-billing-project-smoke',
    REEDITPRO_PRODUCTION_BILLING_SOURCE_SHA: '3ffa5e6cd025cb2fb075ef69af1b4b70f8b3b77b',
    REEDITPRO_PRODUCTION_BILLING_EVENT_IDEMPOTENCY_KEY: 'production-billing-event-smoke',
    REEDITPRO_PRODUCTION_BILLING_SETTLEMENT_IDEMPOTENCY_KEY: 'production-billing-settlement-smoke',
    REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE: confirmed ? 'true' : 'false',
    REEDITPRO_PRODUCTION_BILLING_CREDIT_ESTIMATE_ID: 'production-billing-credit-estimate-smoke',
    REEDITPRO_PRODUCTION_BILLING_CREDIT_RESERVATION_ID: 'production-billing-credit-reservation-smoke',
    REEDITPRO_PRODUCTION_BILLING_APPROVED_RESERVATION_REMAINING_CREDITS: '25',
  }
}
