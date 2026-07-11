import { z } from 'zod'
import { privateUploadMediaSafeIdSchema } from './private-upload-media-authority-schemas'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

const sourceSequenceAuthorityItemSchema = z.object({
  sourceSequenceItemId: privateUploadMediaSafeIdSchema,
  mediaAssetId: privateUploadMediaSafeIdSchema,
  uploadedOrder: z.number().int().positive().max(10_000),
  checksumSha256: sha256Schema,
  required: z.boolean(),
}).strict()

export const buildSourceBindingManifestCandidateSchema = z.object({
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  uploadPurpose: z.enum(['source_media', 'reference_media']).default('source_media'),
  orderedItems: z.array(sourceSequenceAuthorityItemSchema).min(1).max(1_000),
}).strict().superRefine((value, context) => {
  const sequenceIds = new Set<string>()
  const mediaAssetIds = new Set<string>()
  for (const [index, item] of value.orderedItems.entries()) {
    if (item.uploadedOrder !== index + 1) {
      context.addIssue({
        code: 'custom',
        path: ['orderedItems', index, 'uploadedOrder'],
        message: 'Uploaded order must be contiguous, one-based, and match array order.',
      })
    }
    if (sequenceIds.has(item.sourceSequenceItemId)) {
      context.addIssue({
        code: 'custom',
        path: ['orderedItems', index, 'sourceSequenceItemId'],
        message: 'Source-sequence item IDs must be unique.',
      })
    }
    if (mediaAssetIds.has(item.mediaAssetId)) {
      context.addIssue({
        code: 'custom',
        path: ['orderedItems', index, 'mediaAssetId'],
        message: 'Media asset IDs must be unique within one source binding candidate.',
      })
    }
    sequenceIds.add(item.sourceSequenceItemId)
    mediaAssetIds.add(item.mediaAssetId)
  }
})

const sourceBindingCandidateItemSchema = z.object({
  sourceSequenceItemId: privateUploadMediaSafeIdSchema,
  mediaAssetId: privateUploadMediaSafeIdSchema,
  uploadedOrder: z.number().int().positive().max(10_000),
  required: z.boolean(),
  uploadIntentId: privateUploadMediaSafeIdSchema,
  storageObjectRecordId: privateUploadMediaSafeIdSchema,
  storageProvider: z.enum(['local_private', 'google_cloud_storage']),
  mimeType: z.string().min(1).max(160),
  sizeBytes: z.number().int().positive(),
  checksumSha256: sha256Schema,
  generation: z.string().min(1).max(240).optional(),
  etag: z.string().min(1).max(1_024).optional(),
  storageIdentityHash: sha256Schema,
  bindingHash: sha256Schema,
}).strict()

export const sourceBindingManifestCandidateSchema = z.object({
  schemaVersion: z.literal('private-source-binding-manifest-candidate-v1'),
  authorityStatus: z.literal('unapproved_manifest_candidate'),
  executionAuthorized: z.literal(false),
  approvedSnapshotMutated: z.literal(false),
  noRuntimeSideEffects: z.literal(true),
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  uploadPurpose: z.enum(['source_media', 'reference_media']),
  authorityRevision: z.number().int().positive(),
  authorityChecksumSha256: sha256Schema,
  sourceSequenceHash: sha256Schema,
  bindings: z.array(sourceBindingCandidateItemSchema).min(1).max(1_000),
  requiredBindingCount: z.number().int().nonnegative().max(1_000),
  candidateHash: sha256Schema,
}).strict()

export const sourceMediaAuthorityExpectationSchema = z.object({
  authorityRevision: z.number().int().positive(),
  authorityChecksumSha256: sha256Schema,
  sourceSequenceHash: sha256Schema,
  candidateHash: sha256Schema,
}).strict()

export const approvedSourceBindingManifestSchema = z.object({
  schemaVersion: z.literal('private-approved-source-binding-manifest-v1'),
  snapshotId: privateUploadMediaSafeIdSchema,
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  uploadPurpose: z.literal('source_media'),
  authorityRevision: z.number().int().positive(),
  authorityChecksumSha256: sha256Schema,
  sourceSequenceHash: sha256Schema,
  sourceCandidateHash: sha256Schema,
  bindings: z.array(sourceBindingCandidateItemSchema).min(1).max(1_000),
  requiredBindingCount: z.number().int().nonnegative().max(1_000),
  approvedAt: z.string().datetime({ offset: true }),
  manifestHash: sha256Schema,
}).strict()

export type BuildSourceBindingManifestCandidateBody = z.infer<typeof buildSourceBindingManifestCandidateSchema>
export type SourceBindingManifestCandidate = z.infer<typeof sourceBindingManifestCandidateSchema>
export type SourceMediaAuthorityExpectation = z.infer<typeof sourceMediaAuthorityExpectationSchema>
export type ApprovedSourceBindingManifest = z.infer<typeof approvedSourceBindingManifestSchema>
