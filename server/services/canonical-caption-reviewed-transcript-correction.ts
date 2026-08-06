import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION,
  CANONICAL_CAPTION_INDEPENDENT_AUDIO_TRUTH_REVIEW_VERSION,
  CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION,
  CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_RECEIPT_VERSION,
  CANONICAL_CAPTION_REVIEWED_CORRECTION_REQUEST_VERSION,
  type CanonicalCaptionIndependentAudioTruthReview,
  type CanonicalCaptionReviewedCorrectionArtifact,
  type CanonicalCaptionReviewedCorrectionOwnerReceipt,
  type CanonicalCaptionReviewedCorrectionRecord,
  type CanonicalCaptionReviewedCorrectionRequest,
} from '../../src/types/canonical-caption-reviewed-transcript-correction'
import {
  CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionAlignmentQualification,
  type CaptionCanonicalTranscript,
} from '../../src/types/caption-transcript-lineage'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  type CaptionCanonicalTranscriptAuthenticatedReadBinding,
  type CaptionCanonicalTranscriptReadScope,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import {
  CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  type CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
  type CanonicalCaptionTranscriptPlanningExpectationBinding,
} from '../../src/types/canonical-caption-transcript-support'
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
  parseCaptionAlignmentQualification,
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  parseCaptionCanonicalTranscriptAuthenticatedReadBinding,
} from '../captions-specialist/caption-canonical-transcript-authenticated-read'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalCaptionApprovedSnapshotReadPort,
  assertCanonicalCaptionTranscriptEvidenceRepository,
  createCanonicalCaptionTranscriptPlanningExpectationBindingForRecord,
  parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
  resolveCanonicalCaptionTranscriptPlanningExpectation,
  type CanonicalCaptionApprovedSnapshotReadPort,
  type CanonicalCaptionTranscriptEvidenceRepository,
} from './canonical-caption-transcript-support-service'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  type CanonicalSourceTranscriptOrchestraReadPort,
  type CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
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

export const CANONICAL_CAPTION_REVIEWED_CORRECTION_EVIDENCE_READ_PORT_VERSION =
  'canonical-caption-reviewed-transcript-evidence-read-port-v1' as const
export const CANONICAL_CAPTION_REVIEWED_CORRECTION_REPOSITORY_VERSION =
  'canonical-caption-reviewed-transcript-correction-repository-v1' as const
export const CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_SERVICE_VERSION =
  'canonical-caption-reviewed-transcript-correction-owner-service-v1' as const
export const CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_SERVICE_V2_VERSION =
  'canonical-caption-reviewed-transcript-correction-owner-service-v2' as const

const independentReviewSchema:
z.ZodType<CanonicalCaptionIndependentAudioTruthReview> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_INDEPENDENT_AUDIO_TRUTH_REVIEW_VERSION),
  reviewId: safeKey,
  reviewDigestSha256: sha256,
  canonicalReadScope: readScopeSchema,
  sourceMediaRef: refSchema,
  sourceTranscriptRef: refSchema,
  rejectedInspectionReceiptRef: refSchema,
  correctionArtifactId: safeKey,
  correctionArtifactVersion: z.literal(
    CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION),
  correctionArtifactBasisDigestSha256: sha256,
  reviewedSourceSegmentIds: z.array(safeKey).min(1).max(20_000),
  reviewedCorrectedWordIds: z.array(safeKey).min(1).max(1_000_000),
  reviewedAt: z.string().datetime({ offset: true }),
  reviewerClass: z.literal('independent_private_audio_truth_reviewer'),
  completeSourceAudioListened: z.literal(true),
  everySourceSegmentReviewedInOrder: z.literal(true),
  everyCorrectedWordTextReviewedAgainstAudio: z.literal(true),
  everyCorrectedWordTimingReviewedAgainstAudio: z.literal(true),
  semanticMeaningAndNegationReviewed: z.literal(true),
  properNamesNumbersAndClaimSensitiveTermsReviewed: z.literal(true),
  correctedTranscriptApprovedForCanonicalOwnerProjection: z.literal(true),
  independentFromAsrRuntime: z.literal(true),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  rawTranscriptTextIncluded: z.literal(false),
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

const ownerReceiptSchema:
z.ZodType<CanonicalCaptionReviewedCorrectionOwnerReceipt> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_RECEIPT_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: sha256,
  canonicalReadScope: readScopeSchema,
  requestRef: refSchema,
  sourceTranscriptRef: refSchema,
  sourceAuthenticatedTranscriptRecordRef: refSchema,
  rejectedInspectionReceiptRef: refSchema,
  correctionArtifactRef: refSchema,
  independentAudioTruthReviewRef: refSchema,
  correctionRecordRef: refSchema,
  correctedCanonicalTranscriptRef: refSchema,
  correctedAuthenticatedTranscriptRecordRef: refSchema,
  correctedAuthenticatedReadBindingRef: refSchema,
  createdAt: z.string().datetime({ offset: true }),
  approvedSnapshotRereadTwiceAndMatched: z.literal(true),
  sourceTranscriptRereadTwiceAndMatched: z.literal(true),
  rejectedInspectionRereadTwiceAndMatched: z.literal(true),
  correctionArtifactRereadTwiceAndMatched: z.literal(true),
  independentAudioTruthReviewRereadTwiceAndMatched: z.literal(true),
  completeCorrectionAndReviewCoverageVerified: z.literal(true),
  correctionRecordPersistedCreateOnlyAndReread: z.literal(true),
  correctedTranscriptPersistedThroughExistingCanonicalRepository:
    z.literal(true),
  correctedTranscriptAuthenticatedReadRereadVerified: z.literal(true),
  captionCreatedTranscriptOwner: z.literal(false),
  privateInternalOnly: z.literal(true),
  browserShareable: z.literal(false),
  transcriptTextIncluded: z.literal(false),
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

