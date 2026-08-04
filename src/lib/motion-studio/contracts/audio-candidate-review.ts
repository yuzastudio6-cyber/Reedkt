import { z } from 'zod'

import {
  MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION,
  type MotionStudioAudioCandidateReviewSummaryDto,
} from '../../../types/motion-studio/audio-candidate-review'

const uuid = z.string().uuid()
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/u)

const privateCandidateSchema = z.object({
  candidateReference: stableId,
  sha256: digest,
  byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
  mimeType: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(2),
  durationMilliseconds: z.number().int().positive().max(30_000),
  contentPath: z.string().min(1).max(360),
  privateReviewOnly: z.literal(true),
}).strict()

export const motionStudioAudioCandidateReviewSummaryDtoSchema:
  z.ZodType<MotionStudioAudioCandidateReviewSummaryDto> = z.object({
    schemaVersion: z.literal(MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION),
    productionId: uuid,
    projectId: stableId,
    editSessionId: stableId,
    sourceApprovedSnapshotId: stableId,
    sourceApprovedSnapshotDigest: digest,
    timingAuthorityDigest: digest,
    candidateReference: stableId,
    role: z.enum(['music', 'foley']),
    state: z.enum([
      'verifying',
      'ready_for_review',
      'reviewed_passed',
      'reviewed_rejected',
      'stale',
      'blocked',
    ]),
    reviewVersion: z.number().int().positive(),
    requiredReviewCheckCount: z.union([z.literal(5), z.literal(6)]),
    completedReviewCheckCount: z.number().int().nonnegative().max(6),
    candidateDurationMilliseconds: z.number().int().positive().max(30_000),
    candidate: privateCandidateSchema.optional(),
    review: z.object({
      decision: z.enum(['passed', 'rejected']),
      note: z.string().trim().min(1).max(500),
      reviewedAt: z.string().datetime({ offset: true }),
      immutable: z.literal(true),
    }).strict().optional(),
    exactReviewContextCurrent: z.boolean(),
    canonicalRuntimeEvidenceVerified: z.literal(true),
    completePrivatePlaybackRequired: z.literal(true),
    humanReviewRequired: z.literal(true),
    automaticSelectionAllowed: z.literal(false),
    selected: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineReady: z.literal(false),
    renderReady: z.literal(false),
    exportReady: z.literal(false),
    publicDeliveryReady: z.literal(false),
    productReady: z.literal(false),
  }).strict().superRefine((value, context) => {
    const expectedCheckCount = value.role === 'music' ? 6 : 5
    const reviewed = value.state === 'reviewed_passed' || value.state === 'reviewed_rejected'
    const playable = value.state === 'ready_for_review' || reviewed
    const expectedDecision = value.state === 'reviewed_passed'
      ? 'passed'
      : value.state === 'reviewed_rejected'
        ? 'rejected'
        : undefined

    if (value.requiredReviewCheckCount !== expectedCheckCount) {
      context.addIssue({
        code: 'custom',
        path: ['requiredReviewCheckCount'],
        message: 'Audio candidate review must preserve the exact role-specific check count.',
      })
    }
    if (value.completedReviewCheckCount > value.requiredReviewCheckCount) {
      context.addIssue({
        code: 'custom',
        path: ['completedReviewCheckCount'],
        message: 'Completed review checks cannot exceed the exact required set.',
      })
    }
    if (
      (playable !== Boolean(value.candidate)) ||
      (reviewed !== Boolean(value.review)) ||
      (reviewed && value.completedReviewCheckCount !== value.requiredReviewCheckCount) ||
      (!reviewed && value.completedReviewCheckCount !== 0) ||
      (value.review && value.review.decision !== expectedDecision) ||
      (playable && !value.exactReviewContextCurrent)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Audio candidate review state, playback, context, and immutable decision do not reconcile.',
      })
    }
    if (value.candidate && (
      value.candidate.candidateReference !== value.candidateReference ||
      value.candidate.durationMilliseconds !== value.candidateDurationMilliseconds ||
      value.candidate.contentPath !==
        `/v1/motion-studio/audio-candidates/${value.candidateReference}/content`
    )) {
      context.addIssue({
        code: 'custom',
        path: ['candidate'],
        message: 'Private candidate playback does not match the exact browser-safe review reference.',
      })
    }
  })
