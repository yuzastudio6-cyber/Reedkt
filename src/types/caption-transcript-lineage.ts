import type { CaptionDomainRef } from './caption-domain-contracts'

export const CAPTION_CANONICAL_TRANSCRIPT_VERSION =
  'caption-canonical-transcript-v1' as const
export const CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION =
  'caption-phrase-lineage-projection-v1' as const
export const CAPTION_ALIGNMENT_QUALIFICATION_VERSION =
  'caption-alignment-qualification-v1' as const

export type CaptionTimestampProvenance =
  | 'asr_native'
  | 'forced_aligned'
  | 'manually_corrected'
  | 'synthetic_estimate'

export type CaptionTextTransformation =
  | 'exact'
  | 'punctuation_cleanup'
  | 'filler_omission'
  | 'condensed_without_meaning_change'
  | 'translated'
  | 'paraphrase_requires_approval'

export interface CaptionAlignmentQualificationRoute {
  routeId: 'faster_whisper' | 'whisperx' | 'pyannote'
  status: 'qualified' | 'blocked' | 'disabled'
  qualifiedUses: Array<
    | 'segment_transcription'
    | 'asr_native_word_timing'
    | 'forced_word_alignment'
    | 'speaker_diarization'
  >
  releaseRef: CaptionDomainRef | null
  evidenceRefs: CaptionDomainRef[]
  blockerCodes: string[]
  observedAt: string
}

export interface CaptionAlignmentQualification {
  schemaVersion: typeof CAPTION_ALIGNMENT_QUALIFICATION_VERSION
  qualificationId: string
  qualificationDigestSha256: string
  routes: CaptionAlignmentQualificationRoute[]
  productionQualificationClaimed: false
}

export interface CaptionCanonicalTranscriptWord {
  sourceWordId: string
  sourceSegmentId: string
  sourceSequenceItemId: string
  orderInSegment: number
  text: string
  startMilliseconds: number
  endMillisecondsExclusive: number
  confidenceBasisPoints: number
  timestampProvenance: CaptionTimestampProvenance
  wordTimingArtifactRef: CaptionDomainRef
  timestampEvidenceRef: CaptionDomainRef
  speakerId: string | null
  diarizationArtifactRef: CaptionDomainRef | null
}

export interface CaptionPrivateWordTimingInput {
  sourceSequenceItemId: string
  wordTimingArtifactRef: CaptionDomainRef
  words: Array<{
    sourceWordId: string
    sourceSegmentId: string
    orderInSegment: number
    text: string
    startMilliseconds: number
    endMillisecondsExclusive: number
    confidenceBasisPoints: number
    timestampProvenance: CaptionTimestampProvenance
    timestampEvidenceRef: CaptionDomainRef
  }>
}

export interface CaptionPrivateDiarizationInput {
  diarizationArtifactRef: CaptionDomainRef
  speakerBySourceWordId: Array<{
    sourceWordId: string
    speakerId: string
  }>
}

export interface CaptionPhraseDraft {
  phraseId: string
  displayedText: string
  transformation: CaptionTextTransformation
  transformationApprovalRef: CaptionDomainRef | null
  exactSourceWordIds: string[]
  requestedMotionMode: 'phrase' | 'active_word' | 'karaoke'
  reviewReasons: CaptionReviewReason[]
  reviewEvidenceRefs: CaptionDomainRef[]
}

export interface CaptionCanonicalTranscriptSegment {
  sourceSegmentId: string
  sourceSequenceItemId: string
  order: number
  startMilliseconds: number
  endMillisecondsExclusive: number
  text: string
  confidenceBasisPoints: number
  exactSourceWordIds: string[]
  sourceRecordRef: CaptionDomainRef
}

export interface CaptionCanonicalTranscript {
  schemaVersion: typeof CAPTION_CANONICAL_TRANSCRIPT_VERSION
  transcriptId: string
  transcriptDigestSha256: string
  workspaceId: string
  projectId: string
  editSessionId: string
  languageCode: string
  sourceSpeechEvidencePackageRef: CaptionDomainRef
  alignmentQualificationRef: CaptionDomainRef
  segments: CaptionCanonicalTranscriptSegment[]
  words: CaptionCanonicalTranscriptWord[]
  immutable: true
  singleCanonicalTranscript: true
  rawChatIncluded: false
  browserShareable: false
  privateArtifact: true
  timingAuthorityClaimed: false
}

export type CaptionReviewReason =
  | 'proper_name'
  | 'organization'
  | 'date'
  | 'number'
  | 'price_or_currency'
  | 'measurement'
  | 'quotation'
  | 'allegation_or_claim'
  | 'possible_missing_negation'
  | 'low_confidence_speech'

export interface CaptionPhraseLineage {
  phraseId: string
  displayedText: string
  transformation: CaptionTextTransformation
  transformationApprovalRef: CaptionDomainRef | null
  sourceSegmentIds: string[]
  exactSourceWordIds: string[]
  startMilliseconds: number
  endMillisecondsExclusive: number
  timestampProvenance: CaptionTimestampProvenance
  confidenceBasisPoints: number
  reviewReasons: CaptionReviewReason[]
  reviewEvidenceRefs: CaptionDomainRef[]
  phraseCaptionEligible: boolean
  activeWordMotionEligible: boolean
  karaokeMotionEligible: boolean
  syntheticTimingPreviewOnly: boolean
}

export interface CaptionPhraseLineageProjection {
  schemaVersion: typeof CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION
  projectionId: string
  projectionDigestSha256: string
  canonicalTranscriptRef: CaptionDomainRef
  alignmentQualificationRef: CaptionDomainRef
  phrases: CaptionPhraseLineage[]
  everyPhraseHasExactSourceLineage: true
  finalWordMotionUsesSyntheticTiming: false
  finalKaraokeUsesUnforcedTiming: false
  privateArtifact: true
  executionAuthorityClaimed: false
}
