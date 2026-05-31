import { z } from 'zod'
import { assertAllowedUpload, UPLOAD_PURPOSES } from '../storage/storage-validation'
import type { UploadPurpose } from '../storage/storage-types'

const uuidSchema = z.string().uuid()
const safeMetadataSchema: z.ZodType<Record<string, unknown>> = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  const forbiddenPath = findSignedUrlValuePath(value)
  if (forbiddenPath) {
    context.addIssue({
      code: 'custom',
      message: `metadataJson must not include signed URL values or temporary URL fields (${forbiddenPath}).`,
    })
  }
})

export const createUploadIntentSchema = z.object({
  workspaceId: uuidSchema,
  chatSessionId: uuidSchema.optional(),
  uploadPurpose: z.enum(UPLOAD_PURPOSES).default('source_media'),
  originalFileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  expectedSizeBytes: z.number().int().nonnegative().optional(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
}).superRefine((value, context) => {
  try {
    assertAllowedUpload({
      purpose: value.uploadPurpose as UploadPurpose,
      mimeType: value.mimeType,
      expectedSizeBytes: value.expectedSizeBytes,
    })
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Upload is not allowed.',
      path: ['mimeType'],
    })
  }
}).strict()

export const finalizeUploadIntentSchema = z.object({
  workspaceId: uuidSchema,
  sizeBytes: z.number().int().nonnegative().optional(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
}).strict()

export const signedUrlEventSchema = z.object({
  workspaceId: uuidSchema,
  projectId: uuidSchema.optional(),
  storageObjectRecordId: uuidSchema.optional(),
  urlPurpose: z.string().min(1),
  expiresAt: z.string().min(1),
  metadataJson: safeMetadataSchema.optional(),
}).strict()

export const createDownloadTargetSchema = z.object({
  workspaceId: uuidSchema,
  urlPurpose: z.enum(['download', 'preview_review', 'thumbnail', 'qa_review', 'export_delivery', 'worker_read']).default('download'),
}).strict()

export const routeProjectUploadIntentSchema = createUploadIntentSchema.extend({
  projectId: uuidSchema,
})

export const uploadIntentLookupSchema = z.object({
  uploadIntentId: uuidSchema,
  workspaceId: uuidSchema,
}).strict()

export const uploadIntentParamSchema = z.object({
  uploadIntentId: uuidSchema,
}).strict()

export const storageObjectLookupSchema = z.object({
  storageObjectRecordId: uuidSchema,
  workspaceId: uuidSchema,
}).strict()

export const storageObjectParamSchema = z.object({
  storageObjectRecordId: uuidSchema,
}).strict()

function findSignedUrlValuePath(value: unknown, path: string[] = []): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const result = findSignedUrlValuePath(item, [...path, String(index)])
      if (result) return result
    }
    return undefined
  }

  for (const [key, entry] of Object.entries(value)) {
    const lowerKey = key.toLowerCase()
    if (
      lowerKey === 'signedurl'
      || lowerKey === 'signed_url'
      || lowerKey === 'uploadurl'
      || lowerKey === 'downloadurl'
      || lowerKey === 'temporaryurl'
      || lowerKey === 'urlvalue'
      || lowerKey.endsWith('_url')
    ) {
      return [...path, key].join('.')
    }

    const result = findSignedUrlValuePath(entry, [...path, key])
    if (result) return result
  }

  return undefined
}
