import type { CaptionDomainRef } from './caption-domain-contracts'

export const CAPTION_PRIVATE_LOCAL_TRANSCRIPT_EXECUTION_EVIDENCE_VERSION =
  'caption-private-local-transcript-execution-evidence-v1' as const
export const CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION =
  'caption-private-transcript-direct-inspection-receipt-v1' as const
export const CAPTION_PRIVATE_TRANSCRIPT_RUNTIME_QUALIFICATION_VERSION =
  'caption-private-transcript-runtime-qualification-v1' as const

export interface CaptionPrivateLocalTranscriptExecutionEvidence {
  schemaVersion:
    typeof CAPTION_PRIVATE_LOCAL_TRANSCRIPT_EXECUTION_EVIDENCE_VERSION
  evidenceId: string
  evidenceDigestSha256: string
  sourceMediaRef: CaptionDomainRef
  sourceProbeRef: CaptionDomainRef
  sourceByteLength: number
  sourceDurationMilliseconds: number
  sourceWidth: number
  sourceHeight: number
  sourceAudioStreamCount: number
  reviewedRuntimeRef: CaptionDomainRef
  modelManifestRef: CaptionDomainRef
  privateTranscriptArtifactRef: CaptionDomainRef
  privateWordTimingArtifactRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  alignmentQualificationRef: CaptionDomainRef
  languageCode: string
  segmentCount: number
  wordCount: number
  minimumConfidenceBasisPoints: number
  lowConfidenceWordCount: number
  runtimePlacement: 'local_cpu_private_internal'
  actualPrivateMediaBytesProcessed: true
  actualFasterWhisperPackageExecuted: true
  actualAsrNativeWordTimestampsProduced: true
  completeSourceMediaPresentedToRuntime: true
  speechSegmentsMayOmitSilence: true
  exactSourceWordLineageVerified: true
  singleImmutableCaptionTranscriptCreated: true
  modelDownloadPerformed: false
  networkAccessRequired: false
  canonicalGpuTranscriptOwnerClaimed: false
  authenticatedCanonicalOwnerReadClaimed: false
  whisperXExecutionClaimed: false
  pyannoteExecutionClaimed: false
  rawTranscriptTextIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  privateInternalHarnessOnly: true
  providerCallMade: false
  directPeerDispatchPerformed: false
  timingAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export type CaptionPrivateTranscriptInspectionDefectCode =
  | 'product_or_brand_name_misrecognition'
  | 'semantic_phrase_garbling'
  | 'excessive_low_confidence_word_density'
  | 'claim_sensitive_term_not_independently_verified'
  | 'non_monotonic_word_timing'
  | 'empty_or_zero_duration_word'

interface CaptionPrivateTranscriptInspectionReceiptBase {
  schemaVersion: typeof CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION
  inspectionId: string
  inspectionDigestSha256: string
  observedAt: string
  executionEvidenceRef: CaptionDomainRef
  privateTranscriptArtifactRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  independentGroundTruthReviewRef: CaptionDomainRef | null
  inspectedSegmentCount: number
  inspectedWordTimingSampleCount: number
  sampledSourceWordIds: string[]
  observedLowConfidenceWordCount: number
  observedLowConfidenceWordRatioBasisPoints: number
  visibleDefectCodes: CaptionPrivateTranscriptInspectionDefectCode[]
  transcriptTextOpenedAndRead: true
  everyTranscriptSegmentInspected: true
  firstMiddleLastWordTimingInspected: true
  coherentEnglishSpeechObserved: true
  expectedTopicEvidenceObserved: true
  placeholderOrFixtureSpeechObserved: false
  nonMonotonicTimestampObserved: false
  emptyOrZeroDurationWordObserved: false
  transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified: boolean
  directAudioListeningAccuracyVerified: boolean
  semanticMeaningSafeForCaptionProjection: boolean
  properNamesAndClaimSensitiveTermsVerified: boolean
  finalPhraseProjectionAllowed: boolean
  manualCorrectionOrCanonicalOwnerRequired: boolean
  inspectionScope:
    | 'private_transcript_text_and_sampled_asr_timing_not_independent_audio_truth'
    | 'private_transcript_text_timing_and_independent_audio_truth'
  rawTranscriptTextIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  browserLocalCompletionAccepted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionPrivateTranscriptAcceptedInspectionReceipt extends
  CaptionPrivateTranscriptInspectionReceiptBase {
  independentGroundTruthReviewRef: CaptionDomainRef
  disposition: 'accepted_private_text_timing_and_independent_audio_truth'
  transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified: true
  directAudioListeningAccuracyVerified: true
  semanticMeaningSafeForCaptionProjection: true
  properNamesAndClaimSensitiveTermsVerified: true
  finalPhraseProjectionAllowed: true
  manualCorrectionOrCanonicalOwnerRequired: false
  inspectionScope: 'private_transcript_text_timing_and_independent_audio_truth'
  visibleDefectCodes: []
}

export interface CaptionPrivateTranscriptRejectedInspectionReceipt extends
  CaptionPrivateTranscriptInspectionReceiptBase {
  independentGroundTruthReviewRef: null
  disposition: 'rejected_requires_reviewed_correction_or_canonical_owner'
  transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified: false
  directAudioListeningAccuracyVerified: false
  semanticMeaningSafeForCaptionProjection: false
  properNamesAndClaimSensitiveTermsVerified: false
  finalPhraseProjectionAllowed: false
  manualCorrectionOrCanonicalOwnerRequired: true
  inspectionScope:
    'private_transcript_text_and_sampled_asr_timing_not_independent_audio_truth'
  visibleDefectCodes: [
    CaptionPrivateTranscriptInspectionDefectCode,
    ...CaptionPrivateTranscriptInspectionDefectCode[],
  ]
}

export type CaptionPrivateTranscriptInspectionReceipt =
  | CaptionPrivateTranscriptAcceptedInspectionReceipt
  | CaptionPrivateTranscriptRejectedInspectionReceipt

export interface CaptionPrivateTranscriptRuntimeQualification {
  schemaVersion:
    typeof CAPTION_PRIVATE_TRANSCRIPT_RUNTIME_QUALIFICATION_VERSION
  qualificationId: string
  qualificationDigestSha256: string
  executionEvidenceRef: CaptionDomainRef
  inspectionReceiptRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  phraseLineageProjectionRef: CaptionDomainRef
  privateTranscriptArtifactRef: CaptionDomainRef
  privateWordTimingArtifactRef: CaptionDomainRef
  sourceMediaRef: CaptionDomainRef
  actualRealMediaTranscriptionQualified: true
  actualAsrNativeWordLineageQualified: true
  exactPhraseProjectionFromOneCanonicalTranscriptQualified: true
  directTranscriptTextAndSampledTimingInspectionQualified: true
  fasterWhisperPrivateInternalRouteQualified: true
  canonicalGpuTranscriptOwnerIntegrated: false
  authenticatedCanonicalOwnerReadIntegrated: false
  independentAudioTruthReviewComplete: true
  whisperXQualified: false
  pyannoteQualified: false
  remainingGateCodes: Array<
    | 'canonical_gpu_transcript_owner_real_media_evidence_missing'
    | 'authenticated_canonical_transcript_owner_read_missing'
    | 'whisperx_not_qualified'
    | 'pyannote_not_qualified'
  >
  privateInternalOnly: true
  captionTranscriptOwnerCreated: false
  directPeerDispatchPerformed: false
  providerCallMade: false
  timingAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
