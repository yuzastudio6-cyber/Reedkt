import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuCloudTaskDispatchResult,
  compileCanonicalProfessionalGpuCloudTaskSpec,
  type CanonicalProfessionalGpuCloudTaskDispatchPort,
  type CanonicalProfessionalGpuCloudTaskRuntimeConfig,
} from './canonical-professional-gpu-cloud-task-dispatch'
import {
  assertCanonicalProfessionalGpuCloudTaskOutboxResult,
  sealCanonicalProfessionalGpuCloudTaskOutboxRequest,
  type CanonicalProfessionalGpuCloudTaskOutboxAdapter,
} from './canonical-professional-gpu-cloud-task-outbox-port'
import {
  assertCanonicalProfessionalGpuFairQueueCapacity,
  type CanonicalProfessionalGpuFairQueueCapacity,
} from './canonical-professional-gpu-fair-queue-scheduler'
import {
  assertCanonicalProfessionalGpuFairQueueTransactionResult,
  sealCanonicalProfessionalGpuFairQueueTransactionRequest,
  type CanonicalProfessionalGpuFairQueueDurableClaim,
  type CanonicalProfessionalGpuFairQueueTransactionAdapter,
} from './canonical-professional-gpu-fair-queue-transaction-port'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SCHEDULER_VERSION =
  'canonical-professional-gpu-cloud-task-scheduler-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SCHEDULER_RESULT_VERSION =
  'canonical-professional-gpu-cloud-task-scheduler-result-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const dispatchRecordSchema = z.object({
  queueEntryId: safeId,
  claimId: safeId,
  cloudTaskName: safeId.nullable(),
  disposition: z.enum([
    'task_created_and_queue_marked_dispatched',
    'existing_task_reconciled_and_queue_marked_dispatched',
    'known_not_created_awaiting_safe_lease_recovery',
    'unknown_outcome_requires_reconciliation',
    'existing_outbox_requires_reconciliation',
  ]),
  externalCreateOutcome: z.enum(['created', 'not_created', 'unknown']),
  queueMarkedDispatched: z.boolean(),
  automaticCreateRetryStarted: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
}).strict().superRefine((record, context) => {
  const marked = record.disposition ===
      'task_created_and_queue_marked_dispatched'
    || record.disposition ===
      'existing_task_reconciled_and_queue_marked_dispatched'
  if (marked !== record.queueMarkedDispatched
    || marked !== (record.externalCreateOutcome === 'created')
    || marked !== (record.cloudTaskName !== null)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU scheduler dispatch disposition is inconsistent.',
    })
  }
})
const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SCHEDULER_RESULT_VERSION,
  ),
  source: z.literal('canonical_server_professional_gpu_cloud_task_scheduler'),
  schedulerCycleId: safeId,
  queueId: z.literal('weeditpro-professional-gpu-production-v1'),
  runtimeRegion: z.literal('us-central1'),
  recoveryDisposition: z.literal('recovery_completed'),
  recoveredBeforeExternalDispatchCount: z.number().int().nonnegative().max(192),
  reconciliationRequiredCount: z.number().int().nonnegative().max(192),
  claimDisposition: z.enum(['claims_created', 'no_capacity_available']),
  claimedCount: z.number().int().nonnegative().max(192),
  dispatchRecords: z.array(dispatchRecordSchema).max(192),
  createdTaskCount: z.number().int().nonnegative().max(192),
  knownNotCreatedCount: z.number().int().nonnegative().max(192),
  unknownOrReconciliationCount: z.number().int().nonnegative().max(192),
  capacityRereadByServerOwner: z.literal(true),
  durableClaimBeforeExternalDispatch: z.literal(true),
  durableOutboxBeforeCloudTaskCreate: z.literal(true),
  cloudTaskConsumerMustRereadExactAuthorities: z.literal(true),
  directGpuInvocationStartedByScheduler: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  startedAt: timestamp,
  completedAt: timestamp,
}).strict().superRefine((result, context) => {
  const created = result.dispatchRecords.filter((record) =>
    record.externalCreateOutcome === 'created').length
  const notCreated = result.dispatchRecords.filter((record) =>
    record.externalCreateOutcome === 'not_created').length
  const unknown = result.dispatchRecords.length - created - notCreated
  if (result.claimedCount !== result.dispatchRecords.length
    || result.createdTaskCount !== created
    || result.knownNotCreatedCount !== notCreated
    || result.unknownOrReconciliationCount !== unknown
    || Date.parse(result.completedAt) < Date.parse(result.startedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU scheduler result counts or timestamps differ.',
    })
  }
})
const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: sha256,
}).strict()
export type CanonicalProfessionalGpuCloudTaskSchedulerResult = z.infer<
  typeof resultSchema
