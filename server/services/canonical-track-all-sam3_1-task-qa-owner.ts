import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_QA_AUTHORITY_VERSION,
  CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_MEASUREMENT_VERSION,
  CANONICAL_TRACK_ALL_SAM3_1_PRIVATE_SCENE_REVIEW_VERSION,
  type CanonicalTrackAllSam31CaptionSceneQaAuthority,
  type CanonicalTrackAllSam31L4MaskQaMeasurement,
  type CanonicalTrackAllSam31PrivateSceneReview,
} from '../../src/types/canonical-track-all-sam3_1-task-qa'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionTrackAllSubjectEvidence,
  CaptionTrackAllSupportPayload,
} from '../../src/types/caption-track-all-support'
import type {
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  assertCanonicalSam31GpuTaskContext,
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequest,
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponse,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import type {
  CanonicalSam31GpuTaskContextRepository,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  parseCaptionTrackAllSupportPayload,
  parseCaptionTrackAllSupportRequest,
  sealCanonicalTrackAllSam31CaptionSceneEvidence,
  type CanonicalTrackAllSam31CaptionSceneEvidenceRepository,
} from './canonical-caption-track-all-support-service'
import type {
  CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-task-qa-repository-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_OWNER_VERSION =
  'canonical-track-all-sam3_1-task-qa-owner-v1' as const

const PREFIX = 'private/track-all/sam3_1/v1/task-qa'
const MAX_BYTES = 16 * 1024 * 1024
const safeId = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const integer = z.number().int().nonnegative().safe()
const positiveInteger = z.number().int().positive().safe()
const refSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: safeId,
  version: safeId,
  contentHash: sha256,
}).strict()
const rangeSchema: z.ZodType<CaptionDomainFrameRange> = z.object({
  startFrame: integer,
  endFrameExclusive: positiveInteger,
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) context.addIssue({
    code: 'custom', message: 'Track All QA frame range is empty.',
  })
})
const scopeSchema: z.ZodType<CaptionDomainCanonicalScope> = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  planVersionId: safeId,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeId,
  sceneId: safeId.nullable(),
  authorizedFrameRanges: z.array(rangeSchema).length(1),
}).strict()
const subjectRoleSchema = z.enum([
  'primary_speaker', 'secondary_speaker', 'hand', 'product',
  'important_object', 'environmental_surface',
])
const operationSchema = z.enum([
  'morphological_cleanup', 'hole_fill', 'edge_feather_measurement',
  'temporal_median_check', 'connected_component_filter',
])
const subjectEvidenceSchema: z.ZodType<CaptionTrackAllSubjectEvidence> =
  z.object({
    subjectRequestId: safeId,
    subjectEvidenceId: safeId,
    subjectRole: subjectRoleSchema,
    frameRange: rangeSchema,
    maskSequenceRef: refSchema.nullable(),
    trackManifestRef: refSchema,
    anchorManifestRef: refSchema.nullable(),
    sourceFrameMappingRef: refSchema,
    outputFrameDigestSha256: sha256,
    temporalQa: z.object({
      measuredFrameCount: positiveInteger,
      expectedFrameCount: positiveInteger,
      emptyMaskFrameCount: integer,
      fullFrameMaskCount: integer,
      minimumBinaryIntersectionOverUnionBasisPoints:
        z.number().int().min(0).max(10_000),
      maximumNormalizedCentroidShiftBasisPoints:
        z.number().int().min(0).max(10_000),
      maximumBoundaryDisagreementBasisPoints:
        z.number().int().min(0).max(10_000),
      maximumAlphaFlickerBasisPoints:
        z.number().int().min(0).max(10_000),
      minimumEdgeQualityBasisPoints:
        z.number().int().min(0).max(10_000),
      minimumSubjectCoverageBasisPoints:
        z.number().int().min(0).max(10_000),
      identitySwapCount: integer,
      lostAnchorFrameCount: integer,
      completeRequestedRangeCoverage: z.literal(true),
    }).strict(),
    refinementEvidence: z.array(z.object({
      refinementId: safeId,
      tool: z.enum(['opencv', 'kornia']),
      operation: operationSchema,
      inputArtifactRef: refSchema,
      outputArtifactRef: refSchema,
      executionEvidenceRef: refSchema,
      actualExecutionObserved: z.literal(true),
    }).strict()).min(2).max(64),
    evidenceRefs: z.array(refSchema).min(1).max(512),
  }).strict()

const l4ExecutionSchema = z.object({
  routeId: z.literal('l4_standard_primary'),
  gpuProfileId: z.literal(
    'quality_l4_user_triggered_standard_media_job_v1',
  ),
  accelerator: z.literal('nvidia_l4'),
  approvedWorkItemRef: refSchema,
  workerLeaseRef: refSchema,
  executionAttemptRef: refSchema,
  currentAccountPriceAuthorityRef: refSchema,
  workerUsageEvidenceRef: refSchema,
  attemptCostReceiptRef: refSchema,
  korniaCudaExecutionEvidenceRef: refSchema,
  opencvCrosscheckExecutionEvidenceRef: refSchema,
  actualL4GpuExecutionObserved: z.literal(true),
  actualKorniaCudaKernelExecutionObserved: z.literal(true),
  actualOpenCvCrosscheckExecutionObserved: z.literal(true),
  cpuOnlySubstantiveMaskQaUsed: z.literal(false),
  userTriggeredAfterApprovedWork: z.literal(true),
  terminalWorkerStoppedAndScaleBackToZeroVerified: z.literal(true),
  exactAccountEffectiveAttemptCostPersisted: z.literal(true),
}).strict()
const measurementWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_MEASUREMENT_VERSION,
  ),
  measurementId: safeId,
  invocationId: safeId,
  sam31TaskRef: refSchema,
  sam31RuntimeResultAdmissionRef: refSchema,
  canonicalScope: scopeSchema,
  sourcePrivateArtifactRef: refSchema,
  sourceFrameMappingRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  requestedRange: rangeSchema,
  subjectEvidence: z.array(subjectEvidenceSchema).min(1).max(16),
  l4QaExecution: l4ExecutionSchema,
  everyRequestedFrameAndSubjectMeasured: z.literal(true),
  sampledOrRepresentativeOnlyMeasurementAccepted: z.literal(false),
  exactMaskManifestAndEveryMaskPngReread: z.literal(true),
  browserOrCallerMeasurementAccepted: z.literal(false),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  measuredAt: timestamp,
}).strict()
const measurementSchema = measurementWithoutDigestSchema.extend({
  measurementDigestSha256: sha256,
}).strict()

const reviewWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_PRIVATE_SCENE_REVIEW_VERSION,
  ),
  reviewId: safeId,
  measurementRef: refSchema,
  sam31TaskRef: refSchema,
  sam31RuntimeResultAdmissionRef: refSchema,
  canonicalScope: scopeSchema,
  requestedRange: rangeSchema,
  reviewedSubjectEvidenceIds: z.array(safeId).min(1).max(16),
  fullResolutionCompleteIntervalPlaybackRef: refSchema,
  reviewerIdentityRef: refSchema,
  reviewerRole: z.literal('independent_private_track_all_visual_reviewer'),
  reviewedFrameCount: positiveInteger,
  expectedFrameCount: positiveInteger,
  findingCodes: z.array(safeId).length(0),
  everyRequestedFrameAndSubjectReviewed: z.literal(true),
  completeIntervalReviewAccepted: z.literal(true),
  sampledOrRepresentativeOnlyReviewAccepted: z.literal(false),
  reviewerIndependentFromSamAndMaskQaWorkers: z.literal(true),
  browserOrCallerReviewAccepted: z.literal(false),
  providerOrModelCallMade: z.literal(false),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  reviewedAt: timestamp,
}).strict()
const reviewSchema = reviewWithoutDigestSchema.extend({
  reviewDigestSha256: sha256,
}).strict()

const authorityWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_QA_AUTHORITY_VERSION,
  ),
  authorityId: safeId,
  invocationId: safeId,
  supportRequestRef: refSchema,
  sam31TaskRef: refSchema,
  sam31RuntimeResultAdmissionRef: refSchema,
  measurementRef: refSchema,
  privateSceneReviewRef: refSchema,
  captionSceneEvidenceRef: refSchema,
  authenticatedPrincipalVerified: z.literal(true),
  exactCaptionRequestSamTaskResultMeasurementAndReviewReread: z.literal(true),
  actualA100OrQualifiedL4Sam31ExecutionObserved: z.literal(true),
  actualL4KorniaCudaAndOpenCvQaObserved: z.literal(true),
  completeScenePrivateReviewObserved: z.literal(true),
  sceneEvidenceCreateOnlyPersistedAndReread: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  runtimeExecutionPerformedByAuthorityOwner: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
}).strict()
const authoritySchema = authorityWithoutDigestSchema.extend({
  authorityDigestSha256: sha256,
}).strict()

export interface CanonicalTrackAllSam31TaskQaRepository {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_REPOSITORY_VERSION
  persistMeasurementCreateOnly(input: {
    readonly measurement: CanonicalTrackAllSam31L4MaskQaMeasurement
  }): Promise<'created' | 'identical_replay'>
  rereadMeasurement(input: {
    readonly measurementRef: CaptionDomainRef
  }): Promise<CanonicalTrackAllSam31L4MaskQaMeasurement | null>
  persistReviewCreateOnly(input: {
    readonly review: CanonicalTrackAllSam31PrivateSceneReview
  }): Promise<'created' | 'identical_replay'>
  rereadReview(input: {
    readonly reviewRef: CaptionDomainRef
  }): Promise<CanonicalTrackAllSam31PrivateSceneReview | null>
  persistAuthorityCreateOnly(input: {
    readonly authority: CanonicalTrackAllSam31CaptionSceneQaAuthority
  }): Promise<'created' | 'identical_replay'>
  rereadAuthority(input: {
    readonly authorityRef: CaptionDomainRef
  }): Promise<CanonicalTrackAllSam31CaptionSceneQaAuthority | null>
}

export interface CanonicalTrackAllSam31TaskQaOwner {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_OWNER_VERSION
  admitCaptionSceneEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly priorCallRef: SkillContractRef
    readonly selectedSupportRequestRef: SkillContractRef
    readonly invocationId: string
    readonly measurementRef: CaptionDomainRef
    readonly privateSceneReviewRef: CaptionDomainRef
  }): Promise<CanonicalTrackAllSam31CaptionSceneQaAuthority>
}

export function sealCanonicalTrackAllSam31L4MaskQaMeasurement(
  value: Omit<CanonicalTrackAllSam31L4MaskQaMeasurement,
    'measurementDigestSha256'>,
): CanonicalTrackAllSam31L4MaskQaMeasurement {
  assertClosedContractTree(value, 'Track All L4 mask-QA measurement input')
  const payload = measurementWithoutDigestSchema.parse(value)
  return parseCanonicalTrackAllSam31L4MaskQaMeasurement({
    ...payload,
    measurementDigestSha256: digest(payload, 'measurementDigestSha256'),
  })
}

