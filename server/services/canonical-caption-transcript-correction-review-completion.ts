import { z } from 'zod'

import {
  CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_COMPLETION_RECEIPT_VERSION,
  CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEWER_SUBMISSION_VERSION,
  type CanonicalCaptionTranscriptCorrectionReviewCompletionReceipt,
  type CanonicalCaptionTranscriptCorrectionReviewerSubmission,
} from '../../src/types/canonical-caption-transcript-correction-review-completion'
import type { CanonicalCaptionTranscriptCorrectionCandidate } from
  '../../src/types/canonical-caption-transcript-correction-review-package'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { CAPTION_CANONICAL_TRANSCRIPT_VERSION } from
  '../../src/types/caption-transcript-lineage'
import { CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION } from
  '../../src/types/caption-private-transcript-runtime'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseCaptionPrivateTranscriptInspectionReceipt,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest,
  createCanonicalCaptionIndependentAudioTruthReview,
  createCanonicalCaptionReviewedCorrectionArtifact,
  createCanonicalCaptionReviewedCorrectionRequest,
  parseCanonicalCaptionIndependentAudioTruthReview,
  parseCanonicalCaptionReviewedCorrectionArtifact,
  parseCanonicalCaptionReviewedCorrectionRequest,
} from './canonical-caption-reviewed-transcript-correction'
import {
  CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION,
} from '../../src/types/canonical-caption-transcript-correction-review-package'
import {
  parseCanonicalCaptionTranscriptCorrectionReviewPackage,
} from './canonical-caption-transcript-correction-review-package'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { stableAuthorityStringify } from './private-edit-authority-store'

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
const correctedWordSchema = z.object({
  correctedSourceWordId: safeKey,
  text: safePrivateText,
  startMilliseconds: z.number().int().nonnegative().max(86_400_000),
  endMillisecondsExclusive: z.number().int().positive().max(86_400_000),
  reviewConfidenceBasisPoints: z.number().int().min(8_000).max(10_000),
  replacedSourceWordIds: z.array(safeKey).min(1).max(64),
}).strict()
const reviewerDecisionSchema = z.object({
  sourceSegmentId: safeKey,
  order: z.number().int().positive().max(20_000),
  originalSourceWordIds: z.array(safeKey).min(1).max(100_000),
  correctedText: safePrivateText,
  correctedWords: z.array(correctedWordSchema).min(1).max(100_000),
  listenerDecision: z.literal('approved_audio_truth_correction'),
  segmentAudioListenedInFull: z.literal(true),
  correctedTextCheckedAgainstAudio: z.literal(true),
  correctedWordTimingCheckedAgainstAudio: z.literal(true),
  meaningAndNegationPreserved: z.literal(true),
  properNamesNumbersAndClaimsChecked: z.literal(true),
}).strict()
const submissionSchema:
z.ZodType<CanonicalCaptionTranscriptCorrectionReviewerSubmission> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEWER_SUBMISSION_VERSION),
  submissionId: safeKey,
  submissionDigestSha256: sha256,
  reviewPackageRef: refSchema,
  targetCanonicalReadScope: readScopeSchema,
  reviewerIdentityRef: refSchema,
  reviewerClass: z.literal('independent_private_audio_truth_reviewer'),
  reviewedAt: z.string().datetime({ offset: true }),
  decisions: z.array(reviewerDecisionSchema).min(1).max(20_000),
  completeSourceAudioListened: z.literal(true),
  everySourceSegmentReviewedInOrder: z.literal(true),
  everyCorrectedWordTextReviewedAgainstAudio: z.literal(true),
  everyCorrectedWordTimingReviewedAgainstAudio: z.literal(true),
  semanticMeaningAndNegationReviewed: z.literal(true),
  properNamesNumbersAndClaimSensitiveTermsReviewed: z.literal(true),
  correctedTranscriptApprovedForCanonicalOwnerProjection: z.literal(true),
  independentFromAsrRuntime: z.literal(true),
  asrCandidateTreatedAsGroundTruth: z.literal(false),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  rawTranscriptTextIncluded: z.literal(true),
  rawAudioIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  transcriptMutationAuthorityGrantedToCaption: z.literal(false),
  timingAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const receiptSchema:
