import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import type {
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CanonicalTrackAllSam31L4MaskQaMeasurement,
} from '../../src/types/canonical-track-all-sam3_1-task-qa'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31GpuCompleteSourceExecutionObservation,
  assertCanonicalSam31GpuCompleteSourcePerformanceEvidence,
  assertCanonicalSam31GpuCompleteSourceStitchEvidence,
  canonicalSam31GpuCompleteSourceExecutionObservationRef,
  canonicalSam31GpuCompleteSourcePerformanceEvidenceRef,
  canonicalSam31GpuCompleteSourceStitchEvidenceRef,
  createCanonicalSam31GpuCompleteSourceEvidenceReadPort,
  createCanonicalSam31GpuCompleteSourcePerformanceRepository,
  type CanonicalSam31GpuCompleteSourceEvidenceReadPort,
  type CanonicalSam31GpuCompleteSourcePerformanceRepository,
} from './canonical-sam3_1-gpu-complete-source-performance-owner'
import {
  canonicalSam31TemporalMeasurementSetRef,
  createCanonicalSam31TemporalMeasurementSetRepository,
  sealCanonicalSam31TemporalMeasurementSet,
  type CanonicalSam31TemporalMeasurementSet,
  type CanonicalSam31TemporalMeasurementSetRepository,
} from './canonical-sam3_1-gpu-temporal-quality-qualification-owner'
import {
  parseCanonicalTrackAllSam31L4MaskQaMeasurement,
  createCanonicalTrackAllSam31TaskQaRepository,
  type CanonicalTrackAllSam31TaskQaRepository,
} from './canonical-track-all-sam3_1-task-qa-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_TEMPORAL_COVERAGE_MANIFEST_VERSION =
  'canonical-sam3_1-temporal-coverage-manifest-v1' as const
export const CANONICAL_SAM3_1_TEMPORAL_MEASUREMENT_COMPILER_VERSION =
  'canonical-sam3_1-gpu-temporal-measurement-compiler-v1' as const
export const CANONICAL_SAM3_1_CROSS_CHUNK_BOUNDARY_MEASUREMENT_SET_VERSION =
  'canonical-sam3_1-cross-chunk-boundary-measurement-set-v1' as const
export const CANONICAL_SAM3_1_TEMPORAL_METRIC_SERIES_SET_VERSION =
  'canonical-sam3_1-temporal-metric-series-set-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/temporal-quality-input'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>
const domainRefSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: safeId,
  version: safeId,
  contentHash: sha256,
}).strict()
const basisPoints = z.number().int().min(0).max(10_000)

const sequenceSchema = z.object({
  sequenceOrdinal: z.number().int().min(1).max(128),
  sequenceId: safeId,
  expectedObjectId: safeId,
  subjectRequestId: safeId,
  firstExpectedFrameIndex: nonnegativeInteger,
  lastExpectedFrameIndex: nonnegativeInteger,
  expectedFrameCount: positiveInteger,
}).strict().superRefine((sequence, context) => {
  if (sequence.lastExpectedFrameIndex < sequence.firstExpectedFrameIndex
    || sequence.expectedFrameCount !== sequence.lastExpectedFrameIndex
      - sequence.firstExpectedFrameIndex + 1) context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 expected temporal sequence range is invalid.',
    })
})

const manifestWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_TEMPORAL_COVERAGE_MANIFEST_VERSION,
  ),
  source: z.literal('canonical_track_all_sam3_1_expected_coverage_owner'),
  evidenceClass: z.literal('canonical_approved_complete_source_scope'),
  status: z.literal('expected_temporal_coverage_ready'),
  manifestId: safeId,
  manifestVersion: z.literal(1),
  exactEightMinuteSourceRef: refSchema,
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameCount: positiveInteger.max(1_000_000),
  fpsNumerator: positiveInteger.max(240_000),
  fpsDenominator: positiveInteger.max(1_001_000),
  expectedSequenceCount: positiveInteger.max(128),
  sequences: z.array(sequenceSchema).min(1).max(128),
  everyApprovedObjectIntervalEnumerated: z.literal(true),
  expectedIntervalsCoverCompleteSource: z.literal(true),
  browserOrCallerScopeAccepted: z.literal(false),
  runtimeDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  createdAt: timestamp,
}).strict().superRefine((manifest, context) => {
  const exactDuration = manifest.sourceFrameCount * manifest.fpsDenominator
    * 1_000 / manifest.fpsNumerator
  const ordinals = manifest.sequences.map((sequence) =>
    sequence.sequenceOrdinal)
  const keys = manifest.sequences.map((sequence) =>
    `${sequence.sequenceId}\0${sequence.expectedObjectId}`)
  const rangesValid = manifest.sequences.every((sequence) =>
    sequence.lastExpectedFrameIndex < manifest.sourceFrameCount)
  const sameSubjectIntervalsDoNotOverlap = manifest.sequences.every(
    (sequence, index) => manifest.sequences.every((other, otherIndex) =>
      index === otherIndex
      || sequence.subjectRequestId !== other.subjectRequestId
      || sequence.lastExpectedFrameIndex < other.firstExpectedFrameIndex
      || other.lastExpectedFrameIndex < sequence.firstExpectedFrameIndex),
  )
  if (exactDuration !== 480_000
    || manifest.expectedSequenceCount !== manifest.sequences.length
    || !ordinals.every((ordinal, index) => ordinal === index + 1)
    || new Set(keys).size !== keys.length
    || !rangesValid
    || !sameSubjectIntervalsDoNotOverlap
    || !rangesCoverCompleteSource(manifest.sequences,
      manifest.sourceFrameCount)) context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 expected temporal coverage is incomplete.',
    })
})

export const canonicalSam31TemporalCoverageManifestSchema =
  manifestWithoutHashSchema.extend({ manifestHash: sha256 }).strict()
export type CanonicalSam31TemporalCoverageManifest = z.infer<
  typeof canonicalSam31TemporalCoverageManifestSchema
>

const boundarySubjectSchema = z.object({
  subjectRequestId: safeId,
  leftSubjectEvidenceId: safeId,
  rightSubjectEvidenceId: safeId,
  leftMaskArtifactRef: domainRefSchema,
  rightMaskArtifactRef: domainRefSchema,
  minimumOverlapBinaryIntersectionOverUnionBasisPoints:
    basisPoints.min(8_500),
  maximumOverlapAlphaDeltaBasisPoints: basisPoints.max(1_000),
  maximumOverlapBoundaryDisagreementBasisPoints: basisPoints.max(1_000),
  identitySwitchCount: z.literal(0),
  objectDropoutCount: z.literal(0),
  everyOverlapMaskPairMeasured: z.literal(true),
}).strict()

const boundarySchema = z.object({
  boundaryOrdinal: z.number().int().min(1).max(255),
  leftChunkOrdinal: z.number().int().min(1).max(255),
  rightChunkOrdinal: z.number().int().min(2).max(256),
  leftChunkMeasurementRef: domainRefSchema,
  rightChunkMeasurementRef: domainRefSchema,
  overlapStartFrameInclusive: nonnegativeInteger,
  overlapEndFrameExclusive: positiveInteger,
  overlapFrameCount: z.literal(1),
  subjectMeasurements: z.array(boundarySubjectSchema).min(1).max(16),
  l4BoundaryQaExecutionEvidenceRef: refSchema,
  l4TerminalUsageAndCostReceiptRef: refSchema,
  actualL4KorniaCudaAndOpenCvBoundaryQaObserved: z.literal(true),
  cpuOnlySubstantiveBoundaryQaUsed: z.literal(false),
  terminalWorkerStoppedAndScaleBackToZeroVerified: z.literal(true),
  exactAccountEffectiveAttemptCostPersisted: z.literal(true),
}).strict().superRefine((boundary, context) => {
  if (boundary.rightChunkOrdinal !== boundary.leftChunkOrdinal + 1
    || boundary.boundaryOrdinal !== boundary.leftChunkOrdinal
    || boundary.overlapEndFrameExclusive <= boundary.overlapStartFrameInclusive
    || boundary.overlapFrameCount !== boundary.overlapEndFrameExclusive
      - boundary.overlapStartFrameInclusive
    || new Set(boundary.subjectMeasurements.map((subject) =>
      subject.subjectRequestId)).size !== boundary.subjectMeasurements.length) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 cross-chunk boundary measurement is inconsistent.',
    })
  }
})

const boundarySetWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CROSS_CHUNK_BOUNDARY_MEASUREMENT_SET_VERSION,
  ),
  source: z.literal(
    'canonical_independent_sam3_1_l4_cross_chunk_boundary_qa_worker',
  ),
  evidenceClass: z.literal('canonical_private_l4_cuda_boundary_qa_reread'),
  status: z.literal('complete_cross_chunk_boundary_measurements_ready'),
  boundarySetId: safeId,
  boundarySetVersion: z.literal(1),
  qualificationId: safeId,
  executionGroupObservationRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  orderedChunkMeasurementRefs: z.array(domainRefSchema).min(2).max(256),
  expectedBoundaryCount: positiveInteger.max(255),
  boundaries: z.array(boundarySchema).min(1).max(255),
  everyAdjacentChunkBoundaryAndSubjectMeasured: z.literal(true),
  sampledOrRepresentativeOnlyMeasurementAccepted: z.literal(false),
  browserOrCallerMetricsAccepted: z.literal(false),
  rawMaskBytesPathsUrlsOrCredentialsIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  measuredAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.expectedBoundaryCount !== value.orderedChunkMeasurementRefs.length - 1
    || value.expectedBoundaryCount !== value.boundaries.length
    || value.boundaries.some((boundary, index) =>
      boundary.boundaryOrdinal !== index + 1
      || !sameDomainRef(boundary.leftChunkMeasurementRef,
        value.orderedChunkMeasurementRefs[index])
      || !sameDomainRef(boundary.rightChunkMeasurementRef,
        value.orderedChunkMeasurementRefs[index + 1]))
    || new Set(value.orderedChunkMeasurementRefs.map(domainRefKey)).size
      !== value.orderedChunkMeasurementRefs.length) context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 cross-chunk boundary set is incomplete.',
    })
})

export const canonicalSam31CrossChunkBoundaryMeasurementSetSchema =
  boundarySetWithoutHashSchema.extend({ boundarySetHash: sha256 }).strict()
export type CanonicalSam31CrossChunkBoundaryMeasurementSet = z.infer<
  typeof canonicalSam31CrossChunkBoundaryMeasurementSetSchema
>

const metricSeriesSchema = z.object({
  chunkOrdinal: z.number().int().min(1).max(256),
  chunkMeasurementRef: domainRefSchema,
  subjectRequestId: safeId,
  subjectEvidenceId: safeId,
  expectedFrameCount: positiveInteger.max(240),
  expectedFramePairCount: positiveInteger.max(239),
  motionCompensatedBinaryIntersectionOverUnionBasisPoints:
    z.array(basisPoints).min(1).max(239),
  meanAbsoluteAlphaDeltaBasisPoints: z.array(basisPoints).min(1).max(239),
  boundaryDisagreementBasisPoints: z.array(basisPoints).min(2).max(240),
  l4TemporalMetricSeriesExecutionEvidenceRef: refSchema,
  exactOrderedPerFramePairMetricsFromKorniaCuda: z.literal(true),
  exactOrderedPerFrameMetricsFromKorniaCuda: z.literal(true),
  opencvCudaEveryMaskCrosschecked: z.literal(true),
}).strict().superRefine((series, context) => {
  if (series.expectedFramePairCount !== series.expectedFrameCount - 1
    || series.motionCompensatedBinaryIntersectionOverUnionBasisPoints.length
      !== series.expectedFramePairCount
    || series.meanAbsoluteAlphaDeltaBasisPoints.length
      !== series.expectedFramePairCount
    || series.boundaryDisagreementBasisPoints.length
      !== series.expectedFrameCount) context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 temporal metric series length is inconsistent.',
    })
})

const metricSeriesSetWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_TEMPORAL_METRIC_SERIES_SET_VERSION),
  source: z.literal(
    'canonical_independent_sam3_1_l4_temporal_metric_series_worker',
  ),
  evidenceClass: z.literal('canonical_private_l4_cuda_metric_series_reread'),
  status: z.literal('complete_temporal_metric_series_ready'),
  metricSeriesSetId: safeId,
  metricSeriesSetVersion: z.literal(1),
  qualificationId: safeId,
  executionGroupObservationRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  orderedChunkMeasurementRefs: z.array(domainRefSchema).min(2).max(256),
  expectedMetricSeriesCount: positiveInteger.max(4_096),
  metricSeries: z.array(metricSeriesSchema).min(2).max(4_096),
  everyMeasuredChunkSubjectHasExactOrderedMetricSeries: z.literal(true),
  sampledOrSummaryOnlyMetricsAccepted: z.literal(false),
  browserOrCallerMetricsAccepted: z.literal(false),
  rawMaskBytesPathsUrlsOrCredentialsIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  measuredAt: timestamp,
}).strict().superRefine((value, context) => {
  const keys = value.metricSeries.map((series) =>
    `${series.chunkOrdinal}\0${series.subjectRequestId}`)
  const canonicalKeys = [...value.metricSeries]
    .sort((left, right) => left.chunkOrdinal - right.chunkOrdinal
      || compareUtf16(left.subjectRequestId, right.subjectRequestId))
    .map((series) => `${series.chunkOrdinal}\0${series.subjectRequestId}`)
  if (value.expectedMetricSeriesCount !== value.metricSeries.length
    || new Set(keys).size !== keys.length
    || stableAuthorityStringify(keys)
      !== stableAuthorityStringify(canonicalKeys)
    || new Set(value.orderedChunkMeasurementRefs.map(domainRefKey)).size
      !== value.orderedChunkMeasurementRefs.length
    || value.metricSeries.some((series) =>
      series.chunkOrdinal > value.orderedChunkMeasurementRefs.length
      || !sameDomainRef(series.chunkMeasurementRef,
        value.orderedChunkMeasurementRefs[series.chunkOrdinal - 1]))) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 temporal metric-series set is incomplete.',
    })
  }
})

export const canonicalSam31TemporalMetricSeriesSetSchema =
  metricSeriesSetWithoutHashSchema.extend({ metricSeriesSetHash: sha256 })
    .strict()
export type CanonicalSam31TemporalMetricSeriesSet = z.infer<
  typeof canonicalSam31TemporalMetricSeriesSetSchema
>

const requestSchema = z.object({
  measurementSetId: safeId,
  qualificationId: safeId,
  completeSourcePerformanceEvidenceRef: refSchema,
  executionGroupObservationRef: refSchema,
  stitchEvidenceRef: refSchema,
  expectedObjectCoverageManifestRef: refSchema,
  crossChunkBoundaryMeasurementSetRef: refSchema,
  temporalMetricSeriesSetRef: refSchema,
  orderedChunkMeasurementRefs: z.array(domainRefSchema).min(2).max(256),
  callerMetricsOrCompletionClaimsAccepted: z.literal(false),
}).strict().superRefine((request, context) => {
  if (new Set(request.orderedChunkMeasurementRefs.map(domainRefKey)).size
    !== request.orderedChunkMeasurementRefs.length) context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 chunk measurement references are duplicated.',
    })
})

export interface CanonicalSam31TemporalCoverageManifestRepository {
  persistManifestCreateOnly(input: {
    readonly manifest: CanonicalSam31TemporalCoverageManifest
  }): Promise<EvidenceRef>
  rereadManifest(input: {
    readonly manifestRef: EvidenceRef
  }): Promise<CanonicalSam31TemporalCoverageManifest | null>
}

