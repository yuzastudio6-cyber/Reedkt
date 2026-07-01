import { z } from 'zod'
import {
  CREDIT_SETTLEMENT_MODES,
  CREDIT_REVISION_ACTION_STATUSES,
  CREDIT_REVISION_PAUSE_REASONS,
  CREDIT_EXPORT_LOCK_REASONS,
  CREDIT_EXPORT_LOCK_STATUSES,
  EXPORT_CREDIT_GATE_REQUIRED_ACTIONS,
  EXPORT_CREDIT_GATE_STATUSES,
  CREDIT_SETTLEMENT_REASONS,
  CREDIT_SETTLEMENT_STATUSES,
  SETTLE_CREDIT_RESERVATION_STATUSES,
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
export const creditSettlementModeSchema = z.enum(CREDIT_SETTLEMENT_MODES)
export const settleCreditReservationStatusSchema = z.enum(SETTLE_CREDIT_RESERVATION_STATUSES)
export const creditRevisionActionStatusSchema = z.enum(CREDIT_REVISION_ACTION_STATUSES)
export const creditRevisionPauseReasonSchema = z.enum(CREDIT_REVISION_PAUSE_REASONS)
export const exportCreditGateStatusSchema = z.enum(EXPORT_CREDIT_GATE_STATUSES)
export const exportCreditGateRequiredActionSchema = z.enum(EXPORT_CREDIT_GATE_REQUIRED_ACTIONS)
export const creditExportLockStatusSchema = z.enum(CREDIT_EXPORT_LOCK_STATUSES)
export const creditExportLockReasonSchema = z.enum(CREDIT_EXPORT_LOCK_REASONS)

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

export const settleCreditReservationSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.nullish(),
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
  settledByUserId: idSchema.nullish(),
  settledByAgent: z.string().min(1).max(120).nullish(),
  productEditLevel: productEditLevelSchema,
  finalVideoDurationSeconds: positiveDurationSecondsSchema,
  settlementMode: creditSettlementModeSchema,
  toolCostEventIds: z.array(idSchema).optional(),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
})

export const evaluateExportCreditGateSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.nullish(),
  renderId: idSchema.nullish(),
  exportId: idSchema.nullish(),
  creditReservationId: idSchema,
  creditSettlementId: idSchema.nullish(),
  requestedByUserId: idSchema.nullish(),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
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
  const computedFinalChargeCredits = record.actualToolCostCredits + record.reeditproServiceFeeCredits
  const statusesRequiringFormula = new Set(['previewed', 'settled', 'requires_top_up_before_export'])
  if (
    statusesRequiringFormula.has(record.status) &&
    record.finalChargeCredits !== computedFinalChargeCredits
  ) {
    context.addIssue({
      code: 'custom',
      message: 'finalChargeCredits must equal actualToolCostCredits + reeditproServiceFeeCredits.',
      path: ['finalChargeCredits'],
    })
  }
  if (
    record.status === 'settled_with_absorbed_overage' &&
    record.finalChargeCredits + record.absorbedOverageCredits !== computedFinalChargeCredits
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Absorbed-overage settlements must satisfy finalChargeCredits + absorbedOverageCredits = actualToolCostCredits + reeditproServiceFeeCredits.',
      path: ['absorbedOverageCredits'],
    })
  }
  if (record.releasedCredits + record.finalChargeCredits > record.reservedCredits && record.status !== 'requires_top_up_before_export') {
    context.addIssue({
      code: 'custom',
      message: 'Settled records cannot spend and release more than reserved credits.',
      path: ['releasedCredits'],
    })
  }
})

export const creditExportLockRecordSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.nullish(),
  renderId: idSchema.nullish(),
  exportId: idSchema.nullish(),
  creditReservationId: idSchema,
  creditSettlementId: idSchema,
  status: creditExportLockStatusSchema,
  lockReason: creditExportLockReasonSchema,
  outstandingCredits: nonNegativeIntegerCreditSchema,
  finalChargeCredits: nonNegativeIntegerCreditSchema,
  reservedCredits: nonNegativeIntegerCreditSchema,
  actionRequiredTitle: z.string().min(1),
  actionRequiredMessage: z.string().min(1),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  resolvedAt: z.string().min(1).nullish(),
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

export const approveCreditRevisionActionSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditRevisionActionId: idSchema,
  creditReservationId: idSchema,
  approvedByUserId: idSchema,
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
})

export const chooseLowerCostCreditRevisionOptionSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditRevisionActionId: idSchema,
  selectedOptionId: z.string().min(1),
  selectedByUserId: idSchema,
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
})

export const cancelCreditRevisionActionSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditRevisionActionId: idSchema,
  cancelledByUserId: idSchema,
  cancellationReason: z.string().min(1).max(500).optional(),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
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
