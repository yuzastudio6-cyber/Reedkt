import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceAccountEffectiveRateAuthorityFromPricingObservation,
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_VERSION,
  VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
  VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
  type VisualIntelligenceAccountEffectiveRateAuthority,
} from './visual-intelligence-account-effective-cost-owner'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
  parseVisualIntelligenceModelBillingSkuQualification,
  visualIntelligenceModelBillingSkuQualificationRef,
  type VisualIntelligenceModelBillingSkuQualification,
} from './visual-intelligence-model-billing-sku-qualification'

export {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from './visual-intelligence-model-billing-sku-qualification'

export const VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_READER_CONFIGURATION_VERSION =
  'visual-intelligence-account-effective-rate-reader-configuration-v1' as const

const BILLING_API_ORIGIN = 'https://cloudbilling.googleapis.com'
const BILLING_READ_SCOPE =
  'https://www.googleapis.com/auth/cloud-billing.readonly'
const MAXIMUM_RESPONSE_BYTES = 2 * 1024 * 1024
const MAXIMUM_PRICE_READ_MS = 60_000

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)

const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const catalogTermSchema = z.object({
  rateClass: z.enum([
    'standard_uncached_input',
    'standard_cached_input',
    'standard_output_and_thinking',
    'long_uncached_input',
    'long_cached_input',
    'long_output_and_thinking',
  ]),
  contextClass: z.enum(['standard_le_200k', 'long_gt_200k']),
  tokenClass: z.enum([
    'uncached_input',
    'cached_input',
    'output_and_thinking',
  ]),
  cloudServiceId: z.literal('services/C7E2-9256-1C43'),
  skuId: z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  expectedDisplayName: z.string().trim().min(1).max(240),
  consumptionModel: z.literal('consumptionModels/7754-699E-0EBF'),
  expectedApiUnit: z.literal('count'),
  expectedApiUnitQuantity: z.literal('1000000'),
  expectedGeoType: z.literal('TYPE_GLOBAL'),
}).strict()

const configurationWithoutRefSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_READER_CONFIGURATION_VERSION,
  ),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  billingAccountResourceName: z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  billingAccountPricingScopeRef: evidenceRefSchema,
  exactModelBillingSkuCompatibilityQualificationRef: evidenceRefSchema,
  billingSkuCatalogVersion: z.literal(
    VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
  ),
  contextThresholdInputTokens: z.literal(
    VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
  ),
  terms: z.array(catalogTermSchema).length(6),
}).strict().superRefine((configuration, context) => {
  const exactCatalog = WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms
    .map((term) => ({
      ...term,
      cloudServiceId:
        WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.providerServiceId,
      consumptionModel:
        WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.consumptionModel,
      expectedApiUnit: 'count' as const,
      expectedApiUnitQuantity: '1000000' as const,
      expectedGeoType: 'TYPE_GLOBAL' as const,
    }))
  if (visualIntelligenceCanonicalJson(configuration.terms)
    !== visualIntelligenceCanonicalJson(exactCatalog)) {
    context.addIssue({
      code: 'custom',
      message: 'Visual Intelligence pricing SKU catalog changed.',
    })
  }
})

const configurationSchema = configurationWithoutRefSchema.extend({
  configurationRef: evidenceRefSchema,
}).strict().superRefine((configuration, context) => {
  const expectedHash = visualIntelligenceDigest({
    schemaVersion: configuration.schemaVersion,
    exactModelId: configuration.exactModelId,
    vertexLocation: configuration.vertexLocation,
    throughputClass: configuration.throughputClass,
    billingAccountResourceName: configuration.billingAccountResourceName,
    billingAccountPricingScopeRef:
      configuration.billingAccountPricingScopeRef,
    exactModelBillingSkuCompatibilityQualificationRef:
      configuration.exactModelBillingSkuCompatibilityQualificationRef,
    billingSkuCatalogVersion: configuration.billingSkuCatalogVersion,
    contextThresholdInputTokens: configuration.contextThresholdInputTokens,
    terms: configuration.terms,
    configurationId: configuration.configurationRef.id,
    configurationVersion: configuration.configurationRef.version,
  })
  if (configuration.configurationRef.contentHash !== expectedHash) {
    context.addIssue({
      code: 'custom',
      message: 'Visual Intelligence pricing reader configuration is invalid.',
    })
  }
})

export type VisualIntelligenceAccountEffectiveRateReaderConfiguration = z.infer<
  typeof configurationSchema
>

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface VisualIntelligenceAccountEffectivePricingObservationPort {
  readCurrent(input: {
    readonly pricingApiObservationId: string
    readonly pricingApiObservationVersion: number
  }): Promise<VisualIntelligenceAccountEffectiveRateAuthority>
}

