import type { ISODateString } from '../shared'

export const MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION =
  'motion-studio.audio-review-summary.v1' as const

export type MotionStudioAudioReviewState =
  | 'ready_for_review'
  | 'changes_requested'
  | 'rejected'
  | 'approved_locked'
  | 'stale'

export type MotionStudioAudioReviewRole =
  | 'music'
  | 'foley'
  | 'ambience'
  | 'exact_sfx'

export interface MotionStudioAudioReviewRoleSummaryDto {
  role: MotionStudioAudioReviewRole
  decision: 'included' | 'not_selected' | 'not_needed'
  selectedItemCount: number
}

export interface MotionStudioAudioReviewSummaryDto {
  schemaVersion: typeof MOTION_STUDIO_AUDIO_REVIEW_SUMMARY_VERSION
  productionId: string
  projectId: string
  editSessionId: string
  state: MotionStudioAudioReviewState
  selectionVersion: number
  requiredNarrationSegmentCount: number
  selectedNarrationSegmentCount: number
  optionalRoles: readonly MotionStudioAudioReviewRoleSummaryDto[]
  narrationAssemblyVerified: true
  integratedMixVerified: true
  mixArtifactId: string
  durationFrames: number
  frameRate: number
  passedBlockingCheckCount: number
  totalBlockingCheckCount: 14
  allBlockingChecksPassed: true
  review?: {
    decision: 'accepted' | 'changes_requested' | 'rejected'
    reason: string
    reviewedAt: ISODateString
    immutable: true
  }
  recoveryAction?:
    | 'replanning_required'
    | 'reselection_required'
    | 'remix_required'
    | 're_review_required'
  fineCutHandoffEligible: boolean
  privateReviewOnly: true
  timelineReady: false
  finalVideoReady: false
  renderReady: false
  exportReady: false
  publicDeliveryReady: false
  productReady: false
}
