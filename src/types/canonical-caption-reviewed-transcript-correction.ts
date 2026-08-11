import type {
  CaptionCanonicalTranscript,
} from './caption-transcript-lineage'
import type {
  CaptionCanonicalTranscriptReadScope,
} from './caption-canonical-transcript-authenticated-read'
import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION =
  'canonical-caption-reviewed-transcript-correction-artifact-v1' as const
export const CANONICAL_CAPTION_REVIEWED_CORRECTION_REQUEST_VERSION =
  'canonical-caption-reviewed-transcript-correction-request-v1' as const
export const CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION =
  'canonical-caption-reviewed-transcript-correction-record-v1' as const
export const CANONICAL_CAPTION_INDEPENDENT_AUDIO_TRUTH_REVIEW_VERSION =
  'caption-private-independent-audio-truth-review-v1' as const
export const CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_RECEIPT_VERSION =
  'canonical-caption-reviewed-transcript-owner-reconciliation-receipt-v1' as const

/**
 * Private evidence produced by an independent reviewer after listening to the
 * complete source audio and checking every proposed corrected word/timestamp.
 * It is reread by the canonical transcript owner and is never a Caption or
 * browser payload.
 */
export interface CanonicalCaptionIndependentAudioTruthReview {
  schemaVersion:
    typeof CANONICAL_CAPTION_INDEPENDENT_AUDIO_TRUTH_REVIEW_VERSION
  reviewId: string
  reviewDigestSha256: string
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  sourceMediaRef: CaptionDomainRef
  sourceTranscriptRef: CaptionDomainRef
  rejectedInspectionReceiptRef: CaptionDomainRef
  correctionArtifactId: string
  correctionArtifactVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION
  /** Digest of the artifact with its final review ref and envelope digest omitted. */
  correctionArtifactBasisDigestSha256: string
  reviewedSourceSegmentIds: string[]
  reviewedCorrectedWordIds: string[]
  reviewedAt: string
  reviewerClass: 'independent_private_audio_truth_reviewer'
  completeSourceAudioListened: true
  everySourceSegmentReviewedInOrder: true
  everyCorrectedWordTextReviewedAgainstAudio: true
  everyCorrectedWordTimingReviewedAgainstAudio: true
  semanticMeaningAndNegationReviewed: true
  properNamesNumbersAndClaimSensitiveTermsReviewed: true
  correctedTranscriptApprovedForCanonicalOwnerProjection: true
  independentFromAsrRuntime: true
  privateArtifact: true
  browserShareable: false
  rawTranscriptTextIncluded: false
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

export interface CanonicalCaptionReviewedCorrectionWord {
  correctedSourceWordId: string
  text: string
  startMilliseconds: number
  endMillisecondsExclusive: number
  reviewConfidenceBasisPoints: number
  replacedSourceWordIds: string[]
}

export interface CanonicalCaptionReviewedCorrectionSegment {
  sourceSegmentId: string
  order: number
  originalSourceWordIds: string[]
  correctedText: string
  words: CanonicalCaptionReviewedCorrectionWord[]
}

/** Private owner artifact. It is never a browser or peer-skill payload. */
export interface CanonicalCaptionReviewedCorrectionArtifact {
  schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION
  artifactId: string
  artifactDigestSha256: string
  sourceTranscriptRef: CaptionDomainRef
  independentAudioTruthReviewRef: CaptionDomainRef
  segments: CanonicalCaptionReviewedCorrectionSegment[]
  completeTranscriptCorrected: true
  everySourceSegmentCoveredExactlyOnce: true
  everyOriginalSourceWordCoveredByCorrectionLineage: true
  everyCorrectedWordTimingDirectlyReviewedAgainstAudio: true
  properNamesAndClaimSensitiveTermsReviewed: true
  privateArtifact: true
  browserShareable: false
  rawChatIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  captionMutationAuthorityGranted: false
  timingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

/** Byte-free request into the existing canonical transcript owner. */
export interface CanonicalCaptionReviewedCorrectionRequest {
  schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  sourceMediaRef: CaptionDomainRef
  sourceTranscriptRef: CaptionDomainRef
  rejectedInspectionReceiptRef: CaptionDomainRef
  correctionArtifactRef: CaptionDomainRef
  independentAudioTruthReviewRef: CaptionDomainRef
  correctionReasonCodes: Array<
    | 'product_or_brand_name_misrecognition'
    | 'semantic_phrase_garbling'
    | 'excessive_low_confidence_word_density'
    | 'claim_sensitive_term_not_independently_verified'
    | 'non_monotonic_word_timing'
    | 'empty_or_zero_duration_word'
  >
  completeTranscriptCorrectionRequired: true
  callerSuppliedTranscriptAccepted: false
  canonicalOwnerRereadRequired: true
  privateInternalOnly: true
  rawChatIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  directPeerDispatchPerformed: false
  providerCallGranted: false
  transcriptMutationAuthorityGrantedToCaption: false
  timingAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionReviewedCorrectionRecord {
  schemaVersion: typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  requestRef: CaptionDomainRef
  sourceTranscriptRef: CaptionDomainRef
  rejectedInspectionReceiptRef: CaptionDomainRef
  correctionArtifactRef: CaptionDomainRef
  independentAudioTruthReviewRef: CaptionDomainRef
  correctedCanonicalTranscript: CaptionCanonicalTranscript
  correctedCanonicalTranscriptRef: CaptionDomainRef
  createdAt: string
  originalTranscriptRereadRequiredBeforePersistence: true
  rejectedInspectionRereadRequiredBeforePersistence: true
  correctionArtifactRereadRequiredBeforePersistence: true
  independentReviewRereadRequiredBeforePersistence: true
  completeTranscriptCorrectionVerified: true
  exactCorrectionLineageVerified: true
  correctedTranscriptProducedByCanonicalOwner: true
  createOnlyPersistenceAndExactRereadRequired: true
  captionCreatedTranscriptOwner: false
  privateInternalOnly: true
  browserShareable: false
  rawChatIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  directPeerDispatchPerformed: false
  providerCallMade: false
  timingAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

/**
 * Byte-free reconciliation receipt binding the reviewed correction to the
 * existing canonical authenticated-transcript repository. The transcript and
 * review payloads remain private owner artifacts and are referenced only.
 */
export interface CanonicalCaptionReviewedCorrectionOwnerReceipt {
  schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  requestRef: CaptionDomainRef
  sourceTranscriptRef: CaptionDomainRef
  sourceAuthenticatedTranscriptRecordRef: CaptionDomainRef
  rejectedInspectionReceiptRef: CaptionDomainRef
  correctionArtifactRef: CaptionDomainRef
  independentAudioTruthReviewRef: CaptionDomainRef
  correctionRecordRef: CaptionDomainRef
  correctedCanonicalTranscriptRef: CaptionDomainRef
  correctedAuthenticatedTranscriptRecordRef: CaptionDomainRef
  correctedAuthenticatedReadBindingRef: CaptionDomainRef
  createdAt: string
  approvedSnapshotRereadTwiceAndMatched: true
  sourceTranscriptRereadTwiceAndMatched: true
  rejectedInspectionRereadTwiceAndMatched: true
  correctionArtifactRereadTwiceAndMatched: true
  independentAudioTruthReviewRereadTwiceAndMatched: true
  completeCorrectionAndReviewCoverageVerified: true
  correctionRecordPersistedCreateOnlyAndReread: true
  correctedTranscriptPersistedThroughExistingCanonicalRepository: true
  correctedTranscriptAuthenticatedReadRereadVerified: true
  captionCreatedTranscriptOwner: false
  privateInternalOnly: true
  browserShareable: false
  transcriptTextIncluded: false
  rawChatIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  directPeerDispatchPerformed: false
  providerCallMade: false
  timingAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