/**
 * Converts only a request-matched fixed L4 worker response into the canonical
 * task measurement. Cloud usage, pricing, cost, launch, and terminal refs are
 * still supplied by the authenticated terminal owner and are reread again by
 * the task-QA finalizer; the worker cannot create those authorities.
 */
export function sealCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerEvidence(
  input: {
    readonly measurementId: string
    readonly canonicalScope: CaptionDomainCanonicalScope
    readonly sourcePrivateArtifactRef: CaptionDomainRef
    readonly requestedRange: CaptionDomainFrameRange
    readonly l4QaExecution:
      CanonicalTrackAllSam31L4MaskQaMeasurement['l4QaExecution']
    readonly workerRequest: unknown
    readonly workerResponse: unknown
    readonly measuredAt: string
  },
): CanonicalTrackAllSam31L4MaskQaMeasurement {
  assertClosedContractTree(input,
    'track_all_l4_measurement_worker_evidence_input')
  const request = assertCanonicalTrackAllSam31L4TaskQaWorkerRequest(
    input.workerRequest,
  )
  const response = assertCanonicalTrackAllSam31L4TaskQaWorkerResponse(
    input.workerResponse,
  )
  if (
    response.status !== 'completed'
    || response.outputSummary === null
    || response.inputEvidence === null
    || response.gpuEvidence === null
    || response.requestBindingSha256 !== request.requestBindingSha256
    || response.inputEvidence.manifestSha256
      !== request.expectedMaskManifestSha256
    || response.inputEvidence.manifestByteLength
      !== request.expectedMaskManifestByteLength
    || response.inputEvidence.maskPngCount !== request.expectedMaskPngCount
    || !sameRef(
      domainRefFromPrefixed(request.approvedWorkItemRef),
      input.l4QaExecution.approvedWorkItemRef,
    )
    || !sameRef(
      domainRefFromPrefixed(request.workerLeaseRef),
      input.l4QaExecution.workerLeaseRef,
    )
    || !sameRef(
      domainRefFromPrefixed(request.executionAttemptRef),
      input.l4QaExecution.executionAttemptRef,
    )
    || response.outputSummary.korniaCudaExecutionDigestSha256
      !== input.l4QaExecution.korniaCudaExecutionEvidenceRef.contentHash
    || response.outputSummary.opencvCudaCrosscheckExecutionDigestSha256
      !== input.l4QaExecution.opencvCrosscheckExecutionEvidenceRef.contentHash
    || !response.gpuEvidence.exactL4DeviceObserved
    || !response.gpuEvidence.korniaCudaTensorExecutionObserved
    || !response.gpuEvidence.opencvCudaEveryMaskCrosschecked
    || response.gpuEvidence.cpuOnlySubstantiveMaskQaUsed
    || response.cpuOnlySubstantiveMaskQaUsed
  ) throw new TypeError(
    'Track All L4 worker response lost exact CUDA, manifest, or evidence lineage.',
  )
  const subjectEvidence = request.subjects.map((subject, index) => {
    const measured = response.outputSummary!.subjectMeasurements[index]
    if (
      !measured
      || measured.subjectRequestId !== subject.subjectRequestId
      || measured.subjectEvidenceId !== subject.subjectEvidenceId
      || measured.maskObjectId !== subject.maskObjectId
      || stableAuthorityStringify(subject.canonicalFrameRange)
        !== stableAuthorityStringify(input.requestedRange)
    ) throw new TypeError(
      'Track All L4 worker subject evidence crossed subject or frame scope.',
    )
    const maskSequenceRef = domainRefFromPrefixed(
      request.sam31MaskManifestRef,
    )
    const korniaRef = input.l4QaExecution.korniaCudaExecutionEvidenceRef
    const opencvRef =
      input.l4QaExecution.opencvCrosscheckExecutionEvidenceRef
    return subjectEvidenceSchema.parse({
      subjectRequestId: subject.subjectRequestId,
      subjectEvidenceId: subject.subjectEvidenceId,
      subjectRole: subject.subjectRole,
      frameRange: subject.canonicalFrameRange,
      maskSequenceRef,
      trackManifestRef: domainRefFromPrefixed(subject.trackManifestRef),
      anchorManifestRef: subject.anchorManifestRef === null
        ? null
        : domainRefFromPrefixed(subject.anchorManifestRef),
      sourceFrameMappingRef:
        domainRefFromPrefixed(subject.sourceFrameMappingRef),
      outputFrameDigestSha256: subject.outputFrameDigestSha256,
      temporalQa: {
        measuredFrameCount: measured.measuredFrameCount,
        expectedFrameCount: measured.expectedFrameCount,
        emptyMaskFrameCount: measured.emptyMaskFrameCount,
        fullFrameMaskCount: measured.fullFrameMaskCount,
        minimumBinaryIntersectionOverUnionBasisPoints:
          measured.minimumBinaryIntersectionOverUnionBasisPoints,
        maximumNormalizedCentroidShiftBasisPoints:
          measured.maximumNormalizedCentroidShiftBasisPoints,
        maximumBoundaryDisagreementBasisPoints:
          measured.maximumBoundaryDisagreementBasisPoints,
        maximumAlphaFlickerBasisPoints:
          measured.maximumAlphaFlickerBasisPoints,
        minimumEdgeQualityBasisPoints:
          measured.minimumEdgeQualityBasisPoints,
        minimumSubjectCoverageBasisPoints:
          measured.minimumSubjectCoverageBasisPoints,
        identitySwapCount: measured.identitySwapCount,
        lostAnchorFrameCount: measured.lostAnchorFrameCount,
        completeRequestedRangeCoverage: true,
      },
      refinementEvidence: [{
        refinementId: `${subject.subjectEvidenceId}:kornia-cuda`,
        tool: 'kornia',
        operation: 'edge_feather_measurement',
        inputArtifactRef: maskSequenceRef,
        outputArtifactRef: maskSequenceRef,
        executionEvidenceRef: korniaRef,
        actualExecutionObserved: true,
      }, {
        refinementId: `${subject.subjectEvidenceId}:opencv-cuda`,
        tool: 'opencv',
        operation: 'temporal_median_check',
        inputArtifactRef: maskSequenceRef,
        outputArtifactRef: maskSequenceRef,
        executionEvidenceRef: opencvRef,
        actualExecutionObserved: true,
      }],
      evidenceRefs: [korniaRef, opencvRef],
    })
  })
  if (response.outputSummary.subjectMeasurements.length
    !== subjectEvidence.length) throw new TypeError(
    'Track All L4 worker response included an unrequested subject.',
  )
  return sealCanonicalTrackAllSam31L4MaskQaMeasurement({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_MEASUREMENT_VERSION,
    measurementId: input.measurementId,
    invocationId: request.invocationId,
    sam31TaskRef: domainRefFromPrefixed(request.sam31TaskRef),
    sam31RuntimeResultAdmissionRef:
      domainRefFromPrefixed(request.sam31RuntimeResultAdmissionRef),
    canonicalScope: structuredClone(input.canonicalScope),
    sourcePrivateArtifactRef: structuredClone(input.sourcePrivateArtifactRef),
    sourceFrameMappingRef:
      domainRefFromPrefixed(request.sourceFrameMappingRef),
    confirmedOutputFrameRef:
      domainRefFromPrefixed(request.confirmedOutputFrameRef),
    requestedRange: structuredClone(input.requestedRange),
    subjectEvidence,
    l4QaExecution: structuredClone(input.l4QaExecution),
    everyRequestedFrameAndSubjectMeasured: true,
    sampledOrRepresentativeOnlyMeasurementAccepted: false,
    exactMaskManifestAndEveryMaskPngReread: true,
    browserOrCallerMeasurementAccepted: false,
    pathsUrlsCredentialsOrMediaBytesIncluded: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    assetManifestMutated: false,
    renderAuthorized: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    measuredAt: input.measuredAt,
  })
}

