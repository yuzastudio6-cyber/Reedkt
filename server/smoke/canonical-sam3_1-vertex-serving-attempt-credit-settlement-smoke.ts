import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  settleCanonicalSam31VertexServingAttemptCredits,
} from '../services/canonical-sam3_1-vertex-serving-attempt-credit-settlement-service'
import {
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  walletBalanceAfter,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31VertexServingWindowCostReceiptSchema,
  createCanonicalSam31VertexServingWindowUsage,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-window-cost-authority'
import type { ServiceContext } from '../types'

const createdAt = '2026-08-11T11:40:00.000Z'
const ownerUserId = 'owner-user-1'
const blobRef = (value: string) => ({
  sha256: sha(value),
  byteLength: 1,
})
const plan = {
  id: 'plan-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planningRequestId: 'planning-request-1',
  planVersion: 1,
  status: 'approved' as const,
  componentRefs: {},
  estimateId: 'estimate-1',
  workItemIds: ['plan-work-1'],
  planHash: sha('plan'),
  workGraphHash: sha('work-graph'),
  sourceSequenceHash: sha('source-sequence'),
  timingHash: sha('timing'),
  createdAt,
  approvedAt: createdAt,
}
const estimate = {
  id: 'estimate-1',
  planId: plan.id,
  estimateVersion: 1,
  status: 'approved' as const,
  lineItems: [{
    lineKey: 'sam31-a100-serving',
    label: 'SAM 3.1 A100 serving',
    category: 'gpu_tool',
    estimatedCredits: 500,
    removable: false,
    metadataRef: blobRef('estimate-metadata'),
  }],
  estimatedCredits: 500,
  fallbackAllowanceCredits: 0,
  approvedMaximumCredits: 500,
  estimateHash: sha('estimate'),
  validUntil: '2026-08-12T11:40:00.000Z',
  createdAt,
  approvedAt: createdAt,
}
const approval = {
  id: 'approval-1',
  planId: plan.id,
  estimateId: estimate.id,
  snapshotId: 'snapshot-1',
  reservationId: 'reservation-1',
  approvedByUserId: ownerUserId,
  approvedAt: createdAt,
  requestHash: sha('approval-request'),
  idempotencyKey: 'approval-idempotency-1',
}
const snapshot = {
  schemaVersion: 'private-edit-authority-approved-snapshot-v3' as const,
  snapshotId: approval.snapshotId,
  workspaceId: 'workspace-1',
  projectId: plan.projectId,
  editSessionId: plan.editSessionId,
  planId: plan.id,
  planVersion: plan.planVersion,
  estimateId: estimate.id,
  approvalId: approval.id,
  reservationId: approval.reservationId,
  approvedByUserId: approval.approvedByUserId,
  approvedAt: createdAt,
  componentRefs: {},
  approvedWorkItemIds: ['approved-work-1'],
  planHash: plan.planHash,
  estimateHash: estimate.estimateHash,
  workGraphHash: plan.workGraphHash,
  sourceSequenceHash: plan.sourceSequenceHash,
  timingHash: plan.timingHash,
  approvedAssetManifestRef: blobRef('asset-manifest'),
  approvedAssetManifestHash: sha('asset-manifest-hash'),
  approvedSourceAssetManifestRef: blobRef('source-asset-manifest'),
  approvedSourceAssetManifestHash: sha('source-asset-manifest-hash'),
  snapshotHash: sha('snapshot'),
}
const approvedWork = {
  id: snapshot.approvedWorkItemIds[0]!,
  snapshotId: snapshot.snapshotId,
  sourceWorkItemId: 'plan-work-1',
  workItemKey: 'sam31-track-all-work',
  workItemType: 'segment_and_track_subject',
  workerClass: 'gpu_model',
  executionInputRef: blobRef('execution-input'),
  sourceSequenceItemIds: ['source-1'],
  sourceCleanupDecisionIds: [],
  expectedOutputs: [{
    outputKey: 'sam31-mask-track',
    artifactType: 'mask_track',
    assetRole: 'processed' as const,
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: ['segment-1'],
    timingIds: ['timing-1'],
    rendererLayerIds: ['layer-1'],
  }],
  dependencyKeys: [],
  approvedToolIds: ['sam3_1'],
  providerExecutionMode: 'none' as const,
  fallbackPolicyRef: blobRef('fallback-policy'),
  maxAttempts: 1,
  attemptTimeoutSeconds: 3600,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 500,
  required: true,
  executionInputHash: sha('execution-input-hash'),
  createdAt,
}
const reservation = {
  id: approval.reservationId,
  approvalId: approval.id,
  snapshotId: snapshot.snapshotId,
  estimateId: estimate.id,
  planId: plan.id,
  projectId: plan.projectId,
  editSessionId: plan.editSessionId,
  status: 'reserved' as const,
  reservedCredits: 500,
  spentCredits: 0,
  releasedCredits: 0,
  refundedCredits: 0,
  reservedAt: createdAt,
  expiresAt: '2026-08-12T11:40:00.000Z',
  updatedAt: createdAt,
}
const executionAttemptRef = ref('attempt-1', sha('attempt-1'))
const attempt = {
  workspaceId: snapshot.workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  editPlanId: snapshot.planId,
  editPlanVersion: snapshot.planVersion,
  executionAttemptRef,
  approvedSnapshotRef: ref(snapshot.snapshotId, snapshot.snapshotHash),
  approvedWorkItemRef: ref(approvedWork.id,
    sha256AuthorityValue(approvedWork)),
  workerLeaseRef: ref('lease-1', sha('lease-1')),
  fundedReservationRef: ref(reservation.id,
    sha256AuthorityValue(reservation)),
  approvedEstimateRef: ref(estimate.id, estimate.estimateHash),
  userApprovalRecordRef: ref(approval.id, sha256AuthorityValue(approval)),
  userTriggerRecordRef: ref('trigger-1', sha('trigger-1')),
  requestStartedAt: '2026-08-11T12:02:10.000Z',
  responseCompletedAt: '2026-08-11T12:02:11.000Z',
  activeRequestMilliseconds: 1_000,
  terminalOutcome: 'completed' as const,
  providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
  approvedReservedToolCostCredits: 500,
  exactApprovedPlanReservationLeaseTriggerAndAttemptReread: true as const,
  callerSuppliedOutcomeUsageOrPricingAccepted: false as const,
}
const usage = createCanonicalSam31VertexServingWindowUsage({
  allocationWindowId: 'sam31-serving-window-settlement-smoke',
  endpointDeploymentRef: ref('sam31-serving-deployment', sha('deployment')),
  scaleUpTriggeredAt: '2026-08-11T12:00:00.000Z',
  billableAllocationStartedAt: '2026-08-11T12:00:00.000Z',
  endpointReadyAt: '2026-08-11T12:02:00.000Z',
  billableAllocationEndedAt: '2026-08-11T12:05:00.000Z',
  attempts: [attempt],
  privateArtifactBytes: 0,
  privateArtifactRetentionMilliseconds: 0,
  networkEgressBytes: 0,
  classAOperationCount: 0,
  classBOperationCount: 0,
  endpointMonitoringUsageRef: ref('monitoring', sha('monitoring')),
  cloudBillingUsageExportRef: ref('billing-usage', sha('billing-usage')),
  observedAt: '2026-08-11T12:05:30.000Z',
})
const allocation = {
  executionAttemptRef,
  allocatedInfrastructureCostUsdNanos: 10_000_000_000,
  approvedReservedToolCostCredits: 500,
  customerEligibleInfrastructureCostUsdNanos: 10_000_000_000,
  customerEligibleToolCostCredits: 100,
  weeditproAbsorbedInfrastructureCostUsdNanos: 0,
  creditsRecommendedToRetainForRemainingApprovedPlanWork: 400,
  terminalOutcome: 'completed' as const,
}
const receiptPayload = {
  schemaVersion:
    'canonical-sam3_1-vertex-serving-window-cost-receipt-v2' as const,
  source:
    'canonical_server_sam3_1_vertex_serving_window_cost_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  receiptId: 'sam31-serving-window-cost-settlement-smoke',
  endpointDeploymentRef: usage.endpointDeploymentRef,
  usage,
  rateAuthorityRef: ref('serving-rate', sha('serving-rate')),
  actualInfrastructureCost: {
    vertexPredictionA10080GbUsdNanos: 10_000_000_000,
    vertexPredictionA2CoreUsdNanos: 0,
    vertexPredictionA2RamUsdNanos: 0,
    vertexManagementA2CoreUsdNanos: 0,
    vertexManagementA2RamUsdNanos: 0,
    privateObjectStorageUsdNanos: 0,
    networkEgressUsdNanos: 0,
    objectClassAOperationsUsdNanos: 0,
    objectClassBOperationsUsdNanos: 0,
    totalInfrastructureCostUsdNanos: 10_000_000_000,
  },
  attemptAllocations: [allocation],
  totalCustomerEligibleInfrastructureCostUsdNanos: 10_000_000_000,
  totalCustomerEligibleToolCostCredits: 100,
  totalWeEditProAbsorbedInfrastructureCostUsdNanos: 0,
  creditValueUsdNanos: 100_000_000 as const,
  billingAccountEffectiveVertexServingSkuSetUsed: true as const,
  predictionUsageAndManagementSkuSetChargedExactlyOnce: true as const,
  trainingOrComputeEngineSkuSetCharged: false as const,
  mixedOrDoubleCountedPricingAccepted: false as const,
  serviceFeeIncluded: false as const,
  billingAccountIdentifierIncluded: false as const,
  exactClosedWindowUsageAndCurrentAccountRateReread: true as const,
  failedOrCanceledAttemptCostChargedToCustomer: false as const,
  unapprovedOverageAbsorbedByWeEditPro: true as const,
  cloudBillingInvoiceReconciliationRequired: true as const,
  createOnlyPersistenceRequired: true as const,
  customerWalletOrLedgerMutationPerformed: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  recordedAt: '2026-08-11T12:06:00.000Z',
}
const receipt = canonicalSam31VertexServingWindowCostReceiptSchema.parse({
  ...receiptPayload,
  receiptHash: sha256AuthorityValue(receiptPayload),
})

const root = await mkdtemp(join(tmpdir(), 'weeditpro-sam31-settlement-'))
try {
  await seed(root)
  const context = {
    env: {
      localStorageRoot: root,
      nodeEnv: 'development',
      mode: 'local',
    } as ServiceContext['env'],
    clients: {} as ServiceContext['clients'],
    requestId: 'sam31-serving-settlement-smoke',
    auth: { userId: ownerUserId, isMockUser: true },
  } as ServiceContext
  const settlementInput = {
    context,
    receiptId: receipt.receiptId,
    executionAttemptRef,
    receiptReadPort: {
      async rereadServingWindowCostReceipt() {
        return structuredClone(receipt)
      },
    },
    settledAt: '2026-08-11T12:06:01.000Z',
  }
  const settled = await settleCanonicalSam31VertexServingAttemptCredits(
    settlementInput,
  )
  assert.equal(settled.idempotentReplay, false)
  assert.equal(settled.settlement.customerChargedCredits, 100)
  assert.equal(settled.settlement.serviceFeeSettledHere, false)
  const replay = await settleCanonicalSam31VertexServingAttemptCredits(
    settlementInput,
  )
  assert.equal(replay.idempotentReplay, true)
  assert.equal(replay.settlement.settlementHash,
    settled.settlement.settlementHash)
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot: root,
    workspaceId: snapshot.workspaceId,
    ownerUserId,
  })
  assert.equal(aggregate?.wallet.reservedCredits, 400)
  assert.equal(aggregate?.wallet.spentCredits, 100)
  assert.equal(aggregate?.gpuAttemptCreditSettlements.length, 1)
  await assert.rejects(() =>
    settleCanonicalSam31VertexServingAttemptCredits({
      ...settlementInput,
      executionAttemptRef: ref('wrong-attempt', sha('wrong-attempt')),
    }))
} finally {
  await rm(root, { recursive: true, force: true })
}

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-attempt-credit-settlement',
  checks: 24,
  exactWindowAllocationReread: true,
  approvedReservationSpentExactlyOnce: true,
  idempotentReplay: true,
  serviceFeeSettledSeparately: true,
  externalWalletProviderCalled: false,
  publicBillingAuthorityGranted: false,
  productionReady: false,
}, null, 2))

