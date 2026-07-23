import { z } from 'zod'

import type {
  AuthorizeMotionStudioWorkGraphRequest,
  CancelMotionStudioJobRequest,
} from '../../src/types/motion-studio'

const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const failureCategory = z.string().trim().min(1).max(120)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

export const authorizeMotionStudioWorkGraphRequestSchema = z.object({
  approvedSnapshotId: z.string().uuid(),
  costEstimateId: stableId,
}).strict() satisfies z.ZodType<AuthorizeMotionStudioWorkGraphRequest>

export const cancelMotionStudioJobRequestSchema = z.object({
  reason: z.string().trim().min(1).max(1_000),
}).strict() satisfies z.ZodType<CancelMotionStudioJobRequest>

export const emptyMotionStudioWorkerRequestSchema = z.object({}).strict()

export const heartbeatMotionStudioJobLeaseRequestSchema = z.object({
  extensionSeconds: z.number().int().min(5).max(900),
}).strict()

export const motionStudioAttemptUsageLineSchema = z.object({
  costEstimateItemId: stableId,
  meterId: stableId,
  quantity: z.number().nonnegative().finite(),
  internalCostMicros: safeMicros,
  evidenceClass: z.enum([
    'provider_reported',
    'infrastructure_metered',
    'invoice_reconciled',
    'manually_adjusted',
  ]),
  evidenceDigest: digest,
}).strict()

export const finishMotionStudioJobAttemptRequestSchema = z.object({
  outcome: z.enum(['succeeded', 'failed', 'cancelled']),
  failureCategory: failureCategory.optional(),
  usage: z.array(motionStudioAttemptUsageLineSchema).max(128).readonly(),
  outcomeDigest: digest,
}).strict().superRefine((value, context) => {
  if (value.outcome === 'failed' && !value.failureCategory) {
    context.addIssue({ code: 'custom', path: ['failureCategory'], message: 'Failed attempts require a failure category.' })
  }
  if (value.outcome !== 'failed' && value.failureCategory) {
    context.addIssue({ code: 'custom', path: ['failureCategory'], message: 'Only failed attempts may provide a failure category.' })
  }
})

export const reconcileMotionStudioJobAttemptRequestSchema = z.object({
  attemptId: stableId,
  decision: z.enum(['no_side_effect', 'side_effect_observed', 'manual_review']),
  usage: z.array(motionStudioAttemptUsageLineSchema).max(128).readonly(),
  evidenceDigest: digest,
}).strict().superRefine((value, context) => {
  if (value.decision !== 'side_effect_observed' && value.usage.length > 0) {
    context.addIssue({
      code: 'custom',
      path: ['usage'],
      message: 'Only observed side effects may register reconciliation usage.',
    })
  }
})
