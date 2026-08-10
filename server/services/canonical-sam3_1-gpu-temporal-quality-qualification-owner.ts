import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
  assertCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  type CanonicalSam31GpuRuntimeQualificationEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'

export const CANONICAL_SAM3_1_TEMPORAL_MEASUREMENT_SET_VERSION =
  'canonical-sam3_1-independent-temporal-measurement-set-v1' as const
export const CANONICAL_SAM3_1_COMPLETE_INTERVAL_REVIEW_VERSION =
  'canonical-sam3_1-complete-interval-private-review-v1' as const
export const CANONICAL_SAM3_1_TEMPORAL_QUALITY_SET_VERSION =
  'canonical-sam3_1-temporal-quality-qualification-set-v1' as const
export const CANONICAL_SAM3_1_TEMPORAL_QUALITY_OWNER_VERSION =
  'canonical-sam3_1-gpu-temporal-quality-qualification-owner-v1' as const

const INPUT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/temporal-quality-input'
const OUTPUT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/temporal-quality-set'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const ratio = z.number().min(0).max(1).finite()
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>
const routeSchema = z.object({
  routeId: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  gpuProfileId: z.enum([
    'quality_a100_80gb_user_triggered_heavy_job_v1',
    'quality_l4_user_triggered_heavy_fallback_job_v1',
  ]),
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  executionTarget: z.enum([
    'google_cloud_batch_a2_ultra_job',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
}).strict().superRefine((route, context) => {
  const exact = route.routeId === 'a100_80gb_heavy_primary'
    ? route.gpuProfileId ===
        'quality_a100_80gb_user_triggered_heavy_job_v1'
      && route.executionTarget === 'google_cloud_batch_a2_ultra_job'
      && route.machineType === 'a2-ultragpu-1g'
      && route.accelerator === 'nvidia_a100_80gb'
    : route.gpuProfileId ===
        'quality_l4_user_triggered_heavy_fallback_job_v1'
      && route.executionTarget === 'google_cloud_run_l4_job'
      && route.machineType === 'cloud_run_nvidia_l4'
      && route.accelerator === 'nvidia_l4'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 temporal-quality route is inconsistent.',
  })
})

const temporalSequenceSchema = z.object({
  sequenceOrdinal: z.number().int().min(1).max(128),
  sequenceId: safeId,
  expectedObjectId: safeId,
  firstExpectedFrameIndex: nonnegativeInteger,
  lastExpectedFrameIndex: nonnegativeInteger,
  expectedFrameCount: positiveInteger,
  measuredFrameCount: positiveInteger,
  maskArtifactSetRef: refSchema,
  deterministicMetricReportRef: refSchema,
  maximumWeightedCoverageChangeRatio: ratio.max(0.35),
  p05MotionCompensatedBinaryIntersectionOverUnion: ratio.min(0.85),
  p95MeanAbsoluteAlphaDelta: ratio.max(0.1),
  p95BoundaryDisagreementRatio: ratio.max(0.1),
  emptyExpectedMaskFrameCount: z.literal(0),
  unexpectedFullFrameMaskCount: z.literal(0),
  objectDropoutCount: z.literal(0),
  identitySwitchCount: z.literal(0),
  findingCodes: z.array(z.never()).length(0),
  completeExpectedObjectIntervalMeasured: z.literal(true),
}).strict().superRefine((value, context) => {
  if (
    value.lastExpectedFrameIndex < value.firstExpectedFrameIndex
    || value.expectedFrameCount !==
      value.lastExpectedFrameIndex - value.firstExpectedFrameIndex + 1
    || value.measuredFrameCount !== value.expectedFrameCount
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 temporal sequence coverage is incomplete.',
  })
})

const measurementWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_TEMPORAL_MEASUREMENT_SET_VERSION,
  ),
  source: z.literal(
    'canonical_independent_sam3_1_temporal_mask_measurement_owner',
  ),
  evidenceClass: z.literal('canonical_private_independent_qa_reread'),
  status: z.literal('complete_temporal_measurements_ready'),
  measurementSetId: safeId,
  measurementSetVersion: z.literal(1),
  qualificationId: safeId,
  route: routeSchema,
  immutableImageDigest: prefixedSha256,
  exactEightMinuteSourceRef: refSchema,
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameCount: positiveInteger,
  firstSourceFrameIndex: z.literal(0),
  lastSourceFrameIndex: nonnegativeInteger,
  stitchedMaskSequenceRef: refSchema,
  stitchedOutputMaskSetDigestSha256: sha256,
  expectedObjectCoverageManifestRef: refSchema,
  measurementProfileRef: refSchema,
  measurementProfileId: z.literal(
    'motion_compensated_contiguous_mask_quality_v1',
  ),
  expectedSequenceCount: positiveInteger.max(128),
  sequences: z.array(temporalSequenceSchema).min(1).max(128),
  everyExpectedSourceFrameAndObjectIntervalMeasured: z.literal(true),
  sampledOrRepresentativeOnlyEvidenceAccepted: z.literal(false),
  sourceResolutionPreserved: z.literal(true),
  reviewerIndependentFromRuntimeWorker: z.literal(true),
  rawMaskBytesPathsUrlsOrCredentialsIncluded: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  measuredAt: timestamp,
}).strict().superRefine((value, context) => {
  const ordinals = value.sequences.map((sequence) => sequence.sequenceOrdinal)
  const sequenceKeys = value.sequences.map((sequence) =>
    `${sequence.sequenceId}:${sequence.expectedObjectId}`)
  const refs = value.sequences.flatMap((sequence) => [
    sequence.maskArtifactSetRef,
    sequence.deterministicMetricReportRef,
  ])
  if (
    value.lastSourceFrameIndex !== value.sourceFrameCount - 1
    || value.stitchedMaskSequenceRef.contentHash !==
      `sha256:${value.stitchedOutputMaskSetDigestSha256}`
    || value.expectedSequenceCount !== value.sequences.length
    || !ordinals.every((ordinal, index) => ordinal === index + 1)
    || new Set(sequenceKeys).size !== sequenceKeys.length
    || new Set(refs.map(refKey)).size !== refs.length
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 temporal measurement set is inconsistent.',
  })
})
export const canonicalSam31TemporalMeasurementSetSchema =
  measurementWithoutHashSchema.extend({ measurementSetHash: sha256 }).strict()
export type CanonicalSam31TemporalMeasurementSet = z.infer<
  typeof canonicalSam31TemporalMeasurementSetSchema
>

const reviewWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_COMPLETE_INTERVAL_REVIEW_VERSION,
  ),
  source: z.literal(
    'canonical_independent_sam3_1_complete_interval_private_reviewer',
  ),
  evidenceClass: z.literal('canonical_private_direct_visual_review'),
  status: z.literal('complete_interval_review_accepted'),
  reviewId: safeId,
  reviewVersion: z.literal(1),
  qualificationId: safeId,
  measurementSetRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  stitchedMaskSequenceRef: refSchema,
  stitchedOutputMaskSetDigestSha256: sha256,
  expectedObjectCoverageManifestRef: refSchema,
  fullResolutionReviewPlaybackRef: refSchema,
  reviewerIdentityRef: refSchema,
  reviewerRole: z.literal('independent_private_visual_qa_reviewer'),
  reviewMode: z.literal('full_resolution_complete_interval_playback'),
  reviewedWidth: positiveInteger.max(16_384),
  reviewedHeight: positiveInteger.max(16_384),
  firstReviewedFrameIndex: z.literal(0),
  lastReviewedFrameIndex: nonnegativeInteger,
  reviewedFrameCount: positiveInteger,
  reviewedSequenceCount: positiveInteger.max(128),
  reviewedSequenceMeasurementRefs: z.array(refSchema).min(1).max(128),
  findingCodes: z.array(z.never()).length(0),
  temporalMaskFindingCount: z.literal(0),
  everyExpectedFrameAndObjectReviewed: z.literal(true),
  directPrivateCompleteIntervalReviewPassed: z.literal(true),
  sampledOrRepresentativeReviewAccepted: z.literal(false),
  reviewerIndependentFromRuntimeWorker: z.literal(true),
  rawMediaMaskBytesPathsUrlsOrCredentialsIncluded: z.literal(false),
  providerOrModelCallMade: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  reviewedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.lastReviewedFrameIndex !== value.reviewedFrameCount - 1
    || value.stitchedMaskSequenceRef.contentHash !==
      `sha256:${value.stitchedOutputMaskSetDigestSha256}`
    || value.reviewedSequenceCount !==
      value.reviewedSequenceMeasurementRefs.length
    || new Set(value.reviewedSequenceMeasurementRefs.map(refKey)).size !==
      value.reviewedSequenceMeasurementRefs.length
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 complete-interval review is inconsistent.',
  })
})
export const canonicalSam31CompleteIntervalReviewSchema =
  reviewWithoutHashSchema.extend({ reviewHash: sha256 }).strict()
