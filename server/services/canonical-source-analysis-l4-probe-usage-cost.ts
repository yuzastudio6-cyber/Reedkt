import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SOURCE_ANALYSIS_L4_PROBE_USAGE_COST_VERSION =
  'canonical-source-analysis-l4-probe-usage-cost-v1' as const

const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const TIMESTAMP = z.string().datetime({ offset: true })
const NONNEGATIVE_INTEGER = z.number().int().nonnegative().safe()
const POSITIVE_INTEGER = z.number().int().positive().safe()
const BYTES_PER_GIB = 1024 ** 3
const THIRTY_DAY_MONTH_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000

const safeId = z.string().regex(SAFE_ID).refine((value) =>
  !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: POSITIVE_INTEGER,
  contentHash: z.string().regex(PREFIXED_SHA256),
}).strict()

const usageCostWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_PROBE_USAGE_COST_VERSION,
  ),
  source: z.literal(
    'canonical_google_cloud_usage_and_account_effective_pricing_reread',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  envelopeDigestSha256: z.string().regex(PREFIXED_SHA256),
  releaseRef: evidenceRefSchema,
  cloudRunExecutionRef: evidenceRefSchema,
  cloudRunTerminalObservationRef: evidenceRefSchema,
  accountEffectiveRateAuthority: z.custom<
    CanonicalCurrentGoogleCloudGpuRateAuthority
  >(),
  workerUsageEvidenceRef: evidenceRefSchema,
  attemptCostReceiptRef: evidenceRefSchema,
  actualUsage: z.object({
    coldStartMilliseconds: NONNEGATIVE_INTEGER,
    activeExecutionMilliseconds: POSITIVE_INTEGER,
    shutdownMilliseconds: NONNEGATIVE_INTEGER,
    totalBillableMilliseconds: POSITIVE_INTEGER,
    allocatedVcpuCount: z.literal(8),
    allocatedMemoryGiB: z.literal(32),
    allocatedGpuCount: z.literal(1),
    persistedPrivateBytes: NONNEGATIVE_INTEGER,
    privateArtifactRetentionMilliseconds: POSITIVE_INTEGER,
    networkEgressBytes: z.literal(0),
    classAOperationCount: POSITIVE_INTEGER,
    classBOperationCount: POSITIVE_INTEGER,
  }).strict(),
  actualCost: z.object({
    gpuUsdNanos: NONNEGATIVE_INTEGER,
    vcpuUsdNanos: NONNEGATIVE_INTEGER,
    memoryUsdNanos: NONNEGATIVE_INTEGER,
    privateStorageUsdNanos: NONNEGATIVE_INTEGER,
    networkEgressUsdNanos: z.literal(0),
    classAOperationUsdNanos: NONNEGATIVE_INTEGER,
    classBOperationUsdNanos: NONNEGATIVE_INTEGER,
    totalInternalCostUsdNanos: NONNEGATIVE_INTEGER,
  }).strict(),
  exactPlatformUsageReread: z.literal(true),
  exactCurrentBillingAccountPriceReread: z.literal(true),
  accountEffectiveCostRecorded: z.literal(true),
  publicListPriceUsedAsSettlementAuthority: z.literal(false),
  platformFundedPreapprovalAnalysis: z.literal(true),
  customerEligibleToolCostMicros: z.literal(0),
  customerEligibleToolCostCredits: z.literal(0),
  serviceFeeIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  terminalGpuInstanceCount: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  observedAt: TIMESTAMP,
}).strict().superRefine((value, context) => {
  if (
    value.actualUsage.totalBillableMilliseconds
      !== value.actualUsage.coldStartMilliseconds
        + value.actualUsage.activeExecutionMilliseconds
        + value.actualUsage.shutdownMilliseconds
    || value.actualCost.totalInternalCostUsdNanos
      !== value.actualCost.gpuUsdNanos + value.actualCost.vcpuUsdNanos
        + value.actualCost.memoryUsdNanos
        + value.actualCost.privateStorageUsdNanos
        + value.actualCost.networkEgressUsdNanos
        + value.actualCost.classAOperationUsdNanos
        + value.actualCost.classBOperationUsdNanos
  ) context.addIssue({
    code: 'custom',
    message: 'Source-analysis L4 probe usage/cost totals are invalid.',
  })
})

const usageCostSchema = usageCostWithoutDigestSchema.extend({
  usageCostDigestSha256: z.string().regex(PREFIXED_SHA256),
}).strict()

export type CanonicalSourceAnalysisL4ProbeUsageCost = z.infer<
  typeof usageCostSchema
>

export function createCanonicalSourceAnalysisL4ProbeUsageCost(
  input: z.input<typeof usageCostWithoutDigestSchema>,
): CanonicalSourceAnalysisL4ProbeUsageCost {
  const payload = usageCostWithoutDigestSchema.parse(input)
  return assertCanonicalSourceAnalysisL4ProbeUsageCost({
    ...payload,
    usageCostDigestSha256: visualIntelligenceDigest(payload),
  })
}

