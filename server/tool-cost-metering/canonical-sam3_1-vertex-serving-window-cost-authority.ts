import { z } from 'zod'

import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority'

export const CANONICAL_SAM3_1_VERTEX_SERVING_WINDOW_USAGE_VERSION =
  'canonical-sam3_1-vertex-serving-window-usage-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_WINDOW_COST_RECEIPT_VERSION =
  'canonical-sam3_1-vertex-serving-window-cost-receipt-v1' as const
export const WEEDITPRO_USD_NANOS_PER_CREDIT = 100_000_000 as const
export const SAM3_1_VERTEX_MINIMUM_WARM_WINDOW_MILLISECONDS = 300_000 as const

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
type EvidenceRef = z.infer<typeof evidenceRefSchema>

const attemptSchema = z.object({
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  editPlanId: safeId,
  editPlanVersion: positiveInteger,
  executionAttemptRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  approvedEstimateRef: evidenceRefSchema,
  userApprovalRecordRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  requestStartedAt: timestamp,
  responseCompletedAt: timestamp,
  activeRequestMilliseconds: positiveInteger,
  terminalOutcome: z.enum([
    'completed',
    'weeditpro_failed',
    'canceled',
  ]),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
  ]),
  approvedReservedToolCostCredits: nonnegativeInteger,
  exactApprovedPlanReservationLeaseTriggerAndAttemptReread: z.literal(true),
  callerSuppliedOutcomeUsageOrPricingAccepted: z.literal(false),
}).strict().superRefine((attempt, context) => {
  const duration = Date.parse(attempt.responseCompletedAt)
    - Date.parse(attempt.requestStartedAt)
  if (
    duration <= 0
    || attempt.activeRequestMilliseconds !== duration
    || (attempt.terminalOutcome === 'completed') !==
      (attempt.providerInferenceOrSubstantiveWorkOutcome === 'executed')
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex serving attempt outcome or duration changed.',
  })
})
export type CanonicalSam31VertexServingWindowAttempt = z.infer<
  typeof attemptSchema
>

const usageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_WINDOW_USAGE_VERSION,
  ),
  source: z.literal(
    'canonical_vertex_endpoint_monitoring_and_billing_usage_reread',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  allocationWindowId: safeId,
  endpointDeploymentRef: evidenceRefSchema,
  endpointResourceName: z.literal(
    'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
  ),
  deployedModelId: z.literal('3101000001'),
  routeId: z.literal('a100_80gb_heavy_primary'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  acceleratorCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  minimumReplicaCount: z.literal(0),
  maximumReplicaCount: z.literal(1),
  scaleUpTriggeredAt: timestamp,
  billableAllocationStartedAt: timestamp,
  endpointReadyAt: timestamp,
  billableAllocationEndedAt: timestamp,
  coldStartMilliseconds: nonnegativeInteger,
  allocatedMilliseconds: positiveInteger,
  billableDurationMilliseconds: positiveInteger,
  minimumWarmWindowMilliseconds: z.literal(
    SAM3_1_VERTEX_MINIMUM_WARM_WINDOW_MILLISECONDS,
  ),
  activeRequestMilliseconds: positiveInteger,
  nonRequestAllocatedMilliseconds: nonnegativeInteger,
  attempts: z.array(attemptSchema).min(1).max(256),
  privateArtifactBytes: nonnegativeInteger,
  privateArtifactRetentionMilliseconds: nonnegativeInteger,
  networkEgressBytes: nonnegativeInteger,
  classAOperationCount: nonnegativeInteger,
  classBOperationCount: nonnegativeInteger,
  endpointMonitoringUsageRef: evidenceRefSchema,
  cloudBillingUsageExportRef: evidenceRefSchema,
  exactEndpointReplicaAndBillingUsageReread: z.literal(true),
  billingExportFinalInvoiceReconciled: z.literal(false),
  unresolvedProviderOutcomeAccepted: z.literal(false),
  overlappingRequestExecutionAccepted: z.literal(false),
  workerSuppliedBillableDurationOrPricingAccepted: z.literal(false),
  scaleToZeroObservedAfterWindow: z.literal(true),
  activeReplicasAfterWindow: z.literal(0),
  observedAt: timestamp,
}).strict().superRefine((usage, context) => {
  const trigger = Date.parse(usage.scaleUpTriggeredAt)
  const start = Date.parse(usage.billableAllocationStartedAt)
  const ready = Date.parse(usage.endpointReadyAt)
  const end = Date.parse(usage.billableAllocationEndedAt)
  const allocated = end - start
  const billable = Math.max(
    allocated,
    SAM3_1_VERTEX_MINIMUM_WARM_WINDOW_MILLISECONDS,
  )
  const active = usage.attempts.reduce((total, attempt) =>
    total + attempt.activeRequestMilliseconds, 0)
  const canonical = [...usage.attempts].sort(compareAttempts)
  let noOverlap = true
  for (let index = 1; index < canonical.length; index += 1) {
    if (Date.parse(canonical[index]!.requestStartedAt) <
      Date.parse(canonical[index - 1]!.responseCompletedAt)) noOverlap = false
  }
  const inWindow = canonical.every((attempt) =>
    Date.parse(attempt.requestStartedAt) >= ready
      && Date.parse(attempt.responseCompletedAt) <= end)
  if (
    trigger > start
    || start > ready
    || ready >= end
    || usage.coldStartMilliseconds !== ready - trigger
    || usage.allocatedMilliseconds !== allocated
    || usage.billableDurationMilliseconds !== billable
    || usage.activeRequestMilliseconds !== active
    || usage.nonRequestAllocatedMilliseconds !== billable - active
    || usage.nonRequestAllocatedMilliseconds < 0
    || !noOverlap
    || !inWindow
    || stableAuthorityStringify(canonical) !==
      stableAuthorityStringify(usage.attempts)
    || new Set(usage.attempts.map((attempt) =>
      stableAuthorityStringify(attempt.executionAttemptRef))).size !==
      usage.attempts.length
    || Date.parse(usage.observedAt) < end
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex serving allocation-window usage is inconsistent.',
  })
})
export const canonicalSam31VertexServingWindowUsageSchema =
  usageWithoutHashSchema.extend({ usageHash: sha256 }).strict()
