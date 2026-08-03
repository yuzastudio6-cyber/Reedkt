import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import type {
  VisualIntelligencePrivateObjectReadPort,
} from './visual-intelligence-private-object-read-port'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_VERSION =
  'visual-intelligence-model-billing-sku-qualification-v1' as const
export const VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION =
  'weeditpro-gemini-3_1-pro-standard-global-sku-catalog-v1' as const
export const VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS =
  200_000 as const

const QUALIFICATION_OBJECT_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/'
const MAXIMUM_QUALIFICATION_BYTES = 512 * 1024

export const VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES = [
  'standard_uncached_input',
  'standard_cached_input',
  'standard_output_and_thinking',
  'long_uncached_input',
  'long_cached_input',
  'long_output_and_thinking',
] as const

export const WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG = {
  providerServiceId: 'services/C7E2-9256-1C43',
  billingSkuFamily: 'gemini_3_0_pro_shared_billing_family',
  consumptionModel: 'consumptionModels/7754-699E-0EBF',
  terms: [
    {
      rateClass: 'standard_uncached_input',
      contextClass: 'standard_le_200k',
      tokenClass: 'uncached_input',
      skuId: 'EAC4-305F-1249',
      expectedDisplayName: 'Gemini 3.0 Pro Text Input - Predictions',
    },
    {
      rateClass: 'standard_cached_input',
      contextClass: 'standard_le_200k',
      tokenClass: 'cached_input',
      skuId: '8308-9CED-8950',
      expectedDisplayName: 'Gemini 3.0 Pro Text Input Caching',
    },
    {
      rateClass: 'standard_output_and_thinking',
      contextClass: 'standard_le_200k',
      tokenClass: 'output_and_thinking',
      skuId: '2737-2D33-D986',
      expectedDisplayName: 'Gemini 3.0 Pro Text Output - Predictions',
    },
    {
      rateClass: 'long_uncached_input',
      contextClass: 'long_gt_200k',
      tokenClass: 'uncached_input',
      skuId: 'E0A5-FB5D-79F4',
      expectedDisplayName:
        'Gemini 3.0 Pro Text Input (Long) - Predictions',
    },
    {
      rateClass: 'long_cached_input',
      contextClass: 'long_gt_200k',
      tokenClass: 'cached_input',
      skuId: '8A47-3936-DC92',
      expectedDisplayName: 'Gemini 3.0 Pro Text Input Caching (Long)',
    },
    {
      rateClass: 'long_output_and_thinking',
      contextClass: 'long_gt_200k',
      tokenClass: 'output_and_thinking',
      skuId: '3CE8-93F8-3C8F',
      expectedDisplayName:
        'Gemini 3.0 Pro Text Output (Long) - Predictions',
    },
  ],
} as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const qualificationWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_VERSION,
  ),
  evidenceClass: z.literal(
    'live_isolated_vertex_usage_and_billing_export_reconciliation',
  ),
  qualificationId: safeId,
  qualificationVersion: positiveInteger,
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  billingSkuFamily: z.literal('gemini_3_0_pro_shared_billing_family'),
  billingSkuCatalogVersion: z.literal(
    VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
  ),
  contextThresholdInputTokens: z.literal(
    VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
  ),
  wholeRequestLongContextRatesRequired: z.literal(true),
  qualifiedRateClasses: z.array(z.enum(
    VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  )).length(6),
  exactSkuIds: z.array(
    z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  ).length(6),
  standardContextProviderRequestRef: evidenceRefSchema,
  longContextProviderRequestRef: evidenceRefSchema,
  standardContextProviderUsageRef: evidenceRefSchema,
  longContextProviderUsageRef: evidenceRefSchema,
  detailedBillingExportRef: evidenceRefSchema,
  billingSkuMetadataSetRef: evidenceRefSchema,
  isolatedUsageReconciliationReportRef: evidenceRefSchema,
  qualificationWindowStartedAtIso: timestamp,
  qualificationWindowFinishedAtIso: timestamp,
  billingExportFreshThroughIso: timestamp,
  liveGeminiStandardContextRequestExecuted: z.literal(true),
  liveGeminiLongContextRequestExecuted: z.literal(true),
  exactReturnedModelIdVerified: z.literal(true),
  exactProviderUsageMetadataReread: z.literal(true),
  isolatedBillingWindowVerified: z.literal(true),
  noOtherModelOrSkuTrafficInObservationWindow: z.literal(true),
  detailedBillingExportExactReread: z.literal(true),
  exactStandardAndLongSkuMappingVerified: z.literal(true),
  publicListPriceUsed: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const expectedRateClasses = [
    ...VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  ]
  const expectedSkuIds =
    WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map((term) =>
      term.skuId)
  const refs = [
    value.standardContextProviderRequestRef,
    value.longContextProviderRequestRef,
    value.standardContextProviderUsageRef,
    value.longContextProviderUsageRef,
    value.detailedBillingExportRef,
    value.billingSkuMetadataSetRef,
    value.isolatedUsageReconciliationReportRef,
  ].map((ref) => `${ref.id}:${ref.version}:${ref.contentHash}`)
  const started = Date.parse(value.qualificationWindowStartedAtIso)
  const finished = Date.parse(value.qualificationWindowFinishedAtIso)
  const exportFreshThrough = Date.parse(value.billingExportFreshThroughIso)
  if (
    visualIntelligenceCanonicalJson(value.qualifiedRateClasses)
      !== visualIntelligenceCanonicalJson(expectedRateClasses)
    || visualIntelligenceCanonicalJson(value.exactSkuIds)
      !== visualIntelligenceCanonicalJson(expectedSkuIds)
    || new Set(refs).size !== refs.length
    || finished <= started
    || finished - started > 3_600_000
    || exportFreshThrough < finished
    || exportFreshThrough - finished > 7 * 86_400_000
  ) context.addIssue({
    code: 'custom',
    message: 'Gemini model-to-billing-SKU qualification is not exact.',
  })
})

