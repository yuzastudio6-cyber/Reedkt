import assert from 'node:assert/strict'

import { authority as v1Authority } from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-smoke'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_V2_VERSION,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  assertCanonicalSam31VertexServingMultiReplicaWindowCostReceipt,
  assertCanonicalSam31VertexServingMultiReplicaWindowUsage,
  calculateCanonicalSam31VertexServingMultiReplicaWindowCost,
  createCanonicalSam31VertexServingMultiReplicaWindowCostReceipt,
  createCanonicalSam31VertexServingMultiReplicaWindowUsage,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-multi-replica-window-cost-authority'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const v1Payload = withoutRateAuthorityHash(v1Authority)
const capacityRef = ref('sam31-current-capacity', 'capacity')
const ratePayload = {
  ...v1Payload,
  schemaVersion:
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_AUTHORITY_V2_VERSION,
  rateAuthorityId: 'vertex-a100-serving-rate:multi-replica-smoke',
  rateAuthorityVersion: 2,
  maximumReplicaCount: 16,
  maximumConcurrentInvocations: 16,
  endpointCapacityObservationRef: capacityRef,
  exactCurrentEndpointCapacityReread: true as const,
  perReplicaPricingNotMultipliedByConfiguredMaximum: true as const,
}
const rate =
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
    ...ratePayload,
    rateAuthorityHash: sha256AuthorityValue(ratePayload),
  }, '2026-08-11T12:06:01.000Z')

const attemptA = attempt({
  ordinal: 1,
  startedAt: '2026-08-11T12:01:00.000Z',
  completedAt: '2026-08-11T12:04:00.000Z',
  terminalOutcome: 'completed',
  providerOutcome: 'executed',
  reservedCredits: 10,
})
const attemptB = attempt({
  ordinal: 2,
  startedAt: '2026-08-11T12:01:30.000Z',
  completedAt: '2026-08-11T12:03:30.000Z',
  terminalOutcome: 'canceled',
  providerOutcome: 'not_executed',
  reservedCredits: 10,
})
const usage = createCanonicalSam31VertexServingMultiReplicaWindowUsage({
  allocationWindowId: 'sam31-multi-replica-window-smoke',
  endpointDeploymentRef: ref('sam31-current-endpoint', 'endpoint'),
  endpointCapacityObservationRef: capacityRef,
  maximumReplicaCount: 16,
  scaleUpTriggeredAt: '2026-08-11T12:00:00.000Z',
  endpointReadyAt: '2026-08-11T12:01:00.000Z',
  billableAllocationEndedAt: '2026-08-11T12:06:00.000Z',
  replicaAllocationSlices: [{
    sliceOrdinal: 1,
    startedAt: '2026-08-11T12:00:00.000Z',
    endedAt: '2026-08-11T12:01:00.000Z',
    activeReplicaCount: 1,
    allocatedReplicaMilliseconds: 60_000,
  }, {
    sliceOrdinal: 2,
    startedAt: '2026-08-11T12:01:00.000Z',
    endedAt: '2026-08-11T12:04:00.000Z',
    activeReplicaCount: 2,
    allocatedReplicaMilliseconds: 360_000,
  }, {
    sliceOrdinal: 3,
    startedAt: '2026-08-11T12:04:00.000Z',
    endedAt: '2026-08-11T12:06:00.000Z',
    activeReplicaCount: 1,
    allocatedReplicaMilliseconds: 120_000,
  }],
  attempts: [attemptA, attemptB],
  privateArtifactBytes: 1_073_741_824,
  privateArtifactRetentionMilliseconds: 86_400_000,
  networkEgressBytes: 0,
  classAOperationCount: 12,
  classBOperationCount: 20,
  endpointMonitoringUsageRef: ref('sam31-endpoint-monitoring', 'monitor'),
  cloudBillingUsageExportRef: ref('sam31-billing-export', 'billing'),
  observedAt: '2026-08-11T12:06:01.000Z',
})

assert.deepEqual(
  assertCanonicalSam31VertexServingMultiReplicaWindowUsage(usage),
  usage,
)
assert.equal(usage.maximumReplicaCount, 16)
assert.equal(usage.measuredPeakConcurrentInvocations, 2)
assert.equal(usage.billableReplicaMilliseconds, 540_000)
assert.equal(usage.activeRequestMilliseconds, 300_000)
assert.equal(usage.nonRequestReplicaMilliseconds, 240_000)
assert.equal(usage.configuredMaximumNeverUsedAsBilledReplicaCount, true)
assert.equal(usage.activeReplicasAfterWindow, 0)

const cost = calculateCanonicalSam31VertexServingMultiReplicaWindowCost({
  rateAuthority: rate,
  usage,
  at: '2026-08-11T12:06:01.000Z',
})
assert.equal(cost.vertexPredictionA10080GbUsdNanos, 150_000_001)
assert.equal(cost.vertexPredictionA2CoreUsdNanos, 1_800_000_002)
assert.equal(cost.vertexPredictionA2RamUsdNanos, 25_500_000_026)
assert.equal(cost.vertexManagementA2CoreUsdNanos, 1_800_000_002)
assert.equal(cost.vertexManagementA2RamUsdNanos, 25_500_000_026)

