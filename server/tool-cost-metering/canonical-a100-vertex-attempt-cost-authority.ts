import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from './canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  assertCanonicalA100VertexCustomJobLaunchAuthority,
  type CanonicalA100VertexCustomJobLaunchAuthority,
} from '../services/canonical-a100-vertex-custom-job-launch-port'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

export const CANONICAL_A100_VERTEX_ATTEMPT_COST_RECEIPT_VERSION =
  'canonical-a100-vertex-attempt-cost-receipt-v1' as const
export const CANONICAL_A100_VERTEX_PROVIDER_ALLOCATION_USAGE_VERSION =
  'canonical-a100-vertex-provider-allocation-usage-v4' as const

export const WEEDITPRO_USD_NANOS_PER_CREDIT = 100_000_000 as const
export const VERTEX_A100_BILLING_INCREMENT_MILLISECONDS = 30_000 as const

const MILLISECONDS_PER_HOUR = 3_600_000n
const THIRTY_DAY_MONTH_MILLISECONDS = 2_592_000_000n
const BYTES_PER_GIB = 1_073_741_824n
const OPERATIONS_PER_BILLING_UNIT = 1_000n

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const usageWithoutHashSchema = z.object({
  providerCreateTime: timestamp,
  providerStartTime: timestamp,
  providerEndTime: timestamp,
  coldStartMilliseconds: nonnegativeInteger,
  runtimeAndModelLoadMilliseconds: nonnegativeInteger,
  activeGpuMilliseconds: nonnegativeInteger,
  drainAndShutdownMilliseconds: nonnegativeInteger,
  actualWallClockMilliseconds: positiveInteger,
  billableDurationMilliseconds: positiveInteger,
  billingIncrementMilliseconds: z.literal(
    VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
  ),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  bootDiskType: z.literal('pd-ssd'),
  bootDiskSizeGb: z.literal(200),
  privateArtifactBytes: nonnegativeInteger,
  privateArtifactRetentionMilliseconds: nonnegativeInteger,
  networkEgressBytes: nonnegativeInteger,
  classAOperationCount: nonnegativeInteger,
  classBOperationCount: nonnegativeInteger,
  exactProviderTimesAndWorkerPhasesReread: z.literal(true),
  workerSuppliedBillableDurationOrPricingAccepted: z.literal(false),
}).strict().superRefine((usage, context) => {
  const create = Date.parse(usage.providerCreateTime)
  const start = Date.parse(usage.providerStartTime)
  const end = Date.parse(usage.providerEndTime)
  const wallClock = end - create
  const phases = usage.coldStartMilliseconds
    + usage.runtimeAndModelLoadMilliseconds
    + usage.activeGpuMilliseconds
    + usage.drainAndShutdownMilliseconds
  const billable = roundUpToIncrement(
    wallClock,
    VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
  )
  if (
    start < create
    || end <= start
    || usage.coldStartMilliseconds !== start - create
    || phases !== wallClock
    || usage.actualWallClockMilliseconds !== wallClock
    || usage.billableDurationMilliseconds !== billable
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 usage lost exact provider time or phase metering.',
  })
})

export const canonicalA100VertexAttemptUsageSchema =
  usageWithoutHashSchema.extend({ usageHash: sha256 }).strict()
export type CanonicalA100VertexAttemptUsage = z.infer<
  typeof canonicalA100VertexAttemptUsageSchema
>

const providerAllocationUsageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_PROVIDER_ALLOCATION_USAGE_VERSION,
  ),
  providerCreateTime: timestamp,
  providerStartTime: timestamp,
  providerEndTime: timestamp,
  coldStartMilliseconds: nonnegativeInteger,
  allocatedGpuMilliseconds: nonnegativeInteger,
  actualWallClockMilliseconds: nonnegativeInteger,
  billableDurationMilliseconds: positiveInteger,
  billingIncrementMilliseconds: z.literal(
    VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
  ),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  bootDiskType: z.literal('pd-ssd'),
  bootDiskSizeGb: z.literal(200),
  privateArtifactBytes: nonnegativeInteger,
  privateArtifactRetentionMilliseconds: nonnegativeInteger,
  networkEgressBytes: nonnegativeInteger,
  classAOperationCount: z.literal(0),
  classBOperationCount: z.literal(0),
  objectStorageOperationMeteringDisposition: z.literal(
    'deferred_to_cloud_billing_invoice_reconciliation',
  ),
  objectStorageOperationCostIncludedInProvisionalCost: z.literal(false),
  finalInvoiceReconciledUsageClaimed: z.literal(false),
  exactProviderCreateStartEndTimesReread: z.literal(true),
  workerPhaseBreakdownClaimed: z.literal(false),
  workerSuppliedBillableDurationOrPricingAccepted: z.literal(false),
}).strict().superRefine((usage, context) => {
  const create = Date.parse(usage.providerCreateTime)
  const start = Date.parse(usage.providerStartTime)
  const end = Date.parse(usage.providerEndTime)
  const wallClock = end - create
  const billable = roundUpToIncrement(
    Math.max(end - start, 1),
    VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
  )
  if (
    start < create
    || end < start
    || usage.coldStartMilliseconds !== start - create
    || usage.allocatedGpuMilliseconds !== end - start
    || usage.actualWallClockMilliseconds !== wallClock
    || usage.billableDurationMilliseconds !== billable
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 provider allocation usage is invalid.',
  })
})

