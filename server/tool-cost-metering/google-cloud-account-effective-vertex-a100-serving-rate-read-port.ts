import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
  type CanonicalGoogleCloudVertexA100ServingRateRawObservation,
  type CanonicalGoogleCloudVertexA100ServingRateReadPort,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG,
} from './google-cloud-account-effective-gpu-rate-read-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_VERTEX_A100_SERVING_RATE_READER_CONFIGURATION_VERSION =
  'google-cloud-account-effective-vertex-a100-serving-rate-reader-configuration-v1' as const
export const WEEDITPRO_VERTEX_A100_SERVING_RATE_CATALOG_VERSION =
  'weeditpro-vertex-a100-serving-rate-catalog-us-central1-v2' as const

export const WEEDITPRO_VERTEX_A100_SERVING_RATE_CATALOG = {
  vertexAi: {
    serviceId: 'services/C7E2-9256-1C43',
    predictionA10080GbIowaSkuId: '72B6-EE31-7A41',
    predictionA2CoreAmericasSkuId: 'F86F-168E-2FB6',
    predictionA2RamAmericasSkuId: '2DBC-2378-4503',
    predictionManagementA2CoreIowaSkuId: 'F559-0525-B823',
    predictionManagementA2RamIowaSkuId: '8714-C1C7-9ABD',
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
const refSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const componentClassSchema = z.enum(
  CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
)
const termSchema = z.object({
  cloudServiceId: z.string().regex(/^services\/[A-Za-z0-9-]+$/u),
  skuId: z.string().regex(/^[A-Za-z0-9-]+$/u),
  consumptionModel: z.string()
    .regex(/^consumptionModels\/[A-Za-z0-9-]+$/u),
  expectedDisplayName: z.string().trim().min(1).max(240),
  expectedApiUnit: z.enum(['h', 'GiBy.h', 'GiBy.mo', 'GiBy', 'count']),
  expectedApiUnitQuantity: z.enum(['1', '1000']),
  expectedGeoTaxonomy: z.enum([
    'route_region',
    'global',
    'multi_region_including_route_region',
  ]),
}).strict()
const componentSchema = z.object({
  componentClass: componentClassSchema,
  cloudServiceName: safeId,
  skuRateBindingId: safeId,
  billingUnit: z.enum([
    'gpu_hour',
    'vcpu_hour',
    'gib_hour',
    'gib_month',
    'gib',
    'per_1000_operations',
  ]),
  priceTerm: termSchema,
}).strict()
const configurationWithoutRefSchema = z.object({
  schemaVersion: z.literal(
    GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_VERTEX_A100_SERVING_RATE_READER_CONFIGURATION_VERSION,
  ),
  billingAccountResourceName: z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  billingAccountPricingScopeRef: refSchema,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  pricingSetMode: z.literal(
    'vertex_online_prediction_usage_plus_management_skus',
  ),
  region: z.literal('us-central1'),
  components: z.array(componentSchema).length(9),
}).strict().superRefine((configuration, context) => {
  const classes = configuration.components.map((component) =>
    component.componentClass)
  const skuIds = configuration.components.map((component) =>
    component.priceTerm.skuId)
  if (stableAuthorityStringify(classes) !== stableAuthorityStringify(
    CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
  ) || new Set(skuIds).size !== skuIds.length) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 serving rate configuration changed.',
  })
})
const configurationSchema = configurationWithoutRefSchema.extend({
  configurationRef: refSchema,
}).strict().superRefine((configuration, context) => {
  const expected = `sha256:${sha256AuthorityValue({
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
  if (configuration.configurationRef.contentHash !== expected) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex A100 serving reader configuration digest changed.',
    })
  }
})

export type GoogleCloudAccountEffectiveVertexA100ServingRateReaderConfiguration =
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

export function createWeEditProVertexA100ServingRateReaderConfiguration(input: {
  readonly billingAccountResourceName: string
}): GoogleCloudAccountEffectiveVertexA100ServingRateReaderConfiguration {
  const billingAccountResourceName = z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u)
    .parse(input.billingAccountResourceName)
  const catalog = WEEDITPRO_VERTEX_A100_SERVING_RATE_CATALOG
  const billingAccountPricingScopeRef = refSchema.parse({
    id: 'weeditpro-google-cloud-billing-account-pricing-scope',
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({
      catalogVersion: WEEDITPRO_VERTEX_A100_SERVING_RATE_CATALOG_VERSION,
      billingAccountResourceName,
    })}`,
  })
  const term = (
    skuId: string,
    expectedDisplayName: string,
    expectedApiUnit: 'h' | 'GiBy.h' | 'GiBy.mo' | 'GiBy' | 'count',
    expectedApiUnitQuantity: '1' | '1000',
    expectedGeoTaxonomy:
      | 'route_region'
      | 'global'
      | 'multi_region_including_route_region',
    cloudServiceId: string = catalog.vertexAi.serviceId,
  ) => ({
    cloudServiceId,
    skuId,
    consumptionModel: catalog.defaultConsumptionModel,
    expectedDisplayName,
    expectedApiUnit,
    expectedApiUnitQuantity,
    expectedGeoTaxonomy,
  })
  const storage = catalog.cloudStorage
  const components = [
    component('vertex_prediction_a100_80gb_hour', 'vertex-ai',
      'vertex-prediction-a100-80gb-columbus-hour', 'gpu_hour', term(
        catalog.vertexAi.predictionA10080GbIowaSkuId,
        'Vertex AI: Online/Batch Prediction Nvidia A100 80gb GPU running in Iowa',
        'h', '1', 'route_region')),
    component('vertex_prediction_a2_core_hour', 'vertex-ai',
      'vertex-prediction-a2-core-columbus-hour', 'vcpu_hour', term(
        catalog.vertexAi.predictionA2CoreAmericasSkuId,
        'Vertex AI: Online/Batch Prediction A2 Instance Core running in Americas',
        'h', '1', 'multi_region_including_route_region')),
    component('vertex_prediction_a2_ram_gib_hour', 'vertex-ai',
      'vertex-prediction-a2-ram-columbus-gib-hour', 'gib_hour', term(
        catalog.vertexAi.predictionA2RamAmericasSkuId,
        'Vertex AI: Online/Batch Prediction A2 Instance Ram running in Americas',
        'GiBy.h', '1', 'multi_region_including_route_region')),
    component('vertex_prediction_management_a2_core_hour', 'vertex-ai',
      'vertex-prediction-management-a2-core-columbus-hour', 'vcpu_hour', term(
        catalog.vertexAi.predictionManagementA2CoreIowaSkuId,
        'Vertex AI: Online/Batch Prediction management fee on A2 Instance Core in Iowa',
        'h', '1', 'route_region')),
    component('vertex_prediction_management_a2_ram_gib_hour', 'vertex-ai',
      'vertex-prediction-management-a2-ram-columbus-gib-hour', 'gib_hour', term(
        catalog.vertexAi.predictionManagementA2RamIowaSkuId,
        'Vertex AI: Online/Batch Prediction management fee on A2 Instance RAM in Iowa',
        'GiBy.h', '1', 'route_region')),
    component('private_object_storage_gib_month', 'cloud-storage',
      'gcs-standard-us-regional-gib-month', 'gib_month', term(
        storage.standardUsRegionalSkuId,
        'Standard Storage US Regional', 'GiBy.mo', '1',
        'multi_region_including_route_region', storage.serviceId)),
    component('network_egress_gib', 'cloud-storage',
      'gcs-download-worldwide-excluding-asia-australia-gib', 'gib', term(
        storage.worldwideDownloadExcludingAsiaAustraliaSkuId,
        'Download Worldwide Destinations (excluding Asia & Australia)',
        'GiBy', '1', 'global', storage.serviceId)),
    component('object_class_a_per_1000', 'cloud-storage',
      'gcs-regional-standard-class-a-per-1000', 'per_1000_operations', term(
        storage.regionalStandardClassAOperationsSkuId,
        'Regional Standard Class A Operations', 'count', '1000', 'global',
        storage.serviceId)),
    component('object_class_b_per_1000', 'cloud-storage',
      'gcs-regional-standard-class-b-per-1000', 'per_1000_operations', term(
        storage.regionalStandardClassBOperationsSkuId,
        'Regional Standard Class B Operations', 'count', '1000', 'global',
        storage.serviceId)),
  ]
  const raw = configurationWithoutRefSchema.parse({
    schemaVersion:
      GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_VERTEX_A100_SERVING_RATE_READER_CONFIGURATION_VERSION,
    billingAccountResourceName,
    billingAccountPricingScopeRef,
    routeId: 'a100_80gb_heavy_primary',
    executionTarget:
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
    pricingSetMode: 'vertex_online_prediction_usage_plus_management_skus',
    region: 'us-central1',
    components,
  })
  const configurationId =
    'weeditpro-vertex-a100-serving-rate-reader-us-central1'
  const configurationVersion = 1
  return configurationSchema.parse({
    ...raw,
    configurationRef: {
      id: configurationId,
      version: configurationVersion,
      contentHash: `sha256:${sha256AuthorityValue({
        schemaVersion: raw.schemaVersion,
        billingAccountPricingScopeRef: raw.billingAccountPricingScopeRef,
        configurationId,
        configurationVersion,
        routeId: raw.routeId,
        executionTarget: raw.executionTarget,
        pricingSetMode: raw.pricingSetMode,
        region: raw.region,
        components: raw.components,
      })}`,
    },
  })
}

