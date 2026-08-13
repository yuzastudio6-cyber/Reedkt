import assert from 'node:assert/strict'

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

const client = createCanonicalProfessionalGpuFairQueueLocalHttpClient({
  endpointOrigin,
  serviceRoleKey,
})
const capability = createCanonicalProfessionalGpuFairQueueLocalPostgresCapability({
  endpointOrigin,
  client,
})
const adapter = createCanonicalProfessionalGpuFairQueueLocalPostgresAdapter({
  client,
  capability,
})
assert.equal(adapter.databaseBackend, 'postgres')
assert.equal(adapter.sharedDurableTransactionPerformed, true)
assert.equal(adapter.multiReplicaDurabilityVerified, false)
assert.equal(adapter.cloudTasksDispatchVerified, false)
assert.equal(adapter.browserOrFrontendClientAllowed, false)
assert.equal(adapter.productionAuthority, false)

const queueId = 'weeditpro-professional-gpu-local-proof-v1'
const runtimeRegion = 'us-central1' as const
const baseTime = Date.parse('2026-08-12T18:00:00.000Z')
const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const workspaceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const workspaceB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const projectA = 'aaaaaaaa-1000-4000-8000-000000000001'
const projectB = 'bbbbbbbb-1000-4000-8000-000000000001'
const entries = [
  entry(1, 'a', 'a100_80gb_heavy_primary'),
  entry(2, 'a', 'a100_80gb_heavy_primary'),
  entry(3, 'a', 'a100_80gb_heavy_primary'),
  entry(4, 'b', 'l4_standard_primary'),
  entry(5, 'b', 'l4_standard_primary'),
  entry(6, 'b', 'l4_standard_primary'),
]

for (const [index, queueEntry] of entries.entries()) {
  const requestedAt = queueEntry.enqueuedAt
  const request = sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: `gpu-enqueue-${index + 1}`,
    queueId,
    runtimeRegion,
    operation: 'enqueue' as const,
    entry: queueEntry,
    requestedAt,
  })
  const first = await adapter.enqueue(request)
  assert.equal(first.disposition, 'queued')
  assert.equal(first.queuedCount, index + 1)
  assert.equal(first.activeCount, 0)
  const replay = await adapter.enqueue(request)
  assert.equal(replay.resultDigestSha256, first.resultDigestSha256)
}

const concurrentEntry = entry(70, 'a', 'l4_standard_primary')
const concurrentQueueId = 'weeditpro-professional-gpu-concurrent-proof-v1'
const concurrentRequest = (requestId: string) =>
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId,
    queueId: concurrentQueueId,
    runtimeRegion,
    operation: 'enqueue' as const,
    entry: concurrentEntry,
    requestedAt: concurrentEntry.enqueuedAt,
  })
const concurrentResults = await Promise.all([
  adapter.enqueue(concurrentRequest('gpu-concurrent-enqueue-a')),
  adapter.enqueue(concurrentRequest('gpu-concurrent-enqueue-b')),
])
assert.deepEqual(
  concurrentResults.map((result) => result.disposition).sort(),
  ['queued', 'queued_replay'],
)
const conflictingEntry = entry(71, 'a', 'l4_standard_primary')
await assert.rejects(() => adapter.enqueue(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-concurrent-enqueue-a',
    queueId: concurrentQueueId,
    runtimeRegion,
    operation: 'enqueue' as const,
    entry: conflictingEntry,
    requestedAt: conflictingEntry.enqueuedAt,
  }),
))

const claimRequest = sealCanonicalProfessionalGpuFairQueueTransactionRequest({
  schemaVersion: CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
  requestId: 'gpu-claim-first-wave',
  queueId,
  runtimeRegion,
  operation: 'claim' as const,
  scheduleId: 'gpu-schedule-first-wave',
  capacities: [
    capacity('a100_80gb_heavy_primary', 2, 0),
    capacity('l4_standard_primary', 2, 0),
  ],
  claimedAt: iso(baseTime + 10_000),
  dispatchLeaseDurationSeconds: 60,
})
const [claimResult, claimRaceReplay] = await Promise.all([
  adapter.claim(claimRequest),
  adapter.claim(claimRequest),
])
assert.equal(claimResult.resultDigestSha256, claimRaceReplay.resultDigestSha256)
assert.equal(claimResult.disposition, 'claims_created')
assert.equal(claimResult.claims.length, 4)
assert.equal(claimResult.activeCount, 4)
assert.equal(claimResult.queuedCount, 2)
assert.deepEqual(
  [...new Set(claimResult.claims.map((claim) => claim.queueEntry.workspaceId))]
    .sort(),
  [workspaceA, workspaceB].sort(),
)
for (const workspaceId of [workspaceA, workspaceB]) {
  assert.equal(claimResult.claims.filter((claim) =>
    claim.queueEntry.workspaceId === workspaceId).length, 2)
}

