import { z } from 'zod'

import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  assertCanonicalSam31GpuCompleteSourceExecutionObservation,
  canonicalSam31GpuCompleteSourceExecutionObservationRef,
  type CanonicalSam31GpuCompleteSourceEvidenceReadPort,
} from './canonical-sam3_1-gpu-complete-source-performance-owner'
import {
  canonicalSam31CrossChunkBoundaryMeasurementSetRef,
  canonicalSam31TemporalMetricSeriesSetRef,
  sealCanonicalSam31CrossChunkBoundaryMeasurementSet,
  sealCanonicalSam31TemporalMetricSeriesSet,
  type CanonicalSam31CrossChunkBoundaryMeasurementSetRepository,
  type CanonicalSam31TemporalMetricSeriesSetRepository,
} from './canonical-sam3_1-gpu-temporal-measurement-compiler'
import {
  parseCanonicalTrackAllSam31L4MaskQaMeasurement,
  type CanonicalTrackAllSam31TaskQaRepository,
} from './canonical-track-all-sam3_1-task-qa-owner'
import {
  CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_EVIDENCE_RESULT_V3_VERSION,
  parseCanonicalTrackAllSam31L4MaskQaWorkerResult,
  type CanonicalTrackAllSam31TaskQaCandidateRepository,
} from './canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_GPU_TEMPORAL_EVIDENCE_ASSEMBLER_VERSION =
  'canonical-sam3_1-gpu-temporal-evidence-assembler-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const numericRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const domainRefSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: safeId,
  version: safeId,
  contentHash: sha256,
}).strict()
const chunkInputSchema = z.object({
  chunkOrdinal: z.number().int().min(1).max(256),
  measurementRef: domainRefSchema,
  workerResultRef: domainRefSchema,
}).strict()
const requestSchema = z.object({
  qualificationId: safeId,
  executionGroupObservationRef: numericRefSchema,
  exactEightMinuteSourceRef: numericRefSchema,
  boundarySetId: safeId,
  metricSeriesSetId: safeId,
  chunks: z.array(chunkInputSchema).min(2).max(256),
  callerMetricsOrCompletionClaimsAccepted: z.literal(false),
}).strict().superRefine((value, context) => {
  const ordinals = value.chunks.map((chunk) => chunk.chunkOrdinal)
  const measurementKeys = value.chunks.map((chunk) => domainRefKey(
    chunk.measurementRef,
  ))
  const workerKeys = value.chunks.map((chunk) => domainRefKey(
    chunk.workerResultRef,
  ))
  if (!ordinals.every((ordinal, index) => ordinal === index + 1)
    || new Set(measurementKeys).size !== measurementKeys.length
    || new Set(workerKeys).size !== workerKeys.length) context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 temporal evidence inputs are incomplete or duplicated.',
    })
})

