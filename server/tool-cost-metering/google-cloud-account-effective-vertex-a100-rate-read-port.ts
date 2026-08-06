import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  type CanonicalGoogleCloudVertexA100RateRawObservation,
  type CanonicalGoogleCloudVertexA100RateReadPort,
} from './canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG,
} from './google-cloud-account-effective-gpu-rate-read-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_VERTEX_A100_RATE_READER_CONFIGURATION_VERSION =
  'google-cloud-account-effective-vertex-a100-rate-reader-configuration-v1' as const
export const WEEDITPRO_VERTEX_A100_RATE_CATALOG_VERSION =
  'weeditpro-vertex-a100-rate-catalog-us-central1-v1' as const

export const WEEDITPRO_VERTEX_A100_RATE_CATALOG = {
  vertexAi: {
    serviceId: 'services/C7E2-9256-1C43',
    trainingA10080GbAmericasSkuId: '8FFC-6CDE-24D7',
    trainingA2CoreAmericasSkuId: '15A7-BDE1-23EB',
    trainingA2RamAmericasSkuId: 'E7EA-78F1-B4BA',
    trainingPdSsdCapacitySkuId: 'A005-98FE-36CC',
  },
  cloudStorage: WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.cloudStorage,
  defaultConsumptionModel:
    WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.defaultConsumptionModel,
} as const

const BILLING_API_ORIGIN = 'https://cloudbilling.googleapis.com'
const BILLING_READ_SCOPE =
  'https://www.googleapis.com/auth/cloud-billing.readonly'
const MAXIMUM_RESPONSE_BYTES = 2 * 1024 * 1024
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
const componentClassSchema = z.enum([
  'vertex_training_a100_80gb_hour',
  'vertex_training_a2_core_hour',
  'vertex_training_a2_ram_gib_hour',
  'vertex_training_pd_ssd_gib_month',
  'private_object_storage_gib_month',
  'network_egress_gib',
  'object_class_a_per_1000',
  'object_class_b_per_1000',
])
const billingUnitSchema = z.enum([
  'gpu_hour',
  'vcpu_hour',
  'gib_hour',
  'gib_month',
  'gib',
  'per_1000_operations',
])
const termConfigurationSchema = z.object({
  cloudServiceId: z.string().regex(/^services\/[A-Za-z0-9-]+$/u),
  skuId: z.string().regex(/^[A-Za-z0-9-]+$/u),
  consumptionModel: z.string()
    .regex(/^consumptionModels\/[A-Za-z0-9-]+$/u),
  expectedApiUnit: z.enum(['h', 'GiBy.h', 'GiBy.mo', 'GiBy', 'count']),
  expectedApiUnitQuantity: z.enum(['1', '1000']),
  expectedGeoTaxonomy: z.enum([
    'global',
    'multi_region_including_us_central1',
  ]),
}).strict()
const componentConfigurationSchema = z.object({
  componentClass: componentClassSchema,
  cloudServiceName: safeId,
  skuRateBindingId: safeId,
  billingUnit: billingUnitSchema,
  priceTerm: termConfigurationSchema,
}).strict()
const configurationWithoutRefSchema = z.object({
  schemaVersion: z.literal(
    GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_VERTEX_A100_RATE_READER_CONFIGURATION_VERSION,
  ),
  billingAccountResourceName: z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  billingAccountPricingScopeRef: evidenceRefSchema,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
  pricingSetMode: z.literal('vertex_training_payg_usage_skus'),
  region: z.literal('us-central1'),
  components: z.array(componentConfigurationSchema).length(8),
}).strict().superRefine((configuration, context) => {
  const classes = configuration.components.map((component) =>
    component.componentClass)
  const expected = [
    'vertex_training_a100_80gb_hour',
    'vertex_training_a2_core_hour',
    'vertex_training_a2_ram_gib_hour',
    'vertex_training_pd_ssd_gib_month',
    'private_object_storage_gib_month',
    'network_egress_gib',
    'object_class_a_per_1000',
    'object_class_b_per_1000',
  ]
  if (stableAuthorityStringify(classes) !== stableAuthorityStringify(expected)
    || new Set(configuration.components.map((component) =>
      component.priceTerm.skuId)).size !== configuration.components.length) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex A100 reader components are incomplete or duplicated.',
    })
  }
})
const configurationSchema = configurationWithoutRefSchema.extend({
  configurationRef: evidenceRefSchema,
}).strict().superRefine((configuration, context) => {
  const expectedHash = `sha256:${sha256AuthorityValue({
    schemaVersion: configuration.schemaVersion,
    billingAccountPricingScopeRef:
      configuration.billingAccountPricingScopeRef,
    configurationId: configuration.configurationRef.id,
    configurationVersion: configuration.configurationRef.version,
    routeId: configuration.routeId,
    executionTarget: configuration.executionTarget,
    pricingSetMode: configuration.pricingSetMode,
    region: configuration.region,
    components: configuration.components,
  })}`
  if (configuration.configurationRef.contentHash !== expectedHash) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex A100 reader configuration digest is invalid.',
    })
  }
})

