import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31GpuCompleteSourcePerformanceEvidence,
  canonicalSam31GpuCompleteSourceExecutionObservationRef,
  canonicalSam31GpuCompleteSourcePerformanceEvidenceRef,
  canonicalSam31GpuCompleteSourceStitchEvidenceRef,
  sealCanonicalSam31GpuCompleteSourceExecutionObservation,
  sealCanonicalSam31GpuCompleteSourceStitchEvidence,
} from '../services/canonical-sam3_1-gpu-complete-source-performance-owner'
import {
  assertCanonicalSam31TemporalCoverageManifest,
  canonicalSam31CrossChunkBoundaryMeasurementSetRef,
  canonicalSam31TemporalCoverageManifestRef,
  canonicalSam31TemporalMetricSeriesSetRef,
  createCanonicalSam31CrossChunkBoundaryMeasurementSetRepository,
  createCanonicalSam31GpuTemporalMeasurementCompiler,
  createCanonicalSam31TemporalCoverageManifestRepository,
  createCanonicalSam31TemporalMetricSeriesSetRepository,
  sealCanonicalSam31CrossChunkBoundaryMeasurementSet,
  sealCanonicalSam31TemporalCoverageManifest,
  sealCanonicalSam31TemporalMetricSeriesSet,
} from '../services/canonical-sam3_1-gpu-temporal-measurement-compiler'
import {
  createCanonicalSam31TemporalMeasurementSetRepository,
} from '../services/canonical-sam3_1-gpu-temporal-quality-qualification-owner'
import {
  sealCanonicalTrackAllSam31L4MaskQaMeasurement,
} from '../services/canonical-track-all-sam3_1-task-qa-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

type NumericRef = { id: string; version: 1; contentHash: `sha256:${string}` }
type DomainRef = { id: string; version: string; contentHash: string }

const route = {
  routeId: 'l4_heavy_fallback',
  gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
  runtimeRegion: 'us-central1',
  executionTarget: 'google_cloud_run_l4_job',
  machineType: 'cloud_run_nvidia_l4',
  accelerator: 'nvidia_l4',
} as const
const sourceRef = numericRef('sam31-eight-minute-source')
const chunkPlanRef = numericRef('sam31-eight-minute-overlap-chunk-plan')
const qualificationId = 'sam31-l4-full-source-temporal-qualification'
const imageDigest = `sha256:${digest('sam31-l4-qualified-image')}` as const
const chunks = Array.from({ length: 49 }, (_, index) => {
  const start = index === 0 ? 0 : index * 239
  const end = index === 48 ? 11_519 : start + 239
  return {
    chunkOrdinal: index + 1,
    invocationId: `sam31-l4-full-source-chunk-${index + 1}`,
    canonicalStartFrameInclusive: start,
    canonicalEndFrameInclusive: end,
    overlapWithPreviousFrames: index === 0 ? 0 : 1,
    taskRef: numericRef(`sam31-task-${index + 1}`),
    launchRef: numericRef(`sam31-launch-${index + 1}`),
    resultAdmissionRef: numericRef(`sam31-result-${index + 1}`),
    runtimeResponseObjectRef: numericRef(`sam31-response-${index + 1}`),
  }
})
const observation = sealCanonicalSam31GpuCompleteSourceExecutionObservation({
  schemaVersion: 'canonical-sam3_1-gpu-complete-source-execution-observation-v1',
  source: 'canonical_sam3_1_gpu_complete_source_execution_telemetry_owner',
  evidenceClass: 'canonical_private_reread',
  status: 'complete_source_execution_observed',
  executionGroupId: 'sam31-l4-full-source-execution-group',
  executionGroupVersion: 1,
  qualificationId,
  runOrdinal: 1,
  exactEightMinuteSourceRef: sourceRef,
  sourceDurationMilliseconds: 480_000,
  sourceWidth: 1_920,
  sourceHeight: 1_080,
  sourceFrameCount: 11_520,
  fpsNumerator: 24,
  fpsDenominator: 1,
  chunkPlanRef,
  route,
  immutableImageDigest: imageDigest,
  chunks,
  phaseObservationRefs: {
    userTriggeredExecutionGroupRef: numericRef('user-triggered-group'),
    cloudProvisioningObservationSetRef: numericRef('cloud-provisioning'),
    workerPhaseTelemetrySetRef: numericRef('worker-phase-telemetry'),
    terminalCapacityObservationSetRef: numericRef('terminal-capacity'),
    accountEffectiveCostReceiptSetRef: numericRef('attempt-cost-set'),
  },
  phaseTiming: {
    wallTimeMilliseconds: 470_000,
    coldStartAndImagePullMilliseconds: 60_000,
    modelLoadMilliseconds: 70_000,
    decodePromptPropagationAndStitchMilliseconds: 320_000,
    outputPersistenceAndExactRereadMilliseconds: 20_000,
  },
  exactCloudJobWorkerAndPhaseTimestampsReread: true,
  everyChunkTerminalAndAccountEffectiveCostReread: true,
  allGpuCapacityStoppedAfterTerminal: true,
  maximumActiveGpuJobsAfterTerminal: 0,
  callerTimingOrCompletionClaimsAccepted: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  observedAt: '2026-08-13T10:00:00.000Z',
})
const observationRef =
  canonicalSam31GpuCompleteSourceExecutionObservationRef(observation)
