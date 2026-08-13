import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  buildCanonicalSam31CompleteSourceChunkPlan,
  canonicalSam31CompleteSourceChunkPlanRef,
  canonicalSam31CompleteSourceChunkReceiptRef,
  canonicalSam31CompleteSourceChunkReceiptSchema,
  createCanonicalSam31CompleteSourceChunkRepository,
} from '../services/canonical-sam3_1-complete-source-chunk-coordinator'
import {
  canonicalSam31CompleteSourceServingReleaseRef,
  createCanonicalSam31CompleteSourceServingReleaseOwner,
  createCanonicalSam31CompleteSourceServingReleaseRepository,
  parseCanonicalSam31CompleteSourceServingRelease,
} from '../services/canonical-sam3_1-complete-source-serving-release'
import {
  createCanonicalSam31VertexServingReconciledWindowCostRepository,
  canonicalSam31VertexServingReconciledWindowCostReceiptRef,
} from '../services/canonical-sam3_1-vertex-serving-reconciled-window-cost-repository'
import type {
  CanonicalSam31VertexServingTerminalAttemptRecord,
} from '../services/canonical-sam3_1-vertex-serving-terminal-attempt-owner'
import {
  allocationWindow,
  observation,
  rate,
} from './canonical-sam3_1-vertex-serving-billing-export-smoke'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createCanonicalSam31VertexServingReconciledWindowCostReceipt,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-reconciled-window-cost'
import type {
  CanonicalSam31VertexServingMultiReplicaWindowAttempt,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-multi-replica-window-cost-authority'
import {
  buildCanonicalSam31CurrentServingResultAdmission,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'

const objectPort = memoryObjectPort(new Map())
const chunkRepository = createCanonicalSam31CompleteSourceChunkRepository({
  objectPort,
})
const releaseRepository =
  createCanonicalSam31CompleteSourceServingReleaseRepository({ objectPort })
const costRepository =
  createCanonicalSam31VertexServingReconciledWindowCostRepository({
    objectPort,
  })
const snapshotRef = ref('snapshot-1')
const sourceRef = ref('source-1')
const plan = buildCanonicalSam31CompleteSourceChunkPlan({
  executionGroupId: 'complete-source-release-group-1',
  ownerUserId: 'owner-user-1',
  workspaceId: 'workspace-1',
  approvedSnapshotRef: snapshotRef,
  exactSourceRef: sourceRef,
  sourceBindingRef: ref('source-binding-1'),
  masterTimingRef: ref('master-timing-1'),
  compiledSubjectIntentRef: ref('subject-intent-1'),
  sourceFrameCount: 479,
  fpsNumerator: 24,
  fpsDenominator: 1,
  workItems: [
    { requestId: 'request-1', workItemKey: 'work-1' },
    { requestId: 'request-2', workItemKey: 'work-2' },
  ],
  plannedAt: '2026-08-11T11:55:00.000Z',
})
await chunkRepository.persistPlanCreateOnly({ plan })
const planRef = canonicalSam31CompleteSourceChunkPlanRef(plan)
const attempts = plan.chunks.map((_chunk, index) => attempt({
  ordinal: index + 1,
  snapshotRef,
  startedAt: `2026-08-11T12:0${index}:10.000Z`,
  endedAt: `2026-08-11T12:0${index}:40.000Z`,
}))
const receipts: ReturnType<typeof receipt>[] = []
for (const [index, chunk] of plan.chunks.entries()) {
  receipts.push(receipt({
    chunk,
    attempt: attempts[index]!,
    previous: index === 0 ? null
      : canonicalSam31CompleteSourceChunkReceiptRef(receipts[index - 1]!),
  }))
}
for (const value of receipts) {
  await chunkRepository.persistChunkReceiptCreateOnly({ receipt: value })
}
const results = receipts.map((value, index) => result({
  receipt: value,
  chunk: plan.chunks[index]!,
}))
const resultByInvocation = new Map(results.map((value) => [
  value.endpointInvocationResultRef.id,
  value,
]))
const terminals = receipts.map((value, index) => terminal({
  receipt: value,
  attempt: attempts[index]!,
  recordedAt: `2026-08-11T12:0${index}:45.000Z`,
}))
const terminalByAttempt = new Map(terminals.map((value) => [
  value.executionAttemptRef.id,
  value,
]))
const cost = createCanonicalSam31VertexServingReconciledWindowCostReceipt({
  receiptId: 'complete-source-serving-window-1',
  endpointDeploymentRef: ref('endpoint-deployment-1'),
  endpointCapacityObservationRef: rate.endpointCapacityObservationRef,
  allocationWindow,
  billingExportObservation: observation,
  attempts,
  recordedAt: '2026-08-11T12:12:00.000Z',
})
assert.equal(await costRepository.persistCreateOnly({ receipt: cost }),
  'created')
assert.equal(await costRepository.persistCreateOnly({ receipt: cost }),
  'identical_replay')
const settlements = attempts.map((value, index) => settlement({
  attempt: value,
  allocation: cost.attemptAllocations[index]!,
  cost,
  createdAt: `2026-08-11T12:13:0${index}.000Z`,
}))
const settlementByAttempt = new Map(settlements.map((value) => [
  value.executionAttemptId,
  value,
]))
const owner = createCanonicalSam31CompleteSourceServingReleaseOwner({
  chunkRepository,
  resultStore: {
    async rereadResultAdmission(invocationId) {
      return structuredClone(resultByInvocation.get(invocationId) ?? null)
    },
  },
  terminalAttemptOwner: {
    async rereadTerminalAttempt({ executionAttemptRef }) {
      return structuredClone(
        terminalByAttempt.get(executionAttemptRef.id) ?? null,
      )
    },
  },
  costRepository,
  settlementReadPort: {
    async rereadAttemptCreditSettlement({ executionAttemptRef }) {
      return structuredClone(
        settlementByAttempt.get(executionAttemptRef.id) ?? null,
      )
    },
  },
  releaseRepository,
})
const request = {
  releaseId: 'complete-source-serving-release-1',
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
  servingWindowCostReceiptRef:
    canonicalSam31VertexServingReconciledWindowCostReceiptRef(cost),
  releasedAt: '2026-08-11T12:14:00.000Z',
}
const release = await owner.release(request)
assert.deepEqual(parseCanonicalSam31CompleteSourceServingRelease(release),
  release)
assert.equal(release.exactChunkCount, 2)
assert.equal(release.chunkReceiptRefs.length, 2)
assert.equal(release.currentServingResultAdmissionRefs.length, 2)
assert.equal(release.attemptCreditSettlementRefs.length, 2)
assert.equal(release.endpointScaleToZeroObservedAfterServingWindow, true)
assert.equal(release.downstreamL4MaskQaRequiredForEveryAdmittedSceneRange,
  true)
assert.equal(release.qaApproved, false)
assert.equal(release.productionAuthorityGranted, false)
assert.deepEqual(
  canonicalSam31CompleteSourceServingReleaseRef(
    await releaseRepository.rereadByExecutionGroup({
      executionGroupRef: planRef,
    }),
  ),
  canonicalSam31CompleteSourceServingReleaseRef(release),
)
assert.equal((await owner.release(request)).releaseHash, release.releaseHash)

const missingSettlement = settlementByAttempt.get(attempts[1]!
  .executionAttemptRef.id)!
settlementByAttempt.delete(attempts[1]!.executionAttemptRef.id)
await assert.rejects(() => owner.release({
  ...request,
  releaseId: 'missing-settlement-release',
}), /settlement/u)
settlementByAttempt.set(missingSettlement.executionAttemptId,
  missingSettlement)

const originalFirstSettlement = settlementByAttempt.get(
  attempts[0]!.executionAttemptRef.id,
)!
const { settlementHash: _settlementHash, ...tamperedSettlementPayload } =
  structuredClone(originalFirstSettlement)
assert.equal(_settlementHash, originalFirstSettlement.settlementHash)
tamperedSettlementPayload.attemptCostReceiptHash = sha('wrong-attempt-cost')
settlementByAttempt.set(originalFirstSettlement.executionAttemptId, {
  ...tamperedSettlementPayload,
  settlementHash: sha256AuthorityValue(tamperedSettlementPayload),
})
await assert.rejects(() => owner.release({
  ...request,
  releaseId: 'tampered-attempt-cost-release',
}), /settlement lineage/u)
settlementByAttempt.set(originalFirstSettlement.executionAttemptId,
  originalFirstSettlement)

const tampered: Record<string, unknown> = structuredClone(release)
tampered.endpointScaleToZeroObservedAfterServingWindow = false
assert.throws(() => parseCanonicalSam31CompleteSourceServingRelease(tampered))

const wrongCostOrder = structuredClone(cost)
wrongCostOrder.usage.attempts.reverse()
await assert.rejects(() => owner.release({
  ...request,
  releaseId: 'wrong-cost-order-release',
  servingWindowCostReceiptRef: {
    ...request.servingWindowCostReceiptRef,
    id: 'missing-cost-receipt',
  },
}), /cost/u)
assert.notDeepEqual(wrongCostOrder.usage.attempts, cost.usage.attempts)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-complete-source-serving-release',
  checks: 43,
  completeSourceChunksRereadExactly: release.exactChunkCount,
  currentPerChunkCostPendingRetained: results.every((value) =>
    value.servingWindowUsageCostAndCreditSettlementPending),
  groupDetailedBillingExportReconciled: true,
  everyAttemptCreditSettledExactlyOnce: true,
  endpointScaleToZeroObservedAfterWindow: true,
  downstreamL4QaStillRequired: true,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}, null, 2))

