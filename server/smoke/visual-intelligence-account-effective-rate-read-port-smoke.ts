import assert from 'node:assert/strict'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
  createVisualIntelligenceAccountEffectivePricingObservationPort,
  createWeEditProVisualIntelligenceAccountEffectiveRateReaderConfiguration,
} from '../visual-intelligence/visual-intelligence-account-effective-rate-read-port'
import {
  parseVisualIntelligenceAccountEffectiveRateAuthority,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'

const billingAccountResourceName = 'billingAccounts/000000-AAAAAA-BBBBBB'
const compatibilityRef = createVisualIntelligenceEvidenceRef(
  'gemini-3-1-pro-billing-sku-compatibility-qualification',
  { exactModelId: 'gemini-3.1-pro-preview', qualified: true },
)
const configuration =
  createWeEditProVisualIntelligenceAccountEffectiveRateReaderConfiguration({
    billingAccountResourceName,
    exactModelBillingSkuCompatibilityQualificationRef: compatibilityRef,
  })

assert.equal(configuration.exactModelId, 'gemini-3.1-pro-preview')
assert.equal(configuration.vertexLocation, 'global')
assert.equal(configuration.throughputClass, 'standard')
assert.equal(configuration.contextThresholdInputTokens, 200_000)
assert.equal(configuration.terms.length, 6)
assert.deepEqual(configuration.terms.map((term) => ({
  rateClass: term.rateClass,
  contextClass: term.contextClass,
  tokenClass: term.tokenClass,
  skuId: term.skuId,
  expectedDisplayName: term.expectedDisplayName,
})), WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms)
assert.deepEqual(configuration.terms.map((term) => term.rateClass), [
  'standard_uncached_input',
  'standard_cached_input',
  'standard_output_and_thinking',
  'long_uncached_input',
  'long_cached_input',
  'long_output_and_thinking',
])

type FixtureTerm = (typeof configuration.terms)[number]
const termBySku = new Map<string, FixtureTerm>(
  configuration.terms.map((term): [string, FixtureTerm] => [term.skuId, term]),
)
const calls: Array<Record<string, unknown>> = []
const auth = {
  async request(options: Record<string, unknown>) {
    calls.push(options)
    assert.equal(options.method, 'GET')
    assert.equal(options.maxRedirects, 0)
    assert.equal(options.retry, false)
    assert.equal(options.timeout, 15_000)
    assert.equal(options.responseType, 'json')
    const url = String(options.url)
    const skuId = /\/skus\/([^/]+)(?:\/price)?$/u.exec(url)?.[1]
    assert.ok(skuId)
    const term = termBySku.get(decodeURIComponent(skuId))
    assert.ok(term)
    if (url.endsWith('/price')) {
      assert.deepEqual(options.params, { currencyCode: 'USD' })
      return { data: accountPrice(term, fixtureRate(term.rateClass)) }
    }
    assert.equal(options.params, undefined)
    return { data: skuMetadata(term) }
  },
} as unknown as Pick<GoogleAuth, 'request'>

const clockValues = [
  new Date('2026-08-03T16:00:00.000Z'),
  new Date('2026-08-03T16:00:05.000Z'),
]
let clockIndex = 0
const observationPort =
  createVisualIntelligenceAccountEffectivePricingObservationPort({
    configuration,
    auth,
    now: () => clockValues[clockIndex++] ?? clockValues.at(-1)!,
  })
const authority = await observationPort.readCurrent({
  pricingApiObservationId: 'gemini-3-1-pro-account-price-20260803',
  pricingApiObservationVersion: 1,
})
assert.deepEqual(
  parseVisualIntelligenceAccountEffectiveRateAuthority(authority),
  authority,
)
assert.equal(authority.schemaVersion,
  'visual-intelligence-account-effective-rate-authority-v2')
assert.equal(authority.billingSkuFamily,
  'gemini_3_0_pro_shared_billing_family')
assert.equal(authority.billingSkuCatalogVersion,
  'weeditpro-gemini-3_1-pro-standard-global-sku-catalog-v1')
assert.deepEqual(
  authority.exactModelBillingSkuCompatibilityQualificationRef,
  compatibilityRef,
)
assert.equal(authority.wholeRequestLongContextRatesRequired, true)
assert.equal(authority.exactSkuMetadataAndAccountPriceReread, true)
assert.equal(authority.publicListPriceUsed, false)
assert.equal(authority.customerPriceOrServiceFeeAuthorityGranted, false)
assert.equal(authority.walletMutationAuthorityGranted, false)
assert.equal(calls.length, 12)
assert.equal(calls.filter((call) => String(call.url).endsWith('/price')).length,
  6)
assert.equal(JSON.stringify(authority).includes('000000-AAAAAA-BBBBBB'), false)
assert.deepEqual(authority.accountEffectiveSkuPriceTerms.map((term) =>
  term.contractPriceUsdNanosPerMillionTokens), [
  2_000_000_000,
  200_000_000,
  12_000_000_000,
  4_000_000_000,
  400_000_000,
  18_000_000_000,
])

const tamperedConfiguration = structuredClone(configuration)
tamperedConfiguration.terms[0].skuId = '0000-0000-0000'
assert.throws(() =>
  createVisualIntelligenceAccountEffectivePricingObservationPort({
    configuration: tamperedConfiguration,
    auth,
  }))

const wrongMetadataAuth = {
  async request(options: Record<string, unknown>) {
    const url = String(options.url)
    const skuId = /\/skus\/([^/]+)(?:\/price)?$/u.exec(url)?.[1]
    assert.ok(skuId)
    const term = termBySku.get(decodeURIComponent(skuId))
    assert.ok(term)
    return url.endsWith('/price')
      ? { data: accountPrice(term, fixtureRate(term.rateClass)) }
      : { data: { ...skuMetadata(term), displayName: 'Injected SKU' } }
  },
} as unknown as Pick<GoogleAuth, 'request'>
await assert.rejects(() =>
  createVisualIntelligenceAccountEffectivePricingObservationPort({
    configuration,
    auth: wrongMetadataAuth,
    now: fixedClock(),
  }).readCurrent({
    pricingApiObservationId: 'wrong-metadata-observation',
    pricingApiObservationVersion: 1,
  }))

const tieredPriceAuth = {
  async request(options: Record<string, unknown>) {
    const url = String(options.url)
    const skuId = /\/skus\/([^/]+)(?:\/price)?$/u.exec(url)?.[1]
    assert.ok(skuId)
    const term = termBySku.get(decodeURIComponent(skuId))
    assert.ok(term)
    if (!url.endsWith('/price')) return { data: skuMetadata(term) }
    const price = accountPrice(term, fixtureRate(term.rateClass))
    price.skuPrices[0].rate.tiers.push({
      startAmount: { value: '1000000' },
      contractPrice: money(1),
    })
    return { data: price }
  },
} as unknown as Pick<GoogleAuth, 'request'>
await assert.rejects(() =>
  createVisualIntelligenceAccountEffectivePricingObservationPort({
    configuration,
    auth: tieredPriceAuth,
    now: fixedClock(),
  }).readCurrent({
    pricingApiObservationId: 'tiered-price-observation',
    pricingApiObservationVersion: 1,
  }))

const sensitiveFailureAuth = {
  async request() {
    throw new Error(
      'billingAccounts/000000-AAAAAA-BBBBBB authorization=Bearer secret',
    )
  },
} as unknown as Pick<GoogleAuth, 'request'>
await assert.rejects(
  () => createVisualIntelligenceAccountEffectivePricingObservationPort({
    configuration,
    auth: sensitiveFailureAuth,
    now: fixedClock(),
  }).readCurrent({
    pricingApiObservationId: 'sanitized-error-observation',
    pricingApiObservationVersion: 1,
  }),
  (error: unknown) => error instanceof Error
    && error.message ===
      'Visual Intelligence billing-account-effective price reread failed.'
    && !error.message.includes('000000-AAAAAA-BBBBBB')
    && !error.message.includes('secret'),
)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-account-effective-rate-read-port',
  checks: 39,
  exactModelId: authority.exactModelId,
  skuTerms: authority.accountEffectiveSkuPriceTerms.length,
  authenticatedAccountPriceReads: calls.filter((call) =>
    String(call.url).endsWith('/price')).length,
  exactSkuMetadataReads: calls.filter((call) =>
    !String(call.url).endsWith('/price')).length,
  standardAndLongContextRatesBound: true,
  publicListPriceUsed: authority.publicListPriceUsed,
  customerCreditsMutated: authority.walletMutationAuthorityGranted,
  billingAccountIdentifierReturned: false,
  rateAuthorityDigestSha256: authority.rateAuthorityDigestSha256,
}))

