import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult,
  createCanonicalSam31PrivateCompleteSourceChunkLaunchOwner,
  createCanonicalSam31PrivateCompleteSourceChunkLaunchRepository,
} from '../services/canonical-sam3_1-private-complete-source-chunk-launch-owner'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalSam31PrivateCompleteSourceLaunchSmokeFixture as fixture,
} from './canonical-sam3_1-private-complete-source-task-materialization-owner-smoke'

const launchObjects = new Map<string, Buffer>()
const launchObjectPort = createObjectPort(launchObjects)
const repository =
  createCanonicalSam31PrivateCompleteSourceChunkLaunchRepository({
    objectPort: launchObjectPort,
    prefix: 'private/smoke/sam31-private-complete-source-launch',
  })
const authority = fixture.authorityForChunk(fixture.plan.chunks[0])
let launchCalls = 0
const preparingLaunchPort =
  createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort({
    descriptor: {
      schemaVersion:
        'canonical-professional-gpu-fixed-task-preparing-launch-port-v1',
      toolId: 'sam3_1',
      operationId: CANONICAL_SAM3_1_OPERATION_ID,
      fixedServerTaskContractRef:
        authority.runtimeLaunchTarget.fixedServerTaskContractRef,
      approvedTaskMaterialPreparedBeforeTaskContextRead: true,
      canonicalTaskContextRereadBeforeCloudJobCreation: true,
      fixedTaskPersistedAndRereadBeforeCloudJobCreation: true,
      rawCloudLaunchPortAcceptedForFixedTaskTool: false,
    },
    delegate: {
      async startOneShotJob() {
        launchCalls += 1
        return {
          disposition: 'accepted' as const,
          cloudJobExecutionRef: ref('private-chunk-1-cloud-execution'),
          cloudJobCreateRequestRef:
            ref('private-chunk-1-cloud-create-request'),
          providerRequestIdDigestSha256:
            sha256AuthorityValue('private-chunk-1-provider-request'),
          observedAt: '2026-08-13T16:12:03.000Z',
          providerInferenceOrSubstantiveWorkKnownExecuted:
            'not_executed' as const,
        }
      },
    },
  })

const owner = createOwner({
  repository,
  resolveLaunchPort: async () => preparingLaunchPort,
})
const created = await owner.start({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  startedAt: '2026-08-13T16:12:00.000Z',
})
assert.equal(owner.privateInternalOnly, true)
assert.equal(owner.customerOrPublicDispatchAuthorized, false)
assert.equal(owner.maximumSimultaneousRouteAttempts, 1)
assert.equal(created.status, 'private_chunk_gpu_job_created')
assert.equal(created.routeId, 'a100_80gb_heavy_primary')
assert.equal(created.gpuJobDispatched, true)
assert.equal(created.userTriggeredScaleFromZero, true)
assert.equal(created.minimumIdleGpuInstances, 0)
assert.equal(created.maximumSimultaneousRouteAttempts, 1)
assert.equal(created.customerCreditsMutated, false)
assert.equal(created.customerOrPublicDispatchAuthorized, false)
assert.equal(created.productionAuthorityGranted, false)
assert.equal(launchCalls, 1)
assert.deepEqual(
  assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult(created),
  created,
)

const replay = await owner.start({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  startedAt: '2026-08-13T16:12:00.000Z',
})
assert.equal(replay.resultHash, created.resultHash)
assert.equal(launchCalls, 1)

