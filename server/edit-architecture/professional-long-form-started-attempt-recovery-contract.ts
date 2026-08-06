import { z } from 'zod'

import {
  professionalLongFormAuthorizedChildExecutionAttemptSchema,
  type ProfessionalLongFormAuthorizedChildExecutionAttempt,
} from './professional-long-form-authorized-child-contract'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const PROFESSIONAL_LONG_FORM_STARTED_ATTEMPT_FAILURE_VERSION =
  'professional-long-form-started-attempt-failure-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })

export const professionalLongFormStartedAttemptFailureCategorySchema = z.enum([
  'provider_error',
  'provider_variance_absorbed',
  'reeditpro_error_absorbed',
  'user_requested_retry',
  'validation_error',
  'timeout',
  'cancelled',
  'unknown',
])

export const professionalLongFormStartedAttemptFailureSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_STARTED_ATTEMPT_FAILURE_VERSION,
  ),
  source: z.literal(
    'private_canonical_package_work_queue_started_attempt_recovery',
  ),
  failureId: identity,
  executionAttempt: professionalLongFormAuthorizedChildExecutionAttemptSchema,
  attemptInternalCostEvidenceHash: sha256,
  failureCategory: professionalLongFormStartedAttemptFailureCategorySchema,
  failureCode: z.enum([
    'WORKER_LEASE_EXPIRED',
    'CANONICAL_LONG_FORM_ATTEMPT_FAILED_BEFORE_COMMIT',
  ]),
  claim: z.object({
    claimId: identity,
    initialClaimHash: sha256,
    terminalClaimHash: sha256,
    claimedAt: timestamp,
    heartbeatAt: timestamp,
    heartbeatCount: z.number().int().nonnegative().max(100_000),
    expiresAt: timestamp,
    attemptDeadlineAt: timestamp,
  }).strict(),
  retry: z.object({
    approvedMaxAttempts: z.union([z.literal(1), z.literal(2)]),
    remainingAttempts: z.union([z.literal(0), z.literal(1)]),
    retryDisposition: z.enum([
      'retry_same_approved_operation',
      'user_review_or_new_approval_required',
    ]),
    queueDisposition: z.enum([
      'retry_available',
      'attempts_exhausted',
      'user_review_required',
    ]),
    automaticRetryStarted: z.literal(false),
  }).strict(),
  terminal: z.object({
    state: z.literal('failed_before_commit'),
    artifactAuthorityGranted: z.literal(false),
    completionAuthorityGranted: z.literal(false),
    approvedSnapshotMutated: z.literal(false),
    originalEstimateAndReservationRetained: z.literal(true),
    customerPriceAuthorityIncluded: z.literal(false),
    customerCreditAuthorityIncluded: z.literal(false),
    serviceFeeAuthorityIncluded: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    billingAuthorized: z.literal(false),
  }).strict(),
  terminalizedAt: timestamp,
  failureHash: sha256,
}).strict().superRefine((failure, context) => {
  const attempt = failure.executionAttempt
  const remaining = failure.retry.approvedMaxAttempts - attempt.deliveryAttempt
  const { failureHash, ...failurePayload } = failure
  const expectedFailureId = `long-form-attempt-failure-${sha256AuthorityValue({
    attemptHash: attempt.attemptHash,
    attemptInternalCostEvidenceHash: failure.attemptInternalCostEvidenceHash,
    terminalizedAt: failure.terminalizedAt,
  }).slice(0, 40)}`
  const retryEligible = [
    'timeout',
    'provider_error',
    'provider_variance_absorbed',
    'reeditpro_error_absorbed',
    'user_requested_retry',
  ].includes(failure.failureCategory)
  if (
    failure.failureId !== expectedFailureId ||
    failureHash !== sha256AuthorityValue(failurePayload) ||
    attempt.claimId !== failure.claim.claimId ||
    attempt.claimHash !== failure.claim.initialClaimHash ||
    (failure.claim.heartbeatCount === 0) !==
      (failure.claim.initialClaimHash === failure.claim.terminalClaimHash) ||
    Date.parse(failure.claim.claimedAt) > Date.parse(failure.claim.heartbeatAt) ||
    Date.parse(failure.claim.heartbeatAt) > Date.parse(failure.claim.expiresAt) ||
    Date.parse(failure.claim.expiresAt) >
      Date.parse(failure.claim.attemptDeadlineAt) ||
    Date.parse(attempt.startedAt) < Date.parse(failure.claim.claimedAt) ||
    Date.parse(attempt.startedAt) > Date.parse(failure.terminalizedAt) ||
    failure.retry.remainingAttempts !== remaining ||
    (remaining > 0 && retryEligible && (
      failure.retry.queueDisposition !== 'retry_available' ||
      failure.retry.retryDisposition !== 'retry_same_approved_operation'
    )) ||
    (remaining === 0 && (
      failure.retry.queueDisposition !== 'attempts_exhausted' ||
      failure.retry.retryDisposition !==
        'user_review_or_new_approval_required'
    )) ||
    (remaining > 0 && !retryEligible && (
      failure.retry.queueDisposition !== 'user_review_required' ||
      failure.retry.retryDisposition !==
        'user_review_or_new_approval_required'
    )) ||
    (failure.failureCategory === 'timeout') !==
      (failure.failureCode === 'WORKER_LEASE_EXPIRED') ||
    (failure.failureCategory === 'timeout' &&
      Date.parse(failure.terminalizedAt) < Date.parse(failure.claim.expiresAt))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Professional long-form started-attempt failure is inconsistent.',
    })
  }
})

