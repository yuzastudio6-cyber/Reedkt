import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  visualIntelligenceCanonicalJson,
} from './visual-intelligence-contract'
import {
  createVisualIntelligenceModelBillingSkuQualification,
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
  VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_VERSION,
  VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
  type VisualIntelligenceModelBillingSkuQualification,
} from './visual-intelligence-model-billing-sku-qualification'
import {
  parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt,
  type VisualIntelligenceModelBillingSkuLiveExecutionReceipt,
} from './visual-intelligence-model-billing-sku-live-qualification'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILER_VERSION =
  'visual-intelligence-model-billing-sku-reconciler-v1' as const

const OBJECT_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/reconciliations'
const EXPECTED_SERVICE_ID = 'services/C7E2-9256-1C43'
const EXPECTED_PROJECT_ID = 'reeditpro'
const EXPECTED_CONSUMPTION_MODEL = 'consumptionModels/7754-699E-0EBF'
const MAXIMUM_USAGE_ROWS = 64
const EXACT_LABELS = Object.freeze({
  capability: 'visual-intelligence',
  operation: 'billing-sku-qualification',
})

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const decimal = z.string().regex(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u)

const usageRowSchema = z.object({
  exportTimeIso: timestamp,
  usageStartTimeIso: timestamp,
  usageEndTimeIso: timestamp,
  projectId: z.literal(EXPECTED_PROJECT_ID),
  serviceId: z.literal(EXPECTED_SERVICE_ID),
  skuId: z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  skuDescription: z.string().trim().min(1).max(240),
  costType: z.literal('regular'),
  currency: z.literal('USD'),
  usageAmount: decimal,
  usageUnit: z.string().trim().min(1).max(120),
  usageAmountInPricingUnits: decimal,
  pricingUnit: z.string().trim().min(1).max(120),
  consumptionModel: z.literal(EXPECTED_CONSUMPTION_MODEL),
  capabilityLabel: z.string().trim().max(63),
  operationLabel: z.string().trim().max(63),
  contextLabel: z.string().trim().max(63),
  qualificationLabel: z.string().trim().max(63),
}).strict().superRefine((value, context) => {
  if (
    Number(value.usageAmount) <= 0
    || Number(value.usageAmountInPricingUnits) <= 0
    || Date.parse(value.usageEndTimeIso) <= Date.parse(value.usageStartTimeIso)
  ) context.addIssue({
    code: 'custom',
    message: 'Billing usage row is not a positive bounded usage interval.',
  })
})

const skuMetadataRowSchema = z.object({
  exportTimeIso: timestamp,
  pricingAsOfTimeIso: timestamp,
  serviceId: z.literal(EXPECTED_SERVICE_ID),
  skuId: z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  skuDescription: z.string().trim().min(1).max(240),
  consumptionModel: z.literal(EXPECTED_CONSUMPTION_MODEL),
}).strict()

const observationSchema = z.object({
  detailedBillingTableId: z.string()
    .regex(/^gcp_billing_export_resource_v1_[A-Za-z0-9_]+$/u),
  pricingTableId: z.literal('cloud_pricing_export'),
  billingExportFreshThroughIso: timestamp,
  detailedUsageRows: z.array(usageRowSchema).min(1).max(MAXIMUM_USAGE_ROWS),
  skuMetadataRows: z.array(skuMetadataRowSchema).length(6),
  queryCacheUsed: z.literal(false),
  publicListPriceUsed: z.literal(false),
  billingAccountIdentifierReturned: z.literal(false),
}).strict()

export type VisualIntelligenceBillingExportObservation = z.infer<
  typeof observationSchema
>

export interface VisualIntelligenceBillingExportObservationPort {
  readExact(input: {
    readonly qualificationId: string
    readonly qualificationLabel: string
    readonly projectId: 'reeditpro'
    readonly windowStartedAtIso: string
    readonly windowFinishedAtIso: string
  }): Promise<VisualIntelligenceBillingExportObservation>
}