export function parseCanonicalTrackAllSam31L4MaskQaMeasurement(
  value: unknown,
): CanonicalTrackAllSam31L4MaskQaMeasurement {
  assertClosedContractTree(value, 'Track All L4 mask-QA measurement')
  const measurement = measurementSchema.parse(value)
  const { measurementDigestSha256, ...payload } = measurement
  const subjects = measurement.subjectEvidence
  const refs = Object.values(measurement.l4QaExecution)
    .filter((item): item is CaptionDomainRef => isRef(item))
  if (
    measurementDigestSha256 !== digest(payload, 'measurementDigestSha256')
    || measurement.canonicalScope.approvedSnapshotRef === null
    || measurement.canonicalScope.sceneId === null
    || !sameRange(measurement.canonicalScope.authorizedFrameRanges[0]!,
      measurement.requestedRange)
    || new Set(subjects.map((item) => item.subjectRequestId)).size
      !== subjects.length
    || new Set(subjects.map((item) => item.subjectEvidenceId)).size
      !== subjects.length
    || new Set(refs.map(refKey)).size !== refs.length
    || subjects.some((subject) =>
      !sameRange(subject.frameRange, measurement.requestedRange)
      || subject.temporalQa.measuredFrameCount !== rangeLength(
        measurement.requestedRange,
      )
      || subject.temporalQa.expectedFrameCount !== rangeLength(
        measurement.requestedRange,
      )
      || !sameRef(subject.sourceFrameMappingRef,
        measurement.sourceFrameMappingRef)
      || subject.outputFrameDigestSha256
        !== measurement.confirmedOutputFrameRef.contentHash
      || !subject.refinementEvidence.some((item) =>
        item.tool === 'kornia'
        && sameRef(item.executionEvidenceRef,
          measurement.l4QaExecution.korniaCudaExecutionEvidenceRef))
      || !subject.refinementEvidence.some((item) =>
        item.tool === 'opencv'
        && sameRef(item.executionEvidenceRef,
          measurement.l4QaExecution.opencvCrosscheckExecutionEvidenceRef)))
  ) throw new Error('Track All L4 mask-QA measurement is inconsistent.')
  return freeze(measurement)
}

export function sealCanonicalTrackAllSam31PrivateSceneReview(
  value: Omit<CanonicalTrackAllSam31PrivateSceneReview,
    'reviewDigestSha256'>,
): CanonicalTrackAllSam31PrivateSceneReview {
  assertClosedContractTree(value, 'Track All private scene review input')
  const payload = reviewWithoutDigestSchema.parse(value)
  return parseCanonicalTrackAllSam31PrivateSceneReview({
    ...payload,
    reviewDigestSha256: digest(payload, 'reviewDigestSha256'),
  })
}

export function parseCanonicalTrackAllSam31PrivateSceneReview(
  value: unknown,
): CanonicalTrackAllSam31PrivateSceneReview {
  assertClosedContractTree(value, 'Track All private scene review')
  const review = reviewSchema.parse(value)
  const { reviewDigestSha256, ...payload } = review
  if (
    reviewDigestSha256 !== digest(payload, 'reviewDigestSha256')
    || review.reviewedFrameCount !== review.expectedFrameCount
    || review.expectedFrameCount !== rangeLength(review.requestedRange)
    || !sameRange(review.canonicalScope.authorizedFrameRanges[0]!,
      review.requestedRange)
    || new Set(review.reviewedSubjectEvidenceIds).size
      !== review.reviewedSubjectEvidenceIds.length
  ) throw new Error('Track All private scene review is inconsistent.')
  return freeze(review)
}

