import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { CaptionSoundCueRequest } from
  '../../src/types/caption-sound-support'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { hashSkillValue } from
  '../edit-skills/core/skill-capability-manifest-hash'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  canonicalSoundRequestSchema,
  canonicalSoundResultSchema,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
} from '../sound/sound-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSoundCaptionListeningReviewSchema,
  createCanonicalSoundCaptionListeningReview,
  createCanonicalSoundCaptionListeningReviewReadPort,
  type CanonicalSoundCaptionListeningReview,
  type CanonicalSoundCaptionListeningReviewReadPort,
} from './canonical-sound-caption-owner-service'

export const CANONICAL_SOUND_CAPTION_LISTENING_REVIEWER_SUBMISSION_VERSION =
  'canonical-sound-caption-listening-reviewer-submission-v1' as const
export const CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_COMPLETION_RECEIPT_VERSION =
  'canonical-sound-caption-listening-review-completion-receipt-v1' as const
export const CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_RECORD_VERSION =
  'canonical-sound-caption-listening-review-record-v1' as const
export const CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_REPOSITORY_VERSION =
  'canonical-sound-caption-listening-review-repository-v1' as const
export const CANONICAL_SOUND_CAPTION_LISTENING_PLAYBACK_DERIVATION_VERSION =
  'canonical-sound-caption-listening-playback-derivation-v1' as const
export const CAPTION_SOUND_PRIVATE_RUNTIME_INSPECTION_PACKAGE_VERSION =
  'caption-sound-private-runtime-inspection-package-v1' as const

const DEFAULT_PREFIX =
  'private/edit-skills/sound/v1/caption-listening-review'
const MAX_RECORD_BYTES = 16 * 1024 * 1024
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const refSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: identity,
  version: identity,
  contentHash: sha256,
}).strict()
const requiredObservationCodes = [
  'complete_time_coverage',
  'voice_clarity',
  'dialogue_masking',
  'cue_timing_and_restraint',
  'unexpected_audio_defects',
] as const
const observationCodeSchema = z.enum(requiredObservationCodes)

const playbackDerivationCoreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOUND_CAPTION_LISTENING_PLAYBACK_DERIVATION_VERSION),
  derivationId: identity,
  sourceFinalMixArtifactRef: refSchema,
  playbackArtifactRef: refSchema,
  conversionOperationRef: refSchema,
  transformProfile: z.literal('pcm_bit_depth_compatibility_proxy'),
  sourceSampleRate: z.literal(48_000),
  playbackSampleRate: z.literal(48_000),
  sourceChannelCount: z.literal(2),
  playbackChannelCount: z.literal(2),
  completeDurationPreserved: z.literal(true),
  channelLayoutPreserved: z.literal(true),
  resamplingPerformed: z.literal(false),
  trimmingPerformed: z.literal(false),
  gainOrDynamicsProcessingPerformed: z.literal(false),
  networkAccessUsed: z.literal(false),
  sourceArtifactRereadBeforeConversion: z.literal(true),
  playbackArtifactRereadAfterConversion: z.literal(true),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  providerCallMade: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export const canonicalSoundCaptionListeningPlaybackDerivationSchema =
  playbackDerivationCoreSchema.extend({
    derivationDigestSha256: sha256,
  }).strict().superRefine((value, context) => {
    const { derivationDigestSha256, ...core } = value
    if (hashSkillValue(core) !== derivationDigestSha256) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound playback derivation digest is stale.',
      })
    }
    if (sameRef(value.sourceFinalMixArtifactRef,
      value.playbackArtifactRef)) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound playback derivation did not change format.',
      })
    }
  })

export type CanonicalSoundCaptionListeningPlaybackDerivation = z.infer<
  typeof canonicalSoundCaptionListeningPlaybackDerivationSchema
>

const submissionCoreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOUND_CAPTION_LISTENING_REVIEWER_SUBMISSION_VERSION),
  submissionId: identity,
  inspectionPackageRef: refSchema,
  captionSoundRequestRef: refSchema,
  canonicalSoundRequestRef: refSchema,
  canonicalSoundResultRef: refSchema,
  finalMixArtifactRefs: z.array(refSchema).min(1).max(128),
  playbackArtifactRef: refSchema,
  playbackDerivationReceiptRef: refSchema.nullable(),
  reviewerClass: z.enum(['qualified_audio_ai', 'direct_private_human']),
  disposition: z.enum(['accepted', 'accepted_with_warnings']),
  completePlaybackCount: z.number().int().min(1).max(3),
  actualAudioPlaybackCompleted: z.literal(true),
  everyRequestedRangeReviewed: z.literal(true),
  voiceClarityPassed: z.literal(true),
  noCueMasksDialogue: z.literal(true),
  cueTimingAndRestraintPassed: z.literal(true),
  noUnexpectedAudioDefectsPassed: z.literal(true),
  observationCodes: z.array(observationCodeSchema)
    .length(requiredObservationCodes.length),
  warningCodes: z.array(identity).max(16),
  reviewedAt: timestamp,
  independentFromSoundExecutionRuntime: z.literal(true),
  sourceBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  providerCallMade: z.literal(false),
  runtimeAuthorityGrantedToCaption: z.literal(false),
  assetAuthorityGrantedToCaption: z.literal(false),
  mixAuthorityGrantedToCaption: z.literal(false),
  costOrBillingAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export const canonicalSoundCaptionListeningReviewerSubmissionSchema =
  submissionCoreSchema.extend({
    submissionDigestSha256: sha256,
  }).strict().superRefine((value, context) => {
    const { submissionDigestSha256, ...core } = value
    if (hashSkillValue(core) !== submissionDigestSha256) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound listening submission digest is stale.',
      })
    }
    if (hashSkillValue(value.observationCodes)
      !== hashSkillValue(requiredObservationCodes)) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound listening observations are incomplete.',
      })
    }
    if ((value.disposition === 'accepted') !==
      (value.warningCodes.length === 0)) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound listening warnings contradict disposition.',
      })
    }
    const playbackIsFinalMix = value.finalMixArtifactRefs.some((artifact) =>
      sameRef(artifact, value.playbackArtifactRef))
    if (!playbackIsFinalMix && !value.playbackDerivationReceiptRef) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound listening proxy lacks derivation lineage.',
      })
    }
    if (playbackIsFinalMix && value.playbackDerivationReceiptRef) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound direct playback cannot claim proxy lineage.',
      })
    }
  })

export type CanonicalSoundCaptionListeningReviewerSubmission = z.infer<
  typeof canonicalSoundCaptionListeningReviewerSubmissionSchema
>

const receiptCoreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_COMPLETION_RECEIPT_VERSION),
  receiptId: identity,
  inspectionPackageRef: refSchema,
  reviewerSubmissionRef: refSchema,
  listeningReviewRef: refSchema,
  captionSoundRequestRef: refSchema,
  canonicalSoundRequestRef: refSchema,
  canonicalSoundResultRef: refSchema,
  finalMixArtifactRefs: z.array(refSchema).min(1).max(128),
  playbackArtifactRef: refSchema,
  playbackDerivationReceiptRef: refSchema.nullable(),
  completedAt: timestamp,
  exactExecutionLineageVerified: z.literal(true),
  exactFinalMixLineageVerified: z.literal(true),
  completeTimePlaybackAttestationVerified: z.literal(true),
  independentReviewProjectedIntoCanonicalSoundOwner: z.literal(true),
  createOnlyPersistenceAndExactRereadRequired: z.literal(true),
  sourceBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallMade: z.literal(false),
  runtimeAuthorityGrantedToCaption: z.literal(false),
  assetAuthorityGrantedToCaption: z.literal(false),
  mixAuthorityGrantedToCaption: z.literal(false),
  costOrBillingAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export const canonicalSoundCaptionListeningReviewCompletionReceiptSchema =
  receiptCoreSchema.extend({
    receiptDigestSha256: sha256,
  }).strict().superRefine((value, context) => {
    const { receiptDigestSha256, ...core } = value
    if (hashSkillValue(core) !== receiptDigestSha256) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical Sound listening completion digest is stale.',
      })
    }
  })

export type CanonicalSoundCaptionListeningReviewCompletionReceipt = z.infer<
  typeof canonicalSoundCaptionListeningReviewCompletionReceiptSchema
>

const recordCoreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_RECORD_VERSION),
  recordId: identity,
  captionSoundRequestRef: refSchema,
  canonicalSoundRequestRef: refSchema,
  canonicalSoundResultRef: refSchema,
  reviewerSubmission: canonicalSoundCaptionListeningReviewerSubmissionSchema,
  playbackDerivationReceipt: z.unknown().nullable(),
  listeningReview: z.unknown(),
  completionReceipt:
    canonicalSoundCaptionListeningReviewCompletionReceiptSchema,
  privateInternalOnly: z.literal(true),
  browserShareable: z.literal(false),
  sourceBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export const canonicalSoundCaptionListeningReviewRecordSchema =
  recordCoreSchema.extend({
    recordDigestSha256: sha256,
  }).strict()

export interface CanonicalSoundCaptionListeningReviewRecord
  extends Omit<z.infer<typeof canonicalSoundCaptionListeningReviewRecordSchema>,
    'listeningReview' | 'playbackDerivationReceipt'> {
  readonly playbackDerivationReceipt:
    CanonicalSoundCaptionListeningPlaybackDerivation | null
  readonly listeningReview: CanonicalSoundCaptionListeningReview
}

export interface CanonicalSoundCaptionListeningReviewRepository {
  readonly schemaVersion:
    typeof CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_REPOSITORY_VERSION
  readonly listeningReviewReadPort:
    CanonicalSoundCaptionListeningReviewReadPort
  persistCreateOnly(
    record: CanonicalSoundCaptionListeningReviewRecord,
  ): Promise<'created' | 'identical_replay'>
  rereadExact(input: {
    readonly captionSoundRequestRef: CaptionDomainRef
    readonly canonicalSoundRequestRef: CaptionDomainRef
    readonly canonicalSoundResultRef: CaptionDomainRef
  }): Promise<CanonicalSoundCaptionListeningReviewRecord | null>
}

export function createCanonicalSoundCaptionListeningReviewerSubmission(
  input: z.input<typeof submissionCoreSchema>,
): CanonicalSoundCaptionListeningReviewerSubmission {
  const core = submissionCoreSchema.parse(input)
  return canonicalSoundCaptionListeningReviewerSubmissionSchema.parse({
    ...core,
    submissionDigestSha256: hashSkillValue(core),
  })
}

export function parseCanonicalSoundCaptionListeningReviewerSubmission(
  value: unknown,
): CanonicalSoundCaptionListeningReviewerSubmission {
  assertClosedContractTree(value, 'Canonical Sound listening submission')
  return canonicalSoundCaptionListeningReviewerSubmissionSchema.parse(value)
}

export function createCanonicalSoundCaptionListeningPlaybackDerivation(
  input: z.input<typeof playbackDerivationCoreSchema>,
): CanonicalSoundCaptionListeningPlaybackDerivation {
  const core = playbackDerivationCoreSchema.parse(input)
  return canonicalSoundCaptionListeningPlaybackDerivationSchema.parse({
    ...core,
    derivationDigestSha256: hashSkillValue(core),
  })
}

export function parseCanonicalSoundCaptionListeningPlaybackDerivation(
  value: unknown,
): CanonicalSoundCaptionListeningPlaybackDerivation {
  assertClosedContractTree(value, 'Canonical Sound playback derivation')
  return canonicalSoundCaptionListeningPlaybackDerivationSchema.parse(value)
}

export function deriveCanonicalSoundCaptionListeningReviewLineage(input: {
  readonly captionSoundRequest: CaptionSoundCueRequest
  readonly canonicalSoundRequest: unknown
  readonly canonicalSoundResult: unknown
}): ReturnType<typeof executionRefs> {
  assertClosedContractTree(input, 'Canonical Sound listening lineage input')
  const captionRequest = parseCaptionRequestEnvelope(input.captionSoundRequest)
  const soundRequest = canonicalSoundRequestSchema.parse(
    input.canonicalSoundRequest)
  const soundResult = canonicalSoundResultSchema.parse(
    input.canonicalSoundResult)
  return structuredClone(executionRefs(
    captionRequest, soundRequest, soundResult))
}

