import { z } from 'zod'
import { idSchema } from './common-schemas'

const unsafeKeyPattern = /secret|token|api.?key|provider.?key|service.?role|signed.?url|upload.?url|download.?url|private.?key|password|credential|stripe|env|raw.?payload|webhook.?payload/i

function collectUnsafePaths(value: unknown, path = 'metadata', unsafePaths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafePaths(item, `${path}[${index}]`, unsafePaths))
    return unsafePaths
  }

  if (!value || typeof value !== 'object') return unsafePaths

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (unsafeKeyPattern.test(key)) unsafePaths.push(`${path}.${key}`)
    collectUnsafePaths(child, `${path}.${key}`, unsafePaths)
  }

  return unsafePaths
}

const safeMetadataSchema = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  for (const unsafePath of collectUnsafePaths(value)) {
    context.addIssue({
      code: 'custom',
      message: `Compliance metadata must not include secret-like key: ${unsafePath}`,
    })
  }
})

const evidenceRefSchema = z.object({
  refType: z.enum(['doc', 'policy', 'package', 'lockfile', 'audit', 'human_review', 'ticket', 'url', 'other']),
  refKey: z.string().min(1).max(220),
  note: z.string().max(1000).optional(),
}).strict().superRefine((value, context) => {
  if (unsafeKeyPattern.test(value.refKey) || unsafeKeyPattern.test(value.note ?? '')) {
    context.addIssue({
      code: 'custom',
      message: 'Evidence references must not include secrets, signed URLs, provider keys, raw payloads, or credentials.',
    })
  }
})

export const reviewSubjectTypeSchema = z.enum([
  'tool',
  'provider',
  'dependency',
  'package',
  'model',
  'codec',
  'build_config',
  'runtime',
  'worker_image',
  'route_group',
  'custom',
])

export const reviewCategorySchema = z.enum([
  'license',
  'security',
  'dependency',
  'privacy',
  'provenance',
  'runtime_isolation',
  'commercial_use',
  'codec_patent',
  'build_flags',
  'provider_terms',
  'data_retention',
  'abuse_prevention',
])

export const reviewStatusSchema = z.enum([
  'not_reviewed',
  'blocked',
  'needs_review',
  'approved_candidate',
  'approved_for_dev',
  'approved_for_staging',
  'production_ready',
  'rejected',
  'deprecated',
])

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical', 'unknown'])

export const reviewModeSchema = z.enum(['readiness', 'preview', 'boundary_create', 'audit_summary'])

const complianceScopeSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
}).strict()

const reviewSubjectSchema = z.object({
  reviewSubjectType: reviewSubjectTypeSchema,
  reviewSubjectKey: z.string().min(1).max(160),
}).strict()

const reviewDraftSchema = complianceScopeSchema.merge(reviewSubjectSchema).extend({
  reviewCategory: reviewCategorySchema,
  reviewStatus: reviewStatusSchema.default('needs_review'),
  riskLevel: riskLevelSchema.default('unknown'),
  reviewMode: reviewModeSchema.default('preview'),
  requiredEvidence: z.array(z.string().min(1).max(220)).max(40).default([]),
  evidenceRefs: z.array(evidenceRefSchema).max(40).default([]),
  reviewerRole: z.string().min(1).max(120).optional(),
  requestedBy: idSchema.optional(),
  restrictions: z.array(z.string().min(1).max(300)).max(40).default([]),
  forbiddenOperations: z.array(z.string().min(1).max(300)).max(40).default([]),
  allowedRuntimeScopes: z.array(z.string().min(1).max(120)).max(30).default([]),
  notes: z.string().max(2000).optional(),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const complianceReadinessSchema = complianceScopeSchema.extend({
  reviewSubjectType: reviewSubjectTypeSchema.optional(),
  reviewSubjectKey: z.string().min(1).max(160).optional(),
  reviewCategory: reviewCategorySchema.optional(),
  reviewMode: reviewModeSchema.default('readiness'),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const complianceSubjectsListQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  reviewSubjectType: reviewSubjectTypeSchema.optional(),
  includeBlocked: z.coerce.boolean().default(true),
}).strict()

export const complianceSubjectGetQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
}).strict()

export const complianceReviewPreviewSchema = reviewDraftSchema.extend({
  reviewMode: z.literal('preview').default('preview'),
})

export const complianceReviewCreateBoundarySchema = reviewDraftSchema.extend({
  reviewMode: z.literal('boundary_create').default('boundary_create'),
})

export const complianceReviewGetQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  complianceReviewId: idSchema,
}).strict()

export const complianceReviewListForSubjectQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  reviewCategory: reviewCategorySchema.optional(),
}).strict()

export const complianceBlockersSchema = complianceReadinessSchema
export const complianceLicenseReadinessSchema = complianceReadinessSchema.extend({ reviewCategory: z.literal('license').default('license') })
export const complianceSecurityReadinessSchema = complianceReadinessSchema.extend({ reviewCategory: z.literal('security').default('security') })
export const complianceDependencyReadinessSchema = complianceReadinessSchema.extend({ reviewCategory: z.literal('dependency').default('dependency') })
export const complianceRuntimeApprovalReadinessSchema = complianceReadinessSchema.extend({ reviewCategory: z.literal('runtime_isolation').default('runtime_isolation') })
export const complianceProductionUnlockBlockedSchema = complianceScopeSchema.extend({
  requestedUnlockScope: z.enum(['dev', 'staging', 'production', 'beta', 'broad_media']).default('production'),
  reviewSubjectType: reviewSubjectTypeSchema.optional(),
  reviewSubjectKey: z.string().min(1).max(160).optional(),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const complianceAuditSummaryQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  reviewSubjectType: reviewSubjectTypeSchema.optional(),
  reviewSubjectKey: z.string().min(1).max(160).optional(),
}).strict()

export type ComplianceReadinessInput = z.infer<typeof complianceReadinessSchema>
export type ComplianceSubjectsListInput = z.infer<typeof complianceSubjectsListQuerySchema>
export type ComplianceSubjectGetQuery = z.infer<typeof complianceSubjectGetQuerySchema> & z.infer<typeof reviewSubjectSchema>
export type ComplianceReviewPreviewInput = z.infer<typeof complianceReviewPreviewSchema>
export type ComplianceReviewCreateBoundaryInput = z.infer<typeof complianceReviewCreateBoundarySchema>
export type ComplianceReviewGetInput = z.infer<typeof complianceReviewGetQuerySchema>
export type ComplianceReviewListForSubjectInput = z.infer<typeof complianceReviewListForSubjectQuerySchema> & z.infer<typeof reviewSubjectSchema>
export type ComplianceBlockersInput = z.infer<typeof complianceBlockersSchema>
export type ComplianceProductionUnlockBlockedInput = z.infer<typeof complianceProductionUnlockBlockedSchema>
export type ComplianceAuditSummaryInput = z.infer<typeof complianceAuditSummaryQuerySchema>
export type ReviewSubjectType = z.infer<typeof reviewSubjectTypeSchema>
export type ReviewCategory = z.infer<typeof reviewCategorySchema>
