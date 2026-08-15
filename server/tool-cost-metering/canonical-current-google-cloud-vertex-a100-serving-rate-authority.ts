import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalSam31VertexServingCapacityObservation,
} from '../services/canonical-sam3_1-vertex-serving-capacity-mutation'

export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-rate-authority-v1' as const
export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_V2_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-rate-authority-v2' as const

export const CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES = [
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

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeResourceName = z.string().trim().min(1).max(500)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const canonicalDecimal = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/u)
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const componentClassSchema = z.enum(
  CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
)
const priceTermSchema = z.object({
  cloudServiceId: safeResourceName,
  skuId: safeId,
  consumptionModel: safeResourceName,
  apiUnit: z.enum(['h', 'GiBy.h', 'GiBy.mo', 'GiBy', 'count']),
  apiUnitQuantity: z.enum(['1', '1000']),
  contractPriceTiers: z.array(z.object({
    startAmount: canonicalDecimal,
    contractPriceUsdNanos: nonnegativeInteger,
  }).strict()).min(1).max(16),
  maximumContractPriceUsdNanos: nonnegativeInteger,
  skuMetadataRef: evidenceRefSchema,
  billingAccountPriceRef: evidenceRefSchema,
}).strict().superRefine((term, context) => {
  if (
    term.contractPriceTiers[0]?.startAmount !== '0'
    || Math.max(...term.contractPriceTiers.map((tier) =>
      tier.contractPriceUsdNanos)) !== term.maximumContractPriceUsdNanos
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 serving account price tiers changed.',
  })
})
const componentSchema = z.object({
  componentClass: componentClassSchema,
  cloudServiceName: safeId,
  skuRateBindingId: safeId,
  skuPriceTerm: priceTermSchema,
  skuDescriptionDigestSha256: sha256,
  skuRegion: z.literal('us-central1'),
  billingUnit: z.enum([
    'gpu_hour',
    'vcpu_hour',
    'gib_hour',
    'gib_month',
    'gib',
    'per_1000_operations',
  ]),
  maximumUsdNanosPerBillingUnit: nonnegativeInteger,
  currentPriceObservedAt: timestamp,
  skuRecordRef: evidenceRefSchema,
}).strict().superRefine((component, context) => {
  if (component.maximumUsdNanosPerBillingUnit !==
    component.skuPriceTerm.maximumContractPriceUsdNanos) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex A100 serving component and SKU prices differ.',
    })
  }
})

const observationWithoutDigestSchema = z.object({
  sourceClass: z.literal('billing_account_effective_pricing_api'),
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  pricingSetMode: z.literal(
    'vertex_online_prediction_usage_plus_management_skus',
  ),
  region: z.literal('us-central1'),
  currency: z.literal('USD'),
  components: z.array(componentSchema).length(9),
  priceRecordSetRef: evidenceRefSchema,
  pricingReadStartedAt: timestamp,
  pricingReadFinishedAt: timestamp,
}).strict().superRefine((observation, context) => {
  const classes = observation.components.map((component) =>
    component.componentClass)
  if (stableAuthorityStringify(classes) !== stableAuthorityStringify(
    CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
  ) || new Set(observation.components.map((component) =>
    component.skuPriceTerm.skuId)).size !== 9) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 serving pricing set is incomplete or duplicated.',
  })
})

export const canonicalGoogleCloudVertexA100ServingRateRawObservationSchema =
  observationWithoutDigestSchema.extend({
    pricingReadDigestSha256: sha256,
  }).strict()
export type CanonicalGoogleCloudVertexA100ServingRateRawObservation = z.infer<
  typeof canonicalGoogleCloudVertexA100ServingRateRawObservationSchema
>

