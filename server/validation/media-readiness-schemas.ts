import { z } from 'zod'
import { idSchema } from './common-schemas'

const metadataSchema = z.record(z.string(), z.unknown()).optional()
const mediaMetadataSchema = z.object({
  contentType: z.string().min(1).max(160).optional(),
  durationSeconds: z.number().finite().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  frameRate: z.number().finite().positive().optional(),
  audioStreamRequired: z.boolean().optional(),
  transcriptRequired: z.boolean().optional(),
  timingRequired: z.boolean().optional(),
  metadata: metadataSchema,
})

export const readinessContextSchema = z.enum(['planning', 'render', 'transcript', 'timing', 'worker', 'preview'])

export const mediaReadinessSchema = mediaMetadataSchema.extend({
  workspaceId: idSchema,
  projectId: idSchema,
  mediaAssetId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  uploadedClipId: idSchema.optional(),
  sourceSequenceItemId: idSchema.optional(),
  sourceOrder: z.number().int().nonnegative().optional(),
  readinessContext: readinessContextSchema.default('planning'),
  localFixtureId: z.string().min(1).max(120).optional(),
})

export const mediaSourceQuerySchema = z.object({
  workspaceId: idSchema,
})

export const mediaSourceReadQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})

export const sourceSequenceReadinessSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editSessionId: idSchema.optional(),
  sourceSequenceItemId: idSchema.optional(),
  uploadedClipId: idSchema.optional(),
  sourceOrder: z.number().int().nonnegative().optional(),
  metadata: metadataSchema,
})

export const mediaProbeReadinessSchema = mediaReadinessSchema.extend({
  probeTool: z.enum(['ffprobe', 'future_worker']).default('ffprobe'),
})

export const mediaProbeRequestSchema = mediaProbeReadinessSchema.extend({
  requestReason: z.string().min(1).max(600).optional(),
})

export const mediaProbeResultQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  storageObjectRecordId: idSchema.optional(),
})

export const transcriptReadinessSchema = mediaReadinessSchema.extend({
  transcriptRequired: z.boolean().default(true),
  languageHint: z.string().min(2).max(24).optional(),
})

export const observationReadinessSchema = mediaReadinessSchema.extend({
  observationPurpose: z.string().min(1).max(120).optional(),
})

export const timingSeedReadinessSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  mediaAssetId: idSchema.optional(),
  sourceSequenceItemId: idSchema.optional(),
  durationSeconds: z.number().finite().nonnegative().optional(),
  frameRate: z.number().finite().positive().optional(),
  transcriptRequired: z.boolean().optional(),
  timingRequired: z.boolean().default(true),
  readinessContext: readinessContextSchema.default('timing'),
  metadata: metadataSchema,
})

export const timingSeedPlaceholderQuerySchema = z.object({
  workspaceId: idSchema,
})

export const timingValidationReadinessSchema = timingSeedReadinessSchema.extend({
  masterTimingMapId: idSchema.optional(),
  validationPurpose: z.enum(['approval', 'preview', 'render', 'worker']).default('approval'),
})
