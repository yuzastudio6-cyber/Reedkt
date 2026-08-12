import { z } from 'zod'

import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  type CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  WEEDITPRO_USD_NANOS_PER_CREDIT,
} from './canonical-sam3_1-vertex-serving-window-cost-authority'

export const CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_USAGE_VERSION =
  'canonical-sam3_1-vertex-serving-window-usage-v3' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_COST_RECEIPT_VERSION =
  'canonical-sam3_1-vertex-serving-window-cost-receipt-v3' as const

const ENDPOINT_RESOURCE =
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
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
  terminalOutcome: z.enum(['completed', 'weeditpro_failed', 'canceled']),
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
  if (duration <= 0 || attempt.activeRequestMilliseconds !== duration
    || (attempt.terminalOutcome === 'completed') !==
      (attempt.providerInferenceOrSubstantiveWorkOutcome === 'executed')) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex multi-replica attempt outcome or duration changed.',
    })
  }
})
export type CanonicalSam31VertexServingMultiReplicaWindowAttempt = z.infer<
  typeof attemptSchema
>

const replicaSliceSchema = z.object({
  sliceOrdinal: positiveInteger,
  startedAt: timestamp,
  endedAt: timestamp,
  activeReplicaCount: z.number().int().min(1).max(16),
  allocatedReplicaMilliseconds: positiveInteger,
}).strict().superRefine((slice, context) => {
  const duration = Date.parse(slice.endedAt) - Date.parse(slice.startedAt)
  if (duration <= 0 || slice.allocatedReplicaMilliseconds !==
    duration * slice.activeReplicaCount) context.addIssue({
    code: 'custom',
    message: 'Vertex replica allocation slice changed.',
  })
})

const usageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_USAGE_VERSION,
  ),
  source: z.literal(
    'canonical_vertex_endpoint_monitoring_and_billing_usage_reread',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  allocationWindowId: safeId,
  endpointDeploymentRef: evidenceRefSchema,
  endpointCapacityObservationRef: evidenceRefSchema,
  endpointResourceName: z.literal(ENDPOINT_RESOURCE),
  deployedModelId: z.literal(
    CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  ),
  routeId: z.literal('a100_80gb_heavy_primary'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  acceleratorCountPerReplica: z.literal(1),
  allocatedVcpuCountPerReplica: z.literal(12),
  allocatedMemoryGiBPerReplica: z.literal(170),
  minimumReplicaCount: z.literal(0),
  maximumReplicaCount: z.number().int().min(1).max(16),
  maximumConcurrentInvocations: z.number().int().min(1).max(16),
  scaleUpTriggeredAt: timestamp,
  endpointReadyAt: timestamp,
  billableAllocationEndedAt: timestamp,
  coldStartMilliseconds: nonnegativeInteger,
  replicaAllocationSlices: z.array(replicaSliceSchema).min(1).max(1_024),
  billableReplicaMilliseconds: positiveInteger,
  activeRequestMilliseconds: positiveInteger,
  nonRequestReplicaMilliseconds: nonnegativeInteger,
  attempts: z.array(attemptSchema).min(1).max(2_048),
  privateArtifactBytes: nonnegativeInteger,
  privateArtifactRetentionMilliseconds: nonnegativeInteger,
  networkEgressBytes: nonnegativeInteger,
  classAOperationCount: nonnegativeInteger,
  classBOperationCount: nonnegativeInteger,
  endpointMonitoringUsageRef: evidenceRefSchema,
  cloudBillingUsageExportRef: evidenceRefSchema,
  exactEndpointReplicaIntervalsAndBillingUsageReread: z.literal(true),
  configuredMaximumNeverUsedAsBilledReplicaCount: z.literal(true),
  billingExportFinalInvoiceReconciled: z.literal(false),
  unresolvedProviderOutcomeAccepted: z.literal(false),
  overlappingRequestExecutionAccepted: z.literal(true),
  measuredPeakConcurrentInvocations: positiveInteger.max(16),
  workerSuppliedBillableDurationReplicaCountOrPricingAccepted:
    z.literal(false),
  scaleToZeroObservedAfterWindow: z.literal(true),
  activeReplicasAfterWindow: z.literal(0),
  observedAt: timestamp,
}).strict().superRefine((usage, context) => {
  const slices = usage.replicaAllocationSlices
  const attempts = usage.attempts
  const exactSliceOrder = slices.every((slice, index) =>
    slice.sliceOrdinal === index + 1
      && (index === 0 || slices[index - 1]!.endedAt === slice.startedAt))
  const billableReplicaMilliseconds = slices.reduce((total, slice) =>
    total + slice.allocatedReplicaMilliseconds, 0)
  const activeRequestMilliseconds = attempts.reduce((total, attempt) =>
    total + attempt.activeRequestMilliseconds, 0)
  const canonicalAttempts = [...attempts].sort(compareAttempts)
  const peak = measuredPeakConcurrency(attempts)
  const firstSlice = slices[0]
  const lastSlice = slices.at(-1)
  const withinWindow = attempts.every((attempt) =>
    Date.parse(attempt.requestStartedAt) >= Date.parse(usage.endpointReadyAt)
      && Date.parse(attempt.responseCompletedAt) <=
        Date.parse(usage.billableAllocationEndedAt))
  const allocationCoversAttemptConcurrency =
    everyAttemptConcurrencyCoveredByReplicaSlices(attempts, slices)
  if (!exactSliceOrder
    || firstSlice?.startedAt !== usage.scaleUpTriggeredAt
    || lastSlice?.endedAt !== usage.billableAllocationEndedAt
    || slices.some((slice) => slice.activeReplicaCount >
      usage.maximumReplicaCount)
    || usage.maximumConcurrentInvocations !== usage.maximumReplicaCount
    || usage.coldStartMilliseconds !== Date.parse(usage.endpointReadyAt)
      - Date.parse(usage.scaleUpTriggeredAt)
    || billableReplicaMilliseconds !== usage.billableReplicaMilliseconds
    || activeRequestMilliseconds !== usage.activeRequestMilliseconds
    || usage.nonRequestReplicaMilliseconds !==
      billableReplicaMilliseconds - activeRequestMilliseconds
    || activeRequestMilliseconds > billableReplicaMilliseconds
    || stableAuthorityStringify(canonicalAttempts) !==
      stableAuthorityStringify(attempts)
    || new Set(attempts.map((attempt) =>
      stableAuthorityStringify(attempt.executionAttemptRef))).size !==
      attempts.length
    || !withinWindow
    || !allocationCoversAttemptConcurrency
    || peak !== usage.measuredPeakConcurrentInvocations
    || peak > usage.maximumConcurrentInvocations
    || Date.parse(usage.observedAt) <
      Date.parse(usage.billableAllocationEndedAt)) context.addIssue({
    code: 'custom',
    message: 'Vertex multi-replica allocation-window usage is inconsistent.',
  })
})

export const canonicalSam31VertexServingMultiReplicaWindowUsageSchema =
  usageWithoutHashSchema.extend({ usageHash: sha256 }).strict()
export type CanonicalSam31VertexServingMultiReplicaWindowUsage = z.infer<
  typeof canonicalSam31VertexServingMultiReplicaWindowUsageSchema
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
    message: 'Vertex multi-replica cost components do not reconcile.',
  })
})
export type CanonicalSam31VertexServingMultiReplicaWindowCostBreakdown =
  z.infer<typeof costBreakdownSchema>

