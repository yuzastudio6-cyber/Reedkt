import { z } from 'zod'

export const CANONICAL_PRIVATE_PACKAGE_STATE_TRANSACTION_VERSION =
  'canonical-private-package-state-transaction-v1' as const
export const CANONICAL_PRIVATE_PACKAGE_COMPLETION_TRANSACTION_VERSION =
  'canonical-private-package-completion-transaction-v1' as const
export const CANONICAL_PRIVATE_PACKAGE_FAILURE_TRANSACTION_VERSION =
  'canonical-private-package-failure-transaction-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const boundedBase64Url = z.string().min(1).max(12_000_000)
  .regex(/^[A-Za-z0-9_-]+$/u)

const projectionShape = {
  beforeExists: z.boolean(),
  beforeContentSha256: sha256.nullable(),
  afterContentBase64Url: boundedBase64Url,
  afterContentSha256: sha256,
}

const projectionSchema = z.object(projectionShape).strict().superRefine((projection, context) => {
  if (projection.beforeExists !== (projection.beforeContentSha256 !== null)) {
    context.addIssue({
      code: 'custom',
      message: 'Package-state transaction before projection is inconsistent.',
    })
  }
})

const queueProjectionSchema = z.object({
  ...projectionShape,
  beforeExists: z.literal(true),
}).strict().superRefine((projection, context) => {
  if (projection.beforeContentSha256 === null) {
    context.addIssue({
      code: 'custom',
      message: 'Package-state queue projection requires an existing before checksum.',
    })
  }
})

const canonicalPrivatePackageStateTransactionV1Schema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_STATE_TRANSACTION_VERSION),
  source: z.literal('private_canonical_package_queue_outbox_transaction'),
  ownerUserId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
  }).strict(),
  transactionId: identity,
  transactionType: z.enum([
    'package_claim_and_cloud_dispatch_outbox_insert',
    'legacy_active_claim_cloud_dispatch_outbox_reconciliation',
  ]),
  authority: z.object({
    queueDefinitionHash: sha256,
    queueAggregateHashBefore: sha256,
    queueAggregateHashAfter: sha256,
    outboxAggregateHashBefore: sha256.nullable(),
    outboxAggregateHashAfter: sha256,
    jobId: identity,
    packageDeliveryAttempt: z.number().int().positive().max(100_000),
    queueClaimId: identity,
    queueClaimHash: sha256,
    queueClaimCreatedInTransaction: z.boolean(),
    dispatchIntentId: identity,
    outboxEntryHash: sha256,
  }).strict(),
  projections: z.object({
    queue: queueProjectionSchema,
    outbox: projectionSchema,
  }).strict(),
  committedAt: timestamp,
  boundaries: z.object({
    privateLocalPersistence: z.literal(true),
    singleHostOnly: z.literal(true),
    cooperativeCrossProcessLockRequired: z.literal(true),
    atomicWriteAheadCommitPoint: z.literal(true),
    queueAndOutboxCrashRecoveryRequired: z.literal(true),
    callerSelectedProjectionPathsAllowed: z.literal(false),
    plaintextClaimCredentialPersisted: z.literal(false),
    rawBearerTokenMediaPathPromptOrSignedUrlPersisted: z.literal(false),
    distributedDatabaseTransactionVerified: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  transactionHash: sha256,
}).strict()

const canonicalPrivatePackageCompletionTransactionSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_COMPLETION_TRANSACTION_VERSION),
  source: z.literal('private_canonical_package_queue_outbox_transaction'),
  ownerUserId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
  }).strict(),
  transactionId: identity,
  transactionType: z.literal('worker_completion_reconciliation'),
  authority: z.object({
    queueDefinitionHash: sha256,
    queueAggregateHashBefore: sha256,
    queueAggregateHashAfter: sha256,
    outboxAggregateHashBefore: sha256,
    outboxAggregateHashAfter: sha256,
    jobId: identity,
    packageDeliveryAttempt: z.number().int().positive().max(100_000),
    queueClaimId: identity,
    queueClaimHash: sha256,
    dispatchIntentId: identity,
    workerReceiptHash: sha256,
    completionEvidenceHash: sha256,
    completionOutcomeHash: sha256,
    queueCompletionHash: sha256,
    outboxEntryHashBefore: sha256,
    outboxEntryHashAfter: sha256,
    completionReceiptHash: sha256,
  }).strict(),
  projections: z.object({
    queue: queueProjectionSchema,
    outbox: queueProjectionSchema,
  }).strict(),
  committedAt: timestamp,
  boundaries: z.object({
    privateLocalPersistence: z.literal(true),
    singleHostOnly: z.literal(true),
    cooperativeCrossProcessLockRequired: z.literal(true),
    atomicWriteAheadCommitPoint: z.literal(true),
    queueAndOutboxCrashRecoveryRequired: z.literal(true),
    callerSelectedProjectionPathsAllowed: z.literal(false),
    plaintextClaimCredentialPersisted: z.literal(false),
    rawBearerTokenMediaPathPromptOrSignedUrlPersisted: z.literal(false),
    distributedDatabaseTransactionVerified: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  transactionHash: sha256,
}).strict()

const canonicalPrivatePackageFailureTransactionSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_FAILURE_TRANSACTION_VERSION),
  source: z.literal('private_canonical_package_queue_outbox_transaction'),
  ownerUserId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
  }).strict(),
  transactionId: identity,
  transactionType: z.literal('worker_failure_reconciliation'),
  authority: z.object({
    queueDefinitionHash: sha256,
    queueAggregateHashBefore: sha256,
    queueAggregateHashAfter: sha256,
    outboxAggregateHashBefore: sha256,
    outboxAggregateHashAfter: sha256,
    jobId: identity,
    packageDeliveryAttempt: z.number().int().positive().max(100_000),
    queueClaimId: identity,
    queueClaimHash: sha256,
    dispatchIntentId: identity,
    workerReceiptHash: sha256,
    failureEvidenceHash: sha256,
    queueReleaseHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    retryDisposition: z.enum([
      'retry_same_approved_operation',
      'fallback_or_user_review_required',
    ]),
    queueDisposition: z.enum([
      'retry_available',
      'attempts_exhausted',
      'user_review_required',
    ]),
    approvedMaxAttempts: z.number().int().positive().max(10),
    remainingAttempts: z.number().int().nonnegative().max(10),
    outboxEntryHashBefore: sha256,
    outboxEntryHashAfter: sha256,
    failureReceiptHash: sha256,
  }).strict(),
  projections: z.object({
    queue: queueProjectionSchema,
    outbox: queueProjectionSchema,
  }).strict(),
  committedAt: timestamp,
  boundaries: z.object({
    privateLocalPersistence: z.literal(true),
    singleHostOnly: z.literal(true),
    cooperativeCrossProcessLockRequired: z.literal(true),
    atomicWriteAheadCommitPoint: z.literal(true),
    queueAndOutboxCrashRecoveryRequired: z.literal(true),
    callerSelectedProjectionPathsAllowed: z.literal(false),
    plaintextClaimCredentialPersisted: z.literal(false),
    rawBearerTokenMediaPathPromptOrSignedUrlPersisted: z.literal(false),
    distributedDatabaseTransactionVerified: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  transactionHash: sha256,
}).strict()

export const canonicalPrivatePackageStateTransactionSchema = z.union([
  canonicalPrivatePackageStateTransactionV1Schema,
  canonicalPrivatePackageCompletionTransactionSchema,
  canonicalPrivatePackageFailureTransactionSchema,
])

export type CanonicalPrivatePackageStateTransaction = z.infer<
  typeof canonicalPrivatePackageStateTransactionSchema
>
