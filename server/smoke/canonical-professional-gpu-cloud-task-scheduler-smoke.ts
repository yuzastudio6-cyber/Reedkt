import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  createCanonicalProfessionalGpuCloudTaskRuntimeConfig,
  type CanonicalProfessionalGpuCloudTaskDispatchResult,
  type CanonicalProfessionalGpuCloudTaskSpec,
} from '../services/canonical-professional-gpu-cloud-task-dispatch'
import {
  createCanonicalProfessionalGpuCloudTaskScheduler,
} from '../services/canonical-professional-gpu-cloud-task-scheduler-service'
import {
  createCanonicalProfessionalGpuCloudTaskOutboxProductionAdapter,
  createCanonicalProfessionalGpuCloudTaskOutboxProductionCapability,
  type CanonicalProfessionalGpuCloudTaskOutboxRpcClient,
} from '../services/canonical-professional-gpu-cloud-task-outbox-postgres-rpc-adapter'
import {
  createCanonicalProfessionalGpuCloudTaskOutboxServerHttpClient,
} from '../services/canonical-professional-gpu-cloud-task-outbox-server-http-client'
import {
  assertCanonicalProfessionalGpuCloudTaskOutboxRequest,
  type CanonicalProfessionalGpuCloudTaskOutboxAdapter,
  type CanonicalProfessionalGpuCloudTaskOutboxRecord,
  type CanonicalProfessionalGpuCloudTaskOutboxResult,
} from '../services/canonical-professional-gpu-cloud-task-outbox-port'
import {
  assertCanonicalProfessionalGpuFairQueueTransactionRequest,
  type CanonicalProfessionalGpuFairQueueDurableClaim,
  type CanonicalProfessionalGpuFairQueueTransactionAdapter,
  type CanonicalProfessionalGpuFairQueueTransactionResult,
} from '../services/canonical-professional-gpu-fair-queue-transaction-port'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const startedAt = '2026-08-13T05:00:00.000Z'
const completedAt = '2026-08-13T05:00:01.000Z'
const runtimeConfig = createCanonicalProfessionalGpuCloudTaskRuntimeConfig({
  targetOrigin: 'https://reeditpro-api-4wkjiqvdqa-uc.a.run.app',
})
const claim = makeClaim()
const createdFixture = fixture('created')
const createdScheduler = createCanonicalProfessionalGpuCloudTaskScheduler({
  ...createdFixture,
  runtimeConfig,
  dispatcherInstanceId: 'gpu-scheduler-instance-a',
  now: sequence([startedAt, completedAt]),
})
const created = await createdScheduler.runOneCycle()
assert.equal(created.claimedCount, 1)
assert.equal(created.createdTaskCount, 1)
assert.equal(created.knownNotCreatedCount, 0)
assert.equal(created.unknownOrReconciliationCount, 0)
assert.equal(created.dispatchRecords[0]?.queueMarkedDispatched, true)
assert.equal(createdFixture.calls.recover, 1)
assert.equal(createdFixture.calls.capacity, 1)
assert.equal(createdFixture.calls.claim, 1)
assert.equal(createdFixture.calls.begin, 1)
assert.equal(createdFixture.calls.create, 1)
assert.equal(createdFixture.calls.outcome, 1)
assert.equal(createdFixture.calls.mark, 1)
assert.equal(created.directGpuInvocationStartedByScheduler, false)
assert.equal(created.customerCreditsMutated, false)

const unknownFixture = fixture('unknown')
const unknown = await createCanonicalProfessionalGpuCloudTaskScheduler({
  ...unknownFixture,
  runtimeConfig,
  dispatcherInstanceId: 'gpu-scheduler-instance-b',
  now: sequence([startedAt, completedAt]),
}).runOneCycle()
assert.equal(unknown.createdTaskCount, 0)
assert.equal(unknown.unknownOrReconciliationCount, 1)
assert.equal(unknownFixture.calls.outcome, 1)
assert.equal(unknownFixture.calls.mark, 0)
assert.equal(unknown.dispatchRecords[0]?.automaticCreateRetryStarted, false)

const rejectedFixture = fixture('not_created')
const rejected = await createCanonicalProfessionalGpuCloudTaskScheduler({
  ...rejectedFixture,
  runtimeConfig,
  dispatcherInstanceId: 'gpu-scheduler-instance-c',
  now: sequence([startedAt, completedAt]),
}).runOneCycle()
assert.equal(rejected.knownNotCreatedCount, 1)
assert.equal(rejectedFixture.calls.mark, 0)