const allocationSchema = z.object({
  executionAttemptRef: evidenceRefSchema,
  allocatedInfrastructureCostUsdNanos: nonnegativeInteger,
  approvedReservedToolCostCredits: nonnegativeInteger,
  customerEligibleInfrastructureCostUsdNanos: nonnegativeInteger,
  customerEligibleToolCostCredits: nonnegativeInteger,
  weeditproAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  creditsRecommendedToRetainForRemainingApprovedPlanWork:
    nonnegativeInteger,
  terminalOutcome: z.enum(['completed', 'weeditpro_failed', 'canceled']),
}).strict().superRefine((allocation, context) => {
  const completed = allocation.terminalOutcome === 'completed'
  const ceiling = allocation.approvedReservedToolCostCredits
    * WEEDITPRO_USD_NANOS_PER_CREDIT
  const eligible = completed
    ? Math.min(allocation.allocatedInfrastructureCostUsdNanos, ceiling)
    : 0
  const credits = creditsForUsdNanos(eligible)
  if (allocation.customerEligibleInfrastructureCostUsdNanos !== eligible
    || allocation.customerEligibleToolCostCredits !== credits
    || allocation.weeditproAbsorbedInfrastructureCostUsdNanos !==
      allocation.allocatedInfrastructureCostUsdNanos - eligible
    || allocation.creditsRecommendedToRetainForRemainingApprovedPlanWork !==
      allocation.approvedReservedToolCostCredits - credits) context.addIssue({
    code: 'custom',
    message: 'Vertex multi-replica attempt allocation lost charge truth.',
  })
})

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_COST_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_window_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  receiptId: safeId,
  endpointDeploymentRef: evidenceRefSchema,
  endpointCapacityObservationRef: evidenceRefSchema,
  usage: canonicalSam31VertexServingMultiReplicaWindowUsageSchema,
  rateAuthorityRef: evidenceRefSchema,
  actualInfrastructureCost: costBreakdownSchema,
  attemptAllocations: z.array(allocationSchema).min(1).max(2_048),
  totalCustomerEligibleInfrastructureCostUsdNanos: nonnegativeInteger,
  totalCustomerEligibleToolCostCredits: nonnegativeInteger,
  totalWeEditProAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  creditValueUsdNanos: z.literal(WEEDITPRO_USD_NANOS_PER_CREDIT),
  billingAccountEffectiveVertexServingSkuSetUsed: z.literal(true),
  actualReplicaMillisecondsChargedExactlyOnce: z.literal(true),
  configuredMaximumReplicasChargedAsAllocatedReplicas: z.literal(false),
  trainingOrComputeEngineSkuSetCharged: z.literal(false),
  mixedOrDoubleCountedPricingAccepted: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  billingAccountIdentifierIncluded: z.literal(false),
  exactClosedWindowUsageCapacityAndCurrentAccountRateReread: z.literal(true),
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
  const allocations = receipt.attemptAllocations
  const attempts = receipt.usage.attempts
  const allocated = allocations.reduce((total, allocation) =>
    total + allocation.allocatedInfrastructureCostUsdNanos, 0)
  const eligible = allocations.reduce((total, allocation) =>
    total + allocation.customerEligibleInfrastructureCostUsdNanos, 0)
  const credits = allocations.reduce((total, allocation) =>
    total + allocation.customerEligibleToolCostCredits, 0)
  const absorbed = allocations.reduce((total, allocation) =>
    total + allocation.weeditproAbsorbedInfrastructureCostUsdNanos, 0)
  if (stableAuthorityStringify(allocations.map((allocation) =>
      allocation.executionAttemptRef)) !== stableAuthorityStringify(
    attempts.map((attempt) => attempt.executionAttemptRef),
  ) || allocated !==
      receipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos
    || eligible !== receipt.totalCustomerEligibleInfrastructureCostUsdNanos
    || credits !== receipt.totalCustomerEligibleToolCostCredits
    || absorbed !== receipt.totalWeEditProAbsorbedInfrastructureCostUsdNanos
    || eligible + absorbed !== allocated
    || !sameRef(receipt.endpointCapacityObservationRef,
      receipt.usage.endpointCapacityObservationRef)
    || Date.parse(receipt.recordedAt) < Date.parse(receipt.usage.observedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex multi-replica window receipt does not reconcile.',
    })
  }
})

export const canonicalSam31VertexServingMultiReplicaWindowCostReceiptSchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31VertexServingMultiReplicaWindowCostReceipt = z.infer<
  typeof canonicalSam31VertexServingMultiReplicaWindowCostReceiptSchema
>

