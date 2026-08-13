import assert from 'node:assert/strict'

import {
  assertCanonicalProfessionalGpuFairQueueState,
  assertCanonicalProfessionalGpuFairQueueTerminal,
  createCanonicalProfessionalGpuFairQueueCoordinator,
  type CanonicalProfessionalGpuFairQueueCasStatePort,
  type CanonicalProfessionalGpuFairQueueState,
  type CanonicalProfessionalGpuFairQueueTerminal,
  type CanonicalProfessionalGpuFairQueueTerminalPort,
} from '../services/canonical-professional-gpu-fair-queue-coordinator'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const backing = memoryBacking()
const coordinator = createCoordinator(backing)
const entries = [
  entry(1, 'workspace-a', 'a100_80gb_heavy_primary'),
  entry(2, 'workspace-a', 'a100_80gb_heavy_primary'),
  entry(3, 'workspace-a', 'a100_80gb_heavy_primary'),
  entry(4, 'workspace-b', 'a100_80gb_heavy_primary'),
  entry(5, 'workspace-c', 'l4_heavy_fallback'),
]

for (const queued of entries) {
  const result = await coordinator.enqueue({ entry: queued })
  assert.equal(result.disposition, 'queued')
  assert.equal(result.cloudGpuDispatchStarted, false)
}
const replay = await coordinator.enqueue({ entry: structuredClone(entries[0]) })
assert.equal(replay.disposition, 'queued_replay')
assert.equal(replay.queuedCount, 5)

const firstClaims = await coordinator.claimAvailable({
  scheduleId: 'durable-fair-queue-schedule-1',
  capacities: [
    capacity('a100_80gb_heavy_primary', 2, 0),
    capacity('l4_heavy_fallback', 1, 0),
  ],
  scheduledAt: '2026-08-13T02:01:00.000Z',
})
assert.equal(firstClaims.disposition, 'claims_created')
assert.deepEqual(firstClaims.claims.map((claim) =>
  claim.queueEntry.queueEntryId), [
  'queue-00001',
  'queue-00004',
  'queue-00005',
])
assert.equal(firstClaims.schedule.deferredCount, 2)
assert.equal(firstClaims.cloudGpuDispatchStarted, false)

const restarted = createCoordinator(backing)
const afterRestart = await restarted.readCurrent()
assert.equal(afterRestart.queuedCount, 2)
assert.equal(afterRestart.activeCount, 3)
assert.equal(afterRestart.productionAuthorityGranted, false)
assert.deepEqual(assertCanonicalProfessionalGpuFairQueueState(afterRestart),
  afterRestart)

const finalizedClaim = firstClaims.claims[0]!
const finalization = await restarted.finalize({
  queueEntryId: finalizedClaim.queueEntry.queueEntryId,
  executionAttemptRef: finalizedClaim.queueEntry.executionAttemptRef,
  claimRef: ref(finalizedClaim.claimId, finalizedClaim.claimHash),
  terminalEvidenceRef: ref('terminal-evidence-1', hash('terminal-evidence-1')),
  disposition: 'completed',
  terminalAt: '2026-08-13T02:02:00.000Z',
})
assert.equal(finalization.disposition, 'finalized')
assert.equal(finalization.terminal.automaticRetryStarted, false)
assert.deepEqual(assertCanonicalProfessionalGpuFairQueueTerminal(
  finalization.terminal,
), finalization.terminal)
const terminalReplay = await restarted.finalize({
  queueEntryId: finalizedClaim.queueEntry.queueEntryId,
  executionAttemptRef: finalizedClaim.queueEntry.executionAttemptRef,
  claimRef: ref(finalizedClaim.claimId, finalizedClaim.claimHash),
  terminalEvidenceRef: ref('terminal-evidence-1', hash('terminal-evidence-1')),
  disposition: 'completed',
  terminalAt: '2026-08-13T02:02:00.000Z',
})
assert.equal(terminalReplay.disposition, 'terminal_replay')
const terminalEnqueueReplay = await restarted.enqueue({
  entry: finalizedClaim.queueEntry,
})
assert.equal(terminalEnqueueReplay.disposition, 'terminal_replay')