const stitchedDigest = digest('sam31-l4-full-source-stitched-masks')
const stitch = sealCanonicalSam31GpuCompleteSourceStitchEvidence({
  schemaVersion: 'canonical-sam3_1-gpu-complete-source-stitch-evidence-v1',
  source: 'canonical_track_all_sam3_1_mask_stitch_owner',
  evidenceClass: 'canonical_private_reread',
  status: 'complete_source_stitch_evidence_ready',
  stitchEvidenceId: 'sam31-l4-full-source-stitch',
  stitchEvidenceVersion: 1,
  executionGroupRef: observationRef,
  exactEightMinuteSourceRef: sourceRef,
  chunkPlanRef,
  orderedChunkResultRefs: chunks.map((chunk) => chunk.resultAdmissionRef),
  stitchedMaskSequenceRef: {
    id: 'sam31-l4-full-source-stitched-mask-sequence',
    version: 1,
    contentHash: `sha256:${stitchedDigest}`,
  },
  stitchedOutputMaskSetDigestSha256: stitchedDigest,
  sourceWidth: 1_920,
  sourceHeight: 1_080,
  sourceFrameCount: 11_520,
  firstFrameIndex: 0,
  lastFrameIndex: 11_519,
  everyExpectedFrameAndObjectPresent: true,
  completeIntervalNoGapCoverageVerified: true,
  deterministicOverlapReconciliationVerified: true,
  everyMaskMatchesSourceGeometry: true,
  sourceResolutionPreserved: true,
  quantizationOrDownscaleUsed: false,
  exactStitchedManifestAndEveryMaskByteReread: true,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
  assetManifestMutated: false,
  qaApprovalGranted: false,
  customerCreditsMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  stitchedAt: '2026-08-13T10:00:30.000Z',
})
const stitchRef = canonicalSam31GpuCompleteSourceStitchEvidenceRef(stitch)
const performancePayload = {
  schemaVersion:
    'canonical-sam3_1-gpu-complete-source-performance-evidence-v1' as const,
  source: 'canonical_sam3_1_gpu_complete_source_performance_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  status: 'complete_source_performance_evidence_ready' as const,
  performanceEvidenceId: 'sam31-l4-full-source-performance',
  performanceEvidenceVersion: 1 as const,
  qualificationId,
  runOrdinal: 1,
  route,
  immutableImageDigest: imageDigest,
  fullSourceExecutionRef: observationRef,
  completeChunkResultSetRef: numericRef('complete-chunk-result-set'),
  terminalUsageAndCostReceiptSetRef: numericRef('terminal-cost-set'),
  exactEightMinuteSourceRef: sourceRef,
  sourceDurationMilliseconds: 480_000 as const,
  sourceWidth: 1_920,
  sourceHeight: 1_080,
  sourceFrameCount: 11_520,
  fpsNumerator: 24,
  fpsDenominator: 1,
  chunkPlanRef,
  chunkCount: 49,
  stitchedMaskSequenceRef: stitch.stitchedMaskSequenceRef,
  stitchedOutputMaskSetDigestSha256: stitchedDigest,
  phaseTiming: observation.phaseTiming,
  sourceResolutionAndCompleteFrameRangePreserved: true as const,
  everyChunkTaskResponseResultAndTerminalCostReread: true as const,
  exactStitchedManifestAndEveryMaskByteReread: true as const,
  allGpuCapacityStoppedAfterTerminal: true as const,
  automaticQualityReductionAllowed: false as const,
  callerPerformanceClaimsAccepted: false as const,
  customerCreditsMutated: false as const,
  qaApprovalGranted: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  verifiedAt: '2026-08-13T10:01:00.000Z',
}
const performance = assertCanonicalSam31GpuCompleteSourcePerformanceEvidence({
  ...performancePayload,
  evidenceHash: sha256AuthorityValue(performancePayload),
})
const manifest = sealCanonicalSam31TemporalCoverageManifest({
  schemaVersion: 'canonical-sam3_1-temporal-coverage-manifest-v1',
  source: 'canonical_track_all_sam3_1_expected_coverage_owner',
  evidenceClass: 'canonical_approved_complete_source_scope',
  status: 'expected_temporal_coverage_ready',
  manifestId: 'sam31-l4-full-source-expected-coverage',
  manifestVersion: 1,
  exactEightMinuteSourceRef: sourceRef,
  sourceWidth: 1_920,
  sourceHeight: 1_080,
  sourceFrameCount: 11_520,
  fpsNumerator: 24,
  fpsDenominator: 1,
  expectedSequenceCount: 1,
  sequences: [{
    sequenceOrdinal: 1,
    sequenceId: 'primary-subject-sequence',
    expectedObjectId: 'primary-subject',
    subjectRequestId: 'track-primary-subject',
    firstExpectedFrameIndex: 0,
    lastExpectedFrameIndex: 11_519,
    expectedFrameCount: 11_520,
  }],
  everyApprovedObjectIntervalEnumerated: true,
  expectedIntervalsCoverCompleteSource: true,
  browserOrCallerScopeAccepted: false,
  runtimeDispatched: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  assetManifestMutated: false,
  renderAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  createdAt: '2026-08-13T09:00:00.000Z',
})
const measurements = chunks.map((chunk) => measurement(chunk))
const measurementRefs = measurements.map(measurementRef)
const boundarySet = sealCanonicalSam31CrossChunkBoundaryMeasurementSet({
  schemaVersion: 'canonical-sam3_1-cross-chunk-boundary-measurement-set-v1',
  source: 'canonical_independent_sam3_1_l4_cross_chunk_boundary_qa_worker',
  evidenceClass: 'canonical_private_l4_cuda_boundary_qa_reread',
  status: 'complete_cross_chunk_boundary_measurements_ready',
  boundarySetId: 'sam31-l4-full-source-cross-chunk-boundaries',
  boundarySetVersion: 1,
  qualificationId,
  executionGroupObservationRef: observationRef,
  exactEightMinuteSourceRef: sourceRef,
  orderedChunkMeasurementRefs: measurementRefs,
  expectedBoundaryCount: 48,
  boundaries: Array.from({ length: 48 }, (_, index) => ({
    boundaryOrdinal: index + 1,
    leftChunkOrdinal: index + 1,
    rightChunkOrdinal: index + 2,
    leftChunkMeasurementRef: measurementRefs[index],
    rightChunkMeasurementRef: measurementRefs[index + 1],
    overlapStartFrameInclusive: chunks[index + 1].canonicalStartFrameInclusive,
    overlapEndFrameExclusive: chunks[index].canonicalEndFrameInclusive + 1,
    overlapFrameCount: 1,
    subjectMeasurements: [{
      subjectRequestId: 'track-primary-subject',
      leftSubjectEvidenceId: `primary-subject-${index + 1}`,
      rightSubjectEvidenceId: `primary-subject-${index + 2}`,
      leftMaskArtifactRef: domainRef(`mask-sequence-${index + 1}`),
      rightMaskArtifactRef: domainRef(`mask-sequence-${index + 2}`),
      minimumOverlapBinaryIntersectionOverUnionBasisPoints: 9_300,
      maximumOverlapAlphaDeltaBasisPoints: 300,
      maximumOverlapBoundaryDisagreementBasisPoints: 300,
      identitySwitchCount: 0,
      objectDropoutCount: 0,
      everyOverlapMaskPairMeasured: true,
    }],
    l4BoundaryQaExecutionEvidenceRef:
      numericRef(`l4-boundary-qa-${index + 1}`),
    l4TerminalUsageAndCostReceiptRef:
      numericRef(`l4-boundary-cost-${index + 1}`),
    actualL4KorniaCudaAndOpenCvBoundaryQaObserved: true,
    cpuOnlySubstantiveBoundaryQaUsed: false,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true,
    exactAccountEffectiveAttemptCostPersisted: true,
  })),
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
  measuredAt: '2026-08-13T10:01:45.000Z',
})
const metricSeriesSet = sealCanonicalSam31TemporalMetricSeriesSet({
  schemaVersion: 'canonical-sam3_1-temporal-metric-series-set-v1',
  source: 'canonical_independent_sam3_1_l4_temporal_metric_series_worker',
  evidenceClass: 'canonical_private_l4_cuda_metric_series_reread',
  status: 'complete_temporal_metric_series_ready',
  metricSeriesSetId: 'sam31-l4-full-source-temporal-metric-series',
  metricSeriesSetVersion: 1,
  qualificationId,
  executionGroupObservationRef: observationRef,
  exactEightMinuteSourceRef: sourceRef,
  orderedChunkMeasurementRefs: measurementRefs,
  expectedMetricSeriesCount: measurements.length,
  metricSeries: measurements.map((value, index) => {
    const frameCount = value.requestedRange.endFrameExclusive
      - value.requestedRange.startFrame
    return {
      chunkOrdinal: index + 1,
      chunkMeasurementRef: measurementRefs[index],
      subjectRequestId: 'track-primary-subject',
      subjectEvidenceId: `primary-subject-${index + 1}`,
      expectedFrameCount: frameCount,
      expectedFramePairCount: frameCount - 1,
      motionCompensatedBinaryIntersectionOverUnionBasisPoints:
        Array.from({ length: frameCount - 1 }, () => 9_200),
      meanAbsoluteAlphaDeltaBasisPoints:
        Array.from({ length: frameCount - 1 }, () => 500),
      boundaryDisagreementBasisPoints:
        Array.from({ length: frameCount }, () => 400),
      exactOrderedPerFramePairMetricsFromKorniaCuda: true,
      exactOrderedPerFrameMetricsFromKorniaCuda: true,
      opencvCudaEveryMaskCrosschecked: true,
    }
  }),
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
  measuredAt: '2026-08-13T10:01:50.000Z',
})

