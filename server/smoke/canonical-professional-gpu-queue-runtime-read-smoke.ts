import assert from 'node:assert/strict'

import {
  compileCanonicalProfessionalGpuCloudTaskSpec,
  createCanonicalProfessionalGpuCloudTaskRuntimeConfig,
  type CanonicalProfessionalGpuCloudTaskDispatchResult,
} from '../services/canonical-professional-gpu-cloud-task-dispatch'
import type {
  CanonicalProfessionalGpuCloudTaskOutboxRecord,
} from '../services/canonical-professional-gpu-cloud-task-outbox-port'
import {
  assertCanonicalProfessionalGpuQueueConsumptionBootstrap,
  assertCanonicalProfessionalGpuQueueDeliveryConsumption,
  assertCanonicalProfessionalGpuQueueRuntimeState,
  createCanonicalProfessionalGpuQueueRuntimeReadPort,
  createCanonicalSam31ProductionGpuQueueCapacityReadPort,
  type CanonicalProfessionalGpuQueueRuntimeReadRpcClient,
} from '../services/canonical-professional-gpu-queue-runtime-read-port'
import {
  createCanonicalProfessionalGpuQueueRuntimeReadServerHttpClient,
} from '../services/canonical-professional-gpu-queue-runtime-read-server-http-client'
import type {
  CanonicalProfessionalGpuFairQueueDurableClaim,
} from '../services/canonical-professional-gpu-fair-queue-transaction-port'
import {
  sealCanonicalSam31A100ServingCompleteSourceCapacityObservation,
  sealCanonicalSam31L4CompleteSourceCapacityObservation,
} from '../services/canonical-sam3_1-complete-source-capacity-owner'
import {
  sealCanonicalSam31VertexServingCapacityObservation,
} from '../services/canonical-sam3_1-vertex-serving-capacity-mutation'
import {
  CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
  CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
  CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
} from '../edit-architecture/canonical-sam3_1-vertex-current-serving-release'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const observedAt = '2026-08-13T05:00:00.000Z'
const statePayload = {
  schemaVersion: 'canonical-professional-gpu-queue-runtime-state-v1' as const,
  source: 'canonical_postgres_professional_gpu_queue_read_owner' as const,
  queueId: 'weeditpro-professional-gpu-production-v1' as const,
  runtimeRegion: 'us-central1' as const,
  controlRevision: 7,
  routeStates: [
    {
      routeId: 'a100_80gb_heavy_primary' as const,
      queuedCount: 12,
      activeCount: 0,
    },
    {
      routeId: 'l4_heavy_fallback' as const,
      queuedCount: 0,
      activeCount: 0,
    },
    {
      routeId: 'l4_standard_primary' as const,
      queuedCount: 3,
      activeCount: 1,
    },
  ] as const,
  queuedCount: 15,
  activeCount: 1,
  exactSharedPostgresStateReread: true as const,
  callerCapacityAccepted: false as const,
  customerCreditsMutated: false as const,
  productionAuthorityGranted: false as const,
  observedAt,
}
const state = assertCanonicalProfessionalGpuQueueRuntimeState({
  ...statePayload,
  stateHash: sha256AuthorityValue(statePayload),
})
assert.equal(state.routeStates[0].queuedCount, 12)
assert.equal(state.routeStates[2].activeCount, 1)
assert.throws(() => assertCanonicalProfessionalGpuQueueRuntimeState({
  ...state,
  queuedCount: 14,
}))

const claim = makeClaim()
const spec = compileCanonicalProfessionalGpuCloudTaskSpec({
  claim,
  runtimeConfig: createCanonicalProfessionalGpuCloudTaskRuntimeConfig({
    targetOrigin: 'https://reeditpro-api-4wkjiqvdqa-uc.a.run.app',
  }),
  compiledAt: observedAt,
})
const dispatchResult = makeDispatchResult(spec)
const outboxRecord = makeOutboxRecord(spec, dispatchResult)
const consumptionPayload = {
  schemaVersion:
    'canonical-professional-gpu-queue-consumption-bootstrap-v1' as const,
  source: 'canonical_postgres_professional_gpu_queue_read_owner' as const,
  queueId: 'weeditpro-professional-gpu-production-v1' as const,
  runtimeRegion: 'us-central1' as const,
  queueEntryStatus: 'dispatched' as const,
  claim,
  outboxRecord,
  exactDispatchedClaimAndCreatedTaskReread: true as const,
  browserOrCallerExecutionMaterialAccepted: false as const,
  customerCreditsMutated: false as const,
  productionAuthorityGranted: false as const,
  observedAt,
}
const consumption = assertCanonicalProfessionalGpuQueueConsumptionBootstrap({
  ...consumptionPayload,
  consumptionHash: sha256AuthorityValue(consumptionPayload),
})
assert.equal(consumption.claim.claimId, claim.claimId)
assert.equal(consumption.outboxRecord.status, 'created')
assert.throws(() => assertCanonicalProfessionalGpuQueueConsumptionBootstrap({
  ...consumption,
  claim: {
    ...claim,
    claimId: 'substituted-claim',
  },
}))

