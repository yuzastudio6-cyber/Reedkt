import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  buildCanonicalSam31CompleteSourceChunkPlan,
  canonicalSam31CompleteSourceChunkPlanRef,
  canonicalSam31CompleteSourceChunkReceiptRef,
  createCanonicalSam31CompleteSourceChunkCoordinator,
  createCanonicalSam31CompleteSourceChunkRepository,
  parseCanonicalSam31CompleteSourceChunkPlan,
  type CanonicalSam31CurrentServingPrivateOutputRereadPort,
} from '../services/canonical-sam3_1-complete-source-chunk-coordinator'
import {
  parseCanonicalSam31CompleteSourceServingRelease,
} from '../services/canonical-sam3_1-complete-source-serving-release'
import {
  createCanonicalSam31CurrentServingResultFinalizationRuntime,
} from '../services/canonical-sam3_1-current-serving-result-finalization-service'
import type {
  CanonicalSam31VertexServingTerminalAttemptRecord,
} from '../services/canonical-sam3_1-vertex-serving-terminal-attempt-owner'
import {
  parseTrackAllSam31AuthenticatedGpuInvocationRequest,
  type CanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  resolveCurrentServingChunkLineage,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-authenticated-start-service'
import {
  parseTrackAllSam31AuthenticatedGpuQueuedStartRequest,
  type CanonicalTrackAllSam31QueuedGpuStartRuntimePort,
} from '../services/canonical-track-all-sam3_1-queued-gpu-start-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import type {
  CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  buildCanonicalSam31A100RunFixture,
} from './canonical-sam3_1-gpu-runtime-deterministic-qualification-owner-smoke'
import {
  canonicalSam31A100TaskFixture,
  a100,
} from './canonical-sam3_1-gpu-task-owner-smoke'

const base = canonicalSam31A100TaskFixture.runtimeRequest
const exactSourceRef = ref(
  'sam31-coordinator-eight-minute-source',
  digest('sam31-coordinator-eight-minute-source'),
)
const approvedSnapshotRef = ref(
  base.scope.approvedPlanSnapshotId,
  base.scope.approvedPlanSnapshotHash,
)
const workItems = Array.from({ length: 49 }, (_, index) => ({
  requestId: `sam31-complete-source-request-${String(index + 1)
    .padStart(2, '0')}`,
  workItemKey: `sam31-complete-source-work-${String(index + 1)
    .padStart(2, '0')}`,
}))
const plan = buildCanonicalSam31CompleteSourceChunkPlan({
  executionGroupId: 'sam31-complete-source-group-01',
  ownerUserId: base.scope.ownerUserId,
  workspaceId: base.scope.workspaceId,
  approvedSnapshotRef,
  exactSourceRef,
  sourceBindingRef: base.scope.sourceBindingRef,
  masterTimingRef: base.scope.masterTimingRef,
  compiledSubjectIntentRef: base.approvedPrompt.compiledIntentRef,
  sourceFrameCount: 11_520,
  fpsNumerator: 24,
  fpsDenominator: 1,
  workItems,
  plannedAt: '2026-08-13T13:00:00.000Z',
})
assert.equal(plan.exactChunkCount, 49)
assert.equal(plan.chunks[0]?.canonicalStartFrameInclusive, 0)
assert.equal(plan.chunks[0]?.canonicalEndFrameInclusive, 239)
assert.equal(plan.chunks[1]?.canonicalStartFrameInclusive, 239)
assert.equal(plan.chunks[1]?.overlapWithPreviousFrames, 1)
assert.equal(plan.chunks[48]?.canonicalStartFrameInclusive, 11_472)
assert.equal(plan.chunks[48]?.canonicalEndFrameInclusive, 11_519)

const fixtures = plan.chunks.map((chunk) =>
  buildCanonicalSam31A100RunFixture(chunk.chunkOrdinal, {
    invocationPrefix: 'sam31-complete-source-endpoint-chunk',
    exactSourceRef,
    maskProxyRef: ref(
      `sam31-complete-source-proxy-${chunk.chunkOrdinal}`,
      digest(`sam31-complete-source-proxy-${chunk.chunkOrdinal}`),
    ),
    canonicalStartFrameInclusive: chunk.canonicalStartFrameInclusive,
    decodedFrameCount: chunk.canonicalEndFrameInclusive
      - chunk.canonicalStartFrameInclusive + 1,
    fpsNumerator: 24,
    uniqueChunkIdentity: true,
    chunkPlanRef: {
      ...plan.chunkPlanRef,
      version: 1 as const,
      contentHash: plan.chunkPlanRef.contentHash as `sha256:${string}`,
    },
  }))
