import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_REPLICA_TELEMETRY_VERSION =
  'canonical-sam3_1-vertex-replica-telemetry-v1' as const
export const CANONICAL_SAM3_1_VERTEX_REPLICA_ALLOCATION_WINDOW_VERSION =
  'canonical-sam3_1-vertex-replica-allocation-window-v1' as const

const PROJECT_ID = 'reeditpro' as const
const LOCATION = 'us-central1' as const
const ENDPOINT_ID = 'weeditpro-sam31-a100-scale-zero-v1' as const
const METRIC_TYPE =
  'aiplatform.googleapis.com/prediction/online/replicas' as const
const SAMPLE_PERIOD_MILLISECONDS = 60_000
const METRIC_INGESTION_DELAY_MILLISECONDS = 120_000
const MAXIMUM_QUERY_MILLISECONDS = 36 * 60 * 60 * 1_000
const MAXIMUM_PAGES = 20
const MAXIMUM_SAMPLES = 4_096
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform'
const MONITORING_ORIGIN = 'https://monitoring.googleapis.com'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const sampleSchema = z.object({
  endTime: timestamp,
  activeReplicaCount: z.number().int().min(0).max(16),
}).strict()
const telemetryWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_VERTEX_REPLICA_TELEMETRY_VERSION),
  source: z.literal('canonical_google_cloud_monitoring_v3_reread'),
  evidenceClass: z.literal('server_owned_cloud_monitoring_metric_reread'),
  projectId: z.literal(PROJECT_ID),
  location: z.literal(LOCATION),
  endpointId: z.literal(ENDPOINT_ID),
  deployedModelId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  ),
  spot: z.literal(false),
  metricType: z.literal(METRIC_TYPE),
  monitoredResourceType: z.literal('aiplatform.googleapis.com/Endpoint'),
  metricKind: z.literal('GAUGE'),
  valueType: z.literal('INT64'),
  queryStartedAt: timestamp,
  queryEndedAt: timestamp,
  samplePeriodMilliseconds: z.literal(SAMPLE_PERIOD_MILLISECONDS),
  metricIngestionDelayMilliseconds: z.literal(
    METRIC_INGESTION_DELAY_MILLISECONDS,
  ),
  samples: z.array(sampleSchema).min(1).max(MAXIMUM_SAMPLES),
  paginationComplete: z.literal(true),
  googleCredentialedServerRead: z.literal(true),
  callerMetricPointsReplicaCountOrAllocationAccepted: z.literal(false),
  exactEndpointDeployedModelAndMetricLabelsMatched: z.literal(true),
  monitoringGaugeIsBillingInvoiceEvidence: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const ordered = [...value.samples].sort((left, right) =>
    compareUtf16(left.endTime, right.endTime))
  const exactOrder = stableAuthorityStringify(ordered) ===
    stableAuthorityStringify(value.samples)
  const unique = new Set(value.samples.map((sample) => sample.endTime)).size ===
    value.samples.length
  const withinQuery = value.samples.every((sample) =>
    Date.parse(sample.endTime) >= Date.parse(value.queryStartedAt)
      && Date.parse(sample.endTime) <= Date.parse(value.queryEndedAt))
  const closedAfterDelay = Date.parse(value.observedAt) >=
    Date.parse(value.queryEndedAt)
      + value.metricIngestionDelayMilliseconds
  if (!exactOrder || !unique || !withinQuery || !closedAfterDelay
    || Date.parse(value.queryEndedAt) <= Date.parse(value.queryStartedAt)
    || Date.parse(value.queryEndedAt) - Date.parse(value.queryStartedAt) >
      MAXIMUM_QUERY_MILLISECONDS) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 Vertex replica telemetry is incomplete or stale.',
  })
})
export const canonicalSam31VertexReplicaTelemetrySchema =
  telemetryWithoutHashSchema.extend({ telemetryHash: sha256 }).strict()
export type CanonicalSam31VertexReplicaTelemetry = z.infer<
  typeof canonicalSam31VertexReplicaTelemetrySchema
>

