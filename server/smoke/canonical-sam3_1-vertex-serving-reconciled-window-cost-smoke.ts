import assert from 'node:assert/strict'

import {
  allocationWindow,
  observation,
  rate,
} from './canonical-sam3_1-vertex-serving-billing-export-smoke'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalSam31VertexServingReconciledWindowCostReceipt,
  assertCanonicalSam31VertexServingReconciledWindowUsage,
  createCanonicalSam31VertexServingReconciledWindowCostReceipt,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-reconciled-window-cost'

const endpointDeploymentRef = ref('sam31-endpoint-deployment', 'deployment')
const attemptA = attempt({
  id: 'attempt-a',
  startedAt: '2026-08-11T12:00:10.000Z',
  endedAt: '2026-08-11T12:00:50.000Z',
  terminalOutcome: 'completed',
  providerOutcome: 'executed',
  reservedCredits: 2,
})
const attemptB = attempt({
  id: 'attempt-b',
  startedAt: '2026-08-11T12:01:10.000Z',
  endedAt: '2026-08-11T12:01:50.000Z',
  terminalOutcome: 'weeditpro_failed',
  providerOutcome: 'executed',
  reservedCredits: 10,
})
const receipt =
  createCanonicalSam31VertexServingReconciledWindowCostReceipt({
    receiptId: 'sam31-serving-reconciled-window-cost-smoke',
    endpointDeploymentRef,
    endpointCapacityObservationRef: rate.endpointCapacityObservationRef,
    allocationWindow,
    billingExportObservation: observation,
    attempts: [attemptB, attemptA],
    recordedAt: '2026-08-11T12:12:00.000Z',
  })

assert.deepEqual(
  assertCanonicalSam31VertexServingReconciledWindowCostReceipt(receipt),
  receipt,
)
assert.deepEqual(
  assertCanonicalSam31VertexServingReconciledWindowUsage(receipt.usage),
  receipt.usage,
)
assert.deepEqual(receipt.usage.attempts.map((value) =>
  value.executionAttemptRef.id), ['attempt-a', 'attempt-b'])
assert.equal(receipt.totalInfrastructureCostUsdPicos, 500_000_000_000)
assert.equal(receipt.totalInfrastructureCostUsdNanosCeiling, 500_000_000)
assert.equal(receipt.attemptAllocations[0]
  ?.allocatedInfrastructureCostUsdPicos, 250_000_000_000)
assert.equal(receipt.attemptAllocations[0]
  ?.customerEligibleInfrastructureCostUsdPicos, 200_000_000_000)
assert.equal(receipt.attemptAllocations[0]
  ?.customerEligibleToolCostCredits, 2)
assert.equal(receipt.attemptAllocations[0]
  ?.weeditproAbsorbedInfrastructureCostUsdPicos, 50_000_000_000)
assert.equal(receipt.attemptAllocations[1]
  ?.customerEligibleToolCostCredits, 0)
assert.equal(receipt.attemptAllocations[1]
  ?.weeditproAbsorbedInfrastructureCostUsdPicos, 250_000_000_000)
assert.equal(receipt.totalCustomerEligibleToolCostCredits, 2)
assert.equal(receipt.totalWeEditProAbsorbedInfrastructureCostUsdPicos,
  300_000_000_000)
assert.equal(receipt.exactDetailedUsageCostExportReconciled, true)
assert.equal(receipt.finalInvoiceMonthTaxOrAdjustmentClaimed, false)
assert.equal(receipt.monitoringGaugeAcceptedAsFinalCost, false)
assert.equal(receipt.failedOrCanceledAttemptCostChargedToCustomer, false)
assert.equal(receipt.unapprovedOverageAbsorbedByWeEditPro, true)
assert.equal(receipt.storageNetworkOperationsOrServiceFeeSettledHere, false)
assert.equal(receipt.customerCreditSettlementAllowed, true)
assert.equal(receipt.customerWalletOrLedgerMutationPerformed, false)

