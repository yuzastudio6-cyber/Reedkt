import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION,
  type CaptionAlignmentQualification,
  type CaptionCanonicalTranscript,
  type CaptionPhraseDraft,
  type CaptionPhraseLineageProjection,
  type CaptionPrivateDiarizationInput,
  type CaptionPrivateWordTimingInput,
  type CaptionReviewReason,
  type CaptionTimestampProvenance,
} from '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  verifyCanonicalSourceSpeechEvidencePackage,
  type CanonicalSourceSpeechEvidencePackage,
} from '../source-speech-evidence/canonical-source-speech-evidence-contract'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)

function hasUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 8
      || codePoint === 11
      || codePoint === 12
      || (codePoint >= 14 && codePoint <= 31)
      || codePoint === 127
  })
}

const safeText = z.string().min(1).max(4_000)
  .refine((value) => !hasUnsafeControlCharacter(value))
  .refine((value) => !/(?:https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/)/iu.test(value))
  .refine((value) => !/(?:api[_-]?key|authorization:\s*bearer|private[_-]?key|secret[_-]?key)/iu.test(value))
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const provenanceSchema = z.enum([
  'asr_native', 'forced_aligned', 'manually_corrected', 'synthetic_estimate',
])
const reviewReasonSchema = z.enum([
  'proper_name', 'organization', 'date', 'number', 'price_or_currency',
  'measurement', 'quotation', 'allegation_or_claim',
  'possible_missing_negation', 'low_confidence_speech',
])
const transformationSchema = z.enum([
  'exact', 'punctuation_cleanup', 'filler_omission',
  'condensed_without_meaning_change', 'translated',
  'paraphrase_requires_approval',
])

const qualificationSchema: z.ZodType<CaptionAlignmentQualification> = z.object({
  schemaVersion: z.literal(CAPTION_ALIGNMENT_QUALIFICATION_VERSION),
  qualificationId: safeKey,
  qualificationDigestSha256: sha256,
  routes: z.array(z.object({
    routeId: z.enum(['faster_whisper', 'whisperx', 'pyannote']),
    status: z.enum(['qualified', 'blocked', 'disabled']),
    qualifiedUses: z.array(z.enum([
      'segment_transcription', 'asr_native_word_timing',
      'forced_word_alignment', 'speaker_diarization',
    ])).max(4),
    releaseRef: refSchema.nullable(),
    evidenceRefs: z.array(refSchema).max(128),
    blockerCodes: z.array(safeKey).max(64),
    observedAt: z.string().datetime({ offset: true }),
  }).strict()).length(3),
  productionQualificationClaimed: z.literal(false),
}).strict().superRefine((qualification, context) => {
  const routes = new Map(qualification.routes.map((route) => [route.routeId, route]))
  if (routes.size !== 3
    || !routes.has('faster_whisper')
    || !routes.has('whisperx')
    || !routes.has('pyannote')) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Alignment routes must be exact and unique.' })
  }
  for (const route of qualification.routes) {
    if (route.status === 'qualified'
      && (route.releaseRef === null || route.evidenceRefs.length === 0
        || route.qualifiedUses.length === 0 || route.blockerCodes.length > 0)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Qualified route ${route.routeId} lacks evidence.` })
    }
    if (route.status !== 'qualified'
      && (route.qualifiedUses.length > 0 || route.blockerCodes.length === 0)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Blocked route ${route.routeId} has inconsistent claims.` })
    }
  }
})

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

const defaultQualificationWithoutDigest: Omit<
  CaptionAlignmentQualification,
  'qualificationDigestSha256'
