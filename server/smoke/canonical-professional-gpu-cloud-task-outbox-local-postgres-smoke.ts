import assert from 'node:assert/strict'

import type { GoogleAuth } from 'google-auth-library'

import {
  compileCanonicalProfessionalGpuCloudTaskSpec,
  createCanonicalProfessionalGpuCloudTaskRuntimeConfig,
  createGoogleCloudProfessionalGpuCloudTaskDispatchPort,
  type CanonicalProfessionalGpuCloudTaskSpec,
} from '../services/canonical-professional-gpu-cloud-task-dispatch'
import {
  createCanonicalProfessionalGpuCloudTaskOutboxLocalHttpClient,
} from '../services/canonical-professional-gpu-cloud-task-outbox-local-http-client'
import {
  createCanonicalProfessionalGpuCloudTaskOutboxLocalAdapter,
  createCanonicalProfessionalGpuCloudTaskOutboxLocalCapability,
} from '../services/canonical-professional-gpu-cloud-task-outbox-postgres-rpc-adapter'
import {
  CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
  sealCanonicalProfessionalGpuCloudTaskOutboxRequest,
} from '../services/canonical-professional-gpu-cloud-task-outbox-port'
import {
  createCanonicalProfessionalGpuFairQueueLocalHttpClient,
} from '../services/canonical-professional-gpu-fair-queue-local-http-client'
import {
  createCanonicalProfessionalGpuFairQueueLocalPostgresAdapter,
  createCanonicalProfessionalGpuFairQueueLocalPostgresCapability,
} from '../services/canonical-professional-gpu-fair-queue-postgres-rpc-adapter'
import {
  CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
  sealCanonicalProfessionalGpuFairQueueTransactionRequest,
  type CanonicalProfessionalGpuFairQueueDurableClaim,
} from '../services/canonical-professional-gpu-fair-queue-transaction-port'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const serviceRoleKey = requiredEnvironment(
  'REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY',
)
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const queueClient = createCanonicalProfessionalGpuFairQueueLocalHttpClient({
  endpointOrigin,
  serviceRoleKey,
})
const queueAdapter = createCanonicalProfessionalGpuFairQueueLocalPostgresAdapter({
  client: queueClient,
  capability: createCanonicalProfessionalGpuFairQueueLocalPostgresCapability({
    endpointOrigin,
    client: queueClient,
  }),
})
const outboxClient =
  createCanonicalProfessionalGpuCloudTaskOutboxLocalHttpClient({
    endpointOrigin,
    serviceRoleKey,
  })
const outboxAdapter = createCanonicalProfessionalGpuCloudTaskOutboxLocalAdapter({
  client: outboxClient,
  capability: createCanonicalProfessionalGpuCloudTaskOutboxLocalCapability({
    endpointOrigin,
    client: outboxClient,
  }),
})
assert.equal(outboxAdapter.databaseBackend, 'postgres')
assert.equal(outboxAdapter.sharedDurableTransactionPerformed, true)
assert.equal(outboxAdapter.multiReplicaDurabilityVerified, false)
assert.equal(outboxAdapter.cloudTasksDispatchVerified, false)
assert.equal(outboxAdapter.browserOrFrontendClientAllowed, false)
assert.equal(outboxAdapter.productionAuthority, false)

const queueId = 'weeditpro-professional-gpu-production-v1'
const runtimeRegion = 'us-central1' as const
const now = Date.now()
const baseTime = now - (now % 1000) + 2_000
const claimTime = baseTime + 10_000
const entries = [
  entry(901, 'a'),
  entry(902, 'a'),
  entry(903, 'b'),
]

for (const queueEntry of entries) {
  const result = await queueAdapter.enqueue(
    sealCanonicalProfessionalGpuFairQueueTransactionRequest({
      schemaVersion:
        CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
      requestId: `outbox-enqueue-${queueEntry.queueEntryId}`,
      queueId,
      runtimeRegion,
      operation: 'enqueue' as const,
      entry: queueEntry,
      requestedAt: queueEntry.enqueuedAt,
    }),
  )
  assert.equal(result.disposition, 'queued')
}