export const canonicalA100VertexProviderAllocationUsageSchema =
  providerAllocationUsageWithoutHashSchema.extend({ usageHash: sha256 })
    .strict()
export type CanonicalA100VertexProviderAllocationUsage = z.infer<
  typeof canonicalA100VertexProviderAllocationUsageSchema
>

const costBreakdownSchema = z.object({
  vertexTrainingA10080GbUsdNanos: nonnegativeInteger,
  vertexTrainingA2CoreUsdNanos: nonnegativeInteger,
  vertexTrainingA2RamUsdNanos: nonnegativeInteger,
  vertexTrainingPdSsdUsdNanos: nonnegativeInteger,
  privateObjectStorageUsdNanos: nonnegativeInteger,
  networkEgressUsdNanos: nonnegativeInteger,
  objectClassAOperationsUsdNanos: nonnegativeInteger,
  objectClassBOperationsUsdNanos: nonnegativeInteger,
  totalInfrastructureCostUsdNanos: nonnegativeInteger,
}).strict().superRefine((cost, context) => {
  const total = cost.vertexTrainingA10080GbUsdNanos
    + cost.vertexTrainingA2CoreUsdNanos
    + cost.vertexTrainingA2RamUsdNanos
    + cost.vertexTrainingPdSsdUsdNanos
    + cost.privateObjectStorageUsdNanos
    + cost.networkEgressUsdNanos
    + cost.objectClassAOperationsUsdNanos
    + cost.objectClassBOperationsUsdNanos
  if (cost.totalInfrastructureCostUsdNanos !== total) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 infrastructure cost components do not reconcile.',
  })
})

export const canonicalA100VertexInfrastructureCostSchema = costBreakdownSchema
export type CanonicalA100VertexInfrastructureCost = z.infer<
  typeof canonicalA100VertexInfrastructureCostSchema
