import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  canonicalSam31GpuCompleteSourceExecutionObservationRef,
  sealCanonicalSam31GpuCompleteSourceExecutionObservation,
} from '../services/canonical-sam3_1-gpu-complete-source-performance-owner'
import {
  createCanonicalSam31GpuTemporalEvidenceAssembler,
} from '../services/canonical-sam3_1-gpu-temporal-evidence-assembler'
import {
  createCanonicalSam31CrossChunkBoundaryMeasurementSetRepository,
  createCanonicalSam31TemporalMetricSeriesSetRepository,
} from '../services/canonical-sam3_1-gpu-temporal-measurement-compiler'
import {
  sealCanonicalTrackAllSam31L4MaskQaMeasurement,
} from '../services/canonical-track-all-sam3_1-task-qa-owner'
import {
  sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResultV3,
} from '../services/canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3,
  buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV3,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

type NumericRef = { id: string; version: number; contentHash: string }
type DomainRef = { id: string; version: string; contentHash: string }
type Bundle = {
  measurement: ReturnType<
    typeof sealCanonicalTrackAllSam31L4MaskQaMeasurement
  >
  measurementRef: DomainRef
  workerResult: ReturnType<
    typeof sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResultV3
  >
  workerResultRef: DomainRef
}

const sourceRef = numericRef('sam31-eight-minute-source')
const outputFrameRef = numericRef('confirmed-output-frame')
const qualificationId = 'sam31-l4-temporal-assembler-qualification'
const chunks = Array.from({ length: 49 }, (_, index) => {
  const start = index * 239
  const end = index === 48 ? 11_519 : start + 239
  return {
    chunkOrdinal: index + 1,
    invocationId: `sam31-invocation-${index + 1}`,
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
  executionGroupId: 'sam31-l4-temporal-assembler-execution-group',
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
  chunkPlanRef: numericRef('sam31-overlap-chunk-plan'),
  route: {
    routeId: 'l4_heavy_fallback',
    gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
    runtimeRegion: 'us-central1',
    executionTarget: 'google_cloud_run_l4_job',
    machineType: 'cloud_run_nvidia_l4',
    accelerator: 'nvidia_l4',
  },
  immutableImageDigest: `sha256:${digest('qualified-l4-image')}`,
  chunks,
  phaseObservationRefs: {
    userTriggeredExecutionGroupRef: numericRef('user-triggered-group'),
    cloudProvisioningObservationSetRef: numericRef('cloud-provisioning'),
    workerPhaseTelemetrySetRef: numericRef('worker-telemetry'),
    terminalCapacityObservationSetRef: numericRef('terminal-capacity'),
    accountEffectiveCostReceiptSetRef: numericRef('cost-receipts'),
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
const bundles = chunks.map((chunk, index) => buildBundle(chunk, index))
const measurements = new Map(bundles.map((bundle) => [
  domainKey(bundle.measurementRef),
  bundle.measurement,
]))
const workerResults = new Map(bundles.map((bundle) => [
  domainKey(bundle.workerResultRef),
  bundle.workerResult,
]))
const objects = new Map<string, Buffer>()
const objectPort = {
  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }) {
    assert.equal(createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256)
    if (objects.has(input.objectPath)) return 'already_exists' as const
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created' as const
  },
  async readExact(path: string) {
    const value = objects.get(path)
    return value ? Buffer.from(value) : null
  },
}
const boundaryRepository =
  createCanonicalSam31CrossChunkBoundaryMeasurementSetRepository({ objectPort })
const metricRepository =
  createCanonicalSam31TemporalMetricSeriesSetRepository({ objectPort })
const assembler = createCanonicalSam31GpuTemporalEvidenceAssembler({
  completeSourceReadPort: {
    async rereadExecutionGroupObservation() {
      return structuredClone(observation)
    },
  },
  taskQaRepository: {
    async rereadMeasurement({ measurementRef }) {
      return structuredClone(measurements.get(domainKey(measurementRef)) ?? null)
    },
  },
  taskQaCandidateRepository: {
    async rereadWorkerResult({ resultRef }) {
      return structuredClone(workerResults.get(domainKey(resultRef)) ?? null)
    },
  },
  boundaryMeasurementSetRepository: boundaryRepository,
  temporalMetricSeriesSetRepository: metricRepository,
  now: () => '2026-08-13T10:02:00.000Z',
})
const request = {
  qualificationId,
  executionGroupObservationRef: observationRef,
  exactEightMinuteSourceRef: sourceRef,
  boundarySetId: 'sam31-l4-exact-cross-chunk-boundaries',
  metricSeriesSetId: 'sam31-l4-exact-temporal-series',
  chunks: bundles.map((bundle, index) => ({
    chunkOrdinal: index + 1,
    measurementRef: bundle.measurementRef,
    workerResultRef: bundle.workerResultRef,
  })),
  callerMetricsOrCompletionClaimsAccepted: false as const,
}
const result = await assembler.assembleAndPersist(request)
assert.equal(result.metricSeriesCount, 49)
assert.equal(result.boundaryCount, 48)
assert.equal(result.orderedChunkMeasurementRefs.length, 49)
assert.equal(result.exactWorkerEvidenceReread, true)
assert.equal(
  (await metricRepository.rereadMetricSeriesSet({
    metricSeriesSetRef: result.metricSeriesSetRef,
  }))?.metricSeries.length,
  49,
)
assert.equal(
  (await boundaryRepository.rereadBoundaryMeasurementSet({
    boundarySetRef: result.boundarySetRef,
  }))?.boundaries.length,
  48,
)
await assert.rejects(() => assembler.assembleAndPersist({
  ...request,
  chunks: [request.chunks[0], request.chunks[0], ...request.chunks.slice(2)],
}))
await assert.rejects(() => assembler.assembleAndPersist({
  ...request,
  chunks: request.chunks.map((chunk, index) => index === 12
    ? { ...chunk, workerResultRef: request.chunks[13].workerResultRef }
    : chunk),
}))
const crossedWorker = structuredClone(bundles[20].workerResult)
const crossedWorkerResponse =
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3(
    crossedWorker.workerResponse,
  )
crossedWorkerResponse.outputSummary!
  .crossChunkBoundaryMeasurements[0].currentSubjectEvidenceId =
    'crossed-subject-evidence'
crossedWorkerResponse.responseBindingSha256 = responseDigest(
  crossedWorkerResponse,
)
crossedWorker.workerResponse = crossedWorkerResponse
crossedWorker.workerResultDigestSha256 = recordDigest(crossedWorker,
  'workerResultDigestSha256')
const crossedRef = workerResultRef(crossedWorker)
workerResults.set(domainKey(crossedRef), crossedWorker)
await assert.rejects(() => assembler.assembleAndPersist({
  ...request,
  chunks: request.chunks.map((chunk, index) => index === 20
    ? { ...chunk, workerResultRef: crossedRef }
    : chunk),
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-temporal-evidence-assembler',
  checks: 18,
  exactEightMinuteSourceFrames: 11_520,
  exactWorkerChunksReread: 49,
  exactCrossChunkBoundariesReread: 48,
  exactOrderedMetricSeriesPersisted: true,
  callerMetricsAccepted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function buildBundle(chunk: typeof chunks[number], index: number): Bundle {
  const frameCount = chunk.canonicalEndFrameInclusive
    - chunk.canonicalStartFrameInclusive + 1
  const l4InvocationId = `l4-qa-invocation-${chunk.chunkOrdinal}`
  const manifestRef = numericRef(`sam31-mask-manifest-${chunk.chunkOrdinal}`)
  const sourceMappingRef = numericRef(`source-map-${chunk.chunkOrdinal}`)
  const previous = index === 0 ? null : chunks[index - 1]
  const previousManifestRef = index === 0 ? null
    : numericRef(`sam31-mask-manifest-${chunk.chunkOrdinal - 1}`)
  const previousSourceMappingRef = index === 0 ? null
    : numericRef(`source-map-${chunk.chunkOrdinal - 1}`)
  const subjectEvidenceId = `subject-evidence-${chunk.chunkOrdinal}`
  const previousSubjectEvidenceId = index === 0 ? null
    : `subject-evidence-${chunk.chunkOrdinal - 1}`
  const request = buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV3({
    schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-request-v3',
    operationId: 'tool.kornia.refine_mask.v1',
    l4InvocationId,
    sam31InvocationId: chunk.invocationId,
    sam31TaskRef: chunk.taskRef,
    sam31RuntimeRequestBindingSha256: digest(`sam-request-${chunk.chunkOrdinal}`),
    sam31RuntimeResultAdmissionRef: chunk.resultAdmissionRef,
    sam31MaskManifestRef: manifestRef,
    l4ExecutionEnvelopeRef: numericRef(l4InvocationId),
    approvedWorkItemRef: numericRef(`approved-work-${chunk.chunkOrdinal}`),
    workerLeaseRef: numericRef(`worker-lease-${chunk.chunkOrdinal}`),
    executionAttemptRef: numericRef(`execution-attempt-${chunk.chunkOrdinal}`),
    sourceFrameMappingRef: sourceMappingRef,
    confirmedOutputFrameRef: outputFrameRef,
    sourceWidth: 1_920,
    sourceHeight: 1_080,
    maskFrameRange: { startFrame: 0, endFrameExclusive: frameCount },
    expectedMaskManifestByteLength: 4_096,
    expectedMaskManifestSha256: manifestRef.contentHash.slice(7),
    expectedMaskPngCount: frameCount,
    chunkOrdinal: chunk.chunkOrdinal,
    canonicalStartFrameInclusive: chunk.canonicalStartFrameInclusive,
    canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
    previousChunkBoundaryInput: previous === null ? null : {
      previousChunkOrdinal: previous.chunkOrdinal,
      previousSam31InvocationId: previous.invocationId,
      previousSam31RuntimeRequestBindingSha256:
        digest(`sam-request-${previous.chunkOrdinal}`),
      previousSam31RuntimeResultAdmissionRef: previous.resultAdmissionRef,
      previousSam31MaskManifestRef: previousManifestRef!,
      previousSourceFrameMappingRef: previousSourceMappingRef!,
      previousConfirmedOutputFrameRef: outputFrameRef,
      expectedPreviousMaskManifestByteLength: 4_096,
      expectedPreviousMaskManifestSha256:
        previousManifestRef!.contentHash.slice(7),
      previousCanonicalStartFrameInclusive:
        previous.canonicalStartFrameInclusive,
      previousCanonicalEndFrameInclusive: previous.canonicalEndFrameInclusive,
      previousMaskFrameIndex: previous.canonicalEndFrameInclusive
        - previous.canonicalStartFrameInclusive,
      currentMaskFrameIndex: 0,
      overlapFrameCount: 1,
      subjects: [{
        subjectRequestId: 'track-primary-subject',
        previousSubjectEvidenceId: previousSubjectEvidenceId!,
        currentSubjectEvidenceId: subjectEvidenceId,
        previousMaskObjectId: 1,
        currentMaskObjectId: 1,
      }],
    },
    subjects: [{
      subjectRequestId: 'track-primary-subject',
      subjectEvidenceId,
      subjectRole: 'primary_speaker',
      maskObjectId: 1,
      canonicalFrameRange: {
        startFrame: chunk.canonicalStartFrameInclusive,
        endFrameExclusive: chunk.canonicalEndFrameInclusive + 1,
      },
      maskFrameRange: { startFrame: 0, endFrameExclusive: frameCount },
      trackManifestRef: manifestRef,
      anchorManifestRef: null,
      sourceFrameMappingRef: sourceMappingRef,
      outputFrameDigestSha256: outputFrameRef.contentHash.slice(7),
    }],
    executionPolicy: {
      routeId: 'l4_standard_primary',
      gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
      accelerator: 'nvidia_l4',
      korniaVersion: '0.8.3',
      torchVersion: '2.10.0+cu128',
      cudaRuntimeVersion: '12.8',
      morphologyKernelSize: 3,
      binaryThreshold: 127,
      everyManifestMaskMustBeReread: true,
      everyRequestedFrameAndSubjectMustBeMeasured: true,
      korniaCudaSubstantiveMeasurementRequired: true,
      opencvCudaEveryMaskCrosscheckRequired: true,
      cpuDecodeAndBoundedSerializationOnly: true,
      cpuOnlySubstantiveMaskQaAllowed: false,
      runtimeDownloadAllowed: false,
      automaticRetryAfterUnknownOutcomeAllowed: false,
    },
    byteFreeRequest: true,
    callerPathUrlCommandCodeOrEnvironmentAccepted: false,
    browserOrCallerMeasurementAccepted: false,
  })
  const korniaDigest = digest(`kornia-${chunk.chunkOrdinal}`)
  const opencvDigest = digest(`opencv-${chunk.chunkOrdinal}`)
  const response = buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV3({
    schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-response-v3',
    operationId: 'tool.kornia.refine_mask.v1',
    l4InvocationId,
    sam31InvocationId: chunk.invocationId,
    chunkOrdinal: chunk.chunkOrdinal,
    requestBindingSha256: request.requestBindingSha256,
    status: 'completed',
    terminalStage: 'completed',
    gpuEvidence: {
      requestedAccelerator: 'nvidia_l4',
      observedDeviceNameDigestSha256: digest('nvidia-l4'),
      observedNvidiaDriverVersion: '535.216.03',
      observedCudaRuntimeVersion: '12.8',
      observedTorchVersion: '2.10.0+cu128',
      observedKorniaVersion: '0.8.3',
      observedOpenCvVersion: '4.13.0',
      observedComputeCapabilityMajor: 8,
      observedComputeCapabilityMinor: 9,
      observedTotalDeviceMemoryBytes: 24 * 1024 ** 3,
      maximumObservedGpuUtilizationPercent: 76,
      cudaAvailable: true,
      exactL4DeviceObserved: true,
      korniaCudaTensorExecutionObserved: true,
      opencvCudaDeviceCount: 1,
      opencvCudaEveryMaskCrosschecked: true,
      torchCudaKernelCount: frameCount * 3,
      opencvCudaKernelCount: frameCount * 2,
      cpuOnlySubstantiveMaskQaUsed: false,
      cudaDriverLibraryMode: 'cuda_compat_12_8',
      observedCudaDriverLibraryPathDigestSha256: digest('cuda-compat-path'),
    },
    inputEvidence: {
      manifestByteLength: 4_096,
      manifestSha256: manifestRef.contentHash.slice(7),
      manifestRefExactMatch: true,
      manifestRequestBindingExactMatch: true,
      maskPngCount: frameCount,
      maskPngByteLength: frameCount * 1_024,
      everyManifestMaskPngRereadAndHashed: true,
      everyRequestedFrameAndSubjectPresentExactlyOnce: true,
      everyMaskMatchesSourceGeometry: true,
      everyMaskIsBinaryGrayscalePng: true,
      unrequestedManifestObjectOrFrameAccepted: false,
    },
    previousBoundaryInputEvidence: previous === null ? null : {
      manifestByteLength: 4_096,
      manifestSha256: previousManifestRef!.contentHash.slice(7),
      manifestRefExactMatch: true,
      sourceFrameMappingExactMatch: true,
      confirmedOutputFrameExactMatch: true,
      sharedCanonicalFrameExactMatch: true,
      previousMaskPngCount: 1,
      previousMaskPngByteLength: 1_024,
      everyRequiredPreviousBoundaryMaskRereadAndHashed: true,
    },
    runtimeMeasurement: {
      wallTimeMilliseconds: 2_000,
      decodeAndUploadMilliseconds: 200,
      korniaCudaMilliseconds: 800,
      opencvCudaCrosscheckMilliseconds: 400,
      peakCudaAllocatedBytes: 256 * 1024 ** 2,
      peakCudaReservedBytes: 512 * 1024 ** 2,
    },
    outputSummary: {
      subjectMeasurements: [{
        subjectRequestId: 'track-primary-subject',
        subjectEvidenceId,
        maskObjectId: 1,
        measuredFrameCount: frameCount,
        expectedFrameCount: frameCount,
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
        firstMaskFrameIndex: 0,
        lastMaskFrameIndex: frameCount - 1,
        maskPngCount: frameCount,
        maskPngByteLength: frameCount * 1_024,
        orderedMaskSetDigestSha256: digest(`mask-set-${chunk.chunkOrdinal}`),
        completeRequestedRangeCoverage: true,
      }],
      temporalMetricSeries: [{
        subjectRequestId: 'track-primary-subject',
        subjectEvidenceId,
        maskObjectId: 1,
        expectedFrameCount: frameCount,
        expectedFramePairCount: frameCount - 1,
        centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints:
          Array.from({ length: frameCount - 1 }, () => 9_200),
        meanAbsoluteAlphaDeltaBasisPoints:
          Array.from({ length: frameCount - 1 }, () => 500),
        boundaryDisagreementBasisPoints:
          Array.from({ length: frameCount }, () => 400),
        exactOrderedPerFramePairMetricsFromKorniaCuda: true,
        exactOrderedPerFrameMetricsFromKorniaCuda: true,
        opencvCudaEveryMaskCrosschecked: true,
      }],
      crossChunkBoundaryMeasurements: previous === null ? [] : [{
        subjectRequestId: 'track-primary-subject',
        previousSubjectEvidenceId: previousSubjectEvidenceId!,
        currentSubjectEvidenceId: subjectEvidenceId,
        previousMaskObjectId: 1,
        currentMaskObjectId: 1,
        previousMaskFrameIndex: previous.canonicalEndFrameInclusive
          - previous.canonicalStartFrameInclusive,
        currentMaskFrameIndex: 0,
        previousMaskSha256: digest(`previous-mask-${chunk.chunkOrdinal}`),
        currentMaskSha256: digest(`current-mask-${chunk.chunkOrdinal}`),
        centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints:
          9_300,
        meanAbsoluteAlphaDeltaBasisPoints: 300,
        boundaryDisagreementBasisPoints: 300,
        identitySwitchCount: 0,
        objectDropoutCount: 0,
        exactSharedCanonicalFrameCompared: true,
        actualKorniaCudaBoundaryMeasurementObserved: true,
        actualOpenCvCudaPreviousAndCurrentMasksCrosschecked: true,
      }],
      korniaCudaExecutionDigestSha256: korniaDigest,
      opencvCudaCrosscheckExecutionDigestSha256: opencvDigest,
      completeRequestedFrameAndSubjectCoverage: true,
      sampledOrRepresentativeOnlyMeasurementAccepted: false,
      exactMaskManifestAndEveryMaskPngReread: true,
      exactOrderedTemporalMetricSeriesIncluded: true,
      previousChunkBoundaryComparedWhenRequired: true,
    },
    failureCode: 'none',
    privateCreateOnlyWorkerOutput: true,
    runtimeDownloadPerformed: false,
    cpuOnlySubstantiveMaskQaUsed: false,
    serverCostReceiptIncluded: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    assetManifestMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  const measurement = buildMeasurement({
    chunk, sourceMappingRef, subjectEvidenceId, manifestRef,
    korniaDigest, opencvDigest, frameCount,
  })
  const workerResult =
    sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResultV3({
      schemaVersion:
        'canonical-track-all-sam3_1-l4-mask-qa-worker-result-v3',
      workerResultId: `l4-worker-result-${chunk.chunkOrdinal}`,
      sam31InvocationId: chunk.invocationId,
      l4InvocationId,
      workerServiceIdentityRef: domainRef('l4-worker-service'),
      l4LaunchRef: domainRef(`l4-launch-${chunk.chunkOrdinal}`),
      l4ExecutionEnvelopeRef: domainFromNumeric(
        request.l4ExecutionEnvelopeRef,
        'canonical-professional-gpu-execution-envelope-v1',
      ),
      l4TerminalRef: domainRef(`l4-terminal-${chunk.chunkOrdinal}`),
      workerRequest: request,
      workerResponse: response,
      privateCreateOnlyWorkerOutput: true,
      fixedWorkerRequestAndResponseExactReread: true,
      separateSam31InputAndL4JobInvocationRootsVerified: true,
      l4WorkerWroteUnderSam31InvocationRoot: false,
      measurementCompiledOnlyByCanonicalBackend: true,
      callerOrBrowserMeasurementAccepted: false,
      callerOrBrowserOutputAccepted: false,
      pathsUrlsCredentialsOrMediaBytesIncluded: false,
    })
  return {
    measurement,
    measurementRef: measurementRef(measurement),
    workerResult,
    workerResultRef: workerResultRef(workerResult),
  }
}

function buildMeasurement(input: {
  chunk: typeof chunks[number]
  sourceMappingRef: NumericRef
  subjectEvidenceId: string
  manifestRef: NumericRef
  korniaDigest: string
  opencvDigest: string
  frameCount: number
}) {
  const range = {
    startFrame: input.chunk.canonicalStartFrameInclusive,
    endFrameExclusive: input.chunk.canonicalEndFrameInclusive + 1,
  }
  const maskRef = domainRef(`mask-sequence-${input.chunk.chunkOrdinal}`)
  const korniaRef = domainRef(`kornia-${input.chunk.chunkOrdinal}`,
    input.korniaDigest)
  const opencvRef = domainRef(`opencv-${input.chunk.chunkOrdinal}`,
    input.opencvDigest)
  return sealCanonicalTrackAllSam31L4MaskQaMeasurement({
    schemaVersion: 'canonical-track-all-sam3_1-l4-mask-qa-measurement-v1',
    measurementId: `l4-measurement-${input.chunk.chunkOrdinal}`,
    invocationId: input.chunk.invocationId,
    sam31TaskRef: domainFromNumeric(input.chunk.taskRef,
      'canonical-sam3_1-gpu-task-v1'),
    sam31RuntimeResultAdmissionRef: domainFromNumeric(
      input.chunk.resultAdmissionRef,
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
      sceneId: `scene-${input.chunk.chunkOrdinal}`,
      authorizedFrameRanges: [range],
    },
    sourcePrivateArtifactRef: domainFromNumeric(sourceRef, 'source-v1'),
    sourceFrameMappingRef: domainFromNumeric(input.sourceMappingRef,
      'source-frame-mapping-v1'),
    confirmedOutputFrameRef: domainFromNumeric(outputFrameRef,
      'confirmed-output-frame-v1'),
    requestedRange: range,
    subjectEvidence: [{
      subjectRequestId: 'track-primary-subject',
      subjectEvidenceId: input.subjectEvidenceId,
      subjectRole: 'primary_speaker',
      frameRange: range,
      maskSequenceRef: maskRef,
      trackManifestRef: domainFromNumeric(input.manifestRef,
        'sam31-mask-manifest-v1'),
      anchorManifestRef: null,
      sourceFrameMappingRef: domainFromNumeric(input.sourceMappingRef,
        'source-frame-mapping-v1'),
      outputFrameDigestSha256: outputFrameRef.contentHash.slice(7),
      temporalQa: {
        measuredFrameCount: input.frameCount,
        expectedFrameCount: input.frameCount,
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
        refinementId: `kornia-${input.chunk.chunkOrdinal}`,
        tool: 'kornia',
        operation: 'edge_feather_measurement',
        inputArtifactRef: maskRef,
        outputArtifactRef: maskRef,
        executionEvidenceRef: korniaRef,
        actualExecutionObserved: true,
      }, {
        refinementId: `opencv-${input.chunk.chunkOrdinal}`,
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
      approvedWorkItemRef: domainRef(`approved-work-${input.chunk.chunkOrdinal}`),
      workerLeaseRef: domainRef(`worker-lease-${input.chunk.chunkOrdinal}`),
      executionAttemptRef:
        domainRef(`execution-attempt-${input.chunk.chunkOrdinal}`),
      currentAccountPriceAuthorityRef:
        domainRef(`price-${input.chunk.chunkOrdinal}`),
      workerUsageEvidenceRef: domainRef(`usage-${input.chunk.chunkOrdinal}`),
      attemptCostReceiptRef: domainRef(`cost-${input.chunk.chunkOrdinal}`),
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

function measurementRef(value: { measurementId: string; schemaVersion: string;
  measurementDigestSha256: string }): DomainRef {
  return { id: value.measurementId, version: value.schemaVersion,
    contentHash: value.measurementDigestSha256 }
}

function workerResultRef(value: { workerResultId: string; schemaVersion: string;
  workerResultDigestSha256: string }): DomainRef {
  return { id: value.workerResultId, version: value.schemaVersion,
    contentHash: value.workerResultDigestSha256 }
}

function responseDigest(value: { responseBindingSha256: string }) {
  return recordDigest(value, 'responseBindingSha256')
}

function recordDigest(value: object, field: string) {
  const payload = structuredClone(value) as Record<string, unknown>
  delete payload[field]
  return sha256AuthorityValue(payload)
}

function numericRef(id: string): NumericRef {
  return { id, version: 1, contentHash: `sha256:${digest(id)}` }
}

function domainRef(id: string, contentHash = digest(id)): DomainRef {
  return { id, version: 'fixture-v1', contentHash }
}

function domainFromNumeric(value: NumericRef, version: string): DomainRef {
  return { id: value.id, version, contentHash: value.contentHash.slice(7) }
}

function domainKey(value: DomainRef) {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex')
}