const storage = new Map<string, Buffer>()
const objectPort = memoryObjectPort(storage)
const coverageRepository =
  createCanonicalSam31TemporalCoverageManifestRepository({ objectPort })
await coverageRepository.persistManifestCreateOnly({ manifest })
const measurementSetRepository =
  createCanonicalSam31TemporalMeasurementSetRepository({ objectPort })
const boundaryRepository =
  createCanonicalSam31CrossChunkBoundaryMeasurementSetRepository({ objectPort })
await boundaryRepository.persistBoundaryMeasurementSetCreateOnly({
  boundarySet,
})
const metricSeriesRepository =
  createCanonicalSam31TemporalMetricSeriesSetRepository({ objectPort })
await metricSeriesRepository.persistMetricSeriesSetCreateOnly({
  metricSeriesSet,
})
const measurementByRef = new Map(measurements.map((value) => [
  domainRefKey(measurementRef(value)), value,
]))
const compiler = createCanonicalSam31GpuTemporalMeasurementCompiler({
  performanceRepository: {
    rereadPerformanceEvidence: async ({ evidenceRef }) =>
      sameNumericRef(evidenceRef,
        canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(performance))
        ? performance : null,
  },
  completeSourceReadPort: {
    rereadExecutionGroupObservation: async ({
      executionGroupObservationRef,
    }) => sameNumericRef(executionGroupObservationRef, observationRef)
      ? observation : null,
    rereadStitchEvidence: async ({ stitchEvidenceRef }) =>
      sameNumericRef(stitchEvidenceRef, stitchRef) ? stitch : null,
  },
  taskQaRepository: {
    rereadMeasurement: async ({ measurementRef: reference }) =>
      measurementByRef.get(domainRefKey(reference)) ?? null,
  },
  coverageManifestRepository: coverageRepository,
  boundaryMeasurementSetRepository: boundaryRepository,
  temporalMetricSeriesSetRepository: metricSeriesRepository,
  measurementSetRepository,
  now: () => '2026-08-13T10:02:00.000Z',
})
const request = {
  measurementSetId: 'sam31-l4-full-source-temporal-measurements',
  qualificationId,
  completeSourcePerformanceEvidenceRef:
    canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(performance),
  executionGroupObservationRef: observationRef,
  stitchEvidenceRef: stitchRef,
  expectedObjectCoverageManifestRef:
    canonicalSam31TemporalCoverageManifestRef(manifest),
  crossChunkBoundaryMeasurementSetRef:
    canonicalSam31CrossChunkBoundaryMeasurementSetRef(boundarySet),
  temporalMetricSeriesSetRef:
    canonicalSam31TemporalMetricSeriesSetRef(metricSeriesSet),
  orderedChunkMeasurementRefs: measurementRefs,
  callerMetricsOrCompletionClaimsAccepted: false,
} as const
const result = await compiler.compileAndPersistMeasurementSet(request)
assert.equal(result.sourceFrameCount, 11_520)
assert.equal(result.sequences.length, 1)
assert.equal(result.sequences[0].measuredFrameCount, 11_520)
assert.equal(result.sequences[0].p05MotionCompensatedBinaryIntersectionOverUnion,
  0.92)
