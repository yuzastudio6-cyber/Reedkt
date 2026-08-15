import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_VERSION =
  'canonical-current-google-cloud-vertex-a100-rate-authority-v1' as const

export const CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES = [
  'vertex_training_a100_80gb_hour',
  'vertex_training_a2_core_hour',
  'vertex_training_a2_ram_gib_hour',
  'vertex_training_pd_ssd_gib_month',
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
const positiveDecimal = z.string().regex(/^(?:0*[1-9]\d*)(?:\.\d+)?$/u)
const nonnegativeDecimal = z.string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/u)
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const priceTermSchema = z.object({
  cloudServiceId: safeResourceName,
  skuId: safeId,
  consumptionModel: safeResourceName,
  apiUnit: z.enum(['h', 'GiBy.h', 'GiBy.mo', 'GiBy', 'count']),
  apiUnitQuantity: positiveDecimal,
  contractPriceTiers: z.array(z.object({
    startAmount: nonnegativeDecimal,
    contractPriceUsdNanos: nonnegativeInteger,
  }).strict()).min(1).max(16),
  maximumContractPriceUsdNanos: nonnegativeInteger,
  skuMetadataRef: evidenceRefSchema,
  billingAccountPriceRef: evidenceRefSchema,
}).strict().superRefine((term, context) => {
  const starts = term.contractPriceTiers.map((tier) => tier.startAmount)
  if (
    starts[0] !== '0'
    || !strictlyIncreasingDecimals(starts)
    || Math.max(...term.contractPriceTiers.map((tier) =>
      tier.contractPriceUsdNanos)) !== term.maximumContractPriceUsdNanos
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 account price tiers are not exact or ordered.',
  })
})

const componentClassSchema = z.enum(
  CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES,
)
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
      message: 'Vertex A100 component price differs from its exact SKU term.',
    })
  }
})

const observationWithoutDigestSchema = z.object({
  sourceClass: z.literal('billing_account_effective_pricing_api'),
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
  pricingSetMode: z.literal('vertex_training_payg_usage_skus'),
  region: z.literal('us-central1'),
  currency: z.literal('USD'),
  components: z.array(componentSchema).length(8),
  priceRecordSetRef: evidenceRefSchema,
  pricingReadStartedAt: timestamp,
  pricingReadFinishedAt: timestamp,
}).strict().superRefine((observation, context) => {
  const classes = observation.components.map((component) =>
    component.componentClass)
  if (
    stableAuthorityStringify(classes) !== stableAuthorityStringify(
      CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES,
    )
    || new Set(classes).size !== classes.length
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 rate observation lost its exact component set.',
  })
})

export const canonicalGoogleCloudVertexA100RateRawObservationSchema =
  observationWithoutDigestSchema.extend({
    pricingReadDigestSha256: sha256,
  }).strict()
export type CanonicalGoogleCloudVertexA100RateRawObservation = z.infer<
  typeof canonicalGoogleCloudVertexA100RateRawObservationSchema
>

export interface CanonicalGoogleCloudVertexA100RateReadPort {
  readCurrentVertexA100Rate(): Promise<unknown>
}

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_owned_current_google_cloud_vertex_a100_billing_pricing_reread',
  ),
  rateAuthorityId: safeId,
  rateAuthorityVersion: positiveInteger,
  routeId: z.literal('a100_80gb_heavy_primary'),
  profileId: z.literal('quality_a100_80gb_user_triggered_heavy_job_v1'),
  routeRole: z.literal('heavy_primary'),
  executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  acceleratorCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  bootDiskType: z.literal('pd-ssd'),
  bootDiskSizeGb: z.literal(200),
  replicaCount: z.literal(1),
  pricingModel: z.literal('vertex_ai_training_on_demand_payg'),
  pricingSetMode: z.literal('vertex_training_payg_usage_skus'),
  separateVertexManagementFeeSkuSetIncluded: z.literal(false),
  computeEngineReservationOrSpotSkuSetIncluded: z.literal(false),
  mixedOrDoubleCountedPricingSetAccepted: z.literal(false),
  region: z.literal('us-central1'),
  currency: z.literal('USD'),
  sourceClass: z.literal('billing_account_effective_pricing_api'),
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  components: z.array(componentSchema).length(8),
  priceRecordSetRef: evidenceRefSchema,
  pricingReadStartedAt: timestamp,
  pricingReadFinishedAt: timestamp,
  pricingReadDigestSha256: sha256,
  observedAt: timestamp,
  expiresAt: timestamp,
  maximumAuthorityAgeSeconds: z.literal(86_400),
  vertexTrainingUsageBilledInThirtySecondIncrements: z.literal(true),
  exactSkuRegionCurrencyTierAndCurrentAccountPriceReread: z.literal(true),
  actualAttemptCostRequiresTerminalUsageAndBillingReread: z.literal(true),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  providerOrGpuJobStarted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((authority, context) => {
  const classes = authority.components.map((component) =>
    component.componentClass)
  const timeValid = Date.parse(authority.pricingReadFinishedAt) >=
      Date.parse(authority.pricingReadStartedAt)
    && Date.parse(authority.pricingReadFinishedAt)
      - Date.parse(authority.pricingReadStartedAt) <= 60_000
    && Date.parse(authority.observedAt) ===
      Date.parse(authority.pricingReadFinishedAt)
    && Date.parse(authority.expiresAt) - Date.parse(authority.observedAt)
      === 86_400_000
    && authority.components.every((component) =>
      Date.parse(component.currentPriceObservedAt) ===
        Date.parse(authority.observedAt))
  if (
    !timeValid
    || stableAuthorityStringify(classes) !== stableAuthorityStringify(
      CANONICAL_VERTEX_A100_RATE_COMPONENT_CLASSES,
    )
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 rate authority lost route, price, or time truth.',
  })
})