export type CanonicalSam31CompleteIntervalReview = z.infer<
  typeof canonicalSam31CompleteIntervalReviewSchema
>

const qualitySetWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_TEMPORAL_QUALITY_SET_VERSION),
  source: z.literal('canonical_sam3_1_gpu_temporal_quality_owner'),
  evidenceClass: z.literal('canonical_independent_measurement_and_review_reread'),
  status: z.literal('temporal_quality_qualification_ready'),
  qualityQualificationId: safeId,
  qualityQualificationVersion: z.literal(1),
  qualificationId: safeId,
  route: routeSchema,
  immutableImageDigest: prefixedSha256,
  temporalMeasurementSetRef: refSchema,
  completeIntervalReviewRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  stitchedMaskSequenceRef: refSchema,
  qualityRole: z.enum([
    'approved_a100_baseline',
    'l4_fallback_compared_to_approved_a100_baseline',
  ]),
  approvedA100BaselineRuntimeQualificationEvidenceRef: refSchema.nullable(),
  approvedA100BaselineComponentRef: refSchema.nullable(),
  approvedA100BaselineQualityQualificationRef: refSchema.nullable(),
  reviewedSequenceCount: positiveInteger,
  exactIndependentMeasurementAndCompleteReviewReread: z.literal(true),
  thresholdsPassed: z.literal(true),
  qualityEqualToOrBetterThanApprovedA100Baseline: z.literal(true),
  callerMeasurementsReviewOrComparisonClaimsAccepted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
}).strict().superRefine((value, context) => {
  const a100 = value.qualityRole === 'approved_a100_baseline'
  const exact = a100
    ? value.route.routeId === 'a100_80gb_heavy_primary'
      && value.approvedA100BaselineRuntimeQualificationEvidenceRef === null
      && value.approvedA100BaselineComponentRef === null
      && value.approvedA100BaselineQualityQualificationRef === null
    : value.route.routeId === 'l4_heavy_fallback'
      && value.approvedA100BaselineRuntimeQualificationEvidenceRef !== null
      && value.approvedA100BaselineComponentRef !== null
      && value.approvedA100BaselineQualityQualificationRef !== null
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 temporal quality baseline lineage is inconsistent.',
  })
})
export const canonicalSam31TemporalQualityQualificationSetSchema =
  qualitySetWithoutHashSchema.extend({ qualitySetHash: sha256 }).strict()
export type CanonicalSam31TemporalQualityQualificationSet = z.infer<
  typeof canonicalSam31TemporalQualityQualificationSetSchema
>

const ownerRequestSchema = z.object({
  componentId: safeId,
  qualityQualificationId: safeId,
  qualificationId: safeId,
  temporalMeasurementSetRef: refSchema,
  completeIntervalReviewRef: refSchema,
  qualityRole: z.enum([
    'approved_a100_baseline',
    'l4_fallback_compared_to_approved_a100_baseline',
  ]),
  approvedA100BaselineRuntimeQualificationEvidenceRef: refSchema.nullable(),
  approvedA100BaselineComponentRef: refSchema.nullable(),
}).strict().superRefine((value, context) => {
  const a100 = value.qualityRole === 'approved_a100_baseline'
  if (a100 !== (
    value.approvedA100BaselineRuntimeQualificationEvidenceRef === null
    && value.approvedA100BaselineComponentRef === null
  )) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 temporal quality request baseline fields are invalid.',
  })
})

