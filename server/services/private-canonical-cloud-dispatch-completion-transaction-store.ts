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
  canonicalCloudDispatchWorkerCompletionEvidenceSchema,
  canonicalCloudDispatchWorkerCompletionReceiptSchema,
  type CanonicalCloudDispatchOutboxEntry,
  type CanonicalCloudDispatchWorkerCompletionEvidence,
  type CanonicalCloudDispatchWorkerCompletionReceipt,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import type {
  CanonicalPrivatePackageWorkQueueCompletedOutcome,
  CanonicalPrivatePackageWorkQueueEntry,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  preparePrivateCanonicalCloudDispatchCompletion,
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
  serializePrivateCanonicalCloudDispatchOutboxAggregate,
  type CanonicalCloudDispatchOutboxStoreScope,
} from './private-canonical-cloud-dispatch-outbox-store'
import {
  preparePrivateCanonicalPackageWorkQueueDispatchCompletion,
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
import { sha256AuthorityValue, stableAuthorityStringify } from
  './private-edit-authority-store'

export interface CanonicalPrivateCloudDispatchCompletionResult {
  disposition: 'reconciled' | 'exact_replay'
  queueOutcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
  outboxEntry: CanonicalCloudDispatchOutboxEntry & {
    completionReceipt: CanonicalCloudDispatchWorkerCompletionReceipt
  }
  completionReceipt: CanonicalCloudDispatchWorkerCompletionReceipt
  recovery: CanonicalPrivatePackageStateRecoveryEvidence
  commit: CanonicalPrivatePackageStateTransactionCommitEvidence | null
  boundaries: ReturnType<typeof completionBoundaries>
}

export async function reconcilePrivateCanonicalCloudDispatchCompletion(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope &
    CanonicalCloudDispatchOutboxStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  dispatchIntentId: string
  completionEvidence: CanonicalCloudDispatchWorkerCompletionEvidence
  now: string
  buildReceipt: (input: {
    entry: CanonicalCloudDispatchOutboxEntry
    queueCompletion: NonNullable<
      ReturnType<typeof preparePrivateCanonicalPackageWorkQueueDispatchCompletion>[
        'entry'
      ]['completion']
    >
    completedAt: string
  }) => CanonicalCloudDispatchWorkerCompletionReceipt
  faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
}): Promise<CanonicalPrivateCloudDispatchCompletionResult> {
  const completionEvidence = canonicalCloudDispatchWorkerCompletionEvidenceSchema.parse(
    input.completionEvidence,
  )
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
          'Canonical queue and dispatch outbox are required for worker completion.',
          404,
        )
      }
      const outboxEntry = outboxBefore.entries.find((entry) =>
        entry.immutable.dispatchIntentId === input.dispatchIntentId)
      if (!outboxEntry) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical dispatch attempt was not found for worker completion.',
          404,
        )
      }
      assertCanonicalCloudDispatchOutboxEntryIntegrity(outboxEntry)
      const queueEntry = queueBefore.entries.find((entry) =>
        entry.definition.jobId === outboxEntry.immutable.jobId)
      if (!queueEntry) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Canonical package job was not found for worker completion.',
          404,
        )
      }
      const outcome = createQueueOutcome(queueEntry.definition, completionEvidence)
      const queueCompleted = queueEntry.state === 'completed'
      const outboxCompleted = outboxEntry.state === 'worker_completion_reconciled'
      if (queueCompleted !== outboxCompleted) {
        throw new ApiError(
          'IDEMPOTENCY_ATOMICITY_REQUIRED',
          'Canonical queue and outbox completion projections diverged outside recovery.',
          503,
        )
      }

      if (queueCompleted && outboxCompleted) {
        return replayCompletion({
          input,
          recovery,
          queueEntry,
          outboxEntry,
          outcome,
          completionEvidence,
        })
      }

      if (outboxEntry.state !== 'worker_identity_accepted' ||
        !outboxEntry.workerReceipt || queueEntry.state !== 'leased') {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Worker completion requires one accepted, currently leased dispatch attempt.',
          409,
        )
      }
      const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
        manifest: input.manifest,
        jobId: outboxEntry.immutable.jobId,
        deliveryAttempt: outboxEntry.immutable.packageDeliveryAttempt,
      })
      assertCanonicalCloudDispatchOutboxCurrentAttempt({
        entry: outboxEntry,
        queueDefinition: input.definition,
        queueAggregate: queueBefore,
        manifest: input.manifest,
        attemptPlan,
        now: input.now,
      })
      const preparedQueue =
        preparePrivateCanonicalPackageWorkQueueDispatchCompletion({
          aggregate: queueBefore,
          definition: input.definition,
          jobId: outboxEntry.immutable.jobId,
          queueClaimId: outboxEntry.immutable.queueClaimId,
          queueClaimHash: outboxEntry.immutable.queueClaimHash,
          outcome,
          now: input.now,
        })
      if (preparedQueue.disposition !== 'completed') {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'A fresh dispatch completion unexpectedly replayed queue state.',
          409,
        )
      }
      const completionReceipt = canonicalCloudDispatchWorkerCompletionReceiptSchema.parse(
        input.buildReceipt({
          entry: outboxEntry,
          queueCompletion: preparedQueue.entry.completion,
          completedAt: input.now,
        }),
      )
      const preparedOutbox = preparePrivateCanonicalCloudDispatchCompletion({
        aggregate: outboxBefore,
        dispatchIntentId: input.dispatchIntentId,
        completionReceipt,
        now: input.now,
      })
      if (preparedOutbox.disposition !== 'reconciled') {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'A fresh dispatch completion unexpectedly replayed outbox state.',
          409,
        )
      }
      const commit = await commitCanonicalPrivatePackageQueueOutboxTransaction({
        lockAuthority,
        transactionId: `package_completion_tx_${sha256AuthorityValue({
          dispatchIntentId: input.dispatchIntentId,
          completionReceiptHash: completionReceipt.receiptHash,
        }).slice(0, 32)}`,
        transactionType: 'worker_completion_reconciliation',
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
          completionEvidenceHash: sha256AuthorityValue(completionEvidence),
          completionOutcomeHash: sha256AuthorityValue(outcome),
          queueCompletionHash: preparedQueue.entry.completion.completionHash,
          outboxEntryHashBefore: outboxEntry.entryHash,
          outboxEntryHashAfter: preparedOutbox.entry.entryHash,
          completionReceiptHash: completionReceipt.receiptHash,
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
        queueOutcome: outcome,
        outboxEntry: preparedOutbox.entry,
        completionReceipt,
        recovery,
        commit,
        boundaries: completionBoundaries(),
      }
    },
  })
}