const fixtureByWork = new Map(plan.chunks.map((chunk, index) => [
  chunk.workItemKey,
  fixtures[index]!,
]))
const objectPort = memoryObjectPort(new Map())
const repository = createCanonicalSam31CompleteSourceChunkRepository({
  objectPort,
})
assert.equal(await repository.persistPlanCreateOnly({ plan }), 'created')
assert.equal(await repository.persistPlanCreateOnly({ plan }),
  'identical_replay')
const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort,
})
const queueCounts = new Map<string, number>()
const queuedPorts = fakeQueuedCoordinatorPorts({
  fixtureByWork,
  queueCounts,
})
const taskStore = fakeTaskStore(fixtures)
const privateOutputRereadPort: CanonicalSam31CurrentServingPrivateOutputRereadPort =
  Object.freeze({
    async rereadExactCurrentServingPrivateOutput({ task }: Parameters<
      CanonicalSam31CurrentServingPrivateOutputRereadPort[
        'rereadExactCurrentServingPrivateOutput'
      ]
    >[0]) {
      const fixture = fixtures.find((candidate) =>
        candidate.task.invocationId === task.invocationId)
      if (!fixture) throw new Error('Fixture output is missing.')
      return structuredClone(fixture.privateOutput)
    },
  })
let nowOrdinal = 0
const coordinatorInput = {
  repository,
  ...queuedPorts,
  taskStore,
  resultStore,
  privateOutputRereadPort,
  now: () => `2026-08-13T13:${String(nowOrdinal++)
    .padStart(2, '0')}:00.000Z`,
}
let coordinator = createCanonicalSam31CompleteSourceChunkCoordinator(
  coordinatorInput,
)
const planRef = canonicalSam31CompleteSourceChunkPlanRef(plan)
const advanceOneChunk = async (expected: number) => {
  const waiting = await coordinator.advance({
    authenticatedOwnerUserId: plan.ownerUserId,
    workspaceId: plan.workspaceId,
    executionGroupRef: planRef,
  })
  assert.equal(waiting.disposition, 'chunk_queued_waiting_for_terminal')
  assert.equal(waiting.completedChunkCount, expected - 1)
  assert.equal(waiting.directGpuInvocationStartedByCoordinator, false)
  const progress = await coordinator.advance({
    authenticatedOwnerUserId: plan.ownerUserId,
    workspaceId: plan.workspaceId,
    executionGroupRef: planRef,
  })
  assert.equal(progress.completedChunkCount, expected)
  assert.equal(progress.nextChunkOrdinal,
    expected === plan.exactChunkCount ? null : expected + 1)
  assert.equal(progress.disposition,
    expected === plan.exactChunkCount
      ? 'complete_source_execution_ready'
      : 'chunk_completed_more_pending')
  assert.equal(progress.directGpuInvocationStartedByCoordinator, false)
  return progress
}
for (let expected = 1; expected <= 10; expected += 1) {
  await advanceOneChunk(expected)
}

coordinator = createCanonicalSam31CompleteSourceChunkCoordinator(
  coordinatorInput,
)
const afterRestart = await advanceOneChunk(11)
assert.equal(afterRestart.completedChunkCount, 11)
assert.equal(queueCounts.get(plan.chunks[0]!.requestId), 1)
assert.equal(queueCounts.get(plan.chunks[9]!.requestId), 1)

let final = afterRestart
for (let expected = 12; expected <= 49; expected += 1) {
  final = await advanceOneChunk(expected)
}
assert.equal(final.completedChunkCount, 49)
assert.equal(final.nextChunkOrdinal, null)
assert.equal(final.latestChunkReceiptRef?.id,
  'sam31-complete-source-group-01:chunk:049')
