import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthorityPublicationReceipt,
  publishCanonicalCurrentGoogleCloudGpuRateAuthorities,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-publisher'
import type {
  CanonicalGoogleCloudGpuRateRawObservation,
  CanonicalGoogleCloudGpuRateReadPort,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const observedAt = '2026-08-04T16:00:00.000Z'
const publishedAt = '2026-08-04T16:00:01.000Z'
const events: string[] = []
const objects = new Map<string, Buffer>()
const repository = createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
  objectPort: memoryObjectPort(objects, events),
  prefix: 'private/smoke/gpu-rate-publication/v1',
})
const readPort = fakeReadPort(events)

const first = await publishCanonicalCurrentGoogleCloudGpuRateAuthorities({
  publicationId: 'gpu-rates-2026-08-04T160000Z',
  publicationVersion: 1,
  readPort,
  repository,
  now: () => new Date(publishedAt),
})
assert.deepEqual(
  assertCanonicalCurrentGoogleCloudGpuRateAuthorityPublicationReceipt(first),
  first,
)
assert.deepEqual(first.routePublications.map((route) => route.routeId), [
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
assert.deepEqual(first.routePublications.map((route) => route.disposition), [
  'created', 'created', 'created',
])
assert.equal(events.slice(0, 3).every((event) =>
  event.startsWith('observe:')), true)
assert.equal(events.slice(3).every((event) =>
  event.startsWith('persist:') || event.startsWith('reread:')), true)
assert.equal(objects.size, 3)
assert.equal(first.billingAccountIdentifierReturned, false)
assert.equal(first.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(first.walletOrCreditMutationAuthorityGranted, false)
assert.equal(first.providerOrGpuJobStarted, false)

events.length = 0
const replay = await publishCanonicalCurrentGoogleCloudGpuRateAuthorities({
  publicationId: 'gpu-rates-2026-08-04T160000Z',
  publicationVersion: 1,
  readPort,
  repository,
  now: () => new Date(publishedAt),
})
assert.deepEqual(replay.routePublications.map((route) => route.disposition), [
  'identical_replay', 'identical_replay', 'identical_replay',
])
assert.equal(objects.size, 3)

const tampered = structuredClone(first)
tampered.routePublications.reverse()
assert.throws(() =>
  assertCanonicalCurrentGoogleCloudGpuRateAuthorityPublicationReceipt(tampered))

const noWrites = new Map<string, Buffer>()
await assert.rejects(() => publishCanonicalCurrentGoogleCloudGpuRateAuthorities({
  publicationId: 'gpu-rates-cross-account-rejected',
  publicationVersion: 1,
  readPort: fakeReadPort([], 'cross_account'),
  repository: createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
    objectPort: memoryObjectPort(noWrites, []),
    prefix: 'private/smoke/gpu-rate-publication-cross-account/v1',
  }),
  now: () => new Date(publishedAt),
}), /one exact set/u)
assert.equal(noWrites.size, 0)

const missingRouteWrites = new Map<string, Buffer>()
await assert.rejects(() => publishCanonicalCurrentGoogleCloudGpuRateAuthorities({
  publicationId: 'gpu-rates-missing-route-rejected',
  publicationVersion: 1,
  readPort: fakeReadPort([], 'missing_standard'),
  repository: createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
    objectPort: memoryObjectPort(missingRouteWrites, []),
    prefix: 'private/smoke/gpu-rate-publication-missing-route/v1',
  }),
  now: () => new Date(publishedAt),
}))
assert.equal(missingRouteWrites.size, 0)

const operatorSource = readFileSync(
  'server/cli/publish-current-google-cloud-gpu-rate-authorities.ts',
  'utf8',
)
assert.match(operatorSource,
  /createWeEditProGoogleCloudGpuRateReaderConfiguration/u)
assert.match(operatorSource,
  /createGoogleCloudAccountEffectiveGpuRateReadPort/u)
assert.match(operatorSource,
  /createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository/u)
assert.match(operatorSource,
  /publishCanonicalCurrentGoogleCloudGpuRateAuthorities/u)
assert.match(operatorSource,
  /WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME/u)
assert.doesNotMatch(operatorSource, /serviceFee|wallet|creditMutation/u)

console.log(JSON.stringify({
  smoke: 'canonical-current-google-cloud-gpu-rate-authority-publisher',
  checks: 31,
  allThreeRoutesObservedBeforePersistence: true,
  accountEffectiveBillingScopeAndReaderExact: true,
  partialOrCrossAccountSetRejectedBeforePersistence: true,
  exactReplayAccepted: true,
  operatorUsesLiveBillingReaderAndCreateOnlyRepository: true,
  customerPricingOrServiceFeeGranted: false,
  walletOrCreditsMutated: false,
  gpuOrProviderStarted: false,
  productionReady: false,
}, null, 2))

function fakeReadPort(
  eventLog: string[],
  mode: 'valid' | 'cross_account' | 'missing_standard' = 'valid',
): CanonicalGoogleCloudGpuRateReadPort {
  return {
    async readCurrentRouteRate(input) {
      eventLog.push(`observe:${input.routeId}`)
      if (mode === 'missing_standard'
        && input.routeId === 'l4_standard_primary') {
        throw new Error('Synthetic missing route.')
      }
      return rawObservation(
        input.routeId,
        mode === 'cross_account' && input.routeId === 'l4_standard_primary'
          ? '6'
          : '8',
      )
    },
  }
}

function rawObservation(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
  billingCharacter = '8',
): CanonicalGoogleCloudGpuRateRawObservation {
  const components = routeId === 'a100_80gb_heavy_primary'
    ? [
        component('a2_ultragpu_1g_machine_bundle',
          'machine_hour', 5_068_797_890, 'a'),
        ...commonComponents(),
      ]
    : [
        component('cloud_run_l4_gpu_second',
          'gpu_second', 186_700, 'b'),
        component('cloud_run_vcpu_second',
          'vcpu_second', 18_000, 'c'),
        component('cloud_run_memory_gib_second',
          'gib_second', 2_000, 'd'),
        ...commonComponents(),
      ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef:
      ref('billing-account-pricing-scope', billingCharacter),
    pricingReaderConfigurationRef:
      ref('gpu-rate-reader-configuration', '7'),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`, '9'),
    pricingReadStartedAt: '2026-08-04T15:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
  }
}

function commonComponents() {
  return [
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, 'e'),
    component('network_egress_gib', 'gib', 120_000_000, 'f'),
    component('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '1'),
    component('object_class_b_per_1000',
      'per_1000_operations', 400_000, '2'),
  ]
}

function component(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  usdNanos: number,
  character: string,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run'
    : componentClass.startsWith('a2_')
      ? 'service-compute-engine'
      : 'service-cloud-storage'
  return {
    componentClass,
    cloudServiceName: componentClass.startsWith('cloud_run')
      ? 'cloud-run'
      : componentClass.startsWith('a2_')
        ? 'compute-engine'
        : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: usdNanos,
      }],
      maximumContractPriceUsdNanos: usdNanos,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef: ref(`account-price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: character.repeat(64),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: usdNanos,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}

function ref(id: string, character: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${character.repeat(64)}`,
  }
}

function memoryObjectPort(
  values: Map<string, Buffer>,
  eventLog: string[],
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      eventLog.push(`persist:${input.objectPath}`)
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      eventLog.push(`reread:${path}`)
      const body = values.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}
