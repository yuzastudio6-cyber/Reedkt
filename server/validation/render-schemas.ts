import { z } from 'zod'
import { idSchema } from './common-schemas'

export const createRenderJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedPlanSnapshotId: idSchema,
  creditReservationId: idSchema,
  renderType: z.enum(['preview', 'export']),
  renderQualityLevel: z.string().optional(),
})

export const previewReviewSchema = z.object({
  workspaceId: idSchema,
  reviewStatus: z.enum(['approved', 'rejected', 'changes_requested']),
  notes: z.string().optional(),
})

export const basicRenderSmokeSourceObjectSchema = z.object({
  id: idSchema,
  mediaAssetId: idSchema,
  bucketName: z.string().min(1),
  objectPath: z.string().min(1),
  mimeType: z.string().optional(),
  sizeBytes: z.number().nonnegative().optional(),
  checksumSha256: z.string().optional(),
})

export const basicRenderSmokePreviewSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  sourceStorageObjectId: idSchema,
  sourceStorageObject: basicRenderSmokeSourceObjectSchema.optional(),
  approvedPlanSnapshotId: idSchema,
  creditReservationId: idSchema,
  workerInstanceId: z.string().optional(),
  strict: z.boolean().optional(),
})
