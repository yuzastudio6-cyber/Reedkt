import type { CaptionCanonicalTranscriptReadScope } from
  './caption-canonical-transcript-authenticated-read'
import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_CANDIDATE_VERSION =
  'canonical-caption-transcript-correction-candidate-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION =
  'canonical-caption-transcript-correction-review-package-v1' as const

export type CanonicalCaptionTranscriptCorrectionCandidateClass =
  | 'offline_asr_baseline_unapproved'
  | 'offline_asr_hotwords_unapproved'
  | 'offline_asr_terminology_aware_unapproved'

export interface CanonicalCaptionTranscriptCorrectionCandidateWord {
  candidateWordId: string
  text: string
  startMilliseconds: number
  endMillisecondsExclusive: number
  confidenceBasisPoints: number
}

export interface CanonicalCaptionTranscriptCorrectionCandidateSegment {
  candidateSegmentId: string
  order: number
  startMilliseconds: number
  endMillisecondsExclusive: number
  text: string
  words: CanonicalCaptionTranscriptCorrectionCandidateWord[]
}

/**
 * A second ASR observation used only to prepare an independent listening
 * review. It is not ground truth and can never be projected as a canonical
 * transcript or correction artifact.
 */
export interface CanonicalCaptionTranscriptCorrectionCandidate {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_CANDIDATE_VERSION
  candidateId: string
  candidateDigestSha256: string
  candidateClass: CanonicalCaptionTranscriptCorrectionCandidateClass
  sourceMediaRef: CaptionDomainRef
  modelManifestRef: CaptionDomainRef
  languageCode: string
  segments: CanonicalCaptionTranscriptCorrectionCandidateSegment[]
  completeSourceMediaPresentedToRuntime: true
  actualOfflineAsrExecuted: true
  independentAudioTruth: false
  approvedForCorrection: false
  privateArtifact: true
  browserShareable: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  providerCallMade: false
  modelDownloadPerformed: false
  directPeerDispatchPerformed: false
  transcriptMutationAuthorityGrantedToCaption: false
  timingAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export type CanonicalCaptionTranscriptCorrectionReviewDiscrepancyCode =
  | 'source_low_confidence'
  | 'candidate_text_disagreement'
  | 'candidate_timing_disagreement'
  | 'candidate_gap'
  | 'product_or_brand_review_required'
  | 'claim_sensitive_number_review_required'
  | 'candidate_only_asr_not_audio_truth'

export interface CanonicalCaptionTranscriptCorrectionReviewObservation {
  candidateRef: CaptionDomainRef
  text: string
  startMilliseconds: number | null
  endMillisecondsExclusive: number | null
  candidateWordIds: string[]
}

export interface CanonicalCaptionTranscriptCorrectionReviewItem {
  sourceSegmentId: string
  order: number
  startMilliseconds: number
  endMillisecondsExclusive: number
  originalAsrText: string
  originalSourceWordIds: string[]
  originalMinimumConfidenceBasisPoints: number
  candidateObservations:
    CanonicalCaptionTranscriptCorrectionReviewObservation[]
  discrepancyCodes:
    CanonicalCaptionTranscriptCorrectionReviewDiscrepancyCode[]
  listenerCorrectedText: null
  listenerCorrectedWordTimings: []
  listenerDecision: 'pending'
}

export interface CanonicalCaptionTranscriptCorrectionReviewScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

/**
 * Private, media-byte-free listening worksheet. It deliberately stops before
 * the accepted correction and independent-review contracts. A later reviewer
 * must listen to the complete audio and produce those owner artifacts
 * separately.
 */
export interface CanonicalCaptionTranscriptCorrectionReviewPackage {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION
  packageId: string
  packageDigestSha256: string
  reviewScope: CanonicalCaptionTranscriptCorrectionReviewScope
  targetCanonicalReadScope: CaptionCanonicalTranscriptReadScope | null
  sourceMediaRef: CaptionDomainRef
  sourceTranscriptRef: CaptionDomainRef
  rejectedInspectionReceiptRef: CaptionDomainRef
  candidateRefs: CaptionDomainRef[]
  reviewItems: CanonicalCaptionTranscriptCorrectionReviewItem[]
  createdAt: string
  disposition: 'waiting_for_independent_audio_truth_review'
  blockingReasonCodes: [
    'complete_source_audio_listening_missing',
    'every_corrected_word_text_review_missing',
    'every_corrected_word_timing_review_missing',
    'proper_names_numbers_and_claim_review_missing',
  ]
  independentAudioTruthReviewRef: null
  correctionArtifactRef: null
  everySourceSegmentPackagedInOrder: true
  everyOriginalSourceWordIncluded: true
  candidateDisagreementPreserved: true
  asrCandidateTreatedAsGroundTruth: false
  completeSourceAudioListened: false
  correctedTranscriptApprovedForCanonicalOwnerProjection: false
  canonicalOwnerAdmissionAllowed: false
  privateArtifact: true
  browserShareable: false
  rawTranscriptTextIncluded: true
  rawChatIncluded: false
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
