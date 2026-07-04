import { z } from 'zod'
import { idSchema } from './common-schemas'

export const approveCreditEstimateSchema = z.object({
  workspaceId: idSchema,
})

export const reserveCreditsSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  editPlanId: idSchema.optional(),
  creditWalletId: idSchema.optional(),
  creditApprovalId: idSchema.optional(),
  reservedCredits: z.number().int().nonnegative().optional(),
  expiresAt: z.string().datetime().optional(),
})