export function parseCanonicalTrackAllSam31CaptionSceneQaAuthority(
  value: unknown,
): CanonicalTrackAllSam31CaptionSceneQaAuthority {
  assertClosedContractTree(value, 'Track All Caption scene-QA authority')
  const authority = authoritySchema.parse(value)
  const { authorityDigestSha256, ...payload } = authority
  if (authorityDigestSha256 !== digest(payload, 'authorityDigestSha256')) {
    throw new Error('Track All Caption scene-QA authority digest is invalid.')
  }
  return freeze(authority)
}

export function createCanonicalTrackAllSam31TaskQaRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalTrackAllSam31TaskQaRepository {
  assertPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? PREFIX)
  const repository: CanonicalTrackAllSam31TaskQaRepository = {
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_REPOSITORY_VERSION,
    persistMeasurementCreateOnly: ({ measurement }) => persistExact({
      port: input.objectPort,
      path: `${prefix}/measurements/${pathKey(measurementRef(measurement))}.json`,
      value: measurement,
      parse: parseCanonicalTrackAllSam31L4MaskQaMeasurement,
    }),
    rereadMeasurement: ({ measurementRef: reference }) => readExact({
      port: input.objectPort,
      path: `${prefix}/measurements/${pathKey(reference)}.json`,
      parse: parseCanonicalTrackAllSam31L4MaskQaMeasurement,
    }),
    persistReviewCreateOnly: ({ review }) => persistExact({
      port: input.objectPort,
      path: `${prefix}/reviews/${pathKey(reviewRef(review))}.json`,
      value: review,
      parse: parseCanonicalTrackAllSam31PrivateSceneReview,
    }),
    rereadReview: ({ reviewRef: reference }) => readExact({
      port: input.objectPort,
      path: `${prefix}/reviews/${pathKey(reference)}.json`,
      parse: parseCanonicalTrackAllSam31PrivateSceneReview,
    }),
    persistAuthorityCreateOnly: ({ authority }) => persistExact({
      port: input.objectPort,
      path: `${prefix}/authorities/${pathKey(authorityRef(authority))}.json`,
      value: authority,
      parse: parseCanonicalTrackAllSam31CaptionSceneQaAuthority,
    }),
    rereadAuthority: ({ authorityRef: reference }) => readExact({
      port: input.objectPort,
      path: `${prefix}/authorities/${pathKey(reference)}.json`,
      parse: parseCanonicalTrackAllSam31CaptionSceneQaAuthority,
    }),
  }
  return Object.freeze(repository)
}

