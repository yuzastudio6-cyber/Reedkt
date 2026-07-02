import { z } from 'zod'
import { idSchema } from './common-schemas'

export const approveCreditEstimateSchema = z.object({
  workspaceId: idSchema,
})

export const reserveCreditsSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  editPlanId: idSchema.optional(),
})
