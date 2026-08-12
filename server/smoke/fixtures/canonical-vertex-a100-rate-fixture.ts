import {
  CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalGoogleCloudVertexA100ServingRateRawObservation,
} from '../../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'

const hash = (character: string) => character.repeat(64)
const ref = (id: string, character: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${hash(character)}`,
})

export async function observeCanonicalVertexA100RateFixture(input: {
  readonly observedAt: string
  readonly rateAuthorityId?: string
  readonly rateAuthorityVersion?: number
  readonly billingAccountPricingScopeRef?: EvidenceRef
  readonly billingAccountRefId?: string
  readonly billingAccountCharacter?: string
  readonly pricingReaderConfigurationRef?: EvidenceRef
  readonly readerRefId?: string
  readonly readerCharacter?: string
}) {
  return observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority({
    rateAuthorityId:
      input.rateAuthorityId ?? 'current-vertex-a100-serving-rate-v1',
    rateAuthorityVersion: input.rateAuthorityVersion ?? 1,
    readPort: {
      async readCurrentVertexA100ServingRate() {
        return createCanonicalVertexA100RateRawObservation(input)
      },
    },
  })
}

function createCanonicalVertexA100RateRawObservation(input: {
  readonly observedAt: string
  readonly billingAccountPricingScopeRef?: EvidenceRef
  readonly billingAccountRefId?: string
  readonly billingAccountCharacter?: string
  readonly pricingReaderConfigurationRef?: EvidenceRef
  readonly readerRefId?: string
  readonly readerCharacter?: string
}): CanonicalGoogleCloudVertexA100ServingRateRawObservation {
  const observedAt = input.observedAt
  const components = [
    component('vertex_prediction_a100_80gb_hour', 'gpu_hour', 'h',
      4_517_292_000, 'a', observedAt),
    component('vertex_prediction_a2_core_hour', 'vcpu_hour', 'h',
      36_352_650, 'b', observedAt),
    component('vertex_prediction_a2_ram_gib_hour', 'gib_hour', 'GiBy.h',
      4_872_550, 'c', observedAt),
    component('vertex_prediction_management_a2_core_hour', 'vcpu_hour', 'h',
      3_635_265, 'd', observedAt),
    component('vertex_prediction_management_a2_ram_gib_hour', 'gib_hour',
      'GiBy.h', 487_255, '3', observedAt),
    component('private_object_storage_gib_month', 'gib_month', 'GiBy.mo',
      20_000_000, 'e', observedAt),
    component('network_egress_gib', 'gib', 'GiBy',
      120_000_000, 'f', observedAt),
    component('object_class_a_per_1000', 'per_1000_operations', 'count',
      5_000_000, '1', observedAt, '1000'),
    component('object_class_b_per_1000', 'per_1000_operations', 'count',
      400_000, '2', observedAt, '1000'),
  ]
  const observedAtMs = Date.parse(observedAt)
  if (!Number.isFinite(observedAtMs)) {
    throw new Error('Vertex A100 fixture observedAt must be an ISO timestamp.')
  }
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: input.billingAccountPricingScopeRef ?? ref(
      input.billingAccountRefId ?? 'billing-account-pricing-scope',
      input.billingAccountCharacter ?? '8',
    ),
    pricingReaderConfigurationRef:
      input.pricingReaderConfigurationRef ?? ref(
        input.readerRefId ?? 'gpu-rate-reader-configuration',
        input.readerCharacter ?? '7',
      ),
    routeId: 'a100_80gb_heavy_primary' as const,
    executionTarget:
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const,
    pricingSetMode:
      'vertex_online_prediction_usage_plus_management_skus' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('vertex-a100-serving-price-record-set', '9'),
    pricingReadStartedAt: new Date(observedAtMs - 5_000).toISOString(),
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
  }
}

interface EvidenceRef {
  readonly id: string
  readonly version: number
  readonly contentHash: `sha256:${string}`
}

function component(
  componentClass:
    typeof CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES[number],
  billingUnit:
    | 'gpu_hour'
    | 'vcpu_hour'
    | 'gib_hour'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  apiUnit: 'h' | 'GiBy.h' | 'GiBy.mo' | 'GiBy' | 'count',
  maximumUsdNanosPerBillingUnit: number,
  character: string,
  observedAt: string,
  apiUnitQuantity = '1',
) {
  const vertexComponent = componentClass.startsWith('vertex_prediction')
  return {
    componentClass,
    cloudServiceName: vertexComponent ? 'vertex-ai' : 'cloud-storage',
    skuRateBindingId: `binding-${componentClass}`,
    skuPriceTerm: {
      cloudServiceId: vertexComponent
        ? 'services/aiplatform.googleapis.com'
        : 'services/storage.googleapis.com',
      skuId: `sku-${componentClass}`,
      consumptionModel: 'consumptionModels/default',
      apiUnit,
      apiUnitQuantity,
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: maximumUsdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: maximumUsdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef: ref(`account-price-${componentClass}`, character),
    },
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}
