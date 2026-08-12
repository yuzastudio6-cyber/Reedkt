import assert from 'node:assert/strict'

import {
  assertCanonicalProfessionalGpuFairQueueSchedule,
  CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  compileCanonicalProfessionalGpuFairQueueSchedule,
} from '../services/canonical-professional-gpu-fair-queue-scheduler'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const smallQueue = [
  entry(1, 'workspace-a', 'a100_80gb_heavy_primary'),
  entry(2, 'workspace-a', 'a100_80gb_heavy_primary'),
  entry(3, 'workspace-a', 'a100_80gb_heavy_primary'),
  entry(4, 'workspace-b', 'a100_80gb_heavy_primary'),
  entry(5, 'workspace-c', 'l4_heavy_fallback'),
]
const capacities = [
  capacity('a100_80gb_heavy_primary', 3, 0),
  capacity('l4_heavy_fallback', 2, 0),
]
const schedule = compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-small-smoke',
  queueEntries: smallQueue,
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:30:00.000Z',
})
assert.deepEqual(assertCanonicalProfessionalGpuFairQueueSchedule(schedule),
  schedule)
assert.deepEqual(schedule.admittedEntries.map((entry) => entry.queueEntryId), [
  'queue-00001',
  'queue-00004',
  'queue-00005',
  'queue-00002',
])
assert.equal(schedule.deferredEntries.length, 1)
assert.equal(schedule.deferredEntries[0]?.reason,
  'workspace_concurrency_limit')
assert.equal(schedule.cpuSubstantiveFallbackAllowed, false)
assert.equal(schedule.automaticQualityReductionAllowed, false)
assert.equal(schedule.overloadDisposition, 'remain_queued_with_backpressure')

const tenThousandEntries = Array.from({
  length: CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
}, (_, index) => entry(
  index + 1,
  `workspace-${String(index % 5_000).padStart(5, '0')}`,
  index % 2 === 0
    ? 'a100_80gb_heavy_primary'
    : 'l4_heavy_fallback',
))
const largeSchedule = compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-ten-thousand-smoke',
  queueEntries: tenThousandEntries,
  activeAttempts: [],
  capacities: [
    capacity('a100_80gb_heavy_primary', 16, 0),
    capacity('l4_heavy_fallback', 16, 0),
  ],
  scheduledAt: '2026-08-12T23:31:00.000Z',
})
assert.equal(largeSchedule.inputQueueEntryCount, 10_000)
assert.equal(largeSchedule.admittedCount, 32)
assert.equal(largeSchedule.deferredCount, 9_968)
assert.equal(new Set(largeSchedule.admittedEntries.map((entry) =>
  entry.workspaceId)).size, 32)
assert.equal(largeSchedule.productionAuthorityGranted, false)

const crossRouteWorkspaceSchedule = compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-cross-route-workspace-limit-smoke',
  queueEntries: [
    entry(20_001, 'workspace-shared', 'a100_80gb_heavy_primary'),
    entry(20_002, 'workspace-shared', 'l4_heavy_fallback'),
    entry(20_003, 'workspace-shared', 'l4_standard_primary'),
  ],
  activeAttempts: [],
  capacities: [
    capacity('l4_standard_primary', 2, 0),
    capacity('l4_heavy_fallback', 2, 0),
    capacity('a100_80gb_heavy_primary', 2, 0),
  ],
  scheduledAt: '2026-08-12T23:31:30.000Z',
})
assert.equal(crossRouteWorkspaceSchedule.admittedCount, 2)
assert.equal(crossRouteWorkspaceSchedule.deferredCount, 1)
assert.equal(crossRouteWorkspaceSchedule.deferredEntries[0]?.reason,
  'workspace_concurrency_limit')

const reorderedCapacitySchedule = compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-cross-route-workspace-limit-smoke',
  queueEntries: [
    entry(20_003, 'workspace-shared', 'l4_standard_primary'),
    entry(20_002, 'workspace-shared', 'l4_heavy_fallback'),
    entry(20_001, 'workspace-shared', 'a100_80gb_heavy_primary'),
  ],
  activeAttempts: [],
  capacities: [
    capacity('a100_80gb_heavy_primary', 2, 0),
    capacity('l4_heavy_fallback', 2, 0),
    capacity('l4_standard_primary', 2, 0),
  ],
  scheduledAt: '2026-08-12T23:31:30.000Z',
})
assert.deepEqual(reorderedCapacitySchedule, crossRouteWorkspaceSchedule)

const repeated = structuredClone(tenThousandEntries)
repeated[1] = structuredClone(repeated[0]!)
assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-duplicate-smoke',
  queueEntries: repeated,
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:32:00.000Z',
}))

assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-over-limit-smoke',
  queueEntries: [...tenThousandEntries, entry(
    30_001,
    'workspace-over-limit',
    'l4_standard_primary',
  )],
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:33:00.000Z',
}))

const hostileInput = new Proxy({}, {
  ownKeys() {
    throw new Error('hostile ownKeys trap')
  },
})
assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule(
  hostileInput as never,
), /could not be inspected safely/u)

const tamperedSchedule = structuredClone(schedule)
tamperedSchedule.scheduleHash = '0'.repeat(64)
assert.throws(() => assertCanonicalProfessionalGpuFairQueueSchedule(
  tamperedSchedule,
), /digest changed/u)

assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-missing-capacity-smoke',
  queueEntries: [entry(40_001, 'workspace-missing-capacity',
    'l4_standard_primary')],
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:34:00.000Z',
}), /no current capacity observation/u)

assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-active-count-mismatch-smoke',
  queueEntries: [],
  activeAttempts: [activeAttempt(
    50_001,
    'workspace-active-count',
    'a100_80gb_heavy_primary',
  )],
  capacities,
  scheduledAt: '2026-08-12T23:35:00.000Z',
}), /capacity and active attempts differ/u)

const callerPrioritizedEntry = {
  ...structuredClone(smallQueue[0]!),
  callerSelectedPriorityCapacityOrRoute: true,
}
assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-caller-priority-smoke',
  queueEntries: [callerPrioritizedEntry as never],
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:36:00.000Z',
}))

const activeWorkspaceSchedule = compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-existing-active-workspace-smoke',
  queueEntries: [
    entry(60_001, 'workspace-active', 'l4_heavy_fallback'),
    entry(60_002, 'workspace-active', 'l4_standard_primary'),
  ],
  activeAttempts: [activeAttempt(
    60_000,
    'workspace-active',
    'a100_80gb_heavy_primary',
  )],
  capacities: [
    capacity('a100_80gb_heavy_primary', 2, 1),
    capacity('l4_heavy_fallback', 2, 0),
    capacity('l4_standard_primary', 2, 0),
  ],
  scheduledAt: '2026-08-12T23:37:00.000Z',
})
assert.equal(activeWorkspaceSchedule.admittedCount, 1)
assert.equal(activeWorkspaceSchedule.deferredCount, 1)
assert.equal(activeWorkspaceSchedule.deferredEntries[0]?.reason,
  'workspace_concurrency_limit')

assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-preexisting-workspace-over-limit-smoke',
  queueEntries: [],
  activeAttempts: [
    activeAttempt(70_001, 'workspace-overactive', 'a100_80gb_heavy_primary'),
    activeAttempt(70_002, 'workspace-overactive', 'a100_80gb_heavy_primary'),
    activeAttempt(70_003, 'workspace-overactive', 'l4_heavy_fallback'),
  ],
  capacities: [
    capacity('a100_80gb_heavy_primary', 2, 2),
    capacity('l4_heavy_fallback', 1, 1),
  ],
  scheduledAt: '2026-08-12T23:38:00.000Z',
}), /workspace active count exceeds/u)

let accessorInvoked = false
const accessorInput = {
  scheduleId: 'gpu-fair-queue-accessor-smoke',
  queueEntries: [],
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:39:00.000Z',
}
Object.defineProperty(accessorInput, 'scheduleId', {
  enumerable: true,
  get() {
    accessorInvoked = true
    return 'gpu-fair-queue-accessor-smoke'
  },
})
assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule(
  accessorInput as never,
), /must be a data property/u)
assert.equal(accessorInvoked, false)

const symbolInput: Record<PropertyKey, unknown> = {
  scheduleId: 'gpu-fair-queue-symbol-smoke',
  queueEntries: [],
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:40:00.000Z',
}
symbolInput[Symbol('hidden')] = true
assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule(
  symbolInput as never,
), /symbol key/u)

const sparseQueue = Array(2)
sparseQueue[0] = entry(80_001, 'workspace-sparse',
  'a100_80gb_heavy_primary')
assert.throws(() => compileCanonicalProfessionalGpuFairQueueSchedule({
  scheduleId: 'gpu-fair-queue-sparse-smoke',
  queueEntries: sparseQueue,
  activeAttempts: [],
  capacities,
  scheduledAt: '2026-08-12T23:41:00.000Z',
}), /dense and index-only/u)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-fair-queue-scheduler',
  checks: 31,
  boundedQueueEntriesProcessed: 10_000,
  admittedAtCurrentSixteenPlusSixteenCapacity: 32,
  deferredWithBackpressure: 9_968,
  workspaceRoundRobinFairness: true,
  tenThousandSimultaneousEditsClaimed: false,
  cpuSubstantiveFallbackAllowed: false,
  automaticQualityReductionAllowed: false,
  cloudGpuDispatchStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function entry(
  ordinal: number,
  workspaceId: string,
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
  const suffix = String(ordinal).padStart(5, '0')
  return {
    queueEntryId: `queue-${suffix}`,
    ownerUserId: `owner-${suffix}`,
    workspaceId,
    projectId: `project-${suffix}`,
    routeId,
    approvedSnapshotRef: ref(`snapshot-${suffix}`),
    approvedWorkItemRef: ref(`work-${suffix}`),
    fundedDispatchAdmissionRef: ref(`funded-${suffix}`),
    executionAttemptRef: ref(`attempt-${suffix}`),
    userTriggerRecordRef: ref(`trigger-${suffix}`),
    enqueuedAt: new Date(Date.parse('2026-08-12T23:00:00.000Z')
      + ordinal).toISOString(),
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

function activeAttempt(
  ordinal: number,
  workspaceId: string,
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
  const suffix = String(ordinal).padStart(5, '0')
  return {
    queueEntryId: `active-${suffix}`,
    workspaceId,
    routeId,
    executionAttemptRef: ref(`active-attempt-${suffix}`),
    startedAt: new Date(Date.parse('2026-08-12T22:00:00.000Z')
      + ordinal).toISOString(),
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}`,
  }
}