export interface CanonicalSam31TemporalQualityReadPort {
  rereadTemporalMeasurementSet(input: {
    readonly measurementSetRef: EvidenceRef
  }): Promise<unknown | null>
  rereadCompleteIntervalReview(input: {
    readonly reviewRef: EvidenceRef
  }): Promise<unknown | null>
  rereadApprovedA100BaselineComponent(input: {
    readonly componentRef: EvidenceRef
  }): Promise<unknown | null>
  rereadApprovedA100RuntimeQualificationEvidence(input: {
    readonly qualificationEvidenceRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31TemporalQualitySetRepository {
  persistQualitySetCreateOnly(input: {
    readonly qualitySet: CanonicalSam31TemporalQualityQualificationSet
  }): Promise<EvidenceRef>
  rereadQualitySet(input: {
    readonly qualitySetRef: EvidenceRef
  }): Promise<CanonicalSam31TemporalQualityQualificationSet | null>
}

export function sealCanonicalSam31TemporalMeasurementSet(
  value: unknown,
): CanonicalSam31TemporalMeasurementSet {
  assertPlainSerializedData(value, 'sam31_temporal_measurement_set_build')
  const payload = measurementWithoutHashSchema.parse(value)
  return assertCanonicalSam31TemporalMeasurementSet({
    ...payload,
    measurementSetHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31TemporalMeasurementSet(
  value: unknown,
): CanonicalSam31TemporalMeasurementSet {
  assertPlainSerializedData(value, 'sam31_temporal_measurement_set')
  const parsed = canonicalSam31TemporalMeasurementSetSchema.parse(value)
  const { measurementSetHash, ...payload } = parsed
  if (measurementSetHash !== sha256AuthorityValue(payload)) {
    throw conflict('measurement_set_hash_invalid')
  }
  return parsed
}

export function canonicalSam31TemporalMeasurementSetRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31TemporalMeasurementSet(value)
  return ref(parsed.measurementSetId, parsed.measurementSetHash)
}

export function sealCanonicalSam31CompleteIntervalReview(
  value: unknown,
): CanonicalSam31CompleteIntervalReview {
  assertPlainSerializedData(value, 'sam31_complete_interval_review_build')
  const payload = reviewWithoutHashSchema.parse(value)
  return assertCanonicalSam31CompleteIntervalReview({
    ...payload,
    reviewHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31CompleteIntervalReview(
  value: unknown,
): CanonicalSam31CompleteIntervalReview {
  assertPlainSerializedData(value, 'sam31_complete_interval_review')
  const parsed = canonicalSam31CompleteIntervalReviewSchema.parse(value)
  const { reviewHash, ...payload } = parsed
  if (reviewHash !== sha256AuthorityValue(payload)) {
    throw conflict('complete_interval_review_hash_invalid')
  }
  return parsed
}

export function canonicalSam31CompleteIntervalReviewRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31CompleteIntervalReview(value)
  return ref(parsed.reviewId, parsed.reviewHash)
}

export function assertCanonicalSam31TemporalQualityQualificationSet(
  value: unknown,
): CanonicalSam31TemporalQualityQualificationSet {
  assertPlainSerializedData(value, 'sam31_temporal_quality_set')
  const parsed = canonicalSam31TemporalQualityQualificationSetSchema.parse(
    value,
  )
  const { qualitySetHash, ...payload } = parsed
  if (qualitySetHash !== sha256AuthorityValue(payload)) {
    throw conflict('quality_set_hash_invalid')
  }
  return parsed
}

export function canonicalSam31TemporalQualityQualificationSetRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31TemporalQualityQualificationSet(value)
  return ref(parsed.qualityQualificationId, parsed.qualitySetHash)
}

export function createCanonicalSam31GpuTemporalQualityQualificationOwner(
  input: {
    readonly readPort: CanonicalSam31TemporalQualityReadPort
    readonly qualitySetRepository: CanonicalSam31TemporalQualitySetRepository
    readonly componentRepository:
      CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository
    readonly now?: () => string
  },
) {
  assertReadPort(input.readPort)
  assertQualitySetRepository(input.qualitySetRepository)
  assertComponentRepository(input.componentRepository)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_TEMPORAL_QUALITY_OWNER_VERSION,
    evidenceClass:
      'canonical_independent_measurement_review_and_baseline_reread' as const,

    async compileAndPersistTemporalQualityComponent(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_temporal_quality_request')
      const request = ownerRequestSchema.parse(untrusted)
      const [measurementValue, reviewValue] = await Promise.all([
        input.readPort.rereadTemporalMeasurementSet({
          measurementSetRef: request.temporalMeasurementSetRef,
        }),
        input.readPort.rereadCompleteIntervalReview({
          reviewRef: request.completeIntervalReviewRef,
        }),
      ])
      if (!measurementValue || !reviewValue) {
        throw conflict('measurement_or_review_missing')
      }
      const measurement = assertCanonicalSam31TemporalMeasurementSet(
        measurementValue,
      )
      const review = assertCanonicalSam31CompleteIntervalReview(reviewValue)
      if (!sameRef(
        canonicalSam31TemporalMeasurementSetRef(measurement),
        request.temporalMeasurementSetRef,
      ) || !sameRef(
        canonicalSam31CompleteIntervalReviewRef(review),
        request.completeIntervalReviewRef,
      )) throw conflict('request_reference_mismatch')
      assertCurrentQualityLineage(request, measurement, review)
      const baseline = request.qualityRole === 'approved_a100_baseline'
        ? null
        : await rereadApprovedA100Baseline(input.readPort, request)
      if (baseline) {
        assertL4EqualToOrBetterThanBaseline(measurement, baseline.measurement)
      }
      const qualityPayload = qualitySetWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_TEMPORAL_QUALITY_SET_VERSION,
        source: 'canonical_sam3_1_gpu_temporal_quality_owner',
        evidenceClass:
          'canonical_independent_measurement_and_review_reread',
        status: 'temporal_quality_qualification_ready',
        qualityQualificationId: request.qualityQualificationId,
        qualityQualificationVersion: 1,
        qualificationId: request.qualificationId,
        route: measurement.route,
        immutableImageDigest: measurement.immutableImageDigest,
        temporalMeasurementSetRef: request.temporalMeasurementSetRef,
        completeIntervalReviewRef: request.completeIntervalReviewRef,
        exactEightMinuteSourceRef: measurement.exactEightMinuteSourceRef,
        stitchedMaskSequenceRef: measurement.stitchedMaskSequenceRef,
        qualityRole: request.qualityRole,
        approvedA100BaselineRuntimeQualificationEvidenceRef:
          request.approvedA100BaselineRuntimeQualificationEvidenceRef,
        approvedA100BaselineComponentRef:
          request.approvedA100BaselineComponentRef,
        approvedA100BaselineQualityQualificationRef:
          baseline?.component.payload.temporalMaskQualityQualificationRef
            ?? null,
        reviewedSequenceCount: measurement.sequences.length,
        exactIndependentMeasurementAndCompleteReviewReread: true,
        thresholdsPassed: true,
        qualityEqualToOrBetterThanApprovedA100Baseline: true,
        callerMeasurementsReviewOrComparisonClaimsAccepted: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        assetManifestMutated: false,
        renderAuthorized: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        qualifiedAt: z.string().datetime({ offset: true }).parse(now()),
      })
      const qualitySet = assertCanonicalSam31TemporalQualityQualificationSet({
        ...qualityPayload,
        qualitySetHash: sha256AuthorityValue(qualityPayload),
      })
      const qualitySetRef = await input.qualitySetRepository
        .persistQualitySetCreateOnly({ qualitySet })
      const expectedQualitySetRef =
        canonicalSam31TemporalQualityQualificationSetRef(qualitySet)
      if (!sameRef(qualitySetRef, expectedQualitySetRef)) {
        throw conflict('quality_set_persistence_reference_mismatch')
      }
      const qualitySetReread = await input.qualitySetRepository
        .rereadQualitySet({ qualitySetRef })
      if (!qualitySetReread || !sameRef(
        canonicalSam31TemporalQualityQualificationSetRef(qualitySetReread),
        expectedQualitySetRef,
      )) throw conflict('quality_set_exact_reread_failed')

      const component =
        buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
          schemaVersion:
            CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
          source:
            'canonical_sam3_1_gpu_runtime_qualification_component_owner',
          evidenceClass: 'canonical_private_reread',
          status: 'component_evidence_ready',
          componentId: request.componentId,
          componentVersion: 1,
          qualificationId: request.qualificationId,
          route: measurement.route,
          immutableImageDigest: measurement.immutableImageDigest,
          recordedAt: qualitySet.qualifiedAt,
          componentKind: 'independent_temporal_quality',
          payload: {
            temporalMaskQualityQualificationRef: expectedQualitySetRef,
            independentTemporalMeasurementSetRef:
              request.temporalMeasurementSetRef,
            directPrivateCompleteIntervalReviewRef:
              request.completeIntervalReviewRef,
            reviewedSequenceCount: measurement.sequences.length,
            temporalMaskFindingCount: 0,
            allMaskFramesMatchedSourceGeometry: true,
            everyExpectedFrameAndObjectReviewed: true,
            temporalStabilityThresholdsPassed: true,
            directPrivateCompleteIntervalReviewPassed: true,
            qualityRole: request.qualityRole,
            approvedA100BaselineRuntimeQualificationEvidenceRef:
              request.approvedA100BaselineRuntimeQualificationEvidenceRef,
            approvedA100BaselineRef: baseline
              ? baseline.component.payload.temporalMaskQualityQualificationRef
              : expectedQualitySetRef,
            qualityEqualToOrBetterThanApprovedA100Baseline: true,
            reviewerIndependentFromRuntimeWorker: true,
            qaApprovalGranted: false,
            assetManifestMutated: false,
            renderAuthorized: false,
            publicDeliveryAuthorized: false,
            productionAuthorityGranted: false,
          },
        })
      const componentRef = await input.componentRepository
        .persistComponentEvidenceCreateOnly({ componentEvidence: component })
      const expectedComponentRef =
        canonicalSam31GpuRuntimeQualificationComponentRef(component)
      if (!sameRef(componentRef, expectedComponentRef)) {
        throw conflict('component_persistence_reference_mismatch')
      }
      const reread = await input.componentRepository.rereadComponentEvidence({
        componentEvidenceRef: componentRef,
      })
      if (!reread || !sameRef(
        canonicalSam31GpuRuntimeQualificationComponentRef(reread),
        expectedComponentRef,
      )) throw conflict('component_exact_reread_failed')
      return reread
    },
  })
}