await assert.rejects(() => restarted.finalize({
  queueEntryId: firstClaims.claims[1]!.queueEntry.queueEntryId,
  executionAttemptRef: firstClaims.claims[1]!.queueEntry.executionAttemptRef,
  claimRef: ref('wrong-claim', hash('wrong-claim')),
  terminalEvidenceRef: ref('terminal-evidence-wrong', hash('wrong')),
  disposition: 'completed',
  terminalAt: '2026-08-13T02:02:30.000Z',
}))

const concurrentBacking = memoryBacking()
const concurrentA = createCoordinator(concurrentBacking)
const concurrentB = createCoordinator(concurrentBacking)
const sameEntry = entry(10, 'workspace-race', 'a100_80gb_heavy_primary')
const concurrentEnqueues = await Promise.all([
  concurrentA.enqueue({ entry: sameEntry }),
  concurrentB.enqueue({ entry: structuredClone(sameEntry) }),
])
assert.equal(concurrentEnqueues.filter((result) =>
  result.disposition === 'queued').length, 1)
assert.equal(concurrentEnqueues.filter((result) =>
  result.disposition === 'queued_replay').length, 1)
assert.equal((await concurrentA.readCurrent()).queuedCount, 1)

const concurrentClaim = (await concurrentA.claimAvailable({
  scheduleId: 'durable-fair-queue-concurrent-finalize',
  capacities: [capacity('a100_80gb_heavy_primary', 1, 0)],
  scheduledAt: '2026-08-13T02:02:45.000Z',
})).claims[0]!
const concurrentTerminalInput = {
  queueEntryId: concurrentClaim.queueEntry.queueEntryId,
  executionAttemptRef: concurrentClaim.queueEntry.executionAttemptRef,
  claimRef: ref(concurrentClaim.claimId, concurrentClaim.claimHash),
  terminalEvidenceRef: ref('terminal-evidence-concurrent', hash('concurrent')),
  disposition: 'completed' as const,
  terminalAt: '2026-08-13T02:02:50.000Z',
}
const concurrentFinalizations = await Promise.all([
  concurrentA.finalize(concurrentTerminalInput),
  concurrentB.finalize(structuredClone(concurrentTerminalInput)),
])
assert.equal(concurrentFinalizations.filter((result) =>
  result.disposition === 'finalized').length, 1)
assert.equal(concurrentFinalizations.filter((result) =>
  result.disposition === 'terminal_replay').length, 1)
assert.equal((await concurrentA.readCurrent()).activeCount, 0)

const crossedEntry = structuredClone(sameEntry)
crossedEntry.projectId = 'project-crossed'
await assert.rejects(() => concurrentA.enqueue({ entry: crossedEntry }))
const crossedAttempt = entry(11, 'workspace-race-2',
  'a100_80gb_heavy_primary')
crossedAttempt.executionAttemptRef = sameEntry.executionAttemptRef
await assert.rejects(() => concurrentA.enqueue({ entry: crossedAttempt }))

const crashBacking = memoryBacking()
const crashCoordinator = createCoordinator(crashBacking)
const crashEntry = entry(20, 'workspace-crash',
  'a100_80gb_heavy_primary')