> = {
  schemaVersion: CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
  qualificationId: 'captions.alignment.qualification.cap04',
  routes: [{
    routeId: 'faster_whisper',
    status: 'qualified',
    qualifiedUses: ['segment_transcription', 'asr_native_word_timing'],
    releaseRef: {
      id: 'canonical.faster_whisper.gpu.runtime',
      version: 'canonical-faster-whisper-gpu-runtime-contract-v1',
      contentHash: sha256Text('canonical-faster-whisper-gpu-runtime-contract-v1'),
    },
    evidenceRefs: [{
      id: 'canonical.faster_whisper.gpu.runtime.smoke',
      version: 'canonical-faster-whisper-gpu-runtime-evidence-v1',
      contentHash: sha256Text('canonical-faster-whisper-gpu-runtime-evidence-v1'),
    }],
    blockerCodes: [],
    observedAt: '2026-08-04T00:00:00.000Z',
  }, {
    routeId: 'whisperx',
    status: 'blocked',
    qualifiedUses: [],
    releaseRef: null,
    evidenceRefs: [],
    blockerCodes: ['no_released_whisperx_runtime_contract'],
    observedAt: '2026-08-04T00:00:00.000Z',
  }, {
    routeId: 'pyannote',
    status: 'blocked',
    qualifiedUses: [],
    releaseRef: null,
    evidenceRefs: [],
    blockerCodes: ['no_released_pyannote_runtime_contract'],
    observedAt: '2026-08-04T00:00:00.000Z',
  }],
  productionQualificationClaimed: false,
}

export function parseCaptionAlignmentQualification(
  value: unknown,
): CaptionAlignmentQualification {
  assertClosedContractTree(value, 'Caption alignment qualification')
  const parsed = qualificationSchema.parse(value)
  const expected = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'qualificationDigestSha256',
  )
  if (expected !== parsed.qualificationDigestSha256) {
    throw new Error('Caption alignment qualification digest verification failed.')
  }
  return parsed
}

export const CAPTION_ALIGNMENT_QUALIFICATION =
  parseCaptionAlignmentQualification({
    ...defaultQualificationWithoutDigest,
    qualificationDigestSha256: calculateSkillContractDigest(
      { ...defaultQualificationWithoutDigest, qualificationDigestSha256: '' },
      'qualificationDigestSha256',
    ),
  })

function qualificationRef(
  qualification: CaptionAlignmentQualification,
): CaptionDomainRef {
  return {
    id: qualification.qualificationId,
    version: qualification.schemaVersion,
    contentHash: qualification.qualificationDigestSha256,
  }
}

const wordInputSchema: z.ZodType<CaptionPrivateWordTimingInput> = z.object({
  sourceSequenceItemId: safeKey,
  wordTimingArtifactRef: refSchema,
  words: z.array(z.object({
    sourceWordId: safeKey,
    sourceSegmentId: safeKey,
    orderInSegment: z.number().int().positive().max(100_000),
    text: safeText,
    startMilliseconds: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
    endMillisecondsExclusive: z.number().int().positive().max(24 * 60 * 60 * 1_000),
    confidenceBasisPoints: z.number().int().min(0).max(10_000),
    timestampProvenance: provenanceSchema,
    timestampEvidenceRef: refSchema,
  }).strict()).max(1_000_000),
}).strict()

const diarizationInputSchema: z.ZodType<CaptionPrivateDiarizationInput> = z.object({
  diarizationArtifactRef: refSchema,
  speakerBySourceWordId: z.array(z.object({
    sourceWordId: safeKey,
    speakerId: safeKey,
  }).strict()).max(1_000_000),
}).strict()

const transcriptSegmentSchema = z.object({
  sourceSegmentId: safeKey,
  sourceSequenceItemId: safeKey,
  order: z.number().int().positive().max(1_000_000),
  startMilliseconds: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive().max(24 * 60 * 60 * 1_000),
  text: safeText,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  exactSourceWordIds: z.array(safeKey).min(1).max(1_000_000),
  sourceRecordRef: refSchema,
}).strict()

const transcriptWordSchema = z.object({
  sourceWordId: safeKey,
  sourceSegmentId: safeKey,
  sourceSequenceItemId: safeKey,
  orderInSegment: z.number().int().positive().max(1_000_000),
  text: safeText,
  startMilliseconds: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive().max(24 * 60 * 60 * 1_000),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  timestampProvenance: provenanceSchema,
  wordTimingArtifactRef: refSchema,
  timestampEvidenceRef: refSchema,
  speakerId: safeKey.nullable(),
  diarizationArtifactRef: refSchema.nullable(),
}).strict()

