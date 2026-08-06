import { z } from 'zod'

import {
  canonicalPrivatePackageWorkQueueIdentitySchema,
  canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE,
} from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalPrivateJobExecutionFailureCategorySchema,
} from './canonical-private-job-execution-adapter-schemas'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-first-child-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-source-authority-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-master-timing-execution-contract'
import {
  professionalLongFormAuthorizedChildAuthorizationReceiptSchema,
  professionalLongFormAuthorizedChildCompletionSchema,
  professionalLongFormAuthorizedChildExecutionAttemptSchema,
  isProfessionalLongFormCrossChunkColorAuthorization,
  isProfessionalLongFormContinuousProgramAudioAuthorization,
  isProfessionalLongFormMasterAssemblyAuthorization,
  isProfessionalLongFormPrivateMasterQaAuthorization,
  isProfessionalLongFormFirstObjectChunkQaAuthorization,
  isProfessionalLongFormFirstObjectChunkRenderAuthorization,
  isProfessionalLongFormDeliveryH264Authorization,
  isProfessionalLongFormDeliveryH264QaAuthorization,
  isProfessionalLongFormDeliveryDecodedAudioQaAuthorization,
  isProfessionalLongFormDeliveryDecodedVideoQaAuthorization,
  isProfessionalLongFormDeliveryDownloadAuthorization,
  isProfessionalLongFormDeliveryMuxAuthorization,
  isProfessionalLongFormDeliveryRootAuthorization,
} from '../edit-architecture/professional-long-form-authorized-child-contract'
import {
  professionalLongFormStartedAttemptFailureSchema,
} from '../edit-architecture/professional-long-form-started-attempt-recovery-contract'

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
  professionalLongFormExecution:
    professionalLongFormAuthorizedChildCompletionSchema.optional(),
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
  providerUnknownReconciliation: z.object({
    providerDispatchTerminalHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    resolution: z.literal('succeeded'),
    reconciliationHash: sha256,
  }).strict().optional(),
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

export const canonicalPrivatePackageWorkQueueDispatchTimeoutSchema = z.object({
  queueClaimHash: sha256,
  expiredQueueClaimHash: sha256,
  controllerReceiptHash: sha256,
  workerReceiptHash: sha256,
  timeoutEvidenceHash: sha256,
  timeoutDetailHash: sha256,
  queueClaimExpiresAt: timestamp,
  queueClaimAttemptDeadlineAt: timestamp,
  attemptInternalCostEvidenceHash: sha256,
  failureCategory: z.literal('execution_timeout'),
  failureCode: z.literal('WORKER_LEASE_EXPIRED'),
  executionState: z.literal('failed_before_commit'),
  retryDisposition: z.enum([
    'retry_same_approved_operation',
    'fallback_or_user_review_required',
  ]),
  queueDisposition: z.enum([
    'retry_available',
    'attempts_exhausted',
  ]),
  approvedMaxAttempts: z.number().int().positive().max(10),
  remainingAttempts: z.number().int().nonnegative().max(10),
}).strict().superRefine((timeout, context) => {
  if (
    timeout.remainingAttempts > timeout.approvedMaxAttempts ||
    Date.parse(timeout.queueClaimExpiresAt) >
      Date.parse(timeout.queueClaimAttemptDeadlineAt) ||
    (timeout.queueDisposition === 'retry_available' &&
      (timeout.retryDisposition !== 'retry_same_approved_operation' ||
        timeout.remainingAttempts === 0)) ||
    (timeout.queueDisposition === 'attempts_exhausted' &&
      (timeout.retryDisposition !== 'fallback_or_user_review_required' ||
        timeout.remainingAttempts !== 0))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical dispatch timeout retry authority is inconsistent.',
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
    'provider_unknown_outcome',
    'provider_unknown_reconciled_failed',
  ]),
  dispatchFailure: canonicalPrivatePackageWorkQueueDispatchFailureSchema.optional(),
  dispatchTimeout: canonicalPrivatePackageWorkQueueDispatchTimeoutSchema.optional(),
  professionalLongFormFailure:
    professionalLongFormStartedAttemptFailureSchema.optional(),
  providerUnknownReconciliation: z.object({
    providerDispatchTerminalHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    resolution: z.literal('failed'),
    reconciliationHash: sha256,
  }).strict().optional(),
  releasedAt: timestamp,
  releaseHash: sha256,
}).strict().superRefine((release, context) => {
  if (
    [
      release.dispatchFailure,
      release.dispatchTimeout,
      release.professionalLongFormFailure,
    ].filter(Boolean).length > 1
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical queue release cannot contain competing failure authorities.',
    })
    return
  }
  if (release.dispatchFailure) {
    const expectedReason = release.dispatchFailure.queueDisposition === 'user_review_required'
      ? 'unexpected_execution_failure'
      : 'approved_attempt_failure'
    if (release.reason !== expectedReason) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical dispatch failure release reason is inconsistent.',
      })
    }
  }
  if (release.dispatchTimeout && release.reason !== 'expired_claim_recovered') {
    context.addIssue({
      code: 'custom',
      message: 'Canonical dispatch timeout release reason is inconsistent.',
    })
  }
  if (release.professionalLongFormFailure) {
    const expectedReason =
      release.professionalLongFormFailure.retry.queueDisposition ===
        'retry_available'
        ? 'approved_attempt_failure'
        : 'unexpected_execution_failure'
    if (release.reason !== expectedReason) {
      context.addIssue({
        code: 'custom',
        message: 'Professional long-form failure release reason is inconsistent.',
      })
    }
  }
  if (
    (release.reason === 'provider_unknown_reconciled_failed') !==
      (release.providerUnknownReconciliation !== undefined) ||
    (release.reason === 'provider_unknown_outcome' &&
      release.providerUnknownReconciliation !== undefined)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider unknown-outcome release reconciliation is inconsistent.',
    })
  }
})

