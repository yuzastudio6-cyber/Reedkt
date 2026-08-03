import assert from 'node:assert/strict'
import type { GoogleAuth } from 'google-auth-library'

import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG,
  createGoogleCloudAccountEffectiveGpuRateReadPort,
  createWeEditProGoogleCloudGpuRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-gpu-rate-read-port'

const configuration = createWeEditProGoogleCloudGpuRateReaderConfiguration({
  billingAccountResourceName: 'billingAccounts/000000-AAAAAA-BBBBBB',
})
const routes = configuration.routes
const a100Machine = routes[0].components[0]
assert.deepEqual(
  a100Machine.priceTerms.map((term) => ({
    skuId: term.skuId,
    quantityPerBillingUnit: term.quantityPerBillingUnit,
    expectedApiUnit: term.expectedApiUnit,
  })),
  [
    {
      skuId: WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.computeEngine
        .a10080GbOnDemandSkuId,
      quantityPerBillingUnit: 1,
      expectedApiUnit: 'h',
    },
    {
      skuId: WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.computeEngine
        .a2InstanceCoreOnDemandSkuId,
      quantityPerBillingUnit: 12,
      expectedApiUnit: 'h',
    },
    {
      skuId: WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.computeEngine
        .a2InstanceRamOnDemandSkuId,
      quantityPerBillingUnit: 170,
      expectedApiUnit: 'GiBy.h',
    },
  ],
)
assert.equal(routes[1].components[0].priceTerms[0].skuId,
  WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.cloudRun
    .l4NoZonalRedundancySkuId)
assert.equal(routes[2].components[0].priceTerms[0].skuId,
  WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.cloudRun
    .l4NoZonalRedundancySkuId)

const calls: Array<Record<string, unknown>> = []
const exactBySku = new Map(routes.flatMap((configuredRoute) =>
  configuredRoute.components.flatMap((component) =>
    component.priceTerms.map((term) => [term.skuId, {
      ...term,
      routeRegion: configuredRoute.region,
    }] as const))))

type FixtureTerm = {
  readonly cloudServiceId: string
  readonly skuId: string
  readonly consumptionModel: string
  readonly expectedApiUnit: string
  readonly expectedApiUnitQuantity: string
  readonly expectedGeoTaxonomy:
    | 'route_region'
    | 'global'
    | 'multi_region_including_route_region'
  readonly routeRegion: 'us-central1' | 'europe-west4'
}

const auth = {
  async request(options: Record<string, unknown>) {
    calls.push(options)
    assert.equal(options.method, 'GET')
    assert.equal(options.maxRedirects, 0)
    assert.equal(options.retry, false)
    assert.equal(options.timeout, 15_000)
    const url = String(options.url)
    const skuId = /\/skus\/([^/]+)(?:\/price)?$/u.exec(url)?.[1]
    assert.ok(skuId)
    const term = exactBySku.get(decodeURIComponent(skuId))
    assert.ok(term)
    if (url.endsWith('/price')) return {
      data: accountPrice(term),
    }
    return { data: skuMetadata(term) }
  },
} as unknown as Pick<GoogleAuth, 'request'>

const clockValues = [
  new Date('2026-08-02T17:00:00.000Z'),
  new Date('2026-08-02T17:00:05.000Z'),
]
let clockIndex = 0
const readPort = createGoogleCloudAccountEffectiveGpuRateReadPort({
  configuration,
  auth,
  now: () => clockValues[clockIndex++] ?? clockValues.at(-1)!,
})
const authority = await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
  rateAuthorityId: 'account-current-l4-standard-rate-v1',
  rateAuthorityVersion: 1,
  routeId: 'l4_standard_primary',
  region: 'us-central1',
  readPort,
})

assert.equal(authority.sourceClass,
  'billing_account_effective_pricing_api')
assert.equal(authority.billingAccountPricingScopeRef.id,
  'weeditpro-google-cloud-billing-account-pricing-scope')
