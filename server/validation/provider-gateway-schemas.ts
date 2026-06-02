import { z } from 'zod'
import { idSchema } from './common-schemas'

const unsafeKeyPattern = /secret|token|api.?key|provider.?key|service.?role|signed.?url|stripe|password|credential|private.?key|raw.?webhook|raw.?payload|env/i

const metadataValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(metadataValueSchema),
    z.record(z.string(), metadataValueSchema),
  ]),
)

export const safeMetadataSchema = z.record(z.string(), metadataValueSchema).superRefine((value, context) => {
  inspectSafeKeys(value, context)
})

const providerTypeSchema = z.enum(['image', 'video', 'audio', 'music', 'sfx', 'text', 'multimodal', 'unknown'])
const requestTypeSchema = z.enum(['planning', 'image_asset', 'video_asset', 'music_asset', 'sfx_asset', 'prompt_preview', 'webhook', 'checkback', 'unknown'])
const routePurposeSchema = z.enum(['readiness', 'catalog', 'model_policy', 'request_preview', 'attempt_boundary', 'webhook_boundary', 'output_readiness', 'blocked'])
const qualityLevelSchema = z.enum(['basic', 'pro', 'premium', 'draft', 'final', 'unknown'])
const expectedOutputTypeSchema = z.enum(['image', 'video', 'audio', 'music', 'sfx', 'text', 'metadata', 'none', 'unknown'])
const failureCategorySchema = z.enum(['provider_disabled', 'secret_unavailable', 'transport_unavailable', 'policy_blocked', 'credit_blocked', 'snapshot_blocked', 'worker_blocked', 'webhook_unverified', 'unknown'])

const providerScopeSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
})

export const providerReadinessSchema = providerScopeSchema.extend({
  providerKey: z.string().min(1).optional(),
  providerModelKey: z.string().min(1).optional(),
  requestType: requestTypeSchema.optional(),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const providerCatalogListQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  providerType: providerTypeSchema.optional(),
}).strict()

export const providerCatalogGetQuerySchema = z.object({
  workspaceId: idSchema.optional(),
}).strict()

export const providerModelsListQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  providerKey: z.string().min(1).optional(),
  providerType: providerTypeSchema.optional(),
}).strict()

export const providerModelGetQuerySchema = z.object({
  workspaceId: idSchema.optional(),
}).strict()