const canonicalTranscriptSchema: z.ZodType<CaptionCanonicalTranscript> = z.object({
  schemaVersion: z.literal(CAPTION_CANONICAL_TRANSCRIPT_VERSION),
  transcriptId: safeKey,
  transcriptDigestSha256: sha256,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  languageCode: safeKey,
  sourceSpeechEvidencePackageRef: refSchema,
  alignmentQualificationRef: refSchema,
  segments: z.array(transcriptSegmentSchema).min(1).max(1_000_000),
  words: z.array(transcriptWordSchema).min(1).max(1_000_000),
  immutable: z.literal(true),
  singleCanonicalTranscript: z.literal(true),
  rawChatIncluded: z.literal(false),
  browserShareable: z.literal(false),
  privateArtifact: z.literal(true),
  timingAuthorityClaimed: z.literal(false),
}).strict()

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function routeQualified(
  qualification: CaptionAlignmentQualification,
  routeId: 'faster_whisper' | 'whisperx' | 'pyannote',
  use: CaptionAlignmentQualification['routes'][number]['qualifiedUses'][number],
): boolean {
  const route = qualification.routes.find((item) => item.routeId === routeId)
  return route?.status === 'qualified' && route.qualifiedUses.includes(use)
}

function recordRef(record: {
  sourceSequenceItemId: string
  recordDigestSha256: string
}): CaptionDomainRef {
  return {
    id: `source.speech.${record.sourceSequenceItemId}`,
    version: 'canonical-source-speech-evidence-record-v1',
    contentHash: record.recordDigestSha256,
  }
}

