import { z } from 'zod'

import {
  CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_SCHEDULER_VERSION,
  CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE,
  CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  assertCanonicalProfessionalGpuFairQueueCapacity,
  assertCanonicalProfessionalGpuFairQueueEntry,
  canonicalProfessionalGpuFairQueueEntrySchema,
  compileCanonicalProfessionalGpuFairQueueSchedule,
  type CanonicalProfessionalGpuFairQueueEntry,
  type CanonicalProfessionalGpuFairQueueSchedule,
} from './canonical-professional-gpu-fair-queue-scheduler'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_STATE_VERSION =
  'canonical-professional-gpu-fair-queue-state-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_CLAIM_VERSION =
  'canonical-professional-gpu-fair-queue-claim-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TERMINAL_VERSION =
  'canonical-professional-gpu-fair-queue-terminal-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_COORDINATOR_VERSION =
  'canonical-professional-gpu-fair-queue-coordinator-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_MAXIMUM_CAS_ATTEMPTS =
  16 as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const runtimeRegionSchema = z.enum([
  'us-central1',
  'us-east1',
  'europe-west1',
])
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const activeClaimWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_CLAIM_VERSION,
  ),
  source: z.literal('canonical_server_professional_gpu_fair_queue_owner'),
  queueId: safeId,
  runtimeRegion: runtimeRegionSchema,
  queueEntry: canonicalProfessionalGpuFairQueueEntrySchema,
  scheduleRef: refSchema,
  claimId: safeId,
  claimedAt: timestamp,
  cloudGpuDispatchStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  automaticRetryAllowed: z.literal(false),
}).strict()
const activeClaimSchema = activeClaimWithoutHashSchema.extend({
  claimHash: sha256,
}).strict()
export type CanonicalProfessionalGpuFairQueueClaim = z.infer<
  typeof activeClaimSchema
>

const stateWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_STATE_VERSION,
  ),
  source: z.literal('canonical_server_professional_gpu_fair_queue_owner'),
  evidenceClass: z.literal('shared_state_compare_and_swap_required'),
  queueId: safeId,
  runtimeRegion: runtimeRegionSchema,
  revision: z.number().int().nonnegative().safe(),
  queuedEntries: z.array(canonicalProfessionalGpuFairQueueEntrySchema).max(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  ),
  activeClaims: z.array(activeClaimSchema).max(192),
  queuedCount: z.number().int().nonnegative().max(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  ),
  activeCount: z.number().int().nonnegative().max(192),
  maximumQueueEntries: z.literal(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
  ),
  maximumActiveAttemptsPerWorkspace: z.literal(
    CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE,
  ),
  schedulerVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_SCHEDULER_VERSION,
  ),
  lastScheduleRef: refSchema.nullable(),
  priorStateRef: refSchema.nullable(),
  userTriggeredApprovedAndFundedEntriesOnly: z.literal(true),
  cpuSubstantiveFallbackAllowed: z.literal(false),
  automaticQualityReductionAllowed: z.literal(false),
  silentAdditionalCreditApprovalAllowed: z.literal(false),
  callerSelectedPriorityCapacityOrRouteAccepted: z.literal(false),
  cloudTasksDispatchStartedByStateOwner: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  createdAt: timestamp,
  updatedAt: timestamp,
}).strict().superRefine((state, context) => {
  const queuedIds = state.queuedEntries.map((entry) => entry.queueEntryId)
  const queuedAttempts = state.queuedEntries.map((entry) =>
    stableAuthorityStringify(entry.executionAttemptRef))
  const activeIds = state.activeClaims.map((claim) =>
    claim.queueEntry.queueEntryId)
  const activeAttempts = state.activeClaims.map((claim) =>
    stableAuthorityStringify(claim.queueEntry.executionAttemptRef))
  if (
    state.queuedCount !== state.queuedEntries.length
    || state.activeCount !== state.activeClaims.length
    || new Set(queuedIds).size !== queuedIds.length
    || new Set(queuedAttempts).size !== queuedAttempts.length
    || new Set(activeIds).size !== activeIds.length
    || new Set(activeAttempts).size !== activeAttempts.length
    || queuedIds.some((id) => activeIds.includes(id))
    || queuedAttempts.some((attempt) => activeAttempts.includes(attempt))
    || Date.parse(state.updatedAt) < Date.parse(state.createdAt)
  ) context.addIssue({
    code: 'custom',
    message: 'Professional GPU fair-queue state identities or counts differ.',
  })
})
export const canonicalProfessionalGpuFairQueueStateSchema =
  stateWithoutHashSchema.extend({ stateHash: sha256 }).strict()
