import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionCanonicalTranscript,
} from '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  createCaptionPrivateTranscriptInspectionReceipt,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  createCanonicalCaptionTranscriptCorrectionCandidate,
  createCanonicalCaptionTranscriptCorrectionReviewPackage,
  parseCanonicalCaptionTranscriptCorrectionCandidate,
  parseCanonicalCaptionTranscriptCorrectionReviewPackage,
} from '../services/canonical-caption-transcript-correction-review-package'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

let checks = 0
const sourceMediaRef = ref('caption.review.source', 'private-source-media-v1')
const transcript = originalTranscript()
const rejectedInspection = createCaptionPrivateTranscriptInspectionReceipt({
  inspectionId: 'caption.review.rejected-inspection',
  observedAt: '2026-08-06T10:00:00.000-04:00',
  executionEvidenceRef: ref('caption.review.execution',
    'caption-private-local-transcript-execution-evidence-v1'),
  privateTranscriptArtifactRef: ref('caption.review.private-transcript',
    'caption-private-transcript-payload-v1'),
  canonicalTranscriptRef: transcriptRef(transcript),
  independentGroundTruthReviewRef: null,
  inspectedSegmentCount: 1,
  inspectedWordTimingSampleCount: 3,
  sampledSourceWordIds: transcript.words.map((word) => word.sourceWordId),
  observedLowConfidenceWordCount: 2,
  observedLowConfidenceWordRatioBasisPoints: 6_667,
  visibleDefectCodes: [
    'product_or_brand_name_misrecognition',
    'semantic_phrase_garbling',
    'claim_sensitive_term_not_independently_verified',
  ],
  transcriptTextOpenedAndRead: true,
  everyTranscriptSegmentInspected: true,
  firstMiddleLastWordTimingInspected: true,
  coherentEnglishSpeechObserved: true,
  expectedTopicEvidenceObserved: true,
  placeholderOrFixtureSpeechObserved: false,
  nonMonotonicTimestampObserved: false,
  emptyOrZeroDurationWordObserved: false,
  transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified: false,
  directAudioListeningAccuracyVerified: false,
  semanticMeaningSafeForCaptionProjection: false,
  properNamesAndClaimSensitiveTermsVerified: false,
  finalPhraseProjectionAllowed: false,
  manualCorrectionOrCanonicalOwnerRequired: true,
  inspectionScope:
    'private_transcript_text_and_sampled_asr_timing_not_independent_audio_truth',
  disposition: 'rejected_requires_reviewed_correction_or_canonical_owner',
  rawTranscriptTextIncluded: false,
  mediaBytesIncluded: false,
  pathsUrlsOrCredentialsIncluded: false,
  browserLocalCompletionAccepted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
const candidate = createCanonicalCaptionTranscriptCorrectionCandidate({
  candidateId: 'caption.review.candidate.hotwords',
  candidateClass: 'offline_asr_hotwords_unapproved',
  sourceMediaRef,
  modelManifestRef: ref('caption.review.model',
    'reeditpro-internal-testing-faster-whisper-model-v1'),
  languageCode: 'en',
  segments: [{
    candidateSegmentId: 'caption.review.candidate.segment.1',
    startMilliseconds: 1_000,
    endMillisecondsExclusive: 4_000,
    text: 'ReEditPro software for 100,000 customers',
    words: [
      candidateWord('ReEditPro', 1_000, 1_500),
      candidateWord('software', 1_500, 2_100),
      candidateWord('for', 2_100, 2_400),
      candidateWord('100,000', 2_400, 3_100),
      candidateWord('customers', 3_100, 3_900),
    ],
  }],
})
const reviewScope = {
  ownerUserId: 'caption-review-owner',
  workspaceId: transcript.workspaceId,
  projectId: transcript.projectId,
  editSessionId: transcript.editSessionId,
}
const reviewPackage =
  createCanonicalCaptionTranscriptCorrectionReviewPackage({
    reviewScope,
    targetCanonicalReadScope: null,
    sourceMediaRef,
    sourceTranscript: transcript,
    rejectedInspectionReceipt: rejectedInspection,
    candidates: [candidate],
    createdAt: '2026-08-06T10:05:00.000-04:00',
  })

assert.deepEqual(parseCanonicalCaptionTranscriptCorrectionCandidate(candidate),
  candidate)
checks += 1
assert.deepEqual(parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  reviewPackage, {
    transcript,
    inspection: rejectedInspection,
    candidates: [candidate],
  }), reviewPackage)
checks += 1
assert.equal(reviewPackage.disposition,
  'waiting_for_independent_audio_truth_review')
checks += 1
assert.equal(reviewPackage.completeSourceAudioListened, false)
checks += 1
assert.equal(reviewPackage.canonicalOwnerAdmissionAllowed, false)
checks += 1
assert.equal(reviewPackage.targetCanonicalReadScope, null)
checks += 1
assert.equal(reviewPackage.reviewItems.length, transcript.segments.length)
checks += 1
assert.deepEqual(reviewPackage.reviewItems[0]?.originalSourceWordIds,
  transcript.words.map((word) => word.sourceWordId))
checks += 1
assert.ok(reviewPackage.reviewItems[0]?.discrepancyCodes.includes(
  'source_low_confidence'))
checks += 1
assert.ok(reviewPackage.reviewItems[0]?.discrepancyCodes.includes(
  'product_or_brand_review_required'))
checks += 1
assert.ok(reviewPackage.reviewItems[0]?.discrepancyCodes.includes(
  'claim_sensitive_number_review_required'))
checks += 1
assert.ok(reviewPackage.reviewItems[0]?.discrepancyCodes.includes(
  'candidate_only_asr_not_audio_truth'))
checks += 1
assert.equal(reviewPackage.independentAudioTruthReviewRef, null)
checks += 1
assert.equal(reviewPackage.correctionArtifactRef, null)
checks += 1

const tamperedPackage = structuredClone(reviewPackage)
tamperedPackage.reviewItems[0]!.originalAsrText = 'silently replaced'
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  tamperedPackage), /digest verification failed/u)
checks += 1

