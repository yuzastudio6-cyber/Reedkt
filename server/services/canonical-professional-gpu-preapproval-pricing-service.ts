import { z } from 'zod'

import {
  assertCanonicalQualityFirstProfessionalToolGpuPlacement,
  createCanonicalQualityFirstProfessionalToolGpuPlacement,
} from '../edit-architecture/canonical-quality-first-professional-tool-gpu-placement'
import {
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority,
  type CanonicalProfessionalGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-professional-google-cloud-gpu-rate-authority'
import {
  canonicalProfessionalToolGpuUsageSchema,
  createCanonicalProfessionalToolGpuCostEstimate,
  modelOrOperationCostProfileForTool,
  type CanonicalProfessionalToolGpuCostEstimate,
  type CanonicalProfessionalToolGpuUsage,
  type CanonicalProfessionalToolGpuUsageRange,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  ALL_PROFESSIONAL_TOOL_CATALOG_IDS,
} from '../tool-registry'

export const CANONICAL_PROFESSIONAL_GPU_USAGE_QUOTE_VERSION =
  'canonical-professional-gpu-usage-quote-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const toolIdSchema = z.enum(ALL_PROFESSIONAL_TOOL_CATALOG_IDS)
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])

const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const estimateScopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  editPlanId: safeId,
  editPlanVersion: positiveInteger,
  editPlanHash: sha256,
  outputId: safeId,
  operationId: safeId,
  plannedWorkItemRef: evidenceRefSchema,
  toolId: toolIdSchema,
  exactToolOrModelReleaseRef: evidenceRefSchema,
}).strict()

const workloadWithoutDigestSchema = z.object({
  workloadClass: z.enum([
    'source_video',
    'source_audio',
    'frame_or_image_set',
    'render_or_transcode',
    'structured_gpu_operation',
  ]),
  inputByteLength: positiveInteger,
  sourceDurationMilliseconds: nonnegativeInteger,
  sourceFrameCount: nonnegativeInteger,
  sourcePixelCount: nonnegativeInteger,
  outputFrameCount: nonnegativeInteger,
  outputPixelCount: nonnegativeInteger,
  subjectAssetOrTrackCount: positiveInteger.max(4_096),
}).strict()

const workloadSchema = workloadWithoutDigestSchema.extend({
  workloadDigestSha256: sha256,
}).strict().superRefine((workload, context) => {
  const payload = { ...workload }
  Reflect.deleteProperty(payload, 'workloadDigestSha256')
  if (workload.workloadDigestSha256 !== sha256AuthorityValue(payload)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU usage workload digest is invalid.',
    })
  }
})

const usageRangeSchema = z.object({
  low: canonicalProfessionalToolGpuUsageSchema,
  expected: canonicalProfessionalToolGpuUsageSchema,
  high: canonicalProfessionalToolGpuUsageSchema,
}).strict().superRefine((range, context) => {
  const points = [range.low, range.expected, range.high]
  const ordered = points.every((point, index) => index === 0
    || point.totalBillableMilliseconds >=
      points[index - 1]!.totalBillableMilliseconds)
  const sameAllocation = points.every((point) =>
    point.allocatedGpuCount === range.low.allocatedGpuCount
    && point.allocatedVcpuCount === range.low.allocatedVcpuCount
    && point.allocatedMemoryGiB === range.low.allocatedMemoryGiB
    && point.allocatedLocalScratchGiB ===
      range.low.allocatedLocalScratchGiB)
  if (!ordered || !sameAllocation) {
    context.addIssue({
      code: 'custom',
      message: 'GPU usage quote range is unordered or changes allocation.',
    })
  }
})

const routeUsageQuoteSchema = z.object({
  routeId: routeIdSchema,
  usageRange: usageRangeSchema,
  benchmarkRunCount: positiveInteger.min(30),
  benchmarkRunSetRef: evidenceRefSchema,
  toolOrModelArtifactReleaseRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
}).strict()

const quoteWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_GPU_USAGE_QUOTE_VERSION),
  source: z.literal(
    'canonical_server_professional_gpu_usage_quote_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  quoteId: safeId,
  quoteVersion: positiveInteger,
  scope: estimateScopeSchema,
  workload: workloadSchema,
  placementPolicyRef: z.object({
    schemaVersion: z.literal(
      'canonical-quality-first-professional-tool-gpu-placement-v1',
    ),
    policyHash: sha256,
    entryHash: sha256,
  }).strict(),
  modelOrOperationCostProfileId: safeId,
  primary: routeUsageQuoteSchema,
  fallback: routeUsageQuoteSchema.nullable(),
  primaryPreInferenceFailureHighUsage:
    canonicalProfessionalToolGpuUsageSchema.nullable(),
  calibrationMethod: z.literal(
    'qualified_private_runs_p10_p50_p95_bounded_high_v1',
  ),
  exactToolOperationReleaseAndWorkloadReread: z.literal(true),
  lowExpectedHighDerivedFromMeasuredRuns: z.literal(true),
  callerUsageDurationRateOrPriceAccepted: z.literal(false),
  privateInternalQualified: z.literal(true),
  customerPriceOrServiceFeeAuthorityGranted: z.literal(false),
  walletCreditOrLedgerMutationAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
  maximumQuoteAgeSeconds: z.literal(86_400),
}).strict().superRefine((quote, context) => {
  const heavy = quote.primary.routeId === 'a100_80gb_heavy_primary'
  const exactHeavy = heavy
    && quote.fallback?.routeId === 'l4_heavy_fallback'
    && quote.primaryPreInferenceFailureHighUsage !== null
    && quote.primaryPreInferenceFailureHighUsage
      .runtimeAndModelLoadMilliseconds === 0
    && quote.primaryPreInferenceFailureHighUsage.activeGpuMilliseconds === 0
    && quote.primaryPreInferenceFailureHighUsage.networkEgressBytes === 0
  const exactStandard = quote.primary.routeId === 'l4_standard_primary'
    && quote.fallback === null
    && quote.primaryPreInferenceFailureHighUsage === null
  const primaryArtifactExact = stableAuthorityStringify(
    quote.primary.toolOrModelArtifactReleaseRef,
  ) === stableAuthorityStringify(quote.scope.exactToolOrModelReleaseRef)
  const fallbackArtifactExact = quote.fallback === null
    || stableAuthorityStringify(
      quote.fallback.toolOrModelArtifactReleaseRef,
    ) === stableAuthorityStringify(quote.scope.exactToolOrModelReleaseRef)
  const heavyRouteEvidenceDistinct = !heavy || (
    quote.primary.runtimeReleaseRef.contentHash !==
      quote.fallback?.runtimeReleaseRef.contentHash
    && quote.primary.benchmarkRunSetRef.contentHash !==
      quote.fallback?.benchmarkRunSetRef.contentHash
  )
  if (
    (!exactHeavy && !exactStandard)
    || !primaryArtifactExact
    || !fallbackArtifactExact
    || !heavyRouteEvidenceDistinct
    || Date.parse(quote.expiresAt) <= Date.parse(quote.observedAt)
    || Date.parse(quote.expiresAt) - Date.parse(quote.observedAt) >
      quote.maximumQuoteAgeSeconds * 1_000
  ) {
    context.addIssue({
      code: 'custom',
      message: 'GPU usage quote lost route, release, fallback, or expiry.',
    })
  }
})

export const canonicalProfessionalGpuUsageQuoteSchema =
  quoteWithoutHashSchema.extend({ quoteHash: sha256 }).strict()
export type CanonicalProfessionalGpuUsageQuote = z.infer<
  typeof canonicalProfessionalGpuUsageQuoteSchema
>
export type CanonicalProfessionalGpuPricingWorkload = z.input<
  typeof workloadWithoutDigestSchema
>