export type CanonicalProfessionalGpuFairQueueState = z.infer<
  typeof canonicalProfessionalGpuFairQueueStateSchema
>

const terminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TERMINAL_VERSION,
  ),
  source: z.literal('canonical_server_professional_gpu_fair_queue_owner'),
  evidenceClass: z.literal('create_only_exact_terminal_reconciliation'),
  queueId: safeId,
  runtimeRegion: runtimeRegionSchema,
  queueEntryRef: refSchema,
  executionAttemptRef: refSchema,
  claimRef: refSchema,
  terminalEvidenceRef: refSchema,
  disposition: z.enum(['completed', 'failed_reconciled']),
  terminalAt: timestamp,
  automaticRetryStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
export const canonicalProfessionalGpuFairQueueTerminalSchema =
  terminalWithoutHashSchema.extend({ terminalHash: sha256 }).strict()
export type CanonicalProfessionalGpuFairQueueTerminal = z.infer<
  typeof canonicalProfessionalGpuFairQueueTerminalSchema
>

export interface CanonicalProfessionalGpuFairQueueCasStatePort {
  readonly adapterId: string
  readonly implementationClass:
    | 'in_memory_contract_fixture'
    | 'reviewed_distributed_transaction_adapter'
  readonly durableAcrossProcessRestart: boolean
  readonly multiReplicaCompareAndSwapVerified: boolean
  readonly productionAuthority: false
  readCurrent(input: {
    readonly queueId: string
    readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
  }): Promise<{
    readonly state: CanonicalProfessionalGpuFairQueueState
    readonly storageRevision: string
  } | null>
  compareAndSwap(input: {
    readonly queueId: string
    readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
    readonly expectedStorageRevision: string | null
    readonly nextState: CanonicalProfessionalGpuFairQueueState
  }): Promise<'replaced' | 'raced'>
}

export interface CanonicalProfessionalGpuFairQueueTerminalPort {
  readonly adapterId: string
  readonly createOnlyAndExactReread: true
  readonly durableAcrossProcessRestart: boolean
  readonly productionAuthority: false
  createOnly(input: {
    readonly terminal: CanonicalProfessionalGpuFairQueueTerminal
  }): Promise<'created' | 'already_exists'>
  readExact(input: {
    readonly queueId: string
    readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
    readonly queueEntryId: string
  }): Promise<CanonicalProfessionalGpuFairQueueTerminal | null>
  readExactByExecutionAttemptRef(input: {
    readonly queueId: string
    readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
    readonly executionAttemptRef: EvidenceRef
  }): Promise<CanonicalProfessionalGpuFairQueueTerminal | null>
}

export interface CanonicalProfessionalGpuFairQueueCoordinator {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_COORDINATOR_VERSION
  readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
  readonly queueId: string
  readonly sharedDurableStateRequiredForProduction: true
  readonly cloudTasksDispatchOwnedElsewhere: true
  readonly productionAuthority: false
  enqueue(input: {
    readonly entry: unknown
  }): Promise<CanonicalProfessionalGpuFairQueueEnqueueResult>
  claimAvailable(input: {
    readonly scheduleId: string
    readonly capacities: readonly unknown[]
    readonly scheduledAt: string
  }): Promise<CanonicalProfessionalGpuFairQueueClaimResult>
  finalize(input: {
    readonly queueEntryId: string
    readonly executionAttemptRef: unknown
    readonly claimRef: unknown
    readonly terminalEvidenceRef: unknown
    readonly disposition: 'completed' | 'failed_reconciled'
    readonly terminalAt: string
  }): Promise<CanonicalProfessionalGpuFairQueueFinalizeResult>
  readCurrent(): Promise<CanonicalProfessionalGpuFairQueueState>
}

export interface CanonicalProfessionalGpuFairQueueEnqueueResult {
  readonly disposition:
    | 'queued'
    | 'queued_replay'
    | 'active_replay'
    | 'terminal_replay'
  readonly queueEntryRef: EvidenceRef
  readonly queueStateRef: EvidenceRef
  readonly queuedCount: number
  readonly activeCount: number
  readonly cloudGpuDispatchStarted: false
  readonly customerCreditsMutated: false
  readonly productionAuthorityGranted: false
}

export interface CanonicalProfessionalGpuFairQueueClaimResult {
  readonly disposition: 'claims_created' | 'no_capacity_available'
  readonly schedule: CanonicalProfessionalGpuFairQueueSchedule
  readonly claims: readonly CanonicalProfessionalGpuFairQueueClaim[]
  readonly queueStateRef: EvidenceRef
  readonly reconciledTerminalClaimCount: number
  readonly cloudGpuDispatchStarted: false
  readonly customerCreditsMutated: false
  readonly productionAuthorityGranted: false
}

