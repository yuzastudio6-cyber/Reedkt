import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCloudDispatchOutboxCurrentAttempt,
  assertCanonicalCloudDispatchOutboxEntryIntegrity,
} from '../edit-architecture/canonical-cloud-dispatch-outbox-receiver-authority'
import {
  createCanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalCloudDispatchWorkerFailureEvidenceSchema,
  canonicalCloudDispatchWorkerFailureReceiptSchema,
  type CanonicalCloudDispatchOutboxEntry,
  type CanonicalCloudDispatchWorkerFailureEvidence,
  type CanonicalCloudDispatchWorkerFailureReceipt,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import type {
  CanonicalPrivatePackageWorkQueueEntry,
  CanonicalPrivatePackageWorkQueueRelease,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  preparePrivateCanonicalCloudDispatchFailure,
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
  serializePrivateCanonicalCloudDispatchOutboxAggregate,
  type CanonicalCloudDispatchOutboxStoreScope,
} from './private-canonical-cloud-dispatch-outbox-store'
import {
  preparePrivateCanonicalPackageWorkQueueDispatchFailure,
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

export interface CanonicalPrivateCloudDispatchFailureResult {
  disposition: 'reconciled' | 'exact_replay'
  queueDisposition:
    | 'retry_available'
    | 'attempts_exhausted'
    | 'user_review_required'
  retryDisposition:
    | 'retry_same_approved_operation'
    | 'fallback_or_user_review_required'
  remainingAttempts: number
  approvedMaxAttempts: number
  outboxEntry: CanonicalCloudDispatchOutboxEntry & {
    failureReceipt: CanonicalCloudDispatchWorkerFailureReceipt
  }
  failureReceipt: CanonicalCloudDispatchWorkerFailureReceipt
  recovery: CanonicalPrivatePackageStateRecoveryEvidence
  commit: CanonicalPrivatePackageStateTransactionCommitEvidence | null
  boundaries: ReturnType<typeof failureBoundaries>
}

export async function reconcilePrivateCanonicalCloudDispatchFailure(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope &
    CanonicalCloudDispatchOutboxStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  dispatchIntentId: string
  failureEvidence: CanonicalCloudDispatchWorkerFailureEvidence
  now: string
  buildReceipt: (input: {
    entry: CanonicalCloudDispatchOutboxEntry
    queueRelease: CanonicalPrivatePackageWorkQueueRelease
    failedAt: string
  }) => CanonicalCloudDispatchWorkerFailureReceipt
  validateReplayReceipt: (input: {
    entry: CanonicalCloudDispatchOutboxEntry
    failureReceipt: CanonicalCloudDispatchWorkerFailureReceipt
  }) => CanonicalCloudDispatchWorkerFailureReceipt
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
}): Promise<CanonicalPrivateCloudDispatchFailureResult> {
  const failureEvidence = canonicalCloudDispatchWorkerFailureEvidenceSchema.parse(
    input.failureEvidence,
  )
  if (failureEvidence.executionState === 'completed_requires_reconciliation') {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Post-commit worker failure requires completion reconciliation and cannot become a retry.',
      503,
    )
  }
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
          'Canonical queue and dispatch outbox are required for worker failure reconciliation.',
          404,
        )
      }
      const outboxEntry = outboxBefore.entries.find((entry) =>
        entry.immutable.dispatchIntentId === input.dispatchIntentId)
      if (!outboxEntry) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical dispatch attempt was not found for worker failure reconciliation.',
          404,
        )
      }
      assertCanonicalCloudDispatchOutboxEntryIntegrity(outboxEntry)
      const queueEntry = queueBefore.entries.find((entry) =>
        entry.definition.jobId === outboxEntry.immutable.jobId)
      if (!queueEntry) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical package job was not found for worker failure reconciliation.',
          404,
        )
      }
      if (
        outboxEntry.state === 'worker_completion_reconciled' ||
        outboxEntry.state === 'worker_timeout_reconciled' ||
        queueEntry.completion?.claimId === outboxEntry.immutable.queueClaimId ||
        (queueEntry.lastRelease?.claimId === outboxEntry.immutable.queueClaimId &&
          queueEntry.lastRelease.dispatchTimeout !== undefined)
      ) {
        throw new ApiError(
          'IDEMPOTENCY_ATOMICITY_REQUIRED',
          'A completed or timed-out worker attempt cannot be released or retried as failed.',
          503,
        )
      }
      const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
        manifest: input.manifest,
        jobId: outboxEntry.immutable.jobId,
        deliveryAttempt: outboxEntry.immutable.packageDeliveryAttempt,
      })
      if (outboxEntry.state === 'worker_failure_reconciled') {
        assertCanonicalCloudDispatchOutboxCurrentAttempt({
          entry: outboxEntry,
          queueDefinition: input.definition,
          queueAggregate: queueBefore,
          manifest: input.manifest,
          attemptPlan,
          now: input.now,
          allowReconciledFailureReplay: true,
        })
        return replayFailure({
          input,
          recovery,
          queueEntry,
          outboxEntry,
          failureEvidence,
        })
      }
      if (
        outboxEntry.state !== 'worker_identity_accepted' ||
        !outboxEntry.workerReceipt ||
        queueEntry.state !== 'leased'
      ) {
        const matchingRelease = queueEntry.lastRelease?.claimId ===
          outboxEntry.immutable.queueClaimId
        throw new ApiError(
          matchingRelease
            ? 'IDEMPOTENCY_ATOMICITY_REQUIRED'
            : 'VALIDATION_FAILED',
          matchingRelease
            ? 'Canonical queue and outbox failure projections diverged outside recovery.'
            : 'Worker failure requires one accepted, currently leased dispatch attempt.',
          matchingRelease ? 503 : 409,
        )
      }
      assertCanonicalCloudDispatchOutboxCurrentAttempt({
        entry: outboxEntry,
        queueDefinition: input.definition,
        queueAggregate: queueBefore,
        manifest: input.manifest,
        attemptPlan,
        now: input.now,
      })
      const preparedQueue =
        preparePrivateCanonicalPackageWorkQueueDispatchFailure({
          aggregate: queueBefore,
          definition: input.definition,
          jobId: outboxEntry.immutable.jobId,
          queueClaimId: outboxEntry.immutable.queueClaimId,
          queueClaimHash: outboxEntry.immutable.queueClaimHash,
          workerReceiptHash: outboxEntry.workerReceipt.receiptHash,
          failureEvidence,
          now: input.now,
        })
      if (preparedQueue.disposition !== 'released') {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'A fresh dispatch failure unexpectedly replayed queue state.',
          409,
        )
      }
      const failureReceipt = canonicalCloudDispatchWorkerFailureReceiptSchema.parse(
        input.buildReceipt({
          entry: outboxEntry,
          queueRelease: preparedQueue.entry.lastRelease,
          failedAt: input.now,
        }),
      )
      const preparedOutbox = preparePrivateCanonicalCloudDispatchFailure({
        aggregate: outboxBefore,
        dispatchIntentId: input.dispatchIntentId,
        failureReceipt,
        now: input.now,
      })
      if (preparedOutbox.disposition !== 'reconciled') {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'A fresh dispatch failure unexpectedly replayed outbox state.',
          409,
        )
      }
      const dispatchFailure = preparedQueue.entry.lastRelease.dispatchFailure
      const commit = await commitCanonicalPrivatePackageQueueOutboxTransaction({
        lockAuthority,
        transactionId: `package_failure_tx_${sha256AuthorityValue({
          dispatchIntentId: input.dispatchIntentId,
          failureReceiptHash: failureReceipt.receiptHash,
        }).slice(0, 32)}`,
        transactionType: 'worker_failure_reconciliation',
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
          dispatchIntentId: input.dispatchIntentId,
          workerReceiptHash: outboxEntry.workerReceipt.receiptHash,
          failureEvidenceHash: failureReceipt.failureEvidenceHash,
          queueReleaseHash: preparedQueue.entry.lastRelease.releaseHash,
          attemptInternalCostEvidenceHash:
            failureEvidence.attemptInternalCostEvidenceHash,
          retryDisposition: dispatchFailure.retryDisposition,
          queueDisposition: dispatchFailure.queueDisposition,
          approvedMaxAttempts: dispatchFailure.approvedMaxAttempts,
          remainingAttempts: dispatchFailure.remainingAttempts,
          outboxEntryHashBefore: outboxEntry.entryHash,
          outboxEntryHashAfter: preparedOutbox.entry.entryHash,
          failureReceiptHash: failureReceipt.receiptHash,
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
        queueDisposition: dispatchFailure.queueDisposition,
        retryDisposition: dispatchFailure.retryDisposition,
        remainingAttempts: dispatchFailure.remainingAttempts,
        approvedMaxAttempts: dispatchFailure.approvedMaxAttempts,
        outboxEntry: preparedOutbox.entry,
        failureReceipt,
        recovery,
        commit,
        boundaries: failureBoundaries(),
      }
    },
  })
}