export interface CanonicalCaptionReviewedCorrectionEvidenceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_EVIDENCE_READ_PORT_VERSION
  readonly evidenceClass:
    'process_bound_private_reviewed_transcript_evidence_reader'
  readonly callerSuppliedEvidenceAccepted: false
  readExact(input: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly evidenceKind:
      | 'rejected_transcript_inspection'
      | 'reviewed_correction_artifact'
      | 'independent_audio_truth_review'
    readonly evidenceRef: CaptionDomainRef
  }): Promise<unknown>
}

export interface CanonicalCaptionReviewedCorrectionRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_REPOSITORY_VERSION
  persistCorrectionCreateOnly(input: {
    readonly record: CanonicalCaptionReviewedCorrectionRecord
    readonly context: CanonicalCaptionReviewedCorrectionRecordContext
  }): Promise<'created' | 'identical_replay'>
  rereadCorrection(input: {
    readonly recordRef: CaptionDomainRef
    readonly context: CanonicalCaptionReviewedCorrectionRecordContext
  }): Promise<CanonicalCaptionReviewedCorrectionRecord | null>
  persistReceiptCreateOnly(input: {
    readonly receipt: CanonicalCaptionReviewedCorrectionOwnerReceipt
    readonly context: CanonicalCaptionReviewedCorrectionOwnerReceiptContext
  }): Promise<'created' | 'identical_replay'>
  rereadReceipt(input: {
    readonly receiptRef: CaptionDomainRef
    readonly context: CanonicalCaptionReviewedCorrectionOwnerReceiptContext
  }): Promise<CanonicalCaptionReviewedCorrectionOwnerReceipt | null>
}

export interface CanonicalCaptionReviewedCorrectionOwnerService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_SERVICE_VERSION
  reconcileReviewedCorrection(input: {
    readonly request: unknown
  }): Promise<{
    readonly correctionRecord: CanonicalCaptionReviewedCorrectionRecord
    readonly authenticatedTranscriptRecord:
      CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
    readonly receipt: CanonicalCaptionReviewedCorrectionOwnerReceipt
  }>
}

export interface CanonicalCaptionReviewedCorrectionOwnerServiceV2 {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_SERVICE_V2_VERSION
  reconcileReviewedCorrectionForPlanningExpectation(input: {
    readonly request: unknown
    readonly sourceScopes:
      readonly CanonicalSourceTranscriptOrchestraReadScope[]
  }): Promise<{
    readonly correctionRecord: CanonicalCaptionReviewedCorrectionRecord
    readonly authenticatedTranscriptRecord:
      CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
    readonly receipt: CanonicalCaptionReviewedCorrectionOwnerReceipt
    readonly planningExpectationBinding:
      CanonicalCaptionTranscriptPlanningExpectationBinding
  }>
}

export interface CanonicalCaptionReviewedCorrectionRecordContext {
  readonly request: unknown
  readonly artifact: unknown
  readonly original: unknown
  readonly inspection: unknown
}

export interface CanonicalCaptionReviewedCorrectionOwnerReceiptContext {
  readonly request: CanonicalCaptionReviewedCorrectionRequest
  readonly sourceRecord: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  readonly correctionRecord: CanonicalCaptionReviewedCorrectionRecord
  readonly authenticatedTranscriptRecord:
    CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
}

const admittedEvidenceReaders = new WeakSet<object>()
const admittedCorrectionRepositories = new WeakSet<object>()
const admittedCorrectionOwnerServices = new WeakSet<object>()

type ArtifactInput = Omit<CanonicalCaptionReviewedCorrectionArtifact,
  'schemaVersion' | 'artifactDigestSha256'>
type RequestInput = Omit<CanonicalCaptionReviewedCorrectionRequest,
  'schemaVersion' | 'requestDigestSha256'>

export function createCanonicalCaptionIndependentAudioTruthReview(
  input: Omit<CanonicalCaptionIndependentAudioTruthReview,
    'schemaVersion' | 'reviewDigestSha256'>,
): CanonicalCaptionIndependentAudioTruthReview {
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_INDEPENDENT_AUDIO_TRUTH_REVIEW_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionIndependentAudioTruthReview({
    ...withoutDigest,
    reviewDigestSha256: digest(withoutDigest, 'reviewDigestSha256'),
  })
}

export function calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest(
  value: unknown,
): string {
  const artifact = parseCanonicalCaptionReviewedCorrectionArtifact(value)
  const basis = structuredClone(artifact) as unknown as Record<string, unknown>
  delete basis.artifactDigestSha256
  delete basis.independentAudioTruthReviewRef
  return sha256AuthorityValue(basis)
}

export function parseCanonicalCaptionIndependentAudioTruthReview(
  value: unknown,
): CanonicalCaptionIndependentAudioTruthReview {
  assertClosedContractTree(
    value, 'Canonical Caption independent audio truth review')
  const review = independentReviewSchema.parse(value)
  verifyDigest(review as unknown as Record<string, unknown>,
    'reviewDigestSha256', 'Canonical Caption independent audio truth review')
  if (review.sourceTranscriptRef.version !== CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || review.rejectedInspectionReceiptRef.version !==
      CAPTION_PRIVATE_TRANSCRIPT_INSPECTION_RECEIPT_VERSION
    || review.correctionArtifactVersion !==
      CANONICAL_CAPTION_REVIEWED_CORRECTION_ARTIFACT_VERSION
    || new Set(review.reviewedSourceSegmentIds).size !==
      review.reviewedSourceSegmentIds.length
    || new Set(review.reviewedCorrectedWordIds).size !==
      review.reviewedCorrectedWordIds.length) {
    throw new Error(
      'Canonical Caption independent audio truth review lineage is invalid.',
    )
  }
  return structuredClone(review)
}

