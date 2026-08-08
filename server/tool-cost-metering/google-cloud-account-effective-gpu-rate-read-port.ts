import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS,
  type CanonicalGoogleCloudGpuRateRawObservation,
  type CanonicalGoogleCloudGpuRateReadPort,
} from './canonical-current-google-cloud-gpu-rate-authority'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_GPU_RATE_READER_CONFIGURATION_VERSION =
  'google-cloud-account-effective-gpu-rate-reader-configuration-v2' as const

export const WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG_VERSION =
  'weeditpro-google-cloud-gpu-rate-catalog-multi-region-v2' as const

export const WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG = {
  cloudRun: {
    serviceId: 'services/152E-C115-5142',
    regionalSkus: {
      'us-central1': {
        l4NoZonalRedundancySkuId: '2EEE-0BBD-C718',
        jobsCpuSkuId: '257B-2A84-3396',
        jobsMemorySkuId: '8A79-9F45-5F32',
      },
      'europe-west4': {
        l4NoZonalRedundancySkuId: 'E70E-1400-67A3',
        jobsCpuSkuId: '1B3A-C716-DDE8',
        jobsMemorySkuId: '46A9-AB79-A9CD',
      },
    },
  },
  computeEngine: {
    serviceId: 'services/6F81-5844-456A',
    a10080GbOnDemandSkuId: 'EDA0-3A70-3138',
    a2InstanceCoreOnDemandSkuId: '2922-40C5-B19F',
    a2InstanceRamOnDemandSkuId: '2390-DCAF-DA38',
  },
  cloudStorage: {
    serviceId: 'services/95FF-2EF5-5EA1',
    standardUsRegionalSkuId: 'E5F0-6A5D-7BAD',
    standardNetherlandsRegionalSkuId: '89D8-0CF9-9F2E',
    worldwideDownloadExcludingAsiaAustraliaSkuId: '22EB-AAE8-FBCD',
    regionalStandardClassAOperationsSkuId: '4DBF-185F-A415',
    regionalStandardClassBOperationsSkuId: '7870-010B-2763',
  },
  defaultConsumptionModel: 'consumptionModels/7754-699E-0EBF',
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
const canonicalPositiveDecimal = z.string()
  .regex(/^(?:[1-9]\d*)(?:\.\d*[1-9])?$/u)
const routeIdSchema = z.enum(CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS)
const regionSchema = z.enum(['us-central1', 'europe-west4'])

const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const componentClassSchema = z.enum([
  'a2_ultragpu_1g_machine_bundle',
  'cloud_run_l4_gpu_second',
  'cloud_run_vcpu_second',
  'cloud_run_memory_gib_second',
  'private_object_storage_gib_month',
  'network_egress_gib',
  'object_class_a_per_1000',
  'object_class_b_per_1000',
])

const billingUnitSchema = z.enum([
  'machine_hour',
  'gpu_second',
  'vcpu_second',
  'gib_second',
  'gib_month',
  'gib',
  'per_1000_operations',
])

const priceTermConfigurationSchema = z.object({
  cloudServiceId: z.string().regex(/^services\/[A-Za-z0-9-]+$/u),
  skuId: z.string().regex(/^[A-Za-z0-9-]+$/u),
  quantityPerBillingUnit: positiveInteger,
  consumptionModel: z.string()
    .regex(/^consumptionModels\/[A-Za-z0-9-]+$/u),
  expectedApiUnit: safeId,
  expectedApiUnitQuantity: canonicalPositiveDecimal,
  expectedGeoTaxonomy: z.enum([
    'route_region',
    'global',
    'multi_region_including_route_region',
  ]),
}).strict()

const componentConfigurationSchema = z.object({
  componentClass: componentClassSchema,
  cloudServiceName: safeId,
  skuRateBindingId: safeId,
  billingUnit: billingUnitSchema,
  priceTerms: z.array(priceTermConfigurationSchema).min(1).max(4),
}).strict().superRefine((component, context) => {
  const skuIds = component.priceTerms.map((term) => term.skuId)
  if (new Set(skuIds).size !== skuIds.length) context.addIssue({
    code: 'custom',
    message: 'A GPU rate component cannot reuse one SKU term.',
  })
})

const routeConfigurationSchema = z.object({
  routeId: routeIdSchema,
  region: regionSchema,
  components: z.array(componentConfigurationSchema).min(5).max(8),
}).strict().superRefine((route, context) => {
  const expected = expectedComponentClasses(route.routeId)
  if (stableAuthorityStringify(route.components.map((component) =>
    component.componentClass)) !== stableAuthorityStringify(expected)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU pricing reader route components are incomplete or reordered.',
    })
  }
})