function replayCompletion(input: {
  input: Parameters<typeof reconcilePrivateCanonicalCloudDispatchCompletion>[0]
  recovery: CanonicalPrivatePackageStateRecoveryEvidence
  queueEntry: CanonicalPrivatePackageWorkQueueEntry
  outboxEntry: CanonicalCloudDispatchOutboxEntry
  outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
  completionEvidence: CanonicalCloudDispatchWorkerCompletionEvidence
}): CanonicalPrivateCloudDispatchCompletionResult {
  const completion = input.queueEntry.completion
  const existingReceipt = input.outboxEntry.completionReceipt
  if (
    !completion || !existingReceipt || !input.outboxEntry.workerReceipt ||
    input.outboxEntry.immutable.queueDefinitionHash !==
      input.input.definition.definitionHash ||
    input.outboxEntry.immutable.handoffManifestHash !==
      input.input.manifest.manifestHash ||
    completion.claimId !== input.outboxEntry.immutable.queueClaimId ||
    completion.completionHash !== existingReceipt.queueCompletionHash ||
    existingReceipt.queueClaimHash !== input.outboxEntry.immutable.queueClaimHash ||
    existingReceipt.workerReceiptHash !== input.outboxEntry.workerReceipt.receiptHash ||
    existingReceipt.completionEvidenceHash !==
      sha256AuthorityValue(input.completionEvidence) ||
    existingReceipt.attemptInternalCostEvidenceHash !==
      input.completionEvidence.attemptInternalCostEvidenceHash ||
    existingReceipt.completionOutcomeHash !== sha256AuthorityValue(input.outcome) ||
    stableAuthorityStringify(completion.outcome) !==
      stableAuthorityStringify(input.outcome)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Worker completion replay does not match the exact reconciled result.',
      409,
    )
  }
  const requestedReceipt = canonicalCloudDispatchWorkerCompletionReceiptSchema.parse(
    input.input.buildReceipt({
      entry: input.outboxEntry,
      queueCompletion: completion,
      completedAt: existingReceipt.completedAt,
    }),
  )
  if (requestedReceipt.receiptHash !== existingReceipt.receiptHash) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Worker completion identity replay does not match the accepted result.',
      409,
    )
  }
  return {
    disposition: 'exact_replay',
    queueOutcome: completion.outcome,
    outboxEntry: input.outboxEntry as CanonicalCloudDispatchOutboxEntry & {
      completionReceipt: CanonicalCloudDispatchWorkerCompletionReceipt
    },
    completionReceipt: existingReceipt,
    recovery: input.recovery,
    commit: null,
    boundaries: completionBoundaries(),
  }
}

function createQueueOutcome(
  definition: CanonicalPrivatePackageWorkQueueDefinition['jobs'][number],
  evidence: CanonicalCloudDispatchWorkerCompletionEvidence,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  return {
    jobId: definition.jobId,
    approvedWorkItemId: definition.approvedWorkItemId,
    workItemKey: definition.workItemKey,
    required: definition.required,
    dependencyJobIds: [...definition.dependencyJobIds],
    status: 'completed_private_test',
    artifactId: evidence.artifactId,
    contentType: evidence.contentType,
    sha256: evidence.artifactSha256,
    adapterReplayed: evidence.adapterReplayed,
    blockedDependencyJobIds: [],
  }
}

function completionBoundaries() {
  return {
    privateLocalPersistenceOnly: true as const,
    acceptedWorkerIdentityRequired: true as const,
    queueOutcomeDerivedFromImmutableJob: true as const,
    privateArtifactQaReconciliationAndDownstreamLeaseEvidenceRequired: true as const,
    attemptInternalProductionCostEvidenceHashRequired: true as const,
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
    queueCompletionAndOutboxReceiptShareAtomicWriteAheadCommit: true as const,
    crashRecoveryReplaysBothProjections: true as const,
    plaintextClaimCredentialPersisted: false as const,
    rawBearerTokenMediaPathPromptOrSignedUrlPersisted: false as const,
    toolOrMediaExecutionClaimedByThisBoundary: false as const,
    distributedDatabaseTransactionVerified: false as const,
    liveGoogleOidcAndIamVerified: false as const,
    cloudTaskCreated: false as const,
    cloudRunJobExecuted: false as const,
    productionAuthority: false as const,
  }
}