z.ZodType<CanonicalCaptionTranscriptCorrectionReviewCompletionReceipt> =
z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_COMPLETION_RECEIPT_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: sha256,
  canonicalReadScope: readScopeSchema,
  reviewPackageRef: refSchema,
  reviewerSubmissionRef: refSchema,
  reviewerIdentityRef: refSchema,
  sourceTranscriptRef: refSchema,
  rejectedInspectionReceiptRef: refSchema,
  independentAudioTruthReviewRef: refSchema,
  correctionArtifactRef: refSchema,
  correctionRequestRef: refSchema,
  completedAt: z.string().datetime({ offset: true }),
  packageContextRecomputedAndMatched: z.literal(true),
  everySourceSegmentReviewedInOrder: z.literal(true),
  everyOriginalSourceWordCoveredExactlyOnce: z.literal(true),
  everyCorrectedWordTextAndTimingReviewedAgainstAudio: z.literal(true),
  properNamesNumbersClaimsAndNegationReviewed: z.literal(true),
  artifactBasisDigestBoundToIndependentReview: z.literal(true),
  canonicalOwnerRereadStillRequired: z.literal(true),
  createOnlyPrivatePersistenceRequired: z.literal(true),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  rawAudioIncluded: z.literal(false),
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

type SubmissionInput = Omit<
CanonicalCaptionTranscriptCorrectionReviewerSubmission,
'schemaVersion' | 'submissionDigestSha256'>

export function createCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  input: SubmissionInput,
): CanonicalCaptionTranscriptCorrectionReviewerSubmission {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEWER_SUBMISSION_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionTranscriptCorrectionReviewerSubmission({
    ...withoutDigest,
    submissionDigestSha256: digest(withoutDigest, 'submissionDigestSha256'),
  })
}

export function parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  value: unknown,
): CanonicalCaptionTranscriptCorrectionReviewerSubmission {
  assertClosedContractTree(value, 'Caption transcript reviewer submission')
  const submission = submissionSchema.parse(value)
  verifyDigest(submission as unknown as Record<string, unknown>,
    'submissionDigestSha256', 'Caption transcript reviewer submission')
  if (submission.reviewPackageRef.version !==
      CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION
    || new Set(submission.decisions.map((item) => item.sourceSegmentId)).size
      !== submission.decisions.length
    || new Set(submission.decisions.map((item) => item.order)).size
      !== submission.decisions.length) {
    throw new Error('Caption transcript reviewer submission lineage is invalid.')
  }
  return structuredClone(submission)
}

