import { z } from 'zod'

export const PRIVATE_UPLOAD_MEDIA_AUTHORITY_SCHEMA_VERSION =
  'private-upload-media-authority-v1' as const

export const privateUploadMediaSafeIdSchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identifier sequence.')

const isoTimestampSchema = z.string().datetime({ offset: true })
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const uploadPurposeSchema = z.enum(['source_media', 'reference_media'])
const storageProviderSchema = z.enum(['local_private', 'google_cloud_storage'])
const storageBucketSchema = z.string()
  .trim()
  .min(1)
  .max(222)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe storage bucket sequence.')
const storagePathSchema = z.string()
  .trim()
  .min(1)
  .max(2_048)
  .refine((value) => !value.includes('\\') && !value.includes('\0'), 'Unsafe storage path characters.')
  .refine((value) => !value.startsWith('/') && !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value), 'Absolute paths and URLs are forbidden.')
  .refine((value) => value.split('/').every((segment) => Boolean(segment) && segment !== '.' && segment !== '..'), 'Unsafe storage path segment.')
const mimeTypeSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/)
const fileNameSchema = z.string()
  .trim()
  .min(1)
  .max(255)
  .refine(
    (value) => [...value].every((character) => {
      const code = character.charCodeAt(0)
      return code > 31 && code !== 127
    }),
    'Control characters are forbidden in file names.',
  )

export const privateUploadIntentAuthorityRecordSchema = z.object({
  id: privateUploadMediaSafeIdSchema,
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  editReferenceId: privateUploadMediaSafeIdSchema.optional(),
  chatSessionId: privateUploadMediaSafeIdSchema.optional(),
  requestedByUserId: privateUploadMediaSafeIdSchema,
  uploadPurpose: uploadPurposeSchema,
  targetBucket: storageBucketSchema,
  targetPath: storagePathSchema,
  originalFileName: fileNameSchema,
  mimeType: mimeTypeSchema,
  expectedSizeBytes: z.number().int().nonnegative().optional(),
  checksumSha256: sha256Schema.optional(),
  status: z.enum(['signed', 'uploaded', 'failed', 'finalized']),
  expiresAt: isoTimestampSchema,
  finalizedAt: isoTimestampSchema.optional(),
  mediaAssetId: privateUploadMediaSafeIdSchema.optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  mockOnly: z.literal(true),
}).strict()

export const privateSourceMediaMetadataSchema = z.object({
  probeStatus: z.enum(['probed', 'unavailable']),
  source: z.enum(['local_ffprobe', 'gcs_ffprobe']),
  durationSeconds: z.number().nonnegative().finite().optional(),
  width: z.number().int().positive().max(32_768).optional(),
  height: z.number().int().positive().max(32_768).optional(),
  frameRateNumerator: z.number().int().positive().max(1_000_000_000).optional(),
  frameRateDenominator: z.number().int().positive().max(1_000_000_000).optional(),
  videoCodec: z.string().trim().min(1).max(120).optional(),
  audioCodec: z.string().trim().min(1).max(120).optional(),
  audioSampleRateHertz: z.number().int().positive().max(384_000).optional(),
  audioChannelCount: z.number().int().positive().max(8).optional(),
  pixelFormat: z.string().trim().min(1).max(120).optional(),
  colorSpace: z.string().trim().min(1).max(120).optional(),
  colorTransfer: z.string().trim().min(1).max(120).optional(),
  colorPrimaries: z.string().trim().min(1).max(120).optional(),
  colorRange: z.string().trim().min(1).max(120).optional(),
  bitsPerRawSample: z.number().int().nonnegative().max(64).optional(),
  formatName: z.string().trim().min(1).max(240).optional(),
  streamCount: z.number().int().nonnegative().max(10_000).optional(),
  hasVideo: z.boolean(),
  hasAudio: z.boolean(),
  unavailableReason: z.string().trim().min(1).max(240).optional(),
}).strict().superRefine((metadata, context) => {
  const hasNumerator = metadata.frameRateNumerator !== undefined
  const hasDenominator = metadata.frameRateDenominator !== undefined
  if (hasNumerator !== hasDenominator) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['frameRateNumerator'],
      message: 'Source frame rate requires an exact numerator and denominator.',
    })
  }
  if (
    hasNumerator &&
    (metadata.probeStatus !== 'probed' || metadata.hasVideo !== true)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['frameRateNumerator'],
      message: 'Source frame rate is valid only for a successfully probed video stream.',
    })
  }
})