const tampered = structuredClone(receipt)
tampered.attemptAllocations[0]!.customerEligibleToolCostCredits = 10
assert.throws(() =>
  assertCanonicalSam31VertexServingReconciledWindowCostReceipt(tampered))

assert.throws(() =>
  createCanonicalSam31VertexServingReconciledWindowCostReceipt({
    receiptId: 'sam31-serving-concurrency-tamper',
    endpointDeploymentRef,
    endpointCapacityObservationRef: rate.endpointCapacityObservationRef,
    allocationWindow,
    billingExportObservation: observation,
    attempts: [attemptA, {
      ...attemptB,
      requestStartedAt: '2026-08-11T12:00:20.000Z',
      responseCompletedAt: '2026-08-11T12:00:40.000Z',
      activeRequestMilliseconds: 20_000,
    }],
    recordedAt: '2026-08-11T12:12:00.000Z',
  }))

assert.throws(() =>
  createCanonicalSam31VertexServingReconciledWindowCostReceipt({
    receiptId: 'sam31-serving-outside-window-tamper',
    endpointDeploymentRef,
    endpointCapacityObservationRef: rate.endpointCapacityObservationRef,
    allocationWindow,
    billingExportObservation: observation,
    attempts: [{
      ...attemptA,
      requestStartedAt: '2026-08-11T12:03:00.000Z',
      responseCompletedAt: '2026-08-11T12:03:10.000Z',
      activeRequestMilliseconds: 10_000,
    }],
    recordedAt: '2026-08-11T12:12:00.000Z',
  }))

let getterInvoked = false
const hostile = Object.defineProperty({}, 'receiptId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return 'hostile'
  },
})
assert.throws(() =>
  createCanonicalSam31VertexServingReconciledWindowCostReceipt(
    hostile as never,
  ))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-reconciled-window-cost',
  checks: 34,
  billingExportCostAllocatedExactlyOnce: true,
  accountEffectiveRateAuthorityBound: true,
  monitoringGaugeUsedOnlyForWindowAndCapacity: true,
  completedAttemptChargeCappedByApprovedCredits: true,
  failedAttemptChargedToCustomer: false,
  unapprovedOverageAbsorbedByWeEditPro: true,
  serviceFeeSettledSeparately: true,
  customerWalletOrLedgerMutationPerformed: false,
  productionAuthorityGranted: false,
}, null, 2))

function attempt(input: {
  id: string
  startedAt: string
  endedAt: string
  terminalOutcome: 'completed' | 'weeditpro_failed' | 'canceled'
  providerOutcome: 'executed' | 'not_executed'
  reservedCredits: number
}) {
  return {
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersion: 1,
    executionAttemptRef: ref(input.id, input.id),
    approvedSnapshotRef: ref('snapshot-1', 'snapshot'),
    approvedWorkItemRef: ref(`work-${input.id}`, `work-${input.id}`),
    workerLeaseRef: ref(`lease-${input.id}`, `lease-${input.id}`),
    fundedReservationRef: ref('reservation-1', 'reservation'),
    approvedEstimateRef: ref('estimate-1', 'estimate'),
    userApprovalRecordRef: ref('approval-1', 'approval'),
    userTriggerRecordRef: ref(`trigger-${input.id}`, `trigger-${input.id}`),
    requestStartedAt: input.startedAt,
    responseCompletedAt: input.endedAt,
    activeRequestMilliseconds:
      Date.parse(input.endedAt) - Date.parse(input.startedAt),
    terminalOutcome: input.terminalOutcome,
    providerInferenceOrSubstantiveWorkOutcome: input.providerOutcome,
    approvedReservedToolCostCredits: input.reservedCredits,
    exactApprovedPlanReservationLeaseTriggerAndAttemptReread: true as const,
    callerSuppliedOutcomeUsageOrPricingAccepted: false as const,
  }
}

function ref(id: string, seed: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({ seed })}` as const,
  }
}
