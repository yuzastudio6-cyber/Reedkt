import { z } from 'zod'

import {
  CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION,
  CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION,
  CANONICAL_CAPTION_REVIEWED_CORRECTION_REQUEST_VERSION,
  type CanonicalCaptionReviewedCorrectionArtifact,
  type CanonicalCaptionReviewedCorrectionRecord,
  type CanonicalCaptionReviewedCorrectionRequest,
} from '../../src/types/canonical-caption-reviewed-transcript-correction'
import {
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionCanonicalTranscript,
} from '../../src/types/caption-transcript-lineage'
import {
  CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION,
  type CaptionPrivateTranscriptRejectedInspectionReceipt,
} from '../../src/types/caption-private-transcript-runtime'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
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
const safeText = z.string().trim().min(1).max(4_000)
  .refine((value) => !hasUnsafeControlCharacter(value))
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
const correctionReasonSchema = z.enum([
  'product_or_brand_name_misrecognition',
  'semantic_phrase_garbling',
  'excessive_low_confidence_word_density',
  'claim_sensitive_term_not_independently_verified',
  'non_monotonic_word_timing',
  'empty_or_zero_duration_word',
])
const correctedWordSchema = z.object({
  correctedSourceWordId: safeKey,
  text: safeText,
  startMilliseconds: z.number().int().nonnegative()
    .max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive()
    .max(24 * 60 * 60 * 1_000),
  reviewConfidenceBasisPoints: z.number().int().min(8_000).max(10_000),
  replacedSourceWordIds: z.array(safeKey).min(1).max(64),
}).strict()
const correctedSegmentSchema = z.object({
  sourceSegmentId: safeKey,
  order: z.number().int().positive().max(20_000),
  originalSourceWordIds: z.array(safeKey).min(1).max(100_000),
  correctedText: safeText,
  words: z.array(correctedWordSchema).min(1).max(100_000),
}).strict()
const artifactSchema:
z.ZodType<CanonicalCaptionReviewedCorrectionArtifact> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION),
  artifactId: safeKey,
  artifactDigestSha256: sha256,
  sourceTranscriptRef: refSchema,
  independentAudioTruthReviewRef: refSchema,
  segments: z.array(correctedSegmentSchema).min(1).max(20_000),
  completeTranscriptCorrected: z.literal(true),
  everySourceSegmentCoveredExactlyOnce: z.literal(true),
  everyOriginalSourceWordCoveredByCorrectionLineage: z.literal(true),
  everyCorrectedWordTimingDirectlyReviewedAgainstAudio: z.literal(true),
  properNamesAndClaimSensitiveTermsReviewed: z.literal(true),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  captionMutationAuthorityGranted: z.literal(false),
  timingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const requestSchema:
z.ZodType<CanonicalCaptionReviewedCorrectionRequest> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_REVIEWED_CORRECTION_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  canonicalReadScope: readScopeSchema,
  sourceMediaRef: refSchema,
  sourceTranscriptRef: refSchema,
  rejectedInspectionReceiptRef: refSchema,
  correctionArtifactRef: refSchema,
  independentAudioTruthReviewRef: refSchema,
  correctionReasonCodes: z.array(correctionReasonSchema).min(1).max(6),
  completeTranscriptCorrectionRequired: z.literal(true),
  callerSuppliedTranscriptAccepted: z.literal(false),
  canonicalOwnerRereadRequired: z.literal(true),
  privateInternalOnly: z.literal(true),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallGranted: z.literal(false),
  transcriptMutationAuthorityGrantedToCaption: z.literal(false),
  timingAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const recordSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: sha256,
  requestRef: refSchema,
  sourceTranscriptRef: refSchema,
  rejectedInspectionReceiptRef: refSchema,
  correctionArtifactRef: refSchema,
  independentAudioTruthReviewRef: refSchema,
  correctedCanonicalTranscript: z.unknown(),
  correctedCanonicalTranscriptRef: refSchema,
  createdAt: z.string().datetime({ offset: true }),
  originalTranscriptRereadRequiredBeforePersistence: z.literal(true),
  rejectedInspectionRereadRequiredBeforePersistence: z.literal(true),
  correctionArtifactRereadRequiredBeforePersistence: z.literal(true),
  independentReviewRereadRequiredBeforePersistence: z.literal(true),
  completeTranscriptCorrectionVerified: z.literal(true),
  exactCorrectionLineageVerified: z.literal(true),
  correctedTranscriptProducedByCanonicalOwner: z.literal(true),
  createOnlyPersistenceAndExactRereadRequired: z.literal(true),
  captionCreatedTranscriptOwner: z.literal(false),
  privateInternalOnly: z.literal(true),
  browserShareable: z.literal(false),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallMade: z.literal(false),
  timingAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