export function createCaptionCanonicalTranscript(input: {
  transcriptId: string
  sourceSpeechEvidencePackage: unknown
  wordTimingInputs: unknown[]
  alignmentQualification?: unknown
  diarizationInput?: unknown
}): CaptionCanonicalTranscript {
  assertClosedContractTree(input, 'Caption canonical transcript input')
  const sourcePackage: CanonicalSourceSpeechEvidencePackage =
    verifyCanonicalSourceSpeechEvidencePackage(input.sourceSpeechEvidencePackage)
  if (sourcePackage.status !== 'available_for_preapproval_reasoning') {
    throw new Error('Caption transcript requires verified source speech evidence.')
  }
  const qualification = parseCaptionAlignmentQualification(
    input.alignmentQualification ?? CAPTION_ALIGNMENT_QUALIFICATION,
  )
  const wordInputs = input.wordTimingInputs.map((item) => wordInputSchema.parse(item))
  const wordInputBySource = new Map(
    wordInputs.map((item) => [item.sourceSequenceItemId, item]),
  )
  if (wordInputBySource.size !== wordInputs.length) {
    throw new Error('Caption word timing inputs must be unique by source item.')
  }
  const speechRecords = sourcePackage.evidenceRecords.filter(
    (record) => record.evidenceStatus === 'verified_speech',
  )
  if (speechRecords.length === 0) throw new Error('Caption transcript has no verified speech.')
  const languages = new Set(speechRecords.map((record) => record.languageCode))
  if (languages.size !== 1 || languages.has(null)) {
    throw new Error('Caption canonical transcript requires one exact language projection.')
  }
  const diarization = input.diarizationInput === undefined
    ? null
    : diarizationInputSchema.parse(input.diarizationInput)
  if (diarization !== null
    && !routeQualified(qualification, 'pyannote', 'speaker_diarization')) {
    throw new Error('Speaker diarization is not qualified by the current route evidence.')
  }
  const speakerByWord = new Map(
    diarization?.speakerBySourceWordId.map((item) => [item.sourceWordId, item.speakerId]) ?? [],
  )
  if (speakerByWord.size
    !== (diarization?.speakerBySourceWordId.length ?? 0)) {
    throw new Error('Diarization contains duplicate source word IDs.')
  }

  const segments: CaptionCanonicalTranscript['segments'] = []
  const words: CaptionCanonicalTranscript['words'] = []
  const globalWordIds = new Set<string>()
  for (const record of speechRecords) {
    const wordInput = wordInputBySource.get(record.sourceSequenceItemId)
    if (!wordInput || !record.wordTimestampArtifact) {
      throw new Error(`Missing word timing input for ${record.sourceSequenceItemId}.`)
    }
    if (wordInput.wordTimingArtifactRef.id !== record.wordTimestampArtifact.artifactId
      || wordInput.wordTimingArtifactRef.contentHash
        !== record.wordTimestampArtifact.contentSha256) {
      throw new Error('Caption word timing artifact lineage mismatch.')
    }
    const sourceSegments = new Map(record.segments.map((segment) => [segment.segmentId, segment]))
    const wordsBySegment = new Map<string, typeof wordInput.words>()
    for (const word of wordInput.words) {
      if (globalWordIds.has(word.sourceWordId)) {
        throw new Error(`Duplicate canonical source word ID ${word.sourceWordId}.`)
      }
      globalWordIds.add(word.sourceWordId)
      const segment = sourceSegments.get(word.sourceSegmentId)
      if (!segment || word.startMilliseconds < segment.startMilliseconds
        || word.endMillisecondsExclusive > segment.endMillisecondsExclusive
        || word.endMillisecondsExclusive <= word.startMilliseconds) {
        throw new Error(`Canonical word ${word.sourceWordId} is outside its source segment.`)
      }
      if (word.timestampProvenance === 'asr_native'
        && !routeQualified(qualification, 'faster_whisper', 'asr_native_word_timing')) {
        throw new Error('ASR-native timing is not qualified.')
      }
      if (word.timestampProvenance === 'forced_aligned'
        && !routeQualified(qualification, 'whisperx', 'forced_word_alignment')) {
        throw new Error('Forced alignment is not qualified.')
      }
      const existing = wordsBySegment.get(word.sourceSegmentId) ?? []
      wordsBySegment.set(word.sourceSegmentId, [...existing, word])
    }
    for (const segment of record.segments) {
      const segmentWords = wordsBySegment.get(segment.segmentId) ?? []
      if (segmentWords.length === 0) {
        throw new Error(`Segment ${segment.segmentId} lacks exact word lineage.`)
      }
      let priorEnd = segment.startMilliseconds
      for (const [index, word] of segmentWords.entries()) {
        if (word.orderInSegment !== index + 1 || word.startMilliseconds < priorEnd) {
          throw new Error(`Word order or timing is invalid in ${segment.segmentId}.`)
        }
        priorEnd = word.endMillisecondsExclusive
        words.push({
          ...word,
          sourceSequenceItemId: record.sourceSequenceItemId,
          wordTimingArtifactRef: wordInput.wordTimingArtifactRef,
          speakerId: speakerByWord.get(word.sourceWordId) ?? null,
          diarizationArtifactRef: diarization?.diarizationArtifactRef ?? null,
        })
      }
      segments.push({
        sourceSegmentId: segment.segmentId,
        sourceSequenceItemId: record.sourceSequenceItemId,
        order: segments.length + 1,
        startMilliseconds: segment.startMilliseconds,
        endMillisecondsExclusive: segment.endMillisecondsExclusive,
        text: segment.text,
        confidenceBasisPoints: segment.confidenceBasisPoints,
        exactSourceWordIds: segmentWords.map((word) => word.sourceWordId),
        sourceRecordRef: recordRef(record),
      })
    }
  }
  if (speakerByWord.size > 0
    && words.some((word) => word.speakerId === null)) {
    throw new Error('Diarization must cover every canonical source word.')
  }
  const withoutDigest: Omit<CaptionCanonicalTranscript, 'transcriptDigestSha256'> = {
    schemaVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    transcriptId: safeKey.parse(input.transcriptId),
    workspaceId: sourcePackage.workspaceId,
    projectId: sourcePackage.projectId,
    editSessionId: sourcePackage.editSessionId,
    languageCode: speechRecords[0].languageCode!,
    sourceSpeechEvidencePackageRef: {
      id: sourcePackage.evidenceSnapshotId,
      version: sourcePackage.contractVersion,
      contentHash: sourcePackage.contractDigestSha256,
    },
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
    transcriptDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, transcriptDigestSha256: '' },
      'transcriptDigestSha256',
    ),
  })
}