export function completeCanonicalCaptionTranscriptCorrectionReview(input: {
  reviewPackage: unknown
  sourceTranscript: unknown
  rejectedInspectionReceipt: unknown
  candidates: unknown[]
  reviewerSubmission: unknown
}): {
  reviewerSubmission: CanonicalCaptionTranscriptCorrectionReviewerSubmission
  independentAudioTruthReview: ReturnType<
  typeof createCanonicalCaptionIndependentAudioTruthReview>
  correctionArtifact: ReturnType<
  typeof createCanonicalCaptionReviewedCorrectionArtifact>
  correctionRequest: ReturnType<
  typeof createCanonicalCaptionReviewedCorrectionRequest>
  completionReceipt:
    CanonicalCaptionTranscriptCorrectionReviewCompletionReceipt
} {
  const transcript = parseCaptionCanonicalTranscript(input.sourceTranscript)
  const inspection = parseCaptionPrivateTranscriptInspectionReceipt(
    input.rejectedInspectionReceipt)
  const candidates = input.candidates as
    CanonicalCaptionTranscriptCorrectionCandidate[]
  const reviewPackage = parseCanonicalCaptionTranscriptCorrectionReviewPackage(
    input.reviewPackage, {
      transcript,
      inspection,
      candidates,
    })
  const submission =
    parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
      input.reviewerSubmission)
  assertCompletionLineage({ reviewPackage, submission, transcript })

  const placeholderReviewRef = domainRef(
    `caption.audio-truth-review.placeholder.${
      submission.submissionDigestSha256.slice(0, 32)}`,
    'caption-private-independent-audio-truth-review-v1',
    digest({
      placeholderForSubmission: submission.submissionDigestSha256,
    }, 'placeholderDigestSha256'))
  const artifactBasis = createCanonicalCaptionReviewedCorrectionArtifact({
    artifactId: `caption.transcript.correction.artifact.${
      submission.submissionDigestSha256.slice(0, 32)}`,
    sourceTranscriptRef: structuredClone(reviewPackage.sourceTranscriptRef),
    independentAudioTruthReviewRef: placeholderReviewRef,
    segments: submission.decisions.map((decision) => ({
      sourceSegmentId: decision.sourceSegmentId,
      order: decision.order,
      originalSourceWordIds: structuredClone(decision.originalSourceWordIds),
      correctedText: decision.correctedText,
      words: structuredClone(decision.correctedWords),
    })),
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
  const independentAudioTruthReview =
    createCanonicalCaptionIndependentAudioTruthReview({
      reviewId: `caption.audio-truth-review.${
        submission.submissionDigestSha256.slice(0, 32)}`,
      canonicalReadScope: structuredClone(submission.targetCanonicalReadScope),
      sourceMediaRef: structuredClone(reviewPackage.sourceMediaRef),
      sourceTranscriptRef: structuredClone(reviewPackage.sourceTranscriptRef),
      rejectedInspectionReceiptRef:
        structuredClone(reviewPackage.rejectedInspectionReceiptRef),
      correctionArtifactId: artifactBasis.artifactId,
      correctionArtifactVersion: artifactBasis.schemaVersion,
      correctionArtifactBasisDigestSha256:
        calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest(
          artifactBasis),
      reviewedSourceSegmentIds: submission.decisions.map((decision) =>
        decision.sourceSegmentId),
      reviewedCorrectedWordIds: submission.decisions.flatMap((decision) =>
        decision.correctedWords.map((word) => word.correctedSourceWordId)),
      reviewedAt: submission.reviewedAt,
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
  const independentReviewRef = domainRef(
    independentAudioTruthReview.reviewId,
    independentAudioTruthReview.schemaVersion,
    independentAudioTruthReview.reviewDigestSha256)
  const correctionArtifact = createCanonicalCaptionReviewedCorrectionArtifact({
    ...artifactBasis,
    independentAudioTruthReviewRef: independentReviewRef,
  })
  const correctionArtifactRef = domainRef(correctionArtifact.artifactId,
    correctionArtifact.schemaVersion,
    correctionArtifact.artifactDigestSha256)
  const correctionRequest = createCanonicalCaptionReviewedCorrectionRequest({
    requestId: `caption.transcript.correction.request.${
      submission.submissionDigestSha256.slice(0, 32)}`,
    canonicalReadScope: structuredClone(submission.targetCanonicalReadScope),
    sourceMediaRef: structuredClone(reviewPackage.sourceMediaRef),
    sourceTranscriptRef: structuredClone(reviewPackage.sourceTranscriptRef),
    rejectedInspectionReceiptRef:
      structuredClone(reviewPackage.rejectedInspectionReceiptRef),
    correctionArtifactRef,
    independentAudioTruthReviewRef: independentReviewRef,
    correctionReasonCodes: structuredClone(inspection.visibleDefectCodes),
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
  const receipt = createCompletionReceipt({
    submission,
    reviewPackageRef: domainRef(reviewPackage.packageId,
      reviewPackage.schemaVersion, reviewPackage.packageDigestSha256),
    sourceTranscriptRef: reviewPackage.sourceTranscriptRef,
    rejectedInspectionReceiptRef: reviewPackage.rejectedInspectionReceiptRef,
    independentAudioTruthReviewRef: independentReviewRef,
    correctionArtifactRef,
    correctionRequestRef: domainRef(correctionRequest.requestId,
      correctionRequest.schemaVersion, correctionRequest.requestDigestSha256),
  })
  return Object.freeze({
    reviewerSubmission: structuredClone(submission),
    independentAudioTruthReview:
      parseCanonicalCaptionIndependentAudioTruthReview(
        independentAudioTruthReview),
    correctionArtifact:
      parseCanonicalCaptionReviewedCorrectionArtifact(correctionArtifact),
    correctionRequest:
      parseCanonicalCaptionReviewedCorrectionRequest(correctionRequest),
    completionReceipt: receipt,
  })
}

export function parseCanonicalCaptionTranscriptCorrectionReviewCompletionReceipt(
  value: unknown,
): CanonicalCaptionTranscriptCorrectionReviewCompletionReceipt {
  assertClosedContractTree(value, 'Caption transcript review completion receipt')
  const receipt = receiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256', 'Caption transcript review completion receipt')
  if (receipt.reviewPackageRef.version !==
      CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_PACKAGE_VERSION
    || receipt.reviewerSubmissionRef.version !==
      CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEWER_SUBMISSION_VERSION
    || receipt.sourceTranscriptRef.version !==
      CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || receipt.rejectedInspectionReceiptRef.version !==
      CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION) {
    throw new Error('Caption transcript completion receipt lineage is invalid.')
  }
  return structuredClone(receipt)
}

function assertCompletionLineage(input: {
  reviewPackage: ReturnType<
  typeof parseCanonicalCaptionTranscriptCorrectionReviewPackage>
  submission: CanonicalCaptionTranscriptCorrectionReviewerSubmission
  transcript: ReturnType<typeof parseCaptionCanonicalTranscript>
}): void {
  const packageRef = domainRef(input.reviewPackage.packageId,
    input.reviewPackage.schemaVersion,
    input.reviewPackage.packageDigestSha256)
  if (!sameRef(input.submission.reviewPackageRef, packageRef)
    || (input.reviewPackage.targetCanonicalReadScope !== null
      && stableAuthorityStringify(
        input.reviewPackage.targetCanonicalReadScope) !==
        stableAuthorityStringify(input.submission.targetCanonicalReadScope))
    || input.submission.targetCanonicalReadScope.ownerUserId !==
      input.reviewPackage.reviewScope.ownerUserId
    || input.submission.targetCanonicalReadScope.workspaceId !==
      input.reviewPackage.reviewScope.workspaceId
    || input.submission.targetCanonicalReadScope.projectId !==
      input.reviewPackage.reviewScope.projectId
    || input.submission.targetCanonicalReadScope.editSessionId !==
      input.reviewPackage.reviewScope.editSessionId
    || input.transcript.workspaceId !==
      input.submission.targetCanonicalReadScope.workspaceId
    || input.transcript.projectId !==
      input.submission.targetCanonicalReadScope.projectId
    || input.transcript.editSessionId !==
      input.submission.targetCanonicalReadScope.editSessionId
    || input.submission.decisions.length !==
      input.reviewPackage.reviewItems.length) {
    throw new Error('Caption transcript review completion crossed authority.')
  }
  const correctedWordIds = new Set<string>()
  for (const [index, decision] of input.submission.decisions.entries()) {
    const item = input.reviewPackage.reviewItems[index]
    if (!item
      || decision.order !== index + 1
      || decision.sourceSegmentId !== item.sourceSegmentId
      || decision.order !== item.order
      || decision.originalSourceWordIds.join('|') !==
        item.originalSourceWordIds.join('|')
      || decision.correctedText !== decision.correctedWords.map(
        (word) => word.text).join(' ')) {
      throw new Error('Caption transcript reviewer decision is inconsistent.')
    }
    const originalIndexes = new Map(item.originalSourceWordIds.map(
      (wordId, wordIndex) => [wordId, wordIndex]))
    const covered = new Set<string>()
    let previousEnd = item.startMilliseconds
    let previousSourceIndex = 0
    for (const word of decision.correctedWords) {
      const sourceIndexes = word.replacedSourceWordIds.map((wordId) => {
        const sourceIndex = originalIndexes.get(wordId)
        if (sourceIndex === undefined) {
          throw new Error('Caption reviewer correction word lineage is unknown.')
        }
        if (covered.has(wordId)) {
          throw new Error('Caption reviewer correction duplicates source words.')
        }
        covered.add(wordId)
        return sourceIndex
      })
      if (new Set(sourceIndexes).size !== sourceIndexes.length
        || sourceIndexes.some((sourceIndex, sourceIndexPosition) =>
          sourceIndexPosition > 0
          && sourceIndex !== sourceIndexes[sourceIndexPosition - 1]! + 1)
        || sourceIndexes[0]! < previousSourceIndex
        || word.startMilliseconds < previousEnd
        || word.startMilliseconds < item.startMilliseconds
        || word.endMillisecondsExclusive > item.endMillisecondsExclusive
        || word.endMillisecondsExclusive <= word.startMilliseconds
        || correctedWordIds.has(word.correctedSourceWordId)) {
        throw new Error('Caption reviewer correction word timing is invalid.')
      }
      correctedWordIds.add(word.correctedSourceWordId)
      previousSourceIndex = sourceIndexes.at(-1)!
      previousEnd = word.endMillisecondsExclusive
    }
    if (covered.size !== item.originalSourceWordIds.length) {
      throw new Error('Caption reviewer correction omits source-word lineage.')
    }
  }
}

function createCompletionReceipt(input: {
  submission: CanonicalCaptionTranscriptCorrectionReviewerSubmission
  reviewPackageRef: CaptionDomainRef
  sourceTranscriptRef: CaptionDomainRef
  rejectedInspectionReceiptRef: CaptionDomainRef
  independentAudioTruthReviewRef: CaptionDomainRef
  correctionArtifactRef: CaptionDomainRef
  correctionRequestRef: CaptionDomainRef
}): CanonicalCaptionTranscriptCorrectionReviewCompletionReceipt {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_CORRECTION_REVIEW_COMPLETION_RECEIPT_VERSION,
    receiptId: `caption.transcript.correction.completion.${
      input.submission.submissionDigestSha256.slice(0, 32)}`,
    canonicalReadScope:
      structuredClone(input.submission.targetCanonicalReadScope),
    reviewPackageRef: structuredClone(input.reviewPackageRef),
    reviewerSubmissionRef: domainRef(input.submission.submissionId,
      input.submission.schemaVersion,
      input.submission.submissionDigestSha256),
    reviewerIdentityRef: structuredClone(input.submission.reviewerIdentityRef),
    sourceTranscriptRef: structuredClone(input.sourceTranscriptRef),
    rejectedInspectionReceiptRef:
      structuredClone(input.rejectedInspectionReceiptRef),
    independentAudioTruthReviewRef:
      structuredClone(input.independentAudioTruthReviewRef),
    correctionArtifactRef: structuredClone(input.correctionArtifactRef),
    correctionRequestRef: structuredClone(input.correctionRequestRef),
    completedAt: input.submission.reviewedAt,
    packageContextRecomputedAndMatched: true as const,
    everySourceSegmentReviewedInOrder: true as const,
    everyOriginalSourceWordCoveredExactlyOnce: true as const,
    everyCorrectedWordTextAndTimingReviewedAgainstAudio: true as const,
    properNamesNumbersClaimsAndNegationReviewed: true as const,
    artifactBasisDigestBoundToIndependentReview: true as const,
    canonicalOwnerRereadStillRequired: true as const,
    createOnlyPrivatePersistenceRequired: true as const,
    privateArtifact: true as const,
    browserShareable: false as const,
    transcriptTextIncluded: false as const,
    rawAudioIncluded: false as const,
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
  return parseCanonicalCaptionTranscriptCorrectionReviewCompletionReceipt({
    ...withoutDigest,
    receiptDigestSha256: digest(withoutDigest, 'receiptDigestSha256'),
  })
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