export function createCanonicalSam31VertexServingMultiReplicaWindowUsage(
  input: {
    readonly allocationWindowId: string
    readonly endpointDeploymentRef: EvidenceRef
    readonly endpointCapacityObservationRef: EvidenceRef
    readonly maximumReplicaCount: number
    readonly scaleUpTriggeredAt: string
    readonly endpointReadyAt: string
    readonly billableAllocationEndedAt: string
    readonly replicaAllocationSlices: readonly z.input<
      typeof replicaSliceSchema
    >[]
    readonly attempts:
      readonly CanonicalSam31VertexServingMultiReplicaWindowAttempt[]
    readonly privateArtifactBytes: number
    readonly privateArtifactRetentionMilliseconds: number
    readonly networkEgressBytes: number
    readonly classAOperationCount: number
    readonly classBOperationCount: number
    readonly endpointMonitoringUsageRef: EvidenceRef
    readonly cloudBillingUsageExportRef: EvidenceRef
    readonly observedAt: string
  },
): CanonicalSam31VertexServingMultiReplicaWindowUsage {
  assertPlainSerializedData(input, 'sam31_vertex_multi_replica_window_usage')
  const attempts = [...input.attempts].map((attempt) =>
    attemptSchema.parse(attempt)).sort(compareAttempts)
  const slices = [...input.replicaAllocationSlices].map((slice) =>
    replicaSliceSchema.parse(slice))
  const billableReplicaMilliseconds = slices.reduce((total, slice) =>
    total + slice.allocatedReplicaMilliseconds, 0)
  const activeRequestMilliseconds = attempts.reduce((total, attempt) =>
    total + attempt.activeRequestMilliseconds, 0)
  const payload = usageWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_USAGE_VERSION,
    source: 'canonical_vertex_endpoint_monitoring_and_billing_usage_reread',
    evidenceClass: 'canonical_private_reread',
    allocationWindowId: input.allocationWindowId,
    endpointDeploymentRef: input.endpointDeploymentRef,
    endpointCapacityObservationRef: input.endpointCapacityObservationRef,
    endpointResourceName: ENDPOINT_RESOURCE,
    deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
    routeId: 'a100_80gb_heavy_primary',
    machineType: 'a2-ultragpu-1g',
    accelerator: 'nvidia_a100_80gb',
    acceleratorCountPerReplica: 1,
    allocatedVcpuCountPerReplica: 12,
    allocatedMemoryGiBPerReplica: 170,
    minimumReplicaCount: 0,
    maximumReplicaCount: input.maximumReplicaCount,
    maximumConcurrentInvocations: input.maximumReplicaCount,
    scaleUpTriggeredAt: input.scaleUpTriggeredAt,
    endpointReadyAt: input.endpointReadyAt,
    billableAllocationEndedAt: input.billableAllocationEndedAt,
    coldStartMilliseconds: Date.parse(input.endpointReadyAt)
      - Date.parse(input.scaleUpTriggeredAt),
    replicaAllocationSlices: slices,
    billableReplicaMilliseconds,
    activeRequestMilliseconds,
    nonRequestReplicaMilliseconds:
      billableReplicaMilliseconds - activeRequestMilliseconds,
    attempts,
    privateArtifactBytes: input.privateArtifactBytes,
    privateArtifactRetentionMilliseconds:
      input.privateArtifactRetentionMilliseconds,
    networkEgressBytes: input.networkEgressBytes,
    classAOperationCount: input.classAOperationCount,
    classBOperationCount: input.classBOperationCount,
    endpointMonitoringUsageRef: input.endpointMonitoringUsageRef,
    cloudBillingUsageExportRef: input.cloudBillingUsageExportRef,
    exactEndpointReplicaIntervalsAndBillingUsageReread: true,
    configuredMaximumNeverUsedAsBilledReplicaCount: true,
    billingExportFinalInvoiceReconciled: false,
    unresolvedProviderOutcomeAccepted: false,
    overlappingRequestExecutionAccepted: true,
    measuredPeakConcurrentInvocations: measuredPeakConcurrency(attempts),
    workerSuppliedBillableDurationReplicaCountOrPricingAccepted: false,
    scaleToZeroObservedAfterWindow: true,
    activeReplicasAfterWindow: 0,
    observedAt: input.observedAt,
  })
  return assertCanonicalSam31VertexServingMultiReplicaWindowUsage({
    ...payload,
    usageHash: sha256AuthorityValue(payload),
  })
}