async function seed(rootValue: string): Promise<void> {
  await mutatePrivateEditAuthorityAggregate({
    scope: {
      localStorageRoot: rootValue,
      workspaceId: snapshot.workspaceId,
      ownerUserId,
    },
    now: createdAt,
    mutation: (aggregate) => {
      aggregate.wallet.availableCredits -= reservation.reservedCredits
      aggregate.wallet.reservedCredits += reservation.reservedCredits
      aggregate.wallet.ledgerSequence += 1
      aggregate.plans.push(structuredClone(plan))
      aggregate.estimates.push(structuredClone(estimate))
      aggregate.approvals.push(structuredClone(approval))
      aggregate.snapshots.push(structuredClone(snapshot))
      aggregate.approvedWorkItems.push(structuredClone(approvedWork))
      aggregate.reservations.push(structuredClone(reservation))
      aggregate.ledgerEntries.push({
        id: 'ledger-reserve-1',
        sequence: aggregate.wallet.ledgerSequence,
        entryType: 'reserve',
        sourceType: 'canonical_plan_approval',
        sourceId: reservation.id,
        availableDelta: -reservation.reservedCredits,
        reservedDelta: reservation.reservedCredits,
        spentDelta: 0,
        balanceAfter: walletBalanceAfter(aggregate.wallet),
        idempotencyKey: approval.idempotencyKey,
        createdAt,
      })
      aggregate.reservationEvents.push({
        id: 'reservation-event-1',
        reservationId: reservation.id,
        snapshotId: snapshot.snapshotId,
        approvalId: approval.id,
        eventType: 'reserved',
        credits: reservation.reservedCredits,
        idempotencyKey: approval.idempotencyKey,
        createdAt,
      })
      return { result: undefined, changed: true }
    },
  })
}

function ref(id: string, hash: string, version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${hash}` as const,
  }
}

function sha(value: string): string {
  return sha256AuthorityValue({ value })
}