export function createCanonicalTrackAllSam31TaskQaOwner(input: {
  readonly supportResumeRepository: Pick<
    CanonicalSpecialistSupportResumeRepository,
    'rereadCallResultPair'
  >
  readonly taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
  readonly taskContextRepository: Pick<
    CanonicalSam31GpuTaskContextRepository,
    'rereadTaskContext'
  >
  readonly resultStore: Pick<
    CanonicalSam31GpuRuntimeResultStore,
    'rereadResultAdmission'
  >
  readonly qaRepository: CanonicalTrackAllSam31TaskQaRepository
  readonly sceneEvidenceRepository:
    CanonicalTrackAllSam31CaptionSceneEvidenceRepository
}): CanonicalTrackAllSam31TaskQaOwner {
  assertOwnerPorts(input)
  const owner: CanonicalTrackAllSam31TaskQaOwner = {
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_TASK_QA_OWNER_VERSION,
    async admitCaptionSceneEvidence(value) {
      assertClosedContractTree(value, 'Track All task-QA owner input')
      const authenticatedOwnerUserId = safeId.parse(
        value.authenticatedOwnerUserId,
      )
      const priorCallRef = refSchema.parse(value.priorCallRef)
      const selectedSupportRequestRef = refSchema.parse(
        value.selectedSupportRequestRef,
      )
      const invocationId = safeId.parse(value.invocationId)
      const expectedMeasurementRef = refSchema.parse(value.measurementRef)
      const expectedReviewRef = refSchema.parse(value.privateSceneReviewRef)
      const pair = await input.supportResumeRepository.rereadCallResultPair({
        callRef: priorCallRef,
      })
      if (!pair || !sameRef(callRef(pair.call), priorCallRef)) {
        throw new Error('Track All task-QA prior Caption call is unavailable.')
      }
      const selected = pair.result.supportRequests[0]
      if (!selected || !sameRef(requestRef(selected),
        selectedSupportRequestRef)) {
        throw new Error('Track All task-QA support request is not current.')
      }
      const payload = parseCaptionTrackAllSupportPayload(selected.typedPayload)
      const supportRequest = parseCaptionTrackAllSupportRequest(
        selected,
        payload,
      )
      if (payload.canonicalScope.ownerUserId !== authenticatedOwnerUserId) {
        throw new Error('Track All task-QA authenticated owner mismatch.')
      }
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(invocationId),
      )
      const context = assertCanonicalSam31GpuTaskContext(
        await input.taskContextRepository.rereadTaskContext({
          taskContextRef: task.taskContextRef,
        }),
      )
      const result = assertCanonicalSam31GpuRuntimeResultAdmission(
        await input.resultStore.rereadResultAdmission(invocationId),
      )
      const measurement = await input.qaRepository.rereadMeasurement({
        measurementRef: expectedMeasurementRef,
      })
      const review = await input.qaRepository.rereadReview({
        reviewRef: expectedReviewRef,
      })
      if (!measurement || !sameRef(measurementRef(measurement),
        expectedMeasurementRef)) {
        throw new Error('Track All L4 measurement is unavailable.')
      }
      if (!review || !sameRef(reviewRef(review), expectedReviewRef)) {
        throw new Error('Track All private scene review is unavailable.')
      }
      // The immutable review is the final prerequisite for scene admission.
      // Reuse its owner-persisted timestamp so an identical transport retry
      // seals byte-identical scene evidence and authority records.
      const admittedAt = timestamp.parse(review.reviewedAt)
      assertExactLineage({
        payload,
        invocationId,
        task,
        context,
        result,
        measurement,
        review,
      })
      const sceneEvidence = sealCanonicalTrackAllSam31CaptionSceneEvidence({
        schemaVersion:
          'canonical-track-all-sam3_1-caption-scene-evidence-v1',
        evidenceId:
          `track-all-caption-scene-${measurement.measurementDigestSha256.slice(0, 32)}`,
        invocationId,
        taskRef: taskRef(task),
        runtimeResultAdmissionRef: resultRef(result),
        trackAllResultRef: resultRef(result),
        canonicalScope: structuredClone(payload.canonicalScope),
        sourcePrivateArtifactRef:
          structuredClone(payload.sourcePrivateArtifactRef),
        sourceFrameMappingRef: structuredClone(payload.sourceFrameMappingRef),
        confirmedOutputFrameRef:
          structuredClone(measurement.confirmedOutputFrameRef),
        requestedRange: structuredClone(payload.requestedRange),
        subjectEvidence: measurement.subjectEvidence.map((subject) => ({
          ...structuredClone(subject),
          evidenceRefs: uniqueRefs([
            ...subject.evidenceRefs,
            measurementRef(measurement),
            reviewRef(review),
          ]),
        })),
        independentMaskArtifactQaRef: measurementRef(measurement),
        privateVisualReviewRef: reviewRef(review),
        cache: {
          cacheIdentityDigestSha256:
            payload.cachePolicy.cacheIdentityDigestSha256,
          disposition: 'new_result',
          originalResultRef: null,
          exactSourceRangeSubjectFrameAndPolicyMatch: true,
          staleArtifactReused: false,
        },
        exactTaskResultAndPrivateArtifactReread: true,
        exactApprovedSnapshotOutputSceneRangeAndSourceBindingVerified: true,
        actualSam31GpuExecutionObserved: true,
        actualOpenCvExecutionObserved: true,
        actualKorniaExecutionObserved: true,
        independentMaskArtifactQaCompleted: true,
        privateVisualReviewCompleted: true,
        completeRequestedRangeCoverageVerified: true,
        browserOrCallerQaClaimsAccepted: false,
        rawMaskMediaBytesPathsUrlsOrCredentialsIncluded: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        assetManifestMutated: false,
        renderAuthorized: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        recordedAt: admittedAt,
      })
      await input.sceneEvidenceRepository.persistCreateOnly({
        evidence: sceneEvidence,
      })
      const sceneReread = await input.sceneEvidenceRepository.rereadByRef({
        evidenceRef: sceneEvidenceRef(sceneEvidence),
      })
      if (!sceneReread || sceneReread.evidenceDigestSha256
        !== sceneEvidence.evidenceDigestSha256) {
        throw new Error('Track All Caption scene evidence reread failed.')
      }
      const authorityPayload = authorityWithoutDigestSchema.parse({
        schemaVersion:
          CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_QA_AUTHORITY_VERSION,
        authorityId:
          `track-all-caption-qa-${sceneEvidence.evidenceDigestSha256.slice(0, 32)}`,
        invocationId,
        supportRequestRef: requestRef(supportRequest),
        sam31TaskRef: taskRef(task),
        sam31RuntimeResultAdmissionRef: resultRef(result),
        measurementRef: measurementRef(measurement),
        privateSceneReviewRef: reviewRef(review),
        captionSceneEvidenceRef: sceneEvidenceRef(sceneEvidence),
        authenticatedPrincipalVerified: true,
        exactCaptionRequestSamTaskResultMeasurementAndReviewReread: true,
        actualA100OrQualifiedL4Sam31ExecutionObserved: true,
        actualL4KorniaCudaAndOpenCvQaObserved: true,
        completeScenePrivateReviewObserved: true,
        sceneEvidenceCreateOnlyPersistedAndReread: true,
        browserLocalStateUsed: false,
        directPeerDispatchPerformed: false,
        runtimeExecutionPerformedByAuthorityOwner: false,
        assetMutationAuthorityGranted: false,
        customerCreditsMutated: false,
        finalQaApprovalGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
        admittedAt,
      })
      const authority = parseCanonicalTrackAllSam31CaptionSceneQaAuthority({
        ...authorityPayload,
        authorityDigestSha256: digest(
          authorityPayload,
          'authorityDigestSha256',
        ),
      })
      await input.qaRepository.persistAuthorityCreateOnly({ authority })
      const reread = await input.qaRepository.rereadAuthority({
        authorityRef: authorityRef(authority),
      })
      if (!reread || reread.authorityDigestSha256
        !== authority.authorityDigestSha256) {
        throw new Error('Track All task-QA authority reread failed.')
      }
      return reread
    },
  }
  return Object.freeze(owner)
}