export interface CanonicalSam31CrossChunkBoundaryMeasurementSetRepository {
  persistBoundaryMeasurementSetCreateOnly(input: {
    readonly boundarySet: CanonicalSam31CrossChunkBoundaryMeasurementSet
  }): Promise<EvidenceRef>
  rereadBoundaryMeasurementSet(input: {
    readonly boundarySetRef: EvidenceRef
  }): Promise<CanonicalSam31CrossChunkBoundaryMeasurementSet | null>
}

export interface CanonicalSam31TemporalMetricSeriesSetRepository {
  persistMetricSeriesSetCreateOnly(input: {
    readonly metricSeriesSet: CanonicalSam31TemporalMetricSeriesSet
  }): Promise<EvidenceRef>
  rereadMetricSeriesSet(input: {
    readonly metricSeriesSetRef: EvidenceRef
  }): Promise<CanonicalSam31TemporalMetricSeriesSet | null>
}

type PersistBoundarySetInput = Parameters<
  CanonicalSam31CrossChunkBoundaryMeasurementSetRepository[
    'persistBoundaryMeasurementSetCreateOnly'
  ]
>[0]
type RereadBoundarySetInput = Parameters<
  CanonicalSam31CrossChunkBoundaryMeasurementSetRepository[
    'rereadBoundaryMeasurementSet'
  ]
>[0]
type PersistMetricSeriesSetInput = Parameters<
  CanonicalSam31TemporalMetricSeriesSetRepository[
    'persistMetricSeriesSetCreateOnly'
  ]
>[0]
type RereadMetricSeriesSetInput = Parameters<
  CanonicalSam31TemporalMetricSeriesSetRepository[
    'rereadMetricSeriesSet'
  ]
>[0]
type PersistManifestInput = Parameters<
  CanonicalSam31TemporalCoverageManifestRepository[
    'persistManifestCreateOnly'
  ]
>[0]
type RereadManifestInput = Parameters<
  CanonicalSam31TemporalCoverageManifestRepository['rereadManifest']
>[0]

export function createCanonicalSam31CrossChunkBoundaryMeasurementSetRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31CrossChunkBoundaryMeasurementSetRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persistBoundaryMeasurementSetCreateOnly({
      boundarySet,
    }: PersistBoundarySetInput) {
      const parsed =
        assertCanonicalSam31CrossChunkBoundaryMeasurementSet(boundarySet)
      const boundarySetRef =
        canonicalSam31CrossChunkBoundaryMeasurementSetRef(parsed)
      await persistExact(input.objectPort,
        boundarySetPath(prefix, boundarySetRef), parsed)
      return boundarySetRef
    },
    async rereadBoundaryMeasurementSet({
      boundarySetRef,
    }: RereadBoundarySetInput) {
      const parsedRef = refSchema.parse(boundarySetRef)
      const value = await readExact(input.objectPort,
        boundarySetPath(prefix, parsedRef),
        assertCanonicalSam31CrossChunkBoundaryMeasurementSet)
      if (value && !sameNumericRef(
        canonicalSam31CrossChunkBoundaryMeasurementSetRef(value), parsedRef)) {
        throw conflict('cross_chunk_boundary_set_reference_mismatch')
      }
      return value
    },
  })
}

export function createCanonicalSam31TemporalMetricSeriesSetRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31TemporalMetricSeriesSetRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persistMetricSeriesSetCreateOnly({
      metricSeriesSet,
    }: PersistMetricSeriesSetInput) {
      const parsed = assertCanonicalSam31TemporalMetricSeriesSet(
        metricSeriesSet,
      )
      const metricSeriesSetRef = canonicalSam31TemporalMetricSeriesSetRef(parsed)
      await persistExact(input.objectPort,
        metricSeriesSetPath(prefix, metricSeriesSetRef), parsed)
      return metricSeriesSetRef
    },
    async rereadMetricSeriesSet({
      metricSeriesSetRef,
    }: RereadMetricSeriesSetInput) {
      const parsedRef = refSchema.parse(metricSeriesSetRef)
      const value = await readExact(input.objectPort,
        metricSeriesSetPath(prefix, parsedRef),
        assertCanonicalSam31TemporalMetricSeriesSet)
      if (value && !sameNumericRef(
        canonicalSam31TemporalMetricSeriesSetRef(value), parsedRef)) {
        throw conflict('temporal_metric_series_set_reference_mismatch')
      }
      return value
    },
  })
}

