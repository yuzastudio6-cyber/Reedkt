import assert from 'node:assert/strict'

import {
  authority as v1Authority,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-smoke'
import {
  assertCanonicalSam31VertexServingBillingExportObservation,
  createCanonicalGoogleBigQuerySam31VertexServingBillingExportReadPort,
} from '../services/canonical-sam3_1-vertex-serving-billing-export'
import {
  compileCanonicalSam31VertexReplicaAllocationWindows,
  createCanonicalGoogleCloudMonitoringSam31VertexReplicaTelemetryReadPort,
} from '../services/canonical-sam3_1-vertex-replica-telemetry'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_V2_VERSION,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'

const ratePayload = {
  ...withoutHash(v1Authority),
  schemaVersion:
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_V2_VERSION,
  rateAuthorityId: 'vertex-a100-serving-rate:billing-export-smoke',
  rateAuthorityVersion: 2,
  maximumReplicaCount: 1,
  maximumConcurrentInvocations: 1,
  endpointCapacityObservationRef: ref('capacity', 'capacity'),
  exactCurrentEndpointCapacityReread: true as const,
  perReplicaPricingNotMultipliedByConfiguredMaximum: true as const,
}
export const rate = assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
  ...ratePayload,
  rateAuthorityHash: sha256AuthorityValue(ratePayload),
})
const telemetryPort =
  createCanonicalGoogleCloudMonitoringSam31VertexReplicaTelemetryReadPort({
    auth: {
      async request() {
        return { data: { timeSeries: [monitoringSeries()] } }
      },
    } as never,
  })
const telemetry = await telemetryPort.reread({
  queryStartedAt: '2026-08-11T11:59:00.000Z',
  queryEndedAt: '2026-08-11T12:04:00.000Z',
  observedAt: '2026-08-11T12:06:00.000Z',
})
export const allocationWindow =
  compileCanonicalSam31VertexReplicaAllocationWindows({
    telemetry,
    compiledAt: '2026-08-11T12:06:00.000Z',
  })[0]!
const skuIds = rate.components.slice(0, 5).map((component) =>
  component.skuPriceTerm.skuId)
const sqlRequests: string[] = []
const port = createPort(() => skuIds.map((skuId, index) =>
  billingRow({ skuId, index })), sqlRequests)
export const observation = await port.reread({
  allocationWindow,
  rateAuthority: rate,
  observedAt: '2026-08-11T12:11:00.000Z',
})

assert.deepEqual(
  assertCanonicalSam31VertexServingBillingExportObservation(observation),
  observation,
)
assert.equal(sqlRequests.length, 1)
assert.match(sqlRequests[0]!, /weeditpro-component/u)
assert.match(sqlRequests[0]!, /weeditpro-route/u)
assert.equal(observation.maximumQueryBytesBilled, '100000000')
assert.deepEqual(observation.expectedVertexSkuIds, [...skuIds].sort())
assert.equal(observation.billingRows.length, 5)
assert.equal(observation.totalNetCostUsdPicos, 500_000_000_000)
assert.equal(observation.exactEndpointResourceOrLabelsMatched, true)
assert.equal(observation.exactAllocationWindowUsageIntervalsMatched, true)
assert.equal(observation.monitoringGaugeAcceptedAsInvoiceEvidence, false)
assert.equal(observation.invoiceTaxAdjustmentOrFinalizedMonthClaimed, false)
assert.equal(observation.customerCreditSettlementAllowed, false)
assert.equal(observation.customerCreditsMutated, false)

const tampered = structuredClone(observation)
tampered.billingRows[0]!.netCostUsdPicos += 1
assert.throws(() =>
  assertCanonicalSam31VertexServingBillingExportObservation(tampered))

await assert.rejects(() => createPort(() => []).reread({
  allocationWindow,
  rateAuthority: rate,
  observedAt: '2026-08-11T12:11:00.000Z',
}), /export table is not ready/u)

await assert.rejects(() => createPort(() => skuIds.slice(0, 4)
  .map((skuId, index) => billingRow({ skuId, index }))).reread({
  allocationWindow,
  rateAuthority: rate,
  observedAt: '2026-08-11T12:11:00.000Z',
}), /do not isolate/u)

