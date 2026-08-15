import assert from 'node:assert/strict'

import {
  assertCanonicalSam31VertexReplicaAllocationWindow,
  assertCanonicalSam31VertexReplicaTelemetry,
  compileCanonicalSam31VertexReplicaAllocationWindows,
  createCanonicalGoogleCloudMonitoringSam31VertexReplicaTelemetryReadPort,
} from '../services/canonical-sam3_1-vertex-replica-telemetry'

const queryStartedAt = '2026-08-13T12:00:00.000Z'
const queryEndedAt = '2026-08-13T12:08:00.000Z'
const observedAt = '2026-08-13T12:10:00.000Z'
const calls: string[] = []
const port = createCanonicalGoogleCloudMonitoringSam31VertexReplicaTelemetryReadPort({
  auth: {
    async request(input: { readonly url?: string }) {
      const url = String(input.url)
      calls.push(url)
      const second = new URL(url).searchParams.get('pageToken') === 'page-2'
      return {
        data: {
          timeSeries: [series(second
            ? [point('12:08', 0), point('12:07', 0), point('12:06', 2),
              point('12:05', 0)]
            : [point('12:04', 0), point('12:03', 1), point('12:02', 1),
              point('12:01', 0)])],
          ...(second ? {} : { nextPageToken: 'page-2' }),
        },
      }
    },
  } as never,
})
const telemetry = await port.reread({
  queryStartedAt,
  queryEndedAt,
  observedAt,
})
assert.deepEqual(assertCanonicalSam31VertexReplicaTelemetry(telemetry),
  telemetry)
assert.equal(calls.length, 2)
assert.match(calls[0]!, /deployed_model_id/u)
assert.match(calls[0]!, /3101000004/u)
assert.equal(new URL(calls[1]!).searchParams.get('pageToken'), 'page-2')
assert.deepEqual(telemetry.samples.map((sample) => sample.activeReplicaCount),
  [0, 1, 1, 0, 0, 2, 0, 0])
assert.equal(telemetry.monitoringGaugeIsBillingInvoiceEvidence, false)

const windows = compileCanonicalSam31VertexReplicaAllocationWindows({
  telemetry,
  compiledAt: observedAt,
})
assert.equal(windows.length, 2)
assert.equal(windows[0]?.allocationBuckets.length, 2)
assert.equal(windows[0]?.conservativeReplicaMilliseconds, 120_000)
assert.equal(windows[0]?.measuredPeakReplicaCount, 1)
assert.equal(windows[1]?.allocationBuckets.length, 1)
assert.equal(windows[1]?.conservativeReplicaMilliseconds, 120_000)
assert.equal(windows[1]?.measuredPeakReplicaCount, 2)
assert.equal(windows[1]?.zeroSamplesBeforeWindow, 2)
assert.equal(windows[1]?.zeroSamplesAfterWindow, 2)
assert.equal(windows[1]?.scaleToZeroObservedAfterWindow, true)
assert.equal(windows[1]?.exactSubMinuteAllocationOrBillingInvoiceClaimed,
  false)
assert.equal(windows[1]?.finalCustomerCreditSettlementAllowed, false)
assert.deepEqual(
  assertCanonicalSam31VertexReplicaAllocationWindow(windows[0]),
  windows[0],
)

const tampered = structuredClone(telemetry)
tampered.samples[1]!.activeReplicaCount = 16
assert.throws(() => assertCanonicalSam31VertexReplicaTelemetry(tampered))

await assert.rejects(() => port.reread({
  queryStartedAt,
  queryEndedAt,
  observedAt: '2026-08-13T12:09:59.999Z',
}), /open, stale, or unbounded/u)

await assert.rejects(() => createPortWithSeries(series(
  [point('12:01', 1), point('12:02', 0), point('12:03', 0)],
)).reread({ queryStartedAt, queryEndedAt, observedAt }),
/lacks scale-zero sentinels/u)

await assert.rejects(() => createPortWithSeries(series([
  point('12:01', 0),
  point('12:02', 1),
  point('12:02', 2),
  point('12:03', 0),
  point('12:04', 0),
])).reread({ queryStartedAt, queryEndedAt, observedAt }),
/samples conflict/u)

await assert.rejects(() => createPortWithSeries({
  ...series([point('12:01', 0)]),
  metric: {
    ...series([]).metric,
    labels: { deployed_model_id: '3101000003', spot: 'false' },
  },
}).reread({ queryStartedAt, queryEndedAt, observedAt }))

let getterInvoked = false
const hostile = Object.defineProperty({}, 'queryStartedAt', {
  enumerable: true,
  get() {
    getterInvoked = true
    return queryStartedAt
  },
})
await assert.rejects(() => port.reread(hostile as never))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-replica-telemetry',
  checks: 30,
  googleMonitoringV3PaginationComplete: true,
  exactEndpointAndDeployedModelLabelsMatched: true,
  replicaMinuteBucketsCompiled: 3,
  scaleToZeroSentinelsRequired: true,
  monitoringGaugeAcceptedAsBillingInvoice: false,
  finalCustomerCreditSettlementAllowed: false,
  cloudBillingDetailedExportReconciliationRequired: true,
  callerMetricPointsReplicaCountOrAllocationAccepted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function createPortWithSeries(value: ReturnType<typeof series>) {
  const readPort =
    createCanonicalGoogleCloudMonitoringSam31VertexReplicaTelemetryReadPort({
      auth: {
        async request() {
          return { data: { timeSeries: [value] } }
        },
      } as never,
    })
  return {
    async reread(input: Parameters<typeof readPort.reread>[0]) {
      const observation = await readPort.reread(input)
      compileCanonicalSam31VertexReplicaAllocationWindows({
        telemetry: observation,
        compiledAt: input.observedAt,
      })
      return observation
    },
  }
}

function series(points: ReturnType<typeof point>[]) {
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
    points,
  }
}

function point(minute: string, replicas: number) {
  return {
    interval: { endTime: `2026-08-13T${minute}:00.000Z` },
    value: { int64Value: String(replicas) },
  }
}