function skuMetadata(term: FixtureTerm) {
  return {
    name: `skus/${term.skuId}`,
    skuId: term.skuId,
    displayName: term.expectedDisplayName,
    service: term.cloudServiceId,
    productTaxonomy: { taxonomyCategories: [{ category: 'Vertex AI' }] },
    geoTaxonomy: { type: 'TYPE_GLOBAL', globalMetadata: {} },
  }
}

function accountPrice(term: FixtureTerm, usdNanos: number) {
  return {
    name: `${billingAccountResourceName}/skus/${term.skuId}/price`,
    currencyCode: 'USD',
    skuPrices: [{
      consumptionModel: term.consumptionModel,
      consumptionModelDescription: 'Default',
      valueType: 'rate',
      rate: {
        tiers: [{
          startAmount: { value: '0' },
          contractPrice: money(usdNanos),
        }],
        unitInfo: {
          unit: term.expectedApiUnit,
          unitQuantity: { value: term.expectedApiUnitQuantity },
        },
      },
    }],
  }
}

function money(usdNanos: number) {
  return {
    currencyCode: 'USD',
    units: String(Math.floor(usdNanos / 1_000_000_000)),
    nanos: usdNanos % 1_000_000_000,
  }
}

function fixtureRate(rateClass: FixtureTerm['rateClass']): number {
  const rates: Record<FixtureTerm['rateClass'], number> = {
    standard_uncached_input: 2_000_000_000,
    standard_cached_input: 200_000_000,
    standard_output_and_thinking: 12_000_000_000,
    long_uncached_input: 4_000_000_000,
    long_cached_input: 400_000_000,
    long_output_and_thinking: 18_000_000_000,
  }
  return rates[rateClass]
}

function fixedClock() {
  const values = [
    new Date('2026-08-03T17:00:00.000Z'),
    new Date('2026-08-03T17:00:01.000Z'),
  ]
  let index = 0
  return () => values[index++] ?? values.at(-1)!
}