assert.equal([...queueCounts.values()].reduce((sum, value) =>
  sum + value, 0), 49)

const currentServingFinalizer =
  createCanonicalSam31CurrentServingResultFinalizationRuntime({
    chunkRepository: repository,
    invocationResultReadPort: queuedPorts.invocationResultReadPort,
    terminalAttemptOwner: {
      async rereadTerminalAttempt({ executionAttemptRef }) {
        const fixture = fixtures.find((candidate) =>
          candidate.task.runtimeRequest.scope.executionAttemptRef.id ===
            executionAttemptRef.id)
        return fixture ? terminalAttemptFor({
          fixture,
          requestId: plan.chunks[fixtures.indexOf(fixture)]!.requestId,
        }) : null
      },
    },
    taskStore,
    resultStore,
    now: () => '2026-08-13T15:00:00.000Z',
  })
const currentAdmission = await currentServingFinalizer.finalize({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
  chunkOrdinal: 1,
})
assert.equal(currentAdmission.schemaVersion,
  'canonical-sam3_1-current-serving-result-admission-v2')
assert.equal(currentAdmission.chunkOrdinal, 1)
assert.equal(currentAdmission.completeSourceChunkReceiptRef.id,
  'sam31-complete-source-group-01:chunk:001')
assert.equal(currentAdmission.servingWindowUsageCostAndCreditSettlementPending,
  true)
assert.equal(currentAdmission.terminalScaleToZeroClaimedByPerChunkResult,
  false)
const currentAdmissionReplay = await currentServingFinalizer.finalize({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
  chunkOrdinal: 1,
})
assert.equal(currentAdmissionReplay.resultAdmissionHash,
  currentAdmission.resultAdmissionHash)
const secondAdmission = await currentServingFinalizer.finalize({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
  chunkOrdinal: 2,
})
const outputObservationFor = (fixture: (typeof fixtures)[number]) => ({
  manifestByteLength: 8_192,
  manifestSha256: fixture.privateOutput.manifestRef.contentHash.slice(7),
  maskPngCount: fixture.privateOutput.maskFileCount,
  distinctObjectIds: [1],
  exactPrivateManifestBytesReread: true as const,
  manifestTaskResultGeometryAndRangeVerified: true as const,
  callerPathUrlOrBytesAccepted: false as const,
})
const completeReceiptRefs = await Promise.all(plan.chunks.map(async (chunk) =>
  canonicalSam31CompleteSourceChunkReceiptRef(
    (await repository.rereadChunkReceipt({
      executionGroupId: plan.executionGroupId,
      chunkOrdinal: chunk.chunkOrdinal,
    }))!,
  )))