export type CanonicalSam31VertexServingWindowUsage = z.infer<
  typeof canonicalSam31VertexServingWindowUsageSchema
>

const costBreakdownSchema = z.object({
  vertexPredictionA10080GbUsdNanos: nonnegativeInteger,
  vertexPredictionA2CoreUsdNanos: nonnegativeInteger,
  vertexPredictionA2RamUsdNanos: nonnegativeInteger,
  vertexManagementA2CoreUsdNanos: nonnegativeInteger,
  vertexManagementA2RamUsdNanos: nonnegativeInteger,
  privateObjectStorageUsdNanos: nonnegativeInteger,
  networkEgressUsdNanos: nonnegativeInteger,
  objectClassAOperationsUsdNanos: nonnegativeInteger,
  objectClassBOperationsUsdNanos: nonnegativeInteger,
  totalInfrastructureCostUsdNanos: nonnegativeInteger,
}).strict().superRefine((cost, context) => {
  const total = Object.entries(cost)
    .filter(([key]) => key !== 'totalInfrastructureCostUsdNanos')
    .reduce((sum, [, value]) => sum + value, 0)
  if (cost.totalInfrastructureCostUsdNanos !== total) context.addIssue({
    code: 'custom',
    message: 'Vertex serving cost components do not reconcile.',
  })
})
export type CanonicalSam31VertexServingWindowCostBreakdown = z.infer<
  typeof costBreakdownSchema
>