>

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_ATTEMPT_COST_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_a100_vertex_attempt_usage_and_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  receiptId: safeId,
  authorityRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  masterTimingRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  approvedEstimateRef: evidenceRefSchema,
  userApprovalRecordRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  cloudTerminalObservationRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  platformUsageRereadRef: evidenceRefSchema,
  rateAuthorityRef: evidenceRefSchema,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
  ]),
  terminalOutcome: z.enum([
    'completed',
    'weeditpro_failed',
    'canceled',
    'expired',
  ]),
  actualUsage: canonicalA100VertexAttemptUsageSchema,
  actualInfrastructureCost: costBreakdownSchema,
  approvedReservedToolCostCredits: nonnegativeInteger,
  creditValueUsdNanos: z.literal(WEEDITPRO_USD_NANOS_PER_CREDIT),
  customerEligibleInfrastructureCostUsdNanos: nonnegativeInteger,
  customerEligibleToolCostCredits: nonnegativeInteger,
  weeditproAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  creditsRecommendedToRetainForRemainingApprovedPlanWork:
    nonnegativeInteger,
  serviceFeeIncluded: z.literal(false),
  billingAccountIdentifierIncluded: z.literal(false),
  billingAccountEffectiveVertexUsageSkuSetUsed: z.literal(true),
  separateManagementFeeSkuSetCharged: z.literal(false),
  computeEngineReservationOrSpotSkuSetCharged: z.literal(false),
  mixedOrDoubleCountedPricingAccepted: z.literal(false),
  exactPlatformUsageAndCurrentAccountRateReread: z.literal(true),
  unapprovedOverageAbsorbedByWeEditPro: z.literal(true),
  failedCanceledExpiredCostChargedToCustomer: z.literal(false),
  cloudBillingInvoiceReconciliationRequired: z.literal(true),
  createOnlyPersistenceRequired: z.literal(true),
  terminalAttemptStoppedWorker: z.literal(true),
  activeA100GpuInstancesAfterTerminalAttempt: z.literal(0),
  automaticRetryAllowed: z.literal(false),
  customerWalletOrLedgerMutationPerformed: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  attemptStartedAt: timestamp,
  recordedAt: timestamp,
}).strict().superRefine((receipt, context) => {
  const actual = receipt.actualInfrastructureCost
    .totalInfrastructureCostUsdNanos
  const approvedNanos = receipt.approvedReservedToolCostCredits
    * WEEDITPRO_USD_NANOS_PER_CREDIT
  const completed = receipt.terminalOutcome === 'completed'
  const eligible = completed ? Math.min(actual, approvedNanos) : 0
  const eligibleCredits = creditsForUsdNanos(eligible)
  const exact = (!completed
      || receipt.providerInferenceOrSubstantiveWorkOutcome === 'executed')
    && receipt.customerEligibleInfrastructureCostUsdNanos === eligible
    && receipt.customerEligibleToolCostCredits === eligibleCredits
    && receipt.weeditproAbsorbedInfrastructureCostUsdNanos ===
      actual - eligible
    && receipt.creditsRecommendedToRetainForRemainingApprovedPlanWork ===
      receipt.approvedReservedToolCostCredits - eligibleCredits
    && Date.parse(receipt.recordedAt) >=
      Date.parse(receipt.actualUsage.providerEndTime)
    && Date.parse(receipt.attemptStartedAt) <=
      Date.parse(receipt.actualUsage.providerCreateTime)
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 receipt lost charge, failure, or time truth.',
  })
})

export const canonicalA100VertexAttemptCostReceiptSchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalA100VertexAttemptCostReceipt = z.infer<
  typeof canonicalA100VertexAttemptCostReceiptSchema
>

export function createCanonicalA100VertexAttemptUsage(input: {
  readonly providerCreateTime: string
  readonly providerStartTime: string
  readonly providerEndTime: string
  readonly runtimeAndModelLoadMilliseconds: number
  readonly activeGpuMilliseconds: number
  readonly drainAndShutdownMilliseconds: number
  readonly privateArtifactBytes: number
  readonly privateArtifactRetentionMilliseconds: number
  readonly networkEgressBytes: number
  readonly classAOperationCount: number
  readonly classBOperationCount: number
}): CanonicalA100VertexAttemptUsage {
  assertPlainSerializedData(input, 'vertex_a100_attempt_usage_input')
  const create = Date.parse(timestamp.parse(input.providerCreateTime))
  const start = Date.parse(timestamp.parse(input.providerStartTime))
  const end = Date.parse(timestamp.parse(input.providerEndTime))
  if (start < create || end <= start) {
    throw new Error('Vertex A100 provider times are invalid.')
  }
  const payload = usageWithoutHashSchema.parse({
    providerCreateTime: input.providerCreateTime,
    providerStartTime: input.providerStartTime,
    providerEndTime: input.providerEndTime,
    coldStartMilliseconds: start - create,
    runtimeAndModelLoadMilliseconds: input.runtimeAndModelLoadMilliseconds,
    activeGpuMilliseconds: input.activeGpuMilliseconds,
    drainAndShutdownMilliseconds: input.drainAndShutdownMilliseconds,
    actualWallClockMilliseconds: end - create,
    billableDurationMilliseconds: roundUpToIncrement(
      end - create,
      VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
    ),
    billingIncrementMilliseconds:
      VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
    allocatedGpuCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    bootDiskType: 'pd-ssd',
    bootDiskSizeGb: 200,
    privateArtifactBytes: input.privateArtifactBytes,
    privateArtifactRetentionMilliseconds:
      input.privateArtifactRetentionMilliseconds,
    networkEgressBytes: input.networkEgressBytes,
    classAOperationCount: input.classAOperationCount,
    classBOperationCount: input.classBOperationCount,
    exactProviderTimesAndWorkerPhasesReread: true,
    workerSuppliedBillableDurationOrPricingAccepted: false,
  })
  return canonicalA100VertexAttemptUsageSchema.parse({
    ...payload,
    usageHash: sha256AuthorityValue(payload),
  })
}

