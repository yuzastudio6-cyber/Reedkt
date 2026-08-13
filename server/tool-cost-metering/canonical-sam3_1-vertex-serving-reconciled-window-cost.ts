import { z } from 'zod'

import {
  canonicalSam31VertexServingBillingExportObservationSchema,
} from '../services/canonical-sam3_1-vertex-serving-billing-export'
import {
  canonicalSam31VertexReplicaAllocationWindowSchema,
} from '../services/canonical-sam3_1-vertex-replica-telemetry'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31VertexServingMultiReplicaWindowAttemptSchema,
  type CanonicalSam31VertexServingMultiReplicaWindowAttempt,
} from './canonical-sam3_1-vertex-serving-multi-replica-window-cost-authority'
import {
  WEEDITPRO_USD_NANOS_PER_CREDIT,
} from './canonical-sam3_1-vertex-serving-window-cost-authority'

export const CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_USAGE_VERSION =
  'canonical-sam3_1-vertex-serving-reconciled-window-usage-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_RECEIPT_VERSION =
  'canonical-sam3_1-vertex-serving-reconciled-window-cost-receipt-v1' as const

const USD_PICOS_PER_CREDIT = WEEDITPRO_USD_NANOS_PER_CREDIT * 1_000
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>
const nonnegativeInteger = z.number().int().nonnegative().safe()

const usageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_USAGE_VERSION,
  ),
  source: z.literal('canonical_server_sam31_reconciled_serving_window_owner'),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  allocationWindowId: safeId,
  endpointDeploymentRef: refSchema,
  endpointCapacityObservationRef: refSchema,
  allocationWindow: canonicalSam31VertexReplicaAllocationWindowSchema,
  billingExportObservation:
    canonicalSam31VertexServingBillingExportObservationSchema,
  attempts: z.array(
    canonicalSam31VertexServingMultiReplicaWindowAttemptSchema,
  ).min(1).max(2_048),
  totalNetVertexServingCostUsdPicos: nonnegativeInteger,
  totalAttemptOverlapMilliseconds: z.number().int().positive().safe(),
  measuredPeakConcurrentInvocations: z.number().int().min(1).max(16),
  exactMonitoringWindowBillingExportAndTerminalAttemptsReread:
    z.literal(true),
  monitoringGaugeUsedAsFinalCost: z.literal(false),
  detailedBillingExportUsedAsFinalInfrastructureCost: z.literal(true),
  callerUsageOutcomeOrPriceAccepted: z.literal(false),
  scaleToZeroObservedAfterWindow: z.literal(true),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((usage, context) => {
  const attempts = [...usage.attempts].sort(compareAttempts)
  const start = usage.allocationWindow.allocationBuckets[0]!.startedAt
  const end = usage.allocationWindow.allocationBuckets.at(-1)!.endedAt
  const overlaps = attempts.map((attempt) => overlapMilliseconds(
    attempt.requestStartedAt,
    attempt.responseCompletedAt,
    start,
    end,
  ))
  const billing = usage.billingExportObservation
  if (stableAuthorityStringify(attempts) !==
      stableAuthorityStringify(usage.attempts)
    || new Set(attempts.map((attempt) =>
      stableAuthorityStringify(attempt.executionAttemptRef))).size !==
      attempts.length
    || overlaps.some((value) => value <= 0)
    || overlaps.reduce((sum, value) => sum + value, 0) !==
      usage.totalAttemptOverlapMilliseconds
    || measuredPeak(attempts, start, end) !==
      usage.measuredPeakConcurrentInvocations
    || !attemptConcurrencyCovered(attempts, usage.allocationWindow)
    || billing.totalNetCostUsdPicos !==
      usage.totalNetVertexServingCostUsdPicos
    || billing.allocationWindowRef.contentHash !==
      `sha256:${usage.allocationWindow.windowHash}`
    || Date.parse(usage.observedAt) <
      Date.parse(billing.observedAt)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 reconciled serving usage is inconsistent.',
  })
})

export const canonicalSam31VertexServingReconciledWindowUsageSchema =
  usageWithoutHashSchema.extend({ usageHash: sha256 }).strict()
