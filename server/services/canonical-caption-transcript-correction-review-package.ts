import { z } from 'zod'

import {
  CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_CANDIDATE_VERSION,
  CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION,
  type CanonicalCaptionTranscriptCorrectionCandidate,
  type CanonicalCaptionTranscriptCorrectionCandidateClass,
  type CanonicalCaptionTranscriptCorrectionReviewDiscrepancyCode,
  type CanonicalCaptionTranscriptCorrectionReviewItem,
  type CanonicalCaptionTranscriptCorrectionReviewPackage,
  type CanonicalCaptionTranscriptCorrectionReviewScope,
} from '../../src/types/canonical-caption-transcript-correction-review-package'
import type { CaptionCanonicalTranscriptReadScope } from
  '../../src/types/caption-canonical-transcript-authenticated-read'
import type { CaptionCanonicalTranscript } from
  '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseCaptionPrivateTranscriptInspectionReceipt,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const safePrivateText = z.string().trim().min(1).max(20_000)
  .refine((value) => !/\p{Cc}/u.test(value))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const readScopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
}).strict()
const reviewScopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
}).strict()
const candidateClassSchema = z.enum([
  'offline_asr_baseline_unapproved',
  'offline_asr_hotwords_unapproved',
  'offline_asr_terminology_aware_unapproved',
] satisfies [CanonicalCaptionTranscriptCorrectionCandidateClass,
  ...CanonicalCaptionTranscriptCorrectionCandidateClass[]])
const candidateWordSchema = z.object({
  candidateWordId: safeKey,
  text: safePrivateText,
  startMilliseconds: z.number().int().nonnegative().max(86_400_000),
  endMillisecondsExclusive: z.number().int().positive().max(86_400_000),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
}).strict()
const candidateSegmentSchema = z.object({
  candidateSegmentId: safeKey,
  order: z.number().int().positive().max(20_000),
  startMilliseconds: z.number().int().nonnegative().max(86_400_000),
  endMillisecondsExclusive: z.number().int().positive().max(86_400_000),
  text: safePrivateText,
  words: z.array(candidateWordSchema).min(1).max(100_000),
}).strict()
const candidateSchema:
z.ZodType<CanonicalCaptionTranscriptCorrectionCandidate> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_CANDIDATE_VERSION),
  candidateId: safeKey,
  candidateDigestSha256: sha256,
  candidateClass: candidateClassSchema,
  sourceMediaRef: refSchema,
  modelManifestRef: refSchema,
  languageCode: safeKey,
  segments: z.array(candidateSegmentSchema).min(1).max(20_000),
  completeSourceMediaPresentedToRuntime: z.literal(true),
  actualOfflineAsrExecuted: z.literal(true),
  independentAudioTruth: z.literal(false),
  approvedForCorrection: z.literal(false),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  providerCallMade: z.literal(false),
  modelDownloadPerformed: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  transcriptMutationAuthorityGrantedToCaption: z.literal(false),
  timingAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const discrepancySchema = z.enum([
  'source_low_confidence',
  'candidate_text_disagreement',
  'candidate_timing_disagreement',
  'candidate_gap',
  'product_or_brand_review_required',
  'claim_sensitive_number_review_required',
  'candidate_only_asr_not_audio_truth',
] satisfies [CanonicalCaptionTranscriptCorrectionReviewDiscrepancyCode,
  ...CanonicalCaptionTranscriptCorrectionReviewDiscrepancyCode[]])
