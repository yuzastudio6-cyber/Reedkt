import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort,
  createWeEditProVertexA100ServingRateReaderConfiguration,
} from '../tool-cost-metering/google-cloud-account-effective-vertex-a100-serving-rate-read-port'
import {
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-professional-google-cloud-gpu-rate-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceipt,
  assertCanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceiptV2,
  publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-publisher'
import {
  sealCanonicalSam31VertexServingCapacityObservation,
} from '../services/canonical-sam3_1-vertex-serving-capacity-mutation'

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
  '72B6-EE31-7A41',
  'F86F-168E-2FB6',
  '2DBC-2378-4503',
  'F559-0525-B823',
  '8714-C1C7-9ABD',
])
assert.equal(configuration.components.some((component) =>
  component.priceTerm.skuId === '8FFC-6CDE-24D7'), false)
assert.equal(configuration.components.some((component) =>
  component.skuRateBindingId.includes('training')), false)

let clockIndex = 0
const requests: string[] = []
export const authority = await observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority({
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
const capacity = sealCanonicalSam31VertexServingCapacityObservation({
  schemaVersion: 'canonical-sam3_1-vertex-serving-capacity-observation-v1',
  source: 'canonical_server_vertex_current_serving_capacity_reader',
  evidenceClass: 'canonical_private_reread',
  endpointResourceName:
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
  deployedModelId: '3101000014',
  modelVersionId: '6',
  routeId: 'a100_80gb_heavy_primary',
  accelerator: 'nvidia_a100_80gb',
  acceleratorCount: 1,
  minimumReplicaCount: 0,
  initialReplicaCount: 1,
  maximumReplicaCount: 16,
  requiredMaximumReplicaCount: 16,
  minimumScaleUpPeriodSeconds: 300,
  idleScaleDownPeriodSeconds: 300,
  dedicatedEndpointEnabled: true,
  oneExactDeployedModel: true,
  exactTrafficSplitPercent: 100,
  requestResponseLoggingEnabled: false,
  containerLoggingEnabled: false,
  exactCurrentEndpointModelVersionTrafficAndCapacityReread: true,
  currentEndpointMeetsCompleteSourceCapacity: true,
  endpointOrGpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
  observedAt: '2026-08-11T11:59:00.000Z',
  expiresAt: '2026-08-11T12:14:00.000Z',
})
const capacityAwareRequests: string[] = []
export const capacityAwareAuthority =
  await observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
    rateAuthorityId: 'vertex-a100-serving-rate:capacity-aware-smoke',
    rateAuthorityVersion: 2,
    readPort: createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort({
      configuration,
      auth: fakeAuth(capacityAwareRequests),
      now: () => new Date(clockIndex++ === 0 ? STARTED_AT : FINISHED_AT),
    }),
    capacityObservation: capacity,
  })
assert.deepEqual(
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
    capacityAwareAuthority,
    '2026-08-11T12:01:00.000Z',
  ),
  capacityAwareAuthority,
)
assert.equal(capacityAwareAuthority.maximumReplicaCount, 16)
assert.equal(capacityAwareAuthority.maximumConcurrentInvocations, 16)
assert.equal(
  capacityAwareAuthority.endpointCapacityObservationRef.contentHash,
  `sha256:${capacity.observationHash}`,
)
assert.equal(
  capacityAwareAuthority.perReplicaPricingNotMultipliedByConfiguredMaximum,
  true,
)
assert.deepEqual(
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
    capacityAwareAuthority,
    '2026-08-11T12:01:00.000Z',
  ),
  capacityAwareAuthority,
)
const crossedCapacityAuthority = structuredClone(capacityAwareAuthority)
crossedCapacityAuthority.maximumConcurrentInvocations = 15 as 16
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
    crossedCapacityAuthority,
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
const capacityAwarePublished = await repository.persistCreateOnly({
  authority: capacityAwareAuthority,
  publishedAt: '2026-08-11T12:00:02.000Z',
})
assert.equal(capacityAwarePublished.disposition, 'created')
const capacityAwareReread = await repository.reread({
  rateAuthorityRef: capacityAwarePublished.rateAuthorityRef,
  at: '2026-08-11T12:01:00.000Z',
})
assert.equal(capacityAwareReread?.schemaVersion,
  'canonical-current-google-cloud-vertex-a100-serving-rate-authority-v2')
assert.equal(capacityAwareReread?.maximumReplicaCount, 16)
clockIndex = 0
const capacityAwareReceipt =
  await publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
    publicationId: 'vertex-a100-serving-capacity-aware-20260811T120000Z',
    publicationVersion: 2,
    readPort:
      createGoogleCloudAccountEffectiveVertexA100ServingRateReadPort({
        configuration,
        auth: fakeAuth([]),
        now: () => new Date(clockIndex++ === 0 ? STARTED_AT : FINISHED_AT),
      }),
    capacityObservation: capacity,
    repository,
    now: () => new Date('2026-08-11T12:00:02.000Z'),
  })
assert.deepEqual(
  assertCanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceiptV2(
    capacityAwareReceipt,
  ),
  capacityAwareReceipt,
)
assert.equal(capacityAwareReceipt.maximumReplicaCount, 16)
assert.equal(capacityAwareReceipt.maximumConcurrentInvocations, 16)
assert.equal(capacityAwareReceipt.exactCurrentEndpointCapacityReread, true)

console.log(JSON.stringify({
  smoke: 'canonical-current-google-cloud-vertex-a100-serving-rate-authority',
  checks: 55,
  exactOnlinePredictionUsageSkus: true,
  exactVertexManagementFeeSkus: true,
  trainingAndComputeSkuReuseRejected: true,
  billingAccountEffectivePricesOnly: true,
  scaleZeroWarmWindowBound: true,
  configuredCapacitySeparatedFromPerReplicaRate: true,
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
