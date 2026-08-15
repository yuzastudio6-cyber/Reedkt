import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  projectCanonicalSam31QualifiedSourceCheckpointRelease,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  canonicalProfessionalGpuJobLaunchSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31CrossAcceleratorMaskComparison,
} from '../services/canonical-sam3_1-cross-accelerator-mask-comparison-service'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  createCanonicalSam31L4RuntimeComponentQualificationOwner,
} from '../services/canonical-sam3_1-l4-runtime-component-qualification-owner'
import {
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository,
  sealCanonicalSam31L4RuntimePrivateRunReceipt,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  createCanonicalSam31L4RuntimeThirtyRunQualificationRepository,
  createCanonicalSam31L4RuntimeThirtyRunQualificationService,
} from '../services/canonical-sam3_1-l4-runtime-thirty-run-qualification-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createCanonicalSam31L4QualificationAttemptCostReceipt,
  sealCanonicalSam31L4QualificationTerminalObservation,
} from '../tool-cost-metering/canonical-sam3_1-l4-qualification-attempt-cost'
import {
  canonicalSam31GpuPrivateInputStagingEvidenceSchema,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  buildCanonicalSam31GpuRuntimeRequest,
  buildCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  canonicalSam31PrivateOutputRereadEvidenceSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  canonicalSam31GpuTaskRecordSchema,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  release as sourceCheckpointQualificationRelease,
} from './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'
import {
  canonicalSam31A100LaunchFixture,
  canonicalSam31A100PrivateOutputEvidenceFixture,
  canonicalSam31A100RuntimeResponseFixture,
  canonicalSam31L4TaskFixture,
} from './canonical-sam3_1-gpu-task-owner-smoke'
import {
  canonicalSam31L4QualificationRateFixture,
} from './canonical-sam3_1-l4-qualification-attempt-cost-smoke'

const qualificationId = 'sam31-l4-terminalized-component-smoke'
const qualificationSetId = 'sam31-l4-terminalized-set-smoke'
const imageDigest = `sha256:${digest('l4-terminalized-image')}` as const
const semanticMaskSetDigest = digest('deterministic-semantic-mask-set')
const a100QualificationRef = ref('a100-serving-qualification')
const driverPathDigest = digest('/usr/local/nvidia/lib64/libcuda.so.580.126.20')
const qualifiedSource = projectCanonicalSam31QualifiedSourceCheckpointRelease(
  sourceCheckpointQualificationRelease,
)
const records = Array.from({ length: 30 }, (_, index) =>
  buildRun(index + 1))

const runObjects = new Map<string, Buffer>()
const runObjectPort = memoryObjectPort(runObjects)
const runRepository =
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository({
    objectPort: runObjectPort,
  })
const setRepository =
  createCanonicalSam31L4RuntimeThirtyRunQualificationRepository({
    objectPort: runObjectPort,
  })
for (const record of records) {
  await runRepository.persistCreateOnly({ receipt: record.run })
}
const set = await createCanonicalSam31L4RuntimeThirtyRunQualificationService({
  runReceiptRepository: runRepository,
  qualificationRepository: setRepository,
  now: () => '2026-08-12T10:05:00.000Z',
}).compile({ qualificationSetId, qualificationId })

const componentRepository =
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort: memoryObjectPort(new Map()),
  })
const owner = createOwner(records, componentRepository)
const request = {
  driverComponentId: 'sam31-l4-driver-terminalized-smoke',
  deterministicComponentId: 'sam31-l4-deterministic-terminalized-smoke',
  qualificationSetId,
  qualificationId,
}
const components = await owner.compileAndPersistComponents(request)
assert.equal(components.driverAndCuda.componentKind, 'driver_and_cuda')
assert.equal(components.deterministicRunSet.componentKind,
  'deterministic_run_set')
if (components.driverAndCuda.componentKind !== 'driver_and_cuda'
  || components.deterministicRunSet.componentKind !==
    'deterministic_run_set') {
  throw new Error('SAM 3.1 L4 component smoke lost component kinds.')
}
assert.equal(components.driverAndCuda.route.routeId, 'l4_heavy_fallback')
assert.equal(components.driverAndCuda.route.accelerator, 'nvidia_l4')
assert.equal(components.driverAndCuda.immutableImageDigest, imageDigest)
assert.equal(
  components.driverAndCuda.payload.loadedCudaDriverLibraryPathDigestSha256,
  driverPathDigest,
)
assert.equal(components.deterministicRunSet.payload.length, 30)
assert.equal(new Set(components.deterministicRunSet.payload.map((run) =>
  run.outputMaskSetDigestSha256)).size, 1)
