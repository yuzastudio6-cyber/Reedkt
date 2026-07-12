import { z } from 'zod'
import { idSchema } from './common-schemas'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const compensateCanonicalApprovedSnapshotSchema = z.object({
  workspaceId: idSchema,
  expectedAuthorityRevision: z.number().int().positive(),
  expectedSnapshotHash: sha256Schema,
  expectedReservationId: idSchema,
  reason: z.literal('user_cancelled_after_dispatch'),
}).strict()

export const canonicalPostDispatchCompensationResponseSchema = z.object({
  schemaVersion: z.literal('canonical-post-dispatch-compensation-v1'),
  source: z.literal('canonical_post_dispatch_compensation_service'),
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
  reason: z.literal('user_cancelled_after_dispatch'),
  compensationMode: z.enum([
    'consumed_before_start',
    'completed_execution',
    'mixed_quiescent',
  ]),
  compensationFinalized: z.literal(true),
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
  compensationEventId: idSchema,
  ledgerEntryId: idSchema,
  derivedJobIds: z.array(idSchema).min(1).max(256),
  snapshotRemainsImmutable: z.literal(true),
  derivedJobsRemainUnmodified: z.literal(true),
  executionPackagePresent: z.literal(true),
  executionPackageRecordId: idSchema.optional(),
  executionPackageRecordPreserved: z.literal(true),
  evidence: z.object({
    artifactRecordCount: z.number().int().nonnegative().max(32_768),
    qaEvaluationRecordCount: z.number().int().nonnegative().max(32_768),
    reconciliationRecordCount: z.number().int().nonnegative().max(32_768),
    evidenceSetHash: sha256Schema,
    adapterCompletionRecordCount: z.number().int().nonnegative().max(2_000),
    adapterCompletionSetHash: sha256Schema,
    attemptCostEvidenceRecordCount: z.number().int().nonnegative().max(2_000),
    committedArtifactQaEvidencePreserved: z.literal(true),
    adapterCompletionEvidencePreserved: z.literal(true),
    internalAttemptCostEvidencePreserved: z.literal(true),
  }).strict(),
  leases: z.object({
    recordCount: z.number().int().nonnegative().max(2_000),
    releasedCount: z.number().int().nonnegative().max(2_000),
    expiredCount: z.number().int().nonnegative().max(2_000),
    notStartedFenceCount: z.number().int().nonnegative().max(2_000),
    completedFenceCount: z.number().int().nonnegative().max(2_000),
    inFlightStartedFenceCount: z.literal(0),
    allLeasesTerminal: z.literal(true),
  }).strict(),
  dispatches: z.object({
    recordCount: z.number().int().nonnegative().max(4_096),
    revokedCount: z.number().int().nonnegative().max(4_096),
    expiredCount: z.number().int().nonnegative().max(4_096),
    deniedCount: z.number().int().nonnegative().max(4_096),
    consumedCount: z.number().int().nonnegative().max(4_096),
    consumedRecordsPreserved: z.literal(true),
    allDispatchesTerminal: z.literal(true),
  }).strict(),
  toolExecutionPreviouslyStarted: z.boolean(),
  toolExecutionPreviouslyCompleted: z.boolean(),
  internalTestWalletMutated: z.literal(true),
  customerWalletMutation: z.literal(false),
  customerCreditMutation: z.literal(false),
  billingExecuted: z.literal(false),
  providerCallStarted: z.literal(false),
  renderStarted: z.literal(false),
  publicDeliveryStarted: z.literal(false),
  testOnly: z.literal(true),
}).strict().superRefine((response, context) => {
  const leaseCount = response.leases.releasedCount + response.leases.expiredCount
  if (
    leaseCount !== response.leases.recordCount ||
    response.leases.notStartedFenceCount + response.leases.completedFenceCount !==
      response.leases.recordCount
  ) {
    context.addIssue({ code: 'custom', message: 'Compensation lease counts are inconsistent.' })
  }
  if (response.evidence.adapterCompletionRecordCount !== response.leases.completedFenceCount) {
    context.addIssue({ code: 'custom', message: 'Compensation adapter-completion counts are inconsistent.' })
  }
  if (response.evidence.attemptCostEvidenceRecordCount > response.evidence.adapterCompletionRecordCount) {
    context.addIssue({ code: 'custom', message: 'Compensation attempt-cost counts are inconsistent.' })
  }
  const dispatchCount = response.dispatches.revokedCount + response.dispatches.expiredCount +
    response.dispatches.deniedCount + response.dispatches.consumedCount
  if (dispatchCount !== response.dispatches.recordCount) {
    context.addIssue({ code: 'custom', message: 'Compensation dispatch counts are inconsistent.' })
  }
  if (response.toolExecutionPreviouslyStarted !== (response.leases.completedFenceCount > 0)) {
    context.addIssue({ code: 'custom', message: 'Compensation execution-start evidence is inconsistent.' })
  }
  if (response.toolExecutionPreviouslyCompleted !== (response.leases.completedFenceCount > 0)) {
    context.addIssue({ code: 'custom', message: 'Compensation execution-completion evidence is inconsistent.' })
  }
  if (
    response.compensationMode === 'consumed_before_start' &&
    (response.dispatches.consumedCount === 0 || response.leases.completedFenceCount !== 0)
  ) {
    context.addIssue({ code: 'custom', message: 'Consumed-before-start compensation evidence is inconsistent.' })
  }
  if (
    response.compensationMode === 'completed_execution' &&
    (response.leases.completedFenceCount === 0 || response.dispatches.consumedCount !== 0)
  ) {
    context.addIssue({ code: 'custom', message: 'Completed-execution compensation evidence is inconsistent.' })
  }
  if (
    response.compensationMode === 'mixed_quiescent' &&
    (response.leases.completedFenceCount === 0 || response.dispatches.consumedCount === 0)
  ) {
    context.addIssue({ code: 'custom', message: 'Mixed compensation evidence is inconsistent.' })
  }
})

export type CompensateCanonicalApprovedSnapshotBody = z.infer<
  typeof compensateCanonicalApprovedSnapshotSchema
>
export type CanonicalPostDispatchCompensationResponse = z.infer<
  typeof canonicalPostDispatchCompensationResponseSchema
>
