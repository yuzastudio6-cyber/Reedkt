import { z } from 'zod'
import { idSchema } from './common-schemas'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const cancelCanonicalApprovedSnapshotSchema = z.object({
  workspaceId: idSchema,
  expectedAuthorityRevision: z.number().int().positive(),
  expectedSnapshotHash: sha256Schema,
  expectedReservationId: idSchema,
  reason: z.literal('user_cancelled_before_execution'),
}).strict()

export const canonicalPreExecutionCancellationResponseSchema = z.object({
  schemaVersion: z.literal('canonical-pre-execution-cancellation-v1'),
  source: z.literal('canonical_pre_execution_cancellation_service'),
  authorityRevision: z.number().int().positive(),
  identity: z.object({
    workspaceId: idSchema,
    projectId: idSchema,
    editSessionId: idSchema,
    planId: idSchema,
    estimateId: idSchema,
    snapshotId: idSchema,
    reservationId: idSchema,
  }).strict(),
  reason: z.literal('user_cancelled_before_execution'),
  planStatus: z.literal('cancelled'),
  estimateStatus: z.literal('cancelled'),
  reservation: z.object({
    status: z.literal('cancelled'),
    reservedCredits: z.number().int().nonnegative(),
    spentCredits: z.literal(0),
    releasedCredits: z.number().int().positive(),
    refundedCredits: z.literal(0),
  }).strict(),
  wallet: z.object({
    availableCredits: z.number().int().nonnegative(),
    reservedCredits: z.number().int().nonnegative(),
    spentCredits: z.number().int().nonnegative(),
    refundedCredits: z.number().int().nonnegative(),
  }).strict(),
  cancellationEventId: idSchema,
  ledgerEntryId: idSchema,
  derivedJobIds: z.array(idSchema).min(1).max(256),
  snapshotRemainsImmutable: z.literal(true),
  derivedJobsRemainUnmodified: z.literal(true),
  executionPackagePresent: z.boolean(),
  executionPackageRecordId: idSchema.optional(),
  executionPackageRecordPreserved: z.literal(true),
  workerLeaseCreated: z.literal(false),
  dispatchGrantCreated: z.literal(false),
  internalTestWalletMutated: z.literal(true),
  customerWalletMutation: z.literal(false),
  customerCreditMutation: z.literal(false),
  billingExecuted: z.literal(false),
  toolExecutionStarted: z.literal(false),
  providerCallStarted: z.literal(false),
  renderStarted: z.literal(false),
  publicDeliveryStarted: z.literal(false),
  testOnly: z.literal(true),
}).strict()

export type CancelCanonicalApprovedSnapshotBody = z.infer<
  typeof cancelCanonicalApprovedSnapshotSchema
>
export type CanonicalPreExecutionCancellationResponse = z.infer<
  typeof canonicalPreExecutionCancellationResponseSchema
>
