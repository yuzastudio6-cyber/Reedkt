import { z } from 'zod'
import {
  CREDIT_REVISION_ACTION_STATUSES,
  CREDIT_REVISION_PAUSE_REASONS,
  CREDIT_SETTLEMENT_REASONS,
  CREDIT_SETTLEMENT_STATUSES,
} from '../../src/types/credits'
import {
  REEDITPRO_EDIT_LEVELS,
} from '../../src/types/credit-policy'
import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'
import { idSchema } from './common-schemas'

export const nonNegativeIntegerCreditSchema = z.number().int().nonnegative()
export const nonNegativeIntegerCentsSchema = z.number().int().nonnegative()
export const positiveDurationSecondsSchema = z.number().positive()

export const productEditLevelSchema = z.enum(REEDITPRO_EDIT_LEVELS)
export const creditSettlementStatusSchema = z.enum(CREDIT_SETTLEMENT_STATUSES)
export const creditSettlementReasonSchema = z.enum(CREDIT_SETTLEMENT_REASONS)
export const creditRevisionActionStatusSchema = z.enum(CREDIT_REVISION_ACTION_STATUSES)
export const creditRevisionPauseReasonSchema = z.enum(CREDIT_REVISION_PAUSE_REASONS)

export const secretSafeJsonObjectSchema = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(value)
  if (secretLikePaths.length > 0) {
    context.addIssue({
      code: 'custom',
      message: `Metadata or payload contains secret-like fields: ${secretLikePaths.join(', ')}`,
      path: ['secretLikePaths'],
    })
  }
})

export const previewCreditSettlementSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.nullish(),
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
  editComputeLevel: productEditLevelSchema,
  finalVideoDurationSeconds: positiveDurationSecondsSchema,
  reservedCredits: nonNegativeIntegerCreditSchema,
  toolCostEventIds: z.array(idSchema).optional(),
  idempotencyKey: idSchema,
})

export const creditSettlementRecordSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.nullish(),
  chatSessionId: idSchema.nullish(),
  jobBatchId: idSchema.nullish(),
  creditWalletId: idSchema.nullish(),
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
  creditApprovalId: idSchema.nullish(),
  editComputeLevel: productEditLevelSchema,
  finalVideoDurationSeconds: positiveDurationSecondsSchema,
  status: creditSettlementStatusSchema,
  settlementReason: creditSettlementReasonSchema,
  reservedCredits: nonNegativeIntegerCreditSchema,
  actualToolCostCents: nonNegativeIntegerCentsSchema,
  actualToolCostCredits: nonNegativeIntegerCreditSchema,
  reeditproServiceFeeCredits: nonNegativeIntegerCreditSchema,
  finalChargeCredits: nonNegativeIntegerCreditSchema,
  releasedCredits: nonNegativeIntegerCreditSchema,
  absorbedOverageCredits: nonNegativeIntegerCreditSchema,
  outstandingCredits: nonNegativeIntegerCreditSchema,
  billableToolEventCount: nonNegativeIntegerCreditSchema,
  nonBillableToolEventCount: nonNegativeIntegerCreditSchema,
  toolCostEventIds: z.array(idSchema),
  rateCardVersion: z.string().nullish(),
  creditPolicyVersion: z.string().nullish(),
  serviceFeePolicyVersion: z.string().nullish(),
  idempotencyKey: idSchema,
  settlementPayload: secretSafeJsonObjectSchema,
  receiptPayload: secretSafeJsonObjectSchema,
  metadata: secretSafeJsonObjectSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  settledAt: z.string().min(1).nullish(),
  failedAt: z.string().min(1).nullish(),
}).superRefine((record, context) => {
  const statusesRequiringFormula = new Set(['previewed', 'settled', 'settled_with_absorbed_overage'])
  if (
    statusesRequiringFormula.has(record.status) &&
    record.finalChargeCredits !== record.actualToolCostCredits + record.reeditproServiceFeeCredits
  ) {
    context.addIssue({
      code: 'custom',
      message: 'finalChargeCredits must equal actualToolCostCredits + reeditproServiceFeeCredits.',
      path: ['finalChargeCredits'],
    })
  }
})

export const createCreditRevisionActionSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.nullish(),
  chatSessionId: idSchema.nullish(),
  jobBatchId: idSchema.nullish(),
  jobId: idSchema.nullish(),
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
  previousCreditEstimateId: idSchema.nullish(),
  revisedCreditEstimateId: idSchema.nullish(),
  editComputeLevel: productEditLevelSchema,
  status: creditRevisionActionStatusSchema.default('action_required'),
  pauseReason: creditRevisionPauseReasonSchema,
  approvedMaxCredits: nonNegativeIntegerCreditSchema,
  usedOrCommittedCredits: nonNegativeIntegerCreditSchema,
  additionalLowCredits: nonNegativeIntegerCreditSchema,
  additionalExpectedCredits: nonNegativeIntegerCreditSchema,
  additionalHighCredits: nonNegativeIntegerCreditSchema,
  newMaximumEstimatedCredits: nonNegativeIntegerCreditSchema,
  reasonSummary: z.string().min(1),
  selectedOptionId: z.string().nullish(),
  resolvedByUserId: idSchema.nullish(),
  resolvedAt: z.string().min(1).nullish(),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
  expiresAt: z.string().min(1).nullish(),
})

export const creditRevisionActionRecordSchema = createCreditRevisionActionSchema.extend({
  id: idSchema,
  actionRequiredTitle: z.string().min(1),
  actionRequiredMessage: z.string().min(1),
  userOptions: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    action: z.enum([
      'approve_and_continue',
      'choose_lower_cost_option',
      'cancel_extra_work',
      'add_credits_and_unlock_export',
    ]),
  })).min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