const allocationSchema = z.object({
  executionAttemptRef: evidenceRefSchema,
  allocatedInfrastructureCostUsdNanos: nonnegativeInteger,
  approvedReservedToolCostCredits: nonnegativeInteger,
  customerEligibleInfrastructureCostUsdNanos: nonnegativeInteger,
  customerEligibleToolCostCredits: nonnegativeInteger,
  weeditproAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  creditsRecommendedToRetainForRemainingApprovedPlanWork:
    nonnegativeInteger,
  terminalOutcome: z.enum([
    'completed',
    'weeditpro_failed',
    'canceled',
  ]),
}).strict().superRefine((allocation, context) => {
  const completed = allocation.terminalOutcome === 'completed'
  const ceiling = allocation.approvedReservedToolCostCredits
    * WEEDITPRO_USD_NANOS_PER_CREDIT
  const eligible = completed
    ? Math.min(allocation.allocatedInfrastructureCostUsdNanos, ceiling)
    : 0
  const credits = creditsForUsdNanos(eligible)
  if (
    allocation.customerEligibleInfrastructureCostUsdNanos !== eligible
    || allocation.customerEligibleToolCostCredits !== credits
    || allocation.weeditproAbsorbedInfrastructureCostUsdNanos !==
      allocation.allocatedInfrastructureCostUsdNanos - eligible
    || allocation.creditsRecommendedToRetainForRemainingApprovedPlanWork !==
      allocation.approvedReservedToolCostCredits - credits
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex serving per-attempt allocation lost charge truth.',
  })
})

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_WINDOW_COST_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_window_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  receiptId: safeId,
  endpointDeploymentRef: evidenceRefSchema,
  usage: canonicalSam31VertexServingWindowUsageSchema,
  rateAuthorityRef: evidenceRefSchema,
  actualInfrastructureCost: costBreakdownSchema,
  attemptAllocations: z.array(allocationSchema).min(1).max(256),
  totalCustomerEligibleInfrastructureCostUsdNanos: nonnegativeInteger,
  totalCustomerEligibleToolCostCredits: nonnegativeInteger,
  totalWeEditProAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  creditValueUsdNanos: z.literal(WEEDITPRO_USD_NANOS_PER_CREDIT),
  billingAccountEffectiveVertexServingSkuSetUsed: z.literal(true),
  predictionUsageAndManagementSkuSetChargedExactlyOnce: z.literal(true),
  trainingOrComputeEngineSkuSetCharged: z.literal(false),
  mixedOrDoubleCountedPricingAccepted: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  billingAccountIdentifierIncluded: z.literal(false),
  exactClosedWindowUsageAndCurrentAccountRateReread: z.literal(true),
  failedOrCanceledAttemptCostChargedToCustomer: z.literal(false),
  unapprovedOverageAbsorbedByWeEditPro: z.literal(true),
  cloudBillingInvoiceReconciliationRequired: z.literal(true),
  createOnlyPersistenceRequired: z.literal(true),
  customerWalletOrLedgerMutationPerformed: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict().superRefine((receipt, context) => {
  const attempts = receipt.usage.attempts
  const allocations = receipt.attemptAllocations
  const sameOrder = stableAuthorityStringify(allocations.map((allocation) =>
    allocation.executionAttemptRef)) === stableAuthorityStringify(
    attempts.map((attempt) => attempt.executionAttemptRef),
  )
  const allocated = allocations.reduce((total, allocation) =>
    total + allocation.allocatedInfrastructureCostUsdNanos, 0)
  const eligibleNanos = allocations.reduce((total, allocation) =>
    total + allocation.customerEligibleInfrastructureCostUsdNanos, 0)
  const eligibleCredits = allocations.reduce((total, allocation) =>
    total + allocation.customerEligibleToolCostCredits, 0)
  const absorbed = allocations.reduce((total, allocation) =>
    total + allocation.weeditproAbsorbedInfrastructureCostUsdNanos, 0)
  if (
    !sameOrder
    || allocated !==
      receipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos
    || eligibleNanos !==
      receipt.totalCustomerEligibleInfrastructureCostUsdNanos
    || eligibleCredits !== receipt.totalCustomerEligibleToolCostCredits
    || absorbed !== receipt.totalWeEditProAbsorbedInfrastructureCostUsdNanos
    || eligibleNanos + absorbed !== allocated
    || Date.parse(receipt.recordedAt) <
      Date.parse(receipt.usage.observedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex serving window receipt does not reconcile.',
  })
})
export const canonicalSam31VertexServingWindowCostReceiptSchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31VertexServingWindowCostReceipt = z.infer<
  typeof canonicalSam31VertexServingWindowCostReceiptSchema
>