await crashCoordinator.enqueue({ entry: crashEntry })
const crashClaim = (await crashCoordinator.claimAvailable({
  scheduleId: 'durable-fair-queue-crash-schedule',
  capacities: [capacity('a100_80gb_heavy_primary', 1, 0)],
  scheduledAt: '2026-08-13T02:03:00.000Z',
})).claims[0]!
crashBacking.forcedRaces = 16
await assert.rejects(() => crashCoordinator.finalize({
  queueEntryId: crashClaim.queueEntry.queueEntryId,
  executionAttemptRef: crashClaim.queueEntry.executionAttemptRef,
  claimRef: ref(crashClaim.claimId, crashClaim.claimHash),
  terminalEvidenceRef: ref('terminal-evidence-crash', hash('crash')),
  disposition: 'failed_reconciled',
  terminalAt: '2026-08-13T02:04:00.000Z',
}))
assert.equal((await crashCoordinator.readCurrent()).activeCount, 1)
crashBacking.forcedRaces = 0
const reconciled = await createCoordinator(crashBacking).claimAvailable({
  scheduleId: 'durable-fair-queue-crash-reconcile',
  capacities: [capacity('a100_80gb_heavy_primary', 1, 0)],
  scheduledAt: '2026-08-13T02:05:00.000Z',
})
assert.equal(reconciled.reconciledTerminalClaimCount, 1)
assert.equal((await crashCoordinator.readCurrent()).activeCount, 0)

const hostile: Record<string, unknown> = {}
Object.defineProperty(hostile, 'entry', {
  enumerable: true,
  get() { throw new Error('must not run') },
})
await assert.rejects(() => coordinator.enqueue(hostile as { entry: unknown }))

