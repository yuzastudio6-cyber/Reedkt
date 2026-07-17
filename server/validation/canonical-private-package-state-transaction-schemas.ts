import { z } from 'zod'

export const CANONICAL_PRIVATE_PACKAGE_STATE_TRANSACTION_VERSION =
  'canonical-private-package-state-transaction-v1' as const

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

export const canonicalPrivatePackageStateTransactionSchema = z.object({
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

export type CanonicalPrivatePackageStateTransaction = z.infer<
  typeof canonicalPrivatePackageStateTransactionSchema
>
