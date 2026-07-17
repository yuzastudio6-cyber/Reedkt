import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCloudDispatchOutboxCurrentAttempt,
  assertCanonicalCloudDispatchOutboxEntryIntegrity,
  assertCanonicalCloudDispatchOutboxExpiredAcceptedWorkerAttempt,
  createCanonicalCloudDispatchWorkerTimeoutEvidence,
} from '../edit-architecture/canonical-cloud-dispatch-outbox-receiver-authority'
import {
  createCanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalCloudDispatchWorkerTimeoutReceiptSchema,
  type CanonicalCloudDispatchOutboxEntry,
  type CanonicalCloudDispatchWorkerTimeoutEvidence,
  type CanonicalCloudDispatchWorkerTimeoutReceipt,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import type {
  CanonicalPrivatePackageWorkQueueEntry,
  CanonicalPrivatePackageWorkQueueRelease,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  preparePrivateCanonicalCloudDispatchTimeout,
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
  serializePrivateCanonicalCloudDispatchOutboxAggregate,
  type CanonicalCloudDispatchOutboxStoreScope,
} from './private-canonical-cloud-dispatch-outbox-store'
import {
  preparePrivateCanonicalPackageWorkQueueDispatchTimeout,
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

export interface CanonicalPrivateCloudDispatchTimeoutResult {
  disposition: 'reconciled' | 'exact_replay'
  queueDisposition: 'retry_available' | 'attempts_exhausted'
  retryDisposition:
    | 'retry_same_approved_operation'
    | 'fallback_or_user_review_required'
  remainingAttempts: number
  approvedMaxAttempts: number
  timeoutEvidence: CanonicalCloudDispatchWorkerTimeoutEvidence | null
  outboxEntry: CanonicalCloudDispatchOutboxEntry & {
    timeoutReceipt: CanonicalCloudDispatchWorkerTimeoutReceipt
  }
  timeoutReceipt: CanonicalCloudDispatchWorkerTimeoutReceipt
  recovery: CanonicalPrivatePackageStateRecoveryEvidence
  commit: CanonicalPrivatePackageStateTransactionCommitEvidence | null
  boundaries: ReturnType<typeof timeoutBoundaries>
}

export async function reconcilePrivateCanonicalCloudDispatchTimeout(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope &
    CanonicalCloudDispatchOutboxStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  dispatchIntentId: string
  attemptInternalCostEvidenceHash: string
  now: string
  buildReceipt: (input: {
    entry: CanonicalCloudDispatchOutboxEntry
    timeoutEvidence: CanonicalCloudDispatchWorkerTimeoutEvidence
    queueRelease: CanonicalPrivatePackageWorkQueueRelease
    timedOutAt: string
  }) => CanonicalCloudDispatchWorkerTimeoutReceipt
  validateReplayReceipt: (input: {
    entry: CanonicalCloudDispatchOutboxEntry
    timeoutReceipt: CanonicalCloudDispatchWorkerTimeoutReceipt
  }) => CanonicalCloudDispatchWorkerTimeoutReceipt
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
}): Promise<CanonicalPrivateCloudDispatchTimeoutResult> {
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority, recovery) => {
      const queueBefore =
        await readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
          lockAuthority,
          input.scope,
          input.definition,
        )
      const outboxBefore =
        await readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
          lockAuthority,
          input.scope,
        )
      if (!queueBefore || !outboxBefore) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical queue and dispatch outbox are required for accepted-worker timeout reconciliation.',
          404,
        )
      }
      const outboxEntry = outboxBefore.entries.find((entry) =>
        entry.immutable.dispatchIntentId === input.dispatchIntentId)
      if (!outboxEntry) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical dispatch attempt was not found for accepted-worker timeout reconciliation.',
          404,
        )
      }
      assertCanonicalCloudDispatchOutboxEntryIntegrity(outboxEntry)
      const queueEntry = queueBefore.entries.find((entry) =>
        entry.definition.jobId === outboxEntry.immutable.jobId)
      if (!queueEntry) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical package job was not found for accepted-worker timeout reconciliation.',
          404,
        )
      }
      const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
        manifest: input.manifest,
        jobId: outboxEntry.immutable.jobId,
        deliveryAttempt: outboxEntry.immutable.packageDeliveryAttempt,
      })
      if (outboxEntry.state === 'worker_timeout_reconciled') {
        assertCanonicalCloudDispatchOutboxCurrentAttempt({
          entry: outboxEntry,
          queueDefinition: input.definition,
          queueAggregate: queueBefore,
          manifest: input.manifest,
          attemptPlan,
          now: input.now,
          allowReconciledTimeoutReplay: true,
        })
        return replayTimeout({ input, recovery, queueEntry, outboxEntry })
      }
      if (
        outboxEntry.state === 'worker_completion_reconciled' ||
        outboxEntry.state === 'worker_failure_reconciled' ||
        queueEntry.completion?.claimId === outboxEntry.immutable.queueClaimId ||
        (queueEntry.lastRelease?.claimId === outboxEntry.immutable.queueClaimId &&
          (queueEntry.lastRelease.dispatchFailure !== undefined ||
            queueEntry.lastRelease.dispatchTimeout !== undefined))
      ) {
        throw new ApiError(
          'IDEMPOTENCY_ATOMICITY_REQUIRED',
          'A terminal worker attempt cannot be reconciled as timed out.',
          503,
        )
      }
      if (
        outboxEntry.state !== 'worker_identity_accepted' ||
        !outboxEntry.controllerReceipt || !outboxEntry.workerReceipt ||
        queueEntry.state !== 'leased' || !queueEntry.activeClaim
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Worker timeout requires one accepted, currently leased dispatch attempt.',
          409,
        )
      }
      const expiredClaim =
        assertCanonicalCloudDispatchOutboxExpiredAcceptedWorkerAttempt({
          entry: outboxEntry,
          queueDefinition: input.definition,
          queueAggregate: queueBefore,
          manifest: input.manifest,
          attemptPlan,
          now: input.now,
        })
      const timeoutEvidence = createCanonicalCloudDispatchWorkerTimeoutEvidence({
        entry: outboxEntry,
        queueClaim: expiredClaim,
        attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
        now: input.now,
      })
      const preparedQueue =
        preparePrivateCanonicalPackageWorkQueueDispatchTimeout({
          aggregate: queueBefore,
          definition: input.definition,
          jobId: outboxEntry.immutable.jobId,
          queueClaimId: outboxEntry.immutable.queueClaimId,
          queueClaimHash: outboxEntry.immutable.queueClaimHash,
          queueClaimInitialExpiresAt: outboxEntry.immutable.queueClaimExpiresAt,
          controllerReceiptHash: outboxEntry.controllerReceipt.receiptHash,
          workerReceiptHash: outboxEntry.workerReceipt.receiptHash,
          timeoutEvidence,
          now: input.now,
        })
      if (preparedQueue.disposition !== 'released') {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'A fresh accepted-worker timeout unexpectedly replayed queue state.',
          409,
        )
      }
      const timeoutReceipt = canonicalCloudDispatchWorkerTimeoutReceiptSchema.parse(
        input.buildReceipt({
          entry: outboxEntry,
          timeoutEvidence,
          queueRelease: preparedQueue.entry.lastRelease,
          timedOutAt: input.now,
        }),
      )
      const preparedOutbox = preparePrivateCanonicalCloudDispatchTimeout({
        aggregate: outboxBefore,
        dispatchIntentId: input.dispatchIntentId,
        timeoutReceipt,
        now: input.now,
      })
      if (preparedOutbox.disposition !== 'reconciled') {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'A fresh accepted-worker timeout unexpectedly replayed outbox state.',
          409,
        )
      }
      const dispatchTimeout = preparedQueue.entry.lastRelease.dispatchTimeout
      const commit = await commitCanonicalPrivatePackageQueueOutboxTransaction({
        lockAuthority,
        transactionId: `package_timeout_tx_${sha256AuthorityValue({
          dispatchIntentId: input.dispatchIntentId,
          timeoutReceiptHash: timeoutReceipt.receiptHash,
        }).slice(0, 32)}`,
        transactionType: 'accepted_worker_timeout_reconciliation',
        authority: {
          queueDefinitionHash: input.definition.definitionHash,
          queueAggregateHashBefore: queueBefore.aggregateHash,
          queueAggregateHashAfter: preparedQueue.aggregate.aggregateHash,
          outboxAggregateHashBefore: outboxBefore.aggregateHash,
          outboxAggregateHashAfter: preparedOutbox.aggregate.aggregateHash,
          jobId: outboxEntry.immutable.jobId,
          packageDeliveryAttempt: outboxEntry.immutable.packageDeliveryAttempt,
          queueClaimId: outboxEntry.immutable.queueClaimId,
          queueClaimHash: outboxEntry.immutable.queueClaimHash,
          expiredQueueClaimHash: expiredClaim.claimHash,
          queueClaimExpiresAt: expiredClaim.expiresAt,
          queueClaimAttemptDeadlineAt: expiredClaim.attemptDeadlineAt,
          timeoutReconciledAt: input.now,
          dispatchIntentId: input.dispatchIntentId,
          controllerReceiptHash: outboxEntry.controllerReceipt.receiptHash,
          workerReceiptHash: outboxEntry.workerReceipt.receiptHash,
          timeoutEvidenceHash: sha256AuthorityValue(timeoutEvidence),
          timeoutDetailHash: timeoutEvidence.timeoutDetailHash,
          queueReleaseHash: preparedQueue.entry.lastRelease.releaseHash,
          attemptInternalCostEvidenceHash:
            timeoutEvidence.attemptInternalCostEvidenceHash,
          retryDisposition: dispatchTimeout.retryDisposition,
          queueDisposition: dispatchTimeout.queueDisposition,
          approvedMaxAttempts: dispatchTimeout.approvedMaxAttempts,
          remainingAttempts: dispatchTimeout.remainingAttempts,
          outboxEntryHashBefore: outboxEntry.entryHash,
          outboxEntryHashAfter: preparedOutbox.entry.entryHash,
          timeoutReceiptHash: timeoutReceipt.receiptHash,
        },
        afterQueueContent: serializePrivateCanonicalPackageWorkQueueAggregate({
          scope: input.scope,
          aggregate: preparedQueue.aggregate,
        }),
        afterOutboxContent: serializePrivateCanonicalCloudDispatchOutboxAggregate({
          scope: input.scope,
          aggregate: preparedOutbox.aggregate,
        }),
        committedAt: input.now,
        faultInjectionForSmoke: input.faultInjectionForSmoke,
      })
      return {
        disposition: 'reconciled',
        queueDisposition: dispatchTimeout.queueDisposition,
        retryDisposition: dispatchTimeout.retryDisposition,
        remainingAttempts: dispatchTimeout.remainingAttempts,
        approvedMaxAttempts: dispatchTimeout.approvedMaxAttempts,
        timeoutEvidence,
        outboxEntry: preparedOutbox.entry,
        timeoutReceipt,
        recovery,
        commit,
        boundaries: timeoutBoundaries(),
      }
    },
  })
}