export function createCanonicalSam31VertexServingWindowUsage(input: {
  readonly allocationWindowId: string
  readonly endpointDeploymentRef: EvidenceRef
  readonly scaleUpTriggeredAt: string
  readonly billableAllocationStartedAt: string
  readonly endpointReadyAt: string
  readonly billableAllocationEndedAt: string
  readonly attempts: readonly CanonicalSam31VertexServingWindowAttempt[]
  readonly privateArtifactBytes: number
  readonly privateArtifactRetentionMilliseconds: number
  readonly networkEgressBytes: number
  readonly classAOperationCount: number
  readonly classBOperationCount: number
  readonly endpointMonitoringUsageRef: EvidenceRef
  readonly cloudBillingUsageExportRef: EvidenceRef
  readonly observedAt: string
}): CanonicalSam31VertexServingWindowUsage {
  assertPlainSerializedData(input, 'sam31_vertex_serving_window_usage')
  const attempts = [...input.attempts].map((attempt) =>
    attemptSchema.parse(attempt)).sort(compareAttempts)
  const allocated = Date.parse(input.billableAllocationEndedAt)
    - Date.parse(input.billableAllocationStartedAt)
  const billable = Math.max(
    allocated,
    SAM3_1_VERTEX_MINIMUM_WARM_WINDOW_MILLISECONDS,
  )
  const active = attempts.reduce((total, attempt) =>
    total + attempt.activeRequestMilliseconds, 0)
  const payload = usageWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_SERVING_WINDOW_USAGE_VERSION,
    source: 'canonical_vertex_endpoint_monitoring_and_billing_usage_reread',
    evidenceClass: 'canonical_private_reread',
    allocationWindowId: input.allocationWindowId,
    endpointDeploymentRef: input.endpointDeploymentRef,
    endpointResourceName:
      'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1',
    deployedModelId: '3101000001',
    routeId: 'a100_80gb_heavy_primary',
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    acceleratorCount: 1,
    allocatedVcpuCount: 12,
    allocatedMemoryGiB: 170,
    minimumReplicaCount: 0,
    maximumReplicaCount: 1,
    scaleUpTriggeredAt: input.scaleUpTriggeredAt,
    billableAllocationStartedAt: input.billableAllocationStartedAt,
    endpointReadyAt: input.endpointReadyAt,
    billableAllocationEndedAt: input.billableAllocationEndedAt,
    coldStartMilliseconds: Date.parse(input.endpointReadyAt)
      - Date.parse(input.scaleUpTriggeredAt),
    allocatedMilliseconds: allocated,
    billableDurationMilliseconds: billable,
    minimumWarmWindowMilliseconds:
      SAM3_1_VERTEX_MINIMUM_WARM_WINDOW_MILLISECONDS,
    activeRequestMilliseconds: active,
    nonRequestAllocatedMilliseconds: billable - active,
    attempts,
    privateArtifactBytes: input.privateArtifactBytes,
    privateArtifactRetentionMilliseconds:
      input.privateArtifactRetentionMilliseconds,
    networkEgressBytes: input.networkEgressBytes,
    classAOperationCount: input.classAOperationCount,
    classBOperationCount: input.classBOperationCount,
    endpointMonitoringUsageRef: input.endpointMonitoringUsageRef,
    cloudBillingUsageExportRef: input.cloudBillingUsageExportRef,
    exactEndpointReplicaAndBillingUsageReread: true,
    billingExportFinalInvoiceReconciled: false,
    unresolvedProviderOutcomeAccepted: false,
    overlappingRequestExecutionAccepted: false,
    workerSuppliedBillableDurationOrPricingAccepted: false,
    scaleToZeroObservedAfterWindow: true,
    activeReplicasAfterWindow: 0,
    observedAt: input.observedAt,
  })
  return canonicalSam31VertexServingWindowUsageSchema.parse({
    ...payload,
    usageHash: sha256AuthorityValue(payload),
  })
}

