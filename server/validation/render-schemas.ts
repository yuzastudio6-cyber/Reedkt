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

const basicRenderSmokeEditAssemblyStepSchema = z.object({
  label: z.string().min(1).max(120),
  summary: z.string().min(1).max(600),
})

export const basicRenderSmokeEditAssemblyPlanSchema = z.object({
  planId: idSchema,
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(2000),
  steps: z.array(basicRenderSmokeEditAssemblyStepSchema).min(1).max(12),
  sourceDurationSeconds: z.number().positive().max(24 * 60 * 60).optional(),
  sourceAspectRatio: z.string().min(1).max(32).optional(),
  mode: z.enum(['clean_internal_preview', 'private_final_export']).optional(),
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
  editAssemblyPlan: basicRenderSmokeEditAssemblyPlanSchema.optional(),
})

export const basicRenderSmokeFinalExportSchema = basicRenderSmokePreviewSchema.extend({
  previewReviewId: idSchema,
  previewReviewStatus: z.literal('approved'),
})