const currentResultRefs = plan.chunks.map((chunk) => {
  const current = chunk.chunkOrdinal === 1
    ? currentAdmission
    : chunk.chunkOrdinal === 2 ? secondAdmission : null
  return current
    ? versionedRef(current.resultAdmissionId, current.resultAdmissionHash, 2)
    : versionedRef(`current-result-${chunk.chunkOrdinal}`,
      digest(`current-result-${chunk.chunkOrdinal}`), 2)
})
const servingReleasePayload = {
  schemaVersion: 'canonical-sam3_1-complete-source-serving-release-v1' as const,
  source:
    'canonical_server_sam3_1_complete_source_serving_release_owner' as const,
  evidenceClass: 'canonical_private_exact_group_reread_and_settlement' as const,
  status:
    'complete_source_serving_settled_scale_zero_ready_for_l4_qa' as const,
  releaseId: 'complete-source-serving-release-1',
  releaseVersion: 1 as const,
  executionGroupRef: planRef,
  approvedSnapshotRef: plan.approvedSnapshotRef,
  exactSourceRef: plan.exactSourceRef,
  sourceBindingRef: plan.sourceBindingRef,
  masterTimingRef: plan.masterTimingRef,
  compiledSubjectIntentRef: plan.compiledSubjectIntentRef,
  sourceFrameCount: plan.sourceFrameCount,
  fpsNumerator: plan.fpsNumerator,
  fpsDenominator: plan.fpsDenominator,
  exactChunkCount: plan.exactChunkCount,
  chunkReceiptRefs: completeReceiptRefs,
  currentServingResultAdmissionRefs: currentResultRefs,
  terminalServingAttemptRefs: plan.chunks.map((chunk) =>
    ref(`terminal-${chunk.chunkOrdinal}`)),
  executionAttemptRefs: plan.chunks.map((chunk) =>
    ref(`execution-attempt-${chunk.chunkOrdinal}`)),
  servingWindowCostReceiptRef: ref('serving-cost-receipt'),
  attemptCreditSettlementRefs: plan.chunks.map((chunk) =>
    versionedRef(`settlement-${chunk.chunkOrdinal}`,
      digest(`settlement-${chunk.chunkOrdinal}`), 2)),
  totalCustomerChargedCredits: 49,
  totalWeEditProAbsorbedInfrastructureCostUsdNanos: 0,
  everyPlannedChunkReceiptResultAndTerminalAttemptReread: true as const,
  exactSequentialChunkAndCompleteSourceFrameCoverageVerified: true as const,
  exactDetailedBillingExportAndAccountEffectiveRateReconciled: true as const,
  everyExecutionAttemptAllocatedAndCreditSettledExactlyOnce: true as const,
  failedOrCanceledAttemptCostChargedToCustomer: false as const,
  unapprovedOverageAbsorbedByWeEditPro: true as const,
  endpointScaleToZeroObservedAfterServingWindow: true as const,
  perChunkPendingCostAndScaleZeroClaimsResolvedOnlyByGroupRelease: true as const,
  downstreamL4MaskQaRequiredForEveryAdmittedSceneRange: true as const,
  independentPrivateReviewRequiredBeforeSpecialistEvidence: true as const,
  serviceFeeAndFinalUnusedReservationSettlementRemainSeparate: true as const,
  callerResultCostPriceScaleZeroOrSettlementClaimAccepted: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  browserLocalStateUsed: false as const,
  assetManifestMutated: false as const,
  qaApproved: false as const,
  renderAuthorized: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  releasedAt: '2026-08-13T15:01:00.000Z',
}
const servingRelease = parseCanonicalSam31CompleteSourceServingRelease({
  ...servingReleasePayload,
  releaseHash: sha256AuthorityValue(servingReleasePayload),
})
await assert.rejects(() => resolveCurrentServingChunkLineage({
  result: secondAdmission,
  task: fixtures[1]!.task,
  context: a100.context,
  output: outputObservationFor(fixtures[1]!),
  subjectRequestId: 'track-all-complete-source-subject',
  currentSubjectEvidenceId: 'track-all-current-chunk-02-evidence',
  currentMaskObjectId: 1,
  chunkRepository: repository,
  servingReleaseRepository: {
    async rereadByExecutionGroup() { return null },
  },
  taskStore,
  taskContextRepository: {
    async rereadTaskContext() { return structuredClone(a100.context) },
  },
  resultStore,
  outputReadPort: {
    async rereadExactSam31MaskManifest({ task }) {
      const fixture = fixtures.find((candidate) =>
        candidate.task.invocationId === task.invocationId)
      if (!fixture) throw new Error('Prior output fixture is unavailable.')
      return outputObservationFor(fixture)
    },
  },
  l4AdmissionAt: '2026-08-13T15:02:00.000Z',
}), /complete.source release/u)
const secondChunkLineage = await resolveCurrentServingChunkLineage({
  result: secondAdmission,
  task: fixtures[1]!.task,
  context: a100.context,
  output: outputObservationFor(fixtures[1]!),
  subjectRequestId: 'track-all-complete-source-subject',
  currentSubjectEvidenceId: 'track-all-current-chunk-02-evidence',
  currentMaskObjectId: 1,
  chunkRepository: repository,
  servingReleaseRepository: {
    async rereadByExecutionGroup() {
      return structuredClone(servingRelease)
    },
  },
  taskStore,
  taskContextRepository: {
    async rereadTaskContext() {
      return structuredClone(a100.context)
    },
  },
  resultStore,
  outputReadPort: {
    async rereadExactSam31MaskManifest({ task }) {
      const fixture = fixtures.find((candidate) =>
        candidate.task.invocationId === task.invocationId)
      if (!fixture) throw new Error('Prior output fixture is unavailable.')
      return outputObservationFor(fixture)
    },
  },
  l4AdmissionAt: '2026-08-13T15:02:00.000Z',
})
assert.equal(secondChunkLineage.chunkOrdinal, 2)
assert.equal(secondChunkLineage.canonicalStartFrameInclusive, 239)
assert.equal(secondChunkLineage.previousChunkBoundaryInput
  ?.previousChunkOrdinal, 1)