export function createWeEditProVisualIntelligenceAccountEffectiveRateReaderConfiguration(
  input: {
    readonly billingAccountResourceName: string
    readonly exactModelBillingSkuCompatibilityQualification:
      VisualIntelligenceModelBillingSkuQualification
  },
): VisualIntelligenceAccountEffectiveRateReaderConfiguration {
  const billingAccountResourceName = z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u)
    .parse(input.billingAccountResourceName)
  const qualification =
    parseVisualIntelligenceModelBillingSkuQualification(
      input.exactModelBillingSkuCompatibilityQualification,
    )
  const qualificationRef = evidenceRefSchema.parse(
    visualIntelligenceModelBillingSkuQualificationRef(qualification),
  )
  const billingAccountPricingScopeRef = createVisualIntelligenceEvidenceRef(
    'weeditpro-google-cloud-billing-account-pricing-scope',
    {
      billingSkuCatalogVersion:
        VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
      billingAccountResourceName,
    },
  )
  const raw = configurationWithoutRefSchema.parse({
    schemaVersion:
      VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_READER_CONFIGURATION_VERSION,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    vertexLocation: 'global',
    throughputClass: 'standard',
    billingAccountResourceName,
    billingAccountPricingScopeRef,
    exactModelBillingSkuCompatibilityQualificationRef: qualificationRef,
    billingSkuCatalogVersion:
      VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
    contextThresholdInputTokens:
      VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
    terms: WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map(
      (term) => ({
        ...term,
        cloudServiceId:
          WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.providerServiceId,
        consumptionModel:
          WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.consumptionModel,
        expectedApiUnit: 'count',
        expectedApiUnitQuantity: '1000000',
        expectedGeoType: 'TYPE_GLOBAL',
      }),
    ),
  })
  const configurationId =
    'weeditpro-gemini-3-1-pro-account-effective-rate-reader-global'
  const configurationVersion = 1
  return configurationSchema.parse({
    ...raw,
    configurationRef: {
      id: configurationId,
      version: configurationVersion,
      contentHash: visualIntelligenceDigest({
        ...raw,
        configurationId,
        configurationVersion,
      }),
    },
  })
}

