import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from './visual-intelligence-model-billing-sku-qualification'

export const VISUAL_INTELLIGENCE_DETAILED_BILLING_EXPORT_READER_CONFIGURATION_VERSION =
  'visual-intelligence-detailed-billing-export-reader-configuration-v1' as const
export const VISUAL_INTELLIGENCE_DETAILED_BILLING_EXPORT_OBSERVATION_VERSION =
  'visual-intelligence-detailed-billing-export-observation-v1' as const

const BIGQUERY_API_ORIGIN = 'https://bigquery.googleapis.com'
const BIGQUERY_READ_SCOPE =
  'https://www.googleapis.com/auth/bigquery.readonly'
const MAXIMUM_RESPONSE_BYTES = 2 * 1024 * 1024
const MAXIMUM_WINDOW_MS = 60 * 60 * 1_000
const MAXIMUM_EXPORT_LAG_MS = 7 * 24 * 60 * 60 * 1_000
const EXPECTED_FIELDS = [
  'sku_id',
  'sku_description',
  'usage_amount',
  'usage_unit',
  'cost',
  'currency',
  'row_count',
  'max_export_time',
] as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const projectIdSchema = z.string()
  .regex(/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u)
const datasetIdSchema = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/u)
const tableIdSchema = z.string()
  .regex(/^gcp_billing_export_resource_v1_[A-F0-9_]{20,80}$/u)
const timestamp = z.string().datetime({ offset: true })
const decimal = z.string().regex(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u)
const nonnegativeDecimal = decimal.refine((value) => !value.startsWith('-'))
const positiveDecimal = nonnegativeDecimal.refine((value) => /[1-9]/u.test(value))
const positiveIntegerString = z.string().regex(/^[1-9][0-9]{0,15}$/u)
const currency = z.string().regex(/^[A-Z]{3}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const configurationWithoutRefSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_DETAILED_BILLING_EXPORT_READER_CONFIGURATION_VERSION,
  ),
  queryProjectId: projectIdSchema,
  billingExportDatasetId: datasetIdSchema,
  billingExportTableId: tableIdSchema,
  billedProjectId: z.literal('reeditpro'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  maximumBytesBilled: z.string().regex(/^[1-9][0-9]{6,15}$/u),
  timeoutMs: z.number().int().min(1_000).max(60_000),
}).strict()

const configurationSchema = configurationWithoutRefSchema.extend({
  configurationRef: evidenceRefSchema,
}).strict()

const skuLineSchema = z.object({
  skuId: z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  expectedDisplayName: z.string().trim().min(1).max(240),
  observedDisplayName: z.string().trim().min(1).max(240),
  usageAmount: positiveDecimal,
  usageUnit: z.string().trim().min(1).max(120),
  cost: decimal,
  currency,
  rowCount: positiveIntegerString,
  maxExportTimeIso: timestamp,
}).strict()

const observationWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_DETAILED_BILLING_EXPORT_OBSERVATION_VERSION,
  ),
  observationId: safeId,
  observationVersion: z.number().int().positive().safe(),
  evidenceClass: z.literal(
    'isolated_detailed_cloud_billing_export_query_observation',
  ),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  billedProjectId: z.literal('reeditpro'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  qualificationWindowStartedAtIso: timestamp,
  qualificationWindowFinishedAtIso: timestamp,
  billingExportFreshThroughIso: timestamp,
  exactSkuIds: z.array(
    z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  ).length(6),
  skuLines: z.array(skuLineSchema).length(6),
  queryConfigurationRef: evidenceRefSchema,
  queryResponseRef: evidenceRefSchema,
  detailedBillingExportRef: evidenceRefSchema,
  billingSkuMetadataSetRef: evidenceRefSchema,
  isolatedUsageReconciliationReportRef: evidenceRefSchema,
  queryJobComplete: z.literal(true),
  detailedBillingExportQueried: z.literal(true),
  allSixExpectedSkuClassesObserved: z.literal(true),
  noUnexpectedProviderServiceSkuObserved: z.literal(true),
  noOtherModelOrSkuTrafficInObservationWindowProvenByBillingRows:
    z.literal(false),
  billingExportFreshThroughQualificationEnd: z.literal(true),
  exactProjectServiceWindowAndSkuSetVerified: z.literal(true),
  billingAccountIdentifierReturned: z.literal(false),
  exportDatasetOrTableIdentifierReturned: z.literal(false),
  rawBillingRowsReturned: z.literal(false),
  providerCallMade: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const expectedSkuIds: string[] = expectedCatalog().map((term) => term.skuId)
  const started = Date.parse(value.qualificationWindowStartedAtIso)
  const finished = Date.parse(value.qualificationWindowFinishedAtIso)
  const freshThrough = Date.parse(value.billingExportFreshThroughIso)
  if (
    visualIntelligenceCanonicalJson(value.exactSkuIds)
      !== visualIntelligenceCanonicalJson(expectedSkuIds)
    || visualIntelligenceCanonicalJson(value.skuLines.map((line) => line.skuId))
      !== visualIntelligenceCanonicalJson(expectedSkuIds)
    || finished <= started
    || finished - started > MAXIMUM_WINDOW_MS
    || freshThrough < finished
    || freshThrough - finished > MAXIMUM_EXPORT_LAG_MS
    || value.skuLines.some((line) =>
      Date.parse(line.maxExportTimeIso) < finished
      || Date.parse(line.maxExportTimeIso) - finished
        > MAXIMUM_EXPORT_LAG_MS)
    || value.skuLines.some((line, index) =>
      line.expectedDisplayName !== expectedCatalog()[index]?.expectedDisplayName
      || line.observedDisplayName !== line.expectedDisplayName)
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence detailed billing observation is not exact.',
  })
})