export function createCanonicalSam31GpuTemporalEvidenceAssembler(input: {
  readonly completeSourceReadPort: Pick<
    CanonicalSam31GpuCompleteSourceEvidenceReadPort,
    'rereadExecutionGroupObservation'
  >
  readonly taskQaRepository: Pick<
    CanonicalTrackAllSam31TaskQaRepository,
    'rereadMeasurement'
  >
  readonly taskQaCandidateRepository: Pick<
    CanonicalTrackAllSam31TaskQaCandidateRepository,
    'rereadWorkerResult'
  >
  readonly boundaryMeasurementSetRepository:
    CanonicalSam31CrossChunkBoundaryMeasurementSetRepository
  readonly temporalMetricSeriesSetRepository:
    CanonicalSam31TemporalMetricSeriesSetRepository
  readonly now?: () => string
}) {
  assertPorts(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_GPU_TEMPORAL_EVIDENCE_ASSEMBLER_VERSION,
    evidenceClass: 'server_owned_exact_l4_worker_evidence_assembly' as const,
    async assembleAndPersist(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_temporal_evidence_assembler_request')
      const request = requestSchema.parse(untrusted)
      const rawObservation = await input.completeSourceReadPort
        .rereadExecutionGroupObservation({
          executionGroupObservationRef: request.executionGroupObservationRef,
        })
      if (!rawObservation) throw conflict('execution_group_observation_missing')
      const observation =
        assertCanonicalSam31GpuCompleteSourceExecutionObservation(
          rawObservation,
        )
      if (!sameNumericRef(
        canonicalSam31GpuCompleteSourceExecutionObservationRef(observation),
        request.executionGroupObservationRef,
      ) || !sameNumericRef(observation.exactEightMinuteSourceRef,
        request.exactEightMinuteSourceRef)
        || observation.qualificationId !== request.qualificationId
        || request.chunks.length !== observation.chunks.length) {
        throw conflict('execution_group_scope_mismatch')
      }
      const chunks = await Promise.all(request.chunks.map(async (
        requestedChunk,
        index,
      ) => {
        const [measurementValue, workerValue] = await Promise.all([
          input.taskQaRepository.rereadMeasurement({
            measurementRef: requestedChunk.measurementRef,
          }),
          input.taskQaCandidateRepository.rereadWorkerResult({
            resultRef: requestedChunk.workerResultRef,
          }),
        ])
        if (!measurementValue || !workerValue) {
          throw conflict(`chunk_${index + 1}_measurement_or_worker_missing`)
        }
        const measurement = parseCanonicalTrackAllSam31L4MaskQaMeasurement(
          measurementValue,
        )
        const workerResult =
          parseCanonicalTrackAllSam31L4MaskQaWorkerResult(workerValue)
        if (workerResult.schemaVersion !==
          CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_EVIDENCE_RESULT_V3_VERSION) {
          throw conflict(`chunk_${index + 1}_worker_result_v3_required`)
        }
        const workerRequest =
          assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3(
            workerResult.workerRequest,
          )
        const workerResponse =
          assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3(
            workerResult.workerResponse,
          )
        const observedChunk = observation.chunks[index]
        assertChunkLineage({
          index,
          requestedChunk,
          observedChunk,
          measurement,
          workerResult,
          workerRequest,
          workerResponse,
          exactEightMinuteSourceRef: observation.exactEightMinuteSourceRef,
        })
        return {
          measurement,
          workerResult,
          workerRequest,
          workerResponse,
          observedChunk,
          requestedChunk,
        }
      }))
      chunks.forEach((chunk, index) => {
        if (index === 0) {
          if (chunk.workerRequest.previousChunkBoundaryInput !== null
            || chunk.workerResponse.previousBoundaryInputEvidence !== null
            || chunk.workerResponse.outputSummary!
              .crossChunkBoundaryMeasurements.length !== 0) {
            throw conflict('chunk_1_unexpected_previous_boundary')
          }
          return
        }
        assertBoundaryLineage(chunks[index - 1], chunk, index)
      })
      const measuredAt = timestamp.parse(now())
      const newestInputTimestamp = Math.max(
        Date.parse(observation.observedAt),
        ...chunks.map((chunk) => Date.parse(chunk.measurement.measuredAt)),
      )
      if (Date.parse(measuredAt) < newestInputTimestamp) {
        throw conflict('temporal_evidence_assembled_before_inputs')
      }
      const orderedChunkMeasurementRefs = chunks.map((chunk) =>
        structuredClone(chunk.requestedChunk.measurementRef))
      const metricSeries = chunks.flatMap((chunk) => {
        const measurementSubjects = new Map(chunk.measurement.subjectEvidence
          .map((subject) => [subject.subjectRequestId, subject]))
        return [...chunk.workerResponse.outputSummary!.temporalMetricSeries]
          .sort((left, right) => compareUtf16(
            left.subjectRequestId,
            right.subjectRequestId,
          ))
          .map((series) => {
            const subject = measurementSubjects.get(series.subjectRequestId)
            if (!subject || subject.subjectEvidenceId !== series.subjectEvidenceId) {
              throw conflict(
                `chunk_${chunk.requestedChunk.chunkOrdinal}_metric_subject_mismatch`,
              )
            }
            return {
              chunkOrdinal: chunk.requestedChunk.chunkOrdinal,
              chunkMeasurementRef: structuredClone(
                chunk.requestedChunk.measurementRef,
              ),
              subjectRequestId: series.subjectRequestId,
              subjectEvidenceId: series.subjectEvidenceId,
              expectedFrameCount: series.expectedFrameCount,
              expectedFramePairCount: series.expectedFramePairCount,
              motionCompensatedBinaryIntersectionOverUnionBasisPoints:
                [...series
                  .centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints],
              meanAbsoluteAlphaDeltaBasisPoints:
                [...series.meanAbsoluteAlphaDeltaBasisPoints],
              boundaryDisagreementBasisPoints:
                [...series.boundaryDisagreementBasisPoints],
              l4TemporalMetricSeriesExecutionEvidenceRef:
                workerResultNumericRef(chunk.workerResult),
              exactOrderedPerFramePairMetricsFromKorniaCuda: true as const,
              exactOrderedPerFrameMetricsFromKorniaCuda: true as const,
              opencvCudaEveryMaskCrosschecked: true as const,
            }
          })
      })
      const metricSeriesSet = sealCanonicalSam31TemporalMetricSeriesSet({
        schemaVersion: 'canonical-sam3_1-temporal-metric-series-set-v1',
        source: 'canonical_independent_sam3_1_l4_temporal_metric_series_worker',
        evidenceClass: 'canonical_private_l4_cuda_metric_series_reread',
        status: 'complete_temporal_metric_series_ready',
        metricSeriesSetId: request.metricSeriesSetId,
        metricSeriesSetVersion: 1,
        qualificationId: request.qualificationId,
        executionGroupObservationRef: request.executionGroupObservationRef,
        exactEightMinuteSourceRef: request.exactEightMinuteSourceRef,
        orderedChunkMeasurementRefs,
        expectedMetricSeriesCount: metricSeries.length,
        metricSeries,
        everyMeasuredChunkSubjectHasExactOrderedMetricSeries: true,
        sampledOrSummaryOnlyMetricsAccepted: false,
        browserOrCallerMetricsAccepted: false,
        rawMaskBytesPathsUrlsOrCredentialsIncluded: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        assetManifestMutated: false,
        renderAuthorized: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        measuredAt,
      })
      const boundaries = chunks.slice(1).map((right, index) => {
        const left = chunks[index]
        const leftSubjects = new Map(left.measurement.subjectEvidence.map(
          (subject) => [subject.subjectRequestId, subject],
        ))
        const rightSubjects = new Map(right.measurement.subjectEvidence.map(
          (subject) => [subject.subjectRequestId, subject],
        ))
        const boundarySubjects = [...right.workerResponse.outputSummary!
          .crossChunkBoundaryMeasurements]
          .sort((a, b) => compareUtf16(a.subjectRequestId, b.subjectRequestId))
          .map((subject) => {
            const leftSubject = leftSubjects.get(subject.subjectRequestId)
            const rightSubject = rightSubjects.get(subject.subjectRequestId)
            if (!leftSubject?.maskSequenceRef || !rightSubject?.maskSequenceRef
              || leftSubject.subjectEvidenceId
                !== subject.previousSubjectEvidenceId
              || rightSubject.subjectEvidenceId
                !== subject.currentSubjectEvidenceId) {
              throw conflict(`boundary_${index + 1}_subject_mismatch`)
            }
            return {
              subjectRequestId: subject.subjectRequestId,
              leftSubjectEvidenceId: subject.previousSubjectEvidenceId,
              rightSubjectEvidenceId: subject.currentSubjectEvidenceId,
              leftMaskArtifactRef: structuredClone(leftSubject.maskSequenceRef),
              rightMaskArtifactRef:
                structuredClone(rightSubject.maskSequenceRef),
              minimumOverlapBinaryIntersectionOverUnionBasisPoints:
                subject
                  .centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints,
              maximumOverlapAlphaDeltaBasisPoints:
                subject.meanAbsoluteAlphaDeltaBasisPoints,
              maximumOverlapBoundaryDisagreementBasisPoints:
                subject.boundaryDisagreementBasisPoints,
              identitySwitchCount: subject.identitySwitchCount,
              objectDropoutCount: subject.objectDropoutCount,
              everyOverlapMaskPairMeasured: true as const,
            }
          })
        return {
          boundaryOrdinal: index + 1,
          leftChunkOrdinal: left.requestedChunk.chunkOrdinal,
          rightChunkOrdinal: right.requestedChunk.chunkOrdinal,
          leftChunkMeasurementRef:
            structuredClone(left.requestedChunk.measurementRef),
          rightChunkMeasurementRef:
            structuredClone(right.requestedChunk.measurementRef),
          overlapStartFrameInclusive:
            right.observedChunk.canonicalStartFrameInclusive,
          overlapEndFrameExclusive:
            right.observedChunk.canonicalStartFrameInclusive + 1,
          overlapFrameCount: 1 as const,
          subjectMeasurements: boundarySubjects,
          l4BoundaryQaExecutionEvidenceRef:
            workerResultNumericRef(right.workerResult),
          l4TerminalUsageAndCostReceiptRef:
            domainToNumericRef(
              right.measurement.l4QaExecution.attemptCostReceiptRef,
            ),
          actualL4KorniaCudaAndOpenCvBoundaryQaObserved: true as const,
          cpuOnlySubstantiveBoundaryQaUsed: false as const,
          terminalWorkerStoppedAndScaleBackToZeroVerified: true as const,
          exactAccountEffectiveAttemptCostPersisted: true as const,
        }
      })
      const boundarySet = sealCanonicalSam31CrossChunkBoundaryMeasurementSet({
        schemaVersion:
          'canonical-sam3_1-cross-chunk-boundary-measurement-set-v1',
        source:
          'canonical_independent_sam3_1_l4_cross_chunk_boundary_qa_worker',
        evidenceClass: 'canonical_private_l4_cuda_boundary_qa_reread',
        status: 'complete_cross_chunk_boundary_measurements_ready',
        boundarySetId: request.boundarySetId,
        boundarySetVersion: 1,
        qualificationId: request.qualificationId,
        executionGroupObservationRef: request.executionGroupObservationRef,
        exactEightMinuteSourceRef: request.exactEightMinuteSourceRef,
        orderedChunkMeasurementRefs,
        expectedBoundaryCount: boundaries.length,
        boundaries,
        everyAdjacentChunkBoundaryAndSubjectMeasured: true,
        sampledOrRepresentativeOnlyMeasurementAccepted: false,
        browserOrCallerMetricsAccepted: false,
        rawMaskBytesPathsUrlsOrCredentialsIncluded: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        assetManifestMutated: false,
        renderAuthorized: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        measuredAt,
      })
      const [metricSeriesSetRef, boundarySetRef] = await Promise.all([
        input.temporalMetricSeriesSetRepository
          .persistMetricSeriesSetCreateOnly({ metricSeriesSet }),
        input.boundaryMeasurementSetRepository
          .persistBoundaryMeasurementSetCreateOnly({ boundarySet }),
      ])
      if (!sameNumericRef(metricSeriesSetRef,
        canonicalSam31TemporalMetricSeriesSetRef(metricSeriesSet))
        || !sameNumericRef(boundarySetRef,
          canonicalSam31CrossChunkBoundaryMeasurementSetRef(boundarySet))) {
        throw conflict('temporal_evidence_persistence_reference_mismatch')
      }
      return Object.freeze({
        metricSeriesSetRef,
        boundarySetRef,
        orderedChunkMeasurementRefs,
        metricSeriesCount: metricSeries.length,
        boundaryCount: boundaries.length,
        exactWorkerEvidenceReread: true as const,
        callerMetricsOrCompletionClaimsAccepted: false as const,
      })
    },
  })
}

