import { z } from 'zod'

import { canonicalPrivatePackageWorkQueueJobDefinitionSchema } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalPrivateJobExecutionFailureCategorySchema,
} from './canonical-private-job-execution-adapter-schemas'

export const CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_AGGREGATE_VERSION =
  'canonical-private-package-work-queue-aggregate-v1' as const
export const CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_EVENT_VERSION =
  'canonical-private-package-work-queue-event-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const boundedCount = z.number().int().nonnegative().max(100_000)

export const canonicalPrivatePackageWorkQueueCompletedOutcomeSchema = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  workItemKey: identity,
  required: z.boolean(),
  dependencyJobIds: z.array(identity).max(128),
  status: z.literal('completed_private_test'),
  artifactId: identity,
  contentType: z.string().trim().min(1).max(160),
  sha256,
  adapterReplayed: z.boolean(),
  blockedDependencyJobIds: z.array(identity).length(0),
}).strict()

export const canonicalPrivatePackageWorkQueueClaimSchema = z.object({
  claimId: identity,
  credentialSha256: sha256,
  workerIdentityHash: sha256,
  workerType: canonicalPrivatePackageWorkQueueJobDefinitionSchema.shape.workerType,
  resourceClassId: canonicalPrivatePackageWorkQueueJobDefinitionSchema.shape.resourceClassId,
  placementHash: sha256,
  deliveryAttempt: z.number().int().positive().max(100_000),
  claimedAt: timestamp,
  heartbeatAt: timestamp,
  heartbeatCount: boundedCount,
  expiresAt: timestamp,
  attemptDeadlineAt: timestamp,
  claimHash: sha256,
}).strict().superRefine((claim, context) => {
  const claimedAt = Date.parse(claim.claimedAt)
  const heartbeatAt = Date.parse(claim.heartbeatAt)
  const expiresAt = Date.parse(claim.expiresAt)
  const deadlineAt = Date.parse(claim.attemptDeadlineAt)
  if (
    heartbeatAt < claimedAt ||
    expiresAt <= heartbeatAt ||
    deadlineAt < expiresAt
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue claim timing is invalid.' })
  }
})

export const canonicalPrivatePackageWorkQueueCompletionSchema = z.object({
  claimId: identity,
  credentialSha256: sha256,
  outcome: canonicalPrivatePackageWorkQueueCompletedOutcomeSchema,
  completedAt: timestamp,
  completionHash: sha256,
}).strict()

export const canonicalPrivatePackageWorkQueueDispatchFailureSchema = z.object({
  queueClaimHash: sha256,
  workerReceiptHash: sha256,
  failureEvidenceHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  executionState: z.enum(['released_before_execution', 'failed_before_commit']),
  failureCategory: canonicalPrivateJobExecutionFailureCategorySchema.exclude([
    'post_commit_reconciliation',
  ]),
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
}).strict().superRefine((failure, context) => {
  if (
    failure.remainingAttempts > failure.approvedMaxAttempts ||
    (failure.queueDisposition === 'retry_available' &&
      (failure.retryDisposition !== 'retry_same_approved_operation' ||
        failure.remainingAttempts === 0)) ||
    (failure.queueDisposition === 'attempts_exhausted' &&
      (failure.retryDisposition !== 'fallback_or_user_review_required' ||
        failure.remainingAttempts !== 0)) ||
    (failure.queueDisposition === 'user_review_required' &&
      failure.retryDisposition !== 'fallback_or_user_review_required')
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical dispatch failure retry authority is inconsistent.',
    })
  }
})

