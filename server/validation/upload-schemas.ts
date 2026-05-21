import { z } from 'zod'
import { assertAllowedUpload, UPLOAD_PURPOSES } from '../storage/storage-validation'
import type { UploadPurpose } from '../storage/storage-types'
import { idSchema } from './common-schemas'

export const createUploadIntentSchema = z.object({
  workspaceId: idSchema,
  chatSessionId: idSchema.optional(),
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
  workspaceId: idSchema,
  sizeBytes: z.number().int().nonnegative().optional(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
}).strict()

export const signedUrlEventSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  urlPurpose: z.string().min(1),
  expiresAt: z.string().min(1),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
}).strict()

export const createDownloadTargetSchema = z.object({
  workspaceId: idSchema,
  urlPurpose: z.enum(['download', 'preview_review', 'thumbnail', 'qa_review', 'export_delivery', 'worker_read']).default('download'),
}).strict()
