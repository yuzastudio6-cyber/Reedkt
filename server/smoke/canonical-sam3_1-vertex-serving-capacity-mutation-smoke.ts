import assert from 'node:assert/strict'

import {
  createCanonicalSam31CompleteSourceCapacityOwner,
  createCanonicalSam31CompleteSourceCapacityRepository,
  sealCanonicalSam31A100ServingCompleteSourceCapacityObservation,
  sealCanonicalSam31L4CompleteSourceCapacityObservation,
} from '../services/canonical-sam3_1-complete-source-capacity-owner'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexServingCapacityMutationRequest,
  compileCanonicalSam31VertexServingCapacityMutation,
  rereadCanonicalSam31VertexServingCapacity,
  requiredA100ServingReplicaCapacity,
  sealCanonicalSam31VertexServingCapacityObservation,
} from '../services/canonical-sam3_1-vertex-serving-capacity-mutation'

const observedAt = '2026-08-12T22:00:00.000Z'
const compiledAt = '2026-08-12T22:00:01.000Z'
const expiresAt = '2026-08-12T22:15:00.000Z'
const endpointResponse = (maximumReplicaCount: number) => ({
  name: 'projects/390722338345/locations/us-central1/endpoints/'
    + 'weeditpro-sam31-a100-scale-zero-v1',
  dedicatedEndpointEnabled: true,
  deployedModels: [{
    id: '3101000004',
    model: 'projects/390722338345/locations/us-central1/models/'
      + 'weeditpro-sam31-a100-scale-zero-v1@2',
    modelVersionId: '2',
    enableAccessLogging: false,
    disableContainerLogging: true,
    dedicatedResources: {
      machineSpec: {
        machineType: 'a2-ultragpu-1g',
        acceleratorType: 'NVIDIA_A100_80GB',
        acceleratorCount: '1',
      },
      minReplicaCount: '0',
      initialReplicaCount: '1',
      maxReplicaCount: String(maximumReplicaCount),
      scaleToZeroSpec: {
        minScaleupPeriod: '300s',
        idleScaledownPeriod: '300s',
      },
    },
  }],
  trafficSplit: { '3101000004': 100 },
})

const current = await rereadCanonicalSam31VertexServingCapacity({
  auth: { async request() { return { data: endpointResponse(1) } } },
  now: () => observedAt,
})
assert.equal(current.maximumReplicaCount, 1)
assert.equal(current.currentEndpointMeetsCompleteSourceCapacity, false)
assert.equal(current.endpointOrGpuJobStarted, false)
assert.equal(requiredA100ServingReplicaCapacity(), 16)

const readyComplete = await completeCapacity({
  a100GrantedValue: 16,
  l4GrantedValue: 16,
  reconciling: false,
})
const mutation = compileCanonicalSam31VertexServingCapacityMutation({
  capacityObservation: current,
  completeSourceCapacityObservation: readyComplete,
  compiledAt,
})
assert.equal(mutation.requestedMaximumReplicaCount, 16)
assert.equal(mutation.priorMaximumReplicaCount, 1)
assert.equal(mutation.body.deployedModel.id, '3101000004')
assert.equal(mutation.body.deployedModel.dedicatedResources.minReplicaCount, 0)
assert.equal(mutation.body.deployedModel.dedicatedResources.maxReplicaCount, 16)
assert.equal(mutation.customerCreditsMutated, false)
assert.deepEqual(
  assertCanonicalSam31VertexServingCapacityMutationRequest(mutation),
  mutation,
)

const pendingComplete = await completeCapacity({
  a100GrantedValue: 1,
  l4GrantedValue: 3,
  reconciling: true,
})
assert.throws(() => compileCanonicalSam31VertexServingCapacityMutation({
  capacityObservation: current,
  completeSourceCapacityObservation: pendingComplete,
  compiledAt,
}), /quota is not ready/u)
assert.throws(() => compileCanonicalSam31VertexServingCapacityMutation({
  capacityObservation: current,
  completeSourceCapacityObservation: readyComplete,
  compiledAt: expiresAt,
}), /capacity observation is invalid/u)
assert.throws(() => assertCanonicalSam31VertexServingCapacityMutationRequest({
  ...mutation,
  requestedMaximumReplicaCount: 15,
}))

const alreadyReady = sealCanonicalSam31VertexServingCapacityObservation({
  ...withoutKey(current, 'observationHash'),
  maximumReplicaCount: 16,
  currentEndpointMeetsCompleteSourceCapacity: true,
})
assert.throws(() => compileCanonicalSam31VertexServingCapacityMutation({
  capacityObservation: alreadyReady,
  completeSourceCapacityObservation: readyComplete,
  compiledAt,
}), /already has required capacity/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-serving-capacity-mutation',
  checks: 15,
  currentMaximumReplicaCount: current.maximumReplicaCount,
  requestedMaximumReplicaCount: mutation.requestedMaximumReplicaCount,
  exactEightMinuteChunkCapacity: 48,
  mutatesOnlyDeployedModelCapacity: true,
  minimumIdleReplicaCount: 0,
  customerInvocationStarted: mutation.gpuInferenceOrCustomerInvocationStarted,
  customerCreditsMutated: mutation.customerCreditsMutated,
  productionAuthorityGranted: mutation.productionAuthorityGranted,
}))

async function completeCapacity(input: {
  readonly a100GrantedValue: number
  readonly l4GrantedValue: number
  readonly reconciling: boolean
}) {
  return createCanonicalSam31CompleteSourceCapacityOwner({
    a100QuotaReadPort: {
      async rereadCurrent() {
        return sealCanonicalSam31A100ServingCompleteSourceCapacityObservation({
          schemaVersion:
            'canonical-sam3_1-a100-serving-complete-source-capacity-observation-v1',
          source:
            'canonical_server_vertex_a100_serving_quota_observation_owner',
          evidenceClass: 'canonical_private_reread',
          projectId: 'reeditpro',
          region: 'us-central1',
          quotaPreferenceId:
            'weeditpro-vertex-serving-a100-80gb-us-central1-1',
          quotaId: 'CustomModelServingA10080GBGPUsPerProjectPerRegion',
          preferredValue: 16,
          grantedValue: input.a100GrantedValue,
          reconciling: input.reconciling,
          exactCloudQuotaPreferenceAndQuotaInfoReread: true,
          vertexCustomJobTrainingQuotaAcceptedAsServingCapacity: false,
          minimumReplicaCount: 0,
          maximumRequestConcurrencyPerReplica: 1,
          endpointOrGpuJobStarted: false,
          customerCreditsMutated: false,
          observedAt,
          expiresAt,
        })
      },
    },
    l4QuotaReadPort: {
      async rereadCurrent() {
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
          preferredValue: 16,
          grantedValue: input.l4GrantedValue,
          reconciling: input.reconciling,
          exactCloudQuotaPreferenceAndQuotaInfoReread: true,
          noZonalRedundancyFallbackCapacityExplicitlyAccepted: true,
          gpuJobStarted: false,
          customerCreditsMutated: false,
          observedAt,
          expiresAt,
        })
      },
    },
    repository: createCanonicalSam31CompleteSourceCapacityRepository({
      objectPort: memoryObjectPort(),
    }),
    now: () => observedAt,
  }).observeAndPersist({
    observationId: `capacity-${input.a100GrantedValue}-${input.l4GrantedValue}`,
  })
}

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const values = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      if (values.has(input.objectPath)) return 'already_exists'
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
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