function receipt(input: {
  chunk: typeof plan.chunks[number]
  attempt: CanonicalSam31VertexServingMultiReplicaWindowAttempt
  previous: ReturnType<
    typeof canonicalSam31CompleteSourceChunkReceiptRef
  > | null
}) {
  const payload = {
    schemaVersion: 'canonical-sam3_1-complete-source-chunk-receipt-v1' as const,
    source: 'canonical_server_sam3_1_complete_source_chunk_coordinator' as const,
    evidenceClass: 'canonical_private_exact_output_reread' as const,
    executionGroupRef: planRef,
    chunkOrdinal: input.chunk.chunkOrdinal,
    canonicalStartFrameInclusive: input.chunk.canonicalStartFrameInclusive,
    canonicalEndFrameInclusive: input.chunk.canonicalEndFrameInclusive,
    overlapWithPreviousFrames: input.chunk.overlapWithPreviousFrames,
    requestRef: ref(`request-ref-${input.chunk.chunkOrdinal}`),
    endpointInvocationResultRef:
      ref(`invocation-${input.chunk.chunkOrdinal}`),
    executionAttemptRef: input.attempt.executionAttemptRef,
    runtimeResponseRef: ref(`runtime-response-${input.chunk.chunkOrdinal}`),
    taskRef: ref(`task-${input.chunk.chunkOrdinal}`),
    privateOutputRereadEvidenceRef:
      ref(`output-reread-${input.chunk.chunkOrdinal}`),
    manifestRef: ref(`manifest-${input.chunk.chunkOrdinal}`),
    maskSequenceArtifactRef: ref(`masks-${input.chunk.chunkOrdinal}`),
    sourceFrameMappingRef: ref(`source-map-${input.chunk.chunkOrdinal}`),
    previousChunkReceiptRef: input.previous,
    providerOutcome: 'executed' as const,
    runtimeStatus: 'completed' as const,
    exactApprovedTaskAndRuntimeResponseReread: true as const,
    exactManifestAndEveryMaskByteReread: true as const,
    exactCanonicalSourceRangeMappingVerified: true as const,
    previousOverlapBoundarySourceRereadWhenRequired: true as const,
    nextChunkMayStart: true as const,
    automaticProviderRetryStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    assetManifestMutated: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    completedAt: `2026-08-11T12:0${input.chunk.chunkOrdinal}:00.000Z`,
  }
  return canonicalSam31CompleteSourceChunkReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

function result(input: {
  receipt: ReturnType<typeof receipt>
  chunk: typeof plan.chunks[number]
}) {
  return buildCanonicalSam31CurrentServingResultAdmission({
    schemaVersion: 'canonical-sam3_1-current-serving-result-admission-v2',
    source: 'canonical_server_sam3_1_current_serving_result_owner',
    evidenceClass: 'canonical_private_exact_response_reread',
    status: 'ready_for_independent_mask_artifact_qa',
    resultAdmissionId: `result-${input.chunk.chunkOrdinal}`,
    taskRef: input.receipt.taskRef,
    runtimeRequestRef: ref(`runtime-request-${input.chunk.chunkOrdinal}`),
    dispatchAdmissionRef: ref(`dispatch-${input.chunk.chunkOrdinal}`),
    admissionConsumptionRef: ref(`consumption-${input.chunk.chunkOrdinal}`),
    executionEnvelopeRef: input.receipt.endpointInvocationResultRef,
    runtimeReleaseRef: ref('runtime-release'),
    specializedRuntimeReleaseRef: ref('specialized-release'),
    endpointInvocationResultRef: input.receipt.endpointInvocationResultRef,
    executionAttemptRef: input.receipt.executionAttemptRef,
    terminalServingAttemptRef: ref(`terminal-${input.chunk.chunkOrdinal}`),
    completeSourceChunkPlanRef: planRef,
    completeSourceChunkReceiptRef:
      canonicalSam31CompleteSourceChunkReceiptRef(input.receipt),
    previousChunkReceiptRef: input.receipt.previousChunkReceiptRef,
    privateOutputRereadEvidenceRef:
      input.receipt.privateOutputRereadEvidenceRef,
    runtimeResponseObjectRef: ref(`response-object-${input.chunk.chunkOrdinal}`),
    runtimeResponseBindingSha256: sha(`response-${input.chunk.chunkOrdinal}`),
    manifestRef: input.receipt.manifestRef,
    maskSequenceArtifactRef: input.receipt.maskSequenceArtifactRef,
    routeId: 'a100_80gb_heavy_primary',
    accelerator: 'nvidia_a100_80gb',
    chunkOrdinal: input.chunk.chunkOrdinal,
    canonicalStartFrameInclusive: input.chunk.canonicalStartFrameInclusive,
    canonicalEndFrameInclusive: input.chunk.canonicalEndFrameInclusive,
    wallTimeMilliseconds: 30_000,
    cudaEventInferenceMilliseconds: 25_000,
    peakCudaAllocatedBytes: 1_000_000,
    propagatedFrameCount: input.chunk.canonicalEndFrameInclusive
      - input.chunk.canonicalStartFrameInclusive + 1,
    maskFileCount: input.chunk.canonicalEndFrameInclusive
      - input.chunk.canonicalStartFrameInclusive + 1,
    exactTaskResponseEndpointTerminalChunkAndOutputReread: true,
    exactGpuAndApprovedFrameRangeVerified: true,
    actualNvdecCudaBfloat16ExecutionVerified: true,
    durableQueueConsumerRecordedTerminalAttempt: true,
    accountEffectiveServingRateRereadBeforeInvocation: true,
    servingWindowUsageCostAndCreditSettlementPending: true,
    terminalScaleToZeroClaimedByPerChunkResult: false,
    independentMaskArtifactQaPending: true,
    assetManifestReconciliationPending: true,
    rendererLayerAdmissionPending: true,
    customerCreditsMutated: false,
    qaApproved: false,
    assetManifestMutated: false,
    renderAuthorized: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: `2026-08-11T12:0${input.chunk.chunkOrdinal}:50.000Z`,
  })
}

function terminal(input: {
  receipt: ReturnType<typeof receipt>
  attempt: CanonicalSam31VertexServingMultiReplicaWindowAttempt
  recordedAt: string
}): CanonicalSam31VertexServingTerminalAttemptRecord {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-terminal-attempt-record-v1' as const,
    source:
      'canonical_server_sam31_vertex_serving_terminal_attempt_owner' as const,
    evidenceClass: 'canonical_private_exact_reread' as const,
    invocationId: input.receipt.endpointInvocationResultRef.id,
    executionAttemptRef: input.receipt.executionAttemptRef,
    endpointInvocationAttemptRef: ref(`endpoint-attempt-${input.attempt
      .executionAttemptRef.id}`),
    endpointCallStartRef: ref(`call-start-${input.attempt
      .executionAttemptRef.id}`),
    endpointInvocationResultRef: input.receipt.endpointInvocationResultRef,
    fundedStartRecordHash: sha(`funded-${input.attempt.executionAttemptRef.id}`),
    fundedStartExecutionIndexHash:
      sha(`funded-index-${input.attempt.executionAttemptRef.id}`),
    attempt: input.attempt,
    exactFundingInvocationStartResultAndTerminalReread: true as const,
    workerSuppliedBillableDurationReplicaCountOrPriceAccepted: false as const,
    unresolvedProviderOutcomeAccepted: false as const,
    servingWindowCostReceiptPending: true as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    recordedAt: input.recordedAt,
  }
  return { ...payload, recordHash: sha256AuthorityValue(payload) }
}