const claimResult = await queueAdapter.claim(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'outbox-claim-three-production-attempts',
    queueId,
    runtimeRegion,
    operation: 'claim' as const,
    scheduleId: 'outbox-production-schedule-1',
    capacities: [{
      routeId: 'a100_80gb_heavy_primary' as const,
      capacityObservationRef: ref('outbox-a100-capacity'),
      maximumConcurrentAttempts: 3,
      currentActiveAttempts: 0,
      minimumIdleGpuInstances: 0 as const,
      exactCurrentQuotaAndRuntimeCapacityReread: true as const,
    }],
    claimedAt: iso(claimTime),
    dispatchLeaseDurationSeconds: 60,
  }),
)
assert.equal(claimResult.claims.length, 3)
const [createdClaim, unknownClaim, rejectedClaim] = claimResult.claims
assert.ok(createdClaim)
assert.ok(unknownClaim)
assert.ok(rejectedClaim)

const runtimeConfig = createCanonicalProfessionalGpuCloudTaskRuntimeConfig({
  targetOrigin: 'https://reeditpro-api-4wkjiqvdqa-uc.a.run.app',
})
const createdSpec = taskSpec(createdClaim, claimTime + 1_000)
const unknownSpec = taskSpec(unknownClaim, claimTime + 1_100)
const rejectedSpec = taskSpec(rejectedClaim, claimTime + 1_200)

const createdBegin = await outboxAdapter.beginCreate(beginRequest({
  requestId: 'outbox-begin-created',
  claim: createdClaim,
  spec: createdSpec,
  requestedAt: claimTime + 2_000,
}))
assert.equal(createdBegin.disposition, 'create_admitted')
assert.equal(createdBegin.record.status, 'create_leased')
assert.equal(createdBegin.record.dispatchResult, null)
assert.equal(
  createdBegin.record.databaseRecordPersistedBeforeCloudTasksCreate,
  true,
)

await assert.rejects(() => queueAdapter.markDispatched(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'outbox-dispatch-before-created-denial',
    queueId,
    runtimeRegion,
    operation: 'mark_dispatched' as const,
    queueEntryId: createdClaim.queueEntry.queueEntryId,
    executionAttemptRef: createdClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(createdClaim),
    cloudTaskDispatchReceiptRef: ref('unbacked-cloud-task-receipt'),
    dispatchedAt: iso(claimTime + 3_000),
  }),
))

const createdDispatch = await createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
  runtimeConfig,
  auth: fakeAuth(async (request) => ({ data: request.data?.task })),
  now: () => iso(claimTime + 3_000),
}).createOne(createdSpec)
const restartOutboxClient =
  createCanonicalProfessionalGpuCloudTaskOutboxLocalHttpClient({
    endpointOrigin,
    serviceRoleKey,
  })
const restartOutboxAdapter =
  createCanonicalProfessionalGpuCloudTaskOutboxLocalAdapter({
    client: restartOutboxClient,
    capability:
      createCanonicalProfessionalGpuCloudTaskOutboxLocalCapability({
        endpointOrigin,
        client: restartOutboxClient,
      }),
  })
const createdOutcome = await restartOutboxAdapter.recordCreateOutcome(
  outcomeRequest({
    requestId: 'outbox-record-created',
    claim: createdClaim,
    begin: createdBegin,
    dispatchResult: createdDispatch,
  }),
)
assert.equal(createdOutcome.disposition, 'outcome_recorded')
assert.equal(createdOutcome.record.status, 'created')
assert.equal(createdOutcome.record.externalCreateOutcome, 'created')

const createdReplay = await restartOutboxAdapter.beginCreate(beginRequest({
  requestId: 'outbox-reread-created-with-fresh-process',
  claim: createdClaim,
  spec: createdSpec,
  requestedAt: claimTime + 4_000,
}))
assert.equal(createdReplay.disposition, 'created_replay')
assert.equal(
  createdReplay.record.recordHash,
  createdOutcome.record.recordHash,
)

