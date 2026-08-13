import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31VertexReplicaAllocationWindow,
  type CanonicalSam31VertexReplicaAllocationWindow,
} from './canonical-sam3_1-vertex-replica-telemetry'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SERVING_BILLING_EXPORT_OBSERVATION_VERSION =
  'canonical-sam3_1-vertex-serving-billing-export-observation-v1' as const

const PROJECT_ID = 'reeditpro' as const
const DATASET_ID = 'weeditpro_billing_export' as const
const LOCATION = 'US' as const
const VERTEX_SERVICE_ID = 'C7E2-9256-1C43' as const
const ENDPOINT_ID = 'weeditpro-sam31-a100-scale-zero-v1' as const
const COMPONENT_LABEL = 'sam31' as const
const ROUTE_LABEL = 'a100-heavy-primary' as const
const BIGQUERY_ORIGIN = 'https://bigquery.googleapis.com'
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform'
const MAXIMUM_QUERY_BYTES_BILLED = '100000000'
const MAXIMUM_ROWS = 128
const REQUEST_TIMEOUT_MILLISECONDS = 120_000
const VERTEX_COMPONENT_CLASSES = [
  'vertex_prediction_a100_80gb_hour',
  'vertex_prediction_a2_core_hour',
  'vertex_prediction_a2_ram_gib_hour',
  'vertex_prediction_management_a2_core_hour',
  'vertex_prediction_management_a2_ram_gib_hour',
] as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const tableId = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/u)
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const decimal = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,12})?$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const rowSchema = z.object({
  exportTime: timestamp,
  usageStartedAt: timestamp,
  usageEndedAt: timestamp,
  projectId: z.literal(PROJECT_ID),
  serviceId: z.literal(VERTEX_SERVICE_ID),
  skuId: z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  skuDescription: z.string().trim().min(1).max(240),
  costType: z.literal('regular'),
  currency: z.literal('USD'),
  netCostUsd: decimal,
  netCostUsdPicos: z.number().int().nonnegative().safe(),
  location: z.literal('us-central1'),
  resourceName: z.string().max(1_024),
  resourceGlobalName: z.string().max(2_048),
  componentLabel: z.string().max(63),
  routeLabel: z.string().max(63),
  exactEndpointIdentityMatched: z.literal(true),
}).strict().superRefine((row, context) => {
  const endpointInResource = row.resourceName.includes(ENDPOINT_ID)
    || row.resourceGlobalName.includes(ENDPOINT_ID)
  const endpointLabelsMatch = row.componentLabel === COMPONENT_LABEL
    && row.routeLabel === ROUTE_LABEL
  if (row.netCostUsdPicos !== decimalUsdToPicos(row.netCostUsd)
    || Date.parse(row.usageEndedAt) <= Date.parse(row.usageStartedAt)
    || (!endpointInResource && !endpointLabelsMatch)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 detailed billing row is not endpoint-exact.',
  })
})

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_BILLING_EXPORT_OBSERVATION_VERSION,
  ),
  source: z.literal('canonical_server_bigquery_detailed_usage_cost_reread'),
  evidenceClass: z.literal('server_owned_cloud_billing_export_reread'),
  projectId: z.literal(PROJECT_ID),
  datasetId: z.literal(DATASET_ID),
  datasetLocation: z.literal(LOCATION),
  detailedBillingTableId: z.string().regex(
    /^gcp_billing_export_resource_v1_[A-Za-z0-9_]+$/u,
  ),
  allocationWindowRef: refSchema,
  rateAuthorityRef: refSchema,
  expectedVertexSkuIds: z.array(z.string().regex(
    /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u,
  )).length(5),
  billingRows: z.array(rowSchema).min(5).max(MAXIMUM_ROWS),
  totalNetCostUsdPicos: z.number().int().nonnegative().safe(),
  billingExportFreshThrough: timestamp,
  exactEndpointResourceOrLabelsMatched: z.literal(true),
  exactAllocationWindowUsageIntervalsMatched: z.literal(true),
  expectedVertexSkuSetMatchedExactly: z.literal(true),
  queryCacheUsed: z.literal(false),
  maximumQueryBytesBilled: z.literal(MAXIMUM_QUERY_BYTES_BILLED),
  publicListPriceUsed: z.literal(false),
  billingAccountIdentifierReturned: z.literal(false),
  monitoringGaugeAcceptedAsInvoiceEvidence: z.literal(false),
  invoiceTaxAdjustmentOrFinalizedMonthClaimed: z.literal(false),
  customerCreditSettlementAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((observation, context) => {
  const ordered = [...observation.billingRows].sort(compareRows)
  const skuIds = [...new Set(observation.billingRows.map((row) => row.skuId))]
    .sort(compareUtf16)
  const total = observation.billingRows.reduce((sum, row) =>
    sum + row.netCostUsdPicos, 0)
  if (stableAuthorityStringify(ordered) !==
      stableAuthorityStringify(observation.billingRows)
    || stableAuthorityStringify(skuIds) !== stableAuthorityStringify(
      observation.expectedVertexSkuIds,
    )
    || total !== observation.totalNetCostUsdPicos
    || Date.parse(observation.observedAt) <
      Date.parse(observation.billingExportFreshThrough)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 detailed billing observation is not closed.',
  })
})