export function createCanonicalSam31TemporalQualitySetRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31TemporalQualitySetRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? OUTPUT_PREFIX)
  return Object.freeze({
    async persistQualitySetCreateOnly({ qualitySet }: {
      readonly qualitySet: CanonicalSam31TemporalQualityQualificationSet
    }) {
      const parsed = assertCanonicalSam31TemporalQualityQualificationSet(
        qualitySet,
      )
      const qualitySetRef =
        canonicalSam31TemporalQualityQualificationSetRef(parsed)
      await persistExact(input.objectPort,
        recordPath(prefix, 'sets', qualitySetRef), parsed)
      return qualitySetRef
    },
    async rereadQualitySet({ qualitySetRef }: {
      readonly qualitySetRef: EvidenceRef
    }) {
      const parsedRef = refSchema.parse(qualitySetRef)
      return readTypedObject(input.objectPort,
        recordPath(prefix, 'sets', parsedRef),
        assertCanonicalSam31TemporalQualityQualificationSet,
        parsedRef,
        canonicalSam31TemporalQualityQualificationSetRef)
    },
  })
}

export function createCanonicalSam31GpuTemporalQualityQualificationOwnerFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
) {
  const componentRepository =
    createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
      objectPort: input.objectPort,
    })
  const qualificationRepository =
    createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
      objectPort: input.objectPort,
    })
  return createCanonicalSam31GpuTemporalQualityQualificationOwner({
    readPort: {
      rereadTemporalMeasurementSet({ measurementSetRef }) {
        return readTypedObject(input.objectPort,
          recordPath(INPUT_PREFIX, 'measurements', measurementSetRef),
          assertCanonicalSam31TemporalMeasurementSet,
          measurementSetRef,
          canonicalSam31TemporalMeasurementSetRef)
      },
      rereadCompleteIntervalReview({ reviewRef }) {
        return readTypedObject(input.objectPort,
          recordPath(INPUT_PREFIX, 'reviews', reviewRef),
          assertCanonicalSam31CompleteIntervalReview,
          reviewRef,
          canonicalSam31CompleteIntervalReviewRef)
      },
      rereadApprovedA100BaselineComponent({ componentRef }) {
        return componentRepository.rereadComponentEvidence({
          componentEvidenceRef: componentRef,
        })
      },
      rereadApprovedA100RuntimeQualificationEvidence({
        qualificationEvidenceRef,
      }) {
        return qualificationRepository.rereadQualifiedEvidence({
          qualificationEvidenceRef,
        })
      },
    },
    qualitySetRepository: createCanonicalSam31TemporalQualitySetRepository({
      objectPort: input.objectPort,
    }),
    componentRepository,
    now: input.now,
  })
}