export async function reconcileVisualIntelligenceModelBillingSkuQualification(
  untrusted: {
    readonly liveExecution:
      VisualIntelligenceModelBillingSkuLiveExecutionReceipt
    readonly billingExportPort: VisualIntelligenceBillingExportObservationPort
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  },
): Promise<VisualIntelligenceModelBillingSkuQualification> {
  const liveExecution =
    parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt(
      untrusted.liveExecution,
    )
  if (
    typeof untrusted.billingExportPort?.readExact !== 'function'
    || typeof untrusted.objectPort?.createOnly !== 'function'
    || typeof untrusted.objectPort?.readExact !== 'function'
  ) throw new Error('Billing export reconciliation is not configured.')
  const qualificationLabel = createHash('sha256')
    .update(liveExecution.qualificationId, 'utf8').digest('hex').slice(0, 32)
  const observation = observationSchema.parse(
    await untrusted.billingExportPort.readExact({
      qualificationId: liveExecution.qualificationId,
      qualificationLabel,
      projectId: EXPECTED_PROJECT_ID,
      windowStartedAtIso: liveExecution.qualificationWindowStartedAtIso,
      windowFinishedAtIso: liveExecution.qualificationWindowFinishedAtIso,
    }),
  )
  validateObservation({ liveExecution, observation, qualificationLabel })

  const identityHash = createHash('sha256')
    .update(liveExecution.qualificationId, 'utf8').digest('hex')
  const pathPrefix = `${OBJECT_PREFIX}/${identityHash}`
  const liveExecutionRef = Object.freeze({
    id: `${liveExecution.qualificationId}-live-execution`,
    version: 1,
    contentHash: liveExecution.executionDigestSha256,
  })
  const detailedBillingExportRef = await persistExact(
    untrusted.objectPort,
    `${pathPrefix}/detailed-billing-export-observation.json`,
    {
      schemaVersion:
        'visual-intelligence-detailed-billing-export-observation-v1',
      liveExecutionRef,
      detailedBillingTableId: observation.detailedBillingTableId,
      billingExportFreshThroughIso: observation.billingExportFreshThroughIso,
      detailedUsageRows: observation.detailedUsageRows,
      queryCacheUsed: false,
      billingAccountIdentifierReturned: false,
      customerCreditsMutated: false,
    },
  )
  const billingSkuMetadataSetRef = await persistExact(
    untrusted.objectPort,
    `${pathPrefix}/billing-sku-metadata-set.json`,
    {
      schemaVersion: 'visual-intelligence-billing-sku-metadata-set-v1',
      liveExecutionRef,
      pricingTableId: observation.pricingTableId,
      billingSkuCatalogVersion:
        VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
      skuMetadataRows: observation.skuMetadataRows,
      publicListPriceUsed: false,
      billingAccountIdentifierReturned: false,
    },
  )
  const isolatedUsageReconciliationReportRef = await persistExact(
    untrusted.objectPort,
    `${pathPrefix}/isolated-usage-reconciliation-report.json`,
    {
      schemaVersion:
        'visual-intelligence-isolated-usage-reconciliation-report-v1',
      reconcilerVersion:
        VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILER_VERSION,
      liveExecutionRef,
      detailedBillingExportRef,
      billingSkuMetadataSetRef,
      exactQualificationLabel: qualificationLabel,
      exactStandardAndLongSkuMappingVerified: true,
      isolatedBillingWindowVerified: true,
      noOtherModelOrSkuTrafficInObservationWindow: true,
      detailedBillingExportExactReread: true,
      publicListPriceUsed: false,
      customerCreditsMutated: false,
      productionReleaseAuthorityGranted: false,
    },
  )
  const qualification = createVisualIntelligenceModelBillingSkuQualification({
    schemaVersion:
      VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_VERSION,
    evidenceClass:
      'live_isolated_vertex_usage_and_billing_export_reconciliation',
    qualificationId: liveExecution.qualificationId,
    qualificationVersion: 1,
    exactModelId: liveExecution.exactModelId,
    vertexLocation: liveExecution.vertexLocation,
    throughputClass: 'standard',
    providerServiceId: EXPECTED_SERVICE_ID,
    billingSkuFamily: 'gemini_3_0_pro_shared_billing_family',
    billingSkuCatalogVersion:
      VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
    contextThresholdInputTokens:
      VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
    wholeRequestLongContextRatesRequired: true,
    qualifiedRateClasses: [
      ...VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
    ],
    exactSkuIds: WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
      .map((term) => term.skuId),
    standardContextProviderRequestRef:
      liveExecution.standardContextProviderRequestRef,
    longContextProviderRequestRef:
      liveExecution.longContextProviderRequestRef,
    standardContextProviderUsageRef:
      liveExecution.standardContextProviderUsageRef,
    longContextProviderUsageRef:
      liveExecution.longContextProviderUsageRef,
    detailedBillingExportRef,
    billingSkuMetadataSetRef,
    isolatedUsageReconciliationReportRef,
    qualificationWindowStartedAtIso:
      liveExecution.qualificationWindowStartedAtIso,
    qualificationWindowFinishedAtIso:
      liveExecution.qualificationWindowFinishedAtIso,
    billingExportFreshThroughIso: observation.billingExportFreshThroughIso,
    liveGeminiStandardContextRequestExecuted: true,
    liveGeminiLongContextRequestExecuted: true,
    exactReturnedModelIdVerified: true,
    exactProviderUsageMetadataReread: true,
    isolatedBillingWindowVerified: true,
    noOtherModelOrSkuTrafficInObservationWindow: true,
    detailedBillingExportExactReread: true,
    exactStandardAndLongSkuMappingVerified: true,
    publicListPriceUsed: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
  await persistExact(
    untrusted.objectPort,
    `${pathPrefix}/model-billing-sku-qualification.json`,
    qualification,
  )
  return qualification
}

function validateObservation(input: {
  liveExecution: VisualIntelligenceModelBillingSkuLiveExecutionReceipt
  observation: VisualIntelligenceBillingExportObservation
  qualificationLabel: string
}): void {
  const expectedTerms = WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
  const expectedMetadata = expectedTerms.map((term) =>
    `${term.skuId}:${term.expectedDisplayName}`)
  const actualMetadata = input.observation.skuMetadataRows.map((row) =>
    `${row.skuId}:${row.skuDescription}`)
  const usageSkuIds = new Set(input.observation.detailedUsageRows
    .map((row) => row.skuId))
  const expectedUsageSkuIds = new Set<string>([
    expectedTerms[0].skuId,
    expectedTerms[2].skuId,
    expectedTerms[3].skuId,
    expectedTerms[5].skuId,
  ])
  const standardRows = input.observation.detailedUsageRows.filter((row) =>
    row.contextLabel === 'standard')
  const longRows = input.observation.detailedUsageRows.filter((row) =>
    row.contextLabel === 'long')
  const exactLabels = input.observation.detailedUsageRows.every((row) =>
    row.capabilityLabel === EXACT_LABELS.capability
      && row.operationLabel === EXACT_LABELS.operation
      && row.qualificationLabel === input.qualificationLabel)
  const standardSkuIds = new Set(standardRows.map((row) => row.skuId))
  const longSkuIds = new Set(longRows.map((row) => row.skuId))
  const finishedAt = Date.parse(
    input.liveExecution.qualificationWindowFinishedAtIso,
  )
  const freshThrough = Date.parse(
    input.observation.billingExportFreshThroughIso,
  )
  if (
    visualIntelligenceCanonicalJson(actualMetadata)
      !== visualIntelligenceCanonicalJson(expectedMetadata)
    || usageSkuIds.size !== expectedUsageSkuIds.size
    || [...usageSkuIds].some((skuId) => !expectedUsageSkuIds.has(skuId))
    || standardRows.length < 2
    || longRows.length < 2
    || !standardSkuIds.has(expectedTerms[0].skuId)
    || !standardSkuIds.has(expectedTerms[2].skuId)
    || standardSkuIds.size !== 2
    || !longSkuIds.has(expectedTerms[3].skuId)
    || !longSkuIds.has(expectedTerms[5].skuId)
    || longSkuIds.size !== 2
    || !exactLabels
    || freshThrough < finishedAt
    || freshThrough - finishedAt > 7 * 86_400_000
    || input.observation.skuMetadataRows.some((row) =>
      Date.parse(row.pricingAsOfTimeIso) > finishedAt
        || Date.parse(row.exportTimeIso) < Date.parse(row.pricingAsOfTimeIso))
  ) throw new Error(
    'Visual Intelligence billing export did not exactly reconcile model usage.',
  )
}

async function persistExact(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
) {
  const canonical = visualIntelligenceCanonicalJson(value)
  const body = Buffer.from(canonical, 'utf8')
  const rawDigest = createHash('sha256').update(body).digest('hex')
  await objectPort.createOnly({
    objectPath,
    body,
    contentSha256: rawDigest,
  })
  const reread = await objectPort.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw new Error('Billing reconciliation immutable reread changed.')
  }
  return Object.freeze({
    id: createHash('sha256').update(objectPath).digest('hex').slice(0, 48),
    version: 1,
    contentHash: prefixedSha256.parse(`sha256:${rawDigest}`),
  })
}

export function visualIntelligenceBillingQualificationLabel(
  qualificationId: string,
): string {
  return createHash('sha256').update(safeId.parse(qualificationId), 'utf8')
    .digest('hex').slice(0, 32)
}