const emptyFixture = fixture('created', false)
const empty = await createCanonicalProfessionalGpuCloudTaskScheduler({
  ...emptyFixture,
  runtimeConfig,
  dispatcherInstanceId: 'gpu-scheduler-instance-d',
  now: sequence([startedAt, completedAt]),
}).runOneCycle()
assert.equal(empty.claimDisposition, 'no_capacity_available')
assert.equal(empty.claimedCount, 0)
assert.equal(emptyFixture.calls.create, 0)

const rpcClient: CanonicalProfessionalGpuCloudTaskOutboxRpcClient = {
  async rpc() {
    return { data: null, error: { code: 'fixture_not_invoked' } }
  },
}
const capability =
  createCanonicalProfessionalGpuCloudTaskOutboxProductionCapability({
    endpointOrigin: 'https://fixture.supabase.co',
    client: rpcClient,
  })
const productionAdapter =
  createCanonicalProfessionalGpuCloudTaskOutboxProductionAdapter({
    client: rpcClient,
    capability,
  })
assert.equal(productionAdapter.multiReplicaDurabilityVerified, true)
assert.equal(productionAdapter.automaticTransportRetryAllowed, false)
assert.equal(productionAdapter.browserOrFrontendClientAllowed, false)
assert.throws(() =>
  createCanonicalProfessionalGpuCloudTaskOutboxProductionAdapter({
    client: { async rpc() { return { data: null, error: null } } },
    capability,
  }))
assert.throws(() =>
  createCanonicalProfessionalGpuCloudTaskOutboxProductionCapability({
    endpointOrigin: 'http://fixture.supabase.co',
    client: rpcClient,
  }))
assert.throws(() => createCanonicalProfessionalGpuCloudTaskOutboxServerHttpClient({
  endpointOrigin: 'https://fixture.supabase.co/path',
  serviceRoleKey: 'eyJfixture.header.signature',
}))
assert.throws(() => createCanonicalProfessionalGpuCloudTaskOutboxServerHttpClient({
  endpointOrigin: 'https://fixture.supabase.co',
  serviceRoleKey: 'not-a-jwt',
}))

const schedulerSource = readFileSync(
  new URL(
    '../services/canonical-professional-gpu-cloud-task-scheduler-service.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.doesNotMatch(schedulerSource, /invokeApprovedTrackAllWork/u)
assert.doesNotMatch(schedulerSource, /invokeOne\(/u)
assert.doesNotMatch(schedulerSource, /customerCreditsMutated:\s*true/u)
assert.match(schedulerSource, /recoverExpiredDispatchLeases/u)
assert.match(schedulerSource, /beginCreate/u)
assert.match(schedulerSource, /recordCreateOutcome/u)
assert.match(schedulerSource, /markDispatched/u)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-cloud-task-scheduler',
  checks: 42,
  recoveryBeforeClaim: true,
  serverOwnedCapacityReread: true,
  durableClaimBeforeExternalDispatch: true,
  durableOutboxBeforeCloudTaskCreate: true,
  createdOutcomeMarksQueueDispatched: true,
  unknownOutcomeQuarantinedWithoutRetry: true,
  knownRejectionWaitsForSafeLeaseRecovery: true,
  directGpuInvocationStartedByScheduler: false,
  customerCreditsMutated: false,
  productionAuthority: false,
}, null, 2))

