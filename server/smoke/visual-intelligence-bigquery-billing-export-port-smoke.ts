import assert from 'node:assert/strict'

import {
  createVisualIntelligenceBigQueryBillingExportPort,
} from '../visual-intelligence/visual-intelligence-bigquery-billing-export-port'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'

const terms = WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
const qualificationLabel = 'a'.repeat(32)
const requests: Array<{ url: string; init?: RequestInit }> = []
const responses = [
  jsonResponse({
    tables: [
      table('gcp_billing_export_resource_v1_000000_000000_000000'),
      table('cloud_pricing_export'),
    ],
  }),
  queryResponse([
    usageRow(terms[0], 'standard'),
    usageRow(terms[2], 'standard'),
    usageRow(terms[3], 'long'),
    usageRow(terms[5], 'long'),
  ]),
  queryResponse(terms.map((term) => ({
    exportTimeIso: '2026-08-12T13:00:00.000Z',
    pricingAsOfTimeIso: '2026-08-12T00:00:00.000Z',
    serviceId: 'services/C7E2-9256-1C43',
    skuId: term.skuId,
    skuDescription: term.expectedDisplayName,
    consumptionModel: 'consumptionModels/7754-699E-0EBF',
  }))),
]
const fetchImpl: typeof fetch = async (url, init) => {
  requests.push({ url: String(url), init })
  const response = responses.shift()
  if (!response) throw new Error('Unexpected fake BigQuery request.')
  return response
}
const port = createVisualIntelligenceBigQueryBillingExportPort({
  projectId: 'reeditpro',
  datasetId: 'weeditpro_billing_export',
  location: 'US',
  auth: {
    async getAccessToken() {
      return { token: `bounded-${'x'.repeat(32)}` }
    },
  },
  fetchImpl,
})
const observation = await port.readExact({
  qualificationId: 'weeditpro-bq-billing-port-smoke-v1',
  qualificationLabel,
  projectId: 'reeditpro',
  windowStartedAtIso: '2026-08-12T12:00:00.000Z',
  windowFinishedAtIso: '2026-08-12T12:10:00.000Z',
})

assert.equal(observation.detailedUsageRows.length, 4)
assert.equal(observation.skuMetadataRows.length, 6)
assert.equal(
  observation.detailedBillingTableId,
  'gcp_billing_export_resource_v1_000000_000000_000000',
)
assert.equal(observation.billingExportFreshThroughIso,
  '2026-08-12T13:00:00.000Z')
assert.equal(observation.queryCacheUsed, false)
assert.equal(observation.publicListPriceUsed, false)
assert.equal(observation.billingAccountIdentifierReturned, false)
assert.equal(requests.length, 3)
for (const request of requests) {
  assert.equal(request.init?.redirect, 'error')
  const headers = new Headers(request.init?.headers)
  assert.match(headers.get('authorization') ?? '', /^Bearer bounded-/u)
}
for (const request of requests.slice(1)) {
  const body = JSON.parse(String(request.init?.body)) as {
    query: string
    useQueryCache: boolean
    maximumBytesBilled: string
    location: string
  }
  assert.equal(body.useQueryCache, false)
  assert.equal(body.maximumBytesBilled, '100000000')
  assert.equal(body.location, 'US')
  assert.doesNotMatch(body.query, /billing_account_id/u)
  assert.doesNotMatch(body.query, /list_price/u)
}

await assert.rejects(
  createVisualIntelligenceBigQueryBillingExportPort({
    projectId: 'reeditpro',
    datasetId: 'weeditpro_billing_export',
    location: 'US',
    auth: {
      async getAccessToken() {
        return { token: `bounded-${'y'.repeat(32)}` }
      },
    },
    fetchImpl: async () => jsonResponse({
      tables: [table('unrelated_table')],
    }),
  }).readExact({
    qualificationId: 'weeditpro-bq-billing-port-not-ready-v1',
    qualificationLabel,
    projectId: 'reeditpro',
    windowStartedAtIso: '2026-08-12T12:00:00.000Z',
    windowFinishedAtIso: '2026-08-12T12:10:00.000Z',
  }),
  /billing export tables are not ready/u,
)

process.stdout.write(`${JSON.stringify({
  smoke: 'visual-intelligence-bigquery-billing-export-port',
  exactDetailedUsageTableRequired: true,
  exactPricingTableRequired: true,
  queryCacheDisabled: true,
  maximumBytesBilledBound: true,
  billingAccountIdentifierReturned: false,
  publicListPriceUsed: false,
  absentExportsFailClosed: true,
})}\n`)

function table(id: string) {
  return {
    tableReference: {
      projectId: 'reeditpro',
      datasetId: 'weeditpro_billing_export',
      tableId: id,
    },
    type: 'TABLE',
  }
}

function queryResponse(rows: unknown[]) {
  return jsonResponse({
    jobComplete: true,
    cacheHit: false,
    totalRows: String(rows.length),
    totalBytesProcessed: '4096',
    totalBytesBilled: '10000000',
    rows: rows.map((row) => ({ f: [{ v: JSON.stringify(row) }] })),
  })
}

function usageRow(
  term: typeof terms[number],
  context: 'standard' | 'long',
) {
  return {
    exportTimeIso: '2026-08-12T13:00:00.000Z',
    usageStartTimeIso: '2026-08-12T12:00:00.000Z',
    usageEndTimeIso: '2026-08-12T13:00:00.000Z',
    projectId: 'reeditpro',
    serviceId: 'services/C7E2-9256-1C43',
    skuId: term.skuId,
    skuDescription: term.expectedDisplayName,
    costType: 'regular',
    currency: 'USD',
    usageAmount: '1.000000000000',
    usageUnit: 'count',
    usageAmountInPricingUnits: '1.000000000000',
    pricingUnit: 'count',
    consumptionModel: 'consumptionModels/7754-699E-0EBF',
    capabilityLabel: 'visual-intelligence',
    operationLabel: 'billing-sku-qualification',
    contextLabel: context,
    qualificationLabel,
  }
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
