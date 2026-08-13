import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuAttemptStartAuthority,
} from '../services/canonical-professional-gpu-plan-funded-dispatch-service'
import {
  createCanonicalProfessionalGpuFundedStartAuthorityStore,
} from '../services/canonical-professional-gpu-funded-start-authority-store'
import {
  attempt as primaryAttempt,
  funding,
} from './canonical-sam3_1-approved-track-all-task-source-repository-smoke'

const primaryPersistedAt = '2026-08-04T18:30:02.000Z'
const fallbackPersistedAt = '2026-08-04T18:31:02.000Z'
const readAt = '2026-08-04T18:32:00.000Z'
const lookup = {
  workspaceId: funding.scope.workspaceId,
  snapshotId: funding.approvedSnapshotRef.id,
  workItemKey: funding.approvedWorkItem.workItemKey,
  at: readAt,
}
const objects = new Map<string, Buffer>()
const store = createCanonicalProfessionalGpuFundedStartAuthorityStore({
  objectPort: memoryObjectPort(objects),
  prefix: 'private/smoke/canonical-professional-gpu/funded-starts/v1',
})

const primary = await store.persistFundedAttemptStartCreateOnly({
  approvedFunding: funding,
  attemptStart: primaryAttempt,
  persistedAt: primaryPersistedAt,
})
assert.equal(primary.disposition, 'created')
assert.equal(primary.attemptOrdinal, 1)
assert.equal(primary.cloudJobCreated, false)
assert.equal(primary.customerCreditsMutated, false)
assert.match(primary.executionIndexHash, /^[a-f0-9]{64}$/u)
assert.equal(objects.size, 2)

const replay = await store.persistFundedAttemptStartCreateOnly({
  approvedFunding: funding,
  attemptStart: primaryAttempt,
  persistedAt: primaryPersistedAt,
})
assert.equal(replay.disposition, 'identical_replay')
assert.equal(replay.recordHash, primary.recordHash)
assert.equal(objects.size, 2)

const rereadFunding = await store.rereadApprovedFunding(lookup)
const rereadPrimary = await store.rereadCreateOnlyAttemptStart(lookup)
assert.deepEqual(rereadFunding, funding)
assert.deepEqual(rereadPrimary, primaryAttempt)
assert.notEqual(rereadFunding, funding)
assert.notEqual(rereadPrimary, primaryAttempt)
const primaryByExecution = await store
  .rereadFundedAttemptByExecutionAttemptRef({
    executionAttemptRef: primaryAttempt.executionAttemptRef,
    at: readAt,
  })
assert.deepEqual(primaryByExecution?.approvedFunding, funding)
assert.deepEqual(primaryByExecution?.attemptStart, primaryAttempt)
assert.notEqual(primaryByExecution?.approvedFunding, funding)

const fallbackAttempt = createCanonicalProfessionalGpuAttemptStartAuthority({
  attemptAuthorityId: 'track-all-attempt-authority-2',
  scope: funding.scope,
  approvedSnapshotRef: funding.approvedSnapshotRef,
  approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
  workerLeaseRef: ref('track-all-fallback-worker-lease'),
  userTriggerRecordRef: ref('track-all-fallback-user-trigger'),
  executionAttemptRef: ref('track-all-fallback-execution-attempt'),
  idempotencyKey: 'track-all-sam31-fallback-trigger-2',
  routeId: 'l4_heavy_fallback',
  priorPrimaryTerminalReceiptRef: ref('track-all-primary-terminal'),
  priorPrimaryFailureClass:
    'a100_capacity_unavailable_before_attempt_start',
  priorPrimaryOutcomeKnownNotExecuted: true,
  triggeredAt: '2026-08-04T18:31:00.000Z',
  expiresAt: '2026-08-04T18:59:00.000Z',
})
const fallback = await store.persistFundedAttemptStartCreateOnly({
  approvedFunding: funding,
  attemptStart: fallbackAttempt,
  persistedAt: fallbackPersistedAt,
})
assert.equal(fallback.disposition, 'created')
assert.equal(fallback.attemptOrdinal, 2)
assert.equal(objects.size, 4)
assert.deepEqual(
  await store.rereadCreateOnlyAttemptStart(lookup),
  fallbackAttempt,
)
assert.deepEqual(await store.rereadApprovedFunding(lookup), funding)
assert.deepEqual(
  (await store.rereadFundedAttemptByExecutionAttemptRef({
    executionAttemptRef: fallbackAttempt.executionAttemptRef,
    at: readAt,
  }))?.attemptStart,
  fallbackAttempt,
)

