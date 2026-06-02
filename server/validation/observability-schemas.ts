import { z } from 'zod'
import { idSchema } from './common-schemas'

const unsafeKeyPattern = /secret|token|api.?key|provider.?key|service.?role|signed.?url|upload.?url|download.?url|private.?key|password|credential|stripe|env|raw.?payload|webhook.?payload|authorization|cookie|session/i

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
      message: `Observability metadata must not include secret-like key: ${unsafePath}`,
    })
  }
})

const optionalScopeSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
}).strict()

const scopedBodySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
}).strict()

export const actorTypeSchema = z.enum(['user', 'backend', 'worker', 'provider_gateway', 'admin', 'system'])
export const auditEventCategorySchema = z.enum([
  'auth',
  'workspace',
  'project',
  'upload',
  'snapshot',
  'credit',
  'job',
  'worker',
  'media',
  'render',
  'qa',
  'tool',
  'provider',
  'compliance',
  'security',
  'rate_limit',
  'abuse_prevention',
  'cost_control',
  'admin',
  'custom',
])
export const severitySchema = z.enum(['info', 'warning', 'error', 'critical'])
export const visibilitySchema = z.enum(['internal', 'user_summary', 'admin_only'])
export const retentionClassSchema = z.enum(['short_lived', 'standard', 'security', 'billing', 'legal_hold', 'custom'])
export const operationTypeSchema = z.enum([
  'read',
  'write_boundary',
  'preview',
  'execution_request',
  'provider_request',
  'worker_request',
  'render_request',
  'storage_request',
  'billing_request',
  'admin_request',
  'custom',
])

const requestContextSchema = scopedBodySchema.extend({
  routeId: z.string().min(1).max(180).optional(),
  routeGroup: z.string().min(1).max(120).optional(),
  userId: idSchema.optional(),
  requestId: z.string().min(1).max(180).optional(),
  idempotencyKey: z.string().min(1).max(220).optional(),
  operationType: operationTypeSchema.optional(),
  metadata: safeMetadataSchema.optional(),
}).strict()

const auditEventDraftSchema = requestContextSchema.extend({
  actorType: actorTypeSchema.default('user'),
  eventType: z.string().min(1).max(180),
  eventCategory: auditEventCategorySchema,
  sourceRouteId: z.string().min(1).max(180).optional(),
  sourceRecordType: z.string().min(1).max(120).optional(),
  sourceRecordId: idSchema.optional(),
  targetRecordType: z.string().min(1).max(120).optional(),
  targetRecordId: idSchema.optional(),
  severity: severitySchema.default('info'),
  visibility: visibilitySchema.default('internal'),
  sanitizedMetadata: safeMetadataSchema.default({}),
  retentionClass: retentionClassSchema.default('standard'),
}).strict()

const riskContextSchema = requestContextSchema.extend({
  actorType: actorTypeSchema.default('user'),
  requestCountWindow: z.coerce.number().int().nonnegative().max(100000).default(0),
  mutationCountWindow: z.coerce.number().int().nonnegative().max(100000).default(0),
  expensiveOperationCountWindow: z.coerce.number().int().nonnegative().max(100000).default(0),
  estimatedCredits: z.coerce.number().nonnegative().max(100000000).default(0),
  estimatedStorageBytes: z.coerce.number().nonnegative().max(10_000_000_000_000).default(0),
  estimatedProviderCost: z.coerce.number().nonnegative().max(1000000).default(0),
  estimatedRenderCost: z.coerce.number().nonnegative().max(1000000).default(0),
  abuseRiskSignals: z.array(z.string().min(1).max(160)).max(50).default([]),
  manualReviewRequired: z.coerce.boolean().default(false),
}).strict()

export const observabilityReadinessSchema = requestContextSchema.extend({
  readinessContext: z.enum(['runtime', 'audit', 'rate_limit', 'abuse_prevention', 'cost_control', 'alerting', 'incident']).default('runtime'),
})

export const observabilityRuntimeStatusQuerySchema = optionalScopeSchema

export const observabilityRequestTraceQuerySchema = optionalScopeSchema.extend({
  requestId: z.string().min(1).max(180),
})

export const observabilityRouteRiskSummaryQuerySchema = optionalScopeSchema.extend({
  routeGroup: z.string().min(1).max(120).optional(),
  includeBlocked: z.coerce.boolean().default(true),
})

export const auditEventPreviewSchema = auditEventDraftSchema
export const auditEventCreateBoundarySchema = auditEventDraftSchema.extend({
  idempotencyKey: z.string().min(1).max(220).optional(),
})

export const auditEventListForProjectQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  eventCategory: auditEventCategorySchema.optional(),
  severity: severitySchema.optional(),
  visibility: visibilitySchema.optional(),
}).strict()

