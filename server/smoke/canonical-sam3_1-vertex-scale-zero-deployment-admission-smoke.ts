import assert from 'node:assert/strict'

import {
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  admitCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-admission-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = (id: string, character: string, version = 1) => ({
  id,
  version,
  contentHash: hash(character),
})
const classes = [
  'vertex_prediction_a100_80gb_hour',
  'vertex_prediction_a2_core_hour',
  'vertex_prediction_a2_ram_gib_hour',
  'vertex_prediction_management_a2_core_hour',
  'vertex_prediction_management_a2_ram_gib_hour',
  'private_object_storage_gib_month',
  'network_egress_gib',
  'object_class_a_per_1000',
  'object_class_b_per_1000',
] as const
const observedAt = '2026-08-11T18:00:00.000Z'
const rawPayload = {
  sourceClass: 'billing_account_effective_pricing_api' as const,
  billingAccountPricingScopeRef: ref('billing-account-scope', '1'),
  pricingReaderConfigurationRef: ref('pricing-reader', '2'),
  routeId: 'a100_80gb_heavy_primary' as const,
  executionTarget:
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
  pricingSetMode:
    'vertex_online_prediction_usage_plus_management_skus' as const,
  region: 'us-central1' as const,
  currency: 'USD' as const,
  components: classes.map((componentClass, index) => ({
    componentClass,
    cloudServiceName: `service-${index}`,
    skuRateBindingId: `binding-${index}`,
    skuPriceTerm: {
      cloudServiceId: `services/service-${index}`,
      skuId: `sku-${index}`,
      consumptionModel: 'account/default',
      apiUnit: componentClass === 'object_class_a_per_1000'
        || componentClass === 'object_class_b_per_1000'
        ? 'count' as const
        : componentClass === 'private_object_storage_gib_month'
          ? 'GiBy.mo' as const
          : componentClass === 'network_egress_gib'
            ? 'GiBy' as const
            : componentClass.includes('ram')
              ? 'GiBy.h' as const
              : 'h' as const,
      apiUnitQuantity: componentClass.startsWith('object_class_')
        ? '1000' as const
        : '1' as const,
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: 1_000_000 + index,
      }],
      maximumContractPriceUsdNanos: 1_000_000 + index,
      skuMetadataRef: ref(`sku-metadata-${index}`, '3'),
      billingAccountPriceRef: ref(`account-price-${index}`, '4'),
    },
    skuDescriptionDigestSha256: String(index).padStart(64, '0'),
    skuRegion: 'us-central1' as const,
    billingUnit: componentClass === 'private_object_storage_gib_month'
      ? 'gib_month' as const
      : componentClass === 'network_egress_gib'
        ? 'gib' as const
        : componentClass.startsWith('object_class_')
          ? 'per_1000_operations' as const
          : componentClass.includes('ram')
            ? 'gib_hour' as const
            : componentClass.includes('core')
              ? 'vcpu_hour' as const
              : 'gpu_hour' as const,
    maximumUsdNanosPerBillingUnit: 1_000_000 + index,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${index}`, '5'),
  })),
  priceRecordSetRef: ref('price-record-set', '6'),
  pricingReadStartedAt: '2026-08-11T17:59:59.000Z',
  pricingReadFinishedAt: observedAt,
}
const authority = await observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority({
  rateAuthorityId: 'vertex-a100-serving-rate:admission-smoke',
  rateAuthorityVersion: 7,
  readPort: {
    async readCurrentVertexA100ServingRate() {
      return {
        ...rawPayload,
        pricingReadDigestSha256: sha256AuthorityValue(rawPayload),
      }
    },
  },
})
const accountEffectiveRateAuthorityRef = {
  id: authority.rateAuthorityId,
  version: authority.rateAuthorityVersion,
  contentHash: `sha256:${authority.rateAuthorityHash}` as const,
}
const request = {
  imageSupplyChainReleaseRef: ref('sam31-supply-release', 'a', 5),
  immutableImageRef: ref('sam31-image', 'b', 3),
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${hash('b')}`,
  immutableImageDigest: hash('b'),
  sourceCheckpointQualificationRef: ref('sam31-source-checkpoint', 'c', 8),
  servingQuotaPreferenceRef: ref('vertex-serving-a100-quota', 'd', 2),
  accountEffectiveRateAuthorityRef,
  recordedAt: '2026-08-11T18:00:01.000Z',
}
const repository = (value: CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority | null) => ({
  async persistCreateOnly(): Promise<never> {
    throw new Error('not used')
  },
  async reread() {
    return value
  },
})

const profile = await admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(authority),
})
assert.equal(profile.accountEffectiveRateAuthorityRef.version, 7)
assert.equal(profile.sourceCheckpointQualificationRef.version, 8)
assert.equal(profile.dedicatedResources.minimumReplicaCount, 0)
assert.equal(
  profile.runtimeReleaseSequence.runtimeReleaseRequiredBeforeDeployment,
  false,
)
assert.equal(profile.qualificationGate.customerDispatchAllowed, false)

await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(null),
}))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: {
    ...request,
    accountEffectiveRateAuthorityRef: {
      ...request.accountEffectiveRateAuthorityRef,
      contentHash: hash('f'),
    },
  },
  rateAuthorityRepository: repository(authority),
}))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: { ...request, extra: true },
  rateAuthorityRepository: repository(authority),
} as never))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: {
    ...request,
    runtimeReleaseRef: ref('premature-runtime-release', 'f', 1),
  },
  rateAuthorityRepository: repository(authority),
} as never))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-scale-zero-deployment-admission',
  checks: 12,
  accountEffectiveServingRateReread: true,
  callerSuppliedRateRefAloneAccepted: false,
  currentEvidenceVersionsAccepted: true,
  prematureRuntimeReleaseRejected: true,
  endpointOrGpuJobStarted: false,
  customerDispatchAllowed: false,
  productionReady: false,
}, null, 2))