const reviewObservationSchema = z.object({
  candidateRef: refSchema,
  text: safePrivateText,
  startMilliseconds: z.number().int().nonnegative().max(86_400_000).nullable(),
  endMillisecondsExclusive:
    z.number().int().positive().max(86_400_000).nullable(),
  candidateWordIds: z.array(safeKey).max(100_000),
}).strict()
const reviewItemSchema = z.object({
  sourceSegmentId: safeKey,
  order: z.number().int().positive().max(20_000),
  startMilliseconds: z.number().int().nonnegative().max(86_400_000),
  endMillisecondsExclusive: z.number().int().positive().max(86_400_000),
  originalAsrText: safePrivateText,
  originalSourceWordIds: z.array(safeKey).min(1).max(100_000),
  originalMinimumConfidenceBasisPoints:
    z.number().int().min(0).max(10_000),
  candidateObservations: z.array(reviewObservationSchema).min(1).max(16),
  discrepancyCodes: z.array(discrepancySchema).min(1).max(7),
  listenerCorrectedText: z.null(),
  listenerCorrectedWordTimings: z.tuple([]),
  listenerDecision: z.literal('pending'),
}).strict()
const packageSchema:
z.ZodType<CanonicalCaptionTranscriptCorrectionReviewPackage> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION),
  packageId: safeKey,
  packageDigestSha256: sha256,
  reviewScope: reviewScopeSchema,
  targetCanonicalReadScope: readScopeSchema.nullable(),
  sourceMediaRef: refSchema,
  sourceTranscriptRef: refSchema,
  rejectedInspectionReceiptRef: refSchema,
  candidateRefs: z.array(refSchema).min(1).max(16),
  reviewItems: z.array(reviewItemSchema).min(1).max(20_000),
  createdAt: z.string().datetime({ offset: true }),
  disposition: z.literal('waiting_for_independent_audio_truth_review'),
  blockingReasonCodes: z.tuple([
    z.literal('complete_source_audio_listening_missing'),
    z.literal('every_corrected_word_text_review_missing'),
    z.literal('every_corrected_word_timing_review_missing'),
    z.literal('proper_names_numbers_and_claim_review_missing'),
  ]),
  independentAudioTruthReviewRef: z.null(),
  correctionArtifactRef: z.null(),
  everySourceSegmentPackagedInOrder: z.literal(true),
  everyOriginalSourceWordIncluded: z.literal(true),
  candidateDisagreementPreserved: z.literal(true),
  asrCandidateTreatedAsGroundTruth: z.literal(false),
  completeSourceAudioListened: z.literal(false),
  correctedTranscriptApprovedForCanonicalOwnerProjection: z.literal(false),
  canonicalOwnerAdmissionAllowed: z.literal(false),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  rawTranscriptTextIncluded: z.literal(true),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallMade: z.literal(false),
  transcriptMutationAuthorityGrantedToCaption: z.literal(false),
  timingAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export interface CaptionTranscriptCorrectionCandidateInput {
  candidateId: string
  candidateClass: CanonicalCaptionTranscriptCorrectionCandidateClass
  sourceMediaRef: CaptionDomainRef
  modelManifestRef: CaptionDomainRef
  languageCode: string
  segments: Array<{
    candidateSegmentId: string
    startMilliseconds: number
    endMillisecondsExclusive: number
    text: string
    words: Array<{
      text: string
      startMilliseconds: number
      endMillisecondsExclusive: number
      confidenceBasisPoints: number
    }>
  }>
}

export function createCanonicalCaptionTranscriptCorrectionCandidate(
  input: CaptionTranscriptCorrectionCandidateInput,
): CanonicalCaptionTranscriptCorrectionCandidate {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_CANDIDATE_VERSION,
    candidateId: input.candidateId,
    candidateClass: input.candidateClass,
    sourceMediaRef: structuredClone(input.sourceMediaRef),
    modelManifestRef: structuredClone(input.modelManifestRef),
    languageCode: input.languageCode,
    segments: input.segments.map((segment, segmentIndex) => ({
      candidateSegmentId: segment.candidateSegmentId,
      order: segmentIndex + 1,
      startMilliseconds: segment.startMilliseconds,
      endMillisecondsExclusive: segment.endMillisecondsExclusive,
      text: segment.text.trim(),
      words: segment.words.map((word, wordIndex) => ({
        candidateWordId: `${input.candidateId}.word.${segmentIndex + 1}.${
          wordIndex + 1}`,
        ...structuredClone(word),
        text: word.text.trim(),
      })),
    })),
    completeSourceMediaPresentedToRuntime: true as const,
    actualOfflineAsrExecuted: true as const,
    independentAudioTruth: false as const,
    approvedForCorrection: false as const,
    privateArtifact: true as const,
    browserShareable: false as const,
    mediaBytesIncluded: false as const,
    pathsUrlsOrCredentialsIncluded: false as const,
    providerCallMade: false as const,
    modelDownloadPerformed: false as const,
    directPeerDispatchPerformed: false as const,
    transcriptMutationAuthorityGrantedToCaption: false as const,
    timingAuthorityGrantedToCaption: false as const,
    finalQaApprovalGrantedToCaption: false as const,
    billingAuthorityGrantedToCaption: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionTranscriptCorrectionCandidate({
    ...withoutDigest,
    candidateDigestSha256: digest(withoutDigest, 'candidateDigestSha256'),
  })
}

