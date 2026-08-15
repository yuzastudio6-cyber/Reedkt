import { z } from 'zod'

import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from './visual-intelligence-model-billing-sku-qualification'
import type {
  VisualIntelligenceBillingExportObservation,
  VisualIntelligenceBillingExportObservationPort,
} from './visual-intelligence-model-billing-sku-reconciliation'

export const VISUAL_INTELLIGENCE_BIGQUERY_BILLING_EXPORT_PORT_VERSION =
  'visual-intelligence-bigquery-billing-export-port-v1' as const

const BIGQUERY_API_ORIGIN = 'https://bigquery.googleapis.com'
const DEFAULT_TIMEOUT_MS = 120_000
const MAXIMUM_QUERY_BYTES_BILLED = '100000000'
const EXPECTED_SERVICE_ID = 'C7E2-9256-1C43'
const EXPECTED_CONSUMPTION_MODEL = '7754-699E-0EBF'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const datasetId = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/u)
const tableId = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/u)

const tableListResponseSchema = z.object({
  tables: z.array(z.object({
    tableReference: z.object({
      projectId: z.literal('reeditpro'),
      datasetId,
      tableId,
    }).strict(),
    type: z.enum(['TABLE', 'VIEW', 'MATERIALIZED_VIEW']).optional(),
  }).passthrough()).max(100).optional(),
  nextPageToken: z.string().optional(),
}).passthrough()

const queryResponseSchema = z.object({
  jobComplete: z.literal(true),
  cacheHit: z.literal(false),
  totalRows: z.string().regex(/^(?:0|[1-9][0-9]{0,5})$/u),
  totalBytesProcessed: z.string().regex(/^(?:0|[1-9][0-9]{0,20})$/u),
  totalBytesBilled: z.string().regex(/^(?:0|[1-9][0-9]{0,20})$/u),
  pageToken: z.undefined().optional(),
  errors: z.undefined().optional(),
  rows: z.array(z.object({
    f: z.array(z.object({ v: z.string() }).strict()).length(1),
  }).strict()).max(100).optional(),
}).passthrough()

export interface VisualIntelligenceBigQueryAccessTokenPort {
  getAccessToken(): Promise<{ readonly token?: string | null }>
}

