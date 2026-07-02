import { z } from 'zod'
import { idSchema } from './common-schemas'

export const createApprovedSnapshotSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  chatSessionId: idSchema.optional(),
  creditEstimateId: idSchema,
  creditApprovalId: idSchema,
  creditReservationId: idSchema,
  approvedByUserId: idSchema.optional(),
  snapshotVersion: z.number().int().positive().default(1),
  snapshotJson: z.record(z.string(), z.unknown()),
  planHash: z.string().min(1),
  creditHash: z.string().min(1),
  sourceSequenceHash: z.string().min(1),
  timingHash: z.string().min(1),
})