export function sealCanonicalSam31TemporalCoverageManifest(
  value: unknown,
): CanonicalSam31TemporalCoverageManifest {
  assertPlainSerializedData(value, 'sam31_temporal_coverage_manifest_build')
  const payload = manifestWithoutHashSchema.parse(value)
  return assertCanonicalSam31TemporalCoverageManifest({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31TemporalCoverageManifest(
  value: unknown,
): CanonicalSam31TemporalCoverageManifest {
  assertPlainSerializedData(value, 'sam31_temporal_coverage_manifest')
  const parsed = canonicalSam31TemporalCoverageManifestSchema.parse(value)
  const { manifestHash, ...payload } = parsed
  if (manifestHash !== sha256AuthorityValue(payload)) {
    throw conflict('coverage_manifest_hash_invalid')
  }
  return parsed
}

export function canonicalSam31TemporalCoverageManifestRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31TemporalCoverageManifest(value)
  return numericRef(parsed.manifestId, parsed.manifestHash)
}

export function sealCanonicalSam31CrossChunkBoundaryMeasurementSet(
  value: unknown,
): CanonicalSam31CrossChunkBoundaryMeasurementSet {
  assertPlainSerializedData(value, 'sam31_cross_chunk_boundary_set_build')
  const payload = boundarySetWithoutHashSchema.parse(value)
  return assertCanonicalSam31CrossChunkBoundaryMeasurementSet({
    ...payload,
    boundarySetHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31CrossChunkBoundaryMeasurementSet(
  value: unknown,
): CanonicalSam31CrossChunkBoundaryMeasurementSet {
  assertPlainSerializedData(value, 'sam31_cross_chunk_boundary_set')
  const parsed = canonicalSam31CrossChunkBoundaryMeasurementSetSchema.parse(
    value,
  )
  const { boundarySetHash, ...payload } = parsed
  if (boundarySetHash !== sha256AuthorityValue(payload)) {
    throw conflict('cross_chunk_boundary_set_hash_invalid')
  }
  return parsed
}

export function canonicalSam31CrossChunkBoundaryMeasurementSetRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31CrossChunkBoundaryMeasurementSet(value)
  return numericRef(parsed.boundarySetId, parsed.boundarySetHash)
}

export function sealCanonicalSam31TemporalMetricSeriesSet(
  value: unknown,
): CanonicalSam31TemporalMetricSeriesSet {
  assertBoundedTemporalMetricSeriesSerializedData(value)
  const payload = metricSeriesSetWithoutHashSchema.parse(value)
  return assertCanonicalSam31TemporalMetricSeriesSet({
    ...payload,
    metricSeriesSetHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31TemporalMetricSeriesSet(
  value: unknown,
): CanonicalSam31TemporalMetricSeriesSet {
  assertBoundedTemporalMetricSeriesSerializedData(value)
  const parsed = canonicalSam31TemporalMetricSeriesSetSchema.parse(value)
  const { metricSeriesSetHash, ...payload } = parsed
  if (metricSeriesSetHash !== sha256AuthorityValue(payload)) {
    throw conflict('temporal_metric_series_set_hash_invalid')
  }
  return parsed
}

export function canonicalSam31TemporalMetricSeriesSetRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31TemporalMetricSeriesSet(value)
  return numericRef(parsed.metricSeriesSetId, parsed.metricSeriesSetHash)
}

export function createCanonicalSam31TemporalCoverageManifestRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31TemporalCoverageManifestRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persistManifestCreateOnly({ manifest }: PersistManifestInput) {
      const parsed = assertCanonicalSam31TemporalCoverageManifest(manifest)
      const manifestRef = canonicalSam31TemporalCoverageManifestRef(parsed)
      await persistExact(input.objectPort,
        manifestPath(prefix, manifestRef), parsed)
      return manifestRef
    },
    async rereadManifest({ manifestRef }: RereadManifestInput) {
      const parsedRef = refSchema.parse(manifestRef)
      const value = await readExact(input.objectPort,
        manifestPath(prefix, parsedRef),
        assertCanonicalSam31TemporalCoverageManifest)
      if (value && !sameNumericRef(
        canonicalSam31TemporalCoverageManifestRef(value), parsedRef)) {
        throw conflict('coverage_manifest_reference_mismatch')
      }
      return value
    },
  })
}

export function createCanonicalSam31GpuTemporalMeasurementCompiler(input: {
  readonly performanceRepository: Pick<
    CanonicalSam31GpuCompleteSourcePerformanceRepository,
    'rereadPerformanceEvidence'
  >
  readonly completeSourceReadPort: CanonicalSam31GpuCompleteSourceEvidenceReadPort
  readonly taskQaRepository: Pick<
    CanonicalTrackAllSam31TaskQaRepository,
    'rereadMeasurement'
  >
  readonly coverageManifestRepository:
    CanonicalSam31TemporalCoverageManifestRepository
  readonly boundaryMeasurementSetRepository:
    CanonicalSam31CrossChunkBoundaryMeasurementSetRepository
  readonly temporalMetricSeriesSetRepository:
    CanonicalSam31TemporalMetricSeriesSetRepository
  readonly measurementSetRepository:
    CanonicalSam31TemporalMeasurementSetRepository
  readonly now?: () => string
}) {
  assertCompilerPorts(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_TEMPORAL_MEASUREMENT_COMPILER_VERSION,
    evidenceClass:
      'server_owned_complete_source_chunk_qa_aggregation' as const,
    async compileAndPersistMeasurementSet(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_temporal_measurement_compiler_request')
      const request = requestSchema.parse(untrusted)
      const [performanceValue, observationValue, stitchValue, manifestValue,
        boundaryValue, metricSeriesValue] =
        await Promise.all([
          input.performanceRepository.rereadPerformanceEvidence({
            evidenceRef: request.completeSourcePerformanceEvidenceRef,
          }),
          input.completeSourceReadPort.rereadExecutionGroupObservation({
            executionGroupObservationRef:
              request.executionGroupObservationRef,
          }),
          input.completeSourceReadPort.rereadStitchEvidence({
            stitchEvidenceRef: request.stitchEvidenceRef,
          }),
          input.coverageManifestRepository.rereadManifest({
            manifestRef: request.expectedObjectCoverageManifestRef,
          }),
          input.boundaryMeasurementSetRepository.rereadBoundaryMeasurementSet({
            boundarySetRef: request.crossChunkBoundaryMeasurementSetRef,
          }),
          input.temporalMetricSeriesSetRepository.rereadMetricSeriesSet({
            metricSeriesSetRef: request.temporalMetricSeriesSetRef,
          }),
        ])
      if (!performanceValue || !observationValue || !stitchValue
        || !manifestValue || !boundaryValue || !metricSeriesValue) {
        throw conflict(
          'performance_observation_stitch_manifest_boundary_or_series_missing',
        )
      }
      const performance =
        assertCanonicalSam31GpuCompleteSourcePerformanceEvidence(
          performanceValue,
        )
      const observation =
        assertCanonicalSam31GpuCompleteSourceExecutionObservation(
          observationValue,
        )
      const stitch = assertCanonicalSam31GpuCompleteSourceStitchEvidence(
        stitchValue,
      )
      const manifest = assertCanonicalSam31TemporalCoverageManifest(
        manifestValue,
      )
      const boundarySet =
        assertCanonicalSam31CrossChunkBoundaryMeasurementSet(boundaryValue)
      const metricSeriesSet =
        assertCanonicalSam31TemporalMetricSeriesSet(metricSeriesValue)
      assertRequestRefs({
        request, performance, observation, stitch, manifest, boundarySet,
        metricSeriesSet,
      })
      assertCompleteSourceLineage({ performance, observation, stitch, manifest })
      if (request.orderedChunkMeasurementRefs.length
        !== observation.chunks.length) throw conflict(
          'chunk_measurement_count_mismatch',
        )
      const measurements = await Promise.all(
        request.orderedChunkMeasurementRefs.map(async (measurementRef) => {
          const value = await input.taskQaRepository.rereadMeasurement({
            measurementRef,
          })
          if (!value) throw conflict('chunk_measurement_missing')
          const measurement =
            parseCanonicalTrackAllSam31L4MaskQaMeasurement(value)
          if (!sameDomainRef(measurementReference(measurement), measurementRef)) {
            throw conflict('chunk_measurement_reference_mismatch')
          }
          return measurement
        }),
      )
      assertMeasurementsMatchChunks({
        observation,
        manifest,
        measurements,
      })
      assertBoundaryMeasurements({
        request,
        observation,
        measurements,
        boundarySet,
      })
      assertMetricSeries({
        request,
        observation,
        measurements,
        metricSeriesSet,
      })
      const sequences = manifest.sequences.map((expected) =>
        compileSequence({
          expected, observation, measurements, boundarySet, metricSeriesSet,
        }))
      const measuredAt = timestamp.parse(now())
      if (Date.parse(measuredAt) < Date.parse(performance.verifiedAt)
        || measurements.some((measurement) =>
          Date.parse(measuredAt) < Date.parse(measurement.measuredAt))) {
        throw conflict('measurement_set_compiled_before_source_evidence')
      }
      const measurementSet = sealCanonicalSam31TemporalMeasurementSet({
        schemaVersion:
          'canonical-sam3_1-independent-temporal-measurement-set-v1',
        source: 'canonical_independent_sam3_1_temporal_mask_measurement_owner',
        evidenceClass: 'canonical_private_independent_qa_reread',
        status: 'complete_temporal_measurements_ready',
        measurementSetId: request.measurementSetId,
        measurementSetVersion: 1,
        qualificationId: request.qualificationId,
        route: performance.route,
        immutableImageDigest: performance.immutableImageDigest,
        exactEightMinuteSourceRef: performance.exactEightMinuteSourceRef,
        sourceWidth: performance.sourceWidth,
        sourceHeight: performance.sourceHeight,
        sourceFrameCount: performance.sourceFrameCount,
        firstSourceFrameIndex: 0,
        lastSourceFrameIndex: performance.sourceFrameCount - 1,
        stitchedMaskSequenceRef: performance.stitchedMaskSequenceRef,
        stitchedOutputMaskSetDigestSha256:
          performance.stitchedOutputMaskSetDigestSha256,
        expectedObjectCoverageManifestRef:
          request.expectedObjectCoverageManifestRef,
        measurementProfileRef: temporalMeasurementProfileRef(),
        measurementProfileId:
          'motion_compensated_contiguous_mask_quality_v1',
        expectedSequenceCount: sequences.length,
        sequences,
        everyExpectedSourceFrameAndObjectIntervalMeasured: true,
        sampledOrRepresentativeOnlyEvidenceAccepted: false,
        sourceResolutionPreserved: true,
        reviewerIndependentFromRuntimeWorker: true,
        rawMaskBytesPathsUrlsOrCredentialsIncluded: false,
        qaApprovalGranted: false,
        assetManifestMutated: false,
        renderAuthorized: false,
        customerCreditsMutated: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        measuredAt,
      })
      const persistedRef = await input.measurementSetRepository
        .persistMeasurementSetCreateOnly({ measurementSet })
      const expectedRef = canonicalSam31TemporalMeasurementSetRef(
        measurementSet,
      )
      if (!sameNumericRef(persistedRef, expectedRef)) {
        throw conflict('measurement_set_persistence_reference_mismatch')
      }
      const reread = await input.measurementSetRepository.rereadMeasurementSet({
        measurementSetRef: persistedRef,
      })
      if (!reread || !sameNumericRef(
        canonicalSam31TemporalMeasurementSetRef(reread), expectedRef)) {
        throw conflict('measurement_set_exact_reread_failed')
      }
      return reread
    },
  })
}

export function createCanonicalSam31GpuTemporalMeasurementCompilerFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
) {
  const performanceRepository =
    createCanonicalSam31GpuCompleteSourcePerformanceRepository({
      objectPort: input.objectPort,
    })
  const completeSourceReadPort =
    createCanonicalSam31GpuCompleteSourceEvidenceReadPort({
      objectPort: input.objectPort,
    })
  const taskQaRepository = createCanonicalTrackAllSam31TaskQaRepository({
    objectPort: input.objectPort,
  })
  const coverageManifestRepository =
    createCanonicalSam31TemporalCoverageManifestRepository({
      objectPort: input.objectPort,
    })
  const measurementSetRepository =
    createCanonicalSam31TemporalMeasurementSetRepository({
      objectPort: input.objectPort,
    })
  const boundaryMeasurementSetRepository =
    createCanonicalSam31CrossChunkBoundaryMeasurementSetRepository({
      objectPort: input.objectPort,
    })
  const temporalMetricSeriesSetRepository =
    createCanonicalSam31TemporalMetricSeriesSetRepository({
      objectPort: input.objectPort,
    })
  return createCanonicalSam31GpuTemporalMeasurementCompiler({
    performanceRepository,
    completeSourceReadPort,
    taskQaRepository,
    coverageManifestRepository,
    boundaryMeasurementSetRepository,
    temporalMetricSeriesSetRepository,
    measurementSetRepository,
    now: input.now,
  })
}

export function createCanonicalSam31GcpGpuTemporalMeasurementCompiler(input: {
  readonly storage?: Storage
  readonly now?: () => string
} = {}) {
  return createCanonicalSam31GpuTemporalMeasurementCompilerFromObjectPort({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
    now: input.now,
  })
}

function assertRequestRefs(input: {
  request: z.infer<typeof requestSchema>
  performance: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourcePerformanceEvidence
  >
  observation: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourceExecutionObservation
  >
  stitch: ReturnType<typeof assertCanonicalSam31GpuCompleteSourceStitchEvidence>
  manifest: CanonicalSam31TemporalCoverageManifest
  boundarySet: CanonicalSam31CrossChunkBoundaryMeasurementSet
  metricSeriesSet: CanonicalSam31TemporalMetricSeriesSet
}): void {
  if (!sameNumericRef(
    canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(input.performance),
    input.request.completeSourcePerformanceEvidenceRef)
    || !sameNumericRef(
      canonicalSam31GpuCompleteSourceExecutionObservationRef(input.observation),
      input.request.executionGroupObservationRef)
    || !sameNumericRef(
      canonicalSam31GpuCompleteSourceStitchEvidenceRef(input.stitch),
      input.request.stitchEvidenceRef)
    || !sameNumericRef(
      canonicalSam31TemporalCoverageManifestRef(input.manifest),
      input.request.expectedObjectCoverageManifestRef)
    || !sameNumericRef(
      canonicalSam31CrossChunkBoundaryMeasurementSetRef(input.boundarySet),
      input.request.crossChunkBoundaryMeasurementSetRef)
    || !sameNumericRef(
      canonicalSam31TemporalMetricSeriesSetRef(input.metricSeriesSet),
      input.request.temporalMetricSeriesSetRef)) {
    throw conflict('request_reference_mismatch')
  }
}

function assertBoundaryMeasurements(input: {
  request: z.infer<typeof requestSchema>
  observation: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourceExecutionObservation
  >
  measurements: readonly CanonicalTrackAllSam31L4MaskQaMeasurement[]
  boundarySet: CanonicalSam31CrossChunkBoundaryMeasurementSet
}): void {
  const { boundarySet, observation, measurements, request } = input
  if (boundarySet.qualificationId !== request.qualificationId
    || !sameNumericRef(boundarySet.executionGroupObservationRef,
      request.executionGroupObservationRef)
    || !sameNumericRef(boundarySet.exactEightMinuteSourceRef,
      observation.exactEightMinuteSourceRef)
    || stableAuthorityStringify(boundarySet.orderedChunkMeasurementRefs)
      !== stableAuthorityStringify(request.orderedChunkMeasurementRefs)
    || boundarySet.boundaries.length !== measurements.length - 1
    || Date.parse(boundarySet.measuredAt) < Math.max(
      ...measurements.map((measurement) => Date.parse(measurement.measuredAt)),
    )) throw conflict('cross_chunk_boundary_lineage_mismatch')
  boundarySet.boundaries.forEach((boundary, index) => {
    const leftChunk = observation.chunks[index]
    const rightChunk = observation.chunks[index + 1]
    const left = measurements[index]
    const right = measurements[index + 1]
    const expectedStart = rightChunk.canonicalStartFrameInclusive
    const expectedEnd = Math.min(leftChunk.canonicalEndFrameInclusive,
      rightChunk.canonicalEndFrameInclusive) + 1
    const leftSubjects = new Map(left.subjectEvidence.map((subject) =>
      [subject.subjectRequestId, subject]))
    const rightSubjects = new Map(right.subjectEvidence.map((subject) =>
      [subject.subjectRequestId, subject]))
    const commonIds = [...leftSubjects.keys()].filter((id) =>
      rightSubjects.has(id)).sort(compareUtf16)
    const measuredIds = boundary.subjectMeasurements.map((subject) =>
      subject.subjectRequestId).sort(compareUtf16)
    if (boundary.leftChunkOrdinal !== leftChunk.chunkOrdinal
      || boundary.rightChunkOrdinal !== rightChunk.chunkOrdinal
      || boundary.overlapStartFrameInclusive !== expectedStart
      || boundary.overlapEndFrameExclusive !== expectedEnd
      || expectedEnd <= expectedStart
      || stableAuthorityStringify(commonIds)
        !== stableAuthorityStringify(measuredIds)
      || boundary.subjectMeasurements.some((subject) => {
        const leftSubject = leftSubjects.get(subject.subjectRequestId)
        const rightSubject = rightSubjects.get(subject.subjectRequestId)
        return !leftSubject || !rightSubject
          || subject.leftSubjectEvidenceId !== leftSubject.subjectEvidenceId
          || subject.rightSubjectEvidenceId !== rightSubject.subjectEvidenceId
          || leftSubject.maskSequenceRef === null
          || rightSubject.maskSequenceRef === null
          || !sameDomainRef(subject.leftMaskArtifactRef,
            leftSubject.maskSequenceRef)
          || !sameDomainRef(subject.rightMaskArtifactRef,
            rightSubject.maskSequenceRef)
      })) throw conflict(`boundary_${index + 1}_measurement_mismatch`)
  })
}

function assertMetricSeries(input: {
  request: z.infer<typeof requestSchema>
  observation: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourceExecutionObservation
  >
  measurements: readonly CanonicalTrackAllSam31L4MaskQaMeasurement[]
  metricSeriesSet: CanonicalSam31TemporalMetricSeriesSet
}): void {
  const { metricSeriesSet, observation, measurements, request } = input
  const expectedSeries = measurements.flatMap((measurement, index) =>
    measurement.subjectEvidence.map((subject) => ({
      chunkOrdinal: index + 1,
      measurementRef: measurementReference(measurement),
      subjectRequestId: subject.subjectRequestId,
      subjectEvidenceId: subject.subjectEvidenceId,
      expectedFrameCount: measurement.requestedRange.endFrameExclusive
        - measurement.requestedRange.startFrame,
      maximumBoundaryDisagreementBasisPoints:
        subject.temporalQa.maximumBoundaryDisagreementBasisPoints,
    })))
  if (metricSeriesSet.qualificationId !== request.qualificationId
    || !sameNumericRef(metricSeriesSet.executionGroupObservationRef,
      request.executionGroupObservationRef)
    || !sameNumericRef(metricSeriesSet.exactEightMinuteSourceRef,
      observation.exactEightMinuteSourceRef)
    || stableAuthorityStringify(metricSeriesSet.orderedChunkMeasurementRefs)
      !== stableAuthorityStringify(request.orderedChunkMeasurementRefs)
    || metricSeriesSet.metricSeries.length !== expectedSeries.length
    || Date.parse(metricSeriesSet.measuredAt) < Math.max(
      ...measurements.map((measurement) => Date.parse(measurement.measuredAt)),
    )
    || expectedSeries.some((expected) => {
      const series = metricSeriesSet.metricSeries.find((candidate) =>
        candidate.chunkOrdinal === expected.chunkOrdinal
        && candidate.subjectRequestId === expected.subjectRequestId)
      return !series
        || !sameDomainRef(series.chunkMeasurementRef,
          expected.measurementRef)
        || series.subjectEvidenceId !== expected.subjectEvidenceId
        || series.expectedFrameCount !== expected.expectedFrameCount
        || Math.max(...series.boundaryDisagreementBasisPoints)
          !== expected.maximumBoundaryDisagreementBasisPoints
    })) throw conflict('temporal_metric_series_lineage_mismatch')
}

function assertCompleteSourceLineage(input: {
  performance: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourcePerformanceEvidence
  >
  observation: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourceExecutionObservation
  >
  stitch: ReturnType<typeof assertCanonicalSam31GpuCompleteSourceStitchEvidence>
  manifest: CanonicalSam31TemporalCoverageManifest
}): void {
  const { performance, observation, stitch, manifest } = input
  if (performance.qualificationId !== observation.qualificationId
    || !sameNumericRef(performance.fullSourceExecutionRef,
      canonicalSam31GpuCompleteSourceExecutionObservationRef(observation))
    || stableAuthorityStringify(performance.route)
      !== stableAuthorityStringify(observation.route)
    || performance.immutableImageDigest !== observation.immutableImageDigest
    || !sameNumericRef(stitch.executionGroupRef,
      canonicalSam31GpuCompleteSourceExecutionObservationRef(observation))
    || !sameNumericRef(performance.exactEightMinuteSourceRef,
      observation.exactEightMinuteSourceRef)
    || !sameNumericRef(performance.exactEightMinuteSourceRef,
      stitch.exactEightMinuteSourceRef)
    || !sameNumericRef(performance.exactEightMinuteSourceRef,
      manifest.exactEightMinuteSourceRef)
    || !sameNumericRef(performance.chunkPlanRef, observation.chunkPlanRef)
    || !sameNumericRef(performance.chunkPlanRef, stitch.chunkPlanRef)
    || performance.chunkCount !== observation.chunks.length
    || stableAuthorityStringify(stitch.orderedChunkResultRefs)
      !== stableAuthorityStringify(observation.chunks.map((chunk) =>
        chunk.resultAdmissionRef))
    || !sameNumericRef(performance.stitchedMaskSequenceRef,
      stitch.stitchedMaskSequenceRef)
    || performance.stitchedOutputMaskSetDigestSha256
      !== stitch.stitchedOutputMaskSetDigestSha256
    || performance.sourceWidth !== observation.sourceWidth
    || performance.sourceWidth !== stitch.sourceWidth
    || performance.sourceWidth !== manifest.sourceWidth
    || performance.sourceHeight !== observation.sourceHeight
    || performance.sourceHeight !== stitch.sourceHeight
    || performance.sourceHeight !== manifest.sourceHeight
    || performance.sourceFrameCount !== observation.sourceFrameCount
    || performance.sourceFrameCount !== stitch.sourceFrameCount
    || performance.sourceFrameCount !== manifest.sourceFrameCount
    || performance.fpsNumerator !== manifest.fpsNumerator
    || performance.fpsDenominator !== manifest.fpsDenominator
    || !performance.sourceResolutionAndCompleteFrameRangePreserved
    || !performance.everyChunkTaskResponseResultAndTerminalCostReread
    || !performance.exactStitchedManifestAndEveryMaskByteReread
    || !performance.allGpuCapacityStoppedAfterTerminal
    || performance.automaticQualityReductionAllowed
    || performance.callerPerformanceClaimsAccepted) {
    throw conflict('complete_source_lineage_mismatch')
  }
}

function assertMeasurementsMatchChunks(input: {
  observation: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourceExecutionObservation
  >
  manifest: CanonicalSam31TemporalCoverageManifest
  measurements: readonly CanonicalTrackAllSam31L4MaskQaMeasurement[]
}): void {
  const first = input.measurements[0]
  const expectedSubjectIds = new Set(input.manifest.sequences.map((sequence) =>
    sequence.subjectRequestId))
  input.measurements.forEach((measurement, index) => {
    const chunk = input.observation.chunks[index]
    const expectedRange = {
      startFrame: chunk.canonicalStartFrameInclusive,
      endFrameExclusive: chunk.canonicalEndFrameInclusive + 1,
    }
    const activeSequences = input.manifest.sequences.filter((sequence) =>
      rangesOverlap(expectedRange, {
        startFrame: sequence.firstExpectedFrameIndex,
        endFrameExclusive: sequence.lastExpectedFrameIndex + 1,
      }))
    if (activeSequences.some((sequence) =>
      expectedRange.startFrame < sequence.firstExpectedFrameIndex
      || expectedRange.endFrameExclusive > sequence.lastExpectedFrameIndex + 1)) {
      throw conflict('sequence_boundary_not_chunk_aligned')
    }
    const activeSubjectIds = activeSequences.map((sequence) =>
      sequence.subjectRequestId).sort(compareUtf16)
    const measuredSubjectIds = measurement.subjectEvidence.map((subject) =>
      subject.subjectRequestId).sort(compareUtf16)
    if (measurement.invocationId !== chunk.invocationId
      || !sameDomainToNumericRef(measurement.sam31TaskRef, chunk.taskRef)
      || !sameDomainToNumericRef(
        measurement.sam31RuntimeResultAdmissionRef,
        chunk.resultAdmissionRef,
      )
      || measurement.requestedRange.startFrame !== expectedRange.startFrame
      || measurement.requestedRange.endFrameExclusive
        !== expectedRange.endFrameExclusive
      || !sameDomainToNumericRef(measurement.sourcePrivateArtifactRef,
        input.observation.exactEightMinuteSourceRef)
      || stableAuthorityStringify(activeSubjectIds)
        !== stableAuthorityStringify(measuredSubjectIds)
      || measurement.subjectEvidence.some((subject) =>
        !expectedSubjectIds.has(subject.subjectRequestId))
      || !sameDomainRef(measurement.confirmedOutputFrameRef,
        first.confirmedOutputFrameRef)
      || measurement.canonicalScope.workspaceId
        !== first.canonicalScope.workspaceId
      || measurement.canonicalScope.projectId !== first.canonicalScope.projectId
      || measurement.canonicalScope.editSessionId
        !== first.canonicalScope.editSessionId
      || measurement.canonicalScope.planVersionId
        !== first.canonicalScope.planVersionId
      || measurement.canonicalScope.outputId !== first.canonicalScope.outputId
      || measurement.l4QaExecution.cpuOnlySubstantiveMaskQaUsed
      || !measurement.l4QaExecution.terminalWorkerStoppedAndScaleBackToZeroVerified
      || !measurement.l4QaExecution.exactAccountEffectiveAttemptCostPersisted
      || !measurement.everyRequestedFrameAndSubjectMeasured
      || measurement.sampledOrRepresentativeOnlyMeasurementAccepted
      || !measurement.exactMaskManifestAndEveryMaskPngReread
      || measurement.browserOrCallerMeasurementAccepted
      || measurement.customerCreditsMutated
      || measurement.qaApprovalGranted
      || measurement.productionAuthorityGranted) {
      throw conflict(`chunk_${index + 1}_measurement_lineage_mismatch`)
    }
  })
}

function compileSequence(input: {
  expected: CanonicalSam31TemporalCoverageManifest['sequences'][number]
  observation: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourceExecutionObservation
  >
  measurements: readonly CanonicalTrackAllSam31L4MaskQaMeasurement[]
  boundarySet: CanonicalSam31CrossChunkBoundaryMeasurementSet
  metricSeriesSet: CanonicalSam31TemporalMetricSeriesSet
}): CanonicalSam31TemporalMeasurementSet['sequences'][number] {
  const selected = input.measurements.flatMap((measurement, index) => {
    const subject = measurement.subjectEvidence.find((candidate) =>
      candidate.subjectRequestId === input.expected.subjectRequestId)
    return subject ? [{ measurement, subject, chunk: input.observation.chunks[index] }]
      : []
  })
  if (selected.length === 0 || !completeOverlappingRangeCoverage(
    selected.map(({ measurement }) => measurement.requestedRange),
    input.expected.firstExpectedFrameIndex,
    input.expected.lastExpectedFrameIndex + 1,
  )) throw conflict(`sequence_${input.expected.sequenceOrdinal}_coverage_missing`)
  const qa = selected.map(({ subject }) => subject.temporalQa)
  const metricSeries = input.metricSeriesSet.metricSeries.filter((series) =>
    series.subjectRequestId === input.expected.subjectRequestId)
    .sort((left, right) => left.chunkOrdinal - right.chunkOrdinal)
  const boundaries = input.boundarySet.boundaries.flatMap((boundary) =>
    boundary.subjectMeasurements.filter((subject) =>
      subject.subjectRequestId === input.expected.subjectRequestId))
  const iouSeries = metricSeries.flatMap((series) =>
    series.motionCompensatedBinaryIntersectionOverUnionBasisPoints)
  const alphaSeries = metricSeries.flatMap((series) =>
    series.meanAbsoluteAlphaDeltaBasisPoints)
  const boundarySeries = metricSeries.flatMap((series, index) => index === 0
    ? series.boundaryDisagreementBasisPoints
    : series.boundaryDisagreementBasisPoints.slice(1))
  const maximumCentroid = Math.max(...qa.map((value) =>
    value.maximumNormalizedCentroidShiftBasisPoints))
  const minimumCoverage = Math.min(...qa.map((value) =>
    value.minimumSubjectCoverageBasisPoints))
  const minimumEdgeQuality = Math.min(...qa.map((value) =>
    value.minimumEdgeQualityBasisPoints))
  const boundaryMaximumAlpha = boundaries.length > 0
    ? Math.max(...boundaries.map((value) =>
      value.maximumOverlapAlphaDeltaBasisPoints)) : 0
  if (metricSeries.length !== selected.length
    || boundaries.length !== Math.max(0, selected.length - 1)
    || iouSeries.length !== input.expected.expectedFrameCount - 1
    || alphaSeries.length !== input.expected.expectedFrameCount - 1
    || boundarySeries.length !== input.expected.expectedFrameCount) {
    throw conflict(`sequence_${input.expected.sequenceOrdinal}_series_incomplete`)
  }
  const p05Iou = nearestRankPercentile([
    ...iouSeries,
    ...boundaries.map((value) =>
      value.minimumOverlapBinaryIntersectionOverUnionBasisPoints),
  ], 5)
  const p95Alpha = nearestRankPercentile([
    ...alphaSeries,
    ...boundaries.map((value) =>
      value.maximumOverlapAlphaDeltaBasisPoints),
  ], 95)
  const p95Boundary = nearestRankPercentile([
    ...boundarySeries,
    ...boundaries.map((value) =>
      value.maximumOverlapBoundaryDisagreementBasisPoints),
  ], 95)
  if (p05Iou < 8_500 || p95Alpha > 1_000
    || p95Boundary > 1_000 || maximumCentroid > 3_500
    || minimumCoverage === 0 || minimumEdgeQuality < 9_000
    || qa.some((value) => value.emptyMaskFrameCount !== 0
      || value.fullFrameMaskCount !== 0
      || value.identitySwapCount !== 0
      || value.lostAnchorFrameCount !== 0
      || !value.completeRequestedRangeCoverage)) {
    throw conflict(`sequence_${input.expected.sequenceOrdinal}_quality_failed`)
  }
  const measurementRefs = selected.map(({ measurement }) =>
    measurementReference(measurement))
  const maskRefs = selected.map(({ subject }) => subject.maskSequenceRef)
  if (maskRefs.some((value) => value === null)) {
    throw conflict(`sequence_${input.expected.sequenceOrdinal}_mask_missing`)
  }
  const metrics = {
    p05Iou,
    p95Alpha,
    p95Boundary,
    maximumCentroid,
    minimumCoverage,
    minimumEdgeQuality,
  }
  return {
    sequenceOrdinal: input.expected.sequenceOrdinal,
    sequenceId: input.expected.sequenceId,
    expectedObjectId: input.expected.expectedObjectId,
    firstExpectedFrameIndex: input.expected.firstExpectedFrameIndex,
    lastExpectedFrameIndex: input.expected.lastExpectedFrameIndex,
    expectedFrameCount: input.expected.expectedFrameCount,
    measuredFrameCount: input.expected.expectedFrameCount,
    maskArtifactSetRef: contentRef(
      `${input.expected.sequenceId}:complete-mask-artifact-set`,
      maskRefs,
    ),
    deterministicMetricReportRef: contentRef(
      `${input.expected.sequenceId}:deterministic-temporal-metrics`,
      { measurementRefs, metrics },
    ),
    maximumWeightedCoverageChangeRatio: Math.max(
      ...qa.map((value) => value.maximumAlphaFlickerBasisPoints),
      boundaryMaximumAlpha,
    ) / 10_000,
    p05MotionCompensatedBinaryIntersectionOverUnion: p05Iou / 10_000,
    p95MeanAbsoluteAlphaDelta: p95Alpha / 10_000,
    p95BoundaryDisagreementRatio: p95Boundary / 10_000,
    emptyExpectedMaskFrameCount: 0,
    unexpectedFullFrameMaskCount: 0,
    objectDropoutCount: 0,
    identitySwitchCount: 0,
    findingCodes: [],
    completeExpectedObjectIntervalMeasured: true,
  }
}

function temporalMeasurementProfileRef(): EvidenceRef {
  return contentRef('motion_compensated_contiguous_mask_quality_v1', {
    profileId: 'motion_compensated_contiguous_mask_quality_v1',
    compilerVersion: CANONICAL_SAM3_1_TEMPORAL_MEASUREMENT_COMPILER_VERSION,
    minimumBinaryIntersectionOverUnionBasisPoints: 8_500,
    maximumAlphaFlickerBasisPoints: 1_000,
    maximumBoundaryDisagreementBasisPoints: 1_000,
    maximumNormalizedCentroidShiftBasisPoints: 3_500,
    minimumEdgeQualityBasisPoints: 9_000,
    minimumSubjectCoverageBasisPointsExclusive: 0,
    emptyFullFrameDropoutIdentitySwitchAndLostAnchorCount: 0,
    chunkBoundaryOverlapFramesMinimum: 1,
    exactOrderedMetricSeriesNearestRankP05AndP95Used: true,
  })
}

function rangesCoverCompleteSource(
  sequences: readonly { firstExpectedFrameIndex: number; lastExpectedFrameIndex: number }[],
  sourceFrameCount: number,
): boolean {
  const ranges = sequences.map((sequence) => ({
    startFrame: sequence.firstExpectedFrameIndex,
    endFrameExclusive: sequence.lastExpectedFrameIndex + 1,
  }))
  return completeRangeCoverage(ranges, 0, sourceFrameCount, false)
}

function completeOverlappingRangeCoverage(
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
  expectedStart: number,
  expectedEndExclusive: number,
): boolean {
  return completeRangeCoverage(ranges, expectedStart, expectedEndExclusive, true)
}

function completeRangeCoverage(
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
  expectedStart: number,
  expectedEndExclusive: number,
  requireOverlap: boolean,
): boolean {
  const ordered = [...ranges].sort((left, right) =>
    left.startFrame - right.startFrame || left.endFrameExclusive
      - right.endFrameExclusive)
  if (ordered.length === 0 || ordered[0].startFrame !== expectedStart) {
    return false
  }
  let end = ordered[0].endFrameExclusive
  for (const range of ordered.slice(1)) {
    if (range.startFrame > end || (requireOverlap && range.startFrame >= end)) {
      return false
    }
    end = Math.max(end, range.endFrameExclusive)
  }
  return end === expectedEndExclusive
}

function rangesOverlap(
  left: { startFrame: number; endFrameExclusive: number },
  right: { startFrame: number; endFrameExclusive: number },
): boolean {
  return left.startFrame < right.endFrameExclusive
    && right.startFrame < left.endFrameExclusive
}

function measurementReference(
  measurement: CanonicalTrackAllSam31L4MaskQaMeasurement,
): CaptionDomainRef {
  return {
    id: measurement.measurementId,
    version: measurement.schemaVersion,
    contentHash: measurement.measurementDigestSha256,
  }
}

function numericRef(id: string, hash: string): EvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function contentRef(id: string, value: unknown): EvidenceRef {
  return numericRef(id, sha256AuthorityValue(value))
}

function sameNumericRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameDomainRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return domainRefKey(left) === domainRefKey(right)
}