assert.equal(JSON.stringify(authority).includes('000000-AAAAAA-BBBBBB'), false)
assert.equal(authority.pricingReaderConfigurationRef.contentHash,
  configuration.configurationRef.contentHash)
assert.equal(authority.components.length, 7)
assert.equal(calls.length, 14)
assert.equal(authority.components[0].maximumUsdNanosPerBillingUnit, 186_700)
const egress = authority.components.find((component) =>
  component.componentClass === 'network_egress_gib')
assert.ok(egress)
assert.deepEqual(egress.skuPriceTerms[0].contractPriceTiers, [
  { startAmount: '0', contractPriceUsdNanos: 120_000_000 },
  { startAmount: '10', contractPriceUsdNanos: 80_000_000 },
])
assert.equal(egress.maximumUsdNanosPerBillingUnit, 120_000_000)
assert.equal(assertCanonicalCurrentGoogleCloudGpuRateAuthority(
  authority,
  '2026-08-03T16:59:59.999Z',
).rateAuthorityHash, authority.rateAuthorityHash)

await assert.rejects(() => readPort.readCurrentRouteRate({
  routeId: 'l4_standard_primary',
  region: 'europe-west4',
  currency: 'USD',
}))

const tamperedConfiguration = structuredClone(configuration)
tamperedConfiguration.routes[0].components[0].priceTerms[0].skuId =
  'INJECTED-SKU'
assert.throws(() => createGoogleCloudAccountEffectiveGpuRateReadPort({
  configuration: tamperedConfiguration,
  auth,
}))

const wrongServiceAuth = {
  async request(options: Record<string, unknown>) {
    const url = String(options.url)
    const skuId = /\/skus\/([^/]+)(?:\/price)?$/u.exec(url)?.[1]
    assert.ok(skuId)
    const term = exactBySku.get(decodeURIComponent(skuId))
    assert.ok(term)
    return url.endsWith('/price')
      ? { data: accountPrice(term) }
      : { data: { ...skuMetadata(term), service: 'services/wrong' } }
  },
} as unknown as Pick<GoogleAuth, 'request'>
await assert.rejects(() => createGoogleCloudAccountEffectiveGpuRateReadPort({
  configuration,
  auth: wrongServiceAuth,
  now: fixedClock(),
}).readCurrentRouteRate({
  routeId: 'l4_standard_primary',
  region: 'us-central1',
  currency: 'USD',
}))

const sensitiveFailureAuth = {
  async request() {
    throw new Error(
      'billingAccounts/000000-AAAAAA-BBBBBB authorization=Bearer secret',
    )
  },
} as unknown as Pick<GoogleAuth, 'request'>
await assert.rejects(
  () => createGoogleCloudAccountEffectiveGpuRateReadPort({
    configuration,
    auth: sensitiveFailureAuth,
    now: fixedClock(),
  }).readCurrentRouteRate({
    routeId: 'l4_standard_primary',
    region: 'us-central1',
    currency: 'USD',
  }),
  (error: unknown) => error instanceof Error
    && error.message === 'Google Cloud account-effective price reread failed.'
    && !error.message.includes('000000-AAAAAA-BBBBBB')
    && !error.message.includes('secret'),
)

console.log(JSON.stringify({
  smoke: 'google-cloud-account-effective-gpu-rate-read-port',
  checks: 44,
  sourceClass: authority.sourceClass,
  authenticatedPriceReads: calls.filter((call) =>
    String(call.url).endsWith('/price')).length,
  publicSkuMetadataReads: calls.filter((call) =>
    !String(call.url).endsWith('/price')).length,
  maximumAuthorityAgeSeconds: authority.maximumAuthorityAgeSeconds,
  accountIdentifierReturned: false,
  customerPricingAuthorityGranted:
    authority.customerPricingOrServiceFeeAuthorityGranted,
  walletMutationAuthorityGranted:
    authority.walletOrCreditMutationAuthorityGranted,
  rateAuthorityHash: authority.rateAuthorityHash,
}))

