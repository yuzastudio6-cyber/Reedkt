import assert from 'node:assert/strict'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceDetailedBillingExportReadPort,
  createVisualIntelligenceDetailedBillingExportReaderConfiguration,
  parseVisualIntelligenceDetailedBillingExportObservation,
  visualIntelligenceDetailedBillingExportObservationRef,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-read-port'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'

const startedAtIso = '2026-08-08T10:00:00.000Z'
const finishedAtIso = '2026-08-08T10:10:00.000Z'
const freshAtIso = '2026-08-08T11:00:00.000Z'
const fields = [
  'sku_id',
  'sku_description',
  'usage_amount',
  'usage_unit',
  'cost',
  'currency',
  'row_count',
  'max_export_time',
]
const configuration =
  createVisualIntelligenceDetailedBillingExportReaderConfiguration({
    schemaVersion:
      'visual-intelligence-detailed-billing-export-reader-configuration-v1',
    queryProjectId: 'reeditpro-billing-query',
    billingExportDatasetId: 'billing_export_private',
    billingExportTableId:
      'gcp_billing_export_resource_v1_012345_ABCDEF_987654',
    billedProjectId: 'reeditpro',
    providerServiceId: 'services/C7E2-9256-1C43',
    maximumBytesBilled: '10000000',
    timeoutMs: 15_000,
  })

const calls: Array<Record<string, unknown>> = []
const auth = fixtureAuth(() => exactResponse(), calls)
const port = createVisualIntelligenceDetailedBillingExportReadPort({
  configuration,
  auth,
  now: () => new Date('2026-08-08T12:00:00.000Z'),
})
const observation = await port.readExact({
  observationId: 'vi-billing-observation-20260808',
  observationVersion: 1,
  qualificationWindowStartedAtIso: startedAtIso,
  qualificationWindowFinishedAtIso: finishedAtIso,
})

