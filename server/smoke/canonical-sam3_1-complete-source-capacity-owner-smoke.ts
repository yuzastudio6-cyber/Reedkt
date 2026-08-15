import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort,
  assertCanonicalSam31CompleteSourceCapacityObservation,
  createCanonicalSam31CompleteSourceCapacityOwner,
  createCanonicalSam31CompleteSourceCapacityRepository,
  createCanonicalSam31GcpL4CompleteSourceCapacityReadPort,
  sealCanonicalSam31A100ServingCompleteSourceCapacityObservation,
  sealCanonicalSam31L4CompleteSourceCapacityObservation,
} from '../services/canonical-sam3_1-complete-source-capacity-owner'

const observedAt = '2026-08-12T21:15:00.000Z'
const expiresAt = '2026-08-12T21:30:00.000Z'
const readyA100 = a100Observation({
  preferredValue: 16,
  grantedValue: 16,
  reconciling: false,
})
const readyL4 = l4Observation({
  preferredValue: 16,
  grantedValue: 16,
  reconciling: false,
})
const storage = new Map<string, Buffer>()
const repository = createCanonicalSam31CompleteSourceCapacityRepository({
  objectPort: memoryObjectPort(storage),
})
const ready = await createCanonicalSam31CompleteSourceCapacityOwner({
  a100QuotaReadPort: { async rereadCurrent() { return readyA100 } },
  l4QuotaReadPort: { async rereadCurrent() { return readyL4 } },
  repository,
  now: () => observedAt,
}).observeAndPersist({ observationId: 'sam31-complete-source-capacity-ready' })

assert.equal(
  ready.status,
  'ready_for_eight_minute_complete_source_execution',
)
assert.equal(ready.completeSourceExecutionCapacityReady, true)
assert.equal(ready.a100HeavyPrimary, true)
assert.equal(ready.l4SeparatelyQualifiedFallbackOnly, true)
assert.equal(ready.minimumIdleGpuInstances, 0)
assert.equal(ready.sourceFrameCount, 11_520)
assert.equal(ready.chunkFrameCount, 240)
assert.equal(ready.chunkOverlapFrameCount, 1)
assert.equal(ready.chunkStrideFrameCount, 239)
assert.equal(ready.exactChunkCount, 49)
assert.equal(ready.exactCrossChunkBoundaryCount, 48)
assert.equal(ready.customerCreditsMutated, false)
assert.deepEqual(
  await repository.reread({ observationId: ready.observationId }),
  ready,
)

const pending = await createCanonicalSam31CompleteSourceCapacityOwner({
  a100QuotaReadPort: {
    async rereadCurrent() {
      return a100Observation({
        preferredValue: 16,
        grantedValue: 1,
        reconciling: true,
      })
    },
  },
  l4QuotaReadPort: {
    async rereadCurrent() {
      return l4Observation({
        preferredValue: 16,
        grantedValue: 3,
        reconciling: true,
      })
    },
  },
  repository: createCanonicalSam31CompleteSourceCapacityRepository({
    objectPort: memoryObjectPort(new Map()),
  }),
  now: () => observedAt,
}).observeAndPersist({
  observationId: 'sam31-complete-source-capacity-pending',
})
assert.equal(pending.status, 'pending_quota_reconciliation')
assert.equal(pending.completeSourceExecutionCapacityReady, false)
assert.equal(pending.gpuJobStarted, false)

const childObservedAt = '2026-08-12T21:15:00.010Z'
const aggregateObservedAt = '2026-08-12T21:15:00.020Z'
const asynchronousClockOrder = await createCanonicalSam31CompleteSourceCapacityOwner({
  a100QuotaReadPort: {
    async rereadCurrent() {
      return sealCanonicalSam31A100ServingCompleteSourceCapacityObservation({
        ...withoutKey(readyA100, 'observationHash'),
        observedAt: childObservedAt,
      })
    },
  },
  l4QuotaReadPort: {
    async rereadCurrent() {
      return sealCanonicalSam31L4CompleteSourceCapacityObservation({
        ...withoutKey(readyL4, 'observationHash'),
        observedAt: childObservedAt,
      })
    },
  },
  repository: createCanonicalSam31CompleteSourceCapacityRepository({
    objectPort: memoryObjectPort(new Map()),
  }),
  now: () => aggregateObservedAt,
}).observeAndPersist({
  observationId: 'sam31-complete-source-capacity-real-clock-order',
})
assert.equal(asynchronousClockOrder.observedAt, aggregateObservedAt)

const fakeAuth = {
  async request(input: { readonly url?: string }) {
    if (input.url?.includes('/quotaPreferences/')) return {
      data: {
        name: 'projects/reeditpro/locations/global/quotaPreferences/'
          + 'weeditpro-l4-scale-zero-quality-capacity-us-central1-v1',
        service: 'run.googleapis.com',
        quotaId: 'NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion',
        dimensions: { region: 'us-central1' },
        quotaConfig: { preferredValue: '16', grantedValue: '3' },
        reconciling: true,
      },
    }
    return {
      data: {
        name: 'projects/390722338345/locations/global/services/'
          + 'run.googleapis.com/quotaInfos/'
          + 'NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion',
        service: 'run.googleapis.com',
        quotaId: 'NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion',
        dimensionsInfos: [{
          dimensions: { region: 'us-central1' },
          applicableLocations: ['us-central1'],
          details: { value: '3' },
        }],
      },
    }
  },
}
const liveShape = await createCanonicalSam31GcpL4CompleteSourceCapacityReadPort({
  auth: fakeAuth,
  now: () => observedAt,
}).rereadCurrent()
assert.equal(liveShape.preferredValue, 16)
assert.equal(liveShape.grantedValue, 3)
assert.equal(liveShape.reconciling, true)

