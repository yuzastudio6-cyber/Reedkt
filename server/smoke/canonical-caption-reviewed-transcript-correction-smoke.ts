import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionCanonicalTranscript,
} from '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  createCaptionPrivateTranscriptInspectionReceipt,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  createCanonicalCaptionReviewedCorrectionArtifact,
  createCanonicalCaptionReviewedCorrectionRecord,
  createCanonicalCaptionReviewedCorrectionRequest,
  parseCanonicalCaptionReviewedCorrectionArtifact,
  parseCanonicalCaptionReviewedCorrectionRecord,
  parseCanonicalCaptionReviewedCorrectionRequest,
} from '../services/canonical-caption-reviewed-transcript-correction'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

let checks = 0
const sourceSpeechRef = ref('caption.source.speech',
  'caption-source-speech-evidence-v1')
const original = originalTranscript()
const originalRef = transcriptRef(original)
const rejectedInspection = createCaptionPrivateTranscriptInspectionReceipt({
  inspectionId: 'caption.private.transcript.inspection.rejected.correction-fixture',
  observedAt: '2026-08-05T16:45:00.000-04:00',
  executionEvidenceRef: ref('caption.transcript.execution.rejected',
    'caption-private-local-transcript-execution-evidence-v1'),
  privateTranscriptArtifactRef: ref('caption.transcript.private.rejected',
    'caption-private-transcript-payload-v1'),
  canonicalTranscriptRef: originalRef,
  independentGroundTruthReviewRef: null,
  inspectedSegmentCount: 1,
  inspectedWordTimingSampleCount: 3,
  sampledSourceWordIds: original.words.map((word) => word.sourceWordId),
  observedLowConfidenceWordCount: 2,
  observedLowConfidenceWordRatioBasisPoints: 6_667,
  visibleDefectCodes: [
    'product_or_brand_name_misrecognition',
    'semantic_phrase_garbling',
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
const audioTruthReviewRef = ref('caption.audio-truth-review.correction-fixture',
  'caption-private-independent-audio-truth-review-v1')
const correctionArtifact = createCanonicalCaptionReviewedCorrectionArtifact({
  artifactId: 'caption.transcript.correction.artifact.fixture',
  sourceTranscriptRef: originalRef,
  independentAudioTruthReviewRef: audioTruthReviewRef,
  segments: [{
    sourceSegmentId: original.segments[0]!.sourceSegmentId,
    order: 1,
    originalSourceWordIds: original.words.map((word) => word.sourceWordId),
    correctedText: 'new AI software',
    words: [{
      correctedSourceWordId: 'caption.corrected.word.1.1',
      text: 'new',
      startMilliseconds: 1_000,
      endMillisecondsExclusive: 1_700,
      reviewConfidenceBasisPoints: 9_900,
      replacedSourceWordIds: ['caption.original.word.1.1'],
    }, {
      correctedSourceWordId: 'caption.corrected.word.1.2',
      text: 'AI',
      startMilliseconds: 1_700,
      endMillisecondsExclusive: 2_500,
      reviewConfidenceBasisPoints: 10_000,
      replacedSourceWordIds: ['caption.original.word.1.2'],
    }, {
      correctedSourceWordId: 'caption.corrected.word.1.3',
      text: 'software',
      startMilliseconds: 2_500,
      endMillisecondsExclusive: 3_900,
      reviewConfidenceBasisPoints: 9_900,
      replacedSourceWordIds: ['caption.original.word.1.3'],
    }],
  }],
  completeTranscriptCorrected: true,
  everySourceSegmentCoveredExactlyOnce: true,
  everyOriginalSourceWordCoveredByCorrectionLineage: true,
  everyCorrectedWordTimingDirectlyReviewedAgainstAudio: true,
  properNamesAndClaimSensitiveTermsReviewed: true,
  privateArtifact: true,
  browserShareable: false,
  rawChatIncluded: false,
  mediaBytesIncluded: false,
  pathsUrlsOrCredentialsIncluded: false,
  captionMutationAuthorityGranted: false,
  timingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
const correctionArtifactRef = ref(correctionArtifact.artifactId,
  correctionArtifact.schemaVersion, correctionArtifact.artifactDigestSha256)
const request = createCanonicalCaptionReviewedCorrectionRequest({
  requestId: 'caption.transcript.correction.request.fixture',
  canonicalReadScope: {
    ownerUserId: 'caption-owner',
    workspaceId: original.workspaceId,
    projectId: original.projectId,
    editSessionId: original.editSessionId,
    planVersionId: 'caption-plan-v1',
    approvedSnapshotRef: ref('caption.approved.snapshot',
      'approved-edit-plan-snapshot-v1'),
  },
  sourceMediaRef: ref('caption.source.media', 'private-source-media-v1'),
  sourceTranscriptRef: originalRef,
  rejectedInspectionReceiptRef: ref(rejectedInspection.inspectionId,
    rejectedInspection.schemaVersion,
    rejectedInspection.inspectionDigestSha256),
  correctionArtifactRef,
  independentAudioTruthReviewRef: audioTruthReviewRef,
  correctionReasonCodes: [
    'product_or_brand_name_misrecognition',
    'semantic_phrase_garbling',
  ],
  completeTranscriptCorrectionRequired: true,
  callerSuppliedTranscriptAccepted: false,
  canonicalOwnerRereadRequired: true,
  privateInternalOnly: true,
  rawChatIncluded: false,
  mediaBytesIncluded: false,
  pathsUrlsOrCredentialsIncluded: false,
  directPeerDispatchPerformed: false,
  providerCallGranted: false,
  transcriptMutationAuthorityGrantedToCaption: false,
  timingAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalGrantedToCaption: false,
  billingAuthorityGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
const record = createCanonicalCaptionReviewedCorrectionRecord({
  request,
  correctionArtifact,
  originalCanonicalTranscript: original,
  rejectedInspectionReceipt: rejectedInspection,
  createdAt: '2026-08-05T16:46:00.000-04:00',
})

assert.deepEqual(parseCanonicalCaptionReviewedCorrectionArtifact(
  correctionArtifact), correctionArtifact)
checks += 1
assert.deepEqual(parseCanonicalCaptionReviewedCorrectionRequest(request), request)
checks += 1
assert.deepEqual(parseCanonicalCaptionReviewedCorrectionRecord(record, {
  request,
  artifact: correctionArtifact,
  original,
  inspection: rejectedInspection,
}), record)
checks += 1
assert.equal(record.correctedCanonicalTranscript.segments[0]?.text,
  'new AI software')
checks += 1
assert.deepEqual(record.correctedCanonicalTranscript.words.map((word) => ({
  text: word.text,
  provenance: word.timestampProvenance,
})), [{ text: 'new', provenance: 'manually_corrected' },
  { text: 'AI', provenance: 'manually_corrected' },
  { text: 'software', provenance: 'manually_corrected' }])
checks += 1

const unknownLineage = structuredClone(correctionArtifact)
unknownLineage.segments[0]!.words[1]!.replacedSourceWordIds =
  ['caption.original.word.unknown']
redigest(unknownLineage, 'artifactDigestSha256')
assert.throws(() => createCanonicalCaptionReviewedCorrectionRecord({
  request: requestForArtifact(unknownLineage),
  correctionArtifact: unknownLineage,
  originalCanonicalTranscript: original,
  rejectedInspectionReceipt: rejectedInspection,
  createdAt: '2026-08-05T16:46:00.000-04:00',
}), /word lineage is unknown/u)
checks += 1

const omittedLineage = structuredClone(correctionArtifact)
omittedLineage.segments[0]!.words.pop()
omittedLineage.segments[0]!.correctedText = 'new AI'
redigest(omittedLineage, 'artifactDigestSha256')
assert.throws(() => createCanonicalCaptionReviewedCorrectionRecord({
  request: requestForArtifact(omittedLineage),
  correctionArtifact: omittedLineage,
  originalCanonicalTranscript: original,
  rejectedInspectionReceipt: rejectedInspection,
  createdAt: '2026-08-05T16:46:00.000-04:00',
}), /omits source-word lineage/u)
checks += 1

const captionAuthority = structuredClone(request) as unknown as
  Record<string, unknown>
captionAuthority.transcriptMutationAuthorityGrantedToCaption = true
redigest(captionAuthority, 'requestDigestSha256')
assert.throws(() => parseCanonicalCaptionReviewedCorrectionRequest(
  captionAuthority), /expected false/u)
checks += 1

const duplicateReason = structuredClone(request)
duplicateReason.correctionReasonCodes.push(
  duplicateReason.correctionReasonCodes[0]!)
redigest(duplicateReason, 'requestDigestSha256')
assert.throws(() => parseCanonicalCaptionReviewedCorrectionRequest(
  duplicateReason), /lineage is invalid/u)
checks += 1

const omittedReason = structuredClone(request)
omittedReason.correctionReasonCodes.pop()
redigest(omittedReason, 'requestDigestSha256')
assert.throws(() => createCanonicalCaptionReviewedCorrectionRecord({
  request: omittedReason,
  correctionArtifact,
  originalCanonicalTranscript: original,
  rejectedInspectionReceipt: rejectedInspection,
  createdAt: '2026-08-05T16:46:00.000-04:00',
}), /crossed authority/u)
checks += 1

const crossedRecord = structuredClone(record)
crossedRecord.correctedCanonicalTranscript.words[1]!.text = 'wrong'
redigest(crossedRecord, 'recordDigestSha256')
assert.throws(() => parseCanonicalCaptionReviewedCorrectionRecord(
  crossedRecord, {
    request,
    artifact: correctionArtifact,
    original,
    inspection: rejectedInspection,
  }))
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-reviewed-transcript-correction',
  status: 'passed',
  checks,
  sourceTranscriptDigestSha256: original.transcriptDigestSha256,
  correctionArtifactDigestSha256:
    correctionArtifact.artifactDigestSha256,
  correctionRequestDigestSha256: request.requestDigestSha256,
  correctedTranscriptDigestSha256:
    record.correctedCanonicalTranscript.transcriptDigestSha256,
  correctionRecordDigestSha256: record.recordDigestSha256,
  fullTranscriptCorrectionRequired: true,
  independentAudioTruthReviewRequired: true,
  actualIndependentReviewExecutedByThisSmoke: false,
  callerSuppliedTranscriptAccepted: false,
  captionCreatedTranscriptOwner: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function originalTranscript(): CaptionCanonicalTranscript {
  const withoutDigest: Omit<CaptionCanonicalTranscript,
    'transcriptDigestSha256'> = {
    schemaVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    transcriptId: 'caption.transcript.original.correction-fixture',
    workspaceId: 'caption-workspace',
    projectId: 'caption-project',
    editSessionId: 'caption-edit-session',
    languageCode: 'en',
    sourceSpeechEvidencePackageRef: sourceSpeechRef,
    alignmentQualificationRef: ref('caption.alignment.qualification',
      'caption-alignment-qualification-v1'),
    segments: [{
      sourceSegmentId: 'caption.original.segment.1',
      sourceSequenceItemId: 'caption.source.sequence.1',
      order: 1,
      startMilliseconds: 1_000,
      endMillisecondsExclusive: 4_000,
      text: 'new arm software',
      confidenceBasisPoints: 6_000,
      exactSourceWordIds: [
        'caption.original.word.1.1',
        'caption.original.word.1.2',
        'caption.original.word.1.3',
      ],
      sourceRecordRef: sourceSpeechRef,
    }],
    words: [
      originalWord(1, 'new', 1_000, 1_700, 8_200),
      originalWord(2, 'arm', 1_700, 2_500, 4_000),
      originalWord(3, 'software', 2_500, 3_900, 7_000),
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
): CaptionCanonicalTranscript['words'][number] {
  return {
    sourceWordId: `caption.original.word.1.${order}`,
    sourceSegmentId: 'caption.original.segment.1',
    sourceSequenceItemId: 'caption.source.sequence.1',
    orderInSegment: order,
    text,
    startMilliseconds,
    endMillisecondsExclusive,
    confidenceBasisPoints,
    timestampProvenance: 'asr_native',
    wordTimingArtifactRef: ref('caption.word-timing.original',
      'caption-private-word-timing-payload-v1'),
    timestampEvidenceRef: sourceSpeechRef,
    speakerId: null,
    diarizationArtifactRef: null,
  }
}

function requestForArtifact(
  artifact: typeof correctionArtifact,
): typeof request {
  const input = structuredClone(request) as unknown as Record<string, unknown>
  delete input.schemaVersion
  delete input.requestDigestSha256
  return createCanonicalCaptionReviewedCorrectionRequest({
    ...input,
    correctionArtifactRef: ref(artifact.artifactId, artifact.schemaVersion,
      artifact.artifactDigestSha256),
  } as unknown as Omit<typeof request,
    'schemaVersion' | 'requestDigestSha256'>)
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

function redigest<T extends object>(
  value: T,
  field: string,
): T {
  const record = value as unknown as Record<string, unknown>
  record[field] = calculateSkillContractDigest(record, field)
  return value
}
