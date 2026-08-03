import { z } from 'zod'

import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_VERSION =
  'canonical-current-google-cloud-gpu-rate-authority-v2' as const

export const CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS = [
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
] as const

const routeIdSchema = z.enum(CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeResourceName = z.string().trim().min(1).max(500)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveDecimal = z.string().regex(/^(?:0*[1-9]\d*)(?:\.\d+)?$/u)
const nonnegativeDecimal = z.string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/u)

const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const rateComponentClassSchema = z.enum([
  'a2_ultragpu_1g_machine_bundle',
  'cloud_run_l4_gpu_second',
  'cloud_run_vcpu_second',
  'cloud_run_memory_gib_second',
  'private_object_storage_gib_month',
  'network_egress_gib',
  'object_class_a_per_1000',
  'object_class_b_per_1000',
])

const skuPriceTermSchema = z.object({
  cloudServiceId: safeResourceName,
  skuId: safeId,
  quantityPerBillingUnit: positiveInteger,
  consumptionModel: safeResourceName,
  apiUnit: safeId,
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
    message: 'Account-effective SKU price tiers are not exact or ordered.',
  })
})

const rateComponentSchema = z.object({
  componentClass: rateComponentClassSchema,
  cloudServiceName: safeId,
  skuRateBindingId: safeId,
  skuPriceTerms: z.array(skuPriceTermSchema).min(1).max(4),
  skuDescriptionDigestSha256: sha256,
  skuRegion: z.enum(['us-central1', 'europe-west4']),
  billingUnit: z.enum([
    'machine_hour',
    'gpu_second',
    'vcpu_second',
    'gib_second',
    'gib_month',
    'gib',
    'per_1000_operations',
  ]),
  maximumUsdNanosPerBillingUnit: nonnegativeInteger,
  currentPriceObservedAt: timestamp,
  skuRecordRef: evidenceRefSchema,
}).strict().superRefine((component, context) => {
  const termIds = component.skuPriceTerms.map((term) => term.skuId)
  const expectedRate = component.skuPriceTerms.reduce(
    (total, term) => total
      + term.maximumContractPriceUsdNanos * term.quantityPerBillingUnit,
    0,
  )
  if (
    new Set(termIds).size !== termIds.length
    || expectedRate !== component.maximumUsdNanosPerBillingUnit
  ) context.addIssue({
    code: 'custom',
    message: 'GPU rate component lost exact SKU term reconciliation.',
  })
})

const rawObservationSchema = z.object({
  sourceClass: z.literal('billing_account_effective_pricing_api'),
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  routeId: routeIdSchema,
  region: z.enum(['us-central1', 'europe-west4']),
  currency: z.literal('USD'),
  components: z.array(rateComponentSchema).min(5).max(8),
  priceRecordSetRef: evidenceRefSchema,
  pricingReadStartedAt: timestamp,
  pricingReadFinishedAt: timestamp,
  pricingReadDigestSha256: sha256,
}).strict()

export type CanonicalGoogleCloudGpuRateRawObservation = z.infer<
  typeof rawObservationSchema
>

export interface CanonicalGoogleCloudGpuRateReadPort {
  readCurrentRouteRate(input: {
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly region: 'us-central1' | 'europe-west4'
    readonly currency: 'USD'
  }): Promise<unknown>
}

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'server_owned_current_google_cloud_billing_pricing_reread',
  ),
  rateAuthorityId: safeId,
  rateAuthorityVersion: positiveInteger,
  routeId: routeIdSchema,
  profileId: z.enum(CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS),
  routeRole: z.enum(['heavy_primary', 'heavy_fallback', 'standard_primary']),
  executionTarget: z.enum([
    'google_cloud_batch_a2_ultra_job',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  acceleratorCount: z.literal(1),
  pricingModel: z.enum([
    'bundled_accelerator_optimized_machine',
    'cloud_run_gpu_plus_vcpu_and_memory',
  ]),
  region: z.enum(['us-central1', 'europe-west4']),
  currency: z.literal('USD'),
  sourceClass: z.literal('billing_account_effective_pricing_api'),
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  components: z.array(rateComponentSchema).min(5).max(8),
  priceRecordSetRef: evidenceRefSchema,
  pricingReadStartedAt: timestamp,
  pricingReadFinishedAt: timestamp,
  pricingReadDigestSha256: sha256,
  observedAt: timestamp,
  expiresAt: timestamp,
  maximumAuthorityAgeSeconds: z.literal(86_400),
  exactSkuRegionCurrencyTierAndCurrentPriceReread: z.literal(true),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  approvedForPreapprovalInfrastructureEstimate: z.literal(true),
  actualAttemptCostStillRequiresPlatformUsageAndBillingReread:
    z.literal(true),
}).strict().superRefine((authority, context) => {
  const route = routeDefinition(authority.routeId)
  const componentClasses = authority.components.map((component) =>
    component.componentClass)
  const exactRoute =
    authority.profileId === route.profileId
    && authority.routeRole === route.routeRole
    && authority.executionTarget === route.executionTarget
    && authority.machineType === route.machineType
    && authority.accelerator === route.accelerator
    && authority.pricingModel === route.pricingModel
  const timeValid =
    Date.parse(authority.pricingReadFinishedAt) >=
      Date.parse(authority.pricingReadStartedAt)
    && Date.parse(authority.pricingReadFinishedAt)
      - Date.parse(authority.pricingReadStartedAt) <= 60_000
    && Date.parse(authority.observedAt) ===
      Date.parse(authority.pricingReadFinishedAt)
    && Date.parse(authority.expiresAt) - Date.parse(authority.observedAt)
      === 86_400_000
    && authority.components.every((component) =>
      component.skuRegion === authority.region
      && Date.parse(component.currentPriceObservedAt) ===
        Date.parse(authority.observedAt))
  if (
    !exactRoute
    || !timeValid
    || stableAuthorityStringify(componentClasses) !==
      stableAuthorityStringify(route.componentClasses)
    || new Set(componentClasses).size !== componentClasses.length
  ) context.addIssue({
    code: 'custom',
    message: 'Current GPU rate authority lost its exact route, price, or time.',
  })
})

