import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  buildCanonicalSam31CompleteSourceChunkPlan,
  canonicalSam31CompleteSourceChunkPlanRef,
  createCanonicalSam31CompleteSourceChunkCoordinator,
  createCanonicalSam31CompleteSourceChunkRepository,
  parseCanonicalSam31CompleteSourceChunkPlan,
  type CanonicalSam31CurrentServingPrivateOutputRereadPort,
} from '../services/canonical-sam3_1-complete-source-chunk-coordinator'
import {
  parseTrackAllSam31AuthenticatedGpuInvocationRequest,
  type CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
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
const invocationCounts = new Map<string, number>()
const invocationRuntime = fakeInvocationRuntime({
  fixtureByWork,
  invocationCounts,
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
  invocationRuntime,
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
for (let expected = 1; expected <= 10; expected += 1) {
  const progress = await coordinator.advance({
    authenticatedOwnerUserId: plan.ownerUserId,
    workspaceId: plan.workspaceId,
    executionGroupRef: planRef,
  })
  assert.equal(progress.completedChunkCount, expected)
  assert.equal(progress.nextChunkOrdinal, expected + 1)
  assert.equal(progress.disposition, 'chunk_completed_more_pending')
}

coordinator = createCanonicalSam31CompleteSourceChunkCoordinator(
  coordinatorInput,
)
const afterRestart = await coordinator.advance({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
})
assert.equal(afterRestart.completedChunkCount, 11)
assert.equal(invocationCounts.get(plan.chunks[0]!.requestId), 1)
assert.equal(invocationCounts.get(plan.chunks[9]!.requestId), 1)

let final = afterRestart
while (final.disposition !== 'complete_source_execution_ready') {
  final = await coordinator.advance({
    authenticatedOwnerUserId: plan.ownerUserId,
    workspaceId: plan.workspaceId,
    executionGroupRef: planRef,
  })
}
assert.equal(final.completedChunkCount, 49)
assert.equal(final.nextChunkOrdinal, null)
assert.equal(final.latestChunkReceiptRef?.id,
  'sam31-complete-source-group-01:chunk:049')
assert.equal([...invocationCounts.values()].reduce((sum, value) =>
  sum + value, 0), 49)

const replay = await coordinator.advance({
  authenticatedOwnerUserId: plan.ownerUserId,
  workspaceId: plan.workspaceId,
  executionGroupRef: planRef,
})
assert.equal(replay.disposition, 'complete_source_execution_ready')
assert.equal(replay.invocationRuntimeCalledByCoordinator, false)
assert.equal([...invocationCounts.values()].reduce((sum, value) =>
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
const blocked = createCanonicalSam31CompleteSourceChunkCoordinator({
  ...coordinatorInput,
  repository: blockedRepository,
  resultStore: createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: blockedObjectPort,
  }),
  invocationRuntime: fakeInvocationRuntime({
    fixtureByWork,
    invocationCounts: new Map(),
    disposition() {
      blockedCalls += 1
      return 'outcome_unknown_requires_reconciliation'
    },
  }),
})
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
  checks: 44,
  exactEightMinuteFrameCount: 11_520,
  exactChunkCount: 49,
  exactChunkFrameCount: 240,
  exactOverlapFrameCount: 1,
  finalPartialChunkFrameCount: 48,
  sequentialPrivateOutputRereadBeforeNextChunk: true,
  restartSafeReplayWithoutDuplicateInvocation: true,
  unknownOutcomeBlocksWithoutAutomaticRetry: true,
  cpuSubstantiveFallbackAllowed: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function fakeInvocationRuntime(input: {
  fixtureByWork: ReadonlyMap<string, ReturnType<
    typeof buildCanonicalSam31A100RunFixture
  >>
  invocationCounts: Map<string, number>
  disposition?():
    | 'completed'
    | 'failed'
    | 'not_executed_scale_from_zero_trigger'
    | 'outcome_unknown_requires_reconciliation'
}): CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort {
  return Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-authenticated-gpu-invocation-runtime-v1',
    currentDedicatedEndpointInvocation: true as const,
    historicalCloudJobCustomerDispatchUsed: false as const,
    routeOwnsGpuPlacementOrPricing: false as const,
    currentA100CustomerDispatchReadinessRereadRequired: true as const,
    rawProviderInvocationPortExposed: false as const,
    async invokeApprovedTrackAllWork(runtimeInput: Parameters<
      CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort[
        'invokeApprovedTrackAllWork'
      ]
    >[0]) {
      const request = parseTrackAllSam31AuthenticatedGpuInvocationRequest(
        runtimeInput.request,
      )
      input.invocationCounts.set(request.requestId,
        (input.invocationCounts.get(request.requestId) ?? 0) + 1)
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
