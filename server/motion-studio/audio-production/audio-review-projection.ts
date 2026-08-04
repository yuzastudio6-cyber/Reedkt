import { z } from 'zod'

import {
  motionStudioAudioInvalidationRecordV1Schema,
  motionStudioAudioReviewSummaryDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import {
  MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION,
  type MotionStudioAudioAcceptanceChainV1,
  type MotionStudioAudioInvalidationRecordV1,
  type MotionStudioAudioReviewSummaryDto,
} from '../../../src/types/motion-studio'
import { compileMotionStudioAudioAcceptanceChainV1 } from './audio-acceptance-compiler'

export const MOTION_STUDIO_AUDIO_REVIEW_PROJECTION_AUTHORITY_VERSION =
  'motion-studio.audio-review-projection-authority.v1' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)

const projectionAuthoritySchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_AUDIO_REVIEW_PROJECTION_AUTHORITY_VERSION),
  productionId: stableId,
  acceptanceChainAuthorityDigest: digest,
  sourceVerificationReceiptId: stableId,
  sourceVerificationReceiptDigest: digest,
  canonicalBackendVerifiedRuntime: z.literal(true),
  promotionAuthorized: z.literal(true),
  browserProjectionAuthorized: z.literal(true),
}).strict()

export interface MotionStudioAudioReviewProjectionAuthorityV1 {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_REVIEW_PROJECTION_AUTHORITY_VERSION
  productionId: string
  acceptanceChainAuthorityDigest: string
  sourceVerificationReceiptId: string
  sourceVerificationReceiptDigest: string
  canonicalBackendVerifiedRuntime: true
  promotionAuthorized: true
  browserProjectionAuthorized: true
}

export interface ProjectMotionStudioAudioReviewSummaryInput {
  chain: MotionStudioAudioAcceptanceChainV1
  projectionAuthority: MotionStudioAudioReviewProjectionAuthorityV1
  invalidation?: MotionStudioAudioInvalidationRecordV1
}

export class MotionStudioAudioReviewProjectionError extends Error {
  readonly code:
    | 'audio_review_projection_authority_invalid'
    | 'audio_review_projection_source_mismatch'

  constructor(
    code: MotionStudioAudioReviewProjectionError['code'],
    message: string,
  ) {
    super(message)
    this.name = 'MotionStudioAudioReviewProjectionError'
    this.code = code
  }
}

export function projectMotionStudioAudioReviewSummaryV1(
  input: ProjectMotionStudioAudioReviewSummaryInput,
): MotionStudioAudioReviewSummaryDto {
  const authority = projectionAuthoritySchema.safeParse(input.projectionAuthority)
  if (!authority.success) {
    throw new MotionStudioAudioReviewProjectionError(
      'audio_review_projection_authority_invalid',
      'Audio review cannot reach the browser without a verified canonical runtime projection authority.',
    )
  }

  const compiled = compileMotionStudioAudioAcceptanceChainV1(input.chain)
  if (
    authority.data.productionId !== compiled.chain.productionId ||
    authority.data.acceptanceChainAuthorityDigest !== compiled.authorityDigest
  ) {
    throw sourceMismatch('Audio review projection authority does not match the exact acceptance chain.')
  }

  const invalidation = input.invalidation
    ? motionStudioAudioInvalidationRecordV1Schema.parse(input.invalidation)
    : undefined
  if (invalidation) assertInvalidationMatches(compiled.chain, compiled.selectionManifestDigest, invalidation)

  const selection = compiled.chain.selectionManifest
  const quality = compiled.chain.integratedMixQualityReport
  const acceptance = compiled.chain.audioAcceptanceRecord
  const state: MotionStudioAudioReviewSummaryDto['state'] = invalidation
    ? 'stale'
    : acceptance.decision === 'accepted'
      ? 'approved_locked'
      : acceptance.decision

  return motionStudioAudioReviewSummaryDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION,
    productionId: compiled.chain.productionId,
    projectId: compiled.chain.projectId,
    editSessionId: compiled.chain.editSessionId,
    state,
    selectionVersion: selection.selectionManifestVersion,
    requiredNarrationSegmentCount: selection.approvedVoiceSegmentIds.length,
    selectedNarrationSegmentCount: selection.selectedNarration.length,
    optionalRoles: selection.optionalRoleDecisions.map((decision) => ({
      role: decision.role,
      decision: decision.decision === 'selected' ? 'included' : decision.decision,
      selectedItemCount: decision.selections.length,
    })),
    narrationAssemblyVerified: true,
    integratedMixVerified: true,
    mixArtifactId: compiled.chain.integratedMixArtifact.artifactId,
    durationFrames: compiled.chain.integratedMixArtifact.durationFrames,
    frameRate: compiled.chain.integratedMixArtifact.frameRate,
    passedBlockingCheckCount: quality.gateResults.filter((gate) => gate.result === 'passed').length,
    totalBlockingCheckCount: 14,
    allBlockingChecksPassed: true,
    review: {
      decision: acceptance.decision,
      reason: acceptance.decisionReason,
      reviewedAt: acceptance.reviewedAt,
      immutable: true,
    },
    ...(invalidation ? { recoveryAction: invalidation.recoveryAction } : {}),
    fineCutHandoffEligible: invalidation ? false : acceptance.fineCutHandoffEligible,
    privateReviewOnly: true,
    timelineReady: false,
    finalVideoReady: false,
    renderReady: false,
    exportReady: false,
    publicDeliveryReady: false,
    productReady: false,
  })
}

function assertInvalidationMatches(
  chain: MotionStudioAudioAcceptanceChainV1,
  selectionManifestDigest: string,
  invalidation: MotionStudioAudioInvalidationRecordV1,
): void {
  if (
    invalidation.workspaceId !== chain.workspaceId ||
    invalidation.projectId !== chain.projectId ||
    invalidation.editSessionId !== chain.editSessionId ||
    invalidation.productionId !== chain.productionId ||
    invalidation.previousSelectionManifestId !== chain.selectionManifest.selectionManifestId ||
    invalidation.previousSelectionManifestVersion !== chain.selectionManifest.selectionManifestVersion ||
    invalidation.previousSelectionManifestDigest !== selectionManifestDigest ||
    invalidation.previousAudioAcceptanceRecordId !== chain.audioAcceptanceRecord.audioAcceptanceRecordId
  ) {
    throw sourceMismatch('Audio invalidation does not match the exact immutable acceptance history.')
  }
}

function sourceMismatch(message: string): MotionStudioAudioReviewProjectionError {
  return new MotionStudioAudioReviewProjectionError('audio_review_projection_source_mismatch', message)
}