// A fresh client/adapter proves process-local state is not required to resume.
const restartClient = createCanonicalProfessionalGpuFairQueueLocalHttpClient({
  endpointOrigin,
  serviceRoleKey,
})
const restartCapability =
  createCanonicalProfessionalGpuFairQueueLocalPostgresCapability({
    endpointOrigin,
    client: restartClient,
  })
const restartAdapter = createCanonicalProfessionalGpuFairQueueLocalPostgresAdapter({
  client: restartClient,
  capability: restartCapability,
})
const dispatchedClaim = required(claimResult.claims[0])
const dispatchedAt = iso(baseTime + 20_000)
await assert.rejects(() => restartAdapter.markDispatched(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-dispatch-before-claim-denial',
    queueId,
    runtimeRegion,
    operation: 'mark_dispatched' as const,
    queueEntryId: dispatchedClaim.queueEntry.queueEntryId,
    executionAttemptRef: dispatchedClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(dispatchedClaim),
    cloudTaskDispatchReceiptRef: ref('invalid-preclaim-cloud-task-dispatch'),
    dispatchedAt: iso(baseTime + 9_000),
  }),
))
const dispatchResult = await restartAdapter.markDispatched(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-dispatch-first-claim',
    queueId,
    runtimeRegion,
    operation: 'mark_dispatched' as const,
    queueEntryId: dispatchedClaim.queueEntry.queueEntryId,
    executionAttemptRef: dispatchedClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(dispatchedClaim),
    cloudTaskDispatchReceiptRef: ref('cloud-task-dispatch-first-claim'),
    dispatchedAt,
  }),
)
assert.equal(dispatchResult.disposition, 'dispatch_recorded')

await assert.rejects(() => restartAdapter.finalize(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-terminal-before-dispatch-denial',
    queueId,
    runtimeRegion,
    operation: 'finalize' as const,
    queueEntryId: dispatchedClaim.queueEntry.queueEntryId,
    executionAttemptRef: dispatchedClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(dispatchedClaim),
    terminalEvidenceRef: ref('invalid-predispatch-terminal-evidence'),
    disposition: 'completed' as const,
    terminalAt: iso(baseTime + 19_000),
  }),
))
const terminalResult = await restartAdapter.finalize(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-finalize-first-claim',
    queueId,
    runtimeRegion,
    operation: 'finalize' as const,
    queueEntryId: dispatchedClaim.queueEntry.queueEntryId,
    executionAttemptRef: dispatchedClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(dispatchedClaim),
    terminalEvidenceRef: ref('terminal-evidence-first-claim'),
    disposition: 'completed' as const,
    terminalAt: iso(baseTime + 30_000),
  }),
)
assert.equal(terminalResult.disposition, 'finalized')
assert.equal(terminalResult.terminal?.disposition, 'completed')
assert.equal(terminalResult.activeCount, 3)

const secondDispatchedClaim = required(claimResult.claims[1])
await restartAdapter.markDispatched(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-dispatch-second-claim',
    queueId,
    runtimeRegion,
    operation: 'mark_dispatched' as const,
    queueEntryId: secondDispatchedClaim.queueEntry.queueEntryId,
    executionAttemptRef: secondDispatchedClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(secondDispatchedClaim),
    cloudTaskDispatchReceiptRef: ref('cloud-task-dispatch-second-claim'),
    dispatchedAt: iso(baseTime + 21_000),
  }),
)
const undispatchedClaim = required(claimResult.claims[2])
await assert.rejects(() => restartAdapter.finalize(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-undispatched-completion-denial',
    queueId,
    runtimeRegion,
    operation: 'finalize' as const,
    queueEntryId: undispatchedClaim.queueEntry.queueEntryId,
    executionAttemptRef: undispatchedClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(undispatchedClaim),
    terminalEvidenceRef: ref('invalid-undispatched-completion'),
    disposition: 'completed' as const,
    terminalAt: iso(baseTime + 30_000),
  }),
))