export interface CanonicalProfessionalGpuFairQueueFinalizeResult {
  readonly disposition: 'finalized' | 'terminal_replay'
  readonly terminal: CanonicalProfessionalGpuFairQueueTerminal
  readonly queueStateRef: EvidenceRef
  readonly cloudGpuDispatchStarted: false
  readonly customerCreditsMutated: false
  readonly productionAuthorityGranted: false
}

export function createCanonicalProfessionalGpuFairQueueCoordinator(input: {
  readonly queueId: string
  readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
  readonly statePort: CanonicalProfessionalGpuFairQueueCasStatePort
  readonly terminalPort: CanonicalProfessionalGpuFairQueueTerminalPort
}): CanonicalProfessionalGpuFairQueueCoordinator {
  const queueId = safeId.parse(input.queueId)
  const runtimeRegion = runtimeRegionSchema.parse(input.runtimeRegion)
  assertPorts(input.statePort, input.terminalPort)

  const coordinator: CanonicalProfessionalGpuFairQueueCoordinator = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_COORDINATOR_VERSION,
    runtimeRegion,
    queueId,
    sharedDurableStateRequiredForProduction: true,
    cloudTasksDispatchOwnedElsewhere: true,
    productionAuthority: false,

    async enqueue(untrusted) {
      const entry = assertCanonicalProfessionalGpuFairQueueEntry(
        clonePlain(untrusted.entry, 'professional_gpu_queue_enqueue_entry'),
      )
      const [terminal, attemptTerminal] = await Promise.all([
        input.terminalPort.readExact({
          queueId,
          runtimeRegion,
          queueEntryId: entry.queueEntryId,
        }),
        input.terminalPort.readExactByExecutionAttemptRef({
          queueId,
          runtimeRegion,
          executionAttemptRef: entry.executionAttemptRef,
        }),
      ])
      if (attemptTerminal
        && attemptTerminal.queueEntryRef.id !== entry.queueEntryId) {
        throw new Error(
          'Professional GPU terminal execution attempt crossed queue entries.',
        )
      }
      if ((terminal === null) !== (attemptTerminal === null)
        || (terminal && attemptTerminal
          && terminal.terminalHash !== attemptTerminal.terminalHash)) {
        throw new Error('Professional GPU terminal indexes are inconsistent.')
      }
      if (terminal) {
        assertTerminalMatchesEntry(terminal, entry)
        const current = await readOrEmpty({
          statePort: input.statePort,
          queueId,
          runtimeRegion,
          at: entry.enqueuedAt,
        })
        return enqueueResult('terminal_replay', entry, current.state)
      }

      for (let casAttempt = 1;
        casAttempt <= CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_MAXIMUM_CAS_ATTEMPTS;
        casAttempt += 1) {
        const current = await readOrEmpty({
          statePort: input.statePort,
          queueId,
          runtimeRegion,
          at: entry.enqueuedAt,
        })
        const queued = current.state.queuedEntries.find((candidate) =>
          candidate.queueEntryId === entry.queueEntryId)
        if (queued) {
          assertSameEntry(queued, entry)
          return enqueueResult('queued_replay', entry, current.state)
        }
        const active = current.state.activeClaims.find((candidate) =>
          candidate.queueEntry.queueEntryId === entry.queueEntryId)
        if (active) {
          assertSameEntry(active.queueEntry, entry)
          return enqueueResult('active_replay', entry, current.state)
        }
        assertNoCrossedAttempt(current.state, entry)
        if (current.state.queuedEntries.length >=
          CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES) {
          throw new Error(
            'Professional GPU fair queue is at its bounded admission limit.',
          )
        }
        const next = sealState({
          ...statePayload(current.state),
          revision: current.state.revision + 1,
          queuedEntries: [...current.state.queuedEntries, entry]
            .sort(compareQueueEntries),
          queuedCount: current.state.queuedEntries.length + 1,
          priorStateRef: stateRef(current.state),
          updatedAt: maxTimestamp(current.state.updatedAt, entry.enqueuedAt),
        })
        const replaced = await input.statePort.compareAndSwap({
          queueId,
          runtimeRegion,
          expectedStorageRevision: current.storageRevision,
          nextState: next,
        })
        if (replaced === 'replaced') {
          return enqueueResult('queued', entry, next)
        }
      }
      throw new Error('Professional GPU fair-queue enqueue remained contested.')
    },

    async claimAvailable(untrusted) {
      const scheduleId = safeId.parse(untrusted.scheduleId)
      const scheduledAt = timestamp.parse(untrusted.scheduledAt)
      const capacities = z.array(z.unknown()).min(1).max(3)
        .parse(clonePlain(untrusted.capacities,
          'professional_gpu_queue_capacities'))
        .map(assertCanonicalProfessionalGpuFairQueueCapacity)
      for (let casAttempt = 1;
        casAttempt <= CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_MAXIMUM_CAS_ATTEMPTS;
        casAttempt += 1) {
        const current = await readOrEmpty({
          statePort: input.statePort,
          queueId,
          runtimeRegion,
          at: scheduledAt,
        })
        const terminalClaims = await terminalClaimsForState({
          terminalPort: input.terminalPort,
          queueId,
          runtimeRegion,
          state: current.state,
        })
        const terminalIds = new Set(terminalClaims.map((claim) =>
          claim.queueEntry.queueEntryId))
        const liveClaims = current.state.activeClaims.filter((claim) =>
          !terminalIds.has(claim.queueEntry.queueEntryId))
        const schedule = compileCanonicalProfessionalGpuFairQueueSchedule({
          scheduleId,
          queueEntries: current.state.queuedEntries,
          activeAttempts: liveClaims.map((claim) => ({
            queueEntryId: claim.queueEntry.queueEntryId,
            workspaceId: claim.queueEntry.workspaceId,
            routeId: claim.queueEntry.routeId,
            executionAttemptRef: claim.queueEntry.executionAttemptRef,
            startedAt: claim.claimedAt,
          })),
          capacities,
          scheduledAt,
        })
        const admittedIds = new Set(schedule.admittedEntries.map((entry) =>
          entry.queueEntryId))
        const admittedEntries = current.state.queuedEntries.filter((entry) =>
          admittedIds.has(entry.queueEntryId))
        const claims = admittedEntries.map((entry) => sealClaim({
          schemaVersion:
            CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_CLAIM_VERSION,
          source: 'canonical_server_professional_gpu_fair_queue_owner',
          queueId,
          runtimeRegion,
          queueEntry: entry,
          scheduleRef: scheduleRef(schedule),
          claimId: claimId(queueId, entry, schedule),
          claimedAt: scheduledAt,
          cloudGpuDispatchStarted: false,
          customerCreditsMutated: false,
          automaticRetryAllowed: false,
        }))
        if (claims.length === 0 && terminalClaims.length === 0) {
          return claimResult(
            'no_capacity_available',
            schedule,
            [],
            current.state,
            0,
          )
        }
        const next = sealState({
          ...statePayload(current.state),
          revision: current.state.revision + 1,
          queuedEntries: current.state.queuedEntries.filter((entry) =>
            !admittedIds.has(entry.queueEntryId)),
          activeClaims: [...liveClaims, ...claims].sort(compareClaims),
          queuedCount: current.state.queuedEntries.length - claims.length,
          activeCount: liveClaims.length + claims.length,
          lastScheduleRef: scheduleRef(schedule),
          priorStateRef: stateRef(current.state),
          updatedAt: maxTimestamp(current.state.updatedAt, scheduledAt),
        })
        const replaced = await input.statePort.compareAndSwap({
          queueId,
          runtimeRegion,
          expectedStorageRevision: current.storageRevision,
          nextState: next,
        })
        if (replaced === 'replaced') {
          return claimResult(
            claims.length > 0 ? 'claims_created' : 'no_capacity_available',
            schedule,
            claims,
            next,
            terminalClaims.length,
          )
        }
      }
      throw new Error('Professional GPU fair-queue claim remained contested.')
    },

    async finalize(untrusted) {
      const request = z.object({
        queueEntryId: safeId,
        executionAttemptRef: refSchema,
        claimRef: refSchema,
        terminalEvidenceRef: refSchema,
        disposition: z.enum(['completed', 'failed_reconciled']),
        terminalAt: timestamp,
      }).strict().parse(clonePlain(
        untrusted,
        'professional_gpu_queue_finalize',
      ))
      const existingTerminal = await input.terminalPort.readExact({
        queueId,
        runtimeRegion,
        queueEntryId: request.queueEntryId,
      })
      if (existingTerminal) {
        assertTerminalMatchesRequest(existingTerminal, request)
        const current = await readOrEmpty({
          statePort: input.statePort,
          queueId,
          runtimeRegion,
          at: request.terminalAt,
        })
        return finalizeResult('terminal_replay', existingTerminal,
          current.state)
      }

      for (let casAttempt = 1;
        casAttempt <= CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_MAXIMUM_CAS_ATTEMPTS;
        casAttempt += 1) {
        const current = await readOrEmpty({
          statePort: input.statePort,
          queueId,
          runtimeRegion,
          at: request.terminalAt,
        })
        const claim = current.state.activeClaims.find((candidate) =>
          candidate.queueEntry.queueEntryId === request.queueEntryId)
        if (!claim) {
          const racedTerminal = await input.terminalPort.readExact({
            queueId,
            runtimeRegion,
            queueEntryId: request.queueEntryId,
          })
          if (racedTerminal) {
            assertTerminalMatchesRequest(racedTerminal, request)
            return finalizeResult('terminal_replay', racedTerminal,
              current.state)
          }
          throw new Error(
            'Professional GPU terminal request has no exact active claim.',
          )
        }
        if (!sameRef(claim.queueEntry.executionAttemptRef,
            request.executionAttemptRef)
          || !sameRef(ref(claim.claimId, claim.claimHash), request.claimRef)) {
          throw new Error(
            'Professional GPU terminal request has no exact active claim.',
          )
        }
        const terminal = sealTerminal({
          schemaVersion:
            CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TERMINAL_VERSION,
          source: 'canonical_server_professional_gpu_fair_queue_owner',
          evidenceClass: 'create_only_exact_terminal_reconciliation',
          queueId,
          runtimeRegion,
          queueEntryRef: queueEntryRef(claim.queueEntry),
          executionAttemptRef: claim.queueEntry.executionAttemptRef,
          claimRef: ref(claim.claimId, claim.claimHash),
          terminalEvidenceRef: request.terminalEvidenceRef,
          disposition: request.disposition,
          terminalAt: request.terminalAt,
          automaticRetryStarted: false,
          customerCreditsMutated: false,
          qaApproved: false,
          publicDeliveryAuthorized: false,
          productionAuthorityGranted: false,
        })
        await input.terminalPort.createOnly({ terminal })
        const reread = await input.terminalPort.readExact({
          queueId,
          runtimeRegion,
          queueEntryId: request.queueEntryId,
        })
        if (!reread || reread.terminalHash !== terminal.terminalHash) {
          throw new Error('Professional GPU terminal exact reread changed.')
        }
        const next = sealState({
          ...statePayload(current.state),
          revision: current.state.revision + 1,
          activeClaims: current.state.activeClaims.filter((candidate) =>
            candidate.queueEntry.queueEntryId !== request.queueEntryId),
          activeCount: current.state.activeClaims.length - 1,
          priorStateRef: stateRef(current.state),
          updatedAt: maxTimestamp(current.state.updatedAt, request.terminalAt),
        })
        const replaced = await input.statePort.compareAndSwap({
          queueId,
          runtimeRegion,
          expectedStorageRevision: current.storageRevision,
          nextState: next,
        })
        if (replaced === 'replaced') {
          return finalizeResult('finalized', terminal, next)
        }
        const terminalAfterRace = await input.terminalPort.readExact({
          queueId,
          runtimeRegion,
          queueEntryId: request.queueEntryId,
        })
        if (!terminalAfterRace
          || terminalAfterRace.terminalHash !== terminal.terminalHash) {
          throw new Error('Professional GPU terminal raced inconsistently.')
        }
      }
      throw new Error(
        'Professional GPU fair-queue finalization remained contested.',
      )
    },

    async readCurrent() {
      const current = await readOrEmpty({
        statePort: input.statePort,
        queueId,
        runtimeRegion,
        at: new Date(0).toISOString(),
      })
      return current.state
    },
  }
  return Object.freeze(coordinator)
}