export const canonicalCurrentGoogleCloudGpuRateAuthoritySchema =
  authorityWithoutHashSchema.extend({ rateAuthorityHash: sha256 }).strict()

export type CanonicalCurrentGoogleCloudGpuRateAuthority = z.infer<
  typeof canonicalCurrentGoogleCloudGpuRateAuthoritySchema
>

export async function observeCanonicalCurrentGoogleCloudGpuRateAuthority(
  input: {
    readonly rateAuthorityId: string
    readonly rateAuthorityVersion: number
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly region: 'us-central1' | 'europe-west4'
    readonly readPort: CanonicalGoogleCloudGpuRateReadPort
  },
): Promise<CanonicalCurrentGoogleCloudGpuRateAuthority> {
  const raw = rawObservationSchema.parse(
    await input.readPort.readCurrentRouteRate({
      routeId: input.routeId,
      region: input.region,
      currency: 'USD',
    }),
  )
  if (
    raw.routeId !== input.routeId
    || raw.region !== input.region
    || raw.pricingReadDigestSha256 !== sha256AuthorityValue({
      sourceClass: raw.sourceClass,
      billingAccountPricingScopeRef: raw.billingAccountPricingScopeRef,
      pricingReaderConfigurationRef: raw.pricingReaderConfigurationRef,
      routeId: raw.routeId,
      region: raw.region,
      currency: raw.currency,
      components: raw.components,
      priceRecordSetRef: raw.priceRecordSetRef,
      pricingReadStartedAt: raw.pricingReadStartedAt,
      pricingReadFinishedAt: raw.pricingReadFinishedAt,
    })
  ) throw new Error('Google Cloud GPU rate observation is stale or invalid.')
  const route = routeDefinition(input.routeId)
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion: CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_VERSION,
    source: 'server_owned_current_google_cloud_billing_pricing_reread',
    rateAuthorityId: input.rateAuthorityId,
    rateAuthorityVersion: input.rateAuthorityVersion,
    routeId: input.routeId,
    profileId: route.profileId,
    routeRole: route.routeRole,
    executionTarget: route.executionTarget,
    machineType: route.machineType,
    accelerator: route.accelerator,
    acceleratorCount: 1,
    pricingModel: route.pricingModel,
    region: input.region,
    currency: raw.currency,
    sourceClass: raw.sourceClass,
    billingAccountPricingScopeRef: raw.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: raw.pricingReaderConfigurationRef,
    components: raw.components,
    priceRecordSetRef: raw.priceRecordSetRef,
    pricingReadStartedAt: raw.pricingReadStartedAt,
    pricingReadFinishedAt: raw.pricingReadFinishedAt,
    pricingReadDigestSha256: raw.pricingReadDigestSha256,
    observedAt: raw.pricingReadFinishedAt,
    expiresAt: new Date(Date.parse(raw.pricingReadFinishedAt) + 86_400_000)
      .toISOString(),
    maximumAuthorityAgeSeconds: 86_400,
    exactSkuRegionCurrencyTierAndCurrentPriceReread: true,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    approvedForPreapprovalInfrastructureEstimate: true,
    actualAttemptCostStillRequiresPlatformUsageAndBillingReread: true,
  })
  return canonicalCurrentGoogleCloudGpuRateAuthoritySchema.parse({
    ...payload,
    rateAuthorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalCurrentGoogleCloudGpuRateAuthority(
  value: unknown,
  at?: string,
): CanonicalCurrentGoogleCloudGpuRateAuthority {
  const parsed = canonicalCurrentGoogleCloudGpuRateAuthoritySchema.parse(value)
  const { rateAuthorityHash, ...payload } = parsed
  if (
    rateAuthorityHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(parsed.observedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)
    ))
  ) throw new Error('Current Google Cloud GPU rate authority is invalid.')
  return parsed
}

function routeDefinition(routeId: z.infer<typeof routeIdSchema>) {
  const commonComponents = [
    'private_object_storage_gib_month',
    'network_egress_gib',
    'object_class_a_per_1000',
    'object_class_b_per_1000',
  ] as const
  if (routeId === 'a100_80gb_heavy_primary') return {
    profileId: CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0],
    routeRole: 'heavy_primary' as const,
    executionTarget: 'google_cloud_batch_a2_ultra_job' as const,
    machineType: 'a2-ultragpu-1g' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    pricingModel: 'bundled_accelerator_optimized_machine' as const,
    componentClasses: [
      'a2_ultragpu_1g_machine_bundle',
      ...commonComponents,
    ] as const,
  }
  return {
    profileId: routeId === 'l4_heavy_fallback'
      ? CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
      : CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[2],
    routeRole: routeId === 'l4_heavy_fallback'
      ? 'heavy_fallback' as const
      : 'standard_primary' as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    pricingModel: 'cloud_run_gpu_plus_vcpu_and_memory' as const,
    componentClasses: [
      'cloud_run_l4_gpu_second',
      'cloud_run_vcpu_second',
      'cloud_run_memory_gib_second',
      ...commonComponents,
    ] as const,
  }
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