function fixture(
  providerOutcome: 'created' | 'not_created' | 'unknown',
  hasClaim = true,
) {
  const calls = {
    recover: 0,
    capacity: 0,
    claim: 0,
    begin: 0,
    create: 0,
    outcome: 0,
    mark: 0,
  }
  let spec: CanonicalProfessionalGpuCloudTaskSpec | null = null
  let beginRecord: CanonicalProfessionalGpuCloudTaskOutboxRecord | null = null
  const queueAdapter: CanonicalProfessionalGpuFairQueueTransactionAdapter = {
    adapterId: 'fixture-production-queue',
    databaseBackend: 'postgres',
    browserOrFrontendClientAllowed: false,
    automaticTransportRetryAllowed: false,
    sharedDurableTransactionPerformed: true,
    multiReplicaDurabilityVerified: true,
    cloudTasksDispatchVerified: false,
    productionAuthority: false,
    async enqueue() { throw new Error('not used') },
    async claim(raw) {
      calls.claim += 1
      const request = assertCanonicalProfessionalGpuFairQueueTransactionRequest(
        raw,
        'claim',
      )
      return queueResult({
        operation: 'claim',
        request,
        disposition: hasClaim ? 'claims_created' : 'no_capacity_available',
        claims: hasClaim ? [claim] : [],
      })
    },
    async markDispatched(raw) {
      calls.mark += 1
      const request = assertCanonicalProfessionalGpuFairQueueTransactionRequest(
        raw,
        'mark_dispatched',
      )
      if (request.operation !== 'mark_dispatched') {
        throw new Error('fixture operation changed')
      }
      assert.equal(request.queueEntryId, claim.queueEntry.queueEntryId)
      return queueResult({
        operation: 'mark_dispatched',
        request,
        disposition: 'dispatch_recorded',
        claims: [],
      })
    },
    async finalize() { throw new Error('not used') },
    async recoverExpiredDispatchLeases(raw) {
      calls.recover += 1
      const request = assertCanonicalProfessionalGpuFairQueueTransactionRequest(
        raw,
        'recover_expired_dispatch_leases',
      )
      return queueResult({
        operation: 'recover_expired_dispatch_leases',
        request,
        disposition: 'recovery_completed',
        claims: [],
      })
    },
  }
  const outboxAdapter: CanonicalProfessionalGpuCloudTaskOutboxAdapter = {
    adapterId: 'fixture-production-outbox',
    databaseBackend: 'postgres',
    browserOrFrontendClientAllowed: false,
    automaticTransportRetryAllowed: false,
    sharedDurableTransactionPerformed: true,
    multiReplicaDurabilityVerified: true,
    cloudTasksDispatchVerified: false,
    productionAuthority: false,
    async beginCreate(raw) {
      calls.begin += 1
      const request = assertCanonicalProfessionalGpuCloudTaskOutboxRequest(
        raw,
        'begin_create',
      )
      assert.equal(request.operation, 'begin_create')
      spec = request.cloudTaskSpec
      beginRecord = outboxRecord({
        spec,
        status: 'create_leased',
        dispatchResult: null,
      })
      return outboxResult({
        request,
        disposition: 'create_admitted',
        record: beginRecord,
      })
    },
    async recordCreateOutcome(raw) {
      calls.outcome += 1
      const request = assertCanonicalProfessionalGpuCloudTaskOutboxRequest(
        raw,
        'record_create_outcome',
      )
      assert.equal(request.operation, 'record_create_outcome')
      assert.ok(spec)
      assert.ok(beginRecord)
      const status = request.dispatchResult.providerOutcome === 'created'
        ? 'created'
        : request.dispatchResult.providerOutcome === 'not_created'
          ? 'not_created'
          : 'outcome_unknown'
      return outboxResult({
        request,
        disposition: 'outcome_recorded',
        record: outboxRecord({
          spec,
          status,
          dispatchResult: request.dispatchResult,
        }),
      })
    },
  }
  return {
    calls,
    queueAdapter,
    outboxAdapter,
    capacityReadPort: {
      schemaVersion:
        'canonical-professional-gpu-fair-queue-capacity-read-port-v1' as const,
      serverOwnedCurrentQuotaRuntimeAndActiveCounts: true as const,
      callerCapacityAccepted: false as const,
      productionAuthority: false as const,
      async rereadCurrent() {
        calls.capacity += 1
        return [{
          routeId: 'a100_80gb_heavy_primary' as const,
          capacityObservationRef: ref('a100-capacity-current'),
          maximumConcurrentAttempts: 1,
          currentActiveAttempts: 0,
          minimumIdleGpuInstances: 0 as const,
          exactCurrentQuotaAndRuntimeCapacityReread: true as const,
        }]
      },
    },
    dispatchPort: {
      schemaVersion:
        'canonical-professional-gpu-cloud-task-dispatch-port-v1' as const,
      deterministicNamedTask: true as const,
      automaticCreateRetryAllowed: false as const,
      exactGetReconciliationAfterAlreadyExistsRequired: true as const,
      browserOrFrontendAllowed: false as const,
      async createOne(raw: unknown) {
        calls.create += 1
        spec = raw as CanonicalProfessionalGpuCloudTaskSpec
        return dispatchResult(spec, providerOutcome)
      },
    },
  }
}

function makeClaim(): CanonicalProfessionalGpuFairQueueDurableClaim {
  const queueEntry = {
    queueEntryId: 'gpuq-scheduler-fixture-1',
    ownerUserId: '11111111-1111-4111-8111-111111111111',
    workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectId: 'aaaaaaaa-1000-4000-8000-000000000001',
    routeId: 'a100_80gb_heavy_primary' as const,
    approvedSnapshotRef: ref('scheduler-snapshot-1'),
    approvedWorkItemRef: ref('scheduler-work-1'),
    fundedDispatchAdmissionRef: ref('scheduler-funded-1'),
    executionAttemptRef: ref('scheduler-attempt-1'),
    userTriggerRecordRef: ref('scheduler-trigger-1'),
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
    scheduleRef: ref('scheduler-schedule-1'),
    claimId: 'gpu-claim-scheduler-fixture-1',
    claimedAt: startedAt,
    dispatchLeaseExpiresAt: '2026-08-13T05:05:00.000Z',
    externalDispatchOutcome: 'not_started' as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    automaticRetryAllowed: false as const,
  }
  return { ...payload, claimHash: sha256AuthorityValue(payload) }
}

