import { z } from 'zod'
import { WORKER_TOOL_NAMES } from '../workers/tool-readiness-types'
import { idSchema } from './common-schemas'

export const claimWorkerJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  workerType: z.string().min(1),
  workerInstanceId: z.string().min(1),
  leaseExpiresAt: z.string().min(1),
})

export const releaseWorkerJobSchema = z.object({
  workspaceId: idSchema.optional(),
  claimStatus: z.enum(['released', 'completed', 'failed', 'expired', 'cancelled']).default('released'),
})

export const recordToolRuntimeCheckSchema = z.object({
  workspaceId: idSchema,
  workerType: z.string().min(1),
  runtimeRegion: z.enum(['us-east1', 'europe-west1']).optional(),
  toolName: z.enum(WORKER_TOOL_NAMES),
  toolVersion: z.string().optional(),
  checkStatus: z.enum(['passed', 'warning', 'failed', 'missing', 'blocked']),
  checkSummary: z.string().min(1),
  binaryPath: z.string().optional(),
  capabilitiesJson: z.record(z.string(), z.unknown()).optional(),
})

export const toolReadinessCheckSchema = z.object({
  workspaceId: idSchema.optional(),
  workerType: z.string().min(1).optional(),
  toolName: z.enum(WORKER_TOOL_NAMES).optional(),
  recordResults: z.boolean().optional(),
}).strict()

export const runWorkerJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  workerType: z.string().min(1),
  workerInstanceId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1),
  dryRun: z.boolean().optional(),
  jobType: z.string().min(1).optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  mediaAssetId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  payloadJson: z.record(z.string(), z.unknown()).optional(),
}).strict()

export const probeMediaJobSchema = runWorkerJobSchema.extend({
  workerType: z.string().min(1).default('media_probe_worker'),
  jobType: z.string().min(1).default('media_analysis'),
}).strict()