const bucketSchema = z.object({
  bucketOrdinal: positiveInteger,
  startedAt: timestamp,
  endedAt: timestamp,
  activeReplicaCount: z.number().int().min(1).max(16),
  conservativeReplicaMilliseconds: positiveInteger,
}).strict().superRefine((bucket, context) => {
  if (Date.parse(bucket.endedAt) - Date.parse(bucket.startedAt) !==
      SAMPLE_PERIOD_MILLISECONDS
    || bucket.conservativeReplicaMilliseconds !==
      SAMPLE_PERIOD_MILLISECONDS * bucket.activeReplicaCount) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 Vertex replica telemetry bucket changed.',
    })
  }
})
const allocationWindowWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_REPLICA_ALLOCATION_WINDOW_VERSION,
  ),
  source: z.literal('canonical_server_sam31_vertex_replica_window_compiler'),
  evidenceClass: z.literal('canonical_private_monitoring_projection'),
  allocationWindowId: safeId,
  telemetryRef: z.object({
    id: safeId,
    version: z.literal(1),
    contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  }).strict(),
  endpointId: z.literal(ENDPOINT_ID),
  deployedModelId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  ),
  samplePeriodMilliseconds: z.literal(SAMPLE_PERIOD_MILLISECONDS),
  zeroSamplesBeforeWindow: positiveInteger,
  zeroSamplesAfterWindow: z.number().int().min(2).max(MAXIMUM_SAMPLES),
  firstPositiveSampleAt: timestamp,
  lastPositiveSampleAt: timestamp,
  allocationBuckets: z.array(bucketSchema).min(1).max(MAXIMUM_SAMPLES),
  conservativeReplicaMilliseconds: positiveInteger,
  measuredPeakReplicaCount: positiveInteger.max(16),
  activeReplicasAfterWindow: z.literal(0),
  scaleToZeroObservedAfterWindow: z.literal(true),
  cloudMonitoringMinuteGaugeCeilingOnly: z.literal(true),
  exactSubMinuteAllocationOrBillingInvoiceClaimed: z.literal(false),
  finalCustomerCreditSettlementAllowed: z.literal(false),
  cloudBillingDetailedExportReconciliationRequired: z.literal(true),
  callerMetricPointsReplicaCountOrAllocationAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  compiledAt: timestamp,
}).strict().superRefine((window, context) => {
  const buckets = window.allocationBuckets
  const canonical = buckets.every((bucket, index) =>
    bucket.bucketOrdinal === index + 1
      && (index === 0 || buckets[index - 1]!.endedAt === bucket.startedAt))
  const total = buckets.reduce((sum, bucket) =>
    sum + bucket.conservativeReplicaMilliseconds, 0)
  const peak = Math.max(...buckets.map((bucket) => bucket.activeReplicaCount))
  if (!canonical
    || buckets[0]?.endedAt !== window.firstPositiveSampleAt
    || buckets.at(-1)?.endedAt !== window.lastPositiveSampleAt
    || total !== window.conservativeReplicaMilliseconds
    || peak !== window.measuredPeakReplicaCount) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 Vertex replica allocation window is inconsistent.',
  })
})
export const canonicalSam31VertexReplicaAllocationWindowSchema =
  allocationWindowWithoutHashSchema.extend({ windowHash: sha256 }).strict()
export type CanonicalSam31VertexReplicaAllocationWindow = z.infer<
  typeof canonicalSam31VertexReplicaAllocationWindowSchema
>