export const canonicalPrivatePackageWorkQueueReleaseSchema = z.object({
  claimId: identity,
  credentialSha256: sha256,
  reason: z.enum([
    'scoped_capability_blocker',
    'approved_attempt_failure',
    'unexpected_execution_failure',
    'orchestrator_shutdown',
    'expired_claim_recovered',
  ]),
  dispatchFailure: canonicalPrivatePackageWorkQueueDispatchFailureSchema.optional(),
  releasedAt: timestamp,
  releaseHash: sha256,
}).strict().superRefine((release, context) => {
  if (!release.dispatchFailure) return
  const expectedReason = release.dispatchFailure.queueDisposition === 'user_review_required'
    ? 'unexpected_execution_failure'
    : 'approved_attempt_failure'
  if (release.reason !== expectedReason) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical dispatch failure release reason is inconsistent.',
    })
  }
})

export const canonicalPrivatePackageWorkQueueEntrySchema = z.object({
  definition: canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  state: z.enum(['queued', 'leased', 'completed']),
  deliveryAttemptCount: boundedCount,
  expiredClaimRecoveryCount: boundedCount,
  activeClaim: canonicalPrivatePackageWorkQueueClaimSchema.optional(),
  completion: canonicalPrivatePackageWorkQueueCompletionSchema.optional(),
  lastRelease: canonicalPrivatePackageWorkQueueReleaseSchema.optional(),
  updatedAt: timestamp,
  entryHash: sha256,
}).strict().superRefine((entry, context) => {
  if (
    (entry.state === 'leased') !== Boolean(entry.activeClaim) ||
    (entry.state === 'completed') !== Boolean(entry.completion) ||
    (entry.state === 'queued' && (entry.activeClaim !== undefined || entry.completion !== undefined)) ||
    entry.deliveryAttemptCount < entry.expiredClaimRecoveryCount
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue entry state is inconsistent.' })
  }
  if (entry.activeClaim && (
    entry.activeClaim.workerType !== entry.definition.workerType ||
    entry.activeClaim.resourceClassId !== entry.definition.resourceClassId ||
    entry.activeClaim.placementHash !== entry.definition.placementHash ||
    entry.activeClaim.deliveryAttempt !== entry.deliveryAttemptCount
  )) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue claim placement is inconsistent.' })
  }
  if (entry.completion) {
    const outcome = entry.completion.outcome
    if (
      outcome.jobId !== entry.definition.jobId ||
      outcome.approvedWorkItemId !== entry.definition.approvedWorkItemId ||
      outcome.workItemKey !== entry.definition.workItemKey ||
      outcome.required !== entry.definition.required ||
      JSON.stringify(outcome.dependencyJobIds) !== JSON.stringify(entry.definition.dependencyJobIds)
    ) {
      context.addIssue({ code: 'custom', message: 'Canonical work-queue completion identity is inconsistent.' })
    }
  }
})

export const canonicalPrivatePackageWorkQueueEventSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_EVENT_VERSION),
  sequence: z.number().int().positive().max(100_000),
  eventType: z.enum([
    'queue_created',
    'job_claimed',
    'expired_claim_recovered',
    'claim_released',
    'job_completed',
  ]),
  jobId: identity.optional(),
  claimId: identity.optional(),
  at: timestamp,
  previousEventHash: sha256.nullable(),
  eventHash: sha256,
}).strict()