export type ProfessionalLongFormStartedAttemptFailure = z.infer<
  typeof professionalLongFormStartedAttemptFailureSchema
>

export function buildProfessionalLongFormStartedAttemptFailure(input: {
  executionAttempt: ProfessionalLongFormAuthorizedChildExecutionAttempt
  attemptInternalCostEvidenceHash: string
  failureCategory: z.infer<
    typeof professionalLongFormStartedAttemptFailureCategorySchema
  >
  claim: ProfessionalLongFormStartedAttemptFailure['claim']
  approvedMaxAttempts: 1 | 2
  terminalizedAt: string
}): ProfessionalLongFormStartedAttemptFailure {
  const remainingAttempts = (
    input.approvedMaxAttempts - input.executionAttempt.deliveryAttempt
  ) as 0 | 1
  const retryEligible = [
    'timeout',
    'provider_error',
    'provider_variance_absorbed',
    'reeditpro_error_absorbed',
    'user_requested_retry',
  ].includes(input.failureCategory)
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_STARTED_ATTEMPT_FAILURE_VERSION,
    source:
      'private_canonical_package_work_queue_started_attempt_recovery' as const,
    failureId: `long-form-attempt-failure-${sha256AuthorityValue({
      attemptHash: input.executionAttempt.attemptHash,
      attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
      terminalizedAt: input.terminalizedAt,
    }).slice(0, 40)}`,
    executionAttempt: input.executionAttempt,
    attemptInternalCostEvidenceHash: input.attemptInternalCostEvidenceHash,
    failureCategory: input.failureCategory,
    failureCode: input.failureCategory === 'timeout'
      ? 'WORKER_LEASE_EXPIRED' as const
      : 'CANONICAL_LONG_FORM_ATTEMPT_FAILED_BEFORE_COMMIT' as const,
    claim: input.claim,
    retry: {
      approvedMaxAttempts: input.approvedMaxAttempts,
      remainingAttempts,
      retryDisposition: remainingAttempts > 0 && retryEligible
        ? 'retry_same_approved_operation' as const
        : 'user_review_or_new_approval_required' as const,
      queueDisposition: remainingAttempts > 0 && retryEligible
        ? 'retry_available' as const
        : remainingAttempts === 0
          ? 'attempts_exhausted' as const
          : 'user_review_required' as const,
      automaticRetryStarted: false as const,
    },
    terminal: {
      state: 'failed_before_commit' as const,
      artifactAuthorityGranted: false as const,
      completionAuthorityGranted: false as const,
      approvedSnapshotMutated: false as const,
      originalEstimateAndReservationRetained: true as const,
      customerPriceAuthorityIncluded: false as const,
      customerCreditAuthorityIncluded: false as const,
      serviceFeeAuthorityIncluded: false as const,
      walletMutationAuthorized: false as const,
      billingAuthorized: false as const,
    },
    terminalizedAt: input.terminalizedAt,
  }
  return professionalLongFormStartedAttemptFailureSchema.parse({
    ...payload,
    failureHash: sha256AuthorityValue(payload),
  })
}