export const canonicalSam31VertexServingBillingExportObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31VertexServingBillingExportObservation = z.infer<
  typeof canonicalSam31VertexServingBillingExportObservationSchema
>

export interface CanonicalSam31VertexServingBillingExportReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_SERVING_BILLING_EXPORT_OBSERVATION_VERSION
  readonly serverOwnedDetailedBillingExportRead: true
  readonly monitoringGaugeAcceptedAsInvoiceEvidence: false
  readonly customerCreditsMutated: false
  reread(input: {
    readonly allocationWindow: unknown
    readonly rateAuthority: unknown
    readonly observedAt: string
  }): Promise<CanonicalSam31VertexServingBillingExportObservation>
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalGoogleBigQuerySam31VertexServingBillingExportReadPort(
  input: { readonly auth?: GoogleAuthRequest } = {},
): CanonicalSam31VertexServingBillingExportReadPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_BILLING_EXPORT_OBSERVATION_VERSION,
    serverOwnedDetailedBillingExportRead: true as const,
    monitoringGaugeAcceptedAsInvoiceEvidence: false as const,
    customerCreditsMutated: false as const,
    async reread(untrusted: {
      readonly allocationWindow: unknown
      readonly rateAuthority: unknown
      readonly observedAt: string
    }) {
      assertPlainSerializedData(untrusted, 'sam31_vertex_billing_export_read')
      const window = assertCanonicalSam31VertexReplicaAllocationWindow(
        untrusted.allocationWindow,
      )
      const rate =
        assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
          untrusted.rateAuthority,
          window.firstPositiveSampleAt,
        )
      const observedAt = timestamp.parse(untrusted.observedAt)
      const expectedSkuIds = expectedVertexSkuIds(rate)
      const tables = await listTables(auth)
      const detailedTables = tables.filter((value) =>
        value.startsWith('gcp_billing_export_resource_v1_'))
      if (detailedTables.length !== 1) throw new Error(
        'SAM 3.1 detailed usage cost export table is not ready.',
      )
      const detailedBillingTableId = detailedTables[0]!
      const rawRows = await queryRows(auth, detailedBillingSql({
        tableId: detailedBillingTableId,
        expectedSkuIds,
        window,
      }))
      const rows = rawRows.map(parseBillingRow).sort(compareRows)
      validateRows({ rows, window, expectedSkuIds })
      const billingExportFreshThrough = [...rows].sort((left, right) =>
        Date.parse(right.exportTime) - Date.parse(left.exportTime))[0]!
        .exportTime
      const payload = observationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_BILLING_EXPORT_OBSERVATION_VERSION,
        source: 'canonical_server_bigquery_detailed_usage_cost_reread',
        evidenceClass: 'server_owned_cloud_billing_export_reread',
        projectId: PROJECT_ID,
        datasetId: DATASET_ID,
        datasetLocation: LOCATION,
        detailedBillingTableId,
        allocationWindowRef: {
          id: window.allocationWindowId,
          version: 1,
          contentHash: `sha256:${window.windowHash}`,
        },
        rateAuthorityRef: {
          id: rate.rateAuthorityId,
          version: rate.rateAuthorityVersion,
          contentHash: `sha256:${rate.rateAuthorityHash}`,
        },
        expectedVertexSkuIds: expectedSkuIds,
        billingRows: rows,
        totalNetCostUsdPicos: rows.reduce((sum, row) =>
          sum + row.netCostUsdPicos, 0),
        billingExportFreshThrough,
        exactEndpointResourceOrLabelsMatched: true,
        exactAllocationWindowUsageIntervalsMatched: true,
        expectedVertexSkuSetMatchedExactly: true,
        queryCacheUsed: false,
        maximumQueryBytesBilled: MAXIMUM_QUERY_BYTES_BILLED,
        publicListPriceUsed: false,
        billingAccountIdentifierReturned: false,
        monitoringGaugeAcceptedAsInvoiceEvidence: false,
        invoiceTaxAdjustmentOrFinalizedMonthClaimed: false,
        customerCreditSettlementAllowed: false,
        customerCreditsMutated: false,
        productionAuthorityGranted: false,
        observedAt,
      })
      return assertCanonicalSam31VertexServingBillingExportObservation({
        ...payload,
        observationHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertCanonicalSam31VertexServingBillingExportObservation(
  value: unknown,
): CanonicalSam31VertexServingBillingExportObservation {
  assertPlainSerializedData(value, 'sam31_vertex_billing_export_observation')
  const parsed = canonicalSam31VertexServingBillingExportObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) throw new Error(
    'SAM 3.1 detailed billing observation digest changed.',
  )
  return structuredClone(parsed)
}

async function listTables(auth: GoogleAuthRequest): Promise<string[]> {
  const response = await auth.request({
    method: 'GET',
    url: `${BIGQUERY_ORIGIN}/bigquery/v2/projects/${PROJECT_ID}/datasets/`
      + `${DATASET_ID}/tables?maxResults=100`,
    timeout: REQUEST_TIMEOUT_MILLISECONDS,
  })
  assertPlainSerializedData(response.data, 'bigquery_billing_table_list')
  const parsed = z.object({
    tables: z.array(z.object({
      tableReference: z.object({
        projectId: z.literal(PROJECT_ID),
        datasetId: z.literal(DATASET_ID),
        tableId,
      }).strict(),
      type: z.enum(['TABLE', 'VIEW', 'MATERIALIZED_VIEW']).optional(),
    }).passthrough()).max(100).optional(),
    nextPageToken: z.undefined().optional(),
  }).passthrough().parse(response.data)
  return (parsed.tables ?? []).filter((table) => table.type === 'TABLE')
    .map((table) => table.tableReference.tableId).sort(compareUtf16)
}

async function queryRows(
  auth: GoogleAuthRequest,
  sql: string,
): Promise<readonly string[]> {
  const response = await auth.request({
    method: 'POST',
    url: `${BIGQUERY_ORIGIN}/bigquery/v2/projects/${PROJECT_ID}/queries`,
    data: {
      query: sql,
      useLegacySql: false,
      useQueryCache: false,
      maximumBytesBilled: MAXIMUM_QUERY_BYTES_BILLED,
      timeoutMs: REQUEST_TIMEOUT_MILLISECONDS,
      location: LOCATION,
      formatOptions: { useInt64Timestamp: false },
    },
    timeout: REQUEST_TIMEOUT_MILLISECONDS,
  })
  assertPlainSerializedData(response.data, 'bigquery_billing_query_result')
  const parsed = z.object({
    jobComplete: z.literal(true),
    cacheHit: z.literal(false),
    totalRows: z.string().regex(/^(?:0|[1-9]\d{0,2})$/u),
    totalBytesBilled: z.string().regex(/^(?:0|[1-9]\d{0,20})$/u),
    pageToken: z.undefined().optional(),
    errors: z.undefined().optional(),
    rows: z.array(z.object({
      f: z.array(z.object({ v: z.string() }).strict()).length(1),
    }).strict()).max(MAXIMUM_ROWS).optional(),
  }).passthrough().parse(response.data)
  if (Number(parsed.totalBytesBilled) > Number(MAXIMUM_QUERY_BYTES_BILLED)
    || Number(parsed.totalRows) !== (parsed.rows ?? []).length) throw new Error(
    'SAM 3.1 detailed billing query exceeded its exact bound.',
  )
  return (parsed.rows ?? []).map((row) => row.f[0]!.v)
}

function detailedBillingSql(input: {
  tableId: string
  expectedSkuIds: readonly string[]
  window: CanonicalSam31VertexReplicaAllocationWindow
}): string {
  const startedAt = input.window.allocationBuckets[0]!.startedAt
  const endedAt = input.window.allocationBuckets.at(-1)!.endedAt
  const skuIds = input.expectedSkuIds.map((value) => `'${value}'`).join(', ')
  return `
SELECT TO_JSON_STRING(STRUCT(
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', export_time, 'UTC') AS exportTime,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', usage_start_time, 'UTC') AS usageStartedAt,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', usage_end_time, 'UTC') AS usageEndedAt,
  project.id AS projectId,
  service.id AS serviceId,
  sku.id AS skuId,
  sku.description AS skuDescription,
  cost_type AS costType,
  currency,
  FORMAT('%.12f', cost + IFNULL((SELECT SUM(amount) FROM UNNEST(credits)), 0)) AS netCostUsd,
  location.location AS location,
  COALESCE(resource.name, '') AS resourceName,
  COALESCE(resource.global_name, '') AS resourceGlobalName,
  COALESCE((SELECT value FROM UNNEST(labels) WHERE key = 'weeditpro-component' LIMIT 1), '') AS componentLabel,
  COALESCE((SELECT value FROM UNNEST(labels) WHERE key = 'weeditpro-route' LIMIT 1), '') AS routeLabel
)) AS row_json
FROM \`${PROJECT_ID}.${DATASET_ID}.${input.tableId}\`
WHERE project.id = '${PROJECT_ID}'
  AND service.id = '${VERTEX_SERVICE_ID}'
  AND sku.id IN (${skuIds})
  AND location.location = 'us-central1'
  AND usage_start_time >= TIMESTAMP('${startedAt}')
  AND usage_end_time <= TIMESTAMP('${endedAt}')
ORDER BY sku.id, usage_start_time, export_time
LIMIT ${MAXIMUM_ROWS}`.trim()
}

function parseBillingRow(value: string): z.infer<typeof rowSchema> {
  if (value.length < 2 || value.length > 16_384) throw new Error(
    'SAM 3.1 detailed billing row exceeds its byte bound.',
  )
  let decoded: unknown
  try {
    decoded = JSON.parse(value) as unknown
  } catch {
    throw new Error('SAM 3.1 detailed billing row is not JSON.')
  }
  assertPlainSerializedData(decoded, 'sam31_detailed_billing_row')
  const base = z.object({
    exportTime: timestamp,
    usageStartedAt: timestamp,
    usageEndedAt: timestamp,
    projectId: z.literal(PROJECT_ID),
    serviceId: z.literal(VERTEX_SERVICE_ID),
    skuId: z.string(),
    skuDescription: z.string(),
    costType: z.literal('regular'),
    currency: z.literal('USD'),
    netCostUsd: decimal,
    location: z.literal('us-central1'),
    resourceName: z.string(),
    resourceGlobalName: z.string(),
    componentLabel: z.string(),
    routeLabel: z.string(),
  }).strict().parse(decoded)
  return rowSchema.parse({
    ...base,
    netCostUsdPicos: decimalUsdToPicos(base.netCostUsd),
    exactEndpointIdentityMatched: true,
  })
}

function validateRows(input: {
  rows: readonly z.infer<typeof rowSchema>[]
  window: CanonicalSam31VertexReplicaAllocationWindow
  expectedSkuIds: readonly string[]
}): void {
  const startedAt = input.window.allocationBuckets[0]!.startedAt
  const endedAt = input.window.allocationBuckets.at(-1)!.endedAt
  const actualSkuIds = [...new Set(input.rows.map((row) => row.skuId))]
    .sort(compareUtf16)
  if (stableAuthorityStringify(actualSkuIds) !== stableAuthorityStringify(
    input.expectedSkuIds,
  ) || input.rows.some((row) => row.usageStartedAt < startedAt
    || row.usageEndedAt > endedAt)) throw new Error(
    'SAM 3.1 detailed billing rows do not isolate the allocation window.',
  )
}

function expectedVertexSkuIds(
  rate: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
): string[] {
  return VERTEX_COMPONENT_CLASSES.map((componentClass) => {
    const component = rate.components.find((candidate) =>
      candidate.componentClass === componentClass)
    if (!component || component.skuPriceTerm.cloudServiceId !==
      `services/${VERTEX_SERVICE_ID}`) throw new Error(
      'SAM 3.1 Vertex serving SKU authority is incomplete.',
    )
    return component.skuPriceTerm.skuId
  }).sort(compareUtf16)
}

function decimalUsdToPicos(value: string): number {
  const parsed = decimal.parse(value)
  const [whole, fraction = ''] = parsed.split('.')
  const picos = BigInt(whole!) * 1_000_000_000_000n
    + BigInt(fraction.padEnd(12, '0'))
  if (picos > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(
    'SAM 3.1 detailed billing cost exceeds its safe bound.',
  )
  return Number(picos)
}

function compareRows(
  left: z.infer<typeof rowSchema>,
  right: z.infer<typeof rowSchema>,
): number {
  return compareUtf16(left.skuId, right.skuId)
    || compareUtf16(left.usageStartedAt, right.usageStartedAt)
    || compareUtf16(left.exportTime, right.exportTime)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
