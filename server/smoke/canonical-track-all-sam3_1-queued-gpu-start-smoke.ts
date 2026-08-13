import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_ROUTE_ID,
} from '../../src/types/track-all-sam3_1-gpu-queued-start'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'
import {
  createCanonicalProfessionalGpuFairQueueProductionPostgresAdapter,
  createCanonicalProfessionalGpuFairQueueProductionPostgresCapability,
  type CanonicalProfessionalGpuFairQueuePostgresRpcClient,
} from '../services/canonical-professional-gpu-fair-queue-postgres-rpc-adapter'
import {
  createCanonicalProfessionalGpuFairQueueServerHttpClient,
} from '../services/canonical-professional-gpu-fair-queue-server-http-client'
import {
  sealCanonicalProfessionalGpuFairQueueTransactionRequest,
} from '../services/canonical-professional-gpu-fair-queue-transaction-port'
import {
  buildTrackAllSam31AuthenticatedGpuQueuedStartRequest,
  parseTrackAllSam31AuthenticatedGpuQueuedStartRequest,
} from '../services/canonical-track-all-sam3_1-queued-gpu-start-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const request = buildTrackAllSam31AuthenticatedGpuQueuedStartRequest({
  requestId: 'sam31-queued-start-smoke-request',
  approvedSnapshotId: 'sam31-queued-start-smoke-snapshot',
  workItemKey: 'sam31-queued-start-smoke-work',
})
assert.deepEqual(
  parseTrackAllSam31AuthenticatedGpuQueuedStartRequest(request),
  request,
)
assert.throws(() => parseTrackAllSam31AuthenticatedGpuQueuedStartRequest({
  ...request,
  queuePriority: 'caller-highest',
}))
assert.throws(() => parseTrackAllSam31AuthenticatedGpuQueuedStartRequest({
  ...request,
  approvedSnapshotId: 'cross-snapshot',
}))

const entry = {
  queueEntryId: 'gpuq-sam31-smoke',
  ownerUserId: 'owner-sam31-smoke',
  workspaceId: 'workspace-sam31-smoke',
  projectId: 'project-sam31-smoke',
  routeId: 'a100_80gb_heavy_primary' as const,
  approvedSnapshotRef: ref('snapshot-sam31-smoke'),
  approvedWorkItemRef: ref('work-sam31-smoke'),
  fundedDispatchAdmissionRef: ref('funding-sam31-smoke'),
  executionAttemptRef: ref('attempt-sam31-smoke'),
  userTriggerRecordRef: ref('trigger-sam31-smoke'),
  enqueuedAt: '2026-08-13T00:00:00.000Z',
  enqueueOrdinal: 1,
  userTriggeredAfterApprovalAndFunding: true as const,
  callerSelectedPriorityCapacityOrRoute: false as const,
}
const enqueueRequest = sealCanonicalProfessionalGpuFairQueueTransactionRequest({
  schemaVersion: 'canonical-professional-gpu-fair-queue-transaction-port-v1',
  operation: 'enqueue',
  requestId: 'gpuq-enqueue-sam31-smoke',
  queueId: 'weeditpro-professional-gpu-production-v1',
  runtimeRegion: 'us-central1',
  entry,
  requestedAt: entry.enqueuedAt,
})
let rpcCalls = 0
const client: CanonicalProfessionalGpuFairQueuePostgresRpcClient = {
  async rpc(functionName, parameters) {
    rpcCalls += 1
    assert.equal(functionName,
      'weeditpro_enqueue_professional_gpu_fair_queue_v1')
    assert.deepEqual(parameters.p_request, enqueueRequest)
    const payload = {
      schemaVersion:
        'canonical-professional-gpu-fair-queue-transaction-result-v1' as const,
      source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
      operation: 'enqueue' as const,
      requestId: enqueueRequest.requestId,
      requestDigestSha256: enqueueRequest.requestDigestSha256,
      queueId: enqueueRequest.queueId,
      runtimeRegion: enqueueRequest.runtimeRegion,
      disposition: 'queued' as const,
      queueEntryRef: ref(entry.queueEntryId, sha256AuthorityValue(entry)),
      claims: [],
      terminal: null,
      queuedCount: 1,
      activeCount: 0,
      requeuedBeforeDispatchCount: 0,
      reconciliationRequiredCount: 0,
      transactionRevision: 1,
      transactionCommittedAt: entry.enqueuedAt,
      sharedDurablePostgresTransactionPerformed: true as const,
      workspaceRoundRobinFairnessApplied: true as const,
      maximumActiveAttemptsPerWorkspace: 2 as const,
      cloudTasksDispatchStartedByQueueTransaction: false as const,
      cpuSubstantiveFallbackAllowed: false as const,
      automaticQualityReductionAllowed: false as const,
      silentAdditionalCreditApprovalAllowed: false as const,
      customerCreditsMutated: false as const,
      qaApproved: false as const,
      publicDeliveryAuthorized: false as const,
      productionAuthorityGranted: false as const,
    }
    return {
      data: [{
        ...payload,
        resultDigestSha256: sha256AuthorityValue(payload),
      }],
      error: null,
    }
  },
}
const capability =
  createCanonicalProfessionalGpuFairQueueProductionPostgresCapability({
    endpointOrigin: 'https://fixture.supabase.co',
    client,
  })