const recoveryResult = await restartAdapter.recoverExpiredDispatchLeases(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-recover-undispatched-claims',
    queueId,
    runtimeRegion,
    operation: 'recover_expired_dispatch_leases' as const,
    observedAt: iso(baseTime + 100_000),
    maximumEntries: 192,
  }),
)
assert.equal(recoveryResult.disposition, 'recovery_completed')
assert.equal(recoveryResult.requeuedBeforeDispatchCount, 2)
assert.equal(recoveryResult.reconciliationRequiredCount, 0)
assert.equal(recoveryResult.activeCount, 1)
assert.equal(recoveryResult.queuedCount, 4)

const secondTerminal = await restartAdapter.finalize(
  sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-finalize-second-claim',
    queueId,
    runtimeRegion,
    operation: 'finalize' as const,
    queueEntryId: secondDispatchedClaim.queueEntry.queueEntryId,
    executionAttemptRef: secondDispatchedClaim.queueEntry.executionAttemptRef,
    claimRef: claimRef(secondDispatchedClaim),
    terminalEvidenceRef: ref('terminal-evidence-second-claim'),
    disposition: 'failed_reconciled' as const,
    terminalAt: iso(baseTime + 110_000),
  }),
)
assert.equal(secondTerminal.activeCount, 0)
assert.equal(secondTerminal.queuedCount, 4)

const crossTenant = entry(50, 'a', 'a100_80gb_heavy_primary')
const crossedEntry = {
  ...crossTenant,
  ownerUserId: ownerB,
}
await assert.rejects(
  () => adapter.enqueue(sealCanonicalProfessionalGpuFairQueueTransactionRequest({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
    requestId: 'gpu-cross-tenant-denial',
    queueId: 'weeditpro-professional-gpu-cross-tenant-v1',
    runtimeRegion,
    operation: 'enqueue' as const,
    entry: crossedEntry,
    requestedAt: crossedEntry.enqueuedAt,
  })),
)

const browserResponse = await fetch(
  `${endpointOrigin}/rest/v1/rpc/weeditpro_enqueue_professional_gpu_fair_queue_v1`,
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
        CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
      p_request: {},
    }),
  },
)
assert.equal(browserResponse.ok, false)
await browserResponse.text()

console.log(JSON.stringify({
  status: 'PASS',
  contractVersion:
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
  queuedEntriesProven: entries.length,
  fairClaimsProven: claimResult.claims.length,
  twoRequestEnqueueRaceProven: true,
  idempotencyConflictRejected: true,
  restartSafeResumeProven: true,
  preDispatchLeaseRecoveryProven: true,
  chronologicalDispatchAndTerminalLineageProven: true,
  dispatchedAttemptAutomaticRetryPrevented: true,
  undispatchedCompletionRejected: true,
  crossTenantDenialProven: true,
  browserRpcDenialProven: true,
  cloudTasksDispatchVerified: false,
  productionAuthority: false,
}, null, 2))

function entry(
  ordinal: number,
  tenant: 'a' | 'b',
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
  return {
    queueEntryId: `gpu-entry-${ordinal}`,
    ownerUserId: tenant === 'a' ? ownerA : ownerB,
    workspaceId: tenant === 'a' ? workspaceA : workspaceB,
    projectId: tenant === 'a' ? projectA : projectB,
    routeId,
    approvedSnapshotRef: ref(`snapshot-${ordinal}`),
    approvedWorkItemRef: ref(`work-${ordinal}`),
    fundedDispatchAdmissionRef: ref(`funded-${ordinal}`),
    executionAttemptRef: ref(`attempt-${ordinal}`),
    userTriggerRecordRef: ref(`trigger-${ordinal}`),
    enqueuedAt: iso(baseTime + ordinal),
    enqueueOrdinal: ordinal,
    userTriggeredAfterApprovalAndFunding: true as const,
    callerSelectedPriorityCapacityOrRoute: false as const,
  }
}

function capacity(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
  maximumConcurrentAttempts: number,
  currentActiveAttempts: number,
) {
  return {
    routeId,
    capacityObservationRef: ref(`capacity-${routeId}`),
    maximumConcurrentAttempts,
    currentActiveAttempts,
    minimumIdleGpuInstances: 0 as const,
    exactCurrentQuotaAndRuntimeCapacityReread: true as const,
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

function iso(value: number): string {
  return new Date(value).toISOString()
}

function required<T>(value: T | undefined): T {
  assert.notEqual(value, undefined)
  return value as T
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}