export const providerSecretReferenceSchema = providerScopeSchema.extend({
  providerKey: z.string().min(1),
  providerModelKey: z.string().min(1).optional(),
  secretReferenceLabel: z.string().min(1).optional(),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const providerRoutePreviewSchema = providerScopeSchema.extend({
  approvedSnapshotId: idSchema.optional(),
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  jobId: idSchema.optional(),
  toolCallIntentId: idSchema.optional(),
  providerKey: z.string().min(1),
  providerModelKey: z.string().min(1).optional(),
  providerType: providerTypeSchema.default('unknown'),
  requestType: requestTypeSchema,
  routePurpose: routePurposeSchema.default('request_preview'),
  qualityLevel: qualityLevelSchema.default('unknown'),
  expectedOutputType: expectedOutputTypeSchema.default('unknown'),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const providerRequestEnvelopeSchema = providerRoutePreviewSchema.extend({
  safePromptText: z.string().max(8000).optional(),
  promptReferenceId: idSchema.optional(),
  negativePrompt: z.string().max(2000).optional(),
  styleConstraints: safeMetadataSchema.optional(),
  timingConstraints: safeMetadataSchema.optional(),
  outputRequirements: safeMetadataSchema.optional(),
  sourceMediaIds: z.array(idSchema).default([]),
  storageObjectRecordIds: z.array(idSchema).default([]),
  approvedAssetIds: z.array(idSchema).default([]),
  previewOnly: z.boolean().default(true),
  finalExportEligible: z.boolean().default(false),
  qaRequired: z.boolean().default(true),
  provenanceRequired: z.boolean().default(true),
}).strict()

export const providerRequestAttemptReadinessSchema = providerRequestEnvelopeSchema

export const providerRequestAttemptCreateBoundarySchema = providerRequestEnvelopeSchema.extend({
  retryReason: z.string().max(500).optional(),
}).strict()

export const providerAttemptGetQuerySchema = providerScopeSchema.extend({
  providerAttemptId: idSchema,
}).strict()

export const providerAttemptListQuerySchema = z.object({
  workspaceId: idSchema,
  providerKey: z.string().min(1).optional(),
}).strict()

export const providerWebhookReadinessSchema = providerScopeSchema.extend({
  providerKey: z.string().min(1),
  providerWebhookEventId: idSchema.optional(),
  sanitizedProviderEventId: z.string().min(1).optional(),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const providerWebhookReceiveBoundarySchema = providerWebhookReadinessSchema.extend({
  providerEventId: z.string().min(1),
  generationRequestId: idSchema.optional(),
  jobId: idSchema.optional(),
  eventPayloadSummaryJson: safeMetadataSchema.optional(),
}).strict()

export const providerWebhookSummaryQuerySchema = providerScopeSchema.extend({
  providerWebhookEventId: idSchema,
}).strict()

export const providerOutputReadinessSchema = providerScopeSchema.extend({
  providerAttemptId: idSchema.optional(),
  generationRequestId: idSchema.optional(),
  generatedAssetId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  expectedOutputType: expectedOutputTypeSchema.default('unknown'),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const providerExecutionBlockedSchema = providerScopeSchema.extend({
  providerKey: z.string().min(1).optional(),
  providerModelKey: z.string().min(1).optional(),
  requestType: requestTypeSchema.optional(),
  failureCategory: failureCategorySchema.default('provider_disabled'),
  safeFailureMessage: z.string().max(500).optional(),
  retryable: z.boolean().default(false),
  metadata: safeMetadataSchema.optional(),
}).strict()

export const providerBlockersSchema = providerScopeSchema.extend({
  providerKey: z.string().min(1).optional(),
  requestType: requestTypeSchema.optional(),
  metadata: safeMetadataSchema.optional(),
}).strict()

export type ProviderReadinessInput = z.infer<typeof providerReadinessSchema>
export type ProviderRoutePreviewInput = z.infer<typeof providerRoutePreviewSchema>
export type ProviderRequestEnvelopeInput = z.infer<typeof providerRequestEnvelopeSchema>
export type ProviderRequestAttemptCreateBoundaryInput = z.infer<typeof providerRequestAttemptCreateBoundarySchema>
export type ProviderAttemptGetInput = z.infer<typeof providerAttemptGetQuerySchema>
export type ProviderAttemptListInput = z.infer<typeof providerAttemptListQuerySchema>
export type ProviderWebhookReadinessInput = z.infer<typeof providerWebhookReadinessSchema>
export type ProviderWebhookReceiveBoundaryInput = z.infer<typeof providerWebhookReceiveBoundarySchema>
export type ProviderWebhookSummaryInput = z.infer<typeof providerWebhookSummaryQuerySchema>
export type ProviderOutputReadinessInput = z.infer<typeof providerOutputReadinessSchema>
export type ProviderExecutionBlockedInput = z.infer<typeof providerExecutionBlockedSchema>
export type ProviderBlockersInput = z.infer<typeof providerBlockersSchema>

function inspectSafeKeys(value: unknown, context: z.RefinementCtx, path: string[] = []): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectSafeKeys(item, context, [...path, String(index)]))
    return
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (unsafeKeyPattern.test(key)) {
      context.addIssue({
        code: 'custom',
        path: [...path, key],
        message: 'Provider gateway metadata cannot include secrets, tokens, keys, signed URLs, credentials, private env values, or raw webhook payloads.',
      })
    }
    inspectSafeKeys(nestedValue, context, [...path, key])
  }
}