const qualificationSchema = qualificationWithoutDigestSchema.extend({
  qualificationDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceModelBillingSkuQualification = z.infer<
  typeof qualificationSchema
>

export function createVisualIntelligenceModelBillingSkuQualification(
  input: z.input<typeof qualificationWithoutDigestSchema>,
): VisualIntelligenceModelBillingSkuQualification {
  const payload = qualificationWithoutDigestSchema.parse(input)
  return Object.freeze(qualificationSchema.parse({
    ...payload,
    qualificationDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceModelBillingSkuQualification(
  value: unknown,
): VisualIntelligenceModelBillingSkuQualification {
  const qualification = qualificationSchema.parse(value)
  const payload = { ...qualification }
  Reflect.deleteProperty(payload, 'qualificationDigestSha256')
  if (qualification.qualificationDigestSha256
    !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence model-to-billing-SKU qualification is invalid.',
    )
  }
  return Object.freeze(qualification)
}

export function visualIntelligenceModelBillingSkuQualificationRef(
  value: VisualIntelligenceModelBillingSkuQualification,
): VisualIntelligenceEvidenceRef {
  const qualification =
    parseVisualIntelligenceModelBillingSkuQualification(value)
  return Object.freeze({
    id: qualification.qualificationId,
    version: qualification.qualificationVersion,
    contentHash: qualification.qualificationDigestSha256,
  })
}

export async function readVisualIntelligenceModelBillingSkuQualification(
  input: {
    readonly projectId: 'reeditpro'
    readonly bucketName: string
    readonly objectName: string
    readonly generation: string
    readonly etag: string
    readonly contentSha256: string
    readonly objectPort: VisualIntelligencePrivateObjectReadPort
  },
): Promise<VisualIntelligenceModelBillingSkuQualification> {
  if (
    input.projectId !== 'reeditpro'
    || !/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u.test(input.bucketName)
    || !input.objectName.startsWith(QUALIFICATION_OBJECT_PREFIX)
    || !input.objectName.endsWith('.json')
    || input.objectName.length > 1_024
    || input.objectName.includes('..')
    || input.objectName.includes('\\')
    || !/^[1-9][0-9]{0,30}$/u.test(input.generation)
    || input.etag.length < 1
    || input.etag.length > 512
    || !/^[a-f0-9]{64}$/u.test(input.contentSha256)
    || !input.objectPort
    || typeof input.objectPort.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence model-to-SKU qualification coordinate is invalid.',
  )
  const stored = await input.objectPort.readExact({
    bucketName: input.bucketName,
    objectName: input.objectName,
    generation: input.generation,
    etag: input.etag,
  })
  if (
    !stored
    || stored.generation !== input.generation
    || stored.etag !== input.etag
    || stored.contentType !== 'application/json'
    || stored.body.byteLength < 2
    || stored.body.byteLength > MAXIMUM_QUALIFICATION_BYTES
    || createHash('sha256').update(stored.body).digest('hex')
      !== input.contentSha256
  ) throw new Error(
    'Visual Intelligence model-to-SKU qualification identity is invalid.',
  )
  let decoded: unknown
  try {
    decoded = JSON.parse(stored.body.toString('utf8')) as unknown
  } catch {
    throw new Error(
      'Visual Intelligence model-to-SKU qualification is not JSON.',
    )
  }
  const qualification =
    parseVisualIntelligenceModelBillingSkuQualification(decoded)
  if (stored.body.toString('utf8')
    !== visualIntelligenceCanonicalJson(qualification)) {
    throw new Error(
      'Visual Intelligence model-to-SKU qualification is not canonical.',
    )
  }
  return qualification
}
