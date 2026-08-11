import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { CaptionPrivateWordTimingInput } from '../../src/types/caption-transcript-lineage'
import {
  createCanonicalSourceSpeechEvidencePackage,
  type CanonicalSourceSpeechEvidenceRecordDraft,
} from '../source-speech-evidence/canonical-source-speech-evidence-contract'
import {
  CAPTION_ALIGNMENT_QUALIFICATION,
  createCaptionCanonicalTranscript,
  createCaptionPhraseLineageProjection,
  parseCaptionAlignmentQualification,
  parseCaptionCanonicalTranscript,
  parseCaptionPhraseLineageProjection,
} from '../captions-specialist/caption-transcript-lineage'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function evidenceRef(id: string) {
  return { id, version: `${id}-v1`, contentHash: digest(id) }
}

const record: CanonicalSourceSpeechEvidenceRecordDraft = {
  sourceSequenceItemId: 'source.one',
  mediaAssetId: 'media.one',
  uploadedOrder: 1,
  sourceChecksumSha256: digest('source'),
  evidenceStatus: 'verified_speech',
  sourceAudioArtifact: {
    artifactId: 'audio.one',
    contentSha256: digest('audio'),
    contentType: 'audio/wav',
    byteLength: 1024,
  },
  sourceAudioExtractionEvidenceDigestSha256: digest('extraction'),
  transcriptArtifact: {
    artifactId: 'transcript.one',
    contentSha256: digest('transcript'),
    contentType: 'application/json',
    byteLength: 2048,
  },
  wordTimestampArtifact: {
    artifactId: 'words.one',
    contentSha256: digest('words'),
    contentType: 'application/json',
    byteLength: 2048,
  },
  transcriptionRuntime: {
    toolId: 'faster_whisper',
    modelWeightManifestId: 'faster.whisper.model',
    modelName: 'faster whisper multilingual',
    modelRevisionSha256: digest('model'),
    executionPlacement: 'google_cloud_run_gpu',
    device: 'cuda',
    cpuFallbackUsed: false,
    modelDownloadDuringRun: false,
    customerCreditReservationUsed: false,
    internalAnalysisBudgetAuthorityDigestSha256: digest('budget'),
    executionEvidenceDigestSha256: digest('runtime'),
  },
  transcriptQa: {
    status: 'passed',
    transcriptAlignmentPassed: true,
    humanReviewRequired: false,
    blockingIssueCount: 0,
    qaEvidenceDigestSha256: digest('qa'),
  },
  transcriptProjectionPolicy: {
    projectionClass: 'bounded_redacted_untrusted_source_transcript',
    sourceInstructionAuthority: false,
    rawTranscriptIncluded: false,
    sensitiveValueRedactionApplied: true,
    browserShareable: false,
  },
  speechAbsenceEvidenceDigestSha256: null,
  languageCode: 'en-US',
  coverageStartMilliseconds: 0,
  coverageEndMillisecondsExclusive: 3000,
  confidenceBasisPoints: 9400,
  segments: [{
    segmentId: 'segment.one',
    order: 1,
    startMilliseconds: 0,
    endMillisecondsExclusive: 2500,
    text: 'Ideas move through the frame',
    confidenceBasisPoints: 9400,
  }],
}
const sourcePackage = createCanonicalSourceSpeechEvidencePackage({
  status: 'available_for_preapproval_reasoning',
  sourceMode: 'uploaded_media',
  workspaceId: 'workspace.fixture',
  projectId: 'project.fixture',
  editSessionId: 'edit.fixture',
  sourceSequenceDigestSha256: digest('sequence'),
  evidenceSnapshotId: 'speech.snapshot.one',
  evidenceRevision: 1,
  ideaFirstAuthorityDigestSha256: null,
  evidenceRecords: [record],
})
const wordTimingArtifactRef = {
  id: record.wordTimestampArtifact!.artifactId,
  version: 'canonical-word-timestamp-artifact-v1',
  contentHash: record.wordTimestampArtifact!.contentSha256,
}
const asrWords: CaptionPrivateWordTimingInput = {
  sourceSequenceItemId: record.sourceSequenceItemId,
  wordTimingArtifactRef,
  words: [
    ['word.ideas', 'Ideas', 0, 400],
    ['word.move', 'move', 450, 800],
    ['word.through', 'through', 850, 1250],
    ['word.the', 'the', 1300, 1500],
    ['word.frame', 'frame', 1550, 2050],
  ].map(([sourceWordId, text, startMilliseconds, endMillisecondsExclusive], index) => ({
    sourceWordId: String(sourceWordId),
    sourceSegmentId: 'segment.one',
    orderInSegment: index + 1,
    text: String(text),
    startMilliseconds: Number(startMilliseconds),
    endMillisecondsExclusive: Number(endMillisecondsExclusive),
    confidenceBasisPoints: 9400,
    timestampProvenance: 'asr_native' as const,
    timestampEvidenceRef: wordTimingArtifactRef,
  })),
}