function assertTranscriptSemantics(transcript: CaptionCanonicalTranscript): void {
  const segmentIds = new Set<string>()
  const wordIds = new Set<string>()
  const wordsById = new Map(transcript.words.map((word) => [word.sourceWordId, word]))
  if (wordsById.size !== transcript.words.length) throw new Error('Duplicate transcript word ID.')
  for (const [segmentIndex, segment] of transcript.segments.entries()) {
    if (segmentIds.has(segment.sourceSegmentId)) throw new Error('Duplicate transcript segment ID.')
    if (segment.order !== segmentIndex + 1
      || segment.endMillisecondsExclusive <= segment.startMilliseconds
      || new Set(segment.exactSourceWordIds).size !== segment.exactSourceWordIds.length) {
      throw new Error('Transcript segment ordering or timing is invalid.')
    }
    segmentIds.add(segment.sourceSegmentId)
    let previousWordEnd = segment.startMilliseconds
    for (const [wordIndex, wordId] of segment.exactSourceWordIds.entries()) {
      const word = wordsById.get(wordId)
      if (!word
        || word.sourceSegmentId !== segment.sourceSegmentId
        || word.sourceSequenceItemId !== segment.sourceSequenceItemId
        || word.orderInSegment !== wordIndex + 1
        || word.startMilliseconds < previousWordEnd
        || word.endMillisecondsExclusive <= word.startMilliseconds
        || word.startMilliseconds < segment.startMilliseconds
        || word.endMillisecondsExclusive > segment.endMillisecondsExclusive
        || (word.speakerId === null) !== (word.diarizationArtifactRef === null)
        || wordIds.has(wordId)) {
        throw new Error('Transcript segment-word lineage is invalid.')
      }
      previousWordEnd = word.endMillisecondsExclusive
      wordIds.add(wordId)
    }
  }
  if (wordIds.size !== transcript.words.length) {
    throw new Error('Canonical transcript contains an unbound word.')
  }
}

export function parseCaptionCanonicalTranscript(value: unknown): CaptionCanonicalTranscript {
  assertClosedContractTree(value, 'Caption canonical transcript')
  const transcript = canonicalTranscriptSchema.parse(value)
  assertTranscriptSemantics(transcript)
  const expected = calculateSkillContractDigest(
    transcript as unknown as Record<string, unknown>,
    'transcriptDigestSha256',
  )
  if (expected !== transcript.transcriptDigestSha256) {
    throw new Error('Caption canonical transcript digest verification failed.')
  }
  return transcript
}

const phraseDraftSchema: z.ZodType<CaptionPhraseDraft> = z.object({
  phraseId: safeKey,
  displayedText: safeText,
  transformation: transformationSchema,
  transformationApprovalRef: refSchema.nullable(),
  exactSourceWordIds: z.array(safeKey).min(1).max(256),
  requestedMotionMode: z.enum(['phrase', 'active_word', 'karaoke']),
  reviewReasons: z.array(reviewReasonSchema).max(10),
  reviewEvidenceRefs: z.array(refSchema).max(64),
}).strict()

const phraseLineageSchema = z.object({
  phraseId: safeKey,
  displayedText: safeText,
  transformation: transformationSchema,
  transformationApprovalRef: refSchema.nullable(),
  sourceSegmentIds: z.array(safeKey).min(1).max(256),
  exactSourceWordIds: z.array(safeKey).min(1).max(256),
  startMilliseconds: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive().max(24 * 60 * 60 * 1_000),
  timestampProvenance: provenanceSchema,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  reviewReasons: z.array(reviewReasonSchema).max(10),
  reviewEvidenceRefs: z.array(refSchema).max(64),
  phraseCaptionEligible: z.boolean(),
  activeWordMotionEligible: z.boolean(),
  karaokeMotionEligible: z.boolean(),
  syntheticTimingPreviewOnly: z.boolean(),
}).strict()

const phraseProjectionSchema: z.ZodType<CaptionPhraseLineageProjection> = z.object({
  schemaVersion: z.literal(CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION),
  projectionId: safeKey,
  projectionDigestSha256: sha256,
  canonicalTranscriptRef: refSchema,
  alignmentQualificationRef: refSchema,
  phrases: z.array(phraseLineageSchema).min(1).max(100_000),
  everyPhraseHasExactSourceLineage: z.literal(true),
  finalWordMotionUsesSyntheticTiming: z.literal(false),
  finalKaraokeUsesUnforcedTiming: z.literal(false),
  privateArtifact: z.literal(true),
  executionAuthorityClaimed: z.literal(false),
}).strict()