>

export interface CanonicalProfessionalGpuFairQueueCapacityReadPort {
  readonly schemaVersion:
    'canonical-professional-gpu-fair-queue-capacity-read-port-v1'
  readonly serverOwnedCurrentQuotaRuntimeAndActiveCounts: true
  readonly callerCapacityAccepted: false
  readonly productionAuthority: false
  rereadCurrent(input: {
    readonly queueId: 'weeditpro-professional-gpu-production-v1'
    readonly runtimeRegion: 'us-central1'
    readonly observedAt: string
  }): Promise<readonly CanonicalProfessionalGpuFairQueueCapacity[]>
}

export interface CanonicalProfessionalGpuCloudTaskScheduler {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SCHEDULER_VERSION
  readonly queueId: 'weeditpro-professional-gpu-production-v1'
  readonly runtimeRegion: 'us-central1'
  readonly directGpuInvocationAllowed: false
  readonly callerCapacityAccepted: false
  readonly automaticExternalCreateRetryAllowed: false
  readonly productionAuthority: false
  runOneCycle(): Promise<CanonicalProfessionalGpuCloudTaskSchedulerResult>
}

export function createCanonicalProfessionalGpuCloudTaskScheduler(input: {
  readonly queueAdapter: CanonicalProfessionalGpuFairQueueTransactionAdapter
  readonly outboxAdapter: CanonicalProfessionalGpuCloudTaskOutboxAdapter
  readonly dispatchPort: CanonicalProfessionalGpuCloudTaskDispatchPort
  readonly runtimeConfig: CanonicalProfessionalGpuCloudTaskRuntimeConfig
  readonly capacityReadPort:
    CanonicalProfessionalGpuFairQueueCapacityReadPort
  readonly dispatcherInstanceId: string
  readonly dispatchableRouteIds?: readonly CanonicalProfessionalGpuFairQueueCapacity[
    'routeId'
  ][]
  readonly now?: () => string
}): CanonicalProfessionalGpuCloudTaskScheduler {
  requireProductionDurability(input)
  const dispatcherInstanceId = safeId.parse(input.dispatcherInstanceId)
  const dispatchableRouteIds = new Set(z.array(z.enum([
    'a100_80gb_heavy_primary',
    'l4_heavy_fallback',
    'l4_standard_primary',
  ])).min(1).max(3).parse(input.dispatchableRouteIds ?? [
    'a100_80gb_heavy_primary',
    'l4_heavy_fallback',
    'l4_standard_primary',
  ]))
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SCHEDULER_VERSION,
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    directGpuInvocationAllowed: false as const,
    callerCapacityAccepted: false as const,
    automaticExternalCreateRetryAllowed: false as const,
    productionAuthority: false as const,
    async runOneCycle() {
      const startedAt = timestamp.parse(now())
      const schedulerCycleId = `gpu-scheduler-${sha256AuthorityValue({
        domain: 'professional_gpu_cloud_task_scheduler_cycle_v1',
        dispatcherInstanceId,
        startedAt,
      })}`
      const recovery = assertCanonicalProfessionalGpuFairQueueTransactionResult(
        await input.queueAdapter.recoverExpiredDispatchLeases(
          sealCanonicalProfessionalGpuFairQueueTransactionRequest({
            schemaVersion:
              'canonical-professional-gpu-fair-queue-transaction-port-v1',
            requestId: `${schedulerCycleId}:recover`,
            queueId: 'weeditpro-professional-gpu-production-v1',
            runtimeRegion: 'us-central1',
            operation: 'recover_expired_dispatch_leases',
            observedAt: startedAt,
            maximumEntries: 192,
          }),
        ),
      )
      if (recovery.operation !== 'recover_expired_dispatch_leases'
        || recovery.disposition !== 'recovery_completed') {
        throw new TypeError('GPU scheduler recovery lineage changed.')
      }
      const observedCapacities = z.array(z.unknown()).min(1).max(3).parse(
        await input.capacityReadPort.rereadCurrent({
          queueId: 'weeditpro-professional-gpu-production-v1',
          runtimeRegion: 'us-central1',
          observedAt: startedAt,
        }),
      ).map(assertCanonicalProfessionalGpuFairQueueCapacity)
      const capacities = observedCapacities.filter((capacity) =>
        dispatchableRouteIds.has(capacity.routeId))
      if (capacities.length === 0) {
        throw new TypeError(
          'GPU scheduler has no capacity for a mounted task consumer route.',
        )
      }
      const capacityRefs = capacities.map((capacity) =>
        capacity.capacityObservationRef)
      const scheduleId = `gpu-schedule-${sha256AuthorityValue({
        domain: 'professional_gpu_cloud_task_schedule_v1',
        schedulerCycleId,
        capacityRefs,
      })}`
      const claimResult =
        assertCanonicalProfessionalGpuFairQueueTransactionResult(
          await input.queueAdapter.claim(
            sealCanonicalProfessionalGpuFairQueueTransactionRequest({
              schemaVersion:
                'canonical-professional-gpu-fair-queue-transaction-port-v1',
              requestId: `${schedulerCycleId}:claim`,
              queueId: 'weeditpro-professional-gpu-production-v1',
              runtimeRegion: 'us-central1',
              operation: 'claim',
              scheduleId,
              capacities,
              claimedAt: startedAt,
              dispatchLeaseDurationSeconds: 300,
            }),
          ),
        )
      if (claimResult.operation !== 'claim'
        || (claimResult.disposition !== 'claims_created'
          && claimResult.disposition !== 'no_capacity_available')) {
        throw new TypeError('GPU scheduler claim lineage changed.')
      }
      const dispatchRecords = await Promise.all(claimResult.claims.map(
        (claim) => dispatchClaim({
          claim,
          schedulerCycleId,
          dispatcherInstanceId,
          compiledAt: startedAt,
          runtimeConfig: input.runtimeConfig,
          queueAdapter: input.queueAdapter,
          outboxAdapter: input.outboxAdapter,
          dispatchPort: input.dispatchPort,
        }),
      ))
      const completedAt = timestamp.parse(now())
      const payload = resultWithoutDigestSchema.parse({
        schemaVersion:
          CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SCHEDULER_RESULT_VERSION,
        source: 'canonical_server_professional_gpu_cloud_task_scheduler',
        schedulerCycleId,
        queueId: 'weeditpro-professional-gpu-production-v1',
        runtimeRegion: 'us-central1',
        recoveryDisposition: 'recovery_completed',
        recoveredBeforeExternalDispatchCount:
          recovery.requeuedBeforeDispatchCount,
        reconciliationRequiredCount:
          recovery.reconciliationRequiredCount,
        claimDisposition: claimResult.disposition,
        claimedCount: claimResult.claims.length,
        dispatchRecords,
        createdTaskCount: dispatchRecords.filter((record) =>
          record.externalCreateOutcome === 'created').length,
        knownNotCreatedCount: dispatchRecords.filter((record) =>
          record.externalCreateOutcome === 'not_created').length,
        unknownOrReconciliationCount: dispatchRecords.filter((record) =>
          record.externalCreateOutcome === 'unknown').length,
        capacityRereadByServerOwner: true,
        durableClaimBeforeExternalDispatch: true,
        durableOutboxBeforeCloudTaskCreate: true,
        cloudTaskConsumerMustRereadExactAuthorities: true,
        directGpuInvocationStartedByScheduler: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        startedAt,
        completedAt,
      })
      return assertCanonicalProfessionalGpuCloudTaskSchedulerResult({
        ...payload,
        resultDigestSha256: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertCanonicalProfessionalGpuCloudTaskSchedulerResult(
  value: unknown,
): CanonicalProfessionalGpuCloudTaskSchedulerResult {
  assertPlainSerializedData(value, 'professional_gpu_scheduler_result')
  const parsed = resultSchema.parse(value)
  const { resultDigestSha256, ...payload } = parsed
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU scheduler result changed.')
  }
  return structuredClone(parsed)
}

async function dispatchClaim(input: {
  readonly claim: CanonicalProfessionalGpuFairQueueDurableClaim
  readonly schedulerCycleId: string
  readonly dispatcherInstanceId: string
  readonly compiledAt: string
  readonly runtimeConfig: CanonicalProfessionalGpuCloudTaskRuntimeConfig
  readonly queueAdapter: CanonicalProfessionalGpuFairQueueTransactionAdapter
  readonly outboxAdapter: CanonicalProfessionalGpuCloudTaskOutboxAdapter
  readonly dispatchPort: CanonicalProfessionalGpuCloudTaskDispatchPort
}): Promise<z.infer<typeof dispatchRecordSchema>> {
  const claimRef = ref(input.claim.claimId, input.claim.claimHash)
  const spec = compileCanonicalProfessionalGpuCloudTaskSpec({
    claim: input.claim,
    runtimeConfig: input.runtimeConfig,
    compiledAt: input.compiledAt,
  })
  const begin = assertCanonicalProfessionalGpuCloudTaskOutboxResult(
    await input.outboxAdapter.beginCreate(
      sealCanonicalProfessionalGpuCloudTaskOutboxRequest({
        schemaVersion:
          'canonical-professional-gpu-cloud-task-outbox-port-v1',
        requestId: `${input.schedulerCycleId}:begin:${shortHash(claimRef)}`,
        queueId: 'weeditpro-professional-gpu-production-v1',
        runtimeRegion: 'us-central1',
        operation: 'begin_create',
        queueEntryId: input.claim.queueEntry.queueEntryId,
        claimRef,
        cloudTaskSpec: spec,
        dispatcherInstanceId: input.dispatcherInstanceId,
        requestedAt: input.compiledAt,
        leaseDurationSeconds: 300,
      }),
    ),
  )
  if (begin.disposition === 'reconciliation_required') {
    return dispatchRecordSchema.parse({
      queueEntryId: input.claim.queueEntry.queueEntryId,
      claimId: input.claim.claimId,
      cloudTaskName: null,
      disposition: 'existing_outbox_requires_reconciliation',
      externalCreateOutcome: 'unknown',
      queueMarkedDispatched: false,
      automaticCreateRetryStarted: false,
      automaticNewExecutionAttemptAllowed: false,
    })
  }
  if (begin.disposition === 'not_created_replay') {
    return dispatchRecordSchema.parse({
      queueEntryId: input.claim.queueEntry.queueEntryId,
      claimId: input.claim.claimId,
      cloudTaskName: null,
      disposition: 'known_not_created_awaiting_safe_lease_recovery',
      externalCreateOutcome: 'not_created',
      queueMarkedDispatched: false,
      automaticCreateRetryStarted: false,
      automaticNewExecutionAttemptAllowed: false,
    })
  }
  const recorded = begin.disposition === 'created_replay'
    ? begin
    : await createAndRecordOutcome(input, begin, spec, claimRef)
  const dispatchResult = recorded.record.dispatchResult
  if (!dispatchResult || dispatchResult.providerOutcome !== 'created'
    || !dispatchResult.cloudTaskRef) {
    const unknown = dispatchResult?.providerOutcome !== 'not_created'
    return dispatchRecordSchema.parse({
      queueEntryId: input.claim.queueEntry.queueEntryId,
      claimId: input.claim.claimId,
      cloudTaskName: null,
      disposition: unknown
        ? 'unknown_outcome_requires_reconciliation'
        : 'known_not_created_awaiting_safe_lease_recovery',
      externalCreateOutcome: unknown ? 'unknown' : 'not_created',
      queueMarkedDispatched: false,
      automaticCreateRetryStarted: false,
      automaticNewExecutionAttemptAllowed: false,
    })
  }
  const marked = assertCanonicalProfessionalGpuFairQueueTransactionResult(
    await input.queueAdapter.markDispatched(
      sealCanonicalProfessionalGpuFairQueueTransactionRequest({
        schemaVersion:
          'canonical-professional-gpu-fair-queue-transaction-port-v1',
        requestId:
          `${input.schedulerCycleId}:mark:${shortHash(claimRef)}`,
        queueId: 'weeditpro-professional-gpu-production-v1',
        runtimeRegion: 'us-central1',
        operation: 'mark_dispatched',
        queueEntryId: input.claim.queueEntry.queueEntryId,
        executionAttemptRef: input.claim.queueEntry.executionAttemptRef,
        claimRef,
        cloudTaskDispatchReceiptRef: dispatchResult.cloudTaskRef,
        dispatchedAt: dispatchResult.observedAt,
      }),
    ),
  )
  if (marked.operation !== 'mark_dispatched'
    || (marked.disposition !== 'dispatch_recorded'
      && marked.disposition !== 'dispatch_replay')) {
    throw new TypeError('GPU scheduler dispatch mark lineage changed.')
  }
  return dispatchRecordSchema.parse({
    queueEntryId: input.claim.queueEntry.queueEntryId,
    claimId: input.claim.claimId,
    cloudTaskName: dispatchResult.cloudTaskRef.id,
    disposition: dispatchResult.disposition ===
      'existing_task_exactly_reconciled'
      ? 'existing_task_reconciled_and_queue_marked_dispatched'
      : 'task_created_and_queue_marked_dispatched',
    externalCreateOutcome: 'created',
    queueMarkedDispatched: true,
    automaticCreateRetryStarted: false,
    automaticNewExecutionAttemptAllowed: false,
  })
}

async function createAndRecordOutcome(
  input: Parameters<typeof dispatchClaim>[0],
  begin: ReturnType<typeof assertCanonicalProfessionalGpuCloudTaskOutboxResult>,
  spec: ReturnType<typeof compileCanonicalProfessionalGpuCloudTaskSpec>,
  claimRef: ReturnType<typeof ref>,
) {
  if (begin.disposition !== 'create_admitted') {
    throw new TypeError('GPU scheduler outbox did not admit one create.')
  }
  const dispatchResult = assertCanonicalProfessionalGpuCloudTaskDispatchResult(
    await input.dispatchPort.createOne(spec),
  )
  return assertCanonicalProfessionalGpuCloudTaskOutboxResult(
    await input.outboxAdapter.recordCreateOutcome(
      sealCanonicalProfessionalGpuCloudTaskOutboxRequest({
        schemaVersion:
          'canonical-professional-gpu-cloud-task-outbox-port-v1',
        requestId: `${input.schedulerCycleId}:outcome:${shortHash(claimRef)}`,
        queueId: 'weeditpro-professional-gpu-production-v1',
        runtimeRegion: 'us-central1',
        operation: 'record_create_outcome',
        queueEntryId: input.claim.queueEntry.queueEntryId,
        claimRef,
        createLeaseId: begin.record.createLeaseId,
        cloudTaskSpecRef: dispatchResult.cloudTaskSpecRef,
        dispatchResult,
        observedAt: dispatchResult.observedAt,
      }),
    ),
  )
}

function requireProductionDurability(input: {
  readonly queueAdapter: CanonicalProfessionalGpuFairQueueTransactionAdapter
  readonly outboxAdapter: CanonicalProfessionalGpuCloudTaskOutboxAdapter
  readonly dispatchPort: CanonicalProfessionalGpuCloudTaskDispatchPort
  readonly capacityReadPort:
    CanonicalProfessionalGpuFairQueueCapacityReadPort
}): void {
  if (!input.queueAdapter.multiReplicaDurabilityVerified
    || !input.outboxAdapter.multiReplicaDurabilityVerified
    || input.queueAdapter.browserOrFrontendClientAllowed
    || input.outboxAdapter.browserOrFrontendClientAllowed
    || input.queueAdapter.automaticTransportRetryAllowed
    || input.outboxAdapter.automaticTransportRetryAllowed
    || input.dispatchPort.browserOrFrontendAllowed
    || input.dispatchPort.automaticCreateRetryAllowed
    || !input.capacityReadPort.serverOwnedCurrentQuotaRuntimeAndActiveCounts
    || input.capacityReadPort.callerCapacityAccepted) {
    throw new TypeError(
      'GPU scheduler requires durable server-owned queue, outbox, capacity, and dispatch ports.',
    )
  }
}

function ref(id: string, hash: string) {
  return Object.freeze({
    id,
    version: 1,
    contentHash: `sha256:${hash}` as const,
  })
}

function shortHash(value: unknown): string {
  return sha256AuthorityValue(value).slice(0, 32)
}