function sameDomainToNumericRef(
  domain: CaptionDomainRef,
  numeric: EvidenceRef,
): boolean {
  return domain.id === numeric.id && domain.contentHash === numeric.contentHash.slice(7)
}

function domainRefKey(value: CaptionDomainRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function manifestPath(prefix: string, value: EvidenceRef): string {
  const parsed = refSchema.parse(value)
  const idHash = createHash('sha256').update(parsed.id).digest('hex')
  return `${normalizePrefix(prefix)}/coverage-manifests/${idHash}/`
    + `${parsed.contentHash.slice(7)}.json`
}

function boundarySetPath(prefix: string, value: EvidenceRef): string {
  const parsed = refSchema.parse(value)
  const idHash = createHash('sha256').update(parsed.id).digest('hex')
  return `${normalizePrefix(prefix)}/cross-chunk-boundary-sets/${idHash}/`
    + `${parsed.contentHash.slice(7)}.json`
}

function metricSeriesSetPath(prefix: string, value: EvidenceRef): string {
  const parsed = refSchema.parse(value)
  const idHash = createHash('sha256').update(parsed.id).digest('hex')
  return `${normalizePrefix(prefix)}/temporal-metric-series/${idHash}/`
    + `${parsed.contentHash.slice(7)}.json`
}

function nearestRankPercentile(
  values: readonly number[],
  percentile: number,
): number {
  if (values.length === 0 || !Number.isFinite(percentile)
    || percentile <= 0 || percentile > 100) throw conflict(
      'temporal_metric_percentile_input_invalid',
    )
  const ordered = [...values].sort((left, right) => left - right)
  const rank = Math.max(1, Math.ceil(percentile / 100 * ordered.length))
  const value = ordered[rank - 1]
  if (value === undefined) throw conflict('temporal_metric_percentile_missing')
  return value
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
    status === 'already_exists' ? 'create_only_collision' : 'exact_reread_failed',
  )
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) throw conflict(
      'record_size_invalid',
    )
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('record_json_invalid')
  }
  const parsed = parse(value)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw conflict('record_not_canonical')
  }
  return parsed
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 400 || normalized.includes('..')
    || normalized.includes('\\')) throw conflict('record_prefix_invalid')
  return normalized
}