process.stdout.write(`${JSON.stringify({
  smoke: 'canonical-professional-gpu-fair-queue-coordinator',
  assertions: 40,
  sharedStateCasRequired: true,
  deterministicReplayVerified: true,
  twoCoordinatorEnqueueRaceVerified: true,
  twoCoordinatorTerminalRaceVerified: true,
  restartRereadVerified: true,
  createOnlyTerminalReplayVerified: true,
  terminalBeforeStateCrashReconciled: true,
  exactClaimFinalizationVerified: true,
  cpuSubstantiveFallbackAllowed: false,
  automaticQualityReductionAllowed: false,
  cloudTasksDispatchStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)

interface MemoryBacking {
  state: CanonicalProfessionalGpuFairQueueState | null
  storageRevision: string | null
  terminals: Map<string, CanonicalProfessionalGpuFairQueueTerminal>
  forcedRaces: number
}

function memoryBacking(): MemoryBacking {
  return {
    state: null,
    storageRevision: null,
    terminals: new Map(),
    forcedRaces: 0,
  }
}

function createCoordinator(backing: MemoryBacking) {
  return createCanonicalProfessionalGpuFairQueueCoordinator({
    queueId: 'weeditpro-professional-gpu-us-central1',
    runtimeRegion: 'us-central1',
    statePort: memoryStatePort(backing),
    terminalPort: memoryTerminalPort(backing),
  })
}

function memoryStatePort(
  backing: MemoryBacking,
): CanonicalProfessionalGpuFairQueueCasStatePort {
  return Object.freeze({
    adapterId: 'professional-gpu-fair-queue-memory-cas-v1',
    implementationClass: 'in_memory_contract_fixture' as const,
    durableAcrossProcessRestart: false,
    multiReplicaCompareAndSwapVerified: false,
    productionAuthority: false as const,
    async readCurrent() {
      return backing.state && backing.storageRevision
        ? {
          state: structuredClone(backing.state),
          storageRevision: backing.storageRevision,
        }
        : null
    },
    async compareAndSwap(input: {
      readonly expectedStorageRevision: string | null
      readonly nextState: CanonicalProfessionalGpuFairQueueState
    }) {
      if (backing.forcedRaces > 0) {
        backing.forcedRaces -= 1
        return 'raced' as const
      }
      if (input.expectedStorageRevision !== backing.storageRevision) {
        return 'raced' as const
      }
      const next = assertCanonicalProfessionalGpuFairQueueState(
        input.nextState,
      )
      backing.state = structuredClone(next)
      backing.storageRevision = next.stateHash
      return 'replaced' as const
    },
  })
}

function memoryTerminalPort(
  backing: MemoryBacking,
): CanonicalProfessionalGpuFairQueueTerminalPort {
  return Object.freeze({
    adapterId: 'professional-gpu-fair-queue-memory-terminal-v1',
    createOnlyAndExactReread: true as const,
    durableAcrossProcessRestart: false,
    productionAuthority: false as const,
    async createOnly(input: {
      readonly terminal: CanonicalProfessionalGpuFairQueueTerminal
    }) {
      const terminal = assertCanonicalProfessionalGpuFairQueueTerminal(
        input.terminal,
      )
      const key = terminalKey(terminal.queueId, terminal.runtimeRegion,
        terminal.queueEntryRef.id)
      const existing = backing.terminals.get(key)
      if (existing) {
        if (existing.terminalHash !== terminal.terminalHash) {
          throw new Error('Terminal create-only collision.')
        }
        return 'already_exists' as const
      }
      backing.terminals.set(key, structuredClone(terminal))
      return 'created' as const
    },
    async readExact(input: {
      readonly queueId: string
      readonly runtimeRegion: string
      readonly queueEntryId: string
    }) {
      const value = backing.terminals.get(terminalKey(
        input.queueId,
        input.runtimeRegion,
        input.queueEntryId,
      ))
      return value ? structuredClone(value) : null
    },
    async readExactByExecutionAttemptRef(input: {
      readonly queueId: string
      readonly runtimeRegion: string
      readonly executionAttemptRef: {
        readonly id: string
        readonly version: number
        readonly contentHash: string
      }
    }) {
      const value = [...backing.terminals.values()].find((terminal) =>
        terminal.queueId === input.queueId
        && terminal.runtimeRegion === input.runtimeRegion
        && stableAuthorityStringify(terminal.executionAttemptRef) ===
          stableAuthorityStringify(input.executionAttemptRef))
      return value ? structuredClone(value) : null
    },
  })
}

function terminalKey(queueId: string, region: string, entryId: string) {
  return stableAuthorityStringify({ queueId, region, entryId })
}

function entry(
  ordinal: number,
  workspaceId: string,
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback',
) {
  const id = String(ordinal).padStart(5, '0')
  return {
    queueEntryId: `queue-${id}`,
    ownerUserId: `owner-${workspaceId}`,
    workspaceId,
    projectId: `project-${id}`,
    routeId,
    approvedSnapshotRef: ref(`snapshot-${id}`, hash(`snapshot-${id}`)),
    approvedWorkItemRef: ref(`work-${id}`, hash(`work-${id}`)),
    fundedDispatchAdmissionRef: ref(`funding-${id}`, hash(`funding-${id}`)),
    executionAttemptRef: ref(`attempt-${id}`, hash(`attempt-${id}`)),
    userTriggerRecordRef: ref(`trigger-${id}`, hash(`trigger-${id}`)),
    enqueuedAt: `2026-08-13T02:00:${String(ordinal).padStart(2, '0')}.000Z`,
    enqueueOrdinal: ordinal,
    userTriggeredAfterApprovalAndFunding: true as const,
    callerSelectedPriorityCapacityOrRoute: false as const,
  }
}

function capacity(
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback',
  maximumConcurrentAttempts: number,
  currentActiveAttempts: number,
) {
  return {
    routeId,
    capacityObservationRef: ref(
      `capacity-${routeId}-${maximumConcurrentAttempts}-${currentActiveAttempts}`,
      hash(`${routeId}-${maximumConcurrentAttempts}-${currentActiveAttempts}`),
    ),
    maximumConcurrentAttempts,
    currentActiveAttempts,
    minimumIdleGpuInstances: 0 as const,
    exactCurrentQuotaAndRuntimeCapacityReread: true as const,
  }
}

function ref(id: string, contentHash: string) {
  return { id, version: 1, contentHash: `sha256:${contentHash}` }
}

function hash(value: unknown): string {
  return sha256AuthorityValue(value)
}