export function assertCanonicalProfessionalGpuFairQueueState(
  value: unknown,
): CanonicalProfessionalGpuFairQueueState {
  const parsed = canonicalProfessionalGpuFairQueueStateSchema.parse(
    clonePlain(value, 'professional_gpu_fair_queue_state'),
  )
  const { stateHash, ...payload } = parsed
  if (stateHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional GPU fair-queue state digest changed.')
  }
  for (const claim of parsed.activeClaims) assertClaim(claim)
  return parsed
}

export function assertCanonicalProfessionalGpuFairQueueTerminal(
  value: unknown,
): CanonicalProfessionalGpuFairQueueTerminal {
  const parsed = canonicalProfessionalGpuFairQueueTerminalSchema.parse(
    clonePlain(value, 'professional_gpu_fair_queue_terminal'),
  )
  const { terminalHash, ...payload } = parsed
  if (terminalHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional GPU fair-queue terminal digest changed.')
  }
  return parsed
}

function assertClaim(value: unknown): CanonicalProfessionalGpuFairQueueClaim {
  const parsed = activeClaimSchema.parse(value)
  const { claimHash, ...payload } = parsed
  if (claimHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional GPU fair-queue claim digest changed.')
  }
  return parsed
}

function sealClaim(
  payload: z.input<typeof activeClaimWithoutHashSchema>,
): CanonicalProfessionalGpuFairQueueClaim {
  const parsed = activeClaimWithoutHashSchema.parse(payload)
  return assertClaim({ ...parsed, claimHash: sha256AuthorityValue(parsed) })
}