export interface CanonicalGoogleCloudVertexA100ServingRateReadPort {
  readCurrentVertexA100ServingRate(): Promise<unknown>
}

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_owned_current_google_cloud_vertex_a100_serving_billing_reread',
  ),
  rateAuthorityId: safeId,
  rateAuthorityVersion: positiveInteger,
  routeId: z.literal('a100_80gb_heavy_primary'),
  profileId: z.literal('quality_a100_80gb_scale_zero_serving_v1'),
  routeRole: z.literal('heavy_primary'),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  endpointId: z.literal('weeditpro-sam31-a100-scale-zero-v1'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  acceleratorCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  minimumReplicaCount: z.literal(0),
  maximumReplicaCount: z.literal(1),
  pricingModel: z.literal('vertex_ai_online_prediction_on_demand_payg'),
  pricingSetMode: z.literal(
    'vertex_online_prediction_usage_plus_management_skus',
  ),
  predictionUsageSkuSetIncluded: z.literal(true),
  vertexManagementFeeSkuSetIncluded: z.literal(true),
  trainingOrCustomJobSkuSetIncluded: z.literal(false),
  computeEngineVmSkuSetIncluded: z.literal(false),
  mixedOrDoubleCountedPricingSetAccepted: z.literal(false),
  region: z.literal('us-central1'),
  currency: z.literal('USD'),
  sourceClass: z.literal('billing_account_effective_pricing_api'),
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  components: z.array(componentSchema).length(9),
  priceRecordSetRef: evidenceRefSchema,
  pricingReadStartedAt: timestamp,
  pricingReadFinishedAt: timestamp,
  pricingReadDigestSha256: sha256,
  observedAt: timestamp,
  expiresAt: timestamp,
  maximumAuthorityAgeSeconds: z.literal(86_400),
  minimumWarmBillingWindowSeconds: z.literal(300),
  exactSkuRegionCurrencyTierAndCurrentAccountPriceReread: z.literal(true),
  estimateMustIncludeColdLoadActivePersistenceAndIdleWindow: z.literal(true),
  actualAttemptCostRequiresEndpointUsageAndBillingReread: z.literal(true),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  endpointOrGpuJobStarted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((authority, context) => {
  const classes = authority.components.map((component) =>
    component.componentClass)
  const exactTimes = Date.parse(authority.pricingReadFinishedAt) >=
      Date.parse(authority.pricingReadStartedAt)
    && Date.parse(authority.pricingReadFinishedAt)
      - Date.parse(authority.pricingReadStartedAt) <= 60_000
    && authority.observedAt === authority.pricingReadFinishedAt
    && Date.parse(authority.expiresAt) - Date.parse(authority.observedAt)
      === 86_400_000
  if (!exactTimes || stableAuthorityStringify(classes) !==
    stableAuthorityStringify(
      CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
    )) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 serving rate authority lost price or time truth.',
  })
})

export const canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema =
  authorityWithoutHashSchema.extend({ rateAuthorityHash: sha256 }).strict()
export type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority = z.infer<
  typeof canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema
>

const authorityV2WithoutHashSchema = z.object({
  ...authorityWithoutHashSchema.shape,
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_V2_VERSION,
  ),
  endpointCapacityObservationRef: evidenceRefSchema,
  maximumReplicaCount: z.number().int().min(1).max(16),
  maximumConcurrentInvocations: z.number().int().min(1).max(16),
  exactCurrentEndpointCapacityReread: z.literal(true),
  perReplicaPricingNotMultipliedByConfiguredMaximum: z.literal(true),
}).strict().superRefine((authority, context) => {
  const classes = authority.components.map((component) =>
    component.componentClass)
  const exactTimes = Date.parse(authority.pricingReadFinishedAt) >=
      Date.parse(authority.pricingReadStartedAt)
    && Date.parse(authority.pricingReadFinishedAt)
      - Date.parse(authority.pricingReadStartedAt) <= 60_000
    && authority.observedAt === authority.pricingReadFinishedAt
    && Date.parse(authority.expiresAt) - Date.parse(authority.observedAt)
      === 86_400_000
  if (authority.maximumConcurrentInvocations !==
      authority.maximumReplicaCount
    || !exactTimes
    || stableAuthorityStringify(classes) !== stableAuthorityStringify(
      CANONICAL_VERTEX_A100_SERVING_RATE_COMPONENT_CLASSES,
    )) context.addIssue({
      code: 'custom',
      message: 'Vertex A100 serving capacity and concurrency differ.',
    })
})

export const canonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2Schema =
  authorityV2WithoutHashSchema.extend({ rateAuthorityHash: sha256 }).strict()
export type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2 =
  z.infer<
    typeof canonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2Schema
  >

export async function observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
  input: {
    readonly rateAuthorityId: string
    readonly rateAuthorityVersion: number
    readonly readPort: CanonicalGoogleCloudVertexA100ServingRateReadPort
  },
): Promise<CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority> {
  const raw = canonicalGoogleCloudVertexA100ServingRateRawObservationSchema
    .parse(await input.readPort.readCurrentVertexA100ServingRate())
  const { pricingReadDigestSha256, ...rawPayload } = raw
  if (pricingReadDigestSha256 !== sha256AuthorityValue(rawPayload)) {
    throw new Error('Vertex A100 serving rate observation digest is invalid.')
  }
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_VERSION,
    source:
      'server_owned_current_google_cloud_vertex_a100_serving_billing_reread',
    rateAuthorityId: input.rateAuthorityId,
    rateAuthorityVersion: input.rateAuthorityVersion,
    routeId: raw.routeId,
    profileId: 'quality_a100_80gb_scale_zero_serving_v1',
    routeRole: 'heavy_primary',
    executionTarget: raw.executionTarget,
    endpointId: 'weeditpro-sam31-a100-scale-zero-v1',
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    acceleratorCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    minimumReplicaCount: 0,
    maximumReplicaCount: 1,
    pricingModel: 'vertex_ai_online_prediction_on_demand_payg',
    pricingSetMode: raw.pricingSetMode,
    predictionUsageSkuSetIncluded: true,
    vertexManagementFeeSkuSetIncluded: true,
    trainingOrCustomJobSkuSetIncluded: false,
    computeEngineVmSkuSetIncluded: false,
    mixedOrDoubleCountedPricingSetAccepted: false,
    region: raw.region,
    currency: raw.currency,
    sourceClass: raw.sourceClass,
    billingAccountPricingScopeRef: raw.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: raw.pricingReaderConfigurationRef,
    components: raw.components,
    priceRecordSetRef: raw.priceRecordSetRef,
    pricingReadStartedAt: raw.pricingReadStartedAt,
    pricingReadFinishedAt: raw.pricingReadFinishedAt,
    pricingReadDigestSha256,
    observedAt: raw.pricingReadFinishedAt,
    expiresAt: new Date(Date.parse(raw.pricingReadFinishedAt) + 86_400_000)
      .toISOString(),
    maximumAuthorityAgeSeconds: 86_400,
    minimumWarmBillingWindowSeconds: 300,
    exactSkuRegionCurrencyTierAndCurrentAccountPriceReread: true,
    estimateMustIncludeColdLoadActivePersistenceAndIdleWindow: true,
    actualAttemptCostRequiresEndpointUsageAndBillingReread: true,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    endpointOrGpuJobStarted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema.parse({
    ...payload,
    rateAuthorityHash: sha256AuthorityValue(payload),
  })
}