function attempt(input: {
  ordinal: number
  snapshotRef: ReturnType<typeof ref>
  startedAt: string
  endedAt: string
}): CanonicalSam31VertexServingMultiReplicaWindowAttempt {
  return {
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'plan-1',
    editPlanVersion: 1,
    executionAttemptRef: ref(`execution-attempt-${input.ordinal}`),
    approvedSnapshotRef: input.snapshotRef,
    approvedWorkItemRef: ref(`approved-work-${input.ordinal}`),
    workerLeaseRef: ref(`lease-${input.ordinal}`),
    fundedReservationRef: ref('reservation-1'),
    approvedEstimateRef: ref('estimate-1'),
    userApprovalRecordRef: ref('approval-1'),
    userTriggerRecordRef: ref(`trigger-${input.ordinal}`),
    requestStartedAt: input.startedAt,
    responseCompletedAt: input.endedAt,
    activeRequestMilliseconds:
      Date.parse(input.endedAt) - Date.parse(input.startedAt),
    terminalOutcome: 'completed',
    providerInferenceOrSubstantiveWorkOutcome: 'executed',
    approvedReservedToolCostCredits: 10,
    exactApprovedPlanReservationLeaseTriggerAndAttemptReread: true,
    callerSuppliedOutcomeUsageOrPricingAccepted: false,
  }
}