export const auditEventListForWorkspaceQuerySchema = z.object({
  workspaceId: idSchema,
  eventCategory: auditEventCategorySchema.optional(),
  severity: severitySchema.optional(),
  visibility: visibilitySchema.optional(),
}).strict()

export const auditSummaryQuerySchema = optionalScopeSchema.extend({
  eventCategory: auditEventCategorySchema.optional(),
  severity: severitySchema.optional(),
})

export const rateLimitReadinessSchema = riskContextSchema
export const rateLimitPolicyPreviewSchema = riskContextSchema.extend({
  requestCountLimit: z.coerce.number().int().positive().max(100000).default(1000),
  mutationCountLimit: z.coerce.number().int().positive().max(100000).default(100),
  retryAfterSeconds: z.coerce.number().int().nonnegative().max(86400).default(0),
})
export const rateLimitCheckBoundarySchema = rateLimitPolicyPreviewSchema

export const abuseReadinessSchema = riskContextSchema
export const abusePolicyPreviewSchema = riskContextSchema.extend({
  riskLevel: z.enum(['low', 'medium', 'high', 'critical', 'unknown']).default('unknown'),
  escalationPolicy: z.string().min(1).max(300).optional(),
})
export const abuseCheckBoundarySchema = abusePolicyPreviewSchema

export const costControlReadinessSchema = riskContextSchema
export const costControlPolicyPreviewSchema = riskContextSchema.extend({
  creditCeiling: z.coerce.number().nonnegative().max(100000000).optional(),
  storageCeilingBytes: z.coerce.number().nonnegative().max(10_000_000_000_000).optional(),
  providerCostCeiling: z.coerce.number().nonnegative().max(1000000).optional(),
  renderCostCeiling: z.coerce.number().nonnegative().max(1000000).optional(),
})
export const costControlUsageSummaryPreviewSchema = costControlPolicyPreviewSchema
export const costControlExecutionBlockedSchema = costControlPolicyPreviewSchema.extend({
  blockReason: z.string().min(1).max(500).default('Cost-control persistence and production execution remain unavailable.'),
})

export const operationalAlertReadinessSchema = requestContextSchema.extend({
  alertType: z.enum(['runtime', 'audit', 'rate_limit', 'abuse', 'cost', 'security', 'incident', 'custom']).default('runtime'),
  severity: severitySchema.default('warning'),
})
export const operationalAlertPreviewSchema = operationalAlertReadinessSchema.extend({
  userMessage: z.string().max(500).optional(),
  escalationPolicy: z.string().max(500).optional(),
})

export type ObservabilityReadinessInput = z.infer<typeof observabilityReadinessSchema>
export type ObservabilityRuntimeStatusInput = z.infer<typeof observabilityRuntimeStatusQuerySchema>
export type ObservabilityRequestTraceInput = z.infer<typeof observabilityRequestTraceQuerySchema>
export type ObservabilityRouteRiskSummaryInput = z.infer<typeof observabilityRouteRiskSummaryQuerySchema>
export type AuditEventPreviewInput = z.infer<typeof auditEventPreviewSchema>
export type AuditEventCreateBoundaryInput = z.infer<typeof auditEventCreateBoundarySchema>
export type AuditEventListForProjectInput = z.infer<typeof auditEventListForProjectQuerySchema>
export type AuditEventListForWorkspaceInput = z.infer<typeof auditEventListForWorkspaceQuerySchema>
export type AuditSummaryInput = z.infer<typeof auditSummaryQuerySchema>
export type RateLimitReadinessInput = z.infer<typeof rateLimitReadinessSchema>
export type RateLimitPolicyPreviewInput = z.infer<typeof rateLimitPolicyPreviewSchema>
export type RateLimitCheckBoundaryInput = z.infer<typeof rateLimitCheckBoundarySchema>
export type AbuseReadinessInput = z.infer<typeof abuseReadinessSchema>
export type AbusePolicyPreviewInput = z.infer<typeof abusePolicyPreviewSchema>
export type AbuseCheckBoundaryInput = z.infer<typeof abuseCheckBoundarySchema>
export type CostControlReadinessInput = z.infer<typeof costControlReadinessSchema>
export type CostControlPolicyPreviewInput = z.infer<typeof costControlPolicyPreviewSchema>
export type CostControlUsageSummaryPreviewInput = z.infer<typeof costControlUsageSummaryPreviewSchema>
export type CostControlExecutionBlockedInput = z.infer<typeof costControlExecutionBlockedSchema>
export type OperationalAlertReadinessInput = z.infer<typeof operationalAlertReadinessSchema>
export type OperationalAlertPreviewInput = z.infer<typeof operationalAlertPreviewSchema>