function assertExactLineage(input: {
  payload: CaptionTrackAllSupportPayload
  invocationId: string
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  context: ReturnType<typeof assertCanonicalSam31GpuTaskContext>
  result: ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>
  measurement: CanonicalTrackAllSam31L4MaskQaMeasurement
  review: CanonicalTrackAllSam31PrivateSceneReview
}): void {
  const { payload, task, context, result, measurement, review } = input
  const media = task.runtimeRequest.sourceMedia
  const expectedSubjectIds = payload.subjectRequests
    .map((item) => item.subjectRequestId).sort(compareUtf16)
  const measuredSubjectIds = measurement.subjectEvidence
    .map((item) => item.subjectRequestId).sort(compareUtf16)
  const reviewedEvidenceIds = [...review.reviewedSubjectEvidenceIds]
    .sort(compareUtf16)
  const expectedEvidenceIds = measurement.subjectEvidence
    .map((item) => item.subjectEvidenceId).sort(compareUtf16)
  if (
    input.invocationId !== task.invocationId
    || input.invocationId !== result.executionEnvelopeRef.id
    || result.status !== 'ready_for_independent_mask_artifact_qa'
    || !sameRef(measurement.sam31TaskRef, taskRef(task))
    || !sameRef(measurement.sam31RuntimeResultAdmissionRef, resultRef(result))
    || !sameRef(review.measurementRef, measurementRef(measurement))
    || !sameRef(review.sam31TaskRef, taskRef(task))
    || !sameRef(review.sam31RuntimeResultAdmissionRef, resultRef(result))
    || !sameScope(measurement.canonicalScope, payload.canonicalScope)
    || !sameScope(review.canonicalScope, payload.canonicalScope)
    || !sameRange(measurement.requestedRange, payload.requestedRange)
    || !sameRange(review.requestedRange, payload.requestedRange)
    || !sameRef(measurement.sourcePrivateArtifactRef,
      payload.sourcePrivateArtifactRef)
    || !sameRef(measurement.sourceFrameMappingRef,
      payload.sourceFrameMappingRef)
    || measurement.confirmedOutputFrameRef.contentHash
      !== payload.confirmedOutputFrameDigestSha256
    || context.confirmedOutputFrameRef.contentHash
      !== `sha256:${payload.confirmedOutputFrameDigestSha256}`
    || media.finalizedSourceArtifactRef.id
      !== payload.sourcePrivateArtifactRef.id
    || stripSha(media.finalizedSourceArtifactRef.contentHash)
      !== payload.sourcePrivateArtifactRef.contentHash
    || media.canonicalSourceStartFrameInclusive
      !== payload.requestedRange.startFrame
    || media.canonicalSourceEndFrameInclusive + 1
      !== payload.requestedRange.endFrameExclusive
    || stableAuthorityStringify(expectedSubjectIds)
      !== stableAuthorityStringify(measuredSubjectIds)
    || stableAuthorityStringify(reviewedEvidenceIds)
      !== stableAuthorityStringify(expectedEvidenceIds)
    || measurement.subjectEvidence.some((subject) => {
      const request = payload.subjectRequests.find((candidate) =>
        candidate.subjectRequestId === subject.subjectRequestId)
      return !request
        || request.subjectRole !== subject.subjectRole
        || request.maskRequired !== (subject.maskSequenceRef !== null)
        || request.anchorRequired !== (subject.anchorManifestRef !== null)
        || !passes(subject, payload)
    })
    || Date.parse(measurement.measuredAt) < Date.parse(result.admittedAt)
    || Date.parse(review.reviewedAt) < Date.parse(measurement.measuredAt)
  ) throw new Error('Track All task-QA evidence lost exact lineage or quality.')
}

function passes(
  subject: CaptionTrackAllSubjectEvidence,
  payload: CaptionTrackAllSupportPayload,
): boolean {
  const qa = subject.temporalQa
  const threshold = payload.qaThresholds
  return qa.emptyMaskFrameCount <= threshold.emptyMaskFrameCountAllowed
    && qa.fullFrameMaskCount <= threshold.fullFrameMaskCountAllowed
    && qa.minimumBinaryIntersectionOverUnionBasisPoints
      >= threshold.minimumBinaryIntersectionOverUnionBasisPoints
    && qa.maximumNormalizedCentroidShiftBasisPoints
      <= threshold.maximumNormalizedCentroidShiftBasisPoints
    && qa.maximumBoundaryDisagreementBasisPoints
      <= threshold.maximumBoundaryDisagreementBasisPoints
    && qa.maximumAlphaFlickerBasisPoints
      <= threshold.maximumAlphaFlickerBasisPoints
    && qa.minimumEdgeQualityBasisPoints
      >= threshold.minimumEdgeQualityBasisPoints
    && qa.minimumSubjectCoverageBasisPoints
      >= threshold.minimumSubjectCoverageBasisPoints
    && qa.identitySwapCount <= threshold.identitySwapCountAllowed
    && qa.lostAnchorFrameCount <= threshold.lostAnchorFrameCountAllowed
}