assert.equal(new Set(components.deterministicRunSet.payload.flatMap((run) => [
  key(run.qualificationAttemptRef),
  key(run.resultAdmissionRef),
  key(run.runtimeRequestRef),
  key(run.runtimeResponseObjectRef),
  key(run.privateOutputRereadEvidenceRef),
  key(run.attemptCostReceiptRef),
])).size, 180)
assert.equal(components.deterministicRunSet.payload.every((run) =>
  run.resultAdmissionRef.id.startsWith('sam31-l4-run-receipt:')), true)
assert.deepEqual(await owner.compileAndPersistComponents(request), components)

await assert.rejects(() => createOwner(records, componentRepository, {
  missingCostOrdinal: 7,
}).compileAndPersistComponents({
  ...request,
  driverComponentId: 'sam31-l4-driver-missing-cost-smoke',
  deterministicComponentId: 'sam31-l4-deterministic-missing-cost-smoke',
}))
await assert.rejects(() => createOwner(records, componentRepository, {
  crossedOutputOrdinal: 2,
}).compileAndPersistComponents({
  ...request,
  driverComponentId: 'sam31-l4-driver-crossed-output-smoke',
  deterministicComponentId: 'sam31-l4-deterministic-crossed-output-smoke',
}))
await assert.rejects(() => owner.compileAndPersistComponents({
  ...request,
  callerDeclaredQualified: true,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-l4-runtime-component-qualification-owner',
  checks: 28,
  exactThirtySpecializedRunReceiptsReread: true,
  exactThirtyAccountEffectiveCostReceiptsReread: true,
  exactTasksLaunchesResponsesOutputsAndComparisonsReread: true,
  exactSourceCheckpointQualificationReleaseReread: true,
  specializedRunReceiptUsedAsAdmissionEvidenceWithoutRelabeling: true,
  canonicalDriverAndDeterministicComponentsPersisted: true,
  missingOrCrossedEvidenceRejected: true,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}))

function createOwner(
  source: readonly ReturnType<typeof buildRun>[],
  repository: typeof componentRepository,
  options: {
    readonly missingCostOrdinal?: number
    readonly crossedOutputOrdinal?: number
  } = {},
) {
  return createCanonicalSam31L4RuntimeComponentQualificationOwner({
    readPort: {
      async rereadThirtyRunQualification({ qualificationSetId: requested }) {
        return requested === set.qualificationSetId
          ? structuredClone(set) : null
      },
      async rereadRunReceipt({ qualificationId: requested, runOrdinal }) {
        const record = source[runOrdinal - 1]
        return requested === qualificationId && record
          ? structuredClone(record.run) : null
      },
      async rereadAttemptCostReceipt({
        qualificationId: requested,
        runOrdinal,
      }) {
        if (runOrdinal === options.missingCostOrdinal) return null
        const record = source[runOrdinal - 1]
        return requested === qualificationId && record
          ? structuredClone(record.cost) : null
      },
      async rereadTask({ invocationId }) {
        return structuredClone(find(invocationId).task)
      },
      async rereadLaunch({ launchRef }) {
        return structuredClone(source.find((record) =>
          key(record.run.launchRef) === key(launchRef))?.launch ?? null)
      },
      async rereadRuntimeResponse({ invocationId }) {
        return structuredClone(find(invocationId).response)
      },
      async rereadPrivateOutput({ invocationId }) {
        const record = options.crossedOutputOrdinal ===
          ordinalFromInvocation(invocationId)
          ? source[0]! : find(invocationId)
        return structuredClone(record.output)
      },
      async rereadSourceCheckpointRelease() {
        return structuredClone(sourceCheckpointQualificationRelease)
      },
      async rereadCrossAcceleratorComparison({ comparisonRef }) {
        return structuredClone(source.find((record) =>
          key(record.run.crossAcceleratorMaskComparisonRef) ===
            key(comparisonRef))?.comparison ?? null)
      },
    },
    componentRepository: repository,
  })

  function find(invocationId: string) {
    const record = source.find((candidate) =>
      candidate.task.invocationId === invocationId)
    if (!record) throw new Error('fixture invocation missing')
    return record
  }
}