export function parseCanonicalCaptionReviewedCorrectionOwnerReceipt(
  value: unknown,
): CanonicalCaptionReviewedCorrectionOwnerReceipt {
  assertClosedContractTree(value, 'Canonical Caption correction owner receipt')
  const receipt = ownerReceiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'receiptDigestSha256', 'Canonical Caption correction owner receipt')
  if (receipt.sourceTranscriptRef.version !== CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || receipt.correctedCanonicalTranscriptRef.version !==
      CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || receipt.correctionRecordRef.version !==
      CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION
    || receipt.correctedAuthenticatedTranscriptRecordRef.version !==
      CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION
    || receipt.correctedAuthenticatedReadBindingRef.version !==
      CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION) {
    throw new Error('Canonical Caption correction owner receipt is invalid.')
  }
  return structuredClone(receipt)
}

export function createCanonicalCaptionReviewedCorrectionEvidenceReadPort(
  readExact: CanonicalCaptionReviewedCorrectionEvidenceReadPort['readExact'],
): CanonicalCaptionReviewedCorrectionEvidenceReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption correction evidence reader is required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REVIEWED_CORRECTION_EVIDENCE_READ_PORT_VERSION,
    evidenceClass:
      'process_bound_private_reviewed_transcript_evidence_reader' as const,
    callerSuppliedEvidenceAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedEvidenceReaders.add(port)
  return port
}

export function createCanonicalCaptionReviewedCorrectionRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalCaptionReviewedCorrectionRepository {
  assertCreateOnlyObjectPort(input.objectPort)
  const prefix = normalizeRepositoryPrefix(input.prefix
    ?? 'private/orchestra/v1/caption-reviewed-transcript-correction')
  const repository: CanonicalCaptionReviewedCorrectionRepository = {
    schemaVersion: CANONICAL_CAPTION_REVIEWED_CORRECTION_REPOSITORY_VERSION,
    async persistCorrectionCreateOnly({ record: value, context }) {
      const record = parseCanonicalCaptionReviewedCorrectionRecord(
        value, context)
      const recordRef = correctionRecordRef(record)
      return persistStableJson({
        port: input.objectPort,
        path: correctionRecordPath(prefix, recordRef),
        value: record,
        reread: () => repository.rereadCorrection({ recordRef, context }),
        expectedDigest: record.recordDigestSha256,
        digestFromReread: (reread) => reread.recordDigestSha256,
        label: 'Canonical Caption correction record',
      })
    },
    async rereadCorrection({ recordRef: untrustedRef, context }) {
      const recordRef = refSchema.parse(untrustedRef)
      if (recordRef.version !==
        CANONICAL_CAPTION_REVIEWED_CORRECTION_RECORD_VERSION) {
        throw new Error('Canonical Caption correction record ref is invalid.')
      }
      const value = await readStableJson(
        input.objectPort,
        correctionRecordPath(prefix, recordRef),
        'Canonical Caption correction record')
      if (value === null) return null
      const record = parseCanonicalCaptionReviewedCorrectionRecord(
        value, context)
      if (!sameRef(correctionRecordRef(record), recordRef)) {
        throw new Error('Canonical Caption correction record reread crossed ref.')
      }
      return record
    },
    async persistReceiptCreateOnly({ receipt: value, context }) {
      const receipt = parseCanonicalCaptionReviewedCorrectionOwnerReceipt(value)
      assertCorrectionOwnerReceiptContext(receipt, context)
      const receiptRef = ownerReceiptRef(receipt)
      return persistStableJson({
        port: input.objectPort,
        path: ownerReceiptPath(prefix, receiptRef),
        value: receipt,
        reread: () => repository.rereadReceipt({ receiptRef, context }),
        expectedDigest: receipt.receiptDigestSha256,
        digestFromReread: (reread) => reread.receiptDigestSha256,
        label: 'Canonical Caption correction owner receipt',
      })
    },
    async rereadReceipt({ receiptRef: untrustedRef, context }) {
      const receiptRef = refSchema.parse(untrustedRef)
      if (receiptRef.version !==
        CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_RECEIPT_VERSION) {
        throw new Error('Canonical Caption correction receipt ref is invalid.')
      }
      const value = await readStableJson(
        input.objectPort,
        ownerReceiptPath(prefix, receiptRef),
        'Canonical Caption correction owner receipt')
      if (value === null) return null
      const receipt = parseCanonicalCaptionReviewedCorrectionOwnerReceipt(value)
      assertCorrectionOwnerReceiptContext(receipt, context)
      if (!sameRef(ownerReceiptRef(receipt), receiptRef)) {
        throw new Error('Canonical Caption correction receipt reread crossed ref.')
      }
      return receipt
    },
  }
  const frozenRepository = Object.freeze(repository)
  admittedCorrectionRepositories.add(frozenRepository)
  return frozenRepository
}