export function calculateCanonicalSam31VertexServingMultiReplicaWindowCost(
  input: {
    readonly rateAuthority:
      CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
    readonly usage: CanonicalSam31VertexServingMultiReplicaWindowUsage
    readonly at: string
  },
): CanonicalSam31VertexServingMultiReplicaWindowCostBreakdown {
  const rate =
    assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
      input.rateAuthority,
      input.at,
    )
  const usage = assertCanonicalSam31VertexServingMultiReplicaWindowUsage(
    input.usage,
  )
  if (usage.endpointResourceName.split('/').at(-1) !== rate.endpointId
    || usage.machineType !== rate.machineType
    || usage.accelerator !== rate.accelerator
    || usage.allocatedVcpuCountPerReplica !== rate.allocatedVcpuCount
    || usage.allocatedMemoryGiBPerReplica !== rate.allocatedMemoryGiB
    || usage.maximumReplicaCount !== rate.maximumReplicaCount
    || !sameRef(usage.endpointCapacityObservationRef,
      rate.endpointCapacityObservationRef)) throw new Error(
    'Vertex multi-replica usage and rate authority differ.',
  )
  const component = (componentClass:
    CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2[
      'components'
    ][number]['componentClass'],
  ): bigint => {
    const found = rate.components.find((candidate) =>
      candidate.componentClass === componentClass)
    if (!found) throw new Error(
      `Vertex serving rate component is missing: ${componentClass}.`,
    )
    return BigInt(found.maximumUsdNanosPerBillingUnit)
  }
  const replicaMilliseconds = BigInt(usage.billableReplicaMilliseconds)
  const payload = {
    vertexPredictionA10080GbUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_a100_80gb_hour') * replicaMilliseconds,
      MILLISECONDS_PER_HOUR,
    )),
    vertexPredictionA2CoreUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_a2_core_hour')
        * BigInt(rate.allocatedVcpuCount) * replicaMilliseconds,
      MILLISECONDS_PER_HOUR,
    )),
    vertexPredictionA2RamUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_a2_ram_gib_hour')
        * BigInt(rate.allocatedMemoryGiB) * replicaMilliseconds,
      MILLISECONDS_PER_HOUR,
    )),
    vertexManagementA2CoreUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_management_a2_core_hour')
        * BigInt(rate.allocatedVcpuCount) * replicaMilliseconds,
      MILLISECONDS_PER_HOUR,
    )),
    vertexManagementA2RamUsdNanos: safeNumber(ceilDiv(
      component('vertex_prediction_management_a2_ram_gib_hour')
        * BigInt(rate.allocatedMemoryGiB) * replicaMilliseconds,
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

export function createCanonicalSam31VertexServingMultiReplicaWindowCostReceipt(
  input: {
    readonly receiptId: string
    readonly usage: CanonicalSam31VertexServingMultiReplicaWindowUsage
    readonly rateAuthority:
      CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
    readonly recordedAt: string
  },
): CanonicalSam31VertexServingMultiReplicaWindowCostReceipt {
  assertPlainSerializedData(input, 'sam31_vertex_multi_replica_cost_receipt')
  const usage = assertCanonicalSam31VertexServingMultiReplicaWindowUsage(
    input.usage,
  )
  const rate =
    assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
      input.rateAuthority,
      input.recordedAt,
    )
  const cost = calculateCanonicalSam31VertexServingMultiReplicaWindowCost({
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
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_MULTI_REPLICA_WINDOW_COST_RECEIPT_VERSION,
    source: 'canonical_server_sam3_1_vertex_serving_window_cost_owner',
    evidenceClass: 'canonical_private_reread',
    receiptId: input.receiptId,
    endpointDeploymentRef: usage.endpointDeploymentRef,
    endpointCapacityObservationRef: usage.endpointCapacityObservationRef,
    usage,
    rateAuthorityRef: {
      id: rate.rateAuthorityId,
      version: rate.rateAuthorityVersion,
      contentHash: `sha256:${rate.rateAuthorityHash}`,
    },
    actualInfrastructureCost: cost,
    attemptAllocations: allocations,
    totalCustomerEligibleInfrastructureCostUsdNanos: allocations.reduce(
      (total, allocation) => total
        + allocation.customerEligibleInfrastructureCostUsdNanos,
      0,
    ),
    totalCustomerEligibleToolCostCredits: allocations.reduce(
      (total, allocation) => total
        + allocation.customerEligibleToolCostCredits,
      0,
    ),
    totalWeEditProAbsorbedInfrastructureCostUsdNanos: allocations.reduce(
      (total, allocation) => total
        + allocation.weeditproAbsorbedInfrastructureCostUsdNanos,
      0,
    ),
    creditValueUsdNanos: WEEDITPRO_USD_NANOS_PER_CREDIT,
    billingAccountEffectiveVertexServingSkuSetUsed: true,
    actualReplicaMillisecondsChargedExactlyOnce: true,
    configuredMaximumReplicasChargedAsAllocatedReplicas: false,
    trainingOrComputeEngineSkuSetCharged: false,
    mixedOrDoubleCountedPricingAccepted: false,
    serviceFeeIncluded: false,
    billingAccountIdentifierIncluded: false,
    exactClosedWindowUsageCapacityAndCurrentAccountRateReread: true,
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
  return assertCanonicalSam31VertexServingMultiReplicaWindowCostReceipt({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexServingMultiReplicaWindowUsage(
  value: unknown,
): CanonicalSam31VertexServingMultiReplicaWindowUsage {
  assertPlainSerializedData(value, 'sam31_vertex_multi_replica_usage')
  const parsed = canonicalSam31VertexServingMultiReplicaWindowUsageSchema
    .parse(value)
  const { usageHash, ...payload } = parsed
  if (usageHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex multi-replica window usage digest changed.')
  }
  return parsed
}

export function assertCanonicalSam31VertexServingMultiReplicaWindowCostReceipt(
  value: unknown,
): CanonicalSam31VertexServingMultiReplicaWindowCostReceipt {
  assertPlainSerializedData(value, 'sam31_vertex_multi_replica_cost_receipt')
  const parsed = canonicalSam31VertexServingMultiReplicaWindowCostReceiptSchema
    .parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex multi-replica window receipt digest changed.')
  }
  return parsed
}

function measuredPeakConcurrency(
  attempts: readonly CanonicalSam31VertexServingMultiReplicaWindowAttempt[],
): number {
  const events = attempts.flatMap((attempt) => [
    { at: attempt.requestStartedAt, delta: 1 },
    { at: attempt.responseCompletedAt, delta: -1 },
  ]).sort((left, right) => compareUtf16(left.at, right.at)
    || left.delta - right.delta)
  let active = 0
  let peak = 0
  for (const event of events) {
    active += event.delta
    peak = Math.max(peak, active)
    if (active < 0) throw new Error('Vertex attempt concurrency is invalid.')
  }
  if (active !== 0) throw new Error('Vertex attempt concurrency did not close.')
  return peak
}

function everyAttemptConcurrencyCoveredByReplicaSlices(
  attempts: readonly CanonicalSam31VertexServingMultiReplicaWindowAttempt[],
  slices: readonly z.infer<typeof replicaSliceSchema>[],
): boolean {
  const boundaries = [...new Set([
    ...slices.flatMap((slice) => [slice.startedAt, slice.endedAt]),
    ...attempts.flatMap((attempt) => [
      attempt.requestStartedAt,
      attempt.responseCompletedAt,
    ]),
  ])].sort(compareUtf16)
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]!
    const end = boundaries[index + 1]!
    if (start === end) continue
    const activeRequests = attempts.filter((attempt) =>
      attempt.requestStartedAt < end
        && attempt.responseCompletedAt > start).length
    if (activeRequests === 0) continue
    const slice = slices.find((candidate) =>
      candidate.startedAt <= start && candidate.endedAt >= end)
    if (!slice || activeRequests > slice.activeReplicaCount) return false
  }
  return true
}

function compareAttempts(
  left: CanonicalSam31VertexServingMultiReplicaWindowAttempt,
  right: CanonicalSam31VertexServingMultiReplicaWindowAttempt,
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
  attempts: readonly CanonicalSam31VertexServingMultiReplicaWindowAttempt[],
): number[] {
  const total = BigInt(totalUsdNanos)
  const weights = attempts.map((attempt) =>
    BigInt(attempt.activeRequestMilliseconds))
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0n)
  const allocations = weights.map((weight) => total * weight / weightTotal)
  let remainder = total - allocations.reduce((sum, value) => sum + value, 0n)
  for (let index = 0; remainder > 0n; index += 1, remainder -= 1n) {
    allocations[index % allocations.length] =
      allocations[index % allocations.length]! + 1n
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
    throw new Error('Vertex multi-replica cost exceeds exact integer range.')
  }
  return converted
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