type ArtifactInput = Omit<CanonicalCaptionReviewedCorrectionArtifact,
  'schemaVersion' | 'artifactDigestSha256'>
type RequestInput = Omit<CanonicalCaptionReviewedCorrectionRequest,
  'schemaVersion' | 'requestDigestSha256'>

export function createCanonicalCaptionReviewedCorrectionArtifact(
  input: ArtifactInput,
): CanonicalCaptionReviewedCorrectionArtifact {
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionReviewedCorrectionArtifact({
    ...withoutDigest,
    artifactDigestSha256: digest(withoutDigest, 'artifactDigestSha256'),
  })
}

export function parseCanonicalCaptionReviewedCorrectionArtifact(
  value: unknown,
): CanonicalCaptionReviewedCorrectionArtifact {
  assertClosedContractTree(value, 'Canonical Caption correction artifact')
  const artifact = artifactSchema.parse(value)
  verifyDigest(artifact as unknown as Record<string, unknown>,
    'artifactDigestSha256', 'Canonical Caption correction artifact')
  if (artifact.sourceTranscriptRef.version !== CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || artifact.independentAudioTruthReviewRef.version !==
      'caption-private-independent-audio-truth-review-v1'
    || new Set(artifact.segments.map((segment) => segment.sourceSegmentId)).size
      !== artifact.segments.length
    || new Set(artifact.segments.map((segment) => segment.order)).size
      !== artifact.segments.length) {
    throw new Error('Canonical Caption correction artifact lineage is invalid.')
  }
  return structuredClone(artifact)
}

export function createCanonicalCaptionReviewedCorrectionRequest(
  input: RequestInput,
): CanonicalCaptionReviewedCorrectionRequest {
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_REVIEWED_CORRECTION_REQUEST_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionReviewedCorrectionRequest({
    ...withoutDigest,
    requestDigestSha256: digest(withoutDigest, 'requestDigestSha256'),
  })
}

export function parseCanonicalCaptionReviewedCorrectionRequest(
  value: unknown,
): CanonicalCaptionReviewedCorrectionRequest {
  assertClosedContractTree(value, 'Canonical Caption correction request')
  const request = requestSchema.parse(value)
  verifyDigest(request as unknown as Record<string, unknown>,
    'requestDigestSha256', 'Canonical Caption correction request')
  if (request.sourceTranscriptRef.version !== CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || request.rejectedInspectionReceiptRef.version !==
      CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION
    || request.correctionArtifactRef.version !==
      CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION
    || request.independentAudioTruthReviewRef.version !==
      'caption-private-independent-audio-truth-review-v1'
    || new Set(request.correctionReasonCodes).size !==
      request.correctionReasonCodes.length) {
    throw new Error('Canonical Caption correction request lineage is invalid.')
  }
  return structuredClone(request)
}

