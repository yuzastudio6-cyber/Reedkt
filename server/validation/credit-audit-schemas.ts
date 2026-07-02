import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'
import { idSchema } from './common-schemas'

const booleanQuerySchema = z.union([z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => value === undefined ? undefined : value === 'true')

export const creditAuditTimelineQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  includeStripeTrace: booleanQuerySchema,
  includeToolEvents: booleanQuerySchema,
}).strict().superRefine(rejectSecretLikeQuery)

export const creditAuditReceiptQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  includeToolEvents: booleanQuerySchema,
}).strict().superRefine(rejectSecretLikeQuery)

export const creditAuditStripeTraceQuerySchema = z.object({
  workspaceId: idSchema.optional(),
}).strict().superRefine(rejectSecretLikeQuery)

export const creditAuditBetaReadinessQuerySchema = z.object({}).strict().superRefine(rejectSecretLikeQuery)

export function validateCreditAuditQuery<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(normalizeQuery(value))
  if (!result.success) {
    throw new ApiError('VALIDATION_FAILED', 'Credit audit query validation failed.', 400, result.error.flatten())
  }
  return result.data
}

function normalizeQuery(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => [
    key,
    Array.isArray(rawValue) ? rawValue[0] : rawValue,
  ]))
}

function rejectSecretLikeQuery(value: unknown, context: z.RefinementCtx): void {
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(value)
  if (secretLikePaths.length > 0) {
    context.addIssue({
      code: 'custom',
      message: `Credit audit query contains secret-like fields: ${secretLikePaths.join(', ')}`,
      path: ['secretLikePaths'],
    })
  }
}