export function createCanonicalCaptionReviewedCorrectionOwnerService(input: {
  readonly approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
  readonly evidenceReadPort: CanonicalCaptionReviewedCorrectionEvidenceReadPort
  readonly transcriptRepository: CanonicalCaptionTranscriptEvidenceRepository
  readonly correctionRepository: CanonicalCaptionReviewedCorrectionRepository
  readonly now?: () => Date
}): CanonicalCaptionReviewedCorrectionOwnerService {
  assertCorrectionOwnerPorts(input)
  const service: CanonicalCaptionReviewedCorrectionOwnerService = {
    schemaVersion:
      CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_SERVICE_VERSION,
    async reconcileReviewedCorrection({ request: untrustedRequest }) {
      const request = parseCanonicalCaptionReviewedCorrectionRequest(
        untrustedRequest)
      await assertApprovedSnapshotReadTwice(
        input.approvedSnapshotReadPort, request.canonicalReadScope)
      const sourceRecord = await readSourceTranscriptRecordTwice({
        repository: input.transcriptRepository,
        request,
      })
      const rejectedInspection = parseCaptionPrivateTranscriptInspectionReceipt(
        await readCorrectionEvidenceTwice({
          port: input.evidenceReadPort,
          request,
          evidenceKind: 'rejected_transcript_inspection',
          evidenceRef: request.rejectedInspectionReceiptRef,
        }))
      const artifact = parseCanonicalCaptionReviewedCorrectionArtifact(
        await readCorrectionEvidenceTwice({
          port: input.evidenceReadPort,
          request,
          evidenceKind: 'reviewed_correction_artifact',
          evidenceRef: request.correctionArtifactRef,
        }))
      const review = parseCanonicalCaptionIndependentAudioTruthReview(
        await readCorrectionEvidenceTwice({
          port: input.evidenceReadPort,
          request,
          evidenceKind: 'independent_audio_truth_review',
          evidenceRef: request.independentAudioTruthReviewRef,
        }))
      assertIndependentReviewMatches({ request, artifact, review })
      const createdAt = (input.now ?? (() => new Date()))().toISOString()
      const context: CanonicalCaptionReviewedCorrectionRecordContext = {
        request,
        artifact,
        original: sourceRecord.canonicalTranscript,
        inspection: rejectedInspection,
      }
      const correctionRecord = createCanonicalCaptionReviewedCorrectionRecord({
        request,
        correctionArtifact: artifact,
        originalCanonicalTranscript: sourceRecord.canonicalTranscript,
        rejectedInspectionReceipt: rejectedInspection,
        createdAt,
      })
      await input.correctionRepository.persistCorrectionCreateOnly({
        record: correctionRecord,
        context,
      })
      const correctionReread = await input.correctionRepository
        .rereadCorrection({
          recordRef: correctionRecordRef(correctionRecord),
          context,
        })
      if (!correctionReread
        || correctionReread.recordDigestSha256 !==
          correctionRecord.recordDigestSha256) {
        throw new Error('Canonical Caption correction record reconciliation failed.')
      }
      const authenticatedTranscriptRecord =
        createCorrectedAuthenticatedTranscriptRecord({
          request,
          sourceRecord,
          correctionRecord: correctionReread,
          createdAt,
        })
      await input.transcriptRepository.persistCreateOnly({
        record: authenticatedTranscriptRecord,
      })
      const transcriptReread = await input.transcriptRepository.rereadRecord({
        canonicalReadScope: request.canonicalReadScope,
        canonicalTranscriptRef:
          authenticatedTranscriptRecord.authenticatedReadBinding
            .canonicalTranscriptRef,
        authenticatedReadBindingRef: bindingRef(
          authenticatedTranscriptRecord.authenticatedReadBinding),
      })
      if (!transcriptReread
        || transcriptReread.recordDigestSha256 !==
          authenticatedTranscriptRecord.recordDigestSha256) {
        throw new Error(
          'Canonical Caption corrected transcript reconciliation failed.',
        )
      }
      const receipt = createCorrectionOwnerReceipt({
        request,
        sourceRecord,
        correctionRecord: correctionReread,
        authenticatedTranscriptRecord: transcriptReread,
        createdAt,
      })
      const receiptContext = {
        request,
        sourceRecord,
        correctionRecord: correctionReread,
        authenticatedTranscriptRecord: transcriptReread,
      }
      await input.correctionRepository.persistReceiptCreateOnly({
        receipt,
        context: receiptContext,
      })
      const receiptReread = await input.correctionRepository.rereadReceipt({
        receiptRef: ownerReceiptRef(receipt),
        context: receiptContext,
      })
      if (!receiptReread
        || receiptReread.receiptDigestSha256 !== receipt.receiptDigestSha256) {
        throw new Error('Canonical Caption correction receipt reconciliation failed.')
      }
      return Object.freeze({
        correctionRecord: structuredClone(correctionReread),
        authenticatedTranscriptRecord: structuredClone(transcriptReread),
        receipt: structuredClone(receiptReread),
      })
    },
  }
  const frozenService = Object.freeze(service)
  admittedCorrectionOwnerServices.add(frozenService)
  return frozenService
}

export function assertCanonicalCaptionReviewedCorrectionOwnerService(
  value: unknown,
): asserts value is CanonicalCaptionReviewedCorrectionOwnerService {
  if (!value || typeof value !== 'object'
    || !admittedCorrectionOwnerServices.has(value)
    || (value as CanonicalCaptionReviewedCorrectionOwnerService)
      .schemaVersion !==
        CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_SERVICE_VERSION
    || typeof (value as CanonicalCaptionReviewedCorrectionOwnerService)
      .reconcileReviewedCorrection !== 'function') {
    throw new Error(
      'Canonical Caption reviewed correction owner service is invalid.',
    )
  }
}

