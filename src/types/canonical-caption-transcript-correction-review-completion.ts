import type { CaptionCanonicalTranscriptReadScope } from
  './caption-canonical-transcript-authenticated-read'
import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CanonicalCaptionReviewedCorrectionWord } from
  './canonical-caption-reviewed-transcript-correction'

export const CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEWER_SUBMISSION_VERSION =
  'canonical-caption-transcript-correction-reviewer-submission-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_COMPLETION_RECEIPT_VERSION =
  'canonical-caption-transcript-correction-review-completion-receipt-v1' as const

export interface CanonicalCaptionTranscriptCorrectionReviewerDecision {
  sourceSegmentId: string
  order: number
  originalSourceWordIds: string[]
  correctedText: string
  correctedWords: CanonicalCaptionReviewedCorrectionWord[]
  listenerDecision: 'approved_audio_truth_correction'
  segmentAudioListenedInFull: true
  correctedTextCheckedAgainstAudio: true
  correctedWordTimingCheckedAgainstAudio: true
  meaningAndNegationPreserved: true
  properNamesNumbersAndClaimsChecked: true
}

/**
 * Private reviewer-authored evidence. It contains corrected transcript text and
 * therefore must never be returned to a browser, peer skill, or public log.
 */
export interface CanonicalCaptionTranscriptCorrectionReviewerSubmission {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEWER_SUBMISSION_VERSION
  submissionId: string
  submissionDigestSha256: string
  reviewPackageRef: CaptionDomainRef
  targetCanonicalReadScope: CaptionCanonicalTranscriptReadScope
  reviewerIdentityRef: CaptionDomainRef
  reviewerClass: 'independent_private_audio_truth_reviewer'
  reviewedAt: string
  decisions: CanonicalCaptionTranscriptCorrectionReviewerDecision[]
  completeSourceAudioListened: true
  everySourceSegmentReviewedInOrder: true
  everyCorrectedWordTextReviewedAgainstAudio: true
  everyCorrectedWordTimingReviewedAgainstAudio: true
  semanticMeaningAndNegationReviewed: true
  properNamesNumbersAndClaimSensitiveTermsReviewed: true
  correctedTranscriptApprovedForCanonicalOwnerProjection: true
  independentFromAsrRuntime: true
  asrCandidateTreatedAsGroundTruth: false
  privateArtifact: true
  browserShareable: false
  rawTranscriptTextIncluded: true
  rawAudioIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  directPeerDispatchPerformed: false
  transcriptMutationAuthorityGrantedToCaption: false
  timingAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

/** Byte-free receipt for the reviewer-completion projection. */
export interface CanonicalCaptionTranscriptCorrectionReviewCompletionReceipt {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_COMPLETION_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  reviewPackageRef: CaptionDomainRef
  reviewerSubmissionRef: CaptionDomainRef
  reviewerIdentityRef: CaptionDomainRef
  sourceTranscriptRef: CaptionDomainRef
  rejectedInspectionReceiptRef: CaptionDomainRef
  independentAudioTruthReviewRef: CaptionDomainRef
  correctionArtifactRef: CaptionDomainRef
  correctionRequestRef: CaptionDomainRef
  completedAt: string
  packageContextRecomputedAndMatched: true
  everySourceSegmentReviewedInOrder: true
  everyOriginalSourceWordCoveredExactlyOnce: true
  everyCorrectedWordTextAndTimingReviewedAgainstAudio: true
  properNamesNumbersClaimsAndNegationReviewed: true
  artifactBasisDigestBoundToIndependentReview: true
  canonicalOwnerRereadStillRequired: true
  createOnlyPrivatePersistenceRequired: true
  privateArtifact: true
  browserShareable: false
  transcriptTextIncluded: false
  rawAudioIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  directPeerDispatchPerformed: false
  providerCallMade: false
  transcriptMutationAuthorityGrantedToCaption: false
  timingAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
