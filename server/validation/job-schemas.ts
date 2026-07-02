import { z } from 'zod'
import { idSchema } from './common-schemas'

export const createJobBatchSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedPlanSnapshotId: idSchema.optional(),
  name: z.string().optional(),
})

export const createJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  jobType: z.string().min(1),
  jobBatchId: idSchema.optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  payloadJson: z.record(z.string(), z.unknown()).optional(),
})
