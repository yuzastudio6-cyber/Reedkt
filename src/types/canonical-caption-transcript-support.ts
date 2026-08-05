import type {
  CaptionCanonicalTranscriptAuthenticatedReadBinding,
  CaptionCanonicalTranscriptReadScope,
} from './caption-canonical-transcript-authenticated-read'
import type {
  CaptionAlignmentQualification,
  CaptionCanonicalTranscript,
} from './caption-transcript-lineage'
import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_SOURCE_WORD_TIMING_EVIDENCE_VERSION =
  'canonical-caption-source-word-timing-evidence-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION =
  'canonical-caption-transcript-authenticated-evidence-record-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_READ_PORT_VERSION =
  'canonical-caption-transcript-authenticated-read-port-v1' as const

export interface CanonicalCaptionSourceWordTimingEvidenceWord {
  orderInSegment: number
  text: string
  startMilliseconds: number
  endMillisecondsExclusive: number
  confidenceBasisPoints: number
  speakerId: string | null
}

export interface CanonicalCaptionSourceWordTimingEvidenceSegment {
  sourceTranscriptSegmentId: string
  order: number
  startFrame: number
  endFrameExclusive: number
  startMilliseconds: number
  endMillisecondsExclusive: number
  text: string
  confidenceBasisPoints: number
  words: CanonicalCaptionSourceWordTimingEvidenceWord[]
}

/**
 * Private backend-owner projection of the exact word timestamps stored by the
 * canonical source-transcript worker. It is never a browser payload and does
 * not give Caption permission to transcribe, align, diarize, or mutate timing.
 */
export interface CanonicalCaptionSourceWordTimingEvidence {
  schemaVersion:
    typeof CANONICAL_CAPTION_SOURCE_WORD_TIMING_EVIDENCE_VERSION
  evidenceId: string
  evidenceDigestSha256: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  analysisRunId: string
  sourceSequenceItemId: string
  mediaAssetId: string
  uploadedOrder: number
  sourceChecksumSha256: string
  durationFrames: number
  fpsNumerator: number
  fpsDenominator: number
  sourceScopeDigestSha256: string
  sourceTranscriptAuthorityRef: {
    id: string
    version: number
    contentHash: string
  }
  sourceTranscriptDigestSha256: string
  languageCode: string
  wordTimingArtifactRef: CaptionDomainRef
  diarizationArtifactRef: CaptionDomainRef | null
  speakerDiarizationState: 'not_present' | 'complete'
  segments: CanonicalCaptionSourceWordTimingEvidenceSegment[]
  exactPrivateArtifactRereadVerified: true
  exactSourceScopeVerified: true
  exactTranscriptDigestVerified: true
  exactWordTimestampCoverageVerified: true
  asrNativeWordTiming: true
  privateArtifact: true
  browserShareable: false
  rawAudioIncluded: false
  rawChatIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  transcriptMutationAuthorityGranted: false
  timingAuthorityGranted: false
  runtimeOrDispatchAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionTranscriptAuthenticatedEvidenceRecord {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  sourceScopeDigestSha256: string
  sourceSpeechEvidenceProjectionRef: CaptionDomainRef
  sourceWordTimingEvidenceRefs: CaptionDomainRef[]
  alignmentQualification: CaptionAlignmentQualification
  canonicalTranscript: CaptionCanonicalTranscript
  authenticatedReadBinding:
    CaptionCanonicalTranscriptAuthenticatedReadBinding
  createdAt: string
  canonicalSourceTranscriptOwnerRereadVerified: true
  exactPrivateWordTimingRereadVerified: true
  exactSourceOrderAndScopeVerified: true
  exactSegmentAndWordLineageVerified: true
  exactApprovedSnapshotRereadVerified: true
  createOnlyPersistedAndReread: true
  singleCanonicalTranscriptVerified: true
  privateArtifact: true
  browserShareable: false
  rawAudioIncluded: false
  rawChatIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  directPeerDispatchPerformed: false
  providerCallPerformedByBridge: false
  transcriptRuntimePerformedByBridge: false
  transcriptMutationAuthorityGrantedToCaption: false
  timingAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  billingAuthorityGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionTranscriptAuthenticatedReadPort {
  schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_READ_PORT_VERSION
  readExact(input: {
    canonicalReadScope: CaptionCanonicalTranscriptReadScope
    canonicalTranscriptRef: CaptionDomainRef
    authenticatedReadBindingRef: CaptionDomainRef
  }): Promise<{
    canonicalTranscript: CaptionCanonicalTranscript
    authenticatedReadBinding:
      CaptionCanonicalTranscriptAuthenticatedReadBinding
  } | null>
}