export function createCanonicalCaptionReviewedCorrectionOwnerServiceV2(input: {
  readonly ownerService: CanonicalCaptionReviewedCorrectionOwnerService
  readonly approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
  readonly sourceTranscriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
  readonly transcriptRepository: CanonicalCaptionTranscriptEvidenceRepository
}): CanonicalCaptionReviewedCorrectionOwnerServiceV2 {
  assertCanonicalCaptionReviewedCorrectionOwnerService(input.ownerService)
  assertCanonicalCaptionApprovedSnapshotReadPort(
    input.approvedSnapshotReadPort,
  )
  assertCanonicalCaptionTranscriptEvidenceRepository(
    input.transcriptRepository,
  )
  if (input.sourceTranscriptReadPort?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION
    || typeof input.sourceTranscriptReadPort.readCompleted !== 'function') {
    throw new Error(
      'Canonical Caption reviewed correction source transcript port is invalid.',
    )
  }
  const service: CanonicalCaptionReviewedCorrectionOwnerServiceV2 = {
    schemaVersion:
      CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_SERVICE_V2_VERSION,
    async reconcileReviewedCorrectionForPlanningExpectation({
      request: untrustedRequest,
      sourceScopes,
    }) {
      const request = parseCanonicalCaptionReviewedCorrectionRequest(
        untrustedRequest,
      )
      const planning =
        await resolveCanonicalCaptionTranscriptPlanningExpectation({
          approvedSnapshotReadPort: input.approvedSnapshotReadPort,
          sourceTranscriptReadPort: input.sourceTranscriptReadPort,
          canonicalReadScope: request.canonicalReadScope,
          sourceScopes,
        })
      const sourceRecord = await readSourceTranscriptRecordTwice({
        repository: input.transcriptRepository,
        request,
      })
      if (sourceRecord.sourceScopeDigestSha256 !==
          planning.sourceScopeDigestSha256) {
        throw new Error(
          'Canonical Caption reviewed correction crossed its planning source scope.',
        )
      }
      const reconciled = await input.ownerService.reconcileReviewedCorrection({
        request,
      })
      if (!sameRef(
        reconciled.receipt.sourceAuthenticatedTranscriptRecordRef,
        authenticatedTranscriptRecordRef(sourceRecord),
      )) {
        throw new Error(
          'Canonical Caption reviewed correction crossed its source transcript record.',
        )
      }
      const planningExpectationBinding =
        createCanonicalCaptionTranscriptPlanningExpectationBindingForRecord({
          planningExpectationRef: planning.planningExpectationRef,
          transcriptRecord: reconciled.authenticatedTranscriptRecord,
        })
      await input.transcriptRepository
        .persistPlanningExpectationBindingCreateOnly({
          binding: planningExpectationBinding,
        })
      const reread = await input.transcriptRepository
        .findExactForPlanningExpectation({
          canonicalReadScope: request.canonicalReadScope,
          planningExpectationRef: planning.planningExpectationRef,
        })
      if (!reread
        || reread.binding.bindingDigestSha256 !==
          planningExpectationBinding.bindingDigestSha256
        || reread.transcriptRecord.recordDigestSha256 !==
          reconciled.authenticatedTranscriptRecord.recordDigestSha256) {
        throw new Error(
          'Canonical Caption reviewed correction planning expectation did not reconcile.',
        )
      }
      return Object.freeze({
        correctionRecord: structuredClone(reconciled.correctionRecord),
        authenticatedTranscriptRecord:
          structuredClone(reread.transcriptRecord),
        receipt: structuredClone(reconciled.receipt),
        planningExpectationBinding: structuredClone(reread.binding),
      })
    },
  }
  return Object.freeze(service)
}

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
      const replacedWords = word.replacedSourceWordIds.map((wordId) =>
        originalWords.get(wordId)!)
      const speakerIds = new Set(replacedWords.map((item) => item.speakerId))
      const diarizationRefs = new Map(replacedWords.flatMap((item) =>
        item.diarizationArtifactRef === null ? [] : [[
          `${item.diarizationArtifactRef.id}|${
            item.diarizationArtifactRef.version}|${
            item.diarizationArtifactRef.contentHash}`,
          item.diarizationArtifactRef,
        ] as const]))
      const sourceHasDiarization = replacedWords.every((item) =>
        item.speakerId !== null && item.diarizationArtifactRef !== null)
      if ((sourceHasDiarization
        && (speakerIds.size !== 1 || diarizationRefs.size !== 1))
        || (!sourceHasDiarization && replacedWords.some((item) =>
          item.speakerId !== null || item.diarizationArtifactRef !== null))) {
        throw new Error(
          'Canonical Caption correction cannot merge crossed speaker lineage.',
        )
      }
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
        speakerId: sourceHasDiarization
          ? replacedWords[0]!.speakerId : null,
        diarizationArtifactRef: sourceHasDiarization
          ? structuredClone(replacedWords[0]!.diarizationArtifactRef) : null,
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
    sourceSpeechEvidencePackageRef: correctedSourceSpeechEvidenceRef({
      request: input.request,
      original: input.original,
    }),
    segments: correctedSegments,
    words: correctedWords,
  }
  return parseCaptionCanonicalTranscript({
    ...withoutDigest,
    transcriptDigestSha256: digest(withoutDigest, 'transcriptDigestSha256'),
  })
}

