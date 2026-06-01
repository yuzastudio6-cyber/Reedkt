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
      message: `Render metadata must not include secret-like key: ${unsafePath}`,
      path: unsafePath.split('.').slice(1),
    })
  }
})

export const renderTypeSchema = z.enum(['preview', 'final', 'thumbnail', 'proxy'])
export const outputFormatSchema = z.enum(['mp4', 'mov', 'webm', 'png', 'wav'])
export const renderReadinessContextSchema = z.enum(['readiness', 'manifest', 'preview', 'export', 'status', 'blockers'])

const dimensionsSchema = z.object({
  aspectRatio: z.string().min(3).max(24).optional(),
  width: z.number().int().positive().max(16384).optional(),
  height: z.number().int().positive().max(16384).optional(),
  fps: z.number().finite().positive().max(240).optional(),
  durationSeconds: z.number().finite().nonnegative().max(86400).optional(),
})

const renderReferenceSchema = dimensionsSchema.extend({
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
  timingManifestId: idSchema.optional(),
  manifestSchemaVersion: z.string().min(1).max(80).default('render_manifest_v1'),
  renderType: renderTypeSchema.default('preview'),
  outputFormat: outputFormatSchema.default('mp4'),
  requestedBy: idSchema.optional(),
  readinessContext: renderReadinessContextSchema.default('readiness'),
  metadata: safeMetadataSchema.optional(),
})

export const renderReadinessSchema = renderReferenceSchema.extend({
  readinessContext: renderReadinessContextSchema.default('readiness'),
})

export const renderManifestReadinessSchema = renderReferenceSchema.extend({
  readinessContext: renderReadinessContextSchema.default('manifest'),
})

export const renderManifestBuildSchema = renderReferenceSchema.extend({
  approvedSnapshotId: idSchema,
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  readinessContext: renderReadinessContextSchema.default('manifest'),
})

export const previewReadinessSchema = renderReferenceSchema.extend({
  renderType: z.literal('preview').default('preview'),
  readinessContext: renderReadinessContextSchema.default('preview'),
})

export const previewRequestSchema = renderReferenceSchema.extend({
  approvedSnapshotId: idSchema,
  creditReservationId: idSchema,
  renderType: z.literal('preview').default('preview'),
  readinessContext: renderReadinessContextSchema.default('preview'),
})

export const renderBlockersSchema = renderReferenceSchema.extend({
  readinessContext: renderReadinessContextSchema.default('blockers'),
})

export const exportReadinessSchema = renderReferenceSchema.extend({
  approvedSnapshotId: idSchema.optional(),
  renderId: idSchema.optional(),
  exportId: idSchema.optional(),
  renderType: z.literal('final').default('final'),
  readinessContext: renderReadinessContextSchema.default('export'),
})

export const exportRequestSchema = renderReferenceSchema.extend({
  approvedSnapshotId: idSchema,
  creditReservationId: idSchema,
  renderId: idSchema.optional(),
  outputFormat: z.enum(['mp4', 'mov', 'webm']).default('mp4'),
  renderType: z.literal('final').default('final'),
  readinessContext: renderReadinessContextSchema.default('export'),
})

export const renderProjectQuerySchema = z.object({
  workspaceId: idSchema,
})

export const renderRecordQuerySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
})