export function completeCanonicalSoundCaptionListeningReview(input: {
  readonly inspectionPackageRef: CaptionDomainRef
  readonly captionSoundRequest: CaptionSoundCueRequest
  readonly canonicalSoundRequest: unknown
  readonly canonicalSoundResult: unknown
  readonly reviewerSubmission: unknown
  readonly playbackDerivationReceipt?: unknown | null
}): CanonicalSoundCaptionListeningReviewRecord {
  assertClosedContractTree(input, 'Canonical Sound listening completion')
  const inspectionPackageRef = refSchema.parse(input.inspectionPackageRef)
  if (inspectionPackageRef.version !==
    CAPTION_SOUND_PRIVATE_RUNTIME_INSPECTION_PACKAGE_VERSION) {
    throw new Error('Canonical Sound inspection package version is invalid.')
  }
  const captionRequest = parseCaptionRequestEnvelope(input.captionSoundRequest)
  const soundRequest = canonicalSoundRequestSchema.parse(
    input.canonicalSoundRequest)
  const soundResult = canonicalSoundResultSchema.parse(
    input.canonicalSoundResult)
  const submission = parseCanonicalSoundCaptionListeningReviewerSubmission(
    input.reviewerSubmission)
  const playbackDerivationReceipt = input.playbackDerivationReceipt
    ? parseCanonicalSoundCaptionListeningPlaybackDerivation(
      input.playbackDerivationReceipt)
    : null
  const refs = executionRefs(captionRequest, soundRequest, soundResult)
  assertCompletionLineage({
    inspectionPackageRef,
    submission,
    refs,
    soundResult,
    playbackDerivationReceipt,
  })
  const listeningReview = createCanonicalSoundCaptionListeningReview({
    schemaVersion: 'canonical-sound-caption-listening-review-v1',
    reviewId: `sound.caption.review.${submission.submissionDigestSha256.slice(0, 32)}`,
    captionSoundRequestRef: refs.captionSoundRequestRef,
    canonicalSoundRequestRef: refs.canonicalSoundRequestRef,
    canonicalSoundResultRef: refs.canonicalSoundResultRef,
    finalMixArtifactRefs: refs.finalMixArtifactRefs,
    qaEvidenceHash: soundResult.finalCompositionHandoff!.qaEvidenceHash,
    reviewedFrameRanges: captionRequest.canonicalScope.authorizedFrameRanges,
    reviewedCueIds: soundResult.cueManifest.cues.map((cue) => cue.cueId),
    inspectionMode: 'complete_time_private_audio_review',
    reviewerClass: submission.reviewerClass,
    disposition: submission.disposition,
    actualAudioPlaybackCompleted: true,
    everyRequestedRangeReviewed: true,
    voiceClarityPassed: true,
    noCueMasksDialogue: true,
    sourceBytesIncluded: false,
    mediaLocatorIncluded: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
    reviewedAt: submission.reviewedAt,
  })
  const reviewerSubmissionRef = ref(
    submission.submissionId,
    submission.schemaVersion,
    submission.submissionDigestSha256,
  )
  const listeningReviewRef = ref(
    listeningReview.reviewId,
    listeningReview.schemaVersion,
    listeningReview.reviewDigestSha256,
  )
  const receiptCore = receiptCoreSchema.parse({
    schemaVersion:
      CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_COMPLETION_RECEIPT_VERSION,
    receiptId: `sound.caption.review.receipt.${submission.submissionDigestSha256.slice(0, 32)}`,
    inspectionPackageRef,
    reviewerSubmissionRef,
    listeningReviewRef,
    ...refs,
    playbackArtifactRef: submission.playbackArtifactRef,
    playbackDerivationReceiptRef: submission.playbackDerivationReceiptRef,
    completedAt: submission.reviewedAt,
    exactExecutionLineageVerified: true,
    exactFinalMixLineageVerified: true,
    completeTimePlaybackAttestationVerified: true,
    independentReviewProjectedIntoCanonicalSoundOwner: true,
    createOnlyPersistenceAndExactRereadRequired: true,
    sourceBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    directPeerDispatchPerformed: false,
    providerCallMade: false,
    runtimeAuthorityGrantedToCaption: false,
    assetAuthorityGrantedToCaption: false,
    mixAuthorityGrantedToCaption: false,
    costOrBillingAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  const completionReceipt =
    canonicalSoundCaptionListeningReviewCompletionReceiptSchema.parse({
      ...receiptCore,
      receiptDigestSha256: hashSkillValue(receiptCore),
    })
  const recordCore = recordCoreSchema.parse({
    schemaVersion: CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_RECORD_VERSION,
    recordId: `sound.caption.review.record.${submission.submissionDigestSha256.slice(0, 32)}`,
    captionSoundRequestRef: refs.captionSoundRequestRef,
    canonicalSoundRequestRef: refs.canonicalSoundRequestRef,
    canonicalSoundResultRef: refs.canonicalSoundResultRef,
    reviewerSubmission: submission,
    playbackDerivationReceipt,
    listeningReview,
    completionReceipt,
    privateInternalOnly: true,
    browserShareable: false,
    sourceBytesIncluded: false,
    mediaLocatorIncluded: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  return parseCanonicalSoundCaptionListeningReviewRecord({
    ...recordCore,
    recordDigestSha256: hashSkillValue(recordCore),
  })
}

export function parseCanonicalSoundCaptionListeningReviewRecord(
  value: unknown,
): CanonicalSoundCaptionListeningReviewRecord {
  assertClosedContractTree(value, 'Canonical Sound listening record')
  if (!value || typeof value !== 'object'
    || !Object.prototype.hasOwnProperty.call(value, 'listeningReview')
    || !Object.prototype.hasOwnProperty.call(
      value, 'playbackDerivationReceipt')) {
    throw new Error('Canonical Sound listening record shape is incomplete.')
  }
  const outer = canonicalSoundCaptionListeningReviewRecordSchema.parse(value)
  const playbackDerivationReceipt = outer.playbackDerivationReceipt
    ? parseCanonicalSoundCaptionListeningPlaybackDerivation(
      outer.playbackDerivationReceipt)
    : null
  const listeningReview = canonicalSoundCaptionListeningReviewSchema.parse(
    outer.listeningReview)
  const record = { ...outer, playbackDerivationReceipt, listeningReview }
  const { recordDigestSha256, ...core } = record
  if (hashSkillValue(core) !== recordDigestSha256
    || !sameRef(record.captionSoundRequestRef,
      record.reviewerSubmission.captionSoundRequestRef)
    || !sameRef(record.canonicalSoundRequestRef,
      record.reviewerSubmission.canonicalSoundRequestRef)
    || !sameRef(record.canonicalSoundResultRef,
      record.reviewerSubmission.canonicalSoundResultRef)
    || !sameRef(record.completionReceipt.captionSoundRequestRef,
      record.captionSoundRequestRef)
    || !sameRef(record.completionReceipt.canonicalSoundRequestRef,
      record.canonicalSoundRequestRef)
    || !sameRef(record.completionReceipt.canonicalSoundResultRef,
      record.canonicalSoundResultRef)
    || !sameRef(record.completionReceipt.inspectionPackageRef,
      record.reviewerSubmission.inspectionPackageRef)
    || !sameRef(record.completionReceipt.reviewerSubmissionRef,
      ref(record.reviewerSubmission.submissionId,
        record.reviewerSubmission.schemaVersion,
        record.reviewerSubmission.submissionDigestSha256))
    || !sameRef(record.completionReceipt.listeningReviewRef,
      ref(listeningReview.reviewId, listeningReview.schemaVersion,
        listeningReview.reviewDigestSha256))
    || !sameRef(listeningReview.captionSoundRequestRef,
      record.captionSoundRequestRef)
    || !sameRef(listeningReview.canonicalSoundRequestRef,
      record.canonicalSoundRequestRef)
    || !sameRef(listeningReview.canonicalSoundResultRef,
      record.canonicalSoundResultRef)
    || hashSkillValue(listeningReview.finalMixArtifactRefs)
      !== hashSkillValue(record.reviewerSubmission.finalMixArtifactRefs)
    || hashSkillValue(record.completionReceipt.finalMixArtifactRefs)
      !== hashSkillValue(record.reviewerSubmission.finalMixArtifactRefs)
    || !sameRef(record.completionReceipt.playbackArtifactRef,
      record.reviewerSubmission.playbackArtifactRef)
    || hashSkillValue(record.completionReceipt.playbackDerivationReceiptRef)
      !== hashSkillValue(
        record.reviewerSubmission.playbackDerivationReceiptRef)
    || (record.playbackDerivationReceipt
      ? !record.reviewerSubmission.playbackDerivationReceiptRef
        || record.playbackDerivationReceipt.derivationDigestSha256
          !== record.reviewerSubmission.playbackDerivationReceiptRef.contentHash
        || record.playbackDerivationReceipt.derivationId
          !== record.reviewerSubmission.playbackDerivationReceiptRef.id
        || record.playbackDerivationReceipt.schemaVersion
          !== record.reviewerSubmission.playbackDerivationReceiptRef.version
      : record.reviewerSubmission.playbackDerivationReceiptRef !== null)) {
    throw new Error('Canonical Sound listening record lineage is invalid.')
  }
  return structuredClone(record)
}

export function createCanonicalSoundCaptionListeningReviewRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSoundCaptionListeningReviewRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository = {} as CanonicalSoundCaptionListeningReviewRepository
  const rereadExact = async (readInput: {
    captionSoundRequestRef: CaptionDomainRef
    canonicalSoundRequestRef: CaptionDomainRef
    canonicalSoundResultRef: CaptionDomainRef
  }): Promise<CanonicalSoundCaptionListeningReviewRecord | null> => {
    const refs = parseLookupRefs(readInput)
    const body = await input.objectPort.readExact(recordPath(prefix, refs))
    if (!body) return null
    if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
      throw new Error('Canonical Sound listening record bytes are invalid.')
    }
    const record = parseCanonicalSoundCaptionListeningReviewRecord(
      JSON.parse(body.toString('utf8')) as unknown)
    if (!sameRef(record.captionSoundRequestRef, refs.captionSoundRequestRef)
      || !sameRef(record.canonicalSoundRequestRef,
        refs.canonicalSoundRequestRef)
      || !sameRef(record.canonicalSoundResultRef,
        refs.canonicalSoundResultRef)) {
      throw new Error('Canonical Sound listening repository crossed lineage.')
    }
    return record
  }
  const listeningReviewReadPort =
    createCanonicalSoundCaptionListeningReviewReadPort(async (readInput) => {
      const record = await rereadExact(readInput)
      if (!record) {
        throw new Error('Canonical Sound listening review is not persisted.')
      }
      return structuredClone(record.listeningReview)
    })
  Object.assign(repository, {
    schemaVersion:
      CANONICAL_SOUND_CAPTION_LISTENING_REVIEW_REPOSITORY_VERSION,
    listeningReviewReadPort,
    async persistCreateOnly(
      untrustedRecord: CanonicalSoundCaptionListeningReviewRecord,
    ) {
      const record = parseCanonicalSoundCaptionListeningReviewRecord(
        untrustedRecord)
      const refs = parseLookupRefs(record)
      const body = Buffer.from(JSON.stringify(record), 'utf8')
      if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
        throw new Error('Canonical Sound listening record size is invalid.')
      }
      const status = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, refs),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await rereadExact(refs)
      if (!reread
        || reread.recordDigestSha256 !== record.recordDigestSha256
        || hashSkillValue(reread) !== hashSkillValue(record)) {
        throw new Error('Canonical Sound listening record reread failed.')
      }
      return status === 'created' ? 'created' as const
        : 'identical_replay' as const
    },
    rereadExact,
  })
  return Object.freeze(repository)
}