export const canonicalPrivatePackageWorkQueueEntrySchema = z.object({
  definition: canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  state: z.enum(['queued', 'leased', 'completed']),
  deliveryAttemptCount: boundedCount,
  expiredClaimRecoveryCount: boundedCount,
  professionalLongFormExecutionAuthorization:
    professionalLongFormAuthorizedChildAuthorizationReceiptSchema.optional(),
  professionalLongFormExecutionAttempt:
    professionalLongFormAuthorizedChildExecutionAttemptSchema.optional(),
  professionalLongFormExecutionFailures: z.array(
    professionalLongFormStartedAttemptFailureSchema,
  ).max(2).optional(),
  providerExecutionAttempt: z.object({
    authorizationHash: sha256,
    providerDispatchGrantId: identity,
    providerDispatchGrantHash: sha256,
    dispatchAttemptId: identity,
    dispatchAttemptHash: sha256,
    claimId: identity,
    claimHash: sha256,
    deliveryAttempt: z.number().int().positive().max(10),
    state: z.enum([
      'consumed_before_provider_request',
      'terminal_known',
      'terminal_unknown',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    terminalHash: sha256.optional(),
    attemptInternalCostEvidenceHash: sha256.optional(),
    providerTerminalState: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]).optional(),
    startedAt: timestamp,
    terminalAt: timestamp.optional(),
    fenceHash: sha256,
  }).strict().optional(),
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
  const providerAttempt = entry.providerExecutionAttempt
  if (providerAttempt) {
    const terminal = providerAttempt.state !== 'consumed_before_provider_request'
    const liveClaim = entry.activeClaim
    const terminalClaimId = entry.completion?.claimId ?? entry.lastRelease?.claimId ??
      entry.activeClaim?.claimId
    if (
      entry.definition.providerExecutionMode === 'none' ||
      providerAttempt.deliveryAttempt !== entry.deliveryAttemptCount ||
      (providerAttempt.state === 'consumed_before_provider_request' && (
        entry.state !== 'leased' || !liveClaim ||
        providerAttempt.claimId !== liveClaim.claimId ||
        providerAttempt.claimHash !== liveClaim.claimHash
      )) ||
      (terminal && (
        !providerAttempt.terminalHash ||
        !providerAttempt.attemptInternalCostEvidenceHash ||
        !providerAttempt.providerTerminalState ||
        !providerAttempt.terminalAt ||
        providerAttempt.claimId !== terminalClaimId
      )) ||
      (!terminal && providerAttempt.providerTerminalState !== undefined) ||
      (providerAttempt.state === 'terminal_known' &&
        !['succeeded', 'failed'].includes(
          providerAttempt.providerTerminalState ?? '')) ||
      (providerAttempt.state === 'terminal_unknown' &&
        providerAttempt.providerTerminalState !==
          'unknown_reconciliation_required') ||
      (providerAttempt.state === 'unknown_reconciled_succeeded' &&
        providerAttempt.providerTerminalState !==
          'unknown_reconciled_succeeded') ||
      (providerAttempt.state === 'unknown_reconciled_failed' &&
        providerAttempt.providerTerminalState !==
          'unknown_reconciled_failed') ||
      (providerAttempt.state === 'terminal_unknown' && !(
        (entry.state === 'leased' && entry.activeClaim?.claimId ===
          providerAttempt.claimId) ||
        (entry.state === 'queued' && entry.lastRelease?.reason ===
          'provider_unknown_outcome')
      )) ||
      (providerAttempt.state === 'unknown_reconciled_succeeded' &&
        entry.state !== 'completed') ||
      (providerAttempt.state === 'unknown_reconciled_failed' && (
        entry.state !== 'queued' ||
        entry.lastRelease?.reason !== 'provider_unknown_reconciled_failed'
      ))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical provider execution fence is inconsistent.',
      })
    }
  }
  const authorization = entry.professionalLongFormExecutionAuthorization
  const executionAttempt = entry.professionalLongFormExecutionAttempt
  const executionFailures = entry.professionalLongFormExecutionFailures ?? []
  const professionalCompletion = entry.completion?.outcome.professionalLongFormExecution
  if (!authorization) {
    if (executionAttempt || professionalCompletion || executionFailures.length > 0) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical professional long-form execution evidence lacks authorization.',
      })
    }
    return
  }
  const deliveryAuthorization =
    isProfessionalLongFormDeliveryRootAuthorization(authorization) ||
    isProfessionalLongFormDeliveryH264Authorization(authorization) ||
    isProfessionalLongFormDeliveryH264QaAuthorization(authorization) ||
    isProfessionalLongFormDeliveryDecodedVideoQaAuthorization(authorization) ||
    isProfessionalLongFormDeliveryDecodedAudioQaAuthorization(authorization) ||
    isProfessionalLongFormDeliveryDownloadAuthorization(authorization) ||
    isProfessionalLongFormDeliveryMuxAuthorization(authorization)
  if (
    entry.definition.privateExecutionReady ||
    (entry.definition.approvedWorkItemId !==
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID &&
      entry.definition.approvedWorkItemId !==
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID &&
      entry.definition.approvedWorkItemId !==
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID &&
      !isProfessionalLongFormFirstObjectChunkRenderAuthorization(authorization) &&
      !isProfessionalLongFormFirstObjectChunkQaAuthorization(authorization) &&
      !isProfessionalLongFormCrossChunkColorAuthorization(authorization) &&
      !isProfessionalLongFormContinuousProgramAudioAuthorization(authorization) &&
      !isProfessionalLongFormMasterAssemblyAuthorization(authorization) &&
      !isProfessionalLongFormPrivateMasterQaAuthorization(authorization) &&
      !deliveryAuthorization) ||
    entry.definition.requiredGate !==
      (deliveryAuthorization
        ? CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE
        : 'canonical_professional_long_form_exact_tool_cost_runner_and_qa_authority') ||
    authorization.jobId !== entry.definition.jobId ||
    authorization.approvedWorkItemId !== entry.definition.approvedWorkItemId ||
    authorization.jobDefinitionHash !== entry.definition.definitionHash ||
    authorization.placementHash !== entry.definition.placementHash
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical professional long-form execution authorization lost exact child-job authority.',
    })
  }
  if (executionAttempt) {
    const terminalClaim = entry.activeClaim ?? entry.completion
    if (
      executionAttempt.authorizationId !== authorization.authorizationId ||
      executionAttempt.authorityHash !== authorization.authorityHash ||
      executionAttempt.jobId !== entry.definition.jobId ||
      executionAttempt.approvedWorkItemId !== entry.definition.approvedWorkItemId ||
      executionAttempt.claimId !== terminalClaim?.claimId ||
      executionAttempt.deliveryAttempt !== entry.deliveryAttemptCount ||
      (entry.state === 'queued' && entry.lastRelease !== undefined)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical professional long-form execution attempt lost claim authority.',
      })
    }
  }
  const failureAttempts = executionFailures.map((failure) =>
    failure.executionAttempt)
  const lastFailure = executionFailures.at(-1)
  if (
    failureAttempts.some((attempt, index) =>
      attempt.authorizationId !== authorization.authorizationId ||
      attempt.authorityHash !== authorization.authorityHash ||
      attempt.jobId !== entry.definition.jobId ||
      attempt.approvedWorkItemId !== entry.definition.approvedWorkItemId ||
      attempt.deliveryAttempt <=
        (failureAttempts[index - 1]?.deliveryAttempt ?? 0) ||
      executionFailures[index]?.retry.approvedMaxAttempts !==
        entry.definition.maxAttempts) ||
    new Set(failureAttempts.map((attempt) => attempt.executionAttemptId)).size !==
      failureAttempts.length ||
    (executionAttempt &&
      executionAttempt.deliveryAttempt <=
        (failureAttempts.at(-1)?.deliveryAttempt ?? 0)) ||
    failureAttempts.length > entry.deliveryAttemptCount ||
    (entry.state === 'queued' && executionAttempt !== undefined) ||
    (entry.state === 'queued' && lastFailure &&
      entry.deliveryAttemptCount ===
        lastFailure.executionAttempt.deliveryAttempt &&
      entry.lastRelease?.professionalLongFormFailure?.failureHash !==
        lastFailure.failureHash) ||
    (entry.lastRelease?.professionalLongFormFailure &&
      entry.lastRelease.professionalLongFormFailure.failureHash !==
        lastFailure?.failureHash)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical professional long-form failed-attempt history is inconsistent.',
    })
  }
  if (
    (entry.state === 'completed') !== Boolean(professionalCompletion) ||
    Boolean(professionalCompletion) !== Boolean(executionAttempt && entry.completion)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical professional long-form terminal evidence is incomplete.',
    })
  }
  if (professionalCompletion && executionAttempt && (
    professionalCompletion.executionAttemptId !== executionAttempt.executionAttemptId ||
    professionalCompletion.authorizationId !== authorization.authorizationId ||
    professionalCompletion.authorityHash !== authorization.authorityHash
  )) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical professional long-form completion lost execution lineage.',
    })
  }
})