assert.deepEqual(
  parseVisualIntelligenceDetailedBillingExportObservation(observation),
  observation,
)
assert.equal(observation.exactModelId, 'gemini-3.1-pro-preview')
assert.deepEqual(
  observation.exactSkuIds,
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map((term) =>
    term.skuId),
)
assert.equal(observation.skuLines.length, 6)
assert.equal(observation.billingExportFreshThroughIso, freshAtIso)
assert.equal(observation.noUnexpectedProviderServiceSkuObserved, true)
assert.equal(
  observation.noOtherModelOrSkuTrafficInObservationWindowProvenByBillingRows,
  false,
)
assert.equal(observation.providerCallMade, false)
assert.equal(observation.providerDispatchAuthorityGranted, false)
assert.equal(observation.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(observation.walletOrCreditMutationAuthorityGranted, false)
assert.equal(observation.productionReleaseAuthorityGranted, false)
assert.deepEqual(
  visualIntelligenceDetailedBillingExportObservationRef(observation),
  {
    id: observation.observationId,
    version: observation.observationVersion,
    contentHash: observation.observationDigestSha256,
  },
)
assert.equal(calls.length, 1)
const call = calls[0]!
assert.equal(call.method, 'POST')
assert.equal(call.retry, false)
assert.equal(call.maxRedirects, 0)
assert.equal(call.timeout, 15_000)
assert.equal(call.responseType, 'json')
assert.equal(
  call.url,
  'https://bigquery.googleapis.com/bigquery/v2/projects/'
    + 'reeditpro-billing-query/queries',
)
const requestData = call.data as Record<string, unknown>
assert.equal(requestData.useLegacySql, false)
assert.equal(requestData.maximumBytesBilled, '10000000')
assert.equal(requestData.parameterMode, 'NAMED')
assert.equal(String(requestData.query).includes('@billed_project_id'), true)
assert.equal(String(requestData.query).includes('@provider_service_id'), true)
assert.equal(String(requestData.query).includes('@window_started'), true)
assert.equal(String(requestData.query).includes('@window_finished'), true)
assert.equal(String(requestData.query).includes(startedAtIso), false)
assert.equal(String(requestData.query).includes(finishedAtIso), false)
assert.equal(String(requestData.query).includes('billingAccounts/'), false)
assert.equal(
  JSON.stringify(requestData.queryParameters).includes(startedAtIso),
  true,
)
const serialized = JSON.stringify(observation)
assert.equal(serialized.includes('billing_export_private'), false)
assert.equal(serialized.includes('gcp_billing_export_resource_v1_'), false)
assert.equal(serialized.includes('billingAccounts/'), false)

const tamperedObservation = structuredClone(observation)
tamperedObservation.skuLines[0].usageAmount = '999'
assert.throws(() =>
  parseVisualIntelligenceDetailedBillingExportObservation(
    tamperedObservation,
  ), /digest/u)

const unknownKeyObservation = {
  ...observation,
  browserLocalCompletion: true,
}
assert.throws(() =>
  parseVisualIntelligenceDetailedBillingExportObservation(
    unknownKeyObservation,
  ))

const tamperedConfiguration = structuredClone(configuration)
tamperedConfiguration.maximumBytesBilled = '20000000'
assert.throws(() =>
  createVisualIntelligenceDetailedBillingExportReadPort({
    configuration: tamperedConfiguration,
    auth,
  }), /configuration changed/u)

await rejectsResponse((response) => {
  response.rows.pop()
  response.totalRows = String(response.rows.length)
}, /SKU isolation/u)

await rejectsResponse((response) => {
  response.rows.push(row([
    'AAAA-BBBB-CCCC',
    'Unexpected provider SKU',
    '1',
    'count',
    '0.01',
    'USD',
    '1',
    freshAtIso,
  ]))
  response.totalRows = String(response.rows.length)
}, /SKU isolation/u)

await rejectsResponse((response) => {
  response.rows[0]!.f[1]!.v = 'Changed SKU display name'
}, /SKU metadata changed/u)

await rejectsResponse((response) => {
  response.rows[0]!.f[7]!.v = '2026-08-08T10:09:59.999Z'
}, /not fresh enough/u)

await rejectsResponse((response) => {
  response.rows[0]!.f[2]!.v = '0'
})

await rejectsResponse((response) => {
  response.schema.fields.reverse()
}, /response schema changed/u)

await rejectsResponse((response) => {
  response.jobComplete = false as unknown as true
})

await rejectsResponse((response) => {
  response.errors = [{ reason: 'fixture-error' }]
})

await assert.rejects(() => createPort(auth).readExact({
  observationId: 'too-wide-window',
  observationVersion: 1,
  qualificationWindowStartedAtIso: '2026-08-08T09:00:00.000Z',
  qualificationWindowFinishedAtIso: '2026-08-08T10:00:00.001Z',
}), /window is invalid/u)

await assert.rejects(() => createPort(auth).readExact({
  observationId: 'future-window',
  observationVersion: 1,
  qualificationWindowStartedAtIso: '2026-08-08T12:00:00.000Z',
  qualificationWindowFinishedAtIso: '2026-08-08T12:00:01.000Z',
}), /window is invalid/u)

await assert.rejects(() => createPort(auth).readExact({
  observationId: 'stale-window',
  observationVersion: 1,
  qualificationWindowStartedAtIso: '2026-07-31T10:00:00.000Z',
  qualificationWindowFinishedAtIso: '2026-07-31T10:10:00.000Z',
}), /window is invalid/u)

const failedAuth = fixtureAuth(() => {
  throw new Error('network details must not escape')
})
await assert.rejects(() => createPort(failedAuth).readExact({
  observationId: 'failed-query',
  observationVersion: 1,
  qualificationWindowStartedAtIso: startedAtIso,
  qualificationWindowFinishedAtIso: finishedAtIso,
}), /query failed/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-detailed-billing-export-read-port',
  checks: 22,
  status: 'passed',
}))

function createPort(authOverride: Pick<GoogleAuth, 'request'>) {
  return createVisualIntelligenceDetailedBillingExportReadPort({
    configuration,
    auth: authOverride,
    now: () => new Date('2026-08-08T12:00:00.000Z'),
  })
}

async function rejectsResponse(
  mutate: (response: ReturnType<typeof exactResponse>) => void,
  error?: RegExp,
) {
  const authOverride = fixtureAuth(() => {
    const response = exactResponse()
    mutate(response)
    return response
  })
  const run = () => createPort(authOverride).readExact({
    observationId: 'rejected-response',
    observationVersion: 1,
    qualificationWindowStartedAtIso: startedAtIso,
    qualificationWindowFinishedAtIso: finishedAtIso,
  })
  if (error) await assert.rejects(run, error)
  else await assert.rejects(run)
}

function fixtureAuth(
  response: () => ReturnType<typeof exactResponse>,
  callLog: Array<Record<string, unknown>> = [],
): Pick<GoogleAuth, 'request'> {
  return {
    async request(options: Record<string, unknown>) {
      callLog.push(options)
      return { data: response() }
    },
  } as unknown as Pick<GoogleAuth, 'request'>
}

function exactResponse() {
  return {
    jobComplete: true as const,
    totalRows: '6',
    schema: {
      fields: fields.map((name) => ({ name, type: 'STRING' })),
    },
    rows: WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map(
      (term, index) => row([
        term.skuId,
        term.expectedDisplayName,
        String((index + 1) * 1_000),
        'count',
        `${index + 1}.25`,
        'USD',
        '1',
        freshAtIso,
      ]),
    ),
    errors: [] as Array<unknown>,
  }
}

function row(values: string[]) {
  return { f: values.map((v) => ({ v })) }
}