function sealState(
  payload: z.input<typeof stateWithoutHashSchema>,
): CanonicalProfessionalGpuFairQueueState {
  const parsed = stateWithoutHashSchema.parse(payload)
  return assertCanonicalProfessionalGpuFairQueueState({
    ...parsed,
    stateHash: sha256AuthorityValue(parsed),
  })
}

function sealTerminal(
  payload: z.input<typeof terminalWithoutHashSchema>,
): CanonicalProfessionalGpuFairQueueTerminal {
  const parsed = terminalWithoutHashSchema.parse(payload)
  return assertCanonicalProfessionalGpuFairQueueTerminal({
    ...parsed,
    terminalHash: sha256AuthorityValue(parsed),
  })
}

async function readOrEmpty(input: {
  readonly statePort: CanonicalProfessionalGpuFairQueueCasStatePort
  readonly queueId: string
  readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
  readonly at: string
}): Promise<{
  readonly state: CanonicalProfessionalGpuFairQueueState
  readonly storageRevision: string | null
}> {
  const current = await input.statePort.readCurrent({
    queueId: input.queueId,
    runtimeRegion: input.runtimeRegion,
  })
  if (!current) return {
    state: emptyState(input.queueId, input.runtimeRegion, input.at),
    storageRevision: null,
  }
  const state = assertCanonicalProfessionalGpuFairQueueState(current.state)
  if (state.queueId !== input.queueId
    || state.runtimeRegion !== input.runtimeRegion
    || !sha256.safeParse(current.storageRevision).success) {
    throw new Error('Professional GPU queue state port crossed scope.')
  }
  return { state, storageRevision: current.storageRevision }
}

