import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCloudDispatchOutboxCurrentAttempt,
  createCanonicalCloudDispatchOutboxEntry,
} from '../edit-architecture/canonical-cloud-dispatch-outbox-receiver-authority'
import {
  createCanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import type {
  CanonicalCloudDispatchOutboxEntry,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import type {
  CanonicalPrivatePackageWorkQueueCompletedOutcome,
  CanonicalPrivatePackageWorkQueueEntry,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  preparePrivateCanonicalCloudDispatchOutboxEntry,
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
  serializePrivateCanonicalCloudDispatchOutboxAggregate,
  type CanonicalCloudDispatchOutboxStoreScope,
} from './private-canonical-cloud-dispatch-outbox-store'
import {
  persistPrivateCanonicalPackageWorkQueueForPackageStateTransaction,
  preparePrivateCanonicalPackageWorkQueueJobClaim,
  readPrivateCanonicalPackageWorkQueueForPackageStateTransaction,
  serializePrivateCanonicalPackageWorkQueueAggregate,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  commitCanonicalPrivatePackageQueueOutboxTransaction,
  withCanonicalPrivatePackageStateLock,
  type CanonicalPrivatePackageStateFaultStage,
  type CanonicalPrivatePackageStateRecoveryEvidence,
  type CanonicalPrivatePackageStateTransactionCommitEvidence,
} from './private-canonical-package-state-transaction'
import { sha256AuthorityValue } from './private-edit-authority-store'

type NonDispatchDisposition =
  | 'dependency_blocked'
  | 'scheduled_wait'
  | 'capability_blocked'
  | 'attempts_exhausted'
  | 'user_review_required'
  | 'stale_attempt_reconciliation_required'

export type CanonicalPrivatePackageCloudDispatchTransactionResult =
  | {
      disposition: 'created' | 'exact_replay' | 'legacy_claim_reconciled'
      queueEntry: CanonicalPrivatePackageWorkQueueEntry & {
        activeClaim: NonNullable<CanonicalPrivatePackageWorkQueueEntry['activeClaim']>
      }
      outboxEntry: CanonicalCloudDispatchOutboxEntry
      attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
      recovery: CanonicalPrivatePackageStateRecoveryEvidence
      commit: CanonicalPrivatePackageStateTransactionCommitEvidence | null
      boundaries: ReturnType<typeof transactionBoundaries>
    }
  | {
      disposition: 'completed'
      queueEntry: CanonicalPrivatePackageWorkQueueEntry
      outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
      recovery: CanonicalPrivatePackageStateRecoveryEvidence
      boundaries: ReturnType<typeof transactionBoundaries>
    }
  | {
      disposition: NonDispatchDisposition
      queueEntry: CanonicalPrivatePackageWorkQueueEntry
      requiredGate?: string
      recovery: CanonicalPrivatePackageStateRecoveryEvidence
      boundaries: ReturnType<typeof transactionBoundaries>
    }

export async function claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope & CanonicalCloudDispatchOutboxStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  jobId: string
  workerIdentity: string
  now: string
  leaseDurationMs: number
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
}): Promise<CanonicalPrivatePackageCloudDispatchTransactionResult> {
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority, recovery) => {
      const queueBefore = await readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
        lockAuthority,
        input.scope,
        input.definition,
      )
      if (!queueBefore) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical package queue is unavailable for cloud dispatch.',
          404,
        )
      }
      const outboxBefore =
        await readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
          lockAuthority,
          input.scope,
        )
      const currentEntry = queueBefore.entries.find((entry) =>
        entry.definition.jobId === input.jobId)
      if (!currentEntry) {
        throw new ApiError('JOB_NOT_FOUND', 'Canonical package queue job was not found.', 404)
      }

      const expiredClaim = currentEntry.state === 'leased' && currentEntry.activeClaim &&
        Date.parse(currentEntry.activeClaim.expiresAt) <= Date.parse(input.now)
        ? currentEntry.activeClaim
        : undefined
      if (expiredClaim) {
        const existingAttempt = outboxBefore?.entries.find((entry) =>
          entry.immutable.jobId === currentEntry.definition.jobId &&
          entry.immutable.packageDeliveryAttempt === expiredClaim.deliveryAttempt &&
          entry.immutable.queueClaimId === expiredClaim.claimId)
        if (existingAttempt?.state === 'worker_identity_accepted') {
          return {
            disposition: 'stale_attempt_reconciliation_required',
            queueEntry: currentEntry,
            requiredGate:
              'canonical_cloud_dispatch_accepted_worker_timeout_reconciliation',
            recovery,
            boundaries: transactionBoundaries(),
          }
        }
        if (existingAttempt && [
          'worker_completion_reconciled',
          'worker_failure_reconciled',
          'worker_timeout_reconciled',
        ].includes(existingAttempt.state)) {
          throw new ApiError(
            'IDEMPOTENCY_ATOMICITY_REQUIRED',
            'A terminal cloud-dispatch attempt cannot retain a leased queue projection.',
            503,
          )
        }
      }

      const preparedClaim = preparePrivateCanonicalPackageWorkQueueJobClaim({
        aggregate: queueBefore,
        definition: input.definition,
        jobId: input.jobId,
        workerIdentity: input.workerIdentity,
        workerType: currentEntry.definition.workerType,
        now: input.now,
        leaseDurationMs: input.leaseDurationMs,
      })
      if (preparedClaim.disposition === 'already_leased') {
        if (!preparedClaim.entry.activeClaim) {
          throw new ApiError(
            'WORKER_CLAIM_CONFLICT',
            'Canonical package queue lost its active claim during dispatch preparation.',
            409,
          )
        }
        return reconcileOrReplayActiveClaim({
          input,
          lockAuthority,
          recovery,
          queueBefore,
          queueAfter: preparedClaim.aggregate,
          outboxBefore,
          currentEntry: preparedClaim.entry as CanonicalPrivatePackageWorkQueueEntry & {
            activeClaim: NonNullable<CanonicalPrivatePackageWorkQueueEntry['activeClaim']>
          },
        })
      }
      if (preparedClaim.disposition === 'completed') {
        await persistQueueOnlyMutationIfChanged({
          lockAuthority,
          scope: input.scope,
          queueBefore,
          queueAfter: preparedClaim.aggregate,
        })
        return {
          disposition: 'completed',
          queueEntry: preparedClaim.entry,
          outcome: preparedClaim.outcome,
          recovery,
          boundaries: transactionBoundaries(),
        }
      }
      if (preparedClaim.disposition !== 'claimed') {
        await persistQueueOnlyMutationIfChanged({
          lockAuthority,
          scope: input.scope,
          queueBefore,
          queueAfter: preparedClaim.aggregate,
        })
        return {
          disposition: preparedClaim.disposition,
          queueEntry: preparedClaim.entry,
          recovery,
          boundaries: transactionBoundaries(),
        }
      }

      const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
        manifest: input.manifest,
        jobId: input.jobId,
        deliveryAttempt: preparedClaim.entry.activeClaim.deliveryAttempt,
      })
      const outboxEntry = createCanonicalCloudDispatchOutboxEntry({
        queueDefinition: input.definition,
        queueAggregate: preparedClaim.aggregate,
        manifest: input.manifest,
        attemptPlan,
        now: input.now,
      })
      const preparedOutbox = preparePrivateCanonicalCloudDispatchOutboxEntry({
        scope: input.scope,
        aggregate: outboxBefore,
        entry: outboxEntry,
        now: input.now,
      })
      if (preparedOutbox.disposition !== 'created') {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'A new package claim cannot reuse an existing cloud dispatch intent.',
          409,
        )
      }
      const commit = await commitTransaction({
        input,
        lockAuthority,
        queueBeforeHash: queueBefore.aggregateHash,
        queueAfter: preparedClaim.aggregate,
        outboxBeforeHash: outboxBefore?.aggregateHash ?? null,
        outboxAfter: preparedOutbox.aggregate,
        queueEntry: preparedClaim.entry,
        outboxEntry: preparedOutbox.entry,
        attemptPlan,
        queueClaimCreatedInTransaction: true,
        transactionType: 'package_claim_and_cloud_dispatch_outbox_insert',
      })
      return {
        disposition: 'created',
        queueEntry: preparedClaim.entry,
        outboxEntry: preparedOutbox.entry,
        attemptPlan,
        recovery,
        commit,
        boundaries: transactionBoundaries(),
      }
    },
  })
}