function createCorrectedAuthenticatedTranscriptRecord(input: {
  request: CanonicalCaptionReviewedCorrectionRequest
  sourceRecord: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  correctionRecord: CanonicalCaptionReviewedCorrectionRecord
  createdAt: string
}): CanonicalCaptionTranscriptAuthenticatedEvidenceRecord {
  const transcript = parseCaptionCanonicalTranscript(
    input.correctionRecord.correctedCanonicalTranscript)
  const sourceScopeDigestSha256 = correctedSourceScopeDigest({
    request: input.request,
    original: input.sourceRecord.canonicalTranscript,
  })
  const evidenceRefs = correctedEvidenceRefs(transcript)
  const expectedSpeechRef = correctedSourceSpeechEvidenceRef({
    request: input.request,
    original: input.sourceRecord.canonicalTranscript,
  })
  if (!sameRef(transcript.sourceSpeechEvidencePackageRef, expectedSpeechRef)) {
    throw new Error('Canonical Caption corrected speech projection is stale.')
  }
  const alignmentQualification = parseCaptionAlignmentQualification(
    input.sourceRecord.alignmentQualification)
  if (!sameRef(transcript.alignmentQualificationRef,
    alignmentQualificationRef(alignmentQualification))) {
    throw new Error('Canonical Caption corrected alignment lineage changed.')
  }
  const transcriptReference = transcriptRef(transcript)
  const persistenceBasis = {
    canonicalReadScope: input.request.canonicalReadScope,
    sourceScopeDigestSha256,
    transcriptRef: transcriptReference,
    evidenceRefs,
    correctionRecordRef: correctionRecordRef(input.correctionRecord),
  }
  const persistenceReadReceiptRef: CaptionDomainRef = {
    id: `caption.transcript.persistence.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    version: 'canonical-transcript-authenticated-read-record-v1',
    contentHash: sha256AuthorityValue(persistenceBasis),
  }
  const authenticatedOwnerEvidenceRef: CaptionDomainRef = {
    id: `caption.transcript.owner.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    version: 'canonical-transcript-authenticated-owner-evidence-v1',
    contentHash: sha256AuthorityValue({
      ...persistenceBasis,
      owner: 'canonical_quality_first_source_transcript_router',
      correctionMode: 'independent_reviewed_manual_correction',
    }),
  }
  const diarizationArtifactRefs = uniqueRefs(transcript.words.flatMap((word) =>
    word.diarizationArtifactRef === null ? [] : [word.diarizationArtifactRef]))
  const bindingWithoutDigest: Omit<
    CaptionCanonicalTranscriptAuthenticatedReadBinding,
    'bindingDigestSha256'
  > = {
    schemaVersion:
      CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
    bindingId: `caption.transcript.binding.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    ownerKey: 'canonical_transcript',
    consumerSkillKey: 'captions',
    artifactType: 'canonical_transcript',
    canonicalReadScope: structuredClone(input.request.canonicalReadScope),
    canonicalTranscriptRef: transcriptReference,
    sourceSpeechEvidencePackageRef: transcript.sourceSpeechEvidencePackageRef,
    alignmentQualificationRef: transcript.alignmentQualificationRef,
    diarizationArtifactRefs,
    speakerDiarizationState: diarizationArtifactRefs.length === 0
      ? 'not_present' : 'complete',
    persistenceReadReceiptRef,
    authenticatedOwnerEvidenceRef,
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
  const binding =
    parseCaptionCanonicalTranscriptAuthenticatedReadBinding({
      ...bindingWithoutDigest,
      bindingDigestSha256: digest({
        ...bindingWithoutDigest,
        bindingDigestSha256: '',
      }, 'bindingDigestSha256'),
    })
  const withoutDigest: Omit<
    CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
    'recordDigestSha256'
  > = {
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
    recordId: `caption.transcript.record.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    canonicalReadScope: structuredClone(input.request.canonicalReadScope),
    sourceScopeDigestSha256,
    sourceSpeechEvidenceProjectionRef: transcript.sourceSpeechEvidencePackageRef,
    sourceWordTimingEvidenceRefs: evidenceRefs,
    alignmentQualification,
    canonicalTranscript: transcript,
    authenticatedReadBinding: binding,
    createdAt: input.createdAt,
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
    ...withoutDigest,
    recordDigestSha256: digest({
      ...withoutDigest,
      recordDigestSha256: '',
    }, 'recordDigestSha256'),
  })
}