const observationSchema = observationWithoutDigestSchema.extend({
  observationDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceDetailedBillingExportReaderConfiguration =
  z.infer<typeof configurationSchema>
export type VisualIntelligenceDetailedBillingExportObservation =
  z.infer<typeof observationSchema>

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface VisualIntelligenceDetailedBillingExportReadPort {
  readExact(input: {
    readonly observationId: string
    readonly observationVersion: number
    readonly qualificationWindowStartedAtIso: string
    readonly qualificationWindowFinishedAtIso: string
  }): Promise<VisualIntelligenceDetailedBillingExportObservation>
}

export function createVisualIntelligenceDetailedBillingExportReaderConfiguration(
  input: z.input<typeof configurationWithoutRefSchema>,
): VisualIntelligenceDetailedBillingExportReaderConfiguration {
  const payload = configurationWithoutRefSchema.parse(input)
  const configurationId =
    'weeditpro-visual-intelligence-detailed-billing-export-reader'
  const configurationVersion = 1
  return Object.freeze(configurationSchema.parse({
    ...payload,
    configurationRef: createVisualIntelligenceEvidenceRef(
      configurationId,
      { ...payload, configurationId, configurationVersion },
      configurationVersion,
    ),
  }))
}

export function createVisualIntelligenceDetailedBillingExportReadPort(input: {
  readonly configuration:
    VisualIntelligenceDetailedBillingExportReaderConfiguration
  readonly auth?: GoogleAuthRequest
  readonly now?: () => Date
}): VisualIntelligenceDetailedBillingExportReadPort {
  const configuration = configurationSchema.parse(input.configuration)
  verifyConfigurationRef(configuration)
  const auth = input.auth ?? new GoogleAuth({ scopes: [BIGQUERY_READ_SCOPE] })
  const now = input.now ?? (() => new Date())
  if (!auth || typeof auth.request !== 'function') {
    throw new Error('Visual Intelligence billing export auth is invalid.')
  }
  return Object.freeze({
    async readExact(untrusted: {
      readonly observationId: string
      readonly observationVersion: number
      readonly qualificationWindowStartedAtIso: string
      readonly qualificationWindowFinishedAtIso: string
    }) {
      const scope = parseScope(untrusted, now())
      const response = await queryDetailedExport({
        auth,
        configuration,
        scope,
      })
      return buildObservation({ configuration, scope, response })
    },
  })
}

export function parseVisualIntelligenceDetailedBillingExportObservation(
  value: unknown,
): VisualIntelligenceDetailedBillingExportObservation {
  const observation = observationSchema.parse(value)
  const payload = { ...observation }
  Reflect.deleteProperty(payload, 'observationDigestSha256')
  if (observation.observationDigestSha256
    !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence detailed billing observation digest is invalid.',
    )
  }
  return Object.freeze(observation)
}

function parseScope(
  input: {
    observationId: string
    observationVersion: number
    qualificationWindowStartedAtIso: string
    qualificationWindowFinishedAtIso: string
  },
  observedNow: Date,
) {
  const scope = z.object({
    observationId: safeId,
    observationVersion: z.number().int().positive().safe(),
    qualificationWindowStartedAtIso: timestamp,
    qualificationWindowFinishedAtIso: timestamp,
  }).strict().parse(input)
  const started = Date.parse(scope.qualificationWindowStartedAtIso)
  const finished = Date.parse(scope.qualificationWindowFinishedAtIso)
  if (
    !Number.isFinite(observedNow.getTime())
    || finished <= started
    || finished - started > MAXIMUM_WINDOW_MS
    || finished > observedNow.getTime()
    || observedNow.getTime() - finished > MAXIMUM_EXPORT_LAG_MS
  ) throw new Error(
    'Visual Intelligence billing export qualification window is invalid.',
  )
  return scope
}

async function queryDetailedExport(input: {
  auth: GoogleAuthRequest
  configuration: VisualIntelligenceDetailedBillingExportReaderConfiguration
  scope: ReturnType<typeof parseScope>
}): Promise<unknown> {
  const { configuration, scope } = input
  const query = [
    'SELECT',
    '  sku.id AS sku_id,',
    '  ANY_VALUE(sku.description) AS sku_description,',
    '  CAST(SUM(usage.amount) AS STRING) AS usage_amount,',
    '  ANY_VALUE(usage.unit) AS usage_unit,',
    '  CAST(SUM(cost) AS STRING) AS cost,',
    '  ANY_VALUE(currency) AS currency,',
    '  CAST(COUNT(*) AS STRING) AS row_count,',
    "  FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%E3SZ', MAX(export_time)) AS max_export_time",
    `FROM \`${configuration.queryProjectId}.${
      configuration.billingExportDatasetId}.${
      configuration.billingExportTableId}\``,
    'WHERE project.id = @billed_project_id',
    '  AND service.id = @provider_service_id',
    '  AND cost_type = \'regular\'',
    '  AND usage_start_time < @window_finished',
    '  AND usage_end_time > @window_started',
    'GROUP BY sku_id',
    'ORDER BY sku_id',
  ].join('\n')
  let response: { data: unknown }
  try {
    response = await input.auth.request<unknown>({
      url: `${BIGQUERY_API_ORIGIN}/bigquery/v2/projects/${
        configuration.queryProjectId}/queries`,
      method: 'POST',
      timeout: configuration.timeoutMs,
      retry: false,
      maxRedirects: 0,
      responseType: 'json',
      data: {
        query,
        useLegacySql: false,
        timeoutMs: String(configuration.timeoutMs),
        maxResults: '32',
        maximumBytesBilled: configuration.maximumBytesBilled,
        parameterMode: 'NAMED',
        queryParameters: [
          queryParameter('billed_project_id', configuration.billedProjectId),
          queryParameter('provider_service_id', configuration.providerServiceId),
          queryParameter('window_started',
            scope.qualificationWindowStartedAtIso, 'TIMESTAMP'),
          queryParameter('window_finished',
            scope.qualificationWindowFinishedAtIso, 'TIMESTAMP'),
        ],
      },
    })
  } catch {
    throw new Error('Visual Intelligence detailed billing export query failed.')
  }
  if (Buffer.byteLength(visualIntelligenceCanonicalJson(response.data), 'utf8')
    > MAXIMUM_RESPONSE_BYTES) {
    throw new Error(
      'Visual Intelligence detailed billing export response exceeded its bound.',
    )
  }
  return response.data
}

function buildObservation(input: {
  configuration: VisualIntelligenceDetailedBillingExportReaderConfiguration
  scope: ReturnType<typeof parseScope>
  response: unknown
}): VisualIntelligenceDetailedBillingExportObservation {
  const response = parseBigQueryResponse(input.response)
  const bySku = new Map(response.rows.map((line) => [line.skuId, line]))
  const catalog = expectedCatalog()
  const expectedSkuIds: string[] = catalog.map((term) => term.skuId)
  if (
    response.rows.length !== catalog.length
    || bySku.size !== catalog.length
    || response.rows.some((line) => !expectedSkuIds.includes(line.skuId))
    || catalog.some((term) => !bySku.has(term.skuId))
  ) throw new Error(
    'Visual Intelligence detailed billing export SKU isolation failed.',
  )
  const skuLines = catalog.map((term) => {
    const line = bySku.get(term.skuId)
    if (!line || line.observedDisplayName !== term.expectedDisplayName) {
      throw new Error(
        'Visual Intelligence detailed billing export SKU metadata changed.',
      )
    }
    return { ...line, expectedDisplayName: term.expectedDisplayName }
  })
  const billingExportFreshThroughIso = new Date(Math.max(
    ...skuLines.map((line) => Date.parse(line.maxExportTimeIso)),
  )).toISOString()
  const finished = Date.parse(input.scope.qualificationWindowFinishedAtIso)
  const freshThrough = Date.parse(billingExportFreshThroughIso)
  if (
    freshThrough < finished
    || freshThrough - finished > MAXIMUM_EXPORT_LAG_MS
    || skuLines.some((line) =>
      Date.parse(line.maxExportTimeIso) < finished
      || Date.parse(line.maxExportTimeIso) - finished
        > MAXIMUM_EXPORT_LAG_MS)
  ) throw new Error(
    'Visual Intelligence detailed billing export is not fresh enough.',
  )
  const queryResponseRef = createVisualIntelligenceEvidenceRef(
    `${input.scope.observationId}.query-response`,
    input.response,
    input.scope.observationVersion,
  )
  const detailedBillingExportRef = createVisualIntelligenceEvidenceRef(
    `${input.scope.observationId}.detailed-export`,
    { scope: input.scope, skuLines, queryResponseRef },
    input.scope.observationVersion,
  )
  const billingSkuMetadataSetRef = createVisualIntelligenceEvidenceRef(
    `${input.scope.observationId}.sku-metadata`,
    skuLines.map((line) => ({
      skuId: line.skuId,
      displayName: line.observedDisplayName,
      usageUnit: line.usageUnit,
      currency: line.currency,
    })),
    input.scope.observationVersion,
  )
  const isolatedUsageReconciliationReportRef =
    createVisualIntelligenceEvidenceRef(
      `${input.scope.observationId}.isolation`,
      {
        billedProjectId: input.configuration.billedProjectId,
        providerServiceId: input.configuration.providerServiceId,
        qualificationWindowStartedAtIso:
          input.scope.qualificationWindowStartedAtIso,
        qualificationWindowFinishedAtIso:
          input.scope.qualificationWindowFinishedAtIso,
        exactSkuIds: expectedSkuIds,
        unexpectedSkuCount: 0,
      },
      input.scope.observationVersion,
    )
  const payload = observationWithoutDigestSchema.parse({
    schemaVersion:
      VISUAL_INTELLIGENCE_DETAILED_BILLING_EXPORT_OBSERVATION_VERSION,
    observationId: input.scope.observationId,
    observationVersion: input.scope.observationVersion,
    evidenceClass: 'isolated_detailed_cloud_billing_export_query_observation',
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    billedProjectId: input.configuration.billedProjectId,
    providerServiceId: input.configuration.providerServiceId,
    qualificationWindowStartedAtIso:
      input.scope.qualificationWindowStartedAtIso,
    qualificationWindowFinishedAtIso:
      input.scope.qualificationWindowFinishedAtIso,
    billingExportFreshThroughIso,
    exactSkuIds: expectedSkuIds,
    skuLines,
    queryConfigurationRef: input.configuration.configurationRef,
    queryResponseRef,
    detailedBillingExportRef,
    billingSkuMetadataSetRef,
    isolatedUsageReconciliationReportRef,
    queryJobComplete: true,
    detailedBillingExportQueried: true,
    allSixExpectedSkuClassesObserved: true,
    noUnexpectedProviderServiceSkuObserved: true,
    noOtherModelOrSkuTrafficInObservationWindowProvenByBillingRows: false,
    billingExportFreshThroughQualificationEnd: true,
    exactProjectServiceWindowAndSkuSetVerified: true,
    billingAccountIdentifierReturned: false,
    exportDatasetOrTableIdentifierReturned: false,
    rawBillingRowsReturned: false,
    providerCallMade: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
  return parseVisualIntelligenceDetailedBillingExportObservation({
    ...payload,
    observationDigestSha256: visualIntelligenceDigest(payload),
  })
}

function parseBigQueryResponse(value: unknown): {
  rows: Array<{
    skuId: string
    observedDisplayName: string
    usageAmount: string
    usageUnit: string
    cost: string
    currency: string
    rowCount: string
    maxExportTimeIso: string
  }>
} {
  const cell = z.object({ v: z.unknown() }).strict()
  const response = z.object({
    jobComplete: z.literal(true),
    totalRows: z.string().regex(/^[0-9]{1,3}$/u),
    schema: z.object({
      fields: z.array(z.object({ name: z.string() }).passthrough())
        .length(EXPECTED_FIELDS.length),
    }).strict(),
    rows: z.array(z.object({
      f: z.array(cell).length(EXPECTED_FIELDS.length),
    }).strict()).max(32),
    errors: z.array(z.unknown()).max(0).optional(),
  }).passthrough().parse(value)
  if (
    response.schema.fields.map((field) => field.name).join('|')
      !== EXPECTED_FIELDS.join('|')
    || Number(response.totalRows) !== response.rows.length
  ) throw new Error(
    'Visual Intelligence detailed billing export response schema changed.',
  )
  const rows = response.rows.map((row) => ({
    skuId: z.string().parse(row.f[0]?.v),
    observedDisplayName: z.string().parse(row.f[1]?.v),
    usageAmount: positiveDecimal.parse(row.f[2]?.v),
    usageUnit: z.string().trim().min(1).max(120).parse(row.f[3]?.v),
    cost: decimal.parse(row.f[4]?.v),
    currency: currency.parse(row.f[5]?.v),
    rowCount: positiveIntegerString.parse(row.f[6]?.v),
    maxExportTimeIso: timestamp.parse(row.f[7]?.v),
  }))
  if (new Set(rows.map((line) => line.skuId)).size !== rows.length) {
    throw new Error(
      'Visual Intelligence detailed billing export repeated a SKU.',
    )
  }
  return { rows }
}

function queryParameter(
  name: string,
  value: string,
  type: 'STRING' | 'TIMESTAMP' = 'STRING',
) {
  return {
    name,
    parameterType: { type },
    parameterValue: { value },
  }
}

function verifyConfigurationRef(
  configuration: VisualIntelligenceDetailedBillingExportReaderConfiguration,
): void {
  const payload = { ...configuration }
  Reflect.deleteProperty(payload, 'configurationRef')
  const expected = createVisualIntelligenceEvidenceRef(
    configuration.configurationRef.id,
    {
      ...payload,
      configurationId: configuration.configurationRef.id,
      configurationVersion: configuration.configurationRef.version,
    },
    configuration.configurationRef.version,
  )
  if (expected.contentHash !== configuration.configurationRef.contentHash) {
    throw new Error(
      'Visual Intelligence detailed billing reader configuration changed.',
    )
  }
}

function expectedCatalog() {
  return WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
}

export function visualIntelligenceDetailedBillingExportObservationRef(
  value: VisualIntelligenceDetailedBillingExportObservation,
): VisualIntelligenceEvidenceRef {
  const observation =
    parseVisualIntelligenceDetailedBillingExportObservation(value)
  return evidenceRefSchema.parse({
    id: observation.observationId,
    version: observation.observationVersion,
    contentHash: observation.observationDigestSha256,
  })
}

export function visualIntelligenceDetailedBillingExportRawDigest(
  value: unknown,
): string {
  return rawSha256.parse(visualIntelligenceDigest(value).slice(7))
}