const configurationWithoutRefSchema = z.object({
  schemaVersion: z.literal(
    GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_GPU_RATE_READER_CONFIGURATION_VERSION,
  ),
  billingAccountResourceName: z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u),
  billingAccountPricingScopeRef: evidenceRefSchema,
  routes: z.array(routeConfigurationSchema).length(3),
}).strict().superRefine((configuration, context) => {
  const routeIds = configuration.routes.map((route) => route.routeId)
  if (
    new Set(routeIds).size !== routeIds.length
    || stableAuthorityStringify(routeIds.slice().sort()) !==
      stableAuthorityStringify(
        [...CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS].sort(),
      )
  ) context.addIssue({
    code: 'custom',
    message: 'GPU pricing reader must configure all canonical GPU routes.',
  })
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
    routes: configuration.routes,
  })}`
  if (configuration.configurationRef.contentHash !== expectedHash) {
    context.addIssue({
      code: 'custom',
      message: 'GPU pricing reader configuration digest is invalid.',
    })
  }
})

export type GoogleCloudAccountEffectiveGpuRateReaderConfiguration = z.infer<
  typeof configurationSchema
>

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createGoogleCloudAccountEffectiveGpuRateReaderConfiguration(
  input: z.input<typeof configurationWithoutRefSchema> & {
    readonly configurationId: string
    readonly configurationVersion: number
  },
): GoogleCloudAccountEffectiveGpuRateReaderConfiguration {
  const {
    configurationId,
    configurationVersion,
    ...rawConfiguration
  } = input
  const configuration = configurationWithoutRefSchema.parse(rawConfiguration)
  const configurationRef = evidenceRefSchema.parse({
    id: configurationId,
    version: configurationVersion,
    contentHash: `sha256:${sha256AuthorityValue({
      schemaVersion: configuration.schemaVersion,
      billingAccountPricingScopeRef:
        configuration.billingAccountPricingScopeRef,
      configurationId,
      configurationVersion,
      routes: configuration.routes,
    })}`,
  })
  return configurationSchema.parse({ ...configuration, configurationRef })
}

/**
 * Builds the one server-owned SKU map used by WeEditPro's quality-first GPU
 * routes. The billing account is supplied only by trusted backend deployment
 * configuration. It is deliberately absent from worker payloads and from the
 * resulting rate observations, which retain only its digest-bound scope ref.
 *
 * A2 Ultra is priced from three account-effective terms (one A100 80 GB GPU,
 * twelve A2 vCPUs, and 170 GiB RAM). Treating the machine as one invented SKU
 * would under- or over-estimate approved customer credit reservations.
 */
export function createWeEditProGoogleCloudGpuRateReaderConfiguration(input: {
  readonly billingAccountResourceName: string
}): GoogleCloudAccountEffectiveGpuRateReaderConfiguration {
  const billingAccountResourceName = z.string()
    .regex(/^billingAccounts\/[A-Za-z0-9-]+$/u)
    .parse(input.billingAccountResourceName)
  const catalog = WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG
  const billingAccountPricingScopeRef = evidenceRefSchema.parse({
    id: 'weeditpro-google-cloud-billing-account-pricing-scope',
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({
      catalogVersion: WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG_VERSION,
      billingAccountResourceName,
    })}`,
  })
  const storageComponentsForRegion = (
    region: 'us-central1' | 'europe-west4',
  ) => [
    {
      componentClass: 'private_object_storage_gib_month' as const,
      cloudServiceName: 'cloud-storage',
      skuRateBindingId: region === 'us-central1'
        ? 'gcs-standard-us-regional-gib-month'
        : 'gcs-standard-netherlands-regional-gib-month',
      billingUnit: 'gib_month' as const,
      priceTerms: [{
        cloudServiceId: catalog.cloudStorage.serviceId,
        skuId: region === 'us-central1'
          ? catalog.cloudStorage.standardUsRegionalSkuId
          : catalog.cloudStorage.standardNetherlandsRegionalSkuId,
        quantityPerBillingUnit: 1,
        consumptionModel: catalog.defaultConsumptionModel,
        expectedApiUnit: 'GiBy.mo',
        expectedApiUnitQuantity: '1',
        expectedGeoTaxonomy: region === 'us-central1'
          ? 'multi_region_including_route_region' as const
          : 'route_region' as const,
      }],
    },
    {
      componentClass: 'network_egress_gib' as const,
      cloudServiceName: 'cloud-storage',
      skuRateBindingId:
        'gcs-download-worldwide-excluding-asia-australia-gib',
      billingUnit: 'gib' as const,
      priceTerms: [{
        cloudServiceId: catalog.cloudStorage.serviceId,
        skuId:
          catalog.cloudStorage.worldwideDownloadExcludingAsiaAustraliaSkuId,
        quantityPerBillingUnit: 1,
        consumptionModel: catalog.defaultConsumptionModel,
        expectedApiUnit: 'GiBy',
        expectedApiUnitQuantity: '1',
        expectedGeoTaxonomy: 'global' as const,
      }],
    },
    {
      componentClass: 'object_class_a_per_1000' as const,
      cloudServiceName: 'cloud-storage',
      skuRateBindingId: 'gcs-regional-standard-class-a-per-1000',
      billingUnit: 'per_1000_operations' as const,
      priceTerms: [{
        cloudServiceId: catalog.cloudStorage.serviceId,
        skuId: catalog.cloudStorage.regionalStandardClassAOperationsSkuId,
        quantityPerBillingUnit: 1,
        consumptionModel: catalog.defaultConsumptionModel,
        expectedApiUnit: 'count',
        expectedApiUnitQuantity: '1000',
        expectedGeoTaxonomy: 'global' as const,
      }],
    },
    {
      componentClass: 'object_class_b_per_1000' as const,
      cloudServiceName: 'cloud-storage',
      skuRateBindingId: 'gcs-regional-standard-class-b-per-1000',
      billingUnit: 'per_1000_operations' as const,
      priceTerms: [{
        cloudServiceId: catalog.cloudStorage.serviceId,
        skuId: catalog.cloudStorage.regionalStandardClassBOperationsSkuId,
        quantityPerBillingUnit: 1,
        consumptionModel: catalog.defaultConsumptionModel,
        expectedApiUnit: 'count',
        expectedApiUnitQuantity: '1000',
        expectedGeoTaxonomy: 'global' as const,
      }],
    },
  ]
  const l4ComponentsForRegion = (
    region: 'us-central1' | 'europe-west4',
  ) => {
    const regionalSkus = catalog.cloudRun.regionalSkus[region]
    return [
      {
        componentClass: 'cloud_run_l4_gpu_second' as const,
        cloudServiceName: 'cloud-run',
        skuRateBindingId: 'cloud-run-l4-no-zonal-redundancy-second',
        billingUnit: 'gpu_second' as const,
        priceTerms: [{
          cloudServiceId: catalog.cloudRun.serviceId,
          skuId: regionalSkus.l4NoZonalRedundancySkuId,
          quantityPerBillingUnit: 1,
          consumptionModel: catalog.defaultConsumptionModel,
          expectedApiUnit: 's',
          expectedApiUnitQuantity: '1',
          expectedGeoTaxonomy: 'route_region' as const,
        }],
      },
      {
        componentClass: 'cloud_run_vcpu_second' as const,
        cloudServiceName: 'cloud-run',
        skuRateBindingId: 'cloud-run-jobs-vcpu-second',
        billingUnit: 'vcpu_second' as const,
        priceTerms: [{
          cloudServiceId: catalog.cloudRun.serviceId,
          skuId: regionalSkus.jobsCpuSkuId,
          quantityPerBillingUnit: 1,
          consumptionModel: catalog.defaultConsumptionModel,
          expectedApiUnit: 's',
          expectedApiUnitQuantity: '1',
          expectedGeoTaxonomy: 'route_region' as const,
        }],
      },
      {
        componentClass: 'cloud_run_memory_gib_second' as const,
        cloudServiceName: 'cloud-run',
        skuRateBindingId: 'cloud-run-jobs-memory-gib-second',
        billingUnit: 'gib_second' as const,
        priceTerms: [{
          cloudServiceId: catalog.cloudRun.serviceId,
          skuId: regionalSkus.jobsMemorySkuId,
          quantityPerBillingUnit: 1,
          consumptionModel: catalog.defaultConsumptionModel,
          expectedApiUnit: 'GiBy.s',
          expectedApiUnitQuantity: '1',
          expectedGeoTaxonomy: 'route_region' as const,
        }],
      },
      ...storageComponentsForRegion(region),
    ]
  }
  return createGoogleCloudAccountEffectiveGpuRateReaderConfiguration({
    schemaVersion:
      GOOGLE_CLOUD_ACCOUNT_EFFECTIVE_GPU_RATE_READER_CONFIGURATION_VERSION,
    configurationId: 'weeditpro-google-cloud-gpu-rate-reader-multi-region',
    configurationVersion: 2,
    billingAccountResourceName,
    billingAccountPricingScopeRef,
    routes: [
      {
        routeId: 'a100_80gb_heavy_primary',
        region: 'us-central1',
        components: [
          {
            componentClass: 'a2_ultragpu_1g_machine_bundle',
            cloudServiceName: 'compute-engine',
            skuRateBindingId:
              'a2-ultragpu-1g-a10080-12vcpu-170gib-hour',
            billingUnit: 'machine_hour',
            priceTerms: [
              {
                cloudServiceId: catalog.computeEngine.serviceId,
                skuId: catalog.computeEngine.a10080GbOnDemandSkuId,
                quantityPerBillingUnit: 1,
                consumptionModel: catalog.defaultConsumptionModel,
                expectedApiUnit: 'h',
                expectedApiUnitQuantity: '1',
                expectedGeoTaxonomy:
                  'multi_region_including_route_region',
              },
              {
                cloudServiceId: catalog.computeEngine.serviceId,
                skuId: catalog.computeEngine.a2InstanceCoreOnDemandSkuId,
                quantityPerBillingUnit: 12,
                consumptionModel: catalog.defaultConsumptionModel,
                expectedApiUnit: 'h',
                expectedApiUnitQuantity: '1',
                expectedGeoTaxonomy:
                  'multi_region_including_route_region',
              },
              {
                cloudServiceId: catalog.computeEngine.serviceId,
                skuId: catalog.computeEngine.a2InstanceRamOnDemandSkuId,
                quantityPerBillingUnit: 170,
                consumptionModel: catalog.defaultConsumptionModel,
                expectedApiUnit: 'GiBy.h',
                expectedApiUnitQuantity: '1',
                expectedGeoTaxonomy:
                  'multi_region_including_route_region',
              },
            ],
          },
          ...storageComponentsForRegion('us-central1'),
        ],
      },
      {
        routeId: 'l4_heavy_fallback',
        region: 'europe-west4',
        components: l4ComponentsForRegion('europe-west4'),
      },
      {
        routeId: 'l4_standard_primary',
        region: 'us-central1',
        components: l4ComponentsForRegion('us-central1'),
      },
    ],
  })
}