const transcript = createCaptionCanonicalTranscript({
  transcriptId: 'caption.transcript.one',
  sourceSpeechEvidencePackage: sourcePackage,
  wordTimingInputs: [asrWords],
})
check(transcript.immutable && transcript.singleCanonicalTranscript, 'Transcript must be immutable and singular.')
check(transcript.words.length === 5, 'Every exact source word must be retained.')
check(
  transcript.segments[0].exactSourceWordIds.join(',')
    === asrWords.words.map((word) => word.sourceWordId).join(','),
  'Segment must preserve exact ordered source-word lineage.',
)
check(
  !transcript.timingAuthorityClaimed && !transcript.browserShareable,
  'Transcript must remain private evidence without timing authority.',
)
check(
  CAPTION_ALIGNMENT_QUALIFICATION.routes.find((route) => route.routeId === 'faster_whisper')?.status
    === 'qualified',
  'Existing canonical Faster-Whisper source evidence route must be qualified.',
)
check(
  CAPTION_ALIGNMENT_QUALIFICATION.routes.find((route) => route.routeId === 'whisperx')?.status
    === 'blocked'
    && CAPTION_ALIGNMENT_QUALIFICATION.routes.find((route) => route.routeId === 'pyannote')?.status
      === 'blocked',
  'WhisperX and pyannote must remain honestly blocked without released runtime evidence.',
)

const phraseProjection = createCaptionPhraseLineageProjection({
  projectionId: 'caption.phrases.one',
  canonicalTranscript: transcript,
  phrases: [{
    phraseId: 'phrase.one',
    displayedText: 'Ideas move through the frame',
    transformation: 'exact',
    transformationApprovalRef: null,
    exactSourceWordIds: asrWords.words.map((word) => word.sourceWordId),
    requestedMotionMode: 'active_word',
    reviewReasons: [],
    reviewEvidenceRefs: [],
  }],
})
check(phraseProjection.phrases[0].phraseCaptionEligible, 'ASR-native phrase captions may be eligible.')
check(phraseProjection.phrases[0].activeWordMotionEligible, 'Qualified high-confidence ASR timing may support active-word motion.')
check(!phraseProjection.phrases[0].karaokeMotionEligible, 'Karaoke must require forced alignment.')
check(
  phraseProjection.finalWordMotionUsesSyntheticTiming === false
    && phraseProjection.finalKaraokeUsesUnforcedTiming === false,
  'Final motion gates must remain closed to synthetic or unforced timing.',
)

const syntheticWords = structuredClone(asrWords)
syntheticWords.words = syntheticWords.words.map((word) => ({
  ...word,
  timestampProvenance: 'synthetic_estimate' as const,
  timestampEvidenceRef: evidenceRef('synthetic.preview'),
}))
const syntheticTranscript = createCaptionCanonicalTranscript({
  transcriptId: 'caption.transcript.synthetic',
  sourceSpeechEvidencePackage: sourcePackage,
  wordTimingInputs: [syntheticWords],
})
const syntheticProjection = createCaptionPhraseLineageProjection({
  projectionId: 'caption.phrases.synthetic',
  canonicalTranscript: syntheticTranscript,
  phrases: [{
    phraseId: 'phrase.synthetic',
    displayedText: 'Ideas move',
    transformation: 'exact',
    transformationApprovalRef: null,
    exactSourceWordIds: ['word.ideas', 'word.move'],
    requestedMotionMode: 'active_word',
    reviewReasons: [],
    reviewEvidenceRefs: [],
  }],
})
check(
  syntheticProjection.phrases[0].syntheticTimingPreviewOnly
    && !syntheticProjection.phrases[0].phraseCaptionEligible
    && !syntheticProjection.phrases[0].activeWordMotionEligible,
  'Synthetic timing must remain blocking-preview only.',
)

