import { z } from 'zod'

import {
  motionStudioCurrencyExchangeRateSnapshotSchema,
  motionStudioMs010BExecutionAuthorityV1Schema,
  motionStudioMs010BFallbackEligibilityV1Schema,
  motionStudioMs010BOwnerAuthorizationV1Schema,
  motionStudioMs010BRetentionPolicyV1Schema,
  motionStudioMs010BStopPolicyV1Schema,
  motionStudioLiveCandidateReviewInputSchema,
  motionStudioProviderNativeRateSnapshotSchema,
} from '../../src/lib/motion-studio/contracts'
import { motionStudioAttemptUsageLineSchema } from './motion-studio-job-schemas'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const iso = z.string().datetime({ offset: true })
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

export const createMotionStudioMs010BAuthorizationRequestSchema = z.object({
  productionId: uuid,
  approvedSnapshotId: uuid,
  authorization: motionStudioMs010BOwnerAuthorizationV1Schema,
  retentionPolicy: motionStudioMs010BRetentionPolicyV1Schema,
  stopPolicy: motionStudioMs010BStopPolicyV1Schema,
}).strict()

export const createMotionStudioProviderNativeRateRequestSchema = z.object({
  rate: motionStudioProviderNativeRateSnapshotSchema,
}).strict()

export const createMotionStudioCurrencyExchangeRateRequestSchema = z.object({
  rate: motionStudioCurrencyExchangeRateSnapshotSchema,
}).strict()

export const createMotionStudioLiveExecutionAuthorityRequestSchema = z.object({
  wanNativeRateSnapshotId: stableId,
  wanFxSnapshotId: stableId.nullable(),
  authority: motionStudioMs010BExecutionAuthorityV1Schema,
}).strict()

export const createMotionStudioLiveOperationRequestSchema = z.object({
  operationId: stableId,
  operationKind: z.enum([
    'gpt_image_generation',
    'gpt_image_edit',
    'wan_image_to_video',
    'hailuo_image_to_video_fallback',
  ]),
  jobId: stableId,
  requestDigest: digest,
  dependencyOperationId: stableId.optional(),
  inputMediaAssetVersionId: uuid.optional(),
  fallbackEligibilityId: stableId.optional(),
  manualInvocationId: stableId.optional(),
}).strict()

export const issueMotionStudioLiveTransportPermitRequestSchema = z.object({
  permitId: uuid,
  executionAuthorityId: stableId,
  executionAuthorityDigest: digest,
  providerAdapterId: z.enum([
    'openai_gpt_image_2_live_v1',
    'alibaba_wan_2_7_i2v_live_v1',
    'minimax_hailuo_2_3_fast_i2v_live_v1',
  ]),
  requestDigest: digest,
  credentialReferenceId: stableId,
  issuedAt: iso,
  expiresAt: iso,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.issuedAt)) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Permit expiry must follow issuance.' })
  }
})

export const consumeMotionStudioLiveTransportPermitRequestSchema = z.object({
  requestDigest: digest,
}).strict()

export const consumeMotionStudioLiveFollowupCallRequestSchema = z.object({
  callId: uuid,
  callPurpose: z.enum(['status_query', 'file_retrieve', 'media_download']),
  callSequence: z.number().int().positive().max(20),
  executionAuthorityId: stableId,
  executionAuthorityDigest: digest,
  providerAdapterId: z.enum([
    'alibaba_wan_2_7_i2v_live_v1',
    'minimax_hailuo_2_3_fast_i2v_live_v1',
  ]),
  requestDigest: digest,
  credentialReferenceId: stableId,
  issuedAt: iso,
  expiresAt: iso,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.issuedAt)) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Follow-up permit expiry must follow issuance.' })
  }
})

export const recordMotionStudioLiveFollowupCallResultRequestSchema = z.object({
  resultStatus: z.enum([
    'processing', 'download_ready', 'media_received', 'failed', 'cancelled',
    'outcome_unknown', 'unrecognized_response',
  ]),
  eventDigest: digest,
  responseDigest: digest,
  occurredAt: iso,
}).strict()

export const recordMotionStudioLiveProviderEventRequestSchema = z.object({
  eventSource: z.enum(['synchronous', 'poll', 'download', 'reconciliation']),
  normalizedStatus: z.enum(['submitted', 'processing', 'outcome_unknown', 'completed', 'failed', 'cancelled']),
  eventDigest: digest,
  responseDigest: digest,
  externalOperationIdHash: digest.optional(),
  providerCostIncurred: z.boolean(),
  occurredAt: iso,
}).strict()