function emptyState(
  queueId: string,
  runtimeRegion: z.infer<typeof runtimeRegionSchema>,
  at: string,
): CanonicalProfessionalGpuFairQueueState {
  const createdAt = timestamp.parse(at)
  return sealState({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_STATE_VERSION,
    source: 'canonical_server_professional_gpu_fair_queue_owner',
    evidenceClass: 'shared_state_compare_and_swap_required',
    queueId,
    runtimeRegion,
    revision: 0,
    queuedEntries: [],
    activeClaims: [],
    queuedCount: 0,
    activeCount: 0,
    maximumQueueEntries: CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES,
    maximumActiveAttemptsPerWorkspace:
      CANONICAL_PROFESSIONAL_GPU_MAXIMUM_ACTIVE_PER_WORKSPACE,
    schedulerVersion: CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_SCHEDULER_VERSION,
    lastScheduleRef: null,
    priorStateRef: null,
    userTriggeredApprovedAndFundedEntriesOnly: true,
    cpuSubstantiveFallbackAllowed: false,
    automaticQualityReductionAllowed: false,
    silentAdditionalCreditApprovalAllowed: false,
    callerSelectedPriorityCapacityOrRouteAccepted: false,
    cloudTasksDispatchStartedByStateOwner: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    createdAt,
    updatedAt: createdAt,
  })
}

function statePayload(state: CanonicalProfessionalGpuFairQueueState) {
  const { stateHash, ...payload } = state
  sha256.parse(stateHash)
  return payload
}

async function terminalClaimsForState(input: {
  readonly terminalPort: CanonicalProfessionalGpuFairQueueTerminalPort
  readonly queueId: string
  readonly runtimeRegion: z.infer<typeof runtimeRegionSchema>
  readonly state: CanonicalProfessionalGpuFairQueueState
}): Promise<CanonicalProfessionalGpuFairQueueClaim[]> {
  const pairs = await Promise.all(input.state.activeClaims.map(async (claim) => ({
    claim,
    terminal: await input.terminalPort.readExact({
      queueId: input.queueId,
      runtimeRegion: input.runtimeRegion,
      queueEntryId: claim.queueEntry.queueEntryId,
    }),
  })))
  return pairs.filter((pair) => {
    if (!pair.terminal) return false
    assertTerminalMatchesEntry(pair.terminal, pair.claim.queueEntry)
    if (!sameRef(pair.terminal.claimRef,
      ref(pair.claim.claimId, pair.claim.claimHash))) {
      throw new Error('Professional GPU terminal crossed an active claim.')
    }
    return true
  }).map((pair) => pair.claim)
}

