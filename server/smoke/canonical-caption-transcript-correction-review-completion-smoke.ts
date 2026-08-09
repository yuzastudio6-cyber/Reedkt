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
} from '../services/canonical-caption-transcript-correction-review-package'
import {
  completeCanonicalCaptionTranscriptCorrectionReview,
  createCanonicalCaptionTranscriptCorrectionReviewerSubmission,
  parseCanonicalCaptionTranscriptCorrectionReviewerSubmission,
  parseCanonicalCaptionTranscriptCorrectionReviewCompletionReceipt,
} from '../services/canonical-caption-transcript-correction-review-completion'
import {
  calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest,
} from '../services/canonical-caption-reviewed-transcript-correction'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

let checks = 0
const sourceMediaRef = ref('caption.completion.source',
  'private-source-media-v1')
const transcript = originalTranscript()
const rejectedInspection = createCaptionPrivateTranscriptInspectionReceipt({
  inspectionId: 'caption.completion.rejected-inspection',
  observedAt: '2026-08-06T11:00:00.000-04:00',
  executionEvidenceRef: ref('caption.completion.execution',
    'caption-private-local-transcript-execution-evidence-v1'),
  privateTranscriptArtifactRef: ref('caption.completion.private-transcript',
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
  candidateId: 'caption.completion.candidate.hotwords',
  candidateClass: 'offline_asr_hotwords_unapproved',
  sourceMediaRef,
  modelManifestRef: ref('caption.completion.model',
    'reeditpro-internal-testing-faster-whisper-model-v1'),
  languageCode: 'en',
  segments: [{
    candidateSegmentId: 'caption.completion.candidate.segment.1',
    startMilliseconds: 1_000,
    endMillisecondsExclusive: 4_000,
    text: 'new AI software',
    words: [
      candidateWord('new', 1_000, 1_700),
      candidateWord('AI', 1_700, 2_500),
      candidateWord('software', 2_500, 3_900),
    ],
  }],
})
const reviewPackage = createCanonicalCaptionTranscriptCorrectionReviewPackage({
  reviewScope: {
    ownerUserId: 'caption-completion-owner',
    workspaceId: transcript.workspaceId,
    projectId: transcript.projectId,
    editSessionId: transcript.editSessionId,
  },
  targetCanonicalReadScope: null,
  sourceMediaRef,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: rejectedInspection,
  candidates: [candidate],
  createdAt: '2026-08-06T11:05:00.000-04:00',
})
const targetScope = {
  ownerUserId: 'caption-completion-owner',
  workspaceId: transcript.workspaceId,
  projectId: transcript.projectId,
  editSessionId: transcript.editSessionId,
  planVersionId: 'caption-completion-plan-v1',
  approvedSnapshotRef: ref('caption-completion-approved-snapshot',
    'approved-edit-plan-snapshot-v1'),
}
const submission = createCanonicalCaptionTranscriptCorrectionReviewerSubmission({
  submissionId: 'caption.completion.reviewer-submission',
  reviewPackageRef: ref(reviewPackage.packageId, reviewPackage.schemaVersion,
    reviewPackage.packageDigestSha256),
  targetCanonicalReadScope: targetScope,
  reviewerIdentityRef: ref('caption.completion.private-reviewer',
    'canonical-private-reviewer-identity-v1'),
  reviewerClass: 'independent_private_audio_truth_reviewer',
  reviewedAt: '2026-08-06T11:30:00.000-04:00',
  decisions: [{
    sourceSegmentId: transcript.segments[0]!.sourceSegmentId,
    order: 1,
    originalSourceWordIds: transcript.words.map((word) => word.sourceWordId),
    correctedText: 'new AI software',
    correctedWords: [{
      correctedSourceWordId: 'caption.completion.corrected.word.1',
      text: 'new',
      startMilliseconds: 1_000,
      endMillisecondsExclusive: 1_700,
      reviewConfidenceBasisPoints: 9_900,
      replacedSourceWordIds: [transcript.words[0]!.sourceWordId],
    }, {
      correctedSourceWordId: 'caption.completion.corrected.word.2',
      text: 'AI',
      startMilliseconds: 1_700,
      endMillisecondsExclusive: 2_500,
      reviewConfidenceBasisPoints: 10_000,
      replacedSourceWordIds: [transcript.words[1]!.sourceWordId],
    }, {
      correctedSourceWordId: 'caption.completion.corrected.word.3',
      text: 'software',
      startMilliseconds: 2_500,
      endMillisecondsExclusive: 3_900,
      reviewConfidenceBasisPoints: 9_900,
      replacedSourceWordIds: [transcript.words[2]!.sourceWordId],
    }],
    listenerDecision: 'approved_audio_truth_correction',
    segmentAudioListenedInFull: true,
    correctedTextCheckedAgainstAudio: true,
    correctedWordTimingCheckedAgainstAudio: true,
    meaningAndNegationPreserved: true,
    properNamesNumbersAndClaimsChecked: true,
  }],
  completeSourceAudioListened: true,
  everySourceSegmentReviewedInOrder: true,
  everyCorrectedWordTextReviewedAgainstAudio: true,
  everyCorrectedWordTimingReviewedAgainstAudio: true,
  semanticMeaningAndNegationReviewed: true,
  properNamesNumbersAndClaimSensitiveTermsReviewed: true,
  correctedTranscriptApprovedForCanonicalOwnerProjection: true,
  independentFromAsrRuntime: true,
  asrCandidateTreatedAsGroundTruth: false,
  privateArtifact: true,
  browserShareable: false,
  rawTranscriptTextIncluded: true,
  rawAudioIncluded: false,
  mediaBytesIncluded: false,
  pathsUrlsOrCredentialsIncluded: false,
  directPeerDispatchPerformed: false,
  transcriptMutationAuthorityGrantedToCaption: false,
  timingAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalGrantedToCaption: false,
  billingAuthorityGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
const result = completeCanonicalCaptionTranscriptCorrectionReview({
  reviewPackage,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: rejectedInspection,
  candidates: [candidate],
  reviewerSubmission: submission,
})

assert.deepEqual(parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  submission), submission)
checks += 1
assert.deepEqual(parseCanonicalCaptionTranscriptCorrectionReviewCompletionReceipt(
  result.completionReceipt), result.completionReceipt)
checks += 1
assert.equal(result.independentAudioTruthReview.completeSourceAudioListened, true)
checks += 1
assert.equal(result.correctionArtifact.segments[0]?.correctedText,
  'new AI software')
checks += 1
assert.deepEqual(result.correctionRequest.correctionReasonCodes,
  rejectedInspection.visibleDefectCodes)
checks += 1
assert.equal(result.completionReceipt.canonicalOwnerRereadStillRequired, true)
checks += 1
assert.equal(result.completionReceipt.transcriptTextIncluded, false)
checks += 1
assert.equal(
  calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest(
    result.correctionArtifact),
  result.independentAudioTruthReview.correctionArtifactBasisDigestSha256)
checks += 1

const replay = completeCanonicalCaptionTranscriptCorrectionReview({
  reviewPackage,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: rejectedInspection,
  candidates: [candidate],
  reviewerSubmission: submission,
})
assert.deepEqual(replay, result)
checks += 1

const falseListening = structuredClone(submission) as unknown as
  Record<string, unknown>
falseListening.completeSourceAudioListened = false
redigest(falseListening, 'submissionDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  falseListening), /expected true/u)
checks += 1

const crossedPackage = structuredClone(submission)
crossedPackage.reviewPackageRef = ref('caption.completion.crossed-package',
  reviewPackage.schemaVersion)
redigest(crossedPackage, 'submissionDigestSha256')
assert.throws(() => complete(crossedPackage), /crossed authority/u)
checks += 1

const missingDecision = structuredClone(submission)
missingDecision.decisions = []
redigest(missingDecision, 'submissionDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  missingDecision), /too_small/u)
checks += 1

const textMismatch = structuredClone(submission)
textMismatch.decisions[0]!.correctedText = 'new software'
redigest(textMismatch, 'submissionDigestSha256')
assert.throws(() => complete(textMismatch), /decision is inconsistent/u)
checks += 1

const duplicateSource = structuredClone(submission)
duplicateSource.decisions[0]!.correctedWords[1]!.replacedSourceWordIds =
  [transcript.words[0]!.sourceWordId]
redigest(duplicateSource, 'submissionDigestSha256')
assert.throws(() => complete(duplicateSource), /duplicates source words/u)
checks += 1

const omittedSource = structuredClone(submission)
omittedSource.decisions[0]!.correctedWords.pop()
omittedSource.decisions[0]!.correctedText = 'new AI'
redigest(omittedSource, 'submissionDigestSha256')
assert.throws(() => complete(omittedSource), /omits source-word lineage/u)
checks += 1

const overlappingTiming = structuredClone(submission)
overlappingTiming.decisions[0]!.correctedWords[1]!.startMilliseconds = 1_600
redigest(overlappingTiming, 'submissionDigestSha256')
assert.throws(() => complete(overlappingTiming), /word timing is invalid/u)
checks += 1

const outsideSegment = structuredClone(submission)
outsideSegment.decisions[0]!.correctedWords[2]!.endMillisecondsExclusive = 4_100
redigest(outsideSegment, 'submissionDigestSha256')
assert.throws(() => complete(outsideSegment), /word timing is invalid/u)
checks += 1

const duplicateCorrectedId = structuredClone(submission)
duplicateCorrectedId.decisions[0]!.correctedWords[1]!.correctedSourceWordId =
  duplicateCorrectedId.decisions[0]!.correctedWords[0]!.correctedSourceWordId
redigest(duplicateCorrectedId, 'submissionDigestSha256')
assert.throws(() => complete(duplicateCorrectedId), /word timing is invalid/u)
checks += 1

const lowConfidence = structuredClone(submission)
lowConfidence.decisions[0]!.correctedWords[0]!
  .reviewConfidenceBasisPoints = 7_999
redigest(lowConfidence, 'submissionDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  lowConfidence), /too_small/u)
checks += 1

const crossedScope = structuredClone(submission)
crossedScope.targetCanonicalReadScope.workspaceId = 'crossed-workspace'
redigest(crossedScope, 'submissionDigestSha256')
assert.throws(() => complete(crossedScope), /crossed authority/u)
checks += 1

const unknownField = structuredClone(submission) as unknown as
  Record<string, unknown>
unknownField.providerReviewAccepted = true
redigest(unknownField, 'submissionDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  unknownField), /Unrecognized key/u)
checks += 1

const controlCharacter = structuredClone(submission)
controlCharacter.decisions[0]!.correctedWords[0]!.text = 'new\u0000'
controlCharacter.decisions[0]!.correctedText = 'new\u0000 AI software'
redigest(controlCharacter, 'submissionDigestSha256')
assert.throws(() => parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  controlCharacter), /custom/u)
checks += 1

const changedCandidate = structuredClone(candidate)
changedCandidate.segments[0]!.words[1]!.text = 'changed'
redigest(changedCandidate, 'candidateDigestSha256')
assert.throws(() => completeCanonicalCaptionTranscriptCorrectionReview({
  reviewPackage,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: rejectedInspection,
  candidates: [changedCandidate],
  reviewerSubmission: submission,
}), /context changed/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-transcript-correction-review-completion',
  status: 'passed',
  checks,
  reviewedSegments: submission.decisions.length,
  independentAudioTruthReviewRef:
    result.completionReceipt.independentAudioTruthReviewRef,
  correctionArtifactRef: result.completionReceipt.correctionArtifactRef,
  correctionRequestRef: result.completionReceipt.correctionRequestRef,
  canonicalOwnerRereadStillRequired: true,
  actualIndependentAudioReviewExecutedByThisSmoke: false,
  canonicalTranscriptMutationPerformed: false,
  providerCallMade: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function complete(reviewerSubmission: unknown) {
  return completeCanonicalCaptionTranscriptCorrectionReview({
    reviewPackage,
    sourceTranscript: transcript,
    rejectedInspectionReceipt: rejectedInspection,
    candidates: [candidate],
    reviewerSubmission,
  })
}

function originalTranscript(): CaptionCanonicalTranscript {
  const sourceSpeechRef = ref('caption.completion.source-speech',
    'caption-source-speech-evidence-v1')
  const withoutDigest: Omit<CaptionCanonicalTranscript,
    'transcriptDigestSha256'> = {
    schemaVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    transcriptId: 'caption.completion.original-transcript',
    workspaceId: 'caption-completion-workspace',
    projectId: 'caption-completion-project',
    editSessionId: 'caption-completion-edit-session',
    languageCode: 'en',
    sourceSpeechEvidencePackageRef: sourceSpeechRef,
    alignmentQualificationRef: ref('caption.completion.alignment',
      'caption-alignment-qualification-v1'),
    segments: [{
      sourceSegmentId: 'caption.completion.original.segment.1',
      sourceSequenceItemId: 'caption.completion.source-sequence.1',
      order: 1,
      startMilliseconds: 1_000,
      endMillisecondsExclusive: 4_000,
      text: 'new arm software',
      confidenceBasisPoints: 6_000,
      exactSourceWordIds: [
        'caption.completion.original.word.1.1',
        'caption.completion.original.word.1.2',
        'caption.completion.original.word.1.3',
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
    sourceWordId: `caption.completion.original.word.1.${order}`,
    sourceSegmentId: 'caption.completion.original.segment.1',
    sourceSequenceItemId: 'caption.completion.source-sequence.1',
    orderInSegment: order,
    text,
    startMilliseconds,
    endMillisecondsExclusive,
    confidenceBasisPoints,
    timestampProvenance: 'asr_native',
    wordTimingArtifactRef: ref('caption.completion.word-timing',
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
    confidenceBasisPoints: 9_000,
  }
}

function transcriptRef(value: CaptionCanonicalTranscript): CaptionDomainRef {
  return ref(value.transcriptId, value.schemaVersion,
    value.transcriptDigestSha256)
}

function ref(id: string, version: string, contentHash = hash(`${id}:${version}`)):
CaptionDomainRef {
  return { id, version, contentHash }
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function redigest<T extends object>(value: T, field: string): T {
  const record = value as unknown as Record<string, unknown>
  record[field] = calculateSkillContractDigest(record, field)
  return value
}