export function calculateCanonicalSam31VertexServingWindowCost(input: {
  readonly rateAuthority:
    CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
  readonly usage: CanonicalSam31VertexServingWindowUsage
  readonly at: string
}): CanonicalSam31VertexServingWindowCostBreakdown {
  const rate = assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
    input.rateAuthority,
    input.at,
  )
  const usage = assertCanonicalSam31VertexServingWindowUsage(input.usage)
  if (
    usage.endpointResourceName.split('/').at(-1) !== rate.endpointId
    || usage.machineType !== rate.machineType
    || usage.accelerator !== rate.accelerator
    || usage.allocatedVcpuCount !== rate.allocatedVcpuCount
    || usage.allocatedMemoryGiB !== rate.allocatedMemoryGiB
    || usage.minimumWarmWindowMilliseconds !==
      rate.minimumWarmBillingWindowSeconds * 1_000
  ) throw new Error('Vertex serving usage and rate authority differ.')
  const component = (componentClass:
    CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority['components'][number]['componentClass'],
  ): bigint => {
    const found = rate.components.find((candidate) =>
      candidate.componentClass === componentClass)
    if (!found) throw new Error(
      `Vertex serving rate component is missing: ${componentClass}.`,
    )
    return BigInt(found.maximumUsdNanosPerBillingUnit)
  }
  const duration = BigInt(usage.billableDurationMilliseconds)
  const payload = {
    vertexPredictionA10080GbUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_a100_80gb_hour') * duration,
      MILLISECONDS_PER_HOUR,
    )),
    vertexPredictionA2CoreUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_a2_core_hour')
        * BigInt(rate.allocatedVcpuCount) * duration,
      MILLISECONDS_PER_HOUR,
    )),
    vertexPredictionA2RamUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_a2_ram_gib_hour')
        * BigInt(rate.allocatedMemoryGiB) * duration,
      MILLISECONDS_PER_HOUR,
    )),
    vertexManagementA2CoreUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_management_a2_core_hour')
        * BigInt(rate.allocatedVcpuCount) * duration,
      MILLISECONDS_PER_HOUR,
    )),
    vertexManagementA2RamUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_management_a2_ram_gib_hour')
        * BigInt(rate.allocatedMemoryGiB) * duration,
      MILLISECONDS_PER_HOUR,
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

