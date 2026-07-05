import { z } from 'zod'
import { idSchema } from './common-schemas'

const localEditPlanStepSchema = z.object({
  label: z.string().min(1).max(120),
  summary: z.string().min(1).max(800),
})

const localEditPlanCreditEstimateSchema = z.object({
  lowCredits: z.number().int().nonnegative(),
  expectedCredits: z.number().int().nonnegative(),
  highCredits: z.number().int().nonnegative(),
  creditConversion: z.literal('1 credit = $0.10'),
  serviceFeeIncluded: z.literal(false),
}).refine((value) => value.lowCredits <= value.expectedCredits && value.expectedCredits <= value.highCredits, {
  message: 'Credit estimate must be ordered low <= expected <= high.',
})

const localEditPlanSourceSchema = z.object({
  storageObjectRecordId: idSchema,
  mediaAssetId: idSchema.optional(),
  bucketName: z.string().min(1),
  objectPath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  checksumSha256: z.string().optional(),
})

export const createApprovedLocalEditPlanSchema = z.object({
  workspaceId: idSchema,
  planId: idSchema,
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(4000),
  steps: z.array(localEditPlanStepSchema).min(1).max(12),
  creditEstimate: localEditPlanCreditEstimateSchema,
  source: localEditPlanSourceSchema,
})