function assertPorts(
  statePort: CanonicalProfessionalGpuFairQueueCasStatePort,
  terminalPort: CanonicalProfessionalGpuFairQueueTerminalPort,
): void {
  if (!statePort || typeof statePort.readCurrent !== 'function'
    || typeof statePort.compareAndSwap !== 'function'
    || statePort.productionAuthority !== false
    || !terminalPort || typeof terminalPort.createOnly !== 'function'
    || typeof terminalPort.readExact !== 'function'
    || typeof terminalPort.readExactByExecutionAttemptRef !== 'function'
    || terminalPort.createOnlyAndExactReread !== true
    || terminalPort.productionAuthority !== false) {
    throw new Error('Professional GPU fair-queue ports are invalid.')
  }
}

function assertNoCrossedAttempt(
  state: CanonicalProfessionalGpuFairQueueState,
  entry: CanonicalProfessionalGpuFairQueueEntry,
): void {
  const attempt = stableAuthorityStringify(entry.executionAttemptRef)
  const all = [
    ...state.queuedEntries,
    ...state.activeClaims.map((claim) => claim.queueEntry),
  ]
  if (all.some((candidate) =>
    stableAuthorityStringify(candidate.executionAttemptRef) === attempt)) {
    throw new Error('Professional GPU execution attempt crossed queue entries.')
  }
}

function assertSameEntry(
  left: CanonicalProfessionalGpuFairQueueEntry,
  right: CanonicalProfessionalGpuFairQueueEntry,
): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw new Error('Professional GPU queue entry replay changed.')
  }
}

function assertTerminalMatchesEntry(
  terminal: CanonicalProfessionalGpuFairQueueTerminal,
  entry: CanonicalProfessionalGpuFairQueueEntry,
): void {
  const parsed = assertCanonicalProfessionalGpuFairQueueTerminal(terminal)
  if (!sameRef(parsed.queueEntryRef, queueEntryRef(entry))
    || !sameRef(parsed.executionAttemptRef, entry.executionAttemptRef)) {
    throw new Error('Professional GPU terminal crossed its queue entry.')
  }
}

function assertTerminalMatchesRequest(
  terminal: CanonicalProfessionalGpuFairQueueTerminal,
  request: {
    readonly queueEntryId: string
    readonly executionAttemptRef: EvidenceRef
    readonly claimRef: EvidenceRef
    readonly terminalEvidenceRef: EvidenceRef
    readonly disposition: 'completed' | 'failed_reconciled'
    readonly terminalAt: string
  },
): void {
  const parsed = assertCanonicalProfessionalGpuFairQueueTerminal(terminal)
  if (parsed.queueEntryRef.id !== request.queueEntryId
    || !sameRef(parsed.executionAttemptRef, request.executionAttemptRef)
    || !sameRef(parsed.claimRef, request.claimRef)
    || !sameRef(parsed.terminalEvidenceRef, request.terminalEvidenceRef)
    || parsed.disposition !== request.disposition
    || parsed.terminalAt !== request.terminalAt) {
    throw new Error('Professional GPU terminal replay changed.')
  }
}

function enqueueResult(
  disposition: CanonicalProfessionalGpuFairQueueEnqueueResult['disposition'],
  entry: CanonicalProfessionalGpuFairQueueEntry,
  state: CanonicalProfessionalGpuFairQueueState,
): CanonicalProfessionalGpuFairQueueEnqueueResult {
  return Object.freeze({
    disposition,
    queueEntryRef: queueEntryRef(entry),
    queueStateRef: stateRef(state),
    queuedCount: state.queuedCount,
    activeCount: state.activeCount,
    cloudGpuDispatchStarted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  })
}

function claimResult(
  disposition: CanonicalProfessionalGpuFairQueueClaimResult['disposition'],
  schedule: CanonicalProfessionalGpuFairQueueSchedule,
  claims: readonly CanonicalProfessionalGpuFairQueueClaim[],
  state: CanonicalProfessionalGpuFairQueueState,
  reconciledTerminalClaimCount: number,
): CanonicalProfessionalGpuFairQueueClaimResult {
  return Object.freeze({
    disposition,
    schedule,
    claims: Object.freeze([...claims]),
    queueStateRef: stateRef(state),
    reconciledTerminalClaimCount,
    cloudGpuDispatchStarted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  })
}

function finalizeResult(
  disposition: CanonicalProfessionalGpuFairQueueFinalizeResult['disposition'],
  terminal: CanonicalProfessionalGpuFairQueueTerminal,
  state: CanonicalProfessionalGpuFairQueueState,
): CanonicalProfessionalGpuFairQueueFinalizeResult {
  return Object.freeze({
    disposition,
    terminal,
    queueStateRef: stateRef(state),
    cloudGpuDispatchStarted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  })
}

