import { z } from 'zod'
import { idSchema } from './common-schemas'

const metadataSchema = z.record(z.string(), z.unknown()).optional()
const safePayloadSchema = z.record(z.string(), z.unknown()).optional()
const workerTypeSchema = z.string().min(1).max(120)
const workerInstanceSchema = z.string().min(1).max(160)
const tokenSchema = z.string().min(1).max(500)
const reasonSchema = z.string().min(1).max(800)

export const claimWorkerReadinessSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  workerType: workerTypeSchema,
  workerInstanceId: workerInstanceSchema.optional(),
  attemptNumber: z.number().int().positive().optional(),
  maxAttempts: z.number().int().positive().max(20).optional(),
  metadata: metadataSchema,
})

export const claimWorkerJobSchema = claimWorkerReadinessSchema.extend({
  workerInstanceId: workerInstanceSchema,
  leaseExpiresAt: z.string().min(1).max(120).optional(),
})

export const workerClaimQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  jobId: idSchema.optional(),
})

export const workerHeartbeatSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  jobId: idSchema.optional(),
  workerClaimId: idSchema.optional(),
  leaseId: idSchema.optional(),
  heartbeatToken: tokenSchema.optional(),
  claimToken: tokenSchema.optional(),
  metadata: metadataSchema,
})

export const workerLeaseMutationSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  jobId: idSchema.optional(),
  workerClaimId: idSchema.optional(),
  leaseId: idSchema.optional(),
  claimToken: tokenSchema.optional(),
  heartbeatToken: tokenSchema.optional(),
  reason: reasonSchema.optional(),
  metadata: metadataSchema,
})

export const workerCompleteSchema = workerLeaseMutationSchema.extend({
  completionSummary: reasonSchema,
  outputJson: safePayloadSchema,
})

export const workerFailSchema = workerLeaseMutationSchema.extend({
  failReason: reasonSchema,
  errorJson: safePayloadSchema,
})

export const recoverStaleWorkerSchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
  jobId: idSchema.optional(),
  workerType: workerTypeSchema.optional(),
  maxStaleAgeSeconds: z.number().int().positive().max(86400).optional(),
  reason: reasonSchema.optional(),
  metadata: metadataSchema,
})

export const runtimeRegistryQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  workerType: workerTypeSchema.optional(),
})

export const releaseWorkerJobSchema = workerLeaseMutationSchema.extend({
  claimStatus: z.enum(['released', 'completed', 'failed', 'expired', 'cancelled']).default('released'),
})

export const recordToolRuntimeCheckSchema = z.object({
  workspaceId: idSchema,
  workerType: workerTypeSchema,
  runtimeRegion: z.enum(['us-east1', 'europe-west1']).optional(),
  toolName: z.enum(['ffmpeg', 'ffprobe', 'remotion', 'sharp_libvips', 'audioflux', 'signalsmith_stretch', 'opencv', 'vapoursynth', 'playwright']),
  toolVersion: z.string().min(1).max(120).optional(),
  checkStatus: z.enum(['passed', 'warning', 'failed', 'missing', 'blocked']),
  checkSummary: z.string().min(1).max(1000),
  binaryPath: z.string().max(500).optional(),
  capabilitiesJson: safePayloadSchema,
})

export const toolReadinessCheckSchema = z.object({
  workspaceId: idSchema.optional(),
  workerType: workerTypeSchema.optional(),
  toolName: z.enum(['ffmpeg', 'ffprobe', 'remotion', 'sharp_libvips', 'audioflux', 'signalsmith_stretch', 'opencv', 'vapoursynth', 'playwright']).optional(),
  recordResults: z.boolean().optional(),
}).strict()

export const runWorkerJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  workerType: workerTypeSchema,
  workerInstanceId: workerInstanceSchema.optional(),
  idempotencyKey: z.string().min(1).optional(),
  dryRun: z.boolean().optional(),
  jobType: z.string().min(1).max(120).optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  mediaAssetId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  payloadJson: safePayloadSchema,
}).strict()

export const probeMediaJobSchema = runWorkerJobSchema.extend({
  workerType: z.string().min(1).default('media_probe_worker'),
  jobType: z.string().min(1).default('media_analysis'),
}).strict()
