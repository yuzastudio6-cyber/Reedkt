import { z } from 'zod'
import { idSchema } from './common-schemas'

export const creditExecutionTypeSchema = z.enum([
  'generation',
  'render',
  'export',
  'tool',
  'provider',
  'music',
  'sfx',
  'snapshot',
  'revision',
])

const metadataSchema = z.record(z.string(), z.unknown()).optional()
const creditAmountSchema = z.number().finite().nonnegative()
const reasonSchema = z.string().min(1).max(500)

export const creditLineItemSchema = z.object({
  label: z.string().min(1).max(160),
  credits: creditAmountSchema,
  category: z.string().min(1).max(80).optional(),
  reason: z.string().min(1).max(500).optional(),
  metadata: metadataSchema,
})

export const creditEstimateCreateSchema = z.object({
  workspaceId: idSchema,
  editPlanVersionId: idSchema.optional(),
  approvedSnapshotId: idSchema.optional(),
  lineItems: z.array(creditLineItemSchema).min(1),
  estimateReason: z.string().min(1).max(500).optional(),
  metadata: metadataSchema,
})

export const creditEstimateReadinessSchema = creditEstimateCreateSchema.partial({
  lineItems: true,
}).extend({
  workspaceId: idSchema,
  lineItems: z.array(creditLineItemSchema).optional(),
})

export const approveCreditEstimateSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanVersionId: idSchema.optional(),
  approvalRecordId: idSchema.optional(),
  approvedSnapshotId: idSchema.optional(),
  metadata: metadataSchema,
})

export const creditGateCheckSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  approvedSnapshotId: idSchema.optional(),
  editPlanVersionId: idSchema.optional(),
  executionType: creditExecutionTypeSchema,
  requestedCredits: creditAmountSchema.default(0),
  requiresApprovedSnapshot: z.boolean().optional(),
  metadata: metadataSchema,
})

export const reserveCreditsSchema = creditGateCheckSchema.extend({
  creditEstimateId: idSchema,
  approvedSnapshotId: idSchema,
})

export const creditReservationMutationSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditEstimateId: idSchema.optional(),
  approvedSnapshotId: idSchema.optional(),
  amount: creditAmountSchema.optional(),
  reason: reasonSchema,
  metadata: metadataSchema,
})

export const creditEstimateQuerySchema = z.object({
  workspaceId: idSchema.optional(),
})

export const creditReservationQuerySchema = z.object({
  workspaceId: idSchema.optional(),
  projectId: idSchema.optional(),
})

export const projectLedgerQuerySchema = z.object({
  workspaceId: idSchema,
})