function measurementRef(
  value: CanonicalTrackAllSam31L4MaskQaMeasurement,
): CaptionDomainRef {
  return { id: value.measurementId, version: value.schemaVersion,
    contentHash: value.measurementDigestSha256 }
}
function reviewRef(
  value: CanonicalTrackAllSam31PrivateSceneReview,
): CaptionDomainRef {
  return { id: value.reviewId, version: value.schemaVersion,
    contentHash: value.reviewDigestSha256 }
}
function authorityRef(
  value: CanonicalTrackAllSam31CaptionSceneQaAuthority,
): CaptionDomainRef {
  return { id: value.authorityId, version: value.schemaVersion,
    contentHash: value.authorityDigestSha256 }
}
function sceneEvidenceRef(value: {
  evidenceId: string
  schemaVersion: string
  evidenceDigestSha256: string
}): CaptionDomainRef {
  return { id: value.evidenceId, version: value.schemaVersion,
    contentHash: value.evidenceDigestSha256 }
}
function taskRef(value: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>):
CaptionDomainRef {
  return { id: value.taskId, version: value.schemaVersion,
    contentHash: value.taskRecordHash }
}
function resultRef(
  value: ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>,
): CaptionDomainRef {
  return { id: value.resultAdmissionId, version: value.schemaVersion,
    contentHash: value.resultAdmissionHash }
}
function callRef(value: {
  callId: string
  schemaVersion: string
  callDigestSha256: string
}): CaptionDomainRef {
  return { id: value.callId, version: value.schemaVersion,
    contentHash: value.callDigestSha256 }
}
function requestRef(value: {
  requestId: string
  schemaVersion: string
  requestDigestSha256: string
}): CaptionDomainRef {
  return { id: value.requestId, version: value.schemaVersion,
    contentHash: value.requestDigestSha256 }
}
function uniqueRefs(values: CaptionDomainRef[]): CaptionDomainRef[] {
  const unique = new Map(values.map((value) => [refKey(value), value]))
  return [...unique.values()].sort((left, right) =>
    compareUtf16(refKey(left), refKey(right)))
}
function sameScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
function sameRange(
  left: CaptionDomainFrameRange,
  right: CaptionDomainFrameRange,
): boolean {
  return left.startFrame === right.startFrame
    && left.endFrameExclusive === right.endFrameExclusive
}
function rangeLength(value: CaptionDomainFrameRange): number {
  return value.endFrameExclusive - value.startFrame
}
function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}
function refKey(value: CaptionDomainRef): string {
  return `${value.id}\u0000${value.version}\u0000${value.contentHash}`
}
function isRef(value: unknown): value is CaptionDomainRef {
  return typeof value === 'object' && value !== null
    && typeof (value as { id?: unknown }).id === 'string'
}
function stripSha(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}
function domainRefFromPrefixed(value: {
  id: string
  version: number
  contentHash: string
}): CaptionDomainRef {
  return refSchema.parse({
    id: value.id,
    version: String(value.version),
    contentHash: stripSha(value.contentHash),
  })
}
function digest(value: unknown, omitted: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>,
    omitted,
  )
}
function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
function freeze<T>(value: T): T {
  return Object.freeze(structuredClone(value))
}
function normalizePrefix(value: string): string {
  return z.string().min(1).max(1_024)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
    .refine((item) => !item.includes('..') && !item.includes('//')
      && !item.endsWith('/')).parse(value)
}
function pathKey(value: CaptionDomainRef): string {
  return createHash('sha256').update(
    stableAuthorityStringify(value),
    'utf8',
  ).digest('hex')
}
async function persistExact<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  value: T
  parse: (value: unknown) => T
}): Promise<'created' | 'identical_replay'> {
  const parsed = input.parse(input.value)
  const body = Buffer.from(stableAuthorityStringify(parsed), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_BYTES) {
    throw new Error('Track All task-QA record byte length is invalid.')
  }
  const disposition = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await input.port.readExact(input.path)
  if (!reread || !Buffer.isBuffer(reread) || !reread.equals(body)) {
    throw new Error('Track All task-QA exact reread failed.')
  }
  input.parse(JSON.parse(reread.toString('utf8')) as unknown)
  return disposition === 'created' ? 'created' : 'identical_replay'
}
async function readExact<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAX_BYTES) {
    throw new Error('Track All task-QA reread bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new Error('Track All task-QA reread JSON is invalid.')
  }
  const parsed = input.parse(value)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new Error('Track All task-QA canonical bytes changed.')
  }
  return parsed
}
function assertPort(value: CanonicalCreateOnlyJsonObjectPort): void {
  if (!value || typeof value.createOnly !== 'function'
    || typeof value.readExact !== 'function') {
    throw new Error('Track All task-QA object port is unavailable.')
  }
}
function assertOwnerPorts(input: {
  supportResumeRepository: Pick<CanonicalSpecialistSupportResumeRepository,
    'rereadCallResultPair'>
  taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
  taskContextRepository: Pick<CanonicalSam31GpuTaskContextRepository,
    'rereadTaskContext'>
  resultStore: Pick<CanonicalSam31GpuRuntimeResultStore,
    'rereadResultAdmission'>
  qaRepository: CanonicalTrackAllSam31TaskQaRepository
  sceneEvidenceRepository:
    CanonicalTrackAllSam31CaptionSceneEvidenceRepository
}): void {
  if (typeof input.supportResumeRepository?.rereadCallResultPair !== 'function'
    || typeof input.taskStore?.rereadTask !== 'function'
    || typeof input.taskContextRepository?.rereadTaskContext !== 'function'
    || typeof input.resultStore?.rereadResultAdmission !== 'function'
    || typeof input.qaRepository?.rereadMeasurement !== 'function'
    || typeof input.qaRepository?.rereadReview !== 'function'
    || typeof input.qaRepository?.persistAuthorityCreateOnly !== 'function'
    || typeof input.sceneEvidenceRepository?.persistCreateOnly !== 'function'
    || typeof input.sceneEvidenceRepository?.rereadByRef !== 'function') {
    throw new Error('Track All task-QA owner ports are unavailable.')
  }
}