function derivedReviewReasons(text: string, confidence: number): CaptionReviewReason[] {
  const reasons: CaptionReviewReason[] = []
  if (/[$€£¥]|\b(?:usd|eur|gbp|cad|aud)\b/iu.test(text)) reasons.push('price_or_currency')
  else if (/\d/u.test(text)) reasons.push('number')
  if (/['“”"]/u.test(text)) reasons.push('quotation')
  if (confidence < 8_000) reasons.push('low_confidence_speech')
  return reasons
}

function phraseProvenance(
  provenances: CaptionTimestampProvenance[],
): CaptionTimestampProvenance {
  if (provenances.includes('synthetic_estimate')) return 'synthetic_estimate'
  if (provenances.includes('manually_corrected')) return 'manually_corrected'
  if (provenances.includes('forced_aligned')) return 'forced_aligned'
  return 'asr_native'
}

export function createCaptionPhraseLineageProjection(input: {
  projectionId: string
  canonicalTranscript: unknown
  alignmentQualification?: unknown
  phrases: unknown[]
}): CaptionPhraseLineageProjection {
  assertClosedContractTree(input, 'Caption phrase lineage input')
  const transcript = parseCaptionCanonicalTranscript(input.canonicalTranscript)
  const qualification = parseCaptionAlignmentQualification(
    input.alignmentQualification ?? CAPTION_ALIGNMENT_QUALIFICATION,
  )
  if (!exactRef(transcript.alignmentQualificationRef, qualificationRef(qualification))) {
    throw new Error('Caption phrase projection qualification does not match transcript lineage.')
  }
  const wordsById = new Map(transcript.words.map((word, index) => [
    word.sourceWordId, { word, index },
  ]))
  const phraseIds = new Set<string>()
  const phrases = input.phrases.map((raw) => {
    const draft = phraseDraftSchema.parse(raw)
    if (phraseIds.has(draft.phraseId)) throw new Error('Duplicate Caption phrase ID.')
    phraseIds.add(draft.phraseId)
    const entries = draft.exactSourceWordIds.map((id) => {
      const entry = wordsById.get(id)
      if (!entry) throw new Error(`Phrase ${draft.phraseId} references unknown source word ${id}.`)
      return entry
    })
    for (let index = 1; index < entries.length; index += 1) {
      if (entries[index].index !== entries[index - 1].index + 1) {
        throw new Error(`Phrase ${draft.phraseId} source words are not contiguous.`)
      }
    }
    const confidence = Math.min(...entries.map((entry) => entry.word.confidenceBasisPoints))
    const provenance = phraseProvenance(entries.map((entry) => entry.word.timestampProvenance))
    const transformationNeedsApproval = [
      'filler_omission', 'condensed_without_meaning_change', 'translated',
      'paraphrase_requires_approval',
    ].includes(draft.transformation)
    if (transformationNeedsApproval !== (draft.transformationApprovalRef !== null)) {
      throw new Error(`Phrase ${draft.phraseId} transformation approval lineage is invalid.`)
    }
    const exactText = entries.map((entry) => entry.word.text).join(' ')
    if (draft.transformation === 'exact' && draft.displayedText !== exactText) {
      throw new Error(`Exact phrase ${draft.phraseId} changed source wording.`)
    }
    const requiredReviews = derivedReviewReasons(draft.displayedText, confidence)
    if (requiredReviews.some((reason) => !draft.reviewReasons.includes(reason))) {
      throw new Error(`Phrase ${draft.phraseId} omits a required review reason.`)
    }
    if ((draft.reviewReasons.length > 0) !== (draft.reviewEvidenceRefs.length > 0)) {
      throw new Error(`Phrase ${draft.phraseId} review evidence is incomplete.`)
    }
    const activeWordQualified = provenance === 'asr_native'
      ? routeQualified(qualification, 'faster_whisper', 'asr_native_word_timing')
      : provenance === 'forced_aligned'
        ? routeQualified(qualification, 'whisperx', 'forced_word_alignment')
        : provenance === 'manually_corrected'
    const activeWordMotionEligible = provenance !== 'synthetic_estimate'
      && confidence >= 8_000 && activeWordQualified
    const karaokeMotionEligible = provenance === 'forced_aligned'
      && confidence >= 9_000
      && routeQualified(qualification, 'whisperx', 'forced_word_alignment')
    return {
      phraseId: draft.phraseId,
      displayedText: draft.displayedText,
      transformation: draft.transformation,
      transformationApprovalRef: draft.transformationApprovalRef,
      sourceSegmentIds: Array.from(new Set(entries.map((entry) => entry.word.sourceSegmentId))),
      exactSourceWordIds: draft.exactSourceWordIds,
      startMilliseconds: entries[0].word.startMilliseconds,
      endMillisecondsExclusive: entries.at(-1)!.word.endMillisecondsExclusive,
      timestampProvenance: provenance,
      confidenceBasisPoints: confidence,
      reviewReasons: draft.reviewReasons,
      reviewEvidenceRefs: draft.reviewEvidenceRefs,
      phraseCaptionEligible: provenance !== 'synthetic_estimate',
      activeWordMotionEligible,
      karaokeMotionEligible,
      syntheticTimingPreviewOnly: provenance === 'synthetic_estimate',
    }
  })
  const withoutDigest: Omit<
    CaptionPhraseLineageProjection,
    'projectionDigestSha256'
  > = {
    schemaVersion: CAPTION_PHRASE_LINEAGE_PROJECTION_VERSION,
    projectionId: safeKey.parse(input.projectionId),
    canonicalTranscriptRef: {
      id: transcript.transcriptId,
      version: transcript.schemaVersion,
      contentHash: transcript.transcriptDigestSha256,
    },
    alignmentQualificationRef: qualificationRef(qualification),
    phrases,
    everyPhraseHasExactSourceLineage: true,
    finalWordMotionUsesSyntheticTiming: false,
    finalKaraokeUsesUnforcedTiming: false,
    privateArtifact: true,
    executionAuthorityClaimed: false,
  }
  return parseCaptionPhraseLineageProjection({
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, projectionDigestSha256: '' },
      'projectionDigestSha256',
    ),
  })
}