export function createCanonicalCaptionReviewedCorrectionRecord(input: {
  request: unknown
  correctionArtifact: unknown
  originalCanonicalTranscript: unknown
  rejectedInspectionReceipt: unknown
  createdAt: string
}): CanonicalCaptionReviewedCorrectionRecord {
  const request = parseCanonicalCaptionReviewedCorrectionRequest(input.request)
  const artifact = parseCanonicalCaptionReviewedCorrectionArtifact(
    input.correctionArtifact)
  const original = parseCaptionCanonicalTranscript(
    input.originalCanonicalTranscript)
  const inspection = parseCaptionPrivateTranscriptInspectionReceipt(
    input.rejectedInspectionReceipt)
  if (inspection.disposition !==
    'rejected_requires_reviewed_correction_or_canonical_owner') {
    throw new Error('Canonical Caption correction requires rejected source text.')
  }
  assertInputLineage({ request, artifact, original, inspection })
  const corrected = createCorrectedTranscript({ request, artifact, original })
  const requestRef = domainRef(request.requestId, request.schemaVersion,
    request.requestDigestSha256)
  const correctedRef = transcriptRef(corrected)
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION,
    recordId: `caption.transcript.correction.record.${
      request.requestDigestSha256.slice(0, 32)}`,
    requestRef,
    sourceTranscriptRef: structuredClone(request.sourceTranscriptRef),
    rejectedInspectionReceiptRef:
      structuredClone(request.rejectedInspectionReceiptRef),
    correctionArtifactRef: structuredClone(request.correctionArtifactRef),
    independentAudioTruthReviewRef:
      structuredClone(request.independentAudioTruthReviewRef),
    correctedCanonicalTranscript: corrected,
    correctedCanonicalTranscriptRef: correctedRef,
    createdAt: z.string().datetime({ offset: true }).parse(input.createdAt),
    originalTranscriptRereadRequiredBeforePersistence: true as const,
    rejectedInspectionRereadRequiredBeforePersistence: true as const,
    correctionArtifactRereadRequiredBeforePersistence: true as const,
    independentReviewRereadRequiredBeforePersistence: true as const,
    completeTranscriptCorrectionVerified: true as const,
    exactCorrectionLineageVerified: true as const,
    correctedTranscriptProducedByCanonicalOwner: true as const,
    createOnlyPersistenceAndExactRereadRequired: true as const,
    captionCreatedTranscriptOwner: false as const,
    privateInternalOnly: true as const,
    browserShareable: false as const,
    rawChatIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsUrlsOrCredentialsIncluded: false as const,
    directPeerDispatchPerformed: false as const,
    providerCallMade: false as const,
    timingAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalGrantedToCaption: false as const,
    billingAuthorityGrantedToCaption: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionReviewedCorrectionRecord({
    ...withoutDigest,
    recordDigestSha256: digest(withoutDigest, 'recordDigestSha256'),
  }, { request, artifact, original, inspection })
}

export function parseCanonicalCaptionReviewedCorrectionRecord(
  value: unknown,
  context: {
    request: unknown
    artifact: unknown
    original: unknown
    inspection: unknown
  },
): CanonicalCaptionReviewedCorrectionRecord {
  assertClosedContractTree(value, 'Canonical Caption correction record')
  const envelope = recordSchema.parse(value)
  verifyDigest(envelope as unknown as Record<string, unknown>,
    'recordDigestSha256', 'Canonical Caption correction record')
  const request = parseCanonicalCaptionReviewedCorrectionRequest(context.request)
  const artifact = parseCanonicalCaptionReviewedCorrectionArtifact(
    context.artifact)
  const original = parseCaptionCanonicalTranscript(context.original)
  const inspection = parseCaptionPrivateTranscriptInspectionReceipt(
    context.inspection)
  if (inspection.disposition !==
    'rejected_requires_reviewed_correction_or_canonical_owner') {
    throw new Error('Canonical Caption correction context is not rejected.')
  }
  assertInputLineage({ request, artifact, original, inspection })
  const corrected = parseCaptionCanonicalTranscript(
    envelope.correctedCanonicalTranscript)
  const expected = createCorrectedTranscript({ request, artifact, original })
  if (!sameRef(envelope.requestRef, domainRef(request.requestId,
    request.schemaVersion, request.requestDigestSha256))
    || !sameRef(envelope.sourceTranscriptRef, request.sourceTranscriptRef)
    || !sameRef(envelope.rejectedInspectionReceiptRef,
      request.rejectedInspectionReceiptRef)
    || !sameRef(envelope.correctionArtifactRef, request.correctionArtifactRef)
    || !sameRef(envelope.independentAudioTruthReviewRef,
      request.independentAudioTruthReviewRef)
    || !sameRef(envelope.correctedCanonicalTranscriptRef,
      transcriptRef(corrected))
    || corrected.transcriptDigestSha256 !== expected.transcriptDigestSha256) {
    throw new Error('Canonical Caption correction record crossed lineage.')
  }
  return structuredClone({
    ...envelope,
    correctedCanonicalTranscript: corrected,
  }) as CanonicalCaptionReviewedCorrectionRecord
}

