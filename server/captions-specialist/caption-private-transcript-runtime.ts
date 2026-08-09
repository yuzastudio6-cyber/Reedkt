import { z } from 'zod'

import {
  CAPTION_PRIVATE_LOCAL_TRANSCRIPT_EXECUTION_EVIDENCE_VERSION,
  CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION,
  CAPTION_PRIVATE_TRANSCRIPT_RUNTIME_QUALIFICATION_VERSION,
  type CaptionPrivateLocalTranscriptExecutionEvidence,
  type CaptionPrivateTranscriptInspectionDefectCode,
  type CaptionPrivateTranscriptInspectionReceipt,
  type CaptionPrivateTranscriptRuntimeQualification,
} from '../../src/types/caption-private-transcript-runtime'
import {
  CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionAlignmentQualification,
  type CaptionCanonicalTranscript,
  type CaptionPhraseDraft,
  type CaptionPhraseLineageProjection,
  type CaptionReviewReason,
} from '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type {
  TranscriptArtifactPayload,
  WordTimestampArtifactPayload,
} from '../workers/speech'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCaptionPhraseLineageProjection,
  parseCaptionAlignmentQualification,
  parseCaptionCanonicalTranscript,
  parseCaptionPhraseLineageProjection,
} from './caption-transcript-lineage'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const unsafeTextPattern =
  /https?:\/\/|file:\/\/|\/(?:Users|Volumes|home|private\/tmp|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+/iu

const executionEvidenceSchema:
z.ZodType<CaptionPrivateLocalTranscriptExecutionEvidence> = z.object({
  schemaVersion: z.literal(
    CAPTION_PRIVATE_LOCAL_TRANSCRIPT_EXECUTION_EVIDENCE_VERSION),
  evidenceId: safeKey,
  evidenceDigestSha256: sha256,
  sourceMediaRef: refSchema,
  sourceProbeRef: refSchema,
  sourceByteLength: z.number().int().positive().max(4 * 1024 ** 3),
  sourceDurationMilliseconds: z.number().int().positive()
    .max(24 * 60 * 60 * 1_000),
  sourceWidth: z.number().int().positive().max(8_192),
  sourceHeight: z.number().int().positive().max(8_192),
  sourceAudioStreamCount: z.number().int().positive().max(32),
  reviewedRuntimeRef: refSchema,
  modelManifestRef: refSchema,
  privateTranscriptArtifactRef: refSchema,
  privateWordTimingArtifactRef: refSchema,
  canonicalTranscriptRef: refSchema,
  alignmentQualificationRef: refSchema,
  languageCode: safeKey,
  segmentCount: z.number().int().positive().max(20_000),
  wordCount: z.number().int().positive().max(1_000_000),
  minimumConfidenceBasisPoints: z.number().int().min(0).max(10_000),
  lowConfidenceWordCount: z.number().int().nonnegative().max(1_000_000),
  runtimePlacement: z.literal('local_cpu_private_internal'),
  actualPrivateMediaBytesProcessed: z.literal(true),
  actualFasterWhisperPackageExecuted: z.literal(true),
  actualAsrNativeWordTimestampsProduced: z.literal(true),
  completeSourceMediaPresentedToRuntime: z.literal(true),
  speechSegmentsMayOmitSilence: z.literal(true),
  exactSourceWordLineageVerified: z.literal(true),
  singleImmutableCaptionTranscriptCreated: z.literal(true),
  modelDownloadPerformed: z.literal(false),
  networkAccessRequired: z.literal(false),
  canonicalGpuTranscriptOwnerClaimed: z.literal(false),
  authenticatedCanonicalOwnerReadClaimed: z.literal(false),
  whisperXExecutionClaimed: z.literal(false),
  pyannoteExecutionClaimed: z.literal(false),
  rawTranscriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  privateInternalHarnessOnly: z.literal(true),
  providerCallMade: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  timingAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.lowConfidenceWordCount > value.wordCount
    || value.reviewedRuntimeRef.version !==
      'edit-reference-reviewed-local-faster-whisper-runtime-v1'
    || value.modelManifestRef.version !==
      'reeditpro-internal-testing-faster-whisper-model-v1'
    || value.privateTranscriptArtifactRef.version !==
      'caption-private-transcript-payload-v1'
    || value.privateWordTimingArtifactRef.version !==
      'caption-private-word-timing-payload-v1'
    || value.canonicalTranscriptRef.version !==
      CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || value.alignmentQualificationRef.version !==
      CAPTION_ALIGNMENT_QUALIFICATION_VERSION) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Caption private transcript execution lineage is invalid.',
    })
  }
})