const liveA100Shape =
  await createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort({
    auth: {
      async request(input: { readonly url?: string }) {
        if (input.url?.includes('/quotaPreferences/')) return {
          data: {
            name: 'projects/reeditpro/locations/global/quotaPreferences/'
              + 'weeditpro-vertex-serving-a100-80gb-us-central1-1',
            service: 'aiplatform.googleapis.com',
            quotaId: 'CustomModelServingA10080GBGPUsPerProjectPerRegion',
            dimensions: { region: 'us-central1' },
            quotaConfig: { preferredValue: '16', grantedValue: '1' },
            reconciling: true,
          },
        }
        return {
          data: {
            name: 'projects/390722338345/locations/global/services/'
              + 'aiplatform.googleapis.com/quotaInfos/'
              + 'CustomModelServingA10080GBGPUsPerProjectPerRegion',
            service: 'aiplatform.googleapis.com',
            quotaId: 'CustomModelServingA10080GBGPUsPerProjectPerRegion',
            dimensionsInfos: [{
              dimensions: { region: 'us-central1' },
              applicableLocations: ['us-central1'],
              details: { value: '1' },
            }],
          },
        }
      },
    },
    now: () => observedAt,
  }).rereadCurrent()
assert.equal(liveA100Shape.preferredValue, 16)
assert.equal(liveA100Shape.grantedValue, 1)
assert.equal(liveA100Shape.reconciling, true)
assert.equal(
  liveA100Shape.vertexCustomJobTrainingQuotaAcceptedAsServingCapacity,
  false,
)

assert.throws(() => assertCanonicalSam31CompleteSourceCapacityObservation({
  ...ready,
  a100GrantedValue: 15,
}))
const zeroL4Capacity = sealCanonicalSam31L4CompleteSourceCapacityObservation({
  ...withoutKey(readyL4, 'observationHash'),
  grantedValue: 0,
})
assert.equal(zeroL4Capacity.grantedValue, 0)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-complete-source-capacity-owner',
  checks: 27,
  exactEightMinuteSourceFrameCount: ready.sourceFrameCount,
  exactChunkCount: ready.exactChunkCount,
  requiredConcurrentA10080GbWorkers:
    ready.minimumRequiredConcurrentA10080GbWorkers,
  requiredConcurrentL4FallbackWorkers:
    ready.minimumRequiredConcurrentL4FallbackWorkers,
  pendingQuotaFailsClosed: !pending.completeSourceExecutionCapacityReady,
  userTriggeredScaleFromZero: ready.userTriggeredScaleFromZero,
  automaticQualityReductionAllowed: ready.automaticQualityReductionAllowed,
  gpuJobStarted: ready.gpuJobStarted,
  customerCreditsMutated: ready.customerCreditsMutated,
  productionAuthorityGranted: ready.productionAuthorityGranted,
}))

function a100Observation(input: {
  readonly preferredValue: number
  readonly grantedValue: number
  readonly reconciling: boolean
}) {
  return sealCanonicalSam31A100ServingCompleteSourceCapacityObservation({
    schemaVersion:
      'canonical-sam3_1-a100-serving-complete-source-capacity-observation-v1',
    source: 'canonical_server_vertex_a100_serving_quota_observation_owner',
    evidenceClass: 'canonical_private_reread',
    projectId: 'reeditpro',
    region: 'us-central1',
    quotaPreferenceId: 'weeditpro-vertex-serving-a100-80gb-us-central1-1',
    quotaId: 'CustomModelServingA10080GBGPUsPerProjectPerRegion',
    ...input,
    exactCloudQuotaPreferenceAndQuotaInfoReread: true,
    vertexCustomJobTrainingQuotaAcceptedAsServingCapacity: false,
    minimumReplicaCount: 0,
    maximumRequestConcurrencyPerReplica: 1,
    endpointOrGpuJobStarted: false,
    customerCreditsMutated: false,
    observedAt,
    expiresAt,
  })
}

function l4Observation(input: {
  readonly preferredValue: number
  readonly grantedValue: number
  readonly reconciling: boolean
}) {
  return sealCanonicalSam31L4CompleteSourceCapacityObservation({
    schemaVersion:
      'canonical-sam3_1-l4-complete-source-capacity-observation-v1',
    source: 'canonical_server_cloud_run_l4_quota_observation_owner',
    evidenceClass: 'canonical_private_reread',
    projectId: 'reeditpro',
    region: 'us-central1',
    quotaPreferenceId:
      'weeditpro-l4-scale-zero-quality-capacity-us-central1-v1',
    quotaId: 'NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion',
    ...input,
    exactCloudQuotaPreferenceAndQuotaInfoReread: true,
    noZonalRedundancyFallbackCapacityExplicitlyAccepted: true,
    gpuJobStarted: false,
    customerCreditsMutated: false,
    observedAt,
    expiresAt,
  })
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(digest(input.body), input.contentSha256)
      if (storage.has(input.objectPath)) return 'already_exists'
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = storage.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

function withoutKey<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