function assertInputLineage(input: {
  request: CanonicalCaptionReviewedCorrectionRequest
  artifact: CanonicalCaptionReviewedCorrectionArtifact
  original: CaptionCanonicalTranscript
  inspection: CaptionPrivateTranscriptRejectedInspectionReceipt
}): void {
  if (!sameRef(input.request.sourceTranscriptRef, transcriptRef(input.original))
    || !sameRef(input.inspection.canonicalTranscriptRef,
      input.request.sourceTranscriptRef)
    || !sameRef(input.request.rejectedInspectionReceiptRef, domainRef(
      input.inspection.inspectionId, input.inspection.schemaVersion,
      input.inspection.inspectionDigestSha256))
    || !sameRef(input.artifact.sourceTranscriptRef,
      input.request.sourceTranscriptRef)
    || !sameRef(input.request.correctionArtifactRef, domainRef(
      input.artifact.artifactId, input.artifact.schemaVersion,
      input.artifact.artifactDigestSha256))
    || !sameRef(input.artifact.independentAudioTruthReviewRef,
      input.request.independentAudioTruthReviewRef)
    || input.request.correctionReasonCodes.join('|') !==
      input.inspection.visibleDefectCodes.join('|')
    || input.request.canonicalReadScope.workspaceId !== input.original.workspaceId
    || input.request.canonicalReadScope.projectId !== input.original.projectId
    || input.request.canonicalReadScope.editSessionId !==
      input.original.editSessionId) {
    throw new Error('Canonical Caption correction inputs crossed authority.')
  }
}