async function reconcileOrReplayActiveClaim(input: {
  input: Parameters<typeof claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt>[0]
  lockAuthority: Parameters<typeof commitCanonicalPrivatePackageQueueOutboxTransaction>[0]['lockAuthority']
  recovery: CanonicalPrivatePackageStateRecoveryEvidence
  queueBefore: Awaited<ReturnType<
    typeof readPrivateCanonicalPackageWorkQueueForPackageStateTransaction
  >> & object
  queueAfter: Awaited<ReturnType<
    typeof readPrivateCanonicalPackageWorkQueueForPackageStateTransaction
  >> & object
  outboxBefore: Awaited<ReturnType<
    typeof readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction
  >>
  currentEntry: CanonicalPrivatePackageWorkQueueEntry & {
    activeClaim: NonNullable<CanonicalPrivatePackageWorkQueueEntry['activeClaim']>
  }
}): Promise<Extract<CanonicalPrivatePackageCloudDispatchTransactionResult, {
  disposition: 'created' | 'exact_replay' | 'legacy_claim_reconciled'
}>> {
  const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
    manifest: input.input.manifest,
    jobId: input.input.jobId,
    deliveryAttempt: input.currentEntry.activeClaim.deliveryAttempt,
  })
  const candidate = createCanonicalCloudDispatchOutboxEntry({
    queueDefinition: input.input.definition,
    queueAggregate: input.queueAfter,
    manifest: input.input.manifest,
    attemptPlan,
    now: input.input.now,
  })
  const preparedOutbox = preparePrivateCanonicalCloudDispatchOutboxEntry({
    scope: input.input.scope,
    aggregate: input.outboxBefore,
    entry: candidate,
    now: input.input.now,
  })
  if (preparedOutbox.disposition === 'exact_replay') {
    assertCanonicalCloudDispatchOutboxCurrentAttempt({
      entry: preparedOutbox.entry,
      queueDefinition: input.input.definition,
      queueAggregate: input.queueAfter,
      manifest: input.input.manifest,
      attemptPlan,
      now: input.input.now,
    })
    await persistQueueOnlyMutationIfChanged({
      lockAuthority: input.lockAuthority,
      scope: input.input.scope,
      queueBefore: input.queueBefore,
      queueAfter: input.queueAfter,
    })
    return {
      disposition: 'exact_replay',
      queueEntry: input.currentEntry,
      outboxEntry: preparedOutbox.entry,
      attemptPlan,
      recovery: input.recovery,
      commit: null,
      boundaries: transactionBoundaries(),
    }
  }

  const commit = await commitTransaction({
    input: input.input,
    lockAuthority: input.lockAuthority,
    queueBeforeHash: input.queueBefore.aggregateHash,
    queueAfter: input.queueAfter,
    outboxBeforeHash: input.outboxBefore?.aggregateHash ?? null,
    outboxAfter: preparedOutbox.aggregate,
    queueEntry: input.currentEntry,
    outboxEntry: preparedOutbox.entry,
    attemptPlan,
    queueClaimCreatedInTransaction: false,
    transactionType: 'legacy_active_claim_cloud_dispatch_outbox_reconciliation',
  })
  return {
    disposition: 'legacy_claim_reconciled',
    queueEntry: input.currentEntry,
    outboxEntry: preparedOutbox.entry,
    attemptPlan,
    recovery: input.recovery,
    commit,
    boundaries: transactionBoundaries(),
  }
}