function assertBoundedTemporalMetricSeriesSerializedData(value: unknown): void {
  const state = { seen: new Set<object>(), entries: 0 }
  const visit = (current: unknown, depth: number): void => {
    if (depth > 16) throw conflict('temporal_metric_series_nesting_too_deep')
    if (current === null || typeof current === 'boolean'
      || (typeof current === 'number' && Number.isFinite(current))) return
    if (typeof current === 'string') {
      if (current.length > 16_384) throw conflict(
        'temporal_metric_series_string_too_long',
      )
      return
    }
    if (typeof current !== 'object') throw conflict(
      'temporal_metric_series_not_serialized_plain_data',
    )
    if (state.seen.has(current)) throw conflict(
      'temporal_metric_series_contains_cycle',
    )
    state.seen.add(current)
    const prototype = Object.getPrototypeOf(current)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw conflict('temporal_metric_series_non_plain_prototype')
    }
    const keys = Reflect.ownKeys(current)
    if (keys.length > 4_096) throw conflict(
      'temporal_metric_series_node_too_large',
    )
    state.entries += keys.length
    if (state.entries > 100_000) throw conflict(
      'temporal_metric_series_tree_too_large',
    )
    for (const key of keys) {
      if (typeof key !== 'string') throw conflict(
        'temporal_metric_series_symbol_key',
      )
      const descriptor = Object.getOwnPropertyDescriptor(current, key)
      if (!descriptor || !('value' in descriptor)) throw conflict(
        'temporal_metric_series_accessor',
      )
      visit(descriptor.value, depth + 1)
    }
    state.seen.delete(current)
  }
  try {
    visit(value, 0)
  } catch (error) {
    if (error instanceof Error
      && error.message.startsWith('SAM 3.1 temporal measurement conflict:')) {
      throw error
    }
    throw conflict('temporal_metric_series_serialized_data_invalid')
  }
}