const dispatchRecorded = await queueAdapter.markDispatched(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'outbox-mark-created-dispatched',
    queueId,
    runtimeRegion,
    operation: 'mark_dispatched' as const,
    queueEntryId: createdClaim.queueEntry.queueEntryId,
    executionAttemptRef: createdClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(createdClaim),
    cloudTaskDispatchReceiptRef: required(createdDispatch.cloudTaskRef),
    dispatchedAt: iso(claimTime + 5_000),
  }),
)
assert.equal(dispatchRecorded.disposition, 'dispatch_recorded')

const unknownBegin = await outboxAdapter.beginCreate(beginRequest({
  requestId: 'outbox-begin-unknown',
  claim: unknownClaim,
  spec: unknownSpec,
  requestedAt: claimTime + 2_100,
}))
const unknownDispatch = await createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
  runtimeConfig,
  auth: fakeAuth(async () => { throw new Error('unknown network outcome') }),
  now: () => iso(claimTime + 3_100),
}).createOne(unknownSpec)
const unknownOutcome = await restartOutboxAdapter.recordCreateOutcome(
  outcomeRequest({
    requestId: 'outbox-record-unknown',
    claim: unknownClaim,
    begin: unknownBegin,
    dispatchResult: unknownDispatch,
  }),
)
assert.equal(unknownOutcome.record.status, 'outcome_unknown')
assert.equal(unknownOutcome.record.automaticCreateRetryAllowed, false)

const rejectedBegin = await outboxAdapter.beginCreate(beginRequest({
  requestId: 'outbox-begin-known-not-created',
  claim: rejectedClaim,
  spec: rejectedSpec,
  requestedAt: claimTime + 2_200,
}))
const rejectedDispatch =
  await createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
    runtimeConfig,
    auth: fakeAuth(async () => { throw httpError(400) }),
    now: () => iso(claimTime + 3_200),
  }).createOne(rejectedSpec)
const rejectedOutcome = await restartOutboxAdapter.recordCreateOutcome(
  outcomeRequest({
    requestId: 'outbox-record-known-not-created',
    claim: rejectedClaim,
    begin: rejectedBegin,
    dispatchResult: rejectedDispatch,
  }),
)
assert.equal(rejectedOutcome.record.status, 'not_created')

const recovery = await queueAdapter.recoverExpiredDispatchLeases(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'outbox-recover-safe-and-uncertain-claims',
    queueId,
    runtimeRegion,
    operation: 'recover_expired_dispatch_leases' as const,
    observedAt: iso(claimTime + 70_000),
    maximumEntries: 192,
  }),
)
assert.equal(recovery.requeuedBeforeDispatchCount, 1)
assert.equal(recovery.reconciliationRequiredCount, 1)
assert.equal(recovery.activeCount, 2)
assert.equal(recovery.queuedCount, 1)

await assert.rejects(() => outboxAdapter.recordCreateOutcome({
  ...outcomeRequest({
    requestId: 'outbox-tampered-outcome-denial',
    claim: unknownClaim,
    begin: unknownBegin,
    dispatchResult: unknownDispatch,
  }),
  dispatchResult: {
    ...unknownDispatch,
    providerOutcome: 'created',
  },
}))

const browserResponse = await fetch(
  `${endpointOrigin}/rest/v1/rpc/weeditpro_begin_professional_gpu_cloud_task_create_v1`,
  {
    method: 'POST',
    headers: {
      accept: 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      p_contract_version:
        CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
      p_request: {},
    }),
  },
)
assert.equal(browserResponse.ok, false)
await browserResponse.text()

console.log(JSON.stringify({
  status: 'PASS',
  contractVersion:
    CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
  databaseRecordPersistedBeforeExternalCreateProven: true,
  dispatchBeforeDurableCreatedOutcomeRejected: true,
  restartSafeCreatedRereadProven: true,
  exactCreatedReceiptRequiredToMarkDispatched: true,
  unknownOutcomeAutomaticRetryPrevented: true,
  unknownOutcomeRecoveryRequiresReconciliation: true,
  knownNotCreatedOutcomeSafelyRequeued: true,
  tamperedOutcomeRejected: true,
  browserRpcDenialProven: true,
  cloudTasksDispatchVerified: false,
  customerCreditsMutated: false,
  productionAuthority: false,
}, null, 2))