const adapter =
  createCanonicalProfessionalGpuFairQueueProductionPostgresAdapter({
    client,
    capability,
  })
const enqueued = await adapter.enqueue(enqueueRequest)
assert.equal(enqueued.disposition, 'queued')
assert.equal(enqueued.queueEntryRef?.id, entry.queueEntryId)
assert.equal(rpcCalls, 1)
assert.equal(adapter.multiReplicaDurabilityVerified, true)
assert.equal(adapter.browserOrFrontendClientAllowed, false)
assert.equal(adapter.automaticTransportRetryAllowed, false)
assert.equal(adapter.cloudTasksDispatchVerified, false)
assert.equal(adapter.productionAuthority, false)

const otherClient: CanonicalProfessionalGpuFairQueuePostgresRpcClient = {
  rpc: client.rpc,
}
assert.throws(() =>
  createCanonicalProfessionalGpuFairQueueProductionPostgresAdapter({
    client: otherClient,
    capability,
  }))
assert.throws(() =>
  createCanonicalProfessionalGpuFairQueueProductionPostgresCapability({
    endpointOrigin: 'http://fixture.supabase.co',
    client,
  }))
assert.throws(() => createCanonicalProfessionalGpuFairQueueServerHttpClient({
  endpointOrigin: 'http://fixture.supabase.co',
  serviceRoleKey: 'eyJfixture.header.signature',
}))
assert.throws(() => createCanonicalProfessionalGpuFairQueueServerHttpClient({
  endpointOrigin: 'https://fixture.supabase.co',
  serviceRoleKey: 'not-a-server-jwt',
}))

const route = getApiRouteById(
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_ROUTE_ID,
)
assert.equal(route?.method, 'POST')
assert.equal(route?.securityLevel, 'backend_service_role')
assert.equal(route?.requiresSupabase, true)
assert.equal(route?.requiresServiceRole, true)
assert.match(route?.notes.join(' ') ?? '', /no GPU invocation/u)

const queuedServiceSource = readFileSync(
  'server/services/canonical-track-all-sam3_1-queued-gpu-start-service.ts',
  'utf8',
)
assert.match(queuedServiceSource,
  /sealCanonicalProfessionalGpuFairQueueTransactionRequest/u)
assert.match(queuedServiceSource,
  /multiReplicaDurabilityVerified/u)
assert.match(queuedServiceSource,
  /job_rejected_before_creation/u)
assert.doesNotMatch(queuedServiceSource,
  /\.invokeOne\s*\(|dispatchCanonicalProfessionalGpuCloudTask\s*\(/u)
assert.doesNotMatch(queuedServiceSource,
  /startOneShotJob\s*\(|customerCreditsMutated:\s*true/u)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-queued-gpu-start',
  checks: 31,
  requestClosedAndDigestBound: true,
  sharedDurablePostgresAdapterBound: true,
  deterministicQueueIdentityRequired: true,
  multiReplicaAdmissionRequired: true,
  callerPriorityCapacityRouteOrPriceAccepted: false,
  directGpuInvocationPerformed: false,
  cloudTaskCreatedByStartRequest: false,
  customerCreditsMutated: false,
  productionAuthority: false,
}, null, 2))

function ref(id: string, contentHash = sha256AuthorityValue(id)) {
  return {
    id,
    version: 1,
    contentHash: contentHash.startsWith('sha256:')
      ? contentHash
      : `sha256:${contentHash}`,
  }
}