export function createGoogleCloudAccountEffectiveGpuRateReadPort(input: {
  readonly configuration: GoogleCloudAccountEffectiveGpuRateReaderConfiguration
  readonly auth?: GoogleAuthRequest
  readonly now?: () => Date
}): CanonicalGoogleCloudGpuRateReadPort {
  const configuration = configurationSchema.parse(input.configuration)
  const auth = input.auth ?? new GoogleAuth({ scopes: [BILLING_READ_SCOPE] })
  const now = input.now ?? (() => new Date())

  return {
    async readCurrentRouteRate(request) {
      const route = configuration.routes.find((candidate) =>
        candidate.routeId === request.routeId)
      if (
        route === undefined
        || route.region !== request.region
        || request.currency !== 'USD'
      ) throw new Error('GPU pricing route is not configured exactly.')

      const pricingReadStartedAt = now().toISOString()
      const components = []
      const responseDigests: Array<{
        skuId: string
        skuMetadataDigestSha256: string
        billingAccountPriceDigestSha256: string
      }> = []
      for (const component of route.components) {
        const priceTerms = []
        const skuMetadataDigests = []
        for (const term of component.priceTerms) {
          const skuMetadata = await readJson(auth, {
            url: `${BILLING_API_ORIGIN}/v2beta/skus/${encodeURIComponent(
              term.skuId,
            )}`,
          })
          const accountPrice = await readJson(auth, {
            url: `${BILLING_API_ORIGIN}/v2beta/${
              configuration.billingAccountResourceName
            }/skus/${encodeURIComponent(term.skuId)}/price`,
            params: { currencyCode: 'USD' },
          })
          const parsedSku = parseExactSkuMetadata({
            raw: skuMetadata,
            term,
            routeRegion: route.region,
          })
          const parsedPrice = parseExactAccountPrice({
            raw: accountPrice,
            billingAccountResourceName:
              configuration.billingAccountResourceName,
            term,
          })
          const skuMetadataDigestSha256 = sha256AuthorityValue(skuMetadata)
          const billingAccountPriceDigestSha256 =
            sha256AuthorityValue(accountPrice)
          responseDigests.push({
            skuId: term.skuId,
            skuMetadataDigestSha256,
            billingAccountPriceDigestSha256,
          })
          skuMetadataDigests.push({
            skuId: term.skuId,
            displayName: parsedSku.displayName,
            service: parsedSku.service,
            skuMetadataDigestSha256,
          })
          priceTerms.push({
            cloudServiceId: term.cloudServiceId,
            skuId: term.skuId,
            quantityPerBillingUnit: term.quantityPerBillingUnit,
            consumptionModel: term.consumptionModel,
            apiUnit: parsedPrice.apiUnit,
            apiUnitQuantity: parsedPrice.apiUnitQuantity,
            contractPriceTiers: parsedPrice.contractPriceTiers,
            maximumContractPriceUsdNanos:
              parsedPrice.maximumContractPriceUsdNanos,
            skuMetadataRef: {
              id: `gcp-sku-metadata-${term.skuId}`,
              version: 1,
              contentHash: `sha256:${skuMetadataDigestSha256}`,
            },
            billingAccountPriceRef: {
              id: `gcp-account-price-${term.skuId}`,
              version: 1,
              contentHash: `sha256:${billingAccountPriceDigestSha256}`,
            },
          })
        }
        const maximumUsdNanosPerBillingUnit = priceTerms.reduce(
          (total, term) => total
            + term.maximumContractPriceUsdNanos
              * term.quantityPerBillingUnit,
          0,
        )
        components.push({
          componentClass: component.componentClass,
          cloudServiceName: component.cloudServiceName,
          skuRateBindingId: component.skuRateBindingId,
          skuPriceTerms: priceTerms,
          skuDescriptionDigestSha256:
            sha256AuthorityValue(skuMetadataDigests),
          skuRegion: route.region,
          billingUnit: component.billingUnit,
          maximumUsdNanosPerBillingUnit,
          currentPriceObservedAt: '',
          skuRecordRef: {
            id: `gcp-price-binding-${component.componentClass}`,
            version: 1,
            contentHash: `sha256:${sha256AuthorityValue({
              component,
              priceTerms,
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
        id: `gcp-account-effective-prices-${route.routeId}`,
        version: 1,
        contentHash: `sha256:${sha256AuthorityValue({
          configurationRef: configuration.configurationRef,
          billingAccountPricingScopeRef:
            configuration.billingAccountPricingScopeRef,
          routeId: route.routeId,
          region: route.region,
          responseDigests,
        })}`,
      }
      const raw = {
        sourceClass: 'billing_account_effective_pricing_api' as const,
        billingAccountPricingScopeRef:
          configuration.billingAccountPricingScopeRef,
        pricingReaderConfigurationRef: configuration.configurationRef,
        routeId: route.routeId,
        region: route.region,
        currency: 'USD' as const,
        components: timestampedComponents,
        priceRecordSetRef,
        pricingReadStartedAt,
        pricingReadFinishedAt,
      }
      return {
        ...raw,
        pricingReadDigestSha256: sha256AuthorityValue(raw),
      } satisfies CanonicalGoogleCloudGpuRateRawObservation
    },
  }
}

async function readJson(
  auth: GoogleAuthRequest,
  input: { readonly url: string; readonly params?: Readonly<Record<string, string>> },
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
    // Never propagate an SDK error carrying the billing-account URL, auth
    // headers, or provider response body into application logs.
    throw new Error('Google Cloud account-effective price reread failed.')
  }
  if (Buffer.byteLength(stableAuthorityStringify(response.data), 'utf8') >
    MAXIMUM_RESPONSE_BYTES) {
    throw new Error('Google Cloud pricing response exceeded its byte bound.')
  }
  return response.data
}

const skuMetadataSchema = z.object({
  name: z.string(),
  skuId: z.string(),
  displayName: z.string().min(1),
  service: z.string(),
  productTaxonomy: z.unknown(),
  geoTaxonomy: z.object({
    type: z.enum(['TYPE_GLOBAL', 'TYPE_REGIONAL', 'TYPE_MULTI_REGIONAL']),
    globalMetadata: z.unknown().optional(),
    regionalMetadata: z.object({
      region: z.object({ region: z.string() }).passthrough(),
    }).passthrough().optional(),
    multiRegionalMetadata: z.object({
      regions: z.array(z.object({ region: z.string() }).passthrough()),
    }).passthrough().optional(),
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

function parseExactSkuMetadata(input: {
  raw: unknown
  term: z.infer<typeof priceTermConfigurationSchema>
  routeRegion: z.infer<typeof regionSchema>
}) {
  const sku = skuMetadataSchema.parse(input.raw)
  const geo = sku.geoTaxonomy
  const geoMatches = input.term.expectedGeoTaxonomy === 'route_region'
    ? geo.type === 'TYPE_REGIONAL'
      && geo.regionalMetadata?.region.region === input.routeRegion
    : input.term.expectedGeoTaxonomy === 'global'
      ? geo.type === 'TYPE_GLOBAL'
      : geo.type === 'TYPE_MULTI_REGIONAL'
        && geo.multiRegionalMetadata?.regions.some((region) =>
          region.region === input.routeRegion) === true
  if (
    sku.name !== `skus/${input.term.skuId}`
    || sku.skuId !== input.term.skuId
    || sku.service !== input.term.cloudServiceId
    || !geoMatches
  ) throw new Error('Google Cloud SKU metadata does not match its route.')
  return sku
}

function parseExactAccountPrice(input: {
  raw: unknown
  billingAccountResourceName: string
  term: z.infer<typeof priceTermConfigurationSchema>
}) {
  const accountPrice = accountPriceSchema.parse(input.raw)
  const matches = accountPrice.skuPrices.filter((price) =>
    price.consumptionModel === input.term.consumptionModel)
  if (
    accountPrice.name !== `${input.billingAccountResourceName}/skus/${
      input.term.skuId
    }/price`
    || accountPrice.currencyCode !== 'USD'
    || matches.length !== 1
    || matches[0].valueType !== 'rate'
    || matches[0].rate === undefined
  ) throw new Error('Google Cloud account-effective price is not exact.')
  const rate = matches[0].rate
  const apiUnitQuantity = normalizeDecimal(rate.unitInfo.unitQuantity.value)
  if (
    rate.unitInfo.unit !== input.term.expectedApiUnit
    || apiUnitQuantity !== input.term.expectedApiUnitQuantity
  ) throw new Error('Google Cloud account-effective price unit changed.')
  const contractPriceTiers = rate.tiers.map((tier) => ({
    startAmount: normalizeDecimal(tier.startAmount.value, true),
    contractPriceUsdNanos: moneyToNonnegativeUsdNanos(tier.contractPrice),
  }))
  if (
    contractPriceTiers[0].startAmount !== '0'
    || !contractPriceTiers.every((tier, index) => index === 0
      || compareCanonicalDecimals(
        contractPriceTiers[index - 1].startAmount,
        tier.startAmount,
      ) < 0)
  ) throw new Error('Google Cloud account-effective tiers are invalid.')
  return {
    apiUnit: rate.unitInfo.unit,
    apiUnitQuantity,
    contractPriceTiers,
    maximumContractPriceUsdNanos: Math.max(
      ...contractPriceTiers.map((tier) => tier.contractPriceUsdNanos),
    ),
  }
}

function moneyToNonnegativeUsdNanos(
  money: z.infer<typeof moneySchema>,
): number {
  if (money.currencyCode !== 'USD') {
    throw new Error('Google Cloud price currency changed.')
  }
  const units = BigInt(money.units ?? '0')
  const nanos = BigInt(money.nanos ?? 0)
  const total = units * 1_000_000_000n + nanos
  if (
    total < 0n
    || total > BigInt(Number.MAX_SAFE_INTEGER)
    || (units > 0n && nanos < 0n)
    || (units < 0n && nanos > 0n)
  ) throw new Error('Google Cloud price cannot be represented exactly.')
  return Number(total)
}

function normalizeDecimal(value = '', allowZero = false): string {
  if (value === '') {
    if (allowZero) return '0'
    throw new Error('Google Cloud decimal must be positive.')
  }
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/u
    .exec(value)
  if (match === null || (match[2] === '' && match[3] === '')) {
    throw new Error('Google Cloud decimal is malformed.')
  }
  if (match[1] === '-') throw new Error('Google Cloud decimal is negative.')
  const exponent = Number.parseInt(match[4] ?? '0', 10)
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) {
    throw new Error('Google Cloud decimal exponent is out of bounds.')
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
  const normalized = normalizedFraction === ''
    ? normalizedWhole
    : `${normalizedWhole}.${normalizedFraction}`
  if (!allowZero && normalized === '0') {
    throw new Error('Google Cloud decimal must be positive.')
  }
  return normalized
}

function compareCanonicalDecimals(left: string, right: string): number {
  const [leftWhole, leftFraction = ''] = left.split('.')
  const [rightWhole, rightFraction = ''] = right.split('.')
  const scale = Math.max(leftFraction.length, rightFraction.length)
  const leftValue = BigInt(`${leftWhole}${leftFraction.padEnd(scale, '0')}`)
  const rightValue = BigInt(`${rightWhole}${rightFraction.padEnd(scale, '0')}`)
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0
}

function expectedComponentClasses(
  routeId: z.infer<typeof routeIdSchema>,
): readonly z.infer<typeof componentClassSchema>[] {
  const common = [
    'private_object_storage_gib_month',
    'network_egress_gib',
    'object_class_a_per_1000',
    'object_class_b_per_1000',
  ] as const
  return routeId === 'a100_80gb_heavy_primary'
    ? ['a2_ultragpu_1g_machine_bundle', ...common]
    : [
        'cloud_run_l4_gpu_second',
        'cloud_run_vcpu_second',
        'cloud_run_memory_gib_second',
        ...common,
      ]
}