function createCorrectedTranscript(input: {
  request: CanonicalCaptionReviewedCorrectionRequest
  artifact: CanonicalCaptionReviewedCorrectionArtifact
  original: CaptionCanonicalTranscript
}): CaptionCanonicalTranscript {
  if (input.artifact.segments.length !== input.original.segments.length) {
    throw new Error('Canonical Caption correction must cover every segment.')
  }
  const originalWords = new Map(input.original.words.map((word) =>
    [word.sourceWordId, word]))
  const correctedWords: CaptionCanonicalTranscript['words'] = []
  const correctedSegments: CaptionCanonicalTranscript['segments'] = []
  const correctedWordIds = new Set<string>()
  for (const [segmentIndex, sourceSegment] of
    input.original.segments.entries()) {
    const correction = input.artifact.segments[segmentIndex]
    if (!correction
      || correction.sourceSegmentId !== sourceSegment.sourceSegmentId
      || correction.order !== sourceSegment.order
      || correction.originalSourceWordIds.join('|') !==
        sourceSegment.exactSourceWordIds.join('|')
      || correction.correctedText !== correction.words.map(
        (word) => word.text).join(' ')) {
      throw new Error('Canonical Caption correction segment is inconsistent.')
    }
    const originalIndexes = new Map(sourceSegment.exactSourceWordIds.map(
      (wordId, index) => [wordId, index]))
    const coveredOriginalWords = new Set<string>()
    let previousEnd = sourceSegment.startMilliseconds
    let previousSourceIndex = 0
    for (const [wordIndex, word] of correction.words.entries()) {
      const sourceIndexes = word.replacedSourceWordIds.map((wordId) => {
        const index = originalIndexes.get(wordId)
        if (index === undefined || !originalWords.has(wordId)) {
          throw new Error('Canonical Caption correction word lineage is unknown.')
        }
        coveredOriginalWords.add(wordId)
        return index
      })
      const firstSourceIndex = sourceIndexes[0]!
      if (new Set(sourceIndexes).size !== sourceIndexes.length
        || sourceIndexes.some((index, position) => position > 0
          && index !== sourceIndexes[position - 1]! + 1)
        || firstSourceIndex < previousSourceIndex
        || word.startMilliseconds < previousEnd
        || word.startMilliseconds < sourceSegment.startMilliseconds
        || word.endMillisecondsExclusive >
          sourceSegment.endMillisecondsExclusive
        || word.endMillisecondsExclusive <= word.startMilliseconds
        || correctedWordIds.has(word.correctedSourceWordId)) {
        throw new Error('Canonical Caption corrected word timing is invalid.')
      }
      correctedWordIds.add(word.correctedSourceWordId)
      previousSourceIndex = sourceIndexes.at(-1)!
      previousEnd = word.endMillisecondsExclusive
      correctedWords.push({
        sourceWordId: word.correctedSourceWordId,
        sourceSegmentId: sourceSegment.sourceSegmentId,
        sourceSequenceItemId: sourceSegment.sourceSequenceItemId,
        orderInSegment: wordIndex + 1,
        text: word.text,
        startMilliseconds: word.startMilliseconds,
        endMillisecondsExclusive: word.endMillisecondsExclusive,
        confidenceBasisPoints: word.reviewConfidenceBasisPoints,
        timestampProvenance: 'manually_corrected',
        wordTimingArtifactRef: structuredClone(
          input.request.correctionArtifactRef),
        timestampEvidenceRef: structuredClone(
          input.request.independentAudioTruthReviewRef),
        speakerId: null,
        diarizationArtifactRef: null,
      })
    }
    if (coveredOriginalWords.size !== sourceSegment.exactSourceWordIds.length) {
      throw new Error('Canonical Caption correction omits source-word lineage.')
    }
    correctedSegments.push({
      ...structuredClone(sourceSegment),
      text: correction.correctedText,
      confidenceBasisPoints: Math.min(...correction.words.map(
        (word) => word.reviewConfidenceBasisPoints)),
      exactSourceWordIds: correction.words.map(
        (word) => word.correctedSourceWordId),
    })
  }
  const withoutDigest: Omit<CaptionCanonicalTranscript,
    'transcriptDigestSha256'> = {
    ...structuredClone(input.original),
    transcriptId: `caption.transcript.corrected.${
      input.request.requestDigestSha256.slice(0, 32)}`,
    segments: correctedSegments,
    words: correctedWords,
  }
  return parseCaptionCanonicalTranscript({
    ...withoutDigest,
    transcriptDigestSha256: digest(withoutDigest, 'transcriptDigestSha256'),
  })
}

function transcriptRef(transcript: CaptionCanonicalTranscript): CaptionDomainRef {
  return domainRef(transcript.transcriptId, transcript.schemaVersion,
    transcript.transcriptDigestSha256)
}

function domainRef(
  id: string,
  version: string,
  contentHash: string,
): CaptionDomainRef {
  return { id, version, contentHash }
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function digest(value: object, field: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>, field)
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest verification failed.`)
  }
}

function hasUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0
    return code < 32 && code !== 9 && code !== 10 && code !== 13
      || code === 127
  })
}