assert.equal(secondChunkLineage.previousChunkBoundaryInput
  ?.previousCanonicalEndFrameInclusive, 239)
assert.equal(secondChunkLineage.previousChunkBoundaryInput
  ?.previousMaskFrameIndex, 239)
assert.equal(secondChunkLineage.previousChunkBoundaryInput
  ?.currentMaskFrameIndex, 0)
assert.equal(secondChunkLineage.previousChunkBoundaryInput
  ?.overlapFrameCount, 1)

const replay = await coordinator.advance({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
})
assert.equal(replay.disposition, 'complete_source_execution_ready')
assert.equal(replay.directGpuInvocationStartedByCoordinator, false)
assert.equal(replay.durableQueueAdmissionRequestedByCoordinator, false)
assert.equal([...queueCounts.values()].reduce((sum, value) =>
  sum + value, 0), 49)

assert.throws(() => buildCanonicalSam31CompleteSourceChunkPlan({
  ...planInput(),
  workItems: workItems.slice(0, 48),
}))
assert.throws(() => buildCanonicalSam31CompleteSourceChunkPlan({
  ...planInput(),
  workItems: workItems.map((item, index) => index === 1
    ? { ...item, requestId: workItems[0]!.requestId } : item),
}))
const tamperedPlan = structuredClone(plan)
tamperedPlan.chunks[1]!.canonicalStartFrameInclusive += 1
tamperedPlan.planHash = sha256AuthorityValue(withoutKey(tamperedPlan,
  'planHash'))
assert.throws(() => parseCanonicalSam31CompleteSourceChunkPlan(tamperedPlan))
await assert.rejects(() => coordinator.advance({
  authenticatedOwnerUserId: 'crossed-owner',
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
}))

const blockedObjectPort = memoryObjectPort(new Map())
const blockedRepository = createCanonicalSam31CompleteSourceChunkRepository({
  objectPort: blockedObjectPort,
})
await blockedRepository.persistPlanCreateOnly({ plan })
let blockedCalls = 0
const blockedPorts = fakeQueuedCoordinatorPorts({
  fixtureByWork,
  queueCounts: new Map(),
  resultAfterQueueCall: 1,
  disposition() {
    blockedCalls += 1
    return 'outcome_unknown_requires_reconciliation'
  },
})
const blocked = createCanonicalSam31CompleteSourceChunkCoordinator({
  ...coordinatorInput,
  ...blockedPorts,
  repository: blockedRepository,
  resultStore: createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: blockedObjectPort,
  }),
})
const unknownWaiting = await blocked.advance({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
})
assert.equal(unknownWaiting.disposition,
  'chunk_queued_waiting_for_terminal')
const unknown = await blocked.advance({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
})
assert.equal(unknown.disposition,
  'blocked_unknown_requires_reconciliation')
