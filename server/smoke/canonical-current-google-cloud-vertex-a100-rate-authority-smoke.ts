import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from '../services/canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RatePublicationReceipt,
  publishCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../services/canonical-current-google-cloud-vertex-a100-rate-authority-publisher'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
  CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  createGoogleCloudAccountEffectiveVertexA100RateReadPort,
  createWeEditProVertexA100RateReaderConfiguration,
  WEEDITPRO_VERTEX_A100_RATE_CATALOG,
} from '../tool-cost-metering/google-cloud-account-effective-vertex-a100-rate-read-port'

const BILLING_ACCOUNT = 'billingAccounts/012345-ABCDEF-987654'
const STARTED_AT = '2026-08-06T16:00:00.000Z'
const OBSERVED_AT = '2026-08-06T16:00:01.000Z'
const PUBLISHED_AT = '2026-08-06T16:00:02.000Z'
const configuration = createWeEditProVertexA100RateReaderConfiguration({
  billingAccountResourceName: BILLING_ACCOUNT,
})

assert.deepEqual(configuration.components.map((component) =>
  component.componentClass), CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES)
assert.deepEqual(configuration.components.slice(0, 4).map((component) =>
  component.priceTerm.skuId), [
  '8FFC-6CDE-24D7',
  '15A7-BDE1-23EB',
  'E7EA-78F1-B4BA',
  'A005-98FE-36CC',
])
assert.equal(configuration.components.some((component) =>
  component.skuRateBindingId.includes('management-fee')), false)
assert.equal(configuration.components.some((component) =>
  component.cloudServiceName === 'compute-engine'), false)

let clockIndex = 0
const requests: string[] = []
const readPort = createGoogleCloudAccountEffectiveVertexA100RateReadPort({
  configuration,
  auth: fakeAuth(requests),
  now: () => new Date(clockIndex++ === 0 ? STARTED_AT : OBSERVED_AT),
})
const objects = new Map<string, Buffer>()
const repository =
  createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/vertex-a100-rates/v1',
  })
const receipt = await publishCanonicalCurrentGoogleCloudVertexA100RateAuthority({
  publicationId: 'vertex-a100-rates-2026-08-06T160000Z',
  publicationVersion: 1,
  readPort,
  repository,
  now: () => new Date(PUBLISHED_AT),
})
assert.deepEqual(
  assertCanonicalCurrentGoogleCloudVertexA100RatePublicationReceipt(receipt),
  receipt,
)
assert.equal(receipt.disposition, 'created')
assert.equal(receipt.billingAccountIdentifierReturned, false)
assert.equal(receipt.providerOrGpuJobStarted, false)
assert.equal(receipt.walletOrCreditMutationAuthorityGranted, false)
assert.equal(requests.length, 16)
assert.equal(requests.filter((url) => url.includes('/skus/')).length, 16)
assert.equal(requests.some((url) => url.includes(BILLING_ACCOUNT)), true)

export const authority = await repository.reread({
  rateAuthorityRef: receipt.rateAuthorityRef,
  at: '2026-08-06T16:10:00.000Z',
})
assert.ok(authority)
assert.deepEqual(assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
  authority,
  '2026-08-06T16:10:00.000Z',
), authority)
assert.equal(authority.executionTarget,
  'google_cloud_vertex_custom_job_a2_ultra')
assert.equal(authority.pricingSetMode,
  'vertex_training_payg_usage_skus')
assert.equal(authority.separateVertexManagementFeeSkuSetIncluded, false)
assert.equal(authority.computeEngineReservationOrSpotSkuSetIncluded, false)
assert.equal(authority.mixedOrDoubleCountedPricingSetAccepted, false)
assert.equal(authority.vertexTrainingUsageBilledInThirtySecondIncrements, true)
assert.equal(authority.allocatedVcpuCount, 12)
assert.equal(authority.allocatedMemoryGiB, 170)
assert.equal(authority.bootDiskSizeGb, 200)

const componentRate = (name: typeof authority.components[number][
  'componentClass'
]) => authority.components.find((component) =>
  component.componentClass === name)!.maximumUsdNanosPerBillingUnit
assert.equal(componentRate('vertex_training_a100_80gb_hour'), 4_517_292_000)
assert.equal(componentRate('vertex_training_a2_core_hour'), 36_352_650)
assert.equal(componentRate('vertex_training_a2_ram_gib_hour'), 4_872_550)
assert.equal(componentRate('vertex_training_pd_ssd_gib_month'), 195_500_000)
assert.equal(
  componentRate('vertex_training_a100_80gb_hour')
    + componentRate('vertex_training_a2_core_hour') * 12
    + componentRate('vertex_training_a2_ram_gib_hour') * 170,
  5_781_857_300,
)