type ChunkBundle = {
  readonly measurement: ReturnType<
    typeof parseCanonicalTrackAllSam31L4MaskQaMeasurement
  >
  readonly workerResult: ReturnType<
    typeof parseCanonicalTrackAllSam31L4MaskQaWorkerResult
  > & { readonly schemaVersion:
      typeof CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_WORKER_EVIDENCE_RESULT_V3_VERSION }
  readonly workerRequest: ReturnType<
    typeof assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3
  >
  readonly workerResponse: ReturnType<
    typeof assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3
  >
  readonly observedChunk: ReturnType<
    typeof assertCanonicalSam31GpuCompleteSourceExecutionObservation
  >['chunks'][number]
  readonly requestedChunk: z.infer<typeof chunkInputSchema>
}

function assertChunkLineage(input: {
  readonly index: number
  readonly requestedChunk: z.infer<typeof chunkInputSchema>
  readonly observedChunk: ChunkBundle['observedChunk']
  readonly measurement: ChunkBundle['measurement']
  readonly workerResult: ChunkBundle['workerResult']
  readonly workerRequest: ChunkBundle['workerRequest']
  readonly workerResponse: ChunkBundle['workerResponse']
  readonly exactEightMinuteSourceRef: z.infer<typeof numericRefSchema>
}): void {
  const { index, requestedChunk, observedChunk, measurement, workerResult,
    workerRequest, workerResponse } = input
  const expectedRange = {
    startFrame: observedChunk.canonicalStartFrameInclusive,
    endFrameExclusive: observedChunk.canonicalEndFrameInclusive + 1,
  }
  if (requestedChunk.chunkOrdinal !== index + 1
    || observedChunk.chunkOrdinal !== requestedChunk.chunkOrdinal
    || !sameDomainRef(measurementRef(measurement),
      requestedChunk.measurementRef)
    || !sameDomainRef(workerResultRef(workerResult),
      requestedChunk.workerResultRef)
    || measurement.invocationId !== observedChunk.invocationId
    || workerRequest.sam31InvocationId !== observedChunk.invocationId
    || workerRequest.chunkOrdinal !== requestedChunk.chunkOrdinal
    || workerResponse.chunkOrdinal !== requestedChunk.chunkOrdinal
    || workerResponse.status !== 'completed'
    || workerResponse.requestBindingSha256
      !== workerRequest.requestBindingSha256
    || workerResponse.sam31InvocationId !== workerRequest.sam31InvocationId
    || workerResponse.l4InvocationId !== workerRequest.l4InvocationId
    || workerResult.sam31InvocationId !== workerRequest.sam31InvocationId
    || workerResult.l4InvocationId !== workerRequest.l4InvocationId
    || !sameDomainToNumericRef(measurement.sam31TaskRef,
      observedChunk.taskRef)
    || !sameDomainToNumericRef(measurement.sam31RuntimeResultAdmissionRef,
      observedChunk.resultAdmissionRef)
    || !sameNumericRef(workerRequest.sam31TaskRef, observedChunk.taskRef)
    || !sameNumericRef(workerRequest.sam31RuntimeResultAdmissionRef,
      observedChunk.resultAdmissionRef)
    || !sameDomainToNumericRef(measurement.sourceFrameMappingRef,
      workerRequest.sourceFrameMappingRef)
    || !sameDomainToNumericRef(measurement.confirmedOutputFrameRef,
      workerRequest.confirmedOutputFrameRef)
    || measurement.requestedRange.startFrame !== expectedRange.startFrame
    || measurement.requestedRange.endFrameExclusive
      !== expectedRange.endFrameExclusive
    || workerRequest.canonicalStartFrameInclusive !== expectedRange.startFrame
    || workerRequest.canonicalEndFrameInclusive
      !== expectedRange.endFrameExclusive - 1
    || !sameDomainToNumericRef(measurement.sourcePrivateArtifactRef,
      input.exactEightMinuteSourceRef)
    || measurement.canonicalScope.authorizedFrameRanges.length !== 1
    || stableAuthorityStringify(
      measurement.canonicalScope.authorizedFrameRanges[0],
    ) !== stableAuthorityStringify(expectedRange)
    || workerRequest.subjects.length !== measurement.subjectEvidence.length
    || workerResponse.outputSummary === null
    || workerResponse.outputSummary.subjectMeasurements.length
      !== measurement.subjectEvidence.length
    || workerResponse.outputSummary.temporalMetricSeries.length
      !== measurement.subjectEvidence.length
    || measurement.l4QaExecution.cpuOnlySubstantiveMaskQaUsed
    || !measurement.l4QaExecution
      .terminalWorkerStoppedAndScaleBackToZeroVerified
    || !measurement.l4QaExecution.exactAccountEffectiveAttemptCostPersisted) {
    throw conflict(`chunk_${index + 1}_worker_measurement_lineage_mismatch`)
  }
}