assert.equal(unknown.completedChunkCount, 0)
assert.equal(unknown.automaticProviderRetryStarted, false)
assert.equal(blockedCalls, 1)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-complete-source-chunk-coordinator',
    checks: 52,
  exactEightMinuteFrameCount: 11_520,
  exactChunkCount: 49,
  exactChunkFrameCount: 240,
  exactOverlapFrameCount: 1,
  finalPartialChunkFrameCount: 48,
  sequentialPrivateOutputRereadBeforeNextChunk: true,
  durableQueueBeforeGpuInvocation: true,
  coordinatorDirectGpuInvocationAllowed: false,
  restartSafeReplayWithoutDuplicateInference: true,
    currentA100ResultAdmittedToL4WithExactPriorChunkBoundary: true,
    currentA100GroupSettlementAndScaleZeroReleaseRequiredBeforeL4: true,
  unknownOutcomeBlocksWithoutAutomaticRetry: true,
  cpuSubstantiveFallbackAllowed: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function fakeQueuedCoordinatorPorts(input: {
  fixtureByWork: ReadonlyMap<string, ReturnType<
    typeof buildCanonicalSam31A100RunFixture
  >>
  queueCounts: Map<string, number>
  resultAfterQueueCall?: number
  disposition?():
    | 'completed'
    | 'failed'
    | 'not_executed_scale_from_zero_trigger'
    | 'outcome_unknown_requires_reconciliation'
}): {
  readonly queuedStartRuntime: CanonicalTrackAllSam31QueuedGpuStartRuntimePort
  readonly invocationResultReadPort:
    CanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort
} {
  const queuedStartRuntime: CanonicalTrackAllSam31QueuedGpuStartRuntimePort =
    Object.freeze({
      schemaVersion:
        'canonical-track-all-sam3_1-queued-gpu-start-runtime-v1',
      queueId: 'weeditpro-professional-gpu-production-v1',
      runtimeRegion: 'us-central1',
      durablePostgresQueueRequired: true as const,
      directGpuInvocationAllowed: false as const,
      cloudTaskDispatchOwnedByScheduler: true as const,
      routeOwnsGpuPlacementOrPricing: false as const,
      productionAuthority: false as const,
      async enqueueApprovedTrackAllWork(runtimeInput: Parameters<
        CanonicalTrackAllSam31QueuedGpuStartRuntimePort[
          'enqueueApprovedTrackAllWork'
        ]
      >[0]) {
        const request = parseTrackAllSam31AuthenticatedGpuQueuedStartRequest(
          runtimeInput.request,
        )
        const count = (input.queueCounts.get(request.requestId) ?? 0) + 1
        input.queueCounts.set(request.requestId, count)
        const payload = {
          schemaVersion:
            'track-all-sam3_1-authenticated-gpu-queued-start-result-v3' as const,
          requestRef: ref(request.requestId, request.requestDigestSha256),
          workspaceId: runtimeInput.workspaceId,
          projectId: 'sam31-complete-source-project',
          approvedSnapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          fundedDispatchAdmissionRef: ref(`funding:${request.requestId}`),
          prelaunchAuthorizationRef: ref(`prelaunch:${request.requestId}`),
          fixedTaskPreparationBridgeRef:
            ref(`preparation:${request.requestId}`),
          executionAttemptRef:
            input.fixtureByWork.get(request.workItemKey)!.task.runtimeRequest
              .scope.executionAttemptRef,
          userTriggerRecordRef: ref(`trigger:${request.requestId}`),
          queueEntryRef: ref(`queue:${request.requestId}`),
          queueTransactionRef: ref(`queue-transaction:${request.requestId}`),
          queueDisposition: count === 1
            ? 'queued' as const : 'active_replay' as const,
          routeId: 'a100_80gb_heavy_primary' as const,
          accelerator: 'nvidia_a100_80gb' as const,
          queueId: 'weeditpro-professional-gpu-production-v1' as const,
          runtimeRegion: 'us-central1' as const,
          minimumIdleGpuInstances: 0 as const,
          userTriggeredScaleFromZero: true as const,
          a100HeavyPrimaryAndSeparatelyQualifiedL4Fallback: true as const,
          durablePostgresQueueAdmissionCommitted: true as const,
          schedulerOwnsCloudTaskDispatch: true as const,
          taskConsumerMustRereadFundingTaskAndRuntimeAuthorities: true as const,
          directGpuInvocationStartedByRequest: false as const,
          cloudTaskCreationStartedByRequest: false as const,
          callerSuppliedMediaPromptQueuePriorityCapacityRouteModelImageCommandOrPriceAccepted:
            false as const,
          customerCreditsMutated: false as const,
          qaApproved: false as const,
          publicDeliveryAuthorized: false as const,
          productionAuthorityGranted: false as const,
        }
        return Object.freeze({
          ...payload,
          resultDigestSha256: sha256AuthorityValue(payload),
        })
      },
    })
  const invocationResultReadPort:
    CanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort =
    Object.freeze({
      schemaVersion:
        'canonical-track-all-sam3_1-authenticated-gpu-invocation-result-read-v1',
      canonicalRepositoryRereadOnly: true as const,
      directGpuInvocationAllowed: false as const,
      automaticRetryAllowed: false as const,
      async rereadApprovedTrackAllWorkResult(runtimeInput: Parameters<
        CanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort[
          'rereadApprovedTrackAllWorkResult'
        ]
      >[0]) {
        const request = parseTrackAllSam31AuthenticatedGpuInvocationRequest(
          runtimeInput.request,
        )
      const queueCount = input.queueCounts.get(request.requestId) ?? 0
      if (queueCount < (input.resultAfterQueueCall ?? 1)) return null
      const fixture = input.fixtureByWork.get(request.workItemKey)
      if (!fixture) throw new Error('Invocation fixture is missing.')
      const disposition = input.disposition?.() ?? 'completed'
      const executed = disposition === 'completed' || disposition === 'failed'
      const unknown = disposition ===
        'outcome_unknown_requires_reconciliation'
      const responseHash = digest(
        canonicalSam31GpuWireStringify(fixture.response),
      )
      const payload = {
        schemaVersion:
          'track-all-sam3_1-authenticated-gpu-invocation-result-v2' as const,
        requestRef: ref(request.requestId, request.requestDigestSha256),
        workspaceId: runtimeInput.workspaceId,
        approvedSnapshotId: request.approvedSnapshotId,
        workItemKey: request.workItemKey,
        fundedDispatchAdmissionRef: ref(`funding:${request.requestId}`),
        prelaunchAuthorizationRef: ref(`prelaunch:${request.requestId}`),
        fixedTaskPreparationBridgeRef: ref(`preparation:${request.requestId}`),
        endpointInvocationAttemptRef: ref(`attempt:${request.requestId}`),
        endpointCallStartRef: ref(`call-start:${request.requestId}`),
        endpointInvocationResultRef: ref(
          fixture.task.invocationId,
          digest(`endpoint-result:${request.requestId}`),
        ),
        executionAttemptRef:
          fixture.task.runtimeRequest.scope.executionAttemptRef,
        runtimeResponseRef: executed ? ref(
          `sam31-gpu-response:${fixture.task.invocationId}`,
          responseHash,
        ) : null,
        invocationDisposition: disposition,
        providerOutcome: executed ? 'executed' as const
          : unknown ? 'unknown' as const : 'not_executed' as const,
        runtimeStatus: executed
          ? (disposition === 'completed' ? 'completed' as const
            : 'failed' as const)
          : null,
        routeId: 'a100_80gb_heavy_primary' as const,
        accelerator: 'nvidia_a100_80gb' as const,
        userTriggeredScaleFromZero: true as const,
        currentDedicatedEndpointInvocation: true as const,
        historicalCloudJobCustomerDispatchUsed: false as const,
        currentEndpointReadinessRereadBeforeInvocation: true as const,
        approvedSourceMaterialRereadByCanonicalServer: true as const,
        fundedPricingReservationAndAttemptRereadBeforeInvocation:
          true as const,
        accountEffectiveServingRateRereadBeforeInvocation: true as const,
        automaticRetryAllowed: false as const,
        unresolvedOutcomeBlocksRetry: unknown,
        canonicalServingWindowUsageCostAndCreditSettlementPending:
          true as const,
        callerSuppliedMediaPromptEndpointModelRouteImageCommandOrPriceAccepted:
          false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
      }
      return Object.freeze({
        ...payload,
        resultDigestSha256: sha256AuthorityValue(payload),
      })
      },
    })
  return Object.freeze({ queuedStartRuntime, invocationResultReadPort })
}

