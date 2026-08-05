import assert from 'node:assert/strict'

import {
  CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionCanonicalTranscript,
} from '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionCanonicalTranscriptAuthenticatedReadBinding,
  CaptionCanonicalTranscriptReadScope,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import type {
  CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-transcript-support'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CAPTION_ALIGNMENT_QUALIFICATION,
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  admitCaptionCanonicalTranscriptFromAuthenticatedRead,
  parseCaptionCanonicalTranscriptAuthenticatedReadBinding,
} from '../captions-specialist/caption-canonical-transcript-authenticated-read'
import {
  createCaptionPrivateTranscriptInspectionReceipt,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  createCanonicalCaptionApprovedSnapshotReadPort,
  createCanonicalCaptionTranscriptEvidenceRepository,
  parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
} from '../services/canonical-caption-transcript-support-service'
import {
  calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest,
  createCanonicalCaptionIndependentAudioTruthReview,
  createCanonicalCaptionReviewedCorrectionArtifact,
  createCanonicalCaptionReviewedCorrectionEvidenceReadPort,
  createCanonicalCaptionReviewedCorrectionOwnerService,
  createCanonicalCaptionReviewedCorrectionRepository,
  createCanonicalCaptionReviewedCorrectionRequest,
} from '../services/canonical-caption-reviewed-transcript-correction'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

let checks = 0
const scope: CaptionCanonicalTranscriptReadScope = {
  ownerUserId: 'caption-owner',
  workspaceId: 'caption-workspace',
  projectId: 'caption-project',
  editSessionId: 'caption-edit-session',
  planVersionId: 'caption-plan.v1',
  approvedSnapshotRef: ref(
    'caption.approved.snapshot', 'approved-edit-plan-snapshot-v1'),
}
const objectPort = inMemoryObjectPort()
const transcriptRepository = createCanonicalCaptionTranscriptEvidenceRepository({
  objectPort,
  prefix: 'private/tests/caption-reviewed-correction/transcripts',
})
const originalRecord = originalAuthenticatedRecord()
await transcriptRepository.persistCreateOnly({ record: originalRecord })
const original = originalRecord.canonicalTranscript
const originalRef = transcriptRef(original)