export interface CanonicalSam31VertexReplicaTelemetryReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_REPLICA_TELEMETRY_VERSION
  readonly serverOwnedGoogleMonitoringRead: true
  readonly monitoringGaugeAcceptedAsFinalBillingInvoice: false
  readonly customerCreditsMutated: false
  reread(input: {
    readonly queryStartedAt: string
    readonly queryEndedAt: string
    readonly observedAt: string
  }): Promise<CanonicalSam31VertexReplicaTelemetry>
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalGoogleCloudMonitoringSam31VertexReplicaTelemetryReadPort(
  input: { readonly auth?: GoogleAuthRequest } = {},
): CanonicalSam31VertexReplicaTelemetryReadPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_REPLICA_TELEMETRY_VERSION,
    serverOwnedGoogleMonitoringRead: true as const,
    monitoringGaugeAcceptedAsFinalBillingInvoice: false as const,
    customerCreditsMutated: false as const,
    async reread(untrusted: {
      readonly queryStartedAt: string
      readonly queryEndedAt: string
      readonly observedAt: string
    }) {
      assertPlainSerializedData(untrusted, 'sam31_vertex_replica_query')
      const request = z.object({
        queryStartedAt: timestamp,
        queryEndedAt: timestamp,
        observedAt: timestamp,
      }).strict().parse(untrusted)
      validateQueryWindow(request)
      const points: z.input<typeof sampleSchema>[] = []
      let pageToken: string | undefined
      let pageCount = 0
      do {
        pageCount += 1
        if (pageCount > MAXIMUM_PAGES) throw new Error(
          'SAM 3.1 Vertex replica telemetry pagination exceeded its bound.',
        )
        const parameters = new URLSearchParams({
          filter: monitoringFilter(),
          'interval.startTime': request.queryStartedAt,
          'interval.endTime': request.queryEndedAt,
          view: 'FULL',
          pageSize: '100000',
        })
        if (pageToken) parameters.set('pageToken', pageToken)
        const response = await auth.request({
          method: 'GET',
          url: `${MONITORING_ORIGIN}/v3/projects/${PROJECT_ID}/timeSeries?${parameters}`,
        })
        const page = parseMonitoringPage(response.data)
        for (const series of page.timeSeries) {
          assertExactSeries(series)
          for (const point of series.points) points.push({
            endTime: point.interval.endTime,
            activeReplicaCount: Number(point.value.int64Value),
          })
        }
        pageToken = page.nextPageToken
      } while (pageToken)
      const samples = canonicalizeSamples(points)
      const payload = telemetryWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_VERTEX_REPLICA_TELEMETRY_VERSION,
        source: 'canonical_google_cloud_monitoring_v3_reread',
        evidenceClass: 'server_owned_cloud_monitoring_metric_reread',
        projectId: PROJECT_ID,
        location: LOCATION,
        endpointId: ENDPOINT_ID,
        deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
        spot: false,
        metricType: METRIC_TYPE,
        monitoredResourceType: 'aiplatform.googleapis.com/Endpoint',
        metricKind: 'GAUGE',
        valueType: 'INT64',
        queryStartedAt: request.queryStartedAt,
        queryEndedAt: request.queryEndedAt,
        samplePeriodMilliseconds: SAMPLE_PERIOD_MILLISECONDS,
        metricIngestionDelayMilliseconds:
          METRIC_INGESTION_DELAY_MILLISECONDS,
        samples,
        paginationComplete: true,
        googleCredentialedServerRead: true,
        callerMetricPointsReplicaCountOrAllocationAccepted: false,
        exactEndpointDeployedModelAndMetricLabelsMatched: true,
        monitoringGaugeIsBillingInvoiceEvidence: false,
        customerCreditsMutated: false,
        productionAuthorityGranted: false,
        observedAt: request.observedAt,
      })
      return assertCanonicalSam31VertexReplicaTelemetry({
        ...payload,
        telemetryHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function compileCanonicalSam31VertexReplicaAllocationWindows(input: {
  readonly telemetry: unknown
  readonly compiledAt: string
}): readonly CanonicalSam31VertexReplicaAllocationWindow[] {
  assertPlainSerializedData(input, 'sam31_vertex_replica_window_compile')
  const telemetry = assertCanonicalSam31VertexReplicaTelemetry(input.telemetry)
  const compiledAt = timestamp.parse(input.compiledAt)
  if (Date.parse(compiledAt) < Date.parse(telemetry.observedAt)) throw new Error(
    'SAM 3.1 replica window compilation predates telemetry.',
  )
  const runs: Array<{ start: number; end: number }> = []
  for (let index = 0; index < telemetry.samples.length; index += 1) {
    if (telemetry.samples[index]!.activeReplicaCount === 0) continue
    const start = index
    while (index + 1 < telemetry.samples.length
      && telemetry.samples[index + 1]!.activeReplicaCount > 0
      && Date.parse(telemetry.samples[index + 1]!.endTime)
        - Date.parse(telemetry.samples[index]!.endTime) ===
          SAMPLE_PERIOD_MILLISECONDS) index += 1
    runs.push({ start, end: index })
  }
  return Object.freeze(runs.map((run) => compileWindow({
    telemetry,
    run,
    compiledAt,
  })))
}

export function assertCanonicalSam31VertexReplicaTelemetry(
  value: unknown,
): CanonicalSam31VertexReplicaTelemetry {
  assertPlainSerializedData(value, 'sam31_vertex_replica_telemetry')
  const parsed = canonicalSam31VertexReplicaTelemetrySchema.parse(value)
  const { telemetryHash, ...payload } = parsed
  if (telemetryHash !== sha256AuthorityValue(payload)) throw new Error(
    'SAM 3.1 Vertex replica telemetry digest changed.',
  )
  return structuredClone(parsed)
}

export function assertCanonicalSam31VertexReplicaAllocationWindow(
  value: unknown,
): CanonicalSam31VertexReplicaAllocationWindow {
  assertPlainSerializedData(value, 'sam31_vertex_replica_allocation_window')
  const parsed = canonicalSam31VertexReplicaAllocationWindowSchema.parse(value)
  const { windowHash, ...payload } = parsed
  if (windowHash !== sha256AuthorityValue(payload)) throw new Error(
    'SAM 3.1 Vertex replica allocation window digest changed.',
  )
  return structuredClone(parsed)
}

function compileWindow(input: {
  telemetry: CanonicalSam31VertexReplicaTelemetry
  run: { start: number; end: number }
  compiledAt: string
}): CanonicalSam31VertexReplicaAllocationWindow {
  const before = input.telemetry.samples.slice(0, input.run.start)
  const after = input.telemetry.samples.slice(input.run.end + 1)
  const zeroBefore = trailingZeroCount(before)
  const zeroAfter = leadingZeroCount(after)
  if (zeroBefore < 1 || zeroAfter < 2) throw new Error(
    'SAM 3.1 replica allocation window lacks scale-zero sentinels.',
  )
  const samples = input.telemetry.samples.slice(
    input.run.start,
    input.run.end + 1,
  )
  const buckets = samples.map((sample, index) => bucketSchema.parse({
    bucketOrdinal: index + 1,
    startedAt: new Date(
      Date.parse(sample.endTime) - SAMPLE_PERIOD_MILLISECONDS,
    ).toISOString(),
    endedAt: sample.endTime,
    activeReplicaCount: sample.activeReplicaCount,
    conservativeReplicaMilliseconds:
      SAMPLE_PERIOD_MILLISECONDS * sample.activeReplicaCount,
  }))
  const payload = allocationWindowWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_REPLICA_ALLOCATION_WINDOW_VERSION,
    source: 'canonical_server_sam31_vertex_replica_window_compiler',
    evidenceClass: 'canonical_private_monitoring_projection',
    allocationWindowId: `sam31-replica-window-${sha256AuthorityValue({
      telemetryHash: input.telemetry.telemetryHash,
      first: samples[0]!.endTime,
      last: samples.at(-1)!.endTime,
    })}`,
    telemetryRef: {
      id: `sam31-replica-telemetry-${input.telemetry.telemetryHash}`,
      version: 1,
      contentHash: `sha256:${input.telemetry.telemetryHash}`,
    },
    endpointId: ENDPOINT_ID,
    deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
    samplePeriodMilliseconds: SAMPLE_PERIOD_MILLISECONDS,
    zeroSamplesBeforeWindow: zeroBefore,
    zeroSamplesAfterWindow: zeroAfter,
    firstPositiveSampleAt: samples[0]!.endTime,
    lastPositiveSampleAt: samples.at(-1)!.endTime,
    allocationBuckets: buckets,
    conservativeReplicaMilliseconds: buckets.reduce((sum, bucket) =>
      sum + bucket.conservativeReplicaMilliseconds, 0),
    measuredPeakReplicaCount: Math.max(...samples.map((sample) =>
      sample.activeReplicaCount)),
    activeReplicasAfterWindow: 0,
    scaleToZeroObservedAfterWindow: true,
    cloudMonitoringMinuteGaugeCeilingOnly: true,
    exactSubMinuteAllocationOrBillingInvoiceClaimed: false,
    finalCustomerCreditSettlementAllowed: false,
    cloudBillingDetailedExportReconciliationRequired: true,
    callerMetricPointsReplicaCountOrAllocationAccepted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
    compiledAt: input.compiledAt,
  })
  return assertCanonicalSam31VertexReplicaAllocationWindow({
    ...payload,
    windowHash: sha256AuthorityValue(payload),
  })
}