function taskSpec(
  claim: CanonicalProfessionalGpuFairQueueDurableClaim,
  compiledAt: number,
) {
  return compileCanonicalProfessionalGpuCloudTaskSpec({
    claim,
    runtimeConfig,
    compiledAt: iso(compiledAt),
  })
}

function beginRequest(input: {
  readonly requestId: string
  readonly claim: CanonicalProfessionalGpuFairQueueDurableClaim
  readonly spec: CanonicalProfessionalGpuCloudTaskSpec
  readonly requestedAt: number
}) {
  return sealCanonicalProfessionalGpuCloudTaskOutboxRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
    requestId: input.requestId,
    queueId,
    runtimeRegion,
    operation: 'begin_create' as const,
    queueEntryId: input.claim.queueEntry.queueEntryId,
    claimRef: claimRef(input.claim),
    cloudTaskSpec: input.spec,
    dispatcherInstanceId: 'local-outbox-dispatcher-1',
    requestedAt: iso(input.requestedAt),
    leaseDurationSeconds: 30,
  })
}

function outcomeRequest(input: {
  readonly requestId: string
  readonly claim: CanonicalProfessionalGpuFairQueueDurableClaim
  readonly begin: Awaited<ReturnType<typeof outboxAdapter.beginCreate>>
  readonly dispatchResult: Awaited<ReturnType<
    ReturnType<typeof createGoogleCloudProfessionalGpuCloudTaskDispatchPort>[
      'createOne'
    ]
  >>
}) {
  return sealCanonicalProfessionalGpuCloudTaskOutboxRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
    requestId: input.requestId,
    queueId,
    runtimeRegion,
    operation: 'record_create_outcome' as const,
    queueEntryId: input.claim.queueEntry.queueEntryId,
    claimRef: claimRef(input.claim),
    createLeaseId: input.begin.record.createLeaseId,
    cloudTaskSpecRef: input.dispatchResult.cloudTaskSpecRef,
    dispatchResult: input.dispatchResult,
    observedAt: input.dispatchResult.observedAt,
  })
}

function entry(ordinal: number, tenant: 'a' | 'b') {
  return {
    queueEntryId: `outbox-gpu-entry-${ordinal}`,
    ownerUserId: tenant === 'a'
      ? '11111111-1111-4111-8111-111111111111'
      : '22222222-2222-4222-8222-222222222222',
    workspaceId: tenant === 'a'
      ? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      : 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    projectId: tenant === 'a'
      ? 'aaaaaaaa-1000-4000-8000-000000000001'
      : 'bbbbbbbb-1000-4000-8000-000000000001',
    routeId: 'a100_80gb_heavy_primary' as const,
    approvedSnapshotRef: ref(`outbox-snapshot-${ordinal}`),
    approvedWorkItemRef: ref(`outbox-work-${ordinal}`),
    fundedDispatchAdmissionRef: ref(`outbox-funded-${ordinal}`),
    executionAttemptRef: ref(`outbox-attempt-${ordinal}`),
    userTriggerRecordRef: ref(`outbox-trigger-${ordinal}`),
    enqueuedAt: iso(baseTime + ordinal),
    enqueueOrdinal: ordinal,
    userTriggeredAfterApprovalAndFunding: true as const,
    callerSelectedPriorityCapacityOrRoute: false as const,
  }
}

function claimRef(claim: CanonicalProfessionalGpuFairQueueDurableClaim) {
  return {
    id: claim.claimId,
    version: 1,
    contentHash: `sha256:${claim.claimHash}` as const,
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const,
  }
}

interface RequestOptions {
  readonly data?: { readonly task: unknown }
}

function fakeAuth(
  handler: (request: RequestOptions) => Promise<{ readonly data: unknown }>,
): Pick<GoogleAuth, 'request'> {
  return { request: handler } as unknown as Pick<GoogleAuth, 'request'>
}

function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status },
  })
}

function iso(value: number): string {
  return new Date(value).toISOString()
}

function required<T>(value: T | null | undefined): T {
  assert.notEqual(value, null)
  assert.notEqual(value, undefined)
  return value as T
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}