function assertCompletionLineage(input: {
  inspectionPackageRef: CaptionDomainRef
  submission: CanonicalSoundCaptionListeningReviewerSubmission
  refs: ReturnType<typeof executionRefs>
  soundResult: CanonicalSoundResult
  playbackDerivationReceipt:
    CanonicalSoundCaptionListeningPlaybackDerivation | null
}): void {
  const { submission, refs, soundResult, playbackDerivationReceipt } = input
  const directPlayback = refs.finalMixArtifactRefs.some((artifact) =>
    sameRef(artifact, submission.playbackArtifactRef))
  if (!sameRef(submission.inspectionPackageRef, input.inspectionPackageRef)
    || !sameRef(submission.captionSoundRequestRef,
      refs.captionSoundRequestRef)
    || !sameRef(submission.canonicalSoundRequestRef,
      refs.canonicalSoundRequestRef)
    || !sameRef(submission.canonicalSoundResultRef,
      refs.canonicalSoundResultRef)
    || hashSkillValue(submission.finalMixArtifactRefs)
      !== hashSkillValue(refs.finalMixArtifactRefs)
    || soundResult.status !== 'completed'
    || soundResult.workerStatus !== 'completed'
    || soundResult.artifactStatus !== 'private_ready'
    || !soundResult.finalCompositionHandoff
    || soundResult.finalCompositionHandoff.intentionalNoSound
    || soundResult.finalCompositionHandoff.finalSoundArtifactReferences.length
      === 0
    || (directPlayback && playbackDerivationReceipt !== null)
    || (!directPlayback && (!playbackDerivationReceipt
      || !submission.playbackDerivationReceiptRef
      || !refs.finalMixArtifactRefs.some((artifact) =>
        sameRef(playbackDerivationReceipt.sourceFinalMixArtifactRef, artifact))
      || !sameRef(playbackDerivationReceipt.playbackArtifactRef,
        submission.playbackArtifactRef)
      || !sameRef(submission.playbackDerivationReceiptRef,
        ref(playbackDerivationReceipt.derivationId,
          playbackDerivationReceipt.schemaVersion,
          playbackDerivationReceipt.derivationDigestSha256))))) {
    throw new Error('Canonical Sound listening completion crossed execution.')
  }
}

