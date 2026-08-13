import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31CompleteSourceCapacityOwner,
  createCanonicalSam31CompleteSourceCapacityRepository,
  sealCanonicalSam31A100ServingCompleteSourceCapacityObservation,
  sealCanonicalSam31L4CompleteSourceCapacityObservation,
} from '../services/canonical-sam3_1-complete-source-capacity-owner'
import {
  assertCanonicalSam31PrivateQualificationCapacityObservation,
  createCanonicalSam31PrivateQualificationCapacityOwner,
  createCanonicalSam31PrivateQualificationCapacityRepository,
} from '../services/canonical-sam3_1-private-qualification-capacity-owner'

const observedAt = '2026-08-13T13:00:00.000Z'
const expiresAt = '2026-08-13T13:15:00.000Z'

const currentA100 = a100({
  preferredValue: 16,
  grantedValue: 1,
  reconciling: true,
})
const currentL4 = l4({
  preferredValue: 16,
  grantedValue: 1,
  reconciling: true,
})
const repository = createCanonicalSam31PrivateQualificationCapacityRepository({
  objectPort: memoryObjectPort(new Map()),
})
const current = await createCanonicalSam31PrivateQualificationCapacityOwner({
  a100QuotaReadPort: { async rereadCurrent() { return currentA100 } },
  l4QuotaReadPort: { async rereadCurrent() { return currentL4 } },
  repository,
  now: () => observedAt,
}).observeAndPersist({
  observationId: 'sam31-private-eight-minute-capacity-current',
})

assert.equal(current.status, 'private_sequential_capacity_ready')
assert.equal(current.privateSequentialCapacityReady, true)
assert.equal(current.productionCapacityStatus,
  'production_concurrency_capacity_pending')
assert.equal(current.productionConcurrencyCapacityReady, false)
assert.equal(current.a100Reconciling, true)
assert.equal(current.l4Reconciling, true)
assert.equal(current.minimumRequiredPrivateA10080GbCapacity, 1)
assert.equal(current.minimumRequiredPrivateL4Capacity, 1)
assert.equal(current.minimumRequiredProductionA10080GbCapacity, 16)
assert.equal(current.minimumRequiredProductionL4Capacity, 16)
assert.equal(current.maximumSimultaneousPrivateA100Attempts, 1)
assert.equal(current.maximumSimultaneousPrivateL4Attempts, 1)
assert.equal(current.qualificationAttemptsMustRunSequentially, true)
assert.equal(
  current.privateQualificationMayUseCurrentlyGrantedCapacityWhilePreferenceReconciles,
  true,
)
assert.equal(
  current.quotaPreferenceReconciliationAcceptedAsGrantedCapacityLoss,
  false,
)
assert.equal(current.qualificationExecutionAuthorized, false)
assert.equal(current.gpuJobStarted, false)
assert.equal(current.customerCreditsMutated, false)
assert.equal(current.productionAuthorityGranted, false)
assert.deepEqual(
  await repository.reread({ observationId: current.observationId }),
  current,
)

const noA100 = await createCanonicalSam31PrivateQualificationCapacityOwner({
  a100QuotaReadPort: {
    async rereadCurrent() {
      return a100({ preferredValue: 16, grantedValue: 0, reconciling: true })
    },
  },
  l4QuotaReadPort: { async rereadCurrent() { return currentL4 } },
  repository: createCanonicalSam31PrivateQualificationCapacityRepository({
    objectPort: memoryObjectPort(new Map()),
  }),
  now: () => observedAt,
}).observeAndPersist({ observationId: 'sam31-private-capacity-no-a100' })
assert.equal(noA100.status, 'private_sequential_capacity_unavailable')
assert.equal(noA100.privateSequentialCapacityReady, false)

const production = await createCanonicalSam31PrivateQualificationCapacityOwner({
  a100QuotaReadPort: {
    async rereadCurrent() {
      return a100({ preferredValue: 16, grantedValue: 16, reconciling: false })
    },
  },
  l4QuotaReadPort: {
    async rereadCurrent() {
      return l4({ preferredValue: 16, grantedValue: 16, reconciling: false })
    },
  },
  repository: createCanonicalSam31PrivateQualificationCapacityRepository({
    objectPort: memoryObjectPort(new Map()),
  }),
  now: () => observedAt,
}).observeAndPersist({ observationId: 'sam31-production-capacity-ready' })
assert.equal(production.privateSequentialCapacityReady, true)
assert.equal(production.productionConcurrencyCapacityReady, true)
assert.equal(production.productionCapacityStatus,
  'production_concurrency_capacity_ready')

const legacyProductionAggregate =
  await createCanonicalSam31CompleteSourceCapacityOwner({
    a100QuotaReadPort: { async rereadCurrent() { return currentA100 } },
    l4QuotaReadPort: { async rereadCurrent() { return currentL4 } },
    repository: createCanonicalSam31CompleteSourceCapacityRepository({
      objectPort: memoryObjectPort(new Map()),
    }),
    now: () => observedAt,
  }).observeAndPersist({
    observationId: 'sam31-production-capacity-remains-pending',
  })
assert.equal(legacyProductionAggregate.completeSourceExecutionCapacityReady,
  false)

assert.throws(() =>
  assertCanonicalSam31PrivateQualificationCapacityObservation({
    ...current,
    privateSequentialCapacityReady: false,
  }))
assert.throws(() =>
  assertCanonicalSam31PrivateQualificationCapacityObservation(
    current,
    expiresAt,
  ))

const operatorSource = readFileSync(
  'server/cli/observe-canonical-sam3_1-private-qualification-capacity.ts',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
assert.match(operatorSource,
  /observe-weeditpro-sam31-private-qualification-capacity-v1/u)
assert.match(operatorSource, /createWeEditProGcpLocalOperatorAuth/u)
assert.equal(
  packageJson.scripts?.['observe:sam3_1-private-qualification-capacity'],
  'tsx server/cli/observe-canonical-sam3_1-private-qualification-capacity.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-qualification-capacity-owner',
  checks: 35,
  currentPrivateQualificationCapacityReady:
    current.privateSequentialCapacityReady,
  currentProductionConcurrencyCapacityReady:
    current.productionConcurrencyCapacityReady,
  currentA100GrantedCapacity: current.a100GrantedValue,
  currentL4GrantedCapacity: current.l4GrantedValue,
  quotaPreferenceReconciliationBlocksCurrentQualification: false,
  privateCapacityGrantsProductionAuthority: false,
  qualificationExecutionStarted: current.gpuJobStarted,
}))

function a100(input: {
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
    quotaPreferenceId:
      'weeditpro-vertex-serving-a100-80gb-us-central1-1',
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

function l4(input: {
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
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
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
