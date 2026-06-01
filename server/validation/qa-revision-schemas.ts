import { z } from 'zod'
import { idSchema } from './common-schemas'

const unsafeMetadataTerms = [
  'secret',
  'token',
  'apikey',
  'providerkey',
  'servicerole',
  'signedurl',
  'uploadurl',
  'downloadurl',
  'temporaryurl',
  'privatekey',
  'password',
  'credential',
  'stripe',
  'env',
]

function normalizeKey(key: string): string {
  return key.replace(/[-_\s.]/g, '').toLowerCase()
}

function collectUnsafeMetadataPaths(value: unknown, path = 'metadata', paths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeMetadataPaths(item, `${path}[${index}]`, paths))
    return paths
  }

  if (!value || typeof value !== 'object') return paths

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalized = normalizeKey(key)
    if (unsafeMetadataTerms.some((term) => normalized.includes(term))) {
      paths.push(`${path}.${key}`)
    }
    collectUnsafeMetadataPaths(child, `${path}.${key}`, paths)
  }

  return paths
}

const safeMetadataSchema = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  const unsafePaths = collectUnsafeMetadataPaths(value)
  for (const unsafePath of unsafePaths) {
    context.addIssue({
      code: 'custom',
      message: `QA/revision metadata must not include secret-like key: ${unsafePath}`,
      path: unsafePath.split('.').slice(1),
    })
  }
})

export const qaRevisionSeveritySchema = z.enum(['info', 'warning', 'blocking', 'critical'])
export const qaBlockerStatusSchema = z.enum(['open', 'acknowledged', 'resolved_boundary', 'blocked'])
export const fallbackDecisionTypeSchema = z.enum([
  'retry_same_path',
  'use_approved_fallback',
  'request_user_review',
  'require_new_approval',
  'block_export',
])
export const repairPlanTypeSchema = z.enum([
  'qa_recheck',
  'caption_adjustment',
  'safe_zone_adjustment',
  'asset_replacement',
  'timing_repair',
  'requires_future_worker',
])

const qaRevisionReferenceSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedSnapshotId: idSchema.optional(),
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  mediaAssetId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  renderJobId: idSchema.optional(),
  renderId: idSchema.optional(),
  exportId: idSchema.optional(),
  qaReportId: idSchema.optional(),
  qaIssueId: idSchema.optional(),
  qaReportItemId: idSchema.optional(),
  previewReviewId: idSchema.optional(),
  reviewCommentId: idSchema.optional(),
  revisionRequestId: idSchema.optional(),
  fallbackDecisionId: idSchema.optional(),
  affectedSegmentIds: z.array(idSchema).max(200).optional(),
  affectedAssetIds: z.array(idSchema).max(200).optional(),
  affectedRenderIds: z.array(idSchema).max(50).optional(),
  requestedChange: z.string().min(1).max(2000).optional(),
  severity: qaRevisionSeveritySchema.default('warning'),
  blockerStatus: qaBlockerStatusSchema.default('open'),
  requiresNewGeneration: z.boolean().default(false),
  requiresNewRender: z.boolean().default(false),
  requiresCreditEstimate: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  fallbackDecisionType: fallbackDecisionTypeSchema.optional(),
  repairPlanType: repairPlanTypeSchema.optional(),
  requestedBy: idSchema.optional(),
  metadata: safeMetadataSchema.optional(),
})

export const qaReadinessSchema = qaRevisionReferenceSchema
export const qaReportCreateSchema = qaRevisionReferenceSchema.extend({
  approvedSnapshotId: idSchema,
  renderId: idSchema.optional(),
  renderJobId: idSchema.optional(),
})
export const qaReportReadQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})
export const qaProjectListQuerySchema = z.object({
  workspaceId: idSchema,
})
export const qaBlockersSchema = qaRevisionReferenceSchema
export const qaBlockerResolveSchema = qaRevisionReferenceSchema.extend({
  qaReportId: idSchema,
  qaIssueId: idSchema.optional(),
  qaReportItemId: idSchema.optional(),
  blockerStatus: z.literal('resolved_boundary').default('resolved_boundary'),
})
export const previewReviewCreateSchema = qaRevisionReferenceSchema.extend({
  renderId: idSchema,
  requestedChange: z.string().min(1).max(2000).optional(),
})
export const previewReviewReadQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})
export const previewReviewListQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})
export const reviewCommentCreateSchema = qaRevisionReferenceSchema.extend({
  previewReviewId: idSchema,
  requestedChange: z.string().min(1).max(2000),
})
export const reviewCommentListQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})
export const revisionRequestCreateSchema = qaRevisionReferenceSchema.extend({
  requestedChange: z.string().min(1).max(2000),
})
export const revisionRequestReadQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})
export const revisionProjectListQuerySchema = z.object({
  workspaceId: idSchema,
})
export const revisionEstimateReadinessSchema = qaRevisionReferenceSchema.extend({
  revisionRequestId: idSchema.optional(),
  requiresCreditEstimate: z.boolean().default(true),
})
export const revisionApprovalRequiredSchema = qaRevisionReferenceSchema.extend({
  revisionRequestId: idSchema.optional(),
  requiresApproval: z.boolean().default(true),
})
export const fallbackReadinessSchema = qaRevisionReferenceSchema
export const fallbackDecisionPlanSchema = qaRevisionReferenceSchema.extend({
  fallbackDecisionType: fallbackDecisionTypeSchema,
})
export const fallbackDecisionReadQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})
export const repairPlanReadinessSchema = qaRevisionReferenceSchema.extend({
  repairPlanType: repairPlanTypeSchema.default('requires_future_worker'),
})
export const exportBlockersSchema = qaRevisionReferenceSchema.extend({
  exportId: idSchema.optional(),
  renderId: idSchema.optional(),
})