export const privateMediaAssetAuthorityRecordSchema = z.object({
  id: privateUploadMediaSafeIdSchema,
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  editReferenceId: privateUploadMediaSafeIdSchema.optional(),
  uploadIntentId: privateUploadMediaSafeIdSchema,
  storageObjectRecordId: privateUploadMediaSafeIdSchema,
  uploadPurpose: uploadPurposeSchema,
  assetType: privateUploadMediaSafeIdSchema,
  fileName: fileNameSchema,
  mimeType: mimeTypeSchema,
  storageProvider: storageProviderSchema,
  storageBucket: storageBucketSchema,
  storagePath: storagePathSchema,
  sizeBytes: z.number().int().positive(),
  checksumSha256: sha256Schema,
  storageGeneration: z.string().trim().min(1).max(240).optional(),
  storageEtag: z.string().trim().min(1).max(1_024).optional(),
  storageMetageneration: z.string().trim().min(1).max(240).optional(),
  integrityVerified: z.literal(true),
  checksumSource: z.literal('server_computed_bytes'),
  sourceMetadata: privateSourceMediaMetadataSchema.optional(),
  status: z.literal('uploaded'),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  mockOnly: z.literal(true),
}).strict()

export const privateStorageObjectAuthorityRecordSchema = z.object({
  id: privateUploadMediaSafeIdSchema,
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  editReferenceId: privateUploadMediaSafeIdSchema.optional(),
  mediaAssetId: privateUploadMediaSafeIdSchema,
  uploadIntentId: privateUploadMediaSafeIdSchema,
  uploadPurpose: uploadPurposeSchema,
  storageProvider: storageProviderSchema,
  bucketName: storageBucketSchema,
  objectPath: storagePathSchema,
  objectPurpose: uploadPurposeSchema,
  mimeType: mimeTypeSchema,
  sizeBytes: z.number().int().positive(),
  checksumSha256: sha256Schema,
  generation: z.string().trim().min(1).max(240).optional(),
  etag: z.string().trim().min(1).max(1_024).optional(),
  metageneration: z.string().trim().min(1).max(240).optional(),
  integrityVerified: z.literal(true),
  checksumSource: z.literal('server_computed_bytes'),
  region: z.string().trim().min(1).max(160).optional(),
  status: z.literal('ready'),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  mockOnly: z.literal(true),
}).strict()

const authorityAuditEventSchema = z.object({
  id: privateUploadMediaSafeIdSchema,
  eventType: z.enum([
    'upload_intent_created',
    'upload_intent_uploaded',
    'upload_intent_failed',
    'upload_finalized',
  ]),
  actorUserId: privateUploadMediaSafeIdSchema,
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  editReferenceId: privateUploadMediaSafeIdSchema.optional(),
  uploadIntentId: privateUploadMediaSafeIdSchema,
  mediaAssetId: privateUploadMediaSafeIdSchema.optional(),
  storageObjectRecordId: privateUploadMediaSafeIdSchema.optional(),
  recordRevision: z.number().int().positive(),
  createdAt: isoTimestampSchema,
}).strict()

const authorityIdempotencyRecordSchema = z.object({
  operation: z.enum([
    'create_upload_intent',
    'mark_upload_intent_uploaded',
    'mark_upload_intent_failed',
    'finalize_upload_intent',
  ]),
  idempotencyKey: z.string().trim().min(1).max(240),
  requestHash: sha256Schema,
  responseIds: z.array(privateUploadMediaSafeIdSchema).min(1).max(4),
  committedRevision: z.number().int().positive(),
  completedAt: isoTimestampSchema,
}).strict()

const boundedExactIndexSchema = z.record(privateUploadMediaSafeIdSchema, privateUploadMediaSafeIdSchema)
  .refine((value) => Object.keys(value).length <= 10_000, 'Private upload authority index is too large.')

export const privateUploadMediaAuthorityAggregateSchema = z.object({
  schemaVersion: z.literal(PRIVATE_UPLOAD_MEDIA_AUTHORITY_SCHEMA_VERSION),
  ownerUserId: privateUploadMediaSafeIdSchema,
  workspaceId: privateUploadMediaSafeIdSchema,
  revision: z.number().int().nonnegative(),
  uploadIntents: z.array(privateUploadIntentAuthorityRecordSchema).max(10_000),
  mediaAssets: z.array(privateMediaAssetAuthorityRecordSchema).max(10_000),
  storageObjects: z.array(privateStorageObjectAuthorityRecordSchema).max(10_000),
  mediaAssetIdByUploadIntentId: boundedExactIndexSchema,
  storageObjectIdByUploadIntentId: boundedExactIndexSchema,
  storageObjectIdByMediaAssetId: boundedExactIndexSchema,
  idempotencyRecords: z.array(authorityIdempotencyRecordSchema).max(50_000),
  auditEvents: z.array(authorityAuditEventSchema).max(50_000),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  privateInternalOnly: z.literal(true),
}).strict()

export type PrivateUploadIntentAuthorityRecord = z.infer<typeof privateUploadIntentAuthorityRecordSchema>
export type PrivateMediaAssetAuthorityRecord = z.infer<typeof privateMediaAssetAuthorityRecordSchema>
export type PrivateStorageObjectAuthorityRecord = z.infer<typeof privateStorageObjectAuthorityRecordSchema>
export type PrivateUploadMediaAuthorityAggregate = z.infer<typeof privateUploadMediaAuthorityAggregateSchema>