export function createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort(
  input: {
    readonly configuration:
      GoogleCloudAccountEffectiveVertexA100ServingRateReaderConfiguration
    readonly auth?: GoogleAuthRequest
    readonly now?: () => Date
  },
): CanonicalGoogleCloudVertexA100ServingRateReadPort {
  const configuration = configurationSchema.parse(input.configuration)
  const auth = input.auth ?? new GoogleAuth({ scopes: [BILLING_READ_SCOPE] })
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    async readCurrentVertexA100ServingRate() {
      const pricingReadStartedAt = now().toISOString()
      const components = []
      const responseDigests = []
      for (const configured of configuration.components) {
        const metadata = await readJson(auth, {
          url: `${BILLING_API_ORIGIN}/v2beta/skus/${
            configured.priceTerm.skuId}`,
        })
        const accountPrice = await readJson(auth, {
          url: `${BILLING_API_ORIGIN}/v2beta/${
            configuration.billingAccountResourceName}/skus/${
            configured.priceTerm.skuId}/price`,
          params: { currencyCode: 'USD' },
        })
        const sku = parseSkuMetadata(metadata, configured.priceTerm)
        const price = parseAccountPrice(
          accountPrice,
          configuration.billingAccountResourceName,
          configured.priceTerm,
        )
        const skuMetadataRef = evidenceRef(
          `gcp-sku-metadata-${configured.priceTerm.skuId}`,
          metadata,
        )
        const billingAccountPriceRef = evidenceRef(
          `gcp-account-price-${configured.priceTerm.skuId}`,
          accountPrice,
        )
        const skuRecordRef = evidenceRef(
          `gcp-serving-sku-record-${configured.priceTerm.skuId}`,
          { configured, skuMetadataRef, billingAccountPriceRef, price },
        )
        components.push({
          componentClass: configured.componentClass,
          cloudServiceName: configured.cloudServiceName,
          skuRateBindingId: configured.skuRateBindingId,
          skuPriceTerm: {
            cloudServiceId: configured.priceTerm.cloudServiceId,
            skuId: configured.priceTerm.skuId,
            consumptionModel: configured.priceTerm.consumptionModel,
            apiUnit: configured.priceTerm.expectedApiUnit,
            apiUnitQuantity: configured.priceTerm.expectedApiUnitQuantity,
            contractPriceTiers: price.tiers,
            maximumContractPriceUsdNanos: price.maximum,
            skuMetadataRef,
            billingAccountPriceRef,
          },
          skuDescriptionDigestSha256: createHash('sha256')
            .update(sku.displayName, 'utf8').digest('hex'),
          skuRegion: 'us-central1' as const,
          billingUnit: configured.billingUnit,
          maximumUsdNanosPerBillingUnit: price.maximum,
          currentPriceObservedAt: pricingReadStartedAt,
          skuRecordRef,
        })
        responseDigests.push({
          componentClass: configured.componentClass,
          skuMetadataRef,
          billingAccountPriceRef,
        })
      }
      const pricingReadFinishedAt = now().toISOString()
      if (Date.parse(pricingReadFinishedAt) -
        Date.parse(pricingReadStartedAt) > 60_000) {
        throw new Error('Vertex A100 serving price reread exceeded its bound.')
      }
      const priceRecordSetRef = evidenceRef(
        'weeditpro-vertex-a100-serving-account-price-record-set',
        { configurationRef: configuration.configurationRef, responseDigests },
      )
      const payload = {
        sourceClass: 'billing_account_effective_pricing_api' as const,
        billingAccountPricingScopeRef:
          configuration.billingAccountPricingScopeRef,
        pricingReaderConfigurationRef: configuration.configurationRef,
        routeId: configuration.routeId,
        executionTarget: configuration.executionTarget,
        pricingSetMode: configuration.pricingSetMode,
        region: configuration.region,
        currency: 'USD' as const,
        components,
        priceRecordSetRef,
        pricingReadStartedAt,
        pricingReadFinishedAt,
      }
      return {
        ...payload,
        pricingReadDigestSha256: sha256AuthorityValue(payload),
      } satisfies CanonicalGoogleCloudVertexA100ServingRateRawObservation
    },
  })
}

