import { z } from 'zod'
import { idSchema } from './common-schemas'

export const createRenderJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedPlanSnapshotId: idSchema,
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
  renderType: z.enum(['preview', 'export']),
  renderQualityLevel: z.string().optional(),
  approvedReservationRemainingCredits: z.number().int().nonnegative().optional(),
  renderUsage: z.object({
    requestCount: z.number().int().positive().optional(),
    renderDurationSeconds: z.number().nonnegative().finite().optional(),
    outputSeconds: z.number().nonnegative().finite().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    fps: z.number().positive().finite().optional(),
  }).optional(),
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

const basicRenderSmokeBriefLineageSchema = z.object({
  briefId: idSchema,
  revisionNumber: z.number().int().positive(),
  briefFingerprint: z.string().min(1).max(120),
})

const basicRenderSmokeOutputFrameSchema = z.object({
  aspectRatio: z.string().min(1).max(32),
  platformTarget: z.string().min(1).max(80),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
  confirmed: z.literal(true),
  source: z.string().min(1).max(80),
})

export const basicRenderSmokeEditAssemblyPlanSchema = z.object({
  planId: idSchema,
  briefLineage: basicRenderSmokeBriefLineageSchema,
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(2000),
  steps: z.array(basicRenderSmokeEditAssemblyStepSchema).min(1).max(12),
  sourceDurationSeconds: z.number().positive().max(24 * 60 * 60).optional(),
  sourceAspectRatio: z.string().min(1).max(32).optional(),
  outputFrame: basicRenderSmokeOutputFrameSchema.optional(),
  mode: z.enum(['clean_internal_preview', 'private_final_export']).optional(),
  professionalOperationCount: z.number().int().nonnegative().optional(),
  professionalOperationLabels: z.array(z.string().min(1).max(160)).max(24).optional(),
  requiredQaChecks: z.array(z.string().min(1).max(100)).max(40).optional(),
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

export const smartCutPreviewSmokeSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  sourceStorageObjectId: idSchema,
  sourceStorageObject: basicRenderSmokeSourceObjectSchema,
  approvedPlanSnapshotId: idSchema,
  creditReservationId: idSchema,
  toolExecutionPlanId: idSchema.optional(),
  workerInstanceId: z.string().optional(),
  sourceVideoDurationSeconds: z.number().positive().optional(),
  sourceVideoWidth: z.number().positive().optional(),
  sourceVideoHeight: z.number().positive().optional(),
  strict: z.boolean().optional(),
})