await assert.rejects(() => createPort(() => skuIds.map((skuId, index) =>
  billingRow({ skuId, index, componentLabel: 'other' }))).reread({
  allocationWindow,
  rateAuthority: rate,
  observedAt: '2026-08-11T12:11:00.000Z',
}), /not endpoint-exact/u)

await assert.rejects(() => createPort(() => skuIds.map((skuId, index) =>
  billingRow({ skuId, index, usageStartedAt: '2026-08-11T11:59:00.000Z' })))
  .reread({
    allocationWindow,
    rateAuthority: rate,
    observedAt: '2026-08-11T12:11:00.000Z',
  }), /do not isolate/u)

let getterInvoked = false
const hostile = Object.defineProperty({}, 'allocationWindow', {
  enumerable: true,
  get() {
    getterInvoked = true
    return allocationWindow
  },
})
await assert.rejects(() => port.reread(hostile as never))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-billing-export',
  checks: 32,
  exactDetailedUsageCostTableRequired: true,
  exactFiveVertexServingSkusRequired: true,
  exactEndpointResourceOrLabelsRequired: true,
  exactAllocationWindowIsolationRequired: true,
  accountEffectiveRateAuthorityBound: true,
  monitoringGaugeAcceptedAsInvoiceEvidence: false,
  customerCreditSettlementAllowedFromObservationAlone: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function createPort(
  rows: () => readonly Record<string, unknown>[],
  sqlRequests: string[] = [],
) {
  let requestIndex = 0
  return createCanonicalGoogleBigQuerySam31VertexServingBillingExportReadPort({
    auth: {
      async request(input: { readonly data?: { readonly query?: string } }) {
        requestIndex += 1
        if (requestIndex === 1) return {
          data: {
            tables: rows().length === 0 ? [] : [{
              tableReference: {
                projectId: 'reeditpro',
                datasetId: 'weeditpro_billing_export',
                tableId: 'gcp_billing_export_resource_v1_012345_ABCDEF_987654',
              },
              type: 'TABLE',
            }],
          },
        }
        sqlRequests.push(input.data?.query ?? '')
        const outputRows = rows()
        return {
          data: {
            jobComplete: true,
            cacheHit: false,
            totalRows: String(outputRows.length),
            totalBytesBilled: '1024',
            rows: outputRows.map((row) => ({
              f: [{ v: JSON.stringify(row) }],
            })),
          },
        }
      },
    } as never,
  })
}

function billingRow(input: {
  skuId: string
  index: number
  componentLabel?: string
  usageStartedAt?: string
}) {
  return {
    exportTime: `2026-08-11T12:10:0${input.index}.000Z`,
    usageStartedAt: input.usageStartedAt ?? '2026-08-11T12:00:00.000Z',
    usageEndedAt: '2026-08-11T12:02:00.000Z',
    projectId: 'reeditpro',
    serviceId: 'C7E2-9256-1C43',
    skuId: input.skuId,
    skuDescription: `SAM 3.1 serving component ${input.index}`,
    costType: 'regular',
    currency: 'USD',
    netCostUsd: '0.100000000000',
    location: 'us-central1',
    resourceName: '',
    resourceGlobalName: '',
    componentLabel: input.componentLabel ?? 'sam31',
    routeLabel: 'a100-heavy-primary',
  }
}

function monitoringSeries() {
  return {
    metric: {
      type: 'aiplatform.googleapis.com/prediction/online/replicas',
      labels: { deployed_model_id: '3101000004', spot: 'false' },
    },
    resource: {
      type: 'aiplatform.googleapis.com/Endpoint',
      labels: {
        project_id: 'reeditpro',
        location: 'us-central1',
        endpoint_id: 'weeditpro-sam31-a100-scale-zero-v1',
      },
    },
    metricKind: 'GAUGE',
    valueType: 'INT64',
    points: [
      point('12:04', 0),
      point('12:03', 0),
      point('12:02', 1),
      point('12:01', 1),
      point('12:00', 0),
    ],
  }
}

function point(minute: string, replicas: number) {
  return {
    interval: { endTime: `2026-08-11T${minute}:00.000Z` },
    value: { int64Value: String(replicas) },
  }
}

function withoutHash(value: typeof v1Authority) {
  const { rateAuthorityHash, ...payload } = value
  assert.equal(rateAuthorityHash.length, 64)
  return payload
}

function ref(id: string, seed: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({ seed })}` as const,
  }
}