function settlement(input: {
  attempt: CanonicalSam31VertexServingMultiReplicaWindowAttempt
  allocation: typeof cost.attemptAllocations[number]
  cost: typeof cost
  createdAt: string
}) {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-serving-attempt-credit-settlement-v2' as const,
    id: `settlement-${input.attempt.executionAttemptRef.id}`,
    servingWindowCostReceiptId: input.cost.receiptId,
    servingWindowCostReceiptHash: input.cost.receiptHash,
    servingWindowUsageHash: input.cost.usage.usageHash,
    detailedBillingExportObservationId:
      input.cost.detailedBillingExportObservationRef.id,
    detailedBillingExportObservationHash:
      input.cost.detailedBillingExportObservationRef.contentHash.slice(7),
    attemptCostReceiptId: '',
    attemptCostReceiptHash: '',
    allocationWindowId: input.cost.usage.allocationWindowId,
    endpointDeploymentId: input.cost.endpointDeploymentRef.id,
    endpointDeploymentHash: input.cost.endpointDeploymentRef.contentHash.slice(7),
    executionAttemptId: input.attempt.executionAttemptRef.id,
    snapshotId: input.attempt.approvedSnapshotRef.id,
    approvalId: input.attempt.userApprovalRecordRef.id,
    reservationId: input.attempt.fundedReservationRef.id,
    approvedWorkItemId: input.attempt.approvedWorkItemRef.id,
    terminalOutcome: 'completed' as const,
    settlementDisposition:
      'charged_eligible_cost_to_shared_plan_reservation' as const,
    approvedToolCeilingCredits: input.allocation.approvedReservedToolCostCredits,
    customerChargedCredits: input.allocation.customerEligibleToolCostCredits,
    weeditproAbsorbedInfrastructureCostUsdNanos:
      input.allocation.weeditproAbsorbedInfrastructureCostUsdNanos,
    unusedToolCeilingCreditsRetainedInSharedPlanReservation:
      input.allocation.creditsRecommendedToRetainForRemainingApprovedPlanWork,
    creditsHeldPendingReconciliation: 0 as const,
    creditsReleasedOrRefundedAtAttemptSettlement: 0 as const,
    reservationSpendApplied:
      input.allocation.customerEligibleToolCostCredits > 0,
    exactTerminalAndAttemptCostReceiptReread: true as const,
    exactDetailedUsageCostExportReconciled: true as const,
    finalInvoiceMonthTaxOrAdjustmentClaimed: false as const,
    serviceFeeSettledHere: false as const,
    finalPlanSettlementStillRequired: true as const,
    publicBillingAuthorityGranted: false as const,
    productionAuthorityGranted: false as const,
    idempotencyKey: `settlement-${input.attempt.executionAttemptRef.id}`,
    createdAt: input.createdAt,
  }
  const attemptCostReceiptHash = sha256AuthorityValue({
    servingWindowCostReceiptId: input.cost.receiptId,
    servingWindowCostReceiptHash: input.cost.receiptHash,
    executionAttemptRef: input.attempt.executionAttemptRef,
    allocation: input.allocation,
  })
  const finalized = {
    ...payload,
    attemptCostReceiptId:
      `sam31-serving-attempt-cost:${attemptCostReceiptHash}`,
    attemptCostReceiptHash,
  }
  return {
    ...finalized,
    settlementHash: sha256AuthorityValue(finalized),
  }
}

function ref(id: string, hash = sha(id)) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function memoryObjectPort(
  store: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly({ objectPath, body, contentSha256 }) {
      if (sha(body) !== contentSha256) throw new Error('Checksum changed.')
      const prior = store.get(objectPath)
      if (prior) {
        if (!prior.equals(body)) throw new Error('Create-only value changed.')
        return 'already_exists'
      }
      store.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = store.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function sha(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