export const canonicalPrivatePackageWorkQueueAggregateSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_AGGREGATE_VERSION),
  source: z.literal('private_canonical_package_work_queue_store'),
  ownerUserId: identity,
  definitionHash: sha256,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    packageHash: sha256,
    snapshotHash: sha256,
    workGraphHash: sha256,
    placementManifestHash: sha256,
    toolExecutionAuthorityHash: sha256,
    approvedResourcePlacementAuthorityHash: sha256,
  }).strict(),
  entries: z.array(canonicalPrivatePackageWorkQueueEntrySchema).min(1).max(256),
  events: z.array(canonicalPrivatePackageWorkQueueEventSchema).min(1).max(8_192),
  summary: z.object({
    totalJobCount: z.number().int().positive().max(256),
    queuedJobCount: z.number().int().nonnegative().max(256),
    leasedJobCount: z.number().int().nonnegative().max(256),
    completedJobCount: z.number().int().nonnegative().max(256),
    totalDeliveryAttemptCount: boundedCount,
    expiredClaimRecoveryCount: boundedCount,
    releasedClaimCount: boundedCount,
    eventCount: boundedCount,
  }).strict(),
  boundaries: z.object({
    privateLocalPersistence: z.literal(true),
    tenantAndPackageScoped: z.literal(true),
    checksumProtected: z.literal(true),
    atomicAggregateReplacement: z.literal(true),
    hostRestartClaimRecovery: z.literal(true),
    completedJobsAreTerminal: z.literal(true),
    plaintextClaimCredentialsPersisted: z.literal(false),
    claimCredentialDigestsPersisted: z.literal(true),
    browserClaimAllowed: z.literal(false),
    crossProcessAtomicClaimProven: z.boolean(),
    distributedTransactionProven: z.literal(false),
    cloudServiceIdentityVerified: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  updatedAt: timestamp,
  aggregateHash: sha256,
}).strict().superRefine((aggregate, context) => {
  const summary = aggregate.summary
  const queued = aggregate.entries.filter((entry) => entry.state === 'queued').length
  const leased = aggregate.entries.filter((entry) => entry.state === 'leased').length
  const completed = aggregate.entries.filter((entry) => entry.state === 'completed').length
  if (
    aggregate.entries.length !== summary.totalJobCount ||
    queued !== summary.queuedJobCount ||
    leased !== summary.leasedJobCount ||
    completed !== summary.completedJobCount ||
    queued + leased + completed !== summary.totalJobCount ||
    aggregate.entries.reduce((total, entry) => total + entry.deliveryAttemptCount, 0) !==
      summary.totalDeliveryAttemptCount ||
    aggregate.entries.reduce((total, entry) => total + entry.expiredClaimRecoveryCount, 0) !==
      summary.expiredClaimRecoveryCount ||
    aggregate.events.filter((event) => event.eventType === 'claim_released').length !==
      summary.releasedClaimCount ||
    aggregate.events.length !== summary.eventCount
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue aggregate summary is inconsistent.' })
  }
  if (
    new Set(aggregate.entries.map((entry) => entry.definition.jobId)).size !== aggregate.entries.length ||
    aggregate.entries.some((entry, index) => entry.definition.canonicalOrder !== index)
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue aggregate order is invalid.' })
  }
  for (let index = 0; index < aggregate.events.length; index += 1) {
    const event = aggregate.events[index]!
    const previous = aggregate.events[index - 1]
    if (
      event.sequence !== index + 1 ||
      event.previousEventHash !== (previous?.eventHash ?? null)
    ) {
      context.addIssue({ code: 'custom', message: 'Canonical work-queue event chain is invalid.' })
      break
    }
  }
})

export type CanonicalPrivatePackageWorkQueueCompletedOutcome = z.infer<
  typeof canonicalPrivatePackageWorkQueueCompletedOutcomeSchema
>
export type CanonicalPrivatePackageWorkQueueClaim = z.infer<
  typeof canonicalPrivatePackageWorkQueueClaimSchema
>
export type CanonicalPrivatePackageWorkQueueCompletion = z.infer<
  typeof canonicalPrivatePackageWorkQueueCompletionSchema
>
export type CanonicalPrivatePackageWorkQueueDispatchFailure = z.infer<
  typeof canonicalPrivatePackageWorkQueueDispatchFailureSchema
>
export type CanonicalPrivatePackageWorkQueueRelease = z.infer<
  typeof canonicalPrivatePackageWorkQueueReleaseSchema
>
export type CanonicalPrivatePackageWorkQueueEntry = z.infer<
  typeof canonicalPrivatePackageWorkQueueEntrySchema
>
export type CanonicalPrivatePackageWorkQueueEvent = z.infer<
  typeof canonicalPrivatePackageWorkQueueEventSchema
>
export type CanonicalPrivatePackageWorkQueueAggregate = z.infer<
  typeof canonicalPrivatePackageWorkQueueAggregateSchema
>