export const canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema =
  authorityWithoutHashSchema.extend({ rateAuthorityHash: sha256 }).strict()
export type CanonicalCurrentGoogleCloudVertexA100RateAuthority = z.infer<
  typeof canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema
>

export async function observeCanonicalCurrentGoogleCloudVertexA100RateAuthority(
  input: {
    readonly rateAuthorityId: string
    readonly rateAuthorityVersion: number
    readonly readPort: CanonicalGoogleCloudVertexA100RateReadPort
  },
): Promise<CanonicalCurrentGoogleCloudVertexA100RateAuthority> {
  const raw = canonicalGoogleCloudVertexA100RateRawObservationSchema.parse(
    await input.readPort.readCurrentVertexA100Rate(),
  )
  const { pricingReadDigestSha256, ...rawPayload } = raw
  if (pricingReadDigestSha256 !== sha256AuthorityValue(rawPayload)) {
    throw new Error('Vertex A100 rate observation digest is invalid.')
  }
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_RATE_AUTHORITY_VERSION,
    source:
      'server_owned_current_google_cloud_vertex_a100_billing_pricing_reread',
    rateAuthorityId: input.rateAuthorityId,
    rateAuthorityVersion: input.rateAuthorityVersion,
    routeId: raw.routeId,
    profileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
    routeRole: 'heavy_primary',
    executionTarget: raw.executionTarget,
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    acceleratorCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    bootDiskType: 'pd-ssd',
    bootDiskSizeGb: 200,
    replicaCount: 1,
    pricingModel: 'vertex_ai_training_on_demand_payg',
    pricingSetMode: raw.pricingSetMode,
    separateVertexManagementFeeSkuSetIncluded: false,
    computeEngineReservationOrSpotSkuSetIncluded: false,
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
    vertexTrainingUsageBilledInThirtySecondIncrements: true,
    exactSkuRegionCurrencyTierAndCurrentAccountPriceReread: true,
    actualAttemptCostRequiresTerminalUsageAndBillingReread: true,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    providerOrGpuJobStarted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema.parse({
    ...payload,
    rateAuthorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
  value: unknown,
  at?: string,
): CanonicalCurrentGoogleCloudVertexA100RateAuthority {
  const parsed = canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema
    .parse(value)
  const { rateAuthorityHash, ...payload } = parsed
  if (
    rateAuthorityHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)
    ))
  ) throw new Error('Current Vertex A100 rate authority is invalid.')
  return parsed
}

function strictlyIncreasingDecimals(values: readonly string[]): boolean {
  return values.every((value, index) => index === 0
    || compareCanonicalDecimals(values[index - 1], value) < 0)
}

function compareCanonicalDecimals(left: string, right: string): number {
  const [leftWhole, leftFraction = ''] = left.split('.')
  const [rightWhole, rightFraction = ''] = right.split('.')
  const scale = Math.max(leftFraction.length, rightFraction.length)
  const leftValue = BigInt(`${leftWhole}${leftFraction.padEnd(scale, '0')}`)
  const rightValue = BigInt(`${rightWhole}${rightFraction.padEnd(scale, '0')}`)
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0
}
