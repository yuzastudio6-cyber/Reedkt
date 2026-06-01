import { z } from 'zod'
import { idSchema } from './common-schemas'

const metadataSchema = z.record(z.string(), z.unknown()).optional()
const safePayloadSchema = z.record(z.string(), z.unknown()).optional()
const reasonSchema = z.string().min(1).max(600)
const jobTypeSchema = z.string().min(1).max(120)
const eventTypeSchema = z.string().min(1).max(120)
const statusSchema = z.string().min(1).max(80)
const progressPercentSchema = z.number().finite().min(0).max(100).optional()

export const jobReadinessSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedSnapshotId: idSchema.optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  jobType: jobTypeSchema.optional(),
  executionMode: z.enum(['readiness', 'queue', 'claim', 'backend_required', 'mock_only']).optional(),
  payloadJson: safePayloadSchema,
  metadata: metadataSchema,
})

export const createJobBatchSchema = jobReadinessSchema.extend({
  name: z.string().min(1).max(160).optional(),
  batchName: z.string().min(1).max(160).optional(),
  batchPurpose: z.string().min(1).max(500).optional(),
})

export const createJobSchema = jobReadinessSchema.extend({
  jobType: jobTypeSchema,
  jobBatchId: idSchema.optional(),
  jobName: z.string().min(1).max(160).optional(),
  jobDescription: z.string().min(1).max(600).optional(),
  attemptNumber: z.number().int().positive().optional(),
  maxAttempts: z.number().int().positive().max(20).optional(),
})

export const listProjectJobsQuerySchema = z.object({
  workspaceId: idSchema,
})

export const jobReadQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
})

export const createJobDependencySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  dependsOnJobId: idSchema,
  dependencyReason: z.string().min(1).max(500).optional(),
  requiredStatus: statusSchema.default('completed'),
  metadata: metadataSchema,
})

export const jobDependencyQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
})

export const appendJobEventSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  jobBatchId: idSchema.optional(),
  eventType: eventTypeSchema,
  message: z.string().min(1).max(1000).optional(),
  progressPercent: progressPercentSchema,
  eventVisibility: z.enum(['internal', 'user_summary', 'audit']).default('internal'),
  payloadJson: safePayloadSchema,
  metadata: metadataSchema,
})

export const jobRetrySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  reason: reasonSchema,
  attemptNumber: z.number().int().positive().optional(),
  maxAttempts: z.number().int().positive().max(20).optional(),
  metadata: metadataSchema,
})

export const jobCancelSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  reason: reasonSchema,
  metadata: metadataSchema,
})