export type GoogleCloudAccountEffectiveVertexA100RateReaderConfiguration =
  z.infer<typeof configurationSchema>
type GoogleAuthRequest = {
  request(input: {
    readonly url: string
    readonly method: 'GET'
    readonly params?: Readonly<Record<string, string>>
    readonly timeout: number
    readonly maxRedirects: number
    readonly retry: false
    readonly responseType: 'json'
  }): Promise<{ readonly data: unknown }>
}

export function createWeEditProVertexA100RateReaderConfiguration(input: {
  readonly billingAccountResourceName: string
}): GoogleCloudAccountEffectiveVertexA100RateReaderConfiguration {
  const billingAccountResourceName = z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u)
    .parse(input.billingAccountResourceName)
  const catalog = WEEDITPRO_VERTEX_A100_RATE_CATALOG
  const billingAccountPricingScopeRef = evidenceRefSchema.parse({
    id: 'weeditpro-google-cloud-billing-account-pricing-scope',
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({
      catalogVersion: WEEDITPRO_VERTEX_A100_RATE_CATALOG_VERSION,
      billingAccountResourceName,
    })}`,
  })
  const term = (
    cloudServiceId: string,
    skuId: string,
    expectedApiUnit: 'h' | 'GiBy.h' | 'GiBy.mo' | 'GiBy' | 'count',
    expectedApiUnitQuantity: '1' | '1000',
    expectedGeoTaxonomy:
      | 'global'
      | 'multi_region_including_us_central1',
  ) => ({
    cloudServiceId,
    skuId,
    consumptionModel: catalog.defaultConsumptionModel,
    expectedApiUnit,
    expectedApiUnitQuantity,
    expectedGeoTaxonomy,
  })
  const components = [
    component('vertex_training_a100_80gb_hour', 'vertex-ai',
      'vertex-training-a100-80gb-americas-hour', 'gpu_hour',
      term(catalog.vertexAi.serviceId,
        catalog.vertexAi.trainingA10080GbAmericasSkuId, 'h', '1',
        'multi_region_including_us_central1')),
    component('vertex_training_a2_core_hour', 'vertex-ai',
      'vertex-training-a2-core-americas-hour', 'vcpu_hour',
      term(catalog.vertexAi.serviceId,
        catalog.vertexAi.trainingA2CoreAmericasSkuId, 'h', '1',
        'multi_region_including_us_central1')),
    component('vertex_training_a2_ram_gib_hour', 'vertex-ai',
      'vertex-training-a2-ram-americas-gib-hour', 'gib_hour',
      term(catalog.vertexAi.serviceId,
        catalog.vertexAi.trainingA2RamAmericasSkuId, 'GiBy.h', '1',
        'multi_region_including_us_central1')),
    component('vertex_training_pd_ssd_gib_month', 'vertex-ai',
      'vertex-training-pd-ssd-gib-month', 'gib_month',
      term(catalog.vertexAi.serviceId,
        catalog.vertexAi.trainingPdSsdCapacitySkuId, 'GiBy.mo', '1',
        'multi_region_including_us_central1')),
    component('private_object_storage_gib_month', 'cloud-storage',
      'gcs-standard-us-regional-gib-month', 'gib_month',
      term(catalog.cloudStorage.serviceId,
        catalog.cloudStorage.standardUsRegionalSkuId, 'GiBy.mo', '1',
        'multi_region_including_us_central1')),
    component('network_egress_gib', 'cloud-storage',
      'gcs-download-worldwide-excluding-asia-australia-gib', 'gib',
      term(catalog.cloudStorage.serviceId,
        catalog.cloudStorage.worldwideDownloadExcludingAsiaAustraliaSkuId,
        'GiBy', '1', 'global')),
    component('object_class_a_per_1000', 'cloud-storage',
      'gcs-regional-standard-class-a-per-1000', 'per_1000_operations',
      term(catalog.cloudStorage.serviceId,
        catalog.cloudStorage.regionalStandardClassAOperationsSkuId,
        'count', '1000', 'global')),
    component('object_class_b_per_1000', 'cloud-storage',
      'gcs-regional-standard-class-b-per-1000', 'per_1000_operations',
      term(catalog.cloudStorage.serviceId,
        catalog.cloudStorage.regionalStandardClassBOperationsSkuId,
        'count', '1000', 'global')),
  ] as const
  const payload = configurationWithoutRefSchema.parse({
    schemaVersion:
      GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_VERTEX_A100_RATE_READER_CONFIGURATION_VERSION,
    billingAccountResourceName,
    billingAccountPricingScopeRef,
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    pricingSetMode: 'vertex_training_payg_usage_skus',
    region: 'us-central1',
    components,
  })
  const configurationId = 'weeditpro-vertex-a100-rate-reader-us-central1'
  const configurationVersion = 1
  const configurationRef = evidenceRefSchema.parse({
    id: configurationId,
    version: configurationVersion,
    contentHash: `sha256:${sha256AuthorityValue({
      schemaVersion: payload.schemaVersion,
      billingAccountPricingScopeRef,
      configurationId,
      configurationVersion,
      routeId: payload.routeId,
      executionTarget: payload.executionTarget,
      pricingSetMode: payload.pricingSetMode,
      region: payload.region,
      components: payload.components,
    })}`,
  })
  return configurationSchema.parse({ ...payload, configurationRef })
}

export function createGoogleCloudAccountEffectiveVertexA100RateReadPort(input: {
  readonly configuration:
    GoogleCloudAccountEffectiveVertexA100RateReaderConfiguration
  readonly auth?: GoogleAuthRequest
  readonly now?: () => Date
}): CanonicalGoogleCloudVertexA100RateReadPort {
  const configuration = configurationSchema.parse(input.configuration)
  const auth = input.auth ?? new GoogleAuth({ scopes: [BILLING_READ_SCOPE] })
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    async readCurrentVertexA100Rate() {
      const pricingReadStartedAt = now().toISOString()
      const components = []
      const responseDigests = []
      for (const definition of configuration.components) {
        const metadata = await readJson(auth,
          `${BILLING_API_ORIGIN}/v2beta/skus/${encodeURIComponent(
            definition.priceTerm.skuId,
          )}`)
        const price = await readJson(auth,
          `${BILLING_API_ORIGIN}/v2beta/${
            configuration.billingAccountResourceName
          }/skus/${encodeURIComponent(
            definition.priceTerm.skuId,
          )}/price`, { currencyCode: 'USD' })
        const parsedMetadata = parseMetadata(metadata, definition.priceTerm)
        const parsedPrice = parsePrice(price, {
          billingAccountResourceName:
            configuration.billingAccountResourceName,
          term: definition.priceTerm,
        })
        const metadataDigest = sha256AuthorityValue(metadata)
        const priceDigest = sha256AuthorityValue(price)
        responseDigests.push({
          skuId: definition.priceTerm.skuId,
          metadataDigest,
          priceDigest,
        })
        const skuPriceTerm = {
          cloudServiceId: definition.priceTerm.cloudServiceId,
          skuId: definition.priceTerm.skuId,
          consumptionModel: definition.priceTerm.consumptionModel,
          apiUnit: parsedPrice.apiUnit,
          apiUnitQuantity: parsedPrice.apiUnitQuantity,
          contractPriceTiers: parsedPrice.contractPriceTiers,
          maximumContractPriceUsdNanos:
            parsedPrice.maximumContractPriceUsdNanos,
          skuMetadataRef: {
            id: `gcp-sku-metadata-${definition.priceTerm.skuId}`,
            version: 1,
            contentHash: `sha256:${metadataDigest}`,
          },
          billingAccountPriceRef: {
            id: `gcp-account-price-${definition.priceTerm.skuId}`,
            version: 1,
            contentHash: `sha256:${priceDigest}`,
          },
        }
        components.push({
          componentClass: definition.componentClass,
          cloudServiceName: definition.cloudServiceName,
          skuRateBindingId: definition.skuRateBindingId,
          skuPriceTerm,
          skuDescriptionDigestSha256: sha256AuthorityValue({
            skuId: parsedMetadata.skuId,
            displayName: parsedMetadata.displayName,
            service: parsedMetadata.service,
            metadataDigest,
          }),
          skuRegion: 'us-central1' as const,
          billingUnit: definition.billingUnit,
          maximumUsdNanosPerBillingUnit:
            parsedPrice.maximumContractPriceUsdNanos,
          currentPriceObservedAt: '',
          skuRecordRef: {
            id: `gcp-vertex-price-binding-${definition.componentClass}`,
            version: 1,
            contentHash: `sha256:${sha256AuthorityValue({
              definition,
              skuPriceTerm,
            })}`,
          },
        })
      }
      const pricingReadFinishedAt = now().toISOString()
      const timestampedComponents = components.map((component) => ({
        ...component,
        currentPriceObservedAt: pricingReadFinishedAt,
      }))
      const priceRecordSetRef = {
        id: 'gcp-account-effective-prices-vertex-a100-heavy-primary',
        version: 1,
        contentHash: `sha256:${sha256AuthorityValue({
          configurationRef: configuration.configurationRef,
          billingAccountPricingScopeRef:
            configuration.billingAccountPricingScopeRef,
          responseDigests,
        })}`,
      }
      const raw = {
        sourceClass: 'billing_account_effective_pricing_api' as const,
        billingAccountPricingScopeRef:
          configuration.billingAccountPricingScopeRef,
        pricingReaderConfigurationRef: configuration.configurationRef,
        routeId: configuration.routeId,
        executionTarget: configuration.executionTarget,
        pricingSetMode: configuration.pricingSetMode,
        region: configuration.region,
        currency: 'USD' as const,
        components: timestampedComponents,
        priceRecordSetRef,
        pricingReadStartedAt,
        pricingReadFinishedAt,
      }
      return {
        ...raw,
        pricingReadDigestSha256: sha256AuthorityValue(raw),
      } satisfies CanonicalGoogleCloudVertexA100RateRawObservation
    },
  })
}

function component(
  componentClass: z.infer<typeof componentClassSchema>,
  cloudServiceName: string,
  skuRateBindingId: string,
  billingUnit: z.infer<typeof billingUnitSchema>,
  priceTerm: z.infer<typeof termConfigurationSchema>,
) {
  return {
    componentClass,
    cloudServiceName,
    skuRateBindingId,
    billingUnit,
    priceTerm,
  }
}

async function readJson(
  auth: GoogleAuthRequest,
  url: string,
  params?: Readonly<Record<string, string>>,
): Promise<unknown> {
  let response: { readonly data: unknown }
  try {
    response = await auth.request({
      url,
      method: 'GET',
      params,
      timeout: 15_000,
      maxRedirects: 0,
      retry: false,
      responseType: 'json',
    })
  } catch {
    throw new Error('Vertex A100 account-effective price reread failed.')
  }
  if (Buffer.byteLength(stableAuthorityStringify(response.data), 'utf8') >
    MAXIMUM_RESPONSE_BYTES) {
    throw new Error('Vertex A100 pricing response exceeded its byte bound.')
  }
  return response.data
}

const metadataSchema = z.object({
  name: z.string(),
  skuId: z.string(),
  displayName: z.string().min(1),
  service: z.string(),
  geoTaxonomy: z.object({
    type: z.enum(['TYPE_GLOBAL', 'TYPE_REGIONAL', 'TYPE_MULTI_REGIONAL']),
    multiRegionalMetadata: z.object({
      regions: z.array(z.object({ region: z.string() }).passthrough()),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough()

function parseMetadata(
  raw: unknown,
  term: z.infer<typeof termConfigurationSchema>,
) {
  const metadata = metadataSchema.parse(raw)
  const geoMatches = term.expectedGeoTaxonomy === 'global'
    ? metadata.geoTaxonomy.type === 'TYPE_GLOBAL'
    : metadata.geoTaxonomy.type === 'TYPE_MULTI_REGIONAL'
      && metadata.geoTaxonomy.multiRegionalMetadata?.regions.some((region) =>
        region.region === 'us-central1') === true
  if (
    metadata.name !== `skus/${term.skuId}`
    || metadata.skuId !== term.skuId
    || metadata.service !== term.cloudServiceId
    || !geoMatches
  ) throw new Error('Vertex A100 SKU metadata differs from its route.')
  return metadata
}

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

function parsePrice(raw: unknown, input: {
  billingAccountResourceName: string
  term: z.infer<typeof termConfigurationSchema>
}) {
  const price = accountPriceSchema.parse(raw)
  const matches = price.skuPrices.filter((candidate) =>
    candidate.consumptionModel === input.term.consumptionModel)
  if (
    price.name !== `${input.billingAccountResourceName}/skus/${
      input.term.skuId
    }/price`
    || price.currencyCode !== 'USD'
    || matches.length !== 1
    || matches[0].valueType !== 'rate'
    || matches[0].rate === undefined
  ) throw new Error('Vertex A100 account-effective price is not exact.')
  const rate = matches[0].rate
  const apiUnitQuantity = normalizeDecimal(rate.unitInfo.unitQuantity.value)
  if (
    rate.unitInfo.unit !== input.term.expectedApiUnit
    || apiUnitQuantity !== input.term.expectedApiUnitQuantity
  ) throw new Error('Vertex A100 account price unit changed.')
  const contractPriceTiers = rate.tiers.map((tier) => ({
    startAmount: normalizeDecimal(tier.startAmount.value, true),
    contractPriceUsdNanos: moneyToUsdNanos(tier.contractPrice),
  }))
  if (
    contractPriceTiers[0].startAmount !== '0'
    || !contractPriceTiers.every((tier, index) => index === 0
      || compareDecimals(
        contractPriceTiers[index - 1].startAmount,
        tier.startAmount,
      ) < 0)
  ) throw new Error('Vertex A100 account price tiers are invalid.')
  return {
    apiUnit: rate.unitInfo.unit,
    apiUnitQuantity,
    contractPriceTiers,
    maximumContractPriceUsdNanos: Math.max(
      ...contractPriceTiers.map((tier) => tier.contractPriceUsdNanos),
    ),
  }
}

function moneyToUsdNanos(money: z.infer<typeof moneySchema>): number {
  if (money.currencyCode !== 'USD') {
    throw new Error('Vertex A100 price currency changed.')
  }
  const total = BigInt(money.units ?? '0') * 1_000_000_000n
    + BigInt(money.nanos ?? 0)
  if (total < 0n || total > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Vertex A100 price cannot be represented exactly.')
  }
  return Number(total)
}

function normalizeDecimal(value = '', allowZero = false): string {
  if (value === '') {
    if (allowZero) return '0'
    throw new Error('Vertex A100 decimal must be positive.')
  }
  const match = /^([+]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/u.exec(value)
  if (!match || (match[2] === '' && match[3] === '')) {
    throw new Error('Vertex A100 decimal is malformed.')
  }
  const exponent = Number.parseInt(match[4] ?? '0', 10)
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) {
    throw new Error('Vertex A100 decimal exponent is out of bounds.')
  }
  const whole = match[2] || '0'
  const fraction = match[3] ?? ''
  const digits = `${whole}${fraction}`
  const position = whole.length + exponent
  const expanded = position <= 0
    ? `0.${'0'.repeat(-position)}${digits}`
    : position >= digits.length
      ? `${digits}${'0'.repeat(position - digits.length)}`
      : `${digits.slice(0, position)}.${digits.slice(position)}`
  const [expandedWhole, expandedFraction = ''] = expanded.split('.')
  const normalizedWhole = expandedWhole.replace(/^0+(?=\d)/u, '') || '0'
  const normalizedFraction = expandedFraction.replace(/0+$/u, '')
  const normalized = normalizedFraction === ''
    ? normalizedWhole
    : `${normalizedWhole}.${normalizedFraction}`
  if (!allowZero && normalized === '0') {
    throw new Error('Vertex A100 decimal must be positive.')
  }
  return normalized
}

function compareDecimals(left: string, right: string): number {
  const [leftWhole, leftFraction = ''] = left.split('.')
  const [rightWhole, rightFraction = ''] = right.split('.')
  const scale = Math.max(leftFraction.length, rightFraction.length)
  const leftValue = BigInt(`${leftWhole}${leftFraction.padEnd(scale, '0')}`)
  const rightValue = BigInt(`${rightWhole}${rightFraction.padEnd(scale, '0')}`)
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0
}
