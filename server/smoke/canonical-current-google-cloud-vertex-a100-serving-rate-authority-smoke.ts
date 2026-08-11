import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort,
  createWeEditProVertexA100ServingRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-vertex-a100-serving-rate-read-port'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceipt,
  publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-publisher'

const BILLING_ACCOUNT = 'billingAccounts/012345-ABCDEF-987654'
const STARTED_AT = '2026-08-11T12:00:00.000Z'
const FINISHED_AT = '2026-08-11T12:00:01.000Z'
const configuration =
  createWeEditProVertexA100ServingRateReaderConfiguration({
    billingAccountResourceName: BILLING_ACCOUNT,
  })

assert.deepEqual(configuration.components.map((component) =>
  component.componentClass),
CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES)
assert.deepEqual(configuration.components.slice(0, 5).map((component) =>
  component.priceTerm.skuId), [
  '75F9-5E53-217A',
  'E0F6-0F18-499A',
  '7126-0622-91E4',
  '23A9-5F69-14F0',
  '678F-BF63-DA0A',
])
assert.equal(configuration.components.some((component) =>
  component.priceTerm.skuId === '8FFC-6CDE-24D7'), false)
assert.equal(configuration.components.some((component) =>
  component.skuRateBindingId.includes('training')), false)

let clockIndex = 0
const requests: string[] = []
const authority = await observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority({
  rateAuthorityId: 'vertex-a100-serving-rate:smoke-20260811',
  rateAuthorityVersion: 1,
  readPort: createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort({
    configuration,
    auth: fakeAuth(requests),
    now: () => new Date(clockIndex++ === 0 ? STARTED_AT : FINISHED_AT),
  }),
})

assert.deepEqual(
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
    authority,
    '2026-08-11T12:01:00.000Z',
  ),
  authority,
)
assert.equal(authority.executionTarget,
  'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra')
assert.equal(authority.endpointId, 'weeditpro-sam31-a100-scale-zero-v1')
assert.equal(authority.minimumReplicaCount, 0)
assert.equal(authority.maximumReplicaCount, 1)
assert.equal(authority.minimumWarmBillingWindowSeconds, 300)
assert.equal(authority.predictionUsageSkuSetIncluded, true)
assert.equal(authority.vertexManagementFeeSkuSetIncluded, true)
assert.equal(authority.trainingOrCustomJobSkuSetIncluded, false)
assert.equal(authority.computeEngineVmSkuSetIncluded, false)
assert.equal(authority.mixedOrDoubleCountedPricingSetAccepted, false)
assert.equal(authority.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(authority.walletOrCreditMutationAuthorityGranted, false)
assert.equal(authority.endpointOrGpuJobStarted, false)
assert.equal(authority.productionAuthorityGranted, false)
assert.equal(requests.length, 18)
assert.equal(requests.filter((url) => url.includes(BILLING_ACCOUNT)).length, 9)

const tampered = structuredClone(authority)
tampered.trainingOrCustomJobSkuSetIncluded = true as false
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(tampered))
const reordered = structuredClone(authority)
reordered.components.reverse()
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(reordered))
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
    authority,
    authority.expiresAt,
  ))

clockIndex = 0
const objects = new Map<string, Buffer>()
const repository =
  createCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/vertex-a100-serving-rates/v1',
  })
const receipt =
  await publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority({
    publicationId: 'vertex-a100-serving-20260811T120000Z',
    publicationVersion: 1,
    readPort:
      createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort({
        configuration,
        auth: fakeAuth([]),
        now: () => new Date(clockIndex++ === 0 ? STARTED_AT : FINISHED_AT),
      }),
    repository,
    now: () => new Date('2026-08-11T12:00:02.000Z'),
  })
assert.deepEqual(
  assertCanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceipt(
    receipt,
  ),
  receipt,
)
assert.equal(receipt.disposition, 'created')
assert.equal(receipt.billingAccountIdentifierReturned, false)
assert.equal(receipt.endpointOrGpuJobStarted, false)
assert.equal(receipt.walletOrCreditMutationAuthorityGranted, false)
const reread = await repository.reread({
  rateAuthorityRef: receipt.rateAuthorityRef,
  at: '2026-08-11T12:01:00.000Z',
})
assert.ok(reread)
assert.equal(reread.rateAuthorityHash,
  receipt.rateAuthorityRef.contentHash.slice('sha256:'.length))

console.log(JSON.stringify({
  smoke: 'canonical-current-google-cloud-vertex-a100-serving-rate-authority',
  checks: 39,
  exactOnlinePredictionUsageSkus: true,
  exactVertexManagementFeeSkus: true,
  trainingAndComputeSkuReuseRejected: true,
  billingAccountEffectivePricesOnly: true,
  scaleZeroWarmWindowBound: true,
  customerPriceWalletEndpointAndProductionAuthority: false,
}, null, 2))

function fakeAuth(requests: string[]) {
  return {
    async request(input: { url?: string }) {
      const url = input.url ?? ''
      requests.push(url)
      const configured = configuration.components.find((component) =>
        url.includes(component.priceTerm.skuId))
      assert.ok(configured)
      if (url.includes(`${BILLING_ACCOUNT}/skus/`)) {
        return { data: {
          name: `${BILLING_ACCOUNT}/skus/${configured.priceTerm.skuId}/price`,
          currencyCode: 'USD',
          skuPrices: [{
            consumptionModel: configured.priceTerm.consumptionModel,
            valueType: 'rate',
            rate: {
              tiers: [{
                startAmount: { value: '0' },
                contractPrice: { currencyCode: 'USD', units: '1', nanos: 1 },
              }],
              unitInfo: {
                unit: configured.priceTerm.expectedApiUnit,
                unitQuantity: {
                  value: configured.priceTerm.expectedApiUnitQuantity,
                },
              },
            },
          }],
        } }
      }
      const geoTaxonomy = configured.priceTerm.expectedGeoTaxonomy === 'global'
        ? { type: 'TYPE_GLOBAL' }
        : configured.priceTerm.expectedGeoTaxonomy === 'route_region'
          ? { type: 'TYPE_REGIONAL', regions: ['us-central1'] }
          : { type: 'TYPE_MULTI_REGIONAL', regions: ['us-central1'] }
      return { data: {
        name: `skus/${configured.priceTerm.skuId}`,
        skuId: configured.priceTerm.skuId,
        displayName: configured.priceTerm.expectedDisplayName,
        service: configured.priceTerm.cloudServiceId,
        geoTaxonomy,
      } }
    },
  }
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const bytes = values.get(path)
      return bytes ? Buffer.from(bytes) : null
    },
  }
}