export async function observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
  input: {
    readonly rateAuthorityId: string
    readonly rateAuthorityVersion: number
    readonly readPort: CanonicalGoogleCloudVertexA100ServingRateReadPort
    readonly capacityObservation: unknown
  },
): Promise<CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2> {
  const raw = canonicalGoogleCloudVertexA100ServingRateRawObservationSchema
    .parse(await input.readPort.readCurrentVertexA100ServingRate())
  const { pricingReadDigestSha256, ...rawPayload } = raw
  if (pricingReadDigestSha256 !== sha256AuthorityValue(rawPayload)) {
    throw new Error('Vertex A100 serving rate observation digest is invalid.')
  }
  const capacity = assertCanonicalSam31VertexServingCapacityObservation(
    input.capacityObservation,
    raw.pricingReadFinishedAt,
  )
  const payload = authorityV2WithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_V2_VERSION,
    source:
      'server_owned_current_google_cloud_vertex_a100_serving_billing_reread',
    rateAuthorityId: input.rateAuthorityId,
    rateAuthorityVersion: input.rateAuthorityVersion,
    routeId: raw.routeId,
    profileId: 'quality_a100_80gb_scale_zero_serving_v1',
    routeRole: 'heavy_primary',
    executionTarget: raw.executionTarget,
    endpointId: 'weeditpro-sam31-a100-scale-zero-v1',
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    acceleratorCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    minimumReplicaCount: 0,
    maximumReplicaCount: capacity.maximumReplicaCount,
    maximumConcurrentInvocations: capacity.maximumReplicaCount,
    endpointCapacityObservationRef: {
      id: `sam31-vertex-serving-capacity:${capacity.observationHash}`,
      version: 1,
      contentHash: `sha256:${capacity.observationHash}`,
    },
    exactCurrentEndpointCapacityReread: true,
    perReplicaPricingNotMultipliedByConfiguredMaximum: true,
    pricingModel: 'vertex_ai_online_prediction_on_demand_payg',
    pricingSetMode: raw.pricingSetMode,
    predictionUsageSkuSetIncluded: true,
    vertexManagementFeeSkuSetIncluded: true,
    trainingOrCustomJobSkuSetIncluded: false,
    computeEngineVmSkuSetIncluded: false,
    mixedOrDoubleCountedPricingSetAccepted: false,
    region: raw.region,
    currency: raw.currency,
    sourceClass: raw.sourceClass,
    billingAccountPricingScopeRef: raw.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: raw.pricingReaderConfigurationRef,
    components: raw.components,
    priceRecordSetRef: raw.priceRecordSetRef,
    pricingReadStartedAt: raw.pricingReadStartedAt,
    pricingReadFinishedAt: raw.pricingReadFinishedAt,
    pricingReadDigestSha256,
    observedAt: raw.pricingReadFinishedAt,
    expiresAt: new Date(Date.parse(raw.pricingReadFinishedAt) + 86_400_000)
      .toISOString(),
    maximumAuthorityAgeSeconds: 86_400,
    minimumWarmBillingWindowSeconds: 300,
    exactSkuRegionCurrencyTierAndCurrentAccountPriceReread: true,
    estimateMustIncludeColdLoadActivePersistenceAndIdleWindow: true,
    actualAttemptCostRequiresEndpointUsageAndBillingReread: true,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    endpointOrGpuJobStarted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
    ...payload,
    rateAuthorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
  value: unknown,
  at?: string,
): CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority {
  const parsed = canonicalCurrentGoogleCloudVertexA100ServingRateAuthoritySchema
    .parse(value)
  const { rateAuthorityHash, ...payload } = parsed
  if (rateAuthorityHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) {
    throw new Error('Current Vertex A100 serving rate authority is invalid.')
  }
  return parsed
}

export function assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
  value: unknown,
  at?: string,
): CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2 {
  const parsed = canonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2Schema
    .parse(value)
  const { rateAuthorityHash, ...payload } = parsed
  if (rateAuthorityHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)))) {
    throw new Error('Current Vertex A100 serving v2 rate authority is invalid.')
  }
  return parsed
}