export const canonicalPrivatePackageWorkQueueEventSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_EVENT_VERSION),
  sequence: z.number().int().positive().max(100_000),
  eventType: z.enum([
    'queue_created',
    'job_execution_authorized',
    'job_claimed',
    'job_execution_started',
    'provider_execution_started',
    'provider_execution_terminal',
    'expired_claim_recovered',
    'claim_released',
    'provider_unknown_reconciled',
    'job_completed',
  ]),
  jobId: identity.optional(),
  claimId: identity.optional(),
  authorizationId: identity.optional(),
  executionAttemptId: identity.optional(),
  at: timestamp,
  previousEventHash: sha256.nullable(),
  eventHash: sha256,
}).strict().superRefine((event, context) => {
  if (
    (event.eventType === 'job_execution_authorized' &&
      (!event.jobId || !event.authorizationId || event.claimId ||
        event.executionAttemptId)) ||
    (event.eventType === 'job_execution_started' &&
      (!event.jobId || !event.claimId || !event.authorizationId ||
        !event.executionAttemptId)) ||
    (!['job_execution_authorized', 'job_execution_started'].includes(event.eventType) &&
      (event.authorizationId || event.executionAttemptId))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical work-queue execution event identity is inconsistent.',
    })
  }
})

export const canonicalPrivatePackageWorkQueueAggregateSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_AGGREGATE_VERSION),
  source: z.literal('private_canonical_package_work_queue_store'),
  ownerUserId: identity,
  definitionHash: sha256,
  identity: canonicalPrivatePackageWorkQueueIdentitySchema,
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
  for (const entry of aggregate.entries) {
    const authorization = entry.professionalLongFormExecutionAuthorization
    const executionAttempt = entry.professionalLongFormExecutionAttempt
    const failedAttempts = (entry.professionalLongFormExecutionFailures ?? [])
      .map((failure) => failure.executionAttempt)
    const allAttempts = [
      ...failedAttempts,
      ...(executionAttempt ? [executionAttempt] : []),
    ]
    const authorizationEvents = aggregate.events.filter((event) =>
      event.eventType === 'job_execution_authorized' &&
      event.jobId === entry.definition.jobId)
    const attemptEvents = aggregate.events.filter((event) =>
      event.eventType === 'job_execution_started' &&
      event.jobId === entry.definition.jobId)
    if (
      authorizationEvents.length !== (authorization ? 1 : 0) ||
      (authorization && authorizationEvents[0]?.authorizationId !==
        authorization.authorizationId) ||
      attemptEvents.length !== allAttempts.length ||
      allAttempts.some((attempt, index) =>
        attemptEvents[index]?.authorizationId !== attempt.authorizationId ||
        attemptEvents[index]?.executionAttemptId !==
          attempt.executionAttemptId ||
        attemptEvents[index]?.claimId !== attempt.claimId)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical professional long-form event lineage is inconsistent.',
      })
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
export type CanonicalPrivatePackageWorkQueueDispatchTimeout = z.infer<
  typeof canonicalPrivatePackageWorkQueueDispatchTimeoutSchema
>
export type CanonicalPrivatePackageWorkQueueRelease = z.infer<
  typeof canonicalPrivatePackageWorkQueueReleaseSchema
>
export type CanonicalPrivatePackageWorkQueueProfessionalLongFormFailure =
  NonNullable<CanonicalPrivatePackageWorkQueueRelease[
    'professionalLongFormFailure'
  ]>
export type CanonicalPrivatePackageWorkQueueEntry = z.infer<
  typeof canonicalPrivatePackageWorkQueueEntrySchema
>
export type CanonicalPrivatePackageWorkQueueEvent = z.infer<
  typeof canonicalPrivatePackageWorkQueueEventSchema
>
export type CanonicalPrivatePackageWorkQueueAggregate = z.infer<
  typeof canonicalPrivatePackageWorkQueueAggregateSchema
>