function assertBoundaryLineage(
  left: ChunkBundle,
  right: ChunkBundle,
  zeroBasedBoundaryIndex: number,
): void {
  const boundary = right.workerRequest.previousChunkBoundaryInput
  const evidence = right.workerResponse.previousBoundaryInputEvidence
  const commonIds = left.measurement.subjectEvidence
    .map((subject) => subject.subjectRequestId)
    .filter((id) => right.measurement.subjectEvidence.some((subject) =>
      subject.subjectRequestId === id))
    .sort(compareUtf16)
  const requestedIds = boundary?.subjects.map((subject) =>
    subject.subjectRequestId).sort(compareUtf16) ?? []
  const measuredIds = right.workerResponse.outputSummary!
    .crossChunkBoundaryMeasurements.map((subject) => subject.subjectRequestId)
    .sort(compareUtf16)
  if (!boundary || !evidence
    || boundary.previousChunkOrdinal !== left.workerRequest.chunkOrdinal
    || boundary.previousSam31InvocationId
      !== left.workerRequest.sam31InvocationId
    || boundary.previousSam31RuntimeRequestBindingSha256
      !== left.workerRequest.sam31RuntimeRequestBindingSha256
    || !sameNumericRef(boundary.previousSam31RuntimeResultAdmissionRef,
      left.workerRequest.sam31RuntimeResultAdmissionRef)
    || !sameNumericRef(boundary.previousSam31MaskManifestRef,
      left.workerRequest.sam31MaskManifestRef)
    || !sameNumericRef(boundary.previousSourceFrameMappingRef,
      left.workerRequest.sourceFrameMappingRef)
    || !sameNumericRef(boundary.previousConfirmedOutputFrameRef,
      left.workerRequest.confirmedOutputFrameRef)
    || boundary.previousCanonicalStartFrameInclusive
      !== left.workerRequest.canonicalStartFrameInclusive
    || boundary.previousCanonicalEndFrameInclusive
      !== left.workerRequest.canonicalEndFrameInclusive
    || right.workerRequest.canonicalStartFrameInclusive
      !== left.workerRequest.canonicalEndFrameInclusive
    || stableAuthorityStringify(commonIds)
      !== stableAuthorityStringify(requestedIds)
    || stableAuthorityStringify(commonIds)
      !== stableAuthorityStringify(measuredIds)
    || !evidence.everyRequiredPreviousBoundaryMaskRereadAndHashed
    || right.workerResponse.outputSummary!.crossChunkBoundaryMeasurements
      .some((measured) => {
        const requested = boundary.subjects.find((subject) =>
          subject.subjectRequestId === measured.subjectRequestId)
        return !requested
          || requested.previousSubjectEvidenceId
            !== measured.previousSubjectEvidenceId
          || requested.currentSubjectEvidenceId
            !== measured.currentSubjectEvidenceId
          || requested.previousMaskObjectId !== measured.previousMaskObjectId
          || requested.currentMaskObjectId !== measured.currentMaskObjectId
          || boundary.previousMaskFrameIndex !== measured.previousMaskFrameIndex
          || boundary.currentMaskFrameIndex !== measured.currentMaskFrameIndex
      })) {
    throw conflict(
      `boundary_${zeroBasedBoundaryIndex}_previous_chunk_lineage_mismatch`,
    )
  }
}