const transcriptInspectionDefectCodeSchema = z.enum([
  'product_or_brand_name_misrecognition',
  'semantic_phrase_garbling',
  'excessive_low_confidence_word_density',
  'claim_sensitive_term_not_independently_verified',
  'non_monotonic_word_timing',
  'empty_or_zero_duration_word',
] satisfies [CaptionPrivateTranscriptInspectionDefectCode,
  ...CaptionPrivateTranscriptInspectionDefectCode[]])

const inspectionReceiptBaseSchema = z.object({
  schemaVersion: z.literal(
    CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION),
  inspectionId: safeKey,
  inspectionDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  executionEvidenceRef: refSchema,
  privateTranscriptArtifactRef: refSchema,
  canonicalTranscriptRef: refSchema,
  independentGroundTruthReviewRef: refSchema.nullable(),
  inspectedSegmentCount: z.number().int().positive().max(20_000),
  inspectedWordTimingSampleCount: z.literal(3),
  sampledSourceWordIds: z.array(safeKey).length(3),
  observedLowConfidenceWordCount: z.number().int().nonnegative().max(1_000_000),
  observedLowConfidenceWordRatioBasisPoints:
    z.number().int().min(0).max(10_000),
  visibleDefectCodes: z.array(transcriptInspectionDefectCodeSchema)
    .max(6),
  transcriptTextOpenedAndRead: z.literal(true),
  everyTranscriptSegmentInspected: z.literal(true),
  firstMiddleLastWordTimingInspected: z.literal(true),
  coherentEnglishSpeechObserved: z.literal(true),
  expectedTopicEvidenceObserved: z.literal(true),
  placeholderOrFixtureSpeechObserved: z.literal(false),
  nonMonotonicTimestampObserved: z.literal(false),
  emptyOrZeroDurationWordObserved: z.literal(false),
  rawTranscriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const acceptedInspectionReceiptSchema = inspectionReceiptBaseSchema.extend({
  independentGroundTruthReviewRef: refSchema,
  visibleDefectCodes: z.tuple([]),
  transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified:
    z.literal(true),
  directAudioListeningAccuracyVerified: z.literal(true),
  semanticMeaningSafeForCaptionProjection: z.literal(true),
  properNamesAndClaimSensitiveTermsVerified: z.literal(true),
  finalPhraseProjectionAllowed: z.literal(true),
  manualCorrectionOrCanonicalOwnerRequired: z.literal(false),
  inspectionScope: z.literal(
    'private_transcript_text_timing_and_independent_audio_truth'),
  disposition: z.literal(
    'accepted_private_text_timing_and_independent_audio_truth'),
}).strict()

const rejectedInspectionReceiptSchema = inspectionReceiptBaseSchema.extend({
  independentGroundTruthReviewRef: z.null(),
  visibleDefectCodes: z.tuple([
    transcriptInspectionDefectCodeSchema,
  ]).rest(transcriptInspectionDefectCodeSchema),
  transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified:
    z.literal(false),
  directAudioListeningAccuracyVerified: z.literal(false),
  semanticMeaningSafeForCaptionProjection: z.literal(false),
  properNamesAndClaimSensitiveTermsVerified: z.literal(false),
  finalPhraseProjectionAllowed: z.literal(false),
  manualCorrectionOrCanonicalOwnerRequired: z.literal(true),
  inspectionScope: z.literal(
    'private_transcript_text_and_sampled_asr_timing_not_independent_audio_truth'),
  disposition: z.literal(
    'rejected_requires_reviewed_correction_or_canonical_owner'),
}).strict()

const inspectionReceiptSchema = z.discriminatedUnion('disposition', [
  acceptedInspectionReceiptSchema,
  rejectedInspectionReceiptSchema,
]).superRefine((value, context) => {
  if (new Set(value.sampledSourceWordIds).size !== 3
    || new Set(value.visibleDefectCodes).size !== value.visibleDefectCodes.length
    || value.executionEvidenceRef.version !==
      CAPTION_PRIVATE_LOCAL_TRANSCRIPT_EXECUTION_EVIDENCE_VERSION
    || value.privateTranscriptArtifactRef.version !==
      'caption-private-transcript-payload-v1'
    || value.canonicalTranscriptRef.version !==
      CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || (value.disposition ===
        'accepted_private_text_timing_and_independent_audio_truth'
      && value.independentGroundTruthReviewRef.version !==
        'caption-private-independent-audio-truth-review-v1')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Caption private transcript inspection lineage is invalid.',
    })
  }
})