/**
 * Provider-billed allocation truth for one-shot Vertex Custom Jobs. This is
 * intentionally separate from v1 worker-phase usage: Vertex create/start/end
 * timestamps are the billing authority, while a worker cannot observe its own
 * cold-start or post-exit drain interval and must not invent that split.
 */
export function createCanonicalA100VertexProviderAllocationUsage(input: {
  readonly providerCreateTime: string
  readonly providerStartTime: string
  readonly providerEndTime: string
  readonly privateArtifactBytes: number
  readonly privateArtifactRetentionMilliseconds: number
  readonly networkEgressBytes: number
}): CanonicalA100VertexProviderAllocationUsage {
  assertPlainSerializedData(input, 'vertex_a100_provider_allocation_usage')
  const create = Date.parse(timestamp.parse(input.providerCreateTime))
  const start = Date.parse(timestamp.parse(input.providerStartTime))
  const end = Date.parse(timestamp.parse(input.providerEndTime))
  if (start < create || end < start) {
    throw new Error('Vertex A100 provider allocation times are invalid.')
  }
  const payload = providerAllocationUsageWithoutHashSchema.parse({
    schemaVersion: CANONICAL_A100_VERTEX_PROVIDER_ALLOCATION_USAGE_VERSION,
    providerCreateTime: input.providerCreateTime,
    providerStartTime: input.providerStartTime,
    providerEndTime: input.providerEndTime,
    coldStartMilliseconds: start - create,
    allocatedGpuMilliseconds: end - start,
    actualWallClockMilliseconds: end - create,
    billableDurationMilliseconds: roundUpToIncrement(
      Math.max(end - start, 1),
      VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
    ),
    billingIncrementMilliseconds:
      VERTEX_A100_BILLING_INCREMENT_MILLISECONDS,
    allocatedGpuCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    bootDiskType: 'pd-ssd',
    bootDiskSizeGb: 200,
    privateArtifactBytes: input.privateArtifactBytes,
    privateArtifactRetentionMilliseconds:
      input.privateArtifactRetentionMilliseconds,
    networkEgressBytes: input.networkEgressBytes,
    classAOperationCount: 0,
    classBOperationCount: 0,
    objectStorageOperationMeteringDisposition:
      'deferred_to_cloud_billing_invoice_reconciliation',
    objectStorageOperationCostIncludedInProvisionalCost: false,
    finalInvoiceReconciledUsageClaimed: false,
    exactProviderCreateStartEndTimesReread: true,
    workerPhaseBreakdownClaimed: false,
    workerSuppliedBillableDurationOrPricingAccepted: false,
  })
  return canonicalA100VertexProviderAllocationUsageSchema.parse({
    ...payload,
    usageHash: sha256AuthorityValue(payload),
  })
}

export function calculateCanonicalA100VertexInfrastructureCost(input: {
  readonly rateAuthority: CanonicalCurrentGoogleCloudVertexA100RateAuthority
  readonly usage:
    | CanonicalA100VertexAttemptUsage
    | CanonicalA100VertexProviderAllocationUsage
  readonly at: string
}): CanonicalA100VertexInfrastructureCost {
  const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
    input.rateAuthority,
    input.at,
  )
  const usage = 'schemaVersion' in input.usage
    ? assertCanonicalA100VertexProviderAllocationUsage(input.usage)
    : assertCanonicalA100VertexAttemptUsage(input.usage)
  const component = (componentClass:
    CanonicalCurrentGoogleCloudVertexA100RateAuthority['components'][number][
      'componentClass'
    ]) => {
    const found = rate.components.find((candidate) =>
      candidate.componentClass === componentClass)
    if (!found) throw new Error(
      `Vertex A100 rate component is missing: ${componentClass}.`,
    )
    return BigInt(found.maximumUsdNanosPerBillingUnit)
  }
  const duration = BigInt(usage.billableDurationMilliseconds)
  const payload = {
    vertexTrainingA10080GbUsdNanos: safeNumber(ceilDiv(
      component('vertex_training_a100_80gb_hour') * duration,
      MILLISECONDS_PER_HOUR,
    )),
    vertexTrainingA2CoreUsdNanos: safeNumber(ceilDiv(
      component('vertex_training_a2_core_hour')
        * BigInt(rate.allocatedVcpuCount) * duration,
      MILLISECONDS_PER_HOUR,
    )),
    vertexTrainingA2RamUsdNanos: safeNumber(ceilDiv(
      component('vertex_training_a2_ram_gib_hour')
        * BigInt(rate.allocatedMemoryGiB) * duration,
      MILLISECONDS_PER_HOUR,
    )),
    vertexTrainingPdSsdUsdNanos: safeNumber(ceilDiv(
      component('vertex_training_pd_ssd_gib_month')
        * BigInt(rate.bootDiskSizeGb) * duration,
      THIRTY_DAY_MONTH_MILLISECONDS,
    )),
    privateObjectStorageUsdNanos: safeNumber(ceilDiv(
      component('private_object_storage_gib_month')
        * BigInt(usage.privateArtifactBytes)
        * BigInt(usage.privateArtifactRetentionMilliseconds),
      BYTES_PER_GIB * THIRTY_DAY_MONTH_MILLISECONDS,
    )),
    networkEgressUsdNanos: safeNumber(ceilDiv(
      component('network_egress_gib') * BigInt(usage.networkEgressBytes),
      BYTES_PER_GIB,
    )),
    objectClassAOperationsUsdNanos: safeNumber(ceilDiv(
      component('object_class_a_per_1000')
        * BigInt(usage.classAOperationCount),
      OPERATIONS_PER_BILLING_UNIT,
    )),
    objectClassBOperationsUsdNanos: safeNumber(ceilDiv(
      component('object_class_b_per_1000')
        * BigInt(usage.classBOperationCount),
      OPERATIONS_PER_BILLING_UNIT,
    )),
  }
  return costBreakdownSchema.parse({
    ...payload,
    totalInfrastructureCostUsdNanos: Object.values(payload)
      .reduce((total, value) => total + value, 0),
  })
}