function buildRun(ordinal: number) {
  const suffix = String(ordinal).padStart(2, '0')
  const invocationId = `sam31-l4-terminalized-smoke-run-${suffix}`
  const dispatchAdmissionRef = ref(`l4-admission-${suffix}`)
  const admissionConsumptionRef = ref(`l4-consumption-${suffix}`)
  const executionEnvelopeRef = ref(invocationId)
  const approvedWorkItemRef = ref(`l4-work-${suffix}`)
  const workerLeaseRef = ref(`l4-lease-${suffix}`)
  const executionAttemptRef = ref(`l4-attempt-${suffix}`)
  const baseRequest = omit(
    canonicalSam31L4TaskFixture.runtimeRequest,
    'requestBindingSha256',
  )
  const runtimeRequest = buildCanonicalSam31GpuRuntimeRequest({
    ...baseRequest,
    dispatchAdmissionRef,
    dispatchAdmissionDigestSha256:
      dispatchAdmissionRef.contentHash.slice(7),
    scope: {
      ...baseRequest.scope,
      approvedWorkItemRef,
      workerLeaseRef,
      executionAttemptRef,
    },
    sourceMedia: {
      ...baseRequest.sourceMedia,
      canonicalSourceStartFrameInclusive: 0,
      canonicalSourceEndFrameInclusive: 199,
      selectedStartFrameInclusive: 0,
      selectedEndFrameInclusive: 199,
      decodedFrameCount: 200,
    },
    modelArtifacts: {
      ...baseRequest.modelArtifacts,
      sourceCandidateRef: qualifiedSource.qualification.candidateRef,
      privateArtifactIngestReceiptRef: {
        id: qualifiedSource.qualification.ingestReceiptRef.id,
        version: qualifiedSource.qualification.ingestReceiptRef.version,
        contentHash:
          qualifiedSource.qualification.ingestReceiptRef.contentHash,
      },
      sourceCheckpointCompatibilityQualificationRef:
        sourceCheckpointQualificationRelease.sourceCheckpointQualificationRef,
      immutableImageReleaseRef: {
        id: `sam31-image-${imageDigest.slice(-24)}`,
        version: 1,
        contentHash: imageDigest,
      },
      immutableImageDigest: imageDigest,
    },
  })
  const stagingBase = omit(
    canonicalSam31L4TaskFixture.privateInputStagingEvidence,
    'evidenceHash',
  )
  const stagingPayload = {
    ...stagingBase,
    stagingId: `l4-staging-${suffix}`,
    invocationId,
    dispatchAdmissionRef,
    executionEnvelopeRef,
    scope: {
      ...stagingBase.scope,
      approvedWorkItemRef,
      workerLeaseRef,
      executionAttemptRef,
    },
    decodedFrameCount: 200,
    selectedEndFrameInclusive: 199,
  }
  const staging = canonicalSam31GpuPrivateInputStagingEvidenceSchema.parse({
    ...stagingPayload,
    evidenceHash: sha256AuthorityValue(stagingPayload),
  })
  const taskBase = omit(canonicalSam31L4TaskFixture, 'taskRecordHash')
  const runtimeRequestContentSha256 = sha256AuthorityValue(runtimeRequest)
  const taskPayload = {
    ...taskBase,
    taskId: `sam31-task:${invocationId}`,
    invocationId,
    dispatchAdmissionRef,
    admissionConsumptionRef,
    executionEnvelopeRef,
    privateInputStagingEvidenceRef: ref(
      staging.stagingId,
      staging.evidenceHash,
    ),
    privateInputStagingEvidence: staging,
    runtimeRequestRef: ref(
      `sam31-runtime-request:${invocationId}`,
      runtimeRequestContentSha256,
    ),
    runtimeRequestContentSha256,
    runtimeRequest,
  }
  const task = canonicalSam31GpuTaskRecordSchema.parse({
    ...taskPayload,
    taskRecordHash: sha256AuthorityValue(taskPayload),
  })
  const manifestSha256 = digest(`manifest-${suffix}`)
  const responseBase = omit(
    canonicalSam31A100RuntimeResponseFixture,
    'responseBindingSha256',
  )
  const response = buildCanonicalSam31GpuRuntimeResponse({
    ...responseBase,
    operationId: runtimeRequest.operationId,
    requestBindingSha256: runtimeRequest.requestBindingSha256,
    dispatchAdmissionDigestSha256:
      runtimeRequest.dispatchAdmissionDigestSha256,
    gpuEvidence: {
      ...responseBase.gpuEvidence!,
      requestedAccelerator: 'nvidia_l4',
      observedDeviceNameDigestSha256: digest('NVIDIA L4'),
      observedNvidiaDriverVersion: '580.126.20',
      observedComputeCapabilityMinor: 9,
      observedTotalDeviceMemoryBytes: 23_659_151_360,
      gpuMemoryProfileId:
        'l4_gpu_only_full_semantic_streamed_grounding_postprocess_trimmed_memory_v6',
      pastNonConditioningMemoryTrimmedOnGpu: true,
      observedCudaDriverLibraryPathDigestSha256: driverPathDigest,
    },
    runtimeMeasurement: {
      wallTimeMilliseconds: 150_000 + ordinal,
      modelLoadMilliseconds: 21_000,
      promptMilliseconds: 5_000,
      propagationMilliseconds: 80_000,
      outputPersistenceMilliseconds: 2_000,
      cudaEventInferenceMilliseconds: 85_000 + ordinal,
      peakCudaAllocatedBytes: 8_736_956_928,
      peakCudaReservedBytes: 9_521_070_080,
      outputFileCount: 401,
      outputByteLength: 900_000,
    },
    outputSummary: {
      manifestRef: ref(`semantic-manifest-${suffix}`, manifestSha256),
      manifestSha256,
      firstFrameIndex: 0,
      lastFrameIndex: 199,
      propagatedFrameCount: 200,
      distinctObjectIds: [0, 1],
      losslessMaskPngCount: 400,
      normalizedBoxRecordCount: 400,
      allMasksMatchSourceDimensions: true,
      allFramesWithinApprovedInterval: true,
      createOnlyPrivatePersistence: true,
      exactPrivateRereadPending: true,
    },
  })
  const responseBytes = Buffer.from(
    canonicalSam31GpuWireStringify(response),
    'utf8',
  )
  const responseObjectRef = ref(
    `sam31-runtime-response:${invocationId}`,
    createHash('sha256').update(responseBytes).digest('hex'),
  )
  const outputBase = omit(
    canonicalSam31A100PrivateOutputEvidenceFixture,
    'evidenceHash',
  )
  const outputPayload = {
    ...outputBase,
    taskRef: ref(task.taskId, task.taskRecordHash),
    runtimeResponseObjectRef: responseObjectRef,
    runtimeResponseBindingSha256: response.responseBindingSha256,
    manifestRef: response.outputSummary!.manifestRef,
    manifestSha256,
    manifestByteLength: 100_000,
    combinedMaskByteLength: 700_000,
    maskFileCount: 400,
    firstFrameIndex: 0,
    lastFrameIndex: 199,
    propagatedFrameCount: 200,
    distinctObjectIds: [0, 1],
  }
  const output = canonicalSam31PrivateOutputRereadEvidenceSchema.parse({
    ...outputPayload,
    evidenceHash: sha256AuthorityValue(outputPayload),
  })
  const launchBase = omit(canonicalSam31A100LaunchFixture, 'launchHash')
  const launchPayload = {
    ...launchBase,
    launchRecordId: `l4-launch-${suffix}`,
    admissionRef: dispatchAdmissionRef,
    admissionConsumptionRef,
    runtimeReleaseRef: task.runtimeReleaseRef,
    executionEnvelopeRef,
    routeId: 'l4_heavy_fallback' as const,
    runtimeRegion: 'us-central1' as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    accelerator: 'nvidia_l4' as const,
    immutableImageDigest: imageDigest,
    cloudJobCreateRequestRef: ref(`l4-create-${suffix}`),
    cloudJobExecutionRef: ref(`l4-execution-${suffix}`),
  }
  const launch = assertCanonicalProfessionalGpuJobLaunch(
    canonicalProfessionalGpuJobLaunchSchema.parse({
      ...launchPayload,
      launchHash: sha256AuthorityValue(launchPayload),
    }),
  )
  const comparisonPayload = {
    schemaVersion: 'canonical-sam3_1-cross-accelerator-mask-comparison-v1',
    source: 'canonical_server_sam3_1_cross_accelerator_mask_comparison_owner',
    evidenceClass: 'canonical_private_exact_mask_pixel_reread_and_comparison',
    status: 'compatible_for_l4_repeatability_and_independent_temporal_quality',
    comparisonId: `cross-accelerator-comparison-${suffix}`,
    a100ServingQualificationRef: a100QualificationRef,
    a100SemanticManifestRef: ref(`a100-manifest-${suffix}`),
    l4SemanticManifestRef: response.outputSummary!.manifestRef,
    a100ImmutableImageDigest: `sha256:${digest('a100-image')}`,
    l4ImmutableImageDigest: imageDigest,
    a100SemanticMaskSetDigestSha256: digest('a100-mask-set'),
    l4SemanticMaskSetDigestSha256: semanticMaskSetDigest,
    evaluatedMaskCount: 400,
    evaluatedPixelCount: 400_000,
    exactBinaryMaskCount: 399,
    nonByteIdenticalMaskCount: 1,
    changedPixelCount: 1,
    maximumChangedPixelsInOneMask: 1,
    meanIoUPpm: 999_999,
    minimumIoUPpm: 999_000,
    changedPixelFractionPpm: 2,
    maximumPerMaskFramePixelDifferencePpm: 1_000,
    differingNormalizedBoxCoordinateCount: 0,
    maximumBoxEdgeDeltaPixels: 0,
    maximumAcceptedBoxEdgeDeltaPixels: 8,
    minimumAcceptedMeanIoUPpm: 999_000,
    minimumAcceptedMinimumIoUPpm: 980_000,
    maximumAcceptedChangedPixelFractionPpm: 100,
    maximumAcceptedPerMaskFramePixelDifferencePpm: 1_000,
    exactFrameObjectAndMaskDimensionsMatch: true,
    boxGeometryCompatibilityPassed: true,
    everyMaskPairByteRereadDecodedAndCompared: true,
    crossAcceleratorProbeCompatibilityPassed: true,
    semanticMaskSetByteIdentityClaimed: false,
    qualityEqualToOrBetterThanA100BaselineClaimed: false,
    independentTemporalQualityRequired: true,
    callerMetricsOrQualityClaimsAccepted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  } as const
  const comparison = assertCanonicalSam31CrossAcceleratorMaskComparison({
    ...comparisonPayload,
    comparisonHash: sha256AuthorityValue(comparisonPayload),
  })
  const rate = canonicalSam31L4QualificationRateFixture
  const run = sealCanonicalSam31L4RuntimePrivateRunReceipt({
    schemaVersion: 'canonical-sam3_1-l4-runtime-private-run-receipt-v3',
    source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
    evidenceClass: 'canonical_private_l4_cuda_execution_exact_reread',
    status: 'ready_for_terminal_cost_and_independent_mask_quality',
    qualificationId,
    runOrdinal: ordinal,
    admissionRef: dispatchAdmissionRef,
    admissionConsumptionRef,
    executionEnvelopeRef,
    taskRef: ref(task.taskId, task.taskRecordHash),
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    cloudRunOperationName:
      `projects/reeditpro/locations/us-central1/operations/operation-${suffix}`,
    cloudRunExecutionResource:
      'projects/reeditpro/locations/us-central1/jobs/'
        + `reeditpro-sam31-l4-fallback/executions/execution-${suffix}`,
    currentL4FallbackRateAuthorityRef: {
      id: rate.rateAuthorityId,
      version: 1,
      contentHash: `sha256:${rate.rateAuthorityHash}`,
    },
    qualifiedA100ServingQualificationRef: a100QualificationRef,
    runtimeCandidateReleaseRef: ref(`runtime-candidate-${suffix}`),
    checkpointPromotionRef: ref('checkpoint-promotion'),
    runtimeResponseRef: ref(
      `sam31-l4-runtime-response:${invocationId}`,
      sha256AuthorityValue(response),
    ),
    privateOutputRereadEvidenceRef: ref(
      `sam31-private-output-reread:${responseObjectRef.id}`,
      output.evidenceHash,
    ),
    semanticManifestRef: response.outputSummary!.manifestRef,
    crossAcceleratorMaskComparisonRef: ref(
      comparison.comparisonId,
      comparison.comparisonHash,
    ),
    semanticMaskSetDigestSha256: semanticMaskSetDigest,
    immutableImageDigest: imageDigest,
    observedAccelerator: 'nvidia_l4',
    observedDriverVersion: '580.126.20',
    observedCudaRuntimeVersion: '12.8',
    wallTimeMilliseconds: response.runtimeMeasurement!.wallTimeMilliseconds,
    cudaEventInferenceMilliseconds:
      response.runtimeMeasurement!.cudaEventInferenceMilliseconds,
    privateInputByteLength: staging.byteLength,
    workerOutputByteLength: response.runtimeMeasurement!.outputByteLength,
    manifestByteLength: output.manifestByteLength,
    combinedMaskByteLength: output.combinedMaskByteLength,
    propagatedFrameCount: 200,
    losslessMaskPngCount: 400,
    scaleFromZeroObserved: true,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true,
    exactTaskResponseAndEveryOutputMaskReread: true,
    exactFrameObjectAndMaskDimensionsMatchA100ServingQualification: true,
    crossAcceleratorBoxGeometryCompatibilityPassed: true,
    crossAcceleratorPixelComparisonPassed: true,
    semanticMaskSetByteIdentityWithA100ServingBaseline: false,
    qualityEqualToOrBetterThanA100BaselineClaimed: false,
    accountEffectiveRateRereadBeforeDispatch: true,
    terminalPlatformUsageAndCostReceiptPending: true,
    independentTemporalMaskQualityPending: true,
    runtimeReleaseGranted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    completedAt: '2026-08-12T10:03:31.000Z',
  })
  const terminal = sealCanonicalSam31L4QualificationTerminalObservation({
    schemaVersion: 'canonical-sam3_1-l4-qualification-terminal-observation-v1',
    source: 'google_cloud_run_v2_terminal_execution_exact_reread',
    evidenceClass: 'canonical_private_reread',
    qualificationId,
    runOrdinal: ordinal,
    cloudRunOperationResource: run.cloudRunOperationName,
    cloudRunExecutionResource: run.cloudRunExecutionResource,
    executionCreateTime: '2026-08-12T10:01:00.000Z',
    executionStartTime: '2026-08-12T10:01:10.000Z',
    executionCompletionTime: '2026-08-12T10:04:00.000Z',
    taskCount: 1,
    runningCount: 0,
    succeededCount: 1,
    failedCount: 0,
    cancelledCount: 0,
    retriedCount: 0,
    reconciling: false,
    operationDone: true,
    exactOperationAndExecutionReread: true,
    terminalWorkerStopped: true,
    activeGpuInstancesAfterTerminal: 0,
    scaleBackToZeroVerified: true,
    callerTerminalFieldsAccepted: false,
    observedAt: '2026-08-12T10:04:15.000Z',
  })
  const cost = createCanonicalSam31L4QualificationAttemptCostReceipt({
    receiptId: `${qualificationId}.run-${suffix}.terminal-cost`,
    runReceipt: run,
    terminalObservation: terminal,
    currentRateAuthority: rate,
    recordedAt: '2026-08-12T10:04:30.000Z',
  })
  return { task, launch, response, output, comparison, run, cost }
}

function memoryObjectPort(objects: Map<string, Buffer>) {
  return {
    async createOnly({ objectPath, body }: {
      objectPath: string
      body: Buffer
      contentSha256: string
    }) {
      if (objects.has(objectPath)) return 'already_exists' as const
      objects.set(objectPath, Buffer.from(body))
      return 'created' as const
    },
    async readExact(objectPath: string) {
      const body = objects.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
}

function ordinalFromInvocation(invocationId: string): number {
  return Number.parseInt(invocationId.slice(-2), 10)
}

function ref(id: string, hash = digest(id)) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function key(value: { id: string; version: number; contentHash: string }) {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function omit<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}