export function createCanonicalSam31GcpGpuTemporalQualityQualificationOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
) {
  return createCanonicalSam31GpuTemporalQualityQualificationOwnerFromObjectPort({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
    now: input.now,
  })
}

export async function persistCanonicalSam31TemporalQualityOwnerInput(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly measurementSet: CanonicalSam31TemporalMeasurementSet
  readonly completeIntervalReview: CanonicalSam31CompleteIntervalReview
}): Promise<{
  temporalMeasurementSetRef: EvidenceRef
  completeIntervalReviewRef: EvidenceRef
}> {
  assertObjectPort(input.objectPort)
  const measurement = assertCanonicalSam31TemporalMeasurementSet(
    input.measurementSet,
  )
  const review = assertCanonicalSam31CompleteIntervalReview(
    input.completeIntervalReview,
  )
  const temporalMeasurementSetRef =
    canonicalSam31TemporalMeasurementSetRef(measurement)
  const completeIntervalReviewRef =
    canonicalSam31CompleteIntervalReviewRef(review)
  await persistExact(input.objectPort,
    recordPath(INPUT_PREFIX, 'measurements', temporalMeasurementSetRef),
    measurement)
  await persistExact(input.objectPort,
    recordPath(INPUT_PREFIX, 'reviews', completeIntervalReviewRef), review)
  return { temporalMeasurementSetRef, completeIntervalReviewRef }
}