const rejectedInspection = createCaptionPrivateTranscriptInspectionReceipt({
  inspectionId: 'caption.transcript.inspection.rejected.owner-service',
  observedAt: '2026-08-05T17:00:00.000-04:00',
  executionEvidenceRef: ref(
    'caption.transcript.execution.owner-service',
    'caption-private-local-transcript-execution-evidence-v1'),
  privateTranscriptArtifactRef: ref(
    'caption.transcript.private.owner-service',
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
const rejectedInspectionRef = ref(
  rejectedInspection.inspectionId,
  rejectedInspection.schemaVersion,
  rejectedInspection.inspectionDigestSha256)
const correctionArtifactBasis = createCanonicalCaptionReviewedCorrectionArtifact({
  artifactId: 'caption.transcript.correction.owner-service',
  sourceTranscriptRef: originalRef,
  independentAudioTruthReviewRef: ref(
    'caption.audio-truth-review.owner-service',
    'caption-private-independent-audio-truth-review-v1',
    sha256AuthorityValue('placeholder-replaced-below')),
  segments: [{
    sourceSegmentId: original.segments[0]!.sourceSegmentId,
    order: 1,
    originalSourceWordIds: original.words.map((word) => word.sourceWordId),
    correctedText: 'new AI software',
    words: [{
      correctedSourceWordId: 'caption.corrected.owner-service.1',
      text: 'new',
      startMilliseconds: 1_000,
      endMillisecondsExclusive: 1_700,
      reviewConfidenceBasisPoints: 9_900,
      replacedSourceWordIds: ['caption.original.owner-service.1'],
    }, {
      correctedSourceWordId: 'caption.corrected.owner-service.2',
      text: 'AI',
      startMilliseconds: 1_700,
      endMillisecondsExclusive: 2_500,
      reviewConfidenceBasisPoints: 10_000,
      replacedSourceWordIds: ['caption.original.owner-service.2'],
    }, {
      correctedSourceWordId: 'caption.corrected.owner-service.3',
      text: 'software',
      startMilliseconds: 2_500,
      endMillisecondsExclusive: 3_900,
      reviewConfidenceBasisPoints: 9_900,
      replacedSourceWordIds: ['caption.original.owner-service.3'],
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
const independentReview = createReview(correctionArtifactBasis)
const independentReviewRef = ref(
  independentReview.reviewId,
  independentReview.schemaVersion,
  independentReview.reviewDigestSha256)
const artifact = createCanonicalCaptionReviewedCorrectionArtifact({
  ...correctionArtifactBasis,
  independentAudioTruthReviewRef: independentReviewRef,
})
const artifactRef = ref(
  artifact.artifactId, artifact.schemaVersion, artifact.artifactDigestSha256)
const request = createCanonicalCaptionReviewedCorrectionRequest({
  requestId: 'caption.transcript.correction.request.owner-service',
  canonicalReadScope: scope,
  sourceMediaRef: ref('caption.source.media.owner-service',
    'private-source-media-v1'),
  sourceTranscriptRef: originalRef,
  rejectedInspectionReceiptRef: rejectedInspectionRef,
  correctionArtifactRef: artifactRef,
  independentAudioTruthReviewRef: independentReviewRef,
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

const evidence = new Map<string, unknown>([
  [evidenceKey('rejected_transcript_inspection', rejectedInspectionRef),
    rejectedInspection],
  [evidenceKey('reviewed_correction_artifact', artifactRef), artifact],
  [evidenceKey('independent_audio_truth_review', independentReviewRef),
    independentReview],
])
const evidenceReadPort =
  createCanonicalCaptionReviewedCorrectionEvidenceReadPort(async (input) =>
    structuredClone(evidence.get(evidenceKey(
      input.evidenceKind, input.evidenceRef)) ?? null))
const approvedSnapshotReadPort = createCanonicalCaptionApprovedSnapshotReadPort(
  async (readScope) => stableAuthorityStringify(readScope) ===
      stableAuthorityStringify(scope) ? structuredClone(scope) : null)
const correctionRepository =
  createCanonicalCaptionReviewedCorrectionRepository({
    objectPort,
    prefix: 'private/tests/caption-reviewed-correction/owner',
  })
const service = createCanonicalCaptionReviewedCorrectionOwnerService({
  approvedSnapshotReadPort,
  evidenceReadPort,
  transcriptRepository,
  correctionRepository,
  now: () => new Date('2026-08-05T17:05:00.000-04:00'),
})

// The request binds both final digests; the review binds the artifact's stable
// digest basis, and the final artifact binds the exact review digest.
assert.equal(artifact.independentAudioTruthReviewRef.id,
  independentReviewRef.id)
checks += 1

let result: Awaited<ReturnType<typeof service.reconcileReviewedCorrection>>
try {
  result = await service.reconcileReviewedCorrection({ request })
} catch (error) {
  throw new Error('Positive correction owner fixture failed.', { cause: error })
}
assert.equal(result.authenticatedTranscriptRecord.canonicalTranscript
  .segments[0]?.text, 'new AI software')
checks += 1
assert.deepEqual(result.authenticatedTranscriptRecord.canonicalTranscript
  .words.map((word) => word.timestampProvenance), [
  'manually_corrected', 'manually_corrected', 'manually_corrected',
])
checks += 1
assert.equal(result.receipt.captionCreatedTranscriptOwner, false)
assert.equal(result.receipt.correctedTranscriptPersistedThroughExistingCanonicalRepository,
  true)
checks += 1

const binding = result.authenticatedTranscriptRecord.authenticatedReadBinding
const admitted = admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding,
  canonicalTranscript: result.authenticatedTranscriptRecord.canonicalTranscript,
  expectedCanonicalScope: {
    ...scope,
    outputId: 'caption-output',
    sceneId: 'caption-scene',
    authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 120 }],
  },
})
assert.equal(admitted.transcriptDigestSha256,
  result.authenticatedTranscriptRecord.canonicalTranscript
    .transcriptDigestSha256)
checks += 1

const executionRecord = await transcriptRepository.findExactForExecution({
  canonicalReadScope: scope,
  canonicalTranscriptRef: binding.canonicalTranscriptRef,
})
assert.equal(executionRecord?.recordDigestSha256,
  result.authenticatedTranscriptRecord.recordDigestSha256)
checks += 1

const replay = await service.reconcileReviewedCorrection({ request })
assert.deepEqual(replay, result)
checks += 1

const crossedReceipt = structuredClone(result.receipt)
crossedReceipt.sourceTranscriptRef = ref(
  'caption.transcript.crossed', CAPTION_CANONICAL_TRANSCRIPT_VERSION)
redigest(crossedReceipt, 'receiptDigestSha256')
await assert.rejects(() => correctionRepository.persistReceiptCreateOnly({
  receipt: crossedReceipt,
  context: {
    request,
    sourceRecord: originalRecord,
    correctionRecord: result.correctionRecord,
    authenticatedTranscriptRecord: result.authenticatedTranscriptRecord,
  },
}), /receipt crossed lineage/u)
checks += 1

assert.throws(() => createCanonicalCaptionReviewedCorrectionOwnerService({
  approvedSnapshotReadPort,
  evidenceReadPort: {
    ...evidenceReadPort,
    readExact: evidenceReadPort.readExact,
  },
  transcriptRepository,
  correctionRepository,
}), /ports are invalid/u)
checks += 1

const staleSnapshotPort = createCanonicalCaptionApprovedSnapshotReadPort(
  async () => ({ ...scope, planVersionId: 'caption-plan.stale' }))
const staleSnapshotService =
  createCanonicalCaptionReviewedCorrectionOwnerService({
    approvedSnapshotReadPort: staleSnapshotPort,
    evidenceReadPort,
    transcriptRepository,
    correctionRepository,
  })
await assert.rejects(() => staleSnapshotService.reconcileReviewedCorrection({
  request,
}), /approved snapshot reread failed/u)
checks += 1

const changedArtifact = structuredClone(artifact)
changedArtifact.segments[0]!.words[1]!.text = 'changed'
redigest(changedArtifact, 'artifactDigestSha256')
let artifactReads = 0
const changingEvidencePort =
  createCanonicalCaptionReviewedCorrectionEvidenceReadPort(async (input) => {
    if (input.evidenceKind === 'reviewed_correction_artifact') {
      artifactReads += 1
      return structuredClone(artifactReads === 1 ? artifact : changedArtifact)
    }
    return structuredClone(evidence.get(evidenceKey(
      input.evidenceKind, input.evidenceRef)) ?? null)
  })
const changingService = createCanonicalCaptionReviewedCorrectionOwnerService({
  approvedSnapshotReadPort,
  evidenceReadPort: changingEvidencePort,
  transcriptRepository,
  correctionRepository,
})
await assert.rejects(() => changingService.reconcileReviewedCorrection({
  request,
}), /reread failed/u)
checks += 1

const crossedReview = structuredClone(independentReview)
crossedReview.reviewedCorrectedWordIds = [
  ...crossedReview.reviewedCorrectedWordIds.slice(0, 2),
  'caption.corrected.owner-service.crossed',
]
redigest(crossedReview, 'reviewDigestSha256')
const crossedReviewRef = ref(
  crossedReview.reviewId,
  crossedReview.schemaVersion,
  crossedReview.reviewDigestSha256)
const crossedRequest = createCanonicalCaptionReviewedCorrectionRequest({
  ...request,
  requestId: 'caption.transcript.correction.request.crossed-review',
  independentAudioTruthReviewRef: crossedReviewRef,
})
const crossedEvidence = new Map(evidence)
crossedEvidence.set(evidenceKey(
  'independent_audio_truth_review', crossedReviewRef), crossedReview)
const crossedEvidencePort =
  createCanonicalCaptionReviewedCorrectionEvidenceReadPort(async (input) =>
    structuredClone(crossedEvidence.get(evidenceKey(
      input.evidenceKind, input.evidenceRef)) ?? null))
const crossedService = createCanonicalCaptionReviewedCorrectionOwnerService({
  approvedSnapshotReadPort,
  evidenceReadPort: crossedEvidencePort,
  transcriptRepository,
  correctionRepository,
})
await assert.rejects(() => crossedService.reconcileReviewedCorrection({
  request: crossedRequest,
}), /crossed correction lineage/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-reviewed-transcript-correction-owner-service',
  status: 'passed',
  checks,
  sourceTranscriptDigestSha256: original.transcriptDigestSha256,
  correctedTranscriptDigestSha256:
    result.authenticatedTranscriptRecord.canonicalTranscript
      .transcriptDigestSha256,
  correctedAuthenticatedRecordDigestSha256:
    result.authenticatedTranscriptRecord.recordDigestSha256,
  correctedAuthenticatedBindingDigestSha256:
    result.authenticatedTranscriptRecord.authenticatedReadBinding
      .bindingDigestSha256,
  correctionOwnerReceiptDigestSha256: result.receipt.receiptDigestSha256,
  createOnlyReplayVerified: true,
  captionExecutionReadPortVerified: true,
  actualIndependentAudioReviewExecutedByThisSmoke: false,
  callerSuppliedEvidenceAccepted: false,
  captionCreatedTranscriptOwner: false,
  directPeerDispatchPerformed: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function createReview(artifact: typeof correctionArtifactBasis) {
  return createCanonicalCaptionIndependentAudioTruthReview({
    reviewId: 'caption.audio-truth-review.owner-service',
    canonicalReadScope: scope,
    sourceMediaRef: ref('caption.source.media.owner-service',
      'private-source-media-v1'),
    sourceTranscriptRef: originalRef,
    rejectedInspectionReceiptRef: rejectedInspectionRef,
    correctionArtifactId: artifact.artifactId,
    correctionArtifactVersion: artifact.schemaVersion,
    correctionArtifactBasisDigestSha256:
      calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest(artifact),
    reviewedSourceSegmentIds: artifact.segments.map((segment) =>
      segment.sourceSegmentId),
    reviewedCorrectedWordIds: artifact.segments.flatMap((segment) =>
      segment.words.map((word) => word.correctedSourceWordId)),
    reviewedAt: '2026-08-05T17:04:00.000-04:00',
    reviewerClass: 'independent_private_audio_truth_reviewer',
    completeSourceAudioListened: true,
    everySourceSegmentReviewedInOrder: true,
    everyCorrectedWordTextReviewedAgainstAudio: true,
    everyCorrectedWordTimingReviewedAgainstAudio: true,
    semanticMeaningAndNegationReviewed: true,
    properNamesNumbersAndClaimSensitiveTermsReviewed: true,
    correctedTranscriptApprovedForCanonicalOwnerProjection: true,
    independentFromAsrRuntime: true,
    privateArtifact: true,
    browserShareable: false,
    rawTranscriptTextIncluded: false,
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
}

function originalAuthenticatedRecord():
CanonicalCaptionTranscriptAuthenticatedEvidenceRecord {
  const evidenceRef = ref(
    'caption.word-timing.owner-service',
    'canonical-caption-source-word-timing-evidence-v1')
  const evidenceRefs = [evidenceRef]
  const sourceScopeDigestSha256 = sha256AuthorityValue({
    fixture: 'caption-reviewed-correction-owner-service',
    scope,
  })
  const sourceSpeechRef = ref(
    'caption.source.speech.owner-service',
    'canonical-caption-source-speech-evidence-projection-v1',
    sha256AuthorityValue({ sourceScopeDigestSha256, evidenceRefs }))
  const alignmentRef = ref(
    CAPTION_ALIGNMENT_QUALIFICATION.qualificationId,
    CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
    CAPTION_ALIGNMENT_QUALIFICATION.qualificationDigestSha256)
  const withoutTranscriptDigest: Omit<CaptionCanonicalTranscript,
    'transcriptDigestSha256'> = {
    schemaVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    transcriptId: 'caption.transcript.original.owner-service',
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    languageCode: 'en',
    sourceSpeechEvidencePackageRef: sourceSpeechRef,
    alignmentQualificationRef: alignmentRef,
    segments: [{
      sourceSegmentId: 'caption.original.owner-service.segment.1',
      sourceSequenceItemId: 'caption.source.sequence.owner-service.1',
      order: 1,
      startMilliseconds: 1_000,
      endMillisecondsExclusive: 4_000,
      text: 'new arm software',
      confidenceBasisPoints: 4_000,
      exactSourceWordIds: [
        'caption.original.owner-service.1',
        'caption.original.owner-service.2',
        'caption.original.owner-service.3',
      ],
      sourceRecordRef: evidenceRef,
    }],
    words: [
      originalWord(1, 'new', 1_000, 1_700, 8_200, evidenceRef),
      originalWord(2, 'arm', 1_700, 2_500, 4_000, evidenceRef),
      originalWord(3, 'software', 2_500, 3_900, 7_000, evidenceRef),
    ],
    immutable: true,
    singleCanonicalTranscript: true,
    rawChatIncluded: false,
    browserShareable: false,
    privateArtifact: true,
    timingAuthorityClaimed: false,
  }
  const transcript = parseCaptionCanonicalTranscript({
    ...withoutTranscriptDigest,
    transcriptDigestSha256: digest({
      ...withoutTranscriptDigest,
      transcriptDigestSha256: '',
    }, 'transcriptDigestSha256'),
  })
  const binding = originalBinding({ transcript, sourceSpeechRef, alignmentRef })
  const withoutRecordDigest: Omit<
    CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
    'recordDigestSha256'
  > = {
    schemaVersion: 'canonical-caption-transcript-authenticated-evidence-record-v1',
    recordId: `caption.transcript.record.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    canonicalReadScope: scope,
    sourceScopeDigestSha256,
    sourceSpeechEvidenceProjectionRef: sourceSpeechRef,
    sourceWordTimingEvidenceRefs: evidenceRefs,
    alignmentQualification: CAPTION_ALIGNMENT_QUALIFICATION,
    canonicalTranscript: transcript,
    authenticatedReadBinding: binding,
    createdAt: '2026-08-05T16:59:00.000-04:00',
    canonicalSourceTranscriptOwnerRereadVerified: true,
    exactPrivateWordTimingRereadVerified: true,
    exactSourceOrderAndScopeVerified: true,
    exactSegmentAndWordLineageVerified: true,
    exactApprovedSnapshotRereadVerified: true,
    createOnlyPersistedAndReread: true,
    singleCanonicalTranscriptVerified: true,
    privateArtifact: true,
    browserShareable: false,
    rawAudioIncluded: false,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    pathsUrlsOrCredentialsIncluded: false,
    directPeerDispatchPerformed: false,
    providerCallPerformedByBridge: false,
    transcriptRuntimePerformedByBridge: false,
    transcriptMutationAuthorityGrantedToCaption: false,
    timingAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord({
    ...withoutRecordDigest,
    recordDigestSha256: digest({
      ...withoutRecordDigest,
      recordDigestSha256: '',
    }, 'recordDigestSha256'),
  })
}

function originalBinding(input: {
  transcript: CaptionCanonicalTranscript
  sourceSpeechRef: CaptionDomainRef
  alignmentRef: CaptionDomainRef
}): CaptionCanonicalTranscriptAuthenticatedReadBinding {
  const withoutDigest: Omit<
    CaptionCanonicalTranscriptAuthenticatedReadBinding,
    'bindingDigestSha256'
  > = {
    schemaVersion: 'caption-canonical-transcript-authenticated-read-binding-v1',
    bindingId: `caption.transcript.binding.${
      input.transcript.transcriptDigestSha256.slice(0, 32)}`,
    ownerKey: 'canonical_transcript',
    consumerSkillKey: 'captions',
    artifactType: 'canonical_transcript',
    canonicalReadScope: scope,
    canonicalTranscriptRef: transcriptRef(input.transcript),
    sourceSpeechEvidencePackageRef: input.sourceSpeechRef,
    alignmentQualificationRef: input.alignmentRef,
    diarizationArtifactRefs: [],
    speakerDiarizationState: 'not_present',
    persistenceReadReceiptRef: ref(
      'caption.transcript.persistence.owner-service',
      'canonical-transcript-authenticated-read-record-v1'),
    authenticatedOwnerEvidenceRef: ref(
      'caption.transcript.owner.owner-service',
      'canonical-transcript-authenticated-owner-evidence-v1'),
    exactPrivateArtifactRereadVerified: true,
    exactTranscriptDigestRecomputed: true,
    exactTenantScopeVerified: true,
    exactApprovedSnapshotVerified: true,
    exactSourceAndAlignmentLineageVerified: true,
    exactDiarizationLineageVerified: true,
    immutableTranscriptVerified: true,
    singleCanonicalTranscriptVerified: true,
    privateArtifact: true,
    byteFreeBinding: true,
    canonicalTranscriptPayloadEmbedded: false,
    transcriptTextIncluded: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    credentialsIncluded: false,
    browserLocalCompletionAccepted: false,
    transcriptMutationAuthorityGranted: false,
    timingAuthorityGranted: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionCanonicalTranscriptAuthenticatedReadBinding({
    ...withoutDigest,
    bindingDigestSha256: digest({
      ...withoutDigest,
      bindingDigestSha256: '',
    }, 'bindingDigestSha256'),
  })
}

function originalWord(
  order: number,
  text: string,
  startMilliseconds: number,
  endMillisecondsExclusive: number,
  confidenceBasisPoints: number,
  evidenceRef: CaptionDomainRef,
): CaptionCanonicalTranscript['words'][number] {
  return {
    sourceWordId: `caption.original.owner-service.${order}`,
    sourceSegmentId: 'caption.original.owner-service.segment.1',
    sourceSequenceItemId: 'caption.source.sequence.owner-service.1',
    orderInSegment: order,
    text,
    startMilliseconds,
    endMillisecondsExclusive,
    confidenceBasisPoints,
    timestampProvenance: 'asr_native',
    wordTimingArtifactRef: evidenceRef,
    timestampEvidenceRef: evidenceRef,
    speakerId: null,
    diarizationArtifactRef: null,
  }
}

function inMemoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const values = new Map<string, Buffer>()
  return Object.freeze({
    async createOnly(input: Parameters<
      CanonicalCreateOnlyJsonObjectPort['createOnly']
    >[0]) {
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) {
          throw new Error('Fixture create-only collision.')
        }
        return 'already_exists' as const
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created' as const
    },
    async readExact(path: string) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  })
}

function evidenceKey(kind: string, reference: CaptionDomainRef): string {
  return `${kind}|${reference.id}|${reference.version}|${reference.contentHash}`
}

function transcriptRef(transcript: CaptionCanonicalTranscript): CaptionDomainRef {
  return ref(
    transcript.transcriptId,
    transcript.schemaVersion,
    transcript.transcriptDigestSha256,
  )
}

function ref(
  id: string,
  version: string,
  contentHash = sha256AuthorityValue(`${id}|${version}`),
): CaptionDomainRef {
  return { id, version, contentHash }
}

function digest(value: object, field: string): string {
  return calculateSkillContractDigest(
    value as unknown as Record<string, unknown>, field)
}

function redigest(value: object, field: string): void {
  Object.assign(value, { [field]: digest(value, field) })
}