export function createVisualIntelligenceAccountEffectivePricingObservationPort(
  input: {
    readonly configuration:
      VisualIntelligenceAccountEffectiveRateReaderConfiguration
    readonly auth?: GoogleAuthRequest
    readonly now?: () => Date
  },
): VisualIntelligenceAccountEffectivePricingObservationPort {
  const configuration = configurationSchema.parse(input.configuration)
  const auth = input.auth ?? new GoogleAuth({ scopes: [BILLING_READ_SCOPE] })
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    async readCurrent(observationIdentity: {
      readonly pricingApiObservationId: string
      readonly pricingApiObservationVersion: number
    }) {
      const pricingApiObservationId = safeId.parse(
        observationIdentity.pricingApiObservationId,
      )
      const pricingApiObservationVersion = positiveInteger.parse(
        observationIdentity.pricingApiObservationVersion,
      )
      const priceReadStartedAtIso = now().toISOString()
      const terms = []
      const responseDigests = []
      for (const term of configuration.terms) {
        const skuMetadata = await readJson(auth, {
          url: `${BILLING_API_ORIGIN}/v2beta/skus/${term.skuId}`,
        })
        const accountPrice = await readJson(auth, {
          url: `${BILLING_API_ORIGIN}/v2beta/${
            configuration.billingAccountResourceName
          }/skus/${term.skuId}/price`,
          params: { currencyCode: 'USD' },
        })
        const metadata = parseExactSkuMetadata(skuMetadata, term)
        const price = parseExactAccountPrice(
          accountPrice,
          configuration.billingAccountResourceName,
          term,
        )
        const skuMetadataDigest = visualIntelligenceDigest(skuMetadata)
        const billingAccountPriceDigest =
          visualIntelligenceDigest(accountPrice)
        responseDigests.push({
          rateClass: term.rateClass,
          skuId: term.skuId,
          skuMetadataDigest,
          billingAccountPriceDigest,
        })
        terms.push({
          rateClass: term.rateClass,
          contextClass: term.contextClass,
          tokenClass: term.tokenClass,
          cloudServiceId: term.cloudServiceId,
          skuId: term.skuId,
          skuDisplayName: metadata.displayName,
          consumptionModel: term.consumptionModel,
          apiUnit: price.apiUnit,
          apiUnitQuantity: price.apiUnitQuantity,
          contractPriceUsdNanosPerMillionTokens:
            price.contractPriceUsdNanosPerMillionTokens,
          skuMetadataRef: {
            id: `gcp-sku-metadata-${term.skuId}`,
            version: 1,
            contentHash: skuMetadataDigest,
          },
          billingAccountPriceRef: {
            id: `gcp-account-price-${term.skuId}`,
            version: 1,
            contentHash: billingAccountPriceDigest,
          },
          accountEffectiveContractPriceUsed: true as const,
          publicListPriceUsed: false as const,
        })
      }
      const priceReadFinishedAtIso = now().toISOString()
      const elapsed = Date.parse(priceReadFinishedAtIso)
        - Date.parse(priceReadStartedAtIso)
      if (elapsed < 0 || elapsed > MAXIMUM_PRICE_READ_MS) {
        throw new Error('Visual Intelligence pricing reread exceeded its bound.')
      }
      const pricingApiObservationRef = createVisualIntelligenceEvidenceRef(
        pricingApiObservationId,
        {
          pricingApiObservationVersion,
          pricingReaderConfigurationRef: configuration.configurationRef,
          billingAccountPricingScopeRef:
            configuration.billingAccountPricingScopeRef,
          exactModelBillingSkuCompatibilityQualificationRef:
            configuration.exactModelBillingSkuCompatibilityQualificationRef,
          exactModelId: configuration.exactModelId,
          responseDigests,
          terms,
          priceReadStartedAtIso,
          priceReadFinishedAtIso,
        },
        pricingApiObservationVersion,
      )
      return createVisualIntelligenceAccountEffectiveRateAuthorityFromPricingObservation({
        schemaVersion: VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_VERSION,
        evidenceClass: 'billing_account_effective_pricing_api_reread',
        billingAccountPricingScopeRef:
          configuration.billingAccountPricingScopeRef,
        pricingReaderConfigurationRef: configuration.configurationRef,
        pricingApiObservationRef,
        exactModelBillingSkuCompatibilityQualificationRef:
          configuration.exactModelBillingSkuCompatibilityQualificationRef,
        exactModelId: configuration.exactModelId,
        providerServiceId:
          WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.providerServiceId,
        billingSkuFamily:
          WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.billingSkuFamily,
        billingSkuCatalogVersion: configuration.billingSkuCatalogVersion,
        throughputClass: configuration.throughputClass,
        contextThresholdInputTokens:
          configuration.contextThresholdInputTokens,
        wholeRequestLongContextRatesRequired: true,
        currency: 'USD',
        rateUnit: 'usd_nanos_per_million_tokens',
        accountEffectiveSkuPriceTerms: terms,
        priceReadStartedAtIso,
        priceReadFinishedAtIso,
        effectiveAtIso: priceReadFinishedAtIso,
        expiresAtIso: new Date(
          Date.parse(priceReadFinishedAtIso) + 86_400_000,
        ).toISOString(),
        exactSkuMetadataAndAccountPriceReread: true,
        billingAccountEffectiveRateUsed: true,
        publicListPriceUsed: false,
        customerPriceOrServiceFeeAuthorityGranted: false,
        walletMutationAuthorityGranted: false,
      })
    },
  })
}

async function readJson(
  auth: GoogleAuthRequest,
  input: {
    readonly url: string
    readonly params?: Readonly<Record<string, string>>
  },
): Promise<unknown> {
  let response: { readonly data: unknown }
  try {
    response = await auth.request<unknown>({
      url: input.url,
      method: 'GET',
      params: input.params,
      timeout: 15_000,
      maxRedirects: 0,
      retry: false,
      responseType: 'json',
    })
  } catch {
    throw new Error(
      'Visual Intelligence billing-account-effective price reread failed.',
    )
  }
  if (Buffer.byteLength(
    visualIntelligenceCanonicalJson(response.data),
    'utf8',
  ) > MAXIMUM_RESPONSE_BYTES) {
    throw new Error('Visual Intelligence pricing response exceeded its bound.')
  }
  return response.data
}

const skuMetadataSchema = z.object({
  name: z.string(),
  skuId: z.string(),
  displayName: z.string().min(1),
  service: z.string(),
  geoTaxonomy: z.object({
    type: z.string(),
  }).passthrough(),
}).passthrough()