const falseGroundTruth = structuredClone(candidate) as unknown as
  Record<string, unknown>
falseGroundTruth.independentAudioTruth = true
redigest(falseGroundTruth, 'candidateDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionCandidate(
  falseGroundTruth), /expected false/u)
checks += 1

const crossedSource = structuredClone(candidate)
crossedSource.sourceMediaRef = ref('caption.review.crossed-source',
  'private-source-media-v1')
redigest(crossedSource, 'candidateDigestSha256')
assert.throws(() => createCanonicalCaptionTranscriptCorrectionReviewPackage({
  reviewScope,
  targetCanonicalReadScope: null,
  sourceMediaRef,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: rejectedInspection,
  candidates: [crossedSource],
  createdAt: '2026-08-06T10:05:00.000-04:00',
}), /lineage is crossed/u)
checks += 1

const unknownField = structuredClone(candidate) as unknown as
  Record<string, unknown>
unknownField.groundTruthAccepted = true
redigest(unknownField, 'candidateDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionCandidate(
  unknownField), /Unrecognized key/u)
checks += 1

const invalidTiming = structuredClone(candidate)
invalidTiming.segments[0]!.words[1]!.startMilliseconds = 900
redigest(invalidTiming, 'candidateDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionCandidate(
  invalidTiming), /word lineage is invalid/u)
checks += 1

const duplicateSourceWord = structuredClone(reviewPackage)
duplicateSourceWord.reviewItems[0]!.originalSourceWordIds.push(
  duplicateSourceWord.reviewItems[0]!.originalSourceWordIds[0]!)