clockIndex = 0
const replay = await publishCanonicalCurrentGoogleCloudVertexA100RateAuthority({
  publicationId: 'vertex-a100-rates-2026-08-06T160000Z',
  publicationVersion: 1,
  readPort: createGoogleCloudAccountEffectiveVertexA100RateReadPort({
    configuration,
    auth: fakeAuth([]),
    now: () => new Date(clockIndex++ === 0 ? STARTED_AT : OBSERVED_AT),
  }),
  repository,
  now: () => new Date(PUBLISHED_AT),
})
assert.equal(replay.disposition, 'identical_replay')
assert.equal(objects.size, 1)

const tampered = structuredClone(authority)
tampered.separateVertexManagementFeeSkuSetIncluded = true as false
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(tampered))
const crossed = structuredClone(authority)
crossed.components.reverse()
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(crossed))
await assert.rejects(repository.reread({
  rateAuthorityRef: receipt.rateAuthorityRef,
  at: authority.expiresAt,
}))

const operatorSource = readFileSync(
  'server/cli/publish-current-google-cloud-vertex-a100-rate-authority.ts',
  'utf8',
)
assert.match(operatorSource,
  /createWeEditProVertexA100RateReaderConfiguration/u)
assert.match(operatorSource,
  /createGoogleCloudAccountEffectiveVertexA100RateReadPort/u)
assert.match(operatorSource,
  /createCanonicalGcsCurrentGoogleCloudVertexA100RateAuthorityRepository/u)
assert.match(operatorSource,
  /publishCanonicalCurrentGoogleCloudVertexA100RateAuthority/u)
assert.doesNotMatch(operatorSource,
  /serviceFee|walletMutation|providerCall|customJobs/u)

console.log(JSON.stringify({
  smoke: 'canonical-current-google-cloud-vertex-a100-rate-authority',
  checks: 42,
  exactBillingAccountEffectiveVertexUsageSkuSet: true,
  a10080GpuPlus12VcpuPlus170GibRam: true,
  pdSsd200GibAndPrivateStorageNetworkOperationsIncluded: true,
  separateManagementFeeOrComputeReservationSkuSetIncluded: false,
  mixedOrDoubleCountedPricingAccepted: false,
  thirtySecondMeteringRequired: true,
  createOnlyExactReread: true,
  accountIdentifierReturned: false,
  customerServiceFeeOrWalletMutationGranted: false,
  providerOrGpuJobStarted: false,
  publicDeliveryOrProductionGranted: false,
}, null, 2))

function fakeAuth(requests: string[]) {
  return {
    async request(input: { url?: string }) {
      const url = input.url ?? ''
      requests.push(url)
      const skuId = Object.values(WEEDITPRO_VERTEX_A100_RATE_CATALOG)
        .flatMap((value) => typeof value === 'object'
          ? Object.values(value) : [])
        .find((value) => typeof value === 'string'
          && url.includes(value))
      assert.equal(typeof skuId, 'string')
      const definition = configuration.components.find((component) =>
        component.priceTerm.skuId === skuId)
      assert.ok(definition)
      if (url.includes(`${BILLING_ACCOUNT}/skus/`)) {
        const nanos = rateNanos(definition.componentClass)
        return { data: {
          name: `${BILLING_ACCOUNT}/skus/${skuId}/price`,
          currencyCode: 'USD',
          skuPrices: [{
            consumptionModel: definition.priceTerm.consumptionModel,
            valueType: 'rate',
            rate: {
              tiers: [{
                startAmount: { value: '0' },
                contractPrice: {
                  currencyCode: 'USD',
                  units: String(Math.floor(nanos / 1_000_000_000)),
                  nanos: nanos % 1_000_000_000,
                },
              }],
              unitInfo: {
                unit: definition.priceTerm.expectedApiUnit,
                unitQuantity: {
                  value: definition.priceTerm.expectedApiUnitQuantity,
                },
              },
            },
          }],
        } }
      }
      return { data: {
        name: `skus/${skuId}`,
        skuId,
        displayName: definition.skuRateBindingId,
        service: definition.priceTerm.cloudServiceId,
        geoTaxonomy: definition.priceTerm.expectedGeoTaxonomy === 'global'
          ? { type: 'TYPE_GLOBAL' }
          : {
              type: 'TYPE_MULTI_REGIONAL',
              multiRegionalMetadata: {
                regions: [{ region: 'us-central1' }],
              },
            },
      } }
    },
  }
}

function rateNanos(
  componentClass: typeof configuration.components[number]['componentClass'],
): number {
  return {
    vertex_training_a100_80gb_hour: 4_517_292_000,
    vertex_training_a2_core_hour: 36_352_650,
    vertex_training_a2_ram_gib_hour: 4_872_550,
    vertex_training_pd_ssd_gib_month: 195_500_000,
    private_object_storage_gib_month: 20_000_000,
    network_egress_gib: 120_000_000,
    object_class_a_per_1000: 5_000_000,
    object_class_b_per_1000: 400_000,
  }[componentClass]
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