assert.equal(result.sequences[0].p95MeanAbsoluteAlphaDelta, 0.05)
assert.equal(result.sequences[0].identitySwitchCount, 0)
assert.equal(result.callerMeasurementsReviewOrComparisonClaimsAccepted,
  undefined)
assert.deepEqual(await compiler.compileAndPersistMeasurementSet(request), result)

await assert.rejects(() => compiler.compileAndPersistMeasurementSet({
  ...request,
  callerMetricsOrCompletionClaimsAccepted: true,
}))
await assert.rejects(() => compiler.compileAndPersistMeasurementSet({
  ...request,
  orderedChunkMeasurementRefs: measurementRefs.slice(0, -1),
}))
await assert.rejects(() => compiler.compileAndPersistMeasurementSet({
  ...request,
  orderedChunkMeasurementRefs: [measurementRefs[1], measurementRefs[0],
    ...measurementRefs.slice(2)],
}))
await assert.rejects(() => compiler.compileAndPersistMeasurementSet({
  ...request,
  orderedChunkMeasurementRefs: [measurementRefs[0], measurementRefs[0],
    ...measurementRefs.slice(2)],
}))

const inconsistentMetricSeriesSet = sealCanonicalSam31TemporalMetricSeriesSet({
  ...without(metricSeriesSet, 'metricSeriesSetHash'),
  metricSeriesSetId: 'sam31-l4-inconsistent-temporal-metric-series',
  metricSeries: metricSeriesSet.metricSeries.map((series, index) => index === 0
    ? {
      ...series,
      motionCompensatedBinaryIntersectionOverUnionBasisPoints:
        series.motionCompensatedBinaryIntersectionOverUnionBasisPoints.map(
          (value, valueIndex) => valueIndex === 0 ? 8_900 : value,
        ),
    } : series),
})
await metricSeriesRepository.persistMetricSeriesSetCreateOnly({
  metricSeriesSet: inconsistentMetricSeriesSet,
})
await assert.rejects(() => compiler.compileAndPersistMeasurementSet({
  ...request,
  temporalMetricSeriesSetRef:
    canonicalSam31TemporalMetricSeriesSetRef(inconsistentMetricSeriesSet),
}))

