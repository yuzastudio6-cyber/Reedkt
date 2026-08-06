import assert from 'node:assert/strict'

import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const observedAt = '2026-08-02T16:00:00.000Z'
const hash = (character: string) => character.repeat(64)
const ref = (id: string, character: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${hash(character)}`,
})

const a100 = await observe('a100_80gb_heavy_primary')
const l4Fallback = await observe('l4_heavy_fallback')
const l4Standard = await observe('l4_standard_primary')

assert.equal(a100.pricingModel, 'bundled_accelerator_optimized_machine')
assert.equal(a100.components[0].componentClass,
  'a2_ultragpu_1g_machine_bundle')
assert.equal(a100.components.some((component) =>
  component.componentClass === 'cloud_run_vcpu_second'), false)
assert.equal(a100.accelerator, 'nvidia_a100_80gb')
assert.equal(l4Fallback.routeRole, 'heavy_fallback')
assert.equal(l4Fallback.profileId,
  'quality_l4_user_triggered_heavy_fallback_job_v1')
assert.equal(l4Standard.routeRole, 'standard_primary')
assert.equal(l4Standard.profileId,
  'quality_l4_user_triggered_standard_media_job_v1')
assert.equal(l4Standard.components.length, 7)
assert.equal(
  l4Standard.components[0].maximumUsdNanosPerBillingUnit,
  186_700,
)
assert.equal(l4Standard.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(l4Standard.walletOrCreditMutationAuthorityGranted, false)
assert.equal(
  assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    l4Standard,
    '2026-08-03T15:59:59.999Z',
  ).rateAuthorityHash,
  l4Standard.rateAuthorityHash,
)
assert.throws(() => assertCanonicalCurrentGoogleCloudGpuRateAuthority(
  l4Standard,
  '2026-08-03T16:00:00.000Z',
))

const tampered = structuredClone(l4Standard)
tampered.components[0].maximumUsdNanosPerBillingUnit += 1
assert.throws(() => assertCanonicalCurrentGoogleCloudGpuRateAuthority(
  tampered,
))

console.log(JSON.stringify({
  smoke: 'canonical-current-google-cloud-gpu-rate-authority',
  checks: 22,
  routeCount: 3,
  a100PricingModel: a100.pricingModel,
  l4PricingModel: l4Standard.pricingModel,
  l4StandardComponentCount: l4Standard.components.length,
  rateAuthorityMaximumAgeSeconds: l4Standard.maximumAuthorityAgeSeconds,
  customerPricingAuthorityGranted:
    l4Standard.customerPricingOrServiceFeeAuthorityGranted,
  walletOrCreditMutationAuthorityGranted:
    l4Standard.walletOrCreditMutationAuthorityGranted,
  rateHashes: [
    a100.rateAuthorityHash,
    l4Fallback.rateAuthorityHash,
    l4Standard.rateAuthorityHash,
  ],
}))

async function observe(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: `current-rate-${routeId}-v1`,
    rateAuthorityVersion: 1,
    routeId,
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawObservation(routeId)
      },
    },
  })
}

function rawObservation(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
): CanonicalGoogleCloudGpuRateRawObservation {
  const region = 'us-central1' as const
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
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef:
      ref('billing-account-pricing-scope', '8'),
    pricingReaderConfigurationRef:
      ref('gpu-rate-reader-configuration', '7'),
    routeId,
    region,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`, '9'),
    pricingReadStartedAt: '2026-08-02T15:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...base,
    pricingReadDigestSha256: sha256AuthorityValue(base),
  }
}

function commonComponents() {
  return [
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, 'e'),
    component('network_egress_gib',
      'gib', 120_000_000, 'f'),
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
  usdNanosPerBillingUnit: number,
  character: string,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run'
    : componentClass.startsWith('a2_')
      ? 'service-compute-engine'
      : 'service-cloud-storage'
  const skuId = `sku-${componentClass}`
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
      skuId,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: usdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: usdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef:
        ref(`account-price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: usdNanosPerBillingUnit,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}
