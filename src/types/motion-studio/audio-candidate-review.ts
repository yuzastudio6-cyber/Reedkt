import type { ISODateString } from '../shared'

export const MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION =
  'motion-studio.audio-candidate-review-summary.v1' as const

export type MotionStudioAudioCandidateRole = 'music' | 'foley'

export type MotionStudioAudioCandidateReviewState =
  | 'verifying'
  | 'ready_for_review'
  | 'reviewed_passed'
  | 'reviewed_rejected'
  | 'stale'
  | 'blocked'

export interface MotionStudioPrivateAudioCandidateDto {
  candidateReference: string
  sha256: string
  byteLength: number
  mimeType: 'audio/wav'
  codec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 2
  durationMilliseconds: number
  contentPath: string
  privateReviewOnly: true
}

/**
 * Bounded browser projection of one canonically admitted music or Foley
 * candidate. Provider, queue, storage, filesystem, prompt, usage, and cost
 * authority stay server-only. The projection is absent until the backend can
 * prove the exact private candidate and current review context.
 */
export interface MotionStudioAudioCandidateReviewSummaryDto {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION
  productionId: string
  projectId: string
  editSessionId: string
  sourceApprovedSnapshotId: string
  sourceApprovedSnapshotDigest: string
  timingAuthorityDigest: string
  candidateReference: string
  role: MotionStudioAudioCandidateRole
  state: MotionStudioAudioCandidateReviewState
  reviewVersion: number
  requiredReviewCheckCount: 5 | 6
  completedReviewCheckCount: number
  candidateDurationMilliseconds: number
  candidate?: MotionStudioPrivateAudioCandidateDto
  review?: {
    decision: 'passed' | 'rejected'
    note: string
    reviewedAt: ISODateString
    immutable: true
  }
  exactReviewContextCurrent: boolean
  canonicalRuntimeEvidenceVerified: true
  completePrivatePlaybackRequired: true
  humanReviewRequired: true
  automaticSelectionAllowed: false
  selected: false
  finalMixEligible: false
  timelineReady: false
  renderReady: false
  exportReady: false
  publicDeliveryReady: false
  productReady: false
}
