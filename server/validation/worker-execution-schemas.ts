import { z } from 'zod'
import { idSchema } from './common-schemas'

const unsafeKeyPattern = /secret|token|api.?key|provider.?key|service.?role|signed.?url|upload.?url|download.?url|stripe|password|credential|private.?key/i

const workerTypeSchema = z.enum([
  'media_probe_worker',
  'transcript_alignment_worker',
  'visual_observation_worker',
  'audio_observation_worker',
  'remotion_render_worker',
  'ffmpeg_postprocess_worker',
  'image_asset_worker',
  'browser_capture_worker',
  'map_render_worker',
  'chart_render_worker',
  'tool_execution_worker',
  'provider_asset_worker',
  'sfx_worker',
  'music_worker',
  'qa_worker',
  'export_worker',
  'custom_worker',
])

const executionModeSchema = z.enum(['readiness', 'preflight', 'mock_only', 'future_worker', 'blocked']).default('blocked')
const jobTypeSchema = z.string().min(1).max(160)
const safeTextSchema = z.string().min(1).max(1000)

function collectUnsafePaths(value: unknown, path = 'payload', paths: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafePaths(item, `${path}[${index}]`, paths))
    return paths
  }

  if (!value || typeof value !== 'object') return paths

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (unsafeKeyPattern.test(key)) paths.push(`${path}.${key}`)
    collectUnsafePaths(child, `${path}.${key}`, paths)
  }

  return paths
}

const safeMetadataSchema = z.record(z.string(), z.unknown()).optional().superRefine((value, context) => {
  const unsafePaths = collectUnsafePaths(value)
  if (unsafePaths.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Unsafe worker execution metadata keys are not allowed: ${unsafePaths.join(', ')}`,
    })
  }
})

const idArraySchema = z.array(idSchema).max(50).default([])
const toolIdArraySchema = z.array(z.string().min(1).max(120)).max(50).default([])

export const workerExecutionEnvelopeSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  jobId: idSchema.optional(),
  jobBatchId: idSchema.optional(),
  approvedSnapshotId: idSchema.optional(),
  workerType: workerTypeSchema.default('custom_worker'),
  jobType: jobTypeSchema.default('custom_worker_boundary'),
  executionMode: executionModeSchema,
  requestedBy: idSchema.optional(),
  workerClaimId: idSchema.optional(),
  workerLeaseId: idSchema.optional(),
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  mediaAssetIds: idArraySchema,
  storageObjectRecordIds: idArraySchema,
  sourceRecordIds: idArraySchema,
  qaReportId: idSchema.optional(),
  renderJobId: idSchema.optional(),
  renderId: idSchema.optional(),
  finalExportId: idSchema.optional(),
  toolCallIntentIds: idArraySchema,
  runtimeToolIds: toolIdArraySchema,
  requiredToolIds: toolIdArraySchema,
  blockedToolIds: toolIdArraySchema,
  attemptNumber: z.number().int().positive().max(100).default(1),
  maxAttempts: z.number().int().positive().max(100).default(1),
  retryBudget: z.number().int().min(0).max(100).default(0),
  leaseExpiresAt: z.string().min(1).max(120).optional(),
  heartbeatDueAt: z.string().min(1).max(120).optional(),
  allowedOperation: z.string().min(1).max(160).default('worker_contract_preflight'),
  completionStatus: z.enum(['not_started', 'completed', 'failed', 'cancelled', 'blocked']).default('blocked'),
  completionSummary: safeTextSchema.optional(),
  failureCategory: z.enum(['none', 'gate_failed', 'runtime_unavailable', 'cancelled', 'validation_failed', 'unknown']).default('none'),
  safeFailureMessage: safeTextSchema.optional(),
  retryable: z.boolean().default(false),
  cancelReason: safeTextSchema.optional(),
  failReason: safeTextSchema.optional(),
  metadata: safeMetadataSchema,
}).strict()

export const workerExecutionEnvelopeReadinessSchema = workerExecutionEnvelopeSchema

export const workerClaimPreflightSchema = workerExecutionEnvelopeSchema.extend({
  workerClaimId: idSchema.optional(),
  workerLeaseId: idSchema.optional(),
})

export const workerExecutionBlockedSchema = workerExecutionEnvelopeSchema.extend({
  blockedReason: safeTextSchema.default('Worker execution remains disabled until a future runtime activation milestone.'),
})

export const workerRuntimeCapabilitiesQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  workerType: workerTypeSchema.optional(),
}).strict()

export const workerRuntimeToolRequirementsSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  workerType: workerTypeSchema.default('custom_worker'),
  requiredToolIds: toolIdArraySchema,
  runtimeToolIds: toolIdArraySchema,
  metadata: safeMetadataSchema,
}).strict()

export const workerCancelBoundarySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  jobId: idSchema.optional(),
  workerClaimId: idSchema.optional(),
  workerLeaseId: idSchema.optional(),
  cancelReason: safeTextSchema,
  metadata: safeMetadataSchema,
}).strict()

export const workerStaleRecoveryPreviewSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  jobId: idSchema.optional(),
  workerType: workerTypeSchema.optional(),
  maxStaleAgeSeconds: z.number().int().positive().max(86400).optional(),
  metadata: safeMetadataSchema,
}).strict()

export type WorkerExecutionEnvelopeInput = z.infer<typeof workerExecutionEnvelopeSchema>
export type WorkerRuntimeCapabilitiesQuery = z.infer<typeof workerRuntimeCapabilitiesQuerySchema>
export type WorkerRuntimeToolRequirementsInput = z.infer<typeof workerRuntimeToolRequirementsSchema>
export type WorkerCancelBoundaryInput = z.infer<typeof workerCancelBoundarySchema>
export type WorkerStaleRecoveryPreviewInput = z.infer<typeof workerStaleRecoveryPreviewSchema>