export function createCanonicalA100VertexAttemptCostReceipt(input: {
  readonly receiptId: string
  readonly authority: CanonicalA100VertexCustomJobLaunchAuthority
  readonly executionRef: z.input<typeof evidenceRefSchema>
  readonly cloudTerminalObservationRef: z.input<typeof evidenceRefSchema>
  readonly workerUsageEvidenceRef: z.input<typeof evidenceRefSchema>
  readonly platformUsageRereadRef: z.input<typeof evidenceRefSchema>
  readonly rateAuthority: CanonicalCurrentGoogleCloudVertexA100RateAuthority
  readonly actualUsage: CanonicalA100VertexAttemptUsage
  readonly terminalOutcome:
    'completed' | 'weeditpro_failed' | 'canceled' | 'expired'
  readonly providerInferenceOrSubstantiveWorkOutcome:
    'executed' | 'not_executed'
  readonly attemptStartedAt: string
  readonly recordedAt: string
}): CanonicalA100VertexAttemptCostReceipt {
  const authority = assertCanonicalA100VertexCustomJobLaunchAuthority(
    input.authority,
  )
  const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
    input.rateAuthority,
    input.recordedAt,
  )
  const usage = assertCanonicalA100VertexAttemptUsage(input.actualUsage)
  if (!sameRef(authority.currentRateAuthorityRef, ref(
    rate.rateAuthorityId,
    rate.rateAuthorityHash,
    rate.rateAuthorityVersion,
  ))) throw new Error('Vertex A100 launch and rate authority differ.')
  const cost = calculateCanonicalA100VertexInfrastructureCost({
    rateAuthority: rate,
    usage,
    at: input.recordedAt,
  })
  const completed = input.terminalOutcome === 'completed'
  const ceiling = authority.maximumReservedToolCostCredits
    * WEEDITPRO_USD_NANOS_PER_CREDIT
  const eligible = completed
    ? Math.min(cost.totalInfrastructureCostUsdNanos, ceiling)
    : 0
  const eligibleCredits = creditsForUsdNanos(eligible)
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion: CANONICAL_A100_VERTEX_ATTEMPT_COST_RECEIPT_VERSION,
    source: 'canonical_server_a100_vertex_attempt_usage_and_cost_owner',
    evidenceClass: 'canonical_private_reread',
    receiptId: input.receiptId,
    authorityRef: ref(authority.authorityId, authority.authorityHash),
    releaseRef: authority.releaseRef,
    executionRef: input.executionRef,
    approvedSnapshotRef: authority.approvedSnapshotRef,
    confirmedOutputFrameRef: authority.confirmedOutputFrameRef,
    masterTimingRef: authority.masterTimingRef,
    approvedWorkItemRef: authority.approvedWorkItemRef,
    workerLeaseRef: authority.workerLeaseRef,
    fundedReservationRef: authority.fundedReservationRef,
    approvedEstimateRef: authority.approvedEstimateRef,
    userApprovalRecordRef: authority.userApprovalRecordRef,
    userTriggerRecordRef: authority.userTriggerRecordRef,
    executionAttemptRef: authority.executionAttemptRef,
    executionEnvelopeRef: authority.executionEnvelopeRef,
    cloudTerminalObservationRef: input.cloudTerminalObservationRef,
    workerUsageEvidenceRef: input.workerUsageEvidenceRef,
    platformUsageRereadRef: input.platformUsageRereadRef,
    rateAuthorityRef: authority.currentRateAuthorityRef,
    routeId: authority.routeId,
    executionTarget: authority.executionTarget,
    machineType: rate.machineType,
    accelerator: rate.accelerator,
    providerInferenceOrSubstantiveWorkOutcome:
      input.providerInferenceOrSubstantiveWorkOutcome,
    terminalOutcome: input.terminalOutcome,
    actualUsage: usage,
    actualInfrastructureCost: cost,
    approvedReservedToolCostCredits:
      authority.maximumReservedToolCostCredits,
    creditValueUsdNanos: WEEDITPRO_USD_NANOS_PER_CREDIT,
    customerEligibleInfrastructureCostUsdNanos: eligible,
    customerEligibleToolCostCredits: eligibleCredits,
    weeditproAbsorbedInfrastructureCostUsdNanos:
      cost.totalInfrastructureCostUsdNanos - eligible,
    creditsRecommendedToRetainForRemainingApprovedPlanWork:
      authority.maximumReservedToolCostCredits - eligibleCredits,
    serviceFeeIncluded: false,
    billingAccountIdentifierIncluded: false,
    billingAccountEffectiveVertexUsageSkuSetUsed: true,
    separateManagementFeeSkuSetCharged: false,
    computeEngineReservationOrSpotSkuSetCharged: false,
    mixedOrDoubleCountedPricingAccepted: false,
    exactPlatformUsageAndCurrentAccountRateReread: true,
    unapprovedOverageAbsorbedByWeEditPro: true,
    failedCanceledExpiredCostChargedToCustomer: false,
    cloudBillingInvoiceReconciliationRequired: true,
    createOnlyPersistenceRequired: true,
    terminalAttemptStoppedWorker: true,
    activeA100GpuInstancesAfterTerminalAttempt: 0,
    automaticRetryAllowed: false,
    customerWalletOrLedgerMutationPerformed: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    attemptStartedAt: input.attemptStartedAt,
    recordedAt: input.recordedAt,
  })
  return canonicalA100VertexAttemptCostReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalA100VertexAttemptUsage(
  value: unknown,
): CanonicalA100VertexAttemptUsage {
  assertPlainSerializedData(value, 'vertex_a100_attempt_usage')
  const usage = canonicalA100VertexAttemptUsageSchema.parse(value)
  const { usageHash, ...payload } = usage
  if (usageHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 attempt usage digest is invalid.')
  }
  return usage
}