const forcedWords = structuredClone(asrWords)
forcedWords.words = forcedWords.words.map((word) => ({
  ...word,
  timestampProvenance: 'forced_aligned' as const,
  timestampEvidenceRef: evidenceRef('whisperx.output'),
}))
expectThrow(() => createCaptionCanonicalTranscript({
  transcriptId: 'caption.transcript.forced.blocked',
  sourceSpeechEvidencePackage: sourcePackage,
  wordTimingInputs: [forcedWords],
}))

expectThrow(() => createCaptionCanonicalTranscript({
  transcriptId: 'caption.transcript.diarization.blocked',
  sourceSpeechEvidencePackage: sourcePackage,
  wordTimingInputs: [asrWords],
  diarizationInput: {
    diarizationArtifactRef: evidenceRef('pyannote.output'),
    speakerBySourceWordId: asrWords.words.map((word) => ({
      sourceWordId: word.sourceWordId,
      speakerId: 'speaker.one',
    })),
  },
}))

const lowConfidenceWords = structuredClone(asrWords)
lowConfidenceWords.words[0].confidenceBasisPoints = 7000
const lowConfidenceTranscript = createCaptionCanonicalTranscript({
  transcriptId: 'caption.transcript.low.confidence',
  sourceSpeechEvidencePackage: sourcePackage,
  wordTimingInputs: [lowConfidenceWords],
})
expectThrow(() => createCaptionPhraseLineageProjection({
  projectionId: 'caption.phrases.low.missing.review',
  canonicalTranscript: lowConfidenceTranscript,
  phrases: [{
    phraseId: 'phrase.low',
    displayedText: 'Ideas',
    transformation: 'exact',
    transformationApprovalRef: null,
    exactSourceWordIds: ['word.ideas'],
    requestedMotionMode: 'phrase',
    reviewReasons: [],
    reviewEvidenceRefs: [],
  }],
}))

const reviewedLow = createCaptionPhraseLineageProjection({
  projectionId: 'caption.phrases.low.reviewed',
  canonicalTranscript: lowConfidenceTranscript,
  phrases: [{
    phraseId: 'phrase.low.reviewed',
    displayedText: 'Ideas',
    transformation: 'exact',
    transformationApprovalRef: null,
    exactSourceWordIds: ['word.ideas'],
    requestedMotionMode: 'phrase',
    reviewReasons: ['low_confidence_speech'],
    reviewEvidenceRefs: [evidenceRef('review.low.confidence')],
  }],
})
check(
  !reviewedLow.phrases[0].activeWordMotionEligible,
  'Low-confidence reviewed words still cannot drive active-word motion.',
)

expectThrow(() => createCaptionPhraseLineageProjection({
  projectionId: 'caption.phrases.exact.changed',
  canonicalTranscript: transcript,
  phrases: [{
    phraseId: 'phrase.changed',
    displayedText: 'Different wording',
    transformation: 'exact',
    transformationApprovalRef: null,
    exactSourceWordIds: ['word.ideas', 'word.move'],
    requestedMotionMode: 'phrase',
    reviewReasons: [],
    reviewEvidenceRefs: [],
  }],
}))
expectThrow(() => createCaptionPhraseLineageProjection({
  projectionId: 'caption.phrases.noncontiguous',
  canonicalTranscript: transcript,
  phrases: [{
    phraseId: 'phrase.noncontiguous',
    displayedText: 'Ideas frame',
    transformation: 'condensed_without_meaning_change',
    transformationApprovalRef: evidenceRef('approval.transform'),
    exactSourceWordIds: ['word.ideas', 'word.frame'],
    requestedMotionMode: 'phrase',
    reviewReasons: [],
    reviewEvidenceRefs: [],
  }],
}))
expectThrow(() => createCaptionPhraseLineageProjection({
  projectionId: 'caption.phrases.condensed.unapproved',
  canonicalTranscript: transcript,
  phrases: [{
    phraseId: 'phrase.condensed',
    displayedText: 'Ideas move',
    transformation: 'condensed_without_meaning_change',
    transformationApprovalRef: null,
    exactSourceWordIds: ['word.ideas', 'word.move'],
    requestedMotionMode: 'phrase',
    reviewReasons: [],
    reviewEvidenceRefs: [],
  }],
}))

const duplicateWords = structuredClone(asrWords)
duplicateWords.words[1].sourceWordId = duplicateWords.words[0].sourceWordId
expectThrow(() => createCaptionCanonicalTranscript({
  transcriptId: 'caption.transcript.duplicate.words',
  sourceSpeechEvidencePackage: sourcePackage,
  wordTimingInputs: [duplicateWords],
}))
const wrongArtifact = structuredClone(asrWords)
wrongArtifact.wordTimingArtifactRef.contentHash = digest('wrong')
expectThrow(() => createCaptionCanonicalTranscript({
  transcriptId: 'caption.transcript.wrong.artifact',
  sourceSpeechEvidencePackage: sourcePackage,
  wordTimingInputs: [wrongArtifact],
}))