await assert.rejects(() => owner.start({
  executionPlanRef: {
    ...fixture.planRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
  chunkOrdinal: 1,
  startedAt: '2026-08-13T16:12:00.000Z',
}))
assert.throws(() =>
  assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult({
    ...created,
    customerCreditsMutated: true,
  }),
)

const rawPortObjects = new Map<string, Buffer>()
let rawPortCalls = 0
const rawPortOwner = createOwner({
  repository: createCanonicalSam31PrivateCompleteSourceChunkLaunchRepository({
    objectPort: createObjectPort(rawPortObjects),
    prefix: 'private/smoke/sam31-private-raw-port-rejection',
  }),
  resolveLaunchPort: async () => ({
    async startOneShotJob() {
      rawPortCalls += 1
      throw new Error('raw launch port must never be called')
    },
  }),
})
const rawPortRejected = await rawPortOwner.start({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  startedAt: '2026-08-13T16:12:00.000Z',
})
assert.equal(
  rawPortRejected.status,
  'private_chunk_cloud_create_outcome_unknown_requires_reconciliation',
)
assert.equal(rawPortRejected.gpuJobDispatched, false)
assert.equal(
  rawPortRejected.unknownOutcomeBlocksAnyRetryUntilCanonicalReconciliation,
  true,
)
assert.equal(rawPortCalls, 0)

const thrownObjects = new Map<string, Buffer>()
let thrownCalls = 0
const thrownOwner = createOwner({
  repository: createCanonicalSam31PrivateCompleteSourceChunkLaunchRepository({
    objectPort: createObjectPort(thrownObjects),
    prefix: 'private/smoke/sam31-private-unknown-outcome',
  }),
  resolveLaunchPort: async () =>
    createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort({
      descriptor: {
        schemaVersion:
          'canonical-professional-gpu-fixed-task-preparing-launch-port-v1',
        toolId: 'sam3_1',
        operationId: CANONICAL_SAM3_1_OPERATION_ID,
        fixedServerTaskContractRef:
          authority.runtimeLaunchTarget.fixedServerTaskContractRef,
        approvedTaskMaterialPreparedBeforeTaskContextRead: true,
        canonicalTaskContextRereadBeforeCloudJobCreation: true,
        fixedTaskPersistedAndRereadBeforeCloudJobCreation: true,
        rawCloudLaunchPortAcceptedForFixedTaskTool: false,
      },
      delegate: {
        async startOneShotJob() {
          thrownCalls += 1
          throw new Error('provider outcome is unknown')
        },
      },
    }),
})
const unknown = await thrownOwner.start({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  startedAt: '2026-08-13T16:12:00.000Z',
})
assert.equal(
  unknown.status,
  'private_chunk_cloud_create_outcome_unknown_requires_reconciliation',
)
assert.equal(unknown.gpuJobDispatched, false)
assert.equal(unknown.providerInferenceOrSubstantiveWorkKnownExecuted, 'unknown')
assert.equal(thrownCalls, 1)
const unknownReplay = await thrownOwner.start({
  executionPlanRef: fixture.planRef,
  chunkOrdinal: 1,
  startedAt: '2026-08-13T16:12:00.000Z',
})
assert.equal(unknownReplay.resultHash, unknown.resultHash)
assert.equal(thrownCalls, 1)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-complete-source-chunk-launch-owner',
  checks: 35,
  durableSingleUseIntentBeforeCloudCreate: true,
  exactReplayStartedNoSecondCloudJob: true,
  rawCloudLaunchPortRejectedBeforeCall: true,
  unknownOutcomeBlockedRetry: true,
  userTriggeredScaleFromZero: created.userTriggeredScaleFromZero,
  minimumIdleGpuInstances: created.minimumIdleGpuInstances,
  maximumSimultaneousRouteAttempts:
    created.maximumSimultaneousRouteAttempts,
  customerOrPublicDispatchAuthorized:
    created.customerOrPublicDispatchAuthorized,
}))

function createOwner(input: {
  repository: ReturnType<
    typeof createCanonicalSam31PrivateCompleteSourceChunkLaunchRepository
  >
  resolveLaunchPort: () => Promise<
    ReturnType<typeof createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort>
    | { startOneShotJob: () => Promise<never> }
  >
}) {
  return createCanonicalSam31PrivateCompleteSourceChunkLaunchOwner({
    executionPlanRepository: fixture.planRepository,
    materializationRepository: fixture.materializationRepository,
    taskStore: fixture.taskStore,
    taskAuthorityReadPort: {
      schemaVersion:
        'canonical-sam3_1-private-complete-source-task-authority-read-port-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async rereadExactChunkAuthority(request) {
        if (!sameRef(request.executionPlanRef, fixture.planRef)) return null
        const chunk = fixture.plan.chunks[request.chunkOrdinal - 1]
        return chunk ? fixture.authorityForChunk(chunk) : null
      },
    },
    launchPortResolver: {
      schemaVersion:
        'canonical-sam3_1-private-complete-source-chunk-launch-port-resolver-v1',
      privateInternalOnly: true,
      customerOrPublicDispatchAuthorized: false,
      async resolve() {
        return input.resolveLaunchPort()
      },
    },
    repository: input.repository,
  })
}

function createObjectPort(
  objects: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly({ objectPath, body, contentSha256 }) {
      assert.equal(
        createHash('sha256').update(body).digest('hex'),
        contentSha256,
      )
      const existing = objects.get(objectPath)
      if (existing) {
        if (!existing.equals(body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      objects.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(path) {
      const body = objects.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function ref(id: string, raw = sha256AuthorityValue(id), version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${raw}` as const,
  }
}