export function assertCanonicalA100VertexProviderAllocationUsage(
  value: unknown,
): CanonicalA100VertexProviderAllocationUsage {
  assertPlainSerializedData(value, 'vertex_a100_provider_allocation_usage')
  const usage = canonicalA100VertexProviderAllocationUsageSchema.parse(value)
  const { usageHash, ...payload } = usage
  if (usageHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 provider allocation usage digest is invalid.')
  }
  return usage
}

export function assertCanonicalA100VertexAttemptCostReceipt(
  value: unknown,
): CanonicalA100VertexAttemptCostReceipt {
  assertPlainSerializedData(value, 'vertex_a100_attempt_cost_receipt')
  const receipt = canonicalA100VertexAttemptCostReceiptSchema.parse(value)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 attempt cost receipt digest is invalid.')
  }
  assertCanonicalA100VertexAttemptUsage(receipt.actualUsage)
  return receipt
}

function creditsForUsdNanos(value: number): number {
  return Math.ceil(value / WEEDITPRO_USD_NANOS_PER_CREDIT)
}

function roundUpToIncrement(value: number, increment: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Vertex A100 billable duration must be positive.')
  }
  return Math.ceil(value / increment) * increment
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n || denominator <= 0n) {
    throw new Error('Vertex A100 cost fraction is invalid.')
  }
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator
}

function safeNumber(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Vertex A100 cost exceeds the safe integer range.')
  }
  return Number(value)
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