export function assertCanonicalSourceAnalysisL4ProbeUsageCost(
  value: unknown,
): CanonicalSourceAnalysisL4ProbeUsageCost {
  assertPlainSerializedData(value, 'source_analysis_l4_probe_usage_cost')
  const evidence = usageCostSchema.parse(value)
  const authority = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    evidence.accountEffectiveRateAuthority,
    evidence.observedAt,
  )
  if (
    evidence.usageCostDigestSha256 !== visualIntelligenceDigest(
      omit(evidence, 'usageCostDigestSha256'),
    )
    || authority.routeId !== 'l4_standard_primary'
    || authority.profileId !==
      'quality_l4_user_triggered_standard_media_job_v1'
    || authority.routeRole !== 'standard_primary'
    || authority.accelerator !== 'nvidia_l4'
  ) throw conflict('source_analysis_l4_probe_usage_cost_invalid')
  assertExactCostAndRefs(evidence)
  return Object.freeze(evidence)
}

function assertExactCostAndRefs(
  evidence: CanonicalSourceAnalysisL4ProbeUsageCost,
): void {
  type ComponentClass = CanonicalCurrentGoogleCloudGpuRateAuthority[
    'components'
  ][number]['componentClass']
  const component = (name: ComponentClass): number => {
    const match = evidence.accountEffectiveRateAuthority.components.find(
      (candidate) => candidate.componentClass === name,
    )
    if (!match) throw conflict('source_analysis_l4_probe_rate_component_missing')
    return match.maximumUsdNanosPerBillingUnit
  }
  const usage = evidence.actualUsage
  const expectedComponents = {
    gpuUsdNanos: ceilProductDivision(
      component('cloud_run_l4_gpu_second'),
      usage.totalBillableMilliseconds,
      usage.allocatedGpuCount,
      1_000,
    ),
    vcpuUsdNanos: ceilProductDivision(
      component('cloud_run_vcpu_second'),
      usage.totalBillableMilliseconds,
      usage.allocatedVcpuCount,
      1_000,
    ),
    memoryUsdNanos: ceilProductDivision(
      component('cloud_run_memory_gib_second'),
      usage.totalBillableMilliseconds,
      usage.allocatedMemoryGiB,
      1_000,
    ),
    privateStorageUsdNanos: ceilProductDivision(
      component('private_object_storage_gib_month'),
      usage.persistedPrivateBytes,
      usage.privateArtifactRetentionMilliseconds,
      BYTES_PER_GIB * THIRTY_DAY_MONTH_MILLISECONDS,
    ),
    networkEgressUsdNanos: 0,
    classAOperationUsdNanos: ceilProductDivision(
      component('object_class_a_per_1000'),
      usage.classAOperationCount,
      1,
      1_000,
    ),
    classBOperationUsdNanos: ceilProductDivision(
      component('object_class_b_per_1000'),
      usage.classBOperationCount,
      1,
      1_000,
    ),
  }
  const expectedCost = {
    ...expectedComponents,
    totalInternalCostUsdNanos: Object.values(expectedComponents).reduce(
      (total, amount) => total + amount,
      0,
    ),
  }
  const expectedUsageRef = createRef(
    `source-analysis-l4-probe-usage-${evidence.invocationId}`,
    {
      invocationId: evidence.invocationId,
      envelopeDigestSha256: evidence.envelopeDigestSha256,
      cloudRunExecutionRef: evidence.cloudRunExecutionRef,
      cloudRunTerminalObservationRef:
        evidence.cloudRunTerminalObservationRef,
      actualUsage: usage,
    },
  )
  const expectedCostRef = createRef(
    `source-analysis-l4-probe-cost-${evidence.invocationId}`,
    {
      invocationId: evidence.invocationId,
      accountEffectiveRateAuthorityRef: rateAuthorityRef(
        evidence.accountEffectiveRateAuthority,
      ),
      workerUsageEvidenceRef: expectedUsageRef,
      actualCost: expectedCost,
    },
  )
  if (
    visualIntelligenceCanonicalJson(evidence.actualCost)
      !== visualIntelligenceCanonicalJson(expectedCost)
    || !sameRef(evidence.workerUsageEvidenceRef, expectedUsageRef)
    || !sameRef(evidence.attemptCostReceiptRef, expectedCostRef)
  ) throw conflict('source_analysis_l4_probe_cost_reconciliation_invalid')
}

function createRef(
  id: string,
  value: unknown,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id,
    version: 1,
    contentHash: visualIntelligenceDigest(value),
  })
}

function rateAuthorityRef(
  value: CanonicalCurrentGoogleCloudGpuRateAuthority,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: value.rateAuthorityId,
    version: value.rateAuthorityVersion,
    contentHash: `sha256:${value.rateAuthorityHash}`,
  })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function ceilProductDivision(
  left: number,
  middle: number,
  right: number,
  divisor: number,
): number {
  const numerator = BigInt(left) * BigInt(middle) * BigInt(right)
  const quotient = (numerator + BigInt(divisor) - 1n) / BigInt(divisor)
  const result = Number(quotient)
  if (!Number.isSafeInteger(result) || result < 0) {
    throw conflict('source_analysis_l4_probe_cost_overflow')
  }
  return result
}

function omit(value: Record<string, unknown>, key: string): unknown {
  const copy = { ...value }
  Reflect.deleteProperty(copy, key)
  return copy
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The canonical source-analysis L4 probe rejected conflicting cost evidence.',
    409,
    { requiredGate },
  )
}