export function parseCanonicalCaptionTranscriptCorrectionCandidate(
  value: unknown,
): CanonicalCaptionTranscriptCorrectionCandidate {
  assertClosedContractTree(value, 'Caption transcript correction candidate')
  const candidate = candidateSchema.parse(value)
  verifyDigest(candidate as unknown as Record<string, unknown>,
    'candidateDigestSha256', 'Caption transcript correction candidate')
  let priorEnd = 0
  const wordIds = new Set<string>()
  const segmentIds = new Set<string>()
  for (const [segmentIndex, segment] of candidate.segments.entries()) {
    if (segment.order !== segmentIndex + 1
      || segmentIds.has(segment.candidateSegmentId)
      || segment.endMillisecondsExclusive <= segment.startMilliseconds
      || segment.startMilliseconds < priorEnd) {
      throw new Error('Caption transcript candidate timing is invalid.')
    }
    segmentIds.add(segment.candidateSegmentId)
    priorEnd = segment.endMillisecondsExclusive
    let wordPriorEnd = segment.startMilliseconds
    for (const word of segment.words) {
      if (word.startMilliseconds < wordPriorEnd
        || word.endMillisecondsExclusive <= word.startMilliseconds
        || word.startMilliseconds < segment.startMilliseconds
        || word.endMillisecondsExclusive > segment.endMillisecondsExclusive
        || wordIds.has(word.candidateWordId)) {
        throw new Error('Caption transcript candidate word lineage is invalid.')
      }
      wordPriorEnd = word.endMillisecondsExclusive
      wordIds.add(word.candidateWordId)
    }
  }
  return structuredClone(candidate)
}