export function createCanonicalSam31VertexServingWindowCostReceipt(input: {
  readonly receiptId: string
  readonly usage: CanonicalSam31VertexServingWindowUsage
  readonly rateAuthority:
    CanonicalCurrentGoogleCloudVertexA100ServingRateAuthority
  readonly recordedAt: string
}): CanonicalSam31VertexServingWindowCostReceipt {
  assertPlainSerializedData(input, 'sam31_vertex_serving_window_cost_receipt')
  const usage = assertCanonicalSam31VertexServingWindowUsage(input.usage)
  const rate = assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
    input.rateAuthority,
    input.recordedAt,
  )
  const cost = calculateCanonicalSam31VertexServingWindowCost({
    rateAuthority: rate,
    usage,
    at: input.recordedAt,
  })
  const shares = allocateByActiveDuration(
    cost.totalInfrastructureCostUsdNanos,
    usage.attempts,
  )
  const allocations = usage.attempts.map((attempt, index) => {
    const allocated = shares[index]!
    const completed = attempt.terminalOutcome === 'completed'
    const ceiling = attempt.approvedReservedToolCostCredits
      * WEEDITPRO_USD_NANOS_PER_CREDIT
    const eligible = completed ? Math.min(allocated, ceiling) : 0
    const eligibleCredits = creditsForUsdNanos(eligible)
    return allocationSchema.parse({
      executionAttemptRef: attempt.executionAttemptRef,
      allocatedInfrastructureCostUsdNanos: allocated,
      approvedReservedToolCostCredits:
        attempt.approvedReservedToolCostCredits,
      customerEligibleInfrastructureCostUsdNanos: eligible,
      customerEligibleToolCostCredits: eligibleCredits,
      weeditproAbsorbedInfrastructureCostUsdNanos: allocated - eligible,
      creditsRecommendedToRetainForRemainingApprovedPlanWork:
        attempt.approvedReservedToolCostCredits - eligibleCredits,
      terminalOutcome: attempt.terminalOutcome,
    })
  })
  const eligibleNanos = allocations.reduce((total, allocation) =>
    total + allocation.customerEligibleInfrastructureCostUsdNanos, 0)
  const eligibleCredits = allocations.reduce((total, allocation) =>
    total + allocation.customerEligibleToolCostCredits, 0)
  const absorbed = allocations.reduce((total, allocation) =>
    total + allocation.weeditproAbsorbedInfrastructureCostUsdNanos, 0)
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_WINDOW_COST_RECEIPT_VERSION,
    source: 'canonical_server_sam3_1_vertex_serving_window_cost_owner',
    evidenceClass: 'canonical_private_reread',
    receiptId: input.receiptId,
    endpointDeploymentRef: usage.endpointDeploymentRef,
    usage,
    rateAuthorityRef: {
      id: rate.rateAuthorityId,
      version: rate.rateAuthorityVersion,
      contentHash: `sha256:${rate.rateAuthorityHash}`,
    },
    actualInfrastructureCost: cost,
    attemptAllocations: allocations,
    totalCustomerEligibleInfrastructureCostUsdNanos: eligibleNanos,
    totalCustomerEligibleToolCostCredits: eligibleCredits,
    totalWeEditProAbsorbedInfrastructureCostUsdNanos: absorbed,
    creditValueUsdNanos: WEEDITPRO_USD_NANOS_PER_CREDIT,
    billingAccountEffectiveVertexServingSkuSetUsed: true,
    predictionUsageAndManagementSkuSetChargedExactlyOnce: true,
    trainingOrComputeEngineSkuSetCharged: false,
    mixedOrDoubleCountedPricingAccepted: false,
    serviceFeeIncluded: false,
    billingAccountIdentifierIncluded: false,
    exactClosedWindowUsageAndCurrentAccountRateReread: true,
    failedOrCanceledAttemptCostChargedToCustomer: false,
    unapprovedOverageAbsorbedByWeEditPro: true,
    cloudBillingInvoiceReconciliationRequired: true,
    createOnlyPersistenceRequired: true,
    customerWalletOrLedgerMutationPerformed: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    recordedAt: input.recordedAt,
  })
  return canonicalSam31VertexServingWindowCostReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexServingWindowUsage(
  value: unknown,
): CanonicalSam31VertexServingWindowUsage {
  const parsed = canonicalSam31VertexServingWindowUsageSchema.parse(value)
  const { usageHash, ...payload } = parsed
  if (usageHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex serving window usage digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingWindowCostReceipt(
  value: unknown,
): CanonicalSam31VertexServingWindowCostReceipt {
  const parsed = canonicalSam31VertexServingWindowCostReceiptSchema.parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex serving window cost receipt digest changed.')
  }
  return parsed
}

function compareAttempts(
  left: CanonicalSam31VertexServingWindowAttempt,
  right: CanonicalSam31VertexServingWindowAttempt,
): number {
  return compareUtf16(left.requestStartedAt, right.requestStartedAt)
    || compareUtf16(
      stableAuthorityStringify(left.executionAttemptRef),
      stableAuthorityStringify(right.executionAttemptRef),
    )
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function allocateByActiveDuration(
  totalUsdNanos: number,
  attempts: readonly CanonicalSam31VertexServingWindowAttempt[],
): number[] {
  const total = BigInt(totalUsdNanos)
  const weights = attempts.map((attempt) =>
    BigInt(attempt.activeRequestMilliseconds))
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0n)
  const allocations = weights.map((weight) => total * weight / weightTotal)
  let remainder = total - allocations.reduce((sum, value) => sum + value, 0n)
  for (let index = 0; remainder > 0n; index += 1, remainder -= 1n) {
    allocations[index] = allocations[index]! + 1n
  }
  return allocations.map(safeNumber)
}

function creditsForUsdNanos(value: number): number {
  return safeNumber(ceilDiv(
    BigInt(value),
    BigInt(WEEDITPRO_USD_NANOS_PER_CREDIT),
  ))
}

function ceilDiv(value: bigint, divisor: bigint): bigint {
  return value === 0n ? 0n : (value + divisor - 1n) / divisor
}

function safeNumber(value: bigint): number {
  const converted = Number(value)
  if (!Number.isSafeInteger(converted) || converted < 0) {
    throw new Error('Vertex serving cost exceeds exact integer range.')
  }
  return converted
}