const deliveryPayload = {
  schemaVersion:
    'canonical-professional-gpu-queue-delivery-consumption-v2' as const,
  source: 'canonical_postgres_professional_gpu_queue_read_owner' as const,
  queueId: 'weeditpro-professional-gpu-production-v1' as const,
  runtimeRegion: 'us-central1' as const,
  queueEntryStatus: 'dispatched' as const,
  claim,
  outboxRecord,
  terminal: null,
  exactClaimCreatedTaskAndTerminalReread: true as const,
  browserOrCallerExecutionMaterialAccepted: false as const,
  customerCreditsMutated: false as const,
  productionAuthorityGranted: false as const,
  observedAt,
}
const delivery = assertCanonicalProfessionalGpuQueueDeliveryConsumption({
  ...deliveryPayload,
  consumptionHash: sha256AuthorityValue(deliveryPayload),
})
assert.equal(delivery.queueEntryStatus, 'dispatched')
assert.equal(delivery.terminal, null)

const terminalPayload = {
  schemaVersion:
    'canonical-professional-gpu-fair-queue-durable-terminal-v1' as const,
  source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
  queueId: 'weeditpro-professional-gpu-production-v1',
  runtimeRegion: 'us-central1' as const,
  queueEntryRef: ref(claim.queueEntry.queueEntryId),
  executionAttemptRef: claim.queueEntry.executionAttemptRef,
  claimRef: {
    id: claim.claimId,
    version: 1,
    contentHash: `sha256:${claim.claimHash}` as const,
  },
  terminalEvidenceRef: ref('runtime-read-terminal-evidence'),
  disposition: 'completed' as const,
  terminalAt: '2026-08-13T05:01:00.000Z',
  automaticRetryStarted: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
}
const terminal = {
  ...terminalPayload,
  terminalHash: sha256AuthorityValue(terminalPayload),
}
const terminalDeliveryPayload = {
  ...deliveryPayload,
  queueEntryStatus: 'completed' as const,
  terminal,
}
const terminalDelivery =
  assertCanonicalProfessionalGpuQueueDeliveryConsumption({
    ...terminalDeliveryPayload,
    consumptionHash: sha256AuthorityValue(terminalDeliveryPayload),
  })
assert.equal(terminalDelivery.terminal?.disposition, 'completed')
assert.throws(() => assertCanonicalProfessionalGpuQueueDeliveryConsumption({
  ...terminalDelivery,
  queueEntryStatus: 'failed_reconciled',
}))

const calls: string[] = []
const client: CanonicalProfessionalGpuQueueRuntimeReadRpcClient = {
  async rpc(functionName) {
    calls.push(functionName)
    return functionName.endsWith('_runtime_state_v1')
      ? { data: state, error: null }
      : functionName.endsWith('_delivery_consumption_v2')
        ? { data: delivery, error: null }
        : { data: consumption, error: null }
  },
}
const readPort = createCanonicalProfessionalGpuQueueRuntimeReadPort({ client })
assert.equal((await readPort.readState({
  queueId: 'weeditpro-professional-gpu-production-v1',
  runtimeRegion: 'us-central1',
})).stateHash, state.stateHash)
assert.equal((await readPort.readConsumption({
  queueId: 'weeditpro-professional-gpu-production-v1',
  runtimeRegion: 'us-central1',
  claimId: claim.claimId,
}))?.consumptionHash, consumption.consumptionHash)
assert.equal((await readPort.readDeliveryConsumption({
  queueId: 'weeditpro-professional-gpu-production-v1',
  runtimeRegion: 'us-central1',
  claimId: claim.claimId,
}))?.consumptionHash, delivery.consumptionHash)
assert.deepEqual(calls, [
  'weeditpro_read_professional_gpu_queue_runtime_state_v1',
  'weeditpro_read_professional_gpu_queue_consumption_v1',
  'weeditpro_read_professional_gpu_queue_delivery_consumption_v2',
])