export function parseCaptionPhraseLineageProjection(
  value: unknown,
): CaptionPhraseLineageProjection {
  assertClosedContractTree(value, 'Caption phrase lineage projection')
  const projection = phraseProjectionSchema.parse(value)
  const phraseIds = new Set<string>()
  for (const phrase of projection.phrases) {
    const transformationNeedsApproval = [
      'filler_omission', 'condensed_without_meaning_change', 'translated',
      'paraphrase_requires_approval',
    ].includes(phrase.transformation)
    if (phraseIds.has(phrase.phraseId)
      || new Set(phrase.sourceSegmentIds).size !== phrase.sourceSegmentIds.length
      || new Set(phrase.exactSourceWordIds).size !== phrase.exactSourceWordIds.length
      || phrase.endMillisecondsExclusive <= phrase.startMilliseconds
      || transformationNeedsApproval !== (phrase.transformationApprovalRef !== null)
      || (phrase.reviewReasons.length > 0) !== (phrase.reviewEvidenceRefs.length > 0)
      || phrase.syntheticTimingPreviewOnly !== (phrase.timestampProvenance === 'synthetic_estimate')
      || phrase.phraseCaptionEligible === phrase.syntheticTimingPreviewOnly
      || (phrase.activeWordMotionEligible
        && (phrase.syntheticTimingPreviewOnly || phrase.confidenceBasisPoints < 8_000))
      || (phrase.karaokeMotionEligible
        && (phrase.timestampProvenance !== 'forced_aligned'
          || phrase.confidenceBasisPoints < 9_000))) {
      throw new Error('Caption phrase lineage projection has invalid semantics.')
    }
    phraseIds.add(phrase.phraseId)
  }
  const expected = calculateSkillContractDigest(
    projection as unknown as Record<string, unknown>,
    'projectionDigestSha256',
  )
  if (expected !== projection.projectionDigestSha256) {
    throw new Error('Caption phrase lineage projection digest verification failed.')
  }
  return projection
}