const fallbackWithoutPrimaryObjects = new Map<string, Buffer>()
const fallbackWithoutPrimary =
  createCanonicalProfessionalGpuFundedStartAuthorityStore({
    objectPort: memoryObjectPort(fallbackWithoutPrimaryObjects),
    prefix: 'private/smoke/canonical-professional-gpu/no-primary/v1',
  })
await assert.rejects(
  fallbackWithoutPrimary.persistFundedAttemptStartCreateOnly({
    approvedFunding: funding,
    attemptStart: fallbackAttempt,
    persistedAt: fallbackPersistedAt,
  }),
  /fallback_primary_attempt_missing/u,
)
assert.equal(fallbackWithoutPrimaryObjects.size, 0)

await assert.rejects(store.persistFundedAttemptStartCreateOnly({
  approvedFunding: funding,
  attemptStart: {
    ...fallbackAttempt,
    idempotencyKey: primaryAttempt.idempotencyKey,
  },
  persistedAt: fallbackPersistedAt,
} as Parameters<typeof store.persistFundedAttemptStartCreateOnly>[0]))

const crossedLookup = {
  ...lookup,
  snapshotId: 'crossed-snapshot',
}
assert.equal(await store.rereadApprovedFunding(crossedLookup), null)
assert.equal(await store.rereadCreateOnlyAttemptStart(crossedLookup), null)
assert.equal(await store.rereadFundedAttemptByExecutionAttemptRef({
  executionAttemptRef: ref('missing-execution-attempt'),
  at: readAt,
}), null)

let getterInvoked = false
const hostile = Object.defineProperty({}, 'workspaceId', {
  enumerable: true,
  get() {
    getterInvoked = true
    throw new Error('getter must not execute')
  },
})
await assert.rejects(store.rereadApprovedFunding(hostile as never))
assert.equal(getterInvoked, false)

const conflictingObjects = new Map(objects)
const conflictingStore = createCanonicalProfessionalGpuFundedStartAuthorityStore({
  objectPort: memoryObjectPort(conflictingObjects),
  prefix: 'private/smoke/canonical-professional-gpu/funded-starts/v1',
})
await assert.rejects(conflictingStore.persistFundedAttemptStartCreateOnly({
  approvedFunding: funding,
  attemptStart: {
    ...primaryAttempt,
    attemptAuthorityId: 'changed-authority-id',
  },
  persistedAt: primaryPersistedAt,
} as Parameters<typeof store.persistFundedAttemptStartCreateOnly>[0]))

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-funded-start-authority-store',
  checks: 38,
  primaryCreateOnlyExactReread: true,
  identicalReplayAccepted: true,
  fallbackRequiresPersistedPrimary: true,
  fallbackRequiresDistinctLeaseAttemptTriggerAndIdempotency: true,
  currentReadSelectsFallbackAfterSafePrimaryDisposition: true,
  executionAttemptIndexCreateOnlyExactReread: true,
  crossSnapshotReadReturnsNoAuthority: true,
  hostileAccessorRejectedWithoutInvocation: true,
  callerRoutePriceRuntimeAccepted: false,
  cloudJobCreated: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${'a'.repeat(64)}` as const,
  }
}

function memoryObjectPort(
  records: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      const current = records.get(input.objectPath)
      if (current) {
        if (!current.equals(input.body)) {
          throw new Error('create-only collision')
        }
        return 'already_exists'
      }
      records.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const current = records.get(objectPath)
      return current ? Buffer.from(current) : null
    },
  }
}