export interface CanonicalProfessionalGpuMeasuredRouteUsageQuoteInput {
  readonly routeId: z.infer<typeof routeIdSchema>
  readonly usageRange: CanonicalProfessionalToolGpuUsageRange
  readonly benchmarkRunCount: number
  readonly benchmarkRunSetRef: z.input<typeof evidenceRefSchema>
  readonly toolOrModelArtifactReleaseRef: z.input<typeof evidenceRefSchema>
  readonly runtimeReleaseRef: z.input<typeof evidenceRefSchema>
}

export function createCanonicalProfessionalGpuUsageQuote(input: {
  readonly quoteId: string
  readonly quoteVersion: number
  readonly scope: z.input<typeof estimateScopeSchema>
  readonly workload: CanonicalProfessionalGpuPricingWorkload
  readonly primary: CanonicalProfessionalGpuMeasuredRouteUsageQuoteInput
  readonly fallback?: CanonicalProfessionalGpuMeasuredRouteUsageQuoteInput
  readonly primaryPreInferenceFailureHighUsage?:
    CanonicalProfessionalToolGpuUsage
  readonly observedAt: string
  readonly expiresAt: string
}): CanonicalProfessionalGpuUsageQuote {
  const scope = estimateScopeSchema.parse(input.scope)
  const workloadPayload = workloadWithoutDigestSchema.parse(input.workload)
  const workload = workloadSchema.parse({
    ...workloadPayload,
    workloadDigestSha256: sha256AuthorityValue(workloadPayload),
  })
  const placementPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const placement = placementPolicy.entries.find((entry) =>
    entry.toolId === scope.toolId)
  if (!placement || placement.gpuImplementationDisposition !==
    'declared_gpu_route_release_qualification_pending') {
    throw new Error(
      'A measured GPU usage quote requires a declared substantive GPU route.',
    )
  }
  const payload = quoteWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_USAGE_QUOTE_VERSION,
    source: 'canonical_server_professional_gpu_usage_quote_repository',
    evidenceClass: 'canonical_private_reread',
    quoteId: input.quoteId,
    quoteVersion: input.quoteVersion,
    scope,
    workload,
    placementPolicyRef: {
      schemaVersion: placementPolicy.schemaVersion,
      policyHash: placementPolicy.policyHash,
      entryHash: placement.entryHash,
    },
    modelOrOperationCostProfileId:
      modelOrOperationCostProfileForTool(scope.toolId),
    primary: input.primary,
    fallback: input.fallback ?? null,
    primaryPreInferenceFailureHighUsage:
      input.primaryPreInferenceFailureHighUsage ?? null,
    calibrationMethod:
      'qualified_private_runs_p10_p50_p95_bounded_high_v1',
    exactToolOperationReleaseAndWorkloadReread: true,
    lowExpectedHighDerivedFromMeasuredRuns: true,
    callerUsageDurationRateOrPriceAccepted: false,
    privateInternalQualified: true,
    customerPriceOrServiceFeeAuthorityGranted: false,
    walletCreditOrLedgerMutationAuthorityGranted: false,
    observedAt: input.observedAt,
    expiresAt: input.expiresAt,
    maximumQuoteAgeSeconds: 86_400,
  })
  return assertCanonicalProfessionalGpuUsageQuote({
    ...payload,
    quoteHash: sha256AuthorityValue(payload),
  })
}