function executionRefs(
  captionRequest: CaptionSoundCueRequest,
  soundRequest: CanonicalSoundRequest,
  soundResult: CanonicalSoundResult,
) {
  const handoff = soundResult.finalCompositionHandoff
  if (!handoff) throw new Error('Canonical Sound final handoff is missing.')
  return {
    captionSoundRequestRef: ref(
      captionRequest.requestId,
      captionRequest.schemaVersion,
      captionRequest.requestDigestSha256,
    ),
    canonicalSoundRequestRef: ref(
      soundRequest.requestId,
      soundRequest.schemaVersion,
      contractDigest(soundRequest),
    ),
    canonicalSoundResultRef: ref(
      `sound.result.${soundResult.requestId}`,
      soundResult.schemaVersion,
      contractDigest(soundResult),
    ),
    finalMixArtifactRefs: handoff.finalSoundArtifactReferences.map((artifact) =>
      ref(artifact.artifactId,
        `${artifact.artifactType}.v${artifact.version}`,
        artifact.checksumSha256)),
  }
}

function parseCaptionRequestEnvelope(value: unknown): CaptionSoundCueRequest {
  assertClosedContractTree(value, 'Canonical Sound Caption request envelope')
  const request = value as CaptionSoundCueRequest
  if (!request || typeof request !== 'object'
    || request.schemaVersion !== 'caption-sound-cue-request-v1'
    || typeof request.requestId !== 'string'
    || !identity.safeParse(request.requestId).success
    || !sha256.safeParse(request.requestDigestSha256).success
    || calculateSkillContractDigest(
      request as unknown as Record<string, unknown>, 'requestDigestSha256')
      !== request.requestDigestSha256
    || !Array.isArray(request.cueIntents)
    || !request.canonicalScope
    || !Array.isArray(request.canonicalScope.authorizedFrameRanges)) {
    throw new Error('Canonical Sound Caption request envelope is invalid.')
  }
  return structuredClone(request)
}

function parseLookupRefs(input: {
  captionSoundRequestRef: CaptionDomainRef
  canonicalSoundRequestRef: CaptionDomainRef
  canonicalSoundResultRef: CaptionDomainRef
}) {
  return {
    captionSoundRequestRef: refSchema.parse(input.captionSoundRequestRef),
    canonicalSoundRequestRef: refSchema.parse(input.canonicalSoundRequestRef),
    canonicalSoundResultRef: refSchema.parse(input.canonicalSoundResultRef),
  }
}

function recordPath(
  prefix: string,
  refs: ReturnType<typeof parseLookupRefs>,
): string {
  return [
    prefix,
    'records',
    refs.captionSoundRequestRef.contentHash,
    refs.canonicalSoundRequestRef.contentHash,
    `${refs.canonicalSoundResultRef.contentHash}.json`,
  ].join('/')
}

function contractDigest(value: unknown): string {
  return calculateSkillContractDigest({
    value: JSON.parse(JSON.stringify(value)) as unknown,
    digest: '',
  }, 'digest')
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return refSchema.parse({ id, version, contentHash })
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Canonical Sound listening object port is incomplete.')
  }
}