export const finishMotionStudioLiveOperationAttemptRequestSchema = z.object({
  outcome: z.enum(['failed', 'cancelled']),
  failureCategory: stableId.optional(),
  usage: z.array(motionStudioAttemptUsageLineSchema).max(128).readonly(),
  outcomeDigest: digest,
}).strict().superRefine((value, context) => {
  if (value.outcome === 'failed' && !value.failureCategory) {
    context.addIssue({ code: 'custom', path: ['failureCategory'], message: 'Failed attempts require an exact failure category.' })
  }
  if (value.outcome === 'cancelled' && value.failureCategory) {
    context.addIssue({ code: 'custom', path: ['failureCategory'], message: 'Cancelled attempts cannot carry a failure category.' })
  }
})

export const reconcileMotionStudioLiveOperationAttemptRequestSchema = z.object({
  decision: z.enum(['no_side_effect', 'side_effect_observed', 'manual_review']),
  usage: z.array(motionStudioAttemptUsageLineSchema).max(128).readonly(),
  evidenceDigest: digest,
}).strict().superRefine((value, context) => {
  const usageRequired = value.decision === 'side_effect_observed'
  if (usageRequired && value.usage.length === 0) {
    context.addIssue({ code: 'custom', path: ['usage'], message: 'Observed side effects require exact usage evidence.' })
  }
  if (!usageRequired && value.usage.length !== 0) {
    context.addIssue({ code: 'custom', path: ['usage'], message: 'Only observed side effects may carry usage evidence.' })
  }
})

export const completeMotionStudioLiveCandidateRequestSchema = z.object({
  mediaAssetId: uuid,
  mediaAssetVersionId: uuid,
  privateObjectIdentityHash: digest,
  mediaSha256: digest,
  byteLength: positiveSafeInteger.max(100 * 1024 * 1024),
  mimeType: z.enum(['image/png', 'video/mp4']),
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  durationFrames: z.number().int().positive().max(21_600).optional(),
  fpsNumerator: z.number().int().positive().max(240_000).optional(),
  fpsDenominator: z.number().int().positive().max(10_000).optional(),
  provenanceDigest: digest,
  qaEvidenceDigest: digest,
  safetyStatus: z.enum(['passed', 'review_required']),
  usage: z.array(motionStudioAttemptUsageLineSchema).max(128).readonly(),
  outcomeDigest: digest,
}).strict().superRefine((value, context) => {
  const videoFields = [value.durationFrames, value.fpsNumerator, value.fpsDenominator]
  if (value.mimeType === 'image/png' && videoFields.some((field) => field !== undefined)) {
    context.addIssue({ code: 'custom', path: ['durationFrames'], message: 'Still-image candidates cannot include video timing.' })
  }
  if (value.mimeType === 'video/mp4' && videoFields.some((field) => field === undefined)) {
    context.addIssue({ code: 'custom', path: ['durationFrames'], message: 'Video candidates require complete frame-rate timing.' })
  }
})

export const reviewMotionStudioLiveCandidateRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionCategory: z.enum([
    'reference_adherence',
    'continuity',
    'visual_artifact',
    'intent_alignment',
    'safety',
  ]).optional(),
  qaEvidenceArtifactId: uuid,
  qaEvidenceVersionId: uuid,
  qaEvidenceContentDigest: digest,
  reviewDigest: digest,
  fallbackEligibility: motionStudioMs010BFallbackEligibilityV1Schema.optional(),
}).strict().superRefine((value, context) => {
  if (value.decision === 'approved' && (value.rejectionCategory || value.fallbackEligibility)) {
    context.addIssue({ code: 'custom', path: ['decision'], message: 'Approved candidates cannot carry fallback authority.' })
  }
  if (value.decision === 'rejected' && !value.rejectionCategory) {
    context.addIssue({ code: 'custom', path: ['rejectionCategory'], message: 'Rejected candidates require a QA category.' })
  }
  if (value.fallbackEligibility && value.decision !== 'rejected') {
    context.addIssue({ code: 'custom', path: ['fallbackEligibility'], message: 'Fallback eligibility requires a rejection.' })
  }
})

export const reviewMotionStudioLiveCandidateByOwnerRequestSchema =
  motionStudioLiveCandidateReviewInputSchema