function parseMonitoringPage(value: unknown) {
  assertPlainSerializedData(value, 'google_monitoring_time_series_page')
  return z.object({
    timeSeries: z.array(z.object({
      metric: z.object({
        type: z.literal(METRIC_TYPE),
        labels: z.object({
          deployed_model_id: z.literal(
            CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
          ),
          spot: z.literal('false'),
        }).passthrough(),
      }).passthrough(),
      resource: z.object({
        type: z.literal('aiplatform.googleapis.com/Endpoint'),
        labels: z.object({
          project_id: z.literal(PROJECT_ID),
          location: z.literal(LOCATION),
          endpoint_id: z.literal(ENDPOINT_ID),
        }).passthrough(),
      }).passthrough(),
      metricKind: z.literal('GAUGE'),
      valueType: z.literal('INT64'),
      points: z.array(z.object({
        interval: z.object({ endTime: timestamp }).passthrough(),
        value: z.object({
          int64Value: z.string().regex(/^(?:0|[1-9]\d*)$/u),
        }).passthrough(),
      }).passthrough()).max(MAXIMUM_SAMPLES),
    }).passthrough()).max(MAXIMUM_PAGES),
    nextPageToken: z.string().min(1).max(2_048).optional(),
  }).passthrough().parse({
    ...(value as Record<string, unknown>),
    timeSeries: (value as { timeSeries?: unknown }).timeSeries ?? [],
  })
}

