import { z } from 'zod'

import { RESERVE_MAX_ESTIMATE_CREDIT_STATUSES } from '../../src/types/credits'
import { idSchema } from './common-schemas'
import { nonNegativeIntegerCreditSchema, secretSafeJsonObjectSchema } from './credit-data-schemas'

export const reserveMaxEstimateCreditStatusSchema = z.enum(RESERVE_MAX_ESTIMATE_CREDIT_STATUSES)

export const reserveMaxEstimateCreditsSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.optional(),
  chatSessionId: idSchema.optional(),
  creditWalletId: idSchema.optional(),
  creditEstimateId: idSchema,
  creditApprovalId: idSchema.optional(),
  approvedByUserId: idSchema,
  idempotencyKey: idSchema,
  expiresAt: z.string().min(1).optional(),
  metadata: secretSafeJsonObjectSchema.default({}),
})

export const creditReservationWalletBalanceSchema = z.object({
  creditWalletId: idSchema,
  workspaceId: idSchema,
  userId: idSchema.optional(),
  walletType: z.enum(['personal', 'workspace', 'business', 'enterprise']),
  availableCredits: nonNegativeIntegerCreditSchema,
  reservedCredits: nonNegativeIntegerCreditSchema,
  spentCredits: nonNegativeIntegerCreditSchema,
  refundedCredits: nonNegativeIntegerCreditSchema,
})