const weak = structuredClone(measurements[10])
weak.subjectEvidence[0].temporalQa.identitySwapCount = 1
weak.measurementDigestSha256 = digestWithout(weak, 'measurementDigestSha256')
measurementByRef.set(domainRefKey(measurementRef(weak)), weak)
const weakRefs = [...measurementRefs]
weakRefs[10] = measurementRef(weak)
await assert.rejects(() => compiler.compileAndPersistMeasurementSet({
  ...request,
  orderedChunkMeasurementRefs: weakRefs,
}))

assert.throws(() => sealCanonicalSam31TemporalCoverageManifest({
  ...without(manifest, 'manifestHash'),
  manifestId: 'incomplete-source-coverage',
  sequences: [{
    ...manifest.sequences[0],
    lastExpectedFrameIndex: 10_000,
    expectedFrameCount: 10_001,
  }],
}))
const tampered = structuredClone(manifest)
tampered.sequences[0].expectedObjectId = 'tampered-object'
assert.throws(() => assertCanonicalSam31TemporalCoverageManifest(tampered))
let getterInvoked = false
const accessor = Object.defineProperty({}, 'measurementSetId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return request.measurementSetId
  },
})
await assert.rejects(() => compiler.compileAndPersistMeasurementSet(accessor))
assert.equal(getterInvoked, false)
const cyclic: Record<string, unknown> = { ...request }
cyclic.self = cyclic
await assert.rejects(() => compiler.compileAndPersistMeasurementSet(cyclic))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-temporal-measurement-compiler',
  checks: 25,
  exactEightMinuteSourceFrames: 11_520,
  orderedOverlappingChunks: 49,
  everyChunkMeasurementReread: true,
  everyChunkBoundaryContinuityMeasured: true,
  exactOrderedMetricSeriesReread: true,
  callerMetricsAccepted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function measurement(chunk: typeof chunks[number]) {
  const range = {
    startFrame: chunk.canonicalStartFrameInclusive,
    endFrameExclusive: chunk.canonicalEndFrameInclusive + 1,
  }
  const outputFrameRef = domainRef('confirmed-output-frame')
  const maskRef = domainRef(`mask-sequence-${chunk.chunkOrdinal}`)
  const korniaRef = domainRef(`kornia-${chunk.chunkOrdinal}`)
  const opencvRef = domainRef(`opencv-${chunk.chunkOrdinal}`)
  return sealCanonicalTrackAllSam31L4MaskQaMeasurement({
    schemaVersion: 'canonical-track-all-sam3_1-l4-mask-qa-measurement-v1',
    measurementId: `l4-mask-qa-measurement-${chunk.chunkOrdinal}`,
    invocationId: chunk.invocationId,
    sam31TaskRef: domainFromNumeric(chunk.taskRef,
      'canonical-sam3_1-gpu-task-v1'),
    sam31RuntimeResultAdmissionRef: domainFromNumeric(
      chunk.resultAdmissionRef,
      'canonical-sam3_1-gpu-runtime-result-admission-v1',
    ),
    canonicalScope: {
      ownerUserId: 'owner-user',
      workspaceId: 'workspace',
      projectId: 'project',
      editSessionId: 'edit-session',
      planVersionId: 'plan-version',
      approvedSnapshotRef: domainRef('approved-snapshot'),
      outputId: 'output-main',
      sceneId: `scene-${chunk.chunkOrdinal}`,
      authorizedFrameRanges: [range],
    },
    sourcePrivateArtifactRef: domainFromNumeric(sourceRef, 'source-v1'),
    sourceFrameMappingRef: domainRef(`source-frame-map-${chunk.chunkOrdinal}`),
    confirmedOutputFrameRef: outputFrameRef,
    requestedRange: range,
    subjectEvidence: [{
      subjectRequestId: 'track-primary-subject',
      subjectEvidenceId: `primary-subject-${chunk.chunkOrdinal}`,
      subjectRole: 'primary_speaker',
      frameRange: range,
      maskSequenceRef: maskRef,
      trackManifestRef: domainRef(`track-manifest-${chunk.chunkOrdinal}`),
      anchorManifestRef: domainRef(`anchor-manifest-${chunk.chunkOrdinal}`),
      sourceFrameMappingRef: domainRef(`source-frame-map-${chunk.chunkOrdinal}`),
      outputFrameDigestSha256: outputFrameRef.contentHash,
      temporalQa: {
        measuredFrameCount: range.endFrameExclusive - range.startFrame,
        expectedFrameCount: range.endFrameExclusive - range.startFrame,
        emptyMaskFrameCount: 0,
        fullFrameMaskCount: 0,
        minimumBinaryIntersectionOverUnionBasisPoints: 9_200,
        maximumNormalizedCentroidShiftBasisPoints: 300,
        maximumBoundaryDisagreementBasisPoints: 400,
        maximumAlphaFlickerBasisPoints: 500,
        minimumEdgeQualityBasisPoints: 9_600,
        minimumSubjectCoverageBasisPoints: 8_500,
        identitySwapCount: 0,
        lostAnchorFrameCount: 0,
        completeRequestedRangeCoverage: true,
      },
      refinementEvidence: [{
        refinementId: `kornia-refinement-${chunk.chunkOrdinal}`,
        tool: 'kornia',
        operation: 'edge_feather_measurement',
        inputArtifactRef: maskRef,
        outputArtifactRef: maskRef,
        executionEvidenceRef: korniaRef,
        actualExecutionObserved: true,
      }, {
        refinementId: `opencv-refinement-${chunk.chunkOrdinal}`,
        tool: 'opencv',
        operation: 'temporal_median_check',
        inputArtifactRef: maskRef,
        outputArtifactRef: maskRef,
        executionEvidenceRef: opencvRef,
        actualExecutionObserved: true,
      }],
      evidenceRefs: [korniaRef, opencvRef],
    }],
    l4QaExecution: {
      routeId: 'l4_standard_primary',
      gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
      accelerator: 'nvidia_l4',
      approvedWorkItemRef: domainRef(`approved-work-${chunk.chunkOrdinal}`),
      workerLeaseRef: domainRef(`worker-lease-${chunk.chunkOrdinal}`),
      executionAttemptRef: domainRef(`attempt-${chunk.chunkOrdinal}`),
      currentAccountPriceAuthorityRef:
        domainRef(`rate-${chunk.chunkOrdinal}`),
      workerUsageEvidenceRef: domainRef(`usage-${chunk.chunkOrdinal}`),
      attemptCostReceiptRef: domainRef(`cost-${chunk.chunkOrdinal}`),
      korniaCudaExecutionEvidenceRef: korniaRef,
      opencvCrosscheckExecutionEvidenceRef: opencvRef,
      actualL4GpuExecutionObserved: true,
      actualKorniaCudaKernelExecutionObserved: true,
      actualOpenCvCrosscheckExecutionObserved: true,
      cpuOnlySubstantiveMaskQaUsed: false,
      userTriggeredAfterApprovedWork: true,
      terminalWorkerStoppedAndScaleBackToZeroVerified: true,
      exactAccountEffectiveAttemptCostPersisted: true,
    },
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
    measuredAt: '2026-08-13T10:01:30.000Z',
  })
}

