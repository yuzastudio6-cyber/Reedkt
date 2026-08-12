import assert from 'node:assert/strict'

import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalSam31VertexCloudImageBuildAuthority,
  type CanonicalSam31VertexCloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-vertex-cloud-image-build-authority'
import {
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  admitCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-admission-service'
import {
  observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority,
} from '../services/canonical-current-google-cloud-vertex-a100-serving-quota-authority'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  authority as fixtureImageBuildAuthority,
  qualifiedSupplyChain as fixtureImageSupplyChainRelease,
} from './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import {
  release as sourceCheckpointRelease,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner-smoke'

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
const quotaAuthority =
  await observeCanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority({
    quotaAuthorityId: 'vertex-serving-a100-quota',
    quotaAuthorityVersion: 2,
    now: () => new Date('2026-08-11T18:00:00.000Z'),
    auth: {
      async request() {
        return { data: {
          metric:
            'aiplatform.googleapis.com/custom_model_serving_nvidia_a100_80gb_gpus',
          displayName: 'Custom model serving Nvidia A100 80GB GPUs',
          consumerQuotaLimits: [{
            unit: '1/{project}/{region}',
            isPrecise: true,
            quotaBuckets: [{
              effectiveLimit: '1',
              producerOverride: {
                overrideValue: '1', dimensions: { region: 'us-central1' },
              },
              consumerOverride: {
                overrideValue: '-1', dimensions: { region: 'us-central1' },
              },
              dimensions: { region: 'us-central1' },
            }],
          }],
        } }
      },
    },
  })
const servingQuotaPreferenceRef = {
  id: quotaAuthority.quotaAuthorityId,
  version: quotaAuthority.quotaAuthorityVersion,
  contentHash: `sha256:${quotaAuthority.authorityHash}` as const,
}
const sourceCheckpointQualificationRef =
  sourceCheckpointRelease.sourceCheckpointQualificationRef
const { authorityHash: _fixtureAuthorityHash, ...fixtureAuthorityPayload } =
  fixtureImageBuildAuthority
void _fixtureAuthorityHash
const imageBuildAuthorityPayload = {
  ...fixtureAuthorityPayload,
  sourceCheckpointQualificationRef,
  buildClosure: {
    ...fixtureAuthorityPayload.buildClosure,
    sourceCheckpointQualificationRecordHash:
      sourceCheckpointQualificationRef.contentHash.slice(7),
  },
}
const imageBuildAuthority = assertCanonicalSam31VertexCloudImageBuildAuthority({
  ...imageBuildAuthorityPayload,
  authorityHash: sha256AuthorityValue(imageBuildAuthorityPayload),
})
const imageBuildAuthorityRef = {
  id: imageBuildAuthority.authorityId,
  version: imageBuildAuthority.authorityVersion,
  contentHash: `sha256:${imageBuildAuthority.authorityHash}` as const,
}
const { releaseHash: _fixtureReleaseHash, ...fixtureReleasePayload } =
  fixtureImageSupplyChainRelease
void _fixtureReleaseHash
const imageSupplyChainReleasePayload = {
  ...fixtureReleasePayload,
  buildAuthorityRef: imageBuildAuthorityRef,
  provenance: {
    ...fixtureReleasePayload.provenance,
    buildAuthorityRef: imageBuildAuthorityRef,
  },
}
const imageSupplyChainRelease = assertCanonicalSam31CloudImageSupplyChainRelease({
  ...imageSupplyChainReleasePayload,
  releaseHash: sha256AuthorityValue(imageSupplyChainReleasePayload),
})
const request = {
  imageSupplyChainReleaseRef: {
    id: imageSupplyChainRelease.releaseId,
    version: imageSupplyChainRelease.releaseVersion,
    contentHash: `sha256:${imageSupplyChainRelease.releaseHash}` as const,
  },
  immutableImageRef: imageSupplyChainRelease.immutableImageRef,
  immutableImageUri: imageSupplyChainRelease.immutableImageUri,
  immutableImageDigest: imageSupplyChainRelease.immutableImageDigest,
  sourceCheckpointQualificationRef,
  servingQuotaPreferenceRef,
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
const quotaRepository = (
  value: CanonicalCurrentGoogleCloudVertexA100ServingQuotaAuthority | null,
) => ({
  schemaVersion:
    'canonical-current-google-cloud-vertex-a100-serving-quota-repository-v1' as const,
  async persistCreateOnly(): Promise<never> {
    throw new Error('not used')
  },
  async reread() {
    return value
  },
})
const imageReleaseRepository = (
  value: CanonicalSam31CloudImageSupplyChainRelease | null,
) => ({
  async rereadQualifiedRelease() {
    return value
  },
})
const imageBuildRepository = (
  value: CanonicalSam31VertexCloudImageBuildAuthority | null,
) => ({
  async rereadBuildAuthority() {
    return value
  },
})
const sourceReleaseReadPort = (
  value: typeof sourceCheckpointRelease | null,
) => ({
  async rereadQualificationRelease() {
    return value
  },
})

const profile = await admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(authority),
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
})
assert.equal(profile.accountEffectiveRateAuthorityRef.version, 7)
assert.equal(profile.sourceCheckpointQualificationRef.version, 2)
assert.equal(profile.dedicatedResources.minimumReplicaCount, 0)
assert.equal(
  profile.runtimeReleaseSequence.runtimeReleaseRequiredBeforeDeployment,
  false,
)
assert.equal(profile.qualificationGate.customerDispatchAllowed, false)

await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(null),
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
}))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(authority),
  quotaAuthorityRepository: quotaRepository(null),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
}))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(authority),
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository: imageReleaseRepository(null),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
}))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(authority),
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(null),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
}))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request,
  rateAuthorityRepository: repository(authority),
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort: sourceReleaseReadPort(null),
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
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
}))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: { ...request, extra: true },
  rateAuthorityRepository: repository(authority),
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
} as never))
await assert.rejects(() => admitCanonicalSam31VertexScaleZeroDeploymentProfile({
  request: {
    ...request,
    runtimeReleaseRef: ref('premature-runtime-release', 'f', 1),
  },
  rateAuthorityRepository: repository(authority),
  quotaAuthorityRepository: quotaRepository(quotaAuthority),
  imageSupplyChainReleaseRepository:
    imageReleaseRepository(imageSupplyChainRelease),
  imageBuildRepository: imageBuildRepository(imageBuildAuthority),
  sourceCheckpointQualificationReleaseReadPort:
    sourceReleaseReadPort(sourceCheckpointRelease),
} as never))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-scale-zero-deployment-admission',
  checks: 21,
  accountEffectiveServingRateReread: true,
  liveServingQuotaReread: true,
  exactImageSupplyChainReleaseReread: true,
  exactImageBuildAuthorityReread: true,
  exactCurrentSourceCheckpointReleaseReread: true,
  callerSuppliedRateRefAloneAccepted: false,
  currentEvidenceVersionsAccepted: true,
  prematureRuntimeReleaseRejected: true,
  endpointOrGpuJobStarted: false,
  customerDispatchAllowed: false,
  productionReady: false,
}, null, 2))