async function persistQueueOnlyMutationIfChanged(input: {
  lockAuthority: Parameters<typeof commitCanonicalPrivatePackageQueueOutboxTransaction>[0]['lockAuthority']
  scope: Parameters<typeof claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt>[0]['scope']
  queueBefore: NonNullable<Awaited<ReturnType<
    typeof readPrivateCanonicalPackageWorkQueueForPackageStateTransaction
  >>>
  queueAfter: NonNullable<Awaited<ReturnType<
    typeof readPrivateCanonicalPackageWorkQueueForPackageStateTransaction
  >>>
}): Promise<void> {
  if (input.queueBefore.aggregateHash === input.queueAfter.aggregateHash) return
  await persistPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
    input.lockAuthority,
    input.scope,
    input.queueAfter,
  )
}

async function commitTransaction(input: {
  input: Parameters<typeof claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt>[0]
  lockAuthority: Parameters<typeof commitCanonicalPrivatePackageQueueOutboxTransaction>[0]['lockAuthority']
  queueBeforeHash: string
  queueAfter: NonNullable<Awaited<ReturnType<
    typeof readPrivateCanonicalPackageWorkQueueForPackageStateTransaction
  >>>
  outboxBeforeHash: string | null
  outboxAfter: NonNullable<Awaited<ReturnType<
    typeof readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction
  >>>
  queueEntry: CanonicalPrivatePackageWorkQueueEntry & {
    activeClaim: NonNullable<CanonicalPrivatePackageWorkQueueEntry['activeClaim']>
  }
  outboxEntry: CanonicalCloudDispatchOutboxEntry
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
  queueClaimCreatedInTransaction: boolean
  transactionType:
    | 'package_claim_and_cloud_dispatch_outbox_insert'
    | 'legacy_active_claim_cloud_dispatch_outbox_reconciliation'
}): Promise<CanonicalPrivatePackageStateTransactionCommitEvidence> {
  const transactionId = `package_state_tx_${sha256AuthorityValue({
    dispatchIntentId: input.attemptPlan.dispatchIntentId,
    queueClaimId: input.queueEntry.activeClaim.claimId,
  }).slice(0, 32)}`
  return commitCanonicalPrivatePackageQueueOutboxTransaction({
    lockAuthority: input.lockAuthority,
    transactionId,
    transactionType: input.transactionType,
    authority: {
      queueDefinitionHash: input.input.definition.definitionHash,
      queueAggregateHashBefore: input.queueBeforeHash,
      queueAggregateHashAfter: input.queueAfter.aggregateHash,
      outboxAggregateHashBefore: input.outboxBeforeHash,
      outboxAggregateHashAfter: input.outboxAfter.aggregateHash,
      jobId: input.input.jobId,
      packageDeliveryAttempt: input.queueEntry.activeClaim.deliveryAttempt,
      queueClaimId: input.queueEntry.activeClaim.claimId,
      queueClaimHash: input.queueEntry.activeClaim.claimHash,
      queueClaimCreatedInTransaction: input.queueClaimCreatedInTransaction,
      dispatchIntentId: input.attemptPlan.dispatchIntentId,
      outboxEntryHash: input.outboxEntry.entryHash,
    },
    afterQueueContent: serializePrivateCanonicalPackageWorkQueueAggregate({
      scope: input.input.scope,
      aggregate: input.queueAfter,
    }),
    afterOutboxContent: serializePrivateCanonicalCloudDispatchOutboxAggregate({
      scope: input.input.scope,
      aggregate: input.outboxAfter,
    }),
    committedAt: input.input.now,
    faultInjectionForSmoke: input.input.faultInjectionForSmoke,
  })
}

function transactionBoundaries() {
  return {
    privateLocalPersistenceOnly: true as const,
    packageAttemptSelectedByServer: true as const,
    cooperativeCrossProcessPackageLock: true as const,
    queueClaimAndOutboxShareAtomicWriteAheadCommit: true as const,
    crashRecoveryReplaysBothProjections: true as const,
    plaintextClaimCredentialPersisted: false as const,
    rawBearerTokenMediaPathPromptOrSignedUrlPersisted: false as const,
    distributedDatabaseTransactionVerified: false as const,
    cloudTaskCreated: false as const,
    workerExecutionAuthorized: false as const,
    productionAuthority: false as const,
  }
}