function assertCurrentQualityLineage(
  request: z.infer<typeof ownerRequestSchema>,
  measurement: CanonicalSam31TemporalMeasurementSet,
  review: CanonicalSam31CompleteIntervalReview,
): void {
  const sequenceRefs = measurement.sequences.map((sequence) =>
    sequence.deterministicMetricReportRef)
  const exact = measurement.qualificationId === request.qualificationId
    && review.qualificationId === request.qualificationId
    && sameRef(review.measurementSetRef,
      canonicalSam31TemporalMeasurementSetRef(measurement))
    && sameRef(review.exactEightMinuteSourceRef,
      measurement.exactEightMinuteSourceRef)
    && sameRef(review.stitchedMaskSequenceRef,
      measurement.stitchedMaskSequenceRef)
    && review.stitchedOutputMaskSetDigestSha256 ===
      measurement.stitchedOutputMaskSetDigestSha256
    && sameRef(review.expectedObjectCoverageManifestRef,
      measurement.expectedObjectCoverageManifestRef)
    && review.reviewedWidth === measurement.sourceWidth
    && review.reviewedHeight === measurement.sourceHeight
    && review.reviewedFrameCount === measurement.sourceFrameCount
    && review.lastReviewedFrameIndex === measurement.lastSourceFrameIndex
    && review.reviewedSequenceCount === measurement.sequences.length
    && stableAuthorityStringify(review.reviewedSequenceMeasurementRefs) ===
      stableAuthorityStringify(sequenceRefs)
  if (!exact) throw conflict('measurement_review_lineage_mismatch')
}

async function rereadApprovedA100Baseline(
  port: CanonicalSam31TemporalQualityReadPort,
  request: z.infer<typeof ownerRequestSchema>,
): Promise<{
  component: Extract<CanonicalSam31GpuRuntimeQualificationComponentEvidence,
    { componentKind: 'independent_temporal_quality' }>
  evidence: CanonicalSam31GpuRuntimeQualificationEvidence
  measurement: CanonicalSam31TemporalMeasurementSet
}> {
  const componentRef = request.approvedA100BaselineComponentRef
  const evidenceRef =
    request.approvedA100BaselineRuntimeQualificationEvidenceRef
  if (!componentRef || !evidenceRef) throw conflict('a100_baseline_refs_missing')
  const [componentValue, evidenceValue] = await Promise.all([
    port.rereadApprovedA100BaselineComponent({ componentRef }),
    port.rereadApprovedA100RuntimeQualificationEvidence({
      qualificationEvidenceRef: evidenceRef,
    }),
  ])
  if (!componentValue || !evidenceValue) {
    throw conflict('a100_baseline_record_missing')
  }
  const component =
    assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(
      componentValue,
    )
  const evidence = assertCanonicalSam31GpuRuntimeQualificationEvidence(
    evidenceValue,
  )
  if (component.componentKind !== 'independent_temporal_quality') {
    throw conflict('a100_baseline_component_kind_invalid')
  }
  if (!sameRef(canonicalSam31GpuRuntimeQualificationComponentRef(component),
    componentRef)
    || !sameRef(canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence),
      evidenceRef)
    || component.route.routeId !== 'a100_80gb_heavy_primary'
    || evidence.route.routeId !== 'a100_80gb_heavy_primary'
    || component.qualificationId !== evidence.qualificationId
    || component.immutableImageDigest !== evidence.immutableImageDigest
    || component.payload.qualityRole !== 'approved_a100_baseline'
    || stableAuthorityStringify(component.payload) !==
      stableAuthorityStringify(evidence.qualityEvidence)) {
    throw conflict('a100_baseline_lineage_mismatch')
  }
  const measurementValue = await port.rereadTemporalMeasurementSet({
    measurementSetRef: component.payload.independentTemporalMeasurementSetRef,
  })
  if (!measurementValue) throw conflict('a100_baseline_measurement_missing')
  const measurement = assertCanonicalSam31TemporalMeasurementSet(
    measurementValue,
  )
  if (!sameRef(canonicalSam31TemporalMeasurementSetRef(measurement),
    component.payload.independentTemporalMeasurementSetRef)
    || measurement.route.routeId !== 'a100_80gb_heavy_primary'
    || measurement.qualificationId !== component.qualificationId) {
    throw conflict('a100_baseline_measurement_lineage_mismatch')
  }
  return { component, evidence, measurement }
}