function assertObjectPort(value: CanonicalCreateOnlyJsonObjectPort): void {
  if (!value || typeof value.createOnly !== 'function'
    || typeof value.readExact !== 'function') throw conflict(
      'object_port_unavailable',
    )
}

function assertCompilerPorts(input: {
  performanceRepository: Pick<
    CanonicalSam31GpuCompleteSourcePerformanceRepository,
    'rereadPerformanceEvidence'
  >
  completeSourceReadPort: CanonicalSam31GpuCompleteSourceEvidenceReadPort
  taskQaRepository: Pick<
    CanonicalTrackAllSam31TaskQaRepository,
    'rereadMeasurement'
  >
  coverageManifestRepository: CanonicalSam31TemporalCoverageManifestRepository
  boundaryMeasurementSetRepository:
    CanonicalSam31CrossChunkBoundaryMeasurementSetRepository
  temporalMetricSeriesSetRepository:
    CanonicalSam31TemporalMetricSeriesSetRepository
  measurementSetRepository: CanonicalSam31TemporalMeasurementSetRepository
}): void {
  if (typeof input.performanceRepository?.rereadPerformanceEvidence
      !== 'function'
    || typeof input.completeSourceReadPort?.rereadExecutionGroupObservation
      !== 'function'
    || typeof input.completeSourceReadPort?.rereadStitchEvidence !== 'function'
    || typeof input.taskQaRepository?.rereadMeasurement !== 'function'
    || typeof input.coverageManifestRepository?.rereadManifest !== 'function'
    || typeof input.boundaryMeasurementSetRepository
      ?.rereadBoundaryMeasurementSet !== 'function'
    || typeof input.boundaryMeasurementSetRepository
      ?.persistBoundaryMeasurementSetCreateOnly !== 'function'
    || typeof input.temporalMetricSeriesSetRepository
      ?.rereadMetricSeriesSet !== 'function'
    || typeof input.temporalMetricSeriesSetRepository
      ?.persistMetricSeriesSetCreateOnly !== 'function'
    || typeof input.measurementSetRepository?.persistMeasurementSetCreateOnly
      !== 'function'
    || typeof input.measurementSetRepository?.rereadMeasurementSet
      !== 'function') throw conflict('compiler_dependency_unavailable')
}

function conflict(code: string): Error {
  return new Error(`SAM 3.1 temporal measurement conflict: ${code}.`)
}