const quota = sealCanonicalSam31A100ServingCompleteSourceCapacityObservation({
  schemaVersion:
    'canonical-sam3_1-a100-serving-complete-source-capacity-observation-v1',
  source: 'canonical_server_vertex_a100_serving_quota_observation_owner',
  evidenceClass: 'canonical_private_reread',
  projectId: 'reeditpro',
  region: 'us-central1',
  quotaPreferenceId: 'weeditpro-vertex-serving-a100-80gb-us-central1-1',
  quotaId: 'CustomModelServingA10080GBGPUsPerProjectPerRegion',
  preferredValue: 2,
  grantedValue: 2,
  reconciling: false,
  exactCloudQuotaPreferenceAndQuotaInfoReread: true,
  vertexCustomJobTrainingQuotaAcceptedAsServingCapacity: false,
  minimumReplicaCount: 0,
  maximumRequestConcurrencyPerReplica: 1,
  endpointOrGpuJobStarted: false,
  customerCreditsMutated: false,
  observedAt: '2026-08-13T05:00:00.100Z',
  expiresAt: '2026-08-13T05:15:00.100Z',
})
const endpointCapacity =
  sealCanonicalSam31VertexServingCapacityObservation({
    schemaVersion:
      'canonical-sam3_1-vertex-serving-capacity-observation-v1',
    source: 'canonical_server_vertex_current_serving_capacity_reader',
    evidenceClass: 'canonical_private_reread',
    endpointResourceName:
      CANONICAL_SAM3_1_VERTEX_CURRENT_ENDPOINT_RESOURCE,
    deployedModelId: CANONICAL_SAM3_1_VERTEX_CURRENT_DEPLOYED_MODEL_ID,
    modelVersionId: CANONICAL_SAM3_1_VERTEX_CURRENT_MODEL_VERSION_ID,
    routeId: 'a100_80gb_heavy_primary',
    accelerator: 'nvidia_a100_80gb',
    acceleratorCount: 1,
    minimumReplicaCount: 0,
    initialReplicaCount: 1,
    maximumReplicaCount: 1,
    requiredMaximumReplicaCount: 16,
    minimumScaleUpPeriodSeconds: 300,
    idleScaleDownPeriodSeconds: 300,
    dedicatedEndpointEnabled: true,
    oneExactDeployedModel: true,
    exactTrafficSplitPercent: 100,
    requestResponseLoggingEnabled: false,
    containerLoggingEnabled: false,
    exactCurrentEndpointModelVersionTrafficAndCapacityReread: true,
    currentEndpointMeetsCompleteSourceCapacity: false,
    endpointOrGpuJobStarted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
    observedAt,
    expiresAt: '2026-08-13T05:15:00.000Z',
  })
const l4Quota = sealCanonicalSam31L4CompleteSourceCapacityObservation({
  schemaVersion:
    'canonical-sam3_1-l4-complete-source-capacity-observation-v1',
  source: 'canonical_server_cloud_run_l4_quota_observation_owner',
  evidenceClass: 'canonical_private_reread',
  projectId: 'reeditpro',
  region: 'us-central1',
  quotaPreferenceId: 'weeditpro-l4-scale-zero-quality-capacity-us-central1-v1',
  quotaId: 'NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion',
  preferredValue: 3,
  grantedValue: 3,
  reconciling: false,
  exactCloudQuotaPreferenceAndQuotaInfoReread: true,
  noZonalRedundancyFallbackCapacityExplicitlyAccepted: true,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  observedAt: '2026-08-13T05:00:00.100Z',
  expiresAt: '2026-08-13T05:15:00.100Z',
})
const capacityPort = createCanonicalSam31ProductionGpuQueueCapacityReadPort({
  queueRuntimeReadPort: { async readState() { return state } },
  a100QuotaReadPort: { async rereadCurrent() { return quota } },
  a100EndpointCapacityReadPort: {
    async rereadCurrent() { return endpointCapacity },
  },
  l4QuotaReadPort: { async rereadCurrent() { return l4Quota } },
})
const capacities = await capacityPort.rereadCurrent({
  queueId: 'weeditpro-professional-gpu-production-v1',
  runtimeRegion: 'us-central1',
  observedAt,
})
assert.equal(capacities.length, 2)
assert.equal(capacities[0]?.routeId, 'a100_80gb_heavy_primary')
assert.equal(capacities[0]?.maximumConcurrentAttempts, 1)
assert.equal(capacities[0]?.minimumIdleGpuInstances, 0)
assert.equal(capacities[1]?.routeId, 'l4_standard_primary')
assert.equal(capacities[1]?.maximumConcurrentAttempts, 3)
assert.equal(capacities[1]?.currentActiveAttempts, 1)
assert.equal(capacities[1]?.minimumIdleGpuInstances, 0)
await assert.rejects(() => capacityPort.rereadCurrent({
  queueId: 'weeditpro-professional-gpu-production-v1',
  runtimeRegion: 'us-central1',
  observedAt: quota.expiresAt,
}))

assert.throws(() =>
  createCanonicalProfessionalGpuQueueRuntimeReadServerHttpClient({
    endpointOrigin: 'http://fixture.supabase.co',
    serviceRoleKey: 'eyJfixture.header.signature',
  }))