export function createCanonicalCaptionTranscriptCorrectionReviewPackage(input: {
  reviewScope: CanonicalCaptionTranscriptCorrectionReviewScope
  targetCanonicalReadScope?: CaptionCanonicalTranscriptReadScope | null
  sourceMediaRef: CaptionDomainRef
  sourceTranscript: unknown
  rejectedInspectionReceipt: unknown
  candidates: unknown[]
  createdAt: string
}): CanonicalCaptionTranscriptCorrectionReviewPackage {
  const transcript = parseCaptionCanonicalTranscript(input.sourceTranscript)
  const inspection = parseCaptionPrivateTranscriptInspectionReceipt(
    input.rejectedInspectionReceipt)
  if (inspection.disposition !==
    'rejected_requires_reviewed_correction_or_canonical_owner') {
    throw new Error('Caption correction review package requires rejection.')
  }
  const candidates = input.candidates.map(
    parseCanonicalCaptionTranscriptCorrectionCandidate)
  const transcriptReference = transcriptRef(transcript)
  const inspectionReference = inspectionRef(inspection)
  if (!sameRef(inspection.canonicalTranscriptRef, transcriptReference)
    || input.reviewScope.workspaceId !== transcript.workspaceId
    || input.reviewScope.projectId !== transcript.projectId
    || input.reviewScope.editSessionId !== transcript.editSessionId
    || (input.targetCanonicalReadScope !== undefined
      && input.targetCanonicalReadScope !== null
      && (input.targetCanonicalReadScope.ownerUserId !==
          input.reviewScope.ownerUserId
        || input.targetCanonicalReadScope.workspaceId !==
          input.reviewScope.workspaceId
        || input.targetCanonicalReadScope.projectId !==
          input.reviewScope.projectId
        || input.targetCanonicalReadScope.editSessionId !==
          input.reviewScope.editSessionId))
    || new Set(candidates.map((candidate) => candidate.candidateId)).size
      !== candidates.length
    || candidates.some((candidate) =>
      !sameRef(candidate.sourceMediaRef, input.sourceMediaRef))) {
    throw new Error('Caption correction review package lineage is crossed.')
  }
  const candidateRefs = candidates.map(candidateRef)
  const reviewItems = transcript.segments.map((segment) =>
    buildReviewItem(transcript, segment, candidates))
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION,
    packageId: `caption.transcript.correction.review.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    reviewScope: structuredClone(input.reviewScope),
    targetCanonicalReadScope: input.targetCanonicalReadScope === undefined
      || input.targetCanonicalReadScope === null
      ? null : structuredClone(input.targetCanonicalReadScope),
    sourceMediaRef: structuredClone(input.sourceMediaRef),
    sourceTranscriptRef: transcriptReference,
    rejectedInspectionReceiptRef: inspectionReference,
    candidateRefs,
    reviewItems,
    createdAt: z.string().datetime({ offset: true }).parse(input.createdAt),
    disposition: 'waiting_for_independent_audio_truth_review' as const,
    blockingReasonCodes: [
      'complete_source_audio_listening_missing',
      'every_corrected_word_text_review_missing',
      'every_corrected_word_timing_review_missing',
      'proper_names_numbers_and_claim_review_missing',
    ] as const,
    independentAudioTruthReviewRef: null,
    correctionArtifactRef: null,
    everySourceSegmentPackagedInOrder: true as const,
    everyOriginalSourceWordIncluded: true as const,
    candidateDisagreementPreserved: true as const,
    asrCandidateTreatedAsGroundTruth: false as const,
    completeSourceAudioListened: false as const,
    correctedTranscriptApprovedForCanonicalOwnerProjection: false as const,
    canonicalOwnerAdmissionAllowed: false as const,
    privateArtifact: true as const,
    browserShareable: false as const,
    rawTranscriptTextIncluded: true as const,
    rawChatIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsUrlsOrCredentialsIncluded: false as const,
    directPeerDispatchPerformed: false as const,
    providerCallMade: false as const,
    transcriptMutationAuthorityGrantedToCaption: false as const,
    timingAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalGrantedToCaption: false as const,
    billingAuthorityGrantedToCaption: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionTranscriptCorrectionReviewPackage({
    ...withoutDigest,
    packageDigestSha256: digest(withoutDigest, 'packageDigestSha256'),
  })
}

export function parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  value: unknown,
  context?: {
    transcript: unknown
    inspection: unknown
    candidates: unknown[]
  },
): CanonicalCaptionTranscriptCorrectionReviewPackage {
  assertClosedContractTree(value, 'Caption transcript correction review package')
  const reviewPackage = packageSchema.parse(value)
  verifyDigest(reviewPackage as unknown as Record<string, unknown>,
    'packageDigestSha256', 'Caption transcript correction review package')
  if (new Set(reviewPackage.candidateRefs.map(refKey)).size
      !== reviewPackage.candidateRefs.length
    || !packageStructureIsValid(reviewPackage)) {
    throw new Error('Caption correction review package evidence is invalid.')
  }
  if (context) {
    const expected = createCanonicalCaptionTranscriptCorrectionReviewPackage({
      reviewScope: reviewPackage.reviewScope,
      targetCanonicalReadScope: reviewPackage.targetCanonicalReadScope,
      sourceMediaRef: reviewPackage.sourceMediaRef,
      sourceTranscript: context.transcript,
      rejectedInspectionReceipt: context.inspection,
      candidates: context.candidates,
      createdAt: reviewPackage.createdAt,
    })
    if (expected.packageDigestSha256 !== reviewPackage.packageDigestSha256) {
      throw new Error('Caption correction review package context changed.')
    }
  }
  return structuredClone(reviewPackage)
}

function buildReviewItem(
  transcript: CaptionCanonicalTranscript,
  segment: CaptionCanonicalTranscript['segments'][number],
  candidates: CanonicalCaptionTranscriptCorrectionCandidate[],
): CanonicalCaptionTranscriptCorrectionReviewItem {
  const originalWords = segment.exactSourceWordIds.map((sourceWordId) => {
    const word = transcript.words.find((item) => item.sourceWordId === sourceWordId)
    if (!word) throw new Error('Caption source segment word lineage is missing.')
    return word
  })
  const observations = candidates.map((candidate) => {
    const words = candidate.segments.flatMap((item) => item.words).filter(
      (word) => midpoint(word.startMilliseconds,
        word.endMillisecondsExclusive) >= segment.startMilliseconds
        && midpoint(word.startMilliseconds,
          word.endMillisecondsExclusive) < segment.endMillisecondsExclusive)
    return {
      candidateRef: candidateRef(candidate),
      text: words.length > 0
        ? compactText(words.map((word) => word.text).join(' '))
        : '[no candidate speech observation]',
      startMilliseconds: words[0]?.startMilliseconds ?? null,
      endMillisecondsExclusive:
        words[words.length - 1]?.endMillisecondsExclusive ?? null,
      candidateWordIds: words.map((word) => word.candidateWordId),
    }
  })
  const discrepancies = new Set<
  CanonicalCaptionTranscriptCorrectionReviewDiscrepancyCode>([
    'candidate_only_asr_not_audio_truth',
  ])
  const originalMinimum = Math.min(
    segment.confidenceBasisPoints,
    ...originalWords.map((word) => word.confidenceBasisPoints),
  )
  if (originalMinimum < 8_000) discrepancies.add('source_low_confidence')
  if (observations.some((item) => item.candidateWordIds.length === 0)) {
    discrepancies.add('candidate_gap')
  }
  if (observations.some((item) => normalizeText(item.text)
    !== normalizeText(segment.text))) {
    discrepancies.add('candidate_text_disagreement')
  }
  if (observations.some((item) => item.startMilliseconds !== null
    && (Math.abs(item.startMilliseconds - segment.startMilliseconds) > 750
      || Math.abs((item.endMillisecondsExclusive ?? 0)
        - segment.endMillisecondsExclusive) > 750))) {
    discrepancies.add('candidate_timing_disagreement')
  }
  const allText = [segment.text, ...observations.map((item) => item.text)]
    .join(' ')
  if (/\b[A-Z][a-z]+[A-Z][A-Za-z]*\b/u.test(allText)) {
    discrepancies.add('product_or_brand_review_required')
  }
  if (/\b(?:\d[\d,.]*|hundred|thousand|million|billion|percent|dollars?)\b/iu
    .test(allText)) {
    discrepancies.add('claim_sensitive_number_review_required')
  }
  return {
    sourceSegmentId: segment.sourceSegmentId,
    order: segment.order,
    startMilliseconds: segment.startMilliseconds,
    endMillisecondsExclusive: segment.endMillisecondsExclusive,
    originalAsrText: segment.text,
    originalSourceWordIds: structuredClone(segment.exactSourceWordIds),
    originalMinimumConfidenceBasisPoints: originalMinimum,
    candidateObservations: observations,
    discrepancyCodes: [...discrepancies].sort(),
    listenerCorrectedText: null,
    listenerCorrectedWordTimings: [],
    listenerDecision: 'pending',
  }
}

function transcriptRef(transcript: CaptionCanonicalTranscript): CaptionDomainRef {
  return {
    id: transcript.transcriptId,
    version: transcript.schemaVersion,
    contentHash: transcript.transcriptDigestSha256,
  }
}

function inspectionRef(inspection: {
  inspectionId: string
  schemaVersion: string
  inspectionDigestSha256: string
}): CaptionDomainRef {
  return {
    id: inspection.inspectionId,
    version: inspection.schemaVersion,
    contentHash: inspection.inspectionDigestSha256,
  }
}

function candidateRef(
  candidate: CanonicalCaptionTranscriptCorrectionCandidate,
): CaptionDomainRef {
  return {
    id: candidate.candidateId,
    version: candidate.schemaVersion,
    contentHash: candidate.candidateDigestSha256,
  }
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function packageStructureIsValid(
  reviewPackage: CanonicalCaptionTranscriptCorrectionReviewPackage,
): boolean {
  const candidateKeys = reviewPackage.candidateRefs.map(refKey)
  const sourceSegmentIds = new Set<string>()
  const sourceWordIds = new Set<string>()
  const candidateWordIdsByRef = new Map<string, Set<string>>()
  let disagreementObserved = false
  if (reviewPackage.targetCanonicalReadScope !== null
    && (reviewPackage.targetCanonicalReadScope.ownerUserId !==
        reviewPackage.reviewScope.ownerUserId
      || reviewPackage.targetCanonicalReadScope.workspaceId !==
        reviewPackage.reviewScope.workspaceId
      || reviewPackage.targetCanonicalReadScope.projectId !==
        reviewPackage.reviewScope.projectId
      || reviewPackage.targetCanonicalReadScope.editSessionId !==
        reviewPackage.reviewScope.editSessionId)) {
    return false
  }
  for (const [itemIndex, item] of reviewPackage.reviewItems.entries()) {
    if (item.order !== itemIndex + 1
      || sourceSegmentIds.has(item.sourceSegmentId)
      || new Set(item.discrepancyCodes).size !== item.discrepancyCodes.length
      || !item.discrepancyCodes.includes('candidate_only_asr_not_audio_truth')
      || item.candidateObservations.length !== candidateKeys.length
      || item.candidateObservations.some((observation, observationIndex) => {
        const candidateKey = refKey(observation.candidateRef)
        const seen = candidateWordIdsByRef.get(candidateKey) ?? new Set<string>()
        if (candidateKey !== candidateKeys[observationIndex]
          || new Set(observation.candidateWordIds).size !==
            observation.candidateWordIds.length
          || observation.candidateWordIds.some((wordId) => seen.has(wordId))) {
          return true
        }
        observation.candidateWordIds.forEach((wordId) => seen.add(wordId))
        candidateWordIdsByRef.set(candidateKey, seen)
        return false
      })) {
      return false
    }
    sourceSegmentIds.add(item.sourceSegmentId)
    for (const sourceWordId of item.originalSourceWordIds) {
      if (sourceWordIds.has(sourceWordId)) return false
      sourceWordIds.add(sourceWordId)
    }
    disagreementObserved ||= item.discrepancyCodes.some((code) =>
      code === 'candidate_text_disagreement'
      || code === 'candidate_timing_disagreement'
      || code === 'candidate_gap')
  }
  return disagreementObserved
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}

function midpoint(start: number, end: number): number {
  return start + Math.floor((end - start) / 2)
}

function normalizeText(value: string): string {
  return compactText(value)
    .toLocaleLowerCase('en-US')
}

function compactText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ').replace(/\s+([,.!?;:])/gu, '$1')
}

function digest(value: object, digestField: string): string {
  return calculateSkillContractDigest({
    ...value,
    [digestField]: '',
  }, digestField)
}

function verifyDigest(
  value: Record<string, unknown>,
  digestField: string,
  label: string,
): void {
  if (value[digestField] !== calculateSkillContractDigest(value, digestField)) {
    throw new Error(`${label} digest verification failed.`)
  }
}