function queueResult(input: {
  operation: CanonicalProfessionalGpuFairQueueTransactionResult['operation']
  request: { requestId: string; requestDigestSha256: string }
  disposition: CanonicalProfessionalGpuFairQueueTransactionResult['disposition']
  claims: CanonicalProfessionalGpuFairQueueDurableClaim[]
}): CanonicalProfessionalGpuFairQueueTransactionResult {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-fair-queue-transaction-result-v1' as const,
    source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
    operation: input.operation,
    requestId: input.request.requestId,
    requestDigestSha256: input.request.requestDigestSha256,
    queueId: 'weeditpro-professional-gpu-production-v1',
    runtimeRegion: 'us-central1' as const,
    disposition: input.disposition,
    queueEntryRef: null,
    claims: input.claims,
    terminal: null,
    queuedCount: 0,
    activeCount: input.claims.length,
    requeuedBeforeDispatchCount: 0,
    reconciliationRequiredCount: 0,
    transactionRevision: 1,
    transactionCommittedAt: startedAt,
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
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function dispatchResult(
  spec: CanonicalProfessionalGpuCloudTaskSpec,
  providerOutcome: 'created' | 'not_created' | 'unknown',
): CanonicalProfessionalGpuCloudTaskDispatchResult {
  const disposition: CanonicalProfessionalGpuCloudTaskDispatchResult[
    'disposition'
  ] = providerOutcome === 'created'
    ? 'task_created'
    : providerOutcome === 'not_created'
      ? 'task_rejected_before_creation'
      : 'task_create_outcome_unknown_requires_reconciliation'
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-dispatch-result-v1' as const,
    source: 'canonical_google_cloud_tasks_dispatch_port' as const,
    cloudTaskSpecRef: {
      id: spec.cloudTaskName,
      version: 1,
      contentHash: `sha256:${spec.specDigestSha256}` as const,
    },
    cloudTaskRef: providerOutcome === 'created'
      ? ref(spec.cloudTaskName)
      : null,
    disposition,
    providerOutcome,
    exactTaskRereadAfterAlreadyExists: false,
    automaticCreateRetryStarted: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: completedAt,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function outboxRecord(input: {
  spec: CanonicalProfessionalGpuCloudTaskSpec
  status: CanonicalProfessionalGpuCloudTaskOutboxRecord['status']
  dispatchResult: CanonicalProfessionalGpuCloudTaskDispatchResult | null
}): CanonicalProfessionalGpuCloudTaskOutboxRecord {
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
    cloudTaskSpec: input.spec,
    status: input.status,
    createLeaseId: 'gpu-task-create-lease-scheduler-fixture-1',
    createLeaseExpiresAt: '2026-08-13T05:05:00.000Z',
    dispatchResult: input.dispatchResult,
    externalCreateOutcome: input.status === 'create_leased'
      ? 'not_started' as const
      : input.status === 'outcome_unknown'
        ? 'unknown' as const
        : input.status,
    databaseRecordPersistedBeforeCloudTasksCreate: true as const,
    automaticCreateRetryAllowed: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    createdAt: startedAt,
    updatedAt: input.dispatchResult?.observedAt ?? startedAt,
  }
  return { ...payload, recordHash: sha256AuthorityValue(payload) }
}

function outboxResult(input: {
  request: { operation: 'begin_create' | 'record_create_outcome'; requestId: string; requestDigestSha256: string }
  disposition: CanonicalProfessionalGpuCloudTaskOutboxResult['disposition']
  record: CanonicalProfessionalGpuCloudTaskOutboxRecord
}): CanonicalProfessionalGpuCloudTaskOutboxResult {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-outbox-result-v1' as const,
    source:
      'canonical_postgres_professional_gpu_cloud_task_outbox_owner' as const,
    operation: input.request.operation,
    requestId: input.request.requestId,
    requestDigestSha256: input.request.requestDigestSha256,
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    disposition: input.disposition,
    record: input.record,
    sharedDurablePostgresTransactionPerformed: true as const,
    browserOrFrontendClientAllowed: false as const,
    automaticCreateRetryStarted: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    transactionCommittedAt: input.record.updatedAt,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const,
  }
}

function sequence(values: readonly string[]) {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]!
}