function fakeTaskStore(
  fixtures: ReadonlyArray<ReturnType<
    typeof buildCanonicalSam31A100RunFixture
  >>,
): Pick<CanonicalSam31GpuTaskStore,
  'rereadTask' | 'rereadRuntimeResponse'> {
  const byInvocation = new Map(fixtures.map((fixture) => [
    fixture.task.invocationId,
    fixture,
  ]))
  return Object.freeze({
    async rereadTask(invocationId: string) {
      return structuredClone(byInvocation.get(invocationId)?.task ?? null)
    },
    async rereadRuntimeResponse(invocationId: string) {
      return structuredClone(byInvocation.get(invocationId)?.response ?? null)
    },
  })
}

function terminalAttemptFor(input: {
  fixture: ReturnType<typeof buildCanonicalSam31A100RunFixture>
  requestId: string
}): CanonicalSam31VertexServingTerminalAttemptRecord {
  const scope = input.fixture.task.runtimeRequest.scope
  const recordedAt = '2026-08-13T14:00:00.000Z'
  const attempt = {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    editPlanId: scope.editPlanId,
    editPlanVersion: 1,
    executionAttemptRef: scope.executionAttemptRef,
    approvedSnapshotRef: ref(
      scope.approvedPlanSnapshotId,
      scope.approvedPlanSnapshotHash,
    ),
    approvedWorkItemRef: scope.approvedWorkItemRef,
    workerLeaseRef: scope.workerLeaseRef,
    fundedReservationRef: scope.fundedCreditReservationRef,
    approvedEstimateRef: ref(`estimate:${input.requestId}`),
    userApprovalRecordRef: ref(`approval:${input.requestId}`),
    userTriggerRecordRef: ref(`trigger:${input.requestId}`),
    requestStartedAt: '2026-08-13T13:59:59.000Z',
    responseCompletedAt: recordedAt,
    activeRequestMilliseconds: 1_000,
    terminalOutcome: 'completed' as const,
    providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
    approvedReservedToolCostCredits: 5,
    exactApprovedPlanReservationLeaseTriggerAndAttemptReread: true as const,
    callerSuppliedOutcomeUsageOrPricingAccepted: false as const,
  }
  const payload: Omit<
    CanonicalSam31VertexServingTerminalAttemptRecord,
    'recordHash'
  > = {
    schemaVersion: 'canonical-sam3_1-vertex-serving-terminal-attempt-record-v1',
    source: 'canonical_server_sam31_vertex_serving_terminal_attempt_owner',
    evidenceClass: 'canonical_private_exact_reread',
    invocationId: input.fixture.task.invocationId,
    executionAttemptRef: scope.executionAttemptRef,
    endpointInvocationAttemptRef: ref(`attempt:${input.requestId}`),
    endpointCallStartRef: ref(`call-start:${input.requestId}`),
    endpointInvocationResultRef: ref(
      input.fixture.task.invocationId,
      digest(`endpoint-result:${input.requestId}`),
    ),
    fundedStartRecordHash: digest(`funding:${input.requestId}`),
    fundedStartExecutionIndexHash: digest(`funding-index:${input.requestId}`),
    attempt,
    exactFundingInvocationStartResultAndTerminalReread: true,
    workerSuppliedBillableDurationReplicaCountOrPriceAccepted: false,
    unresolvedProviderOutcomeAccepted: false,
    servingWindowCostReceiptPending: true,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    recordedAt,
  }
  return {
    ...payload,
    recordHash: sha256AuthorityValue(payload),
  }
}