function numericRef(id: string): NumericRef {
  return { id, version: 1, contentHash: `sha256:${digest(id)}` }
}

function domainRef(id: string): DomainRef {
  return { id, version: 'fixture-v1', contentHash: digest(id) }
}

function domainFromNumeric(value: NumericRef, version: string): DomainRef {
  return { id: value.id, version, contentHash: value.contentHash.slice(7) }
}

function measurementRef(value: ReturnType<typeof measurement>): DomainRef {
  return {
    id: value.measurementId,
    version: value.schemaVersion,
    contentHash: value.measurementDigestSha256,
  }
}

function sameNumericRef(left: NumericRef, right: NumericRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function domainRefKey(value: DomainRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function digestWithout(value: unknown, key: string): string {
  const copy = structuredClone(value) as Record<string, unknown>
  delete copy[key]
  return sha256AuthorityValue(copy)
}

function without<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const copy = structuredClone(value)
  delete copy[key]
  return copy
}

function memoryObjectPort(
  objects: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly({ objectPath, body, contentSha256 }) {
      assert.equal(digestBuffer(body), contentSha256)
      const existing = objects.get(objectPath)
      if (existing) {
        assert.equal(existing.toString('utf8'), body.toString('utf8'))
        return 'already_exists'
      }
      objects.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function digestBuffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