function measurementRef(
  value: ChunkBundle['measurement'],
): CaptionDomainRef {
  return {
    id: value.measurementId,
    version: value.schemaVersion,
    contentHash: value.measurementDigestSha256,
  }
}

function workerResultRef(
  value: ChunkBundle['workerResult'],
): CaptionDomainRef {
  return {
    id: value.workerResultId,
    version: value.schemaVersion,
    contentHash: value.workerResultDigestSha256,
  }
}

function workerResultNumericRef(value: ChunkBundle['workerResult']) {
  return domainToNumericRef(workerResultRef(value))
}

function domainToNumericRef(value: CaptionDomainRef) {
  return numericRefSchema.parse({
    id: value.id,
    version: 1,
    contentHash: `sha256:${value.contentHash}`,
  })
}

function sameNumericRef(
  left: z.infer<typeof numericRefSchema>,
  right: z.infer<typeof numericRefSchema>,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameDomainRef(left: CaptionDomainRef, right: CaptionDomainRef) {
  return domainRefKey(left) === domainRefKey(right)
}

function sameDomainToNumericRef(
  domain: CaptionDomainRef,
  numeric: z.infer<typeof numericRefSchema>,
) {
  return domain.id === numeric.id
    && domain.contentHash === numeric.contentHash.slice(7)
}

function domainRefKey(value: CaptionDomainRef) {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function conflict(code: string): Error {
  return Object.assign(new Error(code), { code })
}

function assertPorts(input: {
  readonly completeSourceReadPort: Pick<
    CanonicalSam31GpuCompleteSourceEvidenceReadPort,
    'rereadExecutionGroupObservation'
  >
  readonly taskQaRepository: Pick<
    CanonicalTrackAllSam31TaskQaRepository,
    'rereadMeasurement'
  >
  readonly taskQaCandidateRepository: Pick<
    CanonicalTrackAllSam31TaskQaCandidateRepository,
    'rereadWorkerResult'
  >
  readonly boundaryMeasurementSetRepository:
    CanonicalSam31CrossChunkBoundaryMeasurementSetRepository
  readonly temporalMetricSeriesSetRepository:
    CanonicalSam31TemporalMetricSeriesSetRepository
}): void {
  if (typeof input.completeSourceReadPort?.rereadExecutionGroupObservation
      !== 'function'
    || typeof input.taskQaRepository?.rereadMeasurement !== 'function'
    || typeof input.taskQaCandidateRepository?.rereadWorkerResult !== 'function'
    || typeof input.boundaryMeasurementSetRepository
      ?.persistBoundaryMeasurementSetCreateOnly !== 'function'
    || typeof input.temporalMetricSeriesSetRepository
      ?.persistMetricSeriesSetCreateOnly !== 'function') {
    throw new TypeError('SAM 3.1 temporal evidence ports are incomplete.')
  }
}