function planInput() {
  return {
    executionGroupId: 'sam31-complete-source-group-invalid',
    ownerUserId: base.scope.ownerUserId,
    workspaceId: base.scope.workspaceId,
    approvedSnapshotRef,
    exactSourceRef,
    sourceBindingRef: base.scope.sourceBindingRef,
    masterTimingRef: base.scope.masterTimingRef,
    compiledSubjectIntentRef: base.approvedPrompt.compiledIntentRef,
    sourceFrameCount: 11_520,
    fpsNumerator: 24,
    fpsDenominator: 1,
    workItems,
    plannedAt: '2026-08-13T13:00:00.000Z',
  }
}

function memoryObjectPort(
  store: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly({ objectPath, body, contentSha256 }) {
      if (digest(body) !== contentSha256) {
        throw new Error('Memory object checksum differs.')
      }
      const existing = store.get(objectPath)
      if (existing) {
        if (!existing.equals(body)) {
          throw new Error('Memory create-only object differs.')
        }
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

function ref(id: string, hash = digest(id)) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function versionedRef(id: string, hash: string, version: number) {
  return {
    id,
    version,
    contentHash: `sha256:${hash}` as const,
  }
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function withoutKey<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const cloned = JSON.parse(stableAuthorityStringify(value)) as T
  delete cloned[key]
  return cloned
}
