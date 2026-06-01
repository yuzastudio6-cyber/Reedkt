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

export const toolCategorySchema = z.enum([
  'renderer_compositor',
  'maps_geospatial',
  'charts_dataviz',
  'vector_animation',
  'canvas_graphics',
  'three_d_visuals',
  'diagram_layout',
  'svg_rasterization',
  'browser_capture',
  'image_processing',
  'video_processing',
  'audio_processing',
  'qa_analysis',
  'custom',
])

export const toolExecutionModeSchema = z.enum([
  'planning_only',
  'preview_only',
  'future_worker',
  'blocked',
])

export const toolInputTypeSchema = z.enum([
  'approved_snapshot',
  'media_asset',
  'storage_object_record',
  'render_manifest',
  'tool_artifact',
  'metadata_only',
])

export const toolOutputTypeSchema = z.enum([
  'tool_artifact',
  'storage_object_record',
  'qa_report',
  'render_input',
  'metadata_only',
])

const safeMetadataSchema = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  const unsafePaths = collectUnsafeMetadataPaths(value)
  for (const unsafePath of unsafePaths) {
    context.addIssue({
      code: 'custom',
      message: `Tool-call metadata must not include secret-like key: ${unsafePath}`,
      path: unsafePath.split('.').slice(1),
    })
  }
})

const toolFrameContractSchema = z.object({
  aspectRatio: z.string().min(3).max(20).optional(),
  width: z.number().int().positive().max(8192).optional(),
  height: z.number().int().positive().max(8192).optional(),
  fps: z.number().positive().max(240).optional(),
  durationSeconds: z.number().positive().max(24 * 60 * 60).optional(),
}).strict()

const toolArtifactReferenceSchema = z.object({
  artifactId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  mediaAssetId: idSchema.optional(),
  renderId: idSchema.optional(),
  purpose: z.string().min(1).max(120).optional(),
}).strict()

const toolQaRequirementSchema = z.object({
  gate: z.string().min(1).max(120),
  severity: z.enum(['info', 'warning', 'blocking']).default('blocking'),
  requiredBefore: z.enum(['preview', 'export', 'final_delivery']).default('preview'),
  description: z.string().min(1).max(500).optional(),
}).strict()

const toolCallReferenceSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedSnapshotId: idSchema.optional(),
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  toolId: z.string().min(1).max(120).optional(),
  toolChainId: z.string().min(1).max(120).optional(),
  toolCallIntentId: idSchema.optional(),
  jobId: idSchema.optional(),
  mediaAssetId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  renderId: idSchema.optional(),
  requestedBy: idSchema.optional(),
}).strict()

export const toolCallContextEnvelopeSchema = toolCallReferenceSchema.extend({
  approvedSnapshotId: idSchema,
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  toolId: z.string().min(1).max(120),
  toolChainId: z.string().min(1).max(120).optional(),
  category: toolCategorySchema.optional(),
  whySelected: z.string().min(1).max(1200),
  executionMode: toolExecutionModeSchema.default('planning_only'),
  inputTypes: z.array(toolInputTypeSchema).max(20).default(['approved_snapshot']),
  outputTypes: z.array(toolOutputTypeSchema).max(20).default(['tool_artifact']),
  expectedInputs: z.array(toolArtifactReferenceSchema).max(50).default([]),
  expectedOutputs: z.array(toolArtifactReferenceSchema).max(50).default([]),
  frameContract: toolFrameContractSchema.optional(),
  qaRequirements: z.array(toolQaRequirementSchema).max(50).default([]),
  metadata: safeMetadataSchema.optional(),
})

export const toolCatalogReadinessQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
}).strict()

export const toolCatalogListQuerySchema = z.object({
  category: toolCategorySchema.optional(),
  includeBlocked: z.coerce.boolean().default(true),
}).strict()

export const toolCatalogGetQuerySchema = z.object({
  includeBlocked: z.coerce.boolean().default(true),
}).strict()

export const toolChainListQuerySchema = z.object({
  category: toolCategorySchema.optional(),
  includeBlocked: z.coerce.boolean().default(true),
}).strict()

export const toolChainGetQuerySchema = z.object({
  includeBlocked: z.coerce.boolean().default(true),
}).strict()

export const toolDecisionReadinessSchema = toolCallContextEnvelopeSchema
export const toolDecisionPreviewSchema = toolCallContextEnvelopeSchema

export const toolCallIntentReadinessSchema = toolCallContextEnvelopeSchema.extend({
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
})

export const toolCallIntentCreateSchema = toolCallIntentReadinessSchema.extend({
  requestedAction: z.string().min(1).max(1200),
  idempotencyKey: idSchema.optional(),
})

export const toolCallIntentReadQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
}).strict()

export const toolCallIntentProjectListQuerySchema = z.object({
  workspaceId: idSchema,
}).strict()

export const toolCallBlockersSchema = toolCallReferenceSchema.extend({
  approvedSnapshotId: idSchema.optional(),
  toolId: z.string().min(1).max(120).optional(),
})

export const toolCallValidateContextSchema = toolCallContextEnvelopeSchema
export const toolCallQaRequirementsSchema = toolCallContextEnvelopeSchema
export const toolExecutionReadinessSchema = toolCallContextEnvelopeSchema
export const toolExecutionBlockedSchema = toolCallContextEnvelopeSchema
export const toolRuntimeReadinessSchema = toolCallReferenceSchema.extend({
  toolId: z.string().min(1).max(120),
  category: toolCategorySchema.optional(),
})
export const toolLicenseReadinessSchema = toolCallReferenceSchema.extend({
  toolId: z.string().min(1).max(120),
  category: toolCategorySchema.optional(),
})
