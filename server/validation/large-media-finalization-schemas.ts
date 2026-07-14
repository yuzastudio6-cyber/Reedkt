import { z } from 'zod'

import {
  privateSourceMediaMetadataSchema,
  privateUploadMediaSafeIdSchema,
} from './private-upload-media-authority-schemas'

export const LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION =
  'private-large-media-finalization-job-v1' as const

const timestampSchema = z.string().datetime({ offset: true })
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const enqueueLargeMediaFinalizationJobSchema = z.object({
  workspaceId: privateUploadMediaSafeIdSchema,
  sizeBytes: z.number().int().positive(),
}).strict()

export const runLargeMediaFinalizationJobSchema = z.object({
  workspaceId: privateUploadMediaSafeIdSchema,
  purpose: z.literal('run_private_large_media_finalization_job'),
}).strict()

export const largeMediaFinalizationJobStatusSchema = z.enum([
  'queued',
  'running',
  'completed',
  'failed_retryable',
  'failed_terminal',
])

const leaseSchema = z.object({
  leaseId: privateUploadMediaSafeIdSchema,
  workerInstanceId: privateUploadMediaSafeIdSchema,
  credentialSha256: sha256Schema,
  claimedAt: timestampSchema,
  heartbeatAt: timestampSchema,
  expiresAt: timestampSchema,
  attemptDeadlineAt: timestampSchema,
}).strict().superRefine((lease, context) => {
  const claimedAt = Date.parse(lease.claimedAt)
  const heartbeatAt = Date.parse(lease.heartbeatAt)
  const expiresAt = Date.parse(lease.expiresAt)
  const attemptDeadlineAt = Date.parse(lease.attemptDeadlineAt)
  if (
    heartbeatAt < claimedAt || expiresAt <= heartbeatAt ||
    expiresAt > attemptDeadlineAt || attemptDeadlineAt <= claimedAt
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Large-media finalization lease timestamps are inconsistent.',
    })
  }
})

const resultSchema = z.object({
  uploadIntentId: privateUploadMediaSafeIdSchema,
  mediaAssetId: privateUploadMediaSafeIdSchema,
  storageObjectRecordId: privateUploadMediaSafeIdSchema,
  sizeBytes: z.number().int().positive(),
  checksumSha256: sha256Schema,
  sourceMetadata: privateSourceMediaMetadataSchema.optional(),
}).strict()

const failureSchema = z.object({
  code: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(240),
  retryable: z.boolean(),
  failedAt: timestampSchema,
}).strict()

export const largeMediaFinalizationJobRecordSchema = z.object({
  schemaVersion: z.literal(LARGE_MEDIA_FINALIZATION_JOB_SCHEMA_VERSION),
  jobId: privateUploadMediaSafeIdSchema,
  ownerUserId: privateUploadMediaSafeIdSchema,
  workspaceId: privateUploadMediaSafeIdSchema,
  projectId: privateUploadMediaSafeIdSchema,
  uploadIntentId: privateUploadMediaSafeIdSchema,
  uploadPurpose: z.enum(['source_media', 'reference_media']),
  expectedSizeBytes: z.number().int().positive(),
  storageMode: z.literal('gcs'),
  processingPolicyId: z.literal('restart_safe_hash_probe_finalize_v1'),
  status: largeMediaFinalizationJobStatusSchema,
  attemptCount: z.number().int().nonnegative().max(5),
  maximumAttempts: z.number().int().min(1).max(5),
  idempotencyKeyHash: sha256Schema,
  requestHash: sha256Schema,
  lease: leaseSchema.optional(),
  result: resultSchema.optional(),
  failure: failureSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  completedAt: timestampSchema.optional(),
  privateInternalOnly: z.literal(true),
  productReady: z.literal(false),
  externalBetaReady: z.literal(false),
  productionReady: z.literal(false),
}).strict().superRefine((job, context) => {
  const running = job.status === 'running'
  const completed = job.status === 'completed'
  const failed = job.status === 'failed_retryable' || job.status === 'failed_terminal'
  if (running !== Boolean(job.lease)) {
    context.addIssue({ code: 'custom', message: 'Only a running finalization job may own a lease.' })
  }
  if (completed !== Boolean(job.result) || completed !== Boolean(job.completedAt)) {
    context.addIssue({ code: 'custom', message: 'Completed finalization authority is incomplete.' })
  }
  if (failed !== Boolean(job.failure)) {
    context.addIssue({ code: 'custom', message: 'Finalization failure authority is incomplete.' })
  }
  if (!failed && job.failure) {
    context.addIssue({ code: 'custom', message: 'A nonfailed finalization job cannot retain failure state.' })
  }
  if (!completed && (job.result || job.completedAt)) {
    context.addIssue({ code: 'custom', message: 'A noncompleted finalization job cannot retain result state.' })
  }
  if (job.status === 'failed_retryable' && job.attemptCount >= job.maximumAttempts) {
    context.addIssue({ code: 'custom', message: 'Retryable finalization exhausted its approved attempts.' })
  }
  if ((job.status === 'queued') !== (job.attemptCount === 0)) {
    context.addIssue({ code: 'custom', message: 'Queued finalization attempt state is inconsistent.' })
  }
  if (
    completed && job.result &&
    (job.result.uploadIntentId !== job.uploadIntentId || job.result.sizeBytes !== job.expectedSizeBytes)
  ) {
    context.addIssue({ code: 'custom', message: 'Completed finalization result does not match its source authority.' })
  }
  if (job.status === 'failed_retryable' && job.failure?.retryable !== true) {
    context.addIssue({ code: 'custom', message: 'Retryable finalization failure must remain retryable.' })
  }
  if (job.status === 'failed_terminal' && job.failure?.retryable !== false) {
    context.addIssue({ code: 'custom', message: 'Terminal finalization failure cannot remain retryable.' })
  }
  if (Date.parse(job.updatedAt) < Date.parse(job.createdAt)) {
    context.addIssue({ code: 'custom', message: 'Finalization update cannot predate creation.' })
  }
  if (job.completedAt && Date.parse(job.completedAt) < Date.parse(job.createdAt)) {
    context.addIssue({ code: 'custom', message: 'Finalization completion cannot predate creation.' })
  }
})

export type LargeMediaFinalizationJobRecord = z.infer<typeof largeMediaFinalizationJobRecordSchema>
export type LargeMediaFinalizationJobResult = z.infer<typeof resultSchema>