redigest(duplicateSourceWord, 'packageDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  duplicateSourceWord), /evidence is invalid/u)
checks += 1

const crossedObservation = structuredClone(reviewPackage)
crossedObservation.reviewItems[0]!.candidateObservations[0]!.candidateRef =
  ref('caption.review.crossed-candidate',
    'canonical-caption-transcript-correction-candidate-v1')
redigest(crossedObservation, 'packageDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  crossedObservation), /evidence is invalid/u)
checks += 1

const crossedTargetScope = structuredClone(reviewPackage)
crossedTargetScope.targetCanonicalReadScope = {
  ownerUserId: 'caption-review-crossed-owner',
  workspaceId: transcript.workspaceId,
  projectId: transcript.projectId,
  editSessionId: transcript.editSessionId,
  planVersionId: 'caption-review-plan-v1',
  approvedSnapshotRef: ref('caption-review-snapshot',
    'approved-edit-plan-snapshot-v1'),
}
redigest(crossedTargetScope, 'packageDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  crossedTargetScope), /evidence is invalid/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-transcript-correction-review-package',
  status: 'passed',
  checks,
  disposition: reviewPackage.disposition,
  reviewItems: reviewPackage.reviewItems.length,
  candidateCount: reviewPackage.candidateRefs.length,
  independentAudioTruthReviewCreated: false,
  correctionArtifactCreated: false,
  canonicalOwnerAdmissionAllowed: false,
  providerCallMade: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function originalTranscript(): CaptionCanonicalTranscript {
  const sourceSpeechRef = ref('caption.review.source-speech',
    'caption-source-speech-evidence-v1')
  const withoutDigest: Omit<CaptionCanonicalTranscript,
    'transcriptDigestSha256'> = {
    schemaVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    transcriptId: 'caption.review.original-transcript',
    workspaceId: 'caption-review-workspace',
    projectId: 'caption-review-project',
    editSessionId: 'caption-review-edit-session',
    languageCode: 'en',
    sourceSpeechEvidencePackageRef: sourceSpeechRef,
    alignmentQualificationRef: ref('caption.review.alignment',
      'caption-alignment-qualification-v1'),
    segments: [{
      sourceSegmentId: 'caption.review.original.segment.1',
      sourceSequenceItemId: 'caption.review.source-sequence.1',
      order: 1,
      startMilliseconds: 1_000,
      endMillisecondsExclusive: 4_000,
      text: 'new arm software',
      confidenceBasisPoints: 6_000,
      exactSourceWordIds: [
        'caption.review.original.word.1.1',
        'caption.review.original.word.1.2',
        'caption.review.original.word.1.3',
      ],
      sourceRecordRef: sourceSpeechRef,
    }],
    words: [
      originalWord(1, 'new', 1_000, 1_700, 8_200, sourceSpeechRef),
      originalWord(2, 'arm', 1_700, 2_500, 4_000, sourceSpeechRef),
      originalWord(3, 'software', 2_500, 3_900, 7_000, sourceSpeechRef),
    ],
    immutable: true,
    singleCanonicalTranscript: true,
    rawChatIncluded: false,
    browserShareable: false,
    privateArtifact: true,
    timingAuthorityClaimed: false,
  }
  return parseCaptionCanonicalTranscript({
    ...withoutDigest,
    transcriptDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      transcriptDigestSha256: '',
    } as unknown as Record<string, unknown>, 'transcriptDigestSha256'),
  })
}

function originalWord(
  order: number,
  text: string,
  startMilliseconds: number,
  endMillisecondsExclusive: number,
  confidenceBasisPoints: number,
  sourceSpeechRef: CaptionDomainRef,
): CaptionCanonicalTranscript['words'][number] {
  return {
    sourceWordId: `caption.review.original.word.1.${order}`,
    sourceSegmentId: 'caption.review.original.segment.1',
    sourceSequenceItemId: 'caption.review.source-sequence.1',
    orderInSegment: order,
    text,
    startMilliseconds,
    endMillisecondsExclusive,
    confidenceBasisPoints,
    timestampProvenance: 'asr_native',
    wordTimingArtifactRef: ref('caption.review.word-timing',
      'caption-private-word-timing-payload-v1'),
    timestampEvidenceRef: sourceSpeechRef,
    speakerId: null,
    diarizationArtifactRef: null,
  }
}

function candidateWord(
  text: string,
  startMilliseconds: number,
  endMillisecondsExclusive: number,
) {
  return {
    text,
    startMilliseconds,
    endMillisecondsExclusive,
    confidenceBasisPoints: 8_500,
  }
}

function transcriptRef(transcript: CaptionCanonicalTranscript): CaptionDomainRef {
  return ref(transcript.transcriptId, transcript.schemaVersion,
    transcript.transcriptDigestSha256)
}

function ref(id: string, version: string, contentHash = hash(`${id}:${version}`)):
CaptionDomainRef {
  return { id, version, contentHash }
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function redigest(value: object, field: string): void {
  const record = value as Record<string, unknown>
  record[field] = calculateSkillContractDigest(record, field)
}