function component(
  componentClass: typeof CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES[number],
  cloudServiceName: string,
  skuRateBindingId: string,
  billingUnit: 'gpu_hour' | 'vcpu_hour' | 'gib_hour' | 'gib_month'
    | 'gib' | 'per_1000_operations',
  priceTerm: z.infer<typeof termSchema>,
) {
  return { componentClass, cloudServiceName, skuRateBindingId, billingUnit,
    priceTerm }
}

async function readJson(
  auth: GoogleAuthRequest,
  input: { readonly url: string; readonly params?: Readonly<Record<string,
    string>> },
): Promise<unknown> {
  let response: { readonly data: unknown }
  try {
    response = await auth.request({
      url: input.url,
      method: 'GET',
      params: input.params,
      timeout: 15_000,
      maxRedirects: 0,
      retry: false,
      responseType: 'json',
    })
  } catch {
    throw new Error('Vertex A100 serving account price reread failed.')
  }
  if (Buffer.byteLength(stableAuthorityStringify(response.data), 'utf8') >
    MAXIMUM_RESPONSE_BYTES) {
    throw new Error('Vertex A100 serving pricing response exceeded its bound.')
  }
  return response.data
}

const skuMetadataSchema = z.object({
  name: z.string(),
  skuId: z.string(),
  displayName: z.string().min(1),
  service: z.string(),
  geoTaxonomy: z.object({ type: z.string() }).passthrough(),
}).passthrough()
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
        startAmount: z.object({ value: z.string().optional() }).passthrough(),
        contractPrice: moneySchema,
      }).passthrough()).min(1).max(16),
      unitInfo: z.object({
        unit: z.string(),
        unitQuantity: z.object({ value: z.string().optional() }).passthrough(),
      }).passthrough(),
    }).passthrough().optional(),
  }).passthrough()).min(1).max(32),
}).passthrough()