const remainingGateCodes = [
  'canonical_gpu_transcript_owner_real_media_evidence_missing',
  'authenticated_canonical_transcript_owner_read_missing',
  'whisperx_not_qualified',
  'pyannote_not_qualified',
] as const

const qualificationSchema:
z.ZodType<CaptionPrivateTranscriptRuntimeQualification> = z.object({
  schemaVersion: z.literal(
    CAPTION_PRIVATE_TRANSCRIPT_RUNTIME_QUALIFICATION_VERSION),
  qualificationId: safeKey,
  qualificationDigestSha256: sha256,
  executionEvidenceRef: refSchema,
  inspectionReceiptRef: refSchema,
  canonicalTranscriptRef: refSchema,
  phraseLineageProjectionRef: refSchema,
  privateTranscriptArtifactRef: refSchema,
  privateWordTimingArtifactRef: refSchema,
  sourceMediaRef: refSchema,
  actualRealMediaTranscriptionQualified: z.literal(true),
  actualAsrNativeWordLineageQualified: z.literal(true),
  exactPhraseProjectionFromOneCanonicalTranscriptQualified: z.literal(true),
  directTranscriptTextAndSampledTimingInspectionQualified: z.literal(true),
  fasterWhisperPrivateInternalRouteQualified: z.literal(true),
  canonicalGpuTranscriptOwnerIntegrated: z.literal(false),
  authenticatedCanonicalOwnerReadIntegrated: z.literal(false),
  independentAudioTruthReviewComplete: z.literal(true),
  whisperXQualified: z.literal(false),
  pyannoteQualified: z.literal(false),
  remainingGateCodes: z.tuple([
    z.literal(remainingGateCodes[0]),
    z.literal(remainingGateCodes[1]),
    z.literal(remainingGateCodes[2]),
    z.literal(remainingGateCodes[3]),
  ]),
  privateInternalOnly: z.literal(true),
  captionTranscriptOwnerCreated: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallMade: z.literal(false),
  timingAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export function createCaptionPrivateLocalAlignmentQualification(input: {
  qualificationId: string
  reviewedRuntimeRef: CaptionDomainRef
  wordTimingArtifactRef: CaptionDomainRef
  observedAt: string
}): CaptionAlignmentQualification {
  const withoutDigest: Omit<
    CaptionAlignmentQualification,
    'qualificationDigestSha256'
  > = {
    schemaVersion: CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
    qualificationId: safeKey.parse(input.qualificationId),
    routes: [{
      routeId: 'faster_whisper',
      status: 'qualified',
      qualifiedUses: ['segment_transcription', 'asr_native_word_timing'],
      releaseRef: refSchema.parse(input.reviewedRuntimeRef),
      evidenceRefs: [refSchema.parse(input.reviewedRuntimeRef),
        refSchema.parse(input.wordTimingArtifactRef)],
      blockerCodes: [],
      observedAt: z.string().datetime({ offset: true }).parse(input.observedAt),
    }, {
      routeId: 'whisperx',
      status: 'blocked',
      qualifiedUses: [],
      releaseRef: null,
      evidenceRefs: [],
      blockerCodes: ['no_private_whisperx_qualification_evidence'],
      observedAt: input.observedAt,
    }, {
      routeId: 'pyannote',
      status: 'blocked',
      qualifiedUses: [],
      releaseRef: null,
      evidenceRefs: [],
      blockerCodes: ['no_private_pyannote_qualification_evidence'],
      observedAt: input.observedAt,
    }],
    productionQualificationClaimed: false,
  }
  return parseCaptionAlignmentQualification({
    ...withoutDigest,
    qualificationDigestSha256: digest({
      ...withoutDigest,
      qualificationDigestSha256: '',
    }, 'qualificationDigestSha256'),
  })
}

export function createCaptionPrivateInternalCanonicalTranscript(input: {
  transcriptId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  sourceSequenceItemId: string
  sourceSpeechEvidenceRef: CaptionDomainRef
  wordTimingArtifactRef: CaptionDomainRef
  timestampEvidenceRef: CaptionDomainRef
  alignmentQualification: unknown
  transcript: TranscriptArtifactPayload
  wordTimestamps: WordTimestampArtifactPayload
}): CaptionCanonicalTranscript {
  assertClosedContractTree(input.alignmentQualification,
    'Caption private alignment qualification')
  const qualification = parseCaptionAlignmentQualification(
    input.alignmentQualification)
  const sourceSequenceItemId = safeKey.parse(input.sourceSequenceItemId)
  const transcriptWords = input.transcript.segments.flatMap(
    (segment) => segment.words)
  if (input.transcript.modelInfo.toolId !== 'faster_whisper'
    || input.transcript.segments.length === 0
    || transcriptWords.length === 0
    || input.wordTimestamps.words.length !== transcriptWords.length
    || input.wordTimestamps.sourceAudioArtifactId !==
      input.transcript.sourceAudioArtifactId) {
    throw new Error('Caption private transcript runtime output is incomplete.')
  }
  for (const [index, word] of input.wordTimestamps.words.entries()) {
    const transcriptWord = transcriptWords[index]
    if (!transcriptWord
      || word.word !== transcriptWord.word
      || word.segmentId !== transcriptWord.segmentId
      || word.startSeconds !== transcriptWord.startSeconds
      || word.endSeconds !== transcriptWord.endSeconds) {
      throw new Error('Caption private transcript and word artifacts diverge.')
    }
  }
  const sourceSpeechEvidenceRef = refSchema.parse(input.sourceSpeechEvidenceRef)
  const wordTimingArtifactRef = refSchema.parse(input.wordTimingArtifactRef)
  const timestampEvidenceRef = refSchema.parse(input.timestampEvidenceRef)
  const segments: CaptionCanonicalTranscript['segments'] = []
  const words: CaptionCanonicalTranscript['words'] = []
  const sourceSegmentIds = new Set<string>()
  for (const [segmentIndex, segment] of input.transcript.segments.entries()) {
    const sourceSegmentId = safeKey.parse(
      `caption.private.segment.${segmentIndex + 1}`)
    if (sourceSegmentIds.has(sourceSegmentId)
      || segment.endSeconds <= segment.startSeconds
      || segment.words.length === 0) {
      throw new Error('Caption private transcript segment is invalid.')
    }
    sourceSegmentIds.add(sourceSegmentId)
    const segmentStart = Math.max(0, Math.floor(segment.startSeconds * 1_000))
    const segmentEnd = Math.max(segmentStart + 1,
      Math.ceil(segment.endSeconds * 1_000))
    const exactSourceWordIds: string[] = []
    let previousWordEnd = segmentStart
    for (const [wordIndex, word] of segment.words.entries()) {
      const text = word.word.trim()
      let start = Math.max(segmentStart, Math.round(word.startSeconds * 1_000))
      let end = Math.min(segmentEnd, Math.round(word.endSeconds * 1_000))
      if (start < previousWordEnd && previousWordEnd - start <= 2) {
        start = previousWordEnd
      }
      if (end <= start && start < segmentEnd) end = start + 1
      if (!text || start < previousWordEnd || end <= start || end > segmentEnd) {
        throw new Error('Caption private ASR word timing is invalid.')
      }
      const sourceWordId = safeKey.parse(
        `caption.private.word.${segmentIndex + 1}.${wordIndex + 1}`)
      exactSourceWordIds.push(sourceWordId)
      const confidenceBasisPoints = confidenceToBasisPoints(
        word.confidence ?? segment.confidence ?? input.transcript.confidence)
      words.push({
        sourceWordId,
        sourceSegmentId,
        sourceSequenceItemId,
        orderInSegment: wordIndex + 1,
        text,
        startMilliseconds: start,
        endMillisecondsExclusive: end,
        confidenceBasisPoints,
        timestampProvenance: 'asr_native',
        wordTimingArtifactRef,
        timestampEvidenceRef,
        speakerId: null,
        diarizationArtifactRef: null,
      })
      previousWordEnd = end
    }
    segments.push({
      sourceSegmentId,
      sourceSequenceItemId,
      order: segmentIndex + 1,
      startMilliseconds: segmentStart,
      endMillisecondsExclusive: segmentEnd,
      text: segment.text.trim(),
      confidenceBasisPoints: confidenceToBasisPoints(
        segment.confidence ?? input.transcript.confidence),
      exactSourceWordIds,
      sourceRecordRef: sourceSpeechEvidenceRef,
    })
  }
  const withoutDigest: Omit<CaptionCanonicalTranscript,
  'transcriptDigestSha256'> = {
    schemaVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    transcriptId: safeKey.parse(input.transcriptId),
    workspaceId: safeKey.parse(input.workspaceId),
    projectId: safeKey.parse(input.projectId),
    editSessionId: safeKey.parse(input.editSessionId),
    languageCode: safeKey.parse(input.transcript.language ?? 'en'),
    sourceSpeechEvidencePackageRef: sourceSpeechEvidenceRef,
    alignmentQualificationRef: qualificationRef(qualification),
    segments,
    words,
    immutable: true,
    singleCanonicalTranscript: true,
    rawChatIncluded: false,
    browserShareable: false,
    privateArtifact: true,
    timingAuthorityClaimed: false,
  }
  return parseCaptionCanonicalTranscript({
    ...withoutDigest,
    transcriptDigestSha256: digest({
      ...withoutDigest,
      transcriptDigestSha256: '',
    }, 'transcriptDigestSha256'),
  })
}

export function createCaptionPrivateInternalPhraseProjection(input: {
  projectionId: string
  canonicalTranscript: unknown
  alignmentQualification: unknown
  inspectionReceipt: unknown
}): CaptionPhraseLineageProjection {
  const transcript = parseCaptionCanonicalTranscript(input.canonicalTranscript)
  const inspection = parseCaptionPrivateTranscriptInspectionReceipt(
    input.inspectionReceipt)
  if (inspection.disposition !==
      'accepted_private_text_timing_and_independent_audio_truth'
    || !inspection.finalPhraseProjectionAllowed
    || !exactRef(inspection.canonicalTranscriptRef, {
      id: transcript.transcriptId,
      version: transcript.schemaVersion,
      contentHash: transcript.transcriptDigestSha256,
    })) {
    throw new Error(
      'Caption private phrase projection requires accepted transcript truth.')
  }
  const inspectionReceiptRef = inspectionRef(inspection)
  const phrases: CaptionPhraseDraft[] = []
  for (const segment of transcript.segments) {
    for (let index = 0; index < segment.exactSourceWordIds.length; index += 7) {
      const exactSourceWordIds = segment.exactSourceWordIds.slice(index, index + 7)
      const phraseWords = exactSourceWordIds.map((wordId) => {
        const word = transcript.words.find((item) => item.sourceWordId === wordId)
        if (!word) throw new Error('Caption private phrase lost source lineage.')
        return word
      })
      const displayedText = phraseWords.map((word) => word.text).join(' ')
      const confidence = Math.min(...phraseWords.map(
        (word) => word.confidenceBasisPoints))
      const reviewReasons = deriveReviewReasons(displayedText, confidence)
      phrases.push({
        phraseId: `caption.private.phrase.${phrases.length + 1}`,
        displayedText,
        transformation: 'exact',
        transformationApprovalRef: null,
        exactSourceWordIds,
        requestedMotionMode: confidence >= 8_000 ? 'active_word' : 'phrase',
        reviewReasons,
        reviewEvidenceRefs: reviewReasons.length > 0
          ? [inspectionReceiptRef] : [],
      })
    }
  }
  return createCaptionPhraseLineageProjection({
    projectionId: input.projectionId,
    canonicalTranscript: transcript,
    alignmentQualification: input.alignmentQualification,
    phrases,
  })
}

export function createCaptionPrivateLocalTranscriptExecutionEvidence(
  input: Omit<CaptionPrivateLocalTranscriptExecutionEvidence,
  'schemaVersion' | 'evidenceDigestSha256'>,
): CaptionPrivateLocalTranscriptExecutionEvidence {
  const withoutDigest = {
    schemaVersion: CAPTION_PRIVATE_LOCAL_TRANSCRIPT_EXECUTION_EVIDENCE_VERSION,
    ...input,
  }
  return parseCaptionPrivateLocalTranscriptExecutionEvidence({
    ...withoutDigest,
    evidenceDigestSha256: digest({
      ...withoutDigest,
      evidenceDigestSha256: '',
    }, 'evidenceDigestSha256'),
  })
}

export function parseCaptionPrivateLocalTranscriptExecutionEvidence(
  value: unknown,
): CaptionPrivateLocalTranscriptExecutionEvidence {
  return parseDigestContract(value, executionEvidenceSchema,
    'evidenceDigestSha256', 'Caption private transcript execution evidence')
}

export function createCaptionPrivateTranscriptInspectionReceipt(
  input: Omit<CaptionPrivateTranscriptInspectionReceipt,
  'schemaVersion' | 'inspectionDigestSha256'>,
): CaptionPrivateTranscriptInspectionReceipt {
  const withoutDigest = {
    schemaVersion: CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION,
    ...input,
  }
  return parseCaptionPrivateTranscriptInspectionReceipt({
    ...withoutDigest,
    inspectionDigestSha256: digest({
      ...withoutDigest,
      inspectionDigestSha256: '',
    }, 'inspectionDigestSha256'),
  })
}

export function parseCaptionPrivateTranscriptInspectionReceipt(
  value: unknown,
): CaptionPrivateTranscriptInspectionReceipt {
  return parseDigestContract(value, inspectionReceiptSchema,
    'inspectionDigestSha256', 'Caption private transcript inspection receipt')
}

export function createCaptionPrivateTranscriptRuntimeQualification(input: {
  qualificationId: string
  executionEvidence: unknown
  inspectionReceipt: unknown
  phraseLineageProjection: unknown
}): CaptionPrivateTranscriptRuntimeQualification {
  const execution = parseCaptionPrivateLocalTranscriptExecutionEvidence(
    input.executionEvidence)
  const inspection = parseCaptionPrivateTranscriptInspectionReceipt(
    input.inspectionReceipt)
  if (!exactRef(inspection.executionEvidenceRef, evidenceRef(execution))
    || !exactRef(inspection.privateTranscriptArtifactRef,
      execution.privateTranscriptArtifactRef)
    || !exactRef(inspection.canonicalTranscriptRef,
      execution.canonicalTranscriptRef)) {
    throw new Error('Caption private transcript inspection crossed execution.')
  }
  const expectedLowConfidenceRatio = Math.round(
    (execution.lowConfidenceWordCount / execution.wordCount) * 10_000)
  if (inspection.observedLowConfidenceWordCount !==
      execution.lowConfidenceWordCount
    || inspection.observedLowConfidenceWordRatioBasisPoints !==
      expectedLowConfidenceRatio) {
    throw new Error('Caption private transcript inspection counts diverged.')
  }
  if (inspection.disposition !==
      'accepted_private_text_timing_and_independent_audio_truth'
    || !inspection.finalPhraseProjectionAllowed) {
    throw new Error('Rejected Caption transcript cannot qualify phrases.')
  }
  const phraseLineage = parseCaptionPhraseLineageProjection(
    input.phraseLineageProjection)
  if (!exactRef(phraseLineage.canonicalTranscriptRef,
    execution.canonicalTranscriptRef)) {
    throw new Error('Caption private phrase projection crossed transcript.')
  }
  const withoutDigest: Omit<CaptionPrivateTranscriptRuntimeQualification,
  'schemaVersion' | 'qualificationDigestSha256'> = {
    qualificationId: safeKey.parse(input.qualificationId),
    executionEvidenceRef: evidenceRef(execution),
    inspectionReceiptRef: inspectionRef(inspection),
    canonicalTranscriptRef: execution.canonicalTranscriptRef,
    phraseLineageProjectionRef: {
      id: phraseLineage.projectionId,
      version: phraseLineage.schemaVersion,
      contentHash: phraseLineage.projectionDigestSha256,
    },
    privateTranscriptArtifactRef: execution.privateTranscriptArtifactRef,
    privateWordTimingArtifactRef: execution.privateWordTimingArtifactRef,
    sourceMediaRef: execution.sourceMediaRef,
    actualRealMediaTranscriptionQualified: true,
    actualAsrNativeWordLineageQualified: true,
    exactPhraseProjectionFromOneCanonicalTranscriptQualified: true,
    directTranscriptTextAndSampledTimingInspectionQualified: true,
    fasterWhisperPrivateInternalRouteQualified: true,
    canonicalGpuTranscriptOwnerIntegrated: false,
    authenticatedCanonicalOwnerReadIntegrated: false,
    independentAudioTruthReviewComplete: true,
    whisperXQualified: false,
    pyannoteQualified: false,
    remainingGateCodes: [...remainingGateCodes],
    privateInternalOnly: true,
    captionTranscriptOwnerCreated: false,
    directPeerDispatchPerformed: false,
    providerCallMade: false,
    timingAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const contract = {
    schemaVersion: CAPTION_PRIVATE_TRANSCRIPT_RUNTIME_QUALIFICATION_VERSION,
    ...withoutDigest,
  }
  return parseCaptionPrivateTranscriptRuntimeQualification({
    ...contract,
    qualificationDigestSha256: digest({
      ...contract,
      qualificationDigestSha256: '',
    }, 'qualificationDigestSha256'),
  })
}

export function parseCaptionPrivateTranscriptRuntimeQualification(
  value: unknown,
): CaptionPrivateTranscriptRuntimeQualification {
  return parseDigestContract(value, qualificationSchema,
    'qualificationDigestSha256',
    'Caption private transcript runtime qualification')
}

function deriveReviewReasons(
  text: string,
  confidenceBasisPoints: number,
): CaptionReviewReason[] {
  const reasons: CaptionReviewReason[] = []
  if (/[$€£¥]|\b(?:usd|eur|gbp|cad|aud)\b/iu.test(text)) {
    reasons.push('price_or_currency')
  } else if (/\d/u.test(text)) reasons.push('number')
  if (/['“”"]/u.test(text)) reasons.push('quotation')
  if (confidenceBasisPoints < 8_000) reasons.push('low_confidence_speech')
  return reasons
}

function confidenceToBasisPoints(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0
  const normalized = value < 0 ? Math.exp(value) : value
  return Math.max(0, Math.min(10_000, Math.round(normalized * 10_000)))
}

function qualificationRef(
  qualification: CaptionAlignmentQualification,
): CaptionDomainRef {
  return {
    id: qualification.qualificationId,
    version: qualification.schemaVersion,
    contentHash: qualification.qualificationDigestSha256,
  }
}

function evidenceRef(
  evidence: CaptionPrivateLocalTranscriptExecutionEvidence,
): CaptionDomainRef {
  return {
    id: evidence.evidenceId,
    version: evidence.schemaVersion,
    contentHash: evidence.evidenceDigestSha256,
  }
}

function inspectionRef(
  inspection: CaptionPrivateTranscriptInspectionReceipt,
): CaptionDomainRef {
  return {
    id: inspection.inspectionId,
    version: inspection.schemaVersion,
    contentHash: inspection.inspectionDigestSha256,
  }
}

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function digest(value: Record<string, unknown>, field: string): string {
  return calculateSkillContractDigest(value, field)
}

function parseDigestContract<T>(
  value: unknown,
  schema: z.ZodType<T>,
  digestField: string,
  label: string,
): T {
  assertClosedContractTree(value, label)
  assertNoUnsafeText(value, label)
  const parsed = schema.parse(value)
  const record = parsed as unknown as Record<string, unknown>
  if (record[digestField] !== digest(record, digestField)) {
    throw new Error(`${label} digest verification failed.`)
  }
  return structuredClone(parsed)
}

function assertNoUnsafeText(value: unknown, label: string): void {
  const stack = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string' && unsafeTextPattern.test(current)) {
      throw new Error(`${label} contains path, URL, or credential-shaped text.`)
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}