function skuMetadata(term: FixtureTerm) {
  const geoTaxonomy = term.expectedGeoTaxonomy === 'route_region'
    ? {
        type: 'TYPE_REGIONAL',
        regionalMetadata: { region: { region: term.routeRegion } },
      }
    : term.expectedGeoTaxonomy === 'global'
      ? { type: 'TYPE_GLOBAL', globalMetadata: {} }
      : {
          type: 'TYPE_MULTI_REGIONAL',
          multiRegionalMetadata: {
            regions: [{ region: term.routeRegion }, { region: 'us-east1' }],
          },
        }
  return {
    name: `skus/${term.skuId}`,
    skuId: term.skuId,
    displayName: `Fixture ${term.skuId}`,
    service: term.cloudServiceId,
    productTaxonomy: { taxonomyCategories: [{ category: 'fixture' }] },
    geoTaxonomy,
  }
}

function accountPrice(term: FixtureTerm) {
  const rates = term.skuId ===
    WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG.cloudStorage
      .worldwideDownloadExcludingAsiaAustraliaSkuId
    ? [
        { startAmount: { value: '' }, contractPrice: money(120_000_000) },
        { startAmount: { value: '1E+1' }, contractPrice: money(80_000_000) },
      ]
    : [{
        startAmount: { value: '0' },
        contractPrice: money(rateForSku(term.skuId)),
      }]
  return {
    name: `billingAccounts/000000-AAAAAA-BBBBBB/skus/${term.skuId}/price`,
    currencyCode: 'USD',
    skuPrices: [
      {
        consumptionModel: 'consumptionModels/flex-start',
        consumptionModelDescription: 'Flex',
        valueType: 'rate',
        rate: {
          tiers: [{
            startAmount: { value: '0' },
            contractPrice: money(1),
          }],
          unitInfo: { unit: term.expectedApiUnit, unitQuantity: { value: '1' } },
        },
      },
      {
        consumptionModel: term.consumptionModel,
        consumptionModelDescription: 'Default',
        valueType: 'rate',
        rate: {
          tiers: rates,
          unitInfo: {
            unit: term.expectedApiUnit,
            unitQuantity: { value: term.expectedApiUnitQuantity },
          },
        },
      },
    ],
  }
}

function money(usdNanos: number) {
  return {
    currencyCode: 'USD',
    units: String(Math.floor(usdNanos / 1_000_000_000)),
    nanos: usdNanos % 1_000_000_000,
  }
}

function rateForSku(skuId: string) {
  const catalog = WEEDITPRO_GOOGLE_CLOUD_GPU_RATE_CATALOG
  if (skuId === catalog.cloudRun.l4NoZonalRedundancySkuId) return 186_700
  if (skuId === catalog.cloudRun.jobsCpuSkuId) return 18_000
  if (skuId === catalog.cloudRun.jobsMemorySkuId) return 2_000
  if (skuId === catalog.computeEngine.a10080GbOnDemandSkuId) {
    return 3_928_080_000
  }
  if (skuId === catalog.computeEngine.a2InstanceCoreOnDemandSkuId) {
    return 31_611_000
  }
  if (skuId === catalog.computeEngine.a2InstanceRamOnDemandSkuId) {
    return 4_237_000
  }
  if (skuId === catalog.cloudStorage.standardUsRegionalSkuId) {
    return 20_000_000
  }
  if (skuId === catalog.cloudStorage.regionalStandardClassAOperationsSkuId) {
    return 5_000_000
  }
  if (skuId === catalog.cloudStorage.regionalStandardClassBOperationsSkuId) {
    return 400_000
  }
  throw new Error('Unexpected fixture SKU.')
}

function fixedClock() {
  const values = [
    new Date('2026-08-02T18:00:00.000Z'),
    new Date('2026-08-02T18:00:01.000Z'),
  ]
  let index = 0
  return () => values[index++] ?? values.at(-1)!
}