function assertL4EqualToOrBetterThanBaseline(
  candidate: CanonicalSam31TemporalMeasurementSet,
  baseline: CanonicalSam31TemporalMeasurementSet,
): void {
  const exactSet = candidate.route.routeId === 'l4_heavy_fallback'
    && baseline.route.routeId === 'a100_80gb_heavy_primary'
    && sameRef(candidate.exactEightMinuteSourceRef,
      baseline.exactEightMinuteSourceRef)
    && candidate.sourceWidth === baseline.sourceWidth
    && candidate.sourceHeight === baseline.sourceHeight
    && candidate.sourceFrameCount === baseline.sourceFrameCount
    && sameRef(candidate.expectedObjectCoverageManifestRef,
      baseline.expectedObjectCoverageManifestRef)
    && sameRef(candidate.measurementProfileRef,
      baseline.measurementProfileRef)
    && candidate.sequences.length === baseline.sequences.length
  if (!exactSet) throw conflict('l4_baseline_comparison_scope_mismatch')
  const equalOrBetter = candidate.sequences.every((current, index) => {
    const approved = baseline.sequences[index]
    return current.sequenceOrdinal === approved.sequenceOrdinal
      && current.sequenceId === approved.sequenceId
      && current.expectedObjectId === approved.expectedObjectId
      && current.firstExpectedFrameIndex === approved.firstExpectedFrameIndex
      && current.lastExpectedFrameIndex === approved.lastExpectedFrameIndex
      && current.maximumWeightedCoverageChangeRatio <=
        approved.maximumWeightedCoverageChangeRatio
      && current.p05MotionCompensatedBinaryIntersectionOverUnion >=
        approved.p05MotionCompensatedBinaryIntersectionOverUnion
      && current.p95MeanAbsoluteAlphaDelta <=
        approved.p95MeanAbsoluteAlphaDelta
      && current.p95BoundaryDisagreementRatio <=
        approved.p95BoundaryDisagreementRatio
  })
  if (!equalOrBetter) throw conflict('l4_quality_below_a100_baseline')
}

function ref(id: string, hash: string): EvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function refKey(value: {
  id: string
  version: number
  contentHash: string
}): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return refKey(left) === refKey(right)
}

function recordPath(
  prefix: string,
  kind: 'measurements' | 'reviews' | 'sets',
  value: EvidenceRef,
): string {
  const parsed = refSchema.parse(value)
  const idHash = createHash('sha256').update(parsed.id).digest('hex')
  return `${normalizePrefix(prefix)}/${kind}/${idHash}/`
    + `${parsed.contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  const status = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) throw conflict(
    status === 'already_exists'
      ? 'create_only_collision'
      : 'record_exact_reread_failed',
  )
}

async function readTypedObject<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  assertValue: (value: unknown) => T,
  expectedRef: EvidenceRef,
  refValue: (value: T) => EvidenceRef,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (!Buffer.isBuffer(body)
    || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('record_json_invalid')
  }
  const parsed = assertValue(untrusted)
  if (!sameRef(refValue(parsed), expectedRef)
    || stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw conflict('record_reference_or_canonical_bytes_mismatch')
  }
  return parsed
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.includes('..') || normalized.includes('\\')) {
    throw conflict('repository_prefix_invalid')
  }
  return normalized
}

function assertReadPort(port: CanonicalSam31TemporalQualityReadPort): void {
  if (!port
    || typeof port.rereadTemporalMeasurementSet !== 'function'
    || typeof port.rereadCompleteIntervalReview !== 'function'
    || typeof port.rereadApprovedA100BaselineComponent !== 'function'
    || typeof port.rereadApprovedA100RuntimeQualificationEvidence !==
      'function') throw conflict('read_port_invalid')
}

function assertQualitySetRepository(
  repository: CanonicalSam31TemporalQualitySetRepository,
): void {
  if (!repository
    || typeof repository.persistQualitySetCreateOnly !== 'function'
    || typeof repository.rereadQualitySet !== 'function') {
    throw conflict('quality_set_repository_invalid')
  }
}

function assertComponentRepository(
  repository: CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
): void {
  if (!repository
    || typeof repository.persistComponentEvidenceCreateOnly !== 'function'
    || typeof repository.rereadComponentEvidence !== 'function') {
    throw conflict('component_repository_invalid')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') throw conflict('object_port_invalid')
}

function conflict(reason: string): Error {
  return new Error(`SAM31_TEMPORAL_QUALITY_CONFLICT:${reason}`)
}