export type CanonicalSam31VertexServingReconciledWindowUsage = z.infer<
  typeof canonicalSam31VertexServingReconciledWindowUsageSchema
>

const allocationSchema = z.object({
  executionAttemptRef: refSchema,
  allocatedInfrastructureCostUsdPicos: nonnegativeInteger,
  allocatedInfrastructureCostUsdNanosCeiling: nonnegativeInteger,
  approvedReservedToolCostCredits: nonnegativeInteger,
  customerEligibleInfrastructureCostUsdPicos: nonnegativeInteger,
  customerEligibleToolCostCredits: nonnegativeInteger,
  weeditproAbsorbedInfrastructureCostUsdPicos: nonnegativeInteger,
  weeditproAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  creditsRecommendedToRetainForRemainingApprovedPlanWork:
    nonnegativeInteger,
  terminalOutcome: z.enum(['completed', 'weeditpro_failed', 'canceled']),
}).strict().superRefine((allocation, context) => {
  const ceilingPicos = allocation.approvedReservedToolCostCredits
    * USD_PICOS_PER_CREDIT
  const eligible = allocation.terminalOutcome === 'completed'
    ? Math.min(allocation.allocatedInfrastructureCostUsdPicos, ceilingPicos)
    : 0
  const credits = eligible === 0
    ? 0
    : Math.ceil(eligible / USD_PICOS_PER_CREDIT)
  const absorbed = allocation.allocatedInfrastructureCostUsdPicos - eligible
  if (allocation.allocatedInfrastructureCostUsdNanosCeiling !==
      Math.ceil(allocation.allocatedInfrastructureCostUsdPicos / 1_000)
    || allocation.customerEligibleInfrastructureCostUsdPicos !== eligible
    || allocation.customerEligibleToolCostCredits !== credits
    || allocation.weeditproAbsorbedInfrastructureCostUsdPicos !== absorbed
    || allocation.weeditproAbsorbedInfrastructureCostUsdNanos !==
      Math.ceil(absorbed / 1_000)
    || allocation.creditsRecommendedToRetainForRemainingApprovedPlanWork !==
      allocation.approvedReservedToolCostCredits - credits) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 reconciled attempt cost allocation changed.',
  })
})

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_RECEIPT_VERSION,
  ),
  source: z.literal('canonical_server_sam31_reconciled_serving_cost_owner'),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  receiptId: safeId,
  endpointDeploymentRef: refSchema,
  usage: canonicalSam31VertexServingReconciledWindowUsageSchema,
  rateAuthorityRef: refSchema,
  detailedBillingExportObservationRef: refSchema,
  attemptAllocations: z.array(allocationSchema).min(1).max(2_048),
  totalInfrastructureCostUsdPicos: nonnegativeInteger,
  totalInfrastructureCostUsdNanosCeiling: nonnegativeInteger,
  totalCustomerEligibleInfrastructureCostUsdPicos: nonnegativeInteger,
  totalCustomerEligibleToolCostCredits: nonnegativeInteger,
  totalWeEditProAbsorbedInfrastructureCostUsdPicos: nonnegativeInteger,
  totalWeEditProAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  creditValueUsdNanos: z.literal(WEEDITPRO_USD_NANOS_PER_CREDIT),
  exactDetailedUsageCostExportReconciled: z.literal(true),
  finalInvoiceMonthTaxOrAdjustmentClaimed: z.literal(false),
  accountEffectiveRateAuthorityBound: z.literal(true),
  monitoringGaugeAcceptedAsFinalCost: z.literal(false),
  configuredMaximumReplicasChargedAsAllocatedReplicas: z.literal(false),
  failedOrCanceledAttemptCostChargedToCustomer: z.literal(false),
  unapprovedOverageAbsorbedByWeEditPro: z.literal(true),
  storageNetworkOperationsOrServiceFeeSettledHere: z.literal(false),
  customerCreditSettlementAllowed: z.literal(true),
  createOnlyPersistenceRequired: z.literal(true),
  customerWalletOrLedgerMutationPerformed: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict().superRefine((receipt, context) => {
  const allocations = receipt.attemptAllocations
  const allocated = allocations.reduce((sum, allocation) =>
    sum + allocation.allocatedInfrastructureCostUsdPicos, 0)
  const eligible = allocations.reduce((sum, allocation) =>
    sum + allocation.customerEligibleInfrastructureCostUsdPicos, 0)
  const credits = allocations.reduce((sum, allocation) =>
    sum + allocation.customerEligibleToolCostCredits, 0)
  const absorbed = allocations.reduce((sum, allocation) =>
    sum + allocation.weeditproAbsorbedInfrastructureCostUsdPicos, 0)
  if (stableAuthorityStringify(allocations.map((allocation) =>
      allocation.executionAttemptRef)) !== stableAuthorityStringify(
    receipt.usage.attempts.map((attempt) => attempt.executionAttemptRef),
  ) || allocated !== receipt.totalInfrastructureCostUsdPicos
    || receipt.totalInfrastructureCostUsdNanosCeiling !==
      Math.ceil(allocated / 1_000)
    || eligible !== receipt.totalCustomerEligibleInfrastructureCostUsdPicos
    || credits !== receipt.totalCustomerEligibleToolCostCredits
    || absorbed !== receipt.totalWeEditProAbsorbedInfrastructureCostUsdPicos
    || receipt.totalWeEditProAbsorbedInfrastructureCostUsdNanos !==
      Math.ceil(absorbed / 1_000)
    || eligible + absorbed !== allocated
    || receipt.detailedBillingExportObservationRef.contentHash !==
      `sha256:${receipt.usage.billingExportObservation.observationHash}`
    || receipt.rateAuthorityRef.contentHash !==
      receipt.usage.billingExportObservation.rateAuthorityRef.contentHash
    || Date.parse(receipt.recordedAt) <
      Date.parse(receipt.usage.observedAt)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 reconciled serving cost receipt is inconsistent.',
  })
})