const decimalSchema = z.object({ value: z.string().optional() }).passthrough()
const moneySchema = z.object({
  currencyCode: z.string(),
  units: z.string().optional(),
  nanos: z.number().int().optional(),
}).passthrough()
const accountPriceSchema = z.object({
  name: z.string(),
  currencyCode: z.string(),
  skuPrices: z.array(z.object({
    consumptionModel: z.string(),
    valueType: z.string(),
    rate: z.object({
      tiers: z.array(z.object({
        startAmount: decimalSchema,
        contractPrice: moneySchema,
      }).passthrough()).min(1).max(16),
      unitInfo: z.object({
        unit: z.string(),
        unitQuantity: decimalSchema,
      }).passthrough(),
    }).passthrough().optional(),
  }).passthrough()).min(1).max(32),
}).passthrough()

function parseExactSkuMetadata(
  raw: unknown,
  term: z.infer<typeof catalogTermSchema>,
) {
  const sku = skuMetadataSchema.parse(raw)
  if (
    sku.name !== `skus/${term.skuId}`
    || sku.skuId !== term.skuId
    || sku.displayName !== term.expectedDisplayName
    || sku.service !== term.cloudServiceId
    || sku.geoTaxonomy.type !== term.expectedGeoType
  ) throw new Error('Visual Intelligence billing SKU metadata changed.')
  return sku
}

function parseExactAccountPrice(
  raw: unknown,
  billingAccountResourceName: string,
  term: z.infer<typeof catalogTermSchema>,
) {
  const accountPrice = accountPriceSchema.parse(raw)
  const matches = accountPrice.skuPrices.filter((price) =>
    price.consumptionModel === term.consumptionModel)
  if (
    accountPrice.name !== `${billingAccountResourceName}/skus/${
      term.skuId
    }/price`
    || accountPrice.currencyCode !== 'USD'
    || matches.length !== 1
    || matches[0].valueType !== 'rate'
    || matches[0].rate === undefined
  ) throw new Error('Visual Intelligence account price is not exact.')
  const rate = matches[0].rate
  const apiUnitQuantity = normalizePositiveDecimal(
    rate.unitInfo.unitQuantity.value,
  )
  if (
    rate.unitInfo.unit !== term.expectedApiUnit
    || apiUnitQuantity !== term.expectedApiUnitQuantity
    || rate.tiers.length !== 1
    || normalizeNonnegativeDecimal(rate.tiers[0].startAmount.value) !== '0'
  ) throw new Error('Visual Intelligence account price unit or tier changed.')
  return {
    apiUnit: term.expectedApiUnit,
    apiUnitQuantity,
    contractPriceUsdNanosPerMillionTokens:
      moneyToNonnegativeUsdNanos(rate.tiers[0].contractPrice),
  }
}

function moneyToNonnegativeUsdNanos(
  money: z.infer<typeof moneySchema>,
): number {
  if (money.currencyCode !== 'USD') {
    throw new Error('Visual Intelligence price currency changed.')
  }
  const units = BigInt(money.units ?? '0')
  const nanos = BigInt(money.nanos ?? 0)
  const total = units * 1_000_000_000n + nanos
  if (
    total < 0n
    || total > BigInt(Number.MAX_SAFE_INTEGER)
    || (units > 0n && nanos < 0n)
    || (units < 0n && nanos > 0n)
  ) throw new Error('Visual Intelligence price is not exactly representable.')
  return Number(total)
}

function normalizePositiveDecimal(value?: string): string {
  const normalized = normalizeDecimal(value)
  if (normalized === '0') {
    throw new Error('Visual Intelligence price quantity must be positive.')
  }
  return normalized
}

function normalizeNonnegativeDecimal(value?: string): string {
  return normalizeDecimal(value)
}

function normalizeDecimal(value = ''): string {
  const match = /^(\+?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/u.exec(value)
  if (match === null || (match[2] === '' && match[3] === '')) {
    throw new Error('Visual Intelligence pricing decimal is malformed.')
  }
  const exponent = Number.parseInt(match[4] ?? '0', 10)
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) {
    throw new Error('Visual Intelligence pricing decimal is out of bounds.')
  }
  const whole = match[2] || '0'
  const fraction = match[3] ?? ''
  const digits = `${whole}${fraction}`
  const decimalPosition = whole.length + exponent
  const expanded = decimalPosition <= 0
    ? `0.${'0'.repeat(-decimalPosition)}${digits}`
    : decimalPosition >= digits.length
      ? `${digits}${'0'.repeat(decimalPosition - digits.length)}`
      : `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`
  const [expandedWhole, expandedFraction = ''] = expanded.split('.')
  const normalizedWhole = expandedWhole.replace(/^0+(?=\d)/u, '') || '0'
  const normalizedFraction = expandedFraction.replace(/0+$/u, '')
  return normalizedFraction === ''
    ? normalizedWhole
    : `${normalizedWhole}.${normalizedFraction}`
}