assert.throws(() =>
  createCanonicalProfessionalGpuQueueRuntimeReadServerHttpClient({
    endpointOrigin: 'https://fixture.supabase.co/path',
    serviceRoleKey: 'eyJfixture.header.signature',
  }))
assert.throws(() =>
  createCanonicalProfessionalGpuQueueRuntimeReadServerHttpClient({
    endpointOrigin: 'https://fixture.supabase.co',
    serviceRoleKey: 'not-a-jwt',
  }))

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-queue-runtime-read',
  checks: 46,
  exactSharedPostgresStateReread: true,
  exactDispatchedClaimAndCreatedTaskReread: true,
  exactDispatchedOrTerminalDeliveryReread: true,
  callerCapacityAccepted: false,
  serverOwnedA100AndL4QuotaRuntimeCapacityAndActiveCountsCombined: true,
  minimumIdleGpuInstances: 0,
  customerCreditsMutated: false,
  productionAuthority: false,
}, null, 2))

function makeClaim(): CanonicalProfessionalGpuFairQueueDurableClaim {
  const queueEntry = {
    queueEntryId: 'gpuq-runtime-read-fixture-1',
    ownerUserId: '11111111-1111-4111-8111-111111111111',
    workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectId: 'aaaaaaaa-1000-4000-8000-000000000001',
    routeId: 'a100_80gb_heavy_primary' as const,
    approvedSnapshotRef: ref('runtime-read-snapshot'),
    approvedWorkItemRef: ref('runtime-read-work'),
    fundedDispatchAdmissionRef: ref('runtime-read-funded'),
    executionAttemptRef: ref('runtime-read-attempt'),
    userTriggerRecordRef: ref('runtime-read-trigger'),
    enqueuedAt: '2026-08-13T04:59:00.000Z',
    enqueueOrdinal: 1,
    userTriggeredAfterApprovalAndFunding: true as const,
    callerSelectedPriorityCapacityOrRoute: false as const,
  }
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-fair-queue-durable-claim-v1' as const,
    source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
    queueId: 'weeditpro-professional-gpu-production-v1',
    runtimeRegion: 'us-central1' as const,
    queueEntry,
    scheduleRef: ref('runtime-read-schedule'),
    claimId: 'gpu-claim-runtime-read-fixture-1',
    claimedAt: observedAt,
    dispatchLeaseExpiresAt: '2026-08-13T05:05:00.000Z',
    externalDispatchOutcome: 'not_started' as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    automaticRetryAllowed: false as const,
  }
  return { ...payload, claimHash: sha256AuthorityValue(payload) }
}

function makeDispatchResult(
  taskSpec: ReturnType<typeof compileCanonicalProfessionalGpuCloudTaskSpec>,
): CanonicalProfessionalGpuCloudTaskDispatchResult {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-dispatch-result-v1' as const,
    source: 'canonical_google_cloud_tasks_dispatch_port' as const,
    cloudTaskSpecRef: {
      id: taskSpec.cloudTaskName,
      version: 1,
      contentHash: `sha256:${taskSpec.specDigestSha256}` as const,
    },
    cloudTaskRef: ref(taskSpec.cloudTaskName),
    disposition: 'task_created' as const,
    providerOutcome: 'created' as const,
    exactTaskRereadAfterAlreadyExists: false,
    automaticCreateRetryStarted: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function makeOutboxRecord(
  taskSpec: ReturnType<typeof compileCanonicalProfessionalGpuCloudTaskSpec>,
  dispatchResult: CanonicalProfessionalGpuCloudTaskDispatchResult,
): CanonicalProfessionalGpuCloudTaskOutboxRecord {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-outbox-record-v1' as const,
    source:
      'canonical_postgres_professional_gpu_cloud_task_outbox_owner' as const,
    outboxId: `gpu-task-outbox:${claim.claimHash}`,
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    queueEntryId: claim.queueEntry.queueEntryId,
    claimRef: {
      id: claim.claimId,
      version: 1,
      contentHash: `sha256:${claim.claimHash}` as const,
    },
    cloudTaskSpec: taskSpec,
    status: 'created' as const,
    createLeaseId: 'gpu-task-create-lease-runtime-read-fixture',
    createLeaseExpiresAt: '2026-08-13T05:05:00.000Z',
    dispatchResult,
    externalCreateOutcome: 'created' as const,
    databaseRecordPersistedBeforeCloudTasksCreate: true as const,
    automaticCreateRetryAllowed: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    createdAt: observedAt,
    updatedAt: observedAt,
  }
  return { ...payload, recordHash: sha256AuthorityValue(payload) }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const,
  }
}