function parseSkuMetadata(raw: unknown, term: z.infer<typeof termSchema>) {
  const sku = skuMetadataSchema.parse(raw)
  if (sku.name !== `skus/${term.skuId}` || sku.skuId !== term.skuId
    || sku.displayName !== term.expectedDisplayName
    || sku.service !== term.cloudServiceId
    || !geoMatches(sku.geoTaxonomy, term.expectedGeoTaxonomy)) {
    throw new Error(
      `Vertex A100 serving billing SKU metadata changed for ${term.skuId}.`,
    )
  }
  return sku
}

function geoMatches(
  geo: z.infer<typeof skuMetadataSchema>['geoTaxonomy'],
  expected: z.infer<typeof termSchema>['expectedGeoTaxonomy'],
): boolean {
  if (expected === 'global') return geo.type === 'TYPE_GLOBAL'
  const text = stableAuthorityStringify(geo)
  if (expected === 'route_region') {
    return geo.type === 'TYPE_REGIONAL' && text.includes('us-central1')
  }
  return geo.type === 'TYPE_MULTI_REGIONAL' && text.includes('us-central1')
}

function parseAccountPrice(
  raw: unknown,
  billingAccountResourceName: string,
  term: z.infer<typeof termSchema>,
) {
  const accountPrice = accountPriceSchema.parse(raw)
  const matches = accountPrice.skuPrices.filter((price) =>
    price.consumptionModel === term.consumptionModel
    && price.valueType === 'rate' && price.rate !== undefined)
  if (accountPrice.name !== `${billingAccountResourceName}/skus/${
    term.skuId}/price` || accountPrice.currencyCode !== 'USD'
    || matches.length !== 1 || matches[0].rate === undefined) {
    throw new Error('Vertex A100 serving account price is not exact.')
  }
  const rate = matches[0].rate
  if (rate.unitInfo.unit !== term.expectedApiUnit
    || normalizeDecimal(rate.unitInfo.unitQuantity.value) !==
      term.expectedApiUnitQuantity) {
    throw new Error('Vertex A100 serving price unit changed.')
  }
  const tiers = rate.tiers.map((tier) => ({
    startAmount: normalizeDecimal(tier.startAmount.value),
    contractPriceUsdNanos: moneyToUsdNanos(tier.contractPrice),
  }))
  if (tiers[0]?.startAmount !== '0') {
    throw new Error('Vertex A100 serving price tiers changed.')
  }
  return { tiers, maximum: Math.max(...tiers.map((tier) =>
    tier.contractPriceUsdNanos)) }
}

function moneyToUsdNanos(money: z.infer<typeof moneySchema>): number {
  if (money.currencyCode !== 'USD') {
    throw new Error('Vertex A100 serving price currency changed.')
  }
  const value = BigInt(money.units ?? '0') * 1_000_000_000n
    + BigInt(money.nanos ?? 0)
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Vertex A100 serving price exceeds safe bounds.')
  }
  return Number(value)
}

function normalizeDecimal(value = ''): string {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value)) {
    throw new Error('Vertex A100 serving price decimal is malformed.')
  }
  const [whole, fraction = ''] = value.split('.')
  const normalizedFraction = fraction.replace(/0+$/u, '')
  return normalizedFraction === '' ? whole : `${whole}.${normalizedFraction}`
}

function evidenceRef(id: string, payload: unknown) {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(payload)}`,
  })
}