function replayTimeout(input: {
  input: Parameters<typeof reconcilePrivateCanonicalCloudDispatchTimeout>[0]
  recovery: CanonicalPrivatePackageStateRecoveryEvidence
  queueEntry: CanonicalPrivatePackageWorkQueueEntry
  outboxEntry: CanonicalCloudDispatchOutboxEntry
}): CanonicalPrivateCloudDispatchTimeoutResult {
  const receipt = input.outboxEntry.timeoutReceipt
  if (
    !receipt || !input.outboxEntry.controllerReceipt ||
    !input.outboxEntry.workerReceipt ||
    input.outboxEntry.immutable.queueDefinitionHash !==
      input.input.definition.definitionHash ||
    input.outboxEntry.immutable.handoffManifestHash !==
      input.input.manifest.manifestHash ||
    input.queueEntry.deliveryAttemptCount <
      input.outboxEntry.immutable.packageDeliveryAttempt ||
    receipt.controllerReceiptHash !==
      input.outboxEntry.controllerReceipt.receiptHash ||
    receipt.workerReceiptHash !== input.outboxEntry.workerReceipt.receiptHash ||
    receipt.attemptInternalCostEvidenceHash !==
      input.input.attemptInternalCostEvidenceHash
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Worker timeout replay does not match the exact reconciled result.',
      409,
    )
  }
  if (input.queueEntry.deliveryAttemptCount ===
    input.outboxEntry.immutable.packageDeliveryAttempt) {
    const release = input.queueEntry.lastRelease
    if (
      input.queueEntry.state !== 'queued' ||
      release?.claimId !== input.outboxEntry.immutable.queueClaimId ||
      release.releaseHash !== receipt.queueReleaseHash ||
      release.dispatchTimeout?.timeoutEvidenceHash !== receipt.timeoutEvidenceHash
    ) {
      throw new ApiError(
        'IDEMPOTENCY_ATOMICITY_REQUIRED',
        'Worker timeout replay no longer has its exact queue release projection.',
        503,
      )
    }
  }
  const validatedReceipt = input.input.validateReplayReceipt({
    entry: input.outboxEntry,
    timeoutReceipt: receipt,
  })
  if (validatedReceipt.receiptHash !== receipt.receiptHash) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Worker timeout identity replay does not match the accepted result.',
      409,
    )
  }
  return {
    disposition: 'exact_replay',
    queueDisposition: receipt.queueDisposition,
    retryDisposition: receipt.retryDisposition,
    remainingAttempts: receipt.remainingAttempts,
    approvedMaxAttempts: receipt.approvedMaxAttempts,
    timeoutEvidence: null,
    outboxEntry: input.outboxEntry as CanonicalCloudDispatchOutboxEntry & {
      timeoutReceipt: CanonicalCloudDispatchWorkerTimeoutReceipt
    },
    timeoutReceipt: receipt,
    recovery: input.recovery,
    commit: null,
    boundaries: timeoutBoundaries(),
  }
}

function timeoutBoundaries() {
  return {
    privateLocalPersistenceOnly: true as const,
    acceptedControllerAndWorkerIdentityRequired: true as const,
    timeoutEvidenceDerivedFromExactExpiredClaim: true as const,
    queueReleaseDerivedFromImmutableAttemptAllowance: true as const,
    automaticRetryLoopStarted: false as const,
    attemptInternalProductionCostEvidenceHashRequired: true as const,
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
    queueReleaseAndOutboxReceiptShareAtomicWriteAheadCommit: true as const,
    crashRecoveryReplaysBothProjections: true as const,
    plaintextClaimCredentialPersisted: false as const,
    rawBearerTokenFailureLogStackMediaPathPromptOrSignedUrlPersisted: false as const,
    toolOrMediaExecutionClaimedByThisBoundary: false as const,
    distributedDatabaseTransactionVerified: false as const,
    liveGoogleOidcAndIamVerified: false as const,
    cloudTaskCreated: false as const,
    cloudRunJobExecuted: false as const,
    productionAuthority: false as const,
  }
}