function createCorrectionOwnerReceipt(input: {
  request: CanonicalCaptionReviewedCorrectionRequest
  sourceRecord: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  correctionRecord: CanonicalCaptionReviewedCorrectionRecord
  authenticatedTranscriptRecord:
    CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  createdAt: string
}): CanonicalCaptionReviewedCorrectionOwnerReceipt {
  const binding = input.authenticatedTranscriptRecord.authenticatedReadBinding
  const withoutDigest: Omit<
    CanonicalCaptionReviewedCorrectionOwnerReceipt,
    'receiptDigestSha256'
  > = {
    schemaVersion:
      CANONICAL_CAPTION_REVIEWED_CORRECTION_OWNER_RECEIPT_VERSION,
    receiptId: `caption.transcript.correction.owner.${
      input.request.requestDigestSha256.slice(0, 32)}`,
    canonicalReadScope: structuredClone(input.request.canonicalReadScope),
    requestRef: requestRef(input.request),
    sourceTranscriptRef: structuredClone(input.request.sourceTranscriptRef),
    sourceAuthenticatedTranscriptRecordRef:
      authenticatedTranscriptRecordRef(input.sourceRecord),
    rejectedInspectionReceiptRef:
      structuredClone(input.request.rejectedInspectionReceiptRef),
    correctionArtifactRef:
      structuredClone(input.request.correctionArtifactRef),
    independentAudioTruthReviewRef:
      structuredClone(input.request.independentAudioTruthReviewRef),
    correctionRecordRef: correctionRecordRef(input.correctionRecord),
    correctedCanonicalTranscriptRef: transcriptRef(
      input.authenticatedTranscriptRecord.canonicalTranscript),
    correctedAuthenticatedTranscriptRecordRef:
      authenticatedTranscriptRecordRef(input.authenticatedTranscriptRecord),
    correctedAuthenticatedReadBindingRef: bindingRef(binding),
    createdAt: input.createdAt,
    approvedSnapshotRereadTwiceAndMatched: true,
    sourceTranscriptRereadTwiceAndMatched: true,
    rejectedInspectionRereadTwiceAndMatched: true,
    correctionArtifactRereadTwiceAndMatched: true,
    independentAudioTruthReviewRereadTwiceAndMatched: true,
    completeCorrectionAndReviewCoverageVerified: true,
    correctionRecordPersistedCreateOnlyAndReread: true,
    correctedTranscriptPersistedThroughExistingCanonicalRepository: true,
    correctedTranscriptAuthenticatedReadRereadVerified: true,
    captionCreatedTranscriptOwner: false,
    privateInternalOnly: true,
    browserShareable: false,
    transcriptTextIncluded: false,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    pathsUrlsOrCredentialsIncluded: false,
    directPeerDispatchPerformed: false,
    providerCallMade: false,
    timingAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCanonicalCaptionReviewedCorrectionOwnerReceipt({
    ...withoutDigest,
    receiptDigestSha256: digest({
      ...withoutDigest,
      receiptDigestSha256: '',
    }, 'receiptDigestSha256'),
  })
}

function assertCorrectionOwnerReceiptContext(
  receipt: CanonicalCaptionReviewedCorrectionOwnerReceipt,
  context: CanonicalCaptionReviewedCorrectionOwnerReceiptContext,
): void {
  const binding = context.authenticatedTranscriptRecord
    .authenticatedReadBinding
  if (stableAuthorityStringify(receipt.canonicalReadScope) !==
      stableAuthorityStringify(context.request.canonicalReadScope)
    || !sameRef(receipt.requestRef, requestRef(context.request))
    || !sameRef(receipt.sourceTranscriptRef,
      context.request.sourceTranscriptRef)
    || !sameRef(receipt.sourceAuthenticatedTranscriptRecordRef,
      authenticatedTranscriptRecordRef(context.sourceRecord))
    || !sameRef(receipt.rejectedInspectionReceiptRef,
      context.request.rejectedInspectionReceiptRef)
    || !sameRef(receipt.correctionArtifactRef,
      context.request.correctionArtifactRef)
    || !sameRef(receipt.independentAudioTruthReviewRef,
      context.request.independentAudioTruthReviewRef)
    || !sameRef(receipt.correctionRecordRef,
      correctionRecordRef(context.correctionRecord))
    || !sameRef(receipt.correctedCanonicalTranscriptRef,
      transcriptRef(context.authenticatedTranscriptRecord.canonicalTranscript))
    || !sameRef(receipt.correctedAuthenticatedTranscriptRecordRef,
      authenticatedTranscriptRecordRef(
        context.authenticatedTranscriptRecord))
    || !sameRef(receipt.correctedAuthenticatedReadBindingRef,
      bindingRef(binding))) {
    throw new Error('Canonical Caption correction owner receipt crossed lineage.')
  }
}

function correctedSourceScopeDigest(input: {
  request: CanonicalCaptionReviewedCorrectionRequest
  original: CaptionCanonicalTranscript
}): string {
  return sha256AuthorityValue({
    canonicalReadScope: input.request.canonicalReadScope,
    sourceMediaRef: input.request.sourceMediaRef,
    sourceTranscriptRef: input.request.sourceTranscriptRef,
    originalSourceSpeechEvidencePackageRef:
      input.original.sourceSpeechEvidencePackageRef,
    rejectedInspectionReceiptRef:
      input.request.rejectedInspectionReceiptRef,
    correctionArtifactRef: input.request.correctionArtifactRef,
    independentAudioTruthReviewRef:
      input.request.independentAudioTruthReviewRef,
  })
}

function correctedSourceSpeechEvidenceRef(input: {
  request: CanonicalCaptionReviewedCorrectionRequest
  original: CaptionCanonicalTranscript
}): CaptionDomainRef {
  const sourceScopeDigestSha256 = correctedSourceScopeDigest(input)
  const evidenceRefs = uniqueRefs([
    ...input.original.segments.map((segment) => segment.sourceRecordRef),
    input.request.independentAudioTruthReviewRef,
  ])
  return {
    id: `caption.source.speech.corrected.${
      input.request.requestDigestSha256.slice(0, 32)}`,
    version: 'canonical-caption-reviewed-source-speech-evidence-projection-v1',
    contentHash: sha256AuthorityValue({
      sourceScopeDigestSha256,
      evidenceRefs,
    }),
  }
}

function correctedEvidenceRefs(
  transcript: CaptionCanonicalTranscript,
): CaptionDomainRef[] {
  return uniqueRefs([
    ...transcript.segments.map((segment) => segment.sourceRecordRef),
    ...transcript.words.map((word) => word.timestampEvidenceRef),
  ])
}

function assertIndependentReviewMatches(input: {
  request: CanonicalCaptionReviewedCorrectionRequest
  artifact: CanonicalCaptionReviewedCorrectionArtifact
  review: CanonicalCaptionIndependentAudioTruthReview
}): void {
  const segmentIds = input.artifact.segments.map((segment) =>
    segment.sourceSegmentId)
  const wordIds = input.artifact.segments.flatMap((segment) =>
    segment.words.map((word) => word.correctedSourceWordId))
  if (stableAuthorityStringify(input.review.canonicalReadScope) !==
      stableAuthorityStringify(input.request.canonicalReadScope)
    || !sameRef(input.review.sourceMediaRef, input.request.sourceMediaRef)
    || !sameRef(input.review.sourceTranscriptRef,
      input.request.sourceTranscriptRef)
    || !sameRef(input.review.rejectedInspectionReceiptRef,
      input.request.rejectedInspectionReceiptRef)
    || input.review.correctionArtifactId !== input.artifact.artifactId
    || input.review.correctionArtifactVersion !== input.artifact.schemaVersion
    || input.review.correctionArtifactBasisDigestSha256 !==
      calculateCanonicalCaptionReviewedCorrectionArtifactBasisDigest(
        input.artifact)
    || !sameRef(domainRef(input.review.reviewId, input.review.schemaVersion,
      input.review.reviewDigestSha256),
    input.request.independentAudioTruthReviewRef)
    || stableAuthorityStringify(input.review.reviewedSourceSegmentIds) !==
      stableAuthorityStringify(segmentIds)
    || stableAuthorityStringify(input.review.reviewedCorrectedWordIds) !==
      stableAuthorityStringify(wordIds)) {
    throw new Error(
      'Canonical Caption independent audio review crossed correction lineage.',
    )
  }
}

async function assertApprovedSnapshotReadTwice(
  port: CanonicalCaptionApprovedSnapshotReadPort,
  scope: CaptionCanonicalTranscriptReadScope,
): Promise<void> {
  const first = await port.readExact(structuredClone(scope))
  const second = await port.readExact(structuredClone(scope))
  if (!first || !second
    || stableAuthorityStringify(first) !== stableAuthorityStringify(scope)
    || stableAuthorityStringify(second) !== stableAuthorityStringify(scope)) {
    throw new Error(
      'Canonical Caption correction approved snapshot reread failed.',
    )
  }
}

async function readSourceTranscriptRecordTwice(input: {
  repository: CanonicalCaptionTranscriptEvidenceRepository
  request: CanonicalCaptionReviewedCorrectionRequest
}): Promise<CanonicalCaptionTranscriptAuthenticatedEvidenceRecord> {
  const lookup = {
    canonicalReadScope: input.request.canonicalReadScope,
    canonicalTranscriptRef: input.request.sourceTranscriptRef,
  }
  const first = await input.repository.findExactForExecution(lookup)
  const second = await input.repository.findExactForExecution(lookup)
  if (!first || !second
    || stableAuthorityStringify(first) !== stableAuthorityStringify(second)
    || !sameRef(transcriptRef(first.canonicalTranscript),
      input.request.sourceTranscriptRef)) {
    throw new Error(
      'Canonical Caption source transcript reread is unavailable or changed.',
    )
  }
  return first
}

async function readCorrectionEvidenceTwice(input: {
  port: CanonicalCaptionReviewedCorrectionEvidenceReadPort
  request: CanonicalCaptionReviewedCorrectionRequest
  evidenceKind: Parameters<
    CanonicalCaptionReviewedCorrectionEvidenceReadPort['readExact']
  >[0]['evidenceKind']
  evidenceRef: CaptionDomainRef
}): Promise<unknown> {
  const readInput = {
    canonicalReadScope: structuredClone(input.request.canonicalReadScope),
    evidenceKind: input.evidenceKind,
    evidenceRef: structuredClone(input.evidenceRef),
  }
  const first = await input.port.readExact(readInput)
  const second = await input.port.readExact(readInput)
  if (first === null || first === undefined
    || second === null || second === undefined
    || stableAuthorityStringify(first) !== stableAuthorityStringify(second)) {
    throw new Error(
      `Canonical Caption correction ${input.evidenceKind} reread failed.`,
    )
  }
  return structuredClone(first)
}

function assertCorrectionOwnerPorts(input: {
  approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
  evidenceReadPort: CanonicalCaptionReviewedCorrectionEvidenceReadPort
  transcriptRepository: CanonicalCaptionTranscriptEvidenceRepository
  correctionRepository: CanonicalCaptionReviewedCorrectionRepository
}): void {
  assertCanonicalCaptionApprovedSnapshotReadPort(
    input.approvedSnapshotReadPort)
  assertCanonicalCaptionTranscriptEvidenceRepository(
    input.transcriptRepository)
  if (!admittedEvidenceReaders.has(input.evidenceReadPort)
    || input.evidenceReadPort.schemaVersion !==
      CANONICAL_CAPTION_REVIEWED_CORRECTION_EVIDENCE_READ_PORT_VERSION
    || !admittedCorrectionRepositories.has(input.correctionRepository)
    || input.correctionRepository.schemaVersion !==
      CANONICAL_CAPTION_REVIEWED_CORRECTION_REPOSITORY_VERSION) {
    throw new Error('Canonical Caption correction owner ports are invalid.')
  }
}

function alignmentQualificationRef(
  qualification: CaptionAlignmentQualification,
): CaptionDomainRef {
  if (qualification.schemaVersion !== CAPTION_ALIGNMENT_QUALIFICATION_VERSION) {
    throw new Error('Canonical Caption alignment qualification is invalid.')
  }
  return domainRef(
    qualification.qualificationId,
    qualification.schemaVersion,
    qualification.qualificationDigestSha256,
  )
}

function requestRef(
  request: CanonicalCaptionReviewedCorrectionRequest,
): CaptionDomainRef {
  return domainRef(
    request.requestId,
    request.schemaVersion,
    request.requestDigestSha256,
  )
}

function correctionRecordRef(
  record: CanonicalCaptionReviewedCorrectionRecord,
): CaptionDomainRef {
  return domainRef(
    record.recordId,
    record.schemaVersion,
    record.recordDigestSha256,
  )
}

function authenticatedTranscriptRecordRef(
  record: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
): CaptionDomainRef {
  return domainRef(
    record.recordId,
    record.schemaVersion,
    record.recordDigestSha256,
  )
}

function bindingRef(
  binding: CaptionCanonicalTranscriptAuthenticatedReadBinding,
): CaptionDomainRef {
  return domainRef(
    binding.bindingId,
    binding.schemaVersion,
    binding.bindingDigestSha256,
  )
}

function ownerReceiptRef(
  receipt: CanonicalCaptionReviewedCorrectionOwnerReceipt,
): CaptionDomainRef {
  return domainRef(
    receipt.receiptId,
    receipt.schemaVersion,
    receipt.receiptDigestSha256,
  )
}

function uniqueRefs(refs: CaptionDomainRef[]): CaptionDomainRef[] {
  return [...new Map(refs.map((ref) => [
    `${ref.id}|${ref.version}|${ref.contentHash}`,
    structuredClone(ref),
  ])).entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([, ref]) => ref)
}

async function persistStableJson<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  value: T
  reread: () => Promise<T | null>
  expectedDigest: string
  digestFromReread: (value: T) => string
  label: string
}): Promise<'created' | 'identical_replay'> {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > 64 * 1024 * 1024) {
    throw new Error(`${input.label} bytes are invalid.`)
  }
  const disposition = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await input.reread()
  if (!reread || input.digestFromReread(reread) !== input.expectedDigest) {
    throw new Error(`${input.label} create-only reread failed.`)
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readStableJson(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  label: string,
): Promise<unknown | null> {
  const body = await port.readExact(path)
  if (body === null) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > 64 * 1024 * 1024) {
    throw new Error(`${label} bytes are invalid.`)
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error(`${label} JSON is invalid.`)
  }
  if (body.toString('utf8') !== stableAuthorityStringify(value)) {
    throw new Error(`${label} canonical bytes are invalid.`)
  }
  return value
}

function correctionRecordPath(prefix: string, ref: CaptionDomainRef): string {
  return `${prefix}/records/${ref.contentHash}.json`
}

function ownerReceiptPath(prefix: string, ref: CaptionDomainRef): string {
  return `${prefix}/receipts/${ref.contentHash}.json`
}

function normalizeRepositoryPrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 600
    || normalized.includes('..') || normalized.includes('\\')
    || normalized.includes('//')
    || normalized.split('/').some((part) =>
      !safeKey.safeParse(part).success)) {
    throw new Error('Canonical Caption correction repository prefix is invalid.')
  }
  return normalized
}

function assertCreateOnlyObjectPort(
  port: CanonicalCreateOnlyJsonObjectPort,
): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('Canonical Caption correction object port is invalid.')
  }
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