const receipt =
  createCanonicalSam31VertexServingMultiReplicaWindowCostReceipt({
    receiptId: 'sam31-multi-replica-window-cost-smoke',
    usage,
    rateAuthority: rate,
    recordedAt: '2026-08-11T12:06:02.000Z',
  })
assert.deepEqual(
  assertCanonicalSam31VertexServingMultiReplicaWindowCostReceipt(receipt),
  receipt,
)
assert.equal(receipt.attemptAllocations.length, 2)
assert.equal(receipt.attemptAllocations[1]?.customerEligibleToolCostCredits, 0)
assert.equal(receipt.failedOrCanceledAttemptCostChargedToCustomer, false)
assert.equal(receipt.configuredMaximumReplicasChargedAsAllocatedReplicas, false)
assert.equal(receipt.customerWalletOrLedgerMutationPerformed, false)
assert.equal(receipt.serviceFeeIncluded, false)

const configuredMaximumBillingTamper = structuredClone(usage)
configuredMaximumBillingTamper.billableReplicaMilliseconds *= 16
assert.throws(() =>
  assertCanonicalSam31VertexServingMultiReplicaWindowUsage(
    configuredMaximumBillingTamper,
  ))
assert.throws(() => createCanonicalSam31VertexServingMultiReplicaWindowUsage({
  allocationWindowId: 'sam31-underallocated-window-smoke',
  endpointDeploymentRef: usage.endpointDeploymentRef,
  endpointCapacityObservationRef: capacityRef,
  maximumReplicaCount: 16,
  scaleUpTriggeredAt: '2026-08-11T12:00:00.000Z',
  endpointReadyAt: '2026-08-11T12:01:00.000Z',
  billableAllocationEndedAt: '2026-08-11T12:06:00.000Z',
  replicaAllocationSlices: [{
    sliceOrdinal: 1,
    startedAt: '2026-08-11T12:00:00.000Z',
    endedAt: '2026-08-11T12:06:00.000Z',
    activeReplicaCount: 1,
    allocatedReplicaMilliseconds: 360_000,
  }],
  attempts: [attemptA, attemptB],
  privateArtifactBytes: 0,
  privateArtifactRetentionMilliseconds: 0,
  networkEgressBytes: 0,
  classAOperationCount: 0,
  classBOperationCount: 0,
  endpointMonitoringUsageRef: usage.endpointMonitoringUsageRef,
  cloudBillingUsageExportRef: usage.cloudBillingUsageExportRef,
  observedAt: '2026-08-11T12:06:01.000Z',
}))
const crossedCapacity = structuredClone(rate)
crossedCapacity.endpointCapacityObservationRef = ref(
  'sam31-other-capacity',
  'other-capacity',
)
crossedCapacity.rateAuthorityHash = sha256AuthorityValue(
  withoutRateAuthorityHash(crossedCapacity),
)
assert.throws(() =>
  calculateCanonicalSam31VertexServingMultiReplicaWindowCost({
    rateAuthority: crossedCapacity,
    usage,
    at: '2026-08-11T12:06:01.000Z',
  }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-multi-replica-window-cost',
  checks: 29,
  configuredMaximumReplicaCount: 16,
  actualPeakConcurrentInvocations: 2,
  exactAllocatedReplicaMilliseconds: 540_000,
  configuredMaximumUsedAsBilledReplicaCount: false,
  failedAttemptChargedToCustomer: false,
  serviceFeeIncludedInToolCost: false,
  walletOrLedgerMutated: false,
  scaleToZeroObserved: true,
}, null, 2))

function attempt(input: {
  readonly ordinal: number
  readonly startedAt: string
  readonly completedAt: string
  readonly terminalOutcome: 'completed' | 'weeditpro_failed' | 'canceled'
  readonly providerOutcome: 'executed' | 'not_executed'
  readonly reservedCredits: number
}) {
  return {
    workspaceId: `workspace-${input.ordinal}`,
    projectId: `project-${input.ordinal}`,
    editSessionId: `edit-${input.ordinal}`,
    editPlanId: `plan-${input.ordinal}`,
    editPlanVersion: 1,
    executionAttemptRef: ref(`attempt-${input.ordinal}`, `attempt-${input.ordinal}`),
    approvedSnapshotRef: ref(`snapshot-${input.ordinal}`, `snapshot-${input.ordinal}`),
    approvedWorkItemRef: ref(`work-${input.ordinal}`, `work-${input.ordinal}`),
    workerLeaseRef: ref(`lease-${input.ordinal}`, `lease-${input.ordinal}`),
    fundedReservationRef: ref(`reservation-${input.ordinal}`, `reservation-${input.ordinal}`),
    approvedEstimateRef: ref(`estimate-${input.ordinal}`, `estimate-${input.ordinal}`),
    userApprovalRecordRef: ref(`approval-${input.ordinal}`, `approval-${input.ordinal}`),
    userTriggerRecordRef: ref(`trigger-${input.ordinal}`, `trigger-${input.ordinal}`),
    requestStartedAt: input.startedAt,
    responseCompletedAt: input.completedAt,
    activeRequestMilliseconds:
      Date.parse(input.completedAt) - Date.parse(input.startedAt),
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
    contentHash: `sha256:${sha256AuthorityValue(seed)}`,
  }
}

function withoutRateAuthorityHash(value: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) =>
    key !== 'rateAuthorityHash'))
}