export function createVisualIntelligenceBigQueryBillingExportPort(input: {
  readonly projectId: 'reeditpro'
  readonly datasetId: string
  readonly location: 'US'
  readonly auth: VisualIntelligenceBigQueryAccessTokenPort
  readonly fetchImpl?: typeof fetch
}): VisualIntelligenceBillingExportObservationPort {
  if (
    input.projectId !== 'reeditpro'
    || input.location !== 'US'
    || typeof input.auth?.getAccessToken !== 'function'
  ) throw new Error('BigQuery billing export port is not configured.')
  const exactDatasetId = datasetId.parse(input.datasetId)
  const fetchImpl = input.fetchImpl ?? fetch
  return Object.freeze({
    async readExact(untrusted: {
      readonly qualificationId: string
      readonly qualificationLabel: string
      readonly projectId: 'reeditpro'
      readonly windowStartedAtIso: string
      readonly windowFinishedAtIso: string
    }) {
      const qualificationId = safeId.parse(untrusted.qualificationId)
      const qualificationLabel = z.string().regex(/^[a-f0-9]{32}$/u)
        .parse(untrusted.qualificationLabel)
      const windowStartedAtIso = timestamp.parse(untrusted.windowStartedAtIso)
      const windowFinishedAtIso = timestamp.parse(untrusted.windowFinishedAtIso)
      if (
        untrusted.projectId !== input.projectId
        || Date.parse(windowFinishedAtIso) <= Date.parse(windowStartedAtIso)
        || Date.parse(windowFinishedAtIso) - Date.parse(windowStartedAtIso)
          > 3_600_000
      ) throw new Error('BigQuery billing observation scope is invalid.')
      const accessToken = await readAccessToken(input.auth)
      const tables = await listTables({
        accessToken,
        datasetId: exactDatasetId,
        fetchImpl,
      })
      const detailedTables = tables.filter((value) =>
        value.startsWith('gcp_billing_export_resource_v1_'))
      if (
        detailedTables.length !== 1
        || !tables.includes('cloud_pricing_export')
      ) throw new Error(
        'Detailed usage and pricing billing export tables are not ready.',
      )
      const detailedBillingTableId = detailedTables[0]
      const detailedRows = await queryRows({
        accessToken,
        fetchImpl,
        sql: detailedUsageSql({
          datasetId: exactDatasetId,
          tableId: detailedBillingTableId,
          windowStartedAtIso,
          windowFinishedAtIso,
        }),
      })
      const skuMetadataRows = await queryRows({
        accessToken,
        fetchImpl,
        sql: skuMetadataSql({ datasetId: exactDatasetId }),
      })
      const parsedDetailedRows = detailedRows.map(parseJsonRow)
      const parsedSkuMetadataRows = skuMetadataRows.map(parseJsonRow)
      const exportTimes = parsedDetailedRows.map((row) => {
        if (!row || typeof row !== 'object' || !('exportTimeIso' in row)) {
          throw new Error('BigQuery billing export row has no export time.')
        }
        return timestamp.parse(row.exportTimeIso)
      })
      if (exportTimes.length < 1) {
        throw new Error('BigQuery billing export returned no exact evidence.')
      }
      const billingExportFreshThroughIso = exportTimes.sort((a, b) =>
        Date.parse(b) - Date.parse(a))[0]
      const observation = {
        detailedBillingTableId,
        pricingTableId: 'cloud_pricing_export',
        billingExportFreshThroughIso,
        detailedUsageRows: parsedDetailedRows,
        skuMetadataRows: parsedSkuMetadataRows,
        queryCacheUsed: false,
        publicListPriceUsed: false,
        billingAccountIdentifierReturned: false,
      } as VisualIntelligenceBillingExportObservation
      // The qualification id is intentionally used only to bind the exact
      // request label. It is never interpolated into SQL or returned by BQ.
      if (!qualificationId || !qualificationLabel) {
        throw new Error('BigQuery billing qualification identity is invalid.')
      }
      return observation
    },
  })

  async function listTables(args: {
    accessToken: string
    datasetId: string
    fetchImpl: typeof fetch
  }): Promise<string[]> {
    const response = await args.fetchImpl(
      `${BIGQUERY_API_ORIGIN}/bigquery/v2/projects/reeditpro/datasets/`
        + `${encodeURIComponent(args.datasetId)}/tables?maxResults=100`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${args.accessToken}` },
        redirect: 'error',
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    )
    if (!response.ok) {
      throw new Error(`BigQuery table discovery failed (${response.status}).`)
    }
    const parsed = tableListResponseSchema.parse(await response.json())
    if (parsed.nextPageToken) {
      throw new Error('BigQuery billing table discovery was not bounded.')
    }
    return (parsed.tables ?? []).filter((value) => value.type === 'TABLE')
      .map((value) => value.tableReference.tableId).sort()
  }

  async function queryRows(args: {
    accessToken: string
    fetchImpl: typeof fetch
    sql: string
  }): Promise<string[]> {
    const response = await args.fetchImpl(
      `${BIGQUERY_API_ORIGIN}/bigquery/v2/projects/reeditpro/queries`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${args.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: args.sql,
          useLegacySql: false,
          useQueryCache: false,
          maximumBytesBilled: MAXIMUM_QUERY_BYTES_BILLED,
          timeoutMs: DEFAULT_TIMEOUT_MS,
          location: input.location,
          formatOptions: { useInt64Timestamp: false },
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    )
    if (!response.ok) {
      throw new Error(`BigQuery billing query failed (${response.status}).`)
    }
    const parsed = queryResponseSchema.parse(await response.json())
    if (
      Number(parsed.totalBytesBilled) > Number(MAXIMUM_QUERY_BYTES_BILLED)
      || Number(parsed.totalRows) !== (parsed.rows ?? []).length
    ) throw new Error('BigQuery billing query exceeded its exact bound.')
    return (parsed.rows ?? []).map((row) => row.f[0].v)
  }
}

function detailedUsageSql(input: {
  datasetId: string
  tableId: string
  windowStartedAtIso: string
  windowFinishedAtIso: string
}): string {
  const table = `\`reeditpro.${input.datasetId}.${input.tableId}\``
  return `
SELECT TO_JSON_STRING(STRUCT(
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', export_time, 'UTC') AS exportTimeIso,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', usage_start_time, 'UTC') AS usageStartTimeIso,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', usage_end_time, 'UTC') AS usageEndTimeIso,
  project.id AS projectId,
  CONCAT('services/', service.id) AS serviceId,
  sku.id AS skuId,
  sku.description AS skuDescription,
  cost_type AS costType,
  currency,
  FORMAT('%.12f', usage.amount) AS usageAmount,
  usage.unit AS usageUnit,
  FORMAT('%.12f', usage.amount_in_pricing_units) AS usageAmountInPricingUnits,
  usage.pricing_unit AS pricingUnit,
  CONCAT('consumptionModels/', consumption_model.id) AS consumptionModel,
  COALESCE((SELECT value FROM UNNEST(labels) WHERE key = 'capability' LIMIT 1), '') AS capabilityLabel,
  COALESCE((SELECT value FROM UNNEST(labels) WHERE key = 'operation' LIMIT 1), '') AS operationLabel,
  COALESCE((SELECT value FROM UNNEST(labels) WHERE key = 'context' LIMIT 1), '') AS contextLabel,
  COALESCE((SELECT value FROM UNNEST(labels) WHERE key = 'qualification' LIMIT 1), '') AS qualificationLabel
)) AS row_json
FROM ${table}
WHERE project.id = 'reeditpro'
  AND service.id = '${EXPECTED_SERVICE_ID}'
  AND usage_start_time <= TIMESTAMP('${input.windowFinishedAtIso}')
  AND usage_end_time >= TIMESTAMP('${input.windowStartedAtIso}')
ORDER BY
  COALESCE((SELECT value FROM UNNEST(labels) WHERE key = 'context' LIMIT 1), ''),
  sku.id,
  usage_start_time,
  export_time
LIMIT 64`.trim()
}

function skuMetadataSql(input: { datasetId: string }): string {
  const table = `\`reeditpro.${input.datasetId}.cloud_pricing_export\``
  const skuIds = WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
    .map((term) => `'${term.skuId}'`).join(', ')
  return `
SELECT TO_JSON_STRING(STRUCT(
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', export_time, 'UTC') AS exportTimeIso,
  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', pricing_as_of_time, 'UTC') AS pricingAsOfTimeIso,
  CONCAT('services/', service.id) AS serviceId,
  sku.id AS skuId,
  sku.description AS skuDescription,
  CONCAT('consumptionModels/', consumption.consumption_model_id) AS consumptionModel
)) AS row_json
FROM ${table}, UNNEST(consumption_model_prices) AS consumption
WHERE service.id = '${EXPECTED_SERVICE_ID}'
  AND sku.id IN (${skuIds})
  AND consumption.consumption_model_id = '${EXPECTED_CONSUMPTION_MODEL}'
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY sku.id
  ORDER BY pricing_as_of_time DESC, export_time DESC
) = 1
ORDER BY CASE sku.id
${WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map(
    (term, index) => `  WHEN '${term.skuId}' THEN ${index}`,
  ).join('\n')}
END
LIMIT 6`.trim()
}

function parseJsonRow(value: string): Record<string, unknown> {
  if (value.length < 2 || value.length > 16_384) {
    throw new Error('BigQuery billing row is outside its byte bound.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(value) as unknown
  } catch {
    throw new Error('BigQuery billing row is not valid JSON.')
  }
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw new Error('BigQuery billing row is not an object.')
  }
  return decoded as Record<string, unknown>
}

async function readAccessToken(
  auth: VisualIntelligenceBigQueryAccessTokenPort,
): Promise<string> {
  const result = await auth.getAccessToken()
  const token = result.token ?? ''
  if (token.length < 20 || token.length > 4_096 || /\s/u.test(token)) {
    throw new Error('BigQuery billing access token is malformed.')
  }
  return token
}
