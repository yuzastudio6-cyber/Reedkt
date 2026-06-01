import { z } from 'zod'
import { idSchema } from './common-schemas'

const sha256HashSchema = z.string().regex(/^[a-f0-9]{64}$/i, 'Expected a 64-character SHA-256 hash.').optional()

export const approvedSnapshotReadinessSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  chatSessionId: idSchema.optional(),
  editSessionId: idSchema,
  editPlanVersionId: idSchema,
  approvalRecordId: idSchema,
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
  approvedByUserId: idSchema.optional(),
  snapshotVersion: z.number().int().positive().default(1).optional(),
  snapshotJson: z.record(z.string(), z.unknown()),
  planHash: z.string().min(1),
  creditHash: z.string().min(1),
  sourceSequenceHash: z.string().min(1),
  timingHash: z.string().min(1),
  expectedSnapshotHash: sha256HashSchema,
})

export const createApprovedSnapshotSchema = approvedSnapshotReadinessSchema.extend({
  snapshotVersion: z.number().int().positive().default(1),
})

export const getApprovedSnapshotQuerySchema = z.object({
  workspaceId: idSchema.optional(),
})

export const listApprovedSnapshotsQuerySchema = z.object({
  workspaceId: idSchema,
})

export const verifyApprovedSnapshotIntegritySchema = z.object({
  workspaceId: idSchema.optional(),
  expectedSnapshotHash: sha256HashSchema,
})

export type ApprovedSnapshotReadinessBody = z.infer<typeof approvedSnapshotReadinessSchema>
export type CreateApprovedSnapshotBody = z.infer<typeof createApprovedSnapshotSchema>