export interface CanonicalProfessionalGpuUsageQuoteReadPort {
  rereadCurrentQualifiedUsageQuote(input: {
    readonly scope: z.infer<typeof estimateScopeSchema>
    readonly workload: z.infer<typeof workloadSchema>
    readonly placementPolicyRef: {
      readonly schemaVersion:
        'canonical-quality-first-professional-tool-gpu-placement-v1'
      readonly policyHash: string
      readonly entryHash: string
    }
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuCurrentRateAuthorityReadPort {
  rereadCurrentAccountEffectiveRateAuthority(input: {
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly region: 'us-central1' | 'europe-west4'
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuPreapprovalPricing {
  readonly usageQuote: CanonicalProfessionalGpuUsageQuote
  readonly primaryRateAuthority:
    CanonicalProfessionalGoogleCloudGpuRateAuthority
  readonly fallbackRateAuthority:
    CanonicalProfessionalGoogleCloudGpuRateAuthority | null
  readonly estimate: CanonicalProfessionalToolGpuCostEstimate
  readonly callerUsageDurationRateOrPriceAccepted: false
  readonly customerCreditsMutated: false
}

export async function createCanonicalProfessionalGpuPreapprovalPricing(
  input: {
    readonly estimateId: string
    readonly scope: z.input<typeof estimateScopeSchema>
    readonly workload: CanonicalProfessionalGpuPricingWorkload
    readonly region: 'us-central1' | 'europe-west4'
    readonly usageQuoteReadPort:
      CanonicalProfessionalGpuUsageQuoteReadPort
    readonly currentRateAuthorityReadPort:
      CanonicalProfessionalGpuCurrentRateAuthorityReadPort
    readonly createdAt: string
  },
): Promise<CanonicalProfessionalGpuPreapprovalPricing> {
  const scope = estimateScopeSchema.parse(input.scope)
  const workloadPayload = workloadWithoutDigestSchema.parse(input.workload)
  const workload = workloadSchema.parse({
    ...workloadPayload,
    workloadDigestSha256: sha256AuthorityValue(workloadPayload),
  })
  const placementPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const placement = placementPolicy.entries.find((entry) =>
    entry.toolId === scope.toolId)
  if (!placement
    || placement.placementClass === 'historical_read_only'
    || placement.placementClass === 'non_gpu_control_plane_only'
    || placement.placementClass ===
      'l4_colocated_io_container_metadata_helper') {
    throw new Error('Tool does not receive a standalone GPU price estimate.')
  }
  if (placement.gpuImplementationDisposition !==
    'declared_gpu_route_release_qualification_pending') {
    throw new Error(
      'Tool GPU successor implementation and qualification are incomplete.',
    )
  }
  const placementPolicyRef = {
    schemaVersion: placementPolicy.schemaVersion,
    policyHash: placementPolicy.policyHash,
    entryHash: placement.entryHash,
  } as const
  const untrustedQuote = await input.usageQuoteReadPort
    .rereadCurrentQualifiedUsageQuote({
      scope,
      workload,
      placementPolicyRef,
      at: input.createdAt,
    })
  assertClosedPlainSerializedData(untrustedQuote, 'gpu_usage_quote')
  const quote = assertCanonicalProfessionalGpuUsageQuote(
    untrustedQuote,
    input.createdAt,
  )
  if (
    stableAuthorityStringify(quote.scope) !== stableAuthorityStringify(scope)
    || stableAuthorityStringify(quote.workload) !==
      stableAuthorityStringify(workload)
    || stableAuthorityStringify(quote.placementPolicyRef) !==
      stableAuthorityStringify(placementPolicyRef)
  ) throw new Error('GPU usage quote differs from the exact planned workload.')

  const primaryRate = await readRate({
    port: input.currentRateAuthorityReadPort,
    routeId: quote.primary.routeId,
    region: input.region,
    at: input.createdAt,
  })
  const fallbackRate = quote.fallback
    ? await readRate({
        port: input.currentRateAuthorityReadPort,
        routeId: quote.fallback.routeId,
        region: input.region,
        at: input.createdAt,
      })
    : null
  const estimate = createCanonicalProfessionalToolGpuCostEstimate({
    estimateId: input.estimateId,
    scope,
    primaryRateAuthority: primaryRate,
    primaryUsageRange: quote.primary.usageRange,
    ...(fallbackRate && quote.fallback
      ? {
          fallbackRateAuthority: fallbackRate,
          fallbackUsageRange: quote.fallback.usageRange,
          primaryPreInferenceFailureHighUsage:
            quote.primaryPreInferenceFailureHighUsage!,
        }
      : {}),
    createdAt: input.createdAt,
  })
  if (estimate.modelOrOperationCostProfileId !==
    quote.modelOrOperationCostProfileId) {
    throw new Error('GPU usage quote cost profile differs from the estimate.')
  }
  return {
    usageQuote: quote,
    primaryRateAuthority: primaryRate,
    fallbackRateAuthority: fallbackRate,
    estimate,
    callerUsageDurationRateOrPriceAccepted: false,
    customerCreditsMutated: false,
  }
}

export function assertCanonicalProfessionalGpuUsageQuote(
  value: unknown,
  at?: string,
): CanonicalProfessionalGpuUsageQuote {
  const quote = canonicalProfessionalGpuUsageQuoteSchema.parse(value)
  const { quoteHash, ...payload } = quote
  const placementPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const placement = placementPolicy.entries.find((entry) =>
    entry.toolId === quote.scope.toolId)
  const heavy = placement?.placementClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const exactRoute = heavy
    ? quote.primary.routeId === 'a100_80gb_heavy_primary'
      && quote.fallback?.routeId === 'l4_heavy_fallback'
    : placement?.placementClass === 'l4_standard_gpu_primary'
      && quote.primary.routeId === 'l4_standard_primary'
      && quote.fallback === null
  if (
    quoteHash !== sha256AuthorityValue(payload)
    || !placement
    || placement.gpuImplementationDisposition !==
      'declared_gpu_route_release_qualification_pending'
    || quote.placementPolicyRef.policyHash !== placementPolicy.policyHash
    || quote.placementPolicyRef.entryHash !== placement.entryHash
    || quote.modelOrOperationCostProfileId !==
      modelOrOperationCostProfileForTool(quote.scope.toolId)
    || !exactRoute
    || (at !== undefined && (
      Date.parse(at) < Date.parse(quote.observedAt)
      || Date.parse(at) >= Date.parse(quote.expiresAt)
    ))
  ) throw new Error('Professional GPU usage quote is invalid or stale.')
  return quote
}

async function readRate(input: {
  readonly port: CanonicalProfessionalGpuCurrentRateAuthorityReadPort
  readonly routeId: z.infer<typeof routeIdSchema>
  readonly region: 'us-central1' | 'europe-west4'
  readonly at: string
}): Promise<CanonicalProfessionalGoogleCloudGpuRateAuthority> {
  const untrusted = await input.port.rereadCurrentAccountEffectiveRateAuthority({
    routeId: input.routeId,
    region: input.region,
    at: input.at,
  })
  assertClosedPlainSerializedData(untrusted, 'gpu_rate_authority')
  const rate = assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
    untrusted,
    input.at,
  )
  if (rate.routeId !== input.routeId || rate.region !== input.region) {
    throw new Error('GPU rate authority differs from its requested route.')
  }
  return rate
}

function assertClosedPlainSerializedData(
  value: unknown,
  label: string,
  seen = new Set<object>(),
): void {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`${label} contains a non-finite number.`)
    }
    return
  }
  if (typeof value !== 'object') {
    throw new Error(`${label} is not closed serialized data.`)
  }
  const object = value as object
  if (seen.has(object)) throw new Error(`${label} contains a cycle.`)
  seen.add(object)
  const prototype = Object.getPrototypeOf(object)
  if (prototype !== Object.prototype && prototype !== Array.prototype) {
    throw new Error(`${label} is not a plain record or array.`)
  }
  for (const key of Reflect.ownKeys(object)) {
    if (typeof key !== 'string') throw new Error(`${label} contains a symbol.`)
    const descriptor = Object.getOwnPropertyDescriptor(object, key)
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${label} contains an accessor.`)
    }
    assertClosedPlainSerializedData(descriptor.value, label, seen)
  }
  seen.delete(object)
}