const tamperedTranscript = structuredClone(transcript)
tamperedTranscript.transcriptDigestSha256 = 'f'.repeat(64)
expectThrow(() => parseCaptionCanonicalTranscript(tamperedTranscript))
const transcriptWithUnknownField = structuredClone(transcript) as unknown as Record<string, unknown>
transcriptWithUnknownField.unexpectedField = false
transcriptWithUnknownField.transcriptDigestSha256 = calculateSkillContractDigest(
  transcriptWithUnknownField,
  'transcriptDigestSha256',
)
expectThrow(() => parseCaptionCanonicalTranscript(transcriptWithUnknownField))
const transcriptWithNestedUnknown = structuredClone(transcript) as unknown as {
  words: Array<Record<string, unknown>>
  transcriptDigestSha256: string
} & Record<string, unknown>
transcriptWithNestedUnknown.words[0].unexpectedField = 'closed-contract-refusal'
transcriptWithNestedUnknown.transcriptDigestSha256 = calculateSkillContractDigest(
  transcriptWithNestedUnknown,
  'transcriptDigestSha256',
)
expectThrow(() => parseCaptionCanonicalTranscript(transcriptWithNestedUnknown))
const transcriptWithInvalidOrder = structuredClone(transcript)
transcriptWithInvalidOrder.words[0].orderInSegment = 2
transcriptWithInvalidOrder.transcriptDigestSha256 = calculateSkillContractDigest(
  transcriptWithInvalidOrder as unknown as Record<string, unknown>,
  'transcriptDigestSha256',
)
expectThrow(() => parseCaptionCanonicalTranscript(transcriptWithInvalidOrder))
const tamperedProjection = structuredClone(phraseProjection)
tamperedProjection.projectionDigestSha256 = 'e'.repeat(64)
expectThrow(() => parseCaptionPhraseLineageProjection(tamperedProjection))
const projectionWithNestedUnknown = structuredClone(phraseProjection) as unknown as {
  phrases: Array<Record<string, unknown>>
  projectionDigestSha256: string
} & Record<string, unknown>
projectionWithNestedUnknown.phrases[0].unexpectedField = 'closed-contract-refusal'
projectionWithNestedUnknown.projectionDigestSha256 = calculateSkillContractDigest(
  projectionWithNestedUnknown,
  'projectionDigestSha256',
)
expectThrow(() => parseCaptionPhraseLineageProjection(projectionWithNestedUnknown))
const projectionWithSyntheticMotionOverclaim = structuredClone(syntheticProjection)
projectionWithSyntheticMotionOverclaim.phrases[0].activeWordMotionEligible = true
projectionWithSyntheticMotionOverclaim.projectionDigestSha256 = calculateSkillContractDigest(
  projectionWithSyntheticMotionOverclaim as unknown as Record<string, unknown>,
  'projectionDigestSha256',
)
expectThrow(() => parseCaptionPhraseLineageProjection(projectionWithSyntheticMotionOverclaim))
const tamperedQualification = structuredClone(CAPTION_ALIGNMENT_QUALIFICATION)
tamperedQualification.qualificationDigestSha256 = 'd'.repeat(64)
expectThrow(() => parseCaptionAlignmentQualification(tamperedQualification))

const productionClaim = structuredClone(CAPTION_ALIGNMENT_QUALIFICATION) as unknown as Record<string, unknown>
productionClaim.productionQualificationClaimed = true
productionClaim.qualificationDigestSha256 = calculateSkillContractDigest(
  productionClaim,
  'qualificationDigestSha256',
)
expectThrow(() => parseCaptionAlignmentQualification(productionClaim))

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  milestone: 'CAP-04',
  canonicalSegmentCount: transcript.segments.length,
  canonicalWordCount: transcript.words.length,
  phraseCount: phraseProjection.phrases.length,
  assertions,
  fasterWhisperRoute: 'qualified',
  whisperXRoute: 'blocked',
  pyannoteRoute: 'blocked',
  syntheticFinalWordMotionAllowed: false,
  productionQualificationClaimed: false,
  runtimeStarted: false,
}, null, 2)}\n`)