export const canonicalSam31VertexServingReconciledWindowCostReceiptSchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31VertexServingReconciledWindowCostReceipt = z.infer<
  typeof canonicalSam31VertexServingReconciledWindowCostReceiptSchema
>

export function createCanonicalSam31VertexServingReconciledWindowCostReceipt(
  input: {
    readonly receiptId: string
    readonly endpointDeploymentRef: Ref
    readonly endpointCapacityObservationRef: Ref
    readonly allocationWindow: unknown
    readonly billingExportObservation: unknown
    readonly attempts:
      readonly CanonicalSam31VertexServingMultiReplicaWindowAttempt[]
    readonly recordedAt: string
  },
): CanonicalSam31VertexServingReconciledWindowCostReceipt {
  assertPlainSerializedData(input, 'sam31_reconciled_serving_cost_create')
  const allocationWindow = canonicalSam31VertexReplicaAllocationWindowSchema
    .parse(input.allocationWindow)
  const billingExportObservation =
    canonicalSam31VertexServingBillingExportObservationSchema.parse(
      input.billingExportObservation,
    )
  const attempts = [...input.attempts].map((attempt) =>
    canonicalSam31VertexServingMultiReplicaWindowAttemptSchema.parse(attempt))
    .sort(compareAttempts)
  const start = allocationWindow.allocationBuckets[0]!.startedAt
  const end = allocationWindow.allocationBuckets.at(-1)!.endedAt
  const weights = attempts.map((attempt) => overlapMilliseconds(
    attempt.requestStartedAt,
    attempt.responseCompletedAt,
    start,
    end,
  ))
  const shares = allocateByWeight(
    billingExportObservation.totalNetCostUsdPicos,
    weights,
  )
  const usagePayload = usageWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_USAGE_VERSION,
    source: 'canonical_server_sam31_reconciled_serving_window_owner',
    evidenceClass: 'canonical_private_exact_reread',
    allocationWindowId: allocationWindow.allocationWindowId,
    endpointDeploymentRef: input.endpointDeploymentRef,
    endpointCapacityObservationRef: input.endpointCapacityObservationRef,
    allocationWindow,
    billingExportObservation,
    attempts,
    totalNetVertexServingCostUsdPicos:
      billingExportObservation.totalNetCostUsdPicos,
    totalAttemptOverlapMilliseconds: weights.reduce((sum, value) =>
      sum + value, 0),
    measuredPeakConcurrentInvocations: measuredPeak(attempts, start, end),
    exactMonitoringWindowBillingExportAndTerminalAttemptsReread: true,
    monitoringGaugeUsedAsFinalCost: false,
    detailedBillingExportUsedAsFinalInfrastructureCost: true,
    callerUsageOutcomeOrPriceAccepted: false,
    scaleToZeroObservedAfterWindow: true,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
    observedAt: billingExportObservation.observedAt,
  })
  const usage = assertCanonicalSam31VertexServingReconciledWindowUsage({
    ...usagePayload,
    usageHash: sha256AuthorityValue(usagePayload),
  })
  const attemptAllocations = attempts.map((attempt, index) => {
    const allocated = shares[index]!
    const approvedCeilingPicos = attempt.approvedReservedToolCostCredits
      * USD_PICOS_PER_CREDIT
    const eligible = attempt.terminalOutcome === 'completed'
      ? Math.min(allocated, approvedCeilingPicos)
      : 0
    const credits = eligible === 0
      ? 0
      : Math.ceil(eligible / USD_PICOS_PER_CREDIT)
    const absorbed = allocated - eligible
    return allocationSchema.parse({
      executionAttemptRef: attempt.executionAttemptRef,
      allocatedInfrastructureCostUsdPicos: allocated,
      allocatedInfrastructureCostUsdNanosCeiling: Math.ceil(allocated / 1_000),
      approvedReservedToolCostCredits:
        attempt.approvedReservedToolCostCredits,
      customerEligibleInfrastructureCostUsdPicos: eligible,
      customerEligibleToolCostCredits: credits,
      weeditproAbsorbedInfrastructureCostUsdPicos: absorbed,
      weeditproAbsorbedInfrastructureCostUsdNanos:
        Math.ceil(absorbed / 1_000),
      creditsRecommendedToRetainForRemainingApprovedPlanWork:
        attempt.approvedReservedToolCostCredits - credits,
      terminalOutcome: attempt.terminalOutcome,
    })
  })
  const eligible = attemptAllocations.reduce((sum, allocation) =>
    sum + allocation.customerEligibleInfrastructureCostUsdPicos, 0)
  const credits = attemptAllocations.reduce((sum, allocation) =>
    sum + allocation.customerEligibleToolCostCredits, 0)
  const absorbed = attemptAllocations.reduce((sum, allocation) =>
    sum + allocation.weeditproAbsorbedInfrastructureCostUsdPicos, 0)
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_RECONCILED_WINDOW_COST_RECEIPT_VERSION,
    source: 'canonical_server_sam31_reconciled_serving_cost_owner',
    evidenceClass: 'canonical_private_exact_reread',
    receiptId: input.receiptId,
    endpointDeploymentRef: input.endpointDeploymentRef,
    usage,
    rateAuthorityRef: billingExportObservation.rateAuthorityRef,
    detailedBillingExportObservationRef: {
      id: `sam31-serving-billing:${billingExportObservation.observationHash}`,
      version: 1,
      contentHash: `sha256:${billingExportObservation.observationHash}`,
    },
    attemptAllocations,
    totalInfrastructureCostUsdPicos:
      billingExportObservation.totalNetCostUsdPicos,
    totalInfrastructureCostUsdNanosCeiling:
      Math.ceil(billingExportObservation.totalNetCostUsdPicos / 1_000),
    totalCustomerEligibleInfrastructureCostUsdPicos: eligible,
    totalCustomerEligibleToolCostCredits: credits,
    totalWeEditProAbsorbedInfrastructureCostUsdPicos: absorbed,
    totalWeEditProAbsorbedInfrastructureCostUsdNanos:
      Math.ceil(absorbed / 1_000),
    creditValueUsdNanos: WEEDITPRO_USD_NANOS_PER_CREDIT,
    exactDetailedUsageCostExportReconciled: true,
    finalInvoiceMonthTaxOrAdjustmentClaimed: false,
    accountEffectiveRateAuthorityBound: true,
    monitoringGaugeAcceptedAsFinalCost: false,
    configuredMaximumReplicasChargedAsAllocatedReplicas: false,
    failedOrCanceledAttemptCostChargedToCustomer: false,
    unapprovedOverageAbsorbedByWeEditPro: true,
    storageNetworkOperationsOrServiceFeeSettledHere: false,
    customerCreditSettlementAllowed: true,
    createOnlyPersistenceRequired: true,
    customerWalletOrLedgerMutationPerformed: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    recordedAt: timestamp.parse(input.recordedAt),
  })
  return assertCanonicalSam31VertexServingReconciledWindowCostReceipt({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexServingReconciledWindowUsage(
  value: unknown,
): CanonicalSam31VertexServingReconciledWindowUsage {
  assertPlainSerializedData(value, 'sam31_reconciled_serving_usage')
  const parsed = canonicalSam31VertexServingReconciledWindowUsageSchema
    .parse(value)
  const { usageHash, ...payload } = parsed
  if (usageHash !== sha256AuthorityValue(payload)) throw new Error(
    'SAM 3.1 reconciled serving usage digest changed.',
  )
  return structuredClone(parsed)
}

export function assertCanonicalSam31VertexServingReconciledWindowCostReceipt(
  value: unknown,
): CanonicalSam31VertexServingReconciledWindowCostReceipt {
  assertPlainSerializedData(value, 'sam31_reconciled_serving_cost_receipt')
  const parsed = canonicalSam31VertexServingReconciledWindowCostReceiptSchema
    .parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) throw new Error(
    'SAM 3.1 reconciled serving cost receipt digest changed.',
  )
  return structuredClone(parsed)
}

function attemptConcurrencyCovered(
  attempts: readonly CanonicalSam31VertexServingMultiReplicaWindowAttempt[],
  window: z.infer<typeof canonicalSam31VertexReplicaAllocationWindowSchema>,
): boolean {
  return window.allocationBuckets.every((bucket) => {
    const active = attempts.filter((attempt) =>
      attempt.requestStartedAt < bucket.endedAt
        && attempt.responseCompletedAt > bucket.startedAt).length
    return active <= bucket.activeReplicaCount
  })
}

function measuredPeak(
  attempts: readonly CanonicalSam31VertexServingMultiReplicaWindowAttempt[],
  windowStart: string,
  windowEnd: string,
): number {
  const boundaries = [...new Set([
    windowStart,
    windowEnd,
    ...attempts.flatMap((attempt) => [
      maxTimestamp(attempt.requestStartedAt, windowStart),
      minTimestamp(attempt.responseCompletedAt, windowEnd),
    ]),
  ])].sort(compareUtf16)
  let peak = 0
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]!
    const end = boundaries[index + 1]!
    if (start >= end) continue
    peak = Math.max(peak, attempts.filter((attempt) =>
      attempt.requestStartedAt < end
        && attempt.responseCompletedAt > start).length)
  }
  return peak
}

function overlapMilliseconds(
  attemptStartedAt: string,
  attemptEndedAt: string,
  windowStartedAt: string,
  windowEndedAt: string,
): number {
  return Math.max(0, Math.min(Date.parse(attemptEndedAt),
    Date.parse(windowEndedAt)) - Math.max(Date.parse(attemptStartedAt),
    Date.parse(windowStartedAt)))
}

function allocateByWeight(totalValue: number, weights: readonly number[]) {
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  if (weights.length < 1 || totalWeight <= 0) throw new Error(
    'SAM 3.1 reconciled cost has no active attempt weight.',
  )
  const total = BigInt(totalValue)
  const denominator = BigInt(totalWeight)
  const shares = weights.map((weight) => Number(
    total * BigInt(weight) / denominator,
  ))
  let remainder = totalValue - shares.reduce((sum, value) => sum + value, 0)
  for (let index = 0; remainder > 0; index = (index + 1) % shares.length) {
    shares[index]! += 1
    remainder -= 1
  }
  return shares
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

function maxTimestamp(left: string, right: string) {
  return left > right ? left : right
}

function minTimestamp(left: string, right: string) {
  return left < right ? left : right
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