function queueEntryRef(entry: CanonicalProfessionalGpuFairQueueEntry) {
  return ref(entry.queueEntryId, sha256AuthorityValue(entry))
}

function scheduleRef(schedule: CanonicalProfessionalGpuFairQueueSchedule) {
  return ref(schedule.scheduleId, schedule.scheduleHash)
}

function stateRef(state: CanonicalProfessionalGpuFairQueueState) {
  return ref(`${state.queueId}.state.${state.revision}`, state.stateHash)
}

function claimId(
  queueId: string,
  entry: CanonicalProfessionalGpuFairQueueEntry,
  schedule: CanonicalProfessionalGpuFairQueueSchedule,
): string {
  return `gpu-claim:${sha256AuthorityValue({
    queueId,
    queueEntryId: entry.queueEntryId,
    executionAttemptRef: entry.executionAttemptRef,
    scheduleHash: schedule.scheduleHash,
  })}`
}

function ref(id: string, hash: string): EvidenceRef {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function compareQueueEntries(
  left: CanonicalProfessionalGpuFairQueueEntry,
  right: CanonicalProfessionalGpuFairQueueEntry,
): number {
  return compareUtf16(left.enqueuedAt, right.enqueuedAt)
    || left.enqueueOrdinal - right.enqueueOrdinal
    || compareUtf16(left.queueEntryId, right.queueEntryId)
}

function compareClaims(
  left: CanonicalProfessionalGpuFairQueueClaim,
  right: CanonicalProfessionalGpuFairQueueClaim,
): number {
  return compareUtf16(left.claimedAt, right.claimedAt)
    || compareUtf16(left.queueEntry.queueEntryId,
      right.queueEntry.queueEntryId)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function maxTimestamp(left: string, right: string): string {
  return Date.parse(left) >= Date.parse(right) ? left : right
}

function clonePlain(value: unknown, label: string): unknown {
  return cloneBoundedPlainData(value, label, {
    seen: new Set<object>(),
    entries: 0,
  })
}

function cloneBoundedPlainData(
  value: unknown,
  label: string,
  state: { readonly seen: Set<object>; entries: number },
  depth = 0,
): unknown {
  if (depth > 18) throw new Error(`${label} nesting is too deep.`)
  if (value === null || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))) return value
  if (typeof value === 'string') {
    if (value.length > 16_384) throw new Error(`${label} string is too long.`)
    return value
  }
  if (typeof value !== 'object') {
    throw new Error(`${label} is not serialized plain data.`)
  }
  if (state.seen.has(value)) throw new Error(`${label} contains a cycle.`)
  let prototype: object | null
  let keys: readonly PropertyKey[]
  let descriptors: PropertyDescriptorMap
  try {
    prototype = Object.getPrototypeOf(value)
    keys = Reflect.ownKeys(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    throw new Error(`${label} could not be inspected safely.`)
  }
  const isArray = Array.isArray(value)
  if (prototype !== (isArray ? Array.prototype : Object.prototype)) {
    throw new Error(`${label} has a non-plain prototype.`)
  }
  if (keys.some((key) => typeof key !== 'string')) {
    throw new Error(`${label} has a symbol key.`)
  }
  state.entries += keys.length
  if (state.entries > 750_000) {
    throw new Error(`${label} serialized tree is too large.`)
  }
  state.seen.add(value)
  if (isArray) {
    const lengthDescriptor = descriptors.length
    if (!lengthDescriptor || !('value' in lengthDescriptor)
      || !Number.isSafeInteger(lengthDescriptor.value)
      || lengthDescriptor.value < 0
      || lengthDescriptor.value >
        CANONICAL_PROFESSIONAL_GPU_MAXIMUM_QUEUE_ENTRIES) {
      throw new Error(`${label} exceeds its bounded array length.`)
    }
    const length = lengthDescriptor.value as number
    if (keys.length !== length + 1) {
      throw new Error(`${label} must be dense and index-only.`)
    }
    const cloned = Array.from({ length }, (_, index) => {
      const descriptor = descriptors[String(index)]
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label}[${index}] must be a data property.`)
      }
      return cloneBoundedPlainData(
        descriptor.value,
        `${label}[${index}]`,
        state,
        depth + 1,
      )
    })
    state.seen.delete(value)
    return cloned
  }
  if (keys.length > 512) throw new Error(`${label} has too many entries.`)
  const cloned: Record<string, unknown> = {}
  for (const key of keys as readonly string[]) {
    const descriptor = descriptors[key]
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${label}.${key} must be a data property.`)
    }
    cloned[key] = cloneBoundedPlainData(
      descriptor.value,
      `${label}.${key}`,
      state,
      depth + 1,
    )
  }
  state.seen.delete(value)
  return cloned
}