function replayFailure(input: {
  input: Parameters<typeof reconcilePrivateCanonicalCloudDispatchFailure>[0]
  recovery: CanonicalPrivatePackageStateRecoveryEvidence
  queueEntry: CanonicalPrivatePackageWorkQueueEntry
  outboxEntry: CanonicalCloudDispatchOutboxEntry
  failureEvidence: CanonicalCloudDispatchWorkerFailureEvidence
}): CanonicalPrivateCloudDispatchFailureResult {
  const receipt = input.outboxEntry.failureReceipt
  if (
    !receipt || !input.outboxEntry.workerReceipt ||
    input.outboxEntry.immutable.queueDefinitionHash !==
      input.input.definition.definitionHash ||
    input.outboxEntry.immutable.handoffManifestHash !==
      input.input.manifest.manifestHash ||
    input.queueEntry.deliveryAttemptCount <
      input.outboxEntry.immutable.packageDeliveryAttempt ||
    receipt.workerReceiptHash !== input.outboxEntry.workerReceipt.receiptHash ||
    receipt.failureEvidenceHash !== sha256AuthorityValue(input.failureEvidence) ||
    receipt.failureCategory !== input.failureEvidence.failureCategory ||
    receipt.failureCode !== input.failureEvidence.failureCode ||
    receipt.failureDetailHash !== input.failureEvidence.failureDetailHash ||
    receipt.attemptInternalCostEvidenceHash !==
      input.failureEvidence.attemptInternalCostEvidenceHash
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Worker failure replay does not match the exact reconciled result.',
      409,
    )
  }
  if (input.queueEntry.deliveryAttemptCount ===
    input.outboxEntry.immutable.packageDeliveryAttempt) {
    const release = input.queueEntry.lastRelease
    if (
      input.queueEntry.state !== 'queued' ||
      release?.claimId !== input.outboxEntry.immutable.queueClaimId ||
      release.releaseHash !== receipt.queueReleaseHash
    ) {
      throw new ApiError(
        'IDEMPOTENCY_ATOMICITY_REQUIRED',
        'Worker failure replay no longer has its exact queue release projection.',
        503,
      )
    }
  }
  const validatedReceipt = input.input.validateReplayReceipt({
    entry: input.outboxEntry,
    failureReceipt: receipt,
  })
  if (validatedReceipt.receiptHash !== receipt.receiptHash) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Worker failure identity replay does not match the accepted result.',
      409,
    )
  }
  return {
    disposition: 'exact_replay',
    queueDisposition: receipt.queueDisposition,
    retryDisposition: receipt.retryDisposition,
    remainingAttempts: receipt.remainingAttempts,
    approvedMaxAttempts: receipt.approvedMaxAttempts,
    outboxEntry: input.outboxEntry as CanonicalCloudDispatchOutboxEntry & {
      failureReceipt: CanonicalCloudDispatchWorkerFailureReceipt
    },
    failureReceipt: receipt,
    recovery: input.recovery,
    commit: null,
    boundaries: failureBoundaries(),
  }
}

function failureBoundaries() {
  return {
    privateLocalPersistenceOnly: true as const,
    acceptedWorkerIdentityRequired: true as const,
    queueReleaseDerivedFromImmutableAttemptAllowance: true as const,
    postCommitFailureRetryAuthorized: false as const,
    attemptInternalProductionCostEvidenceHashRequired: true as const,
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
    queueReleaseAndOutboxReceiptShareAtomicWriteAheadCommit: true as const,
    crashRecoveryReplaysBothProjections: true as const,
    plaintextClaimCredentialPersisted: false as const,
    rawBearerTokenFailureLogStackMediaPathPromptOrSignedUrlPersisted: false as const,
    toolOrMediaExecutionClaimedByThisBoundary: false as const,
    automaticRetryLoopStarted: false as const,
    distributedDatabaseTransactionVerified: false as const,
    liveGoogleOidcAndIamVerified: false as const,
    cloudTaskCreated: false as const,
    cloudRunJobExecuted: false as const,
    productionAuthority: false as const,
  }
}