function assertExactSeries(series: ReturnType<
  typeof parseMonitoringPage
>['timeSeries'][number]): void {
  if (series.metric.type !== METRIC_TYPE
    || series.metric.labels.deployed_model_id !==
      CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID
    || series.metric.labels.spot !== 'false'
    || series.resource.type !== 'aiplatform.googleapis.com/Endpoint'
    || series.resource.labels.project_id !== PROJECT_ID
    || series.resource.labels.location !== LOCATION
    || series.resource.labels.endpoint_id !== ENDPOINT_ID
    || series.metricKind !== 'GAUGE'
    || series.valueType !== 'INT64') throw new Error(
    'SAM 3.1 Vertex replica metric labels changed.',
  )
}

function canonicalizeSamples(
  points: readonly z.input<typeof sampleSchema>[],
) {
  if (points.length < 1 || points.length > MAXIMUM_SAMPLES) throw new Error(
    'SAM 3.1 Vertex replica metric returned no bounded samples.',
  )
  const parsed = points.map((point) => sampleSchema.parse(point))
    .sort((left, right) => compareUtf16(left.endTime, right.endTime))
  const byTime = new Map<string, number>()
  for (const point of parsed) {
    const previous = byTime.get(point.endTime)
    if (previous !== undefined && previous !== point.activeReplicaCount) {
      throw new Error('SAM 3.1 Vertex replica samples conflict.')
    }
    byTime.set(point.endTime, point.activeReplicaCount)
  }
  return [...byTime.entries()].map(([endTime, activeReplicaCount]) =>
    sampleSchema.parse({ endTime, activeReplicaCount }))
}

function validateQueryWindow(input: {
  queryStartedAt: string
  queryEndedAt: string
  observedAt: string
}): void {
  if (Date.parse(input.queryEndedAt) <= Date.parse(input.queryStartedAt)
    || Date.parse(input.queryEndedAt) - Date.parse(input.queryStartedAt) >
      MAXIMUM_QUERY_MILLISECONDS
    || Date.parse(input.observedAt) < Date.parse(input.queryEndedAt)
      + METRIC_INGESTION_DELAY_MILLISECONDS) throw new Error(
    'SAM 3.1 Vertex replica query is open, stale, or unbounded.',
  )
}

function monitoringFilter(): string {
  return [
    `metric.type="${METRIC_TYPE}"`,
    'resource.type="aiplatform.googleapis.com/Endpoint"',
    `resource.labels.project_id="${PROJECT_ID}"`,
    `resource.labels.location="${LOCATION}"`,
    `resource.labels.endpoint_id="${ENDPOINT_ID}"`,
    `metric.labels.deployed_model_id="${CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID}"`,
    'metric.labels.spot="false"',
  ].join(' AND ')
}

function trailingZeroCount(samples: readonly { activeReplicaCount: number }[]) {
  let count = 0
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (samples[index]!.activeReplicaCount !== 0) break
    count += 1
  }
  return count
}

function leadingZeroCount(samples: readonly { activeReplicaCount: number }[]) {
  let count = 0
  for (const sample of samples) {
    if (sample.activeReplicaCount !== 0) break
    count += 1
  }
  return count
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
