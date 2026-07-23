import { z } from 'zod'

import { motionStudioAudioCandidateReviewSummaryDtoSchema } from '../../../src/lib/motion-studio/contracts'
import type { MotionStudioAudioCandidateReviewSummaryDto } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const CANONICAL_MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_PROJECTION_VERSION =
  'canonical-motion-studio-audio-candidate-review-projection-v1' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

export const canonicalMotionStudioAudioCandidateReviewProjectionSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_PROJECTION_VERSION,
  ),
  summary: motionStudioAudioCandidateReviewSummaryDtoSchema,
  privateObjectIdentityHash: digest,
  sourceAuthority: z.object({
    sourceVerificationReceiptId: stableId,
    sourceVerificationReceiptDigest: digest,
    evidenceClass: z.literal('canonical_backend_verified_runtime'),
    releaseClass: z.literal('private_review_release'),
    canonicalBackendVerifiedRuntime: z.literal(true),
    exactCurrentReviewContextReverified: z.literal(true),
    exactPrivateCandidateReadbackVerified: z.literal(true),
    browserProjectionAuthorized: z.literal(true),
    productionPromotionAuthorized: z.literal(false),
    providerUrlPersisted: z.literal(false),
    localPathProjected: z.literal(false),
    selectionAuthorized: z.literal(false),
    finalMixAuthorized: z.literal(false),
    timelineMutationAuthorized: z.literal(false),
    renderAuthorized: z.literal(false),
    exportAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
  }).strict(),
  projectionDigest: digest,
}).strict().superRefine((value, context) => {
  const candidate = value.summary.candidate
  if (
    !value.summary.canonicalRuntimeEvidenceVerified ||
    !value.summary.exactReviewContextCurrent ||
    !candidate ||
    candidate.candidateReference !== value.summary.candidateReference ||
    candidate.privateReviewOnly !== true
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical audio candidate projection requires one current private-review candidate.',
    })
  }
})

export type CanonicalMotionStudioAudioCandidateReviewProjection = z.infer<
  typeof canonicalMotionStudioAudioCandidateReviewProjectionSchema
>

export interface CanonicalMotionStudioAudioCandidateReviewScope {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
}

/**
 * Server-only adapter over the one canonical provider/normalization/QA/review
 * authority. Implementations must re-read their source records; this port does
 * not authorize a second candidate registry, byte store, review decision, or
 * selection system.
 */
export interface CanonicalMotionStudioAudioCandidateReviewReaderPort {
  listCurrentCandidateReviews(
    scope: CanonicalMotionStudioAudioCandidateReviewScope,
  ): Promise<readonly CanonicalMotionStudioAudioCandidateReviewProjection[]>

  resolveCurrentCandidateReview(
    candidateReference: string,
  ): Promise<CanonicalMotionStudioAudioCandidateReviewProjection | undefined>

  readExactPrivateCandidate(input: CanonicalMotionStudioAudioCandidateReviewScope & {
    candidateReference: string
    projectionDigest: string
  }): Promise<{
    projection: CanonicalMotionStudioAudioCandidateReviewProjection
    bytes: Buffer
  } | undefined>
}

export function createCanonicalMotionStudioAudioCandidateReviewProjection(input: {
  summary: MotionStudioAudioCandidateReviewSummaryDto
  privateObjectIdentityHash: string
  sourceVerificationReceiptId: string
  sourceVerificationReceiptDigest: string
}): CanonicalMotionStudioAudioCandidateReviewProjection {
  const base = {
    schemaVersion:
      CANONICAL_MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_PROJECTION_VERSION,
    summary: input.summary,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
    sourceAuthority: {
      sourceVerificationReceiptId: input.sourceVerificationReceiptId,
      sourceVerificationReceiptDigest: input.sourceVerificationReceiptDigest,
      evidenceClass: 'canonical_backend_verified_runtime' as const,
      releaseClass: 'private_review_release' as const,
      canonicalBackendVerifiedRuntime: true as const,
      exactCurrentReviewContextReverified: true as const,
      exactPrivateCandidateReadbackVerified: true as const,
      browserProjectionAuthorized: true as const,
      productionPromotionAuthorized: false as const,
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
      selectionAuthorized: false as const,
      finalMixAuthorized: false as const,
      timelineMutationAuthorized: false as const,
      renderAuthorized: false as const,
      exportAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
    },
  }
  return deepFreeze(assertCanonicalMotionStudioAudioCandidateReviewProjection({
    ...base,
    projectionDigest: sha256CanonicalJson(base),
  }))
}

export function assertCanonicalMotionStudioAudioCandidateReviewProjection(
  input: CanonicalMotionStudioAudioCandidateReviewProjection,
): CanonicalMotionStudioAudioCandidateReviewProjection {
  const result = canonicalMotionStudioAudioCandidateReviewProjectionSchema.safeParse(input)
  if (!result.success) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Private audio candidate projection failed canonical source validation.',
      409,
      { requiredGate: 'canonical_audio_candidate_review_projection' },
    )
  }
  const parsed = result.data
  const unsigned = { ...parsed } as Record<string, unknown>
  delete unsigned.projectionDigest
  if (sha256CanonicalJson(unsigned) !== parsed.projectionDigest) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Private audio candidate projection failed immutable source verification.',
      409,
      { requiredGate: 'canonical_audio_candidate_review_projection' },
    )
  }
  return deepFreeze(parsed)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
