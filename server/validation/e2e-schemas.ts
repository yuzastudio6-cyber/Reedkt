import { z } from 'zod'
import { idSchema } from './common-schemas'

export const e2eFullEditingFlowRouteSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  projectName: z.string().trim().min(1).max(200).optional(),
  strict: z.boolean().optional(),
  cleanup: z.boolean().optional(),
}).strict()

export type E2EFullEditingFlowRouteBody = z.infer<typeof e2eFullEditingFlowRouteSchema>
